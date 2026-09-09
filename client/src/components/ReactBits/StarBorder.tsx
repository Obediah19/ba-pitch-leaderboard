import React from 'react';

interface StarBorderProps {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'button',
  className = '',
  color = '#a855f7',
  speed = '4s',
  children,
  onClick,
  disabled = false,
  ...props
}) => {
  return (
    <Component
      className={`relative inline-block py-[1px] px-[1px] overflow-hidden rounded-2xl transition-transform active:scale-95 ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-80 bottom-0 right-[-100%] rounded-full animate-spin pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-80 top-0 left-[-100%] rounded-full animate-spin pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-10 w-full h-full rounded-[15px] bg-slate-950/90 backdrop-blur-md">
        {children}
      </div>
    </Component>
  );
};
