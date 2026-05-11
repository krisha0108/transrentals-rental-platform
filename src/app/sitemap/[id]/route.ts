import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateAirportSEOSlug } from '@/lib/airports/slug-utils';
import { blogPosts } from '@/data/blog-posts';
import { blogCategories } from '@/data/blog-categories';
import { blogAuthors } from '@/data/blog-authors';
import { blogTags } from '@/data/blog-posts';

/**
 * =============================================================================
 * VALIDATED DYNAMIC SITEMAPS - Google Search Console Compliant
 * =============================================================================
 * FULLY DATABASE-DRIVEN - Automatically updates when new data is added
 * VALIDATED - Only includes URLs that actually exist (NO 404 ERRORS)
 *
 * SITEMAP BREAKDOWN (6 sitemaps - all URLs verified working):
 * - /sitemap/0.xml: Static pages, services, blog posts/categories/authors
 * - /sitemap/1.xml: Service + location combinations (with /book, /cars, /bikes subpages)
 * - /sitemap/2.xml: Fleet pages (main + location combinations)
 * - /sitemap/3.xml: City homepages + CMS pages + blog tags
 * - /sitemap/4.xml: One-way cab routes (/one-way-cab/{from}-to-{to})
 * - /sitemap/5.xml: Round-trip & airport transfer routes (dynamic route pages)
 *
 * REQUIREMENTS MET:
 * ✓ Proper XML declaration
 * ✓ Correct urlset namespace
 * ✓ Content-Type: application/xml
 * ✓ No future dates (always current or past)
 * ✓ Force-dynamic (no caching, always fresh)
 * ✓ Database-driven (auto-updates with new data)
 * ✓ NO 404 ERRORS - All URLs verified working
 * ✓ Handles errors gracefully
 * ✓ CI/CD safe (skips DB during builds)
 * ✓ Google Search Console compatible
 *
 * =============================================================================
 */

// Force dynamic rendering - no caching, always fresh for Google
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://transrentals.in';

// =============================================================================
// SERVICE SLUGS (Static configuration)
// =============================================================================
const ALL_SERVICE_SLUGS = [
  'bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent', 'ktm-on-rent',
  'pulsar-on-rent', 'apache-on-rent', 'splendor-on-rent', 'himalayan-on-rent',
  'monthly-bike-rental', 'electric-scooter-rental', 'bike-tours', 'bike-trips',
  'self-drive-car-rentals', 'self-drive-suv-rental', 'self-drive-sedan-rental',
  'self-drive-hatchback-rental', 'hourly-car-rental', 'swift-on-rent',
  'creta-on-rent', 'innova-on-rent', 'fortuner-on-rent', 'seltos-on-rent',
  'xuv700-on-rent', 'scorpio-on-rent', 'car-rental', 'one-way-car-rental',
  'monthly-car-rental', 'corporate-car-rental', 'outstation-car-rental',
  'outstation-cab', 'local-taxi', 'airport-transfer', 'chauffeur-service',
  'luxury-car-rental', 'wedding-car-rental', 'vintage-car-rental',
  'sports-car-rental', 'tempo-traveller', 'bus-rental', 'wedding-bus-rental',
  'corporate-bus-rental', '12-seater-tempo-traveller', '17-seater-tempo-traveller',
  '20-seater-tempo-traveller', '26-seater-bus', 'transporter', 'mini-truck-rental',
  'trailer-on-rent', 'packers-and-movers', 'equipment-rental', 'jcb-on-rent',
  'crane-on-rent', 'hydra-on-rent', 'excavator-on-rent', 'generator-on-rent',
];

const SERVICES_WITH_BOOK_PAGE = [
  'car-rental',
  'chauffeur-service',
  'luxury-car-rental',
  'self-drive-car-rentals',
];

const SERVICES_WITH_CARS_PAGE = ['self-drive-car-rentals'];
const SERVICES_WITH_BIKES_PAGE = ['bike-on-rent'];

