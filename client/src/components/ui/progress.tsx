import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  glow?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  glow = true,
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`relative h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      {...props}
    >
      <div
        className={`h-full bg-gradient-to-r from-[var(--theme-primary,#6366f1)] to-[var(--theme-accent,#ec4899)] transition-all duration-300 ease-out rounded-full ${
          glow ? 'shadow-[0_0_12px_var(--theme-glow,rgba(99,102,241,0.5))]' : ''
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
