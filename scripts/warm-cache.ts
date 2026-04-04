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

// Map of service DB slug → URL slug (for services where they differ)
const SERVICE_MAP: Record<string, string> = {
  'car-rental': 'car-rental',
  'bike-on-rent': 'bike-on-rent',
  'bus-rental': 'bus-rental',
  'transporter': 'transporter',
  'packers-and-movers': 'packers-and-movers',
  'equipment-rental': 'jcb-on-rent',
  'self-drive-car-rentals': 'self-drive-car-rentals',
  'luxury-car-rental': 'luxury-car-rental',
  'chauffeur-service': 'chauffeur-service',
  'local-taxi': 'local-taxi',
  'outstation-car-rental': 'outstation-car-rental',
  'one-way-car-rental': 'one-way-car-rental',
  'monthly-car-rental': 'monthly-car-rental',
  'wedding-car-rental': 'wedding-car-rental',
  'vintage-car-rental': 'vintage-car-rental',
  'sports-car-rental': 'sports-car-rental',
  'airport-transfer': 'airport-transfer',
  'tempo-traveller': 'tempo-traveller',
};

async function getServiceLocationUrls(): Promise<string[]> {
  const urls: string[] = [];

  const services = await prisma.services.findMany({
    where: { slug: { in: Object.keys(SERVICE_MAP) }, isActive: true },
    select: {
      slug: true,
      service_locations: {
        where: { isActive: true },
        select: { locations: { select: { slug: true } } },
      },
    },
  });

  for (const service of services) {
    const urlSlug = SERVICE_MAP[service.slug] ?? service.slug;
    for (const sl of service.service_locations) {
      urls.push(`${BASE_URL}/${urlSlug}/${sl.locations.slug}`);
    }
  }

  return urls;
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

  const serviceUrls = await getServiceLocationUrls();
  console.log(`🛠️  Services: ${Object.keys(SERVICE_MAP).length}`);

  // Build all URLs
  const urls: string[] = [...serviceUrls];

  // Add homepage and main service pages
  urls.push(BASE_URL);
  for (const urlSlug of Object.values(SERVICE_MAP)) {
    urls.push(`${BASE_URL}/${urlSlug}`);
  }

  console.log(`📍 Service-location pages: ${serviceUrls.length}`);

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
