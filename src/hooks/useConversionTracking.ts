'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Get attribution data from URL params and referrer
function getAttributionData() {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const landingPage = sessionStorage.getItem('landing_page') || window.location.pathname;

  // Store landing page on first visit
  if (!sessionStorage.getItem('landing_page')) {
    sessionStorage.setItem('landing_page', window.location.pathname);
  }

  return {
    source: params.get('utm_source') || sessionStorage.getItem('utm_source') || getSource(),
    medium: params.get('utm_medium') || sessionStorage.getItem('utm_medium') || null,
    campaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || null,
    keyword: params.get('keyword') || params.get('q') || sessionStorage.getItem('keyword') || null,
    landingPage,
    referrer: document.referrer || null,
  };
}

// Detect traffic source
function getSource(): string {
  if (typeof window === 'undefined') return 'direct';

  const referrer = document.referrer.toLowerCase();
  if (!referrer) return 'direct';

  if (referrer.includes('google')) return 'google';
  if (referrer.includes('facebook') || referrer.includes('fb.com')) return 'facebook';
  if (referrer.includes('instagram')) return 'instagram';
  if (referrer.includes('twitter') || referrer.includes('t.co')) return 'twitter';
  if (referrer.includes('linkedin')) return 'linkedin';

  return 'referral';
}

// Get device info
function getDeviceInfo() {
  if (typeof window === 'undefined') return {};

  const ua = navigator.userAgent.toLowerCase();

  let device = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'tablet';
  }

  let browser = 'other';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';

  let os = 'other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, os };
}

type ConversionEventType =
  | 'PAGE_VISIT'
  | 'SEARCH'
  | 'FILTER_APPLIED'
  | 'QUOTE_VIEW'
  | 'QUOTE_REQUEST'
  | 'QUOTE_RECEIVED'
  | 'BOOKING_INITIATED'
  | 'BOOKING_COMPLETED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'FORM_SUBMITTED'
  | 'CTA_CLICKED'
  | 'CHAT_OPENED'
  | 'PHONE_CLICKED'
  | 'EMAIL_CLICKED';

interface TrackEventOptions {
  eventType: ConversionEventType;
  eventData?: Record<string, any>;
  bookingId?: string;
  bookingType?: string;
  bookingValue?: number;
}

