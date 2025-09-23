import { Zap } from "lucide-react";
import { asInt } from "../lib/statUtils";

export default function StaminaBar({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((current / Math.max(1, max)) * 100))
  );
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[60] w-[min(92vw,560px)] rounded-lg border border-[rgba(90,110,160,.28)] bg-[linear-gradient(180deg,rgba(12,14,20,.92),rgba(8,10,16,.95))] shadow-[0_8px_22px_rgba(0,0,0,.55),0_0_14px_rgba(100,120,180,.16),inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="px-2.5 py-1.5 flex items-center gap-2.5">
        <div className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-[rgba(100,120,180,.12)] border border-[rgba(90,110,160,.28)]">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="flex-1 h-3 rounded border border-[rgba(90,110,160,.28)] relative overflow-hidden bg-[rgba(24,28,40,.55)]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1f2a44] via-[#273352] to-[#2f3b63] shadow-[0_0_8px_rgba(100,120,180,.28)] transition-[width] duration-600 ease-out"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-200/90 text-[10px] font-semibold tracking-wide tabular-nums">
              {asInt(current)} / {asInt(max)} STAMINA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
