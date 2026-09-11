'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Generate a unique session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('tr_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('tr_session_id', sessionId);
  }
  return sessionId;
}

// Get UTM parameters from URL
function getUTMParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

// Determine click type based on element
function getClickType(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const href = element.getAttribute('href') || '';
  const text = element.textContent?.toLowerCase() || '';
  const classList = Array.from(element.classList).join(' ').toLowerCase();

  // Phone clicks
  if (href.startsWith('tel:')) return 'PHONE_CLICK';

  // Email clicks
  if (href.startsWith('mailto:')) return 'EMAIL_CLICK';

  // Social media links
  if (href.includes('facebook.com') || href.includes('twitter.com') ||
      href.includes('instagram.com') || href.includes('linkedin.com') ||
      href.includes('youtube.com') || href.includes('whatsapp.com')) {
    return 'SOCIAL_CLICK';
  }

  // Download links
  if (href.includes('download') || href.endsWith('.pdf') || href.endsWith('.doc') ||
      href.endsWith('.zip') || element.hasAttribute('download')) {
    return 'DOWNLOAD_CLICK';
  }

  // Video play
  if (tagName === 'video' || classList.includes('video') || classList.includes('play')) {
    return 'VIDEO_PLAY';
  }

  // CTA buttons
  if (classList.includes('cta') || classList.includes('btn-primary') ||
      text.includes('book now') || text.includes('get started') ||
      text.includes('call now') || text.includes('enquire') ||
      text.includes('submit') || text.includes('request')) {
    return 'CTA_CLICK';
  }

  // Form submit
  if (element.getAttribute('type') === 'submit' || classList.includes('submit')) {
    return 'FORM_SUBMIT';
  }

  // Navigation clicks
  if (element.closest('nav') || element.closest('header') ||
      classList.includes('nav') || classList.includes('menu')) {
    return 'NAV_CLICK';
  }

  // Button clicks
  if (tagName === 'button' || element.getAttribute('role') === 'button') {
    return 'BUTTON_CLICK';
  }

  // Link clicks
  if (tagName === 'a') return 'LINK_CLICK';

  // Image clicks
  if (tagName === 'img' || element.closest('figure')) return 'IMAGE_CLICK';

  return 'OTHER';
}

// Get section ID from element
function getSectionId(element: HTMLElement): string | undefined {
  // Check parent sections for IDs
  let current: HTMLElement | null = element;
  while (current) {
    if (current.id) return current.id;
    if (current.getAttribute('data-section')) return current.getAttribute('data-section') || undefined;
    current = current.parentElement;
  }

  // Try to determine section from common class names
  const section = element.closest('header, footer, nav, main, aside, section');
  if (section) {
    if (section.tagName === 'HEADER') return 'header';
    if (section.tagName === 'FOOTER') return 'footer';
    if (section.tagName === 'NAV') return 'navigation';
    if (section.id) return section.id;
  }

  return undefined;
}

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  inp: { good: 200, poor: 500 },
  ttfb: { good: 800, poor: 1800 },
};

