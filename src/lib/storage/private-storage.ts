/**
 * Private Storage Utility
 *
 * Handles secure file storage outside the public directory.
 * Files stored here require authentication to access.
 */

import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

// Private storage configuration
const STORAGE_CONFIG = {
  // Base directory for private files (outside /public)
  baseDir: process.env.PRIVATE_STORAGE_PATH || path.join(process.cwd(), 'storage', 'private'),
  // Subdirectories
  vendorDocuments: 'vendor-documents',
  tempFiles: 'temp',
};

/**
 * Ensure storage directories exist
 */
export async function initializeStorage(): Promise<void> {
  const directories = [
    STORAGE_CONFIG.baseDir,
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.vendorDocuments),
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.tempFiles),
  ];

  for (const dir of directories) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      logger.info('Created private storage directory', { dir });
    }
  }
}

/**
 * Generate a secure random filename
 */
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomId}${ext}`;
}

/**
 * Get the full path for a vendor document
 */
export function getVendorDocumentPath(vendorId: string, filename: string): string {
  // Create vendor-specific subdirectory
  const vendorDir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.vendorDocuments,
    vendorId
  );
  return path.join(vendorDir, filename);
}

/**
 * Save a file to private vendor document storage
 */
export async function saveVendorDocument(
  vendorId: string,
  file: File,
  customFilename?: string
): Promise<{ filename: string; path: string; size: number }> {
  // Ensure vendor directory exists
  const vendorDir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.vendorDocuments,
    vendorId
  );

  if (!existsSync(vendorDir)) {
    await mkdir(vendorDir, { recursive: true });
  }

  // Generate secure filename
  const filename = customFilename || generateSecureFilename(file.name);
  const filePath = path.join(vendorDir, filename);

  // Convert file to buffer and save
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);

  logger.info('Saved vendor document to private storage', {
    vendorId,
    filename,
    size: buffer.length,
  });

  return {
    filename,
    path: filePath,
    size: buffer.length,
  };
}

/**
 * Read a file from private vendor document storage
 */
export async function readVendorDocument(
  vendorId: string,
  filename: string
): Promise<Buffer | null> {
  const filePath = getVendorDocumentPath(vendorId, filename);

  // Security: Validate path doesn't escape vendor directory
  const vendorDir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.vendorDocuments,
    vendorId
  );
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(vendorDir)) {
    logger.logSecurityEvent('Path traversal attempt in private storage', 'high', {
      vendorId,
      filename,
      attemptedPath: filePath,
    });
    return null;
  }

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return await readFile(filePath);
  } catch (error) {
    logger.error('Error reading vendor document', { vendorId, filename, error });
    return null;
  }
}

/**
 * Delete a file from private vendor document storage
 */
export async function deleteVendorDocument(
  vendorId: string,
  filename: string
): Promise<boolean> {
  const filePath = getVendorDocumentPath(vendorId, filename);

  // Security: Validate path doesn't escape vendor directory
  const vendorDir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.vendorDocuments,
    vendorId
  );
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(vendorDir)) {
    logger.logSecurityEvent('Path traversal attempt in delete', 'high', {
      vendorId,
      filename,
    });
    return false;
  }

  if (!existsSync(filePath)) {
    return false;
  }

  try {
    await unlink(filePath);
    logger.info('Deleted vendor document from private storage', {
      vendorId,
      filename,
    });
    return true;
  } catch (error) {
    logger.error('Error deleting vendor document', { vendorId, filename, error });
    return false;
  }
}

/**
 * Get file info without reading content
 */
export async function getVendorDocumentInfo(
  vendorId: string,
  filename: string
): Promise<{ exists: boolean; size?: number; modifiedAt?: Date } | null> {
  const filePath = getVendorDocumentPath(vendorId, filename);

  // Security check
  const vendorDir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.vendorDocuments,
    vendorId
  );
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(vendorDir)) {
    return null;
  }

  if (!existsSync(filePath)) {
    return { exists: false };
  }

  try {
    const stats = await stat(filePath);
    return {
      exists: true,
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Generate a secure access token for a file (for temporary access)
 */
export function generateFileAccessToken(
  vendorId: string,
  filename: string,
  expiresInMinutes: number = 15
): string {
  const secret = process.env.NEXTAUTH_SECRET || 'file-access-secret';
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${vendorId}:${filename}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Encode as base64url
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

/**
 * Validate a file access token
 */
export function validateFileAccessToken(
  token: string
): { valid: boolean; vendorId?: string; filename?: string; error?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [vendorId, filename, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiration
    if (Date.now() > expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify signature
    const secret = process.env.NEXTAUTH_SECRET || 'file-access-secret';
    const payload = `${vendorId}:${filename}:${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, vendorId, filename };
  } catch {
    return { valid: false, error: 'Token parsing failed' };
  }
}

export const STORAGE_CONFIG_EXPORT = STORAGE_CONFIG;

export default {
  initializeStorage,
  generateSecureFilename,
  getVendorDocumentPath,
  saveVendorDocument,
  readVendorDocument,
  deleteVendorDocument,
  getVendorDocumentInfo,
  getMimeType,
  generateFileAccessToken,
  validateFileAccessToken,
  STORAGE_CONFIG: STORAGE_CONFIG_EXPORT,
};
