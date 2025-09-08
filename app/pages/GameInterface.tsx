// src/pages/GameInterface.tsx
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
  BarChart2,
  ShieldPlus,
} from "lucide-react";
import type { CharacterApi, EquipmentSlot, Stats } from "../../types/character";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

/* ─────────────────────────────────────────────────────────── */
/* Tipos utilitarios                                            */
/* ─────────────────────────────────────────────────────────── */
type CombatKey = keyof NonNullable<CharacterApi["combatStats"]> | "skillProc";

/* ─────────────────────────────────────────────────────────── */
/* Orders & labels                                             */
/* ─────────────────────────────────────────────────────────── */
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
  "criticalChanceReduction",
  "criticalDamageReduction",
];

const COMBAT_HINTS: Partial<Record<CombatKey, string>> = {
  attackPower: "Primary physical damage scaling.",
  magicPower: "Power of spells and magical abilities.",
  maxHP: "Maximum health pool.",
  evasion: "Percent chance to dodge incoming attacks.",
  attackSpeed: "Percent faster attack cadence.",
  blockChance: "Percent chance to block incoming damage.",
  damageReduction: "Percent mitigation to incoming damage.",
  criticalChance: "Percent chance to land a critical strike.",
  blockValue: "Damage absorbed on a successful block.",
  lifeSteal: "Heals based on damage dealt.",
  movementSpeed: "How fast you move.",
  skillProc: "Chance to auto-cast passives or the ultimate (scales with Fate).",
};
const getHint = (k: CombatKey) => COMBAT_HINTS[k] ?? "";

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
  availablePoints?: number;
  pendingLevels?: number;
  canAllocateNow?: boolean;
};

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

