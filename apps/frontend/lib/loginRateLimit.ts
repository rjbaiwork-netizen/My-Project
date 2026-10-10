type AttemptBucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_BUCKETS = 10_000;
const attempts = new Map<string, AttemptBucket>();

function clientKey(request: Request) {
  // Hosting platform should overwrite these forwarding headers at its trusted edge.
  const address = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  return address.slice(0, 128);
}

function prune(now: number) {
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(key);
  }
  while (attempts.size >= MAX_BUCKETS) {
    const oldest = attempts.keys().next().value as string | undefined;
    if (!oldest) break;
    attempts.delete(oldest);
  }
}

export function loginRateLimit(request: Request, now = Date.now()) {
  const key = clientKey(request);
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0, key };
  }
  if (bucket.count >= MAX_FAILURES) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)), key };
  }
  return { allowed: true, retryAfterSeconds: 0, key };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  prune(now);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
