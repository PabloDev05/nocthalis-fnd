/**
 * Arena logic — Duel state reset & boot (sin hpMe/hpOpp)
 * ------------------------------------------------------
 * Estados agrupados: FX + textos + rangos (NO incluye hpMe / hpOpp).
 */

export interface DuelStateValues {
  combatLog: any[];
  duelResult: any;
  rewards: any;

  // FX
  pulseLeftPassive: number;
  pulseLeftUlt: number;
  pulseRightPassive: number;
  pulseRightUlt: number;
  hpGlowLeft: number;
  hpGlowRight: number;
  blockFlashLeft: number;
  blockFlashRight: number;
  ultFlashLeft: number;
  ultFlashRight: number;
  ultShakeLeft: number;
  ultShakeRight: number;
  hitShakeLeft: number;
  hitShakeRight: number;
  blockBumpLeft: number;
  blockBumpRight: number;
  statusFlashLeft: number;
  statusFlashRight: number;
  statusVariantLeft: "cc" | "debuff" | "bleed" | null;
  statusVariantRight: "cc" | "debuff" | "bleed" | null;
  missNudgeLeft: number;
  missNudgeRight: number;

  // textos
  myPassiveText: string | null;
  myUltText: string | null;
  oppPassiveText: string | null;
  oppUltText: string | null;

  // rangos
  myDmgRange: { min: number; max: number } | null;
  oppDmgRange: { min: number; max: number } | null;
}

/** Estado base al inicializar el hook. */
export function getInitialDuelState(): DuelStateValues {
  return {
    combatLog: [],
    duelResult: null,
    rewards: null,

    pulseLeftPassive: 0,
    pulseLeftUlt: 0,
    pulseRightPassive: 0,
    pulseRightUlt: 0,
    hpGlowLeft: 0,
    hpGlowRight: 0,
    blockFlashLeft: 0,
    blockFlashRight: 0,
    ultFlashLeft: 0,
    ultFlashRight: 0,
    ultShakeLeft: 0,
    ultShakeRight: 0,
    hitShakeLeft: 0,
    hitShakeRight: 0,
    blockBumpLeft: 0,
    blockBumpRight: 0,
    statusFlashLeft: 0,
    statusFlashRight: 0,
    statusVariantLeft: null,
    statusVariantRight: null,
    missNudgeLeft: 0,
    missNudgeRight: 0,

    myPassiveText: null,
    myUltText: null,
    oppPassiveText: null,
    oppUltText: null,

    myDmgRange: null,
    oppDmgRange: null,
  };
}

/** Reset para un NUEVO duelo (merge con el estado actual). */
export function resetForNewDuel(): Partial<DuelStateValues> {
  return {
    combatLog: [],
    duelResult: null,
    rewards: null,

    pulseLeftPassive: 0,
    pulseLeftUlt: 0,
    pulseRightPassive: 0,
    pulseRightUlt: 0,
    hpGlowLeft: 0,
    hpGlowRight: 0,
    blockFlashLeft: 0,
    blockFlashRight: 0,
    ultFlashLeft: 0,
    ultFlashRight: 0,
    ultShakeLeft: 0,
    ultShakeRight: 0,
    hitShakeLeft: 0,
    hitShakeRight: 0,
    blockBumpLeft: 0,
    blockBumpRight: 0,
    statusFlashLeft: 0,
    statusFlashRight: 0,
    statusVariantLeft: null,
    statusVariantRight: null,
    missNudgeLeft: 0,
    missNudgeRight: 0,

    myPassiveText: "—",
    myUltText: "—",
    oppPassiveText: "—",
    oppUltText: "—",

    myDmgRange: null,
    oppDmgRange: null,
  };
}

/** Reset al volver a “select” (merge). */
export function resetForBackToSelect(): Partial<DuelStateValues> {
  return {
    combatLog: [],
    duelResult: null,
    rewards: null,
  };
}
