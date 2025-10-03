/**
 * Arena logic — Timeline math (pure projection)
 * ------------------------------------------------------------------
 * Proyección aritmética de HP a partir de una timeline genérica.
 * No crea timers ni toca la UI. Útil para previews/tests o para
 * calcular el HP final esperado antes/durante la animación.
 */

import { asInt } from "../helpers";
import type { TimelineBE } from "../types";
import { getFinalDamage } from "./logKinds";

/* ────────────────────────── type guards ────────────────────────── */

export type ImpactType = "impact_hit" | "impact_crit" | "impact_block" | "impact_miss" | "passive_proc" | "ultimate_cast" | "dot_tick";

export function isImpactType(t?: string | null): t is ImpactType {
  return t === "impact_hit" || t === "impact_crit" || t === "impact_block" || t === "impact_miss" || t === "passive_proc" || t === "ultimate_cast" || t === "dot_tick";
}

/* ────────────────────────── math core ──────────────────────────── */

export interface ProjectionInput {
  /** HP inicial del jugador local (attacker en tu UI) */
  playerHP0: number;
  /** HP inicial del oponente */
  enemyHP0: number;
  /** Lista de eventos con payload heterogéneo */
  timeline: TimelineBE[];
}

export interface ProjectionResult {
  finalPlayerHP: number;
  finalEnemyHP: number;
  /** Suma de daños infligidos por cada lado (para debug/telemetría) */
  dealtByPlayer: number;
  dealtByEnemy: number;
}

/**
 * Aplica un único evento a la proyección de HP.
 * @param role - "attacker" en ev.role significa que actúa el jugador local
 */
export function applyEventDamage(
  role: "attacker" | "defender" | undefined,
  type: string | undefined,
  payload: any,
  state: { playerHP: number; enemyHP: number; dealtByPlayer: number; dealtByEnemy: number }
) {
  const dmg = Math.max(0, getFinalDamage(payload));

  // Sólo restamos HP si es un impacto con daño > 0
  if (!isImpactType(type) || dmg <= 0) return;

  const actorIsPlayer = role === "attacker";
  if (actorIsPlayer) {
    state.enemyHP = Math.max(0, state.enemyHP - dmg);
    state.dealtByPlayer += dmg;
  } else {
    state.playerHP = Math.max(0, state.playerHP - dmg);
    state.dealtByEnemy += dmg;
  }
}

/**
 * Proyecta HP final recorriendo la timeline de forma pura.
 */
export function projectHP({ playerHP0, enemyHP0, timeline }: ProjectionInput): ProjectionResult {
  let state = {
    playerHP: asInt(playerHP0),
    enemyHP: asInt(enemyHP0),
    dealtByPlayer: 0,
    dealtByEnemy: 0,
  };

  for (const ev of timeline || []) {
    applyEventDamage((ev as any).role, (ev as any).type, (ev as any).payload ?? ev, state);
  }

  return {
    finalPlayerHP: state.playerHP,
    finalEnemyHP: state.enemyHP,
    dealtByPlayer: state.dealtByPlayer,
    dealtByEnemy: state.dealtByEnemy,
  };
}
