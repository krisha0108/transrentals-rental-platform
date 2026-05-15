/**
 * Audit which sub-service pages actually have content in DB
 * vs which are empty (rendering empty ServiceCitySections).
 */

import { prisma } from '../src/lib/db/prisma';
import { SERVICE_LABELS } from '../src/lib/ai/prompts/page-content';

const MAIN_SERVICES = new Set([
  'car-rental', 'self-drive-car-rentals', 'bike-on-rent', 'bus-rental',
  'transporter', 'packers-and-movers', 'equipment-rental', 'luxury-car-rental',
]);

async function main() {
  const allServices = Object.keys(SERVICE_LABELS);
  const subServices = allServices.filter((s) => !MAIN_SERVICES.has(s));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Sub-Service Content Audit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Main services:  ${MAIN_SERVICES.size}`);
  console.log(`Sub-services:   ${subServices.length}`);
  console.log(`Total:          ${allServices.length}\n`);

  // For each service, count rows with content
  console.log('Service'.padEnd(35) + 'Rows  WithContent  AI  Manual  Published');
  console.log('─'.repeat(80));

  const summary: { slug: string; total: number; withContent: number; ai: number; manual: number; published: number }[] = [];

  for (const slug of allServices) {
    const total = await prisma.service_city_content.count({
      where: { serviceSlug: slug },
    });
    const withContent = await prisma.service_city_content.count({
      where: {
        serviceSlug: slug,
        OR: [
          { sectionsConfig: { not: null } },
          { intro: { not: null } },
        ],
      },
    });
    const ai = await prisma.service_city_content.count({
      where: { serviceSlug: slug, source: 'ai' },
    });
    const manual = await prisma.service_city_content.count({
      where: { serviceSlug: slug, source: 'manual' },
    });
    const published = await prisma.service_city_content.count({
      where: { serviceSlug: slug, status: 'published' },
    });

    summary.push({ slug, total, withContent, ai, manual, published });
  }

  // Print main services first
  console.log('\n=== MAIN SERVICES (8) ===');
  for (const s of summary.filter((s) => MAIN_SERVICES.has(s.slug))) {
    console.log(
      s.slug.padEnd(35) +
        String(s.total).padStart(5) +
        String(s.withContent).padStart(13) +
        String(s.ai).padStart(5) +
        String(s.manual).padStart(8) +
        String(s.published).padStart(11),
    );
  }

  console.log('\n=== SUB-SERVICES (49) ===');
  for (const s of summary.filter((s) => !MAIN_SERVICES.has(s.slug))) {
    const marker = s.total === 0 ? ' ❌ EMPTY' : '';
    console.log(
      s.slug.padEnd(35) +
        String(s.total).padStart(5) +
        String(s.withContent).padStart(13) +
        String(s.ai).padStart(5) +
        String(s.manual).padStart(8) +
        String(s.published).padStart(11) +
        marker,
    );
  }

  // Summary stats
  const mainTotal = summary.filter((s) => MAIN_SERVICES.has(s.slug)).reduce((a, b) => a + b.total, 0);
  const subTotal = summary.filter((s) => !MAIN_SERVICES.has(s.slug)).reduce((a, b) => a + b.total, 0);
  const subEmpty = summary.filter((s) => !MAIN_SERVICES.has(s.slug) && s.total === 0).length;
  const subWithContent = summary.filter((s) => !MAIN_SERVICES.has(s.slug) && s.total > 0).length;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Main service rows total:      ${mainTotal}`);
  console.log(`Sub-service rows total:       ${subTotal}`);
  console.log(`Sub-services with ANY data:   ${subWithContent} / ${subServices.length}`);
  console.log(`Sub-services with ZERO data:  ${subEmpty} / ${subServices.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
