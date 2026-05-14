/**
 * One-time migration: convert legacy structured fields
 * (intro, whyChooseUs, popularVehicles, servicesOffered, faqs, tips, routes)
 * into the new block-based sectionsConfig JSON.
 *
 * Old fields are NOT touched — they remain for any caller still reading them.
 * Idempotent: rows that already have sectionsConfig are left alone unless --force.
 *
 * Run:
 *   npx tsx scripts/migrate-to-sections-config.ts
 *   npx tsx scripts/migrate-to-sections-config.ts --dry-run
 *   npx tsx scripts/migrate-to-sections-config.ts --force         # overwrite existing
 *   npx tsx scripts/migrate-to-sections-config.ts --service=car-rental
 */

import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { getDefaultSectionsForService } from '../src/lib/ai/service-sections';
import type { SectionConfig } from '../src/lib/city-sections';

type Args = {
  dryRun: boolean;
  force: boolean;
  serviceFilter?: string;
};

function parseArgs(): Args {
  const a: Args = { dryRun: false, force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') a.dryRun = true;
    else if (arg === '--force') a.force = true;
    else if (arg.startsWith('--service=')) a.serviceFilter = arg.split('=')[1];
  }
  return a;
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type WhyChoose = { title: string; description: string };
type Vehicle = { category: string; models: string; priceRange?: string; bestFor?: string };
type ServiceItem = { name: string; description: string };
type Faq = { q: string; a: string };
type Route = { to: string; distance: string; duration: string; via?: string };

function introHtml(intro: string | null): string {
  if (!intro) return '';
  const paragraphs = intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}

function whyChooseHtml(items: WhyChoose[] | null): string {
  if (!items || items.length === 0) return '';
  return `<ul>\n${items
    .map((i) => `  <li><strong>${escapeHtml(i.title)}:</strong> ${escapeHtml(i.description)}</li>`)
    .join('\n')}\n</ul>`;
}

function vehiclesHtml(items: Vehicle[] | null): string {
  if (!items || items.length === 0) return '';
  return `<ul>\n${items
    .map((v) => {
      const parts = [`<strong>${escapeHtml(v.category)}:</strong> ${escapeHtml(v.models)}`];
      if (v.priceRange) parts.push(` (${escapeHtml(v.priceRange)})`);
      if (v.bestFor) parts.push(` — ${escapeHtml(v.bestFor)}`);
      return `  <li>${parts.join('')}</li>`;
    })
    .join('\n')}\n</ul>`;
}

function servicesHtml(items: ServiceItem[] | null): string {
  if (!items || items.length === 0) return '';
  return `<ul>\n${items
    .map((s) => `  <li><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(s.description)}</li>`)
    .join('\n')}\n</ul>`;
}

function tipsHtml(items: string[] | null): string {
  if (!items || items.length === 0) return '';
  return `<ol>\n${items.map((t) => `  <li>${escapeHtml(t)}</li>`).join('\n')}\n</ol>`;
}

function routesHtml(items: Route[] | null, cityName: string): string {
  if (!items || items.length === 0) return '';
  return `<ul>\n${items
    .map((r) => {
      const via = r.via ? ` via ${escapeHtml(r.via)}` : '';
      return `  <li><strong>${escapeHtml(cityName)} → ${escapeHtml(r.to)}</strong> — ${escapeHtml(r.distance)} · ${escapeHtml(r.duration)}${via}</li>`;
    })
    .join('\n')}\n</ul>`;
}

function buildSectionsConfig(row: {
  serviceSlug: string;
  citySlug: string;
  intro: string | null;
  whyChooseUs: string | null;
  popularVehicles: string | null;
  servicesOffered: string | null;
  faqs: string | null;
  tips: string | null;
  routes: string | null;
}): SectionConfig[] {
  const defaults = getDefaultSectionsForService(row.serviceSlug);
  const cityName = row.citySlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const whyChoose = safeParse<WhyChoose[]>(row.whyChooseUs);
  const vehicles = safeParse<Vehicle[]>(row.popularVehicles);
  const services = safeParse<ServiceItem[]>(row.servicesOffered);
  const faqs = safeParse<Faq[]>(row.faqs);
  const tips = safeParse<string[]>(row.tips);
  const routes = safeParse<Route[]>(row.routes);

  const contentForId = (id: string): string | undefined => {
    switch (id) {
      case 'hero': return introHtml(row.intro);
      case 'why_choose': return whyChooseHtml(whyChoose);
      case 'popular_vehicles': return vehiclesHtml(vehicles);
      case 'services_offered': return servicesHtml(services);
      case 'faqs':
      case 'faq':
        return faqs && faqs.length > 0 ? JSON.stringify(faqs) : undefined;
      case 'tips': return tipsHtml(tips);
      case 'popular_routes': return routesHtml(routes, cityName);
      default: return undefined;
    }
  };

  return defaults.map((s) => {
    const content = contentForId(s.id);
    return content ? { ...s, content } : { ...s };
  });
}

function hasAnyLegacyContent(row: any): boolean {
  return !!(row.intro || row.whyChooseUs || row.popularVehicles || row.servicesOffered || row.faqs || row.tips || row.routes);
}

async function main() {
  const args = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Migrating service_city_content → sectionsConfig');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Dry run:   ${args.dryRun ? 'YES' : 'NO'}`);
  console.log(`Force:     ${args.force ? 'YES (overwrite existing)' : 'NO (skip if already set)'}`);
  console.log(`Filter:    ${args.serviceFilter ?? 'all services'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const where: any = {};
  if (args.serviceFilter) where.serviceSlug = args.serviceFilter;
  if (!args.force) where.sectionsConfig = null;

  const rows = await prisma.service_city_content.findMany({
    where,
    select: {
      id: true,
      serviceSlug: true,
      citySlug: true,
      intro: true,
      whyChooseUs: true,
      popularVehicles: true,
      servicesOffered: true,
      faqs: true,
      tips: true,
      routes: true,
      sectionsConfig: true,
    },
  });

  console.log(`Candidates: ${rows.length}\n`);

  let migrated = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!hasAnyLegacyContent(row)) {
      skipped += 1;
      continue;
    }
    const sections = buildSectionsConfig(row);
    const sectionsJson = JSON.stringify(sections);

    if (args.dryRun) {
      console.log(`  + ${row.serviceSlug}/${row.citySlug} — ${sections.length} sections, ${sectionsJson.length}c`);
    } else {
      await prisma.service_city_content.update({
        where: { id: row.id },
        data: { sectionsConfig: sectionsJson },
      });
      console.log(`  ✓ ${row.serviceSlug}/${row.citySlug} — ${sections.length} sections`);
    }
    migrated += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.dryRun ? 'Would migrate' : 'Migrated'}: ${migrated}`);
  console.log(`Skipped (no legacy content): ${skipped}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
