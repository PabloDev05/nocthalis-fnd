import type { StaminaSnap, TimelineBE, TimelineEvent, LogEntry } from "./types";

export const asInt = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/** Extrae {current,max} desde varias formas de snapshot del backend */
export function extractStamina(obj: any): StaminaSnap {
  const src = obj && typeof obj === "object" && "data" in obj ? (obj as any).data : obj;
  if (!src || typeof src !== "object") return { current: 0, max: 10 };

  const current = asInt(src.current ?? src.value ?? src.stamina ?? src.energy ?? src?.snapshot?.current ?? 0);
  const maxRaw = asInt(src.max ?? src.maxValue ?? src.staminaMax ?? src.energyMax ?? src.capacity ?? src?.snapshot?.max ?? 10) || 10;

  const max = Math.max(1, maxRaw);
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

function readTags(tags: any) {
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
  return tagHas;
}

/** Extrae un número desde tags tipo "...:chance:23" o "...:roll:57" (ignora prefijos attacker/defender) */
function getNumFromTags(tags: any, token: "chance" | "roll"): number | undefined {
  if (!tags) return;
  const rx = new RegExp(`${token}:(\\d+)`, "i");

  if (Array.isArray(tags)) {
    for (const t of tags) {
      const m = rx.exec(String(t));
      if (m && m[1] != null) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) return Math.trunc(n);
      }
    }
    return;
  }
  if (typeof tags === "object") {
    // si viniera como { chance: 23, roll: 57 }
    const v = (tags as any)[token];
    if (Number.isFinite(Number(v))) return Math.trunc(Number(v));
    // o embebido en strings de propiedades
    for (const [, vv] of Object.entries(tags as Record<string, any>)) {
      const m = rx.exec(String(vv));
      if (m && m[1] != null) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) return Math.trunc(n);
      }
    }
  }
  return;
}

function hasPityTag(tags: any): boolean {
  if (!tags) return false;
  if (Array.isArray(tags)) return tags.some((t) => String(t).toLowerCase().includes(":pity"));
  if (typeof tags === "object") {
    for (const vv of Object.values(tags as Record<string, any>)) {
      if (String(vv).toLowerCase().includes(":pity")) return true;
    }
  }
  return false;
}

function readFlags(raw: any) {
  // 👇 casteo a any para que TS no se queje aunque TimelineBE no tenga 'type'
  const ev = String(raw?.event ?? (raw as any)?.type ?? raw?.outcome ?? "").toLowerCase();
  const tagHas = readTags(raw?.tags);

  const isStatus = ev === "status_applied" || tagHas("status_applied") || Boolean((raw as any)?.statusApplied);
  const isCrit = hasAny(raw, ["crit", "isCrit", "critical"]) || tagHas("crit") || /crit/.test(ev);
  const isBlock = hasAny(raw, ["blocked", "isBlocked", "block"]) || tagHas("block") || /block/.test(ev);
  const isMiss = hasAny(raw, ["miss", "isMiss", "dodged", "evade", "evaded"]) || tagHas("miss") || /(miss|dodge|evad)/.test(ev);
  const isDot = hasAny(raw, ["dot", "bleed", "poison", "burn"]) || tagHas("dot") || /(dot|tick|bleed|poison|burn)/.test(ev);
  const isPassive = raw?.ability?.kind === "passive" || tagHas("passive") || ev.includes("passive");
  const isUltimate = raw?.ability?.kind === "ultimate" || tagHas("ultimate") || ev.includes("ultimate");

  return { isStatus, isCrit, isBlock, isMiss, isDot, isPassive, isUltimate };
}

