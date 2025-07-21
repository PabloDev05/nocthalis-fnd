// app/components/ui/Card.tsx
import { cn } from "../../lib/utils";
import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-xl shadow-md bg-gray-800 border border-gray-700",
        className
      )}
    >
      {children}
    </div>
  );
}
