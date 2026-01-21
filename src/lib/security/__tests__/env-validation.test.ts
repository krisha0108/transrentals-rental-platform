import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnv,
  isProduction,
  requireEnv,
  getEnv,
} from '../env-validation';

describe('env-validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should report missing required vars', () => {
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;

      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.missing.some(m => m.includes('DATABASE_URL'))).toBe(true);
    });

    it('should pass when all required vars are set', () => {
      process.env.DATABASE_URL = 'mysql://test';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should report optional vars as warnings', () => {
      process.env.DATABASE_URL = 'mysql://test';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      delete process.env.GOOGLE_CLIENT_ID;

      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('GOOGLE_CLIENT_ID'))).toBe(true);
    });

    it('should throw when throwOnError is true and vars missing', () => {
      delete process.env.DATABASE_URL;

      expect(() => validateEnv(true)).toThrow('Missing required environment variables');
    });

    it('should not throw when throwOnError is true and all vars present', () => {
      process.env.DATABASE_URL = 'mysql://test';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      expect(() => validateEnv(true)).not.toThrow();
    });

    it('should treat empty string as missing', () => {
      process.env.DATABASE_URL = '';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.missing.some(m => m.includes('DATABASE_URL'))).toBe(true);
    });

    it('should treat whitespace-only string as missing', () => {
      process.env.DATABASE_URL = '   ';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const result = validateEnv();

      expect(result.valid).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is undefined', () => {
      // @ts-expect-error - Test environment mocking
      delete process.env.NODE_ENV;
      expect(isProduction()).toBe(false);
    });
  });

  describe('requireEnv', () => {
    it('should return value when env var exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(requireEnv('TEST_VAR')).toBe('test-value');
    });

    it('should throw when env var is missing', () => {
      delete process.env.MISSING_VAR;
      expect(() => requireEnv('MISSING_VAR')).toThrow(
        'Missing required environment variable: MISSING_VAR'
      );
    });

    it('should throw when env var is empty string', () => {
      process.env.EMPTY_VAR = '';
      expect(() => requireEnv('EMPTY_VAR')).toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return value when env var exists', () => {
      process.env.EXISTING_VAR = 'existing-value';
      expect(getEnv('EXISTING_VAR', 'default')).toBe('existing-value');
    });

    it('should return default when env var is missing', () => {
      delete process.env.MISSING_VAR;
      expect(getEnv('MISSING_VAR', 'default-value')).toBe('default-value');
    });

    it('should return default when env var is empty', () => {
      process.env.EMPTY_VAR = '';
      expect(getEnv('EMPTY_VAR', 'default')).toBe('default');
    });
  });
});
