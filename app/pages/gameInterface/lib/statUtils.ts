/** utilidades sin normalización ni defaults “mágicos” */

export function asInt(v: any, d = 0): number {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : d;
}

/** etiquetas bonitas para UI */
export function labelize(k: string): string {
  return (
    (
      {
        strength: "Strength",
        dexterity: "Dexterity",
        intelligence: "Intelligence",
        constitution: "Constitution",
        endurance: "Endurance",
        luck: "Luck",
        fate: "Fate",
        physicalDefense: "Physical Defense",
        magicalDefense: "Magical Defense",
      } as Record<string, string>
    )[k] || k[0]?.toUpperCase() + k.slice(1)
  );
}

/** daño visible: usa backend si lo provee; no calculamos nada si no hay */
export function readDamageRange(data: any): [number, number] | null {
  const lo = asInt((data as any)?.uiDamageMin, -1);
  const hi = asInt((data as any)?.uiDamageMax, -1);
  if (lo >= 0 && hi >= 0) return [lo, hi];
  return null;
}
