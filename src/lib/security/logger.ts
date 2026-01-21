/**
 * Production Logger
 *
 * Environment-aware logging utility that:
 * - Disables verbose logging in production
 * - Provides structured logging format
 * - Supports log levels
 * - Can be integrated with external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeContext: boolean;
  prettyPrint: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development' || (!isProduction && !isTest);

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  enabled: !isTest,
  minLevel: isProduction ? 'warn' : 'debug',
  includeTimestamp: true,
  includeContext: true,
  prettyPrint: isDevelopment,
};

let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 */
export function configureLogger(options: Partial<LoggerConfig>): void {
  config = { ...config, ...options };
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Format a log entry
 */
function formatEntry(entry: LogEntry): string {
  if (config.prettyPrint) {
    const parts: string[] = [];

    if (config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);

    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    parts.push(entry.message);

    let output = parts.join(' ');

    if (config.includeContext && entry.context) {
      output += '\n  Context: ' + JSON.stringify(entry.context, null, 2).split('\n').join('\n  ');
    }

    if (entry.error) {
      output += '\n  Error: ' + entry.error.message;
      if (entry.error.stack) {
        output += '\n  Stack: ' + entry.error.stack.split('\n').slice(1, 5).join('\n  ');
      }
    }

    return output;
  }

  // JSON format for production (better for log aggregation)
  return JSON.stringify({
    ...entry,
    error: entry.error ? {
      message: entry.error.message,
      name: entry.error.name,
      stack: entry.error.stack,
    } : undefined,
  });
}

/**
 * Create a log entry
 */
function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
    requestId: (global as Record<string, unknown>).__requestId as string | undefined,
  };
}

/**
 * Output a log entry
 */
function output(entry: LogEntry): void {
  const formatted = formatEntry(entry);

  switch (entry.level) {
    case 'debug':
    case 'info':
      // In production, these are suppressed by minLevel
      if (isDevelopment) {
        console.log(formatted);
      }
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
    case 'fatal':
      console.error(formatted);
      break;
  }

  // Hook for external logging services
  if (entry.level === 'error' || entry.level === 'fatal') {
    // TODO: Send to Sentry, LogRocket, etc.
    // captureException(entry);
  }
}

/**
 * Debug level logging - only in development
 */
export function debug(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('debug')) return;
  output(createEntry('debug', message, context));
}

/**
 * Info level logging - suppressed in production
 */
export function info(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('info')) return;
  output(createEntry('info', message, context));
}

/**
 * Warning level logging
 */
export function warn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('warn')) return;
  output(createEntry('warn', message, context));
}

/**
 * Error level logging
 */
export function error(message: string, err?: Error | unknown, context?: Record<string, unknown>): void {
  if (!shouldLog('error')) return;

  const errorObj = err instanceof Error ? err : err ? new Error(String(err)) : undefined;
  output(createEntry('error', message, context, errorObj));
}

/**
 * Fatal level logging - always logs, used for critical errors
 */
export function fatal(message: string, err?: Error | unknown, context?: Record<string, unknown>): void {
  // Fatal always logs regardless of config
  const errorObj = err instanceof Error ? err : err ? new Error(String(err)) : undefined;
  output(createEntry('fatal', message, context, errorObj));
}

/**
 * Log API request
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  if (!shouldLog(level)) return;

  output(createEntry(level, `${method} ${path} ${statusCode} ${duration}ms`, context));
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: Record<string, unknown>
): void {
  const level: LogLevel = severity === 'critical' ? 'fatal'
    : severity === 'high' ? 'error'
    : severity === 'medium' ? 'warn'
    : 'info';

  output(createEntry(level, `[SECURITY] ${event}`, { ...context, severity }));
}

/**
 * Log database query (only in development)
 */
export function logQuery(
  query: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  if (!isDevelopment) return;
  debug(`[DB] ${query.substring(0, 100)}... (${duration}ms)`, context);
}

/**
 * Create a child logger with preset context
 */
export function createLogger(defaultContext: Record<string, unknown>) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      warn(message, { ...defaultContext, ...context }),
    error: (message: string, err?: Error | unknown, context?: Record<string, unknown>) =>
      error(message, err, { ...defaultContext, ...context }),
    fatal: (message: string, err?: Error | unknown, context?: Record<string, unknown>) =>
      fatal(message, err, { ...defaultContext, ...context }),
  };
}

/**
 * Set request ID for the current request context
 */
export function setRequestId(requestId: string): void {
  (global as Record<string, unknown>).__requestId = requestId;
}

/**
 * Clear request ID after request completes
 */
export function clearRequestId(): void {
  delete (global as Record<string, unknown>).__requestId;
}

/**
 * Wrap a function with automatic error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result.catch((err) => {
          error('Async function error', err, context);
          throw err;
        });
      }

      return result;
    } catch (err) {
      error('Function error', err, context);
      throw err;
    }
  }) as T;
}

// Export default logger object
const logger = {
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
  configure: configureLogger,
  withErrorLogging,
};

export default logger;
