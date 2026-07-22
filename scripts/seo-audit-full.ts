/**
 * Full-site SEO Audit + Crawl Health Scan
 *
 * Unlike scripts/seo-audit.ts (5 hardcoded pages, manual-only), this walks
 * every real URL on the site — same URL universe as scripts/warm-cache.ts
 * (static pages, service pages, service+location pages, route pages, blog
 * posts, web stories) — and:
 *
 *   1. Runs the existing on-page audit engine (auditPage from
 *      src/lib/seo/audit-engine.ts) on every 200-OK page, upserting into
 *      `seo_audits` exactly like scripts/seo-audit.ts already does.
 *   2. Aggregates cross-page stats that nothing currently computes:
 *      duplicate titles/descriptions, missing titles/descriptions/H1,
 *      slow pages, and HTTP status-code buckets (200/301/302/404/500).
 *   3. Validates robots.txt and sitemap.xml reachability/consistency.
 *   4. Flags 404 URLs that have no matching active row in the `redirects`
 *      table — a "needs redirect" worklist.
 *   5. Writes one summary row to `crawl_data` per run.
 *
 * This file does not modify audit-engine.ts, seo-audit.ts, or warm-cache.ts —
 * URL-collector helpers are intentionally duplicated here (they are not
 * exported from warm-cache.ts) rather than changing that file.
 *
 * Usage:
 *   BASE_URL=https://transrentals.in npx tsx scripts/seo-audit-full.ts
 *   BASE_URL=https://transrentals.in npx tsx scripts/seo-audit-full.ts --concurrency=10
 *
 * Scheduled weekly via .github/workflows/seo-audit-cron.yml
 */

import crypto from 'crypto';
import { prisma } from '../src/lib/db/prisma';
import { auditPage, SEOAuditResult } from '../src/lib/seo/audit-engine';
import { STATIC_PAGES } from '../src/lib/seo/service-meta-templates';
import { SERVICE_PARENT_MAP } from '../src/lib/constants/service-mapping';

const BASE_URL = process.env.BASE_URL || 'https://transrentals.in';
const CONCURRENCY = parseInt(
  process.argv.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '10'
);
const SLOW_PAGE_THRESHOLD_SEC = 3;
const UA = 'TransRentals-SEOAuditor/1.0';

function genId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// ── URL collectors (duplicated from scripts/warm-cache.ts — not exported there) ─

const ALL_SERVICE_SLUGS: string[] = [
  '12-seater-tempo-traveller', '17-seater-tempo-traveller', '20-seater-tempo-traveller',
  '26-seater-bus', 'activa-on-rent', 'airport-transfer', 'apache-on-rent', 'bike-on-rent',
  'bike-tours', 'bike-trips', 'bus-rental', 'car-rental', 'chauffeur-service',
  'corporate-bus-rental', 'corporate-car-rental', 'crane-on-rent', 'creta-on-rent',
  'electric-scooter-rental', 'equipment-rental', 'excavator-on-rent', 'fortuner-on-rent',
  'generator-on-rent', 'himalayan-on-rent', 'hourly-car-rental', 'hydra-on-rent',
  'innova-on-rent', 'jcb-on-rent', 'ktm-on-rent', 'local-taxi', 'luxury-car-rental',
  'mini-truck-rental', 'monthly-bike-rental', 'monthly-car-rental', 'one-way-cab',
  'one-way-car-rental', 'outstation-cab', 'outstation-car-rental', 'packers-and-movers',
  'pulsar-on-rent', 'round-trip', 'royal-enfield-on-rent', 'scorpio-on-rent',
  'self-drive-car-rentals', 'self-drive-hatchback-rental', 'self-drive-sedan-rental',
  'self-drive-suv-rental', 'seltos-on-rent', 'splendor-on-rent', 'sports-car-rental',
  'swift-on-rent', 'tempo-traveller', 'trailer-on-rent', 'transporter',
  'vintage-car-rental', 'wedding-bus-rental', 'wedding-car-rental', 'xuv700-on-rent',
];

