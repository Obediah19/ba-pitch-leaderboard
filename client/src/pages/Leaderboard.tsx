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
        <div className="flex flex-col items-center justify-center gap-3 mb-12 text-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-12 h-12 text-[var(--color-volt)]" />
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-center">Business Turnaround Challenge</h1>
          </div>
          <span className="text-xs font-extrabold text-[var(--color-volt-bright)] uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
            E-Summit • Organized by Magefficie & Entrepreneurial Symposium
          </span>
          <span className="text-base font-semibold text-[var(--color-chalk-soft)] mt-1">Live Leaderboard | Room Code: <strong className="text-[var(--color-chalk)]">{roomCode}</strong></span>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-white/10 px-6 uppercase text-sm font-bold tracking-widest text-[var(--color-chalk-faint)]">
            <div className="col-span-2">Rank</div>
            <div className="col-span-5">Participant</div>
            <div className="col-span-5 text-right">Average Score</div>
          </div>
          
          <AnimatePresence>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-xl font-semibold text-[var(--color-chalk-faint)]">
                Waiting for pitch scores...
              </div>
            ) : (
              leaderboard.map((p, idx) => {
                const avg = p.averageScore !== undefined
                  ? Number(p.averageScore).toFixed(2)
                  : p.voteCount > 0
                  ? (p.totalScore / p.voteCount).toFixed(2)
                  : '0.00';

                return (
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
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="col-span-5 flex flex-col gap-1">
                      <span className="font-display font-bold text-2xl truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-[var(--color-chalk-soft)] truncate">{p.productIdea}</span>
                    </div>
                    <div className="col-span-5 flex flex-col items-end justify-center gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-display font-bold text-4xl tabular ${idx === 0 ? 'text-[var(--color-volt)]' : 'text-white'}`}>
                          {avg}
                        </span>
                        <span className="text-sm font-bold text-[var(--color-chalk-soft)]">/ 10</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-chalk-faint)]">
                        {p.voteCount} audience {p.voteCount === 1 ? 'vote' : 'votes'} (Total: {p.totalScore || 0} pts)
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </Aurora>
  );
};
