import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  Sword,
  Shield,
  Settings,
  Swords,
  User,
  Zap,
  Plus,
  Backpack,
  CircleDot,
  Shirt,
  Hand,
  DockIcon as Boots,
  NetworkIcon as Necklace,
  BellIcon as Belt,
  BellRingIcon as Ring,
  Info,
  Flame,
  Trophy,
  Star,
  FlaskConical as Flask,
} from "lucide-react";
import type { CharacterApi, EquipmentSlot, Stats } from "../../types/character";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

const STATS_LEFT_5: (keyof CharacterApi["stats"])[] = [
  "strength",
  "agility",
  "vitality",
  "endurance",
  "luck",
];
const ORDERED_RESIST: (keyof CharacterApi["resistances"])[] = [
  "fire",
  "ice",
  "lightning",
  "poison",
  "sleep",
  "paralysis",
  "confusion",
  "fear",
  "dark",
  "holy",
  "stun",
  "bleed",
  "curse",
  "knockback",
];
const ORDERED_COMBAT: (keyof NonNullable<CharacterApi["combatStats"]>)[] = [
  "maxHP",
  "maxMP",
  "attackPower",
  "magicPower",
  "criticalChance",
  "criticalDamageBonus",
  "attackSpeed",
  "evasion",
  "blockChance",
  "blockValue",
  "lifeSteal",
  "manaSteal",
  "damageReduction",
  "movementSpeed",
];

const NAV_ITEMS = [
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Legal notice", href: "/legal/notice" },
  { label: "Forum", href: "/forum" },
  { label: "Support", href: "/support" },
];

type ProgressionApi = {
  level: number;
  experience: number;
  currentLevelAt: number;
  nextLevelAt: number;
  xpSinceLevel: number;
  xpForThisLevel: number;
  xpToNext: number;
  xpPercent?: number;
  isMaxLevel?: boolean;
};

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

const EquipmentSlotView = ({
  slot,
  icon: Icon,
  itemId,
}: {
  slot: EquipmentSlot;
  icon: any;
  itemId: string | null;
}) => (
  <div
    className="equipment-slot flex items-center justify-center"
    title={itemId ?? slot}
  >
    <Icon className="w-10 h-10 text-gray-500" />
  </div>
);

/* ---------- Formateo Combat ---------- */
const PERCENT_KEYS = new Set<string>([
  "criticalChance",
  "damageReduction",
  "evasion",
  "lifeSteal",
  "manaSteal",
  "blockChance",
  "criticalDamageBonus",
]);
const DECIMALS_NON_PERCENT: Record<string, number> = {
  attackPower: 1,
  magicPower: 1,
  attackSpeed: 2,
  blockValue: 2,
  movementSpeed: 2,
  maxHP: 0,
  maxMP: 0,
};
function formatCombatValue(
  key: keyof NonNullable<CharacterApi["combatStats"]>,
  raw: number | undefined
) {
  const v = Number.isFinite(raw as number) ? Number(raw) : 0;
  if (PERCENT_KEYS.has(key as string)) {
    const places = key === "blockChance" ? 0 : 2;
    const minShow = 0.01;
    if (v > 0 && v < minShow && key !== "blockChance")
      return `<${minShow.toFixed(2)}%`;
    return `${v.toFixed(places)}%`;
  }
  const dec = DECIMALS_NON_PERCENT[key as string] ?? 0;
  return v.toFixed(dec);
}

