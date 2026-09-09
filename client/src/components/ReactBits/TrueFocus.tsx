import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'Play the room, not the slides',
  manualMode = false,
  blurAmount = 4,
  borderColor = 'var(--theme-primary, #6366f1)',
  glowColor = 'var(--theme-glow, rgba(99, 102, 241, 0.5))',
  animationDuration = 0.4,
  pauseBetweenAnimations = 1,
  className = '',
}) => {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);
      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex ?? 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-x-3 gap-y-1 select-none ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => { wordRefs.current[index] = el; }}
            className="relative cursor-pointer transition-all duration-300 font-bold"
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.45,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="absolute pointer-events-none rounded-lg"
        animate={{
          x: focusRect.x - 6,
          y: focusRect.y - 4,
          width: focusRect.width + 12,
          height: focusRect.height + 8,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
          ease: 'easeInOut',
        }}
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 16px ${glowColor}`,
        }}
      >
        <span
          className="absolute -top-[3px] -left-[3px] w-2 h-2 border-t-2 border-l-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -top-[3px] -right-[3px] w-2 h-2 border-t-2 border-r-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-[3px] -left-[3px] w-2 h-2 border-b-2 border-l-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-[3px] -right-[3px] w-2 h-2 border-b-2 border-r-2"
          style={{ borderColor }}
        />
      </motion.div>
    </div>
  );
};
