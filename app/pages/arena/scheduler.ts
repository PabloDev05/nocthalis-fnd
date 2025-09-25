// src/pages/arena/scheduler.ts
import { ActorRole, ScheduleOptions, ScheduledEvent, ScheduledEventType, TimelineBE } from "./types";
import { normalizeEvent, enrichTimelinePayload } from "./helpers";

const DEFAULTS: ScheduleOptions = {
  minTurnMs: 1150, // ← un poquito más largo para que el rival se “vea”
  gapSmallMs: 120,
  passiveProcMs: 520,
  ultimateCastMs: 920,
  attackWindupMs: 360,
  impactMs: 260,
  extraCritMs: 200,
  extraBlockMs: 180,
  extraMissMs: 150,
};

export function buildAnimationSchedule(timeline: TimelineBE[], opts?: Partial<ScheduleOptions>): { totalMs: number; events: ScheduledEvent[] } {
  const cfg = { ...DEFAULTS, ...(opts || {}) };
  const out: ScheduledEvent[] = [];
  if (!timeline?.length) return { totalMs: 0, events: out };

  let tCursor = 0;
  let perTurnIndex = 0;
  let lastTurn = timeline[0].turn;
  let turnStart = 0;

  const schedule = (type: ScheduledEventType, role: ActorRole, dur: number, payload: TimelineBE) => {
    const id = `${payload.turn}:${perTurnIndex++}:${type}`;
    const startMs = tCursor;
    const baseDur = type === "impact_crit" ? cfg.impactMs + cfg.extraCritMs : type === "impact_block" ? cfg.impactMs + cfg.extraBlockMs : type === "impact_miss" ? cfg.impactMs + cfg.extraMissMs : dur;
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
    const raw0 = timeline[i];
    const raw = enrichTimelinePayload(raw0);
    const next = timeline[i + 1];

    if (raw.turn !== lastTurn) {
      const minEnd = turnStart + cfg.minTurnMs;
      if (tCursor < minEnd) tCursor = minEnd;
      lastTurn = raw.turn;
      turnStart = tCursor;
      perTurnIndex = 0;
    }

    const role: ActorRole = (raw.source ?? raw.actor ?? "attacker") as ActorRole;
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
    if (n === "status_applied") {
      schedule("status_applied", role, Math.max(260, cfg.gapSmallMs + 100), raw);
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
