/**
 * CombatLog builder (modular)
 * --------------------------
 * Entiende tanto tipos del scheduler (impact_*) como `event`
 * crudo del backend (hit/crit/block/miss/...).
 */

import type { LogEntry, TimelineBE, LogKind } from "../types";
import { mapTypeToKind } from "./logKinds";
import { txtHit, txtCrit, txtMiss, txtBlock, txtPassive, txtUltimate, txtDot, txtStatusApplied } from "./combatTexts";

export interface BuildLogParams {
  ev: { type?: string; payload?: any; role?: "attacker" | "defender" };
  myName: string;
  oppName: string;
}

export function buildLogEntry({ ev, myName, oppName }: BuildLogParams): LogEntry {
  const p = ev.payload ?? ev;
  const actorIsPlayer = ev.role === "attacker";
  const who = actorIsPlayer ? myName : oppName;
  const tgt = actorIsPlayer ? oppName : myName;

  const type = ev.type ?? String((p as any)?.event ?? "");
  const kind: LogKind = mapTypeToKind(p as TimelineBE, type);

  let text = "";

  switch (type) {
    case "impact_hit":
    case "hit":
      text = txtHit(who, tgt, (p as any)?.damage);
      break;

    case "impact_crit":
    case "crit":
      text = txtCrit(who, tgt, (p as any)?.damage);
      break;

    case "impact_miss":
    case "miss":
      text = txtMiss(who);
      break;

    case "impact_block":
    case "block": {
      const blockedRaw = (p as any)?.breakdown?.blockedAmount ?? (p as any)?.blockedAmount ?? (p as any)?.tags?.blockedAmount ?? undefined;
      text = txtBlock(tgt, who, (p as any)?.damage, blockedRaw);
      break;
    }

    case "passive_proc":
      text = txtPassive(who, (p as any)?.ability?.name, (p as any)?.damage, { pity: (p as any)?.pity, chancePercent: (p as any)?.chancePercent, roll: (p as any)?.roll });
      break;

    case "ultimate_cast":
      text = txtUltimate(who, tgt, (p as any)?.ability?.name, (p as any)?.damage, {
        pity: (p as any)?.pity,
        chancePercent: (p as any)?.chancePercent,
        roll: (p as any)?.roll,
        bonusDamagePercent: (p as any)?.ultimate?.bonusDamagePercent,
        debuff: (p as any)?.ultimate?.debuff,
      });
      break;

    case "dot_tick":
      text = txtDot(who, tgt, (p as any)?.damage);
      break;

    case "status_applied":
    case "status":
      text = txtStatusApplied(
        who,
        tgt,
        (p as any)?.statusApplied?.key ?? (p as any)?.key ?? "status",
        (p as any)?.statusApplied?.duration,
        (p as any)?.statusApplied?.value,
        (p as any)?.statusApplied?.dotPerTurn
      );
      break;

    default:
      text = `${who} acts.`;
      break;
  }

  type CleanPayload = Omit<TimelineBE, "kind" | "actor" | "text" | "turn">;
  const clean: CleanPayload = (p ?? {}) as any;

  return {
    ...clean,
    turn: (p as any)?.turn ?? null,
    kind,
    actor: actorIsPlayer ? "me" : "opp",
    text,
  } as LogEntry;
}
