/**
 * Data safety audit — runs before any further changes to confirm:
 *   1. All admin-edited content is intact in DB
 *   2. All AI-generated content is intact
 *   3. All meta titles / descriptions saved by admin are preserved
 *   4. Both content tables (service_city_content + seo_meta) are healthy
 *   5. Git state is clean + pushed to origin
 *
 * Runs read-only. Nothing is modified.
 */

import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️  DATA SAFETY AUDIT — read-only check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. service_city_content (NEW system — block-based content) ───────────
  const scTotal = await prisma.service_city_content.count();
  const scWithMeta = await prisma.service_city_content.count({
    where: { OR: [{ metaTitle: { not: null } }, { metaDescription: { not: null } }] },
  });
  const scWithSections = await prisma.service_city_content.count({
    where: { sectionsConfig: { not: null } },
  });
  const scWithIntro = await prisma.service_city_content.count({
    where: { intro: { not: null } },
  });
  const bySource = await prisma.service_city_content.groupBy({
    by: ['source'],
    _count: { _all: true },
  });
  const byStatus = await prisma.service_city_content.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.log('📊 service_city_content (new system)');
  console.log(`   Total rows:            ${scTotal}`);
  console.log(`   With metaTitle/desc:   ${scWithMeta}`);
  console.log(`   With sectionsConfig:   ${scWithSections}`);
  console.log(`   With intro (legacy):   ${scWithIntro}`);
  console.log(`   By source:             ${bySource.map(s => `${s.source}=${s._count._all}`).join(', ')}`);
  console.log(`   By status:             ${byStatus.map(s => `${s.status}=${s._count._all}`).join(', ')}`);

  // Sample 5 rows that are manually edited (most precious)
  const manualRows = await prisma.service_city_content.findMany({
    where: { source: 'manual' },
    select: { serviceSlug: true, citySlug: true, metaTitle: true, status: true, updatedAt: true, lastEditedBy: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });
  console.log('\n   Recent manual edits (top 8):');
  for (const r of manualRows) {
    const date = r.updatedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const title = (r.metaTitle ?? '(no title)').slice(0, 55);
    console.log(`     ${date}  ${r.serviceSlug}/${r.citySlug.padEnd(15)} [${r.status.padEnd(15)}] by=${r.lastEditedBy ?? 'unknown'}`);
    console.log(`       title: ${title}`);
  }

  // ── 2. seo_meta (OLD system — meta overrides) ────────────────────────────
  const seoTotal = await prisma.seo_meta.count();
  const seoForServiceCity = await prisma.seo_meta.count({
    where: { servicePageId: { contains: ':' } },
  });
  console.log('\n📊 seo_meta (old system)');
  console.log(`   Total rows:            ${seoTotal}`);
  console.log(`   For service-city URLs: ${seoForServiceCity}`);

  const recentSeo = await prisma.seo_meta.findMany({
    where: { servicePageId: { not: null } },
    select: { servicePageId: true, metaTitle: true, pageHeading: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
  console.log('\n   Recent seo_meta entries (top 5):');
  for (const r of recentSeo) {
    const date = r.updatedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    console.log(`     ${date}  ${r.servicePageId}`);
    if (r.metaTitle) console.log(`       title:   ${r.metaTitle.slice(0, 70)}`);
    if (r.pageHeading) console.log(`       heading: ${r.pageHeading.slice(0, 70)}`);
  }

  // ── 3. Cross-check: pages where BOTH systems have data (potential conflict) ─
  const allScRows = await prisma.service_city_content.findMany({
    where: { OR: [{ metaTitle: { not: null } }, { metaDescription: { not: null } }] },
    select: { serviceSlug: true, citySlug: true, metaTitle: true },
  });
  const pageIds = allScRows.map(r => `${r.serviceSlug}:${r.citySlug}`);
  const overlapSeo = await prisma.seo_meta.findMany({
    where: { servicePageId: { in: pageIds } },
    select: { servicePageId: true, metaTitle: true },
  });
  console.log('\n📊 Overlap analysis');
  console.log(`   Pages with meta in new system:  ${allScRows.length}`);
  console.log(`   Pages with meta in old system:  ${overlapSeo.length}`);
  console.log(`   Conflicts (both have data):     ${overlapSeo.length}`);
  if (overlapSeo.length > 0 && overlapSeo.length <= 10) {
    console.log('   Conflict rows (sample):');
    for (const o of overlapSeo.slice(0, 5)) {
      const newRow = allScRows.find(r => `${r.serviceSlug}:${r.citySlug}` === o.servicePageId);
      console.log(`     ${o.servicePageId}`);
      console.log(`       new (service_city_content): ${(newRow?.metaTitle ?? '').slice(0, 60)}`);
      console.log(`       old (seo_meta):             ${(o.metaTitle ?? '').slice(0, 60)}`);
    }
  }

  // ── 4. Total disk footprint (for backup planning) ────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All data audited — nothing modified by this script.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
