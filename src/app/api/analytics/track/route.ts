import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { PrismaClient } from '@prisma/client';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Parse user agent to extract device, browser, and OS info
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // Detect device
  let device = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'tablet';
  }

  // Detect browser
  let browser = 'other';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Detect OS
  let os = 'other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, os };
}

// Hash IP for privacy
function hashIP(ip: string): string {
  // Simple hash - in production use crypto
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

let cachedPrisma: PrismaClient | null = null;

async function getPrismaClient(): Promise<PrismaClient> {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  const { prisma } = await import('@/lib/db/prisma');
  cachedPrisma = prisma;
  return prisma;
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    logger.warn('Analytics tracking skipped because DATABASE_URL is not configured.');
    return NextResponse.json({
      success: true,
      note: 'analytics-disabled',
    });
  }

  const body = await request.json();
  const { path, referrer, sessionId, duration } = body;

  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');

  // Get IP address (anonymized)
  const ip = forwardedFor?.split(',')[0] || realIP || 'unknown';
  const hashedIP = hashIP(ip);

  // Parse user agent
  const { device, browser, os } = parseUserAgent(userAgent);

  const prisma = await getPrismaClient();

  try {
    // Create page view record
    await prisma.page_views.create({
      data: {
        path: path || '/',
        referrer: referrer || null,
        userAgent: userAgent.substring(0, 500), // Limit length
        ipAddress: hashedIP,
        device,
        browser,
        os,
        sessionId: sessionId || null,
        duration: duration || null,
      },
    });
  } catch (error) {
    logger.error('Error tracking page view', error);
  }

  return NextResponse.json({ success: true });
}
