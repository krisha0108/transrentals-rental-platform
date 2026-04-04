/**
 * Cache Warming Script for TransRentals
 *
 * Visits all service location pages after deployment so that ISR cache
 * is pre-populated and users never hit a cold render.
 *
 * Usage:
 *   BASE_URL=https://transrentals.in npx tsx scripts/warm-cache.ts
 *   BASE_URL=https://transrentals.in npx tsx scripts/warm-cache.ts --concurrency=100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'https://transrentals.in';
const CONCURRENCY = parseInt(
  process.argv.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '50'
);

// All service slugs that have [location] pages
const SERVICE_SLUGS = [
  'car-rental',
  'bike-on-rent',
  'bus-rental',
  'transporter',
  'packers-and-movers',
  'equipment-rental',
  'self-drive-car-rentals',
  'luxury-car-rental',
  'chauffeur-service',
  'local-taxi',
  'outstation-car-rental',
  'one-way-car-rental',
  'monthly-car-rental',
  'wedding-car-rental',
  'vintage-car-rental',
  'sports-car-rental',
  'airport-transfer',
  'tempo-traveller',
];

async function getAllLocationSlugs(): Promise<string[]> {
  const locations = await prisma.locations.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return locations.map((l) => l.slug);
}

async function runInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function visitUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\n🔥 TransRentals Cache Warmer`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const locationSlugs = await getAllLocationSlugs();
  console.log(`📍 Locations found: ${locationSlugs.length}`);
  console.log(`🛠️  Services: ${SERVICE_SLUGS.length}`);

  // Build all URLs
  const urls: string[] = [];

  // Service location pages
  for (const service of SERVICE_SLUGS) {
    for (const loc of locationSlugs) {
      urls.push(`${BASE_URL}/${service}/${loc}`);
    }
  }

  // Add homepage and main service pages
  urls.push(BASE_URL);
  for (const service of SERVICE_SLUGS) {
    urls.push(`${BASE_URL}/${service}`);
  }

  console.log(`📄 Total URLs to warm: ${urls.length}`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(urls.length / CONCURRENCY / 2)} seconds\n`);

  let done = 0;
  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  await runInBatches(urls, CONCURRENCY, async (url, i) => {
    const ok = await visitUrl(url);
    done++;
    if (ok) success++;
    else failed++;

    // Log progress every 500 pages
    if (done % 500 === 0 || done === urls.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = Math.round((done / urls.length) * 100);
      console.log(`  [${pct}%] ${done}/${urls.length} — ✅ ${success} | ❌ ${failed} | ⏱ ${elapsed}s`);
    }
  });

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Done in ${totalTime}s`);
  console.log(`   Success: ${success} | Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
