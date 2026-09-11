import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

interface FormSubmission {
  id: string;
  formType: string | null;
  formName: string | null;
  pagePath: string | null;
  status: string;
  serviceType: string | null;
  timeToFill: number | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  createdAt: Date;
}

/**
 * Buckets a submission into an acquisition channel using only what the row actually
 * carries. UTM tags win over the referrer because they are explicit; a submission with
 * neither is genuinely direct traffic, not an unknown.
 */
function classifySource(s: Pick<FormSubmission, 'referrer' | 'utmSource' | 'utmMedium'>): string {
  const medium = (s.utmMedium || '').toLowerCase();
  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'Paid Ads';
  if (medium === 'email') return 'Email';

  const source = (s.utmSource || '').toLowerCase();
  const ref = (s.referrer || '').toLowerCase();
  const hay = source || ref;

  if (!hay) return 'Direct';
  if (/google|bing|yahoo|duckduckgo|baidu|yandex/.test(hay)) return 'Organic Search';
  if (/facebook|instagram|twitter|x\.com|linkedin|youtube|whatsapp|pinterest|reddit/.test(hay)) return 'Social Media';
  return 'Referral';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const formType = searchParams.get('type') || 'all';

    const days = range === '1d' ? 1 : range === '30d' ? 30 : range === '90d' ? 90 : 7;

    const cacheKey = buildCacheKey('analytics:forms', { range, formType });
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, _cached: true });

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const whereClause: Record<string, unknown> = {
      createdAt: { gte: startDate, lte: now },
    };

    if (formType !== 'all') {
      whereClause.formType = formType;
    }

    const submissions = await prisma.form_submissions.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    }) as FormSubmission[];

    const totalSubmissions = submissions.length;
    const successfulSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'CONVERTED').length;
    const failedSubmissions = submissions.filter((s) => s.status === 'FAILED').length;
    // Only submissions that actually recorded a fill time belong in the mean. Dividing
    // by every row let untimed submissions drag the average towards zero.
    const timedSubmissions = submissions.filter((s) => s.timeToFill && s.timeToFill > 0);
    const avgCompletionTime = timedSubmissions.length > 0
      ? Math.round(timedSubmissions.reduce((sum, s) => sum + (s.timeToFill || 0), 0) / timedSubmissions.length)
      : 0;

    // Conversion rate is submissions per *session*, not per page view — a visitor who
    // reads ten pages and submits one form converted once, not one time in ten.
    const sessionRaw = await prisma.$queryRaw<[{ cnt: bigint }]>`
      SELECT COUNT(DISTINCT sessionId) AS cnt FROM page_views
      WHERE createdAt >= ${startDate} AND createdAt <= ${now}`;
    const sessionCount = Number(sessionRaw[0]?.cnt || 0);
    const conversionRate = sessionCount > 0
      ? Number(((totalSubmissions / sessionCount) * 100).toFixed(1))
      : 0;

    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const byDay = new Map<string, FormSubmission[]>();
    submissions.forEach((s) => {
      const k = dayKey(new Date(s.createdAt));
      const bucket = byDay.get(k);
      if (bucket) bucket.push(s);
      else byDay.set(k, [s]);
    });

    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const daySubmissions = byDay.get(dayKey(date)) || [];

      trends.push({
        // Weekday names repeat once the range passes a week; day + month stays readable.
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        submissions: daySubmissions.length,
        completions: daySubmissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'CONVERTED').length,
        abandonments: daySubmissions.filter((s) => s.status === 'PENDING').length,
      });
    }

    const formTypeCounts = submissions.reduce((acc: Record<string, { submissions: number; completions: number; totalTime: number; timed: number }>, s) => {
      const type = s.formType || 'OTHER';
      if (!acc[type]) acc[type] = { submissions: 0, completions: 0, totalTime: 0, timed: 0 };
      acc[type].submissions++;
      if (s.status === 'SUBMITTED' || s.status === 'CONVERTED') acc[type].completions++;
      if (s.timeToFill && s.timeToFill > 0) { acc[type].totalTime += s.timeToFill; acc[type].timed++; }
      return acc;
    }, {});

    const formTypes = Object.entries(formTypeCounts).map(([type, data]) => ({
      type,
      submissions: data.submissions,
      conversionRate: data.submissions > 0 ? Number(((data.completions / data.submissions) * 100).toFixed(1)) : 0,
      avgTime: data.timed > 0 ? Math.round(data.totalTime / data.timed) : 0,
    }));

    const hourlySubmissions = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      submissions: submissions.filter((s) => new Date(s.createdAt).getHours() === hour).length,
    }));

    // Acquisition channel, derived from each row's own utm/referrer columns.
    const sourceCounts = submissions.reduce((acc: Record<string, { submissions: number; conversions: number }>, s) => {
      const source = classifySource(s);
      if (!acc[source]) acc[source] = { submissions: 0, conversions: 0 };
      acc[source].submissions++;
      if (s.status === 'SUBMITTED' || s.status === 'CONVERTED') acc[source].conversions++;
      return acc;
    }, {});

    const conversionBySource = Object.entries(sourceCounts)
      .map(([source, data]) => ({
        source,
        submissions: data.submissions,
        conversions: data.conversions,
        rate: data.submissions > 0 ? Number(((data.conversions / data.submissions) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.submissions - a.submissions);

    const recentSubmissions = submissions.slice(0, 10).map((s) => ({
      id: s.id,
      formType: s.formType || 'OTHER',
      name: s.formName || 'Anonymous',
      // form_submissions deliberately stores no phone/email, so the table shows the
      // service the visitor was enquiring about instead of two "N/A" columns.
      serviceType: s.serviceType,
      source: classifySource(s),
      page: s.pagePath || '/',
      status: s.status || 'PENDING',
      timestamp: getRelativeTime(s.createdAt),
      completionTime: s.timeToFill || 0,
    }));

    const result = {
      overview: {
        totalSubmissions,
        successfulSubmissions,
        failedSubmissions,
        avgCompletionTime,
        conversionRate,
        abandonmentRate: totalSubmissions > 0
          ? Number(((submissions.filter((s) => s.status === 'PENDING').length / totalSubmissions) * 100).toFixed(1))
          : 0,
      },
      trends,
      formTypes,
      recentSubmissions,
      hourlySubmissions,
      conversionBySource,
    };
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Forms analytics error', error);
    // Fail loudly. A 200 full of zeros is indistinguishable from a genuinely quiet week,
    // which is exactly the confusion these dashboards must not create.
    return NextResponse.json({ error: 'Failed to fetch form analytics' }, { status: 500 });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
