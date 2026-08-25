/**
 * Wraps the PageSpeed Insights API (v5) — a plain REST endpoint gated by an
 * API key, not OAuth, so this is independent of the Search Console
 * connection. Prefers real-user field data (loadingExperience, from Chrome
 * UX Report) since that's what Google's ranking systems actually use for
 * "Core Web Vitals" — most of this site's long-tail location pages won't
 * have enough traffic for CrUX to have data though, so this falls back to
 * the lab-simulated Lighthouse audit values when field data is absent.
 */

import { prisma } from '@/lib/db/prisma';

const PAGESPEED_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const REQUEST_TIMEOUT_MS = 60_000; // real Lighthouse runs can take 20-40s

export type VitalsOutcome = {
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  performanceScore: number | null; // 0-100
  dataSource: 'field' | 'lab' | null;
  error: string | null;
};

async function getStoredApiKey(): Promise<string | null> {
  const row = await prisma.integration_settings.findUnique({
    where: { service: 'pagespeed_insights' },
    select: { config: true },
  });
  if (!row?.config) return null;
  try {
    return (JSON.parse(row.config) as { apiKey?: string }).apiKey || null;
  } catch {
    return null;
  }
}

export async function saveApiKey(apiKey: string) {
  await prisma.integration_settings.upsert({
    where: { service: 'pagespeed_insights' },
    create: { id: 'pagespeed_' + Date.now().toString(36), service: 'pagespeed_insights', isActive: true, config: JSON.stringify({ apiKey }) },
    update: { config: JSON.stringify({ apiKey }), isActive: true, updatedAt: new Date() },
  });
}

export async function getApiKeyStatus(): Promise<{ isConfigured: boolean; source: 'database' | 'env' | null }> {
  const stored = await getStoredApiKey();
  if (stored) return { isConfigured: true, source: 'database' };
  if (process.env.PAGESPEED_API_KEY) return { isConfigured: true, source: 'env' };
  return { isConfigured: false, source: null };
}

async function resolveApiKey(): Promise<string | null> {
  return (await getStoredApiKey()) || process.env.PAGESPEED_API_KEY || null;
}

function extractField(metrics: any, key: string): number | null {
  const v = metrics?.[key]?.percentile;
  return typeof v === 'number' ? v : null;
}

export async function checkVitals(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<VitalsOutcome> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    return { lcpMs: null, cls: null, inpMs: null, performanceScore: null, dataSource: null, error: 'PageSpeed Insights API key not configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ url, key: apiKey, strategy, category: 'performance' });
    const res = await fetch(`${PAGESPEED_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
    const data = await res.json();

    if (!res.ok) {
      return { lcpMs: null, cls: null, inpMs: null, performanceScore: null, dataSource: null, error: data?.error?.message || `PageSpeed API responded ${res.status}` };
    }

    // Field data (real-user CrUX) for this exact URL, when Google has enough
    // traffic to report it — this is what actually feeds search ranking.
    const fieldMetrics = data.loadingExperience?.metrics;
    if (fieldMetrics && data.loadingExperience?.overall_category) {
      const lcpMs = extractField(fieldMetrics, 'LARGEST_CONTENTFUL_PAINT_MS');
      const cls = extractField(fieldMetrics, 'CUMULATIVE_LAYOUT_SHIFT_SCORE');
      const inpMsRaw = extractField(fieldMetrics, 'INTERACTION_TO_NEXT_PAINT') ?? extractField(fieldMetrics, 'FIRST_INPUT_DELAY_MS');
      const perfScore = data.lighthouseResult?.categories?.performance?.score;
      return {
        lcpMs,
        cls: cls != null ? cls / 100 : null, // CrUX reports CLS*100 as an integer
        inpMs: inpMsRaw,
        performanceScore: typeof perfScore === 'number' ? Math.round(perfScore * 100) : null,
        dataSource: 'field',
        error: null,
      };
    }

    // No field data for this URL (typical for low-traffic long-tail pages) —
    // fall back to the lab-simulated Lighthouse run, which every request
    // includes regardless.
    const audits = data.lighthouseResult?.audits;
    const perfScore = data.lighthouseResult?.categories?.performance?.score;
    const lcpMs = audits?.['largest-contentful-paint']?.numericValue ?? null;
    const cls = audits?.['cumulative-layout-shift']?.numericValue ?? null;
    // Lab runs don't measure real interactivity (INP needs real input events);
    // Total Blocking Time is the closest lab proxy Lighthouse provides.
    const inpMs = audits?.['total-blocking-time']?.numericValue ?? null;

    return {
      lcpMs: lcpMs != null ? Math.round(lcpMs) : null,
      cls,
      inpMs: inpMs != null ? Math.round(inpMs) : null,
      performanceScore: typeof perfScore === 'number' ? Math.round(perfScore * 100) : null,
      dataSource: lcpMs != null ? 'lab' : null,
      error: lcpMs == null ? 'No usable data in PageSpeed response' : null,
    };
  } catch (err: any) {
    return { lcpMs: null, cls: null, inpMs: null, performanceScore: null, dataSource: null, error: err?.message || 'PageSpeed request failed' };
  } finally {
    clearTimeout(timeout);
  }
}
