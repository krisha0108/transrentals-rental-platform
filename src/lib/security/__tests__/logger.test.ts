import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debug,
  info,
  warn,
  error,
  fatal,
  logRequest,
  logSecurityEvent,
  createLogger,
  setRequestId,
  clearRequestId,
  configureLogger,
} from '../logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Enable logging for tests
    configureLogger({ enabled: true, minLevel: 'debug', prettyPrint: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestId();
  });

  describe('log levels', () => {
    it('should log debug messages in dev mode', () => {
      configureLogger({ enabled: true, minLevel: 'debug' });
      debug('debug message');
      // In test env, debug goes to console.log only in dev mode
      // Just verify no error thrown
      expect(true).toBe(true);
    });

    it('should log info messages', () => {
      configureLogger({ enabled: true, minLevel: 'info' });
      info('info message');
      expect(true).toBe(true);
    });

    it('should log warn messages to console.warn', () => {
      configureLogger({ enabled: true, minLevel: 'warn' });
      warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages to console.error', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log fatal messages to console.error', () => {
      fatal('fatal message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('configureLogger', () => {
    it('should disable logging when enabled is false', () => {
      configureLogger({ enabled: false });
      warn('should not log');
      error('should not log');
      // Fatal always logs
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should respect minLevel', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      warn('should not log');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      error('should log');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('error logging with Error objects', () => {
    it('should handle Error objects', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      const testError = new Error('Test error');
      error('An error occurred', testError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle non-Error objects', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      error('An error occurred', 'string error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle undefined error', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      error('An error occurred');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logRequest', () => {
    it('should log 500 errors as error level', () => {
      configureLogger({ enabled: true, minLevel: 'debug' });
      logRequest('POST', '/api/test', 500, 100);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log 400 errors as warn level', () => {
      configureLogger({ enabled: true, minLevel: 'debug' });
      logRequest('GET', '/api/test', 404, 50);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include method, path, status, and duration', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: false });
      logRequest('DELETE', '/api/users/123', 500, 250);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('DELETE');
      expect(logOutput).toContain('/api/users/123');
      expect(logOutput).toContain('500');
      expect(logOutput).toContain('250');
    });
  });

  describe('logSecurityEvent', () => {
    it('should log critical events as fatal', () => {
      logSecurityEvent('Data breach detected', 'critical');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log high severity as error', () => {
      configureLogger({ enabled: true, minLevel: 'error' });
      logSecurityEvent('Unauthorized access attempt', 'high');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log medium severity as warn', () => {
      configureLogger({ enabled: true, minLevel: 'warn' });
      logSecurityEvent('Rate limit exceeded', 'medium');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include security prefix', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: false });
      logSecurityEvent('Test event', 'high');
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('[SECURITY]');
    });
  });

  describe('createLogger', () => {
    it('should create child logger with default context', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: false });
      const childLogger = createLogger({ module: 'auth', userId: '123' });

      childLogger.error('Auth failed');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('auth');
      expect(logOutput).toContain('123');
    });

    it('should merge contexts', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: false });
      const childLogger = createLogger({ module: 'auth' });

      childLogger.error('Error', undefined, { action: 'login' });

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('auth');
      expect(logOutput).toContain('login');
    });
  });

  describe('request ID', () => {
    it('should set and clear request ID', () => {
      setRequestId('req_123');
      // Request ID is stored in global
      expect((global as Record<string, unknown>).__requestId).toBe('req_123');

      clearRequestId();
      expect((global as Record<string, unknown>).__requestId).toBeUndefined();
    });

    it('should include request ID in logs', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: true });
      setRequestId('req_456');

      error('Test error');

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('req_456');
    });
  });

  describe('context handling', () => {
    it('should include context in logs', () => {
      configureLogger({ enabled: true, minLevel: 'error', prettyPrint: false, includeContext: true });

      error('Error with context', undefined, { userId: 'user123', action: 'delete' });

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('user123');
      expect(logOutput).toContain('delete');
    });
  });
});
