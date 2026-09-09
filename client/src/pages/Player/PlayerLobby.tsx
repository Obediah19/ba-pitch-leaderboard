import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.js';
import { getAvatarDataUri } from '../../services/avatar.js';
import { sound } from '../../services/audio.js';
import { EmojiBar } from '../../components/Game/EmojiBar.js';
import { EmojiLayer } from '../../components/Game/EmojiLayer.js';
import { Loader2 } from 'lucide-react';

export const PlayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const { socket, getStoredSession, clearSession } = useSocket();
  const session = getStoredSession();
  const [players, setPlayers] = useState<any[]>([]);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    if (!socket || !session.roomCode || !session.token) {
      navigate('/');
      return;
    }
    const onLobby = (d: any) => {
      setPlayers((cur) => {
        if ((d.players?.length || 0) > cur.length) sound.playJoin();
        return d.players || [];
      });
    };
    const onGo = () => { sound.playTick(); navigate('/player/game'); };
    const onKicked = () => { clearSession(); alert('You were removed from the room.'); navigate('/'); };

    socket.on('room:lobby_update', onLobby);
    socket.on('game:countdown', onGo);
    socket.on('game:question_live', onGo);
    socket.on('room:kicked', onKicked);
    socket.emit('room:sync_request', { roomCode: session.roomCode, sessionToken: session.token });

    return () => {
      socket.off('room:lobby_update', onLobby);
      socket.off('game:countdown', onGo);
      socket.off('game:question_live', onGo);
      socket.off('room:kicked', onKicked);
    };
  }, [socket, session, navigate, clearSession]);

  useEffect(() => { setPrevCount(players.length); }, [players.length]);
  const crossedMilestone = [5, 10, 20].some((m) => prevCount < m && players.length >= m);

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] flex flex-col items-center justify-between p-6 select-none">
      <EmojiLayer />

      <div className="pt-2">
        <span className="px-3 py-1 rounded-full bg-[var(--color-paper-sunk)] text-xs font-bold text-[var(--color-ink-soft)] tabular">
          ROOM {session.roomCode}
        </span>
      </div>

      <div className="flex flex-col items-center text-center gap-6 my-auto">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-full bg-[rgba(139,92,246,0.08)] border-2 border-[rgba(139,92,246,0.25)] grid place-items-center overflow-hidden shadow-[var(--shadow-paper)]"
        >
          <img src={getAvatarDataUri(session.avatar || session.nickname || 'player')} alt="You" className="w-24 h-24" />
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-display font-bold text-[var(--color-ink)]">
            You're in, {session.nickname}!
          </h2>
          <p className="text-sm font-semibold text-[var(--color-ink-soft)] flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[var(--color-volt)] animate-spin" />
            Waiting for the host to start…
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
        <span className={`text-xs font-bold ${crossedMilestone ? 'text-[var(--color-ans-c)]' : 'text-[var(--color-ink-faint)]'}`}>
          {crossedMilestone && '🔥 '}{players.length} {players.length === 1 ? 'player' : 'players'} in the room
        </span>
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-full">
          <AnimatePresence>
            {players.slice(0, 10).map((p, i) => (
              <motion.div
                key={p.playerId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22, delay: (i % 5) * 0.03 }}
                className="w-9 h-9 rounded-full bg-[var(--color-paper-sunk)] border border-[var(--color-line)] grid place-items-center overflow-hidden avatar-bob"
                style={{ animationDelay: `${(i % 5) * 0.25}s` }}
                title={p.nickname}
              >
                <img src={getAvatarDataUri(p.avatar || p.nickname)} alt={p.nickname} className="w-8 h-8" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="pt-2 w-full">
          <p className="eyebrow text-[var(--color-ink-faint)] text-center mb-2">React</p>
          <EmojiBar roomCode={session.roomCode || ''} sessionToken={session.token || ''} />
        </div>
      </div>
    </div>
  );
};
