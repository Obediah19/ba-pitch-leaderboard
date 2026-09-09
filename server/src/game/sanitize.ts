import { MAX_NICKNAME_LEN, MAX_AVATAR_SEED_LEN } from '../config.js';

// Small blocklist — not exhaustive, just keeps the worst off a projector.
// ponytail: swap for a maintained list (e.g. `bad-words`) if moderation becomes a real need.
const BLOCKED = [
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'rape', 'rapist', 'kys',
  'cunt', 'whore', 'slut', 'pedophile', 'pedo', 'nazi', 'hitler', 'coon',
  'chink', 'spic', 'kike', 'tranny', 'dyke',
];

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

/** Clean a user nickname. Returns a safe, non-empty display name (falls back to "Player"). */
export function sanitizeNickname(raw: unknown): string {
  if (typeof raw !== 'string') return 'Player';
  const s = raw
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NICKNAME_LEN);

  if (!s) return 'Player';

  const lower = s.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some(w => lower.includes(w))) return 'Player';

  return s;
}

/** Clean an avatar seed. Alphanumeric/_/- only; falls back to a random seed. */
export function sanitizeAvatarSeed(raw: unknown): string {
  if (typeof raw !== 'string') return randomSeed();
  const s = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, MAX_AVATAR_SEED_LEN);
  return s || randomSeed();
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Validate a room code shape. Returns the normalized code or null. */
export function normalizeRoomCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.toUpperCase().trim();
  return /^[A-Z0-9]{6}$/.test(s) ? s : null;
}

/** Non-negative integer within [0, max]. */
export function safeIndex(raw: unknown, max: number): number | null {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > max) return null;
  return raw;
}

/** Session token: UUID-ish string, bounded length. */
export function safeToken(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  return s.length >= 8 && s.length <= 64 && /^[A-Za-z0-9-]+$/.test(s) ? s : null;
}

// --- self check: run `node dist/game/sanitize.js` ---
if (process.argv[1] && process.argv[1].endsWith('sanitize.js')) {
  const assert = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
  assert(sanitizeNickname('  hi there  ') === 'hi there', 'trim + collapse');
  assert(sanitizeNickname('ab' + String.fromCharCode(0x200b) + 'c') === 'abc', 'control + zero-width stripped');
  assert(sanitizeNickname('') === 'Player', 'empty -> Player');
  assert(sanitizeNickname('x'.repeat(50)).length === MAX_NICKNAME_LEN, 'length cap');
  assert(sanitizeNickname('a<b>c') === 'abc', 'angle brackets stripped');
  assert(sanitizeNickname('you retard') === 'Player', 'blocklist');
  assert(sanitizeAvatarSeed('a!b@c#') === 'abc', 'seed filter');
  assert(sanitizeAvatarSeed(123 as unknown).length >= 6, 'seed fallback');
  assert(normalizeRoomCode('abc123') === 'ABC123', 'room code upper');
  assert(normalizeRoomCode('abc12') === null, 'room code short');
  assert(safeIndex(3, 3) === 3 && safeIndex(4, 3) === null && safeIndex(-1, 3) === null, 'safeIndex bounds');
  assert(safeToken('a'.repeat(36)) !== null && safeToken('short') === null, 'token bounds');
  console.log('sanitize.ts self-check OK');
}
