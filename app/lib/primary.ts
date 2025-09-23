import type { CombatStats, Resistances, Stats } from "../../types/character";

const I = (v: any, d = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : d;
};

export function normalizeStats(raw: any): Stats {
  return {
    strength: I(raw?.strength, 0),
    dexterity: I(raw?.dexterity, 0),
    intelligence: I(raw?.intelligence, 0),
    constitution: I(raw?.constitution, 0),
    physicalDefense: I(raw?.physicalDefense, 0),
    magicalDefense: I(raw?.magicalDefense, 0),
    luck: I(raw?.luck, 0),
    endurance: I(raw?.endurance, 0),
    fate: I(raw?.fate, 0),
  };
}

export function normalizeCombat(raw: any): CombatStats {
  return {
    maxHP: I(raw?.maxHP, 1),
    attackPower: I(raw?.attackPower, 0),
    magicPower: I(raw?.magicPower, 0),
    criticalChance: I(raw?.criticalChance, 0),
    criticalDamageBonus: I(raw?.criticalDamageBonus, 0),
    attackSpeed: I(raw?.attackSpeed, 0),
    evasion: I(raw?.evasion, 0),
    blockChance: I(raw?.blockChance, 0),
    blockValue: I(raw?.blockValue, 0),
    lifeSteal: I(raw?.lifeSteal, 0),
    damageReduction: I(raw?.damageReduction, 0),
    movementSpeed: I(raw?.movementSpeed, 0),
  };
}

export function normalizeResist(raw: any): Resistances {
  const keys = [
    "fire",
    "ice",
    "lightning",
    "poison",
    "sleep",
    "paralysis",
    "confusion",
    "fear",
    "dark",
    "holy",
    "stun",
    "bleed",
    "curse",
    "knockback",
    "criticalChanceReduction",
    "criticalDamageReduction",
  ] as const;
  const out: any = {};
  for (const k of keys) out[k] = I(raw?.[k], 0);
  return out as Resistances;
}

export function resolvePrimaryCombatKey(primaryFromApi?: any, className?: string) {
  const n = (className ?? "").toLowerCase();
  if (/necromancer|exorcist|mage|wizard|sorcer/.test(n)) return "magicPower" as const;
  if (primaryFromApi === "magicPower" || primaryFromApi === "attackPower") return primaryFromApi;
  return "attackPower" as const;
}

export function primaryBaseStatForClass(className?: string) {
  const n = (className ?? "").toLowerCase();
  if (/necromancer|exorcist|mage|wizard|sorcer/.test(n)) return "intelligence";
  if (/revenant/.test(n)) return "dexterity";
  if (/vampire|werewolf/.test(n)) return "strength";
  return "strength";
}
