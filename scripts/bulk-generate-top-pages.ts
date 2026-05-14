/**
 * Bulk-generate AI SEO content for top N cities × top M services.
 *
 * Picks cities by priority from indian-cities.ts, services from a fixed
 * list (the 8 highest-revenue/highest-traffic services). Runs requests
 * in parallel with bounded concurrency; saves results to service_city_content.
 *
 * Default: 10 cities × 8 services = 80 pages, concurrency 5, save to DB.
 *
 * Flags:
 *   --cities=N         Top N cities by priority (default 10)
 *   --services=N       Top N services from default list (default 8)
 *   --concurrency=N    Parallel API calls (default 5)
 *   --dry-run          Print plan without calling API
 *   --no-save          Generate but don't write to DB (cost-paying preview)
 *   --skip-existing    Skip combos that already have AI-generated content
 *
 * Examples:
 *   npx tsx scripts/bulk-generate-top-pages.ts
 *   npx tsx scripts/bulk-generate-top-pages.ts --cities=5 --services=4
 *   npx tsx scripts/bulk-generate-top-pages.ts --dry-run
 *   npx tsx scripts/bulk-generate-top-pages.ts --skip-existing
 */

import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import {
  generatePageContent,
  contentToDbFields,
  GenerateError,
} from '../src/lib/ai/seo-content-generator';
import { INDIAN_CITIES } from '../src/data/indian-cities';

// Top 8 services by revenue/traffic — order = priority
const TOP_SERVICES = [
  'car-rental',
  'self-drive-car-rentals',
  'bike-on-rent',
  'bus-rental',
  'tempo-traveller',
  'packers-and-movers',
  'airport-transfer',
  'outstation-car-rental',
];

const DEEPSEEK_INPUT_RATE = 0.27 / 1_000_000;
const DEEPSEEK_OUTPUT_RATE = 1.10 / 1_000_000;

type Args = {
  cities: number;
  services: number;
  concurrency: number;
  dryRun: boolean;
  save: boolean;
  skipExisting: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const a: Args = {
    cities: 10,
    services: 8,
    concurrency: 5,
    dryRun: false,
    save: true,
    skipExisting: false,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') a.dryRun = true;
    else if (arg === '--no-save') a.save = false;
    else if (arg === '--skip-existing') a.skipExisting = true;
    else if (arg.startsWith('--cities=')) a.cities = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--services=')) a.services = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--concurrency=')) a.concurrency = parseInt(arg.split('=')[1], 10);
  }
  a.cities = Math.max(1, Math.min(100, a.cities));
  a.services = Math.max(1, Math.min(TOP_SERVICES.length, a.services));
  a.concurrency = Math.max(1, Math.min(10, a.concurrency));
  return a;
}

type Target = { serviceSlug: string; citySlug: string; cityName: string };

function buildTargets(args: Args): Target[] {
  const cities = [...INDIAN_CITIES]
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    })
    .slice(0, args.cities);

  const services = TOP_SERVICES.slice(0, args.services);

  const targets: Target[] = [];
  for (const svc of services) {
    for (const city of cities) {
      targets.push({ serviceSlug: svc, citySlug: city.slug, cityName: city.name });
    }
  }
  return targets;
}

async function filterExisting(targets: Target[]): Promise<Target[]> {
  const rows = await prisma.service_city_content.findMany({
    where: {
      OR: targets.map((t) => ({
        AND: [{ serviceSlug: t.serviceSlug }, { citySlug: t.citySlug }],
      })),
      source: 'ai',
      aiTokensUsed: { not: null },
    },
    select: { serviceSlug: true, citySlug: true },
  });
  const has = new Set(rows.map((r) => `${r.serviceSlug}::${r.citySlug}`));
  return targets.filter((t) => !has.has(`${t.serviceSlug}::${t.citySlug}`));
}

type ItemResult = {
  target: Target;
  ok: boolean;
  tokensUsed?: number;
  elapsedMs: number;
  error?: string;
};

