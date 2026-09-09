export type ThemeId = 'electric-midnight' | 'cyberpunk-arena' | 'neo-arcade' | 'executive-glass';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  inspiredBy: string;
  fontDisplay: string;
  fontSans: string;
  fontMono: string;
  badge: string;
  previewBg: string;
  colors: {
    canvas: string;
    card: string;
    cardBorder: string;
    primary: string;
    primaryBright: string;
    accent: string;
    glow: string;
    text: string;
    textMuted: string;
    ansA: { bg: string; border: string; glow: string };
    ansB: { bg: string; border: string; glow: string };
    ansC: { bg: string; border: string; glow: string };
    ansD: { bg: string; border: string; glow: string };
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'electric-midnight': {
    id: 'electric-midnight',
    name: 'Electric Midnight Broadcast',
    tagline: 'High-stakes live TV gameshow with volumetric stage lighting & metallic glass reflex',
    inspiredBy: 'HQ Trivia, The Game Awards, Apple Events',
    fontDisplay: "'Outfit', sans-serif",
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    badge: 'HQ Live Show',
    previewBg: 'from-[#0B0F19] via-[#111827] to-[#070A10]',
    colors: {
      canvas: '#0B0F19',
      card: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
      primary: '#8B5CF6',
      primaryBright: '#A78BFA',
      accent: '#EC4899',
      glow: 'rgba(139, 92, 246, 0.45)',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      ansA: { bg: 'linear-gradient(135deg, #EF4444, #B91C1C)', border: '#F87171', glow: 'rgba(239, 68, 68, 0.4)' },
      ansB: { bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', border: '#60A5FA', glow: 'rgba(59, 130, 246, 0.4)' },
      ansC: { bg: 'linear-gradient(135deg, #F59E0B, #B45309)', border: '#FBBF24', glow: 'rgba(245, 158, 11, 0.4)' },
      ansD: { bg: 'linear-gradient(135deg, #10B981, #047857)', border: '#34D399', glow: 'rgba(16, 185, 129, 0.4)' },
    },
  },

  'cyberpunk-arena': {
    id: 'cyberpunk-arena',
    name: 'Cyberpunk E-Sports Arena',
    tagline: 'Competitive tournament HUD with tactical gridlines, corner brackets & neon laser glows',
    inspiredBy: 'Valorant, Twitch Rivals, Gimkit Cyber',
    fontDisplay: "'Space Grotesk', sans-serif",
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    badge: 'Pro E-Sports HUD',
    previewBg: 'from-[#070B11] via-[#0D1520] to-[#05080E]',
    colors: {
      canvas: '#070B11',
      card: 'rgba(13, 21, 32, 0.9)',
      cardBorder: 'rgba(6, 182, 212, 0.25)',
      primary: '#06B6D4',
      primaryBright: '#22D3EE',
      accent: '#10B981',
      glow: 'rgba(6, 182, 212, 0.45)',
      text: '#F0FDFA',
      textMuted: '#64748B',
      ansA: { bg: 'linear-gradient(135deg, #E11D48, #9F1239)', border: '#FB7185', glow: 'rgba(225, 29, 72, 0.45)' },
      ansB: { bg: 'linear-gradient(135deg, #0284C7, #0369A1)', border: '#38BDF8', glow: 'rgba(2, 132, 199, 0.45)' },
      ansC: { bg: 'linear-gradient(135deg, #D97706, #92400E)', border: '#FBBF24', glow: 'rgba(217, 119, 6, 0.45)' },
      ansD: { bg: 'linear-gradient(135deg, #059669, #065F46)', border: '#34D399', glow: 'rgba(5, 150, 105, 0.45)' },
    },
  },

  'neo-arcade': {
    id: 'neo-arcade',
    name: 'Neo-Arcade Synthwave',
    tagline: 'Dimensional 80s cocktail lounge with 3D tactile arcade buttons & neon vapor mist',
    inspiredBy: 'Jackbox Games, Synthwave, Blooket High-Fi',
    fontDisplay: "'Syne', sans-serif",
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    badge: 'Arcade Lounge',
    previewBg: 'from-[#140A22] via-[#1E0F33] to-[#0D0517]',
    colors: {
      canvas: '#140A22',
      card: 'rgba(30, 15, 51, 0.85)',
      cardBorder: 'rgba(236, 72, 153, 0.3)',
      primary: '#EC4899',
      primaryBright: '#F472B6',
      accent: '#8B5CF6',
      glow: 'rgba(236, 72, 153, 0.45)',
      text: '#FDF2F8',
      textMuted: '#A78BFA',
      ansA: { bg: 'linear-gradient(135deg, #F43F5E, #BE123C)', border: '#FB7185', glow: 'rgba(244, 63, 94, 0.45)' },
      ansB: { bg: 'linear-gradient(135deg, #6366F1, #4338CA)', border: '#818CF8', glow: 'rgba(99, 102, 241, 0.45)' },
      ansC: { bg: 'linear-gradient(135deg, #FBBF24, #B45309)', border: '#FDE047', glow: 'rgba(251, 191, 36, 0.45)' },
      ansD: { bg: 'linear-gradient(135deg, #10B981, #047857)', border: '#6EE7B7', glow: 'rgba(16, 185, 129, 0.45)' },
    },
  },

  'executive-glass': {
    id: 'executive-glass',
    name: 'Executive Glass Minimalist',
    tagline: 'Ultra-prestigious keynote standard with frosted slate glass & crisp architectural lines',
    inspiredBy: 'Slido Pro, Mentimeter, Linear, Apple Keynote',
    fontDisplay: "'Plus Jakarta Sans', sans-serif",
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    badge: 'Executive Pro',
    previewBg: 'from-[#0A0D14] via-[#0F172A] to-[#07090E]',
    colors: {
      canvas: '#0A0D14',
      card: 'rgba(15, 23, 42, 0.75)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      primary: '#6366F1',
      primaryBright: '#818CF8',
      accent: '#06B6D4',
      glow: 'rgba(99, 102, 241, 0.35)',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      ansA: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', glow: 'rgba(239, 68, 68, 0.25)' },
      ansB: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', glow: 'rgba(59, 130, 246, 0.25)' },
      ansC: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', glow: 'rgba(245, 158, 11, 0.25)' },
      ansD: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', glow: 'rgba(16, 185, 129, 0.25)' },
    },
  },
};

export const getSavedTheme = (): ThemeId => {
  if (typeof window === 'undefined') return 'electric-midnight';
  const saved = localStorage.getItem('arena_active_theme') as ThemeId;
  return saved && THEMES[saved] ? saved : 'electric-midnight';
};

export const applyTheme = (themeId: ThemeId) => {
  const t = THEMES[themeId];
  if (!t || typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--font-display', t.fontDisplay);
  root.style.setProperty('--font-sans', t.fontSans);
  root.style.setProperty('--font-mono', t.fontMono);

  root.style.setProperty('--theme-canvas', t.colors.canvas);
  root.style.setProperty('--theme-card', t.colors.card);
  root.style.setProperty('--theme-border', t.colors.cardBorder);
  root.style.setProperty('--theme-primary', t.colors.primary);
  root.style.setProperty('--theme-primary-bright', t.colors.primaryBright);
  root.style.setProperty('--theme-accent', t.colors.accent);
  root.style.setProperty('--theme-glow', t.colors.glow);
  root.style.setProperty('--theme-text', t.colors.text);
  root.style.setProperty('--theme-text-muted', t.colors.textMuted);

  // Sync with legacy CSS variables to guarantee all existing pages look incredible
  root.style.setProperty('--color-paper', t.colors.canvas);
  root.style.setProperty('--color-paper-raised', t.colors.card);
  root.style.setProperty('--color-paper-sunk', t.colors.canvas);
  root.style.setProperty('--color-ink', t.colors.text);
  root.style.setProperty('--color-ink-soft', t.colors.textMuted);
  root.style.setProperty('--color-ink-faint', '#64748b');
  root.style.setProperty('--color-line', t.colors.cardBorder);

  root.style.setProperty('--color-void', t.colors.canvas);
  root.style.setProperty('--color-void-raised', t.colors.card);
  root.style.setProperty('--color-chalk', t.colors.text);
  root.style.setProperty('--color-chalk-soft', t.colors.textMuted);
  root.style.setProperty('--color-volt', t.colors.primary);
  root.style.setProperty('--color-volt-bright', t.colors.primaryBright);

  localStorage.setItem('arena_active_theme', themeId);
};
