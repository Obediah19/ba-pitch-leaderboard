import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'neon' | 'glow' | 'arcade';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-2xl gap-2.5 font-semibold',
      icon: 'h-10 w-10 rounded-xl p-0',
    }[size];

    const variantClasses = {
      default:
        'bg-[var(--theme-primary,#6366f1)] text-white hover:brightness-110 shadow-lg shadow-[var(--theme-primary,#6366f1)]/20 border border-white/15',
      destructive:
        'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 border border-red-400/20',
      outline:
        'border border-[var(--theme-border,rgba(255,255,255,0.15))] bg-[var(--theme-card,rgba(255,255,255,0.03))] hover:bg-[var(--theme-card-hover,rgba(255,255,255,0.08))] text-[var(--theme-text,#fff)] backdrop-blur-sm',
      secondary:
        'bg-[var(--theme-secondary,#1e293b)] text-[var(--theme-text,#fff)] hover:bg-[var(--theme-secondary-hover,#334155)] border border-white/5',
      ghost:
        'hover:bg-white/10 text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#fff)]',
      neon:
        'bg-[var(--theme-primary,#6366f1)] text-white font-bold tracking-wide uppercase shadow-[0_0_24px_var(--theme-glow,rgba(99,102,241,0.45))] hover:shadow-[0_0_32px_var(--theme-glow,rgba(99,102,241,0.65))] border border-white/30',
      glow:
        'relative bg-gradient-to-r from-[var(--theme-primary,#6366f1)] to-[var(--theme-accent,#ec4899)] text-white shadow-xl shadow-[var(--theme-primary,#6366f1)]/30 hover:shadow-2xl hover:shadow-[var(--theme-primary,#6366f1)]/50 border border-white/20',
      arcade:
        'bg-[var(--theme-primary,#ec4899)] text-white font-bold border-b-4 border-[var(--theme-primary-deep,#be185d)] active:border-b-0 active:translate-y-1 rounded-xl shadow-lg',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
