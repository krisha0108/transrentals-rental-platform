import { NextResponse } from 'next/server';
import {
  buildUrlsetXml,
  BASE_URL,
  LOCATION_SERVICES,
  SitemapEntry,
  getCachedServiceLocations,
} from '@/lib/sitemap/utils';
import { ALL_CITIES } from '@/data/indian-cities';

// Revalidate every hour — service-location combos change via admin panel
export const revalidate = 3600;

// Services that generate pages for ALL indian cities (coming-soon model)
const COMING_SOON_SERVICES = ['bike-on-rent', 'self-drive-car-rentals'];

export async function GET() {
  const entries: SitemapEntry[] = [];

  try {
    const rows = await getCachedServiceLocations();
    const today = new Date();

    // Track DB-enabled URLs to avoid duplicates
    const dbUrlSet = new Set<string>();

    for (const sl of rows) {
      if (LOCATION_SERVICES.includes(sl.services.slug)) {
        const url = `${BASE_URL}/${sl.services.slug}/${sl.locations.slug}`;
        dbUrlSet.add(url);
        entries.push({
          url,
          changeFrequency: 'weekly',
          priority: 0.8,
          lastModified: today,
        });
      }
    }

    // Add ALL indian cities for coming-soon services (lower priority)
    for (const serviceSlug of COMING_SOON_SERVICES) {
      for (const city of ALL_CITIES) {
        const url = `${BASE_URL}/${serviceSlug}/${city.slug}`;
        if (!dbUrlSet.has(url)) {
          entries.push({
            url,
            changeFrequency: 'monthly',
            priority: 0.4,
            lastModified: today,
          });
        }
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
