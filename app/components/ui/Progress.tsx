import React from "react";

type ProgressProps = {
  value: number; // 0 a 100
  className?: string;
};

export function Progress({ value, className = "" }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-700 rounded-full h-4 overflow-hidden ${className}`}>
      <div className="bg-purple-600 h-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
