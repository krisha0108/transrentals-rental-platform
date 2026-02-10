import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Web Vitals API
 * POST - Store web vitals metric
 * GET - Retrieve web vitals summary
 */

interface WebVitalsMetric {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  pagePath: string;
  pageTitle: string;
  navigationType: string;
  connectionType?: string;
  deviceMemory?: number;
  sessionId?: string;
  timestamp: string;
}

/**
 * Store Web Vitals metric
 * POST /api/analytics/web-vitals
 */
export async function POST(request: NextRequest) {
  try {
    const data: WebVitalsMetric = await request.json();

    // Validate required fields
    if (!data.metricName || !data.value || !data.pagePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store in database (using page_views table for now)
    // In production, create a dedicated web_vitals table
    await prisma.page_views.create({
      data: {
        id: `wv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        path: data.pagePath,
        title: data.pageTitle || data.pagePath,
        sessionId: data.sessionId || null,
        referrer: data.metricName, // Store metric name in referrer field
        viewedAt: new Date(data.timestamp),
        device: data.connectionType || 'unknown',
        browser: data.rating, // Store rating in browser field
        os: `${data.metricName}:${data.value}`, // Store metric data in os field
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Web Vitals API Error:', error);
    // Return success anyway to not break client-side tracking
    return NextResponse.json({ success: true });
  }
}

/**
 * Get Web Vitals summary
 * GET /api/analytics/web-vitals?action=summary&days=7
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const days = parseInt(searchParams.get('days') || '7');

    if (action === 'summary') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch web vitals data (stored in page_views for now)
      const vitalsData = await prisma.page_views.findMany({
        where: {
          viewedAt: {
            gte: startDate,
          },
          referrer: {
            in: ['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB'],
          },
        },
        select: {
          referrer: true, // metric name
          browser: true,  // rating
          os: true,       // metric:value
          viewedAt: true,
          path: true,
        },
        orderBy: {
          viewedAt: 'desc',
        },
        take: 1000,
      });

      // Aggregate metrics
      const metrics: Record<string, any> = {
        LCP: { values: [], good: 0, needsImprovement: 0, poor: 0 },
        FID: { values: [], good: 0, needsImprovement: 0, poor: 0 },
        INP: { values: [], good: 0, needsImprovement: 0, poor: 0 },
        CLS: { values: [], good: 0, needsImprovement: 0, poor: 0 },
        FCP: { values: [], good: 0, needsImprovement: 0, poor: 0 },
        TTFB: { values: [], good: 0, needsImprovement: 0, poor: 0 },
      };

      vitalsData.forEach((item) => {
        const metricName = item.referrer;
        const rating = item.browser;
        const metricValue = parseFloat(item.os?.split(':')[1] || '0');

        if (metrics[metricName]) {
          metrics[metricName].values.push(metricValue);

          if (rating === 'good') metrics[metricName].good++;
          else if (rating === 'needs-improvement') metrics[metricName].needsImprovement++;
          else if (rating === 'poor') metrics[metricName].poor++;
        }
      });

      // Calculate averages and percentiles
      const summary = Object.entries(metrics).map(([name, data]) => {
        const values = data.values as number[];
        const total = values.length;

        if (total === 0) {
          return {
            name,
            average: 0,
            p75: 0,
            total: 0,
            distribution: { good: 0, needsImprovement: 0, poor: 0 },
          };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const average = values.reduce((a, b) => a + b, 0) / total;
        const p75Index = Math.ceil(total * 0.75) - 1;
        const p75 = sorted[p75Index];

        return {
          name,
          average: Math.round(average),
          p75: Math.round(p75),
          total,
          distribution: {
            good: data.good,
            needsImprovement: data.needsImprovement,
            poor: data.poor,
          },
        };
      });

      return NextResponse.json({
        success: true,
        period: `Last ${days} days`,
        summary,
        totalMeasurements: vitalsData.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Web Vitals GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web vitals' },
      { status: 500 }
    );
  }
}
