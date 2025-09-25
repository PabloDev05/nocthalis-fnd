// app/pages/gameInterface/components/CombatMetrics.tsx
import { BarChart2 } from "lucide-react";
import Tooltip from "./Tooltip";
import useGlowOnChange from "../hooks/useGlowOnChange";
import { asInt, labelize } from "../lib/statUtils";
import { CharacterApi } from "../../../../types/character";
import { useMemo } from "react";

const KEYS: ReadonlyArray<keyof NonNullable<CharacterApi["combatStats"]>> = [
  "maxHP",
  "attackSpeed",
];

const HINTS: Partial<Record<string, string>> = {
  maxHP: "Maximum health pool.",
  attackSpeed: "Percent faster attack cadence.",
};

const RESIST_HINTS = {
  ccr: "Reduces incoming attackers' critical chance by this value (percentage points).",
  cdr: "Reduces incoming critical damage multiplier additively (percentage points).",
};

export default function CombatMetrics({ data }: { data: CharacterApi | null }) {
  const cs = data?.combatStats as any;
  const glow = useGlowOnChange(
    useMemo(
      () => (cs ? (cs as Record<string, number | undefined>) : null),
      [cs]
    )
  );

  return (
    <div className="dark-panel p-3 h-full">
      <h3 className="text-white font-semibold mb-3 text-sm flex items-center">
        <BarChart2 className="w-4 h-4 mr-2 text-accent" />
        Combat Metrics
      </h3>

      {/* ⭐ Divisoria debajo del título */}
      <div className="mt-2 mb-3 h-px w-full bg-[var(--border)]/80" />

      <div className="grid grid-cols-2 gap-2.5">
        {KEYS.map((k) => (
          <div key={String(k)} className="flex justify-between items-center">
            <Tooltip text={HINTS[String(k)] ?? ""}>
              <span className="text-gray-300 text-xs">
                {labelize(String(k))}
              </span>
            </Tooltip>
            <span
              className={`text-accent font-bold text-xs ${
                glow[String(k)] ? "stat-glow" : ""
              }`}
            >
              {asInt(cs?.[k] ?? 0)}
            </span>
          </div>
        ))}

        {/* Defensas planas (en stats) */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-xs">Physical Defense</span>
          <span className="text-accent font-bold text-xs">
            {asInt((data as any)?.stats?.physicalDefense)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-xs">Magical Defense</span>
          <span className="text-accent font-bold text-xs">
            {asInt((data as any)?.stats?.magicalDefense)}
          </span>
        </div>

        {/* Reducciones de crítico (en resistances) */}
        <div className="flex justify-between items-center">
          <Tooltip text={RESIST_HINTS.ccr}>
            <span className="text-gray-300 text-xs">Crit Chance Reduction</span>
          </Tooltip>
          <span className="text-accent font-bold text-xs">
            {asInt((data as any)?.resistances?.criticalChanceReduction)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Tooltip text={RESIST_HINTS.cdr}>
            <span className="text-gray-300 text-xs">Crit Damage Reduction</span>
          </Tooltip>
          <span className="text-accent font-bold text-xs">
            {asInt((data as any)?.resistances?.criticalDamageReduction)}
          </span>
        </div>
      </div>
    </div>
  );
}
