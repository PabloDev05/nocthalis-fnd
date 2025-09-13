/* ───────────── Equipo ───────────── */
export type EquipmentSlot =
  | "helmet"
  | "chest"
  | "gloves"
  | "boots"
  | "mainWeapon"
  | "offWeapon"
  | "ring"
  | "belt"
  | "amulet";

export type Equipment = Record<EquipmentSlot, string | null>;

/* ───────────── Stats base (BaseStats) ─────────────
   Debe coincidir con lo que usa allocation.service y el seed.
*/
export interface Stats {
  [x: string]: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  physicalDefense: number;
  magicalDefense: number;
  luck: number;
  endurance: number;
  fate: number; // 👈 requerido por pasivas y proc scaling
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

/* ───────────── CombatStats (redondeados para UI) ─────────────
   Sin MP ni manaSteal (no vienen en tu payload actual).
*/
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

/* ───────────── Skills de clase ───────────── */
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
  proc?: {
    enabled?: boolean;
    respectCooldown?: boolean;
    procInfoEn?: string;
    trigger?: Record<string, any>;
  };
}

/* ───────────── Clase y subclases ───────────── */
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
  passiveDefault?: PassiveDefaultSkill | null; // por compat
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

/* ───────────── Character API principal ─────────────
   Alineado con CharacterResponseDTO del controller.
*/
export interface CharacterApi {
  id: string;
  userId: string; // ObjectId string
  username: string; // viene del populate en /character/me

  class: ClassMetaDTO;
  selectedSubclass: SubclassDTO | null;

  level: number;
  experience: number;

  stats: Stats;
  resistances: Resistances;
  combatStats: CombatStats;

  equipment: Equipment;
  inventory: string[];

  createdAt: string; // ISO
  updatedAt: string; // ISO

  /** URL opcional del retrato del personaje (si el backend lo envía) */
  avatarUrl?: string | null;

  // Extras útiles para la UI
  availablePoints?: number;
  stamina: StaminaSnapshot;

  // Fallbacks / compat opcionales
  className?: string;
  passivesUnlocked?: string[];

  // Atajos opcionales en raíz (la UI los usa si están)
  passiveDefaultSkill?: PassiveDefaultSkill | null;
  passiveDefault?: PassiveDefaultSkill | null;
  ultimateSkill?: UltimateSkill | null;

  /* ──────────── NUEVO: atajos de daño/ataque para la UI ────────────
     Si el backend los envía, la UI los usa; si no, aplica fallback local.
  */
  primaryPowerKey?: "attackPower" | "magicPower"; // qué escalar mostrar como "Attack"
  primaryPower?: number; // valor directo del poder primario (opcional)
  uiDamageMin?: number; // daño mínimo visual
  uiDamageMax?: number; // daño máximo visual
}
