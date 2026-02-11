import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get specific SEO audit by ID
 * GET /api/admin/seo/audits/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    const audit = await prisma.seo_audits.findUnique({
      where: { id },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Parse JSON fields
    const formattedAudit = {
      ...audit,
      issues: audit.issues ? JSON.parse(audit.issues) : [],
      warnings: audit.warnings ? JSON.parse(audit.warnings) : [],
      passed: audit.passed ? JSON.parse(audit.passed) : [],
      structuredDataTypes: audit.structuredDataTypes ? JSON.parse(audit.structuredDataTypes) : [],
    };

    return NextResponse.json(formattedAudit);
  } catch (error) {
    console.error('SEO Audit Detail Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch audit',
    }, { status: 500 });
  }
}
