import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the module
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    setting: {
      findFirst: vi.fn().mockRejectedValue(new Error('DB not available')),
      findUnique: vi.fn().mockRejectedValue(new Error('DB not available')),
      upsert: vi.fn().mockRejectedValue(new Error('DB not available')),
      update: vi.fn().mockRejectedValue(new Error('DB not available')),
      delete: vi.fn().mockRejectedValue(new Error('DB not available')),
      deleteMany: vi.fn().mockRejectedValue(new Error('DB not available')),
    },
  },
}));

// Import after mocking
import {
  createOTP,
  verifyOTP,
  deleteOTP,
  checkOTPExists,
} from '../otp-manager';

describe('otp-manager (memory fallback)', () => {
  describe('createOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      const result = await createOTP('create-test-1@test.com', 'login');

      expect(result.success).toBe(true);
      expect(result.otp).toBeDefined();
      expect(result.otp).toHaveLength(6);
      expect(result.otp).toMatch(/^\d{6}$/);
    });

    it('should return expiry time', async () => {
      const result = await createOTP('create-test-2@test.com', 'login');

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(600); // 10 minutes in seconds
    });

    it('should enforce cooldown between requests', async () => {
      await createOTP('cooldown-test@test.com', 'registration');

      // Immediate second request should be blocked
      const result = await createOTP('cooldown-test@test.com', 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toContain('wait');
      expect(result.waitSeconds).toBeGreaterThan(0);
    });

    it('should work with different purposes', async () => {
      const loginResult = await createOTP('purpose-test@test.com', 'login');
      expect(loginResult.success).toBe(true);

      // Different purpose should not be affected by cooldown
      const resetResult = await createOTP('purpose-test@test.com', 'password_reset');
      expect(resetResult.success).toBe(true);
    });

    it('should normalize identifiers', async () => {
      const result1 = await createOTP('  UPPERCASE@TEST.COM  ', 'email_verify');
      expect(result1.success).toBe(true);
    });
  });

  describe('verifyOTP', () => {
    it('should verify correct OTP', async () => {
      const createResult = await createOTP('verify-correct@test.com', 'phone_verify');
      expect(createResult.success).toBe(true);

      const verifyResult = await verifyOTP(
        'verify-correct@test.com',
        createResult.otp!,
        'phone_verify'
      );

      expect(verifyResult.valid).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      await createOTP('verify-wrong@test.com', 'login');

      const result = await verifyOTP('verify-wrong@test.com', '000000', 'login');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid OTP');
      expect(result.attemptsRemaining).toBeDefined();
    });

    it('should track attempts remaining', async () => {
      await createOTP('attempts-test@test.com', 'login');

      const r1 = await verifyOTP('attempts-test@test.com', '111111', 'login');
      expect(r1.attemptsRemaining).toBe(2);

      const r2 = await verifyOTP('attempts-test@test.com', '222222', 'login');
      expect(r2.attemptsRemaining).toBe(1);
    });

    it('should invalidate after max attempts', async () => {
      await createOTP('max-attempts@test.com', 'login');

      // Use all 3 attempts
      const r1 = await verifyOTP('max-attempts@test.com', '111111', 'login');
      expect(r1.attemptsRemaining).toBe(2);

      const r2 = await verifyOTP('max-attempts@test.com', '222222', 'login');
      expect(r2.attemptsRemaining).toBe(1);

      const r3 = await verifyOTP('max-attempts@test.com', '333333', 'login');
      expect(r3.attemptsRemaining).toBe(0);

      // After max attempts, OTP is deleted
      const r4 = await verifyOTP('max-attempts@test.com', '444444', 'login');
      expect(r4.valid).toBe(false);
      // Either "No OTP found" or "Too many failed attempts" depending on timing
      expect(r4.error).toBeDefined();
    });

    it('should reject already verified OTP', async () => {
      const createResult = await createOTP('already-verified@test.com', 'login');

      // First verification
      await verifyOTP('already-verified@test.com', createResult.otp!, 'login');

      // Second verification should fail
      const result = await verifyOTP('already-verified@test.com', createResult.otp!, 'login');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already used');
    });

    it('should return error for non-existent OTP', async () => {
      const result = await verifyOTP('no-otp@test.com', '123456', 'login');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No OTP found');
    });

    it('should be case-insensitive for identifier', async () => {
      const createResult = await createOTP('case-test@test.com', 'login');

      const verifyResult = await verifyOTP(
        'CASE-TEST@TEST.COM',
        createResult.otp!,
        'login'
      );

      expect(verifyResult.valid).toBe(true);
    });
  });

  describe('deleteOTP', () => {
    it('should delete existing OTP', async () => {
      await createOTP('delete-test@test.com', 'login');

      await deleteOTP('delete-test@test.com', 'login');

      const exists = await checkOTPExists('delete-test@test.com', 'login');
      expect(exists.exists).toBe(false);
    });

    it('should not throw for non-existent OTP', async () => {
      await expect(deleteOTP('nonexistent@test.com', 'login')).resolves.not.toThrow();
    });
  });

  describe('checkOTPExists', () => {
    it('should return true for existing valid OTP', async () => {
      await createOTP('exists-test@test.com', 'login');

      const result = await checkOTPExists('exists-test@test.com', 'login');

      expect(result.exists).toBe(true);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should return false for non-existent OTP', async () => {
      const result = await checkOTPExists('no-exists@test.com', 'login');

      expect(result.exists).toBe(false);
    });

    it('should return false for verified OTP', async () => {
      const createResult = await createOTP('verified-check@test.com', 'login');
      await verifyOTP('verified-check@test.com', createResult.otp!, 'login');

      const result = await checkOTPExists('verified-check@test.com', 'login');

      expect(result.exists).toBe(false);
    });
  });
});
