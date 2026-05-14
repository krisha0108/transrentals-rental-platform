/**
 * CLI inventory check — same logic as /api/admin/seo-content/inventory
 * but runs without auth so you can verify counts from terminal.
 */

import { prisma } from '../src/lib/db/prisma';
import { getCityBySlug } from '../src/data/indian-cities';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PAGES INVENTORY — what is live on site');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const services = await prisma.services.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, displayOrder: true },
    orderBy: { displayOrder: 'asc' },
  });

  console.log(`Active services in DB: ${services.length}\n`);

  let totalLive = 0;
  let totalWithContent = 0;

  for (const svc of services) {
    const sls = await prisma.service_locations.findMany({
      where: { serviceId: svc.id, isActive: true },
      select: { locations: { select: { slug: true, name: true } } },
    });

    if (sls.length === 0) continue;

    const cityCount = await prisma.service_city_content.count({
      where: { serviceSlug: svc.slug },
    });

    const aiCount = await prisma.service_city_content.count({
      where: { serviceSlug: svc.slug, source: 'ai' },
    });

    const publishedCount = await prisma.service_city_content.count({
      where: { serviceSlug: svc.slug, status: 'published' },
    });

    totalLive += sls.length;
    totalWithContent += cityCount;

    const pct = ((cityCount / sls.length) * 100).toFixed(0);
    console.log(`${svc.name.padEnd(35)} ${String(sls.length).padStart(4)} live  ${String(cityCount).padStart(4)} with content (${pct}%)  ${String(aiCount).padStart(3)} AI  ${String(publishedCount).padStart(3)} published`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TOTAL: ${totalLive} live pages, ${totalWithContent} with managed content (${((totalWithContent/Math.max(1,totalLive))*100).toFixed(0)}%)`);
  console.log(`GAP:   ${totalLive - totalWithContent} pages need content`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
