/**
 * Arena logic — Log kinds & timeline helpers
 * ------------------------------------------------------------
 * Centraliza:
 *  - Detección de daño final en un payload heterogéneo (getFinalDamage)
 *  - Tabla de kinds válidos de log (KINDS)
 *  - Casting seguro de string → LogKind (toKind)
 *  - Mapeo robusto de tipos crudos del scheduler/payload → LogKind (mapTypeToKind)
 *
 * Mantener este archivo pequeño y sin efectos secundarios.
 * Reutilizable por hooks, views y helpers sin acoplarse a React.
 */

import { asInt } from "../helpers"; // mismo helper que ya usas en arena
import type { LogKind, TimelineBE } from "../types";

/* ────────────────────────── damage extraction ────────────────────────── */

/**
 * Extrae el daño "final" de un evento, tolerando variaciones de backend.
 * Prioriza: payload.damageObj.final → payload.damageNumber → payload.damage
 * Devuelve 0 si no hay números finitos.
 */
export function getFinalDamage(e: any): number {
  const v1 = e?.damageObj?.final;
  if (Number.isFinite(v1)) return asInt(v1);

  const v2 = e?.damageNumber;
  if (Number.isFinite(v2)) return asInt(v2);

  const v3 = e?.damage;
  if (Number.isFinite(v3)) return asInt(v3);

  return 0;
}

/* ────────────────────────── kinds & casting ──────────────────────────── */

/**
 * Lista blanca de kinds válidos. Úsala para castear strings a LogKind con seguridad.
 */
export const KINDS: readonly LogKind[] = ["hit", "crit", "block", "miss", "passive", "ultimate", "dot", "status"] as const;

/**
 * Convierte un string cualquiera en LogKind si está permitido, sino cae a "hit".
 */
export function toKind(s: string): LogKind {
  return ((KINDS as readonly string[]).includes(s) ? s : "hit") as LogKind;
}

/* ────────────────────────── mapper principal ─────────────────────────── */

/**
 * Mapea el "tipo crudo" de un evento (ev.type / payload.event) a un LogKind
 * estable para tu UI y sonidos. Soporta alias y variantes del backend.
 *
 * Reglas:
 *  - Primero intenta con el "type" explícito si viene del scheduler
 *  - Luego cae a `payload.event`
 *  - Finalmente castea con `toKind` (con fallback a "hit")
 */
export function mapTypeToKind(payload: TimelineBE, type?: string): LogKind {
  // Mapeos explícitos de scheduler
  if (type === "impact_hit") return "hit";
  if (type === "impact_crit") return "crit";
  if (type === "impact_block") return "block";
  if (type === "impact_miss") return "miss";
  if (type === "passive_proc") return "passive";
  if (type === "ultimate_cast") return "ultimate";
  if (type === "dot_tick") return "dot";
  if (type === "status_applied" || type === "status") return "status";

  // Mapeos por payload.event (backend heterogéneo)
  const ev = String(payload.event ?? "");
  if (ev === "ultimate_cast") return "ultimate";
  if (ev === "passive_proc") return "passive";
  if (ev === "dot_tick") return "dot";
  if (ev === "status_applied" || ev === "status") return "status";

  // Casteo seguro con fallback
  return toKind(ev);
}
