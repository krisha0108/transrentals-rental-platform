import { NextResponse } from 'next/server';
import { buildUrlsetXml, BASE_URL, SitemapEntry } from '@/lib/sitemap/utils';
import { CITY_SUBLOCATIONS } from '@/data/city-sublocations';

// Sub-location data is static — cache for 24 hours
export const revalidate = 86400;

export async function GET() {
  const today = new Date();
  const entries: SitemapEntry[] = [];

  for (const [serviceSlug, cities] of Object.entries(CITY_SUBLOCATIONS)) {
    for (const [citySlug, subLocations] of Object.entries(cities)) {
      for (const sl of subLocations) {
        entries.push({
          url: `${BASE_URL}/${serviceSlug}/${citySlug}/${sl.slug}`,
          lastModified: today,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
