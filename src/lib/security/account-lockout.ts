/**
 * Account Lockout System
 *
 * Prevents brute force attacks by temporarily locking accounts
 * after multiple failed login attempts.
 */

interface LockoutEntry {
  failedAttempts: number;
  firstFailedAt: number;
  lastFailedAt: number;
  lockedUntil?: number;
  lockCount: number; // Number of times account has been locked
}

// In-memory store (use Redis in production for multi-instance deployments)
const lockoutStore = new Map<string, LockoutEntry>();

// Configuration
const CONFIG = {
  maxFailedAttempts: 5, // Lock after 5 failed attempts
  lockoutDuration: 15 * 60 * 1000, // 15 minutes base lockout
  attemptWindow: 30 * 60 * 1000, // Failed attempts count within 30 minutes
  maxLockoutDuration: 24 * 60 * 60 * 1000, // Max 24 hour lockout
  cleanupInterval: 60 * 60 * 1000, // Cleanup every hour
};

let lastCleanup = Date.now();

/**
 * Cleanup old entries
 */
function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CONFIG.cleanupInterval) return;

  lastCleanup = now;
  const cutoff = now - CONFIG.maxLockoutDuration;

  for (const [key, entry] of lockoutStore.entries()) {
    // Remove entries that are old and not locked
    if (entry.lastFailedAt < cutoff && (!entry.lockedUntil || entry.lockedUntil < now)) {
      lockoutStore.delete(key);
    }
  }
}

/**
 * Hash identifier to avoid storing raw emails/phones
 */
