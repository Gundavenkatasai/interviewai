import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accentBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  onClick,
  accentBorder = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl transition-all duration-300 ${
        accentBorder
          ? "bg-[#121216]/80 border border-[#ea580c]/30 shadow-xl shadow-[#ea580c]/5 hover:border-[#ea580c]/60"
          : "bg-[#121216]/60 border border-white/10 hover:border-white/20 hover:bg-[#121216]/90 shadow-xl shadow-black/40"
      } backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
};
