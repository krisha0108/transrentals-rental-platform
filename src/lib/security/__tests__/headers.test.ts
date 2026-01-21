import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  SECURITY_HEADERS,
  CSP_PRODUCTION,
  CSP_DEVELOPMENT,
  addSecurityHeaders,
  secureResponse,
} from '../headers';

describe('security headers', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // @ts-expect-error - Test environment mocking
    process.env.NODE_ENV = originalEnv;
  });

  describe('SECURITY_HEADERS', () => {
    it('should have X-Frame-Options header', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('SAMEORIGIN');
    });

    it('should have X-Content-Type-Options header', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should have X-XSS-Protection header', () => {
      expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
    });

    it('should have Referrer-Policy header', () => {
      expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should have Permissions-Policy header', () => {
      expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
      expect(SECURITY_HEADERS['Permissions-Policy']).toContain('microphone=()');
    });
  });

  describe('CSP_PRODUCTION', () => {
    it('should include default-src self', () => {
      expect(CSP_PRODUCTION).toContain("default-src 'self'");
    });

    it('should include Google Analytics in connect-src', () => {
      expect(CSP_PRODUCTION).toContain('google-analytics.com');
    });

    it('should include Razorpay in frame-src', () => {
      expect(CSP_PRODUCTION).toContain('checkout.razorpay.com');
    });

    it('should block object-src', () => {
      expect(CSP_PRODUCTION).toContain("object-src 'none'");
    });

    it('should set frame-ancestors to self', () => {
      expect(CSP_PRODUCTION).toContain("frame-ancestors 'self'");
    });
  });

  describe('CSP_DEVELOPMENT', () => {
    it('should allow unsafe-eval for hot reload', () => {
      expect(CSP_DEVELOPMENT).toContain("'unsafe-eval'");
    });

    it('should allow all ws connections for dev', () => {
      expect(CSP_DEVELOPMENT).toContain('ws:');
      expect(CSP_DEVELOPMENT).toContain('wss:');
    });
  });

  describe('addSecurityHeaders', () => {
    it('should add all security headers to response', () => {
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      expect(secured.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secured.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should add CSP header', () => {
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      expect(secured.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should use production CSP in production', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'production';
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      const csp = secured.headers.get('Content-Security-Policy');
      expect(csp).toContain('google-analytics.com');
    });

    it('should use development CSP in development', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'development';
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      const csp = secured.headers.get('Content-Security-Policy');
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should add HSTS in production', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'production';
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      expect(secured.headers.get('Strict-Transport-Security')).toContain('max-age=');
    });

    it('should not add HSTS in development', () => {
      // @ts-expect-error - Test environment mocking
      process.env.NODE_ENV = 'development';
      const response = new NextResponse();
      const secured = addSecurityHeaders(response);

      expect(secured.headers.get('Strict-Transport-Security')).toBeNull();
    });
  });

  describe('secureResponse', () => {
    it('should create response with security headers', () => {
      const response = secureResponse(JSON.stringify({ test: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle null body', () => {
      const response = secureResponse(null, { status: 204 });

      expect(response.status).toBe(204);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});
