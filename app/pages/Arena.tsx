import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Swords,
  Settings,
  Flame,
  Sword as SwordIcon,
  Zap,
  Percent,
  ShieldCheck,
  Shield,
  Gauge,
  ScrollText,
  ShieldAlert,
  XCircle,
  Sparkles,
} from "lucide-react";
import type { CharacterApi, Stats, CombatStats } from "../../types/character";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

/* ---------------- tipos auxiliares ---------------- */
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

type Opponent = {
  id: string; // userId enemigo
  name: string;
  level: number;
  className?: string;
  clan?: string | null;
  honor?: number;
  maxHP: number;
  currentHP?: number;
  stats?: Partial<Stats>;
  combatStats?: Partial<CombatStats>;
  avatarUrl?: string | null;
  passiveDefault?: { name: string; description?: string } | null;
  snapshot?: any;
};

type ViewMode = "select" | "duel";
type DuelResult = { outcome: "win" | "lose" | "draw"; summary: string } | null;

/** (LEGADO) Forma snapshot */
type SnapshotBE = {
  round: number;
  actor: "player" | "enemy";
  damage: number;
  playerHP: number;
  enemyHP: number;
  events?: string[];
};

/** (NUEVO) Timeline */
type TimelineBE =
  | {
      turn: number;
      actor: "attacker" | "defender";
      damage: number;
      attackerHP: number;
      defenderHP: number;
      event?: "hit" | "crit" | "block" | "miss";
      events?: string[];
    }
  | {
      turn: number;
      source: "attacker" | "defender";
      damage: number;
      attackerHP: number;
      defenderHP: number;
      event?: "hit" | "crit" | "block" | "miss";
      events?: string[];
    }
  | SnapshotBE;

type PvPTurn = {
  turn: number;
  actor: "attacker" | "defender";
  damage: number;
  attackerHP: number;
  defenderHP: number;
  event?: "hit" | "crit" | "block" | "miss";
  eventsRaw?: string[];
};

type LogEntry = {
  turn: number;
  actor: "attacker" | "defender";
  event: "hit" | "crit" | "block" | "miss" | "passive";
  text: string;
};

/* ---------------- util UI ---------------- */
const labelize = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

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

const COMBAT_KEYS: (keyof NonNullable<CharacterApi["combatStats"]>)[] = [
  "attackPower",
  "evasion",
  "blockChance",
  "damageReduction",
  "criticalChance",
];
type SnapshotKey = (typeof COMBAT_KEYS)[number];

/* ---------------- pasivas ---------------- */
function passiveShortForClass(cls?: string) {
  const c = (cls ?? "").toLowerCase();
  if (c.includes("guerrero")) return "Espíritu de Guardia: +5% DR, +3% Bloqueo";
  if (c.includes("mago"))
    return "Llama Interna: +2% daño/ataque (máx 10%) + 30% MP→daño";
  if (c.includes("asesino")) return "Sombra Letal: +30% daño crítico";
  if (c.includes("arquero"))
    return "Ojo del Águila: +1.5% daño/ataque (máx 7.5%)";
  return null;
}

function PassiveBadge({
  className,
  passive,
}: {
  className?: string;
  passive?: { name?: string; description?: string } | null;
}) {
  const short = passive?.name
    ? `${passive.name}${passive.description ? `: ${passive.description}` : ""}`
    : passiveShortForClass(className ?? "");
  if (!short) return null;

  return (
    <div className="mb-2 rounded-md px-3 py-2 bg-[rgba(255,255,255,.05)]">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
          Passive
        </span>
      </div>
      <div className="mt-1 text-[12px] text-zinc-200">{short}</div>
    </div>
  );
}

