// Brute-force guard for the credentials login. Sliding-window counter
// per key (email + IP), kept in memory: correct for single-instance
// deploys; a multi-instance SaaS must replace this with a shared store
// (Redis/Upstash) behind the same take() interface.
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hits = new Map<string, number[]>();

export function takeLoginAttempt(key: string, max = MAX_ATTEMPTS): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
