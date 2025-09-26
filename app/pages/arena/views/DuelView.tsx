// app/pages/arena/views/DuelView.tsx
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

  // dmg ranges
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
    shakeKey,
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

  // ─── VS: animar SOLO al inicio del duelo ─────────────────────────────
  const [duelStartKey, setDuelStartKey] = useState(0);
  const prevLabelRef = useRef(centerLabel);

  // 1) Si cambia a VS (de otro valor), animar
  useEffect(() => {
    if (centerLabel === "VS" && prevLabelRef.current !== "VS") {
      setDuelStartKey((k) => k + 1);
    }
    prevLabelRef.current = centerLabel;
  }, [centerLabel]);

  // 2) En el montaje inicial, si ya está en VS, también animar
  useEffect(() => {
    if (centerLabel === "VS") {
      const id = window.setTimeout(() => setDuelStartKey((k) => k + 1), 50);
      return () => window.clearTimeout(id);
    }
  }, []); // ← se ejecuta una vez al montar

  return (
    <div className="flex flex-col items-center gap-5">
      <style>{`
        /* ───────── Paleta gótica y potencia ───────── */
        :root{
          --gothic-grad: conic-gradient(from 220deg, #e34a5f 0%, #a038ff 42%, #4b163f 85%);
          --gothic-glow-1: rgba(227, 74, 95, .95);
          --gothic-glow-2: rgba(160, 56, 255, .75);
          --gothic-stroke: rgba(10, 4, 16, .95);

          --slash-halo: rgba(255, 248, 235, 1);
          --slash-trail: rgba(255, 248, 235, .6);

          --blood: #991128;
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
          min-height: 110px; /* evita recorte de efectos */
        }

        .arena-center-label .label-text{
          position: relative; z-index: 2;
          font-family: 'Cinzel Decorative', serif;
          font-weight: 900;
          font-size: 72px;
          line-height: 1;
          letter-spacing: .01em;
          background: var(--gothic-grad);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-stroke: 1px var(--gothic-stroke);
          text-shadow:
            0 0 0 var(--gothic-stroke),
            0 0 26px var(--gothic-glow-1),
            0 0 52px var(--gothic-glow-2),
            0 3px 0 rgba(255,255,255,.06);
          filter:
            drop-shadow(0 0 18px rgba(227, 74, 95, .35))
            drop-shadow(0 0 30px rgba(160, 56, 255, .28));
        }

        /* Pulso suave SOLO al montar en VS */
        .arena-center-label.vs .label-text{
          animation: centerPulse 900ms ease-out 1;
          transform-origin: center;
        }
        @keyframes centerPulse{
          0%   { opacity: 0; transform: scale(.86); filter: blur(1px); }
          40%  { opacity: .98; transform: scale(1.08); filter: blur(0); }
          100% { opacity: 1; transform: scale(1.00); }
        }

        /* ───────── Katana slash (visible + por encima del texto) ───────── */
        .katana{
          position:absolute; inset:0; pointer-events:none;
          transform-origin:center;
          transform: rotate(-20deg) translate3d(-150%,0,0);
          opacity:0;
          z-index: 5; /* encima del texto */
          will-change: transform, opacity;
          mix-blend-mode: screen; /* mejora contraste sobre fondos oscuros */
        }
        .katana.play{
          animation: katanaRun 700ms cubic-bezier(.25,.8,.25,1) 1 forwards;
          opacity:1;
        }
        /* línea central gruesa + halo */
        .katana .line{
          position:absolute; left:50%; top:-15%;
          width:5px; height:130%;
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--slash-halo) 45%, rgba(255,255,255,0) 100%);
          box-shadow:
            0 0 10px var(--slash-halo),
            0 0 28px var(--slash-halo),
            0 0 48px rgba(255,255,255,.75);
          transform: translateX(-50%);
          border-radius: 3px;
        }
        /* rastro de la hoja */
        .katana .trail{
          position:absolute; left:50%; top:10%;
          width:360px; height:12px; border-radius:12px;
          transform: translateX(-50%) skewX(-22deg) rotate(90deg);
          background: radial-gradient(closest-side, var(--slash-trail) 0%, rgba(255,255,255,0) 75%);
          filter: blur(1.2px);
        }
        /* chispas visibles */
        .katana .spark{
          position:absolute; width:10px; height:3px; border-radius:2px;
          background: linear-gradient(90deg, #fff, rgba(255,255,255,.2));
          filter: drop-shadow(0 0 8px var(--slash-halo));
          opacity:.95;
        }
        .katana .s1{ left:44%; top:36%; animation: spark1 560ms ease-out 1; }
        .katana .s2{ left:53%; top:47%; animation: spark2 560ms ease-out 1; }
        .katana .s3{ left:49%; top:58%; animation: spark3 560ms ease-out 1; }

        @keyframes spark1{ 0%{transform:translate(0,0) rotate(15deg)} 100%{transform:translate(-56px,-26px) rotate(35deg); opacity:0} }
        @keyframes spark2{ 0%{transform:translate(0,0) rotate(-10deg)} 100%{transform:translate(52px,20px) rotate(-35deg); opacity:0} }
        @keyframes spark3{ 0%{transform:translate(0,0) rotate(0)} 100%{transform:translate(-30px,36px) rotate(18deg); opacity:0} }

        @keyframes katanaRun{
          0%   { transform: rotate(-20deg) translate3d(-160%,0,0); opacity:0; }
          12%  { opacity:1; }
          70%  { opacity:1; }
          100% { transform: rotate(-20deg) translate3d(160%,0,0); opacity:0; }
        }

        /* Flash breve de pantalla para contraste */
        .flash{ position:absolute; inset:0; z-index:4; background: radial-gradient(circle at 50% 45%, rgba(255,255,255,.8), rgba(255,255,255,0) 60%); opacity:0; pointer-events:none; mix-blend-mode: screen; }
        .flash.play{ animation: flashPop 180ms ease-out 1; }
        @keyframes flashPop{ 0%{opacity:.85} 100%{opacity:0} }

        /* Sangre sutil (un par de gotas) */
        .blood{ position:absolute; inset:0; pointer-events:none; opacity:0; z-index:3; }
        .blood.play{ opacity:1; animation:bloodFade 900ms ease-out 1 forwards; }
        .blood:before, .blood:after{
          content:""; position:absolute; left:52%; top:46%;
          width:6px; height:12px; border-radius:5px 5px 50% 50%;
          background: radial-gradient(circle at 50% 25%, var(--blood) 0%, #4d0713 70%);
          transform: rotate(-10deg);
          box-shadow: -10px 6px 0 rgba(77,7,19,.6);
        }
        .blood:after{
          left:48%; top:58%; transform: rotate(6deg);
          width:4px; height:8px; box-shadow: 8px 6px 0 rgba(77,7,19,.5);
        }
        @keyframes bloodFade { 0%{opacity:.9} 100%{opacity:0} }
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
            damageMin: myDmgRange?.min ?? (me as any)?.uiDamageMin ?? 0,
            damageMax: myDmgRange?.max ?? (me as any)?.uiDamageMax ?? 0,
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
          // Estado sobre la HP bar
          statusFlashKey={statusFlashLeft}
          statusVariant={statusVariantLeft ?? null}
        />

        {/* VS + Rewards */}
        <div className="arena-center-zone">
          <div
            className={`arena-center-label ${centerLabel.toLowerCase()}`}
            key={centerLabel === "VS" ? duelStartKey : `${centerLabel}-static`}
          >
            <span className="label-text" key={shakeKey}>
              {centerLabel}
            </span>

            {/* Slash + flash + gotas SOLO al inicio de VS */}
            {centerLabel === "VS" && (
              <>
                <div className={`katana ${duelStartKey ? "play" : ""}`}>
                  <div className="line" />
                  <div className="trail" />
                  <div className="spark s1" />
                  <div className="spark s2" />
                  <div className="spark s3" />
                </div>
                <div className={`flash ${duelStartKey ? "play" : ""}`} />
                <div className={`blood ${duelStartKey ? "play" : ""}`} />
              </>
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
            damageMin:
              oppDmgRange?.min ??
              (selectedOpp?.combatStats as any)?.minDamage ??
              (selectedOpp?.combatStats as any)?.damageMin ??
              0,
            damageMax:
              oppDmgRange?.max ??
              (selectedOpp?.combatStats as any)?.maxDamage ??
              (selectedOpp?.combatStats as any)?.damageMax ??
              0,
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
          // Estado sobre la HP bar
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
