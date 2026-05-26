/**
 * Simple in-memory rate limiter.
 * Note: this resets on redeploy and is per-instance only.
 * For multi-instance deployments, use Upstash Redis instead.
 */

const requests = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  requests.forEach((value, key) => {
    if (now > value.resetAt) {
      requests.delete(key);
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}
