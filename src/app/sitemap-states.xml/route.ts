import { NextResponse } from 'next/server';
import { getCityBySlug, INDIAN_STATES } from '@/data/indian-cities';
import {
  buildUrlsetXml,
  BASE_URL,
  LOCATION_SERVICES,
  SitemapEntry,
  getCachedServiceLocations,
} from '@/lib/sitemap/utils';

// Same cache window as services — state pages depend on the same data
export const revalidate = 3600;

export async function GET() {
  const entries: SitemapEntry[] = [];

  try {
    // Reuses the same cached query as sitemap-services — no extra DB hit
    const rows = await getCachedServiceLocations();
    const statePageSet = new Set<string>();

    for (const sl of rows) {
      if (!LOCATION_SERVICES.includes(sl.services.slug)) continue;
      const cityData = getCityBySlug(sl.locations.slug);
      if (!cityData) continue;
      const state = INDIAN_STATES.find((s) => s.code === cityData.stateCode);
      if (!state?.slug) continue;
      const key = `${sl.services.slug}/${state.slug}`;
      if (statePageSet.has(key)) continue;
      statePageSet.add(key);
      entries.push({
        url: `${BASE_URL}/${sl.services.slug}/${state.slug}`,
        changeFrequency: 'weekly',
        priority: 0.85,
      });
    }
  } catch (error) {
    console.error('[sitemap-states] DB error:', error);
  }

  if (entries.length === 0) {
    return new NextResponse('Service temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '3600' },
    });
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