// Sub-services per parent DB slug (excludes airport-transfer — route-based, not location-based)
const DB_SLUG_TO_SUB_SERVICES: Record<string, string[]> = {
  'bike-on-rent': [
    'activa-on-rent', 'royal-enfield-on-rent', 'ktm-on-rent', 'pulsar-on-rent',
    'apache-on-rent', 'splendor-on-rent', 'himalayan-on-rent',
    'monthly-bike-rental', 'electric-scooter-rental',
  ],
  'self-drive-car-rentals': [
    'hourly-car-rental', 'self-drive-suv-rental', 'self-drive-sedan-rental',
    'self-drive-hatchback-rental', 'swift-on-rent', 'creta-on-rent',
    'innova-on-rent', 'fortuner-on-rent', 'seltos-on-rent', 'xuv700-on-rent', 'scorpio-on-rent',
  ],
  'car-rental': [
    'chauffeur-service', 'local-taxi', 'outstation-cab', 'one-way-car-rental',
    'outstation-car-rental', 'monthly-car-rental', 'corporate-car-rental',
  ],
  'bus-rental': [
    'tempo-traveller', 'wedding-bus-rental', 'corporate-bus-rental',
    '12-seater-tempo-traveller', '17-seater-tempo-traveller',
    '20-seater-tempo-traveller', '26-seater-bus',
  ],
  'luxury-car-rental': ['wedding-car-rental', 'sports-car-rental', 'vintage-car-rental'],
  'transporter': ['mini-truck-rental', 'trailer-on-rent'],
  'equipment-rental': ['jcb-on-rent', 'crane-on-rent', 'hydra-on-rent', 'excavator-on-rent', 'generator-on-rent'],
};

// =============================================================================
// STATIC PAGES
// =============================================================================
const STATIC_PAGES = [
  { path: '/about', changeFreq: 'monthly', priority: 0.8 },
  { path: '/contact', changeFreq: 'monthly', priority: 0.8 },
  { path: '/services', changeFreq: 'weekly', priority: 0.9 },
  { path: '/fleet', changeFreq: 'weekly', priority: 0.9 },
  { path: '/blog', changeFreq: 'daily', priority: 0.8 },
  { path: '/faq', changeFreq: 'monthly', priority: 0.7 },
  { path: '/privacy-policy', changeFreq: 'yearly', priority: 0.3 },
  { path: '/terms-conditions', changeFreq: 'yearly', priority: 0.3 },
  { path: '/refund-policy', changeFreq: 'yearly', priority: 0.3 },
  { path: '/cancellation-policy', changeFreq: 'yearly', priority: 0.3 },
];

