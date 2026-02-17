/**
 * OTP Manager
 *
 * Secure OTP generation, storage, and verification.
 * Uses database storage instead of in-memory for production reliability.
 */

import { prisma } from '@/lib/db/prisma';

// Configuration
const OTP_CONFIG = {
  length: 6, // 6-digit OTP
  expiryMinutes: 10, // OTP expires after 10 minutes
  maxAttempts: 3, // Max verification attempts before OTP is invalidated
  cooldownSeconds: 10, // Minimum time between OTP requests (relaxed for testing)
  maxDailyOtps: 10, // Max OTPs per identifier per day
};

type OTPPurpose = 'registration' | 'login' | 'password_reset' | 'phone_verify' | 'email_verify';

interface OTPRecord {
  id: string;
  identifier: string;
  otp: string;
  purpose: OTPPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  verified: boolean;
}

// Fallback in-memory store if database is unavailable
const memoryStore = new Map<string, OTPRecord>();

/**
 * Generate a secure random OTP
 */
function generateOTP(): string {
  // Generate cryptographically secure random number
  const min = Math.pow(10, OTP_CONFIG.length - 1);
  const max = Math.pow(10, OTP_CONFIG.length) - 1;

  // Use crypto for better randomness if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const range = max - min + 1;
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return String(min + (randomBuffer[0] % range));
  }

  // Fallback to Math.random (less secure but functional)
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Hash identifier for storage key
 */
function getKey(identifier: string, purpose: OTPPurpose): string {
  return `otp:${purpose}:${identifier.toLowerCase().trim()}`;
}

/**
 * Check if cooldown period has passed since last OTP
 */
