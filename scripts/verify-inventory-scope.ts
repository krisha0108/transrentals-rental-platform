import { prisma } from '../src/lib/db/prisma';
import { SERVICE_LABELS } from '../src/lib/ai/prompts/page-content';

async function main() {
  const services = Object.keys(SERVICE_LABELS);
  const cities = await prisma.locations.count({
    where: { isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
  });
  const content = await prisma.service_city_content.count();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 INVENTORY SCOPE (after Phase 6 update)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Services in SERVICE_LABELS:    ${services.length}`);
  console.log(`Active cities:                 ${cities}`);
  console.log(`Total LIVE service-city URLs:  ${(services.length * cities).toLocaleString()}`);
  console.log(`Content rows in DB:            ${content}`);
  console.log(`Coverage:                      ${((content / (services.length * cities)) * 100).toFixed(1)}%`);
  console.log(`Pages needing content:         ${(services.length * cities - content).toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await prisma.$disconnect();
}
main();
