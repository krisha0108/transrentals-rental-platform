/**
 * Error Monitoring Integration (Sentry)
 *
 * This module provides error monitoring and performance tracking for production.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Install Sentry packages:
 *    npm install @sentry/nextjs
 *
 * 2. Run Sentry wizard:
 *    npx @sentry/wizard@latest -i nextjs
 *
 * 3. Set environment variables:
 *    SENTRY_DSN=https://your-dsn@sentry.io/project-id
 *    SENTRY_ORG=your-org
 *    SENTRY_PROJECT=transrentals
 *    SENTRY_AUTH_TOKEN=your-auth-token
 *
 * 4. This file will be automatically used after Sentry is configured.
 */

import logger from './logger';

// Error severity levels
type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// User context for error tracking
interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  type?: 'customer' | 'vendor' | 'admin' | 'driver';
}

// Request context for errors
interface RequestContext {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}

// Sentry-like interface (works with or without Sentry installed)
interface ErrorMonitor {
  captureException: (error: Error, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, level?: ErrorSeverity) => string;
  setUser: (user: UserContext | null) => void;
  setTags: (tags: Record<string, string>) => void;
  addBreadcrumb: (breadcrumb: { category: string; message: string; level?: string }) => void;
  startTransaction: (name: string, op: string) => Transaction;
  flush: () => Promise<boolean>;
}

interface Transaction {
  setStatus: (status: string) => void;
  finish: () => void;
}

// Check if Sentry is available
let Sentry: any = null;

async function initSentry(): Promise<void> {
  try {
    Sentry = await import('@sentry/nextjs');
    console.info('[ErrorMonitoring] Sentry loaded successfully');
  } catch {
    console.warn('[ErrorMonitoring] Sentry not installed, using fallback logging');
  }
}

// Initialize on module load
initSentry();

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fallback error monitor when Sentry is not available
 */
const fallbackMonitor: ErrorMonitor = {
  captureException(error: Error, context?: Record<string, unknown>): string {
    const errorId = generateErrorId();
    logger.error(`[${errorId}] ${error.message}`, error, context);
    return errorId;
  },

  captureMessage(message: string, level: ErrorSeverity = 'info'): string {
    const errorId = generateErrorId();
    const logFn = level === 'error' || level === 'fatal' ? logger.error :
                  level === 'warning' ? logger.warn : logger.info;
    logFn(`[${errorId}] ${message}`);
    return errorId;
  },

  setUser(_user: UserContext | null): void {
    // No-op in fallback
  },

  setTags(_tags: Record<string, string>): void {
    // No-op in fallback
  },

  addBreadcrumb(breadcrumb: { category: string; message: string }): void {
    logger.debug(`[Breadcrumb:${breadcrumb.category}] ${breadcrumb.message}`);
  },

  startTransaction(name: string, _op: string): Transaction {
    const start = Date.now();
    return {
      setStatus(_status: string): void {},
      finish(): void {
        const duration = Date.now() - start;
        logger.debug(`[Transaction:${name}] Completed in ${duration}ms`);
      },
    };
  },

  async flush(): Promise<boolean> {
    return true;
  },
};

/**
 * Get the error monitor (Sentry or fallback)
 */
function getMonitor(): ErrorMonitor {
  if (Sentry) {
    return {
      captureException(error: Error, context?: Record<string, unknown>): string {
        const eventId = Sentry.captureException(error, {
          extra: context,
        });
        return eventId || generateErrorId();
      },

      captureMessage(message: string, level: ErrorSeverity = 'info'): string {
        const eventId = Sentry.captureMessage(message, level);
        return eventId || generateErrorId();
      },

      setUser(user: UserContext | null): void {
        Sentry.setUser(user);
      },

      setTags(tags: Record<string, string>): void {
        Object.entries(tags).forEach(([key, value]) => {
          Sentry.setTag(key, value);
        });
      },

      addBreadcrumb(breadcrumb: { category: string; message: string; level?: string }): void {
        Sentry.addBreadcrumb({
          category: breadcrumb.category,
          message: breadcrumb.message,
          level: breadcrumb.level || 'info',
        });
      },

      startTransaction(name: string, op: string): Transaction {
        const transaction = Sentry.startTransaction({ name, op });
        return {
          setStatus(status: string): void {
            transaction?.setStatus?.(status);
          },
          finish(): void {
            transaction?.finish?.();
          },
        };
      },

      async flush(): Promise<boolean> {
        try {
          await Sentry.flush(2000);
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  return fallbackMonitor;
}

// Export functions

/**
 * Capture an exception and send to monitoring
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): string {
  const err = error instanceof Error ? error : new Error(String(error));
  return getMonitor().captureException(err, context);
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level?: ErrorSeverity): string {
  return getMonitor().captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: UserContext | null): void {
  getMonitor().setUser(user);
}

/**
 * Set tags for categorizing errors
 */
export function setTags(tags: Record<string, string>): void {
  getMonitor().setTags(tags);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level?: string
): void {
  getMonitor().addBreadcrumb({ category, message, level });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): Transaction {
  return getMonitor().startTransaction(name, op);
}

/**
 * Flush pending events (use before process exit)
 */
export async function flush(): Promise<boolean> {
  return getMonitor().flush();
}

/**
 * Wrap an async function with error monitoring
 */
export function withErrorMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const transaction = startTransaction(name || fn.name || 'anonymous', 'function');

    try {
      const result = await fn(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('error');
      captureException(error as Error, { functionName: name || fn.name, args });
      throw error;
    } finally {
      transaction.finish();
    }
  }) as T;
}

/**
 * Report API error with request context
 */
export function reportApiError(
  error: Error | unknown,
  request: RequestContext,
  additionalContext?: Record<string, unknown>
): string {
  const err = error instanceof Error ? error : new Error(String(error));

  // Add breadcrumb for the API request
  addBreadcrumb('http', `${request.method} ${request.url}`, 'error');

  return captureException(err, {
    request: {
      method: request.method,
      url: request.url,
      headers: sanitizeHeaders(request.headers),
      query: request.query,
    },
    ...additionalContext,
  });
}

/**
 * Sanitize headers to remove sensitive data
 */
function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};

  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Export default object
const errorMonitoring = {
  captureException,
  captureMessage,
  setUser,
  setTags,
  addBreadcrumb,
  startTransaction,
  flush,
  withErrorMonitoring,
  reportApiError,
};

export default errorMonitoring;
