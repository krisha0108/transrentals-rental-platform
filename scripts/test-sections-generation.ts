/**
 * End-to-end test for sections-mode AI generation (Phase 6).
 *
 * Runs the new block-based generator for 3 combos with different section
 * presets to verify each service's content shape works:
 *   - car-rental/delhi      (7 generic sections)
 *   - jcb-on-rent/mumbai    (machine specs / site requirements / safety)
 *   - wedding-car-rental/jaipur (packages / decorations / gallery / testimonials)
 *
 * Use --save to actually upsert into DB. Default is dry-run.
 */

import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { generateSectionsContent } from '../src/lib/ai/seo-content-generator';

const TESTS = [
  { service: 'car-rental', city: 'delhi', note: 'Tier-1 metro, 7 generic sections' },
  { service: 'jcb-on-rent', city: 'mumbai', note: 'Equipment — machine specs + site reqs + safety' },
  { service: 'wedding-car-rental', city: 'jaipur', note: 'Wedding — packages + decorations + gallery' },
];

async function runOne(t: typeof TESTS[number], save: boolean) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`▶ ${t.service} / ${t.city}`);
  console.log(`  ${t.note}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const start = Date.now();
  const result = await generateSectionsContent({
    serviceSlug: t.service,
    citySlug: t.city,
  });
  const elapsedMs = Date.now() - start;

  console.log(`\n[META] ${result.model} · ${result.usage.totalTokens} tokens · ${elapsedMs}ms`);
  console.log(`  title: ${result.payload.metaTitle} (${result.payload.metaTitle.length}c)`);
  console.log(`  desc:  ${result.payload.metaDescription.slice(0, 90)}... (${result.payload.metaDescription.length}c)`);
  console.log(`  h1:    ${result.payload.h1Heading} (${result.payload.h1Heading.length}c)`);

  console.log(`\n[SECTIONS] ${result.sectionsConfig.length} total`);
  for (const s of result.sectionsConfig) {
    const len = (s.content ?? '').length;
    const status = len > 0 ? '✓' : '✗';
    console.log(`  ${status} ${s.id.padEnd(20)} ${s.label.padEnd(30)} ${len}c`);
  }

  // Show first 200 chars of two sections to eyeball quality
  const hero = result.sectionsConfig.find((s) => s.id === 'hero');
  if (hero?.content) {
    console.log(`\n  [HERO preview]\n    ${hero.content.slice(0, 250)}...`);
  }
  const specific = result.sectionsConfig.find((s) =>
    ['machine_specs', 'packages', 'site_requirements', 'why_choose'].includes(s.id),
  );
  if (specific?.content) {
    console.log(`\n  [${specific.label} preview]\n    ${specific.content.slice(0, 250)}...`);
  }

  if (save) {
    await prisma.service_city_content.upsert({
      where: { serviceSlug_citySlug: { serviceSlug: t.service, citySlug: t.city } },
      create: {
        serviceSlug: t.service,
        citySlug: t.city,
        sectionsConfig: JSON.stringify(result.sectionsConfig),
        metaTitle: result.payload.metaTitle,
        metaDescription: result.payload.metaDescription,
        h1Heading: result.payload.h1Heading,
        status: 'ai_generated',
        source: 'ai',
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: 'cli:test-sections-generation',
      },
      update: {
        sectionsConfig: JSON.stringify(result.sectionsConfig),
        metaTitle: result.payload.metaTitle,
        metaDescription: result.payload.metaDescription,
        h1Heading: result.payload.h1Heading,
        status: 'ai_generated',
        source: 'ai',
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: 'cli:test-sections-generation',
      },
    });
    console.log('\n  💾 Saved to DB.');
  }

  return { tokens: result.usage.totalTokens, elapsedMs };
}

async function main() {
  const save = process.argv.includes('--save');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyIdx = onlyArg ? parseInt(onlyArg.split('=')[1], 10) - 1 : null;
  const tests = onlyIdx !== null ? [TESTS[onlyIdx]] : TESTS;

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  console.log(`🚀 Testing sections-mode AI generation (${tests.length} combos)${save ? ' [WILL SAVE]' : ' [dry run]'}`);

  let totalTokens = 0;
  for (const t of tests) {
    try {
      const r = await runOne(t, save);
      totalTokens += r.tokens;
    } catch (err) {
      console.error(`\n  ❌ Failed: ${(err as Error).message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total: ${totalTokens.toLocaleString()} tokens · ~₹${((totalTokens * 0.7 / 1_000_000) * 83).toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
