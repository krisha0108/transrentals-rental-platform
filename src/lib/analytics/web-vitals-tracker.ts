import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * Web Vitals Tracker
 * Tracks Core Web Vitals and sends to analytics API
 *
 * Metrics:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity (deprecated, use INP)
 * - INP (Interaction to Next Paint): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Loading
 * - TTFB (Time to First Byte): Server response time
 */

interface WebVitalsData {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  pagePath: string;
  pageTitle: string;
  navigationType: string;
  connectionType?: string;
  deviceMemory?: number;
  sessionId?: string;
  timestamp: string;
}

// Thresholds for ratings (based on Google recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating based on metric value
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get session ID from sessionStorage
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get device/connection information
 */
function getDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  const nav = navigator as any;
  return {
    connectionType: nav.connection?.effectiveType || nav.connection?.type || 'unknown',
    deviceMemory: nav.deviceMemory,
  };
}

/**
 * Send metric to analytics API
 */
async function sendToAnalytics(metric: Metric) {
  try {
    const data: WebVitalsData = {
      metricName: metric.name,
      value: Math.round(metric.value),
      rating: getRating(metric.name, metric.value),
      pagePath: window.location.pathname,
      pageTitle: document.title,
      navigationType: metric.navigationType,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      ...getDeviceInfo(),
    };

    // Send to API endpoint
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true, // Ensures request completes even if page unloads
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: Math.round(metric.value),
        rating: data.rating,
        path: data.pagePath,
      });
    }
  } catch (error) {
    // Silent failure - don't break user experience
    if (process.env.NODE_ENV === 'development') {
      console.error('[Web Vitals] Failed to send metric:', error);
    }
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this in your root layout or _app.tsx
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    // Track all Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals] Tracking initialized');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Web Vitals] Initialization failed:', error);
    }
  }
}

/**
 * Get current Web Vitals scores (for display in dashboard)
 */
export async function getCurrentWebVitals() {
  try {
    const response = await fetch('/api/analytics/web-vitals?action=summary');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch Web Vitals:', error);
  }
  return null;
}

/**
 * Export metric thresholds for UI display
 */
export { THRESHOLDS };
