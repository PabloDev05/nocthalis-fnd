/**
 * Animation Scheduler Adapter (modular, compat FE/BE)
 * ---------------------------------------------------
 * - Acepta timeline con `event: "hit"|"crit"|"block"|"miss"|...`
 *   o con tipos "impact_*" que genera el scheduler.
 * - Marca impactos con {dmg, actorIsPlayer} para que el runner
 *   descuente HP por paso.
 * - 🔧 Solo crea LOGS para eventos "visibles" (no para attack_windup).
 */

import type { TimelineBE, LogEntry } from "../types";
import { enrichTimelinePayload } from "../helpers";
import { buildAnimationSchedule } from "../scheduler";

import { projectHP, isImpactType } from "./timelineMath";
import { fxForScheduledEvents, type FxAction } from "./duelFxRules";
import { buildLogEntry } from "./combatLogBuilder";
import { getFinalDamage } from "./logKinds";

/* ────────────────────────── Tipos del plan ────────────────────────── */

export interface AnimationPlanEvent {
  atMs: number;
  ev: { type?: string; role?: "attacker" | "defender"; payload?: any };
  actions: FxAction[];
  log: LogEntry | null;
  impact?: { dmg: number; actorIsPlayer: boolean } | null;
}

export interface AnimationPlan {
  totalMs: number;
  events: AnimationPlanEvent[];
  projection: ReturnType<typeof projectHP>;
  normalizedTimeline: TimelineBE[];
}

/* ────────────────────────── Helpers ────────────────────────── */

function normalizeTimeline(raw: TimelineBE[] | null | undefined): TimelineBE[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(enrichTimelinePayload);
}

/** Sólo estos tipos generan líneas de log. */
function isLoggableType(t: string): boolean {
  return (
    t === "impact_hit" ||
    t === "impact_crit" ||
    t === "impact_block" ||
    t === "impact_miss" ||
    t === "hit" ||
    t === "crit" ||
    t === "block" ||
    t === "miss" ||
    t === "passive_proc" ||
    t === "ultimate_cast" ||
    t === "dot_tick" ||
    t === "status_applied" ||
    t === "status"
  );
}

/* ────────────────────────── Principal ──────────────────────── */

export function buildAnimationPlan(args: { rawTimeline: TimelineBE[] | null | undefined; myMaxHP: number; oppMaxHP: number; myName: string; oppName: string }): AnimationPlan {
  const { rawTimeline, myMaxHP, oppMaxHP, myName, oppName } = args;

  const timeline: TimelineBE[] = normalizeTimeline(rawTimeline);

  // Usa el scheduler existente (el mismo de antes)
  const schedule = buildAnimationSchedule(timeline);
  const scheduled = schedule.events as Array<{
    startMs: number;
    type?: string;
    role?: "attacker" | "defender";
    payload?: any;
  }>;

  const fxTimeline = fxForScheduledEvents(scheduled);

  const events: AnimationPlanEvent[] = scheduled.map((ev, i) => {
    const payload = ev.payload ?? ev;
    const type = ev.type ?? String((payload as any)?.event ?? "");

    const dmg = Math.max(0, getFinalDamage(payload));
    const isImpact = isImpactType(type) || type === "hit" || type === "crit" || type === "block" || type === "miss";

    const impact = isImpact && dmg > 0 ? { dmg, actorIsPlayer: ev.role === "attacker" } : null;

    // 🚫 No generamos log para windups ni pasos auxiliares
    const log: LogEntry | null = isLoggableType(type) ? buildLogEntry({ ev: { type, role: ev.role, payload }, myName, oppName }) : null;

    return {
      atMs: ev.startMs ?? 0,
      ev: { type, role: ev.role, payload },
      actions: fxTimeline[i]?.actions ?? [],
      log,
      impact,
    };
  });

  // Proyección final (para setear HP al cierre)
  const projection = projectHP({
    playerHP0: myMaxHP,
    enemyHP0: oppMaxHP,
    timeline,
  });

  return {
    totalMs: schedule.totalMs,
    events,
    projection,
    normalizedTimeline: timeline,
  };
}