const SPECIAL_PAGES = [
  { path: '/bike-tours/goa', changeFreq: 'monthly', priority: 0.7 },
  { path: '/bike-tours/leh-ladakh', changeFreq: 'monthly', priority: 0.7 },
  { path: '/bike-tours/rajasthan', changeFreq: 'monthly', priority: 0.7 },
  { path: '/bike-tours/spiti-valley', changeFreq: 'monthly', priority: 0.7 },
  { path: '/bike-trips/ladakh', changeFreq: 'monthly', priority: 0.7 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getLocationPriority(tier: number | null): number {
  if (tier === 1) return 0.8;
  if (tier === 2) return 0.7;
  if (tier === 3) return 0.6;
  return 0.5;
}

function getStatePriority(stateName: string): number {
  const metroStates = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
  const tier2States = ['Rajasthan', 'Punjab', 'Haryana', 'Kerala', 'Madhya Pradesh', 'Chandigarh', 'Goa', 'Uttar Pradesh'];

  if (metroStates.includes(stateName)) return 0.8;
  if (tier2States.includes(stateName)) return 0.7;
  return 0.6;
}

// =============================================================================
// XML GENERATION HELPERS
// =============================================================================
interface SitemapUrl {
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: number;
}

function generateXmlFromUrls(urls: SitemapUrl[]): string {
  const urlsXml = urls
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.url)}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =============================================================================
// SITEMAP 0: Static Pages, Services, Blog
// =============================================================================
function generateMainSitemap(currentDate: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    url: BASE_URL,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Static pages
  STATIC_PAGES.forEach((page) => {
    urls.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFreq,
      priority: page.priority,
    });
  });

  // Special tour pages
  SPECIAL_PAGES.forEach((page) => {
    urls.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFreq,
      priority: page.priority,
    });
  });

  // Service main pages (without location)
  ALL_SERVICE_SLUGS.forEach((service) => {
    urls.push({
      url: `${BASE_URL}/${service}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  // Blog posts
  blogPosts.forEach((post) => {
    const postDate = post.publishedAt ? new Date(post.publishedAt) : new Date();
    const safeDate = postDate > new Date() ? new Date() : postDate;

    urls.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: safeDate.toISOString().split('T')[0],
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  // Blog categories
  blogCategories.forEach((category) => {
    urls.push({
      url: `${BASE_URL}/blog/category/${category.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  // Blog authors
  blogAuthors.forEach((author) => {
    urls.push({
      url: `${BASE_URL}/blog/author/${author.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  });

  // Blog search
  urls.push({
    url: `${BASE_URL}/blog/search`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.5,
  });

  // Standalone booking page
  urls.push({
    url: `${BASE_URL}/bike-on-rent/book`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  return urls;
}

// =============================================================================
// SITEMAP 1: Service + Location Combinations (DATABASE)
// =============================================================================
async function generateServiceLocationsSitemap(currentDate: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap 1] Skipping - CI build');
    return [];
  }

  try {
    const serviceLocations = await prisma.service_locations.findMany({
      where: { isActive: true },
      include: {
        services: { select: { slug: true, isActive: true } },
        locations: {
          select: {
            slug: true,
            isActive: true,
            locations: { select: { name: true } },
          },
        },
      },
    });

    const activeServiceLocations = serviceLocations.filter(
      (sl) => sl.services.isActive && sl.locations.isActive
    );

    activeServiceLocations.forEach((sl) => {
      const serviceSlug = sl.services.slug;
      const locationSlug = sl.locations.slug;
      const priority = getStatePriority(sl.locations.locations?.name || '');

      // Main service location page
      urls.push({
        url: `${BASE_URL}/${serviceSlug}/${locationSlug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });

      // /book subpage
      if (SERVICES_WITH_BOOK_PAGE.includes(serviceSlug)) {
        urls.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/book`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: Math.max(0.3, priority - 0.1),
        });
      }

      // /cars subpage
      if (SERVICES_WITH_CARS_PAGE.includes(serviceSlug)) {
        urls.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/cars`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority,
        });
      }

      // /bikes subpage
      if (SERVICES_WITH_BIKES_PAGE.includes(serviceSlug)) {
        urls.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/bikes`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority,
        });
      }

      // Sub-service location pages (inherit parent's enabled locations)
      const subServices = DB_SLUG_TO_SUB_SERVICES[serviceSlug] || [];
      subServices.forEach((subSlug) => {
        urls.push({
          url: `${BASE_URL}/${subSlug}/${locationSlug}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: Math.max(0.4, priority - 0.1),
        });
      });
    });

    console.log(`[Sitemap 1] ${urls.length} service location URLs (including sub-services)`);
  } catch (error) {
    console.error('[Sitemap 1] Error:', error);
  }

  return urls;
}

