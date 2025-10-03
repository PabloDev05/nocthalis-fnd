/**
 * Arena logic — Skills & Damage helpers
 * ------------------------------------------------------------------
 * Centraliza la representación textual de:
 *  - Skills (passive / ultimate) con fallback seguro
 *  - Rangos de daño (min–max o guión largo)
 *
 * Ventaja: cambios de formato o traducción se hacen en un solo lugar.
 */

import { asInt } from "../helpers";

/* ────────────────────────── skills ────────────────────────── */

/**
 * Devuelve el texto para una skill, tolerando nulos/undef.
 * @param skill - Objeto de skill del backend (puede ser string o { name })
 * @returns nombre legible o "—"
 */
export function skillTextSafe(skill: any): string {
  if (!skill) return "—";
  if (typeof skill === "string") return skill || "—";
  if (typeof skill === "object" && skill.name) return String(skill.name);
  return "—";
}

/* ────────────────────────── damage ranges ─────────────────── */

/**
 * Devuelve el texto para mostrar el rango de daño de un combatStats.
 * Ej: min=10, max=20 → "10–20"
 *     sólo min=15 → "15"
 *     nada → "—"
 */
export function dmgRangeText(min?: number | null, max?: number | null): string {
  const a = Number.isFinite(min) ? asInt(min) : null;
  const b = Number.isFinite(max) ? asInt(max) : null;
  if (a == null && b == null) return "—";
  if (a != null && b != null) return `${a}–${b}`;
  return String(a ?? b ?? "—");
}

/**
 * Helper: construye rango a partir de combatStats crudos.
 */
export function dmgRangeFromCombatStats(cs: any): string {
  if (!cs) return "—";
  const min = cs.minDamage ?? cs.damageMin ?? cs.min ?? cs.attackMin ?? cs.powerMin ?? undefined;
  const max = cs.maxDamage ?? cs.damageMax ?? cs.max ?? cs.attackMax ?? cs.powerMax ?? undefined;
  return dmgRangeText(min, max);
}
