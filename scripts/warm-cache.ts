/**
 * Cache Warming Script for TransRentals
 *
 * Visits ALL pages after deployment so that ISR cache
 * is pre-populated and users never hit a cold render.
 *
 * Covers:
 *   ✅ All 56 service landing pages
 *   ✅ All service + location pages (from DB — actual configured only)
 *   ✅ All route pages (one-way-cab, round-trip, airport-transfer)
 *   ✅ All published blog posts + blog index
 *   ✅ All published web stories
 *   ✅ All static pages (homepage, about, vehicle pages, etc.)
 *
 * Usage:
 *   BASE_URL=https://transrentals.in npx tsx scripts/warm-cache.ts
 *   BASE_URL=https://transrentals.in npx tsx scripts/warm-cache.ts --concurrency=100
 */

import { PrismaClient } from '@prisma/client';
import { STATIC_PAGES } from '../src/lib/seo/service-meta-templates';

const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'https://transrentals.in';
const CONCURRENCY = parseInt(
  process.argv.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '80'
);

// All (services)/ folder slugs — 56 landing pages
const ALL_SERVICE_SLUGS: string[] = [
  '12-seater-tempo-traveller',
  '17-seater-tempo-traveller',
  '20-seater-tempo-traveller',
  '26-seater-bus',
  'activa-on-rent',
  'airport-transfer',
  'apache-on-rent',
  'bike-on-rent',
  'bike-tours',
  'bike-trips',
  'bus-rental',
  'car-rental',
  'chauffeur-service',
  'corporate-bus-rental',
  'corporate-car-rental',
  'crane-on-rent',
  'creta-on-rent',
  'electric-scooter-rental',
  'equipment-rental',
  'excavator-on-rent',
  'fortuner-on-rent',
  'generator-on-rent',
  'himalayan-on-rent',
  'hourly-car-rental',
  'hydra-on-rent',
  'innova-on-rent',
  'jcb-on-rent',
  'ktm-on-rent',
  'local-taxi',
  'luxury-car-rental',
  'mini-truck-rental',
  'monthly-bike-rental',
  'monthly-car-rental',
  'one-way-cab',
  'one-way-car-rental',
  'outstation-cab',
  'outstation-car-rental',
  'packers-and-movers',
  'pulsar-on-rent',
  'round-trip',
  'royal-enfield-on-rent',
  'scorpio-on-rent',
  'self-drive-car-rentals',
  'self-drive-hatchback-rental',
  'self-drive-sedan-rental',
  'self-drive-suv-rental',
  'seltos-on-rent',
  'splendor-on-rent',
  'sports-car-rental',
  'swift-on-rent',
  'tempo-traveller',
  'trailer-on-rent',
  'transporter',
  'vintage-car-rental',
  'wedding-bus-rental',
  'wedding-car-rental',
  'xuv700-on-rent',
];

// ── URL Collectors ─────────────────────────────────────────────────────────────

/** Static pages from STATIC_PAGES array (no DB needed) */
function getStaticPageUrls(): string[] {
  return STATIC_PAGES.map((p) => `${BASE_URL}${p.url}`);
}

/** Service landing pages — all 56 (services)/ folders */
function getServiceMainUrls(): string[] {
  return ALL_SERVICE_SLUGS.map((slug) => `${BASE_URL}/${slug}`);
}

/** Service + location pages — only actually configured ones from DB */
async function getServiceLocationUrls(): Promise<string[]> {
  try {
    const rows = await (prisma as any).service_locations.findMany({
      where: { isActive: true },
      include: {
        services: { select: { slug: true } },
        locations: { select: { slug: true } },
      },
    });
    return rows.map((r: any) => `${BASE_URL}/${r.services.slug}/${r.locations.slug}`);
  } catch (err) {
    console.warn('⚠️  Could not fetch service_locations:', (err as Error).message);
    return [];
  }
}

/** Route pages — one-way-cab, round-trip, airport-transfer */
async function getRouteUrls(): Promise<string[]> {
  try {
    const routes = await (prisma as any).chauffeur_route_packages.findMany({
      where: { isActive: true },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { slug: true, type: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { slug: true, type: true } },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      take: 2000,
    });

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const r of routes) {
      const from = r.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const to = r.locations_chauffeur_route_packages_toLocationIdTolocations;
      if (!from || !to) continue;

      const isAirport = from.type === 'AIRPORT' || to.type === 'AIRPORT';
      const fwdSlug = `${from.slug}-to-${to.slug}`;
      const revSlug = `${to.slug}-to-${from.slug}`;

      if (isAirport) {
        if (!seen.has(`airport:${fwdSlug}`)) {
          seen.add(`airport:${fwdSlug}`);
          urls.push(`${BASE_URL}/airport-transfer/${fwdSlug}`);
        }
        if (!seen.has(`airport:${revSlug}`)) {
          seen.add(`airport:${revSlug}`);
          urls.push(`${BASE_URL}/airport-transfer/${revSlug}`);
        }
      } else {
        if (!seen.has(`ow:${fwdSlug}`)) {
          seen.add(`ow:${fwdSlug}`);
          urls.push(`${BASE_URL}/one-way-cab/${fwdSlug}`);
        }
        if (!seen.has(`rt:${fwdSlug}`)) {
          seen.add(`rt:${fwdSlug}`);
          urls.push(`${BASE_URL}/round-trip/${fwdSlug}`);
        }
      }
    }
    return urls;
  } catch (err) {
    console.warn('⚠️  Could not fetch route packages:', (err as Error).message);
    return [];
  }
}

