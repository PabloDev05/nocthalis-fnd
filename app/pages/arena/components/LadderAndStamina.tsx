import { Zap } from "lucide-react";
import { Opponent } from "../types";
import { asInt } from "../helpers";

export function LadderRow({
  index,
  opp,
  active,
  onSelect,
}: {
  index: number;
  opp: Opponent;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`grid grid-cols-[64px_minmax(0,1fr)_120px_140px_80px_80px] items-center w-full px-3 py-2 text-left text-[13px]
                  border-b border-[var(--border)] hover:bg-white/[.05] transition ${active ? "bg-white/[.08]" : ""}`}
    >
      <span className="text-zinc-400 tabular-nums">
        {index.toString().padStart(2, "0")}
      </span>
      <div className="truncate text-zinc-200 font-medium">{opp.name}</div>
      <span className="text-zinc-400">{opp.clanName ?? "—"}</span>
      <span className="text-zinc-300 truncate">{opp.className ?? "—"}</span>
      <span className="text-zinc-200 tabular-nums">Lv {opp.level}</span>
      <span className="text-zinc-300 tabular-nums text-right">
        {opp.honor != null ? opp.honor : "—"}
      </span>
    </button>
  );
}

export function LadderList({
  opponents,
  selectedId,
  setSelectedId,
  q,
  setQ,
}: {
  opponents: Opponent[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  q: string;
  setQ: (s: string) => void;
}) {
  const filtered = (opponents ?? []).filter((o) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      o.name.toLowerCase().includes(s) ||
      (o.className ?? "").toLowerCase().includes(s) ||
      (o.clanName ?? "").toLowerCase().includes(s) ||
      String(o.level).includes(s) ||
      String(o.honor ?? "").includes(s)
    );
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] shadow-[0_10px_26px_rgba(0,0,0,.45),0_0_16px_rgba(120,120,255,.12),inset_0_1px_0_rgba(255,255,255,.04)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div
          className="text-sm text-white/90 font-semibold tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Trial (PvP)
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm text-white hover:border-[var(--accent-weak)] focus:outline-none w-40"
        />
      </div>

      <div className="grid grid-cols-[64px_minmax(0,1fr)_120px_140px_80px_80px] px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)]">
        <span>Position</span>
        <span>Name</span>
        <span>Clan</span>
        <span>Class</span>
        <span>Level</span>
        <span className="text-right">Honor</span>
      </div>

      <div className="max-h-[40vh] overflow-y-auto">
        {filtered.map((o, idx) => (
          <LadderRow
            key={o.id}
            index={idx + 1}
            opp={o}
            active={o.id === selectedId}
            onSelect={() => setSelectedId(o.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-zinc-400 text-sm">
            No results
          </div>
        )}
      </div>
    </div>
  );
}

export function BigStaminaBar({
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
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[60] w-[min(92vw,560px)] rounded-lg border border-[rgba(90,110,160,.28)]
                 bg-[linear-gradient(180deg,rgba(12,14,20,.92),rgba(8,10,16,.95))] shadow-[0_8px_22px_rgba(0,0,0,.55),0_0_14px_rgba(100,120,180,.16),inset_0_1px_0_rgba(255,255,255,.04)]"
      role="status"
      aria-label="Stamina"
    >
      <div className="px-2.5 py-1.5 flex items-center gap-2.5">
        <div className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-[rgba(100,120,180,.12)] border border-[rgba(90,110,160,.28)]">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="flex-1 h-3 rounded border border-[rgba(90,110,160,.28)] relative overflow-hidden bg-[rgba(24,28,40,.55)]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1f2a44] via-[#273352] to-[#2f3b63] shadow-[0_0_8px_rgba(100,120,180,.28)] transition-[width] duration-500 ease-out"
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
