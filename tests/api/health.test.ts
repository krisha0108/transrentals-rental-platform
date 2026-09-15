/**
 * API Health Check Tests
 * Tests critical API endpoints before deployment
 */

import { describe, it, expect } from 'vitest';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Critical API Endpoints', () => {
  // Health check endpoint
  it('should have a working health check endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  // Database connectivity
  it('should connect to database', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    expect(data).toHaveProperty('database');
    expect(data.database).toBe('connected');
  });
});

describe('Public API Endpoints', () => {
  // Services endpoint
  it('GET /api/services should return services list', async () => {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.services)).toBe(true);
  });

  // Locations endpoint
  it('GET /api/locations should return locations', async () => {
    const response = await fetch(`${API_BASE_URL}/api/locations`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.locations)).toBe(true);
  });
});

describe('Authentication Endpoints', () => {
  // Customer auth endpoint exists
  it('POST /api/customer/auth should exist', async () => {
    const response = await fetch(`${API_BASE_URL}/api/customer/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' })
    });
    // Should not be 404 (endpoint exists)
    expect(response.status).not.toBe(404);
  });

  // Vendor auth endpoint exists
  it('POST /api/vendor/auth/login should exist', async () => {
    const response = await fetch(`${API_BASE_URL}/api/vendor/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' })
    });
    // Should not be 404 (endpoint exists)
    expect(response.status).not.toBe(404);
  });
});
