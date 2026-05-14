/**
 * Seed `service_city_content` from existing static data files.
 *
 * Source: src/data/city-seo-content.ts (CITY_SEO)
 *   For each city, every entry in `serviceIntros` becomes a row in
 *   service_city_content keyed by (serviceSlug, citySlug). City-level
 *   fields (routes, tips) are stored on the row too so the per-service
 *   page can render everything from one fetch.
 *
 * Idempotent — uses upsert. Re-run safe.
 *
 * Run:  npx tsx scripts/seed-service-city-content.ts
 */

import { prisma } from '../src/lib/db/prisma';
import { CITY_SEO } from '../src/data/city-seo-content';

type Stats = { created: number; updated: number; skipped: number };

async function main() {
  const stats: Stats = { created: 0, updated: 0, skipped: 0 };
  const startedAt = Date.now();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 Seeding service_city_content from CITY_SEO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const citySlugs = Object.keys(CITY_SEO);
  console.log(`Found ${citySlugs.length} cities in CITY_SEO\n`);

  for (const citySlug of citySlugs) {
    const cityData = CITY_SEO[citySlug];
    const serviceIntros = cityData.serviceIntros || {};
    const serviceFAQs = cityData.serviceFAQs || {};

    const serviceSlugs = Object.keys(serviceIntros);
    if (serviceSlugs.length === 0) {
      console.log(`⊘ ${citySlug}: no serviceIntros — skipping (city-level data only)`);
      stats.skipped += 1;
      continue;
    }

    for (const serviceSlug of serviceSlugs) {
      const intro = serviceIntros[serviceSlug];
      if (!intro || intro.trim() === '') continue;

      const faqs = serviceFAQs[serviceSlug];

      const data = {
        intro,
        faqs: faqs && faqs.length > 0 ? JSON.stringify(faqs) : null,
        tips: cityData.tips && cityData.tips.length > 0 ? JSON.stringify(cityData.tips) : null,
        routes: cityData.routes && cityData.routes.length > 0 ? JSON.stringify(cityData.routes) : null,
        status: 'published',
        source: 'manual',
        lastEditedBy: 'seed-migration',
        publishedAt: new Date(),
      };

      const existing = await prisma.service_city_content.findUnique({
        where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
        select: { id: true },
      });

      await prisma.service_city_content.upsert({
        where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
        create: { serviceSlug, citySlug, ...data },
        update: data,
      });

      if (existing) {
        stats.updated += 1;
        console.log(`↻ ${citySlug} / ${serviceSlug}`);
      } else {
        stats.created += 1;
        console.log(`+ ${citySlug} / ${serviceSlug}`);
      }
    }
  }

  const tookMs = Date.now() - startedAt;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Done in ${tookMs}ms`);
  console.log(`   Created: ${stats.created}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Cities skipped (no serviceIntros): ${stats.skipped}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const total = await prisma.service_city_content.count();
  console.log(`Total rows in service_city_content: ${total}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