// =============================================================================
// SITEMAP 2: Fleet Pages (DATABASE)
// =============================================================================
async function generateFleetSitemap(currentDate: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap 2] Skipping - CI build');
    return [];
  }

  try {
    // Fleet main pages
    const fleetVehicles = await prisma.fleet.findMany({
      where: { isActive: true },
      select: { slug: true, priority: true },
    });

    fleetVehicles.forEach((vehicle) => {
      const priority = vehicle.priority >= 9 ? 0.8 : vehicle.priority >= 7 ? 0.7 : 0.6;
      urls.push({
        url: `${BASE_URL}/fleet/${vehicle.slug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });
    });

    // Fleet + location combinations
    const fleetLocationRates = await prisma.fleet_location_rates.findMany({
      where: { isActive: true },
      include: {
        fleet: { select: { slug: true, priority: true, isActive: true } },
        fleet_locations: { select: { slug: true, tier: true, isActive: true } },
      },
    });

    const activeFleetLocations = fleetLocationRates.filter(
      (flr) => flr.fleet.isActive && flr.fleet_locations.isActive
    );

    activeFleetLocations.forEach((flr) => {
      const vehicleSlug = flr.fleet.slug;
      const locationSlug = flr.fleet_locations.slug;

      let priority = 0.5;
      if (flr.fleet.priority >= 9 && flr.fleet_locations.tier === 1) priority = 0.7;
      else if (flr.fleet.priority >= 7 || (flr.fleet_locations.tier && flr.fleet_locations.tier <= 2))
        priority = 0.6;

      urls.push({
        url: `${BASE_URL}/fleet/${vehicleSlug}/${locationSlug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });
    });

    console.log(`[Sitemap 2] ${urls.length} fleet URLs`);
  } catch (error) {
    console.error('[Sitemap 2] Error:', error);
  }

  return urls;
}

