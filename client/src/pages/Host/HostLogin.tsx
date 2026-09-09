import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { SpotlightCard } from '../../components/ReactBits/SpotlightCard.js';
import { Lock, Mail, Key, ShieldCheck, LogIn } from 'lucide-react';

export const HostLogin: React.FC = () => {
  const { login, quickHostLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/host/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await quickHostLogin();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login with default admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <SpotlightCard className="p-8 flex flex-col gap-6 !bg-[var(--color-paper-raised)] !border-[var(--color-line)] shadow-2xl">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-volt)]/10 text-[var(--color-volt)] flex items-center justify-center mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold">Admin Portal Access</h1>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
              Authorized event host authentication only.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arena.edu"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--color-line)] text-sm font-semibold focus:outline-none focus:border-[var(--color-volt)] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--color-line)] text-sm font-semibold focus:outline-none focus:border-[var(--color-volt)] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-volt w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" /> {loading ? 'Authenticating...' : 'Sign In as Host'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[var(--color-line)]"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-faint)]">OR</span>
            <div className="flex-grow border-t border-[var(--color-line)]"></div>
          </div>

          <button
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white/5 border border-[var(--color-line)] hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--color-volt)]" /> Demo Admin Quick Access
          </button>
        </SpotlightCard>
      </motion.div>
    </div>
  );
};
