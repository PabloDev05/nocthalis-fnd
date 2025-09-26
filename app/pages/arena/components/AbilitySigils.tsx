// app/pages/arena/components/AbilitySigils.tsx
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";

type SigilProps = {
  title: string;
  pulseKey: number;
  tone?: "passive" | "ultimate";
  size: number; // px
};

const Sigil = React.memo(function Sigil({
  title,
  pulseKey,
  tone = "passive",
  size,
}: SigilProps) {
  const [ping, setPing] = useState(false);

  // Clamp a enteros seguros
  const px = Math.max(
    12,
    Math.round(
      Number.isFinite((size as any) ? size : 0) ? (size as number) : 24
    )
  );

  useEffect(() => {
    if (!pulseKey) return;
    setPing(true);
    const t = window.setTimeout(() => setPing(false), 700);
    return () => window.clearTimeout(t);
  }, [pulseKey]);

  const ring =
    tone === "ultimate"
      ? "border-violet-400/40 text-violet-100"
      : "border-cyan-400/40 text-cyan-100";

  const icon =
    tone === "ultimate" ? (
      <svg viewBox="0 0 24 24" style={{ width: px * 0.68, height: px * 0.68 }}>
        <path
          d="M12 4 L20 18 H4 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M8 13 H16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ) : (
      <svg
        viewBox="0 -1 23.5 24"
        style={{ width: px * 0.68, height: px * 0.68 }}
      >
        <path
          d="M12 3 L19 7.5 L19 16.5 L12 21 L5 16.5 L5 7.5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      </svg>
    );

  return (
    <div
      className={`relative rounded-full border ${ring} select-none flex items-center justify-center`}
      title={title || "—"}
      aria-label={title || "—"}
      role="img"
      style={{
        width: px,
        height: px,
        boxShadow: "0 0 16px rgba(0,0,0,.35)", // halo sutil
        background: "rgba(0,0,0,.25)",
      }}
    >
      {ping && (
        <span
          className="absolute inset-0 rounded-full animate-ping bg-white/10"
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">{icon}</span>
    </div>
  );
});

export type AbilitySigilsProps = {
  passiveText?: string | null;
  ultimateText?: string | null;
  passivePulseKey?: number;
  ultimatePulseKey?: number;

  /**
   * Posición:
   *  - "avatar-bottom": centrado bajo el avatar
   *  - "label-left": dentro de la barra del nombre, a la izquierda
   */
  anchor?: "avatar-bottom" | "label-left";

  /** tamaño de cada sigil (px) */
  size?: number;

  /** offset desde el borde cuando aplica */
  offset?: number;

  /** separación entre los dos sigils (px) */
  gap?: number;
};

export default function AbilitySigils({
  passiveText = "—",
  ultimateText = "—",
  passivePulseKey = 0,
  ultimatePulseKey = 0,
  anchor = "avatar-bottom",
  size = 26,
  offset = 10,
  gap = 10,
}: AbilitySigilsProps) {
  const containerClass = "absolute z-10 flex items-center";

  const style: CSSProperties = useMemo(() => {
    return anchor === "label-left"
      ? { left: offset, top: "50%", transform: "translateY(-50%)", gap }
      : { left: "50%", transform: "translateX(-50%)", bottom: 8, gap };
  }, [anchor, offset, gap]);

  return (
    <div className={containerClass} style={style}>
      <Sigil
        title={passiveText || "—"}
        pulseKey={passivePulseKey || 0}
        tone="passive"
        size={size}
      />
      <Sigil
        title={ultimateText || "—"}
        pulseKey={ultimatePulseKey || 0}
        tone="ultimate"
        size={size}
      />
    </div>
  );
}
