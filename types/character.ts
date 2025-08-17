// app/types/character.ts
export type EquipmentSlot = "helmet" | "chest" | "gloves" | "boots" | "mainWeapon" | "offWeapon" | "ring" | "belt" | "amulet";

export type Equipment = Record<EquipmentSlot, string | null>;

export interface Stats {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  physicalDefense: number;
  magicalDefense: number;
  luck: number;
  agility: number;
  endurance: number;
  wisdom: number;
}

export interface Resistances {
  fire: number;
  ice: number;
  lightning: number;
  poison: number;
  sleep: number;
  paralysis: number;
  confusion: number;
  fear: number;
  dark: number;
  holy: number;
  stun: number;
  bleed: number;
  curse: number;
  knockback: number;
  criticalChanceReduction: number;
  criticalDamageReduction: number;
}

export interface CombatStats {
  maxHP: number;
  maxMP: number;
  attackPower: number;
  magicPower: number;
  criticalChance: number;
  criticalDamageBonus: number;
  attackSpeed: number;
  evasion: number;
  blockChance: number;
  blockValue: number;
  lifeSteal: number;
  manaSteal: number;
  damageReduction: number;
  movementSpeed: number;
}

export interface CharacterApi {
  id: string;
  userId: string; // ObjectId string
  classId: string; // ObjectId string
  subclassId?: string | null;
  name: string;
  level: number;
  experience: number;

  /** ⬇️ agrega este campo (lo manda tu backend cuando subes de nivel) */
  availablePoints?: number;

  stats: Stats;
  resistances: Resistances;
  combatStats: CombatStats;

  passivesUnlocked: string[];
  inventory: string[]; // ids de items
  equipment: Equipment;

  className?: string; // opcional si lo envías
}