/** Blog post URLs + blog index */
async function getBlogUrls(): Promise<string[]> {
  try {
    const posts = await (prisma as any).blog_posts.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    const urls = posts.map((p: any) => `${BASE_URL}/blog/${p.slug}`);
    urls.push(`${BASE_URL}/blog`);
    return urls;
  } catch (err) {
    console.warn('⚠️  Could not fetch blog posts:', (err as Error).message);
    return [`${BASE_URL}/blog`];
  }
}

/** Web story URLs */
async function getStoryUrls(): Promise<string[]> {
  try {
    const stories = await (prisma as any).web_stories.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return stories.map((s: any) => `${BASE_URL}/stories/${s.slug}`);
  } catch (err) {
    console.warn('⚠️  Could not fetch web stories:', (err as Error).message);
    return [];
  }
}

// ── Runner ─────────────────────────────────────────────────────────────────────

async function runInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

async function visitUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TransRentals-CacheWarmer/1.0' },
    });
    clearTimeout(timeout);
    return res.ok || res.status === 308 || res.status === 301 || res.status === 302;
  } catch {
    return false;
  }
}

async function warmSection(name: string, urls: string[], startTime: number) {
  if (urls.length === 0) {
    console.log(`  ${name}: skipped (0 URLs)`);
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  let done = 0;

  await runInBatches(urls, CONCURRENCY, async (url) => {
    const ok = await visitUrl(url);
    done++;
    if (ok) success++;
    else failed++;

    if (done % 500 === 0 || done === urls.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = Math.round((done / urls.length) * 100);
      console.log(`    [${pct}%] ${done}/${urls.length} — ✅ ${success} | ❌ ${failed} | ⏱ ${elapsed}s`);
    }
  });

  return { success, failed };
}

async function main() {
  console.log(`\n🔥 TransRentals Cache Warmer — Full Site`);
  console.log(`🌐 Base URL:    ${BASE_URL}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Collect all URLs in parallel
  console.log('📡 Fetching URL lists from database...');
  const [serviceLocationUrls, routeUrls, blogUrls, storyUrls] = await Promise.all([
    getServiceLocationUrls(),
    getRouteUrls(),
    getBlogUrls(),
    getStoryUrls(),
  ]);

  const staticUrls = getStaticPageUrls();
  const serviceMainUrls = getServiceMainUrls();

  // Deduplicate all URLs
  const allUrls = Array.from(new Set([
    ...staticUrls,
    ...serviceMainUrls,
    ...serviceLocationUrls,
    ...routeUrls,
    ...blogUrls,
    ...storyUrls,
  ]));

  console.log(`\n📊 URL Summary:`);
  console.log(`   Static pages:          ${staticUrls.length}`);
  console.log(`   Service main pages:    ${serviceMainUrls.length}`);
  console.log(`   Service+location pages:${serviceLocationUrls.length}`);
  console.log(`   Route pages:           ${routeUrls.length}`);
  console.log(`   Blog posts:            ${blogUrls.length}`);
  console.log(`   Web stories:           ${storyUrls.length}`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Total unique URLs:     ${allUrls.length}`);
  console.log(`\n⏱️  Est. time: ~${Math.ceil(allUrls.length / CONCURRENCY / 2)}s\n`);

  const startTime = Date.now();
  let totalSuccess = 0;
  let totalFailed = 0;

  const sections = [
    { name: '📄 Static pages', urls: staticUrls },
    { name: '🏠 Service main pages', urls: serviceMainUrls },
    { name: '📍 Service+location pages', urls: serviceLocationUrls },
    { name: '🚗 Route pages', urls: routeUrls },
    { name: '📝 Blog posts', urls: blogUrls },
    { name: '🎬 Web stories', urls: storyUrls },
  ];

  for (const section of sections) {
    console.log(`\n${section.name} (${section.urls.length} URLs)...`);
    const { success, failed } = await warmSection(section.name, section.urls, startTime);
    totalSuccess += success;
    totalFailed += failed;
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(totalTime / 60);
  const secs = totalTime % 60;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Cache warming complete in ${mins}m ${secs}s`);
  console.log(`   Success: ${totalSuccess} | Failed: ${totalFailed} | Total: ${allUrls.length}`);
  if (totalFailed > 0) {
    console.log(`   ⚠️  ${totalFailed} URLs failed — check server logs`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
