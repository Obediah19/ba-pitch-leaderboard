import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext.js';
import { EmojiLayer } from './EmojiLayer.js';

/** Red pulsing vignette for the final seconds of a question. */
export const HeartbeatVignette: React.FC<{ active: boolean }> = ({ active }) =>
  active ? <div className="heartbeat-vignette" aria-hidden="true" /> : null;

/** Warm edge glow while a player is on an answer streak. */
export const StreakGlow: React.FC<{ active: boolean }> = ({ active }) =>
  active ? <div className="streak-glow" aria-hidden="true"><span /></div> : null;

/**
 * Full-screen emoji storm moment for the host projector.
 * Listens for `room:emoji_storm`, fills the screen with one emoji + a shake.
 */
export const EmojiStorm: React.FC = () => {
  const { socket } = useSocket();
  const [storm, setStorm] = useState<{ emoji: string; key: number } | null>(null);

  useEffect(() => {
    if (!socket) return;
    const onStorm = (d: { emoji: string }) => {
      setStorm({ emoji: d.emoji, key: Date.now() });
      document.documentElement.classList.add('storm-shake');
      setTimeout(() => document.documentElement.classList.remove('storm-shake'), 1400);
      setTimeout(() => setStorm(null), 2600);
    };
    socket.on('room:emoji_storm', onStorm);
    return () => {
      socket.off('room:emoji_storm', onStorm);
    };
  }, [socket]);

  if (!storm) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={`${storm.key}-${i}`}
          className="emoji-sprite"
          style={{
            left: `${(i * 37) % 100}vw`,
            fontSize: `${2 + (i % 4)}rem`,
            animationDelay: `${(i % 10) * 0.08}s`,
            animationDuration: `${1.8 + (i % 5) * 0.2}s`,
          }}
        >
          {storm.emoji}
        </span>
      ))}
    </div>
  );
};

export { EmojiLayer };
