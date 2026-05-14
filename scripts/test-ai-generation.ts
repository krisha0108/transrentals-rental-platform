/**
 * CLI test for AI content generation.
 * Runs 3 (service, city) combos and prints the AI output.
 *
 * Requires DEEPSEEK_API_KEY in .env
 *
 * Usage:
 *   npx tsx scripts/test-ai-generation.ts
 *   npx tsx scripts/test-ai-generation.ts --save      # also upsert to DB
 *   npx tsx scripts/test-ai-generation.ts --only=1    # only first combo
 */

import 'dotenv/config';
import { generatePageContent, contentToDbFields } from '../src/lib/ai/seo-content-generator';
import { prisma } from '../src/lib/db/prisma';

const TEST_COMBOS = [
  { service: 'car-rental', city: 'delhi', note: 'Tier-1 metro, plains' },
  { service: 'bike-on-rent', city: 'goa', note: 'Coastal, tourism-heavy — should emphasize scooters' },
  { service: 'packers-and-movers', city: 'mumbai', note: 'Tier-1 metro, complex shifting market' },
];

const DEEPSEEK_INPUT_RATE = 0.27 / 1_000_000;
const DEEPSEEK_OUTPUT_RATE = 1.10 / 1_000_000;

function estimateCostUsd(promptTokens: number, completionTokens: number): number {
  return promptTokens * DEEPSEEK_INPUT_RATE + completionTokens * DEEPSEEK_OUTPUT_RATE;
}

async function runOne(combo: typeof TEST_COMBOS[number], save: boolean) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`▶ ${combo.service} / ${combo.city}`);
  console.log(`  ${combo.note}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const startedAt = Date.now();
  const result = await generatePageContent({
    serviceSlug: combo.service,
    citySlug: combo.city,
  });
  const elapsedMs = Date.now() - startedAt;
  const costUsd = estimateCostUsd(result.usage.promptTokens, result.usage.completionTokens);

  console.log(`\n[META]`);
  console.log(`  Model: ${result.model}`);
  console.log(`  Terrain: ${result.cityContext.terrain}`);
  console.log(`  Tokens: ${result.usage.promptTokens} in + ${result.usage.completionTokens} out = ${result.usage.totalTokens}`);
  console.log(`  Cost:   ~$${costUsd.toFixed(5)} (${(costUsd * 83).toFixed(3)} INR)`);
  console.log(`  Time:   ${elapsedMs}ms`);

  console.log(`\n[META TITLE] (${result.content.metaTitle.length} chars)`);
  console.log(`  ${result.content.metaTitle}`);

  console.log(`\n[META DESCRIPTION] (${result.content.metaDescription.length} chars)`);
  console.log(`  ${result.content.metaDescription}`);

  console.log(`\n[H1] (${result.content.h1Heading.length} chars)`);
  console.log(`  ${result.content.h1Heading}`);

  console.log(`\n[INTRO] (${result.content.intro.length} chars)`);
  console.log(`  ${result.content.intro.slice(0, 300)}${result.content.intro.length > 300 ? '...' : ''}`);

  console.log(`\n[WHY CHOOSE US] (${result.content.whyChooseUs.length} items)`);
  for (const item of result.content.whyChooseUs.slice(0, 3)) {
    console.log(`  • ${item.title}: ${item.description.slice(0, 100)}...`);
  }

  console.log(`\n[POPULAR VEHICLES] (${result.content.popularVehicles.length} items)`);
  for (const v of result.content.popularVehicles) {
    console.log(`  • ${v.category}: ${v.models} — ${v.priceRange}`);
  }

  console.log(`\n[SERVICES OFFERED] (${result.content.servicesOffered.length} items)`);
  for (const s of result.content.servicesOffered.slice(0, 3)) {
    console.log(`  • ${s.name}: ${s.description.slice(0, 100)}...`);
  }

  console.log(`\n[FAQS] (${result.content.faqs.length} items)`);
  for (const f of result.content.faqs.slice(0, 3)) {
    console.log(`  Q: ${f.q}`);
    console.log(`  A: ${f.a.slice(0, 150)}${f.a.length > 150 ? '...' : ''}`);
  }

  console.log(`\n[TIPS] (${result.content.tips.length} items)`);
  for (const t of result.content.tips.slice(0, 4)) {
    console.log(`  • ${t}`);
  }

  if (save) {
    const dbFields = contentToDbFields(result.content);
    await prisma.service_city_content.upsert({
      where: { serviceSlug_citySlug: { serviceSlug: combo.service, citySlug: combo.city } },
      create: {
        serviceSlug: combo.service,
        citySlug: combo.city,
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: 'cli-test',
      },
      update: {
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: 'cli-test',
      },
    });
    console.log(`\n💾 Saved to DB.`);
  }

  return { tokens: result.usage.totalTokens, costUsd, elapsedMs };
}

async function main() {
  const save = process.argv.includes('--save');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyIdx = onlyArg ? parseInt(onlyArg.split('=')[1], 10) - 1 : null;

  const combos = onlyIdx !== null ? [TEST_COMBOS[onlyIdx]] : TEST_COMBOS;

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not set in .env');
    console.error('   Add this line to C:\\Users\\Admin\\Videos\\050326\\tran_stable\\.env:');
    console.error('   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx');
    process.exit(1);
  }

  console.log(`🚀 Testing AI generation (${combos.length} combos)${save ? ' [WILL SAVE TO DB]' : ' [dry run]'}\n`);

  let totalTokens = 0;
  let totalCost = 0;
  for (const combo of combos) {
    try {
      const r = await runOne(combo, save);
      totalTokens += r.tokens;
      totalCost += r.costUsd;
    } catch (err) {
      console.error(`\n❌ Failed: ${(err as Error).message}\n`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Done — ${totalTokens.toLocaleString()} tokens total, ~$${totalCost.toFixed(4)} (~${(totalCost * 83).toFixed(2)} INR)`);
  console.log(`   Avg per page: ${Math.round(totalTokens / combos.length)} tokens, ~$${(totalCost / combos.length).toFixed(5)}`);
  console.log(`   Estimated for 5000 pages: ~$${((totalCost / combos.length) * 5000).toFixed(2)} (~${(((totalCost / combos.length) * 5000) * 83).toFixed(0)} INR)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error('❌ Test crashed:', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
