import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Parse user agent helper
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

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
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  return { device, browser };
}

// Track click events
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const {
      eventType,
      elementId,
      elementClass,
      elementText,
      pagePath,
      pageTitle,
      sectionId,
      targetUrl,
      isExternal,
      sessionId,
      positionX,
      positionY,
      scrollDepth,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    // Check if Prisma is available
    if (!prisma) {
      logger.debug('Prisma not available - analytics disabled');
      return NextResponse.json({ success: true, note: 'analytics-disabled' });
    }

    await prisma.click_events.create({
      data: {
        id: generateId(),
        eventType: eventType || 'OTHER',
        elementId: (typeof elementId === 'string' ? elementId.substring(0, 191) : null),
        elementClass: (typeof elementClass === 'string' ? elementClass.substring(0, 191) : null),
        elementText: (typeof elementText === 'string' ? elementText.substring(0, 200) : null),
        pagePath: (typeof pagePath === 'string' ? pagePath.substring(0, 500) : '/'),
        pageTitle: (typeof pageTitle === 'string' ? pageTitle.substring(0, 191) : null),
        sectionId: (typeof sectionId === 'string' ? sectionId.substring(0, 100) : null),
        targetUrl: (typeof targetUrl === 'string' ? targetUrl.substring(0, 500) : null),
        isExternal: isExternal || false,
        sessionId: (typeof sessionId === 'string' ? sessionId.substring(0, 100) : null),
        positionX: positionX || null,
        positionY: positionY || null,
        scrollDepth: scrollDepth || null,
        device,
        browser,
        utmSource: (typeof utmSource === 'string' ? utmSource.substring(0, 100) : null),
        utmMedium: (typeof utmMedium === 'string' ? utmMedium.substring(0, 100) : null),
        utmCampaign: (typeof utmCampaign === 'string' ? utmCampaign.substring(0, 100) : null),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking click event', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}

// Batch track multiple clicks (for scroll depth milestones, etc.)
export async function PUT(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: 'Events array required' }, { status: 400 });
    }

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    // Check if Prisma is available
    if (!prisma) {
      logger.debug('Prisma not available - analytics disabled');
      return NextResponse.json({ success: true, note: 'analytics-disabled' });
    }

    // Valid event types from Prisma enum
    const validEventTypes = [
      'BUTTON_CLICK', 'LINK_CLICK', 'CTA_CLICK', 'NAV_CLICK', 'FORM_SUBMIT',
      'CHAT_OPEN', 'PHONE_CLICK', 'EMAIL_CLICK', 'SOCIAL_CLICK', 'DOWNLOAD_CLICK',
      'VIDEO_PLAY', 'IMAGE_CLICK', 'SCROLL_DEPTH', 'OTHER'
    ] as const;
    type ClickType = typeof validEventTypes[number];

    // Helper to safely truncate strings
    const truncate = (val: unknown, maxLen: number): string | null => {
      if (typeof val === 'string') return val.substring(0, maxLen);
      return null;
    };

    // Create all events in batch
    await prisma.click_events.createMany({
      data: events.map((event: Record<string, unknown>) => ({
        id: generateId(),
        eventType: (validEventTypes.includes(event.eventType as ClickType) ? event.eventType : 'OTHER') as ClickType,
        elementId: truncate(event.elementId, 191),
        elementClass: truncate(event.elementClass, 191),
        elementText: truncate(event.elementText, 200),
        pagePath: truncate(event.pagePath, 500) || '/',
        pageTitle: truncate(event.pageTitle, 191),
        sectionId: truncate(event.sectionId, 100),
        targetUrl: truncate(event.targetUrl, 500),
        isExternal: (event.isExternal as boolean) || false,
        sessionId: truncate(event.sessionId, 100),
        positionX: (event.positionX as number) || null,
        positionY: (event.positionY as number) || null,
        scrollDepth: (event.scrollDepth as number) || null,
        device,
        browser,
        utmSource: truncate(event.utmSource, 100),
        utmMedium: truncate(event.utmMedium, 100),
        utmCampaign: truncate(event.utmCampaign, 100),
      })),
    });

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    logger.error('Error batch tracking clicks', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}
