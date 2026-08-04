/**
 * Rate Limiter for API Routes
 *
 * Production-grade rate limiting to prevent brute force attacks,
 * DDoS, and API abuse.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - 60 * 60 * 1000; // Remove entries older than 1 hour

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.firstRequest < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Predefined rate limit configurations for different endpoint types
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Strict limits for authentication endpoints
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },

  // Login endpoints - slightly more lenient
  login: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
  },

  // OTP requests
  otp: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 OTPs per minute
  },

  // Password reset
  passwordReset: {
    interval: 60 * 1000, // 1 minute (relaxed for testing)
    maxRequests: 20, // 20 reset requests per minute (relaxed for testing)
  },

  // General API endpoints
  api: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },

  // Booking creation
  booking: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 bookings per minute
  },

  // Contact form
  contact: {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 submissions per hour
  },

  // File uploads
  upload: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },

  // Analytics tracking (more lenient)
  analytics: {
    interval: 1000, // 1 second
    maxRequests: 20, // 20 events per second
  },

  // Help-bot chat endpoints (public-facing, hits a paid external LLM API)
  helpBot: {
    interval: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 messages per 5 minutes
  },
} as const;

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use the first IP from forwarded-for, or fall back to other headers
  let ip = forwardedFor?.split(',')[0]?.trim()
    || realIp
    || cfConnectingIp
    || 'unknown';

  // Include user agent for additional fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Hash to avoid storing raw IPs
  return `${ip}:${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  endpoint?: string
): { limited: boolean; remaining: number; resetIn: number } {
  cleanup();

  const clientId = getClientIdentifier(request);
  const key = endpoint ? `${clientId}:${endpoint}` : clientId;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
    return {
      limited: true,
      remaining: 0,
      resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  // No existing entry or window expired
  if (!entry || now - entry.firstRequest > config.interval) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      blocked: false,
    });
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.interval / 1000),
    };
  }

  // Within window, increment count
  entry.count++;

  if (entry.count > config.maxRequests) {
    // Block for the remainder of the window plus penalty
    const penalty = Math.min(entry.count - config.maxRequests, 5) * 60 * 1000; // Up to 5 min penalty
    entry.blocked = true;
    entry.blockedUntil = entry.firstRequest + config.interval + penalty;

    return {
      limited: true,
      remaining: 0,
      resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.firstRequest + config.interval - now) / 1000),
  };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse,
  config: RateLimitConfig = RATE_LIMITS.api,
  endpoint?: string
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const { limited, remaining, resetIn } = checkRateLimit(request, config, endpoint);

    if (limited) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetIn),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetIn),
          },
        }
      );
    }

    const response = await handler(request, ...args);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetIn));

    return response;
  };
}

/**
 * Rate limiter for specific identifiers (e.g., email, phone)
 * Useful for OTP and password reset endpoints
 */
export function checkIdentifierRateLimit(
  identifier: string,
  config: RateLimitConfig,
  action: string
): { limited: boolean; remaining: number; resetIn: number } {
  cleanup();

  const key = `identifier:${action}:${hashString(identifier)}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstRequest > config.interval) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      blocked: false,
    });
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.interval / 1000),
    };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = entry.firstRequest + config.interval;

    return {
      limited: true,
      remaining: 0,
      resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.firstRequest + config.interval - now) / 1000),
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(request: NextRequest, endpoint?: string): void {
  const clientId = getClientIdentifier(request);
  const key = endpoint ? `${clientId}:${endpoint}` : clientId;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig,
  endpoint?: string
): { remaining: number; resetIn: number } {
  const clientId = getClientIdentifier(request);
  const key = endpoint ? `${clientId}:${endpoint}` : clientId;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstRequest > config.interval) {
    return {
      remaining: config.maxRequests,
      resetIn: Math.ceil(config.interval / 1000),
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetIn: Math.ceil((entry.firstRequest + config.interval - now) / 1000),
  };
}

export default {
  checkRateLimit,
  withRateLimit,
  checkIdentifierRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
};
