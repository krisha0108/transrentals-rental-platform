import { prisma } from '../src/lib/db/prisma';

async function main() {
  const total = await prisma.service_city_content.count();
  const withSections = await prisma.service_city_content.count({
    where: { sectionsConfig: { not: null } },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total rows:           ${total}`);
  console.log(`With sectionsConfig:  ${withSections} (${((withSections / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Sample: car-rental/delhi sections:');
  const delhi = await prisma.service_city_content.findUnique({
    where: { serviceSlug_citySlug: { serviceSlug: 'car-rental', citySlug: 'delhi' } },
    select: { sectionsConfig: true },
  });
  if (delhi?.sectionsConfig) {
    const parsed = JSON.parse(delhi.sectionsConfig);
    for (const s of parsed) {
      const len = s.content?.length ?? 0;
      console.log(`  ${s.order}. ${s.label} (id=${s.id}, content=${len}c, visible=${s.visible})`);
    }
  }

  console.log('\nSample: jcb-on-rent/delhi sections (no legacy data — should be empty content):');
  const jcb = await prisma.service_city_content.findUnique({
    where: { serviceSlug_citySlug: { serviceSlug: 'jcb-on-rent', citySlug: 'delhi' } },
    select: { sectionsConfig: true, intro: true },
  });
  if (jcb?.sectionsConfig) {
    const parsed = JSON.parse(jcb.sectionsConfig);
    for (const s of parsed) {
      console.log(`  ${s.order}. ${s.label} (id=${s.id}, content=${s.content?.length ?? 0}c)`);
    }
  } else if (jcb) {
    console.log('  (sectionsConfig not set — JCB row exists but no legacy fields populated)');
  } else {
    console.log('  (no row for jcb-on-rent/delhi)');
  }

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
