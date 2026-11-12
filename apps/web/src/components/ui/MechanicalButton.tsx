import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface MechanicalButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'vermilion' | 'primary' | 'navy' | 'stone' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export const MechanicalButton: React.FC<MechanicalButtonProps> = ({
  variant = 'vermilion',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  ...props
}) => {
  const variantStyles = {
    vermilion: 'bg-[#C84B26] hover:bg-[#B53E1B] text-white shadow-[0_2px_0_0_#983416] border border-[#B53E1B]',
    primary: 'bg-[#C84B26] hover:bg-[#B53E1B] text-white shadow-[0_2px_0_0_#983416] border border-[#B53E1B]',
    navy: 'bg-[#172535] hover:bg-[#23384E] text-white shadow-[0_2px_0_0_#0E1721] border border-[#23384E]',
    stone: 'bg-[#EFECE6] hover:bg-[#E5E0D4] text-[#181614] shadow-[0_2px_0_0_#C9C2B3] border border-[#D5CEBF]',
    danger: 'bg-[#9E2A2B] hover:bg-[#862223] text-white shadow-[0_2px_0_0_#751D1E] border border-[#862223]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-md gap-2 font-medium',
    lg: 'px-5 py-2.5 text-base rounded-md gap-2.5 font-medium tracking-tight',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 2, boxShadow: '0 0px 0 0 transparent' }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </motion.button>
  );
};

