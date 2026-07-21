import "server-only";

/**
 * In-memory sliding-window rate limiter, scoped to a single server process.
 * Sufficient for a single-instance deployment; a multi-instance deployment
 * would need a shared store (e.g. Redis) instead.
 */
const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}