export function normalizeEvent(raw?: TimelineBE | null): TimelineEvent {
  if (!raw) return "hit";
  const ev = String(raw?.event ?? (raw as any)?.type ?? raw?.outcome ?? "").toLowerCase();
  const f = readFlags(raw);

  // explícitos primero
  if (ev === "status_applied") return "status_applied";
  if (ev === "ultimate_cast") return "ultimate_cast";
  if (ev === "passive_proc") return "passive_proc";
  if (ev === "dot_tick") return "dot_tick";

  // por flags
  if (f.isStatus) return "status_applied";
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

/* ──────────────────────────────────────────────────────────────────
   NUEVO: enrichTimelinePayload
   - No hace cálculos. Solo reacomoda/alias campos para la UI/scheduler.
   - Ahora extrae chance/roll/pity de tags en PASSIVE/ULTIMATE.
   ────────────────────────────────────────────────────────────────── */
export function enrichTimelinePayload<T extends TimelineBE>(raw: T): T {
  const e: any = { ...raw };

  // blockedAmount → breakdown.blockedAmount
  const blockedFromTags = (typeof e.tags === "object" && e.tags?.blockedAmount != null ? Number(e.tags.blockedAmount) : undefined) ?? e.blockedAmount ?? e.breakdown?.blockedAmount;

  if (blockedFromTags != null) {
    e.breakdown = {
      ...(e.breakdown || {}),
      blockedAmount: asInt(blockedFromTags),
    };
  }

  // dotKey a partir de tags/flags legacy
  const tagKey = typeof e.tags === "object" ? String((e.tags as any).key ?? "") : "";
  const dotKey = e.dotKey || (tagKey === "bleed" || tagKey === "poison" || tagKey === "burn" ? tagKey : null) || (e.bleed ? "bleed" : e.poison ? "poison" : e.burn ? "burn" : null);
  if (dotKey) e.dotKey = dotKey;

  // ultimate preview desde tags (si alguna vez lo usaste así)
  if (typeof e.tags === "object" && (e.tags as any).ultimate) {
    const u = (e.tags as any).ultimate || {};
    e.ultimate = {
      bonusDamagePercent: u.bonusDamagePercent != null ? asInt(u.bonusDamagePercent) : undefined,
      debuff: u.debuff
        ? {
            key: u.debuff.key,
            value: u.debuff.value != null ? asInt(u.debuff.value) : undefined,
            duration: u.debuff.duration != null ? asInt(u.debuff.duration) : undefined,
            dotPerTurn: u.debuff.dotPerTurn != null ? asInt(u.debuff.dotPerTurn) : undefined,
          }
        : undefined,
    };
  }

  // status_applied desde tags (si el BE lo manda así)
  if (typeof e.tags === "object" && (e.tags as any).statusApplied) {
    const s = (e.tags as any).statusApplied || {};
    e.event = "status_applied";
    e.statusApplied = {
      key: s.key,
      target: s.target, // "attacker" | "defender" relativo al turno
      duration: Math.max(1, asInt(s.duration ?? 0)),
      cc: !!s.cc,
      value: s.value != null ? asInt(s.value) : undefined,
      dotPerTurn: s.dotPerTurn != null ? asInt(s.dotPerTurn) : undefined,
      stacks: s.stacks != null ? asInt(s.stacks) : undefined,
    };
  }

  // ── NUEVO: chance/roll/pity para passive/ultimate desde tags "…:chance:X", "…:roll:Y", "…:pity"
  const ev = String(e.event ?? "").toLowerCase();
  if (ev === "ultimate_cast" || ev === "passive_proc") {
    const chance = getNumFromTags(e.tags, "chance");
    const roll = getNumFromTags(e.tags, "roll");
    const pity = hasPityTag(e.tags);

    e.chancePercent = Number.isFinite(Number(e.chancePercent)) ? asInt(e.chancePercent) : (chance ?? undefined);
    e.roll = Number.isFinite(Number(e.roll)) ? asInt(e.roll) : (roll ?? undefined);
    e.pity = Boolean(e.pity) || pity;

    // asegurar estructura de ability
    e.ability = e.ability || {};
    if (ev === "ultimate_cast") e.ability.kind = "ultimate";
    if (ev === "passive_proc") e.ability.kind = "passive";
    if (e.ability.durationTurns != null) e.ability.durationTurns = asInt(e.ability.durationTurns);
    if (e.ability.name != null) e.ability.name = String(e.ability.name);
  }

  return e as T;
}
