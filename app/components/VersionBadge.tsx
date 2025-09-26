import React, { useMemo } from "react";

/**
 * Badge de versión:
 * - Color cambia por canal: dev | qa | prod
 * - Muestra: vX.Y.Z (sha) • fecha corta
 * - No captura clicks (pointer-events-none)
 */
export default function VersionBadge() {
  const version = String(import.meta.env.VITE_APP_VERSION ?? "0.0.0-dev");
  const channel = String(
    import.meta.env.VITE_RELEASE_CHANNEL ?? "dev"
  ).toLowerCase();
  const shaFull = String(import.meta.env.VITE_GIT_SHA ?? "").trim();
  const sha = shaFull ? shaFull.slice(0, 7) : null;

  // Fecha: usa VITE_BUILD_DATE si viene, si no, hora local del cliente
  const builtAt = String(import.meta.env.VITE_BUILD_DATE ?? "");
  const dateStr = useMemo(() => {
    try {
      const d = builtAt ? new Date(builtAt) : new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    } catch {
      return "";
    }
  }, [builtAt]);

  // Paleta por canal
  const stylesByChannel: Record<
    string,
    { ring: string; pill: string; text: string }
  > = {
    prod: {
      ring: "border-emerald-500/25",
      pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      text: "text-emerald-300/80",
    },
    qa: {
      ring: "border-amber-400/25",
      pill: "bg-amber-400/10 text-amber-200 border-amber-400/30",
      text: "text-amber-200/80",
    },
    dev: {
      ring: "border-sky-400/25",
      pill: "bg-sky-400/10 text-sky-200 border-sky-400/30",
      text: "text-sky-200/80",
    },
  };
  const s = stylesByChannel[channel] ?? stylesByChannel.dev;

  return (
    <div
      className={[
        "text-[10px] leading-none tracking-wide select-none pointer-events-none",
        "border-t pt-2 mt-2",
        s.ring,
      ].join(" ")}
      title={`Nocthalis v${version}${sha ? ` (${shaFull})` : ""} • ${channel} • ${dateStr}`}
    >
      <span className={`${s.text} opacity-80`}>Nocthalis</span> v{version}
      {sha && (
        <>
          {" "}
          <span className="opacity-50">•</span>{" "}
          <span className={`${s.text}`}>{sha}</span>
        </>
      )}
      {dateStr && (
        <>
          {" "}
          <span className="opacity-50">•</span>{" "}
          <span className="text-gray-300/60">{dateStr}</span>
        </>
      )}{" "}
      {channel}
    </div>
  );
}
