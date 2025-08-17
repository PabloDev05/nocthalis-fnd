import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Swords,
  Settings,
  Target,
  Shield,
  Flame,
  Sword as SwordIcon,
  Zap,
  Percent,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import type { CharacterApi, Stats, CombatStats } from "../../types/character";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

type Opponent = {
  id: string;
  name: string;
  level: number;
  className?: string;
  maxHP: number;
  currentHP?: number;
  stats?: Partial<Stats>;
  combatStats?: Partial<CombatStats>;
  avatarUrl?: string | null;
};

/* ===== métricas a mostrar (iguales para ambos lados) ===== */
const COMBAT_KEYS: (keyof NonNullable<CharacterApi["combatStats"]>)[] = [
  "attackPower",
  "evasion",
  "blockChance",
  "damageReduction",
  "criticalChance",
];
// Alias de claves del snapshot (subconjunto)
type SnapshotKey = (typeof COMBAT_KEYS)[number];

function StatIcon({ k }: { k: string }) {
  switch (k) {
    case "attackPower":
      return <SwordIcon className="w-3.5 h-3.5" />;
    case "evasion":
      return <Zap className="w-3.5 h-3.5" />;
    case "blockChance":
      return <ShieldCheck className="w-3.5 h-3.5" />;
    case "damageReduction":
      return <Shield className="w-3.5 h-3.5" />;
    case "criticalChance":
      return <Percent className="w-3.5 h-3.5" />;
    default:
      return <Gauge className="w-3.5 h-3.5" />;
  }
}

