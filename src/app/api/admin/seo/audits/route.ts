import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get all SEO audits
 * GET /api/admin/seo/audits?page=1&limit=20&sortBy=overallScore&order=desc
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'lastAuditDate';
    const order = searchParams.get('order') || 'desc';

    const [audits, total] = await Promise.all([
      prisma.seo_audits.findMany({
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.seo_audits.count(),
    ]);

    // Parse JSON fields
    const formattedAudits = audits.map(audit => ({
      ...audit,
      issues: audit.issues ? JSON.parse(audit.issues) : [],
      warnings: audit.warnings ? JSON.parse(audit.warnings) : [],
      passed: audit.passed ? JSON.parse(audit.passed) : [],
      structuredDataTypes: audit.structuredDataTypes ? JSON.parse(audit.structuredDataTypes) : [],
    }));

    // Calculate summary stats
    const avgOverallScore = audits.length > 0
      ? Math.round(audits.reduce((sum, a) => sum + a.overallScore, 0) / audits.length)
      : 0;

    const scoreDistribution = {
      good: audits.filter(a => a.overallScore >= 80).length,
      needsImprovement: audits.filter(a => a.overallScore >= 60 && a.overallScore < 80).length,
      poor: audits.filter(a => a.overallScore < 60).length,
    };

    return NextResponse.json({
      audits: formattedAudits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        total,
        avgOverallScore,
        scoreDistribution,
        lastAudit: audits[0]?.lastAuditDate || null,
      },
    });
  } catch (error) {
    console.error('SEO Audits List Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch audits',
    }, { status: 500 });
  }
}
