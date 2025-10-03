import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { BattlePortrait } from "../components/Portrait";
import { CombatLog, RewardsPanel } from "../components/LogsAndRewards";
import { Opponent, Reward, DuelResult, LogEntry, CharacterApi } from "../types";
import { resolvePrimaryCombatKey } from "../../../lib/primary";

type Props = {
  me: CharacterApi;
  myName: string | number;
  myLevel: string | number;
  myMaxHP: number;

  selectedOpp: Opponent;

  hpMe: number;
  hpOpp: number;

  centerLabel: "VS" | "WIN" | "LOSE" | "DRAW";
  shakeKey: number;
  onBack: () => void;

  // skill texts
  myPassiveText: string | null;
  myUltText: string | null;
  oppPassiveText: string | null;
  oppUltText: string | null;

  // dmg ranges (compat fallback)
  myDmgRange: { min: number; max: number } | null;
  oppDmgRange: { min: number; max: number } | null;

  // fx keys
  pulseLeftPassive: number;
  pulseLeftUlt: number;
  pulseRightPassive: number;
  pulseRightUlt: number;
  hpGlowLeft: number;
  hpGlowRight: number;
  blockFlashLeft: number;
  blockFlashRight: number;
  ultFlashLeft: number;
  ultFlashRight: number;
  ultShakeLeft: number;
  ultShakeRight: number;
  hitShakeLeft: number;
  hitShakeRight: number;
  blockBumpLeft: number;
  blockBumpRight: number;

  // Estado (cc/debuff/bleed) sobre la barra de vida
  statusFlashLeft: number;
  statusFlashRight: number;
  statusVariantLeft?: "cc" | "debuff" | "bleed" | null;
  statusVariantRight?: "cc" | "debuff" | "bleed" | null;

  // Nudge lateral cuando hay miss
  missNudgeLeft: number;
  missNudgeRight: number;

  // results
  duelResult: DuelResult;
  rewards: Reward;

  // log
  combatLog: LogEntry[];
};

