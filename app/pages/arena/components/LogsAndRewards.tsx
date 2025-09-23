import {
  Coins,
  Crown,
  Flame,
  Gift,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Skull,
  Sparkles,
  Sword as SwordIcon,
  XCircle,
} from "lucide-react";
import { JSX, useEffect, useRef } from "react";
import { LogEntry, LogKind, Reward } from "../types";
import { asInt } from "../helpers";

export function EmphasizeNumbers({ text }: { text: string }) {
  const parts = text.split(/(\d+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? (
          <b key={i} className="text-white font-extrabold">
            {p}
          </b>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function CombatLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  const chip = (k: LogKind) => {
    const map: Record<
      LogKind,
      { label: string; cls: string; icon: JSX.Element }
    > = {
      hit: {
        label: "HIT",
        cls: "bg-zinc-700/40 text-zinc-200 border-zinc-500/30",
        icon: <SwordIcon className="w-3.5 h-3.5" />,
      },
      // 🔶 NARANJA OSCURO PARA CRÍTICO
      crit: {
        label: "CRITICAL!",
        cls: "bg-amber-900/40 text-amber-200 border-amber-700/50",
        icon: <Skull className="w-3.5 h-3.5" />,
      },
      block: {
        label: "BLOCKED!",
        cls: "bg-sky-900/35 text-sky-200 border-sky-700/40",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      },
      miss: {
        label: "MISSED!",
        cls: "bg-zinc-700/30 text-zinc-200 border-zinc-500/40",
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      passive: {
        label: "PASSIVE",
        cls: "bg-indigo-900/30 text-indigo-200 border-indigo-700/40",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      ultimate: {
        label: "ULTIMATE",
        cls: "bg-amber-800/30 text-amber-200 border-amber-700/40",
        icon: <Crown className="w-3.5 h-3.5" />,
      },
      dot: {
        label: "DOT",
        cls: "bg-orange-800/30 text-orange-200 border-orange-700/40",
        icon: <Flame className="w-3.5 h-3.5" />,
      },
    };
    return map[k];
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] shadow-lg overflow-hidden">
      {/* estilos de fila animada para crit/block */}
      <style>{`
        @keyframes critRowPulse {
          0% { background: rgba(120, 53, 15, .00); }
          25% { background: rgba(120, 53, 15, .18); }
          50% { background: rgba(120, 53, 15, .10); }
          100% { background: rgba(120, 53, 15, .00); }
        }
        .row-crit { animation: critRowPulse 520ms ease-out 1; }
        @keyframes blockRowPulse {
          0% { background: rgba(7, 89, 133, .00); }
          25% { background: rgba(7, 89, 133, .16); }
          50% { background: rgba(7, 89, 133, .10); }
          100% { background: rgba(7, 89, 133, .00); }
        }
        .row-block { animation: blockRowPulse 480ms ease-out 1; }
      `}</style>

      <div className="px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)] flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-[var(--accent)]" />
        Combat Log
      </div>

      <div ref={ref} className="max-h-56 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {entries.map((e, i) => {
            const c = chip(e.kind);
            return (
              <li
                key={`${e.turn}-${i}`}
                className={`px-3 py-2 flex items-center gap-2 text-[12px] ${
                  e.kind === "crit"
                    ? "row-crit"
                    : e.kind === "block"
                      ? "row-block"
                      : ""
                }`}
              >
                <span
                  className={`inline-flex items-center gap-1 px-2 h-5 rounded border ${c.cls}`}
                  title={e.kind}
                >
                  {c.icon}
                  <strong className="tracking-wide">{c.label}</strong>
                </span>

                <span className="text-zinc-500 tabular-nums">T{e.turn}</span>

                <span
                  className={`${
                    e.kind === "crit"
                      ? "text-amber-200"
                      : e.kind === "miss"
                        ? "text-zinc-300"
                        : e.kind === "block"
                          ? "text-sky-200"
                          : e.kind === "ultimate"
                            ? "text-amber-200"
                            : e.kind === "passive"
                              ? "text-indigo-200"
                              : "text-zinc-200"
                  }`}
                >
                  <EmphasizeNumbers text={e.text} />
                </span>
              </li>
            );
          })}

          {entries.length === 0 && (
            <li className="px-3 py-4 text-center text-[12px] text-zinc-500">
              No events yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function RewardsPanel({ rewards }: { rewards: Reward }) {
  if (!rewards) return null;
  const gold = asInt(rewards.gold ?? 0);
  const xp = asInt(rewards.xp ?? 0);
  const items = Array.isArray(rewards.items) ? rewards.items : [];

  return (
    <div className="relative w-[min(82vw,300px)] max-w-[320px] mx-auto">
      <style>{`@keyframes pop {0%{transform:scale(.92);opacity:.0} 50%{transform:scale(1.02);opacity:1} 100%{transform:scale(1);opacity:1}} .pop{animation:pop .24s ease-out both}`}</style>
      <div className="pop rounded-2xl border border-[var(--border)] bg-[rgba(18,18,28,.95)] p-4 shadow-[0_10px_26px_rgba(0,0,0,.45),0_0_16px_rgba(120,120,255,.18),inset_0_1px_0_rgba(255,255,255,.04)]">
        <div className="flex items-center gap-3 mb-2 justify-center">
          <Crown className="w-5 h-5 text-amber-300" />
          <div className="text-[12px] font-semibold text-zinc-200 uppercase tracking-wide">
            Rewards
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3 flex items-center gap-3">
            <Coins className="w-5 h-5" />
            <div>
              <div className="text-[11px] text-zinc-400">Gold</div>
              <div className="text-white font-bold tabular-nums">{gold}</div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3 flex items-center gap-3">
            <RotateCcw className="w-5 h-5" />
            <div>
              <div className="text-[11px] text-zinc-400">Experience</div>
              <div className="text-white font-bold tabular-nums">{xp}</div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4" />
              <div className="text-[11px] text-zinc-400">Items</div>
            </div>

            {items.length ? (
              <ul className="text-[12px] text-zinc-200 space-y-1">
                {items.map((it, i) => (
                  <li key={`${it.name}-${i}`} className="flex justify-between">
                    <span className="break-words">{it.name}</span>
                    <span className="text-zinc-400">x{asInt(it.qty ?? 1)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[12px] text-zinc-500">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
