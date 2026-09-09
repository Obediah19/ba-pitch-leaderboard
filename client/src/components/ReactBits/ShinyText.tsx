import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number; // seconds
  tone?: 'dark' | 'light'; // "light" = readable on a light background
}

const GRADIENTS = {
  dark: 'linear-gradient(110deg, #9333ea 0%, #e2e8f0 35%, #ffffff 50%, #e2e8f0 65%, #9333ea 100%)',
  light: 'linear-gradient(110deg, #6D28D9 0%, #A78BFA 40%, #C084FC 50%, #A78BFA 60%, #6D28D9 100%)',
};

export const ShinyText: React.FC<ShinyTextProps> = ({ text, className = '', speed = 3, tone = 'dark' }) => (
  <span
    className={`inline-block font-display font-bold text-transparent bg-clip-text animate-shimmer ${className}`}
    style={{
      backgroundImage: GRADIENTS[tone],
      backgroundSize: '250% 100%',
      animationDuration: `${speed}s`,
    }}
  >
    {text}
  </span>
);
