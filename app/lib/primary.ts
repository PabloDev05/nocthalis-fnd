// src/lib/primary.ts
/**
 * Utilidades para "fuente de poder" según clase y etiqueta de UI.
 * - Determina qué stat base es el primario de la clase.
 * - Mapea la métrica de combate primaria (attackPower vs magicPower).
 */

export type PrimaryKey = "attackPower" | "magicPower";
export type BasePrimaryStat = "strength" | "dexterity" | "intelligence";

/** Nombre de clase → stat base primario */
export function primaryBaseStatForClass(className?: string | null): BasePrimaryStat {
  const n = String(className || "").trim().toLowerCase();
  if (!n) return "strength";

  // INT
  if (n.includes("exorcist") || n.includes("necromancer")) return "intelligence";
  // DEX
  if (n.includes("revenant")) return "dexterity";
  // STR
  if (n.includes("vampire") || n.includes("werewolf")) return "strength";

  // fallback conservador
  return "strength";
}

/** Nombre de clase → combate primario (attackPower vs magicPower) */
export function primaryCombatKeyForClass(className?: string | null): PrimaryKey {
  const p = primaryBaseStatForClass(className);
  return p === "intelligence" ? "magicPower" : "attackPower";
}

/** Intenta usar una clave enviada por backend, si no existe usa la derivación por clase */
export function resolvePrimaryCombatKey(
  hintFromApi: unknown,
  className?: string | null
): PrimaryKey {
  const hint = String(hintFromApi || "").trim();
  if (hint === "magicPower" || hint === "attackPower") return hint as PrimaryKey;
  return primaryCombatKeyForClass(className);
}

/** Normaliza objetos de stats asegurando que todas las claves existan */
export function normalizeStats<T extends Record<string, any>>(obj: T | null | undefined) {
  const base = {
    strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
    physicalDefense: 0, magicalDefense: 0, luck: 0, endurance: 0, fate: 0,
  };
  return { ...base, ...(obj || ({} as any)) };
}

export function normalizeCombat<T extends Record<string, any>>(obj: T | null | undefined) {
  const base = {
    maxHP: 0, attackPower: 0, magicPower: 0, criticalChance: 0, criticalDamageBonus: 0,
    attackSpeed: 0, evasion: 0, blockChance: 0, blockValue: 0, lifeSteal: 0,
    damageReduction: 0, movementSpeed: 0,
  };
  return { ...base, ...(obj || ({} as any)) };
}

export function normalizeResist<T extends Record<string, any>>(obj: T | null | undefined) {
  const base = {
    fire: 0, ice: 0, lightning: 0, poison: 0, sleep: 0, paralysis: 0, confusion: 0, fear: 0,
    dark: 0, holy: 0, stun: 0, bleed: 0, curse: 0, knockback: 0,
    criticalChanceReduction: 0, criticalDamageReduction: 0,
  };
  return { ...base, ...(obj || ({} as any)) };
}