export function DuelView(props: Props) {
  const {
    me,
    myName,
    myLevel,
    myMaxHP,
    selectedOpp,
    hpMe,
    hpOpp,
    centerLabel,
    onBack,
    myPassiveText,
    myUltText,
    oppPassiveText,
    oppUltText,
    myDmgRange,
    oppDmgRange,
    pulseLeftPassive,
    pulseLeftUlt,
    pulseRightPassive,
    pulseRightUlt,
    hpGlowLeft,
    hpGlowRight,
    blockFlashLeft,
    blockFlashRight,
    ultFlashLeft,
    ultFlashRight,
    ultShakeLeft,
    ultShakeRight,
    hitShakeLeft,
    hitShakeRight,
    blockBumpLeft,
    blockBumpRight,
    statusFlashLeft,
    statusFlashRight,
    statusVariantLeft,
    statusVariantRight,
    missNudgeLeft,
    missNudgeRight,
    duelResult,
    rewards,
    combatLog,
  } = props;

  const myClassName = (me as any)?.class?.name ?? (me as any)?.className ?? "";
  const myPrimaryKey = resolvePrimaryCombatKey(
    (me as any)?.primaryPowerKey,
    myClassName
  );
  const oppPrimaryKey = resolvePrimaryCombatKey(
    (selectedOpp as any)?.primaryPowerKey,
    selectedOpp?.className ?? ""
  );

  useEffect(() => {
    if (!combatLog?.length) return;
    const last = combatLog[combatLog.length - 1] as any;
    console.debug(
      "DuelView last timeline entry:",
      last,
      "overkill=",
      last?.overkill
    );
  }, [combatLog]);

  // ─── VS: animar SOLO al entrar a "VS" ───────────────────────
  const [duelStartKey, setDuelStartKey] = useState(0);
  const [showSplit, setShowSplit] = useState(false);
  const [splitAnimating, setSplitAnimating] = useState(false);
  const prevLabelRef = useRef(centerLabel);

  // Dispara una sola vez cuando entramos a "VS" (incluye primer montaje)
  useEffect(() => {
    if (centerLabel === "VS" && prevLabelRef.current !== "VS") {
      setDuelStartKey((k) => k + 1);
    }
    // si montó ya en "VS" y nunca disparamos:
    if (
      centerLabel === "VS" &&
      prevLabelRef.current === "VS" &&
      duelStartKey === 0
    ) {
      setDuelStartKey(1);
    }
    prevLabelRef.current = centerLabel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLabel]);

  // Core: mostrar split, animar, y recomponer a un solo VS
  useEffect(() => {
    if (!duelStartKey || centerLabel !== "VS") return;

    setShowSplit(true);
    const start = window.setTimeout(() => setSplitAnimating(true), 10);
    const CUT_MS = 380;
    const end = window.setTimeout(() => {
      setSplitAnimating(false);
      setShowSplit(false);
    }, CUT_MS + 40);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [duelStartKey, centerLabel]);

  // ✅ Unificación: siempre usar uiDamageMin/uiDamageMax si están presentes
  const myUiMin = (me as any)?.uiDamageMin;
  const myUiMax = (me as any)?.uiDamageMax;
  const oppUiMin = (selectedOpp as any)?.uiDamageMin;
  const oppUiMax = (selectedOpp as any)?.uiDamageMax;

  const myDamageMin = Number.isFinite(Number(myUiMin))
    ? Number(myUiMin)
    : (myDmgRange?.min ?? 0);
  const myDamageMax = Number.isFinite(Number(myUiMax))
    ? Number(myUiMax)
    : (myDmgRange?.max ?? 0);

  const oppDamageMin = Number.isFinite(Number(oppUiMin))
    ? Number(oppUiMin)
    : (oppDmgRange?.min ?? 0);
  const oppDamageMax = Number.isFinite(Number(oppUiMax))
    ? Number(oppUiMax)
    : (oppDmgRange?.max ?? 0);

  return (
    <div className="flex flex-col items-center gap-5">
      <style>{`
        /* ───────── Dark-gothic minimal ───────── */
        :root{
          --vs-red: #B01622;
          --stroke: rgba(6, 4, 10, .9);
          --glow1: rgba(150, 18, 38, .22);
          --glow2: rgba(120, 14, 36, .12);

          --win-green: #1f6f4a;
          --win-glow: rgba(20, 120, 80, .20);

          --slash-halo: rgba(255, 238, 232, 1);
          --slash-trail: rgba(255, 220, 208, .45);
        }

        .arena-center-zone{
          min-width: 220px;
          display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
          gap:.75rem; padding-top: 14px; user-select:none;
        }

        .arena-center-label{
          position: relative; width:100%;
          display:flex; align-items:center; justify-content:center;
          pointer-events: none;
          min-height: 120px;
          background: transparent;
          overflow: visible;
        }

        .label-text{
          font-family: 'Cinzel Decorative', serif;
          font-weight: 800;
          font-size: 70px;
          line-height: 1;
          letter-spacing: .005em;
          -webkit-text-stroke: 0.8px var(--stroke);
          text-shadow:
            0 -1px 0 var(--stroke),
            0 1px 2px var(--glow1),
            0 0 14px var(--glow2);
        }
        .vs .label-text   { color: var(--vs-red); }
        .win .label-text  { color: var(--win-green); text-shadow: 0 -1px 0 var(--stroke), 0 1px 2px var(--win-glow), 0 0 14px var(--win-glow); }
        .lose .label-text { color: #8b1f2a; }
        .draw .label-text { color: #888; }

        /* Entrada sutil al montar VS */
        .vs .label-text{
          animation: vsIn 320ms ease-out 1;
          transform-origin: center;
        }
        @keyframes vsIn{
          0%   { opacity: 0; transform: scale(.98); }
          100% { opacity: 1; transform: scale(1.00); }
        }

        /* ───────── Split diagonal (centrado) ───────── */
        .diag-split{
          position: relative;
          display: grid;
          place-items: center;
        }
        .piece{ grid-area: 1/1; }

        /* Cortes diagonales (≈ -20°) con clip-path */
        .diag-top{
          clip-path: polygon(0% 0%, 100% 0%, 100% 35%, 0% 60%);
          transform: translate(-10px,-12px) rotate(-2.6deg);
        }
        .diag-bot{
          clip-path: polygon(0% 60%, 100% 35%, 100% 100%, 0% 100%);
          transform: translate(10px,12px) rotate(2.6deg);
        }

        /* Animación de cierre (sin fondos extra) */
        .diag-anim .diag-top{ animation: topClose 380ms cubic-bezier(.2,.8,.2,1) 1 forwards; }
        .diag-anim .diag-bot{ animation: botClose 380ms cubic-bezier(.2,.8,.2,1) 1 forwards; }
        @keyframes topClose{
          0%  { transform: translate(-10px,-12px) rotate(-2.6deg); }
          100%{ transform: translate(-2px,-3px) rotate(-0.8deg); }
        }
        @keyframes botClose{
          0%  { transform: translate(10px,12px) rotate(2.6deg); }
          100%{ transform: translate(2px,3px) rotate(0.8deg); }
        }

        /* ───────── Slash minimal (línea + estela) ───────── */
        .katana{
          position:absolute; inset:0; pointer-events:none;
          transform-origin:center;
          transform: rotate(-22deg) translate3d(-160%,0,0);
          opacity:0; z-index: 2; mix-blend-mode: screen;
        }
        .katana.play{ animation: katanaRun 480ms cubic-bezier(.25,.8,.25,1) 1 forwards; opacity:1; }
        .katana .line{
          position:absolute; left:50%; top:-15%;
          width:3.5px; height:130%; transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--slash-halo) 45%, rgba(255,255,255,0) 100%);
          box-shadow: 0 0 8px var(--slash-halo), 0 0 16px var(--slash-halo);
          border-radius: 2px;
        }
        .katana .trail{
          position:absolute; left:50%; top:8%;
          width:300px; height:7px; border-radius:7px;
          transform: translateX(-50%) skewX(-22deg) rotate(90deg);
          background: radial-gradient(closest-side, var(--slash-trail) 0%, rgba(255,255,255,0) 70%);
          filter: blur(.7px);
        }
        @keyframes katanaRun{
          0%{ transform: rotate(-22deg) translate3d(-170%,0,0); opacity:0; }
          20%{ opacity:1 }
          80%{ opacity:1 }
          100%{ transform: rotate(-22deg) translate3d(170%,0,0); opacity:0; }
        }
      `}</style>

      {/* Portraits */}
      <div className="w-full max-w-[1080px] mx-auto flex items-start justify-center gap-8">
        {/* Player */}
        <BattlePortrait
          side="left"
          widthClass="w-[320px]"
          name={String(myName)}
          level={Number(myLevel)}
          hp={hpMe}
          maxHP={myMaxHP}
          avatarUrl={me?.avatarUrl ?? null}
          passiveText={myPassiveText ?? "—"}
          ultimateText={myUltText ?? "—"}
          passivePulseKey={pulseLeftPassive}
          ultimatePulseKey={pulseLeftUlt}
          hpGlowKey={hpGlowLeft}
          blockFlashKey={blockFlashLeft}
          ultFlashKey={ultFlashLeft}
          ultShakeKey={ultShakeLeft}
          hitShakeKey={hitShakeLeft}
          blockBumpKey={blockBumpLeft}
          // Miss nudge
          missNudgeKey={missNudgeLeft}
          stats={{
            damageMin: myDamageMin,
            damageMax: myDamageMax,
            attackPower:
              myPrimaryKey === "magicPower"
                ? (me?.combatStats as any)?.magicPower
                : (me?.combatStats as any)?.attackPower,
            blockChance:
              (me?.combatStats as any)?.blockChance ??
              (me?.combatStats as any)?.block,
            criticalChance:
              (me?.combatStats as any)?.criticalChance ??
              (me?.combatStats as any)?.critChance ??
              (me?.combatStats as any)?.crit,
            evasion:
              (me?.combatStats as any)?.evasion ??
              (me?.combatStats as any)?.evade ??
              (me?.combatStats as any)?.evasionChance ??
              (me?.combatStats as any)?.evadeChance ??
              (me?.combatStats as any)?.dodge ??
              (me?.combatStats as any)?.dodgeChance ??
              0,
            fate: (me as any)?.stats?.fate ?? 0,
          }}
          statusFlashKey={statusFlashLeft}
          statusVariant={statusVariantLeft ?? null}
        />

        {/* VS + Rewards */}
        <div className="arena-center-zone">
          <div
            className={`arena-center-label ${centerLabel.toLowerCase()}`}
            key={
              centerLabel === "VS"
                ? `vs-${duelStartKey}`
                : `${centerLabel}-static`
            }
          >
            {centerLabel === "VS" ? (
              showSplit ? (
                <span
                  className={`diag-split ${splitAnimating ? "diag-anim" : ""}`}
                >
                  <span className="label-text piece diag-top">VS</span>
                  <span className="label-text piece diag-bot">VS</span>
                </span>
              ) : (
                <span className="label-text">VS</span>
              )
            ) : (
              <span className="label-text">{centerLabel}</span>
            )}

            {/* Slash minimal SOLO al inicio de VS */}
            {centerLabel === "VS" && (
              <div className={`katana ${duelStartKey ? "play" : ""}`}>
                <div className="line" />
                <div className="trail" />
              </div>
            )}
          </div>

          {duelResult && (
            <div className="text-center text-[12px] text-zinc-300 max-w-[360px]">
              {duelResult.summary}
            </div>
          )}
          {duelResult && rewards && <RewardsPanel rewards={rewards} />}

          {duelResult && (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent-weak)] text-[12px] text-zinc-200 bg-white/[.02]"
              title="Back to list"
            >
              <RotateCcw className="w-4 h-4" /> Back
            </button>
          )}
        </div>

        {/* Enemy */}
        <BattlePortrait
          side="right"
          widthClass="w-[320px]"
          name={selectedOpp?.name ?? "—"}
          level={selectedOpp?.level ?? "—"}
          hp={hpOpp}
          maxHP={selectedOpp?.maxHP ?? 0}
          avatarUrl={selectedOpp?.avatarUrl ?? null}
          passiveText={oppPassiveText ?? "—"}
          ultimateText={oppUltText ?? "—"}
          passivePulseKey={pulseRightPassive}
          ultimatePulseKey={pulseRightUlt}
          hpGlowKey={hpGlowRight}
          blockFlashKey={blockFlashRight}
          ultFlashKey={ultFlashRight}
          ultShakeKey={ultShakeRight}
          hitShakeKey={hitShakeRight}
          blockBumpKey={blockBumpRight}
          // Miss nudge
          missNudgeKey={missNudgeRight}
          stats={{
            damageMin: oppDamageMin,
            damageMax: oppDamageMax,
            attackPower:
              oppPrimaryKey === "magicPower"
                ? (selectedOpp as any)?.combatStats?.magicPower
                : (selectedOpp as any)?.combatStats?.attackPower,
            blockChance:
              (selectedOpp?.combatStats as any)?.blockChance ??
              (selectedOpp?.combatStats as any)?.block,
            criticalChance:
              (selectedOpp?.combatStats as any)?.criticalChance ??
              (selectedOpp?.combatStats as any)?.critChance ??
              (selectedOpp?.combatStats as any)?.crit,
            evasion:
              (selectedOpp?.combatStats as any)?.evasion ??
              (selectedOpp?.combatStats as any)?.evade ??
              (selectedOpp?.combatStats as any)?.evasionChance ??
              (selectedOpp?.combatStats as any)?.evadeChance ??
              (selectedOpp?.combatStats as any)?.dodge ??
              (selectedOpp?.combatStats as any)?.dodgeChance ??
              0,
            fate: (selectedOpp as any)?.stats?.fate ?? 0,
          }}
          statusFlashKey={statusFlashRight}
          statusVariant={statusVariantRight ?? null}
        />
      </div>

      {/* Combat Log */}
      <div className="w-full max-w-[980px] mx-auto flex flex-col items-center">
        <div className="w-full">
          <CombatLog entries={combatLog} />
        </div>
      </div>
    </div>
  );
}
