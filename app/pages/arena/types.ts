// src/pages/Arena/types.ts

import type { CombatStats, CharacterApi } from "../../../types/character";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";
export const PVP_STAMINA_COST = Number(import.meta.env.VITE_PVP_STAMINA_COST ?? 10) || 10;

export type ActorRole = "attacker" | "defender";

/** Añadimos "status_applied" (y mantenemos los existentes del runner). */
export type TimelineEvent = "hit" | "crit" | "block" | "miss" | "passive_proc" | "ultimate_cast" | "dot_tick" | "status_applied";

/** Breakdown rico para daños/mitigaciones (block/DR/elemento/crit, etc.). */
export type DamageBreakdown = {
  // Bloqueo
  blockedAmount?: number;
  preBlock?: number;
  blockReducedPercent?: number;
  finalAfterBlock?: number;

  // Damage Reduction plana
  drReducedPercent?: number;
  finalAfterDR?: number;

  // Otros factores posibles del runner/mitigación
  defenseFactor?: number;
  elementFactor?: number;
  critBonusPercent?: number;

  // Permite campos adicionales sin romper tipos
  [k: string]: any;
};

export type DamageObj = {
  final?: number; // daño final aplicado
  raw?: number; // opcional (si el runner lo envía)
  breakdown?: DamageBreakdown;
};

/** Evento tal como viene del backend (ahora con campos de overkill y block). */
export type TimelineBE = {
  turn: number;

  /** BE puede enviar source/actor (ambos equivalentes); opcionalmente "player/enemy". */
  source?: ActorRole | "player" | "enemy";
  actor?: ActorRole | "player" | "enemy";

  /** BE a veces envía 'type' además de 'event'/'outcome' */
  type?: string;
  event: string | TimelineEvent;
  outcome?: string;

  // Daño (formas tolerantes)
  damage?: number;
  damageNumber?: number;
  damageObj?: DamageObj;

  // Mitigación y números de bloqueo (compat con runner)
  blockedAmount?: number;
  preBlock?: number;
  blockReducedPercent?: number;
  finalAfterBlock?: number;
  drReducedPercent?: number;
  finalAfterDR?: number;

  // Crudos / auxiliares
  rawDamage?: number;

  // HP “post evento” (compat)
  attackerHP?: number;
  defenderHP?: number;

  // ¡Nuevo! Overkill si el golpe mata y sobra daño
  overkill?: number;

  ability?: {
    kind: "passive" | "ultimate";
    name?: string;
    description?: string;
    durationTurns?: number;
  };

  /** opcional: payload normalizado cuando llega por tags */
  statusApplied?: {
    key?: string;
    target?: ActorRole | "player" | "enemy" | "attacker" | "defender";
    duration?: number;
    durationTurns?: number;
    cc?: boolean;
    value?: number;
    dotPerTurn?: number;
    stacks?: number;
  };

  tags?: string[] | Record<string, any>;

  // alias/flags que pueden venir del backend
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

  // Por si el BE envía breakdown suelto al nivel del evento
  breakdown?: DamageBreakdown;
};

/** igual que antes */
export type ScheduleOptions = {
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

/** añadimos 'status_applied' para el scheduler */
export type ScheduledEventType = "attack_windup" | "impact_hit" | "impact_crit" | "impact_block" | "impact_miss" | "passive_proc" | "ultimate_cast" | "dot_tick" | "status_applied";

export type ScheduledEvent = {
  id: string;
  type: ScheduledEventType;
  role: ActorRole;
  startMs: number;
  endMs: number;
  payload: TimelineBE;
};

export type ProgressionApi = { level: number };

export type Opponent = {
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
    magicPower?: number;
  };
  avatarUrl?: string | null;
  passiveDefaultSkill?: { name?: string; description?: string } | null;
  ultimateSkill?: { name?: string; description?: string } | null;
  clanName?: string | null;
  honor?: number | null;
};

export type ViewMode = "select" | "duel";
export type DuelResult = { outcome: "win" | "lose" | "draw"; summary: string } | null;

export type Reward = {
  gold?: number;
  xp?: number;
  items?: Array<{ name: string; qty?: number }>;
  honor?: number;
} | null;

/** 👇 añadimos "status" a LogKind (queda igual que tu UI) */
export type LogKind = "hit" | "crit" | "block" | "miss" | "passive" | "ultimate" | "dot" | "status";

/**
 * LogEntry que usa la UI:
 *  - Mantiene los campos mínimos (turn/kind/actor/text)
 *  - PERO además hereda opcionalmente todo lo que venga en TimelineBE,
 *    para no perder overkill/breakdown/etc.
 */
export type LogEntry = {
  turn: number;
  kind: LogKind;
  actor: "me" | "opp";
  text?: string;
} & Partial<TimelineBE>;

export type StaminaSnap = { current: number; max: number };

export type { CharacterApi };