function getStaticPageUrls(): string[] {
  return STATIC_PAGES.map((p) => `${BASE_URL}${p.url}`);
}

function getServiceMainUrls(): string[] {
  return ALL_SERVICE_SLUGS.map((slug) => `${BASE_URL}/${slug}`);
}

const CHILD_SLUGS_BY_PARENT: Record<string, string[]> = {};
for (const [childSlug, parentSlug] of Object.entries(SERVICE_PARENT_MAP)) {
  if (!ALL_SERVICE_SLUGS.includes(childSlug)) continue;
  if (!CHILD_SLUGS_BY_PARENT[parentSlug]) CHILD_SLUGS_BY_PARENT[parentSlug] = [];
  CHILD_SLUGS_BY_PARENT[parentSlug].push(childSlug);
}
for (const slug of ALL_SERVICE_SLUGS) {
  if (!SERVICE_PARENT_MAP[slug]) {
    if (!CHILD_SLUGS_BY_PARENT[slug]) CHILD_SLUGS_BY_PARENT[slug] = [];
    if (!CHILD_SLUGS_BY_PARENT[slug].includes(slug)) CHILD_SLUGS_BY_PARENT[slug].push(slug);
  }
}

async function getServiceLocationUrls(): Promise<string[]> {
  try {
    const rows = await (prisma as any).service_locations.findMany({
      where: { isActive: true },
      include: { services: { select: { slug: true } }, locations: { select: { slug: true } } },
    });
    const urls: string[] = [];
    for (const r of rows) {
      const parentSlug = r.services.slug as string;
      const locationSlug = r.locations.slug as string;
      const childSlugs = CHILD_SLUGS_BY_PARENT[parentSlug];
      if (childSlugs && childSlugs.length > 0) {
        for (const slug of childSlugs) urls.push(`${BASE_URL}/${slug}/${locationSlug}`);
      } else {
        urls.push(`${BASE_URL}/${parentSlug}/${locationSlug}`);
      }
    }
    return urls;
  } catch (err) {
    console.warn('⚠️  Could not fetch service_locations:', (err as Error).message);
    return [];
  }
}

async function getRouteUrls(): Promise<string[]> {
  try {
    const routes = await (prisma as any).chauffeur_route_packages.findMany({
      where: { isActive: true },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { slug: true, type: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { slug: true, type: true } },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      take: 2000,
    });
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const r of routes) {
      const from = r.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const to = r.locations_chauffeur_route_packages_toLocationIdTolocations;
      if (!from || !to) continue;
      const isAirport = from.type === 'AIRPORT' || to.type === 'AIRPORT';
      const fwdSlug = `${from.slug}-to-${to.slug}`;
      const revSlug = `${to.slug}-to-${from.slug}`;
      if (isAirport) {
        if (!seen.has(`airport:${fwdSlug}`)) { seen.add(`airport:${fwdSlug}`); urls.push(`${BASE_URL}/airport-transfer/${fwdSlug}`); }
        if (!seen.has(`airport:${revSlug}`)) { seen.add(`airport:${revSlug}`); urls.push(`${BASE_URL}/airport-transfer/${revSlug}`); }
      } else {
        if (!seen.has(`ow:${fwdSlug}`)) { seen.add(`ow:${fwdSlug}`); urls.push(`${BASE_URL}/one-way-cab/${fwdSlug}`); }
        if (!seen.has(`rt:${fwdSlug}`)) { seen.add(`rt:${fwdSlug}`); urls.push(`${BASE_URL}/round-trip/${fwdSlug}`); }
      }
    }
    return urls;
  } catch (err) {
    console.warn('⚠️  Could not fetch route packages:', (err as Error).message);
    return [];
  }
}

async function getBlogUrls(): Promise<string[]> {
  try {
    const posts = await (prisma as any).blog_posts.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } });
    const urls = posts.map((p: any) => `${BASE_URL}/blog/${p.slug}`);
    urls.push(`${BASE_URL}/blog`);
    return urls;
  } catch (err) {
    console.warn('⚠️  Could not fetch blog posts:', (err as Error).message);
    return [`${BASE_URL}/blog`];
  }
}

