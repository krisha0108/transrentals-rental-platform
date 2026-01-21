import { describe, it, expect } from 'vitest';
import {
  checkRateLimit,
  checkIdentifierRateLimit,
  RATE_LIMITS,
} from '../rate-limiter';

// Create a proper mock of NextRequest with Headers
function createMockRequest(ip = '127.0.0.1', userAgent = 'test-agent'): any {
  return {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return ip;
        if (name === 'x-real-ip') return ip;
        if (name === 'user-agent') return userAgent;
        return null;
      },
    },
    ip: undefined,
  };
}

describe('rate-limiter', () => {
  describe('RATE_LIMITS', () => {
    it('should have auth rate limit configured', () => {
      expect(RATE_LIMITS.auth).toBeDefined();
      expect(RATE_LIMITS.auth.interval).toBe(15 * 60 * 1000);
      expect(RATE_LIMITS.auth.maxRequests).toBe(5);
    });

    it('should have login rate limit configured', () => {
      expect(RATE_LIMITS.login).toBeDefined();
      expect(RATE_LIMITS.login.interval).toBe(15 * 60 * 1000);
      expect(RATE_LIMITS.login.maxRequests).toBe(10);
    });

    it('should have OTP rate limit configured', () => {
      expect(RATE_LIMITS.otp).toBeDefined();
      expect(RATE_LIMITS.otp.interval).toBe(60 * 1000);
      expect(RATE_LIMITS.otp.maxRequests).toBe(3);
    });

    it('should have booking rate limit configured', () => {
      expect(RATE_LIMITS.booking).toBeDefined();
      expect(RATE_LIMITS.booking.interval).toBe(60 * 1000);
      expect(RATE_LIMITS.booking.maxRequests).toBe(10);
    });

    it('should have contact rate limit configured', () => {
      expect(RATE_LIMITS.contact).toBeDefined();
      expect(RATE_LIMITS.contact.maxRequests).toBe(5);
    });

    it('should have upload rate limit configured', () => {
      expect(RATE_LIMITS.upload).toBeDefined();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests under limit', () => {
      // Use unique IP for each test to avoid state pollution
      const request = createMockRequest('10.0.1.1');
      const config = { interval: 60000, maxRequests: 5 };

      const result = checkRateLimit(request, config, 'unique-test-1');

      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(4);
    });

    it('should track remaining requests', () => {
      const request = createMockRequest('10.0.1.2');
      const config = { interval: 60000, maxRequests: 3 };

      const r1 = checkRateLimit(request, config, 'unique-test-2');
      const r2 = checkRateLimit(request, config, 'unique-test-2');
      const r3 = checkRateLimit(request, config, 'unique-test-2');

      expect(r1.remaining).toBe(2);
      expect(r2.remaining).toBe(1);
      expect(r3.remaining).toBe(0);
    });

    it('should block requests over limit', () => {
      const request = createMockRequest('10.0.1.3');
      const config = { interval: 60000, maxRequests: 2 };

      checkRateLimit(request, config, 'unique-test-3');
      checkRateLimit(request, config, 'unique-test-3');
      const result = checkRateLimit(request, config, 'unique-test-3');

      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should include reset time when limited', () => {
      const request = createMockRequest('10.0.1.4');
      const config = { interval: 60000, maxRequests: 1 };

      checkRateLimit(request, config, 'unique-test-4');
      const result = checkRateLimit(request, config, 'unique-test-4');

      expect(result.limited).toBe(true);
      expect(result.resetIn).toBeGreaterThan(0);
      // resetIn is in seconds, should be within reasonable range
      expect(result.resetIn).toBeLessThanOrEqual(180);
    });

    it('should use different keys for different endpoints', () => {
      const request = createMockRequest('10.0.1.5');
      const config = { interval: 60000, maxRequests: 1 };

      const r1 = checkRateLimit(request, config, 'unique-endpoint-a');
      const r2 = checkRateLimit(request, config, 'unique-endpoint-b');

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
    });

    it('should use different keys for different IPs', () => {
      const request1 = createMockRequest('10.0.1.6');
      const request2 = createMockRequest('10.0.1.7');
      const config = { interval: 60000, maxRequests: 1 };

      const r1 = checkRateLimit(request1, config, 'same-endpoint');
      const r2 = checkRateLimit(request2, config, 'same-endpoint');

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
    });
  });

  describe('checkIdentifierRateLimit', () => {
    it('should rate limit by identifier', () => {
      const config = { interval: 60000, maxRequests: 2 };

      const r1 = checkIdentifierRateLimit('rate-test-1@example.com', config, 'login');
      const r2 = checkIdentifierRateLimit('rate-test-1@example.com', config, 'login');
      const r3 = checkIdentifierRateLimit('rate-test-1@example.com', config, 'login');

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
      expect(r3.limited).toBe(true);
    });

    it('should separate rate limits per identifier', () => {
      const config = { interval: 60000, maxRequests: 1 };

      const r1 = checkIdentifierRateLimit('rate-test-2@example.com', config, 'test');
      const r2 = checkIdentifierRateLimit('rate-test-3@example.com', config, 'test');

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
    });

    it('should separate rate limits per action', () => {
      const config = { interval: 60000, maxRequests: 1 };

      const r1 = checkIdentifierRateLimit('rate-test-4@example.com', config, 'action-a');
      const r2 = checkIdentifierRateLimit('rate-test-4@example.com', config, 'action-b');

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
    });

    it('should return correct remaining count', () => {
      const config = { interval: 60000, maxRequests: 5 };

      const r1 = checkIdentifierRateLimit('rate-test-5@example.com', config, 'count');
      const r2 = checkIdentifierRateLimit('rate-test-5@example.com', config, 'count');

      expect(r1.remaining).toBe(4);
      expect(r2.remaining).toBe(3);
    });

    it('should return reset time', () => {
      const config = { interval: 30000, maxRequests: 2 };

      const result = checkIdentifierRateLimit('rate-test-6@example.com', config, 'reset');

      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(30);
    });
  });
});
