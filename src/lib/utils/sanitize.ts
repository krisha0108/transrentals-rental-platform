/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

import xss from 'xss';

/**
 * Sanitize user input to prevent XSS attacks
 * Removes dangerous HTML/JavaScript while preserving safe text
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';

  // Remove all HTML tags and dangerous characters
  return xss(input, {
    whiteList: {}, // Don't allow any HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe']
  });
}

/**
 * Sanitize multiple string fields in an object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToSanitize: (keyof T)[]
): T {
  const sanitized = { ...obj };

  fieldsToSanitize.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field] as string) as T[keyof T];
    }
  });

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number (10 digits, starts with 6-9)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  // Check if it's 10 digits starting with 6-9, or 12 digits starting with 91
  const phoneRegex = /^([6-9]\d{9}|91[6-9]\d{9})$/;
  return phoneRegex.test(cleaned);
}

/**
 * Sanitize and validate phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Remove country code if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}
