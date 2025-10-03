/**
 * Barrel file — Arena logic
 * ------------------------------------------------------------
 * Re-exporta los módulos de lógica puros para que `useArena`
 * (y cualquier otra parte) importe desde un único lugar.
 */

// HTTP & API
export { createArenaClient, getMe, getProgression, getOpponents, getStamina, adminSetStamina, postChallenge, resolveWithFallback } from "./arenaClient";
export type { ResolveOutcome, ResolvePayload } from "./arenaClient";

// Opponents
export { extractRawOpponentList, mapOneOpponent, mapOpponentsResponseToList } from "./opponentMapper";

// Combat texts / copy
export {
  who,
  emph,
  n,
  txtHit,
  txtCrit,
  txtMiss,
  txtBlock,
  txtPassive,
  txtUltimate,
  txtDot,
  txtStatusApplied,
  dmgRangeText as dmgRangeTextCopy, // alias opcional si querés diferenciarlo
  centerLabelByOutcome as centerLabelCopy,
} from "./combatTexts";

// Skills & Damage helpers
export { skillTextSafe, dmgRangeText, dmgRangeFromCombatStats } from "./skillsAndDamage";

// Timeline math (HP projection)
export { isImpactType, applyEventDamage, projectHP } from "./timelineMath";
export type { ImpactType, ProjectionInput, ProjectionResult } from "./timelineMath";

// Status → variant
export { statusKeyToVariant } from "./statusVariant";
export type { StatusVariant } from "./statusVariant";

// FX rules
export { fxForEvent, fxForScheduledEvents, fxInputFromScheduled } from "./duelFxRules";
export type { FxAction, FxSide, FxInput } from "./duelFxRules";

// Timers
export { clearTimers, scheduleTimer, scheduleEvents } from "./duelTimers";
export type { TimerRef } from "./duelTimers";

// Combat log builder
export { buildLogEntry } from "./combatLogBuilder";

// Animation plan (adapter)
export { buildAnimationPlan } from "./animationSchedulerAdapter";
export type { AnimationPlan, AnimationPlanEvent } from "./animationSchedulerAdapter";

// Plan runner
export { runAnimationPlan } from "./planRunner";
export type { PlanRunnerCallbacks, RunOptions } from "./planRunner";

// Duel state reset/boot
export { getInitialDuelState, resetForNewDuel, resetForBackToSelect } from "./duelReset";
export type { DuelStateValues } from "./duelReset";

// Log kinds helpers
export { getFinalDamage, KINDS, toKind, mapTypeToKind } from "./logKinds";

export { mapRewards } from "./rewardsMapper";
