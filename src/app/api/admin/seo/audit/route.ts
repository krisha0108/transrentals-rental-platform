import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { auditPage, auditMultiplePages, shapeAuditForClient, DEFAULT_AUDIT_BASE_URL } from '@/lib/seo/audit-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for multiple pages

/**
 * Trigger SEO audit for one or multiple pages
 * POST /api/admin/seo/audit
 * Body: { url?: string, urls?: string[], baseUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, urls } = body;
    const baseUrl = body.baseUrl || DEFAULT_AUDIT_BASE_URL;

    // Audit single page
    if (url) {
      console.log(`🔍 Auditing page: ${url}`);

      const result = await auditPage(url, baseUrl);

      // Save to database
      const saved = await prisma.seo_audits.upsert({
        where: { pagePath: result.pagePath },
        create: result,
        update: {
          pageTitle: result.pageTitle,
          lastAuditDate: result.lastAuditDate,
          overallScore: result.overallScore,
          technicalScore: result.technicalScore,
          contentScore: result.contentScore,
          onPageScore: result.onPageScore,
          hasTitle: result.hasTitle,
          titleLength: result.titleLength,
          titleIssue: result.titleIssue,
          hasMetaDesc: result.hasMetaDesc,
          metaDescLength: result.metaDescLength,
          metaDescIssue: result.metaDescIssue,
          hasCanonical: result.hasCanonical,
          canonicalUrl: result.canonicalUrl,
          hasH1: result.hasH1,
          h1Count: result.h1Count,
          h1Text: result.h1Text,
          h2Count: result.h2Count,
          h3Count: result.h3Count,
          wordCount: result.wordCount,
          readingTime: result.readingTime,
          hasImages: result.hasImages,
          imageCount: result.imageCount,
          imagesWithAlt: result.imagesWithAlt,
          imagesMissingAlt: result.imagesMissingAlt,
          internalLinks: result.internalLinks,
          externalLinks: result.externalLinks,
          brokenLinks: result.brokenLinks,
          isIndexable: result.isIndexable,
          hasRobotsMeta: result.hasRobotsMeta,
          hasStructuredData: result.hasStructuredData,
          structuredDataTypes: result.structuredDataTypes,
          hasOpenGraph: result.hasOpenGraph,
          hasTwitterCard: result.hasTwitterCard,
          isMobileFriendly: result.isMobileFriendly,
          viewportMeta: result.viewportMeta,
          pageSize: result.pageSize,
          loadTime: result.loadTime,
          issues: result.issues,
          warnings: result.warnings,
          passed: result.passed,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Audit complete: ${result.pagePath} (Score: ${result.overallScore})`);

      return NextResponse.json(shapeAuditForClient(saved, baseUrl));
    }

    // Audit multiple pages
    if (urls && urls.length > 0) {
      console.log(`🔍 Auditing ${urls.length} pages...`);

      const results = await auditMultiplePages(urls, baseUrl);

      // Save all to database
      for (const result of results) {
        await prisma.seo_audits.upsert({
          where: { pagePath: result.pagePath },
          create: result,
          update: {
            pageTitle: result.pageTitle,
            lastAuditDate: result.lastAuditDate,
            overallScore: result.overallScore,
            technicalScore: result.technicalScore,
            contentScore: result.contentScore,
            onPageScore: result.onPageScore,
            hasTitle: result.hasTitle,
            titleLength: result.titleLength,
            titleIssue: result.titleIssue,
            hasMetaDesc: result.hasMetaDesc,
            metaDescLength: result.metaDescLength,
            metaDescIssue: result.metaDescIssue,
            hasCanonical: result.hasCanonical,
            canonicalUrl: result.canonicalUrl,
            hasH1: result.hasH1,
            h1Count: result.h1Count,
            h1Text: result.h1Text,
            h2Count: result.h2Count,
            h3Count: result.h3Count,
            wordCount: result.wordCount,
            readingTime: result.readingTime,
            hasImages: result.hasImages,
            imageCount: result.imageCount,
            imagesWithAlt: result.imagesWithAlt,
            imagesMissingAlt: result.imagesMissingAlt,
            internalLinks: result.internalLinks,
            externalLinks: result.externalLinks,
            brokenLinks: result.brokenLinks,
            isIndexable: result.isIndexable,
            hasRobotsMeta: result.hasRobotsMeta,
            hasStructuredData: result.hasStructuredData,
            structuredDataTypes: result.structuredDataTypes,
            hasOpenGraph: result.hasOpenGraph,
            hasTwitterCard: result.hasTwitterCard,
            isMobileFriendly: result.isMobileFriendly,
            viewportMeta: result.viewportMeta,
            pageSize: result.pageSize,
            loadTime: result.loadTime,
            issues: result.issues,
            warnings: result.warnings,
            passed: result.passed,
            updatedAt: new Date(),
          },
        });
      }

      console.log(`✅ Bulk audit complete: ${results.length} pages audited`);

      return NextResponse.json({
        success: true,
        audited: results.length,
        results,
      });
    }

    return NextResponse.json({
      error: 'Either url or urls[] must be provided',
    }, { status: 400 });
  } catch (error) {
    console.error('SEO Audit Error:', error);
    return NextResponse.json({
      error: 'Failed to perform audit',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
