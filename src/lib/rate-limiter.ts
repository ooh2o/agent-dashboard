/**
 * Simple in-memory rate limiter for API endpoints
 *
 * Uses a sliding window algorithm to track request counts.
 * Note: In production, use Redis or similar for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequest > windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed in the window */
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param key Unique identifier for the rate limit bucket (e.g., IP address, user ID)
 * @param config Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const { windowMs, maxRequests } = config;
  const now = Date.now();

  // Clean up old entries occasionally
  cleanupStaleEntries(windowMs);

  const entry = rateLimitStore.get(key);

  // No existing entry - create new one
  if (!entry) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Check if window has expired
  if (now - entry.firstRequest >= windowMs) {
    // Reset the window
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Within window - check count
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.firstRequest + windowMs - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: entry.firstRequest + windowMs,
      retryAfter,
    };
  }

  // Increment count
  entry.count += 1;
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.firstRequest + windowMs,
  };
}

/**
 * Default rate limit configurations for different endpoints
 */
export const rateLimits = {
  /** Message sending: 10 messages per minute */
  messageSend: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  /** Message fetching: 60 requests per minute */
  messageFetch: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
} as const;

/**
 * Get client identifier from request for rate limiting
 * Uses X-Forwarded-For, X-Real-IP, or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - in production this should be handled differently
  return 'default-client';
}