/* ---------------- portrait ---------------- */
function BattlePortrait({
  side,
  name,
  level,
  className,
  hp,
  maxHP,
  avatarUrl,
  headerAddon,
  footerList,
  widthClass,
}: {
  side: "left" | "right";
  name: string;
  level: number | string;
  className?: string;
  hp: number;
  maxHP: number;
  avatarUrl?: string | null;
  headerAddon?: React.ReactNode;
  footerList?: React.ReactNode;
  widthClass: string;
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((hp / Math.max(1, maxHP)) * 100))
  );
  const hpFill =
    "h-full bg-gradient-to-r from-[#7a1320] via-[#a3162a] to-[#c21d37] shadow-[0_0_10px_rgba(194,29,55,.25),inset_0_0_6px_rgba(0,0,0,.6)] transition-[width] duration-500";

  return (
    <div
      className={`relative ${widthClass} rounded-2xl border border-[var(--border)]
                  bg-gradient-to-b from-[rgba(40,40,55,.95)] to-[rgba(18,18,24,.96)]
                  shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_28px_rgba(0,0,0,.45)]
                  overflow-hidden ${side === "left" ? "ml-auto" : "mr-auto"}`}
    >
      <div className="h-9 flex items-center justify-center text-[12px] font-bold text-white tracking-wide bg-gradient-to-r from-[rgba(120,120,255,.14)] via-[rgba(120,120,255,.22)] to-[rgba(120,120,255,.14)] border-b border-[var(--border)] uppercase">
        Level {level}
      </div>

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

      <div className="px-3 py-2 border-t border-[var(--border)] bg-[rgba(255,255,255,.03)] text-center">
        <div
          className="text-white font-black truncate text-base tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
          title={name}
        >
          {name}
        </div>
      </div>

      <div className="px-3 pt-2">{headerAddon}</div>

      <div className="mt-[2px]">
        <div className="h-7 rounded-none border-y border-[var(--border)] bg-[rgba(255,255,255,.03)] overflow-hidden relative">
          <div className={hpFill} style={{ width: `${pct}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/95 font-semibold tracking-wide">
            {hp} / {maxHP} HP
          </div>
        </div>
      </div>

      {footerList && <div className="pb-3">{footerList}</div>}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.06),0_0_25px_rgba(255,255,255,.03)]" />
    </div>
  );
}

/* ---------------- ladder ---------------- */
function LadderRow({
  index,
  opp,
  active,
  onSelect,
  compact = false,
}: {
  index: number;
  opp: Opponent;
  active: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`grid grid-cols-[48px_1fr_80px] items-center w-full
                    px-3 py-2 text-left text-[13px]
                    border-b border-[var(--border)]
                    hover:bg-white/5 transition ${active ? "bg-white/10" : ""}`}
      >
        <span className="text-zinc-400">
          {index.toString().padStart(2, "0")}
        </span>
        <div className="truncate">
          <div className="text-zinc-200 font-medium truncate">{opp.name}</div>
          <div className="text-[11px] text-zinc-500 truncate">
            {opp.className ?? "—"}
          </div>
        </div>
        <span className="text-zinc-200 text-right">Lv {opp.level}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`grid grid-cols-[70px_1fr_140px_120px_90px_90px] items-center w-full
                  px-3 py-2 text-left text-[13px]
                  border-b border-[var(--border)]
                  hover:bg-white/5 transition ${active ? "bg-white/10" : ""}`}
    >
      <span className="text-zinc-400">{index.toString().padStart(2, "0")}</span>
      <span className="text-zinc-200 font-medium truncate">{opp.name}</span>
      <span className="text-zinc-300 truncate">{opp.clan ?? "—"}</span>
      <span className="text-zinc-300 truncate">{opp.className ?? "—"}</span>
      <span className="text-zinc-200">Lv {opp.level}</span>
      <span className="text-zinc-300">{opp.honor ?? 0}</span>
    </button>
  );
}

function LadderList({
  opponents,
  selectedId,
  setSelectedId,
  q,
  setQ,
  compact = false,
}: {
  opponents: Opponent[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  q: string;
  setQ: (s: string) => void;
  compact?: boolean;
}) {
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return opponents;
    return opponents.filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        (o.className ?? "").toLowerCase().includes(s) ||
        String(o.level).includes(s)
    );
  }, [opponents, q]);

  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] shadow-lg overflow-hidden ${
        compact ? "w-[420px] mx-auto" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div
          className="text-sm text-white/90 font-semibold"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Arena
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className={`bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm text-white
                     hover:border-[var(--accent-weak)] focus:outline-none ${
                       compact ? "w-32" : ""
                     }`}
        />
      </div>

      {compact ? (
        <>
          <div className="grid grid-cols-[48px_1fr_80px] px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)]">
            <span>Pos</span>
            <span>Nombre</span>
            <span className="text-right">Nivel</span>
          </div>
          <div className="max-h-[38vh] overflow-y-auto">
            {filtered.map((o, idx) => (
              <LadderRow
                key={o.id}
                index={idx + 1}
                opp={o}
                active={o.id === selectedId}
                onSelect={() => setSelectedId(o.id)}
                compact
              />
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-zinc-400 text-sm">
                Sin resultados
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-[70px_1fr_140px_120px_90px_90px] px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)]">
            <span>Posición</span>
            <span>Nombre</span>
            <span>Clan</span>
            <span>Clase</span>
            <span>Nivel</span>
            <span>Honor</span>
          </div>
          <div className="max-h-[48vh] overflow-y-auto">
            {filtered.map((o, idx) => (
              <LadderRow
                key={o.id}
                index={idx + 1}
                opp={o}
                active={o.id === selectedId}
                onSelect={() => setSelectedId(o.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-zinc-400 text-sm">
                Sin resultados
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- log visual ---------------- */
function EventIcon({ event }: { event: LogEntry["event"] }) {
  switch (event) {
    case "crit":
      return <Zap className="w-3.5 h-3.5" />;
    case "block":
      return <ShieldAlert className="w-3.5 h-3.5" />;
    case "miss":
      return <XCircle className="w-3.5 h-3.5" />;
    case "passive":
      return <Sparkles className="w-3.5 h-3.5" />;
    default:
      return <SwordIcon className="w-3.5 h-3.5" />;
  }
}

function CombatLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  const color = (e: LogEntry["event"]) =>
    e === "crit"
      ? "text-amber-300"
      : e === "block"
        ? "text-sky-300"
        : e === "miss"
          ? "text-zinc-300"
          : e === "passive"
            ? "text-[var(--accent)]"
            : "text-[var(--accent)]";

  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] shadow-lg overflow-hidden">
      <div className="px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)] flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-[var(--accent)]" />
        Registro del combate
      </div>
      <div ref={ref} className="max-h-56 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {entries.map((e, i) => (
            <li
              key={`${e.turn}-${i}`}
              className="px-3 py-2 flex items-center gap-2 text-[12px] text-zinc-300"
            >
              <span
                className={`inline-flex w-5 h-5 items-center justify-center rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] ${color(
                  e.event
                )}`}
                title={e.event}
              >
                <EventIcon event={e.event} />
              </span>
              <span className="text-zinc-500">T{e.turn}</span>
              <span className="text-zinc-200">{e.text}</span>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="px-3 py-4 text-center text-[12px] text-zinc-500">
              Sin eventos aún
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* ===================================================================== */

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

  const [view, setView] = useState<ViewMode>("select");
  const [centerLabel, setCenterLabel] = useState<
    "VS" | "WIN" | "LOSE" | "DRAW"
  >("VS");
  const [duelResult, setDuelResult] = useState<DuelResult>(null);

  const [me, setMe] = useState<CharacterApi | null>(null);
  const [prog, setProg] = useState<ProgressionApi | null>(null);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOpp = opponents.find((o) => o.id === selectedId) || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // HP animado
  const [hpMe, setHpMe] = useState(0);
  const [hpOpp, setHpOpp] = useState(0);
  const loopRef = useRef<number | null>(null);

  // LOG
  const [combatLog, setCombatLog] = useState<LogEntry[]>([]);

  function stopLoop() {
    if (loopRef.current) {
      window.clearTimeout(loopRef.current);
      loopRef.current = null;
    }
  }

  const normalizeOpponent = (raw: any): Opponent => {
    const name = String(raw?.name ?? raw?.username ?? "—");
    const level = Number(raw?.level ?? 0);
    const className = raw?.className ?? raw?.class?.name ?? undefined;
    const combatStats = raw?.combatStats ?? {};
    const maxHP = Number(raw?.maxHP ?? combatStats?.maxHP ?? 0);
    const passiveDefault =
      raw?.passiveDefault ?? raw?.class?.passiveDefault ?? null;
    return {
      id: String(raw?.userId ?? raw?.id ?? raw?._id ?? ""),
      name,
      level,
      className,
      clan: raw?.clan ?? null,
      honor: raw?.honor ?? 0,
      maxHP,
      currentHP: Number(raw?.currentHP ?? maxHP),
      stats: raw?.stats ?? {},
      combatStats,
      avatarUrl: raw?.avatarUrl ?? null,
      passiveDefault,
      snapshot: raw?.snapshot,
    };
  };

  // carga inicial: me + progression + oponentes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<ProgressionApi>("/character/progression"),
      client.get<any>(`/arena/opponents?size=24&levelSpread=20`),
    ])
      .then(([meRes, progRes, oppRes]) => {
        if (!mounted) return;
        setMe(meRes.data);
        setProg(progRes.data);

        const rawList =
          oppRes.data?.opponents ??
          oppRes.data?.rivals ??
          (Array.isArray(oppRes.data) ? oppRes.data : []);
        const list: Opponent[] = Array.isArray(rawList)
          ? rawList.map(normalizeOpponent)
          : [];

        setOpponents(list);
        setSelectedId((list[0]?.id as string) ?? null);
        setView("select");
        setCenterLabel("VS");
        setDuelResult(null);
        setCombatLog([]);
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
      stopLoop();
    };
  }, [client]);

  const myName = (me as any)?.username ?? me?.name ?? "—";
  const myClass = (me as any)?.className ?? (me as any)?.class?.name ?? "—";
  const myLevel = prog?.level ?? me?.level ?? "—"; // <-- nivel efectivo
  const myMaxHP = Math.round(me?.combatStats?.maxHP ?? 0);

  useEffect(() => {
    stopLoop();
    if (view === "duel") {
      setHpMe(myMaxHP);
      setHpOpp(Math.round(selectedOpp?.maxHP ?? 0));
    }
  }, [view, selectedId, myMaxHP, selectedOpp?.maxHP]);

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
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] text-[var(--accent)]">
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

  function mapBackendToUi(items: TimelineBE[] = []): PvPTurn[] {
    return (items ?? []).map((s: any, idx: number) => {
      if (s && (s.playerHP != null || s.enemyHP != null || s.round != null)) {
        const isPlayerAtk = s.actor === "player";
        const event = s.events?.includes("crit")
          ? "crit"
          : s.events?.includes("block")
            ? "block"
            : s.events?.includes("miss")
              ? "miss"
              : ((s.event as PvPTurn["event"]) ?? "hit");
        return {
          turn: Number(s.round ?? idx + 1),
          actor: isPlayerAtk ? "attacker" : "defender",
          damage: Number(s.damage ?? 0),
          attackerHP: Number(isPlayerAtk ? s.playerHP : (s.enemyHP ?? 0)),
          defenderHP: Number(isPlayerAtk ? s.enemyHP : (s.playerHP ?? 0)),
          event,
          eventsRaw: Array.isArray(s.events) ? s.events : undefined,
        };
      }
      const actor = (s.actor ?? s.source) as "attacker" | "defender";
      return {
        turn: Number(s.turn ?? idx + 1),
        actor: actor ?? "attacker",
        damage: Number(s.damage ?? 0),
        attackerHP: Number(s.attackerHP ?? 0),
        defenderHP: Number(s.defenderHP ?? 0),
        event:
          (s.event as PvPTurn["event"]) ??
          (Number(s.damage) > 0 ? "hit" : "miss"),
        eventsRaw: Array.isArray(s.events) ? s.events : undefined,
      };
    });
  }

  async function playTimeline(tl: PvPTurn[]) {
    stopLoop();
    setCombatLog([]);

    const num = (v: any, def = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : def;
    };
    const clamp = (v: any, min: number, max: number) => {
      const n = num(v, min);
      return Math.max(min, Math.min(max, n));
    };
    const toInt = (v: any) => Math.round(num(v, 0));

    const myMax = myMaxHP;
    const oppMax = Math.round(selectedOpp?.maxHP ?? 0);
    setHpMe(myMax);
    setHpOpp(oppMax);

    const FIRST_DELAY = 650;
    const STEP_MS = 550;

    const step = (i: number) => {
      if (i >= tl.length) return;
      const turn = tl[i];

      const isAtk = turn.actor === "attacker";
      const e: PvPTurn["event"] =
        turn.event ?? (num(turn.damage, 0) <= 0 ? "miss" : "hit");

      const nextOpp = clamp(turn.defenderHP, 0, oppMax);
      const nextMe = clamp(turn.attackerHP, 0, myMax);

      if (isAtk) setHpOpp(nextOpp);
      else setHpMe(nextMe);

      const raw = turn.eventsRaw || [];
      const passiveTag = raw.find((r) => /passive/i.test(r || ""));
      if (passiveTag) {
        const who = passiveTag.startsWith("player:")
          ? myName
          : (selectedOpp?.name ?? "—");
        const cls = passiveTag.startsWith("player:")
          ? myClass
          : (selectedOpp?.className ?? "");
        const short = passiveShortForClass(cls) ?? "Pasiva activada";
        setCombatLog((prev) =>
          prev.concat({
            turn: turn.turn,
            actor: passiveTag.startsWith("player:") ? "attacker" : "defender",
            event: "passive",
            text: `${who} activa pasiva: ${short}.`,
          })
        );
      }

      const who = isAtk ? myName : (selectedOpp?.name ?? "—");
      const tgt = isAtk ? (selectedOpp?.name ?? "—") : myName;
      const tgtMax = isAtk ? oppMax : myMax;
      const tgtHPAfter = isAtk ? nextOpp : nextMe;

      const label =
        e === "crit"
          ? "¡Crítico!"
          : e === "block"
            ? "Bloqueado"
            : e === "miss"
              ? "Evasión/Fallo"
              : "Golpea";

      const line: LogEntry = {
        turn: turn.turn,
        actor: turn.actor,
        event: (e as any) ?? "hit",
        text:
          e === "miss"
            ? `${who} falla contra ${tgt}. (${tgtHPAfter}/${tgtMax} HP)`
            : `${who} ${label.toLowerCase()} a ${tgt} por ${toInt(
                turn.damage
              )}. (${tgtHPAfter}/${tgtMax} HP)`,
      };
      setCombatLog((prev) => prev.concat(line));

      loopRef.current = window.setTimeout(() => step(i + 1), STEP_MS);
    };

    loopRef.current = window.setTimeout(() => step(0), FIRST_DELAY);
  }

  async function startChallenge() {
    if (!selectedOpp) return;
    try {
      const crt = await client.post("/arena/challenges", {
        opponentId: selectedOpp.id,
      });

      setView("duel");
      setCenterLabel("VS");
      setDuelResult(null);
      setCombatLog([]);

      const { matchId } =
        (crt.data as { matchId: string }) ?? ({ matchId: "" } as any);

      try {
        await client.post("/combat/simulate", { matchId });
      } catch {}

      const pvp = await client.post("/combat/resolve", { matchId });
      const outcome = (pvp.data?.outcome as "win" | "lose" | "draw") ?? "draw";
      const rw = (pvp.data?.rewards as any) ?? {};
      const honor = Number(rw.honorDelta ?? rw.honor ?? 0);
      const xp = Number(rw.xpGained ?? rw.xp ?? 0);
      const gold = Number(rw.goldGained ?? rw.gold ?? 0);

      const rawTimeline: TimelineBE[] =
        (pvp.data?.timeline as TimelineBE[]) ??
        (pvp.data?.snapshots as TimelineBE[]) ??
        [];
      const timeline = mapBackendToUi(rawTimeline);

      if (timeline.length) {
        await playTimeline(timeline);
        const totalMs = 650 + timeline.length * 550 + 80;
        await new Promise((r) => setTimeout(r, totalMs));
      }

      setCenterLabel(
        outcome === "win" ? "WIN" : outcome === "lose" ? "LOSE" : "DRAW"
      );
      setDuelResult({
        outcome,
        summary: [
          outcome === "win"
            ? "Has vencido."
            : outcome === "lose"
              ? "Has sido derrotado."
              : "Empate.",
          honor ? ` ${honor >= 0 ? "+" : ""}${honor} Honor.` : "",
          xp ? ` +${xp} XP.` : "",
          gold ? ` +${gold} Oro.` : "",
        ].join(""),
      });

      setCombatLog((prev) => [
        ...prev,
        {
          turn: (prev.at(-1)?.turn ?? 0) + 1,
          actor:
            outcome === "win"
              ? "attacker"
              : outcome === "lose"
                ? "defender"
                : "attacker",
          event:
            outcome === "win" ? "hit" : outcome === "lose" ? "miss" : "block",
          text:
            outcome === "win"
              ? "Resultado: Victoria."
              : outcome === "lose"
                ? "Resultado: Derrota."
                : "Resultado: Empate.",
        },
      ]);

      // 🔄 REFRESH post-combate: me + progression (+ oponentes opcional)
      try {
        const [meRes, progRes] = await Promise.all([
          client.get<CharacterApi>("/character/me"),
          client.get<ProgressionApi>("/character/progression"),
        ]);
        setMe(meRes.data);
        setProg(progRes.data);
      } catch (_) {}
    } catch (e) {
      console.error(e);
      setView("duel");
      setCenterLabel("DRAW");
      setDuelResult({
        outcome: "draw",
        summary: "No se pudo resolver el combate (fallback visual).",
      });
    }
  }

  /* ----------------------------- chrome / layout ---------------------------- */
  const NAV_ITEMS = [
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Legal notice", href: "/legal/notice" },
    { label: "Forum", href: "/forum" },
    { label: "Support", href: "/support" },
  ];
  const isCharacter = location.pathname.startsWith("/game");
  const isArena = location.pathname.startsWith("/arena");
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

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
            <div className="col-span-3 ml-1 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-white font-semibold text-lg">Arena</h2>
              </div>

              {loading && (
                <div className="text-xs stat-text-muted">Cargando datos…</div>
              )}
              {err && !loading && (
                <div className="text-xs text-red-400">{err}</div>
              )}

              {/* SELECT */}
              {!loading && view === "select" && (
                <div className="flex flex-col items-center gap-3">
                  <LadderList
                    opponents={opponents}
                    selectedId={selectedId}
                    setSelectedId={(id) => setSelectedId(id)}
                    q={q}
                    setQ={setQ}
                    compact
                  />
                  <button
                    type="button"
                    onClick={startChallenge}
                    disabled={!selectedOpp}
                    className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold shadow-[0_0_12px_rgba(190,0,0,0.35)]"
                  >
                    Ataque
                  </button>
                </div>
              )}

              {/* DUEL */}
              {!loading && view === "duel" && (
                <>
                  <div className="relative flex items-start justify-center gap-12 mt-2">
                    <BattlePortrait
                      side="left"
                      widthClass="w-[270px]"
                      name={myName}
                      level={myLevel} // <-- nivel consistente con Character
                      className={myClass}
                      hp={hpMe}
                      maxHP={myMaxHP}
                      headerAddon={
                        <PassiveBadge
                          className={myClass}
                          passive={
                            (me as any)?.class?.passiveDefault ??
                            (me as any)?.passiveDefault ??
                            null
                          }
                        />
                      }
                      footerList={playerList}
                    />

                    <div className="min-w-[140px] flex flex-col items-center justify-center select-none">
                      <div
                        className={`text-5xl font-black ${
                          centerLabel === "WIN"
                            ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,.8)]"
                            : centerLabel === "LOSE"
                              ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,.8)]"
                              : centerLabel === "DRAW"
                                ? "text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,.5)]"
                                : "text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse"
                        }`}
                        style={{ fontFamily: "'Cinzel Decorative', serif" }}
                      >
                        {centerLabel}
                      </div>
                      {duelResult && (
                        <div className="mt-3 text-center text-[12px] text-zinc-300 max-w-[220px]">
                          {duelResult.summary}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          stopLoop();
                          setView("select");
                          setCenterLabel("VS");
                          setCombatLog([]);
                        }}
                        className="mt-4 text-xs text-zinc-400 hover:text-zinc-200 underline"
                      >
                        cambiar oponente
                      </button>
                    </div>

                    <BattlePortrait
                      side="right"
                      widthClass="w-[300px]"
                      name={selectedOpp?.name ?? "—"}
                      level={selectedOpp?.level ?? "—"}
                      className={selectedOpp?.className ?? "—"}
                      hp={hpOpp}
                      maxHP={selectedOpp?.maxHP ?? 0}
                      headerAddon={
                        <PassiveBadge
                          className={selectedOpp?.className}
                          passive={selectedOpp?.passiveDefault ?? null}
                        />
                      }
                      footerList={enemyList}
                    />
                  </div>

                  {/* Log */}
                  <CombatLog entries={combatLog} />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