/* ---------- Brillo al cambiar Combat ---------- */
function useGlowOnChange(obj?: Record<string, number | undefined> | null) {
  const prevRef = useRef<Record<string, number | undefined> | null>(null);
  const [glow, setGlow] = useState<Record<string, number>>({});
  const first = useRef(true);

  useEffect(() => {
    if (!obj) return;
    if (first.current) {
      prevRef.current = obj;
      first.current = false;
      return;
    }
    const prev = prevRef.current || {};
    const changed: string[] = [];
    for (const k of Object.keys(obj)) {
      const now = Number(obj[k] ?? 0);
      const before = Number(prev[k] ?? 0);
      if (Math.abs(now - before) > 1e-6) changed.push(k);
    }
    if (changed.length) {
      setGlow((g) => {
        const n = { ...g };
        const ts = Date.now();
        changed.forEach((k) => (n[k] = ts));
        return n;
      });
      const id = setTimeout(() => {
        setGlow((g) => {
          const cutoff = Date.now() - 900;
          const n: Record<string, number> = {};
          for (const [k, t] of Object.entries(g)) if (t > cutoff) n[k] = t;
          return n;
        });
      }, 1000);
      return () => clearTimeout(id);
    }
    prevRef.current = obj;
  }, [obj]);

  return glow;
}
const asIndexable = (cs: CharacterApi["combatStats"] | null | undefined) =>
  cs ? { ...(cs as unknown as Record<string, number | undefined>) } : null;

/* ---------- Elegir stat principal (texto) ---------- */
function pickPrimaryPower(data?: CharacterApi | null): {
  key: "attackPower" | "magicPower";
  label: string;
  isMage: boolean;
} {
  const name =
    ((data as any)?.class?.name as string | undefined)?.toLowerCase() ??
    (data?.className ?? "").toLowerCase();
  const isMage = /mago|mage|wizard|sorcer/i.test(name);
  if (!data?.combatStats)
    return {
      key: isMage ? "magicPower" : "attackPower",
      label: isMage ? "Magic Power" : "Attack Power",
      isMage,
    };
  const { attackPower = 0, magicPower = 0 } = data.combatStats;
  if (isMage || magicPower > attackPower)
    return { key: "magicPower", label: "Magic Power", isMage: true };
  return { key: "attackPower", label: "Attack Power", isMage: false };
}

