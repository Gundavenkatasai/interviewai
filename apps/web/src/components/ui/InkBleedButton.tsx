import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface InkBleedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  bleedColor?: string;
  className?: string;
}

export const InkBleedButton: React.FC<InkBleedButtonProps> = ({
  children,
  icon,
  bleedColor = '#EFECE6',
  className = '',
  disabled = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-[#181614] border border-[#DCD5C6] hover:border-[#181614] bg-white/70 select-none cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: bleedColor }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: isHovered && !disabled ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};

