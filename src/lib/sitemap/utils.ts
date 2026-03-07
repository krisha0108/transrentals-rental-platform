import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

export const BASE_URL = 'https://transrentals.in';

export const LOCATION_SERVICES = [
  'car-rental', 'bus-rental', 'bike-on-rent', 'luxury-car-rental',
  'self-drive-car-rentals', 'local-taxi', 'outstation-cab', 'chauffeur-service',
  'activa-on-rent', 'royal-enfield-on-rent', 'pulsar-on-rent', 'ktm-on-rent',
  'himalayan-on-rent', 'splendor-on-rent', 'apache-on-rent', 'innova-on-rent',
  'creta-on-rent', 'fortuner-on-rent', 'scorpio-on-rent', 'seltos-on-rent',
  'swift-on-rent', 'mini-truck-rental', 'equipment-rental', 'trailer-on-rent',
  'tempo-traveller', 'transporter', 'packers-and-movers',
  'crane-on-rent', 'excavator-on-rent', 'jcb-on-rent', 'hydra-on-rent',
  'generator-on-rent', 'corporate-car-rental', 'corporate-bus-rental',
  'wedding-car-rental', 'wedding-bus-rental', 'sports-car-rental',
  'vintage-car-rental', 'electric-scooter-rental', 'monthly-bike-rental',
  'monthly-car-rental', 'hourly-car-rental', 'outstation-car-rental',
  'self-drive-hatchback-rental', 'self-drive-sedan-rental', 'self-drive-suv-rental',
  '12-seater-tempo-traveller', '17-seater-tempo-traveller', '20-seater-tempo-traveller',
  '26-seater-bus',
];

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: string;
  priority?: number;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildUrlsetXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const lastmod = e.lastModified
        ? `\n    <lastmod>${e.lastModified.toISOString().split('T')[0]}</lastmod>`
        : '';
      const changefreq = e.changeFrequency
        ? `\n    <changefreq>${e.changeFrequency}</changefreq>`
        : '';
      const priority =
        e.priority !== undefined
          ? `\n    <priority>${e.priority.toFixed(1)}</priority>`
          : '';
      return `  <url>\n    <loc>${escapeXml(e.url)}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/**
 * Cached DB fetch: all active service-location pairs.
 * Shared by sitemap-services and sitemap-states — only ONE DB query per hour.
 */
export const getCachedServiceLocations = unstable_cache(
  async () => {
    if (process.env.SKIP_DATABASE_CALLS === '1') return [];
    return prisma.service_locations.findMany({
      where: { isActive: true },
      include: {
        services: { select: { slug: true } },
        locations: { select: { slug: true } },
      },
    });
  },
  ['sitemap-service-locations'],
  { revalidate: 3600 }
);

/**
 * Cached DB fetch: all active chauffeur route packages.
 * Used by sitemap-routes only.
 */
export const getCachedRoutePackages = unstable_cache(
  async () => {
    if (process.env.SKIP_DATABASE_CALLS === '1') return { city: [], airport: [] };
    const [city, airport] = await Promise.all([
      prisma.chauffeur_route_packages.findMany({
        where: {
          isActive: true,
          AND: [
            { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: { not: 'AIRPORT' } } },
            { locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } } },
          ],
        },
        select: {
          locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { slug: true } },
          locations_chauffeur_route_packages_toLocationIdTolocations: { select: { slug: true } },
        },
        distinct: ['fromLocationId', 'toLocationId'],
      }),
      prisma.chauffeur_route_packages.findMany({
        where: {
          isActive: true,
          OR: [
            { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: 'AIRPORT' } },
            { locations_chauffeur_route_packages_toLocationIdTolocations: { type: 'AIRPORT' } },
          ],
        },
        select: {
          locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { slug: true, type: true } },
          locations_chauffeur_route_packages_toLocationIdTolocations: { select: { slug: true, type: true } },
        },
        distinct: ['fromLocationId', 'toLocationId'],
      }),
    ]);
    return { city, airport };
  },
  ['sitemap-route-packages'],
  { revalidate: 3600 }
);
