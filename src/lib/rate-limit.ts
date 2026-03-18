const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

// Each user has an array of submission timestamps
const store = new Map<string, number[]>();

/**
 * Sliding window rate limiter.
 * Tracks individual submission timestamps. Each submission expires
 * independently after 2 hours, so the user always has a rolling
 * window of 5 submissions.
 */
export function checkRateLimit(
  userName: string,
  now = Date.now()
): {
  allowed: boolean;
  retryAfterMinutes?: number;
} {
  const timestamps = store.get(userName) ?? [];

  // Remove expired timestamps (older than 2 hours)
  const active = timestamps.filter((t) => now - t < WINDOW_MS);

  if (active.length < MAX_SUBMISSIONS) {
    active.push(now);
    store.set(userName, active);
    return { allowed: true };
  }

  // Rate limited — tell user when the oldest active submission expires
  const oldest = active[0];
  const retryAfterMs = oldest + WINDOW_MS - now;
  const retryAfterMinutes = Math.ceil(retryAfterMs / 60000);
  return { allowed: false, retryAfterMinutes };
}

/**
 * Reset the store — for testing only.
 */
export function _resetRateLimitStore() {
  store.clear();
}
