// src/pages/Arena.tsx
import { JSX, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router";
import {
  Swords,
  Settings,
  User,
  Zap,
  Flame,
  Sword as SwordIcon,
  Percent,
  ShieldAlert,
  XCircle,
  Sparkles,
  ScrollText,
  Coins,
  Star,
  Gift,
  RotateCcw,
  Shield,
  Skull,
  Crown,
  Wind,
} from "lucide-react";
import type { CharacterApi, CombatStats } from "../../types/character";

/* ─────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";
const PVP_STAMINA_COST =
  Number(import.meta.env.VITE_PVP_STAMINA_COST ?? 10) || 10;

/* ───────── Timeline/Anim ───────── */
type ActorRole = "attacker" | "defender";
type TimelineEvent =
  | "hit"
  | "crit"
  | "block"
  | "miss"
  | "passive_proc"
  | "ultimate_cast"
  | "dot_tick";

type TimelineBE = {
  turn: number;
  source?: ActorRole;
  actor?: ActorRole;
  damage?: number;
  attackerHP?: number;
  defenderHP?: number;
  event: string | TimelineEvent;
  ability?: {
    kind: "passive" | "ultimate";
    name?: string;
    description?: string;
    durationTurns?: number;
  };
  tags?: string[] | Record<string, any>;
  // flags
  crit?: boolean;
  isCrit?: boolean;
  critical?: boolean;
  blocked?: boolean;
  isBlocked?: boolean;
  block?: boolean;
  miss?: boolean;
  isMiss?: boolean;
  dodged?: boolean;
  evade?: boolean;
  evaded?: boolean;
  dot?: boolean;
  bleed?: boolean;
  poison?: boolean;
  burn?: boolean;
  outcome?: string;
};

/* ───── scheduler config ───── */
type ScheduleOptions = {
  minTurnMs: number;
  gapSmallMs: number;
  passiveProcMs: number;
  ultimateCastMs: number;
  attackWindupMs: number;
  impactMs: number;
  extraCritMs: number;
  extraBlockMs: number;
  extraMissMs: number;
};
type ScheduledEventType =
  | "attack_windup"
  | "impact_hit"
  | "impact_crit"
  | "impact_block"
  | "impact_miss"
  | "passive_proc"
  | "ultimate_cast"
  | "dot_tick";
type ScheduledEvent = {
  id: string;
  type: ScheduledEventType;
  role: ActorRole;
  startMs: number;
  endMs: number;
  payload: TimelineBE;
};

const DEFAULTS: ScheduleOptions = {
  minTurnMs: 1100,
  gapSmallMs: 120,
  passiveProcMs: 520,
  ultimateCastMs: 920,
  attackWindupMs: 360,
  impactMs: 260,
  extraCritMs: 200,
  extraBlockMs: 180,
  extraMissMs: 150,
};

/* ───── helpers ───── */
const asInt = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

type StaminaSnap = { current: number; max: number };
function extractStamina(obj: any): StaminaSnap {
  if (!obj || typeof obj !== "object") return { current: 0, max: 10 };
  const current = asInt(
    obj.current ??
      obj.value ??
      obj.stamina ??
      obj.energy ??
      obj?.snapshot?.current ??
      0
  );
  const max =
    asInt(
      obj.max ??
        obj.maxValue ??
        obj.staminaMax ??
        obj.energyMax ??
        obj.capacity ??
        obj?.snapshot?.max ??
        10
    ) || 10;
  return { current: Math.max(0, current), max: Math.max(1, max) };
}

const formatChance = (v: number | undefined) => {
  const n = Number(v ?? 0);
  return n >= 0 && n <= 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}`;
};

const fatePercent = (v: number | undefined) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0%";
  return n <= 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}%`;
};

const skillText = (obj?: { name?: string; description?: string } | null) =>
  obj?.name
    ? `${obj.name}${obj.description ? `: ${obj.description}` : ""}`
    : null;

/* ───── robust event detection ───── */
function hasAny(obj: any, keys: string[]) {
  return keys.some((k) => {
    const v = (obj as any)?.[k];
    return v === true || String(v ?? "").toLowerCase() === k.toLowerCase();
  });
}
function readFlags(raw: any) {
  const ev = String(raw?.event ?? raw?.outcome ?? "").toLowerCase();
  const tags = raw?.tags;

  const tagHas = (key: string) => {
    if (!tags) return false;
    if (Array.isArray(tags))
      return tags.some((t) => String(t).toLowerCase().includes(key));
    if (typeof tags === "object") {
      const t = tags as Record<string, any>;
      const v = t[key] ?? t[key.toUpperCase()] ?? t[key.toLowerCase()];
      return (
        v === true || (typeof v === "string" && v.toLowerCase().includes(key))
      );
    }
    return false;
  };

  const isCrit =
    hasAny(raw, ["crit", "isCrit", "critical"]) ||
    tagHas("crit") ||
    /crit/.test(ev);
  const isBlock =
    hasAny(raw, ["blocked", "isBlocked", "block"]) ||
    tagHas("block") ||
    /block/.test(ev);
  const isMiss =
    hasAny(raw, ["miss", "isMiss", "dodged", "evade", "evaded"]) ||
    tagHas("miss") ||
    /(miss|dodge|evad)/.test(ev);
  const isDot =
    hasAny(raw, ["dot", "bleed", "poison", "burn"]) ||
    tagHas("dot") ||
    /(dot|tick|bleed|poison|burn)/.test(ev);
  const isPassive =
    raw?.ability?.kind === "passive" ||
    tagHas("passive") ||
    ev.includes("passive");
  const isUltimate =
    raw?.ability?.kind === "ultimate" ||
    tagHas("ultimate") ||
    ev.includes("ultimate");

  return { isCrit, isBlock, isMiss, isDot, isPassive, isUltimate };
}

function normalizeEvent(raw: TimelineBE): TimelineEvent {
  const ev = String(raw?.event ?? raw?.outcome ?? "").toLowerCase();
  const f = readFlags(raw);

  if (f.isPassive) return "passive_proc";
  if (f.isUltimate) return "ultimate_cast";
  if (f.isDot) return "dot_tick";
  if (f.isMiss) return "miss";
  if (f.isBlock) return "block";
  if (f.isCrit) return "crit";
  if (["attack", "strike", "impact", "hit"].includes(ev)) return "hit";
  return "hit";
}

