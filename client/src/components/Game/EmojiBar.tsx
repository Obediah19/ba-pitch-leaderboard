import React, { useCallback, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext.js';

// Must match server ALLOWED_REACTIONS.
export const REACTIONS = ['😂', '🔥', '😮', '❤️', '👏', '🎯', '😭', '🤯'] as const;

const COOLDOWN_MS = 600;

interface EmojiBarProps {
  roomCode: string;
  sessionToken: string;
  className?: string;
}

/**
 * Tap row for sending emoji reactions. Local cooldown mirrors the server's
 * per-player floor so the button can't be mashed.
 */
export const EmojiBar: React.FC<EmojiBarProps> = ({ roomCode, sessionToken, className = '' }) => {
  const { socket } = useSocket();
  const [cooling, setCooling] = useState(false);
  const lastSent = useRef(0);

  const send = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastSent.current < COOLDOWN_MS || !socket) return;
      lastSent.current = now;
      setCooling(true);
      setTimeout(() => setCooling(false), COOLDOWN_MS);
      socket.emit('player:reaction', { roomCode, sessionToken, emoji });
    },
    [socket, roomCode, sessionToken],
  );

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => send(e)}
          disabled={cooling}
          aria-label={`React ${e}`}
          className="w-11 h-11 rounded-2xl text-xl grid place-items-center bg-[var(--color-paper-raised)] border border-[var(--color-line)] transition active:scale-90 disabled:opacity-40 hover:bg-[var(--color-paper-sunk)]"
        >
          {e}
        </button>
      ))}
    </div>
  );
};
