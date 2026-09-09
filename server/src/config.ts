import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'arena_super_secret_college_event_key_2026';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Comma-separated allowlist of origins for REST + socket CORS.
// Falls back to localhost dev ports. Set CORS_ORIGINS in production.
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || `${CLIENT_URL},http://localhost:5173,http://localhost:3001`)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Demo mode enables the hardcoded quick-host login (admin@arena.edu).
// ponytail: fine for a fest kiosk; set DEMO_MODE=false in a real deployment and require real login.
export const DEMO_MODE = process.env.DEMO_MODE !== 'false';

// Scoring parameters
export const DEFAULT_QUESTION_TIME_LIMIT = 20; // seconds
export const DEFAULT_BASE_POINTS = 1000;
export const STREAK_BONUS_STEP = 100;
export const MAX_STREAK_BONUS = 500;

// Capacity limits (single process; ponytail: move to Redis-backed counters if multi-instance)
export const MAX_PLAYERS_PER_ROOM = process.env.MAX_PLAYERS_PER_ROOM
  ? parseInt(process.env.MAX_PLAYERS_PER_ROOM, 10)
  : 300;
export const MAX_ROOMS = process.env.MAX_ROOMS ? parseInt(process.env.MAX_ROOMS, 10) : 200;
export const MAX_ROOMS_PER_HOST_SOCKET = 3;

// Nickname length cap (also enforced client-side)
export const MAX_NICKNAME_LEN = 18;
export const MAX_AVATAR_SEED_LEN = 40;

// Emoji reactions
export const ALLOWED_REACTIONS = ['😂', '🔥', '😮', '❤️', '👏', '🎯', '😭', '🤯'] as const;
export const REACTION_MIN_INTERVAL_MS = 600;   // per player, hard floor between reactions
export const REACTION_BURST_MAX = 8;            // per player per 5s window
export const REACTION_BURST_WINDOW_MS = 5000;
export const REACTION_BATCH_FLUSH_MS = 400;     // coalesce fan-out for large rooms
export const REACTION_BATCH_ROOM_THRESHOLD = 100; // players above which reactions are batched

// Emoji storm: one emoji dominating a rolling window triggers a room-wide moment
export const STORM_WINDOW_MS = 3000;
export const STORM_MIN_PLAYERS = 4;
export const STORM_DOMINANCE = 0.5;   // fraction of connected players sending the same emoji
export const STORM_COOLDOWN_MS = 8000;

// Live answer-tally fan-out throttle (per room)
export const TALLY_THROTTLE_MS = 200; // max 5 emits/sec

// Idle room garbage collection
export const ROOM_GC_INTERVAL_MS = 60_000;
export const ROOM_EMPTY_LOBBY_TTL_MS = 10 * 60_000;   // empty LOBBY room lifetime
export const ROOM_INACTIVITY_TTL_MS = 60 * 60_000;    // any room with no activity

// Socket payload hard cap (tiny JSON only) — blunts payload-bomb attempts
export const SOCKET_MAX_BUFFER_BYTES = 4096;

// Generic per-socket event rate limits: [maxEvents, windowMs, blockMs]
export const RATE_LIMITS: Record<string, [number, number, number]> = {
  'player:join': [5, 10_000, 20_000],
  'player:submit_answer': [6, 2_000, 4_000],
  'player:reconnect': [5, 30_000, 30_000],
  'room:sync_request': [4, 5_000, 5_000],
  'host:create_room': [4, 10_000, 20_000],
};

// Unknown/unhandled event flood → disconnect
export const UNKNOWN_EVENT_LIMIT = 30;
export const UNKNOWN_EVENT_WINDOW_MS = 10_000;
