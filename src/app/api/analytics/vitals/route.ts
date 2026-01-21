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
  let browserVersion = '';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  let os = 'other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, browserVersion, os };
}

// Rate Core Web Vitals
function rateVital(metric: string, value: number): 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' {
  switch (metric) {
    case 'lcp':
      if (value <= 2500) return 'GOOD';
      if (value <= 4000) return 'NEEDS_IMPROVEMENT';
      return 'POOR';
    case 'fid':
      if (value <= 100) return 'GOOD';
      if (value <= 300) return 'NEEDS_IMPROVEMENT';
      return 'POOR';
    case 'cls':
      if (value <= 0.1) return 'GOOD';
      if (value <= 0.25) return 'NEEDS_IMPROVEMENT';
      return 'POOR';
    case 'fcp':
      if (value <= 1800) return 'GOOD';
      if (value <= 3000) return 'NEEDS_IMPROVEMENT';
      return 'POOR';
    case 'inp':
      if (value <= 200) return 'GOOD';
      if (value <= 500) return 'NEEDS_IMPROVEMENT';
      return 'POOR';
    default:
      return 'GOOD';
  }
}

// Track Web Vitals
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, note: 'analytics-disabled' });
  }

  try {
    const body = await request.json();
    const {
      pagePath,
      pageTitle,
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      inp,
      domLoad,
      windowLoad,
      resourceCount,
      resourceSize,
      connectionType,
      effectiveType,
      downlink,
      rtt,
      screenWidth,
      screenHeight,
      sessionId,
    } = body;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser, browserVersion, os } = parseUserAgent(userAgent);

    const { prisma } = await import('@/lib/db/prisma');

    // Check if Prisma is available
    if (!prisma) {
      logger.debug('Prisma not available - analytics disabled');
      return NextResponse.json({ success: true, note: 'analytics-disabled' });
    }

    // Create web vitals record
    const vitalsRecord = await prisma.web_vitals.create({
      data: {
        pagePath: pagePath || '/',
        pageTitle: pageTitle || null,
        lcp: lcp || null,
        fid: fid || null,
        cls: cls || null,
        fcp: fcp || null,
        ttfb: ttfb || null,
        inp: inp || null,
        domLoad: domLoad || null,
        windowLoad: windowLoad || null,
        resourceCount: resourceCount || null,
        resourceSize: resourceSize || null,
        connectionType: connectionType || null,
        effectiveType: effectiveType || null,
        downlink: downlink || null,
        rtt: rtt || null,
        device,
        browser,
        browserVersion,
        os,
        screenWidth: screenWidth || null,
        screenHeight: screenHeight || null,
        sessionId: sessionId || null,
        lcpRating: lcp ? rateVital('lcp', lcp) : null,
        fidRating: fid ? rateVital('fid', fid) : null,
        clsRating: cls ? rateVital('cls', cls) : null,
        fcpRating: fcp ? rateVital('fcp', fcp) : null,
        inpRating: inp ? rateVital('inp', inp) : null,
      },
    });

    // Update page performance aggregate
    await updatePagePerformance(prisma, pagePath, {
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      inp,
      lcpRating: lcp ? rateVital('lcp', lcp) : null,
      fidRating: fid ? rateVital('fid', fid) : null,
      clsRating: cls ? rateVital('cls', cls) : null,
    });

    return NextResponse.json({ success: true, id: vitalsRecord.id });
  } catch (error) {
    logger.error('Error tracking web vitals', error);
    // Return 200 with success: false to avoid breaking the frontend
    return NextResponse.json({ success: false, note: 'analytics-error' });
  }
}

