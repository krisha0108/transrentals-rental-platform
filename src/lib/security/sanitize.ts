/**
 * Input Sanitization Utilities
 *
 * Sanitize user inputs to prevent XSS and injection attacks.
 * Use these functions when displaying user-generated content.
 */

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 * Use when inserting user content into HTML
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from input
 * Use for plain text fields that should never contain HTML
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize for use in SQL LIKE queries (escape wildcards)
 * Note: Always use parameterized queries - this is an extra precaution
 */
export function escapeSqlLike(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Sanitize phone number - keep only digits
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\D/g, '').slice(0, 15); // Max 15 digits (international)
}

/**
 * Sanitize email - lowercase and trim
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.toLowerCase().trim().slice(0, 254); // Max email length
}

/**
 * Sanitize name - remove special characters, keep letters and spaces
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z\s\u0900-\u097F]/g, '') // Allow English and Hindi letters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Sanitize a URL - basic validation and sanitization
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim();

  // Block javascript: and data: URLs (XSS vectors)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }

  // Only allow http, https, and relative URLs
  if (!/^(https?:\/\/|\/)/i.test(trimmed) && trimmed.includes(':')) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (input: string) => string = escapeHtml
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizer(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, sanitizer)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, sanitizer);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validate and sanitize booking/form data
 */
export function sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    // Handle specific field types
    if (key.includes('email')) {
      sanitized[key] = typeof value === 'string' ? sanitizeEmail(value) : value;
    } else if (key.includes('phone') || key.includes('mobile')) {
      sanitized[key] = typeof value === 'string' ? sanitizePhone(value) : value;
    } else if (key.includes('name')) {
      sanitized[key] = typeof value === 'string' ? sanitizeName(value) : value;
    } else if (key.includes('url') || key.includes('link')) {
      sanitized[key] = typeof value === 'string' ? sanitizeUrl(value) : value;
    } else if (typeof value === 'string') {
      // Default: strip HTML from string values
      sanitized[key] = stripHtml(value).trim();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeFormData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
