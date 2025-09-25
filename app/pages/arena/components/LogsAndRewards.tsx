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
  ActivitySquare,
} from "lucide-react";
import { JSX, useEffect, useMemo, useRef } from "react";
import { LogEntry, LogKind, Reward } from "../types";
import { asInt } from "../helpers";

/* 🔊 SFX manager (Howler) */
import { soundManager } from "../../../lib/sound/SoundManager";

/* ===== UI helpers ===== */
export function EmphasizeNumbers({ text }: { text: string }) {
  const parts = String(text).split(/(\d+)/g);
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

/** Número bloqueado desde el texto o campo bloqueado (si existiera). */
function extractBlockedAmount(e: LogEntry): number {
  // @ts-ignore: futuro campo opcional
  if (typeof (e as any)?.blocked === "number")
    return Math.max(0, Math.round((e as any).blocked));
  const m = String(e?.text ?? "").match(/\d+/);
  return m ? Math.max(0, Math.round(Number(m[0]))) : 0;
}

/** Heurística simple para inferir nombres si no vienen por props */
function guessNames(entries: LogEntry[]) {
  const whoVerb =
    /^\s*([\p{Lu}0-9][\p{L}\p{N} .,'-]{0,24}?)\s+(hits|lands|misses|casts|uses|blocks)\b/iu;
  const onTarget = /\bon\s+([\p{Lu}0-9][\p{L}\p{N} .,'-]{0,24}?)\b/iu;

  let me: string | undefined;
  let opp: string | undefined;

  for (const e of entries) {
    const t = String(e.text || "");
    const m1 = t.match(whoVerb);
    if (m1) {
      const name = m1[1].trim();
      if (e.actor === "me" && !me) me = name;
      if (e.actor === "opp" && !opp) opp = name;
    }
    const m2 = t.match(onTarget);
    if (m2) {
      const name = m2[1].trim();
      if (e.actor === "me" && !opp) opp = name;
      if (e.actor === "opp" && !me) me = name;
    }
    if (me && opp) break;
  }
  return { me: me || "You", opp: opp || "Opponent" };
}

/** Reemplaza genéricos por nombres reales */
function localizeNames(raw: string, myName: string, oppName: string): string {
  return String(raw)
    .replace(/\bYou\b/gi, myName)
    .replace(/\bFoe\b/gi, oppName)
    .replace(/\bEnemy\b/gi, oppName)
    .replace(/\bOpponent\b/gi, oppName)
    .trim();
}

/** opcional: impact kinds */
type ImpactKind = "hit" | "crit" | "block" | "miss" | "dot";
function isImpact(e: LogEntry): e is LogEntry & { kind: ImpactKind } {
  return e.kind !== "status" && e.kind !== "passive" && e.kind !== "ultimate";
}

export function CombatLog({
  entries,
  myName: myNameProp,
  oppName: oppNameProp,
}: {
  entries: LogEntry[];
  myName?: string;
  oppName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // 🔊 Preload (una sola vez); podés quitarlo si precargás en otro lado.
  useEffect(() => {
    soundManager.preload();
  }, []);

  // 🔊 Reproducir SFX al agregarse una nueva entrada al log
  useEffect(() => {
    if (!entries?.length) return;
    const last = entries[entries.length - 1];

    // Map directo LogKind → SfxKind
    const k = last.kind;
    if (
      k === "hit" ||
      k === "crit" ||
      k === "block" ||
      k === "miss" ||
      k === "dot" ||
      k === "ultimate" ||
      k === "passive"
    ) {
      // tuning suave por tipo
      const opts =
        k === "crit"
          ? { volume: 1.0, rate: 0.98 }
          : k === "block"
            ? { volume: 0.9 }
            : k === "miss"
              ? { volume: 0.7, rate: 1.05 }
              : k === "ultimate"
                ? { volume: 1.0 }
                : undefined;

      soundManager.play(k as any, opts);
    }
  }, [entries.length]);

  // autoscroll
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  const { myName, oppName } = useMemo(() => {
    const inferred = guessNames(entries);
    return {
      myName: myNameProp || inferred.me,
      oppName: oppNameProp || inferred.opp,
    };
  }, [entries, myNameProp, oppNameProp]);

  const chip = (k: LogKind) => {
    const map: Record<
      LogKind,
      { label: string; cls: string; icon: JSX.Element }
    > = {
      hit: {
        label: "HIT",
        cls: "bg-zinc-800/40 text-zinc-200 border-zinc-600/40",
        icon: <SwordIcon className="w-3.5 h-3.5" />,
      },
      crit: {
        label: "CRIT",
        cls: "bg-red-900/50 text-red-200 border-red-700/60",
        icon: <Skull className="w-3.5 h-3.5" />,
      },
      block: {
        label: "BLOCK",
        cls: "bg-sky-900/40 text-sky-200 border-sky-700/50",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      },
      miss: {
        label: "MISS",
        cls: "bg-zinc-700/30 text-zinc-300 border-zinc-600/40",
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      passive: {
        label: "PASSIVE",
        cls: "bg-indigo-900/40 text-indigo-200 border-indigo-700/50",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      ultimate: {
        label: "ULTIMATE",
        cls: "bg-amber-900/40 text-amber-200 border-amber-700/50",
        icon: <Crown className="w-3.5 h-3.5" />,
      },
      dot: {
        label: "DOT",
        cls: "bg-orange-900/40 text-orange-200 border-orange-700/50",
        icon: <Flame className="w-3.5 h-3.5" />,
      },
      status: {
        label: "STATUS",
        cls: "bg-violet-900/40 text-violet-200 border-violet-700/50",
        icon: <ActivitySquare className="w-3.5 h-3.5" />,
      },
    };
    return map[k];
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] shadow-lg overflow-hidden">
      <style>{`
        @keyframes critRowPulse {
          0% { background: rgba(185, 28, 28, .00); }
          25% { background: rgba(185, 28, 28, .22); }
          50% { background: rgba(185, 28, 28, .12); }
          100% { background: rgba(185, 28, 28, .00); }
        }
        .row-crit { animation: critRowPulse 560ms ease-out 1; }
        @keyframes blockRowPulse {
          0% { background: rgba(7, 89, 133, .00); }
          25% { background: rgba(7, 89, 133, .18); }
          50% { background: rgba(7, 89, 133, .10); }
          100% { background: rgba(7, 89, 133, .00); }
        }
        .row-block { animation: blockRowPulse 520ms ease-out 1; }
      `}</style>

      <div className="px-3 py-2 text-[12px] text-zinc-400 border-b border-[var(--border)] flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-[var(--accent)]" />
        Combat Log
      </div>

      <div ref={ref} className="max-h-56 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {entries.map((e, i) => {
            const c = chip(e.kind);

            const rowCls =
              e.kind === "crit"
                ? "row-crit"
                : e.kind === "block"
                  ? "row-block"
                  : "";
            const txtCls =
              e.kind === "crit"
                ? "text-red-200"
                : e.kind === "miss"
                  ? "text-zinc-300"
                  : e.kind === "block"
                    ? "text-sky-200"
                    : e.kind === "ultimate"
                      ? "text-amber-200"
                      : e.kind === "passive"
                        ? "text-indigo-200"
                        : e.kind === "status"
                          ? "text-violet-200"
                          : e.kind === "dot"
                            ? "text-orange-200"
                            : "text-zinc-200";

            // Texto base con nombres localizados
            let displayText = localizeNames(e.text, myName, oppName);

            // 🔁 BLOCK FIX: el actor es el ATACANTE; el que BLOQUEA es el OPUESTO.
            if (e.kind === "block") {
              const n = extractBlockedAmount(e);
              const blocker = e.actor === "me" ? oppName : myName;
              displayText = `${blocker} blocks ${n}!`;
            }

            return (
              <li
                key={`${e.turn}-${i}`}
                className={`px-3 py-2 flex items-center gap-2 text-[12px] ${rowCls}`}
              >
                <span
                  className={`inline-flex items-center gap-1 px-2 h-5 rounded border ${c.cls}`}
                  title={e.kind}
                >
                  {c.icon}
                  <strong className="tracking-wide">{c.label}</strong>
                </span>
                <span className="text-zinc-500 tabular-nums">T{e.turn}</span>
                <span className={txtCls} title={e.text}>
                  <EmphasizeNumbers text={displayText} />
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

/* ===== Rewards panel (con SFX exclusivo al aparecer) ===== */
export function RewardsPanel({ rewards }: { rewards: Reward }) {
  // 🔊 SFX al mostrar el panel de recompensas — totalmente separado del start fight
  useEffect(() => {
    if (!rewards) return;
    soundManager.play("uiReward", { volume: 1 }); // ← usa su propia clave
  }, [rewards]);

  if (!rewards) return null;

  const gold = asInt(rewards.gold ?? 0);
  const xp = asInt(rewards.xp ?? 0);
  const items = Array.isArray(rewards.items) ? rewards.items : [];

  return (
    <div className="relative w-[min(82vw,300px)] max-w-[280px] mx-auto">
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
