import React, { useState, useEffect } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number; // ms per frame
  maxIterations?: number;
  className?: string;
  animateOnMount?: boolean;
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 10,
  className = '',
  animateOnMount = true,
}) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!animateOnMount) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const target = text;
    let timer: any;

    const runDecrypt = () => {
      timer = setInterval(() => {
        setDisplayText(
          target
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index < Math.floor(iteration / maxIterations * target.length)) {
                return target[index];
              }
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join('')
        );

        iteration += 1;
        if (iteration >= maxIterations + target.length) {
          setDisplayText(target);
          clearInterval(timer);
        }
      }, speed);
    };

    runDecrypt();

    return () => clearInterval(timer);
  }, [text, speed, maxIterations, animateOnMount]);

  return <span className={className}>{displayText}</span>;
};
