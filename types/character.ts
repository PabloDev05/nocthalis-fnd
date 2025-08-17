// app/types/character.ts
export type EquipmentSlot = "helmet" | "chest" | "gloves" | "boots" | "mainWeapon" | "offWeapon" | "ring" | "belt" | "amulet";

export type Equipment = Record<EquipmentSlot, string | null>;

/** Stats base del personaje (tal como las manejas en el proyecto) */
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
  criticalChance: number; // puede venir como porcentaje (12.9) en tu API
  criticalDamageBonus: number; // idem (ej: 41.4)
  attackSpeed: number;
  evasion: number; // idem (8, 12.9, etc.)
  blockChance: number; // idem
  blockValue: number;
  lifeSteal: number;
  manaSteal: number;
  damageReduction: number; // idem
  movementSpeed: number;
}

/** Forma compacta de la pasiva por defecto de la clase */
export interface PassiveDefault {
  name: string; // p.ej. "Sombra Letal"
  description: string; // texto completo
  short?: string; // opcional: resumen corto para el badge (p.ej. "+30% daño crítico")
}

export interface CharacterApi {
  id: string;
  userId: string; // ObjectId string
  classId: string; // ObjectId string
  subclassId?: string | null;

  name: string;
  level: number;
  experience: number;

  /** puntos por asignar (aparece el botón "+") */
  availablePoints?: number;

  /** HP actual (si el backend lo envía; útil para UI sin suposiciones) */
  currentHP?: number;

  stats: Stats;
  resistances: Resistances;
  combatStats: CombatStats;

  passivesUnlocked: string[];
  inventory: string[];
  equipment: Equipment;

  /** Nombre de la clase si lo envías plano */
  className?: string;

  /**
   * Info completa de clase (opcional). Útil para mostrar la pasiva por defecto
   * sin hacer otra llamada (Arena/Game).
   */
  class?: {
    name: string;
    passiveDefault?: PassiveDefault | null;
  } | null;

  /**
   * Atajo opcional si prefieres mandarlo directo en la raíz.
   * (El UI usará class?.passiveDefault ?? passiveDefault si existe)
   */
  passiveDefault?: PassiveDefault | null;
}
