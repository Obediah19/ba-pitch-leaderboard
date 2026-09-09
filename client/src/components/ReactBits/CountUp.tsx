import React, { useState, useEffect } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // seconds
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [current, setCurrent] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(from + (to - from) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrent(to);
      }
    };

    requestAnimationFrame(step);
  }, [to, from, duration]);

  return (
    <span className={className}>
      {prefix}
      {current.toLocaleString()}
      {suffix}
    </span>
  );
};
