// src/pages/arena/helpers.ts
import type { StaminaSnap, TimelineBE, TimelineEvent, LogEntry } from "./types";

export const asInt = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/** Extrae {current,max} desde varias formas de snapshot del backend */
export function extractStamina(obj: any): StaminaSnap {
  // soportar axiosResponse-like: { data: {...} }
  const src = obj && typeof obj === "object" && "data" in obj ? (obj as any).data : obj;
  if (!src || typeof src !== "object") return { current: 0, max: 10 };

  const current = asInt(src.current ?? src.value ?? src.stamina ?? src.energy ?? src?.snapshot?.current ?? 0);

  const maxRaw = asInt(src.max ?? src.maxValue ?? src.staminaMax ?? src.energyMax ?? src.capacity ?? src?.snapshot?.max ?? 10) || 10;

  const max = Math.max(1, maxRaw);
  // clamp para que nunca mostremos más que el máximo
  const clamped = Math.min(Math.max(0, current), max);

  return { current: clamped, max };
}

export const formatChance = (v: number | undefined) => {
  const n = Number(v ?? 0);
  return n >= 0 && n <= 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}`;
};

export const fatePercent = (v: number | undefined) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0%";
  return n <= 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}%`;
};

export const skillText = (obj?: { name?: string; description?: string } | null) => (obj?.name ? `${obj.name}${obj.description ? `: ${obj.description}` : ""}` : null);

/* ─── robust event detection ─── */
function hasAny(obj: any, keys: string[]) {
  return keys.some((k) => {
    const v = (obj as any)?.[k];
    return v === true || String(v ?? "").toLowerCase() === k.toLowerCase();
  });
}

function readFlags(raw: any) {
  const ev = String(raw?.event ?? raw?.outcome ?? "").toLowerCase();
  const tags = raw?.tags;

  const tagHas = (key: string) => {
    if (!tags) return false;
    if (Array.isArray(tags)) return tags.some((t) => String(t).toLowerCase().includes(key));
    if (typeof tags === "object") {
      const t = tags as Record<string, any>;
      const v = t[key] ?? t[key.toUpperCase()] ?? t[key.toLowerCase()];
      return v === true || (typeof v === "string" && v.toLowerCase().includes(key));
    }
    return false;
  };

  const isCrit = hasAny(raw, ["crit", "isCrit", "critical"]) || tagHas("crit") || /crit/.test(ev);
  const isBlock = hasAny(raw, ["blocked", "isBlocked", "block"]) || tagHas("block") || /block/.test(ev);
  const isMiss = hasAny(raw, ["miss", "isMiss", "dodged", "evade", "evaded"]) || tagHas("miss") || /(miss|dodge|evad)/.test(ev);
  const isDot = hasAny(raw, ["dot", "bleed", "poison", "burn"]) || tagHas("dot") || /(dot|tick|bleed|poison|burn)/.test(ev);
  const isPassive = raw?.ability?.kind === "passive" || tagHas("passive") || ev.includes("passive");
  const isUltimate = raw?.ability?.kind === "ultimate" || tagHas("ultimate") || ev.includes("ultimate");

  return { isCrit, isBlock, isMiss, isDot, isPassive, isUltimate };
}

export function normalizeEvent(raw?: TimelineBE | null): TimelineEvent {
  if (!raw) return "hit";
  const ev = String(raw?.event ?? raw?.outcome ?? "").toLowerCase();
  const f = readFlags(raw);
  if (f.isPassive) return "passive_proc";
  if (f.isUltimate) return "ultimate_cast";
  if (f.isDot) return "dot_tick";
  if (f.isMiss) return "miss";
  if (f.isBlock) return "block";
  if (f.isCrit) return "crit";
  if (["attack", "strike", "impact", "hit"].includes(ev)) return "hit";
  return "hit";
}

// Detecta bloqueos en distintas formas de tu payload
export function isBlockEntry(e: Partial<LogEntry> & Record<string, any>): boolean {
  if (!e) return false;
  const msg = String(e.message ?? e.text ?? "").toLowerCase();
  if (msg.startsWith("blocked!") || msg.includes(" blocked!") || msg.includes(" block ")) return true;
  if (e.type === "BLOCK" || e.kind === "block" || e.event === "BLOCK") return true;
  // Heurística: si "through" < "raw" => absorbió parte
  const raw = Number(e.raw ?? e.damageRaw ?? e.damage);
  const through = Number(e.through ?? e.damageThrough ?? e.final);
  if (Number.isFinite(raw) && Number.isFinite(through) && through >= 0 && raw > through) return true;
  return false;
}
