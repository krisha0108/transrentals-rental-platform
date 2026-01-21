/**
 * Antivirus Scanner Utility
 *
 * Provides file scanning using ClamAV daemon.
 * Falls back gracefully if ClamAV is not available.
 */

import { Socket } from 'net';
import logger from './logger';

// ClamAV configuration
const CLAMAV_CONFIG = {
  host: process.env.CLAMAV_HOST || '127.0.0.1',
  port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
  timeout: parseInt(process.env.CLAMAV_TIMEOUT || '30000', 10), // 30 seconds
  maxFileSize: 25 * 1024 * 1024, // 25MB - matches our upload limit
};

export interface ScanResult {
  clean: boolean;
  infected: boolean;
  viruses: string[];
  error?: string;
  scanned: boolean; // false if ClamAV unavailable
}

/**
 * Check if ClamAV daemon is available
 */
export async function isClamAVAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 3000);

    socket.connect(CLAMAV_CONFIG.port, CLAMAV_CONFIG.host, () => {
      clearTimeout(timeout);
      socket.write('PING\0');
    });

    socket.on('data', (data) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(data.toString().trim() === 'PONG');
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Scan a file buffer using ClamAV INSTREAM command
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  // Check file size
  if (buffer.length > CLAMAV_CONFIG.maxFileSize) {
    return {
      clean: false,
      infected: false,
      viruses: [],
      error: 'File too large for scanning',
      scanned: false,
    };
  }

  return new Promise((resolve) => {
    const socket = new Socket();
    let response = '';

    const timeout = setTimeout(() => {
      socket.destroy();
      logger.warn('ClamAV scan timeout');
      resolve({
        clean: true, // Assume clean on timeout (configurable)
        infected: false,
        viruses: [],
        error: 'Scan timeout',
        scanned: false,
      });
    }, CLAMAV_CONFIG.timeout);

    socket.connect(CLAMAV_CONFIG.port, CLAMAV_CONFIG.host, () => {
      // Send INSTREAM command
      socket.write('zINSTREAM\0');

      // Send file size as 4-byte big-endian integer, then the data
      const sizeBuffer = Buffer.alloc(4);
      sizeBuffer.writeUInt32BE(buffer.length, 0);
      socket.write(sizeBuffer);
      socket.write(buffer);

      // Send end of stream (zero-length chunk)
      const endBuffer = Buffer.alloc(4);
      endBuffer.writeUInt32BE(0, 0);
      socket.write(endBuffer);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      clearTimeout(timeout);
      socket.destroy();

      const result = parseResponse(response);
      if (result.infected) {
        logger.logSecurityEvent('Malware detected in upload', 'critical', {
          viruses: result.viruses,
        });
      }
      resolve(result);
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      socket.destroy();
      logger.warn('ClamAV connection error', { error: err.message });
      resolve({
        clean: true, // Assume clean when ClamAV unavailable
        infected: false,
        viruses: [],
        error: `ClamAV unavailable: ${err.message}`,
        scanned: false,
      });
    });
  });
}

/**
 * Parse ClamAV response
 */
function parseResponse(response: string): ScanResult {
  const trimmed = response.trim();

  // Check for OK response
  if (trimmed.endsWith('OK')) {
    return {
      clean: true,
      infected: false,
      viruses: [],
      scanned: true,
    };
  }

  // Check for FOUND response (virus detected)
  if (trimmed.includes('FOUND')) {
    // Extract virus name(s)
    const matches = trimmed.match(/: (.+) FOUND/g);
    const viruses = matches
      ? matches.map((m) => m.replace(/: | FOUND/g, '').trim())
      : ['Unknown threat'];

    return {
      clean: false,
      infected: true,
      viruses,
      scanned: true,
    };
  }

  // Check for error responses
  if (trimmed.includes('ERROR')) {
    return {
      clean: false,
      infected: false,
      viruses: [],
      error: trimmed,
      scanned: false,
    };
  }

  // Unknown response
  return {
    clean: true,
    infected: false,
    viruses: [],
    error: `Unknown response: ${trimmed}`,
    scanned: false,
  };
}

/**
 * Scan a file from a File object (for use in API routes)
 */
export async function scanFile(file: File): Promise<ScanResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return scanBuffer(buffer);
  } catch (error) {
    logger.error('Error reading file for scan', error);
    return {
      clean: true,
      infected: false,
      viruses: [],
      error: 'Failed to read file',
      scanned: false,
    };
  }
}

/**
 * Get ClamAV version info
 */
export async function getClamAVVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, 3000);

    socket.connect(CLAMAV_CONFIG.port, CLAMAV_CONFIG.host, () => {
      socket.write('VERSION\0');
    });

    socket.on('data', (data) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(data.toString().trim());
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Middleware-style scan function that throws on infection
 */
export async function requireCleanFile(file: File): Promise<void> {
  const result = await scanFile(file);

  if (result.infected) {
    throw new Error(`File contains malware: ${result.viruses.join(', ')}`);
  }
}

/**
 * Configuration check - log ClamAV status on startup
 */
export async function checkClamAVStatus(): Promise<void> {
  const available = await isClamAVAvailable();

  if (available) {
    const version = await getClamAVVersion();
    logger.info('ClamAV antivirus scanner available', { version });
  } else {
    logger.warn('ClamAV antivirus scanner not available - file scanning disabled', {
      host: CLAMAV_CONFIG.host,
      port: CLAMAV_CONFIG.port,
    });
  }
}

export default {
  scanBuffer,
  scanFile,
  isClamAVAvailable,
  getClamAVVersion,
  requireCleanFile,
  checkClamAVStatus,
  CLAMAV_CONFIG,
};
