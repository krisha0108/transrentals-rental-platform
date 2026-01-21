import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtml,
  escapeSqlLike,
  sanitizePhone,
  sanitizeEmail,
  sanitizeName,
  sanitizeUrl,
  sanitizeObject,
  sanitizeFormData,
} from '../sanitize';

describe('sanitize utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape quotes', () => {
      expect(escapeHtml("It's a \"test\"")).toBe("It&#x27;s a &quot;test&quot;");
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123 as unknown as string)).toBe('');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should remove script tags', () => {
      expect(stripHtml('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtml('Hello<br/>World')).toBe('HelloWorld');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle text without HTML', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('escapeSqlLike', () => {
    it('should escape percent wildcard', () => {
      expect(escapeSqlLike('100%')).toBe('100\\%');
    });

    it('should escape underscore wildcard', () => {
      expect(escapeSqlLike('test_value')).toBe('test\\_value');
    });

    it('should escape backslash', () => {
      expect(escapeSqlLike('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should handle normal text', () => {
      expect(escapeSqlLike('normal text')).toBe('normal text');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only digits', () => {
      expect(sanitizePhone('+91 98765-43210')).toBe('919876543210');
    });

    it('should handle phone with parentheses', () => {
      expect(sanitizePhone('(91) 98765 43210')).toBe('919876543210');
    });

    it('should limit to 15 digits', () => {
      expect(sanitizePhone('123456789012345678')).toBe('123456789012345');
    });

    it('should handle empty string', () => {
      expect(sanitizePhone('')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBe('');
    });

    it('should limit length to 254', () => {
      const longEmail = 'a'.repeat(300) + '@test.com';
      expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(254);
    });
  });

  describe('sanitizeName', () => {
    it('should keep letters and spaces', () => {
      expect(sanitizeName('John Doe')).toBe('John Doe');
    });

    it('should remove special characters', () => {
      expect(sanitizeName('John<script>Doe')).toBe('JohnscriptDoe');
    });

    it('should remove numbers', () => {
      expect(sanitizeName('John123Doe')).toBe('JohnDoe');
    });

    it('should collapse multiple spaces', () => {
      expect(sanitizeName('John   Doe')).toBe('John Doe');
    });

    it('should trim whitespace', () => {
      expect(sanitizeName('  John Doe  ')).toBe('John Doe');
    });

    it('should limit to 100 characters', () => {
      const longName = 'A'.repeat(150);
      expect(sanitizeName(longName).length).toBe(100);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('should handle case-insensitive protocols', () => {
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
      expect(sanitizeUrl('JavaScript:alert(1)')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const input = { name: '<script>test</script>' };
      const result = sanitizeObject(input);
      expect(result.name).toBe('&lt;script&gt;test&lt;&#x2F;script&gt;');
    });

    it('should preserve non-string values', () => {
      const input = { count: 42, active: true };
      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should handle nested objects', () => {
      const input = { user: { name: '<b>test</b>' } };
      const result = sanitizeObject(input);
      expect((result.user as { name: string }).name).toBe('&lt;b&gt;test&lt;&#x2F;b&gt;');
    });

    it('should handle arrays', () => {
      const input = { tags: ['<script>', 'test'] };
      const result = sanitizeObject(input);
      expect(result.tags).toEqual(['&lt;script&gt;', 'test']);
    });

    it('should allow custom sanitizer', () => {
      const input = { html: '<p>Hello</p>' };
      const result = sanitizeObject(input, stripHtml);
      expect(result.html).toBe('Hello');
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize email fields', () => {
      const input = { email: '  TEST@EXAMPLE.COM  ' };
      const result = sanitizeFormData(input);
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize phone fields', () => {
      const input = { phone: '+91 98765-43210' };
      const result = sanitizeFormData(input);
      expect(result.phone).toBe('919876543210');
    });

    it('should sanitize name fields', () => {
      const input = { name: 'John<script>Doe' };
      const result = sanitizeFormData(input);
      expect(result.name).toBe('JohnscriptDoe');
    });

    it('should sanitize URL fields', () => {
      const input = { website_url: 'javascript:alert(1)' };
      const result = sanitizeFormData(input);
      expect(result.website_url).toBe('');
    });

    it('should strip HTML from other string fields', () => {
      const input = { description: '<p>Hello</p>' };
      const result = sanitizeFormData(input);
      expect(result.description).toBe('Hello');
    });

    it('should preserve null and undefined', () => {
      const input = { optional: null, missing: undefined };
      const result = sanitizeFormData(input);
      expect(result.optional).toBeNull();
      expect(result.missing).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const input = { customer: { email: 'TEST@EXAMPLE.COM', name: 'John' } };
      const result = sanitizeFormData(input);
      expect((result.customer as Record<string, unknown>).email).toBe('test@example.com');
    });
  });
});
