import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface TiltedCardProps {
  children: React.ReactNode;
  maxAngle?: number;
  scale?: number;
  className?: string;
  glareEffect?: boolean;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  maxAngle = 12,
  scale = 1.02,
  className = '',
  glareEffect = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -maxAngle;
    const rY = ((x - centerX) / centerX) * maxAngle;

    rotateX.set(rX);
    rotateY.set(rY);

    if (glareEffect) {
      setGlarePosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative perspective-[1000px] ${className}`}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? scale : 1,
        }}
        transition={{ duration: 0.15 }}
        className="w-full h-full relative"
      >
        {children}

        {glareEffect && isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden mix-blend-overlay z-20"
            style={{
              background: `radial-gradient(circle 240px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.25), transparent 75%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
