import { Info } from "lucide-react";
import { asInt } from "../lib/statUtils";

export default function ProfileCard({
  displayName,
  lvl,
  xpSince,
  xpForLevel,
  className,
}: {
  displayName: string;
  lvl: number | string;
  xpSince: number;
  xpForLevel: number;
  className: string;
}) {
  // Guardas robustas
  const cur = Number.isFinite(xpSince) ? Number(xpSince) : 0;
  const need = Math.max(
    1,
    Number.isFinite(xpForLevel) ? Number(xpForLevel) : 1
  );
  const pct = Math.max(0, Math.min(100, Math.floor((cur / need) * 100)));

  const expTitle = `This level: ${asInt(cur)}/${asInt(need)} (${pct}%)`;

  return (
    <div className="dark-panel p-3 md:p-4">
      <h3 className="stat-text font-semibold mb-3 flex items-center text-base">
        <Info className="w-4 h-4 mr-2 text-accent" /> Profile
      </h3>
      <ul className="text-xs space-y-1.5 stat-text-muted">
        <li>
          <strong>Name:</strong> {displayName ?? "—"}
        </li>
        <li>
          <strong>Level:</strong> {lvl ?? "—"}
        </li>
        <li title={expTitle} aria-label={expTitle}>
          <strong>Exp:</strong> {asInt(cur)}/{asInt(need)}{" "}
          <span className="text-[10px] text-gray-400 ml-1">({pct}%)</span>
        </li>
        <li>
          <strong>Class:</strong> {className ?? "—"}
        </li>
      </ul>
    </div>
  );
}
