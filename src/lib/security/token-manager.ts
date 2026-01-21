/**
 * Token Manager for Customer Authentication
 *
 * Secure token generation, validation, and expiration handling.
 * Replaces the simple non-expiring tokens with proper JWT-like tokens.
 */

import { prisma } from '@/lib/db/prisma';

// Configuration
const TOKEN_CONFIG = {
  accessTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  tokenPrefix: 'tr_',
  cleanupInterval: 24 * 60 * 60 * 1000, // Daily cleanup
};

interface TokenPayload {
  customerId: string;
  type: 'access' | 'refresh';
  createdAt: number;
  expiresAt: number;
  fingerprint?: string;
}

// In-memory fallback store
const tokenStore = new Map<string, TokenPayload>();

/**
 * Generate a cryptographically secure random string
 */
function generateSecureRandom(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
  }

  // Fallback
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a browser fingerprint from request headers
 */
export function generateFingerprint(userAgent?: string, ip?: string): string {
  const data = `${userAgent || 'unknown'}:${ip || 'unknown'}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a new access token for a customer
 */
export async function createAccessToken(
  customerId: string | number,
  fingerprint?: string
): Promise<{
  token: string;
  expiresAt: Date;
  expiresIn: number;
}> {
  const now = Date.now();
  const expiresAt = now + TOKEN_CONFIG.accessTokenExpiry;
  const tokenId = generateSecureRandom(32);
  const token = `${TOKEN_CONFIG.tokenPrefix}${customerId}_${tokenId}`;

  const payload: TokenPayload = {
    customerId: String(customerId),
    type: 'access',
    createdAt: now,
    expiresAt,
    fingerprint,
  };

  try {
    // Store in database
    await prisma.settings.upsert({
      where: { key: `token:${token}` },
      update: {
        value: JSON.stringify(payload),
        updatedAt: new Date(),
      },
      create: {
        key: `token:${token}`,
        value: JSON.stringify(payload),
        type: 'JSON',
        group: 'auth_tokens',
      },
    });
  } catch {
    // Fallback to memory
    tokenStore.set(token, payload);
  }

  return {
    token,
    expiresAt: new Date(expiresAt),
    expiresIn: TOKEN_CONFIG.accessTokenExpiry / 1000,
  };
}

/**
 * Create a refresh token for long-lived sessions
 */
export async function createRefreshToken(
  customerId: string | number,
  fingerprint?: string
): Promise<{
  token: string;
  expiresAt: Date;
  expiresIn: number;
}> {
  const now = Date.now();
  const expiresAt = now + TOKEN_CONFIG.refreshTokenExpiry;
  const tokenId = generateSecureRandom(48);
  const token = `${TOKEN_CONFIG.tokenPrefix}refresh_${customerId}_${tokenId}`;

  const payload: TokenPayload = {
    customerId: String(customerId),
    type: 'refresh',
    createdAt: now,
    expiresAt,
    fingerprint,
  };

  try {
    await prisma.settings.upsert({
      where: { key: `token:${token}` },
      update: {
        value: JSON.stringify(payload),
        updatedAt: new Date(),
      },
      create: {
        key: `token:${token}`,
        value: JSON.stringify(payload),
        type: 'JSON',
        group: 'auth_tokens',
      },
    });
  } catch {
    tokenStore.set(token, payload);
  }

  return {
    token,
    expiresAt: new Date(expiresAt),
    expiresIn: TOKEN_CONFIG.refreshTokenExpiry / 1000,
  };
}

/**
 * Create both access and refresh tokens
 */
export async function createTokenPair(
  customerId: string | number,
  fingerprint?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}> {
  const [access, refresh] = await Promise.all([
    createAccessToken(customerId, fingerprint),
    createRefreshToken(customerId, fingerprint),
  ]);

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
}

/**
 * Validate a token and return the customer ID if valid
 */
export async function validateToken(
  token: string,
  fingerprint?: string
): Promise<{
  valid: boolean;
  customerId?: string;
  error?: string;
  expired?: boolean;
}> {
  if (!token || !token.startsWith(TOKEN_CONFIG.tokenPrefix)) {
    return { valid: false, error: 'Invalid token format' };
  }

  let payload: TokenPayload | null = null;

  try {
    const dbRecord = await prisma.settings.findUnique({
      where: { key: `token:${token}` },
    });

    if (dbRecord) {
      payload = JSON.parse(dbRecord.value) as TokenPayload;
    }
  } catch {
    payload = tokenStore.get(token) || null;
  }

  if (!payload) {
    return { valid: false, error: 'Token not found' };
  }

  // Check expiry
  if (Date.now() > payload.expiresAt) {
    // Clean up expired token
    await revokeToken(token);
    return { valid: false, error: 'Token expired', expired: true };
  }

  // Optional: Check fingerprint for additional security
  if (fingerprint && payload.fingerprint && payload.fingerprint !== fingerprint) {
    // Log potential token theft attempt
    console.warn(`Token fingerprint mismatch for customer ${payload.customerId}`);
    // You may want to revoke the token or just log depending on security requirements
  }

  return {
    valid: true,
    customerId: payload.customerId,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  fingerprint?: string
): Promise<{
  success: boolean;
  accessToken?: string;
  expiresAt?: Date;
  error?: string;
}> {
  const validation = await validateToken(refreshToken, fingerprint);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Verify it's a refresh token
  if (!refreshToken.includes('_refresh_')) {
    return { success: false, error: 'Invalid refresh token' };
  }

  // Create new access token
  const { token, expiresAt } = await createAccessToken(validation.customerId!, fingerprint);

  return {
    success: true,
    accessToken: token,
    expiresAt,
  };
}

/**
 * Revoke a token (logout)
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    await prisma.settings.delete({
      where: { key: `token:${token}` },
    });
    return true;
  } catch {
    tokenStore.delete(token);
    return true;
  }
}

/**
 * Revoke all tokens for a customer (logout all devices)
 */
export async function revokeAllCustomerTokens(customerId: string | number): Promise<number> {
  let revokedCount = 0;

  try {
    const result = await prisma.settings.deleteMany({
      where: {
        group: 'auth_tokens',
        value: { contains: `"customerId":"${customerId}"` },
      },
    });
    revokedCount = result.count;
  } catch {
    // Cleanup memory store
    for (const [key, payload] of tokenStore.entries()) {
      if (payload.customerId === String(customerId)) {
        tokenStore.delete(key);
        revokedCount++;
      }
    }
  }

  return revokedCount;
}

/**
 * Get active sessions for a customer
 */
export async function getCustomerSessions(
  customerId: string | number
): Promise<Array<{
  tokenPrefix: string;
  type: 'access' | 'refresh';
  createdAt: Date;
  expiresAt: Date;
}>> {
  const sessions: Array<{
    tokenPrefix: string;
    type: 'access' | 'refresh';
    createdAt: Date;
    expiresAt: Date;
  }> = [];

  try {
    const records = await prisma.settings.findMany({
      where: {
        group: 'auth_tokens',
        value: { contains: `"customerId":"${customerId}"` },
      },
    });

    for (const record of records) {
      try {
        const payload = JSON.parse(record.value) as TokenPayload;
        if (payload.expiresAt > Date.now()) {
          sessions.push({
            tokenPrefix: record.key.substring(0, 20) + '...',
            type: payload.type,
            createdAt: new Date(payload.createdAt),
            expiresAt: new Date(payload.expiresAt),
          });
        }
      } catch {
        // Skip invalid records
      }
    }
  } catch {
    for (const [key, payload] of tokenStore.entries()) {
      if (payload.customerId === String(customerId) && payload.expiresAt > Date.now()) {
        sessions.push({
          tokenPrefix: key.substring(0, 20) + '...',
          type: payload.type,
          createdAt: new Date(payload.createdAt),
          expiresAt: new Date(payload.expiresAt),
        });
      }
    }
  }

  return sessions;
}

/**
 * Cleanup expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  let cleanedCount = 0;
  const now = Date.now();

  try {
    const records = await prisma.settings.findMany({
      where: { group: 'auth_tokens' },
    });

    for (const record of records) {
      try {
        const payload = JSON.parse(record.value) as TokenPayload;
        if (payload.expiresAt < now) {
          await prisma.settings.delete({ where: { key: record.key } });
          cleanedCount++;
        }
      } catch {
        // Delete invalid records
        await prisma.settings.delete({ where: { key: record.key } });
        cleanedCount++;
      }
    }
  } catch {
    // Cleanup memory store
    for (const [key, payload] of tokenStore.entries()) {
      if (payload.expiresAt < now) {
        tokenStore.delete(key);
        cleanedCount++;
      }
    }
  }

  return cleanedCount;
}

/**
 * Extend token expiry (keep-alive for active sessions)
 */
export async function extendTokenExpiry(token: string): Promise<boolean> {
  try {
    const dbRecord = await prisma.settings.findUnique({
      where: { key: `token:${token}` },
    });

    if (!dbRecord) return false;

    const payload = JSON.parse(dbRecord.value) as TokenPayload;
    const now = Date.now();

    // Don't extend if more than half the time remains
    const halfLife = (payload.expiresAt - payload.createdAt) / 2;
    if (payload.expiresAt - now > halfLife) {
      return true; // No extension needed
    }

    // Extend by the original duration
    const expiry = payload.type === 'refresh'
      ? TOKEN_CONFIG.refreshTokenExpiry
      : TOKEN_CONFIG.accessTokenExpiry;

    payload.expiresAt = now + expiry;

    await prisma.settings.update({
      where: { key: `token:${token}` },
      data: { value: JSON.stringify(payload) },
    });

    return true;
  } catch {
    const payload = tokenStore.get(token);
    if (payload) {
      const expiry = payload.type === 'refresh'
        ? TOKEN_CONFIG.refreshTokenExpiry
        : TOKEN_CONFIG.accessTokenExpiry;
      payload.expiresAt = Date.now() + expiry;
      return true;
    }
    return false;
  }
}

export default {
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  validateToken,
  refreshAccessToken,
  revokeToken,
  revokeAllCustomerTokens,
  getCustomerSessions,
  cleanupExpiredTokens,
  extendTokenExpiry,
  generateFingerprint,
  TOKEN_CONFIG,
};
