/**
 * Full URL universe audit — answers "how many pages exist on the site?"
 *
 * Counts every route pattern:
 *   1. Service-city pages:  /{service}/{city}
 *   2. Sub-location pages:   /{service}/{city}/{sublocation}
 *   3. City pages:           /{city}        (via [slug] route)
 *   4. State pages:          /{state}       (via [slug] route)
 *   5. Service homepages:    /{service}     (top-level)
 *   6. CMS pages:            /{slug}        (admin-managed)
 *   7. Blog posts
 *   8. Static pages
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db/prisma';
import { INDIAN_CITIES, INDIAN_STATES } from '../src/data/indian-cities';
import { CITY_SUBLOCATIONS } from '../src/data/city-sublocations';

const SERVICES_DIR = path.join(process.cwd(), 'src', 'app', '(services)');

function getServiceFolders(): string[] {
  return fs.readdirSync(SERVICES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'layout.tsx')
    .map((d) => d.name);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 FULL URL UNIVERSE AUDIT — TransRentals');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ──────────────────────────────────────────────────────────
  // 1. Service folders on disk
  // ──────────────────────────────────────────────────────────
  const serviceFolders = getServiceFolders();
  console.log(`📁 Service folders in src/app/(services)/: ${serviceFolders.length}`);
  console.log(`   ${serviceFolders.slice(0, 10).join(', ')}...`);

  // Service homepages (top-level: /{service})
  console.log(`\n🏠 Service homepages (e.g. /car-rental): ${serviceFolders.length}`);

  // ──────────────────────────────────────────────────────────
  // 2. Active services in DB
  // ──────────────────────────────────────────────────────────
  const dbServices = await prisma.services.count({ where: { isActive: true } });
  const dbServicesTotal = await prisma.services.count();
  console.log(`\n💾 services table: ${dbServices} active / ${dbServicesTotal} total`);

  // ──────────────────────────────────────────────────────────
  // 3. Active locations
  // ──────────────────────────────────────────────────────────
  const activeLocations = await prisma.locations.count({
    where: { isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
  });
  console.log(`\n🏙️  locations table: ${activeLocations} active cities`);
  console.log(`   INDIAN_CITIES static list: ${INDIAN_CITIES.length} cities`);
  console.log(`   INDIAN_STATES static list: ${INDIAN_STATES.length} states`);

  // ──────────────────────────────────────────────────────────
  // 4. Service × city pages (the main count)
  // ──────────────────────────────────────────────────────────
  // For services WITH active service_locations rows
  const serviceLocationsActive = await prisma.service_locations.count({
    where: { isActive: true, services: { isActive: true } },
  });
  console.log(`\n📊 service_locations (active rows): ${serviceLocationsActive}`);

  // But generateStaticParams in most pages uses ALL active locations, not just service_locations
  // Let's check what each service does
  console.log(`\n   Most service pages use generateStaticParams from ALL active locations:`);
  console.log(`   = ${serviceFolders.length} services × ${activeLocations} cities = ${(serviceFolders.length * activeLocations).toLocaleString()} pre-built pages potentially`);

  // ──────────────────────────────────────────────────────────
  // 5. Sub-location pages
  // ──────────────────────────────────────────────────────────
  console.log(`\n🏘️  Sub-location pages (CITY_SUBLOCATIONS):`);
  let totalSublocations = 0;
  for (const [svc, cities] of Object.entries(CITY_SUBLOCATIONS)) {
    let svcCount = 0;
    for (const subs of Object.values(cities)) {
      svcCount += subs.length;
    }
    if (svcCount > 0) {
      console.log(`   ${svc}: ${svcCount} sub-location pages across ${Object.keys(cities).length} cities`);
      totalSublocations += svcCount;
    }
  }
  console.log(`   TOTAL sub-location pages: ${totalSublocations}`);

  // ──────────────────────────────────────────────────────────
  // 6. City / State pages (top-level [slug] route)
  // ──────────────────────────────────────────────────────────
  console.log(`\n🗺️  Top-level pages via /{slug} route:`);
  console.log(`   City pages (/delhi, /mumbai): up to ${activeLocations}`);
  console.log(`   State pages (/maharashtra): ${INDIAN_STATES.length}`);

  // ──────────────────────────────────────────────────────────
  // 7. CMS pages
  // ──────────────────────────────────────────────────────────
  try {
    const cmsPages = await prisma.pages.count({ where: { status: 'PUBLISHED' } });
    console.log(`\n📝 CMS pages (DB-managed): ${cmsPages} published`);
  } catch {
    console.log(`\n📝 CMS pages: table not accessible`);
  }

  // ──────────────────────────────────────────────────────────
  // 8. Blog posts
  // ──────────────────────────────────────────────────────────
  try {
    const blogPosts = await prisma.blog_posts.count({ where: { status: 'PUBLISHED' } });
    console.log(`\n📰 Blog posts: ${blogPosts} published`);
  } catch {
    console.log(`\n📰 Blog posts: table not accessible`);
  }

  // ──────────────────────────────────────────────────────────
  // GRAND TOTAL ESTIMATE
  // ──────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 GRAND TOTAL URL ESTIMATE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const cmsCount = await prisma.pages.count({ where: { status: 'PUBLISHED' } }).catch(() => 0);
  const blogCount = await prisma.blog_posts.count({ where: { status: 'PUBLISHED' } }).catch(() => 0);

  const serviceCity = serviceFolders.length * activeLocations;
  const cityPages = activeLocations;
  const statePages = INDIAN_STATES.length;
  const servicesHome = serviceFolders.length;

  console.log(`  Service × city pages:    ${serviceCity.toLocaleString().padStart(8)}  (${serviceFolders.length} services × ${activeLocations} cities)`);
  console.log(`  Sub-location pages:      ${totalSublocations.toLocaleString().padStart(8)}`);
  console.log(`  City-only pages:         ${cityPages.toLocaleString().padStart(8)}`);
  console.log(`  State pages:             ${statePages.toLocaleString().padStart(8)}`);
  console.log(`  Service home pages:      ${servicesHome.toLocaleString().padStart(8)}`);
  console.log(`  CMS pages:               ${cmsCount.toLocaleString().padStart(8)}`);
  console.log(`  Blog posts:              ${blogCount.toLocaleString().padStart(8)}`);
  console.log(`  ───────────────────────  ${'─'.repeat(8)}`);
  const total = serviceCity + totalSublocations + cityPages + statePages + servicesHome + cmsCount + blogCount;
  console.log(`  ESTIMATED TOTAL:         ${total.toLocaleString().padStart(8)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔍 GAP vs current inventory tool:');
  console.log(`   Current inventory shows: 3,955 (only service_locations.isActive=true rows)`);
  console.log(`   Real URL universe: ~${total.toLocaleString()}`);
  console.log(`   Missing from inventory: sub-locations, city pages, state pages, blog, CMS, services where service_locations is unset\n`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