export function useConversionTracking() {
  const pathname = usePathname();
  const previousPath = useRef<string>('');
  const pageStartTime = useRef<number>(Date.now());

  // Track page visits
  useEffect(() => {
    if (!pathname) return;

    const sessionId = getSessionId();
    const attribution = getAttributionData();
    const deviceInfo = getDeviceInfo();

    // Track page visit event
    fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'event',
        data: {
          sessionId,
          eventType: 'PAGE_VISIT',
          pagePath: pathname,
          pageTitle: document.title,
          ...attribution,
          ...deviceInfo,
        },
      }),
    }).catch(console.error);

    // Track user flow
    if (previousPath.current && previousPath.current !== pathname) {
      const timeOnPage = Date.now() - pageStartTime.current;

      fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flow',
          data: {
            sessionId,
            fromPage: previousPath.current,
            toPage: pathname,
            timeOnPage,
            ...deviceInfo,
            source: attribution.source,
          },
        }),
      }).catch(console.error);
    }

    previousPath.current = pathname;
    pageStartTime.current = Date.now();
  }, [pathname]);

  // Track custom events
  const trackEvent = useCallback((options: TrackEventOptions) => {
    const sessionId = getSessionId();
    const attribution = getAttributionData();
    const deviceInfo = getDeviceInfo();

    fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'event',
        data: {
          sessionId,
          eventType: options.eventType,
          pagePath: window.location.pathname,
          pageTitle: document.title,
          eventData: options.eventData,
          bookingId: options.bookingId,
          bookingType: options.bookingType,
          bookingValue: options.bookingValue,
          ...attribution,
          ...deviceInfo,
        },
      }),
    }).catch(console.error);
  }, []);

  // Track search
  const trackSearch = useCallback((query: string, filters?: Record<string, any>) => {
    trackEvent({
      eventType: 'SEARCH',
      eventData: { query, filters },
    });

    // Also track keyword impression
    if (query) {
      fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'keyword_impression',
          data: { keyword: query.toLowerCase() },
        }),
      }).catch(console.error);
    }
  }, [trackEvent]);

  // Track filter application
  const trackFilter = useCallback((filterType: string, filterValue: any) => {
    trackEvent({
      eventType: 'FILTER_APPLIED',
      eventData: { filterType, filterValue },
    });
  }, [trackEvent]);

  // Track quote view
  const trackQuoteView = useCallback((quoteId: string, quoteType: string) => {
    trackEvent({
      eventType: 'QUOTE_VIEW',
      eventData: { quoteId, quoteType },
    });
  }, [trackEvent]);

  // Track quote request
  const trackQuoteRequest = useCallback((quoteType: string, formData: Record<string, any>) => {
    trackEvent({
      eventType: 'QUOTE_REQUEST',
      eventData: { quoteType, ...formData },
    });
  }, [trackEvent]);

  // Track booking initiation
  const trackBookingInitiated = useCallback((bookingType: string, bookingData: Record<string, any>) => {
    trackEvent({
      eventType: 'BOOKING_INITIATED',
      bookingType,
      eventData: bookingData,
    });
  }, [trackEvent]);

  // Track booking completion
  const trackBookingCompleted = useCallback((
    bookingId: string,
    bookingType: string,
    bookingValue: number,
    commission?: number
  ) => {
    const sessionId = getSessionId();
    const attribution = getAttributionData();

    // Track booking event
    trackEvent({
      eventType: 'BOOKING_COMPLETED',
      bookingId,
      bookingType,
      bookingValue,
      eventData: { commission },
    });

    // Create booking attribution
    fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'booking_attribution',
        data: {
          bookingId,
          bookingType,
          sessionId,
          bookingValue,
          commission,
        },
      }),
    }).catch(console.error);

    // Track keyword conversion if applicable
    if (attribution.keyword) {
      fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'keyword_conversion',
          data: {
            keyword: attribution.keyword,
            revenue: bookingValue,
          },
        }),
      }).catch(console.error);
    }
  }, [trackEvent]);

  // Track payment events
  const trackPaymentInitiated = useCallback((bookingId: string, amount: number) => {
    trackEvent({
      eventType: 'PAYMENT_INITIATED',
      bookingId,
      bookingValue: amount,
    });
  }, [trackEvent]);

  const trackPaymentCompleted = useCallback((bookingId: string, amount: number) => {
    trackEvent({
      eventType: 'PAYMENT_COMPLETED',
      bookingId,
      bookingValue: amount,
    });
  }, [trackEvent]);

  // Track CTA clicks
  const trackCTAClick = useCallback((ctaName: string, ctaLocation: string) => {
    trackEvent({
      eventType: 'CTA_CLICKED',
      eventData: { ctaName, ctaLocation },
    });
  }, [trackEvent]);

  // Track form submission
  const trackFormSubmit = useCallback((formName: string, formData?: Record<string, any>) => {
    trackEvent({
      eventType: 'FORM_SUBMITTED',
      eventData: { formName, ...formData },
    });
  }, [trackEvent]);

  // Track chat opened
  const trackChatOpened = useCallback(() => {
    trackEvent({
      eventType: 'CHAT_OPENED',
    });
  }, [trackEvent]);

  // Track phone click
  const trackPhoneClick = useCallback((phoneNumber: string) => {
    trackEvent({
      eventType: 'PHONE_CLICKED',
      eventData: { phoneNumber },
    });
  }, [trackEvent]);

  // Track email click
  const trackEmailClick = useCallback((email: string) => {
    trackEvent({
      eventType: 'EMAIL_CLICKED',
      eventData: { email },
    });
  }, [trackEvent]);

  // Track funnel steps
  const trackFunnelStep = useCallback((
    funnelName: string,
    step: string,
    stepOrder: number,
    action: 'visit' | 'convert' | 'dropoff'
  ) => {
    fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'funnel',
        data: { funnelName, step, stepOrder, action },
      }),
    }).catch(console.error);
  }, []);

  return {
    trackEvent,
    trackSearch,
    trackFilter,
    trackQuoteView,
    trackQuoteRequest,
    trackBookingInitiated,
    trackBookingCompleted,
    trackPaymentInitiated,
    trackPaymentCompleted,
    trackCTAClick,
    trackFormSubmit,
    trackChatOpened,
    trackPhoneClick,
    trackEmailClick,
    trackFunnelStep,
  };
}
