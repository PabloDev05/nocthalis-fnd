// src/pages/arena/components/Metrics.tsx
import { Swords } from "lucide-react";
import { asInt, fatePercent, formatChance } from "../helpers";
import { StatIcon } from "./Badges";

export function SmallMetricsCard({
  map,
}: {
  map: Record<string, number | undefined>;
}) {
  const Row = ({
    label,
    iconKey,
    value,
    isChance,
    mini,
  }: {
    label: string;
    iconKey: string;
    value: number | undefined;
    isChance?: boolean;
    mini?: string | null;
  }) => (
    <li className="px-3 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-300">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] text-[var(--accent)]">
          <StatIcon k={iconKey} />
        </span>
        <span className="text-[12px]">
          {label}
          {mini && (
            <span className="text-[10px] text-zinc-400 ml-1 align-middle">
              {mini}
            </span>
          )}
        </span>
      </div>
      <span className="text-[12px] font-semibold text-[var(--accent)] tabular-nums">
        {isChance ? formatChance(value ?? 0) : asInt(value ?? 0)}
      </span>
    </li>
  );

  const fateMini = `(${fatePercent(map["fate"])})`;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] overflow-hidden">
      <ul className="divide-y divide-[var(--border)]">
        <li className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgba(120,120,255,.08)] border border-[var(--border)] text-[var(--accent)]">
              <Swords className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px]">Damage</span>
          </div>
          <span className="text-[12px] font-semibold text-[var(--accent)] tabular-nums">
            {asInt(map["damageMin"] ?? 0)} - {asInt(map["damageMax"] ?? 0)}
          </span>
        </li>

        <Row label="Attack" iconKey="attackPower" value={map["attackPower"]} />
        <Row
          label="Block Chance"
          iconKey="blockChance"
          value={map["blockChance"]}
          isChance
        />
        <Row
          label="Critical Chance"
          iconKey="criticalChance"
          value={map["criticalChance"]}
          isChance
        />
        <Row
          label="Evasion"
          iconKey="evasion"
          value={map["evasion"]}
          isChance
        />
        <Row label="Fate" iconKey="fate" value={map["fate"]} mini={fateMini} />
      </ul>
    </div>
  );
}
