/**
 * Migration v2 — enrich existing service_city_content.sectionsConfig with
 * content migrated from the static city-rich-content.ts file and a default
 * pricing_table HTML. Run AFTER scripts/migrate-to-sections-config.ts.
 *
 * For each row that has sectionsConfig (from v1 migration):
 *   - For each section in the current preset for that service:
 *       - If the section is already in sectionsConfig and has content → keep as-is (admin edits preserved)
 *       - If section is new in preset and we have data for it → add with content from static sources
 *       - If new section but no data → leave empty (admin/AI can fill later)
 *
 * Idempotent: re-running enriches new fields only, never overwrites
 * existing admin-edited content.
 *
 * Run:
 *   npx tsx scripts/enrich-sections-config.ts
 *   npx tsx scripts/enrich-sections-config.ts --dry-run
 *   npx tsx scripts/enrich-sections-config.ts --service=self-drive-car-rentals
 *   npx tsx scripts/enrich-sections-config.ts --force        # rebuild even existing sections
 */

import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { getDefaultSectionsForService } from '../src/lib/ai/service-sections';
import { CITY_RICH } from '../src/data/city-rich-content';
import type { SectionConfig } from '../src/lib/city-sections';

type Args = { dryRun: boolean; force: boolean; serviceFilter?: string };

