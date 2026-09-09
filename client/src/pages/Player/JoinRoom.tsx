import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.js';
import { getAvatarDataUri, getRandomAvatarSeed } from '../../services/avatar.js';
import { sound } from '../../services/audio.js';
import { RefreshCw, Eye } from 'lucide-react';

export const JoinRoom: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { socket, saveSession } = useSocket();

  const seed = (c?: string) => {
    const clean = (c || '').toUpperCase().slice(0, 6).split('');
    while (clean.length < 6) clean.push('');
    return clean;
  };

  const [boxes, setBoxes] = useState<string[]>(() => seed(code));
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(getRandomAvatarSeed());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (code) setBoxes(seed(code)); }, [code]);

  useEffect(() => {
    if (!socket) return;
    const onJoined = (d: any) => {
      setLoading(false);
      saveSession(d.sessionToken, d.roomCode, d.nickname, d.avatar);
      sound.playJoin();
      navigate('/player/lobby');
    };
    const onError = (d: { message: string }) => {
      setLoading(false);
      setError(d.message || 'Could not join');
      sound.playWrong();
    };
    socket.on('player:joined', onJoined);
    socket.on('room:error', onError);
    return () => {
      socket.off('player:joined', onJoined);
      socket.off('room:error', onError);
    };
  }, [socket, navigate, saveSession]);

  const setBox = (i: number, val: string) => {
    const up = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const next = [...boxes];
    if (up.length > 1) {
      const chars = up.slice(0, 6).split('');
      for (let k = 0; k < 6; k++) next[k] = chars[k] || '';
      setBoxes(next);
      inputs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }
    next[i] = up;
    setBoxes(next);
    setError('');
    if (up && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !boxes[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const reroll = () => { setAvatarSeed(getRandomAvatarSeed()); sound.playTick(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = boxes.join('').trim().toUpperCase();
    const nick = nickname.trim();
    if (full.length < 6) return setError('Enter all 6 characters of the room code');
    if (!nick) return setError('Pick a nickname');
    if (!socket) return setError('Still connecting — try again in a moment');
    setLoading(true);
    setError('');
    socket.emit('player:join', { roomCode: full, nickname: nick, avatar: avatarSeed });
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-sm card-paper p-6 sm:p-8 flex flex-col items-center"
      >
        <div className="flex flex-col items-center text-center gap-1 mb-6">
          <span className="text-3xl">🎯</span>
          <h1 className="text-xl font-display font-extrabold text-[var(--color-ink)]">Business Turnaround Challenge</h1>
          <span className="text-[10px] font-bold text-[var(--color-volt-bright)] uppercase tracking-wider">
            E-Summit • Organized by Magefficie & Entrepreneurial Symposium
          </span>
        </div>

        <form onSubmit={submit} className="w-full flex flex-col items-center gap-5">
          <div className="w-full flex flex-col items-center gap-2">
            <label className="eyebrow text-[var(--color-ink-soft)]">Room code</label>
            <div className="flex items-center justify-center gap-2">
              {boxes.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  maxLength={i === 0 ? 6 : 1}
                  value={v}
                  onChange={(e) => setBox(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  className={`w-11 h-14 text-center text-xl font-mono font-bold uppercase rounded-xl border transition
                    ${v ? 'border-[var(--color-volt)] bg-[var(--color-volt)]/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]' : 'border-white/10 bg-white/[0.04] text-[var(--color-ink)]'}
                    focus:border-[var(--color-volt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-volt)]/30`}
                />
              ))}
            </div>
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="eyebrow text-[var(--color-ink-soft)] text-center">Nickname</label>
            <input
              type="text"
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your name on the board…"
              className="field w-full text-center text-base font-semibold py-3 px-4 placeholder:text-[var(--color-ink-faint)]"
            />
            <p className="flex items-center justify-center gap-1 text-[11px] text-[var(--color-ink-faint)] mt-0.5">
              <Eye className="w-3 h-3" /> Everyone in the room can see your nickname.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 my-1">
            <button
              type="button"
              onClick={reroll}
              className="relative w-24 h-24 rounded-full bg-[rgba(139,92,246,0.08)] border-2 border-[rgba(139,92,246,0.25)] grid place-items-center overflow-hidden hover:border-[var(--color-volt)] transition active:rotate-[-20deg]"
              title="Reroll avatar"
            >
              <img src={getAvatarDataUri(avatarSeed)} alt="Your avatar" className="w-20 h-20" />
            </button>
            <button type="button" onClick={reroll}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-volt)] hover:text-[var(--color-volt-deep)] transition">
              <RefreshCw className="w-3.5 h-3.5" /> Tap to reroll
            </button>
          </div>

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-[rgba(239,68,68,0.08)] text-[var(--color-bad)] text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-volt w-full py-4 text-base">
            {loading ? 'Joining…' : 'JOIN ROOM'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
