/**
 * Arena logic — Duel FX rules (pure)
 * ------------------------------------------------------------------
 * Traduce eventos de la timeline/scheduler a "acciones de FX" declarativas.
 * No usa React ni setState — sólo indica QUÉ efectos activar y en QUÉ lado.
 *
 * Ventajas:
 *  - Testeable: con un ev → esperás una lista concreta de acciones
 *  - Reutilizable: la UI decide *cómo* aplicar/incrementar cada acción
 *  - Centralizado: una sola tabla de reglas por tipo de evento
 */

import type { TimelineBE } from "../types";
import { statusKeyToVariant, type StatusVariant } from "./statusVariant";

/* ────────────────────────── Tipos de salida ────────────────────────── */

export type FxSide = "left" | "right";

/** Conjunto de acciones soportadas por la UI actual. */
export type FxAction =
  | { kind: "hpGlow"; side: FxSide } // brillo corto de barra HP
  | { kind: "pulse"; side: FxSide; which: "passive" | "ultimate" } // pulso de marco/hud
  | { kind: "hitShake"; side: FxSide } // sacudida por golpe/crit en víctima
  | { kind: "ultShake"; side: FxSide } // sacudida fuerte por ultimate en víctima
  | { kind: "ultFlash"; side: FxSide } // destello de impacto de ultimate en víctima
  | { kind: "blockFlash"; side: FxSide } // destello al bloquear
  | { kind: "blockBump"; side: FxSide } // empujón/bump en el escudo/portrait
  | { kind: "statusFlash"; side: FxSide; variant: StatusVariant } // overlay de estado (cc/debuff/bleed)
  | { kind: "missNudge"; side: FxSide } // pequeño nudge por miss
  | { kind: "screenShake" }; // sacudida global (p.ej., CRIT)

/**
 * Entrada canónica para decidir FX.
 *  - actorIsPlayer: true si el evento lo ejecuta el jugador local
 *  - type: tipo del scheduler (impact_hit/crit/block/miss, passive_proc, ultimate_cast, dot_tick, status_applied)
 *  - payload: body heterogéneo (se usa para leer status/dot, etc.)
 */
export interface FxInput {
  actorIsPlayer: boolean;
  type?: string | null;
  payload?: any;
}

/* ────────────────────────── Utils internos ────────────────────────── */

/** Devuelve el lado del actor/víctima dada la perspectiva de la UI (jugador a la izquierda). */
function sides(actorIsPlayer: boolean): { actor: FxSide; victim: FxSide } {
  // Por convención en tu UI: jugador local = izquierda
  return actorIsPlayer ? { actor: "left", victim: "right" } : { actor: "right", victim: "left" };
}

/** Dado statusApplied.target = "attacker"|"defender", resuelve si la víctima es el jugador. */
function statusVictimIsPlayer(actorIsPlayer: boolean, target: "attacker" | "defender" | string | undefined): boolean {
  if (target === "attacker") return actorIsPlayer;
  if (target === "defender") return !actorIsPlayer;
  // Si el backend no especifica, asumimos que cae en el objetivo del actor (defender)
  return !actorIsPlayer;
}

/* ────────────────────────── Reglas por evento ─────────────────────── */

/**
 * Reglas puras: de un evento → lista de FxAction.
 */
export function fxForEvent(input: FxInput): FxAction[] {
  const { actorIsPlayer, type, payload } = input;
  const { actor, victim } = sides(actorIsPlayer);
  const t = String(type ?? "");

  // status_applied: overlay según variante y lado de la VÍCTIMA
  if (t === "status_applied" || t === "status") {
    const s = payload?.statusApplied ?? payload?.status ?? null;
    if (s?.key) {
      const victimIsPlayer = statusVictimIsPlayer(actorIsPlayer, s.target as any);
      const side: FxSide = victimIsPlayer ? "left" : "right";
      const variant = statusKeyToVariant(String(s.key));
      return [{ kind: "statusFlash", side, variant }];
    }
    return [];
  }

  // passive_proc: pulso + glow del lado del ACTOR
  if (t === "passive_proc") {
    return [
      { kind: "pulse", side: actor, which: "passive" },
      { kind: "hpGlow", side: actor },
    ];
  }

  // ultimate_cast: pulso+glow del actor + flash/shake en VÍCTIMA
  if (t === "ultimate_cast") {
    return [
      { kind: "pulse", side: actor, which: "ultimate" },
      { kind: "hpGlow", side: actor },
      { kind: "ultFlash", side: victim },
      { kind: "ultShake", side: victim },
    ];
  }

  // dot_tick: si es bleed → statusFlash bleed en víctima
  if (t === "dot_tick") {
    const dotKey = payload?.dotKey ?? payload?.key ?? null;
    if (dotKey && String(dotKey).toLowerCase() === "bleed") {
      return [{ kind: "statusFlash", side: victim, variant: "bleed" }];
    }
    return [];
  }

  // impact_crit: sacudir víctima + sacudida global
  if (t === "impact_crit") {
    return [{ kind: "hitShake", side: victim }, { kind: "screenShake" }];
  }

  // impact_block: fx de bloqueo en el lado del BLOQUEADOR (víctima del golpe)
  if (t === "impact_block") {
    return [
      { kind: "blockFlash", side: victim },
      { kind: "blockBump", side: victim },
    ];
  }

  // impact_miss: pequeño nudge del lado de la víctima
  if (t === "impact_miss") {
    return [{ kind: "missNudge", side: victim }];
  }

  // impact_hit: sin efectos especiales (el shake leve lo reservamos a crit)
  if (t === "impact_hit") {
    return [];
  }

  // Por defecto, sin FX
  return [];
}

/* ────────────────────────── Adapter opcional ───────────────────────── */

/**
 * Adapter "opcional": si querés, convertir un evento crudo de buildAnimationSchedule
 * al FxInput. Lo dejamos aquí para mantenerlo libre de React.
 */
export function fxInputFromScheduled(ev: { role?: "attacker" | "defender"; type?: string; payload?: any }): FxInput {
  return {
    actorIsPlayer: ev.role === "attacker",
    type: ev.type,
    payload: ev.payload ?? ev, // tolera payload embebido
  };
}

/**
 * Genera acciones FX para una lista de eventos del scheduler.
 * No crea timers — sólo marca qué hacer "en cada ev".
 * La UI/Hook decide *cuándo* aplicarlas (usando ev.startMs).
 */
export function fxForScheduledEvents(events: Array<{ startMs: number; role?: "attacker" | "defender"; type?: string; payload?: any }>): Array<{ atMs: number; actions: FxAction[] }> {
  return (events || []).map((ev) => ({
    atMs: ev.startMs ?? 0,
    actions: fxForEvent(fxInputFromScheduled(ev)),
  }));
}