function parseArgs(): Args {
  const a: Args = { dryRun: false, force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') a.dryRun = true;
    else if (arg === '--force') a.force = true;
    else if (arg.startsWith('--service=')) a.serviceFilter = arg.split('=')[1];
  }
  return a;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Content builders for the new section types ───────────────────────────

function pickupZonesHtml(citySlug: string): string | null {
  const data = CITY_RICH[citySlug];
  if (!data?.neighborhoods?.length) return null;
  return `<ul>\n${data.neighborhoods
    .map((n) =>
      `  <li><strong>${esc(n.name)}</strong> <em>(${esc(n.type)})</em> — ${esc(n.pickupNote)}</li>`,
    )
    .join('\n')}\n</ul>`;
}

function attractionsHtml(citySlug: string): string | null {
  const data = CITY_RICH[citySlug];
  if (!data?.attractions?.length) return null;
  return `<ul>\n${data.attractions
    .map((a) =>
      `  <li><strong>${esc(a.name)}</strong> — ${esc(a.distance)}. <em>Best vehicle:</em> ${esc(a.bestVehicle)}</li>`,
    )
    .join('\n')}\n</ul>`;
}

function drivingInfoHtml(citySlug: string): string | null {
  const data = CITY_RICH[citySlug];
  if (!data?.drivingInfo) return null;
  const { restrictions, parking, highwayNote } = data.drivingInfo;
  return [
    `<p><strong>Restrictions:</strong> ${esc(restrictions)}</p>`,
    `<p><strong>Parking:</strong> ${esc(parking)}</p>`,
    `<p><strong>Highways:</strong> ${esc(highwayNote)}</p>`,
  ].join('\n');
}

// Generic pricing default — admin will edit per service. Service-specific
// pricing comes from SERVICE_LABELS.priceContext but rendering as a
// uniform table here keeps the migration simple.
function pricingTableHtml(serviceSlug: string): string {
  const isPerHour = ['hourly-car-rental', 'local-taxi', 'chauffeur-service'].includes(serviceSlug);
  const isPerKm = ['outstation-car-rental', 'outstation-cab', 'one-way-cab', 'one-way-car-rental', 'round-trip'].includes(serviceSlug);
  const isPerDay = !isPerHour && !isPerKm;

  const rows = isPerKm
    ? [
        ['Sedan',  '₹11-14/km',  'Driver allowance ₹300/day extra'],
        ['SUV',    '₹16-20/km',  'Driver allowance ₹400/day extra'],
        ['Premium','₹22-30/km',  'Driver allowance ₹500/day extra'],
      ]
    : isPerDay
      ? [
          ['Hourly',  '₹150-300',     '4 hours minimum'],
          ['Daily',   '₹899-2,999',   '24 hours package'],
          ['Weekly',  '₹6,000-18,000', '7 days — 10% off'],
          ['Monthly', '₹20,000-60,000', '30 days — 30% off'],
        ]
      : [
          ['4hr / 40km',  '₹999-1,500',  'Local errands'],
          ['8hr / 80km',  '₹1,800-2,800', 'Full-day local'],
          ['12hr / 120km','₹2,500-3,800', 'Extended day'],
        ];

  const head = isPerKm
    ? '<tr><th>Vehicle</th><th>Per km</th><th>Notes</th></tr>'
    : '<tr><th>Duration</th><th>Price</th><th>Details</th></tr>';

  const body = rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

// ── Merge logic ──────────────────────────────────────────────────────────

function hasMeaningfulContent(content: string | undefined): boolean {
  if (!content) return false;
  const t = content.trim();
  return t.length > 0 && t !== '<p></p>';
}

function buildEnrichedSections(
  serviceSlug: string,
  citySlug: string,
  current: SectionConfig[] | null,
  force: boolean,
): { next: SectionConfig[]; addedIds: string[] } {
  const preset = getDefaultSectionsForService(serviceSlug);
  const existingById = new Map<string, SectionConfig>();
  for (const s of current ?? []) existingById.set(s.id, s);

  const addedIds: string[] = [];
  const next: SectionConfig[] = [];

  for (let i = 0; i < preset.length; i++) {
    const p = preset[i];
    const existing = existingById.get(p.id);
    if (existing) {
      // Keep existing as-is unless --force AND we have new data
      if (force && hasNewDataForSection(p.id, citySlug, serviceSlug)) {
        const content = generateForSection(p.id, citySlug, serviceSlug);
        next.push({ ...existing, content: content ?? existing.content });
        addedIds.push(`${p.id} (refreshed)`);
      } else {
        next.push({ ...existing, order: i });
      }
      existingById.delete(p.id);
      continue;
    }
    // Section not in current — add it with generated content if we have data
    const content = generateForSection(p.id, citySlug, serviceSlug);
    next.push({
      ...p,
      order: i,
      content: content ?? undefined,
    });
    if (content) addedIds.push(p.id);
    else addedIds.push(`${p.id} (empty)`);
  }

  // Append any custom sections that admin added (not in preset)
  let order = next.length;
  for (const leftover of existingById.values()) {
    next.push({ ...leftover, order: order++ });
  }

  return { next, addedIds };
}

function hasNewDataForSection(id: string, citySlug: string, serviceSlug: string): boolean {
  switch (id) {
    case 'pickup_zones':  return !!pickupZonesHtml(citySlug);
    case 'attractions':   return !!attractionsHtml(citySlug);
    case 'driving_info':  return !!drivingInfoHtml(citySlug);
    case 'pricing_table': return true; // we generate a default for any service
    default: return false;
  }
}

function generateForSection(id: string, citySlug: string, serviceSlug: string): string | null {
  switch (id) {
    case 'pickup_zones':  return pickupZonesHtml(citySlug);
    case 'attractions':   return attractionsHtml(citySlug);
    case 'driving_info':  return drivingInfoHtml(citySlug);
    case 'pricing_table': return pricingTableHtml(serviceSlug);
    default: return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Enriching sectionsConfig with city-rich-content + pricing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Dry run:   ${args.dryRun}`);
  console.log(`Force:     ${args.force}`);
  console.log(`Service:   ${args.serviceFilter ?? 'all'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const where: any = {};
  if (args.serviceFilter) where.serviceSlug = args.serviceFilter;

  const rows = await prisma.service_city_content.findMany({
    where,
    select: { id: true, serviceSlug: true, citySlug: true, sectionsConfig: true },
  });

  console.log(`Candidates: ${rows.length}\n`);

  let touched = 0;
  let unchanged = 0;
  const addedTotals = new Map<string, number>();

  for (const row of rows) {
    let current: SectionConfig[] | null = null;
    try {
      if (row.sectionsConfig) current = JSON.parse(row.sectionsConfig);
    } catch {}

    const { next, addedIds } = buildEnrichedSections(
      row.serviceSlug,
      row.citySlug,
      current,
      args.force,
    );

    // Compare — did we actually change anything?
    const before = JSON.stringify(current ?? []);
    const after = JSON.stringify(next);
    if (before === after) {
      unchanged += 1;
      continue;
    }

    if (args.dryRun) {
      console.log(`  + ${row.serviceSlug}/${row.citySlug} — ${next.length} sections (added: ${addedIds.join(', ') || 'none'})`);
    } else {
      await prisma.service_city_content.update({
        where: { id: row.id },
        data: { sectionsConfig: after },
      });
      console.log(`  ✓ ${row.serviceSlug}/${row.citySlug} — ${next.length} sections`);
    }

    for (const a of addedIds) {
      addedTotals.set(a, (addedTotals.get(a) ?? 0) + 1);
    }
    touched += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.dryRun ? 'Would enrich' : 'Enriched'}: ${touched}`);
  console.log(`Unchanged: ${unchanged}`);
  if (addedTotals.size > 0) {
    console.log('\nSection additions:');
    for (const [id, count] of [...addedTotals.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${id}: ${count}`);
    }
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
