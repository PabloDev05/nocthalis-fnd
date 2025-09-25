// app/pages/gameInterface/components/ResistancesCard.tsx
import { ShieldPlus } from "lucide-react";
import { CharacterApi } from "../../../../types/character";
import { asInt, labelize } from "../lib/statUtils";

const ORDERED: (keyof CharacterApi["resistances"])[] = [
  "fire",
  "ice",
  "lightning",
  "poison",
  "sleep",
  "paralysis",
  "confusion",
  "fear",
  "dark",
  "holy",
  "stun",
  "bleed",
  "curse",
  "knockback",
];

export default function ResistancesCard({
  data,
}: {
  data: CharacterApi | null;
}) {
  return (
    <div className="dark-panel p-3 h-full">
      <h3 className="text-white font-semibold mb-3 text-sm flex items-center">
        <ShieldPlus className="w-4 h-4 mr-2 text-accent" />
        Resistances
      </h3>

      {/* ⭐ Divisoria debajo del título */}
      <div className="mt-2 mb-3 h-px w-full bg-[var(--border)]/80" />

      <div className="grid grid-cols-2 gap-2.5">
        {ORDERED.map((k) => (
          <div key={String(k)} className="flex justify-between items-center">
            <span className="text-gray-300 text-xs">{labelize(String(k))}</span>
            <span className="text-accent font-bold text-xs">
              {asInt(data?.resistances?.[k])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
