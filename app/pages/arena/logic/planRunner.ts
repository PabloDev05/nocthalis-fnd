/**
 * Plan Runner (modular)
 * ---------------------
 * Agenda el plan y dispara callbacks: primero daño por paso,
 * luego FX, luego log. Así las barras bajan en tiempo real.
 */

import type { AnimationPlan, AnimationPlanEvent } from "./animationSchedulerAdapter";
import type { FxAction } from "./duelFxRules";
import type { LogEntry } from "../types";
import { scheduleEvents, clearTimers, type TimerRef } from "./duelTimers";

export interface PlanRunnerCallbacks {
  onFx?: (action: FxAction, ev: AnimationPlanEvent) => void;
  onLog?: (entry: LogEntry, ev: AnimationPlanEvent) => void;
  onBeforeStep?: (ev: AnimationPlanEvent) => void;
  onScheduled?: (plan: AnimationPlan) => void;
  onEnd?: (plan: AnimationPlan) => void;
  onDamage?: (info: { dmg: number; actorIsPlayer: boolean }, ev: AnimationPlanEvent) => void;
}

export interface RunOptions {
  timerRef: TimerRef;
  callbacks?: PlanRunnerCallbacks;
}

export function runAnimationPlan(plan: AnimationPlan, opts: RunOptions) {
  const { timerRef, callbacks } = opts;

  callbacks?.onScheduled?.(plan);

  const tasks = plan.events.map((step) => ({
    atMs: step.atMs,
    run: () => {
      callbacks?.onBeforeStep?.(step);

      if (step.impact) callbacks?.onDamage?.(step.impact, step);

      if (step.actions?.length) {
        for (const a of step.actions) callbacks?.onFx?.(a, step);
      }

      if (step.log) callbacks?.onLog?.(step.log, step);
    },
  }));

  scheduleEvents(timerRef, tasks);

  scheduleEvents(timerRef, [{ atMs: Math.max(0, plan.totalMs), run: () => callbacks?.onEnd?.(plan) }]);

  return {
    stop() {
      clearTimers(timerRef);
    },
  };
}
