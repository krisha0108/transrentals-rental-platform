import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

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

// Track chat/Shivi interactions
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const {
      sessionId,
      interactionType,
      userMessage,
      botResponse,
      pagePath,
      pageTitle,
      serviceType,
      serviceName,
      bookingStep,
      kbArticleId,
      kbSearchQuery,
      kbMatchScore,
      outcome,
      responseTime,
    } = body;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    await prisma.chat_interactions.create({
      data: {
        sessionId: sessionId || `chat_${Date.now()}`,
        interactionType: interactionType || 'MESSAGE_SENT',
        userMessage: userMessage || null,
        botResponse: botResponse || null,
        pagePath: pagePath || '/',
        pageTitle: pageTitle || null,
        serviceType: serviceType || null,
        serviceName: serviceName || null,
        bookingStep: bookingStep || null,
        kbArticleId: kbArticleId || null,
        kbSearchQuery: kbSearchQuery || null,
        kbMatchScore: kbMatchScore || null,
        outcome: outcome || 'IN_PROGRESS',
        device,
        browser,
        responseTime: responseTime || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking chat interaction', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}

// Update chat outcome
export async function PATCH(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const { sessionId, outcome } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db/prisma');

    // Update all interactions in the session with the final outcome
    await prisma.chat_interactions.updateMany({
      where: { sessionId },
      data: { outcome: outcome || 'RESOLVED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating chat outcome', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}