async function checkCooldown(identifier: string, purpose: OTPPurpose): Promise<{
  allowed: boolean;
  waitSeconds?: number;
}> {
  const key = getKey(identifier, purpose);

  try {
    // Try database first
    const existing = await prisma.settings.findFirst({
      where: {
        key: { startsWith: `otp_cooldown:${key}` },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) {
      const lastRequest = new Date(existing.value).getTime();
      const now = Date.now();
      const elapsed = (now - lastRequest) / 1000;

      if (elapsed < OTP_CONFIG.cooldownSeconds) {
        return {
          allowed: false,
          waitSeconds: Math.ceil(OTP_CONFIG.cooldownSeconds - elapsed),
        };
      }
    }
  } catch {
    // Fallback to memory store
    const memRecord = memoryStore.get(key);
    if (memRecord) {
      const elapsed = (Date.now() - memRecord.createdAt.getTime()) / 1000;
      if (elapsed < OTP_CONFIG.cooldownSeconds) {
        return {
          allowed: false,
          waitSeconds: Math.ceil(OTP_CONFIG.cooldownSeconds - elapsed),
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Check daily OTP limit
 */
async function checkDailyLimit(identifier: string, purpose: OTPPurpose): Promise<{
  allowed: boolean;
  remaining?: number;
}> {
  const key = `daily_otp:${getKey(identifier, purpose)}`;
  const today = new Date().toISOString().split('T')[0];

  try {
    const countRecord = await prisma.settings.findFirst({
      where: { key: `${key}:${today}` },
    });

    const count = countRecord ? parseInt(countRecord.value, 10) : 0;

    if (count >= OTP_CONFIG.maxDailyOtps) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: OTP_CONFIG.maxDailyOtps - count };
  } catch {
    return { allowed: true, remaining: OTP_CONFIG.maxDailyOtps };
  }
}

/**
 * Increment daily OTP count
 */
async function incrementDailyCount(identifier: string, purpose: OTPPurpose): Promise<void> {
  const key = `daily_otp:${getKey(identifier, purpose)}`;
  const today = new Date().toISOString().split('T')[0];
  const fullKey = `${key}:${today}`;

  try {
    const existing = await prisma.settings.findUnique({ where: { key: fullKey } });
    const currentCount = existing ? parseInt(existing.value, 10) : 0;

    await prisma.settings.upsert({
      where: { key: fullKey },
      update: {
        value: String(currentCount + 1),
      },
      create: {
        key: fullKey,
        value: '1',
        type: 'NUMBER',
        group: 'otp',
      },
    });
  } catch {
    // Ignore errors for counter
  }
}

/**
 * Create and store a new OTP
 */
export async function createOTP(
  identifier: string,
  purpose: OTPPurpose
): Promise<{
  success: boolean;
  otp?: string;
  expiresIn?: number;
  error?: string;
  waitSeconds?: number;
}> {
  const normalizedIdentifier = identifier.toLowerCase().trim();

  // Skip cooldown and daily limit checks in development
  if (process.env.NODE_ENV !== 'development') {
    // Check cooldown
    const cooldownCheck = await checkCooldown(normalizedIdentifier, purpose);
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        error: 'Please wait before requesting another OTP',
        waitSeconds: cooldownCheck.waitSeconds,
      };
    }

    // Check daily limit
    const limitCheck = await checkDailyLimit(normalizedIdentifier, purpose);
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: 'Daily OTP limit reached. Please try again tomorrow.',
      };
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const key = getKey(normalizedIdentifier, purpose);
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

  const record: OTPRecord = {
    id: key,
    identifier: normalizedIdentifier,
    otp,
    purpose,
    attempts: 0,
    expiresAt,
    createdAt: new Date(),
    verified: false,
  };

  try {
    // Store in database using Setting model as a key-value store
    await prisma.settings.upsert({
      where: { key },
      update: {
        value: JSON.stringify(record),
        updatedAt: new Date(),
      },
      create: {
        key,
        value: JSON.stringify(record),
        type: 'JSON',
        group: 'otp',
      },
    });

    // Update cooldown timestamp
    await prisma.settings.upsert({
      where: { key: `otp_cooldown:${key}` },
      update: { value: new Date().toISOString() },
      create: {
        key: `otp_cooldown:${key}`,
        value: new Date().toISOString(),
        type: 'TEXT',
        group: 'otp',
      },
    });

    // Increment daily count
    await incrementDailyCount(normalizedIdentifier, purpose);
  } catch {
    // Fallback to memory store
    memoryStore.set(key, record);
  }

  return {
    success: true,
    otp,
    expiresIn: OTP_CONFIG.expiryMinutes * 60,
  };
}

/**
 * Verify an OTP
 */
export async function verifyOTP(
  identifier: string,
  otp: string,
  purpose: OTPPurpose
): Promise<{
  valid: boolean;
  error?: string;
  attemptsRemaining?: number;
}> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const key = getKey(normalizedIdentifier, purpose);

  let record: OTPRecord | null = null;

  try {
    // Try database first
    const dbRecord = await prisma.settings.findUnique({
      where: { key },
    });

    if (dbRecord) {
      record = JSON.parse(dbRecord.value) as OTPRecord;
    }
  } catch {
    // Fallback to memory
    record = memoryStore.get(key) || null;
  }

  if (!record) {
    return {
      valid: false,
      error: 'No OTP found. Please request a new one.',
    };
  }

  // Check if already verified
  if (record.verified) {
    return {
      valid: false,
      error: 'OTP already used. Please request a new one.',
    };
  }

  // Check expiry
  if (new Date(record.expiresAt) < new Date()) {
    await deleteOTP(normalizedIdentifier, purpose);
    return {
      valid: false,
      error: 'OTP has expired. Please request a new one.',
    };
  }

  // Check max attempts
  if (record.attempts >= OTP_CONFIG.maxAttempts) {
    await deleteOTP(normalizedIdentifier, purpose);
    return {
      valid: false,
      error: 'Too many failed attempts. Please request a new OTP.',
    };
  }

  // Verify OTP
  if (record.otp !== otp) {
    record.attempts++;

    try {
      await prisma.settings.update({
        where: { key },
        data: { value: JSON.stringify(record) },
      });
    } catch {
      memoryStore.set(key, record);
    }

    return {
      valid: false,
      error: 'Invalid OTP',
      attemptsRemaining: OTP_CONFIG.maxAttempts - record.attempts,
    };
  }

  // Mark as verified
  record.verified = true;

  try {
    await prisma.settings.update({
      where: { key },
      data: { value: JSON.stringify(record) },
    });
  } catch {
    memoryStore.set(key, record);
  }

  return { valid: true };
}

/**
 * Delete an OTP
 */
export async function deleteOTP(identifier: string, purpose: OTPPurpose): Promise<void> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const key = getKey(normalizedIdentifier, purpose);

  try {
    await prisma.settings.delete({
      where: { key },
    });
  } catch {
    // Ignore errors
  }

  memoryStore.delete(key);
}

/**
 * Check if OTP exists and is valid (without incrementing attempts)
 */
export async function checkOTPExists(
  identifier: string,
  purpose: OTPPurpose
): Promise<{
  exists: boolean;
  expiresIn?: number;
}> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const key = getKey(normalizedIdentifier, purpose);

  try {
    const dbRecord = await prisma.settings.findUnique({
      where: { key },
    });

    if (dbRecord) {
      const record = JSON.parse(dbRecord.value) as OTPRecord;
      const expiresAt = new Date(record.expiresAt);

      if (expiresAt > new Date() && !record.verified) {
        return {
          exists: true,
          expiresIn: Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
        };
      }
    }
  } catch {
    const memRecord = memoryStore.get(key);
    if (memRecord && new Date(memRecord.expiresAt) > new Date() && !memRecord.verified) {
      return {
        exists: true,
        expiresIn: Math.ceil((new Date(memRecord.expiresAt).getTime() - Date.now()) / 1000),
      };
    }
  }

  return { exists: false };
}

/**
 * Cleanup expired OTPs (run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  let cleanedCount = 0;

  try {
    // Delete expired OTPs from database
    const result = await prisma.settings.deleteMany({
      where: {
        group: 'otp',
        OR: [
          {
            key: { startsWith: 'otp:' },
            updatedAt: { lt: new Date(Date.now() - OTP_CONFIG.expiryMinutes * 60 * 1000) },
          },
          {
            AND: [
              { key: { startsWith: 'daily_otp:' } },
              { key: { not: { contains: new Date().toISOString().split('T')[0] } } },
            ],
          },
        ],
      },
    });
    cleanedCount = result.count;
  } catch {
    // Cleanup memory store
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (new Date(record.expiresAt).getTime() < now) {
        memoryStore.delete(key);
        cleanedCount++;
      }
    }
  }

  return cleanedCount;
}

export default {
  createOTP,
  verifyOTP,
  deleteOTP,
  checkOTPExists,
  cleanupExpiredOTPs,
  OTP_CONFIG,
};
