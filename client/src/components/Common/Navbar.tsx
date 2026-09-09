import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { sound } from '../../services/audio.js';
import { CreditsModal } from './CreditsModal.js';
import { ShinyText } from '../ReactBits/ShinyText.js';
import { Volume2, VolumeX, LogIn, LogOut, LayoutDashboard, Info } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickHostLogin } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMuted, setIsMuted] = useState(sound.isSoundMuted());
  const [showCredits, setShowCredits] = useState(false);

  // Hidden on full-focus screens.
  const hidden =
    location.pathname.startsWith('/player/') ||
    location.pathname.startsWith('/join') ||
    location.pathname.startsWith('/host/lobby') ||
    location.pathname.startsWith('/host/game');
  if (hidden) return null;

  const toggleMute = () => setIsMuted(sound.toggleMute());
  const quickHost = async () => {
    try {
      await quickHostLogin();
      navigate('/host/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="w-full border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl">🎯</span>
            <ShinyText text="ARENA" tone="light" className="text-2xl tracking-tight" speed={4} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-paper-sunk)] text-xs font-bold text-[var(--color-ink-soft)]">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--color-good)]' : 'bg-[var(--color-warn)]'}`} />
              {connected ? 'Ready' : 'Connecting'}
            </div>

            <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-xl text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-sunk)] transition">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button onClick={() => setShowCredits(true)} title="Credits"
              className="p-2 rounded-xl text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-sunk)] transition">
              <Info className="w-4 h-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/host/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-volt text-sm font-bold">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Host Dashboard</span>
                </Link>
                <button onClick={logout} title="Log out"
                  className="p-2 rounded-xl text-[var(--color-ink-soft)] hover:text-[var(--color-bad)] hover:bg-[var(--color-paper-sunk)] transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/host/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-volt text-sm font-bold">
                <LogIn className="w-4 h-4" />
                <span>Host Portal</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <CreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />
    </>
  );
};
