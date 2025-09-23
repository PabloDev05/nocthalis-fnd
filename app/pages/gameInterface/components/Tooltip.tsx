import React from "react";

export default function Tooltip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const pos =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";
  return (
    <span className="relative inline-flex items-center group">
      {children}
      <span
        className={`pointer-events-none absolute ${pos} z-40 hidden group-hover:block rounded-md border border-white/10 bg-black/80 px-2 py-1 text-[11px] leading-snug text-gray-100 shadow-xl whitespace-normal break-words max-w-[280px] text-left`}
      >
        {text}
      </span>
    </span>
  );
}
