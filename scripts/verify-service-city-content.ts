/**
 * Verify the seeded service_city_content table.
 * Spot-checks a few well-known (service, city) combos.
 *
 * Run: npx tsx scripts/verify-service-city-content.ts
 */

import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Verifying service_city_content');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const total = await prisma.service_city_content.count();
  console.log(`Total rows: ${total}`);

  const byService = await prisma.service_city_content.groupBy({
    by: ['serviceSlug'],
    _count: { _all: true },
    orderBy: { _count: { serviceSlug: 'desc' } },
  });
  console.log('\nRows per service:');
  for (const row of byService) {
    console.log(`  ${row.serviceSlug}: ${row._count._all} cities`);
  }

  console.log('\n━━━ Spot check: car-rental / delhi ━━━');
  const delhi = await prisma.service_city_content.findUnique({
    where: { serviceSlug_citySlug: { serviceSlug: 'car-rental', citySlug: 'delhi' } },
  });
  if (delhi) {
    console.log(`  status: ${delhi.status}`);
    console.log(`  source: ${delhi.source}`);
    console.log(`  intro length: ${delhi.intro?.length ?? 0} chars`);
    console.log(`  intro preview: ${delhi.intro?.slice(0, 120)}...`);
    const faqs = delhi.faqs ? JSON.parse(delhi.faqs) : null;
    console.log(`  faqs count: ${faqs?.length ?? 0}`);
    const routes = delhi.routes ? JSON.parse(delhi.routes) : null;
    console.log(`  routes count: ${routes?.length ?? 0}`);
    const tips = delhi.tips ? JSON.parse(delhi.tips) : null;
    console.log(`  tips count: ${tips?.length ?? 0}`);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  console.log('\n━━━ Spot check: packers-and-movers / delhi ━━━');
  const packers = await prisma.service_city_content.findUnique({
    where: { serviceSlug_citySlug: { serviceSlug: 'packers-and-movers', citySlug: 'delhi' } },
  });
  if (packers) {
    console.log(`  intro length: ${packers.intro?.length ?? 0} chars`);
    console.log(`  intro preview: ${packers.intro?.slice(0, 120)}...`);
    const faqs = packers.faqs ? JSON.parse(packers.faqs) : null;
    console.log(`  faqs count: ${faqs?.length ?? 0}`);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  console.log('\n━━━ Spot check: bike-on-rent / goa ━━━');
  const goa = await prisma.service_city_content.findUnique({
    where: { serviceSlug_citySlug: { serviceSlug: 'bike-on-rent', citySlug: 'goa' } },
  });
  if (goa) {
    console.log(`  intro length: ${goa.intro?.length ?? 0} chars`);
    console.log(`  intro preview: ${goa.intro?.slice(0, 120)}...`);
  } else {
    console.log('  ⚠ NOT SEEDED (no serviceIntros for this combo)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error('❌ Verify failed:', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
