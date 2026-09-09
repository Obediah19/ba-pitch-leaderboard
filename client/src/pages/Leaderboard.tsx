import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext.js';
import { Aurora } from '../components/ReactBits/Aurora.js';
import { CountUp } from '../components/ReactBits/CountUp.js';
import { Trophy, ArrowUp, Minus, ArrowDown } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { socket } = useSocket();
  const roomCode = (code || '').toUpperCase();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    // Join room as an observer
    socket.emit('leaderboard:join', { roomCode });

    const onLeaderboardUpdate = (d: any) => {
      setLeaderboard(d.leaderboard || []);
    };

    socket.on('leaderboard:update', onLeaderboardUpdate);

    return () => {
      socket.off('leaderboard:update', onLeaderboardUpdate);
    };
  }, [socket, roomCode]);

  return (
    <Aurora intensity="subtle" className="text-[var(--color-chalk)] overflow-y-auto">
      <div className="flex flex-col min-h-screen p-8 sm:p-16 select-none max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center gap-4 mb-16">
          <Trophy className="w-16 h-16 text-[var(--color-volt)]" />
          <h1 className="text-5xl sm:text-6xl font-display font-bold text-center">Live Leaderboard</h1>
          <span className="text-lg font-semibold text-[var(--color-chalk-soft)]">Room Code: <strong className="text-[var(--color-chalk)]">{roomCode}</strong></span>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-white/10 px-6 uppercase text-sm font-bold tracking-widest text-[var(--color-chalk-faint)]">
            <div className="col-span-2">Rank</div>
            <div className="col-span-6">Participant</div>
            <div className="col-span-4 text-right">Total Score</div>
          </div>
          
          <AnimatePresence>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-xl font-semibold text-[var(--color-chalk-faint)]">
                Waiting for scores...
              </div>
            ) : (
              leaderboard.map((p, idx) => (
                <motion.div 
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`grid grid-cols-12 gap-4 items-center p-6 rounded-2xl ${idx === 0 ? 'bg-[var(--color-volt)]/20 border-2 border-[var(--color-volt)]' : 'bg-white/5 border border-white/10'} shadow-lg`}
                >
                  <div className="col-span-2 flex items-center gap-4">
                    <span className={`font-display font-bold text-4xl tabular ${idx === 0 ? 'text-[var(--color-volt)]' : 'text-white'}`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="col-span-6 flex flex-col gap-1">
                    <span className="font-display font-bold text-2xl truncate">{p.name}</span>
                    <span className="text-sm font-semibold text-[var(--color-chalk-soft)] truncate">{p.productIdea}</span>
                  </div>
                  <div className="col-span-4 flex flex-col items-end justify-center gap-1">
                    <span className={`font-display font-bold text-4xl tabular ${idx === 0 ? 'text-[var(--color-volt)]' : 'text-white'}`}>
                      <CountUp to={p.totalScore} duration={0.8} />
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-chalk-faint)]">
                      {p.voteCount} votes
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </Aurora>
  );
};
