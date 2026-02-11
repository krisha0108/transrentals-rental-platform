import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

// Helper to generate unique IDs
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export type ConversionEventType =
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

export interface TrackEventParams {
  sessionId: string;
  eventType: ConversionEventType;
  pagePath: string;
  pageTitle?: string;
  eventData?: Record<string, any>;

  // Attribution
  source?: string;
  medium?: string;
  campaign?: string;
  keyword?: string;
  landingPage?: string;
  referrer?: string;

  // User context
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;

  // Booking reference
  bookingId?: string;
  bookingType?: string;
  bookingValue?: number;
}

export interface TrackFlowParams {
  sessionId: string;
  fromPage: string;
  toPage: string;
  device?: string;
  source?: string;
  timeOnPage?: number;
}

export interface BookingAttributionParams {
  bookingId: string;
  bookingType: string;
  sessionId: string;
  bookingValue?: number;
  commission?: number;
}

/**
 * Track a conversion event
 */
export async function trackConversionEvent(params: TrackEventParams): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    await prisma.conversion_events.create({
      data: {
        id: generateId(),
        sessionId: params.sessionId,
        eventType: params.eventType,
        eventData: params.eventData || null,
        pagePath: params.pagePath,
        pageTitle: params.pageTitle || null,
        source: params.source || null,
        medium: params.medium || null,
        campaign: params.campaign || null,
        keyword: params.keyword || null,
        landingPage: params.landingPage || null,
        referrer: params.referrer || null,
        device: params.device || null,
        browser: params.browser || null,
        os: params.os || null,
        country: params.country || null,
        city: params.city || null,
        bookingId: params.bookingId || null,
        bookingType: params.bookingType || null,
        bookingValue: params.bookingValue || null,
      },
    });
  } catch (error) {
    console.error('[ConversionTracking] Error tracking event:', error);
  }
}

/**
 * Track user flow (page-to-page navigation)
 */
export async function trackUserFlow(params: TrackFlowParams): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    await prisma.user_flow.create({
      data: {
        id: generateId(),
        sessionId: params.sessionId,
        fromPage: params.fromPage,
        toPage: params.toPage,
        device: params.device || null,
        source: params.source || null,
        timeOnPage: params.timeOnPage || null,
      },
    });
  } catch (error) {
    console.error('[ConversionTracking] Error tracking flow:', error);
  }
}

/**
 * Create booking attribution record
 */
export async function createBookingAttribution(
  params: BookingAttributionParams
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    // Get first and last touch attribution from conversion_events
    const events = await prisma.conversion_events.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { timestamp: 'asc' },
    });

    if (events.length === 0) return;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    // Count total sessions and page views
    const sessionEvents = await prisma.conversion_events.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: params.sessionId,
        eventType: 'PAGE_VISIT',
      },
    });

    const pageViews = await prisma.conversion_events.count({
      where: {
        sessionId: params.sessionId,
        eventType: 'PAGE_VISIT',
      },
    });

    // Calculate time to convert
    const timeToConvert = Math.floor(
      (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / 1000
    );

    // Create attribution record
    await prisma.booking_attribution.create({
      data: {
        id: generateId(),
        bookingId: params.bookingId,
        bookingType: params.bookingType,
        sessionId: params.sessionId,
        firstSource: firstEvent.source,
        firstMedium: firstEvent.medium,
        firstKeyword: firstEvent.keyword,
        firstLandingPage: firstEvent.landingPage,
        firstVisit: firstEvent.timestamp,
        lastSource: lastEvent.source,
        lastMedium: lastEvent.medium,
        lastKeyword: lastEvent.keyword,
        lastLandingPage: lastEvent.pagePath,
        lastVisit: lastEvent.timestamp,
        totalSessions: sessionEvents.length,
        totalPageViews: pageViews,
        timeToConvert,
        touchpoints: events.map((e) => ({
          eventType: e.eventType,
          pagePath: e.pagePath,
          timestamp: e.timestamp,
          source: e.source,
        })),
        bookingValue: params.bookingValue || null,
        commission: params.commission || null,
      },
    });
  } catch (error) {
    console.error('[ConversionTracking] Error creating attribution:', error);
  }
}

