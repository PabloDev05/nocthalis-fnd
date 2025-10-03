import { ActorRole, ScheduleOptions, ScheduledEvent, ScheduledEventType, TimelineBE } from "./types";
import { normalizeEvent, enrichTimelinePayload, asInt } from "./helpers";

const DEFAULTS: ScheduleOptions = {
  minTurnMs: 1150,
  gapSmallMs: 120,
  passiveProcMs: 520,
  ultimateCastMs: 920,
  attackWindupMs: 360,
  impactMs: 260,
  extraCritMs: 200,
  extraBlockMs: 180,
  extraMissMs: 150,
};

// Padding inicial para que se vea el “VS” y FX de arranque
const DEFAULT_INTRO_DELAY_MS = 2000;

export function buildAnimationSchedule(timeline: TimelineBE[], opts?: Partial<ScheduleOptions>): { totalMs: number; events: ScheduledEvent[] } {
  const cfg = { ...DEFAULTS, ...(opts || {}) };
  const introDelayMs = typeof (opts as any)?.introDelayMs === "number" && (opts as any).introDelayMs >= 0 ? (opts as any).introDelayMs : DEFAULT_INTRO_DELAY_MS;

  const out: ScheduledEvent[] = [];
  if (!Array.isArray(timeline) || timeline.length === 0) return { totalMs: 0, events: out };

  // Cursor temporal arranca con padding inicial
  let tCursor = introDelayMs;
  let perTurnIndex = 0;

  const firstTurn = asInt(timeline[0]?.turn ?? 1);
  let lastTurn = firstTurn;
  let turnStart = tCursor;

  const schedule = (type: ScheduledEventType, role: ActorRole, dur: number, payload: TimelineBE) => {
    const id = `${asInt(payload.turn ?? 0)}:${perTurnIndex++}:${type}`;
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

    // Asegurar turn entero
    raw.turn = asInt(raw.turn ?? i + 1);

    // Cambio de turno → garantizar duración mínima del turno anterior
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

    // Golpe básico (windup + impacto)
    schedule("attack_windup", role, cfg.attackWindupMs, raw);
    schedule(deriveImpact(raw), role, cfg.impactMs, raw);

    // Cierre del turno si es el último evento del turno
    if (!next || asInt(next.turn ?? i + 2) !== raw.turn) {
      const minEnd = turnStart + cfg.minTurnMs;
      if (tCursor < minEnd) tCursor = minEnd;
    }
  }

  const totalMs = out.length ? out[out.length - 1].endMs : 0;
  return { totalMs, events: out };
}
