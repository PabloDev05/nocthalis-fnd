/**
 * Arena logic — Opponent mapping
 * ------------------------------------------------------------------
 * Convierte respuestas heterogéneas del backend (opponents/rivals/arrays)
 * a tu tipo interno `Opponent[]`, rellenando y unificando campos.
 *
 * Mantener "puro": sin efectos y sin dependencias de React.
 */

import type { Opponent } from "../types";

/**
 * Extrae una lista cruda de la respuesta del backend, tolerando varias formas:
 *  - { opponents: [...] }
 *  - { rivals: [...] }
 *  - [ ... ] directamente
 */
export function extractRawOpponentList(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.opponents)) return raw.opponents;
  if (Array.isArray(raw?.rivals)) return raw.rivals;
  return [];
}

/**
 * Mapea un item crudo heterogéneo a tu tipo `Opponent`.
 * Toma en cuenta alias comunes de propiedades.
 */
export function mapOneOpponent(raw: any): Opponent {
  return {
    id: String(raw?.userId ?? raw?.id ?? raw?._id ?? ""),
    name: String(raw?.name ?? raw?.username ?? "—"),
    level: Number(raw?.level ?? 0),
    className: raw?.className ?? raw?.class?.name ?? undefined,
    stats: { ...(raw?.stats ?? {}) },
    combatStats: {
      ...(raw?.combatStats ?? {}),
      // alias habituales
      minDamage: raw?.combatStats?.minDamage ?? raw?.combatStats?.damageMin ?? raw?.combatStats?.min ?? undefined,
      maxDamage: raw?.combatStats?.maxDamage ?? raw?.combatStats?.damageMax ?? raw?.combatStats?.max ?? undefined,
      criticalChance: raw?.combatStats?.criticalChance ?? raw?.combatStats?.critChance ?? raw?.combatStats?.crit ?? undefined,
      blockChance: raw?.combatStats?.blockChance ?? raw?.combatStats?.block ?? undefined,
      evasion:
        raw?.combatStats?.evasion ??
        raw?.combatStats?.evade ??
        raw?.combatStats?.evasionChance ??
        raw?.combatStats?.evadeChance ??
        raw?.combatStats?.dodge ??
        raw?.combatStats?.dodgeChance ??
        undefined,
      attackPower: raw?.combatStats?.attackPower,
      magicPower: raw?.combatStats?.magicPower,
    },
    maxHP: Number(raw?.maxHP ?? raw?.combatStats?.maxHP ?? 0),
    avatarUrl: raw?.avatarUrl ?? null,
    passiveDefaultSkill: null,
    ultimateSkill: null,
    clanName: raw?.clanName ?? raw?.clan?.name ?? raw?.guild?.name ?? null,
    honor: raw?.honor ?? raw?.rating ?? null,
  };
}

/**
 * Entrada canónica: cualquier respuesta del endpoint,
 * Salida: Opponent[] limpio y ordenado opcionalmente por nivel desc.
 */
export function mapOpponentsResponseToList(responseData: any, options?: { sortByLevelDesc?: boolean }): Opponent[] {
  const list = extractRawOpponentList(responseData).map(mapOneOpponent);
  if (options?.sortByLevelDesc) {
    list.sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  }
  return list;
}
