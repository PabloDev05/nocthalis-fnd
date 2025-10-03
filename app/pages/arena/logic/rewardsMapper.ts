/**
 * Arena logic — Rewards mapper
 * ------------------------------------------------------------------
 * Normaliza distintos formatos de recompensa del backend a tu tipo
 * interno `Reward`. Mantener libre de React.
 */

import type { Reward } from "../types";
import { asInt } from "../helpers";

/** Convierte cualquier payload crudo de rewards → Reward | null */
export function mapRewards(raw: any): Reward {
  if (!raw) return null;

  const gold = raw.goldGained ?? raw.gold ?? raw.coins ?? raw.money ?? 0;

  const xp = raw.xpGained ?? raw.xp ?? raw.experience ?? 0;

  const honor = raw.honorDelta ?? raw.honor ?? undefined;

  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        name: String(it?.name ?? it?.itemName ?? "Item"),
        qty: asInt(it?.qty ?? it?.quantity ?? 1),
      }))
    : [];

  return {
    gold: asInt(gold),
    xp: asInt(xp),
    honor: typeof honor === "number" ? asInt(honor) : undefined,
    items,
  };
}