function hashIdentifier(identifier: string): string {
  let hash = 0;
  const str = identifier.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get lockout key for an identifier
 */
function getLockoutKey(identifier: string, type: 'email' | 'phone' | 'ip' = 'email'): string {
  return `lockout:${type}:${hashIdentifier(identifier)}`;
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(
  identifier: string,
  type: 'email' | 'phone' | 'ip' = 'email'
): { locked: boolean; unlockIn?: number; failedAttempts: number } {
  cleanup();

  const key = getLockoutKey(identifier, type);
  const entry = lockoutStore.get(key);
  const now = Date.now();

  if (!entry) {
    return { locked: false, failedAttempts: 0 };
  }

  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      unlockIn: Math.ceil((entry.lockedUntil - now) / 1000),
      failedAttempts: entry.failedAttempts,
    };
  }

  // Check if attempts have expired
  if (now - entry.firstFailedAt > CONFIG.attemptWindow) {
    // Reset the entry
    lockoutStore.delete(key);
    return { locked: false, failedAttempts: 0 };
  }

  return {
    locked: false,
    failedAttempts: entry.failedAttempts,
  };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(
  identifier: string,
  type: 'email' | 'phone' | 'ip' = 'email'
): { locked: boolean; attemptsRemaining: number; unlockIn?: number } {
  cleanup();

  const key = getLockoutKey(identifier, type);
  const now = Date.now();
  let entry = lockoutStore.get(key);

  if (!entry) {
    entry = {
      failedAttempts: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      lockCount: 0,
    };
    lockoutStore.set(key, entry);
    return {
      locked: false,
      attemptsRemaining: CONFIG.maxFailedAttempts - 1,
    };
  }

  // Check if previous attempts have expired
  if (now - entry.firstFailedAt > CONFIG.attemptWindow) {
    entry.failedAttempts = 1;
    entry.firstFailedAt = now;
    entry.lastFailedAt = now;
    entry.lockedUntil = undefined;
    return {
      locked: false,
      attemptsRemaining: CONFIG.maxFailedAttempts - 1,
    };
  }

  // Increment failed attempts
  entry.failedAttempts++;
  entry.lastFailedAt = now;

  // Check if should lock
  if (entry.failedAttempts >= CONFIG.maxFailedAttempts) {
    entry.lockCount++;

    // Exponential backoff for repeated lockouts (up to 24 hours)
    const lockDuration = Math.min(
      CONFIG.lockoutDuration * Math.pow(2, entry.lockCount - 1),
      CONFIG.maxLockoutDuration
    );

    entry.lockedUntil = now + lockDuration;

    return {
      locked: true,
      attemptsRemaining: 0,
      unlockIn: Math.ceil(lockDuration / 1000),
    };
  }

  return {
    locked: false,
    attemptsRemaining: CONFIG.maxFailedAttempts - entry.failedAttempts,
  };
}

/**
 * Record a successful login (clears failed attempts)
 */
export function recordSuccessfulLogin(
  identifier: string,
  type: 'email' | 'phone' | 'ip' = 'email'
): void {
  const key = getLockoutKey(identifier, type);
  lockoutStore.delete(key);
}

/**
 * Manually unlock an account (admin action)
 */
export function unlockAccount(
  identifier: string,
  type: 'email' | 'phone' | 'ip' = 'email'
): boolean {
  const key = getLockoutKey(identifier, type);
  const entry = lockoutStore.get(key);

  if (!entry) return false;

  entry.lockedUntil = undefined;
  entry.failedAttempts = 0;
  return true;
}

/**
 * Get lockout status for an account
 */
export function getLockoutStatus(
  identifier: string,
  type: 'email' | 'phone' | 'ip' = 'email'
): {
  failedAttempts: number;
  locked: boolean;
  unlockIn?: number;
  lockCount: number;
  attemptsRemaining: number;
} {
  const key = getLockoutKey(identifier, type);
  const entry = lockoutStore.get(key);
  const now = Date.now();

  if (!entry) {
    return {
      failedAttempts: 0,
      locked: false,
      lockCount: 0,
      attemptsRemaining: CONFIG.maxFailedAttempts,
    };
  }

  // Check if attempts expired
  if (now - entry.firstFailedAt > CONFIG.attemptWindow && !entry.lockedUntil) {
    return {
      failedAttempts: 0,
      locked: false,
      lockCount: entry.lockCount,
      attemptsRemaining: CONFIG.maxFailedAttempts,
    };
  }

  const isLocked = entry.lockedUntil ? entry.lockedUntil > now : false;

  return {
    failedAttempts: entry.failedAttempts,
    locked: isLocked,
    unlockIn: isLocked && entry.lockedUntil ? Math.ceil((entry.lockedUntil - now) / 1000) : undefined,
    lockCount: entry.lockCount,
    attemptsRemaining: isLocked ? 0 : CONFIG.maxFailedAttempts - entry.failedAttempts,
  };
}

/**
 * Combined check for login attempts
 * Use this before attempting authentication
 */
export function checkLoginAllowed(
  identifier: string,
  ip: string
): {
  allowed: boolean;
  reason?: string;
  unlockIn?: number;
  attemptsRemaining?: number;
} {
  // Check account lockout by identifier
  const identifierStatus = isAccountLocked(identifier, 'email');
  if (identifierStatus.locked) {
    return {
      allowed: false,
      reason: 'Account temporarily locked due to too many failed attempts',
      unlockIn: identifierStatus.unlockIn,
    };
  }

  // Check IP-based lockout
  const ipStatus = isAccountLocked(ip, 'ip');
  if (ipStatus.locked) {
    return {
      allowed: false,
      reason: 'Too many failed login attempts from your location',
      unlockIn: ipStatus.unlockIn,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: CONFIG.maxFailedAttempts - identifierStatus.failedAttempts,
  };
}

/**
 * Record failed login for both identifier and IP
 */
export function recordFailedLogin(
  identifier: string,
  ip: string
): {
  locked: boolean;
  reason?: string;
  unlockIn?: number;
  attemptsRemaining: number;
} {
  const identifierResult = recordFailedAttempt(identifier, 'email');
  const ipResult = recordFailedAttempt(ip, 'ip');

  if (identifierResult.locked) {
    return {
      locked: true,
      reason: 'Account temporarily locked due to too many failed attempts',
      unlockIn: identifierResult.unlockIn,
      attemptsRemaining: 0,
    };
  }

  if (ipResult.locked) {
    return {
      locked: true,
      reason: 'Too many failed login attempts from your location',
      unlockIn: ipResult.unlockIn,
      attemptsRemaining: 0,
    };
  }

  return {
    locked: false,
    attemptsRemaining: Math.min(identifierResult.attemptsRemaining, ipResult.attemptsRemaining),
  };
}

/**
 * Clear lockout on successful login
 */
export function clearLockoutOnSuccess(identifier: string, ip: string): void {
  recordSuccessfulLogin(identifier, 'email');
  recordSuccessfulLogin(ip, 'ip');
}

export default {
  isAccountLocked,
  recordFailedAttempt,
  recordSuccessfulLogin,
  unlockAccount,
  getLockoutStatus,
  checkLoginAllowed,
  recordFailedLogin,
  clearLockoutOnSuccess,
};
