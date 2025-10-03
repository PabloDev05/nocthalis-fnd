// src/components/LogsAndRewards.tsx
// NOTA: Pasá siempre entries = response.timeline (no log/snapshots) para ver overkill y breakdowns.

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
          <b key={i} className="text-white font-extrabold tabular-nums">
            {p}
          </b>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/** Obtiene el “kind” de forma tolerante (acepta event/kind) y normaliza procs. */
function getKind(e: LogEntry): LogKind {
  const raw = String((e as any)?.kind ?? (e as any)?.event ?? "hit");
  if (raw === "ultimate_cast") return "ultimate";
  if (raw === "passive_proc") return "passive";
  if (raw === "dot_tick") return "dot";
  const k = raw as LogKind;
  return (
    [
      "hit",
      "crit",
      "block",
      "miss",
      "passive",
      "ultimate",
      "dot",
      "status",
    ] as LogKind[]
  ).includes(k)
    ? k
    : "hit";
}

/** Normaliza el actor para textos (“me/opp” o “attacker/defender”). */
function getActorSide(e: LogEntry): "me" | "opp" {
  const a: any = (e as any)?.actor ?? (e as any)?.source;
  if (a === "me" || a === "attacker" || a === "player") return "me";
  if (a === "opp" || a === "defender" || a === "enemy") return "opp";
  return "me";
}

/** ¿El actor del evento es el atacante mecánico? (para fallback de overkill) */
function isAttackerEvent(e: LogEntry): boolean {
  const s = String((e as any)?.source ?? (e as any)?.actor ?? "attacker");
  return s === "attacker" || s === "player" || s === "me";
}

/** Daño final (acepta damageObj.final / damageNumber / damage). */
function getFinalDamage(e: LogEntry): number {
  const d1 = (e as any)?.damage?.final;
  if (Number.isFinite(d1)) return Math.round(d1 as number);
  const d2 = (e as any)?.damageObj?.final;
  if (Number.isFinite(d2)) return Math.round(d2 as number);
  const d3 = (e as any)?.damageNumber;
  if (Number.isFinite(d3)) return Math.round(d3 as number);
  const d4 = (e as any)?.damage;
  if (Number.isFinite(d4)) return Math.round(d4 as number);
  return 0;
}

/** Número bloqueado desde meta/breakdown o desde el texto como fallback. */
function extractBlockedAmount(e: LogEntry): number {
  if (typeof (e as any)?.blockedAmount === "number")
    return Math.max(0, Math.round((e as any).blockedAmount));
  if (typeof (e as any)?.breakdown?.blockedAmount === "number")
    return Math.max(0, Math.round((e as any).breakdown.blockedAmount));
  const m = String((e as any)?.text ?? "").match(/\d+/);
  return m ? Math.max(0, Math.round(Number(m[0]))) : 0;
}

/** Overkill directo si viene del backend. */
function extractOverkillField(e: LogEntry): number {
  const ok1 = (e as any)?.overkill;
  const ok2 = (e as any)?.breakdown?.overkill;
  const val = Number.isFinite(Number(ok1))
    ? Number(ok1)
    : Number.isFinite(Number(ok2))
      ? Number(ok2)
      : 0;
  return Math.max(0, Math.round(val || 0));
}

/** Fallback de overkill usando HP del evento anterior (post-evento previo = pre-evento actual). */
function computeOverkillFromHP(
  e: LogEntry,
  index: number,
  entries: LogEntry[]
): number {
  const kind = getKind(e);
  if (kind === "miss") return 0;

  const dmg = getFinalDamage(e);
  if (!Number.isFinite(dmg) || dmg <= 0) return 0;

  // necesitamos el HP del objetivo ANTES del evento actual
  const prev = index > 0 ? (entries[index - 1] as any) : undefined;
  if (!prev) return 0;

  const targetPrevHP = isAttackerEvent(e)
    ? (prev as any)?.defenderHP
    : (prev as any)?.attackerHP;

  if (!Number.isFinite(targetPrevHP)) return 0;

  const ok = Math.max(0, Math.round(dmg - Math.max(0, Number(targetPrevHP))));
  return ok;
}

