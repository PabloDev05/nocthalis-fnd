import type { ReactNode } from "react";

type AvatarProps = {
  src?: string;
  fallback?: string;
  size?: number; // px
};

export function Avatar({ src, fallback = "??", size = 48 }: AvatarProps) {
  return (
    <div
      className="relative rounded-full overflow-hidden bg-gray-700 flex items-center justify-center select-none text-gray-300 font-bold"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      {!src && <span>{fallback}</span>}
    </div>
  );
}
