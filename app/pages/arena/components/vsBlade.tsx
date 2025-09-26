import { useEffect, useRef, useState } from "react";

/**
 * VS central con corte diagonal tipo katana + partículas de sangre.
 * - Se anima 1 sola vez cuando cambia playKey.
 * - Fuera de la animación queda un VS estático y legible.
 */
export default function VSBlade({
  playKey,
  visible,
}: {
  playKey: number; // incrementa para disparar la animación
  visible: boolean; // debe ser true cuando el duelo está en "VS"
}) {
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ===== Partículas sencillas (sangre)
  type P = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
  };
  const particlesRef = useRef<P[]>([]);

  useEffect(() => {
    if (!visible) return; // no mostramos/animamos si no está en VS
    setPlaying(true);

    // Lanzar partículas ~450 ms después de iniciar (cuando “pasa” la katana)
    const t1 = window.setTimeout(spawnParticles, 450);
    const t2 = window.setTimeout(() => setPlaying(false), 1200); // cortar animación visual

    // arranca el loop del canvas
    startLoop();

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      stopLoop();
      particlesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, visible]);

  const startLoop = () => {
    if (rafRef.current) return;
    const draw = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const w = (cv.width = cv.clientWidth);
      const h = (cv.height = cv.clientHeight);

      // limpio con alpha para trailing suave
      ctx.clearRect(0, 0, w, h);

      // actualizar y pintar partículas
      const arr = particlesRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        // gravedad leve
        p.vy += 0.12;
        // fricción ligera
        p.vx *= 0.995;
        p.vy *= 0.995;

        const alpha = Math.max(0, 1 - p.life / p.max);
        if (alpha <= 0 || p.y > h + 10) {
          arr.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(180, 16, 32, ${alpha})`;
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
  };

  const stopLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  function spawnParticles() {
    const cv = canvasRef.current;
    if (!cv) return;

    const w = cv.clientWidth;
    const h = cv.clientHeight;

    // Línea diagonal (de arriba-izq a abajo-der). Disparamos partículas
    // alrededor del centro de la diagonal:
    const cx = w / 2;
    const cy = h / 2;
    const N = 38 + Math.floor(Math.random() * 14);

    const out: P[] = [];
    for (let i = 0; i < N; i++) {
      // dispersión alrededor del centro
      const ex = (Math.random() - 0.5) * 120; // elongación a lo largo de la diagonal
      const ey = (Math.random() - 0.5) * 40; // ancho de la estela
      // lanzar principalmente hacia ambos lados de la diagonal
      const speed = 2.0 + Math.random() * 2.8;
      const angle = (45 * Math.PI) / 180 + (Math.random() - 0.5) * 0.5; // ~45° +/- jitter
      out.push({
        x: cx + ex,
        y: cy + ey,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: 0,
        max: 60 + Math.floor(Math.random() * 30),
      });
    }
    particlesRef.current.push(...out);
  }

  return (
    <div
      className={`relative w-[240px] h-[140px] select-none pointer-events-none`}
      aria-hidden="true"
    >
      {/* estilos locales */}
      <style>{`
        .vs-wrapper {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 0 10px rgba(130, 80, 255, .25));
        }
        .vs-text {
          font-family: 'Cinzel Decorative', serif;
          font-weight: 900;
          letter-spacing: 2px;
          font-size: 64px;
          line-height: 1;
          background: linear-gradient(180deg, #caaaff 0%, #6a55cc 55%, #301a66 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow:
            0 0 12px rgba(150,100,255,.6),
            0 0 28px rgba(90,60,200,.35);
          opacity: ${visible ? 1 : 0};
          transform: translateZ(0);
        }
        .vs-text.outline::after {
          /* fino contorno para legibilidad sobre fondos oscuros */
          content: 'VS';
          position: absolute; inset: 0;
          color: transparent;
          -webkit-text-stroke: 1px rgba(40,20,70,.9);
          text-stroke: 1px rgba(40,20,70,.9);
          pointer-events: none;
        }

        /* línea de katana (diagonal) */
        .slash {
          position: absolute;
          left: 50%; top: 50%;
          width: 2px; height: 220%;
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%,
                                                 rgba(255,255,255,.95) 45%,
                                                 rgba(255,80,80,.9) 55%,
                                                 rgba(255,255,255,0) 100%);
          box-shadow:
            0 0 10px rgba(255,200,200,.6),
            0 0 24px rgba(200,60,60,.35),
            0 0 36px rgba(140,40,150,.25);
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(45deg) scaleY(0);
          border-radius: 2px;
          opacity: 0;
        }
        .slash.play {
          animation:
            slashGrow 220ms ease-out forwards,
            slashMove 540ms cubic-bezier(.36,.07,.19,.97) 160ms forwards,
            slashFade 520ms ease-out 540ms forwards;
        }
        @keyframes slashGrow {
          0%   { transform: translate(-50%,-50%) rotate(45deg) scaleY(0); opacity: 0 }
          100% { transform: translate(-50%,-50%) rotate(45deg) scaleY(1); opacity: 1 }
        }
        @keyframes slashMove {
          0%   { transform: translate(-50%,-50%) rotate(45deg) scaleY(1) }
          100% { transform: translate(-50%,-50%) rotate(45deg) scaleY(1) translateX(120px) }
        }
        @keyframes slashFade {
          0%   { opacity: 1 }
          100% { opacity: 0 }
        }

        /* destello en el corte (breve) */
        .spark {
          position: absolute;
          left: 50%; top: 50%;
          width: 160px; height: 160px;
          pointer-events: none;
          background: radial-gradient(ellipse at center,
                    rgba(255,210,230,.35) 0%,
                    rgba(255,70,100,.18) 36%,
                    rgba(0,0,0,0) 70%);
          transform: translate(-50%,-50%) rotate(45deg) scale(.6);
          opacity: 0;
        }
        .spark.play {
          animation: sparkFlash 380ms ease-out 240ms 1 forwards;
        }
        @keyframes sparkFlash {
          0%   { opacity: 0; transform: translate(-50%,-50%) rotate(45deg) scale(.55) }
          50%  { opacity: .9; transform: translate(-50%,-50%) rotate(45deg) scale(1.0) }
          100% { opacity: 0; transform: translate(-50%,-50%) rotate(45deg) scale(1.1) }
        }

        /* pulso suave del VS (pero sin repetir animación después del inicio) */
        .vs-pulse {
          animation: vsPulse 800ms ease-out 1;
        }
        @keyframes vsPulse {
          0% { transform: scale(.94); filter: drop-shadow(0 0 0 rgba(150,100,255,0)); }
          70% { transform: scale(1.02); filter: drop-shadow(0 0 22px rgba(150,100,255,.7)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(150,100,255,.25)); }
        }
      `}</style>

      {/* capa de partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "screen" }}
      />

      <div className="vs-wrapper">
        <div
          className={`relative vs-text outline ${playing ? "vs-pulse" : ""}`}
        >
          VS
        </div>
      </div>

      {/* línea y destello del corte */}
      <div className={`slash ${playing ? "play" : ""}`} />
      <div className={`spark ${playing ? "play" : ""}`} />
    </div>
  );
}
