import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}
