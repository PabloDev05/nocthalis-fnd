import { RotateCcw } from "lucide-react";
import { BattlePortrait } from "../components/Portrait";
import { CombatLog, RewardsPanel } from "../components/LogsAndRewards";
import { asInt } from "../helpers";
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

  return (
    <div className="flex flex-col items-center gap-5">
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
          blockFlashKey={blockFlashLeft}
          blockBumpKey={blockBumpLeft}
          hpGlowKey={hpGlowLeft}
          ultFlashKey={ultFlashLeft}
          ultShakeKey={ultShakeLeft}
          hitShakeKey={hitShakeLeft}
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
        />

        {/* VS + Rewards */}
        <div className="min-w-[220px] flex flex-col items-center justify-start select-none gap-3 pt-4">
          <div
            className={`text-6xl font-black ${
              centerLabel === "WIN"
                ? "text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,.7)]"
                : centerLabel === "LOSE"
                  ? "text-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,.7)]"
                  : centerLabel === "DRAW"
                    ? "text-zinc-300 drop-shadow-[0_0_12px_rgba(255,255,255,.5)]"
                    : "text-[var(--accent)] drop-shadow-[0_0_14px_rgba(120,120,255,0.6)]"
            } shake-once`}
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
            key={shakeKey}
          >
            <span className={centerLabel === "VS" ? "animate-pulse" : ""}>
              {centerLabel}
            </span>
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
