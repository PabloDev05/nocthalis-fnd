/**
 * Arena logic — Status → Variant mapping
 * ------------------------------------------------------------------
 * Traductor pequeño desde la clave de estado del backend (bleed, fear,
 * silence, etc.) hacia la variante visual usada por tu UI:
 *   - "cc"     → crowd control / control
 *   - "debuff" → debilitación genérica
 *   - "bleed"  → sangrado (activa overlay rojo)
 *
 * Mantener extensible y sin dependencias de React.
 */

export type StatusVariant = "cc" | "debuff" | "bleed";

/** Tabla de mapeos específicos; por defecto cae a "debuff". */
const BLEED_KEYS = new Set(["bleed"]);
const CC_KEYS = new Set(["stun", "freeze", "shock", "sleep", "paralysis", "fear", "silence", "knockback", "confusion"]);

export function statusKeyToVariant(key?: string | null): StatusVariant {
  const k = String(key ?? "").toLowerCase();
  if (BLEED_KEYS.has(k)) return "bleed";
  if (CC_KEYS.has(k)) return "cc";
  return "debuff";
}