async function processOne(target: Target, save: boolean): Promise<ItemResult> {
  const startedAt = Date.now();
  try {
    const result = await generatePageContent({
      serviceSlug: target.serviceSlug,
      citySlug: target.citySlug,
    });

    if (save) {
      const dbFields = contentToDbFields(result.content);
      await prisma.service_city_content.upsert({
        where: {
          serviceSlug_citySlug: {
            serviceSlug: target.serviceSlug,
            citySlug: target.citySlug,
          },
        },
        create: {
          serviceSlug: target.serviceSlug,
          citySlug: target.citySlug,
          ...dbFields,
          status: 'ai_generated',
          source: 'ai',
          aiModel: result.model,
          aiTokensUsed: result.usage.totalTokens,
          lastAiUpdate: new Date(),
          lastEditedBy: 'cli:bulk-generate-top-pages',
        },
        update: {
          ...dbFields,
          status: 'ai_generated',
          source: 'ai',
          aiModel: result.model,
          aiTokensUsed: result.usage.totalTokens,
          lastAiUpdate: new Date(),
          lastEditedBy: 'cli:bulk-generate-top-pages',
        },
      });
    }

    return {
      target,
      ok: true,
      tokensUsed: result.usage.totalTokens,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      target,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: err instanceof GenerateError ? err.message : (err as Error).message,
    };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const queue = items.map((item, idx) => ({ item, idx }));
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await worker(next.item, next.idx);
    }
  });
  await Promise.all(workers);
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m${rem}s`;
}

function bar(progress: number, total: number, width = 30): string {
  const filled = Math.round((progress / total) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`;
}

async function main() {
  const args = parseArgs();

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not set in .env');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 BULK AI CONTENT GENERATION — top pages');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Cities:       Top ${args.cities} by priority`);
  console.log(`Services:     Top ${args.services} (${TOP_SERVICES.slice(0, args.services).join(', ')})`);
  console.log(`Concurrency:  ${args.concurrency} parallel`);
  console.log(`Save to DB:   ${args.save ? 'YES' : 'NO (preview only)'}`);
  console.log(`Skip existing AI rows: ${args.skipExisting ? 'YES' : 'NO'}`);
  console.log(`Dry run:      ${args.dryRun ? 'YES (no API calls)' : 'NO'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let targets = buildTargets(args);

  if (args.skipExisting) {
    const before = targets.length;
    targets = await filterExisting(targets);
    console.log(`⊘ Skipped ${before - targets.length} combos that already have AI content`);
  }

  console.log(`Total targets: ${targets.length}\n`);

  if (args.dryRun) {
    console.log('Would generate:');
    for (const t of targets) {
      console.log(`  /${t.serviceSlug}/${t.citySlug} (${t.cityName})`);
    }
    const estTokens = targets.length * 4400;
    const estCost = estTokens * 0.7 / 1_000_000;
    console.log(`\nEstimated tokens: ${estTokens.toLocaleString()}`);
    console.log(`Estimated cost:   ~$${estCost.toFixed(3)} (₹${(estCost * 83).toFixed(1)})`);
    console.log(`Estimated time:   ~${Math.ceil(targets.length * 32 / args.concurrency / 60)} min`);
    return;
  }

  if (targets.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const overallStart = Date.now();
  const results: ItemResult[] = [];
  let inFlight = 0;
  let done = 0;

  await runWithConcurrency(targets, args.concurrency, async (target) => {
    inFlight += 1;
    process.stdout.write(`\r${bar(done, targets.length)} ${done}/${targets.length} done · ${inFlight} in flight    `);

    const result = await processOne(target, args.save);
    results.push(result);
    done += 1;
    inFlight -= 1;

    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    if (result.ok) {
      console.log(
        `✓ ${target.serviceSlug}/${target.citySlug} — ${result.tokensUsed} tok · ${formatDuration(result.elapsedMs)}`,
      );
    } else {
      console.log(`✗ ${target.serviceSlug}/${target.citySlug} — ERROR: ${result.error}`);
    }
    process.stdout.write(`${bar(done, targets.length)} ${done}/${targets.length} done · ${inFlight} in flight    `);
  });

  process.stdout.write('\r' + ' '.repeat(80) + '\r');

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const totalTokens = ok.reduce((s, r) => s + (r.tokensUsed ?? 0), 0);
  const totalCost = totalTokens * 0.7 / 1_000_000;
  const elapsedMs = Date.now() - overallStart;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Succeeded:   ${ok.length}/${targets.length}`);
  console.log(`  Failed:      ${failed.length}`);
  console.log(`  Total tokens: ${totalTokens.toLocaleString()}`);
  console.log(`  Total cost:  ~$${totalCost.toFixed(4)} (₹${(totalCost * 83).toFixed(2)})`);
  console.log(`  Total time:  ${formatDuration(elapsedMs)}`);
  console.log(`  Avg per page: ${Math.round(totalTokens / Math.max(1, ok.length))} tok, ${formatDuration(elapsedMs / Math.max(1, ok.length))}`);

  if (failed.length > 0) {
    console.log('\n❌ Failures:');
    for (const f of failed) {
      console.log(`  ${f.target.serviceSlug}/${f.target.citySlug}: ${f.error}`);
    }
  }

  if (args.save && ok.length > 0) {
    const dbCount = await prisma.service_city_content.count({ where: { source: 'ai' } });
    console.log(`\n💾 service_city_content rows with source='ai': ${dbCount}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error('\n💥 Fatal error:', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
