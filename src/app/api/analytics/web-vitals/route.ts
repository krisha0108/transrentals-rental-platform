import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Web Vitals API
 * POST - Store a single web vitals metric
 * GET  - Retrieve a web vitals summary
 *
 * Both halves read and write the dedicated `web_vitals` table. An earlier version
 * squeezed metrics into `page_views` (metric name in `referrer`, rating in `browser`,
 * "name:value" in `os`) against columns that do not exist on that model, so every
 * request threw and the summary was permanently empty — while also risking phantom
 * rows in the table that feeds traffic analytics.
 */

interface WebVitalsMetric {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  pagePath: string;
  pageTitle?: string;
  navigationType?: string;
  connectionType?: string;
  deviceMemory?: number;
  sessionId?: string;
  timestamp?: string;
}

/** Metrics that have their own column (and, except TTFB, their own rating column). */
const METRIC_COLUMNS = {
  LCP: 'lcp',
  FID: 'fid',
  CLS: 'cls',
  FCP: 'fcp',
  TTFB: 'ttfb',
  INP: 'inp',
} as const;

type MetricName = keyof typeof METRIC_COLUMNS;

/** TTFB has no rating column in the schema, so its rating is not persisted. */
const RATING_COLUMNS: Partial<Record<MetricName, string>> = {
  LCP: 'lcpRating',
  FID: 'fidRating',
  CLS: 'clsRating',
  FCP: 'fcpRating',
  INP: 'inpRating',
};

const RATING_ENUM: Record<string, string> = {
  good: 'GOOD',
  'needs-improvement': 'NEEDS_IMPROVEMENT',
  poor: 'POOR',
};

export async function POST(request: NextRequest) {
  try {
    const data: WebVitalsMetric = await request.json();

    const metricName = (data.metricName || '').toUpperCase() as MetricName;
    if (!METRIC_COLUMNS[metricName] || typeof data.value !== 'number' || !data.pagePath) {
      return NextResponse.json({ error: 'Missing or unknown metric' }, { status: 400 });
    }

    const ratingColumn = RATING_COLUMNS[metricName];
    const rating = RATING_ENUM[data.rating];

    await prisma.web_vitals.create({
      data: {
        id: `wv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        pagePath: data.pagePath,
        pageTitle: data.pageTitle || null,
        sessionId: data.sessionId || null,
        connectionType: data.connectionType || null,
        createdAt: data.timestamp ? new Date(data.timestamp) : new Date(),
        [METRIC_COLUMNS[metricName]]: data.value,
        ...(ratingColumn && rating ? { [ratingColumn]: rating } : {}),
      } as never,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Web Vitals API Error:', error);
    // Never break client-side tracking over a failed write.
    return NextResponse.json({ success: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10) || 7, 1), 90);

    if (action !== 'summary') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const where = { createdAt: { gte: startDate } };

    // Averages come from the DB aggregate (exact over the whole window); the capped
    // sample is only used for the P75, where a sorted subset is statistically fine.
    const [agg, totalMeasurements, sample, lcpRatings, fidRatings, clsRatings, fcpRatings, inpRatings] =
      await Promise.all([
        prisma.web_vitals.aggregate({
          where,
          _avg: { lcp: true, fid: true, cls: true, fcp: true, ttfb: true, inp: true },
        }),
        prisma.web_vitals.count({ where }),
        prisma.web_vitals.findMany({
          where,
          select: { lcp: true, fid: true, cls: true, fcp: true, ttfb: true, inp: true },
          orderBy: { createdAt: 'desc' },
          take: 2000,
        }),
        prisma.web_vitals.groupBy({ by: ['lcpRating'], where, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['fidRating'], where, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['clsRating'], where, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['fcpRating'], where, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['inpRating'], where, _count: { id: true } }),
      ]);

    const distributionOf = (groups: Array<{ _count: { id: number } } & Record<string, unknown>>, key: string) => {
      const dist = { good: 0, needsImprovement: 0, poor: 0 };
      groups.forEach((g) => {
        const rating = g[key];
        if (rating === 'GOOD') dist.good = g._count.id;
        else if (rating === 'NEEDS_IMPROVEMENT') dist.needsImprovement = g._count.id;
        else if (rating === 'POOR') dist.poor = g._count.id;
      });
      return dist;
    };

    const p75 = (values: number[]) => {
      if (values.length === 0) return null;
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.min(Math.ceil(values.length * 0.75) - 1, sorted.length - 1)];
    };

    // CLS is a unitless ratio, so it keeps decimals where the timing metrics round to ms.
    const build = (
      name: MetricName,
      avg: number | null,
      values: number[],
      distribution: { good: number; needsImprovement: number; poor: number }
    ) => {
      const decimals = name === 'CLS' ? 3 : 0;
      const percentile = p75(values);
      return {
        name,
        average: avg === null ? null : Number(avg.toFixed(decimals)),
        p75: percentile === null ? null : Number(percentile.toFixed(decimals)),
        total: values.length,
        distribution,
      };
    };

    const column = (key: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'inp') =>
      sample.map((row) => row[key]).filter((v): v is number => typeof v === 'number');

    const summary = [
      build('LCP', agg._avg.lcp, column('lcp'), distributionOf(lcpRatings, 'lcpRating')),
      build('FID', agg._avg.fid, column('fid'), distributionOf(fidRatings, 'fidRating')),
      build('INP', agg._avg.inp, column('inp'), distributionOf(inpRatings, 'inpRating')),
      build('CLS', agg._avg.cls, column('cls'), distributionOf(clsRatings, 'clsRating')),
      build('FCP', agg._avg.fcp, column('fcp'), distributionOf(fcpRatings, 'fcpRating')),
      // TTFB has no rating column, so its distribution is always zeroed.
      build('TTFB', agg._avg.ttfb, column('ttfb'), { good: 0, needsImprovement: 0, poor: 0 }),
    ];

    return NextResponse.json({
      success: true,
      period: `Last ${days} days`,
      summary,
      totalMeasurements,
    });
  } catch (error) {
    console.error('Web Vitals GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch web vitals' }, { status: 500 });
  }
}
