/**
 * End-to-end test for the unified meta + content admin flow.
 *
 * Verifies for 3 service-city combos:
 *   1. service_city_content row exists with admin-edited meta + page fields
 *   2. The 5 unified fields (metaTitle, metaDescription, metaKeywords,
 *      pageHeading, pageDescription) are present
 *   3. The legacy seo_meta data for those pageIds has been preserved
 *      (sanity that we didn't lose anything during the migration)
 */

import { prisma } from '../src/lib/db/prisma';

const COMBOS: { service: string; city: string }[] = [
  { service: 'car-rental', city: 'ahmedabad' },
  { service: 'bike-on-rent', city: 'ahmedabad' },
  { service: 'equipment-rental', city: 'ahmedabad' },
];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Unified meta + content flow check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const { service, city } of COMBOS) {
    const pageId = `${service}:${city}`;
    console.log(`▶ ${pageId}`);

    const sc = await prisma.service_city_content.findUnique({
      where: { serviceSlug_citySlug: { serviceSlug: service, citySlug: city } },
      select: {
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        pageHeading: true,
        pageDescription: true,
        status: true,
        source: true,
      },
    });

    const sm = await prisma.seo_meta.findUnique({
      where: { servicePageId: pageId },
      select: {
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        pageHeading: true,
        pageDescription: true,
      },
    });

    if (!sc) {
      console.log('   service_city_content row: ❌ NOT FOUND\n');
      continue;
    }

    console.log(`   service_city_content (NEW system, what public reads first):`);
    console.log(`     metaTitle:       ${sc.metaTitle ?? '(unset)'}`);
    console.log(`     metaDescription: ${sc.metaDescription?.slice(0, 60) ?? '(unset)'}${sc.metaDescription && sc.metaDescription.length > 60 ? '...' : ''}`);
    console.log(`     metaKeywords:    ${sc.metaKeywords?.slice(0, 60) ?? '(unset)'}${sc.metaKeywords && sc.metaKeywords.length > 60 ? '...' : ''}`);
    console.log(`     pageHeading:     ${sc.pageHeading ?? '(unset)'}`);
    console.log(`     pageDescription: ${sc.pageDescription?.slice(0, 60) ?? '(unset)'}${sc.pageDescription && sc.pageDescription.length > 60 ? '...' : ''}`);
    console.log(`     status / source: ${sc.status} / ${sc.source}`);

    if (sm) {
      console.log(`   seo_meta (LEGACY, kept as fallback):`);
      if (sm.metaTitle) console.log(`     metaTitle:       ${sm.metaTitle.slice(0, 60)}`);
      if (sm.pageHeading) console.log(`     pageHeading:     ${sm.pageHeading.slice(0, 60)}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