function VisitorTrackerInner() {
  // usePathname() is typed as nullable. An unguarded `pathname.startsWith(...)` would
  // throw and take the whole tracker down with it — and this component is the only
  // source of page_views, click_events and web_vitals, so a crash here silently empties
  // every analytics page. Normalise to '' and let the effects below bail out.
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>('');
  const scrollMilestonesRef = useRef<Set<number>>(new Set());
  const vitalsReportedRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>('');

  // Get session ID on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Track page view
  const trackPageView = useCallback(async (path: string) => {
    const sessionId = sessionIdRef.current;
    const referrer = document.referrer || '';
    const utm = getUTMParams();

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          referrer,
          sessionId,
          ...utm,
        }),
      });

      // Update active session
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentPage: path,
          pageTitle: document.title,
          referrer,
          ...utm,
        }),
      });
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }, []);

  // Track duration
  const trackDuration = useCallback(async (path: string, duration: number) => {
    const sessionId = sessionIdRef.current;
    if (duration > 0 && duration < 3600) {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            sessionId,
            duration,
          }),
        });
      } catch {
        // Silently fail
      }
    }
  }, []);

  // Track click event
  const trackClick = useCallback(async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Find the clickable element (could be a child of the actual clickable)
    const clickable = target.closest('a, button, [role="button"], [onclick]') as HTMLElement || target;

    const eventType = getClickType(clickable);
    const href = clickable.getAttribute('href') || '';
    const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);

    // Skip tracking for internal navigation (handled by page view tracking)
    if (eventType === 'LINK_CLICK' && !isExternal && href.startsWith('/')) {
      return;
    }

    const sessionId = sessionIdRef.current;
    const utm = getUTMParams();

    try {
      await fetch('/api/analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          elementId: clickable.id || undefined,
          elementClass: clickable.className || undefined,
          elementText: clickable.textContent?.substring(0, 100)?.trim() || undefined,
          pagePath: pathname,
          pageTitle: document.title,
          sectionId: getSectionId(clickable),
          targetUrl: href || undefined,
          isExternal,
          sessionId,
          positionX: event.clientX,
          positionY: event.clientY,
          ...utm,
        }),
      });

      // Update session interaction flag
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          hasInteracted: true,
        }),
      });
    } catch (error) {
      console.debug('Click tracking failed:', error);
    }
  }, [pathname]);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    // Track milestones: 25%, 50%, 75%, 90%, 100%
    const milestones = [25, 50, 75, 90, 100];
    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
        scrollMilestonesRef.current.add(milestone);

        const sessionId = sessionIdRef.current;
        const utm = getUTMParams();

        fetch('/api/analytics/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'SCROLL_DEPTH',
            pagePath: pathname,
            pageTitle: document.title,
            scrollDepth: milestone,
            sessionId,
            ...utm,
          }),
        }).catch(() => {});
      }
    }
  }, [pathname]);

  // Track Web Vitals
  const trackWebVitals = useCallback(async () => {
    if (vitalsReportedRef.current) return;

    // Wait for page to fully load
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => trackWebVitals(), { once: true });
      return;
    }

    const sessionId = sessionIdRef.current;

    // Get performance entries
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Calculate metrics
    const ttfb = navigation?.responseStart || 0;
    const domLoad = navigation?.domContentLoadedEventEnd || 0;
    const windowLoad = navigation?.loadEventEnd || 0;

    // FCP from paint entries
    const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
    const fcp = fcpEntry?.startTime || 0;

    // Resource stats
    const resourceCount = resources.length;
    const resourceSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);

    // Get connection info
    interface NetworkInfo {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    }
    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;

    // Use PerformanceObserver for LCP, CLS, INP
    let lcp = 0;
    let cls = 0;
    let inp = 0;
    let fid = 0;

    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          lcp = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    // Observe CLS
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            cls += (entry as PerformanceEntry & { value?: number }).value || 0;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }

    // Observe FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          fid = (entries[0] as PerformanceEntry & { processingStart?: number }).processingStart
            ? (entries[0] as PerformanceEntry & { processingStart: number }).processingStart - entries[0].startTime
            : 0;
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }

    // Observe INP
    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration || 0;
          if (duration > inp) {
            inp = duration;
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true });
    } catch {
      // INP not supported
    }

    // Wait a bit for observers to collect data
    setTimeout(async () => {
      if (vitalsReportedRef.current) return;
      vitalsReportedRef.current = true;

      try {
        await fetch('/api/analytics/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagePath: pathname,
            pageTitle: document.title,
            lcp: lcp > 0 ? lcp : null,
            fid: fid > 0 ? fid : null,
            cls: cls > 0 ? cls : null,
            fcp: fcp > 0 ? fcp : null,
            ttfb: ttfb > 0 ? ttfb : null,
            inp: inp > 0 ? inp : null,
            domLoad: domLoad > 0 ? domLoad : null,
            windowLoad: windowLoad > 0 ? windowLoad : null,
            resourceCount,
            resourceSize,
            connectionType: connection?.type || null,
            effectiveType: connection?.effectiveType || null,
            downlink: connection?.downlink || null,
            rtt: connection?.rtt || null,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            sessionId,
          }),
        });
      } catch (error) {
        console.debug('Web vitals tracking failed:', error);
      }
    }, 3000); // Wait 3 seconds for metrics to stabilize
  }, [pathname]);

  // Main effect for page tracking
  useEffect(() => {
    // Skip tracking for admin pages
    if (!pathname || pathname.startsWith('/admin')) return;

    const trackPrevDuration = async () => {
      if (lastPathRef.current && lastPathRef.current !== pathname) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        await trackDuration(lastPathRef.current, duration);
      }
    };

    // Track duration of previous page, then track new page view when idle
    const startTracking = () => {
      trackPrevDuration().then(() => {
        trackPageView(pathname);
        startTimeRef.current = Date.now();
        lastPathRef.current = pathname;
        scrollMilestonesRef.current.clear();
        vitalsReportedRef.current = false;

        // Track web vitals for this page
        trackWebVitals();
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => startTracking());
    } else {
      setTimeout(startTracking, 200);
    }

    // Track duration when user leaves the page
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration > 0 && duration < 3600) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            path: pathname,
            sessionId: sessionIdRef.current,
            duration,
          })
        );

        // Clean up session
        navigator.sendBeacon(
          '/api/analytics/session',
          JSON.stringify({
            sessionId: sessionIdRef.current,
            cleanup: true,
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, searchParams, trackPageView, trackDuration, trackWebVitals]);

  // Click tracking effect
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    document.addEventListener('click', trackClick, { capture: true });

    return () => {
      document.removeEventListener('click', trackClick, { capture: true });
    };
  }, [pathname, trackClick]);

  // Scroll tracking effect
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          trackScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, trackScrollDepth]);

  return null; // This component doesn't render anything
}

