import { SERVICE_LABELS } from '../src/lib/ai/prompts/page-content';
import { prisma } from '../src/lib/db/prisma';

const MAIN = new Set([
  'car-rental', 'self-drive-car-rentals', 'bike-on-rent', 'bus-rental',
  'transporter', 'packers-and-movers', 'equipment-rental', 'luxury-car-rental',
]);

async function main() {
  const all = Object.keys(SERVICE_LABELS);
  const subs = all.filter((s) => !MAIN.has(s));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Inventory Coverage Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total in SERVICE_LABELS: ${all.length}`);
  console.log(`  Main services:         ${MAIN.size}`);
  console.log(`  Sub-services:          ${subs.length}\n`);

  const activeCities = await prisma.locations.count({
    where: { isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
  });
  console.log(`Active cities in DB:     ${activeCities}`);
  console.log(`Possible inventory rows: ${(all.length * activeCities).toLocaleString()}\n`);

  console.log('Sub-services that inventory shows (all editable from admin):');
  subs.forEach((s, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${s.padEnd(35)} (${SERVICE_LABELS[s].label})`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await prisma.$disconnect();
}

main();
