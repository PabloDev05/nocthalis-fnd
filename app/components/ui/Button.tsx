import type { ReactNode } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "icon";
  children: ReactNode;
};

export function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  const baseStyles =
    "rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

  const variants = {
    primary: "bg-purple-700 text-white px-4 py-2 hover:bg-purple-800",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-300 px-3 py-1",
    icon: "p-2 hover:bg-gray-800 text-gray-300 flex items-center justify-center",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