async function updatePagePerformance(prisma: any, pagePath: string, vitals: {
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  fcp?: number | null;
  ttfb?: number | null;
  inp?: number | null;
  lcpRating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | null;
  fidRating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | null;
  clsRating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | null;
}) {
  try {
    // Try to find existing page performance record
    const existing = await prisma.page_performance.findUnique({
      where: { pagePath },
    });

    if (existing) {
      // Update running averages
      const totalViews = existing.totalViews + 1;

      // Calculate new averages
      const updateAvg = (oldAvg: number | null, newVal: number | null, count: number) => {
        if (newVal === null) return oldAvg;
        if (oldAvg === null) return newVal;
        return ((oldAvg * (count - 1)) + newVal) / count;
      };

      // Increment rating counts
      const lcpGood = existing.lcpGood + (vitals.lcpRating === 'GOOD' ? 1 : 0);
      const lcpNeedsWork = existing.lcpNeedsWork + (vitals.lcpRating === 'NEEDS_IMPROVEMENT' ? 1 : 0);
      const lcpPoor = existing.lcpPoor + (vitals.lcpRating === 'POOR' ? 1 : 0);

      const fidGood = existing.fidGood + (vitals.fidRating === 'GOOD' ? 1 : 0);
      const fidNeedsWork = existing.fidNeedsWork + (vitals.fidRating === 'NEEDS_IMPROVEMENT' ? 1 : 0);
      const fidPoor = existing.fidPoor + (vitals.fidRating === 'POOR' ? 1 : 0);

      const clsGood = existing.clsGood + (vitals.clsRating === 'GOOD' ? 1 : 0);
      const clsNeedsWork = existing.clsNeedsWork + (vitals.clsRating === 'NEEDS_IMPROVEMENT' ? 1 : 0);
      const clsPoor = existing.clsPoor + (vitals.clsRating === 'POOR' ? 1 : 0);

      // Determine overall status
      const poorCount = lcpPoor + fidPoor + clsPoor;
      const needsWorkCount = lcpNeedsWork + fidNeedsWork + clsNeedsWork;
      let overallStatus: 'HEALTHY' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'UNKNOWN' = 'HEALTHY';
      if (poorCount > totalViews * 0.25) {
        overallStatus = 'POOR';
      } else if (needsWorkCount > totalViews * 0.25) {
        overallStatus = 'NEEDS_IMPROVEMENT';
      }

      // Identify issues
      const issues: string[] = [];
      if (lcpPoor / totalViews > 0.25) issues.push('LCP issues detected');
      if (fidPoor / totalViews > 0.25) issues.push('FID issues detected');
      if (clsPoor / totalViews > 0.25) issues.push('CLS issues detected');

      await prisma.page_performance.update({
        where: { pagePath },
        data: {
          totalViews,
          avgLcp: updateAvg(existing.avgLcp, vitals.lcp ?? null, totalViews),
          avgFid: updateAvg(existing.avgFid, vitals.fid ?? null, totalViews),
          avgCls: updateAvg(existing.avgCls, vitals.cls ?? null, totalViews),
          avgFcp: updateAvg(existing.avgFcp, vitals.fcp ?? null, totalViews),
          avgTtfb: updateAvg(existing.avgTtfb, vitals.ttfb ?? null, totalViews),
          avgInp: updateAvg(existing.avgInp, vitals.inp ?? null, totalViews),
          lcpGood,
          lcpNeedsWork,
          lcpPoor,
          fidGood,
          fidNeedsWork,
          fidPoor,
          clsGood,
          clsNeedsWork,
          clsPoor,
          overallStatus,
          issues: issues.length > 0 ? issues : null,
          lastMeasured: new Date(),
        },
      });
    } else {
      // Create new page performance record
      const issues: string[] = [];
      if (vitals.lcpRating === 'POOR') issues.push('LCP issues detected');
      if (vitals.fidRating === 'POOR') issues.push('FID issues detected');
      if (vitals.clsRating === 'POOR') issues.push('CLS issues detected');

      let overallStatus: 'HEALTHY' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'UNKNOWN' = 'HEALTHY';
      if (vitals.lcpRating === 'POOR' || vitals.fidRating === 'POOR' || vitals.clsRating === 'POOR') {
        overallStatus = 'POOR';
      } else if (vitals.lcpRating === 'NEEDS_IMPROVEMENT' || vitals.fidRating === 'NEEDS_IMPROVEMENT' || vitals.clsRating === 'NEEDS_IMPROVEMENT') {
        overallStatus = 'NEEDS_IMPROVEMENT';
      }

      await prisma.page_performance.create({
        data: {
          pagePath,
          totalViews: 1,
          avgLcp: vitals.lcp || null,
          avgFid: vitals.fid || null,
          avgCls: vitals.cls || null,
          avgFcp: vitals.fcp || null,
          avgTtfb: vitals.ttfb || null,
          avgInp: vitals.inp || null,
          lcpGood: vitals.lcpRating === 'GOOD' ? 1 : 0,
          lcpNeedsWork: vitals.lcpRating === 'NEEDS_IMPROVEMENT' ? 1 : 0,
          lcpPoor: vitals.lcpRating === 'POOR' ? 1 : 0,
          fidGood: vitals.fidRating === 'GOOD' ? 1 : 0,
          fidNeedsWork: vitals.fidRating === 'NEEDS_IMPROVEMENT' ? 1 : 0,
          fidPoor: vitals.fidRating === 'POOR' ? 1 : 0,
          clsGood: vitals.clsRating === 'GOOD' ? 1 : 0,
          clsNeedsWork: vitals.clsRating === 'NEEDS_IMPROVEMENT' ? 1 : 0,
          clsPoor: vitals.clsRating === 'POOR' ? 1 : 0,
          overallStatus,
          issues: issues.length > 0 ? issues : null,
          lastMeasured: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error('Error updating page performance', error);
  }
}
