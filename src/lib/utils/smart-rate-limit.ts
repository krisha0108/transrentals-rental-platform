/**
 * Smart Rate Limiting - Customer Friendly
 *
 * Key Features:
 * 1. Higher limits for legitimate use (10-20 bookings/hour)
 * 2. Detects bot patterns (same data repeated)
 * 3. Progressive slowdown instead of hard blocking
 * 4. Different limits for different user types
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate limiters for different scenarios
 */
export const rateLimiters = {
  // Guest users - Generous limit for normal customers
  guestBooking: new RateLimiterMemory({
    points: 10,        // 10 bookings
    duration: 3600,    // per hour
    blockDuration: 0,  // Don't block, just slow down
  }),

  // Authenticated users - Even higher limit
  authenticatedBooking: new RateLimiterMemory({
    points: 20,        // 20 bookings
    duration: 3600,    // per hour
    blockDuration: 0,
  }),

  // Bot detection - Same data pattern
  duplicateDetection: new RateLimiterMemory({
    points: 3,         // Only 3 identical requests
    duration: 300,     // per 5 minutes
    blockDuration: 600, // Block for 10 minutes if bot detected
  }),

  // General API - Very generous
  generalAPI: new RateLimiterMemory({
    points: 100,       // 100 requests
    duration: 60,      // per minute
    blockDuration: 0,
  }),
};

/**
 * Get client identifier (IP + User Agent for better tracking)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Combine IP and user agent for better uniqueness
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Create hash of booking data to detect duplicates
 */
export function hashBookingData(data: any): string {
  const key = `${data.customerPhone}-${data.carCategoryName || data.vehicleName}-${data.pickupDate}-${data.returnDate || data.dropDate}-${data.tripType}-${data.dropCity || ''}`;
  return key;
}

/**
 * Smart rate limiting with customer-friendly approach
 */
export async function smartRateLimit(
  identifier: string,
  isAuthenticated: boolean = false,
  bookingData?: any
): Promise<{
  allowed: boolean;
  error?: string;
  remaining?: number;
  requiresCaptcha?: boolean;
}> {
  try {
    // Choose appropriate limiter based on authentication
    const limiter = isAuthenticated
      ? rateLimiters.authenticatedBooking
      : rateLimiters.guestBooking;

    const maxPoints = isAuthenticated ? 20 : 10;

    // Try to consume a point
    const result = await limiter.consume(identifier, 1);

    // Calculate remaining attempts
    const remaining = maxPoints - result.consumedPoints;

    // If low on points, suggest CAPTCHA (but don't block)
    if (remaining <= 3 && remaining > 0) {
      return {
        allowed: true,
        remaining,
        requiresCaptcha: true, // Frontend can show CAPTCHA
      };
    }

    // If out of points, suggest waiting
    if (remaining <= 0) {
      const resetTime = Math.ceil((result.msBeforeNext || 0) / 1000 / 60);
      return {
        allowed: false,
        error: `You've created many bookings recently. Please try again in ${resetTime} minutes or verify you're human with CAPTCHA.`,
        remaining: 0,
        requiresCaptcha: true,
      };
    }

    return {
      allowed: true,
      remaining,
    };

  } catch (error) {
    // If limiter throws, it means rate exceeded
    return {
      allowed: false,
      error: 'Too many booking attempts. Please wait a few minutes and try again.',
      requiresCaptcha: true,
    };
  }
}

/**
 * Detect bot/spam by checking for duplicate booking data
 */
export async function detectDuplicate(
  bookingHash: string
): Promise<{
  isDuplicate: boolean;
  error?: string;
}> {
  try {
    await rateLimiters.duplicateDetection.consume(bookingHash);
    return { isDuplicate: false };
  } catch (error) {
    return {
      isDuplicate: true,
      error: 'Duplicate booking detected. You already created this exact booking recently. If this is not a mistake, please wait 10 minutes.',
    };
  }
}

/**
 * General API rate limiting (very lenient)
 */
export async function generalRateLimit(
  identifier: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    await rateLimiters.generalAPI.consume(identifier);
    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      error: 'Too many requests. Please slow down.',
    };
  }
}

/**
 * Get rate limit info without consuming
 */
export async function getRateLimitInfo(
  identifier: string,
  isAuthenticated: boolean = false
): Promise<{
  remaining: number;
  total: number;
  resetIn: number; // seconds
}> {
  const limiter = isAuthenticated
    ? rateLimiters.authenticatedBooking
    : rateLimiters.guestBooking;

  const total = isAuthenticated ? 20 : 10;

  try {
    const result = await limiter.get(identifier);

    if (!result) {
      return {
        remaining: total,
        total,
        resetIn: 0,
      };
    }

    return {
      remaining: Math.max(0, total - (result.consumedPoints || 0)),
      total,
      resetIn: Math.ceil((result.msBeforeNext || 0) / 1000),
    };
  } catch {
    return {
      remaining: total,
      total,
      resetIn: 0,
    };
  }
}