/* ─────────────────────────────────────────────────────────── */
/* Tooltip (compact)                                           */
/* ─────────────────────────────────────────────────────────── */
function Tooltip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const pos =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";
  return (
    <span className="relative inline-flex items-center group">
      {children}
      <span
        className={`pointer-events-none absolute ${pos} z-40 hidden group-hover:block rounded-md border border-white/10 bg-black/80 px-2 py-1 text-[11px] leading-snug text-gray-100 shadow-xl whitespace-normal break-words max-w-[280px] text-left`}
      >
        {text}
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Equipment slot                                              */
/* ─────────────────────────────────────────────────────────── */
const EquipmentSlotView = ({
  slot,
  icon: Icon,
  itemId,
  extraClass,
}: {
  slot: EquipmentSlot;
  icon: any;
  itemId: string | null;
  extraClass?: string;
}) => (
  <div
    className={`equipment-slot ${extraClass ?? ""} flex items-center justify-center`}
    title={itemId ?? slot}
  >
    <Icon className="w-10 h-10 text-gray-500" />
  </div>
);

/* ─────────────────────────────────────────────────────────── */
function asInt(raw: number | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
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
  (cs ? (cs as unknown as Record<string, number | undefined>) : null) as Record<
    string,
    number | undefined
  > | null;

/* ─────────────────────────────────────────────────────────── */
/* Primary power & class                                       */
/* ─────────────────────────────────────────────────────────── */
function isMagicClass(name: string) {
  return /necromancer|exorcist|mage|wizard|sorcer/i.test(name);
}
function pickPrimaryPower(data?: CharacterApi | null): {
  key: "attackPower" | "magicPower";
  label: string;
  isMage: boolean;
} {
  const name =
    ((data as any)?.class?.name as string | undefined)?.toLowerCase() ??
    (data?.className ?? "").toLowerCase();
  const mageByName = isMagicClass(name);
  if (!data?.combatStats)
    return {
      key: mageByName ? "magicPower" : "attackPower",
      label: mageByName ? "Magic Power" : "Attack Power",
      isMage: mageByName,
    };
  const { attackPower = 0, magicPower = 0 } = data.combatStats;
  if (mageByName || magicPower > attackPower)
    return { key: "magicPower", label: "Magic Power", isMage: true };
  return { key: "attackPower", label: "Attack Power", isMage: false };
}

/* ─────────────────────────────────────────────────────────── */
/* Skills extractors + tooltips                                */
/* ─────────────────────────────────────────────────────────── */
type SimplePassive = {
  enabled?: boolean;
  name?: string;
  shortDescEn?: string;
  longDescEn?: string;
  durationTurns?: number;
  trigger?: {
    check?: string;
    baseChancePercent?: number;
    fateScalePerPoint?: number;
    maxChancePercent?: number;
  };
};
type SimpleUltimate = {
  enabled?: boolean;
  name?: string;
  description?: string;
  cooldownTurns?: number;
  proc?: {
    enabled?: boolean;
    procInfoEn?: string;
    respectCooldown?: boolean;
    trigger?: {
      check?: string;
      baseChancePercent?: number;
      fateScalePerPoint?: number;
      maxChancePercent?: number;
    };
  };
};
function pickCorePassive(data?: any): SimplePassive | null {
  const p =
    data?.passiveDefaultSkill ??
    data?.passiveDefault ??
    data?.class?.passiveDefaultSkill ??
    data?.class?.passiveDefault ??
    null;
  if (!p || p.enabled === false) return null;
  return p;
}
function pickUltimate(data?: any): SimpleUltimate | null {
  const u = data?.ultimateSkill ?? data?.class?.ultimateSkill ?? null;
  if (!u || u.enabled === false) return null;
  return u;
}
function passiveTooltip(p: SimplePassive): string {
  const parts: string[] = [];
  if (p.longDescEn) parts.push(p.longDescEn);
  if (p.durationTurns != null) parts.push(`Duration: ${p.durationTurns} turns`);
  if (p.trigger?.check) {
    const { baseChancePercent, fateScalePerPoint, maxChancePercent } =
      p.trigger ?? {};
    const chance =
      baseChancePercent != null ||
      fateScalePerPoint != null ||
      maxChancePercent != null
        ? `Chance = min(${baseChancePercent ?? 0}% + Fate×${
            fateScalePerPoint ?? 0
          }, ${maxChancePercent ?? "cap"}%)`
        : "";
    parts.push(
      `Trigger: ${labelize(p.trigger?.check ?? "")}${
        chance ? ` · ${chance}` : ""
      }`
    );
  }
  return parts.join("\n");
}
function ultimateTooltip(u: SimpleUltimate): string {
  const parts: string[] = [];
  if (u.description) parts.push(u.description);
  if (u.cooldownTurns != null) parts.push(`Cooldown: ${u.cooldownTurns} turns`);
  if (u.proc?.enabled) {
    const t = u.proc.trigger;
    const chance =
      t?.baseChancePercent != null ||
      t?.fateScalePerPoint != null ||
      t?.maxChancePercent != null
        ? `Chance = min(${t?.baseChancePercent ?? 0}% + Fate×${
            t?.fateScalePerPoint ?? 0
          }, ${t?.maxChancePercent ?? "cap"}%)`
        : "";
    parts.push(
      `Autocast: ${u.proc.procInfoEn ?? "—"}${chance ? `\n${chance}` : ""}`
    );
  }
  return parts.join("\n");
}

/* ─────────────────────────────────────────────────────────── */

export default function GameInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user: userFromCtx, logout } = useAuth();

  const [data, setData] = useState<CharacterApi | null>(null);
  const [progression, setProgression] = useState<ProgressionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocating, setAllocating] = useState<keyof Stats | null>(null);

  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use((cfg) => {
      if (token)
        (cfg.headers as any) = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        };
      return cfg;
    });
    return instance;
  }, [token]);

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

  const combatForGlow = useMemo(
    () => asIndexable(data?.combatStats),
    [data?.combatStats]
  );
  const glow = useGlowOnChange(combatForGlow);

  const availablePoints = asInt((data as any)?.availablePoints);
  const xpSince = asInt(progression?.xpSinceLevel);
  const xpForLevel = Math.max(1, asInt(progression?.xpForThisLevel));
  const reachedThreshold = xpSince >= xpForLevel;
  const canAllocateStrict = Boolean(
    progression?.canAllocateNow ?? (availablePoints > 0 || reachedThreshold)
  );

  async function plusStat(key: keyof Stats) {
    if (!canAllocateStrict || allocating) return;
    try {
      setAllocating(key);
      await client.post("/character/allocate", { [key]: 1 });
      const [me, prog] = await Promise.all([
        client.get<CharacterApi>("/character/me"),
        client.get<ProgressionApi>("/character/progression"),
      ]);
      setData(me.data);
      setProgression(prog.data);
      setError(null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Error allocating points"
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

  // progression
  const lvl = progression?.level ?? (data as any)?.level ?? "—";
  const pct100 = Math.max(0, Math.min(100, asInt(progression?.xpPercent ?? 0)));

  // class/user
  const clazz = (data as any)?.class as
    | { name?: string; description?: string }
    | undefined;
  const className = clazz?.name ?? (data as any)?.className ?? "—";

  const ctxName =
    typeof userFromCtx === "string"
      ? userFromCtx
      : ((userFromCtx as any)?.username ?? null);
  const displayName =
    (data as any)?.username ?? ctxName ?? (data as any)?.name ?? "—";

  const p = pickPrimaryPower(data);
  const showMagic = isMagicClass((className ?? "").toLowerCase());

  // stats list (always 6 rows)
  const STATS_KEYS: (keyof CharacterApi["stats"])[] = [
    p.isMage ? "intelligence" : "strength",
    "dexterity",
    "vitality",
    "endurance",
    "luck",
    "fate",
  ];

  // skills
  const corePassive = pickCorePassive(data);
  const ultimate = pickUltimate(data);

  // mapping: Character Stat → Combat
  function mapStatToCombatKeys(stat: keyof CharacterApi["stats"]): CombatKey[] {
    switch (stat) {
      case "strength":
        return ["attackPower"];
      case "intelligence":
        return showMagic ? ["magicPower"] : [];
      case "dexterity":
        return ["evasion"]; // Attack Speed queda en Metrics
      case "vitality":
        return ["blockChance"]; // Max HP en Metrics
      case "endurance":
        return ["damageReduction"];
      case "luck":
        return ["criticalChance"];
      case "fate":
        return ["skillProc"];
      default:
        return [];
    }
  }

  const skillProcDisplay = `${asInt((data as any)?.stats?.fate)}`;
  function prettyCombatLabel(rk: CombatKey) {
    if (rk === "skillProc") return "Auto Cast";
    if (rk === "maxHP") return "Max HP";
    return labelize(String(rk));
  }

  return (
    <div className="min-h-screen text-sm leading-tight bg-[var(--bg)] text-[13px]">
      <style>{`
        @keyframes statGlowPop { 0%{text-shadow:none;transform:translateZ(0)}25%{text-shadow:0 0 10px rgba(120,120,255,.9),0 0 20px rgba(120,120,255,.5)}100%{text-shadow:none} }
        .stat-glow { animation: statGlowPop 900ms ease-out; }
      `}</style>

      {/* Container */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3">
        {/* Navbar */}
        <header className="relative z-10 dark-panel mt-3 mb-2 p-3 md:p-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl md:text-3xl font-bold stat-text tracking-wide font-serif">
              Nocthalis
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-5 text-xs">
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
              title="Log out"
            >
              Logout
            </button>
          </nav>
        </header>

        {/* Layout: sidebar / main-left / main-right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 pb-4">
          {/* Sidebar */}
          <aside className="lg:col-span-2 dark-panel p-2 space-y-1 rounded-lg shadow-lg border border-[var(--border)]">
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
                (item.id === "character" &&
                  location.pathname.startsWith("/game")) ||
                (item.id === "arena" &&
                  location.pathname.startsWith("/arena")) ||
                (item.id === "options" &&
                  location.pathname.startsWith("/options"));
              const cls = `w-full gothic-button flex items-center space-x-3 text-left ${active ? "active" : ""}`;
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    aria-disabled
                    className={`${cls} opacity-50 cursor-not-allowed`}
                    title="Coming soon"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
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
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Left column */}
          <main className="lg:col-span-5 xl:col-span-6 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3 md:p-4 space-y-4 shadow-lg overflow-visible">
              {loading && (
                <div className="card-muted p-3 text-xs stat-text-muted">
                  Loading character…
                </div>
              )}
              {error && !loading && (
                <div className="card-muted p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* Profile + Class Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile */}
                <div className="dark-panel p-3 md:p-4">
                  <h3 className="stat-text font-semibold mb-3 flex items-center text-base">
                    <Info className="w-4 h-4 mr-2 text-accent" /> Profile
                  </h3>
                  <ul className="text-xs space-y-1.5 stat-text-muted">
                    <li>
                      <strong>Name:</strong> {displayName}
                    </li>
                    <li>
                      <strong>Level:</strong> {lvl}
                    </li>
                    <li title={`This level: ${xpSince}/${xpForLevel}`}>
                      <strong>Exp:</strong> {xpSince}/{xpForLevel}
                    </li>
                    <li>
                      <strong>Class:</strong> {className}
                    </li>
                  </ul>
                </div>

                {/* Class Skills */}
                <div className="dark-panel p-3 md:p-4 overflow-visible">
                  <h3 className="stat-text font-semibold mb-3 flex items-center text-base">
                    <Flame className="w-4 h-4 mr-2 text-accent" /> Class Skills
                  </h3>

                  {/* Passive (sin tooltip al final) */}
                  {corePassive ? (
                    <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2.5">
                      <div className="flex items-start gap-2.5">
                        <Shield className="w-4 h-4 text-gray-300 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-white font-semibold">
                            Passive: {corePassive.name}
                          </div>
                          <div className="text-[11px] text-gray-300 mt-0.5 whitespace-pre-wrap">
                            {(
                              corePassive.shortDescEn ??
                              corePassive.longDescEn ??
                              "—"
                            ).trim()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 text-[11px] text-gray-400">
                      No passive.
                    </div>
                  )}

                  {/* Ultimate (sin tooltip al final) */}
                  {ultimate ? (
                    <div className="rounded-lg border border-[var(--accent-weak)] bg-[var(--panel-2)] p-3">
                      <div className="flex items-start gap-2.5">
                        <Flame className="w-4 h-4 text-orange-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">
                              Ultimate: {ultimate.name}
                            </span>
                            <span className="badge-level px-1.5 py-0.5 rounded text-[10px]">
                              Ready
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-300 mt-0.5 whitespace-pre-wrap">
                            {(ultimate.description ?? "—").trim()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400">
                      No ultimate.
                    </div>
                  )}
                </div>
              </div>

              {/* Resistances & Combat Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                <div className="dark-panel p-3 h-full">
                  <h3 className="text-white font-semibold mb-3 text-sm flex items-center">
                    <ShieldPlus className="w-4 h-4 mr-2 text-accent" />
                    Resistances
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ORDERED_RESIST.map((key) => (
                      <div
                        key={String(key)}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300 text-xs">
                          {labelize(String(key))}
                        </span>
                        <span className="text-accent font-bold text-xs">
                          {asInt(data?.resistances?.[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark-panel p-3 h-full">
                  <h3 className="text-white font-semibold mb-3 text-sm flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2 text-accent" />
                    Combat Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        "maxHP",
                        "attackPower",
                        ...(showMagic ? (["magicPower"] as const) : []),
                        "evasion",
                        "attackSpeed",
                        "blockChance",
                        "damageReduction",
                        "criticalChance",
                      ] as const
                    ).map((k) => (
                      <div
                        key={k}
                        className="flex justify-between items-center"
                      >
                        <Tooltip text={getHint(k as CombatKey)}>
                          <span className="text-gray-300 text-xs">
                            {labelize(k)}
                          </span>
                        </Tooltip>
                        <span
                          className={`text-accent font-bold text-xs ${glow[k as string] ? "stat-glow" : ""}`}
                        >
                          {asInt((data?.combatStats as any)?.[k] ?? 0)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">
                        Physical Defense
                      </span>
                      <span className="text-accent font-bold text-xs">
                        {asInt((data as any)?.stats?.physicalDefense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">
                        Magical Defense
                      </span>
                      <span className="text-accent font-bold text-xs">
                        {asInt((data as any)?.stats?.magicalDefense)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements & Potions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                <div className="dark-panel p-3 h-full">
                  <h3 className="stat-text font-semibold mb-3 flex items-center text-sm">
                    <Trophy className="w-4 h-4 mr-2 text-[var(--accent)]" />{" "}
                    Achievements
                  </h3>
                  <div className="flex gap-2.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border border-[var(--border)] bg-gradient-to-br from-[var(--accent-weak)] to-[var(--accent)]
                        shadow-[inset_0_0_0_1px_rgba(255,255,255,.015),0_2px_10px_rgba(0,0,0,.35)] flex items-center justify-center"
                        title="Achievement"
                      >
                        <Star className="w-4 h-4 text-[var(--text)]/80" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark-panel p-3 h-full">
                  <h3 className="stat-text font-semibold mb-3 flex items-center text-sm">
                    <Flask className="w-4 h-4 mr-2 text-green-500" /> Potions
                  </h3>
                  <div className="slot-grid-5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="equipment-slot slot-fluid flex items-center justify-center"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right column */}
          <section className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Avatar / equipment */}
            <div className="dark-panel p-4">
              <div className="flex justify-center mb-6">
                <div className="relative w-full max-w-[360px] md:max-w-[380px]">
                  <div className="grid grid-cols-3 gap-6 xl:gap-7 items-center">
                    {/* Left */}
                    <div className="flex flex-col gap-3 xl:gap-4 items-center justify-center">
                      <EquipmentSlotView
                        slot="helmet"
                        icon={CircleDot}
                        itemId={(data as any)?.equipment?.helmet ?? null}
                        extraClass="equip-sm"
                      />
                      <EquipmentSlotView
                        slot="chest"
                        icon={Shirt}
                        itemId={(data as any)?.equipment?.chest ?? null}
                        extraClass="equip-sm"
                      />
                      <EquipmentSlotView
                        slot="gloves"
                        icon={Hand}
                        itemId={(data as any)?.equipment?.gloves ?? null}
                        extraClass="equip-sm"
                      />
                      <EquipmentSlotView
                        slot="boots"
                        icon={Boots}
                        itemId={(data as any)?.equipment?.boots ?? null}
                        extraClass="equip-sm"
                      />
                    </div>

                    {/* Center */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-32 md:w-36 text-center text-base text-accent font-bold px-3 py-1 bg-[var(--panel-2)] border border-[var(--border)]">
                        {displayName}
                      </div>

                      <div className="w-32 md:w-36 h-40 md:h-44 bg-[var(--panel-2)] shadow-inner flex items-center justify-center border-x border-[var(--border)]">
                        <User className="w-16 h-16 text-gray-300" />
                      </div>

                      {/* XP bar */}
                      <div className="w-32 md:w-36 h-6 rounded-b-xl border border-[var(--border)] relative overflow-hidden bg-[var(--panel-2)] shadow-[inset_0_1px_0_rgba(255,255,255,.04),inset_0_-1px_0_rgba(0,0,0,.4)]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-b-[10px] bg-gradient-to-r from-[var(--accent-weak)] via-[var(--accent)] to-[var(--accent)]/90 shadow-[0_0_10px_rgba(120,120,255,.25),inset_0_0_6px_rgba(0,0,0,.5)] transition-[width] duration-700 ease-out"
                          style={{ width: `${pct100}%` }}
                        />
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-[11px] tracking-wide">
                            Level {lvl} · {xpSince}/{xpForLevel}
                          </span>
                        </div>
                      </div>

                      {/* Weapons closer */}
                      <div className="flex gap-1.5 md:gap-2 mt-4 justify-center">
                        <EquipmentSlotView
                          slot="mainWeapon"
                          icon={Sword}
                          itemId={(data as any)?.equipment?.mainWeapon ?? null}
                          extraClass="equip-sm"
                        />
                        <EquipmentSlotView
                          slot="offWeapon"
                          icon={Shield}
                          itemId={(data as any)?.equipment?.offWeapon ?? null}
                          extraClass="equip-sm"
                        />
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex flex-col gap-3 xl:gap-4 items-center justify-center">
                      <EquipmentSlotView
                        slot="amulet"
                        icon={Necklace}
                        itemId={(data as any)?.equipment?.amulet ?? null}
                        extraClass="equip-sm"
                      />
                      <EquipmentSlotView
                        slot="belt"
                        icon={Belt}
                        itemId={(data as any)?.equipment?.belt ?? null}
                        extraClass="equip-sm"
                      />
                      <EquipmentSlotView
                        slot="ring"
                        icon={Ring}
                        itemId={(data as any)?.equipment?.ring ?? null}
                        extraClass="equip-sm"
                      />
                      <div className="w-16 h-16" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="border-t border-[var(--border)] pt-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center text-sm">
                    <Backpack className="w-4 h-4 mr-2 text-gray-400" />{" "}
                    Inventory
                  </h3>
                  <div className="text-[11px] text-gray-400">
                    <span className="text-accent">—</span>/—
                  </div>
                </div>

                {/* Bigger 5 slots, no overflow */}
                <div className="slot-grid-5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className="equipment-slot slot-fluid flex items-center justify-center hover:border-[var(--accent-weak)] transition-colors cursor-pointer"
                    >
                      {i === 0 && <Sword className="w-5 h-5 text-gray-400" />}
                      {i === 1 && <Shield className="w-5 h-5 text-gray-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attributes */}
            {data && (
              <div className="card-muted p-3 md:p-4">
                <div className="flex items-center mb-3">
                  <span className="text-white font-semibold text-sm flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-accent" /> Attributes
                  </span>
                  {canAllocateStrict && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-white/10 border border-[var(--border)] text-zinc-200">
                      {availablePoints} pts
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {STATS_KEYS.map((statKey) => {
                    const rightKeys = mapStatToCombatKeys(statKey);
                    return (
                      <div key={String(statKey)} className="contents">
                        {/* Left cell */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-xs">
                            {labelize(String(statKey))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">
                              {asInt((data as any)?.stats?.[statKey])}
                            </span>
                            {canAllocateStrict && (
                              <button
                                type="button"
                                onClick={() => plusStat(statKey as keyof Stats)}
                                disabled={
                                  allocating === (statKey as keyof Stats)
                                }
                                className="w-6 h-6 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-white/90 hover:bg-white/10 disabled:opacity-50"
                                title="Allocate 1 point"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right cell */}
                        <div className="space-y-1.5">
                          {rightKeys.length === 0 ? (
                            <span className="text-gray-500 text-xs">—</span>
                          ) : (
                            rightKeys.map((rk) => {
                              const value =
                                rk === "skillProc"
                                  ? skillProcDisplay
                                  : asInt(
                                      (data?.combatStats as any)?.[rk] ?? 0
                                    );
                              const label = prettyCombatLabel(rk);
                              return (
                                <div
                                  key={String(rk)}
                                  className="flex items-center justify-between"
                                >
                                  <Tooltip text={getHint(rk)}>
                                    <span className="text-gray-300 text-xs">
                                      {label}
                                    </span>
                                  </Tooltip>
                                  <span
                                    className={`text-accent font-bold text-xs ${
                                      rk !== "skillProc" && glow[String(rk)]
                                        ? "stat-glow"
                                        : ""
                                    }`}
                                    title={String(value)}
                                  >
                                    {value}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
