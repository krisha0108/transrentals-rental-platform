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

  let os = 'other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, os };
}

// Track form submissions
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const {
      formType,
      formName,
      pagePath,
      pageTitle,
      sessionId,
      serviceType,
      pickupLocation,
      dropLocation,
      status,
      errorMessage,
      timeToFill,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
    } = body;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    await prisma.form_submissions.create({
      data: {
        formType: formType || 'OTHER',
        formName: formName || 'Unknown',
        pagePath: pagePath || '/',
        pageTitle: pageTitle || null,
        sessionId: sessionId || null,
        serviceType: serviceType || null,
        pickupLocation: pickupLocation || null,
        dropLocation: dropLocation || null,
        status: status || 'SUBMITTED',
        errorMessage: errorMessage || null,
        device,
        browser,
        os,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        timeToFill: timeToFill || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking form submission', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}
