// src/pages/arena/components/Badges.tsx
import {
  Crown,
  Percent,
  ScrollText,
  Shield,
  Sparkles,
  Sword as SwordIcon,
  Wind,
} from "lucide-react";

export function StatIcon({ k }: { k: string }) {
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
  fate?: number;
}) {
  const full = (text && String(text).trim().length ? text : "—") as string;
  const [name] = full.split(":");
  const Icon = kind === "passive" ? Sparkles : Crown;

  const luck = Math.max(0, Number(fate) || 0);
  const alpha = Math.min(0.9, 0.18 + (luck / 100) * 0.4);
  const glowColor =
    kind === "passive"
      ? `rgba(86,156,255,${alpha})`
      : `rgba(255,214,86,${alpha})`;

  return (
    <div className="mb-1 rounded-md px-2 py-1 bg-white/[.04] border border-white/[.06] relative overflow-hidden">
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
          <span className="inline-flex w-4.5 h-4.5 items-center justify-center rounded bg-[rgba(120,120,255,.12)] border border-white/[.08] text-[var(--accent)]">
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
