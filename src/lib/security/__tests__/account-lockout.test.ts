import { describe, it, expect, beforeEach } from 'vitest';
import {
  isAccountLocked,
  recordFailedAttempt,
  recordSuccessfulLogin,
  unlockAccount,
  getLockoutStatus,
  checkLoginAllowed,
  recordFailedLogin,
  clearLockoutOnSuccess,
} from '../account-lockout';

describe('account-lockout', () => {
  // Use unique identifiers for each test to avoid state pollution

  describe('isAccountLocked', () => {
    it('should return not locked for new accounts', () => {
      const result = isAccountLocked('new-user-1@test.com');
      expect(result.locked).toBe(false);
      expect(result.failedAttempts).toBe(0);
    });

    it('should return failed attempts count', () => {
      recordFailedAttempt('failed-1@test.com');
      recordFailedAttempt('failed-1@test.com');

      const result = isAccountLocked('failed-1@test.com');
      expect(result.locked).toBe(false);
      expect(result.failedAttempts).toBe(2);
    });

    it('should work with different identifier types', () => {
      recordFailedAttempt('test-ip-1', 'ip');
      const result = isAccountLocked('test-ip-1', 'ip');
      expect(result.failedAttempts).toBe(1);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should track first failed attempt', () => {
      const result = recordFailedAttempt('first-fail@test.com');
      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(4); // 5 max - 1 = 4
    });

    it('should decrement attempts remaining', () => {
      recordFailedAttempt('multi-fail@test.com');
      const result = recordFailedAttempt('multi-fail@test.com');
      expect(result.attemptsRemaining).toBe(3);
    });

    it('should lock account after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('lock-test@test.com');
      }
      const result = isAccountLocked('lock-test@test.com');
      expect(result.locked).toBe(true);
      expect(result.unlockIn).toBeGreaterThan(0);
    });

    it('should return unlock time when locked', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('unlock-time@test.com');
      }
      const result = recordFailedAttempt('unlock-time@test.com');
      expect(result.locked).toBe(true);
      expect(result.unlockIn).toBeGreaterThan(0);
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should clear failed attempts', () => {
      recordFailedAttempt('success-test@test.com');
      recordFailedAttempt('success-test@test.com');

      recordSuccessfulLogin('success-test@test.com');

      const result = isAccountLocked('success-test@test.com');
      expect(result.failedAttempts).toBe(0);
      expect(result.locked).toBe(false);
    });

    it('should unlock a locked account', () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('unlock-success@test.com');
      }
      expect(isAccountLocked('unlock-success@test.com').locked).toBe(true);

      // Successful login should clear it
      recordSuccessfulLogin('unlock-success@test.com');

      const result = isAccountLocked('unlock-success@test.com');
      expect(result.locked).toBe(false);
      expect(result.failedAttempts).toBe(0);
    });
  });

  describe('unlockAccount', () => {
    it('should unlock a locked account', () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('admin-unlock@test.com');
      }
      expect(isAccountLocked('admin-unlock@test.com').locked).toBe(true);

      // Admin unlock
      const unlocked = unlockAccount('admin-unlock@test.com');
      expect(unlocked).toBe(true);

      const result = isAccountLocked('admin-unlock@test.com');
      expect(result.locked).toBe(false);
    });

    it('should return false for non-existent account', () => {
      const result = unlockAccount('nonexistent@test.com');
      expect(result).toBe(false);
    });
  });

  describe('getLockoutStatus', () => {
    it('should return full status for new account', () => {
      const status = getLockoutStatus('status-new@test.com');
      expect(status.failedAttempts).toBe(0);
      expect(status.locked).toBe(false);
      expect(status.lockCount).toBe(0);
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should return lock count after multiple lockouts', () => {
      // First lockout
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('multi-lock@test.com');
      }

      const status = getLockoutStatus('multi-lock@test.com');
      expect(status.lockCount).toBe(1);
      expect(status.locked).toBe(true);
    });
  });

  describe('checkLoginAllowed', () => {
    it('should allow login for new user', () => {
      const result = checkLoginAllowed('allowed-user@test.com', '192.168.1.100');
      expect(result.allowed).toBe(true);
      expect(result.attemptsRemaining).toBe(5);
    });

    it('should block locked account', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('blocked-user@test.com');
      }

      const result = checkLoginAllowed('blocked-user@test.com', '192.168.1.101');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Account temporarily locked');
      expect(result.unlockIn).toBeGreaterThan(0);
    });

    it('should block by IP', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('192.168.100.1', 'ip');
      }

      const result = checkLoginAllowed('any-user@test.com', '192.168.100.1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('location');
    });
  });

  describe('recordFailedLogin', () => {
    it('should record for both email and IP', () => {
      recordFailedLogin('dual-track@test.com', '192.168.200.1');

      const emailStatus = getLockoutStatus('dual-track@test.com', 'email');
      const ipStatus = getLockoutStatus('192.168.200.1', 'ip');

      expect(emailStatus.failedAttempts).toBe(1);
      expect(ipStatus.failedAttempts).toBe(1);
    });

    it('should return minimum attempts remaining', () => {
      // Pre-fail the IP a few times
      recordFailedAttempt('192.168.201.1', 'ip');
      recordFailedAttempt('192.168.201.1', 'ip');

      const result = recordFailedLogin('fresh-user@test.com', '192.168.201.1');

      // IP has 2 attempts (now 3), email has 0 (now 1)
      // IP remaining = 5 - 3 = 2, Email remaining = 5 - 1 = 4
      expect(result.attemptsRemaining).toBe(2);
    });
  });

  describe('clearLockoutOnSuccess', () => {
    it('should clear both email and IP', () => {
      recordFailedAttempt('clear-dual@test.com');
      recordFailedAttempt('192.168.202.1', 'ip');

      clearLockoutOnSuccess('clear-dual@test.com', '192.168.202.1');

      expect(isAccountLocked('clear-dual@test.com').failedAttempts).toBe(0);
      expect(isAccountLocked('192.168.202.1', 'ip').failedAttempts).toBe(0);
    });
  });
});
