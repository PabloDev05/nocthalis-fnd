// app/pages/arena/components/fx/CritImpactFX.tsx
import { useEffect, useMemo, useRef } from "react";

type Props = {
  triggerKey: number;
  intensity?: number; // 0.9–1.6
  gore?: number; // 0..1
  splatBias?: number; // 0..1 (1 = ultra salpicado)  default .85
};

type Splat = {
  x: number;
  y: number;
  r: number;
  rx?: number;
  ry?: number;
  rot?: number;
  kind: "circle" | "ellipse" | "blob";
};
type Chip = { x: number; y: number; s: number; rot: number };
type Slash = {
  p: string;
  width: number;
  droplets: { x: number; y: number; r: number }[];
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CritImpactFX({
  triggerKey,
  intensity = 1.2,
  gore = 0.9,
  splatBias = 0.85,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  const { seed, splats, micro, chips, slashes } = useMemo(() => {
    const seed =
      Math.floor((triggerKey * 9301 + 49297) % 233280) ^
      Math.floor(performance.now() % 1e7);
    const rnd = mulberry32(seed);

    // === COUNTS (más salpicaduras, menos charco) ===
    const base = 1 + gore * 1; // 1..2 slashes
    const slashCount = Math.max(1, Math.round(base));
    const splatCount = Math.round(18 + gore * 16); // 18..34 (medianas/pequeñas)
    const microCount = Math.round(80 + gore * 120); // 80..200 (spray fino)
    const chipCount = Math.round(10 + gore * 12); // 10..22

    const jitter = (base: number, spread: number) =>
      base + (rnd() - 0.5) * spread;

    // === SLASHES que cruzan el panel (gotean mucho) ===
    const slashes: Slash[] = Array.from({ length: slashCount }).map(() => {
      const pad = 40;
      const pickSide = () => {
        const v = rnd();
        if (v < 0.25) return { x: -pad, y: rnd() * 200 };
        if (v < 0.5) return { x: 320 + pad, y: rnd() * 200 };
        if (v < 0.75) return { x: rnd() * 320, y: -pad };
        return { x: rnd() * 320, y: 200 + pad };
      };
      const a = pickSide();
      const b = pickSide();
      const mid = {
        x: (a.x + b.x) / 2 + (rnd() - 0.5) * 60,
        y: (a.y + b.y) / 2 + (rnd() - 0.5) * 40,
      };
      const c1 = {
        x: a.x * 0.65 + mid.x * 0.35 + (rnd() - 0.5) * 40,
        y: a.y * 0.65 + mid.y * 0.35 + (rnd() - 0.5) * 30,
      };
      const c2 = {
        x: mid.x * 0.65 + b.x * 0.35 + (rnd() - 0.5) * 40,
        y: mid.y * 0.65 + b.y * 0.35 + (rnd() - 0.5) * 30,
      };
      const p = `M ${a.x},${a.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`;

      const width = 5 + rnd() * (8 + gore * 6); // más fino
      const droplets: Slash["droplets"] = [];
      const dropletCount = 12 + Math.floor(rnd() * (18 + gore * 20)); // MUCHO goteo
      for (let i = 0; i < dropletCount; i++) {
        const t = 0.08 + rnd() * 0.84;
        const x =
          (1 - t) ** 3 * a.x +
          3 * (1 - t) ** 2 * t * c1.x +
          3 * (1 - t) * t ** 2 * c2.x +
          t ** 3 * b.x;
        const y =
          (1 - t) ** 3 * a.y +
          3 * (1 - t) ** 2 * t * c1.y +
          3 * (1 - t) * t ** 2 * c2.y +
          t ** 3 * b.y;
        const dx = (rnd() - 0.5) * 26;
        const dy = (rnd() - 0.3) * 36; // ligera caída
        const r = 0.9 + rnd() * (gore * 2.4 + 0.9); // pequeña
        droplets.push({ x: x + dx, y: y + dy, r });
      }
      return { p, width, droplets };
    });

    // === SPLATS (sesgo a pequeños/medianos) ===
    const splats: Splat[] = Array.from({ length: splatCount }).map(() => {
      const x = jitter(160, 160 * (0.65 + rnd() * 0.5));
      const y = jitter(100, 100 * (0.65 + rnd() * 0.5));
      const rot = rnd() * 360 - 180;

      // reducir blobs grandes fuertemente
      const k = rnd();
      if (k < 0.12 * (1 - splatBias)) {
        // blob chico (máx 18)
        const r = 8 + rnd() * 10;
        return { x, y, r, rot, kind: "blob" };
      } else if (k < 0.55) {
        // elipses (salpicón aplastado)
        const rx = 5 + rnd() * 12;
        const ry = 3 + rnd() * 9;
        return { x, y, r: 0, rx, ry, rot, kind: "ellipse" };
      } else {
        // círculos chicos
        const r = 2.2 + rnd() * 6.5;
        return { x, y, r, rot, kind: "circle" };
      }
    });

    // === MICRO spray (puntitos) ===
    const micro = Array.from({ length: microCount }).map(() => ({
      x: rnd() * 320,
      y: rnd() * 200,
      r: 0.6 + rnd() * 1.1,
    }));

    // === CHIPS (fragmentos romos) ===
    const chips: Chip[] = Array.from({ length: chipCount }).map(() => ({
      x: rnd() * 320,
      y: rnd() * 200,
      s: 0.5 + rnd() * 0.9,
      rot: rnd() * 360 - 180,
    }));

    return { seed, splats, micro, chips, slashes };
  }, [triggerKey, gore, splatBias]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.remove("crit3-play");
    // @ts-ignore
    void el.offsetHeight;
    el.style.setProperty(
      "--k",
      String(Math.max(0.9, Math.min(1.6, intensity)))
    );
    el.style.setProperty("--gore", String(Math.max(0, Math.min(1, gore))));
    el.classList.add("crit3-play");
  }, [triggerKey, intensity, gore]);

  return (
    <div ref={rootRef} className="crit3-root" aria-hidden>
      <style>{`
        .crit3-root{
          position:absolute; inset:0; pointer-events:none; opacity:0;
          --k:1.2; --gore:.9;
          --r1: 255, 106, 121;
          --r2: 198,  42,  58;
          --r3: 140,  18,  30;
          --r4:  48,   7,  11;
        }
        .crit3-play{ animation: crit3-inout 800ms cubic-bezier(.15,.75,.18,1) forwards; }
        @keyframes crit3-inout { 0%{opacity:0} 10%{opacity:1} 100%{opacity:0} }

        .crit3-stage{ position:absolute; inset:0; width:100%; height:100%; }

        .crit3-fill    { opacity:0; animation: crit3-fill  140ms ease-out forwards; }
        .crit3-perim   { opacity:0; animation: crit3-perim 220ms ease-out forwards; }
        .crit3-slashes { opacity:0; animation: crit3-slash 180ms ease-out forwards; }
        .crit3-splats  { opacity:0; animation: crit3-splat 360ms ease-out forwards; }
        .crit3-micro   { opacity:0; animation: crit3-micro 320ms ease-out forwards; }
        .crit3-chips   { opacity:0; animation: crit3-chips 420ms ease-out forwards; }
        .crit3-vig     { opacity:0; animation: crit3-vig   420ms ease-out forwards; }

        @keyframes crit3-fill  { 0%{opacity:0; transform:scale(.985)} 100%{opacity:.55; transform:scale(var(--k))} }
        @keyframes crit3-perim { 0%{opacity:0} 100%{opacity:1} }
        @keyframes crit3-slash { 0%{opacity:0; filter:blur(1px)} 100%{opacity:1; filter:blur(0)} }
        @keyframes crit3-splat { 0%{opacity:0} 60%{opacity:1} 100%{opacity:calc(.75 + .25*var(--gore))} }
        @keyframes crit3-micro { 0%{opacity:0} 50%{opacity:.95} 100%{opacity:.6} }
        @keyframes crit3-chips { 0%{opacity:.8} 100%{opacity:0} }
        @keyframes crit3-vig   { 0%{opacity:0} 35%{opacity:.85} 100%{opacity:0} }
      `}</style>

      <svg
        className="crit3-stage"
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Ruido único por trigger */}
          <filter id="bloodNoise" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="2"
              seed={seed}
              result="n0"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n0"
              scale="9"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="bleedSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Muy tenue: no queremos charco */}
          <filter id="coagulate" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.6"
              numOctaves="1"
              seed={seed}
              result="gn"
            />
            <feColorMatrix
              in="gn"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 2 -1"
            />
            <feBlend in="SourceGraphic" in2="gn" mode="multiply" />
          </filter>

          <mask id="edgeMask">
            <rect x="-12" y="-12" width="344" height="224" fill="white" />
            <rect
              x="6"
              y="6"
              width="308"
              height="188"
              rx="16"
              ry="16"
              fill="black"
            />
          </mask>

          <g id="chip">
            <path d="M0,0 C4,1 7,3 8,5 C7,7 4,9 0,10 C-4,9 -7,7 -8,5 C-7,3 -4,1 0,0 Z" />
          </g>

          <radialGradient id="bloodFill" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="rgba(var(--r2), .08)" />
            <stop offset="40%" stopColor="rgba(var(--r3), .08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(var(--r2), .18)" />
            <stop offset="100%" stopColor="rgba(var(--r3), .22)" />
          </linearGradient>
        </defs>

        {/* 1) Relleno MUY tenue (no charco) */}
        <g
          className="crit3-fill"
          style={{ mixBlendMode: "multiply" }}
          filter="url(#coagulate)"
        >
          <rect x="0" y="0" width="320" height="200" fill="url(#bloodFill)" />
        </g>

        {/* 2) Borde que sangra */}
        <g
          className="crit3-perim"
          mask="url(#edgeMask)"
          style={{ mixBlendMode: "multiply" }}
        >
          <rect
            x="-12"
            y="-12"
            width="344"
            height="224"
            fill="url(#edgeGrad)"
            filter="url(#bleedSoft)"
          />
        </g>

        {/* 3) SLASHES + goteo abundante */}
        <g
          className="crit3-slashes"
          filter="url(#bloodNoise)"
          style={{ mixBlendMode: "multiply" }}
        >
          {slashes.map((s, i) => (
            <g key={i}>
              <path
                d={s.p}
                stroke={`rgba(${[140, 18, 30].join(",")}, 0.95)`}
                strokeWidth={s.width}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={s.p}
                stroke={`rgba(${[198, 42, 58].join(",")}, 0.55)`}
                strokeWidth={s.width * 0.65}
                strokeLinecap="round"
                fill="none"
              />
              {/* pequeñas gotas desprendidas */}
              {s.droplets.map((d, j) => (
                <circle
                  key={j}
                  cx={d.x}
                  cy={d.y}
                  r={d.r}
                  fill={`rgba(${[198, 42, 58].join(",")}, .9)`}
                />
              ))}
            </g>
          ))}
        </g>

        {/* 4) Salpicaduras medianas/pequeñas */}
        <g
          className="crit3-splats"
          filter="url(#bloodNoise)"
          style={{ mixBlendMode: "multiply" }}
        >
          {splats.map((s, i) => {
            const base = `rgba(${[140, 18, 30].join(",")}, ${0.55 + 0.25 * gore})`;
            if (s.kind === "blob") {
              const r = s.r;
              const p = `
                M ${s.x - r},${s.y}
                C ${s.x - r},${s.y - 0.7 * r} ${s.x - 0.7 * r},${s.y - r} ${s.x},${s.y - r}
                C ${s.x + 0.7 * r},${s.y - r} ${s.x + r},${s.y - 0.7 * r} ${s.x + r},${s.y}
                C ${s.x + r},${s.y + 0.7 * r} ${s.x + 0.7 * r},${s.y + r} ${s.x},${s.y + r}
                C ${s.x - 0.7 * r},${s.y + r} ${s.x - r},${s.y + 0.7 * r} ${s.x - r},${s.y} Z`;
              return (
                <path
                  key={`b${i}`}
                  d={p}
                  fill={base}
                  transform={`rotate(${s.rot || 0}, ${s.x}, ${s.y})`}
                />
              );
            }
            if (s.kind === "ellipse") {
              return (
                <ellipse
                  key={`e${i}`}
                  cx={s.x}
                  cy={s.y}
                  rx={s.rx!}
                  ry={s.ry!}
                  transform={`rotate(${s.rot || 0}, ${s.x}, ${s.y})`}
                  fill={base}
                />
              );
            }
            return (
              <circle key={`c${i}`} cx={s.x} cy={s.y} r={s.r} fill={base} />
            );
          })}
          {/* brillo rojizo mínimo */}
          {splats.map((s, i) => {
            const f = `rgba(${[255, 106, 121].join(",")}, ${0.18 + 0.18 * gore})`;
            if (s.kind === "ellipse") {
              return (
                <ellipse
                  key={`e3${i}`}
                  cx={s.x - 2}
                  cy={s.y + 1}
                  rx={Math.max(1.2, s.rx! * 0.28)}
                  ry={Math.max(1.0, s.ry! * 0.22)}
                  fill={f}
                />
              );
            }
            const rr = s.kind === "circle" ? s.r * 0.32 : s.r * 0.28;
            return (
              <circle
                key={`c3${i}`}
                cx={s.x - 2}
                cy={s.y + 1}
                r={Math.max(1.2, rr)}
                fill={f}
              />
            );
          })}
        </g>

        {/* 5) MICRO spray */}
        <g className="crit3-micro" style={{ mixBlendMode: "multiply" }}>
          {micro.map((m, i) => (
            <circle
              key={i}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill={`rgba(${[140, 18, 30].join(",")}, .85)`}
            />
          ))}
        </g>

        {/* 6) Fragmentos oscuros discretos */}
        <g className="crit3-chips" filter="url(#bloodNoise)">
          <g fill={`rgba(${[198, 42, 58].join(",")}, .85)`}>
            {chips.map((ch, i) => (
              <use
                key={i}
                href="#chip"
                transform={`translate(${ch.x},${ch.y}) rotate(${ch.rot}) scale(${ch.s})`}
              />
            ))}
          </g>
        </g>

        {/* 7) Vignette tenue */}
        <g className="crit3-vig" style={{ mixBlendMode: "multiply" }}>
          <rect
            x="-4"
            y="-4"
            width="328"
            height="208"
            rx="18"
            ry="18"
            fill={`rgba(${[255, 0, 20].join(",")}, .08)`}
          />
        </g>
      </svg>
    </div>
  );
}
