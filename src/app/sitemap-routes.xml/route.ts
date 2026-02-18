import { NextResponse } from 'next/server';
import {
  buildUrlsetXml,
  BASE_URL,
  SitemapEntry,
  getCachedRoutePackages,
} from '@/lib/sitemap/utils';

// Route packages change less frequently than service-locations
export const revalidate = 3600;

export async function GET() {
  const entries: SitemapEntry[] = [];

  try {
    const { city: cityRoutes, airport: airportRoutes } = await getCachedRoutePackages();

    // One-way-cab + round-trip
    const seenRoutes = new Set<string>();
    for (const r of cityRoutes) {
      const from = r.locations_chauffeur_route_packages_fromLocationIdTolocations.slug;
      const to = r.locations_chauffeur_route_packages_toLocationIdTolocations.slug;
      const key = `${from}-${to}`;
      if (seenRoutes.has(key)) continue;
      seenRoutes.add(key);
      entries.push({
        url: `${BASE_URL}/one-way-cab/${from}-to-${to}`,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
      entries.push({
        url: `${BASE_URL}/round-trip/${from}-to-${to}-round-trip`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Airport transfer
    for (const r of airportRoutes) {
      const fromSlug = r.locations_chauffeur_route_packages_fromLocationIdTolocations.slug;
      const toSlug = r.locations_chauffeur_route_packages_toLocationIdTolocations.slug;
      entries.push({
        url: `${BASE_URL}/airport-transfer/${fromSlug}-to-${toSlug}`,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  } catch (error) {
    console.error('[sitemap-routes] DB error:', error);
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