export default function GameInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user: userFromCtx, logout } = useAuth();

  const [data, setData] = useState<CharacterApi | null>(null);
  const [progression, setProgression] = useState<ProgressionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocating, setAllocating] = useState<keyof Stats | null>(null);
  const canAllocate = (data?.availablePoints ?? 0) > 0;

  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use((cfg) => {
      if (token)
        cfg.headers = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        } as any;
      return cfg;
    });
    return instance;
  }, [token]);

  // carga
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<ProgressionApi>("/character/progression"),
    ])
      .then(([meRes, progRes]) => {
        if (!mounted) return;
        setData(meRes.data);
        setProgression(progRes.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Error fetching character"
        );
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [client]);

  const glow = useGlowOnChange(asIndexable(data?.combatStats));

  async function plusStat(key: keyof Stats) {
    if (!canAllocate || allocating) return;
    try {
      setAllocating(key);
      await client.post("/character/allocate", { allocations: { [key]: 1 } });
      // refrescamos ambas llamadas para ver puntos restantes y exp/level reales
      const [me, prog] = await Promise.all([
        client.get<CharacterApi>("/character/me"),
        client.get<ProgressionApi>("/character/progression"),
      ]);
      setData(me.data);
      setProgression(prog.data);
      setError(null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Error asignando puntos"
      );
    } finally {
      setAllocating(null);
    }
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

  const isCharacter = location.pathname.startsWith("/game");
  const isArena = location.pathname.startsWith("/arena");

  // Mostrar nivel/EXP siempre desde progression
  const lvl = progression?.level ?? data?.level ?? "—";
  const xpSince = progression?.xpSinceLevel ?? 0;
  const xpForLevel = progression?.xpForThisLevel ?? 1;
  const pct100 = Math.round((progression?.xpPercent ?? 0) * 100);

  const clazz = (data as any)?.class as
    | {
        name?: string;
        description?: string;
        passiveDefault?: { name: string; description: string };
      }
    | undefined;
  const className = clazz?.name ?? data?.className ?? "—";

  const ctxName =
    typeof userFromCtx === "string"
      ? userFromCtx
      : ((userFromCtx as any)?.username ?? null);
  const displayName = (data as any)?.username ?? ctxName ?? data?.name ?? "—";

  const p = pickPrimaryPower(data);
  const RIGHT_FEATURED: Array<{
    key: keyof NonNullable<CharacterApi["combatStats"]>;
    label?: string;
  }> = [
    { key: p.key, label: p.label },
    { key: "evasion" },
    { key: "blockChance" },
    { key: "damageReduction" },
    { key: "criticalChance" },
  ];

  const combatRest = ORDERED_COMBAT.filter(
    (k) =>
      !RIGHT_FEATURED.some((r) => r.key === k) &&
      k !== (p.isMage ? "attackPower" : "magicPower")
  );

  const unlockedUnique = (() => {
    const base = data?.passivesUnlocked ?? [];
    const exclude = clazz?.passiveDefault?.name?.toLowerCase();
    const set = new Set<string>();
    base.forEach((name) => {
      const k = (name || "").toLowerCase();
      if (exclude && k === exclude) return;
      if (!set.has(k)) set.add(name);
    });
    return Array.from(set);
  })();

  const fillClass =
    "absolute inset-y-0 left-0 rounded-b-[10px] bg-gradient-to-r from-[var(--accent-weak)] via-[var(--accent)] to-[var(--accent)]/90 " +
    "shadow-[0_0_10px_rgba(120,120,255,.25),inset_0_0_6px_rgba(0,0,0,.5)] transition-[width] duration-700 ease-out";

  return (
    <div className="min-h-screen text-sm leading-tight space-y-2 bg-[var(--bg)] relative">
      <style>{`
        @keyframes statGlowPop { 0%{text-shadow:none;transform:translateZ(0)}25%{text-shadow:0 0 10px rgba(120,120,255,.9),0 0 20px rgba(120,120,255,.5)}100%{text-shadow:none} }
        .stat-glow { animation: statGlowPop 900ms ease-out; }
      `}</style>

      {/* Navbar */}
      <header className="relative z-10 dark-panel m-4 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-3xl font-bold stat-text tracking-wide font-serif">
            Nocthalis
          </h1>
        </div>
        <nav className="flex items-center space-x-6 text-sm">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              target="_blank"
              rel="noreferrer"
              href={item.href}
              className="stat-text-muted hover:text-gray-300"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="stat-text-muted hover:text-gray-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-weak)] rounded-sm"
            title="Cerrar sesión"
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-40px)]">
        {/* Sidebar */}
        <aside className="w-59 h-215 p-2 space-y-1 ml-1 rounded-lg shadow-lg border border-[var(--border)] bg-[var(--panel-2)]">
          {[
            {
              id: "character",
              label: "CHARACTER",
              icon: User,
              href: "/game",
              disabled: false,
            },
            {
              id: "arena",
              label: "ARENA",
              icon: Swords,
              href: "/arena",
              disabled: false,
            },
            {
              id: "options",
              label: "OPTIONS",
              icon: Settings,
              href: "/options",
              disabled: true,
            },
          ].map((item) => {
            const Icon = item.icon as any;
            const active =
              (item.id === "character" && isCharacter) ||
              (item.id === "arena" && isArena) ||
              (item.id === "options" &&
                location.pathname.startsWith("/options"));
            const cls = `w-full gothic-button flex items-center space-x-4 text-left ${active ? "active" : ""}`;
            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  aria-disabled
                  className={`${cls} opacity-50 cursor-not-allowed`}
                  title={`${item.label} (próximamente)`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className={cls}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-1 h-[calc(100%-40px)]">
            {/* Left col */}
            <div className="col-span-2 ml-1">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 space-y-6 shadow-lg">
                {loading && (
                  <div className="card-muted p-4 text-sm stat-text-muted">
                    Cargando personaje…
                  </div>
                )}
                {error && !loading && (
                  <div className="card-muted p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Profile + Passive */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="dark-panel p-4">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                      <Info className="w-5 h-5 mr-3 text-accent" /> Profile
                    </h3>
                    <ul className="text-sm space-y-2 stat-text-muted">
                      <li>
                        <strong>Name:</strong> {displayName}
                      </li>
                      <li>
                        <strong>Lv:</strong> {lvl}
                      </li>
                      <li title={`En este nivel: ${xpSince}/${xpForLevel}`}>
                        <strong>Exp:</strong> {xpSince}/{xpForLevel} ({pct100}%)
                      </li>
                      <li>
                        <strong>Class:</strong> {className}
                      </li>
                    </ul>
                  </div>

                  <div className="dark-panel p-4">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                      <Flame className="w-5 h-5 mr-3 text-accent" /> Core
                      Passive
                    </h3>
                    <div className="space-y-3 text-sm">
                      {clazz?.passiveDefault && (
                        <div className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-gray-300 mt-1" />
                          <div>
                            <strong className="text-white">
                              {clazz.passiveDefault.name}
                            </strong>
                            <div className="stat-text-muted">
                              {clazz.passiveDefault.description}
                            </div>
                          </div>
                        </div>
                      )}
                      {(data?.passivesUnlocked ?? [])
                        .filter(
                          (p) =>
                            !clazz?.passiveDefault?.name ||
                            p?.toLowerCase() !==
                              clazz.passiveDefault.name.toLowerCase()
                        )
                        .map((p) => (
                          <div key={p} className="flex items-start space-x-3">
                            <Zap className="w-5 h-5 text-accent mt-1" />
                            <div>
                              <strong className="text-white">{p}</strong>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Resistencias & Combat */}
                <div className="grid grid-cols-2 gap-6 auto-rows-fr">
                  <div className="dark-panel p-4 h-full">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Resistances
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ORDERED_RESIST.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <span className="text-accent font-bold text-sm">
                            {data?.resistances?.[key] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dark-panel p-4 h-full">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Combat Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ORDERED_COMBAT.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <span
                            className={`text-accent font-bold text-sm ${glow[String(key)] ? "stat-glow" : ""}`}
                            title={String(
                              data?.combatStats
                                ? (data.combatStats as any)[key]
                                : 0
                            )}
                          >
                            {formatCombatValue(
                              key,
                              data?.combatStats
                                ? (data.combatStats as any)[key]
                                : 0
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">
                          Physical Defense
                        </span>
                        <span className="text-accent font-bold text-sm">
                          {data?.stats?.physicalDefense ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">
                          Magical Defense
                        </span>
                        <span className="text-accent font-bold text-sm">
                          {data?.stats?.magicalDefense ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievements / Potions */}
                <div className="grid grid-cols-2 gap-6 auto-rows-fr">
                  <div className="dark-panel p-4 h-full">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-base">
                      <Trophy className="w-5 h-5 mr-3 text-[var(--accent)]" />{" "}
                      Achievements
                    </h3>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full border border-[var(--border)] bg-gradient-to-br from-[var(--accent-weak)] to-[var(--accent)]
                          shadow-[inset_0_0_0_1px_rgba(255,255,255,.04),0_2px_10px_rgba(0,0,0,.35)] flex items-center justify-center"
                          title="Achievement"
                        >
                          <Star className="w-5 h-5 text-[var(--text)]/80" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dark-panel p-4 h-full">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-base">
                      <Flask className="w-5 h-5 mr-3 text-green-500" /> Potions
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="aspect-square equipment-slot flex items-center justify-center"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="dark-panel p-6 max-w-4x2 mx-auto">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Left */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlotView
                        slot="helmet"
                        icon={CircleDot}
                        itemId={data?.equipment.helmet ?? null}
                      />
                      <EquipmentSlotView
                        slot="chest"
                        icon={Shirt}
                        itemId={data?.equipment.chest ?? null}
                      />
                      <EquipmentSlotView
                        slot="gloves"
                        icon={Hand}
                        itemId={data?.equipment.gloves ?? null}
                      />
                      <EquipmentSlotView
                        slot="boots"
                        icon={Boots}
                        itemId={data?.equipment.boots ?? null}
                      />
                    </div>

                    {/* Center */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-48 text-center text-lg text-accent font-bold px-3 py-1 bg-[var(--panel-2)] border border-[var(--border)]">
                        {displayName}
                      </div>

                      <div className="w-48 h-56 bg-[var(--panel-2)] shadow-inner flex items-center justify-center border-x border-[var(--border)]">
                        <User className="w-24 h-24 text-gray-300" />
                      </div>

                      {/* Progress bar */}
                      <div
                        className="w-48 h-9 rounded-b-xl border border-[var(--border)] relative overflow-hidden bg-[var(--panel-2)]
                          shadow-[inset_0_1px_0_rgba(255,255,255,.04),inset_0_-1px_0_rgba(0,0,0,.4)]"
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-b-[10px] bg-gradient-to-r from-[var(--accent-weak)] via-[var(--accent)] to-[var(--accent)]/90 shadow-[0_0_10px_rgba(120,120,255,.25),inset_0_0_6px_rgba(0,0,0,.5)] transition-[width] duration-700 ease-out"
                          style={{ width: `${pct100}%` }}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={pct100}
                        />
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-[13px] tracking-wide">
                            Level {lvl} · {pct100}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-5.5 justify-center">
                        <EquipmentSlotView
                          slot="mainWeapon"
                          icon={Sword}
                          itemId={data?.equipment.mainWeapon ?? null}
                        />
                        <EquipmentSlotView
                          slot="offWeapon"
                          icon={Shield}
                          itemId={data?.equipment.offWeapon ?? null}
                        />
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlotView
                        slot="amulet"
                        icon={Necklace}
                        itemId={data?.equipment.amulet ?? null}
                      />
                      <EquipmentSlotView
                        slot="belt"
                        icon={Belt}
                        itemId={data?.equipment.belt ?? null}
                      />
                      <EquipmentSlotView
                        slot="ring"
                        icon={Ring}
                        itemId={data?.equipment.ring ?? null}
                      />
                      <div className="w-20 h-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Stats (simple) */}
              {data && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="card-muted p-4">
                    <h3 className="text-white font-semibold mb-4 flex items-center text-base">
                      <Zap className="w-5 h-5 mr-3 text-accent" /> Character
                      Stats
                      {canAllocate && (
                        <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-white/10 border border-[var(--border)] text-zinc-200">
                          {data.availablePoints} pts
                        </span>
                      )}
                    </h3>
                    <div className="space-y-3">
                      {STATS_LEFT_5.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">
                              {data.stats[key]}
                            </span>
                            {canAllocate && (
                              <button
                                type="button"
                                onClick={() => plusStat(key as keyof Stats)}
                                disabled={allocating === (key as keyof Stats)}
                                className="w-6 h-6 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-white/90 hover:bg-white/10 disabled:opacity-50"
                                title="Asignar 1 punto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Combat Stats
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: p.key, label: p.label },
                        { key: "evasion" as const },
                        { key: "blockChance" as const },
                        { key: "damageReduction" as const },
                        { key: "criticalChance" as const },
                      ].map(({ key, label }) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {label ?? labelize(String(key))}
                          </span>
                          <span
                            className={`text-accent font-bold text-sm ${glow[String(key)] ? "stat-glow" : ""}`}
                            title={String(
                              data?.combatStats
                                ? (data.combatStats as any)[key]
                                : 0
                            )}
                          >
                            {formatCombatValue(
                              key,
                              data?.combatStats
                                ? (data.combatStats as any)[key]
                                : 0
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventario */}
              <div className="border-t border-[var(--border)] pt-6">
                <div className="flex items-centered justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <Backpack className="w-5 h-5 mr-2 text-gray-400" />{" "}
                    Inventory
                  </h3>
                  <div className="text-xs text-gray-400">
                    <span className="text-accent">—</span>/—
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square equipment-slot flex items-center justify-center hover:border-[var(--accent-weak)] transition-colors cursor-pointer"
                    >
                      {i === 0 && <Sword className="w-6 h-6 text-gray-400" />}
                      {i === 1 && <Shield className="w-6 h-6 text-gray-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
