/**
 * Full URL inventory — all 57 service folders × all 495 active cities = ~28k URLs.
 *
 * Sources:
 *   - Services: SERVICE_LABELS (one entry per folder in src/app/(services)/)
 *   - Cities: prisma.locations where isActive=true
 *   - Content status: service_city_content rows
 *
 * Why not service_locations? Because each service page's generateStaticParams
 * pulls directly from prisma.locations (all active cities), so all 57 ×
 * active-city combinations resolve to a real built page — independent of
 * whether the services table has a row.
 *
 * Pagination is mandatory at this scale. Default page size 200; max 1000.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { getCityBySlug } from '@/data/indian-cities';

type InventoryRow = {
  serviceSlug: string;
  serviceLabel: string;
  citySlug: string;
  cityName: string;
  cityState: string | null;
  cityTier: number | null;
  cityPriority: number | null;
  hasContent: boolean;
  contentId: string | null;
  contentStatus: string | null;
  contentSource: string | null;
  introLength: number;
  faqsCount: number;
  autoUpdate: boolean;
  aiTokensUsed: number | null;
  lastAiUpdate: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

function jsonArrayLen(s: string | null): number {
  if (!s) return 0;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filterServiceSlug = searchParams.get('service') || undefined;
  const filterContentStatus = searchParams.get('contentStatus') || undefined;
  const filterTier = searchParams.get('tier');
  const filterStateCode = searchParams.get('stateCode') || undefined;
  const onlyMissing = searchParams.get('onlyMissing') === '1';
  const onlyWithContent = searchParams.get('onlyWithContent') === '1';
  const citySearch = searchParams.get('city') || undefined;
  const limit = Math.min(1000, Math.max(50, parseInt(searchParams.get('limit') || '200', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  // ── 1. All service slugs (from SERVICE_LABELS = mirror of folders on disk) ──
  const allServiceSlugs = Object.keys(SERVICE_LABELS);
  const targetServices = filterServiceSlug
    ? allServiceSlugs.filter((s) => s === filterServiceSlug)
    : allServiceSlugs;

  // ── 2. All active cities ─────────────────────────────────────────────────────
  const locations = await prisma.locations.findMany({
    where: {
      isActive: true,
      type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] },
    },
    select: { slug: true, name: true },
    orderBy: [{ name: 'asc' }],
  });

  // ── 3. All managed content rows for the target services ─────────────────────
  const content = await prisma.service_city_content.findMany({
    where: { serviceSlug: { in: targetServices } },
    select: {
      id: true,
      serviceSlug: true,
      citySlug: true,
      intro: true,
      faqs: true,
      status: true,
      source: true,
      autoUpdate: true,
      aiTokensUsed: true,
      lastAiUpdate: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  const contentMap = new Map<string, (typeof content)[number]>();
  for (const c of content) contentMap.set(`${c.serviceSlug}::${c.citySlug}`, c);

  // ── 4. Build all rows (cross-product) ───────────────────────────────────────
  const allRows: InventoryRow[] = [];

  for (const svcSlug of targetServices) {
    const svcLabel = SERVICE_LABELS[svcSlug];
    if (!svcLabel) continue;

    for (const loc of locations) {
      const staticCity = getCityBySlug(loc.slug);
      if (filterStateCode && staticCity?.stateCode !== filterStateCode) continue;
      if (filterTier && String(staticCity?.tier) !== filterTier) continue;
      if (citySearch && !loc.slug.includes(citySearch.toLowerCase()) && !loc.name.toLowerCase().includes(citySearch.toLowerCase())) continue;

      const key = `${svcSlug}::${loc.slug}`;
      const c = contentMap.get(key);
      const hasContent = !!c;

      if (onlyMissing && hasContent) continue;
      if (onlyWithContent && !hasContent) continue;
      if (filterContentStatus && c?.status !== filterContentStatus) continue;

      allRows.push({
        serviceSlug: svcSlug,
        serviceLabel: svcLabel.label,
        citySlug: loc.slug,
        cityName: loc.name,
        cityState: staticCity?.state ?? null,
        cityTier: staticCity?.tier ?? null,
        cityPriority: staticCity?.priority ?? null,
        hasContent,
        contentId: c?.id ?? null,
        contentStatus: c?.status ?? null,
        contentSource: c?.source ?? null,
        introLength: c?.intro?.length ?? 0,
        faqsCount: jsonArrayLen(c?.faqs ?? null),
        autoUpdate: c?.autoUpdate ?? false,
        aiTokensUsed: c?.aiTokensUsed ?? null,
        lastAiUpdate: c?.lastAiUpdate?.toISOString() ?? null,
        publishedAt: c?.publishedAt?.toISOString() ?? null,
        updatedAt: c?.updatedAt?.toISOString() ?? null,
      });
    }
  }

  // Sort: tier asc (nulls last), then priority desc, then service order, then city name
  const serviceOrder = new Map(allServiceSlugs.map((s, i) => [s, i]));
  allRows.sort((a, b) => {
    const tA = a.cityTier ?? 99;
    const tB = b.cityTier ?? 99;
    if (tA !== tB) return tA - tB;
    const pA = a.cityPriority ?? 0;
    const pB = b.cityPriority ?? 0;
    if (pA !== pB) return pB - pA;
    const sA = serviceOrder.get(a.serviceSlug) ?? 0;
    const sB = serviceOrder.get(b.serviceSlug) ?? 0;
    if (sA !== sB) return sA - sB;
    return a.cityName.localeCompare(b.cityName);
  });

  // ── 5. Per-service summary (always full counts, not paginated) ──────────────
  const summaryByService = allServiceSlugs.map((slug) => {
    const label = SERVICE_LABELS[slug].label;
    const totalLive = locations.length; // every active city is a live URL
    const withContent = content.filter((c) => c.serviceSlug === slug).length;
    const published = content.filter((c) => c.serviceSlug === slug && c.status === 'published').length;
    const aiGenerated = content.filter((c) => c.serviceSlug === slug && c.status === 'ai_generated').length;
    const manual = content.filter((c) => c.serviceSlug === slug && c.source === 'manual').length;
    const autoUpdateOn = content.filter((c) => c.serviceSlug === slug && c.autoUpdate).length;
    return {
      slug,
      name: label,
      totalLivePages: totalLive,
      withContent,
      published,
      aiGenerated,
      manual,
      autoUpdateOn,
    };
  });

  // Sort summary by total content count desc, then name
  summaryByService.sort((a, b) => b.withContent - a.withContent || a.name.localeCompare(b.name));

  // ── 6. Overall stats ─────────────────────────────────────────────────────────
  const totalLivePages = allServiceSlugs.length * locations.length;
  const totalWithContent = content.length;
  const overall = {
    totalServices: allServiceSlugs.length,
    totalCities: locations.length,
    totalLivePages,
    withContent: totalWithContent,
    needingContent: totalLivePages - totalWithContent,
    coveragePct: totalLivePages > 0 ? Math.round((totalWithContent / totalLivePages) * 100) : 0,
  };

  // ── 7. Paginate the rows ────────────────────────────────────────────────────
  const totalMatched = allRows.length;
  const paginatedRows = allRows.slice(offset, offset + limit);

  return NextResponse.json({
    services: allServiceSlugs.map((slug) => ({ slug, name: SERVICE_LABELS[slug].label })),
    summaryByService,
    overall,
    pagination: {
      offset,
      limit,
      totalMatched,
      hasMore: offset + limit < totalMatched,
    },
    rows: paginatedRows,
  });
}
