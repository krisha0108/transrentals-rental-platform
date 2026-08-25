import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * Paginated, filterable crawl results.
 * GET /api/admin/site-audit/pages?status=404&search=seltos&limit=100&offset=0
 *   status: 'ok' (2xx) | 'redirect' (3xx) | 'error' (4xx/5xx/crawl failure) | a specific code like '404'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const indexing = searchParams.get('indexing'); // 'indexed' | 'not_indexed' | 'unchecked'
    const search = searchParams.get('search') || undefined;
    const limit = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') || '100', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const where: any = {};
    if (search) where.url = { contains: search };

    if (status === 'ok') where.httpStatus = { gte: 200, lt: 300 };
    else if (status === 'redirect') where.httpStatus = { gte: 300, lt: 400 };
    else if (status === 'error') {
      where.OR = [{ httpStatus: { gte: 400 } }, { crawlError: { not: null } }];
    } else if (status && /^\d+$/.test(status)) where.httpStatus = parseInt(status, 10);

    if (indexing === 'indexed') where.isIndexed = true;
    else if (indexing === 'not_indexed') where.isIndexed = false;
    else if (indexing === 'unchecked') where.isIndexed = null;

    const [rows, total, statusGroups, indexingGroups] = await Promise.all([
      prisma.site_audit_pages.findMany({
        where,
        orderBy: [{ httpStatus: 'desc' }, { url: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.site_audit_pages.count({ where }),
      prisma.site_audit_pages.groupBy({ by: ['httpStatus'], _count: { _all: true } }),
      prisma.site_audit_pages.groupBy({ by: ['isIndexed'], _count: { _all: true } }),
    ]);

    const summary = {
      total2xx: 0,
      total3xx: 0,
      total4xx5xx: 0,
      totalCrawlErrors: 0,
      byStatus: {} as Record<string, number>,
      indexed: 0,
      notIndexed: 0,
      indexingUnchecked: 0,
    };
    for (const g of statusGroups) {
      const key = g.httpStatus == null ? 'unchecked' : String(g.httpStatus);
      summary.byStatus[key] = g._count._all;
      if (g.httpStatus != null) {
        if (g.httpStatus >= 200 && g.httpStatus < 300) summary.total2xx += g._count._all;
        else if (g.httpStatus >= 300 && g.httpStatus < 400) summary.total3xx += g._count._all;
        else if (g.httpStatus >= 400) summary.total4xx5xx += g._count._all;
      }
    }
    summary.totalCrawlErrors = await prisma.site_audit_pages.count({ where: { crawlError: { not: null } } });
    for (const g of indexingGroups) {
      if (g.isIndexed === true) summary.indexed = g._count._all;
      else if (g.isIndexed === false) summary.notIndexed = g._count._all;
      else summary.indexingUnchecked = g._count._all;
    }

    return NextResponse.json({
      rows,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
      summary,
    });
  } catch (error) {
    console.error('Site audit pages list error:', error);
    return NextResponse.json({ error: 'Failed to list audit pages' }, { status: 500 });
  }
}
