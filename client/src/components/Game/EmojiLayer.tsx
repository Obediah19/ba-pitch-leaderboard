import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext.js';

interface Sprite {
  id: number;
  emoji: string;
  left: number; // vw
  driftClass: string;
}

const MAX_SPRITES = 30;
const DRIFTS = ['drift-a', 'drift-b', 'drift-c'];

/**
 * Fixed overlay that renders floating emoji reactions.
 * Listens to `room:reaction` (small rooms) and `room:reaction_batch` (large rooms).
 * Purely cosmetic — never sends.
 */
export const EmojiLayer: React.FC = () => {
  const { socket } = useSocket();
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const spawn = (emoji: string) => {
      setSprites((prev) => {
        const s: Sprite = {
          id: nextId.current++,
          emoji,
          left: 8 + Math.random() * 84,
          driftClass: DRIFTS[Math.floor(Math.random() * DRIFTS.length)],
        };
        const next = [...prev, s];
        return next.length > MAX_SPRITES ? next.slice(next.length - MAX_SPRITES) : next;
      });
    };

    const onReaction = (d: { emoji: string }) => spawn(d.emoji);
    const onBatch = (d: { emojis: string[] }) => {
      // stagger a batch so it reads as a wave, not a wall
      d.emojis.slice(0, 40).forEach((e, i) => setTimeout(() => spawn(e), i * 45));
    };

    socket.on('room:reaction', onReaction);
    socket.on('room:reaction_batch', onBatch);
    return () => {
      socket.off('room:reaction', onReaction);
      socket.off('room:reaction_batch', onBatch);
    };
  }, [socket]);

  const remove = (id: number) =>
    setSprites((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="emoji-layer" aria-hidden="true">
      {sprites.map((s) => (
        <span
          key={s.id}
          className="emoji-sprite"
          style={{ left: `${s.left}vw` }}
          onAnimationEnd={() => remove(s.id)}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
};
