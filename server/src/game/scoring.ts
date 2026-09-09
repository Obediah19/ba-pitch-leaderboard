import { STREAK_BONUS_STEP, MAX_STREAK_BONUS } from '../config.js';

export interface ScoreResult {
  isCorrect: boolean;
  basePoints: number;
  streakBonus: number;
  totalPointsAwarded: number;
  newStreak: number;
  answerTimeMs: number;
}

/**
 * Kahoot speed score formula:
 * points = round((1 - (responseTime / (timeLimit * 2))) * maxPoints)
 * - Answered at 0ms: full 1000 pts
 * - Answered at half time: 750 pts
 * - Answered at final second: ~500 pts
 * - Incorrect or expired: 0 pts
 */
export function calculateScore(
  isCorrect: boolean,
  answerTimeMs: number,
  timeLimitSec: number,
  questionMaxPoints: number,
  currentStreak: number,
  isPoll: boolean = false
): ScoreResult {
  if (isPoll) {
    return {
      isCorrect: true,
      basePoints: 0,
      streakBonus: 0,
      totalPointsAwarded: 0,
      newStreak: currentStreak,
      answerTimeMs
    };
  }

  if (!isCorrect) {
    return {
      isCorrect: false,
      basePoints: 0,
      streakBonus: 0,
      totalPointsAwarded: 0,
      newStreak: 0,
      answerTimeMs
    };
  }

  const timeLimitMs = timeLimitSec * 1000;
  const clampedTime = Math.max(0, Math.min(answerTimeMs, timeLimitMs));
  
  // Speed factor between 0.5 and 1.0
  const speedFactor = Math.max(0.5, 1 - (clampedTime / (timeLimitMs * 2)));
  const basePoints = Math.round(questionMaxPoints * speedFactor);

  // Consecutive streak bonus
  const newStreak = currentStreak + 1;
  const streakBonus = newStreak > 1 ? Math.min((newStreak - 1) * STREAK_BONUS_STEP, MAX_STREAK_BONUS) : 0;
  const totalPointsAwarded = basePoints + streakBonus;

  return {
    isCorrect: true,
    basePoints,
    streakBonus,
    totalPointsAwarded,
    newStreak,
    answerTimeMs
  };
}

/**
 * Calculates rank deltas: positive for climbers (▲2), negative for droppers (▼1), 0 for unchanged
 */
export function computeRankDeltas(
  players: Array<{ playerId: string; totalScore: number; previousRank: number }>
): Map<string, { currentRank: number; rankDelta: number }> {
  // Sort descending by score
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const result = new Map<string, { currentRank: number; rankDelta: number }>();

  sorted.forEach((player, index) => {
    const currentRank = index + 1;
    // If previousRank was 0 or unassigned, delta is 0
    const rankDelta = player.previousRank > 0 ? player.previousRank - currentRank : 0;
    result.set(player.playerId, { currentRank, rankDelta });
  });

  return result;
}
