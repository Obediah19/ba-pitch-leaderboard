import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.js';
import { sound } from '../../services/audio.js';
import { EmojiBar } from '../../components/Game/EmojiBar.js';
import { EmojiLayer, HeartbeatVignette } from '../../components/Game/StageFx.js';
import { Check, Lock } from 'lucide-react';

type State = 'WAITING' | 'POLL_OPEN' | 'VOTED';

export const PlayerGame: React.FC = () => {
  const navigate = useNavigate();
  const { socket, getStoredSession, clearSession } = useSocket();
  const session = getStoredSession();

  const [gs, setGs] = useState<State>('WAITING');
  const [participant, setParticipant] = useState<any>(null);
  const [scorePicked, setScorePicked] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !session.roomCode || !session.token) { navigate('/'); return; }

    socket.emit('room:sync_request', { roomCode: session.roomCode, sessionToken: session.token });

    const onSync = (d: any) => {
      if (d.status === 'POLL_OPEN' && d.participant) {
        setParticipant(d.participant);
        if (d.hasVoted) {
          setGs('VOTED');
          setScorePicked(null); // Or keep track if we want to show it, but server only sends hasVoted
        } else {
          setGs('POLL_OPEN');
          setScorePicked(null);
        }
      } else {
        setGs('WAITING');
      }
    };

    const onPollOpen = (d: any) => {
      setParticipant(d);
      setGs('POLL_OPEN');
      setScorePicked(null);
      sound.playTick();
    };

    const onPollClosed = () => {
      setGs('WAITING');
      setParticipant(null);
      setScorePicked(null);
    };

    const onVoteAck = (d: any) => {
      setGs('VOTED');
      setScorePicked(d.score);
      sound.playLock();
    };

    const onKicked = () => { clearSession(); alert('You were removed from the room.'); navigate('/'); };
    const onEnded = (d: any) => { clearSession(); alert(d.reason || 'Session ended'); navigate('/'); };

    socket.on('player:sync', onSync);
    socket.on('game:poll_open', onPollOpen);
    socket.on('game:poll_closed', onPollClosed);
    socket.on('player:vote_acknowledged', onVoteAck);
    socket.on('room:kicked', onKicked);
    socket.on('room:ended', onEnded);

    return () => {
      socket.off('player:sync', onSync);
      socket.off('game:poll_open', onPollOpen);
      socket.off('game:poll_closed', onPollClosed);
      socket.off('player:vote_acknowledged', onVoteAck);
      socket.off('room:kicked', onKicked);
      socket.off('room:ended', onEnded);
    };
  }, [socket, session, navigate, clearSession]);

  const submitVote = (score: number) => {
    if (gs !== 'POLL_OPEN' || !socket || !participant) return;
    setScorePicked(score); 
    setGs('VOTED');
    sound.playLock();
    socket.emit('player:submit_vote', {
      roomCode: session.roomCode,
      sessionToken: session.token,
      participantId: participant.participantId || participant.id,
      score,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col justify-between p-4 sm:p-6 select-none max-w-lg mx-auto">
      <EmojiLayer />
      <HeartbeatVignette active={gs === 'POLL_OPEN'} />

      {/* WAITING */}
      {gs === 'WAITING' && (
        <div className="my-auto flex flex-col items-center text-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full bg-[var(--color-volt)]/10 flex items-center justify-center text-[var(--color-volt)]"
          >
            <span className="text-4xl">⏳</span>
          </motion.div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-display font-bold">Waiting for host...</h2>
            <p className="text-[var(--color-ink-soft)] font-semibold text-sm">The host will open the poll after the pitch.</p>
          </div>
          <EmojiBar roomCode={session.roomCode || ''} sessionToken={session.token || ''} />
        </div>
      )}

      {/* POLL OPEN */}
      {gs === 'POLL_OPEN' && participant && (
        <div className="flex-1 flex flex-col justify-between py-2 gap-8">
          <div className="flex flex-col items-center text-center gap-4 pt-6">
            <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-volt)]/10 text-[var(--color-volt)] text-xs font-bold uppercase tracking-widest animate-pulse">
              Live Poll
            </div>
            <h2 className="text-3xl font-display font-bold px-2">{participant.name}</h2>
            <p className="text-lg text-[var(--color-ink-soft)] font-semibold">{participant.productIdea}</p>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <span className="text-center font-bold text-[var(--color-ink-soft)] text-sm uppercase tracking-wider">
              Rate this pitch (1-10)
            </span>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => submitVote(score)}
                  className="aspect-square rounded-2xl bg-white/10 hover:bg-[var(--color-volt)] text-white font-display font-extrabold text-2xl border-2 border-white/20 hover:border-[var(--color-volt)] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VOTED */}
      {gs === 'VOTED' && (
        <div className="my-auto flex flex-col items-center text-center gap-6 w-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-24 h-24 rounded-full bg-[var(--color-good)]/10 text-[var(--color-good)] flex items-center justify-center border-4 border-[var(--color-good)]/20"
          >
            <Check className="w-12 h-12 stroke-[3]" />
          </motion.div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-display font-bold">Vote recorded!</h2>
            {scorePicked !== null && (
              <p className="text-lg font-semibold text-[var(--color-ink-soft)]">
                You gave a score of <strong className="text-[var(--color-ink)]">{scorePicked}</strong>.
              </p>
            )}
            <p className="text-sm font-semibold text-[var(--color-ink-faint)] mt-4">Waiting for the next participant...</p>
          </div>
          <EmojiBar roomCode={session.roomCode || ''} sessionToken={session.token || ''} />
        </div>
      )}

      {/* footer */}
      <div className="w-full flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink-faint)] shrink-0">
        <span>{session.nickname}</span>
        <span className="tabular">Pitch Competition</span>
      </div>
    </div>
  );
};
