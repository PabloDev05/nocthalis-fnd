/**
 * Arena logic — Duel outcome copy
 * ------------------------------------------------------------------
 * Centraliza los textos cortos de UI que dependen del resultado del combate.
 * Ejemplo: "WIN" para el label central, "You have won." para el resumen.
 *
 * Ventaja: si querés internacionalizar o cambiar el tono narrativo,
 * modificás un solo archivo.
 */

/* ────────────────────────── tipos ────────────────────────── */

export type DuelOutcome = "win" | "lose" | "draw";

/* ────────────────────────── center label ─────────────────── */

/**
 * Texto corto que se muestra en el centro del duelo.
 */
export function centerLabelByOutcome(outcome: DuelOutcome): "WIN" | "LOSE" | "DRAW" {
  return outcome === "win" ? "WIN" : outcome === "lose" ? "LOSE" : "DRAW";
}

/* ────────────────────────── resumen largo ────────────────── */

/**
 * Texto descriptivo de resumen de duelo según outcome.
 * Puede personalizarse en el futuro con más narrativa o i18n.
 */
export function summaryByOutcome(outcome: DuelOutcome): string {
  switch (outcome) {
    case "win":
      return "You have won.";
    case "lose":
      return "You were defeated.";
    case "draw":
    default:
      return "Draw.";
  }
}
