import { prisma } from '../src/lib/db/prisma';
import { auditPage, auditMultiplePages } from '../src/lib/seo/audit-engine';

/**
 * Manual SEO Audit Script
 *
 * Usage:
 *   npx tsx scripts/seo-audit.ts <baseUrl> [specificUrl]
 *
 * Examples:
 *   npx tsx scripts/seo-audit.ts http://localhost:3000
 *   npx tsx scripts/seo-audit.ts http://localhost:3000 http://localhost:3000/about
 *   npx tsx scripts/seo-audit.ts https://transrentals.in
 */

async function runAudit() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('❌ Base URL is required');
      console.log('\nUsage: npx tsx scripts/seo-audit.ts <baseUrl> [specificUrl]');
      console.log('\nExamples:');
      console.log('  npx tsx scripts/seo-audit.ts http://localhost:3000');
      console.log('  npx tsx scripts/seo-audit.ts http://localhost:3000 http://localhost:3000/about');
      console.log('  npx tsx scripts/seo-audit.ts https://transrentals.in\n');
      process.exit(1);
    }

    const baseUrl = args[0];
    const specificUrl = args[1];

    console.log('🔍 SEO Audit Tool');
    console.log('═══════════════════════════════════════\n');

    if (specificUrl) {
      // Audit single page
      console.log(`📄 Auditing: ${specificUrl}\n`);

      const result = await auditPage(specificUrl, baseUrl);

      // Save to database
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

      console.log('✅ Audit Complete!\n');
      console.log('═══════════════════════════════════════');
      console.log(`📊 Scores:`);
      console.log(`   Overall Score:    ${result.overallScore}/100`);
      console.log(`   Technical Score:  ${result.technicalScore}/100`);
      console.log(`   Content Score:    ${result.contentScore}/100`);
      console.log(`   On-Page Score:    ${result.onPageScore}/100\n`);

      const issues = result.issues ? JSON.parse(result.issues) : [];
      const warnings = result.warnings ? JSON.parse(result.warnings) : [];
      const passed = result.passed ? JSON.parse(result.passed) : [];

      if (issues.length > 0) {
        console.log(`❌ Issues (${issues.length}):`);
        issues.forEach((issue: string) => console.log(`   - ${issue}`));
        console.log('');
      }

      if (warnings.length > 0) {
        console.log(`⚠️  Warnings (${warnings.length}):`);
        warnings.forEach((warning: string) => console.log(`   - ${warning}`));
        console.log('');
      }

      if (passed.length > 0) {
        console.log(`✅ Passed (${passed.length}):`);
        passed.forEach((pass: string) => console.log(`   - ${pass}`));
        console.log('');
      }

      console.log('═══════════════════════════════════════\n');
      console.log(`📈 Performance:`);
      console.log(`   Load Time: ${result.loadTime?.toFixed(2)}s`);
      console.log(`   Page Size: ${(result.pageSize! / 1024).toFixed(2)} KB`);
      console.log(`   Word Count: ${result.wordCount}`);
      console.log(`   Reading Time: ${result.readingTime} min\n`);

    } else {
      // Audit multiple common pages
      const commonPages = [
        `${baseUrl}/`,
        `${baseUrl}/about`,
        `${baseUrl}/contact`,
        `${baseUrl}/services`,
        `${baseUrl}/blog`,
      ];

      console.log(`📄 Auditing ${commonPages.length} common pages...\n`);

      const results = await auditMultiplePages(commonPages, baseUrl);

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

      console.log('✅ Bulk Audit Complete!\n');
      console.log('═══════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   Pages Audited: ${results.length}`);

      const avgScore = Math.round(
        results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
      );
      console.log(`   Average Score: ${avgScore}/100\n`);

      console.log('📄 Results:\n');
      results.forEach(result => {
        const scoreEmoji = result.overallScore >= 80 ? '✅' : result.overallScore >= 60 ? '⚠️' : '❌';
        console.log(`   ${scoreEmoji} ${result.pagePath.padEnd(20)} - Score: ${result.overallScore}/100`);
      });

      console.log('\n═══════════════════════════════════════\n');
    }

    console.log('💡 View results at: http://localhost:3000/admin/analytics/seo\n');

  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
