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

  let os = 'other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, os };
}

// Create or update active session
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const { searchParams } = new URL(request.url);
    const querySessionId = searchParams.get('sessionId');

    let body: Record<string, any> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      sessionId: bodySessionId,
      currentPage,
      pageTitle,
      referrer,
      utmSource,
      utmMedium,
      country,
      city,
      cleanup,
    } = body;

    const sessionId = bodySessionId || querySessionId;
    const normalizedSessionId = sessionId || `session_${Date.now()}`;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    if (cleanup && sessionId) {
      // Cleanup can be fire-and-forget too
      void prisma.active_sessions.delete({
        where: { sessionId },
      }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    // Fire-and-forget: session update/create happens in background
    void (async () => {
      try {
        const existingSession = await prisma.active_sessions.findUnique({
          where: { sessionId: normalizedSessionId },
        });

        if (existingSession) {
          await prisma.active_sessions.update({
            where: { sessionId: normalizedSessionId },
            data: {
              currentPage: currentPage || existingSession.currentPage,
              pageTitle: pageTitle || existingSession.pageTitle,
              lastActivity: new Date(),
              pageCount: existingSession.pageCount + 1,
            },
          });
        } else {
          await prisma.active_sessions.create({
            data: {
              id: generateId(),
              sessionId: normalizedSessionId,
              currentPage: currentPage || '/',
              pageTitle: pageTitle || null,
              device,
              browser,
              os,
              referrer: referrer || null,
              utmSource: utmSource || null,
              utmMedium: utmMedium || null,
              country: country || null,
              city: city || null,
            },
          });
        }
      } catch (err) {
        logger.error('Error managing session (background)', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error managing session', error);
    return NextResponse.json({ success: false, error: 'Failed to manage session' });
  }
}

// Update session engagement flags
export async function PATCH(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const { sessionId, hasInteracted, hasChatted, hasSubmittedForm } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' });
    }

    const { prisma } = await import('@/lib/db/prisma');

    // Fire-and-forget
    void prisma.active_sessions.updateMany({
      where: { sessionId },
      data: {
        ...(hasInteracted !== undefined && { hasInteracted }),
        ...(hasChatted !== undefined && { hasChatted }),
        ...(hasSubmittedForm !== undefined && { hasSubmittedForm }),
        lastActivity: new Date(),
      },
    }).catch((err) => logger.error('Error updating session (background)', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating session', error);
    return NextResponse.json({ success: false, error: 'Failed to update session' });
  }
}

// Delete session (on page unload/close)
export async function DELETE(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db/prisma');

    await prisma.active_sessions.delete({
      where: { sessionId },
    }).catch(() => {
      // Session might not exist, ignore
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting session', error);
    return NextResponse.json({ success: false, error: 'Failed to delete session' });
  }
}

// Get active sessions count (for real-time dashboard)
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ count: 0, sessions: [] });
  }

  try {
    const { prisma } = await import('@/lib/db/prisma');

    // Get sessions active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await prisma.active_sessions.findMany({
      where: {
        lastActivity: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    // Clean up old sessions (older than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.active_sessions.deleteMany({
      where: {
        lastActivity: {
          lt: thirtyMinutesAgo,
        },
      },
    });

    return NextResponse.json({
      count: activeSessions.length,
      sessions: activeSessions.map(s => ({
        currentPage: s.currentPage,
        pageTitle: s.pageTitle,
        device: s.device,
        browser: s.browser,
        country: s.country,
        pageCount: s.pageCount,
        startTime: s.startTime,
        lastActivity: s.lastActivity,
        hasInteracted: s.hasInteracted,
        hasChatted: s.hasChatted,
        hasSubmittedForm: s.hasSubmittedForm,
      })),
    });
  } catch (error) {
    logger.error('Error getting active sessions', error);
    return NextResponse.json({ count: 0, sessions: [] });
  }
}
