/**
 * Arena logic — Combat texts (log lines)
 * ------------------------------------------------------------------
 * Genera mensajes consistentes para el CombatLog.
 * Mantenerlo "puro": sin React, sólo funciones puras y helpers.
 *
 * Idea: si querés internacionalizar en el futuro, este archivo es
 * el único que cambia (o pasa a delegar en i18n).
 */

/* ─────────────────────────── helpers base ─────────────────────────── */

/** Formatea un nombre vacío a guion largo. */
export function who(n?: string | null): string {
  const s = String(n ?? "").trim();
  return s.length ? s : "—";
}

/** Envuelve una palabra clave en mayúsculas para enfatizar (p. ej., STATUS). */
export function emph(s: string): string {
  return String(s).toUpperCase();
}

/** Formatea valores numéricos de forma segura. */
export function n(v: unknown): number {
  const x = Math.trunc(Number(v));
  return Number.isFinite(x) ? x : 0;
}

/** Construye trozos opcionales " (x)" / " for Nt" */
function optParen(label?: string | null): string {
  const s = String(label ?? "").trim();
  return s ? ` ${s}` : "";
}

/* ─────────────────────────── factories ────────────────────────────── */

/** Golpe normal (impact_hit). */
export function txtHit(attacker: string, target: string, dmg: number): string {
  return `${who(attacker)} hits ${who(target)} for ${n(dmg)}.`;
}

/** Golpe crítico (impact_crit). */
export function txtCrit(attacker: string, target: string, dmg: number): string {
  return `${who(attacker)} lands a CRITICAL! on ${who(target)} for ${n(dmg)}!`;
}

/** Fallo (impact_miss). */
export function txtMiss(attacker: string): string {
  return `MISSED! ${who(attacker)} fails to connect.`;
}

/**
 * Bloqueo (impact_block).
 * @param blockedAmount - cantidad bloqueada (opcional); si no hay, no se muestra
 */
export function txtBlock(
  blocker: string, // quien bloquea (el objetivo)
  attacker: string, // quien ataca
  dmgThrough: number,
  blockedAmount?: number | null
): string {
  const blockedTxt = Number.isFinite(blockedAmount) && n(blockedAmount) > 0 ? `${n(blockedAmount)} blocked, ` : "";
  return `BLOCKED! ${who(blocker)} stops ${who(attacker)}'s strike (${blockedTxt}only ${n(dmgThrough)} through).`;
}

/** Proc de pasiva (passive_proc). */
export function txtPassive(actor: string, abilityName?: string | null, dmg?: number | null, opts?: { pity?: boolean; chancePercent?: number; roll?: number }): string {
  const name = abilityName || "Passive";
  const pity = opts?.pity ? " (PITY)" : "";
  const chance = Number.isFinite(opts?.chancePercent) || Number.isFinite(opts?.roll) ? ` (CHANCE ${opts?.chancePercent ?? "—"} | ROLL ${opts?.roll ?? "—"})` : "";
  const head = `${who(actor)} triggers ${name}${pity}${chance}`;
  return n(dmg) > 0 ? `${head} for ${n(dmg)}.` : `${head}.`;
}

/** Ultimate (ultimate_cast) con posibles bonus/debuff. */
export function txtUltimate(
  actor: string,
  target: string,
  abilityName?: string | null,
  dmg?: number | null,
  opts?: {
    pity?: boolean;
    chancePercent?: number;
    roll?: number;
    bonusDamagePercent?: number;
    debuff?: { key: string; duration?: number; value?: number; dotPerTurn?: number } | null;
  }
): string {
  const name = abilityName || "Ultimate";
  const pity = opts?.pity ? " (PITY)" : "";
  const chance = Number.isFinite(opts?.chancePercent) || Number.isFinite(opts?.roll) ? ` (CHANCE ${opts?.chancePercent ?? "—"} | ROLL ${opts?.roll ?? "—"})` : "";
  const bonus = Number.isFinite(opts?.bonusDamagePercent) && n(opts?.bonusDamagePercent) !== 0 ? ` (+${n(opts?.bonusDamagePercent)}%)` : "";

  let debTxt = "";
  const deb = opts?.debuff;
  if (deb?.key) {
    const dur = deb.duration ? ` for ${n(deb.duration)}t` : "";
    const val = deb.dotPerTurn != null ? ` (${n(deb.dotPerTurn)}/t)` : deb.value != null ? ` (${n(deb.value)})` : "";
    debTxt = `, applies ${emph(String(deb.key))}${dur}${val}`;
  }

  const head = `${who(actor)} unleashes ${name}${pity}${chance}${bonus}`;
  return n(dmg) > 0 ? `${head} on ${who(target)} for ${n(dmg)}!${debTxt}` : `${head}.${debTxt ? debTxt : ""}`;
}

/** Daño por tiempo (dot_tick). */
export function txtDot(actor: string, target: string, dmg: number): string {
  return `${who(actor)} deals damage over time to ${who(target)} for ${n(dmg)}.`;
}

/**
 * Estado aplicado (status_applied).
 * @param key - identificador del estado (bleed, fear, etc.)
 * @param duration - turnos opcionales
 * @param value - valor único (opcional)
 * @param dotPerTurn - valor por turno (opcional)
 */
export function txtStatusApplied(actor: string, target: string, key: string, duration?: number | null, value?: number | null, dotPerTurn?: number | null): string {
  const durTxt = duration ? ` for ${n(duration)}t` : "";
  const valTxt = dotPerTurn != null ? ` (${n(dotPerTurn)}/t)` : value != null ? ` (${n(value)})` : "";
  return `${who(actor)} inflicts ${emph(String(key))} on ${who(target)}${durTxt}${valTxt}.`;
}

/* ────────────────────── helpers de composición ─────────────────────── */

/** Construye el texto de rango de daño: "min–max" o "—" si no disponible. */
export function dmgRangeText(min?: number | null, max?: number | null): string {
  const a = Number.isFinite(min) ? n(min) : null;
  const b = Number.isFinite(max) ? n(max) : null;
  if (a == null && b == null) return "—";
  if (a != null && b != null) return `${a}–${b}`;
  return String(a ?? b ?? "—");
}

/** Variante corta para etiquetas de center label por outcome. */
export function centerLabelByOutcome(outcome: "win" | "lose" | "draw"): "WIN" | "LOSE" | "DRAW" {
  return outcome === "win" ? "WIN" : outcome === "lose" ? "LOSE" : "DRAW";
}
