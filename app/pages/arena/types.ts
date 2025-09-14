// src/pages/arena/types.ts
import type { CombatStats, CharacterApi } from "../../../types/character";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";
export const PVP_STAMINA_COST = Number(import.meta.env.VITE_PVP_STAMINA_COST ?? 10) || 10;

export type ActorRole = "attacker" | "defender";
export type TimelineEvent = "hit" | "crit" | "block" | "miss" | "passive_proc" | "ultimate_cast" | "dot_tick";

export type TimelineBE = {
  turn: number;
  source?: ActorRole;
  actor?: ActorRole;
  damage?: number;
  attackerHP?: number;
  defenderHP?: number;
  event: string | TimelineEvent;
  ability?: { kind: "passive" | "ultimate"; name?: string; description?: string; durationTurns?: number };
  tags?: string[] | Record<string, any>;
  crit?: boolean; isCrit?: boolean; critical?: boolean;
  blocked?: boolean; isBlocked?: boolean; block?: boolean;
  miss?: boolean; isMiss?: boolean; dodged?: boolean; evade?: boolean; evaded?: boolean;
  dot?: boolean; bleed?: boolean; poison?: boolean; burn?: boolean;
  outcome?: string;
};

export type ScheduleOptions = {
  minTurnMs: number; gapSmallMs: number; passiveProcMs: number; ultimateCastMs: number;
  attackWindupMs: number; impactMs: number; extraCritMs: number; extraBlockMs: number; extraMissMs: number;
};

export type ScheduledEventType =
  | "attack_windup" | "impact_hit" | "impact_crit" | "impact_block" | "impact_miss"
  | "passive_proc" | "ultimate_cast" | "dot_tick";

export type ScheduledEvent = {
  id: string; type: ScheduledEventType; role: ActorRole; startMs: number; endMs: number; payload: TimelineBE;
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
    minDamage?: number; maxDamage?: number; damageMin?: number; damageMax?: number;
    criticalChance?: number; blockChance?: number; evasion?: number; evadeChance?: number; dodgeChance?: number;
    attackPower?: number; magicPower?: number;
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
  gold?: number; xp?: number; items?: Array<{ name: string; qty?: number }>; honor?: number;
} | null;

export type LogKind = "hit" | "crit" | "block" | "miss" | "passive" | "ultimate" | "dot";
export type LogEntry = { turn: number; kind: LogKind; text: string; actor: "me" | "opp"; value?: number };

export type StaminaSnap = { current: number; max: number };

export type { CharacterApi };
