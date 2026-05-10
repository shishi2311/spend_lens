/**
 * IP-based rate limiting via Upstash Redis. Falls back to a permissive
 * always-allow if Upstash isn't configured (local dev) — production should
 * always have it set so the limiter actually limits.
 *
 * Configured: 5 audits per 10 minutes per IP, sliding window.
 */

import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

let _limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (_limiter) return _limiter;
  const url = env.upstashUrl;
  const token = env.upstashToken;
  if (!url || !token) return null;

  _limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: false,
    prefix: "spendlens:audit",
  });
  return _limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Unix ms when the window resets. */
  reset: number;
}

export async function checkAuditRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter();
  if (!limiter) {
    // No Upstash configured. Allow but warn — production deployments should
    // set UPSTASH_REDIS_REST_URL/_TOKEN.
    if (process.env.NODE_ENV === "production") {
      console.warn("[ratelimit] Upstash not configured in production — limiter disabled");
    }
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(ip);
  return { success, remaining, reset };
}

/** Best-effort client IP extraction from common proxy headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