/** Heurística simple para inferir nombres si no vienen por props */
function guessNames(entries: LogEntry[]) {
  const whoVerb =
    /^\s*([\p{Lu}0-9][\p{L}\p{N} .,'-]{0,24}?)\s+(hits|lands|misses|casts|uses|blocks)\b/iu;
  const onTarget = /\bon\s+([\p{Lu}0-9][\p{L}\p{N} .,'-]{0,24}?)\b/iu;

  let me: string | undefined;
  let opp: string | undefined;

  for (const e of entries) {
    const t = String((e as any).text || "");
    const m1 = t.match(whoVerb);
    if (m1) {
      const name = m1[1].trim();
      if (getActorSide(e) === "me" && !me) me = name;
      if (getActorSide(e) === "opp" && !opp) opp = name;
    }
    const m2 = t.match(onTarget);
    if (m2) {
      const name = m2[1].trim();
      if (getActorSide(e) === "me" && !opp) opp = name;
      if (getActorSide(e) === "opp" && !me) me = name;
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

/** Resalta el nombre de la habilidad si el texto viene como “triggers X” o “unleashes X” */
function renderAbilityText(s: string) {
  const m = s.match(/\b(triggers|unleashes)\s+([A-Za-z0-9 _'’\-:]+)\b/);
  if (!m) return <EmphasizeNumbers text={s} />;
  const before = s.slice(0, m.index);
  const verb = m[1];
  const name = m[2].trim();
  const after = s.slice((m.index ?? 0) + m[0].length);
  return (
    <>
      <EmphasizeNumbers text={before} /> {verb}{" "}
      <i className="text-white/95 font-bold">{name}</i>
      <EmphasizeNumbers text={after} />
    </>
  );
}

/** Línea compacta de bloqueo con datos: "X bloquea N — pre → post → DR p% → final". */
function buildBlockLine(
  e: LogEntry,
  names: { myName: string; oppName: string },
  entries: LogEntry[]
) {
  const blocked = extractBlockedAmount(e);
  const actor = getActorSide(e);

  // el que bloquea es el ACTOR del evento 'block'
  const blocker =
    actor === "me" ? names.myName || "tú" : names.oppName || "oponente";

  // campos del evento/breakdown
  const b: any = (e as any)?.breakdown || {};
  const preBlock =
    (e as any)?.preBlock ??
    b.preBlock ??
    (e as any)?.rawDamage ??
    (e as any)?.damage?.raw;
  const blockPct = (e as any)?.blockReducedPercent ?? b.blockReducedPercent;
  const afterBlock =
    (e as any)?.finalAfterBlock ??
    (typeof preBlock === "number" && typeof blocked === "number"
      ? Math.max(0, preBlock - blocked)
      : undefined);
  const drPct = (e as any)?.drReducedPercent ?? b.drReducedPercent;

  let finalAfterDR: number | undefined =
    (e as any)?.finalAfterDR ?? b.finalAfterDR;

  // fallback: buscar el HIT del mismo turno si no vino finalAfterDR
  if (finalAfterDR == null) {
    const siblingHit = entries.find(
      (x) => (x as any).turn === (e as any).turn && getKind(x) === "hit"
    );
    const sFinal =
      (siblingHit as any)?.damage?.final ??
      (siblingHit as any)?.damageObj?.final ??
      (siblingHit as any)?.damageNumber ??
      (siblingHit as any)?.damage;
    if (Number.isFinite(sFinal)) finalAfterDR = Math.round(Number(sFinal));
  }

  const arrows: string[] = [];
  if (Number.isFinite(preBlock))
    arrows.push(String(Math.round(Number(preBlock))));
  if (Number.isFinite(afterBlock))
    arrows.push(String(Math.round(Number(afterBlock))));
  if (Number.isFinite(drPct)) arrows.push(`DR ${Math.round(Number(drPct))}%`);
  if (Number.isFinite(finalAfterDR))
    arrows.push(String(Math.round(Number(finalAfterDR))));

  const right = arrows.length ? ` — ${arrows.join(" → ")}` : "";
  return `${blocker} bloquea ${blocked}${right}`;
}

/** Texto por defecto, amigable, para cuando no viene e.text. */
function defaultFriendlyLine(
  e: LogEntry,
  names: { myName: string; oppName: string }
) {
  const kind = getKind(e);
  const who = getActorSide(e) === "me" ? names.myName : names.oppName;
  const dmg = getFinalDamage(e);

  if (kind === "miss") return `${who} falla el golpe.`;
  if (kind === "crit") return `${who} asesta un crítico por ${dmg}.`;
  if (kind === "dot") return `${who} sufre daño periódico de ${dmg}.`;
  if (kind === "hit") return `${who} golpea por ${dmg}.`;
  if (kind === "block") return buildBlockLine(e, names, []); // no debería llegar aquí
  return `${who} actúa.`;
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

  // 🔊 Preload
  useEffect(() => {
    soundManager.preload();
  }, []);

  // 🔊 SFX última entrada
  useEffect(() => {
    if (!entries?.length) return;
    const last = entries[entries.length - 1];
    const k = getKind(last);
    if (
      k === "hit" ||
      k === "crit" ||
      k === "block" ||
      k === "miss" ||
      k === "dot" ||
      k === "ultimate" ||
      k === "passive"
    ) {
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
    if (!ref.current) return;
    ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
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
            const k = getKind(e);
            const c = chip(k);

            const rowCls =
              k === "crit" ? "row-crit" : k === "block" ? "row-block" : "";
            const txtCls =
              k === "crit"
                ? "text-red-200"
                : k === "miss"
                  ? "text-zinc-300"
                  : k === "block"
                    ? "text-sky-200"
                    : k === "ultimate"
                      ? "text-amber-200"
                      : k === "passive"
                        ? "text-indigo-200"
                        : k === "status"
                          ? "text-violet-200"
                          : k === "dot"
                            ? "text-orange-200"
                            : "text-zinc-200";

            // Texto base con nombres localizados o amigable
            let displayText = "";
            const rawText = String((e as any)?.text || "");
            if (rawText) {
              displayText = localizeNames(rawText, "You", "Opponent");
            } else if (k === "block") {
              displayText = buildBlockLine(e, { myName, oppName }, entries);
            } else {
              displayText = defaultFriendlyLine(e, { myName, oppName });
            }

            // Overkill (si lo trae el backend) + fallback por HP prev.
            let ok = extractOverkillField(e);
            if (ok <= 0) {
              ok = computeOverkillFromHP(e, i, entries);
            }
            if (ok > 0) {
              displayText = `${displayText} (overkill +${ok})`;
            }

            const content =
              k === "ultimate" || k === "passive" ? (
                renderAbilityText(displayText)
              ) : (
                <EmphasizeNumbers text={displayText} />
              );

            return (
              <li
                key={`${(e as any).turn ?? i}-${i}`}
                className={`px-3 py-2 ${rowCls}`}
              >
                <div className="flex items-center gap-2 text-[12px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 h-5 rounded border ${c.cls}`}
                    title={k}
                  >
                    {c.icon}
                    <strong className="tracking-wide">{c.label}</strong>
                  </span>

                  <span className="text-zinc-500 tabular-nums">
                    T{(e as any).turn ?? i + 1}
                  </span>

                  {/* Badge de OVERKILL: visible aunque el texto tenga elipsis */}
                  {ok > 0 && (
                    <span
                      className="ml-1 inline-flex items-center px-1.5 h-5 rounded border bg-red-900/40 text-red-200 border-red-700/60 text-[10px] font-semibold"
                      title={`Overkill +${ok}`}
                    >
                      OVERKILL +{ok}
                    </span>
                  )}

                  {/* una sola línea, con elipsis si no entra */}
                  <span
                    className={`${txtCls} flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis`}
                    title={displayText}
                  >
                    {content}
                  </span>
                </div>
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
  useEffect(() => {
    if (!rewards) return;
    soundManager.play("uiReward", { volume: 1 });
  }, [rewards]);

  if (!rewards) return null;

  const gold = asInt((rewards as any).gold ?? (rewards as any).goldGained ?? 0);
  const xp = asInt((rewards as any).xp ?? (rewards as any).xpGained ?? 0);
  const items = Array.isArray((rewards as any).items)
    ? (rewards as any).items
    : [];

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
                {items.map((it: any, i: number) => (
                  <li
                    key={`${it.name ?? "item"}-${i}`}
                    className="flex justify-between"
                  >
                    <span className="break-words">{it.name ?? "Item"}</span>
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