// Wrap VisitorTrackerInner in Suspense for Next.js 14 static generation
export default function VisitorTracker() {
  return (
    <Suspense fallback={null}>
      <VisitorTrackerInner />
    </Suspense>
  );
}

// Export helper for tracking form submissions from other components
export async function trackFormSubmission(data: {
  formType: string;
  formName: string;
  pagePath: string;
  pageTitle?: string;
  serviceType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?: string;
  errorMessage?: string;
  timeToFill?: number;
}) {
  const sessionId = getSessionId();
  const utm = getUTMParams();

  try {
    await fetch('/api/analytics/form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        sessionId,
        referrer: document.referrer,
        ...utm,
      }),
    });

    // Update session
    await fetch('/api/analytics/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        hasSubmittedForm: true,
      }),
    });
  } catch (error) {
    console.debug('Form tracking failed:', error);
  }
}

// Export helper for tracking chat interactions
export async function trackChatInteraction(data: {
  interactionType: string;
  userMessage?: string;
  botResponse?: string;
  pagePath: string;
  pageTitle?: string;
  serviceType?: string;
  serviceName?: string;
  bookingStep?: string;
  kbArticleId?: string;
  kbSearchQuery?: string;
  kbMatchScore?: number;
  outcome?: string;
  responseTime?: number;
}) {
  const sessionId = getSessionId();

  try {
    await fetch('/api/analytics/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        sessionId: `chat_${sessionId}`,
      }),
    });

    // Update session
    await fetch('/api/analytics/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        hasChatted: true,
      }),
    });
  } catch (error) {
    console.debug('Chat tracking failed:', error);
  }
}

// Export helper for updating chat outcome
export async function updateChatOutcome(outcome: string) {
  const sessionId = getSessionId();

  try {
    await fetch('/api/analytics/chat', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `chat_${sessionId}`,
        outcome,
      }),
    });
  } catch (error) {
    console.debug('Chat outcome update failed:', error);
  }
}
