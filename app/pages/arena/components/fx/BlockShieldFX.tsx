import { useEffect, useRef } from "react";

type Props = {
  triggerKey: number;
  intensity?: number; // 0.75–1.6
  palette?: "steel" | "crimson" | "emerald";
  emblemCross?: boolean; // opcional
  brightness?: number; // 1..1.8 (boost de luz en el impacto)
};

export default function BlockShieldFX({
  triggerKey,
  intensity = 1.1,
  palette = "steel",
  emblemCross = false,
  brightness = 1.35,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.remove("blk-play");
    // @ts-ignore
    el.offsetHeight; // reflow
    el.style.setProperty(
      "--k",
      String(Math.max(0.6, Math.min(1.6, intensity)))
    );
    el.style.setProperty(
      "--boost",
      String(Math.max(1, Math.min(1.8, brightness)))
    );
    el.setAttribute("data-palette", palette);
    el.toggleAttribute("data-cross", emblemCross);
    el.classList.add("blk-play");
  }, [triggerKey, intensity, palette, emblemCross, brightness]);

  return (
    <div ref={rootRef} className="blk fx-center" aria-hidden>
      <style>{`
        .blk{
          position:absolute; inset:0; pointer-events:none; opacity:0;
          display:grid; place-items:center; mix-blend-mode: screen;
          --k: 1; --boost: 1.35;
          /* Steel (retocado más azul y “hierro”) */
          --p1:#d9e7ff; --p2:#a7c4ff; --p3:#6a92df; --p4:#344a6b;
          /* Crimson / Emerald (por si los usás) */
          --r1:#ffd5db; --r2:#ff90a2; --r3:#c73748; --r4:#4d1c24;
          --e1:#d6ffe9; --e2:#8af7c0; --e3:#2e9b6e; --e4:#1a4f3a;

          --c1: var(--p1); --c2: var(--p2); --c3: var(--p3); --c4: var(--p4);
          --rimInner: rgba(220,235,255,.2);
          --flare: rgba(255,255,255,.98);
          --rune: rgba(210,225,255,.35);
        }
        .blk[data-palette="crimson"]{ --c1:var(--r1); --c2:var(--r2); --c3:var(--r3); --c4:var(--r4); }
        .blk[data-palette="emerald"]{ --c1:var(--e1); --c2:var(--e2); --c3:var(--e3); --c4:var(--e4); }

        .fx-center{ display:grid; place-items:center; }
        .blk.blk-play{ animation: blk-fade 820ms ease-out 1 forwards; }

        .shield-wrap{
          position:relative;
          width: calc(260px * var(--k));
          height: calc(320px * var(--k));
          filter: drop-shadow(0 0 36px color-mix(in oklab, var(--c2), #fff 20%))
                  drop-shadow(0 0 16px var(--c3));
        }
        .svg-stage, .g-clip { transform-box: fill-box; transform-origin: 50% 45%; }

        /* Capas */
        .flare,.ring1,.ring2,.runes,.cracks,.sparks,.frags,.shine { opacity:0; }
        .blk-play .flare { animation: flarePop 360ms cubic-bezier(.2,.8,.2,1) 1 forwards; }
        .blk-play .ring1 { animation: ringOut1 680ms cubic-bezier(.2,.8,.2,1) 1 forwards; }
        .blk-play .ring2 { animation: ringOut2 640ms cubic-bezier(.2,.8,.2,1) 1 forwards; }
        .blk-play .runes { animation: runesSpin 640ms ease-out 1 forwards; }
        .blk-play .cracks{ animation: cracksFlash 280ms ease-out 1 forwards; }
        .blk-play .sparks{ animation: sparksOn 480ms ease-out 1 forwards; }
        .blk-play .frags { animation: fragsPop 540ms ease-out 1 forwards; }
        .blk-play .shine { animation: shineSweep 520ms ease-out 1 forwards; }

        .rivet{ fill: rgba(235,245,255,.8); filter: drop-shadow(0 0 2px var(--c1)); }

        .cross{ opacity:0; }
        .blk[data-cross="true"].blk-play .cross{
          animation: crossGlow 560ms ease-out 1 forwards;
        }

        /* Keyframes */
        @keyframes blk-fade{ 0%{opacity:0} 12%{opacity:1} 100%{opacity:0} }
        @keyframes flarePop{
          0%{ opacity:0; transform: scale(.82) }
          60%{ opacity:1; transform: scale(calc(1.08 * var(--boost))) }
          100%{ opacity:.0; transform: scale(calc(1.18 * var(--boost))) }
        }
        @keyframes ringOut1{
          0%{ opacity:1; transform: scale(.90) }
          60%{ opacity:.6; transform: scale(calc(1.16 * var(--boost))) }
          100%{ opacity:0; transform: scale(calc(1.32 * var(--boost))) }
        }
        @keyframes ringOut2{
          0%{ opacity:1; transform: scale(.95) }
          60%{ opacity:.55; transform: scale(calc(1.24 * var(--boost))) }
          100%{ opacity:0; transform: scale(calc(1.44 * var(--boost))) }
        }
        @keyframes runesSpin{
          0%{ opacity:0; transform: rotate(-12deg) scale(.96) }
          60%{ opacity:.48 }
          100%{ opacity:0; transform: rotate(12deg) scale(1.02) }
        }
        @keyframes cracksFlash{ 0%{opacity:0} 20%{opacity:.65} 100%{opacity:0} }
        @keyframes sparksOn{ 0%{opacity:1} 100%{opacity:0} }
        @keyframes fragsPop{ 0%{opacity:.95} 100%{opacity:0} }
        @keyframes shineSweep{
          0%{ opacity:.0; transform: translateY(10px) scale(1) }
          20%{ opacity:.55 }
          100%{ opacity:.0; transform: translateY(-14px) scale(1.05) }
        }
        @keyframes crossGlow{
          0%{ opacity:0; filter: drop-shadow(0 0 0 var(--c2)) }
          50%{ opacity:.95; filter: drop-shadow(0 0 20px var(--c2)) }
          100%{ opacity:.4; filter: drop-shadow(0 0 8px var(--c2)) }
        }
      `}</style>

      <svg
        className="shield-wrap svg-stage"
        viewBox="0 0 240 320"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Forma más fiel al ejemplo: punta arriba y abajo, hombros anchos, laterales curvos */}
          <path
            id="shieldPath"
            d="
            M120 8
            L128 18
            C 160 22, 186 36, 200 58
            C 212 78, 214 96, 214 116
            C 214 182, 178 236, 120 308
            C 62 236, 26 182, 26 116
            C 26 96, 28 78, 40 58
            C 54 36, 80 22, 112 18
            L120 8 Z
          "
          />

          <clipPath id="clipShield">
            <use href="#shieldPath" />
          </clipPath>

          {/* Gradientes */}
          <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--c1)" />
            <stop offset="50%" stopColor="var(--c2)" />
            <stop offset="100%" stopColor="var(--c3)" />
          </linearGradient>

          <radialGradient id="glassGrad" cx="50%" cy="43%" r="68%">
            <stop offset="0%" stopColor="rgba(255,255,255,.10)" />
            <stop offset="55%" stopColor="rgba(255,255,255,.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <radialGradient id="flareGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="60%" stopColor="rgba(255,255,255,.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Bloom = blur + composite para subrayar el brillo */}
          <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="4"
              result="blur1"
            />
            <feColorMatrix
              in="blur1"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="cm"
            />
            <feMerge>
              <feMergeNode in="cm" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ARO EXTERIOR + INTERIOR */}
        <use
          href="#shieldPath"
          fill="none"
          stroke="url(#rimGrad)"
          strokeWidth="7"
        />
        <use
          href="#shieldPath"
          fill="none"
          stroke="var(--rimInner)"
          strokeWidth="2"
        />

        {/* RIVETES distribuidos */}
        {[
          [120, 12],
          [160, 20],
          [186, 38],
          [204, 70],
          [212, 108],
          [208, 142],
          [194, 182],
          [170, 224],
          [144, 262],
          [120, 296],
          [96, 262],
          [70, 224],
          [46, 182],
          [32, 142],
          [28, 108],
          [36, 70],
          [54, 38],
          [80, 20],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.1" className="rivet" />
        ))}

        {/* VIDRIO / ENERGÍA */}
        <g clipPath="url(#clipShield)">
          <rect x="26" y="8" width="188" height="300" fill="url(#glassGrad)" />
          <rect
            x="26"
            y="150"
            width="188"
            height="100"
            fill="rgba(255,255,255,.03)"
          />
        </g>

        {/* DESTELLO CENTRAL (con bloom) */}
        <g
          className="flare g-clip"
          clipPath="url(#clipShield)"
          filter="url(#bloom)"
        >
          <circle
            cx="120"
            cy="148"
            r="54"
            fill="url(#flareGrad)"
            opacity="0.98"
          />
          <circle
            cx="120"
            cy="158"
            r="26"
            fill="url(#flareGrad)"
            opacity="0.65"
          />
        </g>

        {/* ARCO DE BRILLO que barre verticalmente */}
        <g className="shine g-clip" clipPath="url(#clipShield)">
          <path
            d="M60 210 C100 200,140 200,180 210"
            stroke="rgba(255,255,255,.55)"
            strokeWidth="6"
            fill="none"
            style={{ filter: "url(#bloom)" }}
          />
        </g>

        {/* SHOCKWAVES siguiendo el contorno */}
        <g className="ring1 g-clip" clipPath="url(#clipShield)">
          <use
            href="#shieldPath"
            fill="none"
            stroke="var(--c1)"
            strokeWidth="3"
            opacity="0.92"
          />
        </g>
        <g className="ring2 g-clip" clipPath="url(#clipShield)">
          <use
            href="#shieldPath"
            fill="none"
            stroke="var(--c2)"
            strokeWidth="2"
            opacity="0.85"
          />
        </g>

        {/* RUNAS alrededor */}
        <g className="runes g-clip" clipPath="url(#clipShield)">
          <use
            href="#shieldPath"
            fill="none"
            stroke="var(--rune)"
            strokeWidth="3"
            strokeDasharray="9 18"
          />
        </g>

        {/* GRIETAS cerca del núcleo */}
        <g className="cracks g-clip" clipPath="url(#clipShield)">
          <path
            d="M120 160 L138 148 L154 144"
            stroke="var(--c1)"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M120 160 L108 174 L96 186"
            stroke="var(--c1)"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M120 160 L128 178 L140 196"
            stroke="var(--c1)"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* FRAGMENTOS (triángulos) */}
        <g className="frags g-clip" clipPath="url(#clipShield)" fill="white">
          <polygon
            points="118,146 126,148 120,156"
            fill="rgba(255,255,255,.92)"
            style={{ filter: "url(#bloom)" }}
          />
          <polygon
            points="134,162 140,164 134,170"
            fill="rgba(255,255,255,.85)"
            style={{ transform: "translate(8px,-6px)", filter: "url(#bloom)" }}
          />
          <polygon
            points="106,166 112,168 106,174"
            fill="rgba(255,255,255,.85)"
            style={{ transform: "translate(-8px,6px)", filter: "url(#bloom)" }}
          />
        </g>

        {/* CHISPAS direccionales */}
        <g
          className="sparks g-clip"
          clipPath="url(#clipShield)"
          stroke="white"
          strokeLinecap="round"
          style={{ filter: "url(#bloom)" }}
        >
          <path
            d="M120 152 L90 136"
            strokeWidth="2.6"
            style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
          />
          <path
            d="M120 152 L150 140"
            strokeWidth="2.6"
            style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
          />
          <path
            d="M120 152 L104 178"
            strokeWidth="2.6"
            style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
          />
        </g>

        {/* CRUZ opcional (glow sutil) */}
        <g className="cross">
          <path
            d="M120 86 L120 230 M70 158 L170 158"
            stroke="rgba(255,255,255,.95)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M120 86 L120 230 M70 158 L170 158"
            stroke="rgba(60,110,200,.95)"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
