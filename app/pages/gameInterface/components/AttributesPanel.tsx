// app/pages/gameInterface/components/AttributesPanel.tsx
import { Plus, Zap } from "lucide-react";
import { CharacterApi } from "../../../../types/character";
import { asInt, labelize as fmtLabel, readDamageRange } from "../lib/statUtils";
import useGlowOnChange from "../hooks/useGlowOnChange";
import { useMemo } from "react";

// Lectura estricta (sin vitality; backend es la única fuente)
function readStat(data: any, key: string): number {
  return Number.isFinite(Number(data?.stats?.[key]))
    ? Math.trunc(Number(data.stats[key]))
    : 0;
}

export default function AttributesPanel({
  data,
  canAllocate,
  availablePoints,
  allocating,
  allocateOne,
  primaryKey,
  primaryBase,
}: {
  data: CharacterApi;
  canAllocate: boolean;
  availablePoints: number;
  allocating: keyof CharacterApi["stats"] | null;
  allocateOne: (k: keyof CharacterApi["stats"]) => void;
  primaryKey: "attackPower" | "magicPower";
  primaryBase: keyof CharacterApi["stats"];
}) {
  const glowCombat = useGlowOnChange(
    useMemo(
      () => (data?.combatStats ? (data.combatStats as any) : null),
      [data?.combatStats]
    )
  );
  const glowStats = useGlowOnChange(
    useMemo(() => (data?.stats ? (data.stats as any) : null), [data?.stats])
  );

  const dmg = readDamageRange(data);
  const attackVal = asInt((data?.combatStats as any)?.[primaryKey] ?? 0);

  const cls = (data as any)?.class?.name ?? (data as any)?.className ?? "";
  const rows: Array<keyof CharacterApi["stats"]> = (() => {
    const exoNec = ["Exorcist", "Necromancer"];
    const vampWolf = ["Vampire", "Werewolf"];
    if (exoNec.includes(cls))
      return [
        "intelligence",
        "dexterity",
        "constitution",
        "endurance",
        "luck",
        "fate",
      ] as any;
    if (vampWolf.includes(cls))
      return [
        "strength",
        "dexterity",
        "constitution",
        "endurance",
        "luck",
        "fate",
      ] as any;
    const base = [
      primaryBase,
      "dexterity",
      "constitution",
      "endurance",
      "luck",
      "fate",
    ] as const;
    return Array.from(new Set(base)) as Array<keyof CharacterApi["stats"]>;
  })();

  function rightForRow(stat: keyof CharacterApi["stats"], idx: number) {
    if (idx === 0) {
      return {
        label: "Attack",
        value: attackVal,
        tail: dmg ? `${dmg[0]} ~ ${dmg[1]}` : undefined,
        glow:
          Boolean(glowCombat[primaryKey]) ||
          Boolean((glowStats as any)["damageRange"]),
      };
    }
    if (stat === "dexterity") {
      return {
        label: "Evasion",
        value: asInt((data?.combatStats as any)?.evasion ?? 0),
        glow: Boolean(glowCombat["evasion"]),
      };
    }
    if (stat === "constitution") {
      // Solo Block Chance (sin mostrar HP aquí)
      return {
        label: "Block Chance",
        value: asInt((data?.combatStats as any)?.blockChance ?? 0),
        glow: Boolean(glowCombat["blockChance"]),
      };
    }
    if (stat === "endurance") {
      return {
        label: "Damage Reduction",
        value: asInt((data?.combatStats as any)?.damageReduction ?? 0),
        glow: Boolean(glowCombat["damageReduction"]),
      };
    }
    if (stat === "luck") {
      return {
        label: "Critical Chance",
        value: asInt((data?.combatStats as any)?.criticalChance ?? 0),
        glow: Boolean(glowCombat["criticalChance"]),
      };
    }
    if (stat === "fate") {
      return {
        label: "Auto Cast",
        value: asInt((data as any)?.stats?.fate),
        glow: Boolean(glowStats["fate"]),
      };
    }
    return { label: "", value: "", glow: false } as any;
  }

  const lockAll = !!allocating || !canAllocate || (availablePoints ?? 0) <= 0;

  return (
    <div className="card-muted p-3 md:p-4">
      <div className="flex items-center mb-3">
        <span className="text-white font-semibold text-sm flex items-center">
          <Zap className="w-4 h-4 mr-2 text-accent" /> Attributes
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-white/10 border border-[var(--border)] text-zinc-200">
          {Math.max(0, availablePoints)} pts
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((statKey, idx) => {
          const statVal = readStat(data, String(statKey)); // << antes readStatSafe
          const statGlow = (glowStats as any)[String(statKey)];
          const r = rightForRow(statKey, idx);

          return (
            <div key={`${statKey}-${idx}`} className="contents">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">
                  {fmtLabel(String(statKey))}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-white font-bold ${statGlow ? "stat-glow" : ""}`}
                  >
                    {statVal}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      !lockAll &&
                      allocateOne(statKey as keyof CharacterApi["stats"])
                    }
                    disabled={lockAll}
                    className="w-6 h-6 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-white/90 hover:bg-white/10 disabled:opacity-50"
                    title="Allocate 1 point"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full">
                <div className="flex items-baseline justify-between w-full">
                  {r.label ? (
                    <>
                      <span className="text-gray-300 text-xs">{r.label}</span>
                      <span
                        className={`text-accent font-bold text-xs text-right ${r.glow ? "stat-glow" : ""}`}
                      >
                        {r.value}
                        {r.tail && (
                          <span className="ml-1">
                            (
                            <span className={`${r.glow ? "stat-glow" : ""}`}>
                              {r.tail}
                            </span>
                            )
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