/* ---------- animation scheduler ---------- */
function buildAnimationSchedule(
  timeline: TimelineBE[],
  opts?: Partial<ScheduleOptions>
): { totalMs: number; events: ScheduledEvent[] } {
  const cfg = { ...DEFAULTS, ...(opts || {}) };
  const out: ScheduledEvent[] = [];
  if (!timeline?.length) return { totalMs: 0, events: out };

  let tCursor = 0;
  let perTurnIndex = 0;
  let lastTurn = timeline[0].turn;
  let turnStart = 0;

  const schedule = (
    type: ScheduledEventType,
    role: ActorRole,
    dur: number,
    payload: TimelineBE
  ) => {
    const id = `${payload.turn}:${perTurnIndex++}:${type}`;
    const startMs = tCursor;
    const baseDur =
      type === "impact_crit"
        ? cfg.impactMs + cfg.extraCritMs
        : type === "impact_block"
          ? cfg.impactMs + cfg.extraBlockMs
          : type === "impact_miss"
            ? cfg.impactMs + cfg.extraMissMs
            : dur;
    const endMs = startMs + Math.max(0, baseDur);
    out.push({ id, type, role, startMs, endMs, payload });
    tCursor = endMs;
  };

  const deriveImpact = (e: TimelineBE): ScheduledEventType => {
    const n = normalizeEvent(e);
    if (n === "crit") return "impact_crit";
    if (n === "block") return "impact_block";
    if (n === "miss") return "impact_miss";
    return "impact_hit";
  };

  for (let i = 0; i < timeline.length; i++) {
    const raw = timeline[i];
    const next = timeline[i + 1];

    if (raw.turn !== lastTurn) {
      const minEnd = turnStart + cfg.minTurnMs;
      if (tCursor < minEnd) tCursor = minEnd;
      lastTurn = raw.turn;
      turnStart = tCursor;
      perTurnIndex = 0;
    }

    const role: ActorRole = (raw.source ??
      raw.actor ??
      "attacker") as ActorRole;
    const n = normalizeEvent(raw);

    if (n === "passive_proc") {
      schedule("passive_proc", role, cfg.passiveProcMs, raw);
      tCursor += cfg.gapSmallMs;
      continue;
    }
    if (n === "ultimate_cast") {
      schedule("ultimate_cast", role, cfg.ultimateCastMs, raw);
      tCursor += cfg.gapSmallMs;
      continue;
    }
    if (n === "dot_tick") {
      schedule("dot_tick", role, Math.max(220, cfg.gapSmallMs + 80), raw);
      continue;
    }

    schedule("attack_windup", role, cfg.attackWindupMs, raw);
    schedule(deriveImpact(raw), role, cfg.impactMs, raw);

    if (!next || next.turn !== raw.turn) {
      const minEnd = turnStart + cfg.minTurnMs;
      if (tCursor < minEnd) tCursor = minEnd;
    }
  }

  const totalMs = out.length ? out[out.length - 1].endMs : 0;
  return { totalMs, events: out };
}

/* ─────────────────────────────────────────────────────────── */
type ProgressionApi = { level: number };
type Opponent = {
  id: string;
  name: string;
  level: number;
  className?: string;
  maxHP: number;
  stats?: Record<string, number>;
  combatStats?: Partial<CombatStats> & {
    minDamage?: number;
    maxDamage?: number;
    damageMin?: number;
    damageMax?: number;
    criticalChance?: number;
    blockChance?: number;
    evasion?: number;
    evadeChance?: number;
    dodgeChance?: number;
    attackPower?: number;
  };
  avatarUrl?: string | null;
  passiveDefaultSkill?: { name?: string; description?: string } | null;
  ultimateSkill?: { name?: string; description?: string } | null;
  clanName?: string | null;
  honor?: number | null;
};

type ViewMode = "select" | "duel";
type DuelResult = { outcome: "win" | "lose" | "draw"; summary: string } | null;

type Reward = {
  gold?: number;
  xp?: number;
  items?: Array<{ name: string; qty?: number }>;
  honor?: number;
} | null;

type LogKind =
  | "hit"
  | "crit"
  | "block"
  | "miss"
  | "passive"
  | "ultimate"
  | "dot";

type LogEntry = {
  turn: number;
  kind: LogKind;
  text: string;
  actor: "me" | "opp";
  value?: number;
};

/* ───── icons ───── */
function StatIcon({ k }: { k: string }) {
  switch (k) {
    case "attackPower":
      return <SwordIcon className="w-3.5 h-3.5" />;
    case "blockChance":
      return <Shield className="w-3.5 h-3.5" />;
    case "criticalChance":
      return <Percent className="w-3.5 h-3.5" />;
    case "evasion":
      return <Wind className="w-3.5 h-3.5" />;
    case "fate":
      return <Sparkles className="w-3.5 h-3.5" />;
    default:
      return <ScrollText className="w-3.5 h-3.5" />;
  }
}

function EventIcon({ kind }: { kind: LogKind }) {
  switch (kind) {
    case "hit":
      return <SwordIcon className="w-3.5 h-3.5" />;
    case "crit":
      return <Skull className="w-3.5 h-3.5" />;
    case "block":
      return <ShieldAlert className="w-3.5 h-3.5" />;
    case "miss":
      return <XCircle className="w-3.5 h-3.5" />;
    case "passive":
      return <Sparkles className="w-3.5 h-3.5" />;
    case "ultimate":
      return <Crown className="w-3.5 h-3.5" />;
    case "dot":
      return <Flame className="w-3.5 h-3.5" />;
  }
}

