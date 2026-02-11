import { NextRequest, NextResponse } from 'next/server';
import {
  trackConversionEvent,
  trackUserFlow,
  createBookingAttribution,
  updateKeywordPerformance,
  recordKeywordClick,
  recordKeywordConversion,
  updateFunnelAnalytics,
  type ConversionEventType,
} from '@/lib/analytics/conversion-tracking';

export const dynamic = 'force-dynamic';

/**
 * Track conversion events, flows, and attribution
 * POST /api/analytics/conversion
 */
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'event':
        await trackConversionEvent({
          sessionId: data.sessionId,
          eventType: data.eventType as ConversionEventType,
          pagePath: data.pagePath,
          pageTitle: data.pageTitle,
          eventData: data.eventData,
          source: data.source,
          medium: data.medium,
          campaign: data.campaign,
          keyword: data.keyword,
          landingPage: data.landingPage,
          referrer: data.referrer,
          device: data.device,
          browser: data.browser,
          os: data.os,
          country: data.country,
          city: data.city,
          bookingId: data.bookingId,
          bookingType: data.bookingType,
          bookingValue: data.bookingValue,
        });
        break;

      case 'flow':
        await trackUserFlow({
          sessionId: data.sessionId,
          fromPage: data.fromPage,
          toPage: data.toPage,
          device: data.device,
          source: data.source,
          timeOnPage: data.timeOnPage,
        });
        break;

      case 'booking_attribution':
        await createBookingAttribution({
          bookingId: data.bookingId,
          bookingType: data.bookingType,
          sessionId: data.sessionId,
          bookingValue: data.bookingValue,
          commission: data.commission,
        });
        break;

      case 'keyword_impression':
        await updateKeywordPerformance(data.keyword);
        break;

      case 'keyword_click':
        await recordKeywordClick(data.keyword);
        break;

      case 'keyword_conversion':
        await recordKeywordConversion(data.keyword, data.revenue);
        break;

      case 'funnel':
        await updateFunnelAnalytics(
          data.funnelName,
          data.step,
          data.stepOrder,
          data.action
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics Conversion] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