/* ===== Card gótico compacto ===== */
function BattlePortrait({
  side,
  name,
  level,
  className,
  hp,
  maxHP,
  avatarUrl,
  footerList, // lista de métricas (sin títulos)
  widthClass,
}: {
  side: "left" | "right";
  name: string;
  level: number | string;
  className?: string;
  hp: number;
  maxHP: number;
  avatarUrl?: string | null;
  footerList?: React.ReactNode;
  widthClass: string;
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((hp / Math.max(1, maxHP)) * 100))
  );
  const hpFill =
    "h-full bg-gradient-to-r from-[#7a1320] via-[#a3162a] to-[#c21d37] " +
    "shadow-[0_0_10px_rgba(194,29,55,.25),inset_0_0_6px_rgba(0,0,0,.6)] transition-[width] duration-500";

  return (
    <div
      className={`relative ${widthClass} rounded-2xl border border-[var(--border)]
                  bg-gradient-to-b from-[rgba(40,40,55,.95)] to-[rgba(18,18,24,.96)]
                  shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_28px_rgba(0,0,0,.45)]
                  overflow-hidden ${side === "left" ? "ml-auto" : "mr-auto"}`}
    >
      {/* Level bar */}
      <div
        className="h-9 flex items-center justify-center text-[12px] font-bold text-white tracking-wide
                      bg-gradient-to-r from-[rgba(120,120,255,.14)] via-[rgba(120,120,255,.22)] to-[rgba(120,120,255,.14)]
                      border-b border-[var(--border)] uppercase"
      >
        Level {level}
      </div>

      {/* Avatar */}
      <div className="h-[180px] flex items-center justify-center relative">
        {avatarUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={avatarUrl}
            className="w-32 h-32 object-cover rounded-xl opacity-90"
          />
        ) : (
          <User className="w-20 h-20 text-gray-400" />
        )}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,.55)]" />
      </div>

      {/* Nombre centrado con fuente gótica */}
      <div className="px-3 py-2 border-t border-[var(--border)] bg-[rgba(255,255,255,.03)] text-center">
        <div
          className="text-white font-black truncate text-base tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
          title={name}
        >
          {name}
        </div>
      </div>

      {/* HP: full width, sin márgenes laterales */}
      <div className="mt-[2px]">
        <div className="h-7 rounded-none border-y border-[var(--border)] bg-[rgba(255,255,255,.03)] overflow-hidden relative">
          <div className={hpFill} style={{ width: `${pct}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/95 font-semibold tracking-wide">
            {hp} / {maxHP} HP
          </div>
        </div>
      </div>

      {/* Lista de métricas (flush) */}
      {footerList && <div className="pb-3">{footerList}</div>}

      {/* Borde interior sutil para más “marco” */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.06),0_0_25px_rgba(255,255,255,.03)]" />
    </div>
  );
}

/* ===== Arena Screen ===== */
export default function Arena() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  const client = useMemo(() => {
    const i = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    i.interceptors.request.use((cfg) => {
      if (token)
        cfg.headers = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        } as any;
      return cfg;
    });
    return i;
  }, [token]);

  const [me, setMe] = useState<CharacterApi | null>(null);
  const [meHP, setMeHP] = useState<number | null>(null);

  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOpp = opponents.find((o) => o.id === selectedId) || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<{ opponents: Opponent[] }>("/arena/opponents").catch(() => ({
        data: {
          opponents: [
            {
              id: "npc-ashen-rogue",
              name: "Ashen Rogue",
              level: 10,
              className: "Assassin",
              maxHP: 900,
              // combatStats: { attackPower: 22, evasion: 14.5, blockChance: 4, damageReduction: 3, criticalChance: 12.1 }
            },
          ] as Opponent[],
        },
      })),
    ])
      .then(([meRes, oppRes]) => {
        if (!mounted) return;
        setMe(meRes.data);
        const maxHP = meRes.data?.combatStats?.maxHP ?? 0;
        const maybeCurrent = (meRes.data as any)?.currentHP;
        setMeHP(Number.isFinite(maybeCurrent) ? Number(maybeCurrent) : maxHP);

        setOpponents(oppRes.data.opponents ?? []);
        setSelectedId((oppRes.data.opponents?.[0]?.id as string) ?? null);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(
          e?.response?.data?.message || e.message || "Error loading arena"
        );
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [client]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

  // Player derived + nombre arreglado (username > name)
  const myName = (me as any)?.username ?? me?.name ?? "—";
  const myClass = (me as any)?.className ?? (me as any)?.class?.name ?? "—";
  const myLevel = me?.level ?? "—";
  const myMaxHP = me?.combatStats?.maxHP ?? 0;
  const myHP = meHP ?? myMaxHP;

  const NAV_ITEMS = [
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Legal notice", href: "/legal/notice" },
    { label: "Forum", href: "/forum" },
    { label: "Support", href: "/support" },
  ];

  const isCharacter = location.pathname.startsWith("/game");
  const isArena = location.pathname.startsWith("/arena");

  /* ===== Lista de métricas reutilizable (acepta SUBCONJUNTO de claves) ===== */
  function MetricsList({
    values,
  }: {
    values: Partial<Record<SnapshotKey, number | string | undefined>>;
  }) {
    return (
      <ul className="divide-y divide-[var(--border)]">
        {COMBAT_KEYS.map((k) => (
          <li
            key={String(k)}
            className="flex items-center justify-between px-3 py-2"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)]
                               border border-[var(--border)] text-[var(--accent)]"
              >
                <StatIcon k={String(k)} />
              </span>
              <span className="text-[12px]">{labelize(String(k))}</span>
            </div>
            <span className="text-[12px] font-semibold text-[var(--accent)]">
              {values[k] ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  // Player metrics
  const playerList = me?.combatStats ? (
    <MetricsList
      values={{
        attackPower: me.combatStats.attackPower,
        evasion: me.combatStats.evasion,
        blockChance: me.combatStats.blockChance,
        damageReduction: me.combatStats.damageReduction,
        criticalChance: me.combatStats.criticalChance,
      }}
    />
  ) : null;

  // Enemy metrics (mismas claves; si no hay combatStats, se verán “—”)
  const enemyList = (
    <MetricsList
      values={{
        attackPower: selectedOpp?.combatStats?.attackPower,
        evasion: selectedOpp?.combatStats?.evasion,
        blockChance: selectedOpp?.combatStats?.blockChance,
        damageReduction: selectedOpp?.combatStats?.damageReduction,
        criticalChance: selectedOpp?.combatStats?.criticalChance,
      }}
    />
  );

  return (
    <div className="min-h-screen text-sm leading-tight space-y-2 bg-[var(--bg)] relative">
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
            className="stat-text-muted hover:text-gray-300 transition-colors cursor-pointer
             focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-weak)] rounded-sm"
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
            <div className="col-span-3 ml-1 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-[var(--accent)]" />
                  <h2 className="text-white font-semibold text-lg">Arena</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[var(--accent)]" />
                  <select
                    className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm text-white
                               hover:border-[var(--accent-weak)] focus:outline-none"
                    value={selectedId ?? ""}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {opponents.map((o) => (
                      <option
                        key={o.id}
                        value={o.id}
                        className="bg-[var(--panel-2)] text-white"
                      >
                        {o.name} (Lv {o.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && (
                <div className="text-xs stat-text-muted">Cargando datos…</div>
              )}
              {err && !loading && (
                <div className="text-xs text-red-400">{err}</div>
              )}

              {!loading && (
                <div className="relative flex items-start justify-center gap-12 mt-4">
                  {/* Player */}
                  <BattlePortrait
                    side="left"
                    widthClass="w-[270px]"
                    name={myName}
                    level={myLevel}
                    className={myClass}
                    hp={myHP}
                    maxHP={myMaxHP}
                    footerList={playerList}
                  />

                  <div
                    className="text-5xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse"
                    style={{ fontFamily: "'Cinzel Decorative', serif" }}
                  >
                    VS
                  </div>

                  {/* Enemy */}
                  <BattlePortrait
                    side="right"
                    widthClass="w-[300px]"
                    name={selectedOpp?.name ?? "—"}
                    level={selectedOpp?.level ?? "—"}
                    className={selectedOpp?.className ?? "—"}
                    hp={selectedOpp?.currentHP ?? selectedOpp?.maxHP ?? 0}
                    maxHP={selectedOpp?.maxHP ?? 0}
                    footerList={enemyList}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
