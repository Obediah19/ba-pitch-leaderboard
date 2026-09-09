// Per-socket sliding-window rate limiter, in-memory.
// ponytail: single-process only; back with Redis if you run multiple server instances.

interface Bucket {
  hits: number[];      // timestamps within window
  blockedUntil: number;
}

export class RateLimiter {
  private buckets: Map<string, Map<string, Bucket>> = new Map();

  /**
   * Returns true if the action is allowed, false if rate-limited.
   * @param socketId  caller identity
   * @param key       action name (e.g. "player:join")
   * @param max       max hits per window
   * @param windowMs  sliding window size
   * @param blockMs   cooldown applied once the window is exceeded (default 0 = no extra block)
   */
  allow(socketId: string, key: string, max: number, windowMs: number, blockMs = 0): boolean {
    const now = Date.now();
    let perSocket = this.buckets.get(socketId);
    if (!perSocket) {
      perSocket = new Map();
      this.buckets.set(socketId, perSocket);
    }
    let b = perSocket.get(key);
    if (!b) {
      b = { hits: [], blockedUntil: 0 };
      perSocket.set(key, b);
    }

    if (now < b.blockedUntil) return false;

    b.hits = b.hits.filter(t => now - t < windowMs);
    if (b.hits.length >= max) {
      if (blockMs > 0) b.blockedUntil = now + blockMs;
      return false;
    }
    b.hits.push(now);
    return true;
  }

  /** Drop all state for a disconnected socket. */
  clear(socketId: string): void {
    this.buckets.delete(socketId);
  }

  /** Count of tracked sockets — for health/metrics. */
  size(): number {
    return this.buckets.size;
  }
}

// --- self check: run `node dist/game/rateLimiter.js` ---
if (process.argv[1] && process.argv[1].endsWith('rateLimiter.js')) {
  const assert = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
  const rl = new RateLimiter();
  let allowed = 0;
  for (let i = 0; i < 5; i++) if (rl.allow('s1', 'k', 3, 1000)) allowed++;
  assert(allowed === 3, `allows exactly max (got ${allowed})`);
  assert(rl.allow('s2', 'k', 3, 1000), 'other socket unaffected');

  const rl2 = new RateLimiter();
  rl2.allow('s1', 'k', 1, 50, 200);        // consume
  assert(!rl2.allow('s1', 'k', 1, 50, 200), 'blocked after exceed');
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  (async () => {
    await wait(260);
    assert(rl2.allow('s1', 'k', 1, 50, 200), 'freed after blockMs');
    rl2.clear('s1');
    assert(rl2.size() === 0, 'clear removes socket');
    console.log('rateLimiter.ts self-check OK');
  })();
}
