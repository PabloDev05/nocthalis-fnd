/* ───────────── Equipo ───────────── */
export type EquipmentSlot = "helmet" | "chest" | "gloves" | "boots" | "mainWeapon" | "offWeapon" | "ring" | "belt" | "amulet";

export type Equipment = Record<EquipmentSlot, string | null>;

/* ───────────── Stats base (canon) ───────────── */
export interface Stats {
  [x: string]: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number; // ← canon
  physicalDefense: number;
  magicalDefense: number;
  luck: number;
  endurance: number;
  fate: number;
}

/* ───────────── Resistencias ───────────── */
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

/* ───────────── CombatStats ───────────── */
export interface CombatStats {
  maxHP: number;
  attackPower: number;
  magicPower: number;
  criticalChance: number;
  criticalDamageBonus: number;
  attackSpeed: number;
  evasion: number;
  blockChance: number;
  blockValue: number;
  lifeSteal: number;
  damageReduction: number;
  movementSpeed: number;
}

/* ───────────── Skills / Clase ───────────── */
export interface PassiveDefaultSkill {
  enabled?: boolean;
  name?: string;
  damageType?: string;
  shortDescEn?: string;
  longDescEn?: string;
  trigger?: Record<string, any>;
  durationTurns?: number;
  bonusDamage?: number;
  extraEffects?: Record<string, number>;
}
export interface UltimateSkill {
  enabled?: boolean;
  name?: string;
  description?: string;
  cooldownTurns?: number;
  effects?: Record<string, any>;
  proc?: { enabled?: boolean; respectCooldown?: boolean; procInfoEn?: string; trigger?: Record<string, any> };
}
export interface SubclassDTO {
  id: string;
  name: string;
  iconName: string;
  imageSubclassUrl?: string;
  slug?: string | null;
}
export interface ClassMetaDTO {
  id: string;
  name: string;
  iconName: string;
  imageMainClassUrl: string;
  primaryWeapons: string[];
  secondaryWeapons: string[];
  defaultWeapon: string;
  allowedWeapons: string[];
  passiveDefaultSkill?: PassiveDefaultSkill | null;
  passiveDefault?: PassiveDefaultSkill | null;
  ultimateSkill?: UltimateSkill | null;
  subclasses: SubclassDTO[];
}

/* ───────────── Stamina snapshot ───────────── */
export interface StaminaSnapshot {
  stamina: number;
  staminaMax: number;
  usedRate: number;
  updatedAt: string;
  etaFullAt: string | null;
}

/* ───────────── Character API principal ───────────── */
export interface CharacterApi {
  id: string;
  userId: string;
  username: string;
  class: ClassMetaDTO;
  selectedSubclass: SubclassDTO | null;
  level: number;
  experience: number;

  stats: Stats;
  resistances: Resistances;
  combatStats: CombatStats;
  equipment: Equipment;
  inventory: string[];

  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;

  availablePoints?: number;
  stamina: StaminaSnapshot;

  className?: string;
  passivesUnlocked?: string[];
  passiveDefaultSkill?: PassiveDefaultSkill | null;
  ultimateSkill?: UltimateSkill | null;

  primaryPowerKey?: "attackPower" | "magicPower";
  primaryPower?: number;
  uiDamageMin?: number;
  uiDamageMax?: number;
}
