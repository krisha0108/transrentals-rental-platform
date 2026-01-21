import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the module
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn().mockRejectedValue(new Error('DB not available')),
      findMany: vi.fn().mockRejectedValue(new Error('DB not available')),
      upsert: vi.fn().mockRejectedValue(new Error('DB not available')),
      update: vi.fn().mockRejectedValue(new Error('DB not available')),
      delete: vi.fn().mockRejectedValue(new Error('DB not available')),
      deleteMany: vi.fn().mockRejectedValue(new Error('DB not available')),
    },
  },
}));

// Import after mocking
import {
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  validateToken,
  refreshAccessToken,
  revokeToken,
  generateFingerprint,
} from '../token-manager';

describe('token-manager (memory fallback)', () => {
  describe('generateFingerprint', () => {
    it('should generate consistent fingerprint for same inputs', () => {
      const fp1 = generateFingerprint('Mozilla/5.0', '192.168.1.1');
      const fp2 = generateFingerprint('Mozilla/5.0', '192.168.1.1');

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different inputs', () => {
      const fp1 = generateFingerprint('Mozilla/5.0', '192.168.1.1');
      const fp2 = generateFingerprint('Chrome/100', '192.168.1.1');

      expect(fp1).not.toBe(fp2);
    });

    it('should handle undefined values', () => {
      const fp = generateFingerprint(undefined, undefined);
      expect(fp).toBeDefined();
      expect(typeof fp).toBe('string');
    });
  });

  describe('createAccessToken', () => {
    it('should create a valid access token', async () => {
      const result = await createAccessToken('customer123');

      expect(result.token).toBeDefined();
      expect(result.token).toContain('tr_');
      expect(result.token).toContain('customer123');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });

    it('should accept numeric customer ID', async () => {
      const result = await createAccessToken(456);

      expect(result.token).toContain('456');
    });

    it('should include fingerprint if provided', async () => {
      const fingerprint = generateFingerprint('TestAgent', '127.0.0.1');
      const result = await createAccessToken('customer789', fingerprint);

      // Verify token is created - fingerprint is stored internally
      expect(result.token).toBeDefined();
    });

    it('should set expiry 7 days in future', async () => {
      const before = Date.now();
      const result = await createAccessToken('customer-expiry');
      const after = Date.now();

      const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 7 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('createRefreshToken', () => {
    it('should create a valid refresh token', async () => {
      const result = await createRefreshToken('customer-refresh');

      expect(result.token).toBeDefined();
      expect(result.token).toContain('tr_refresh_');
      expect(result.expiresIn).toBe(30 * 24 * 60 * 60); // 30 days in seconds
    });

    it('should set expiry 30 days in future', async () => {
      const before = Date.now();
      const result = await createRefreshToken('customer-refresh-expiry');
      const after = Date.now();

      const expectedMin = before + 30 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 30 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('createTokenPair', () => {
    it('should create both access and refresh tokens', async () => {
      const result = await createTokenPair('customer-pair');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).toContain('tr_');
      expect(result.refreshToken).toContain('tr_refresh_');
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should have refresh token expire after access token', async () => {
      const result = await createTokenPair('customer-pair-expiry');

      expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThan(
        result.accessTokenExpiresAt.getTime()
      );
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const { token } = await createAccessToken('validate-test');

      const result = await validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.customerId).toBe('validate-test');
    });

    it('should reject invalid token format', async () => {
      const result = await validateToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token format');
    });

    it('should reject non-existent token', async () => {
      const result = await validateToken('tr_fake_token_12345');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token not found');
    });

    it('should reject empty token', async () => {
      const result = await validateToken('');

      expect(result.valid).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should create new access token from refresh token', async () => {
      const { refreshToken } = await createTokenPair('refresh-test');

      const result = await refreshAccessToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toContain('tr_');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should reject access token as refresh token', async () => {
      const { accessToken } = await createTokenPair('access-as-refresh');

      const result = await refreshAccessToken(accessToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid refresh token');
    });

    it('should reject invalid refresh token', async () => {
      const result = await refreshAccessToken('tr_refresh_invalid_123');

      expect(result.success).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should revoke existing token', async () => {
      const { token } = await createAccessToken('revoke-test');

      const revoked = await revokeToken(token);
      expect(revoked).toBe(true);

      const validation = await validateToken(token);
      expect(validation.valid).toBe(false);
    });

    it('should return true for non-existent token', async () => {
      const result = await revokeToken('tr_nonexistent_123');
      expect(result).toBe(true);
    });
  });

  describe('token uniqueness', () => {
    it('should generate unique tokens', async () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const { token } = await createAccessToken(`customer-${i}`);
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
    });
  });
});
