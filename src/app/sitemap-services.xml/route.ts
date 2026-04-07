import { NextResponse } from 'next/server';
import {
  buildUrlsetXml,
  BASE_URL,
  LOCATION_SERVICES,
  SitemapEntry,
  getCachedServiceLocations,
} from '@/lib/sitemap/utils';
import { ALL_CITIES } from '@/data/indian-cities';
import { SERVICE_PARENT_MAP } from '@/lib/constants/service-mapping';

// Revalidate every hour — service-location combos change via admin panel
export const revalidate = 3600;

// Services that generate pages for ALL indian cities (coming-soon model)
const COMING_SOON_SERVICES = ['bike-on-rent', 'self-drive-car-rentals'];

// Build parentSlug → public child slugs map (only slugs that are real public pages)
const CHILD_SLUGS_BY_PARENT: Record<string, string[]> = {};
for (const [childSlug, parentSlug] of Object.entries(SERVICE_PARENT_MAP)) {
  if (!childSlug.includes('/') && LOCATION_SERVICES.includes(childSlug)) {
    if (!CHILD_SLUGS_BY_PARENT[parentSlug]) CHILD_SLUGS_BY_PARENT[parentSlug] = [];
    CHILD_SLUGS_BY_PARENT[parentSlug].push(childSlug);
  }
}

export async function GET() {
  const entries: SitemapEntry[] = [];

  try {
    const rows = await getCachedServiceLocations();
    const today = new Date();

    // Track DB-enabled URLs to avoid duplicates
    const dbUrlSet = new Set<string>();

    for (const sl of rows) {
      const parentSlug = sl.services.slug;
      const locationSlug = sl.locations.slug;

      // Get all public sub-service slugs for this parent (e.g. bike-rental → royal-enfield-on-rent, activa-on-rent, …)
      const childSlugs = CHILD_SLUGS_BY_PARENT[parentSlug];

      if (childSlugs && childSlugs.length > 0) {
        for (const slug of childSlugs) {
          const url = `${BASE_URL}/${slug}/${locationSlug}`;
          if (!dbUrlSet.has(url)) {
            dbUrlSet.add(url);
            entries.push({ url, changeFrequency: 'weekly', priority: 0.8, lastModified: today });
          }
        }
      } else if (LOCATION_SERVICES.includes(parentSlug)) {
        // Parent is itself a public page (e.g. luxury-car-rental)
        const url = `${BASE_URL}/${parentSlug}/${locationSlug}`;
        if (!dbUrlSet.has(url)) {
          dbUrlSet.add(url);
          entries.push({ url, changeFrequency: 'weekly', priority: 0.8, lastModified: today });
        }
      }
    }

    // Add ALL indian cities for coming-soon services (lower priority)
    for (const serviceSlug of COMING_SOON_SERVICES) {
      for (const city of ALL_CITIES) {
        const url = `${BASE_URL}/${serviceSlug}/${city.slug}`;
        if (!dbUrlSet.has(url)) {
          entries.push({ url, changeFrequency: 'monthly', priority: 0.4, lastModified: today });
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
