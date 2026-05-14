import { prisma } from '../src/lib/db/prisma';

async function main() {
  const row = await prisma.service_city_content.findUnique({
    where: {
      serviceSlug_citySlug: {
        serviceSlug: 'bike-on-rent',
        citySlug: 'ahmedabad',
      },
    },
    select: {
      sectionsConfig: true,
      status: true,
      source: true,
      metaTitle: true,
      metaDescription: true,
      lastEditedBy: true,
      updatedAt: true,
    },
  });
  if (!row) {
    console.log('NO ROW for bike-on-rent/ahmedabad');
    await prisma.$disconnect();
    return;
  }
  console.log('Row state:');
  console.log(`  status:        ${row.status}`);
  console.log(`  source:        ${row.source}`);
  console.log(`  lastEditedBy:  ${row.lastEditedBy}`);
  console.log(`  metaTitle:     ${row.metaTitle}`);
  console.log(`  metaDesc:      ${row.metaDescription?.slice(0, 90)}...`);
  console.log(`  updatedAt:     ${row.updatedAt}`);

  if (row.sectionsConfig) {
    const parsed = JSON.parse(row.sectionsConfig);
    console.log(`\nSections (${parsed.length}):`);
    for (const s of parsed) {
      const len = (s.content ?? '').length;
      console.log(`  ${s.order}. ${s.label.padEnd(30)} (id=${s.id.padEnd(18)}) ${len}c ${s.visible ? '✓' : 'hidden'}`);
    }
  } else {
    console.log('\nNo sectionsConfig set.');
  }
  await prisma.$disconnect();
}

main();
