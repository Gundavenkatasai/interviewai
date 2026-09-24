import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "blue" | "green" | "purple" | "neutral";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = ""
}) => {
  const variantStyles = {
    orange: "bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30",
    blue: "bg-[#0284c7]/10 text-[#38bdf8] border-[#0284c7]/30",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    neutral: "bg-white/5 text-zinc-300 border-white/10"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
