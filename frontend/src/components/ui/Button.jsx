'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/15',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-surface-100 border border-surface-600/50',
  ghost: 'bg-transparent hover:bg-surface-800 text-surface-300 hover:text-surface-100',
  danger: 'bg-error/90 hover:bg-error text-white',
  outline: 'bg-transparent border border-primary-500/40 text-primary-400 hover:bg-primary-500/8 hover:border-primary-400',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-sm',
  xl: 'px-9 py-3.5 text-base',
};

const Button = forwardRef(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon: Icon, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.985 }}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold rounded-lg
          transition-all duration-200 cursor-pointer tracking-[-0.01em]
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
