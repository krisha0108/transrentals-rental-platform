/**
 * Wraps the Search Console URL Inspection API (searchconsole.urlInspection.
 * index.inspect) — tells us, per URL, whether Google has actually indexed
 * it and why not if it hasn't. Unlike the crawler this can't be run at any
 * real concurrency: Google enforces a strict per-property quota (documented
 * at ~2,000 queries/day), so inspection-runner.ts below calls this one URL
 * at a time with a delay between calls.
 */

import { getSearchConsoleService } from '@/lib/integrations/google-search-console';

export type InspectionOutcome = {
  isIndexed: boolean | null;
  verdict: string | null; // PASS | FAIL | NEUTRAL | VERDICT_UNSPECIFIED
  coverageState: string | null; // human-readable, e.g. "Submitted and indexed"
  issues: {
    indexingState?: string | null;
    pageFetchState?: string | null;
    robotsTxtState?: string | null;
    crawledAs?: string | null;
    lastCrawlTime?: string | null;
    googleCanonical?: string | null;
    userCanonical?: string | null;
    sitemap?: string[] | null;
  };
  error: string | null;
};

export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<InspectionOutcome> {
  try {
    const searchConsole = await getSearchConsoleService();
    const res = await searchConsole.urlInspection.index.inspect({
      requestBody: { inspectionUrl, siteUrl, languageCode: 'en-US' },
    });

    const result = res.data.inspectionResult?.indexStatusResult;
    if (!result) {
      return { isIndexed: null, verdict: null, coverageState: null, issues: {}, error: 'No inspection result returned' };
    }

    return {
      isIndexed: result.verdict === 'PASS',
      verdict: result.verdict ?? null,
      coverageState: result.coverageState ?? null,
      issues: {
        indexingState: result.indexingState ?? null,
        pageFetchState: result.pageFetchState ?? null,
        robotsTxtState: result.robotsTxtState ?? null,
        crawledAs: result.crawledAs ?? null,
        lastCrawlTime: result.lastCrawlTime ?? null,
        googleCanonical: result.googleCanonical ?? null,
        userCanonical: result.userCanonical ?? null,
        sitemap: result.sitemap ?? null,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      isIndexed: null,
      verdict: null,
      coverageState: null,
      issues: {},
      error: err?.message || 'Inspection request failed',
    };
  }
}
