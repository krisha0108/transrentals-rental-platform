import { NextResponse } from 'next/server';
import {
  buildUrlsetXml,
  BASE_URL,
  SitemapEntry,
  getCachedRoutePackages,
} from '@/lib/sitemap/utils';
import { generateAirportSEOSlug } from '@/lib/airports/slug-utils';

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

    // Airport transfer — use canonical SEO slug (matches generateStaticParams in page)
    for (const r of airportRoutes) {
      const fromLoc = r.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLoc = r.locations_chauffeur_route_packages_toLocationIdTolocations;
      const seoSlug = generateAirportSEOSlug(
        { name: fromLoc.name, slug: fromLoc.slug, type: fromLoc.type, parentCityName: fromLoc.locations?.name },
        { name: toLoc.name, slug: toLoc.slug, type: toLoc.type, parentCityName: toLoc.locations?.name }
      );
      entries.push({
        url: `${BASE_URL}/airport-transfer/${seoSlug}`,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  } catch (error) {
    console.error('[sitemap-routes] DB error:', error);
  }

  // Return 503 if no entries — avoids Google caching an empty <urlset> (causes "Missing XML tag" error)
  if (entries.length === 0) {
    return new NextResponse('Route sitemap temporarily unavailable', {
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
