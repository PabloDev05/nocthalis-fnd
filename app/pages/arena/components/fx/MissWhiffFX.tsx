// app/pages/arena/components/fx/MissWhiffFX.tsx
import { useEffect, useMemo, useRef } from "react";

type Props = {
  triggerKey: number;
  side: "left" | "right";
  echoes?: number;
  strengthPx?: number;
  neon?: number;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function MissWhiffFX({
  triggerKey,
  side,
  echoes = 9,
  strengthPx = 12,
  neon = 0.6,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dir = side === "left" ? -1 : 1;

  // ⬇️ Guardamos el último trigger para NO animar en el primer render
  const prevKey = useRef<number | null>(null);

  // Solo actualizamos variables cuando cambian (sin animar)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--dir", String(dir));
    el.style.setProperty("--gap", `${Math.max(6, strengthPx)}px`);
    el.style.setProperty("--a", String(Math.max(0, Math.min(1, neon))));
  }, [dir, strengthPx, neon]);

  // Animamos ÚNICAMENTE cuando el trigger cambia (y no en el mount)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prevKey.current === null) {
      prevKey.current = triggerKey; // primer render: no animar
      return;
    }
    if (prevKey.current === triggerKey) return; // mismo trigger: no animar
    prevKey.current = triggerKey;

    el.classList.remove("mm-play");
    // @ts-ignore
    void el.offsetHeight; // reflow
    el.classList.add("mm-play");
  }, [triggerKey]);

  const lines = useMemo(() => {
    const rnd = mulberry32(
      (triggerKey * 1103515245 + 12345) ^ Math.floor(performance.now() % 1e7)
    );
    const n = 8 + Math.floor(rnd() * 10);
    return Array.from({ length: n }).map(() => ({
      y: Math.floor(8 + rnd() * 144),
      len: Math.floor(28 + rnd() * 80),
      off: Math.floor(8 + rnd() * 28),
      a: 0.18 + rnd() * 0.25,
    }));
  }, [triggerKey]);

  return (
    <div ref={ref} className="mm-root pointer-events-none">
      <style>{`
        .mm-root{
          position:absolute; inset:0; z-index:2;
          opacity:0; /* ⬅️ oculto por defecto, solo se ve en .mm-play */
          --pad: 28px;
        }
        .mm-play{ animation: mm-in 420ms cubic-bezier(.2,.65,.18,1) 1 forwards; }
        @keyframes mm-in { 0%{opacity:0} 12%{opacity:1} 100%{opacity:0} }

        .mm-layer{ position:absolute; inset:calc(var(--pad) * -1); }
        .mm-echo{
          position:absolute; inset:0; border-radius:16px;
          background: transparent;
        }
        .mm-lines{ position:absolute; inset:0; }
        .mm-line{
          position:absolute; height:2px; border-radius:2px;
          background: rgba(120,200,255,.35);
        }
      `}</style>

      <div className="mm-layer">
        {Array.from({ length: echoes }).map((_, i) => {
          const fall = 1 - i / (echoes + 1);
          const inset = `-${i * Math.max(2, strengthPx / 2)}px`;
          const t = `translateX(calc(${dir} * ${-i} * var(--gap) * .6)) skewX(${
            (side === "left" ? -1 : 1) * (3 + i * 0.4)
          }deg)`;
          return (
            <div
              key={i}
              className="mm-echo"
              style={{
                inset,
                opacity: 0.15 + fall * 0.3 * (0.6 + 0.4 * neon),
                transform: t,
              }}
            />
          );
        })}

        <div className="mm-lines">
          {lines.map((l, idx) => (
            <div
              key={idx}
              className="mm-line"
              style={{
                top: `${l.y}px`,
                width: `${l.len}px`,
                opacity: l.a * (0.7 + 0.3 * neon),
                left:
                  side === "left"
                    ? `calc(100% + ${l.off}px)`
                    : `calc(-${l.off + l.len}px)`,
                transform: `skewX(${(side === "left" ? -1 : 1) * 10}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