async function getStoryUrls(): Promise<string[]> {
  try {
    const stories = await (prisma as any).web_stories.findMany({ where: { isPublished: true, isArchived: false }, select: { slug: true } });
    return stories.map((s: any) => `${BASE_URL}/stories/${s.slug}`);
  } catch (err) {
    console.warn('⚠️  Could not fetch web stories:', (err as Error).message);
    return [];
  }
}

// ── Concurrency runner ──────────────────────────────────────────────────────────

async function runInBatches<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

async function probeStatus(url: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { signal: controller.signal, redirect: 'manual', headers: { 'User-Agent': UA } });
    clearTimeout(timeout);
    return res.status;
  } catch {
    return 0;
  }
}

// ── robots.txt + sitemap.xml checks ─────────────────────────────────────────────

function extractLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (m) => m[1].trim());
}

async function checkRobotsTxt(): Promise<string[]> {
  const issues: string[] = [];
  try {
    const res = await fetch(`${BASE_URL}/robots.txt`, { headers: { 'User-Agent': UA } });
    if (!res.ok) { issues.push(`robots.txt unreachable (HTTP ${res.status})`); return issues; }
    const text = await res.text();
    if (/User-agent:\s*\*[\s\S]{0,60}?Disallow:\s*\/\s*(\n|$)/i.test(text)) {
      issues.push('robots.txt appears to Disallow: / for User-agent: * (blocking all crawlers)');
    }
    if (!/Sitemap:\s*https?:\/\//i.test(text)) {
      issues.push('robots.txt has no Sitemap: directive');
    }
  } catch {
    issues.push('robots.txt fetch failed entirely');
  }
  return issues;
}

