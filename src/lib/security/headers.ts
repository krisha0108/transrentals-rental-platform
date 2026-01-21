/**
 * Security Headers Configuration
 *
 * Adds security headers to responses to protect against common attacks.
 */

import { NextResponse } from 'next/server';

/**
 * Security headers to add to all responses
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy - don't leak full URL to external sites
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy - restrict browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',

  // Force HTTPS in production (only set if configured)
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Content Security Policy for production
 * More restrictive to prevent XSS and injection attacks
 */
export const CSP_PRODUCTION = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self' https://www.google-analytics.com https://api.razorpay.com https://*.razorpay.com https://accounts.google.com wss: ws:",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

/**
 * Content Security Policy for development
 * More permissive to allow hot reload and dev tools
 */
export const CSP_DEVELOPMENT = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self' ws: wss: http: https: https://accounts.google.com",
  "frame-src 'self' https: https://accounts.google.com",
  "frame-ancestors 'self'",
].join('; ');

/**
 * Add security headers to a NextResponse
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP based on environment
  const csp = process.env.NODE_ENV === 'production' ? CSP_PRODUCTION : CSP_DEVELOPMENT;
  response.headers.set('Content-Security-Policy', csp);

  // Add HSTS in production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

/**
 * Create a new response with security headers
 */
export function secureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init);
  return addSecurityHeaders(response);
}
