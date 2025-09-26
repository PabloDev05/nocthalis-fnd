// app/pages/arena/components/SkillBits.tsx
import {
  Crown,
  Percent,
  ScrollText,
  Shield,
  Sparkles,
  Sword as SwordIcon,
  Wind,
} from "lucide-react";

type KnownStatKey =
  | "attackPower"
  | "blockChance"
  | "criticalChance"
  | "evasion"
  | "fate"
  | string;

export function StatIcon({ k }: { k: KnownStatKey }) {
  switch (k) {
    case "attackPower":
      return <SwordIcon className="w-3.5 h-3.5" />;
    case "blockChance":
      return <Shield className="w-3.5 h-3.5" />;
    case "criticalChance":
      return <Percent className="w-3.5 h-3.5" />;
    case "evasion":
      return <Wind className="w-3.5 h-3.5" />;
    case "fate":
      return <Sparkles className="w-3.5 h-3.5" />;
    default:
      return <ScrollText className="w-3.5 h-3.5" />;
  }
}

export function SkillBadge({
  title,
  text,
  kind,
  pulseKey,
  fate = 0,
}: {
  title: "Passive" | "Ultimate";
  text?: string | null;
  kind: "passive" | "ultimate";
  pulseKey: number;
  fate?: number; // enteros; el backend usa Fate entero
}) {
  const full = (text && String(text).trim().length ? text : "—") as string;
  const [name] = full.split(":");
  const Icon = kind === "passive" ? Sparkles : Crown;

  const luck = Math.max(0, Number(fate) || 0);
  // halo más intenso con más Fate (sin decimales)
  const alpha = Math.min(0.9, 18 / 100 + (luck / 100) * 0.4);
  const glowColor =
    kind === "passive"
      ? `rgba(86,156,255,${alpha})`
      : `rgba(255,214,86,${alpha})`;

  return (
    <div
      className="mb-1 rounded-md px-2 py-1 bg-white/[.04] border border-white/[.06] relative overflow-hidden"
      aria-label={`${title} ${name || ""}`.trim()}
      title={full}
    >
      <style>{`@keyframes glowPulse { 0% { opacity:0 } 35% { opacity:.6 } 100% { opacity:0 } }`}</style>
      <div
        key={pulseKey}
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: pulseKey ? "glowPulse 700ms ease-out 1" : undefined,
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, rgba(0,0,0,0) 60%)`,
          opacity: 0,
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded bg-[rgba(120,120,255,.12)] border border-white/[.08] text-[var(--accent)] w-[18px] h-[18px]">
            <Icon className="w-3 h-3" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
            {title}
          </span>
        </div>
        <span
          className="text-[11px] text-zinc-200 truncate max-w-[140px]"
          title={name}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
