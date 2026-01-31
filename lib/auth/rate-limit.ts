import { headers } from 'next/headers';

type RateLimitTracker = {
  count: number;
  expiresAt: number;
};

const trackers = new Map<string, RateLimitTracker>();

/**
 * Prunes expired entries from the trackers map.
 * This is a simple cleanup strategy to prevent memory leaks.
 */
function pruneTrackers() {
  const now = Date.now();
  for (const [key, tracker] of trackers.entries()) {
    if (tracker.expiresAt < now) {
      trackers.delete(key);
    }
  }
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

export function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const tracker = trackers.get(key);

  if (!tracker || tracker.expiresAt < now) {
    trackers.set(key, { count: 1, expiresAt: now + windowMs });

    // Occasional cleanup to prevent memory growth
    // Only prune if map gets large to avoid overhead on every new key
    if (trackers.size > 5000) {
        setTimeout(pruneTrackers, 0); // Non-blocking cleanup
    }

    return true;
  }

  if (tracker.count >= limit) {
    return false;
  }

  tracker.count++;
  // We don't update expiresAt for Fixed Window
  return true;
}
