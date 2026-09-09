import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  glow?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', glow = false, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`flex h-11 w-full rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.12))] bg-[var(--theme-card,rgba(15,23,42,0.6))] px-4 py-2 text-sm text-[var(--theme-text,#fff)] placeholder:text-[var(--theme-text-faint,#64748b)] transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--theme-primary,#6366f1)] focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#6366f1)]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          glow ? 'shadow-[0_0_15px_var(--theme-glow,rgba(99,102,241,0.2))]' : ''
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