async function fetchSitemapUrls(): Promise<{ urls: Set<string>; issues: string[] }> {
  const issues: string[] = [];
  const urls = new Set<string>();
  try {
    const indexRes = await fetch(`${BASE_URL}/sitemap.xml`, { headers: { 'User-Agent': UA } });
    if (!indexRes.ok) { issues.push(`sitemap.xml unreachable (HTTP ${indexRes.status})`); return { urls, issues }; }
    const childSitemaps = extractLocs(await indexRes.text());
    if (childSitemaps.length === 0) issues.push('sitemap.xml has no <loc> entries');
    for (const childUrl of childSitemaps) {
      try {
        const childRes = await fetch(childUrl, { headers: { 'User-Agent': UA } });
        if (!childRes.ok) { issues.push(`Child sitemap unreachable: ${childUrl} (HTTP ${childRes.status})`); continue; }
        extractLocs(await childRes.text()).forEach((u) => urls.add(u));
      } catch {
        issues.push(`Child sitemap fetch failed: ${childUrl}`);
      }
    }
  } catch {
    issues.push('sitemap.xml fetch failed entirely');
  }
  return { urls, issues };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Full-site SEO Audit + Crawl Health Scan');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  console.log('📡 Collecting all site URLs...');
  const [serviceLocationUrls, routeUrls, blogUrls, storyUrls] = await Promise.all([
    getServiceLocationUrls(), getRouteUrls(), getBlogUrls(), getStoryUrls(),
  ]);
  const staticUrls = getStaticPageUrls();
  const serviceMainUrls = getServiceMainUrls();
  const allUrls = Array.from(new Set([
    ...staticUrls, ...serviceMainUrls, ...serviceLocationUrls, ...routeUrls, ...blogUrls, ...storyUrls,
  ]));
  console.log(`   Total unique URLs: ${allUrls.length}\n`);

  console.log('🤖 Checking robots.txt & sitemap.xml...');
  const [robotsIssues, sitemapResult] = await Promise.all([checkRobotsTxt(), fetchSitemapUrls()]);
  const missingFromSitemap = allUrls.filter((u) => !sitemapResult.urls.has(u));

  console.log(`📄 Auditing ${allUrls.length} pages (concurrency=${CONCURRENCY})...`);

  const statusCounts: Record<string, number> = { '200': 0, '301': 0, '302': 0, '404': 0, '500': 0, other: 0 };
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();
  const notFoundPaths: string[] = [];
  let missingTitles = 0, missingDescriptions = 0, missingH1 = 0, slowPages = 0;
  let done = 0;

  await runInBatches(allUrls, CONCURRENCY, async (url) => {
    const status = await probeStatus(url);
    done++;
    if (done % 50 === 0 || done === allUrls.length) {
      console.log(`   [${Math.round((done / allUrls.length) * 100)}%] ${done}/${allUrls.length}`);
    }

    if (status === 301 || status === 308) statusCounts['301']++;
    else if (status === 302 || status === 307) statusCounts['302']++;
    else if (status === 404) { statusCounts['404']++; notFoundPaths.push(new URL(url).pathname); return; }
    else if (status >= 500) { statusCounts['500']++; return; }
    else if (status === 200) statusCounts['200']++;
    else { statusCounts.other++; return; }

    if (status !== 200) return;

    let result: SEOAuditResult;
    try {
      result = await auditPage(url, BASE_URL);
    } catch (err) {
      console.warn(`   ⚠️  Audit failed for ${url}: ${(err as Error).message}`);
      return;
    }

    if (!result.hasTitle) missingTitles++;
    if (!result.hasMetaDesc) missingDescriptions++;
    if (!result.hasH1) missingH1++;
    if (result.loadTime && result.loadTime > SLOW_PAGE_THRESHOLD_SEC) slowPages++;

    if (result.pageTitle) {
      const arr = titleMap.get(result.pageTitle) || [];
      arr.push(result.pagePath);
      titleMap.set(result.pageTitle, arr);
    }

    // auditPage() only returns metaDescLength, not the text — do one extra
    // lightweight fetch here so duplicate descriptions can be detected.
    try {
      const html = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
      const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
      if (m && m[1]) {
        const arr = descMap.get(m[1]) || [];
        arr.push(result.pagePath);
        descMap.set(m[1], arr);
      }
    } catch { /* best-effort only, doesn't block the audit */ }

    await prisma.seo_audits.upsert({
      where: { pagePath: result.pagePath },
      create: result,
      update: {
        pageTitle: result.pageTitle, lastAuditDate: result.lastAuditDate,
        overallScore: result.overallScore, technicalScore: result.technicalScore,
        contentScore: result.contentScore, onPageScore: result.onPageScore,
        hasTitle: result.hasTitle, titleLength: result.titleLength, titleIssue: result.titleIssue,
        hasMetaDesc: result.hasMetaDesc, metaDescLength: result.metaDescLength, metaDescIssue: result.metaDescIssue,
        hasCanonical: result.hasCanonical, canonicalUrl: result.canonicalUrl,
        hasH1: result.hasH1, h1Count: result.h1Count, h1Text: result.h1Text,
        h2Count: result.h2Count, h3Count: result.h3Count,
        wordCount: result.wordCount, readingTime: result.readingTime,
        hasImages: result.hasImages, imageCount: result.imageCount,
        imagesWithAlt: result.imagesWithAlt, imagesMissingAlt: result.imagesMissingAlt,
        internalLinks: result.internalLinks, externalLinks: result.externalLinks, brokenLinks: result.brokenLinks,
        isIndexable: result.isIndexable, hasRobotsMeta: result.hasRobotsMeta,
        hasStructuredData: result.hasStructuredData, structuredDataTypes: result.structuredDataTypes,
        hasOpenGraph: result.hasOpenGraph, hasTwitterCard: result.hasTwitterCard,
        isMobileFriendly: result.isMobileFriendly, viewportMeta: result.viewportMeta,
        pageSize: result.pageSize, loadTime: result.loadTime,
        issues: result.issues, warnings: result.warnings, passed: result.passed,
        updatedAt: new Date(),
      },
    });
  });

  const notFoundSet = new Set(notFoundPaths);
  const staleSitemapEntries: string[] = [];
  for (const sitemapUrl of sitemapResult.urls) {
    try {
      if (notFoundSet.has(new URL(sitemapUrl).pathname)) staleSitemapEntries.push(sitemapUrl);
    } catch { /* malformed sitemap URL, ignore */ }
  }

  console.log('\n🔀 Checking redirect coverage for 404s...');
  const redirectGaps: string[] = [];
  for (const path of notFoundPaths) {
    const existing = await prisma.redirects.findUnique({ where: { fromPath: path } });
    if (!existing || !existing.isActive) redirectGaps.push(path);
  }

  const duplicateTitleGroups = Array.from(titleMap.entries()).filter(([, paths]) => paths.length > 1);
  const duplicateDescGroups = Array.from(descMap.entries()).filter(([, paths]) => paths.length > 1);

  const issues: string[] = [
    ...robotsIssues,
    ...sitemapResult.issues,
    ...(missingFromSitemap.length ? [`${missingFromSitemap.length} real page(s) missing from sitemap.xml`] : []),
    ...(staleSitemapEntries.length ? [`${staleSitemapEntries.length} sitemap URL(s) now 404`] : []),
    ...(redirectGaps.length ? [`${redirectGaps.length} 404 URL(s) with no active redirect`] : []),
    ...duplicateTitleGroups.slice(0, 25).map(
      ([title, paths]) => `Duplicate title "${title}" on ${paths.length} pages: ${paths.slice(0, 5).join(', ')}${paths.length > 5 ? '…' : ''}`
    ),
    ...duplicateDescGroups.slice(0, 25).map(
      ([, paths]) => `Duplicate meta description on ${paths.length} pages: ${paths.slice(0, 5).join(', ')}${paths.length > 5 ? '…' : ''}`
    ),
  ];
  if (redirectGaps.length) issues.push(`REDIRECT_GAPS:${JSON.stringify(redirectGaps.slice(0, 200))}`);
  if (missingFromSitemap.length) issues.push(`MISSING_FROM_SITEMAP:${JSON.stringify(missingFromSitemap.slice(0, 200))}`);

  await prisma.crawl_data.create({
    data: {
      id: genId(),
      crawlDate: new Date(),
      totalPages: allUrls.length,
      indexedPages: statusCounts['200'],
      nonIndexedPages: allUrls.length - statusCounts['200'],
      errorPages: statusCounts['404'] + statusCounts['500'],
      htmlPages: statusCounts['200'],
      pdfPages: 0,
      imagePages: 0,
      status200: statusCounts['200'],
      status301: statusCounts['301'],
      status302: statusCounts['302'],
      status404: statusCounts['404'],
      status500: statusCounts['500'],
      duplicateTitles: duplicateTitleGroups.length,
      duplicateDescriptions: duplicateDescGroups.length,
      missingTitles,
      missingDescriptions,
      missingH1,
      brokenLinks: statusCounts['404'],
      slowPages,
      issues: issues.length ? JSON.stringify(issues) : null,
    },
  });

  console.log('\n✅ Crawl complete.');
  console.log(`   200: ${statusCounts['200']}  301: ${statusCounts['301']}  302: ${statusCounts['302']}  404: ${statusCounts['404']}  500: ${statusCounts['500']}`);
  console.log(`   Duplicate titles: ${duplicateTitleGroups.length}  Duplicate descriptions: ${duplicateDescGroups.length}`);
  console.log(`   Missing titles: ${missingTitles}  Missing descriptions: ${missingDescriptions}  Missing H1: ${missingH1}`);
  console.log(`   Redirect gaps: ${redirectGaps.length}  Slow pages (>${SLOW_PAGE_THRESHOLD_SEC}s): ${slowPages}`);
  console.log('\n💡 View results at: https://ai.transrentals.in (SEO & Keywords → Site Health)\n');
}

main()
  .catch((e) => { console.error('❌ Crawl failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
