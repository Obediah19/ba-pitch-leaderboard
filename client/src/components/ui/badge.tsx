import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'neon' | 'success' | 'arcade';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors select-none';

  const variantClasses = {
    default:
      'bg-[var(--theme-primary,#6366f1)]/15 text-[var(--theme-primary-bright,#a5b4fc)] border border-[var(--theme-primary,#6366f1)]/30',
    secondary:
      'bg-white/10 text-[var(--theme-text-muted,#94a3b8)] border border-white/10',
    destructive:
      'bg-red-500/15 text-red-400 border border-red-500/30',
    outline:
      'border border-[var(--theme-border,rgba(255,255,255,0.2))] text-[var(--theme-text,#fff)]',
    neon:
      'bg-[var(--theme-primary,#6366f1)]/20 text-[var(--theme-primary-bright,#818cf8)] border border-[var(--theme-primary,#6366f1)]/60 shadow-[0_0_12px_var(--theme-glow,rgba(99,102,241,0.3))]',
    success:
      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    arcade:
      'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]',
  }[variant];

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