/**
 * Update keyword performance metrics
 */
export async function updateKeywordPerformance(keyword: string): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create keyword performance record
    const existing = await prisma.keyword_performance.findUnique({
      where: {
        keyword_date: {
          keyword,
          date: today,
        },
      },
    });

    if (existing) {
      await prisma.keyword_performance.update({
        where: {
          keyword_date: {
            keyword,
            date: today,
          },
        },
        data: {
          impressions: { increment: 1 },
        },
      });
    } else {
      await prisma.keyword_performance.create({
        data: {
          id: generateId(),
          keyword,
          date: today,
          impressions: 1,
        },
      });
    }
  } catch (error) {
    console.error('[ConversionTracking] Error updating keyword:', error);
  }
}

/**
 * Record keyword click
 */
export async function recordKeywordClick(keyword: string): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.keyword_performance.updateMany({
      where: {
        keyword,
        date: today,
      },
      data: {
        clicks: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('[ConversionTracking] Error recording click:', error);
  }
}

/**
 * Record keyword conversion
 */
export async function recordKeywordConversion(
  keyword: string,
  revenue?: number
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.keyword_performance.findUnique({
      where: {
        keyword_date: {
          keyword,
          date: today,
        },
      },
    });

    if (existing) {
      const newConversions = existing.conversions + 1;
      const newRevenue = (existing.revenue || 0) + (revenue || 0);
      const conversionRate = (newConversions / existing.clicks) * 100;

      await prisma.keyword_performance.update({
        where: {
          keyword_date: {
            keyword,
            date: today,
          },
        },
        data: {
          conversions: newConversions,
          revenue: newRevenue,
          conversionRate,
        },
      });
    }
  } catch (error) {
    console.error('[ConversionTracking] Error recording conversion:', error);
  }
}

/**
 * Update funnel analytics
 */
export async function updateFunnelAnalytics(
  funnelName: string,
  step: string,
  stepOrder: number,
  action: 'visit' | 'convert' | 'dropoff'
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.funnel_analytics.findUnique({
      where: {
        funnelName_step_date: {
          funnelName,
          step,
          date: today,
        },
      },
    });

    if (existing) {
      const updates: any = {};

      if (action === 'visit') updates.visitors = { increment: 1 };
      if (action === 'convert') updates.conversions = { increment: 1 };
      if (action === 'dropoff') updates.dropOffs = { increment: 1 };

      await prisma.funnel_analytics.update({
        where: {
          funnelName_step_date: {
            funnelName,
            step,
            date: today,
          },
        },
        data: updates,
      });

      // Calculate conversion rate
      if (action === 'convert' || action === 'visit') {
        const updated = await prisma.funnel_analytics.findUnique({
          where: {
            funnelName_step_date: {
              funnelName,
              step,
              date: today,
            },
          },
        });

        if (updated && updated.visitors > 0) {
          const conversionRate = (updated.conversions / updated.visitors) * 100;
          await prisma.funnel_analytics.update({
            where: {
              funnelName_step_date: {
                funnelName,
                step,
                date: today,
              },
            },
            data: { conversionRate },
          });
        }
      }
    } else {
      await prisma.funnel_analytics.create({
        data: {
          id: generateId(),
          funnelName,
          step,
          stepOrder,
          date: today,
          visitors: action === 'visit' ? 1 : 0,
          conversions: action === 'convert' ? 1 : 0,
          dropOffs: action === 'dropoff' ? 1 : 0,
        },
      });
    }
  } catch (error) {
    console.error('[ConversionTracking] Error updating funnel:', error);
  }
}
