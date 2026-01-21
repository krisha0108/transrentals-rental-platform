/**
 * File Validation Security Utility
 *
 * Provides server-side file validation using magic numbers (file signatures)
 * to prevent malicious file uploads regardless of client-provided MIME types.
 */

// File signature magic numbers for validation
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number }[]> = {
  // Images
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF], offset: 0 },
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }, // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header, also check WEBP at offset 8
  ],
  'image/svg+xml': [], // SVG is text-based, requires different validation

  // Documents
  'application/pdf': [
    { signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // %PDF
  ],
  'application/msword': [
    { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0 }, // Old DOC format
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0 }, // ZIP/DOCX format
  ],

  // Videos
  'video/mp4': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  ],
  'video/webm': [
    { signature: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 }, // EBML header
  ],
};

// Allowed extensions by category
export const ALLOWED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  documents: ['pdf', 'doc', 'docx'],
  videos: ['mp4', 'webm'],
  all: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'mp4', 'webm'],
};

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm'],
  all: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm',
  ],
};

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB for images
  document: 25 * 1024 * 1024,  // 25MB for documents
  video: 100 * 1024 * 1024,    // 100MB for videos
  default: 10 * 1024 * 1024,   // 10MB default
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  sanitizedName?: string;
}

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxSize?: number;
  requireMagicNumber?: boolean;
}

/**
 * Validates a file's magic number against expected signatures
 */
function validateMagicNumber(buffer: Buffer, expectedType: string): boolean {
  const signatures = FILE_SIGNATURES[expectedType];

  if (!signatures || signatures.length === 0) {
    // For types without signatures (like SVG), we can't validate magic numbers
    return true;
  }

  return signatures.some(({ signature, offset }) => {
    if (buffer.length < offset + signature.length) {
      return false;
    }
    return signature.every((byte, index) => buffer[offset + index] === byte);
  });
}

/**
 * Detects the actual file type from buffer using magic numbers
 */
export function detectFileType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.length === 0) continue;

    const matches = signatures.some(({ signature, offset }) => {
      if (buffer.length < offset + signature.length) {
        return false;
      }
      return signature.every((byte, index) => buffer[offset + index] === byte);
    });

    if (matches) {
      // Special handling for WEBP - verify WEBP string at offset 8
      if (mimeType === 'image/webp') {
        const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
        if (buffer.length >= 12) {
          const isWebp = webpSignature.every((byte, index) => buffer[8 + index] === byte);
          if (!isWebp) continue;
        }
      }
      return mimeType;
    }
  }
  return null;
}

/**
 * Sanitizes a filename to prevent directory traversal and special character attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  const baseName = fileName.split(/[/\\]/).pop() || 'file';

  // Get extension
  const lastDotIndex = baseName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? baseName.substring(0, lastDotIndex) : baseName;
  const ext = lastDotIndex > 0 ? baseName.substring(lastDotIndex + 1).toLowerCase() : '';

  // Sanitize name: only allow alphanumeric, hyphens, underscores
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'file';

  // Sanitize extension: only allow alphanumeric
  const sanitizedExt = ext.replace(/[^a-z0-9]/g, '').substring(0, 10);

  // Add timestamp for uniqueness
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return sanitizedExt
    ? `${sanitizedName}-${timestamp}-${random}.${sanitizedExt}`
    : `${sanitizedName}-${timestamp}-${random}`;
}

/**
 * Gets the extension from a filename
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * Validates SVG content for malicious scripts
 */
function validateSvgContent(content: string): boolean {
  // Check for potentially dangerous SVG elements and attributes
  const dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick, onload, etc.
    /<foreignObject/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /xlink:href\s*=\s*["'](?!#)/i, // external xlink references
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Main file validation function
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    allowedMimeTypes = ALLOWED_MIME_TYPES.all,
    allowedExtensions = ALLOWED_EXTENSIONS.all,
    maxSize = FILE_SIZE_LIMITS.default,
    requireMagicNumber = true,
  } = options;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Check file size minimum (empty files)
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Get and validate extension
  const extension = getFileExtension(file.name);
  if (!extension) {
    return {
      valid: false,
      error: 'File must have an extension',
    };
  }

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension '.${extension}' is not allowed. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  // Check client-provided MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type}' is not allowed`,
    };
  }

  // Read file buffer for magic number validation
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Handle SVG separately (text-based)
  if (file.type === 'image/svg+xml' || extension === 'svg') {
    const content = buffer.toString('utf-8');

    // Check if it starts with SVG or XML declaration
    const trimmedContent = content.trim();
    if (!trimmedContent.startsWith('<') ||
        (!trimmedContent.includes('<svg') && !trimmedContent.startsWith('<?xml'))) {
      return {
        valid: false,
        error: 'Invalid SVG file format',
      };
    }

    // Validate SVG content for malicious scripts
    if (!validateSvgContent(content)) {
      return {
        valid: false,
        error: 'SVG contains potentially malicious content',
      };
    }

    return {
      valid: true,
      detectedType: 'image/svg+xml',
      sanitizedName: sanitizeFileName(file.name),
    };
  }

  // Validate magic number for other file types
  if (requireMagicNumber) {
    const detectedType = detectFileType(buffer);

    if (!detectedType) {
      return {
        valid: false,
        error: 'Could not verify file type. File may be corrupted or invalid.',
      };
    }

    // Verify detected type matches claimed type
    if (detectedType !== file.type) {
      // Allow some flexibility for related types
      const typeMatches = (
        (detectedType === 'image/jpeg' && file.type === 'image/jpeg') ||
        (detectedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
         (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/zip')) // DOCX is a ZIP file
      );

      if (!typeMatches && !allowedMimeTypes.includes(detectedType)) {
        return {
          valid: false,
          error: `File content does not match declared type. Detected: ${detectedType}, Claimed: ${file.type}`,
        };
      }
    }

    return {
      valid: true,
      detectedType,
      sanitizedName: sanitizeFileName(file.name),
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFileName(file.name),
  };
}

/**
 * Quick validation for images only
 */
export async function validateImage(file: File, maxSize = FILE_SIZE_LIMITS.image): Promise<FileValidationResult> {
  return validateFile(file, {
    allowedMimeTypes: ALLOWED_MIME_TYPES.images,
    allowedExtensions: ALLOWED_EXTENSIONS.images,
    maxSize,
    requireMagicNumber: true,
  });
}

/**
 * Quick validation for documents only
 */
export async function validateDocument(file: File, maxSize = FILE_SIZE_LIMITS.document): Promise<FileValidationResult> {
  return validateFile(file, {
    allowedMimeTypes: ALLOWED_MIME_TYPES.documents,
    allowedExtensions: ALLOWED_EXTENSIONS.documents,
    maxSize,
    requireMagicNumber: true,
  });
}

/**
 * Validation for vendor documents (images + PDFs)
 */
export async function validateVendorDocument(file: File): Promise<FileValidationResult> {
  const allowedMimeTypes = [
    ...ALLOWED_MIME_TYPES.images.filter(t => t !== 'image/gif'), // No GIFs for documents
    'application/pdf',
  ];

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

  return validateFile(file, {
    allowedMimeTypes,
    allowedExtensions,
    maxSize: FILE_SIZE_LIMITS.document, // 25MB for vendor documents
    requireMagicNumber: true,
  });
}

export default {
  validateFile,
  validateImage,
  validateDocument,
  validateVendorDocument,
  sanitizeFileName,
  detectFileType,
  getFileExtension,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
};