/* ───── skill badges (compact, sin tooltip) ───── */
function SkillBadge({
  title,
  text,
  kind,
  pulseKey,
  fate = 0,
}: {
  title: "Passive" | "Ultimate";
  text?: string | null;
  kind: "passive" | "ultimate";
  pulseKey: number;
  fate?: number;
}) {
  const full = (text && String(text).trim().length ? text : "—") as string;
  const [name] = full.split(":");
  const Icon = kind === "passive" ? Sparkles : Crown;

  const luck = Math.max(0, Number(fate) || 0);
  const alpha = Math.min(0.9, 0.18 + (luck / 100) * 0.4);
  const glowColor =
    kind === "passive"
      ? `rgba(86,156,255,${alpha})`
      : `rgba(255,214,86,${alpha})`;

  return (
    <div className="mb-1 rounded-md px-2 py-1 bg-white/[.04] border border-white/[.06] relative overflow-hidden">
      <style>{`
        @keyframes glowPulse { 0% { opacity: 0 } 35% { opacity: .6 } 100% { opacity: 0 } }
      `}</style>
      <div
        key={pulseKey}
        className={`absolute inset-0 pointer-events-none`}
        style={{
          animation: pulseKey ? "glowPulse 700ms ease-out 1" : undefined,
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, rgba(0,0,0,0) 60%)`,
          opacity: 0,
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-4.5 h-4.5 items-center justify-center rounded bg-[rgba(120,120,255,.12)] border border-white/[.08] text-[var(--accent)]">
            <Icon className="w-3 h-3" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
            {title}
          </span>
        </div>
        <span
          className="text-[11px] text-zinc-200 truncate max-w-[140px]"
          title={name}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

/* ───── compact metrics ───── */
function SmallMetricsCard({
  map,
}: {
  map: Record<string, number | undefined>;
}) {
  const Row = ({
    label,
    iconKey,
    value,
    isChance,
    mini,
  }: {
    label: string;
    iconKey: string;
    value: number | undefined;
    isChance?: boolean;
    mini?: string | null;
  }) => (
    <li className="px-3 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-300">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] text-[var(--accent)]">
          <StatIcon k={iconKey} />
        </span>
        <span className="text-[12px]">
          {label}
          {mini && (
            <span className="text-[10px] text-zinc-400 ml-1 align-middle">
              {mini}
            </span>
          )}
        </span>
      </div>
      <span className="text-[12px] font-semibold text-[var(--accent)] tabular-nums">
        {isChance ? formatChance(value ?? 0) : asInt(value ?? 0)}
      </span>
    </li>
  );

  const fateMini = `(${fatePercent(map["fate"])})`;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] overflow-hidden">
      <ul className="divide-y divide-[var(--border)]">
        <li className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] text-[var(--accent)]">
              <Swords className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px]">Damage</span>
          </div>
          <span className="text-[12px] font-semibold text-[var(--accent)] tabular-nums">
            {asInt(map["damageMin"] ?? 0)} - {asInt(map["damageMax"] ?? 0)}
          </span>
        </li>

        <Row label="Attack" iconKey="attackPower" value={map["attackPower"]} />
        <Row
          label="Block Chance"
          iconKey="blockChance"
          value={map["blockChance"]}
          isChance
        />
        <Row
          label="Critical Chance"
          iconKey="criticalChance"
          value={map["criticalChance"]}
          isChance
        />
        <Row
          label="Evasion"
          iconKey="evasion"
          value={map["evasion"]}
          isChance
        />
        <Row label="Fate" iconKey="fate" value={map["fate"]} mini={fateMini} />
      </ul>
    </div>
  );
}

/* ───── portrait ───── */
function BattlePortrait({
  side,
  name,
  level,
  hp,
  maxHP,
  avatarUrl,
  passiveText,
  ultimateText,
  passivePulseKey,
  ultimatePulseKey,
  hpGlowKey,
  blockFlashKey,
  ultFlashKey,
  ultShakeKey,
  hitShakeKey,
  blockBumpKey,
  stats,
  widthClass,
}: {
  side: "left" | "right";
  name: string;
  level: number | string;
  hp: number;
  maxHP: number;
  avatarUrl?: string | null;
  passiveText?: string | null;
  ultimateText?: string | null;
  passivePulseKey: number;
  ultimatePulseKey: number;
  hpGlowKey: number;
  blockFlashKey: number;
  ultFlashKey: number;
  ultShakeKey: number;
  hitShakeKey: number;
  blockBumpKey: number;
  stats: Record<string, number | undefined>;
  widthClass: string;
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((hp / Math.max(1, maxHP)) * 100))
  );

  return (
    <div
      className={`relative ${widthClass} rounded-2xl border border-[var(--border)]
                  bg-gradient-to-b from-[rgba(35,38,55,.96)] to-[rgba(15,16,22,.98)]
                  shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_20px_40px_rgba(0,0,0,.55),0_0_24px_rgba(120,120,255,.12)]
                  overflow-hidden ${side === "left" ? "ml-auto" : "mr-auto"}
                  ${hitShakeKey ? "hit-shake-once" : ""} ${blockBumpKey ? "block-bump-once" : ""}`}
      style={
        ultShakeKey
          ? { animation: "megaShake 750ms cubic-bezier(.36,.07,.19,.97) 1" }
          : undefined
      }
    >
      <style>{`
        @keyframes hpGlow {
          0% { box-shadow: inset 0 0 0 0 rgba(255,80,80,.0), 0 0 0 rgba(0,0,0,0) }
          30% { box-shadow: inset 0 0 24px rgba(255,90,90,.45), 0 0 16px rgba(255,60,60,.35) }
          100% { box-shadow: inset 0 0 0 0 rgba(255,80,80,.0), 0 0 0 rgba(0,0,0,0) }
        }
        .hp-glow-once { animation: hpGlow 800ms ease-out 1; }

        /* Critico: flash rojo en el card (sin punto central) */
        @keyframes critCardFlash {
          0% { box-shadow: inset 0 0 0 rgba(0,0,0,0); filter: saturate(1); }
          18% { box-shadow: inset 0 0 120px rgba(255,50,60,.55); }
          45% { box-shadow: inset 0 0 140px rgba(255,40,50,.65), 0 0 44px rgba(255,60,80,.45); filter: saturate(1.25); }
          80% { box-shadow: inset 0 0 80px rgba(255,40,50,.35), 0 0 28px rgba(255,60,80,.25); filter: saturate(1.1); }
          100% { box-shadow: inset 0 0 0 rgba(0,0,0,0); filter: saturate(1); }
        }

        /* Block: flash + ripple */
        @keyframes blockFlash {
          0% { box-shadow: inset 0 0 0 rgba(0,0,0,0) }
          20% { box-shadow: inset 0 0 100px rgba(90,170,255,.45) }
          60% { box-shadow: inset 0 0 70px rgba(90,170,255,.25) }
          100% { box-shadow: inset 0 0 0 rgba(0,0,0,0) }
        }
        @keyframes shieldRipple {
          0% { transform: scale(.9); opacity: .4 }
          100% { transform: scale(1.5); opacity: 0 }
        }

        /* Shakes */
        @keyframes megaShake {
          10%, 90% { transform: translate3d(-1px, 0, 0) }
          20%, 80% { transform: translate3d(2px, 0, 0) }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0) }
          40%, 60% { transform: translate3d(4px, 0, 0) }
        }
        @keyframes hitShake {
          0%,100% { transform: translate3d(0,0,0) }
          20% { transform: translate3d(-2px, 0, 0) rotate(-0.2deg) }
          40% { transform: translate3d(3px, 0, 0) rotate(0.2deg) }
          60% { transform: translate3d(-3px, 0, 0) rotate(-0.2deg) }
          80% { transform: translate3d(2px, 0, 0) rotate(0.2deg) }
        }
        .hit-shake-once { animation: hitShake 420ms cubic-bezier(.36,.07,.19,.97) 1; }

        @keyframes blockBump {
          0% { transform: scale(1) }
          35% { transform: scale(1.02) }
          70% { transform: scale(1.008) }
          100% { transform: scale(1) }
        }
        .block-bump-once { animation: blockBump 380ms ease-out 1; }

        /* Ultimate recibido: flash llamativo */
        @keyframes ultimateFlash {
          0% { box-shadow: inset 0 0 0 rgba(0,0,0,0) }
          15% { box-shadow: inset 0 0 130px rgba(255,220,120,.55), 0 0 36px rgba(150,80,255,.35) }
          45% { box-shadow: inset 0 0 90px rgba(255,180,90,.35), 0 0 20px rgba(150,80,255,.25) }
          100% { box-shadow: inset 0 0 0 rgba(0,0,0,0) }
        }
      `}</style>

      <div className="h-9 flex items-center justify-center text-[11px] font-extrabold text-white tracking-wide bg-gradient-to-r from-[rgba(120,120,255,.16)] via-[rgba(120,120,255,.25)] to-[rgba(120,120,255,.16)] border-b border-[var(--border)] uppercase">
        Level {level}
      </div>

      <div className="h-[160px] flex items-center justify-center relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-28 h-28 object-cover rounded-xl opacity-95 ring-1 ring-white/[.06]"
          />
        ) : (
          <User className="w-16 h-16 text-gray-400" />
        )}

        {/* Flash por BLOCK (más ripple) */}
        {blockFlashKey > 0 && (
          <>
            <div
              key={`block-${blockFlashKey}`}
              className="absolute inset-0 pointer-events-none"
              style={{
                animation: "blockFlash 650ms ease-out 1",
                background:
                  "radial-gradient(ellipse at center, rgba(120,180,255,.20) 0%, rgba(40,110,200,.10) 40%, rgba(0,0,0,0) 70%)",
                mixBlendMode: "screen",
              }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "9999px",
                  border: "2px solid rgba(120,180,255,.55)",
                  animation: "shieldRipple 520ms ease-out 1",
                }}
              />
            </div>
          </>
        )}

        {/* Flash por ULTIMATE recibido */}
        {ultFlashKey > 0 && (
          <div
            key={`ult-${ultFlashKey}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: "ultimateFlash 750ms ease-out 1",
              background:
                "radial-gradient(ellipse at center, rgba(255,225,140,.20) 0%, rgba(160,80,255,.12) 45%, rgba(0,0,0,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Flash por CRIT recibido (sin puntito) */}
        {hitShakeKey > 0 && (
          <div
            key={`crit-${hitShakeKey}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: "critCardFlash 900ms ease-out 1",
              background:
                "radial-gradient(ellipse at center, rgba(255,70,80,.18) 0%, rgba(255,0,20,.08) 40%, rgba(0,0,0,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,.55)]" />
      </div>

      <div className="px-3 py-2 border-t border-[var(--border)] bg-[rgba(255,255,255,.03)] text-center">
        <div
          className="text-white font-black truncate text-base tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,.2)]"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
          title={name}
        >
          {name}
        </div>
      </div>

      {/* Passive / Ultimate (compact) */}
      <div className="px-3 pt-1">
        <SkillBadge
          title="Passive"
          text={passiveText ?? "—"}
          kind="passive"
          pulseKey={passivePulseKey}
          fate={stats["fate"] ?? 0}
        />
        <SkillBadge
          title="Ultimate"
          text={ultimateText ?? "—"}
          kind="ultimate"
          pulseKey={ultimatePulseKey}
          fate={stats["fate"] ?? 0}
        />
      </div>

      {/* HP BAR con gradiente más oscuro */}
      <div className="mt-[2px]">
        <div
          className={`h-7 border-y border-[var(--border)] bg-[rgba(255,255,255,.03)] overflow-hidden relative ${hpGlowKey ? "hp-glow-once" : ""}`}
          key={hpGlowKey}
        >
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, rgba(45,8,12,.95) 0%, rgba(85,14,20,.95) 40%, rgba(120,18,26,.95) 70%, rgba(150,22,30,.98) 100%)",
              boxShadow:
                "0 0 6px rgba(180,40,40,.28), inset 0 0 8px rgba(0,0,0,.75)",
              filter: "brightness(.88)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/95 font-semibold tracking-wide">
            {asInt(hp)} / {asInt(maxHP)} HP
          </div>
        </div>
      </div>

      <div className="pb-3 px-3 pt-2">
        <SmallMetricsCard map={stats} />
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.07),0_0_28px_rgba(120,120,255,.12)]" />
    </div>
  );
}

/* ───── Combat Log ───── */
function EmphasizeNumbers({ text }: { text: string }) {
  const parts = text.split(/(\d+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? (
          <b key={i} className="text-white font-extrabold">
            {p}
          </b>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function CombatLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  const chip = (k: LogKind) => {
    const map: Record<
      LogKind,
      { label: string; cls: string; icon: JSX.Element }
    > = {
      hit: {
        label: "HIT",
        cls: "bg-zinc-700/40 text-zinc-200 border-zinc-500/30",
        icon: <SwordIcon className="w-3.5 h-3.5" />,
      },
      crit: {
        label: "CRITICAL!",
        cls: "bg-red-600/30 text-red-200 border-red-500/40",
        icon: <Skull className="w-3.5 h-3.5" />,
      },
      block: {
        label: "BLOCKED!",
        cls: "bg-sky-600/30 text-sky-200 border-sky-500/40",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      },
      miss: {
        label: "MISSED!",
        cls: "bg-zinc-600/30 text-zinc-200 border-zinc-500/40",
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      passive: {
        label: "PASSIVE",
        cls: "bg-indigo-600/25 text-indigo-200 border-indigo-500/40",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      ultimate: {
        label: "ULTIMATE",
        cls: "bg-amber-600/25 text-amber-200 border-amber-500/40",
        icon: <Crown className="w-3.5 h-3.5" />,
      },
      dot: {
        label: "DOT",
        cls: "bg-orange-600/25 text-orange-200 border-orange-500/40",
        icon: <Flame className="w-3.5 h-3.5" />,
      },
    };
    return map[k];
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] shadow-lg overflow-hidden">
      <div className="px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)] flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-[var(--accent)]" />
        Combat Log
      </div>
      <div ref={ref} className="max-h-56 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {entries.map((e, i) => {
            const c = chip(e.kind);
            return (
              <li
                key={`${e.turn}-${i}`}
                className="px-3 py-2 flex items-center gap-2 text-[12px]"
              >
                <span
                  className={`inline-flex items-center gap-1 px-2 h-5 rounded border ${c.cls}`}
                  title={e.kind}
                >
                  {c.icon}
                  <strong className="tracking-wide">{c.label}</strong>
                </span>
                <span className="text-zinc-500">T{e.turn}</span>
                <span
                  className={`${
                    e.kind === "crit"
                      ? "text-red-200"
                      : e.kind === "miss"
                        ? "text-zinc-300"
                        : e.kind === "block"
                          ? "text-sky-200"
                          : e.kind === "ultimate"
                            ? "text-amber-200"
                            : e.kind === "passive"
                              ? "text-indigo-200"
                              : "text-zinc-200"
                  }`}
                >
                  <EmphasizeNumbers text={e.text} />
                </span>
              </li>
            );
          })}
          {entries.length === 0 && (
            <li className="px-3 py-4 text-center text-[12px] text-zinc-500">
              No events yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* ───── rewards ───── */
function RewardsPanel({ rewards }: { rewards: Reward }) {
  if (!rewards) return null;
  const gold = asInt(rewards.gold ?? 0);
  const xp = asInt(rewards.xp ?? 0);
  const items = Array.isArray(rewards.items) ? rewards.items : [];

  return (
    <div className="relative w-[min(88vw,270px)] max-w-[370px] mx-auto">
      <style>{`
        @keyframes pop { 
          0% { transform: scale(.9); opacity: .1 } 
          50% { transform: scale(1.02); opacity: 1 } 
          100% { transform: scale(1); opacity: 1 } 
        }
        .pop { animation: pop .24s ease-out both; }
      `}</style>
      <div className="pop rounded-2xl border border-[var(--border)] bg-[rgba(18,18,28,.95)] p-4 shadow-[0_10px_26px_rgba(0,0,0,.45),0_0_16px_rgba(120,120,255,.18),inset_0_1px_0_rgba(255,255,255,.04)]">
        <div className="flex items-center gap-3 mb-2 justify-center">
          <Crown className="w-5 h-5 text-amber-300" />
          <div className="text-[12px] font-semibold text-zinc-200 uppercase tracking-wide">
            Rewards
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3 flex items-center gap-3">
            <Coins className="w-5 h-5" />
            <div>
              <div className="text-[11px] text-zinc-400">Gold</div>
              <div className="text-white font-bold tabular-nums">{gold}</div>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3 flex items-center gap-3">
            <Star className="w-5 h-5" />
            <div>
              <div className="text-[11px] text-zinc-400">Experience</div>
              <div className="text-white font-bold tabular-nums">{xp}</div>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4" />
              <div className="text-[11px] text-zinc-400">Items</div>
            </div>
            {items.length ? (
              <ul className="text-[12px] text-zinc-200 space-y-1">
                {items.map((it, i) => (
                  <li key={`${it.name}-${i}`} className="flex justify-between">
                    <span>{it.name}</span>
                    <span className="text-zinc-400">x{asInt(it.qty ?? 1)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[12px] text-zinc-500">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── ladder list ───── */
type OppRowProps = {
  index: number;
  opp: Opponent;
  active: boolean;
  onSelect: () => void;
};
function LadderRow({ index, opp, active, onSelect }: OppRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`grid grid-cols-[64px_minmax(0,1fr)_120px_140px_80px_80px] items-center w-full px-3 py-2 text-left text-[13px]
                  border-b border-[var(--border)] hover:bg-white/[.05] transition ${active ? "bg-white/[.08]" : ""}`}
    >
      <span className="text-zinc-400 tabular-nums">
        {index.toString().padStart(2, "0")}
      </span>
      <div className="truncate text-zinc-200 font-medium">{opp.name}</div>
      <span className="text-zinc-400">—</span>
      <span className="text-zinc-300 truncate">{opp.className ?? "—"}</span>
      <span className="text-zinc-200 tabular-nums">Lv {opp.level}</span>
      <span className="text-zinc-300 tabular-nums text-right">
        {opp.honor != null ? opp.honor : "—"}
      </span>
    </button>
  );
}
function LadderList({
  opponents,
  selectedId,
  setSelectedId,
  q,
  setQ,
}: {
  opponents: Opponent[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  q: string;
  setQ: (s: string) => void;
}) {
  const filtered = (opponents ?? []).filter((o) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      o.name.toLowerCase().includes(s) ||
      (o.className ?? "").toLowerCase().includes(s) ||
      (o.clanName ?? "").toLowerCase().includes(s) ||
      String(o.level).includes(s) ||
      String(o.honor ?? "").includes(s)
    );
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] shadow-[0_10px_26px_rgba(0,0,0,.45),0_0_16px_rgba(120,120,255,.12),inset_0_1px_0_rgba(255,255,255,.04)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div
          className="text-sm text-white/90 font-semibold tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Blood or Glory
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm text-white hover:border-[var(--accent-weak)] focus:outline-none w-40"
        />
      </div>

      <div className="grid grid-cols-[64px_minmax(0,1fr)_120px_140px_80px_80px] px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)]">
        <span>Position</span>
        <span>Name</span>
        <span>Clan</span>
        <span>Class</span>
        <span>Level</span>
        <span className="text-right">Honor</span>
      </div>

      <div className="max-h-[40vh] overflow-y-auto">
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
            No results
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── stamina bar ───── */
function BigStaminaBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((current / Math.max(1, max)) * 100))
  );
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[60] w-[min(92vw,560px)] rounded-lg border border-[rgba(90,110,160,.28)] bg-[linear-gradient(180deg,rgba(12,14,20,.92),rgba(8,10,16,.95))] shadow-[0_8px_22px_rgba(0,0,0,.55),0_0_14px_rgba(100,120,180,.16),inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="px-2.5 py-1.5 flex items-center gap-2.5">
        <div className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-[rgba(100,120,180,.12)] border border-[rgba(90,110,160,.28)]">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="flex-1 h-3 rounded border border-[rgba(90,110,160,.28)] relative overflow-hidden bg-[rgba(24,28,40,.55)]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1f2a44] via-[#273352] to-[#2f3b63] shadow-[0_0_8px_rgba(100,120,180,.28)] transition-[width] duration-600 ease-out"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-200/90 text-[10px] font-semibold tracking-wide tabular-nums">
              {asInt(current)} / {asInt(max)} STAMINA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── main page ───── */
export default function Arena() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, staminaCurrent, staminaMax, setStamina } = useAuth();

  const client = useMemo(() => {
    const i = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    i.interceptors.request.use((cfg) => {
      if (token)
        (cfg.headers as any) = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        };
      return cfg;
    });
    return i;
  }, [token]);

  const [view, setView] = useState<ViewMode>("select");
  const [centerLabel, setCenterLabel] = useState<
    "VS" | "WIN" | "LOSE" | "DRAW"
  >("VS");
  const [shakeKey, setShakeKey] = useState(0);
  const [duelResult, setDuelResult] = useState<DuelResult>(null);
  const [rewards, setRewards] = useState<Reward>(null);

  const [me, setMe] = useState<CharacterApi | null>(null);
  const [prog, setProg] = useState<ProgressionApi | null>(null);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOpp = opponents.find((o) => o.id === selectedId) || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // HP + combat
  const [hpMe, setHpMe] = useState(0);
  const [hpOpp, setHpOpp] = useState(0);
  const [combatLog, setCombatLog] = useState<LogEntry[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const timers = useRef<number[]>([]);

  // pulses
  const [pulseLeftPassive, setPulseLeftPassive] = useState(0);
  const [pulseLeftUlt, setPulseLeftUlt] = useState(0);
  const [pulseRightPassive, setPulseRightPassive] = useState(0);
  const [pulseRightUlt, setPulseRightUlt] = useState(0);
  const [hpGlowLeft, setHpGlowLeft] = useState(0);
  const [hpGlowRight, setHpGlowRight] = useState(0);

  // FX toggles
  const [blockFlashLeft, setBlockFlashLeft] = useState(0);
  const [blockFlashRight, setBlockFlashRight] = useState(0);
  const [ultFlashLeft, setUltFlashLeft] = useState(0);
  const [ultFlashRight, setUltFlashRight] = useState(0);
  const [ultShakeLeft, setUltShakeLeft] = useState(0);
  const [ultShakeRight, setUltShakeRight] = useState(0);
  const [hitShakeLeft, setHitShakeLeft] = useState(0);
  const [hitShakeRight, setHitShakeRight] = useState(0);
  const [blockBumpLeft, setBlockBumpLeft] = useState(0);
  const [blockBumpRight, setBlockBumpRight] = useState(0);

  // skill texts
  const [myPassiveText, setMyPassiveText] = useState<string | null>(null);
  const [myUltText, setMyUltText] = useState<string | null>(null);
  const [oppPassiveText, setOppPassiveText] = useState<string | null>(null);
  const [oppUltText, setOppUltText] = useState<string | null>(null);

  // damage ranges
  const [myDmgRange, setMyDmgRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [oppDmgRange, setOppDmgRange] = useState<{
    min: number;
    max: number;
  } | null>(null);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  async function refillStamina() {
    try {
      const s = await client.get("/stamina");
      const snap = extractStamina(s.data);
      try {
        const setRes = await client.post("/stamina/admin/set", {
          value: snap.max,
        });
        const upd = extractStamina(setRes.data);
        setStamina(upd.current, upd.max);
        return;
      } catch {}
      setStamina(snap.max, snap.max);
    } catch {
      setStamina(staminaMax || 100, staminaMax || 100);
    }
  }

  // initial load
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<ProgressionApi>("/character/progression"),
      client.get<any>("/arena/opponents?size=24&levelSpread=20"),
      client.get<any>("/stamina"),
    ])
      .then(([meRes, progRes, oppRes, stamRes]) => {
        if (!mounted) return;

        setMe(meRes.data);
        setProg(progRes.data);

        const rawList =
          oppRes.data?.opponents ??
          oppRes.data?.rivals ??
          (Array.isArray(oppRes.data) ? oppRes.data : []);
        const list: Opponent[] = Array.isArray(rawList)
          ? rawList.map((raw: any) => ({
              id: String(raw?.userId ?? raw?.id ?? raw?._id ?? ""),
              name: String(raw?.name ?? raw?.username ?? "—"),
              level: Number(raw?.level ?? 0),
              className: raw?.className ?? raw?.class?.name ?? undefined,
              stats: { ...(raw?.stats ?? {}) },
              combatStats: {
                ...(raw?.combatStats ?? {}),
                minDamage:
                  raw?.combatStats?.minDamage ??
                  raw?.combatStats?.damageMin ??
                  raw?.combatStats?.min ??
                  undefined,
                maxDamage:
                  raw?.combatStats?.maxDamage ??
                  raw?.combatStats?.damageMax ??
                  raw?.combatStats?.max ??
                  undefined,
                criticalChance:
                  raw?.combatStats?.criticalChance ??
                  raw?.combatStats?.critChance ??
                  raw?.combatStats?.crit ??
                  undefined,
                blockChance:
                  raw?.combatStats?.blockChance ??
                  raw?.combatStats?.block ??
                  undefined,
                evasion:
                  raw?.combatStats?.evasion ??
                  raw?.combatStats?.evade ??
                  raw?.combatStats?.evasionChance ??
                  raw?.combatStats?.evadeChance ??
                  raw?.combatStats?.dodge ??
                  raw?.combatStats?.dodgeChance ??
                  undefined,
                attackPower: raw?.combatStats?.attackPower,
              },
              maxHP: Number(raw?.maxHP ?? raw?.combatStats?.maxHP ?? 0),
              avatarUrl: raw?.avatarUrl ?? null,
              passiveDefaultSkill: null,
              ultimateSkill: null,
              clanName:
                raw?.clanName ?? raw?.clan?.name ?? raw?.guild?.name ?? null,
              honor: raw?.honor ?? raw?.rating ?? null,
            }))
          : [];

        setOpponents(list);
        setSelectedId((prev) => prev ?? (list[0]?.id as string) ?? null);

        const snap = extractStamina(stamRes.data);
        setStamina(snap.current, snap.max);

        if (view !== "duel") {
          setCenterLabel("VS");
          setDuelResult(null);
          setRewards(null);
          setCombatLog([]);
          setMyDmgRange(null);
          setOppDmgRange(null);
          setMyPassiveText(null);
          setMyUltText(null);
          setOppPassiveText(null);
          setOppUltText(null);
        }
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
      clearTimers();
    };
  }, [client]);

  const myName = (me as any)?.username ?? (me as any)?.name ?? "—";
  const myLevel = prog?.level ?? me?.level ?? "—";
  const myMaxHP = asInt(me?.combatStats?.maxHP ?? 0);

  useEffect(() => {
    clearTimers();
    if (view === "duel") {
      setHpMe(myMaxHP);
      setHpOpp(asInt(selectedOpp?.maxHP ?? 0));
      setCombatLog([]);
      setPulseLeftPassive(0);
      setPulseLeftUlt(0);
      setPulseRightPassive(0);
      setPulseRightUlt(0);
      setHpGlowLeft(0);
      setHpGlowRight(0);
      setBlockFlashLeft(0);
      setBlockFlashRight(0);
      setUltFlashLeft(0);
      setUltFlashRight(0);
      setUltShakeLeft(0);
      setUltShakeRight(0);
      setHitShakeLeft(0);
      setHitShakeRight(0);
      setBlockBumpLeft(0);
      setBlockBumpRight(0);

      setMyPassiveText("—");
      setMyUltText("—");
      setOppPassiveText("—");
      setOppUltText("—");
      setMyDmgRange(null);
      setOppDmgRange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId, myMaxHP, selectedOpp?.maxHP]);

  const isPlayerRole = (role: ActorRole, turn: number) =>
    turn % 2 === 1 ? role === "attacker" : role === "defender";

  /* ---------- play timeline ---------- */
  function playScheduled(timeline: TimelineBE[]) {
    const schedule = buildAnimationSchedule(timeline);
    if (!schedule.events.length) return 0;

    // HP locals
    let playerHP = myMaxHP;
    let enemyHP = asInt(selectedOpp?.maxHP || 0);
    setHpMe(playerHP);
    setHpOpp(enemyHP);

    schedule.events.forEach((ev) => {
      const t = window.setTimeout(() => {
        const p = ev.payload;
        const turn = p.turn;
        const actorIsPlayer = isPlayerRole(ev.role, turn);
        const who = actorIsPlayer ? myName : (selectedOpp?.name ?? "—");
        const tgt = actorIsPlayer ? (selectedOpp?.name ?? "—") : myName;
        const dmg = Math.max(0, asInt(p.damage ?? 0));

        const pushLog = (kind: LogKind, text: string) =>
          setCombatLog((prev) =>
            prev.concat({
              turn,
              kind,
              text,
              actor: actorIsPlayer ? "me" : "opp",
              value: dmg,
            })
          );

        if (ev.type === "passive_proc") {
          if (actorIsPlayer) {
            setPulseLeftPassive((x) => x + 1);
            setHpGlowLeft((x) => x + 1);
          } else {
            setPulseRightPassive((x) => x + 1);
            setHpGlowRight((x) => x + 1);
          }
          const passiveName = p.ability?.name ?? "Passive";
          pushLog(
            "passive",
            dmg > 0
              ? `${who} triggers ${passiveName} for ${dmg}.`
              : `${who} triggers ${passiveName}.`
          );
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          return;
        }

        if (ev.type === "ultimate_cast") {
          if (actorIsPlayer) {
            setPulseLeftUlt((x) => x + 1);
            setHpGlowLeft((x) => x + 1);
            setUltFlashRight((x) => x + 1);
            setUltShakeRight((x) => x + 1);
          } else {
            setPulseRightUlt((x) => x + 1);
            setHpGlowRight((x) => x + 1);
            setUltFlashLeft((x) => x + 1);
            setUltShakeLeft((x) => x + 1);
          }
          const ultName = p.ability?.name ?? "Ultimate";
          pushLog(
            "ultimate",
            dmg > 0
              ? `${who} unleashes ${ultName} on ${tgt} for ${dmg}!`
              : `${who} unleashes ${ultName}.`
          );
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          return;
        }

        if (ev.type === "dot_tick") {
          if (dmg > 0) {
            if (actorIsPlayer) {
              enemyHP = Math.max(0, enemyHP - dmg);
              pushLog(
                "dot",
                `${who} deals damage over time to ${tgt} for ${dmg}.`
              );
            } else {
              playerHP = Math.max(0, playerHP - dmg);
              pushLog(
                "dot",
                `${who} deals damage over time to ${tgt} for ${dmg}.`
              );
            }
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          } else {
            pushLog("dot", `${who} applies a damage-over-time effect.`);
          }
          return;
        }

        if (ev.type === "impact_crit") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          // shake + flash en el objetivo (sin punto central)
          if (actorIsPlayer) setHitShakeRight((k) => k + 1);
          else setHitShakeLeft((k) => k + 1);
          setShakeKey((k) => k + 1);
          pushLog("crit", `${who} lands a CRITICAL! on ${tgt} for ${dmg}!`);
          return;
        }

        if (ev.type === "impact_block") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          // flash + bump/ripple en quien bloquea
          if (actorIsPlayer) {
            setBlockFlashRight((x) => x + 1);
            setBlockBumpRight((x) => x + 1);
          } else {
            setBlockFlashLeft((x) => x + 1);
            setBlockBumpLeft((x) => x + 1);
          }
          pushLog(
            "block",
            `BLOCKED! ${tgt} stops ${who}'s strike (only ${dmg} through).`
          );
          return;
        }

        if (ev.type === "impact_miss") {
          pushLog("miss", `MISSED! ${who} fails to connect.`);
          return;
        }

        if (ev.type === "impact_hit") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          pushLog("hit", `${who} hits ${tgt} for ${dmg}.`);
          return;
        }
      }, ev.startMs);
      timers.current.push(t);
    });

    return schedule.totalMs;
  }

  async function startChallenge() {
    if (!selectedOpp || isFighting) return;
    if ((staminaCurrent ?? 0) < PVP_STAMINA_COST) {
      setErr(`You need ${PVP_STAMINA_COST} stamina to attack.`);
      return;
    }

    setIsFighting(true);
    setErr(null);

    setView("duel");
    setCenterLabel("VS");
    setDuelResult(null);
    setRewards(null);
    setCombatLog([]);
    setHpMe(myMaxHP);
    setHpOpp(asInt(selectedOpp.maxHP));
    setPulseLeftPassive(0);
    setPulseLeftUlt(0);
    setPulseRightPassive(0);
    setPulseRightUlt(0);
    setHpGlowLeft(0);
    setHpGlowRight(0);
    setBlockFlashLeft(0);
    setBlockFlashRight(0);
    setUltFlashLeft(0);
    setUltFlashRight(0);
    setUltShakeLeft(0);
    setUltShakeRight(0);
    setHitShakeLeft(0);
    setHitShakeRight(0);
    setBlockBumpLeft(0);
    setBlockBumpRight(0);
    setMyPassiveText("—");
    setMyUltText("—");
    setOppPassiveText("—");
    setOppUltText("—");
    setMyDmgRange(null);
    setOppDmgRange(null);

    try {
      const crt = await client.post("/arena/challenges", {
        opponentId: selectedOpp.id,
      });

      // Sincronizar stamina inmediatamente si el backend la descuenta aquí
      try {
        const s0 = await client.get("/stamina");
        const snap0 = extractStamina(s0.data);
        setStamina(snap0.current, snap0.max);
      } catch {}

      const matchId: string | undefined = crt?.data?.matchId;

      const ca = crt?.data?.attacker;
      const cd = crt?.data?.defender;
      if (ca?.combatStats) {
        setMyDmgRange({
          min: asInt(ca.combatStats.minDamage ?? ca.combatStats.damageMin ?? 0),
          max: asInt(ca.combatStats.maxDamage ?? ca.combatStats.damageMax ?? 0),
        });
      }
      if (cd?.combatStats) {
        setOppDmgRange({
          min: asInt(cd.combatStats.minDamage ?? cd.combatStats.damageMin ?? 0),
          max: asInt(cd.combatStats.maxDamage ?? cd.combatStats.damageMax ?? 0),
        });
      }
      setMyPassiveText(skillText(ca?.passiveDefaultSkill) ?? "—");
      setMyUltText(skillText(ca?.ultimateSkill) ?? "—");
      setOppPassiveText(skillText(cd?.passiveDefaultSkill) ?? "—");
      setOppUltText(skillText(cd?.ultimateSkill) ?? "—");

      if (!matchId) {
        setCenterLabel("DRAW");
        setDuelResult({
          outcome: "draw",
          summary: "Match could not be created (invalid id).",
        });
        try {
          const s = await client.get("/stamina");
          const snap = extractStamina(s.data);
          setStamina(snap.current, snap.max);
        } catch {}
        setIsFighting(false);
        return;
      }

      let pvp: any;
      try {
        pvp = await client.post("/combat/resolve", { matchId });
      } catch {
        try {
          pvp = await client.post("/combat/simulate", { matchId });
        } catch {
          const prev = await client.get("/combat/simulate", {
            params: { matchId },
          });
          pvp = {
            data: {
              outcome: prev.data?.outcome ?? "draw",
              timeline: prev.data?.timeline ?? prev.data?.snapshots ?? [],
              rewards: null,
              __preview: true,
              attacker: prev.data?.attacker,
              defender: prev.data?.defender,
            },
          };
        }
      }

      const a = pvp.data?.attacker;
      const d = pvp.data?.defender;
      if (a?.combatStats) {
        setMyDmgRange({
          min: asInt(a.combatStats.minDamage ?? a.combatStats.damageMin ?? 0),
          max: asInt(a.combatStats.maxDamage ?? a.combatStats.damageMax ?? 0),
        });
      }
      if (d?.combatStats) {
        setOppDmgRange({
          min: asInt(d.combatStats.minDamage ?? d.combatStats.damageMin ?? 0),
          max: asInt(d.combatStats.maxDamage ?? d.combatStats.damageMax ?? 0),
        });
      }
      if (a?.passiveDefaultSkill || a?.ultimateSkill) {
        setMyPassiveText(skillText(a?.passiveDefaultSkill) ?? "—");
        setMyUltText(skillText(a?.ultimateSkill) ?? "—");
      }
      if (d?.passiveDefaultSkill || d?.ultimateSkill) {
        setOppPassiveText(skillText(d?.passiveDefaultSkill) ?? "—");
        setOppUltText(skillText(d?.ultimateSkill) ?? "—");
      }

      const outcome = (pvp.data?.outcome as "win" | "lose" | "draw") ?? "draw";
      const rawTimeline: TimelineBE[] =
        (pvp.data?.timeline as TimelineBE[]) ??
        (pvp.data?.snapshots as TimelineBE[]) ??
        [];

      const total = playScheduled(rawTimeline) ?? 0;
      await new Promise((r) => setTimeout(r, total + 140));

      setCenterLabel(
        outcome === "win" ? "WIN" : outcome === "lose" ? "LOSE" : "DRAW"
      );
      setDuelResult({
        outcome,
        summary:
          outcome === "win"
            ? "You have won."
            : outcome === "lose"
              ? "You were defeated."
              : "Draw.",
      });

      const rw: Reward = pvp.data?.rewards
        ? {
            gold:
              pvp.data.rewards.goldGained ??
              pvp.data.rewards.gold ??
              pvp.data.rewards.coins ??
              0,
            xp:
              pvp.data.rewards.xpGained ??
              pvp.data.rewards.xp ??
              pvp.data.rewards.experience ??
              0,
            honor:
              pvp.data.rewards.honorDelta ??
              pvp.data.rewards.honor ??
              undefined,
            items: Array.isArray(pvp.data.rewards.items)
              ? pvp.data.rewards.items.map((it: any) => ({
                  name: String(it.name ?? it.itemName ?? "Item"),
                  qty: asInt(it.qty ?? it.quantity ?? 1),
                }))
              : [],
          }
        : null;
      setRewards(rw);

      try {
        const s = await client.get("/stamina");
        const snap = extractStamina(s.data);
        setStamina(snap.current, snap.max);
      } catch {}
      try {
        const meRes = await client.get<CharacterApi>("/character/me");
        setMe(meRes.data);
      } catch {}
    } catch (e: any) {
      console.error(e);
      setCenterLabel("DRAW");
      setDuelResult({
        outcome: "draw",
        summary: "Could not resolve combat (visual fallback).",
      });
      try {
        const s = await client.get("/stamina");
        const snap = extractStamina(s.data);
        setStamina(snap.current, snap.max);
      } catch {}
    } finally {
      setIsFighting(false);
    }
  }

  const NAV_ITEMS = [
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Legal notice", href: "/legal/notice" },
    { label: "Forum", href: "/forum" },
    { label: "Support", href: "/support" },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

  const canAttack = (staminaCurrent ?? 0) >= PVP_STAMINA_COST;

  return (
    <div className="min-h-screen text-sm leading-tight bg-[var(--bg)] text-[13px]">
      <style>{`
        @keyframes shake { 
          0%,100% { transform: translateY(0) }
          25% { transform: translateY(-2px) }
          50% { transform: translateY(1px) }
          75% { transform: translateY(-1px) }
        }
        .shake-once { animation: shake 260ms ease-out 1 }
      `}</style>

      {/* Navbar */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3">
        <header className="relative z-10 dark-panel mt-3 mb-3 p-3 md:p-4 flex justify-between items-center rounded-lg border border-[var(--border)]">
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
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3 pb-24">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 pb-4">
          {/* Sidebar */}
          <aside className="lg:col-span-2 dark-panel p-2 space-y-1 rounded-lg shadow-lg border border-[var(--border)]">
            {[
              {
                id: "character",
                label: "CHARACTER",
                icon: User,
                href: "/game",
              },
              { id: "arena", label: "ARENA", icon: Swords, href: "/arena" },
              {
                id: "options",
                label: "OPTIONS",
                icon: Settings,
                href: "/options",
                disabled: true,
              },
            ].map((item: any) => {
              const Icon = item.icon;
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

          {/* Main */}
          <main className="lg:col-span-10 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3 md:p-4 space-y-4 shadow-lg overflow-visible">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-white font-semibold text-lg">Arena</h2>

                {/* Refill stamina (debug) */}
                <button
                  onClick={refillStamina}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent-weak)] text-[12px] text-zinc-200"
                  title="Refill stamina to 100% (debug)"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refill
                </button>
              </div>

              {loading && (
                <div className="card-muted p-3 text-xs stat-text-muted">
                  Loading…
                </div>
              )}

              {err && !loading && (
                <div className="card-muted p-3 text-xs text-red-400">{err}</div>
              )}

              {/* LIST */}
              {!loading && view === "select" && (
                <div className="space-y-3">
                  <LadderList
                    opponents={opponents}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    q={q}
                    setQ={setQ}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={startChallenge}
                      disabled={!selectedOpp || !canAttack || isFighting}
                      className="px-6 py-2 rounded-xl bg-[var(--accent)]/80 hover:bg-[var(--accent)] disabled:opacity-50 text-white font-semibold shadow-[0_0_10px_rgba(120,120,255,.25)]"
                      title={
                        !canAttack
                          ? `You need ${PVP_STAMINA_COST} stamina`
                          : `Start fight`
                      }
                    >
                      {isFighting ? "Preparing..." : "Attack"}
                    </button>
                    {!canAttack && (
                      <div className="text-[11px] text-zinc-400">
                        You need {PVP_STAMINA_COST} stamina to attack.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DUEL */}
              {!loading && view === "duel" && (
                <div className="flex flex-col items-center gap-5">
                  {/* Portraits */}
                  <div className="w-full max-w-[1080px] mx-auto flex items-start justify-center gap-8">
                    {/* Player */}
                    <BattlePortrait
                      side="left"
                      widthClass="w-[320px]"
                      name={myName}
                      level={myLevel}
                      hp={hpMe}
                      maxHP={myMaxHP}
                      avatarUrl={me?.avatarUrl ?? null}
                      passiveText={myPassiveText ?? "—"}
                      ultimateText={myUltText ?? "—"}
                      passivePulseKey={pulseLeftPassive}
                      ultimatePulseKey={pulseLeftUlt}
                      hpGlowKey={hpGlowLeft}
                      blockFlashKey={0}
                      ultFlashKey={ultFlashLeft}
                      ultShakeKey={ultShakeLeft}
                      hitShakeKey={hitShakeLeft}
                      blockBumpKey={blockBumpLeft}
                      stats={{
                        damageMin:
                          myDmgRange?.min ?? (me as any)?.uiDamageMin ?? 0,
                        damageMax:
                          myDmgRange?.max ?? (me as any)?.uiDamageMax ?? 0,
                        attackPower: me?.combatStats?.attackPower,
                        blockChance:
                          (me?.combatStats as any)?.blockChance ??
                          (me?.combatStats as any)?.block,
                        criticalChance:
                          (me?.combatStats as any)?.criticalChance ??
                          (me?.combatStats as any)?.critChance ??
                          (me?.combatStats as any)?.crit,
                        evasion:
                          (me?.combatStats as any)?.evasion ??
                          (me?.combatStats as any)?.evade ??
                          (me?.combatStats as any)?.evasionChance ??
                          (me?.combatStats as any)?.evadeChance ??
                          (me?.combatStats as any)?.dodge ??
                          (me?.combatStats as any)?.dodgeChance ??
                          0,
                        fate: (me as any)?.stats?.fate ?? 0,
                      }}
                    />

                    {/* VS + Rewards */}
                    <div className="min-w-[220px] flex flex-col items-center justify-start select-none gap-3 pt-4">
                      <div
                        className={`text-6xl font-black ${
                          centerLabel === "WIN"
                            ? "text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,.7)]"
                            : centerLabel === "LOSE"
                              ? "text-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,.7)]"
                              : centerLabel === "DRAW"
                                ? "text-zinc-300 drop-shadow-[0_0_12px_rgba(255,255,255,.5)]"
                                : "text-[var(--accent)] drop-shadow-[0_0_14px_rgba(120,120,255,0.6)]"
                        } shake-once`}
                        style={{ fontFamily: "'Cinzel Decorative', serif" }}
                        key={shakeKey}
                      >
                        <span
                          className={
                            centerLabel === "VS" ? "animate-pulse" : ""
                          }
                        >
                          {centerLabel}
                        </span>
                      </div>

                      {duelResult && (
                        <div className="text-center text-[12px] text-zinc-300 max-w-[360px]">
                          {duelResult.summary}
                        </div>
                      )}

                      {duelResult && rewards && (
                        <RewardsPanel rewards={rewards} />
                      )}

                      {duelResult && (
                        <button
                          type="button"
                          onClick={() => {
                            clearTimers();
                            setView("select");
                            setCenterLabel("VS");
                            setCombatLog([]);
                            setRewards(null);
                          }}
                          className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent-weak)] text-[12px] text-zinc-200 bg-white/[.02]"
                          title="Back to list"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Back
                        </button>
                      )}
                    </div>

                    {/* Enemy */}
                    <BattlePortrait
                      side="right"
                      widthClass="w-[320px]"
                      name={selectedOpp?.name ?? "—"}
                      level={selectedOpp?.level ?? "—"}
                      hp={hpOpp}
                      maxHP={selectedOpp?.maxHP ?? 0}
                      avatarUrl={selectedOpp?.avatarUrl ?? null}
                      passiveText={oppPassiveText ?? "—"}
                      ultimateText={oppUltText ?? "—"}
                      passivePulseKey={pulseRightPassive}
                      ultimatePulseKey={pulseRightUlt}
                      hpGlowKey={hpGlowRight}
                      blockFlashKey={blockFlashRight}
                      ultFlashKey={ultFlashRight}
                      ultShakeKey={ultShakeRight}
                      hitShakeKey={hitShakeRight}
                      blockBumpKey={blockBumpRight}
                      stats={{
                        damageMin:
                          oppDmgRange?.min ??
                          (selectedOpp?.combatStats &&
                            (selectedOpp.combatStats as any)?.minDamage) ??
                          (selectedOpp?.combatStats &&
                            (selectedOpp.combatStats as any)?.damageMin) ??
                          0,
                        damageMax:
                          oppDmgRange?.max ??
                          (selectedOpp?.combatStats &&
                            (selectedOpp.combatStats as any)?.maxDamage) ??
                          (selectedOpp?.combatStats &&
                            (selectedOpp.combatStats as any)?.damageMax) ??
                          0,
                        attackPower: (selectedOpp?.combatStats as any)
                          ?.attackPower,
                        blockChance:
                          (selectedOpp?.combatStats as any)?.blockChance ??
                          (selectedOpp?.combatStats as any)?.block,
                        criticalChance:
                          (selectedOpp?.combatStats as any)?.criticalChance ??
                          (selectedOpp?.combatStats as any)?.critChance ??
                          (selectedOpp?.combatStats as any)?.crit,
                        evasion:
                          (selectedOpp?.combatStats as any)?.evasion ??
                          (selectedOpp?.combatStats as any)?.evade ??
                          (selectedOpp?.combatStats as any)?.evasionChance ??
                          (selectedOpp?.combatStats as any)?.evadeChance ??
                          (selectedOpp?.combatStats as any)?.dodge ??
                          (selectedOpp?.combatStats as any)?.dodgeChance ??
                          0,
                        fate: (selectedOpp as any)?.stats?.fate ?? 0,
                      }}
                    />
                  </div>

                  {/* Combat Log */}
                  <div className="w-full max-w-[980px] mx-auto flex flex-col items-center">
                    <div className="w-full">
                      <CombatLog entries={combatLog} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <BigStaminaBar current={staminaCurrent ?? 0} max={staminaMax ?? 10} />
    </div>
  );
}