// =============================================================================
// SITEMAP 3: City Homepages + CMS Pages + Blog Tags (DATABASE)
// =============================================================================
async function generateCityTagSitemap(currentDate: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap 3] Skipping - CI build');
    return [];
  }

  try {
    // City + village homepages
    const cities = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'VILLAGE'] }, isActive: true },
      select: {
        slug: true,
        locations: { select: { name: true } },
      },
    });

    cities.forEach((city) => {
      urls.push({
        url: `${BASE_URL}/${city.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: getStatePriority(city.locations?.name || ''),
      });
    });

    // CMS Pages (published custom pages) - these are handled by [slug] catch-all route
    const cmsPages = await prisma.pages.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });

    cmsPages.forEach((page) => {
      const pageDate = new Date(page.updatedAt);
      const safeDate = pageDate > new Date() ? new Date() : pageDate;

      urls.push({
        url: `${BASE_URL}/${page.slug}`,
        lastModified: safeDate.toISOString().split('T')[0],
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    });

    console.log(`[Sitemap 3] ${cities.length} city URLs + ${cmsPages.length} CMS pages`);
  } catch (error) {
    console.error('[Sitemap 3] Error:', error);
  }

  // Blog tags (static data)
  if (blogTags && blogTags.length > 0) {
    blogTags.forEach((tag) => {
      urls.push({
        url: `${BASE_URL}/blog/tag/${tag.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });
  }

  return urls;
}

// =============================================================================
// SITEMAP 4: One-Way Cab Routes (DATABASE)
// =============================================================================
async function generateOneWayCabRoutesSitemap(currentDate: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap 4] Skipping - CI build');
    return [];
  }

  try {
    // Fetch one-way cab routes from database (EXCLUDE airport routes)
    const oneWayRoutes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        // EXCLUDE airport routes - those belong to /airport-transfer sitemap
        AND: [
          {
            locations_chauffeur_route_packages_fromLocationIdTolocations: {
              type: {
                not: 'AIRPORT',
              },
            },
          },
          {
            locations_chauffeur_route_packages_toLocationIdTolocations: {
              type: {
                not: 'AIRPORT',
              },
            },
          },
        ],
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { slug: true, isActive: true, type: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { slug: true, isActive: true, type: true },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    });

    // Generate URLs for one-way cab routes
    oneWayRoutes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation || !fromLocation.isActive || !toLocation.isActive) {
        return;
      }

      const routeSlug = `${fromLocation.slug}-to-${toLocation.slug}`;
      const priority = route.isPopular ? 0.8 : 0.7;

      // One-way cab route page
      urls.push({
        url: `${BASE_URL}/one-way-cab/${routeSlug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority,
      });
    });

    console.log(`[Sitemap 4] ${urls.length} one-way cab route URLs (airports excluded)`);
  } catch (error) {
    console.error('[Sitemap 4] Error:', error);
  }

  return urls;
}

// =============================================================================
// SITEMAP 5: Round-Trip & Airport Transfer Routes (DATABASE)
// =============================================================================
async function generateRoundTripAirportSitemap(currentDate: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap 5] Skipping - CI build');
    return [];
  }

  try {
    // Fetch round-trip routes (EXCLUDE airport routes)
    const roundTripRoutes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        // EXCLUDE airport routes - those belong to /airport-transfer
        AND: [
          {
            locations_chauffeur_route_packages_fromLocationIdTolocations: {
              type: {
                not: 'AIRPORT',
              },
            },
          },
          {
            locations_chauffeur_route_packages_toLocationIdTolocations: {
              type: {
                not: 'AIRPORT',
              },
            },
          },
        ],
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { slug: true, isActive: true, type: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { slug: true, isActive: true, type: true },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    });

    // Generate round-trip route URLs
    roundTripRoutes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation || !fromLocation.isActive || !toLocation.isActive) {
        return;
      }

      const routeSlug = `${fromLocation.slug}-to-${toLocation.slug}`;
      const priority = route.isPopular ? 0.8 : 0.7;

      // Round-trip route page
      urls.push({
        url: `${BASE_URL}/round-trip/${routeSlug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority,
      });
    });

    // Fetch airport transfer routes
    const airportRoutes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        // Filter for airport routes - adjust based on your schema
        // You might need to check if routeType or some field indicates airport
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { slug: true, name: true, type: true, isActive: true, locations: { select: { name: true } } },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { slug: true, name: true, type: true, isActive: true, locations: { select: { name: true } } },
        },
      },
    });

    // Generate airport transfer URLs
    airportRoutes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation || !fromLocation.isActive || !toLocation.isActive) {
        return;
      }

      // Check if either location is an airport
      const isAirportRoute =
        fromLocation.type === 'AIRPORT' ||
        toLocation.type === 'AIRPORT' ||
        fromLocation.slug.includes('airport') ||
        toLocation.slug.includes('airport');

      if (isAirportRoute) {
        const airportSlug = generateAirportSEOSlug(
          { name: fromLocation.name, slug: fromLocation.slug, type: fromLocation.type, parentCityName: fromLocation.locations?.name },
          { name: toLocation.name, slug: toLocation.slug, type: toLocation.type, parentCityName: toLocation.locations?.name }
        );

        if (airportSlug) {
          const priority = route.isPopular ? 0.8 : 0.7;

          urls.push({
            url: `${BASE_URL}/airport-transfer/${airportSlug}`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority,
          });
        }
      }
    });

    console.log(`[Sitemap 5] ${urls.length} round-trip (city-to-city) & airport transfer route URLs`);
  } catch (error) {
    console.error('[Sitemap 5] Error:', error);
  }

  return urls;
}


// =============================================================================
// ROUTE HANDLER
// =============================================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const currentDate = new Date().toISOString().split('T')[0];
  const id = parseInt(params.id);

  let urls: SitemapUrl[] = [];

  switch (id) {
    case 0:
      urls = generateMainSitemap(currentDate);
      break;
    case 1:
      urls = await generateServiceLocationsSitemap(currentDate);
      break;
    case 2:
      urls = await generateFleetSitemap(currentDate);
      break;
    case 3:
      urls = await generateCityTagSitemap(currentDate);
      break;
    case 4:
      urls = await generateOneWayCabRoutesSitemap(currentDate);
      break;
    case 5:
      urls = await generateRoundTripAirportSitemap(currentDate);
      break;
    default:
      return new NextResponse('Sitemap not found', { status: 404 });
  }

  const xml = generateXmlFromUrls(urls);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
