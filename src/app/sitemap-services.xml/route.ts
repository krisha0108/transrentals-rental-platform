import { NextResponse } from 'next/server';
import {
  buildUrlsetXml,
  BASE_URL,
  LOCATION_SERVICES,
  SitemapEntry,
  getCachedServiceLocations,
} from '@/lib/sitemap/utils';

// Revalidate every hour — service-location combos change via admin panel
export const revalidate = 3600;

export async function GET() {
  const entries: SitemapEntry[] = [];

  try {
    const rows = await getCachedServiceLocations();
    const today = new Date();

    for (const sl of rows) {
      if (LOCATION_SERVICES.includes(sl.services.slug)) {
        entries.push({
          url: `${BASE_URL}/${sl.services.slug}/${sl.locations.slug}`,
          changeFrequency: 'weekly',
          priority: 0.8,
          lastModified: today,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap-services] DB error:', error);
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
