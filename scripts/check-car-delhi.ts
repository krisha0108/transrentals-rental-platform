import { prisma } from '../src/lib/db/prisma';

async function main() {
  const row = await prisma.service_city_content.findUnique({
    where: {
      serviceSlug_citySlug: { serviceSlug: 'car-rental', citySlug: 'delhi' },
    },
    select: {
      sectionsConfig: true,
      status: true,
      source: true,
      metaTitle: true,
    },
  });
  if (!row) { console.log('NO ROW'); await prisma.$disconnect(); return; }
  console.log(`status=${row.status}  source=${row.source}`);
  console.log(`metaTitle: ${row.metaTitle}\n`);
  if (row.sectionsConfig) {
    const parsed = JSON.parse(row.sectionsConfig);
    console.log(`Sections (${parsed.length}):`);
    for (const s of parsed) {
      const len = (s.content ?? '').length;
      console.log(`  ${s.order}. ${s.label.padEnd(28)} (id=${s.id.padEnd(18)}) ${len}c ${s.visible ? '✓' : 'hidden'}`);
    }
  }
  await prisma.$disconnect();
}
main();
