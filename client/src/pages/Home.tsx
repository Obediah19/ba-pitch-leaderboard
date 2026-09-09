import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.js';
import { Squares } from '../components/ReactBits/Squares.js';
import { BlurText } from '../components/ReactBits/BlurText.js';
import { Play, ArrowRight, Users, Zap, Trophy, ShieldCheck, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, quickHostLogin } = useAuth();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim().toUpperCase();
    if (clean.length < 4) {
      setError('Enter the 6-character room code from the screen');
      return;
    }
    navigate(`/join/${clean}`);
  };

  const handleHost = () => {
    if (user) {
      navigate('/host/dashboard');
    } else {
      navigate('/host/login');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-6 py-12 sm:py-20 overflow-hidden select-none">
      {/* Subtle Interactive Ambient Squares Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={52}
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(99, 102, 241, 0.12)"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Left — Thesis & Executive Statement */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--color-volt)]/15 border border-[var(--color-volt)]/30 text-xs font-bold text-[var(--color-volt-bright)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Live Audience Quiz Arena</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-[var(--color-ink)]">
            Play the room,<br />
            <span className="gradient-text">not the slides.</span>
          </h1>

          <p className="text-[var(--color-ink-soft)] text-base sm:text-lg max-w-lg leading-relaxed font-normal">
            Real-time interactive quiz tournaments engineered for college events, conferences, and keynotes. Host seamlessly on the big screen while everyone plays from their phone.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-[var(--color-ink-soft)] font-medium">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-volt-bright)]" />
              <span>300+ live players</span>
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-ans-c)]" />
              <span>Speed-ranked scoring</span>
            </span>
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--color-good)]" />
              <span>Live dynamic podium</span>
            </span>
          </div>
        </motion.div>

        {/* Right — The Executive Join Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-paper p-7 sm:p-9 flex flex-col gap-6 backdrop-blur-2xl border border-white/10 shadow-2xl relative"
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--color-volt-bright)]">
              Enter Tournament
            </span>
            <h2 className="text-xl font-bold font-display text-[var(--color-ink)]">
              Join Live Session
            </h2>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="relative flex flex-col items-center">
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={6}
                placeholder="7X9K2P"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.toUpperCase());
                  setError('');
                }}
                className="field w-full text-center font-mono font-bold text-3xl tracking-[0.35em] uppercase py-4 px-4 tabular text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]/50 focus:border-[var(--color-volt)]"
              />
            </div>

            {error && (
              <p className="text-[var(--color-bad)] text-xs font-semibold text-center animate-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2 font-bold tracking-wide rounded-xl shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" /> JOIN TOURNAMENT
            </button>
          </form>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-white/10" />
            <span className="eyebrow text-[var(--color-ink-faint)] text-[10px]">or organize</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleHost}
            className="btn-ghost w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
          >
            Host a Quiz Session <ArrowRight className="w-4 h-4 text-[var(--color-ink-soft)]" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
