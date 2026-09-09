import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREDITS = [
  ['Kenney Game & UI Audio', 'CC0 Public Domain', 'Question ticks, answer locks, correct/wrong stings and fanfare — kenney.nl'],
  ['DiceBear Avatars', 'MIT', 'Deterministic procedural player avatars — dicebear.com'],
  ['Google Fonts — Fredoka & Nunito', 'OFL', 'Display face by Milena Brandao; body by Vernon Adams'],
  ['Lucide Icons & canvas-confetti', 'ISC', 'Crisp 2px icons and the podium confetti cannons'],
  ['React Bits', 'MIT', 'Aurora, SpotlightCard, ShinyText, StarBorder, DecryptedText, CountUp — reactbits.dev'],
  ['Framer Motion', 'MIT', 'Layout transitions, staggered reveals and rank-swap animation'],
];

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg rounded-[var(--radius-xl)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-paper-lift)]"
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 text-[var(--color-ink)]">
              <Heart className="w-5 h-5 text-[var(--color-bad)] fill-[var(--color-bad)]" />
              Open-source credits
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-paper-sunk)] text-[var(--color-ink-soft)] transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 flex flex-col gap-2.5 max-h-[65vh] overflow-y-auto">
            {CREDITS.map(([name, license, desc]) => (
              <div key={name} className="p-3 rounded-xl bg-[var(--color-paper-sunk)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-sm text-[var(--color-ink)]">{name}</span>
                  <span className="text-xs font-bold text-[var(--color-good)] shrink-0">{license}</span>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--color-line)] flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-xl btn-volt text-sm">Close</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
