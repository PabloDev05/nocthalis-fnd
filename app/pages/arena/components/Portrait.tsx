import { User } from "lucide-react";
import { asInt } from "../helpers";
import { SkillBadge } from "./Badges";
import { SmallMetricsCard } from "./Metrics";
import { useState, useEffect } from "react";

export function BattlePortrait({
  side,
  name,
  level,
  hp,
  maxHP,
  avatarUrl,
  passiveText,
  ultimateText,
  passivePulseKey,
  ultimatePulseKey,
  hpGlowKey,
  blockFlashKey,
  ultFlashKey,
  ultShakeKey,
  hitShakeKey,
  blockBumpKey,
  stats,
  widthClass,
}: {
  side: "left" | "right";
  name: string;
  level: number | string;
  hp: number;
  maxHP: number;
  avatarUrl?: string | null;
  passiveText?: string | null;
  ultimateText?: string | null;
  passivePulseKey: number;
  ultimatePulseKey: number;
  hpGlowKey: number;
  blockFlashKey: number;
  ultFlashKey: number;
  ultShakeKey: number;
  hitShakeKey: number;
  blockBumpKey: number;
  stats: Record<string, number | undefined>;
  widthClass: string;
}) {
  const BLOCK_FX_DURATION = 600; // ms
  const CRIT_FX_DURATION = 700; // ms

  const [showBlockFx, setShowBlockFx] = useState(false);
  const [showCritFx, setShowCritFx] = useState(false);

  // Bloqueo: mostrar FX temporal
  useEffect(() => {
    if (blockFlashKey > 0) {
      setShowBlockFx(true);
      const id = window.setTimeout(
        () => setShowBlockFx(false),
        BLOCK_FX_DURATION
      );
      return () => window.clearTimeout(id);
    }
  }, [blockFlashKey]);

  // Crítico: mostrar FX temporal
  useEffect(() => {
    if (hitShakeKey > 0) {
      setShowCritFx(true);
      const id = window.setTimeout(
        () => setShowCritFx(false),
        CRIT_FX_DURATION
      );
      return () => window.clearTimeout(id);
    }
  }, [hitShakeKey]);

  const pct = Math.max(
    0,
    Math.min(100, Math.round((hp / Math.max(1, maxHP)) * 100))
  );

  return (
    <div
      className={`relative ${widthClass} rounded-2xl border border-[var(--border)]
                  bg-gradient-to-b from-[rgba(35,38,55,.96)] to-[rgba(15,16,22,.98)]
                  shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_20px_40px_rgba(0,0,0,.55),0_0_24px_rgba(120,120,255,.12)]
                  overflow-hidden ${side === "left" ? "ml-auto" : "mr-auto"}
                  ${blockBumpKey ? "block-bump-once" : ""}`}
      style={
        ultShakeKey
          ? { animation: "megaShake 750ms cubic-bezier(.36,.07,.19,.97) 1" }
          : undefined
      }
    >
      <style>{`
        @keyframes shieldAppear {
          0%   { transform: scale(0.86); opacity: 0; }
          40%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1.0); opacity: 0; }
        }

        @keyframes hpGlow { 0%{box-shadow:inset 0 0 0 0 rgba(255,80,80,0),0 0 0 rgba(0,0,0,0)} 30%{box-shadow:inset 0 0 24px rgba(255,90,90,.45),0 0 16px rgba(255,60,60,.35)} 100%{box-shadow:inset 0 0 0 0 rgba(255,80,80,0),0 0 0 rgba(0,0,0,0)} }
        .hp-glow-once { animation: hpGlow 800ms ease-out 1; }

        @keyframes critCardFlash { 0%{box-shadow:inset 0 0 0 rgba(0,0,0,0);filter:saturate(1)} 18%{box-shadow:inset 0 0 120px rgba(255,50,60,.55)} 45%{box-shadow:inset 0 0 140px rgba(255,40,50,.65),0 0 44px rgba(255,60,80,.45);filter:saturate(1.25)} 80%{box-shadow:inset 0 0 80px rgba(255,40,50,.35),0 0 28px rgba(255,60,80,.25);filter:saturate(1.1)} 100%{box-shadow:inset 0 0 0 rgba(0,0,0,0);filter:saturate(1)} }

        @keyframes blockFlash { 0%{box-shadow:inset 0 0 0 rgba(0,0,0,0)} 20%{box-shadow:inset 0 0 100px rgba(90,170,255,.45)} 60%{box-shadow:inset 0 0 70px rgba(90,170,255,.25)} 100%{box-shadow:inset 0 0 0 rgba(0,0,0,0)} }
        @keyframes shieldRipple { 0%{transform:scale(.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }

        @keyframes megaShake { 10%,90%{transform:translate3d(-1px,0,0)} 20%,80%{transform:translate3d(2px,0,0)} 30%,50%,70%{transform:translate3d(-4px,0,0)} 40%,60%{transform:translate3d(4px,0,0)} }

        @keyframes hitShake { 0%,100%{transform:translate3d(0,0,0)} 20%{transform:translate3d(-2px,0,0) rotate(-.2deg)} 40%{transform:translate3d(3px,0,0) rotate(.2deg)} 60%{transform:translate3d(-3px,0,0) rotate(-.2deg)} 80%{transform:translate3d(2px,0,0) rotate(.2deg)} }
        .hit-shake-once { animation: hitShake 420ms cubic-bezier(.36,.07,.19,.97) 1; }

        @keyframes blockBump { 0%{transform:scale(1)} 35%{transform:scale(1.02)} 70%{transform:scale(1.008)} 100%{transform:scale(1)} }
        .block-bump-once { animation: blockBump 380ms ease-out 1; }

        @keyframes ultimateFlash { 0%{box-shadow:inset 0 0 0 rgba(0,0,0,0)} 15%{box-shadow:inset 0 0 130px rgba(255,220,120,.55),0 0 36px rgba(150,80,255,.35)} 45%{box-shadow:inset 0 0 90px rgba(255,180,90,.35),0 0 20px rgba(150,80,255,.25)} 100%{box-shadow:inset 0 0 0 rgba(0,0,0,0)} }

        /* anillo single (ya no lo usamos aquí, dejamos por compat) */
        .block-ring-single {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .block-ring-single > span {
          width: 160px;
          height: 160px;
          border-radius: 9999px;
          border: 2px solid rgba(120,180,255,.55);
          box-shadow: 0 0 18px rgba(120,180,255,.35);
          animation: ringFlash 420ms ease-out 1;
        }

        @keyframes ringFlash {
          0%   { opacity: 0; transform: scale(.92); box-shadow: 0 0 0 rgba(120,180,255,0); }
          25%  { opacity: 1; box-shadow: 0 0 24px rgba(120,180,255,.55); }
          100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 rgba(120,180,255,0); }
        }

        .block-label{
          position:absolute; top:12px; left:50%; transform:translateX(-50%);
          padding:2px 8px; border-radius:6px; font-weight:900; font-size:11px;
          letter-spacing:.5px; text-transform:uppercase; color:#dbeafe;
          background:linear-gradient(180deg,rgba(30,60,120,.55),rgba(20,40,90,.55));
          box-shadow:0 0 10px rgba(120,180,255,.35), inset 0 0 8px rgba(120,180,255,.15);
          animation:blockWobble 480ms ease-out 1;
        }
        @keyframes blockWobble {
          0%{transform:translateX(-50%) scale(.96)}
          35%{transform:translateX(-50%) scale(1.06)}
          100%{transform:translateX(-50%) scale(1)}
        }
      `}</style>

      <div className="h-9 flex items-center justify-center text-[11px] font-extrabold text-white tracking-wide bg-gradient-to-r from-[rgba(120,120,255,.16)] via-[rgba(120,120,255,.25)] to-[rgba(120,120,255,.16)] border-b border-[var(--border)] uppercase">
        Level {level}
      </div>

      {/* Avatar area (vibra en BLOQUEO o CRÍTICO) */}
      <div
        className={`h-[160px] flex items-center justify-center relative ${showBlockFx || showCritFx ? "hit-shake-once" : ""}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-28 h-28 object-cover rounded-xl opacity-95 ring-1 ring-white/[.06]"
          />
        ) : (
          <User className="w-16 h-16 text-gray-400" />
        )}

        {/* BLOQUEO – escudo + ripple, desaparece solo */}
        {showBlockFx && (
          <>
            {/* flash azulado del card */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                animation: "blockFlash 650ms ease-out 1",
                background:
                  "radial-gradient(ellipse at center, rgba(120,180,255,.18) 0%, rgba(40,110,200,.08) 40%, rgba(0,0,0,0) 70%)",
                mixBlendMode: "screen",
              }}
            />
            {/* ripple recortado con forma de escudo */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: 140,
                  height: 160,
                  clipPath:
                    "polygon(50% 0%, 92% 18%, 92% 62%, 50% 100%, 8% 62%, 8% 18%)",
                  background:
                    "radial-gradient(circle, rgba(120,180,255,.40) 0%, rgba(120,180,255,.15) 45%, rgba(0,0,0,0) 72%)",
                  animation: "shieldRipple 520ms ease-out 1",
                  filter: "drop-shadow(0 0 16px rgba(120,180,255,.55))",
                }}
              />
            </div>
            {/* escudo brillante */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: 140,
                  height: 160,
                  clipPath:
                    "polygon(50% 0%, 92% 18%, 92% 62%, 50% 100%, 8% 62%, 8% 18%)",
                  background:
                    "linear-gradient(180deg, rgba(120,180,255,.18), rgba(60,120,220,.10))",
                  border: "2px solid rgba(120,180,255,.85)",
                  boxShadow:
                    "0 0 18px rgba(120,180,255,.55), inset 0 0 12px rgba(120,180,255,.28)",
                  animation: "shieldAppear 650ms ease-out 1",
                }}
              />
            </div>
          </>
        )}

        {/* ULT FX (igual que antes) */}
        {ultFlashKey > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: "ultimateFlash 750ms ease-out 1",
              background:
                "radial-gradient(ellipse at center, rgba(255,225,140,.20) 0%, rgba(160,80,255,.12) 45%, rgba(0,0,0,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* CRÍTICO – brillo rojo temporal (no queda pintado) */}
        {showCritFx && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: "critCardFlash 700ms ease-out 1",
              background:
                "radial-gradient(ellipse at center, rgba(255,70,80,.18) 0%, rgba(255,0,20,.08) 40%, rgba(0,0,0,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,.55)]" />
      </div>

      <div className="px-3 py-2 border-t border-[var(--border)] bg-[rgba(255,255,255,.03)] text-center">
        <div
          className="text-white font-black truncate text-base tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,.2)]"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
          title={name}
        >
          {name}
        </div>
      </div>

      <div className="px-3 pt-1">
        <SkillBadge
          title="Passive"
          text={passiveText ?? "—"}
          kind="passive"
          pulseKey={passivePulseKey}
          fate={stats["fate"] ?? 0}
        />
        <SkillBadge
          title="Ultimate"
          text={ultimateText ?? "—"}
          kind="ultimate"
          pulseKey={ultimatePulseKey}
          fate={stats["fate"] ?? 0}
        />
      </div>

      <div className="mt-[2px]">
        <div
          className={`h-7 border-y border-[var(--border)] bg-[rgba(255,255,255,.03)] overflow-hidden relative ${hpGlowKey ? "hp-glow-once" : ""}`}
          key={hpGlowKey}
        >
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, rgba(45,8,12,.95) 0%, rgba(85,14,20,.95) 40%, rgba(120,18,26,.95) 70%, rgba(150,22,30,.98) 100%)",
              boxShadow:
                "0 0 6px rgba(180,40,40,.28), inset 0 0 8px rgba(0,0,0,.75)",
              filter: "brightness(.88)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/95 font-semibold tracking-wide">
            {asInt(hp)} / {asInt(maxHP)} HP
          </div>
        </div>
      </div>

      <div className="pb-3 px-3 pt-2">
        <SmallMetricsCard map={stats} />
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.07),0_0_28px_rgba(120,120,255,.12)]" />
    </div>
  );
}
