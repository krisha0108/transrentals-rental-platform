/**
 * Security Module
 *
 * Centralized exports for all security utilities.
 * Import from '@/lib/security' for convenient access.
 */

// Rate Limiting
export {
  checkRateLimit,
  withRateLimit,
  checkIdentifierRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
  default as rateLimiter,
} from './rate-limiter';

// Account Lockout
export {
  isAccountLocked,
  recordFailedAttempt,
  recordSuccessfulLogin,
  unlockAccount,
  getLockoutStatus,
  checkLoginAllowed,
  recordFailedLogin,
  clearLockoutOnSuccess,
  default as accountLockout,
} from './account-lockout';

// OTP Management
export {
  createOTP,
  verifyOTP,
  deleteOTP,
  checkOTPExists,
  cleanupExpiredOTPs,
  default as otpManager,
} from './otp-manager';

// Token Management
export {
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  validateToken,
  refreshAccessToken,
  revokeToken,
  revokeAllCustomerTokens,
  getCustomerSessions,
  cleanupExpiredTokens,
  extendTokenExpiry,
  generateFingerprint,
  default as tokenManager,
} from './token-manager';

// Logger
export {
  debug,
  info,
  warn,
  error,
  fatal,
  logRequest,
  logSecurityEvent,
  logQuery,
  createLogger,
  setRequestId,
  clearRequestId,
  configureLogger,
  withErrorLogging,
  default as logger,
} from './logger';

// Environment Validation
export {
  validateEnv,
  isProduction,
  requireEnv,
  getEnv,
  logEnvStatus,
} from './env-validation';

// Security Headers
export {
  SECURITY_HEADERS,
  CSP_PRODUCTION,
  CSP_DEVELOPMENT,
  addSecurityHeaders,
  secureResponse,
} from './headers';

// Input Sanitization
export {
  escapeHtml,
  stripHtml,
  escapeSqlLike,
  sanitizePhone,
  sanitizeEmail,
  sanitizeName,
  sanitizeUrl,
  sanitizeObject,
  sanitizeFormData,
} from './sanitize';

// File Validation
export {
  validateFile,
  validateImage,
  validateDocument,
  validateVendorDocument,
  sanitizeFileName,
  detectFileType,
  getFileExtension,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  type FileValidationResult,
  type FileValidationOptions,
} from './file-validation';

// Antivirus Scanning (ClamAV)
export {
  scanBuffer,
  scanFile,
  isClamAVAvailable,
  getClamAVVersion,
  requireCleanFile,
  checkClamAVStatus,
  type ScanResult,
} from './antivirus';

/**
 * Security middleware helper for API routes
 *
 * Usage:
 * ```typescript
 * import { withSecurity } from '@/lib/security';
 *
 * export const POST = withSecurity(
 *   async (request) => {
 *     // Your handler
 *   },
 *   { rateLimit: 'auth', requireAuth: true }
 * );
 * ```
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './rate-limiter';
import { checkLoginAllowed } from './account-lockout';
import { validateToken, generateFingerprint } from './token-manager';
import { setRequestId, clearRequestId, logRequest, logSecurityEvent } from './logger';

type RateLimitType = keyof typeof RATE_LIMITS;

interface SecurityOptions {
  rateLimit?: RateLimitType | false;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  logRequests?: boolean;
}

export function withSecurity(
  handler: (request: NextRequest, context?: { customerId?: string }) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setRequestId(requestId);

    try {
      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitConfig = RATE_LIMITS[options.rateLimit || 'api'];
        const { limited, remaining, resetIn } = checkRateLimit(
          request,
          rateLimitConfig,
          request.nextUrl.pathname
        );

        if (limited) {
          logSecurityEvent('Rate limit exceeded', 'medium', {
            path: request.nextUrl.pathname,
            ip: request.headers.get('x-forwarded-for'),
          });

          return NextResponse.json(
            { error: 'Too many requests', retryAfter: resetIn },
            {
              status: 429,
              headers: {
                'Retry-After': String(resetIn),
                'X-RateLimit-Remaining': String(remaining),
                'X-Request-Id': requestId,
              },
            }
          );
        }
      }

      // Authentication check
      let customerId: string | undefined;
      if (options.requireAuth) {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
          );
        }

        const fingerprint = generateFingerprint(
          request.headers.get('user-agent') || undefined,
          request.headers.get('x-forwarded-for') || undefined
        );

        const validation = await validateToken(token, fingerprint);

        if (!validation.valid) {
          if (validation.expired) {
            return NextResponse.json(
              { error: 'Token expired', code: 'TOKEN_EXPIRED' },
              { status: 401, headers: { 'X-Request-Id': requestId } }
            );
          }
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
          );
        }

        customerId = validation.customerId;
      }

      // Execute handler
      const response = await handler(request, { customerId });

      // Add request ID header
      response.headers.set('X-Request-Id', requestId);

      // Log request
      if (options.logRequests !== false) {
        const duration = Date.now() - startTime;
        logRequest(
          request.method,
          request.nextUrl.pathname,
          response.status,
          duration,
          { requestId }
        );
      }

      return response;
    } catch (err) {
      const duration = Date.now() - startTime;
      logSecurityEvent('Request error', 'high', {
        path: request.nextUrl.pathname,
        error: err instanceof Error ? err.message : String(err),
        duration,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    } finally {
      clearRequestId();
    }
  };
}
