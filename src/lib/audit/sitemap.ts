/**
 * Fetches the live sitemap index and every sub-sitemap it points to,
 * returning every <loc> URL found — this is the source of truth for what
 * URLs the crawler checks, since it's exactly what we've told Google (and
 * anyone else) is worth crawling.
 */

const SITEMAP_FETCH_TIMEOUT_MS = 15_000;

async function fetchXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'TransRentalsSiteAudit/1.0' } });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return [...matches].map((m) => m[1].trim()).filter(Boolean);
}

function isSitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex');
}

export type SitemapUrl = { url: string; sourceSitemap: string };

export async function discoverSitemapUrls(rootSitemapUrl: string): Promise<SitemapUrl[]> {
  const rootXml = await fetchXml(rootSitemapUrl);

  if (!isSitemapIndex(rootXml)) {
    // Root sitemap directly lists pages (no index).
    return extractLocs(rootXml).map((url) => ({ url, sourceSitemap: rootSitemapUrl }));
  }

  const subSitemaps = extractLocs(rootXml);
  const results: SitemapUrl[] = [];

  // Sub-sitemaps are fetched sequentially (there are only a handful of
  // them, ~7 on this site) — no need for concurrency here, unlike the
  // actual per-page crawl which has tens of thousands of URLs.
  for (const sub of subSitemaps) {
    try {
      const xml = await fetchXml(sub);
      const locs = extractLocs(xml);
      for (const url of locs) results.push({ url, sourceSitemap: sub });
    } catch (err) {
      console.error(`Failed to fetch/parse sub-sitemap ${sub}:`, err);
    }
  }

  return results;
}
