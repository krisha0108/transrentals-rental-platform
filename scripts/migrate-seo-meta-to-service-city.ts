/**
 * One-time data migration: copy admin edits from the legacy `seo_meta`
 * table into the matching `service_city_content` row so the unified new
 * admin (`/admin/seo-content/<svc>/<city>`) becomes the single source of
 * truth.
 *
 * For each seo_meta row whose `servicePageId` matches `<service>:<city>`:
 *   - Find or create the matching service_city_content row.
 *   - Copy metaTitle / metaDescription / metaKeywords / pageHeading /
 *     pageDescription IF the new system's field is currently empty for that
 *     row. Existing edits in the new system are NEVER overwritten.
 *   - If the seo_meta row also has sectionsConfig (city-pages style), we
 *     ignore it — service-city block content lives in
 *     service_city_content.sectionsConfig already.
 *
 * Idempotent: re-running is a no-op for already-migrated fields.
 *
 * Run:
 *   npx tsx scripts/migrate-seo-meta-to-service-city.ts            # dry-run
 *   npx tsx scripts/migrate-seo-meta-to-service-city.ts --apply
 *   npx tsx scripts/migrate-seo-meta-to-service-city.ts --apply --force  # overwrite new system too
 */

import { prisma } from '../src/lib/db/prisma';

type Args = { apply: boolean; force: boolean };
function parseArgs(): Args {
  return {
    apply: process.argv.includes('--apply'),
    force: process.argv.includes('--force'),
  };
}

async function main() {
  const args = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 seo_meta → service_city_content migration (${args.apply ? 'APPLY' : 'DRY RUN'})`);
  if (args.force) console.log('   --force: will overwrite existing service_city_content fields');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Find seo_meta rows with servicePageId matching "<service>:<city>"
  // (i.e. they belong to a specific service-city page, not a global static / city page)
  const allRows = await prisma.seo_meta.findMany({
    where: { servicePageId: { contains: ':' } },
    select: {
      servicePageId: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      pageHeading: true,
      pageDescription: true,
    },
  });

  // Exclude "city:..." and "state:..." and "static:..." (those aren't service-city)
  const targets = allRows.filter((r) => {
    const id = r.servicePageId!;
    return !id.startsWith('city:') && !id.startsWith('state:') && !id.startsWith('static:');
  });

  console.log(`seo_meta rows with service-city pageIds: ${targets.length}\n`);

  let copied = 0;
  let skippedNoChange = 0;
  let createdNewRow = 0;

  for (const sm of targets) {
    const [serviceSlug, citySlug] = sm.servicePageId!.split(':');
    if (!serviceSlug || !citySlug) continue;

    const existing = await prisma.service_city_content.findUnique({
      where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
      select: {
        id: true,
        metaTitle: true, metaDescription: true, metaKeywords: true,
        pageHeading: true, pageDescription: true,
      },
    });

    const updates: Record<string, string | null> = {};
    const log: string[] = [];

    function maybeCopy(field: 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'pageHeading' | 'pageDescription') {
      const src = (sm as any)[field];
      if (!src) return;
      const cur = existing ? (existing as any)[field] : null;
      if (cur && !args.force) return;
      if (cur === src) return;
      updates[field] = src;
      log.push(`  ${field}: ${cur ? `"${(cur as string).slice(0, 40)}..." → ` : ''}"${(src as string).slice(0, 40)}..."`);
    }

    maybeCopy('metaTitle');
    maybeCopy('metaDescription');
    maybeCopy('metaKeywords');
    maybeCopy('pageHeading');
    maybeCopy('pageDescription');

    if (Object.keys(updates).length === 0) {
      skippedNoChange += 1;
      continue;
    }

    console.log(`${args.apply ? '✓' : '+'} ${serviceSlug}/${citySlug}${existing ? '' : ' (NEW row)'}`);
    for (const l of log) console.log(l);

    if (args.apply) {
      if (existing) {
        await prisma.service_city_content.update({
          where: { id: existing.id },
          data: updates as any,
        });
      } else {
        await prisma.service_city_content.create({
          data: {
            serviceSlug,
            citySlug,
            ...updates,
            status: 'manual_edited',
            source: 'manual',
            lastEditedBy: 'migrate-seo-meta',
          } as any,
        });
        createdNewRow += 1;
      }
    }
    copied += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.apply ? 'Copied' : 'Would copy'}: ${copied}`);
  if (createdNewRow > 0) console.log(`  (new service_city_content rows created: ${createdNewRow})`);
  console.log(`Skipped (no change needed): ${skippedNoChange}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
