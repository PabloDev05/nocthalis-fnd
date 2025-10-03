// app/pages/arena/helpers.ts
import type { StaminaSnap, TimelineBE, TimelineEvent } from "./types";

/* ── números / formato ─────────────────────────────────────────── */

export const asInt = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

export function extractStamina(obj: any): StaminaSnap {
  const src = obj && typeof obj === "object" && "data" in obj ? (obj as any).data : obj;
  if (!src || typeof src !== "object") return { current: 0, max: 10 };

  const current = asInt(src.current ?? src.value ?? src.stamina ?? src.energy ?? src?.snapshot?.current ?? 0);
  const maxRaw = asInt(src.max ?? src.maxValue ?? src.staminaMax ?? src.energyMax ?? src.capacity ?? src?.snapshot?.max ?? 10) || 10;

  const max = Math.max(1, maxRaw);
  return { current: Math.min(Math.max(0, current), max), max };
}

export const formatChance = (v?: number) => {
  const n = Number(v ?? 0);
  return n >= 0 && n <= 1 ? `${Math.round(n * 100)}` : `${Math.round(n)}`;
};

export const fatePercent = (v?: number) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0%";
  return n <= 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}%`;
};

export const skillText = (obj?: { name?: string; description?: string } | null) => (obj?.name ? `${obj.name}${obj.description ? `: ${obj.description}` : ""}` : null);

/* ── normalización de eventos (nuevo formato) ──────────────────── */

export function normalizeEvent(raw?: TimelineBE | null): TimelineEvent {
  if (!raw) return "hit";
  const ev = String(raw.event || "").toLowerCase();
  switch (ev) {
    case "crit":
      return "crit";
    case "block":
      return "block";
    case "miss":
      return "miss";
    case "passive_proc":
      return "passive_proc";
    case "ultimate_cast":
      return "ultimate_cast";
    case "dot_tick":
      return "dot_tick";
    case "status_applied":
      return "status_applied";
    case "hit":
    default:
      return "hit";
  }
}

/* ── enrich (solo alinea campos, no calcula nada) ─────────────────
   - Mantiene overkill
   - Asegura damageObj.final y (si viene) .raw
   - Copia/propaga breakdown top-level ↔ breakdown{}
   - Normaliza source/actor "player/enemy" → "attacker/defender"
─────────────────────────────────────────────────────────────────── */

export function enrichTimelinePayload<T extends TimelineBE>(raw: T): T {
  const e: any = { ...raw };

  // turn a número
  e.turn = asInt(e.turn ?? 0) || 0;

  // normalizar roles si vinieran como "player/enemy"
  if (e.source === "player") e.source = "attacker";
  if (e.source === "enemy") e.source = "defender";
  if (e.actor === "player") e.actor = "attacker";
  if (e.actor === "enemy") e.actor = "defender";

  // damageObj.final (preferencia: damageObj.final > damageNumber > damage)
  const finalCand =
    (e.damageObj && Number.isFinite(e.damageObj.final) && e.damageObj.final) ?? (Number.isFinite(e.damageNumber) ? e.damageNumber : undefined) ?? (Number.isFinite(e.damage) ? e.damage : undefined);

  if (!e.damageObj) e.damageObj = {};
  if (finalCand != null) e.damageObj.final = asInt(finalCand);

  // damageObj.raw si el BE manda rawDamage
  if (Number.isFinite(e.rawDamage) && e.damageObj.raw == null) {
    e.damageObj.raw = asInt(e.rawDamage);
  }

  // asegurar breakdown y propagar campos desde top-level si existen allí
  const bIn = e.breakdown || {};
  const blockedAmount = Number.isFinite(e.blockedAmount) ? e.blockedAmount : Number.isFinite(bIn.blockedAmount) ? bIn.blockedAmount : undefined;

  const preBlock = Number.isFinite(e.preBlock) ? e.preBlock : Number.isFinite(bIn.preBlock) ? bIn.preBlock : undefined;

  const finalAfterBlock = Number.isFinite(e.finalAfterBlock) ? e.finalAfterBlock : Number.isFinite(bIn.finalAfterBlock) ? bIn.finalAfterBlock : undefined;

  const finalAfterDR = Number.isFinite(e.finalAfterDR) ? e.finalAfterDR : Number.isFinite(bIn.finalAfterDR) ? bIn.finalAfterDR : undefined;

  const drReducedPercent = Number.isFinite(e.drReducedPercent) ? e.drReducedPercent : Number.isFinite(bIn.drReducedPercent) ? bIn.drReducedPercent : undefined;

  e.breakdown = {
    ...bIn,
    ...(blockedAmount != null ? { blockedAmount: asInt(blockedAmount) } : {}),
    ...(preBlock != null ? { preBlock: asInt(preBlock) } : {}),
    ...(finalAfterBlock != null ? { finalAfterBlock: asInt(finalAfterBlock) } : {}),
    ...(finalAfterDR != null ? { finalAfterDR: asInt(finalAfterDR) } : {}),
    ...(drReducedPercent != null ? { drReducedPercent: asInt(drReducedPercent) } : {}),
  };

  // reflejar blockedAmount en top-level si solo estaba en breakdown
  if (e.blockedAmount == null && e.breakdown.blockedAmount != null) {
    e.blockedAmount = asInt(e.breakdown.blockedAmount);
  }

  // overkill: asegurar entero ≥ 0 si viene
  if (Number.isFinite(e.overkill)) {
    e.overkill = Math.max(0, asInt(e.overkill));
  }

  return e as T;
}
