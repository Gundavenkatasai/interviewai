import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';

export type ActionPillState = 'idle' | 'executing' | 'success';

export interface MorphingActionPillProps {
  state: ActionPillState;
  idleText: string;
  executingText?: string;
  successText?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const MorphingActionPill: React.FC<MorphingActionPillProps> = ({
  state,
  idleText,
  executingText = 'Engineering...',
  successText = 'Calibrated & Ready',
  onClick,
  disabled = false,
  className = '',
  icon = <Sparkles className="w-3.5 h-3.5" />,
}) => {
  return (
    <motion.button
      onClick={state === 'idle' ? onClick : undefined}
      disabled={disabled || state === 'executing'}
      layout
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      className={`relative inline-flex items-center justify-center font-medium select-none overflow-hidden text-xs rounded-full border transition-all duration-300 ${
        state === 'idle'
          ? 'bg-[#172535] text-white border-[#23384E] hover:bg-[#23384E] shadow-[0_2px_0_0_#0E1721] px-4 py-2'
          : state === 'executing'
          ? 'bg-[#FDF6E9] text-[#A36114] border-[#F7E6C4] px-3.5 py-1.5 shadow-none'
          : 'bg-[#EBF3EE] text-[#2E6347] border-[#D0E3D6] px-4 py-1.5 shadow-none'
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {icon}
            <span>{idleText}</span>
          </motion.span>
        )}

        {state === 'executing' && (
          <motion.span
            key="executing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 font-mono tracking-tight"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A36114]" />
            <span>{executingText}</span>
          </motion.span>
        )}

        {state === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-1.5 font-medium"
          >
            <Check className="w-3.5 h-3.5 text-[#2E6347]" />
            <span>{successText}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

