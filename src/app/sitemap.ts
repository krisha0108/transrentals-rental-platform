import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { blogPosts } from '@/data/blog-posts';
import { blogCategories } from '@/data/blog-categories';
import { blogAuthors } from '@/data/blog-authors';
import { blogTags } from '@/data/blog-posts';

/**
 * =============================================================================
 * TRANSRENTALS - DATABASE-DRIVEN SITEMAP
 * =============================================================================
 *
 * Google Search Console Compliant - Max 50,000 URLs per sitemap
 *
 * NOW QUERIES DATABASE:
 * - ServiceLocation table for service+city URLs
 * - FleetLocationRate table for fleet+city URLs
 * - Only generates URLs for ACTUAL available combinations
 *
 * SITEMAP STRUCTURE:
 * ==================
 * sitemap/0.xml - Main Pages (Static + Blog)
 * sitemap/1.xml - Service Locations (from ServiceLocation table)
 * sitemap/2.xml - Fleet Pages (from FleetLocationRate table)
 * sitemap/3.xml - City Homepages + Blog Tags
 *
 * =============================================================================
 */

const BASE_URL = 'https://transrentals.in';

// =============================================================================
// SERVICE SLUGS - For main service pages (not location-specific)
// =============================================================================
const ALL_SERVICE_SLUGS = [
  // Bike Services
  'bike-on-rent',
  'activa-on-rent',
  'royal-enfield-on-rent',
  'ktm-on-rent',
  'pulsar-on-rent',
  'apache-on-rent',
  'splendor-on-rent',
  'himalayan-on-rent',
  'monthly-bike-rental',
  'electric-scooter-rental',
  'bike-tours',
  'bike-trips',
  // Self-Drive Services
  'self-drive-car-rentals',
  'self-drive-suv-rental',
  'self-drive-sedan-rental',
  'self-drive-hatchback-rental',
  'hourly-car-rental',
  'swift-on-rent',
  'creta-on-rent',
  'innova-on-rent',
  'fortuner-on-rent',
  'seltos-on-rent',
  'xuv700-on-rent',
  'scorpio-on-rent',
  // Car & Taxi Services
  'car-rental',
  'one-way-car-rental',
  'monthly-car-rental',
  'corporate-car-rental',
  'outstation-car-rental',
  'outstation-cab',
  'local-taxi',
  'airport-transfer',
  'chauffeur-service',
  // Luxury & Bus Services
  'luxury-car-rental',
  'wedding-car-rental',
  'vintage-car-rental',
  'sports-car-rental',
  'tempo-traveller',
  'bus-rental',
  'wedding-bus-rental',
  'corporate-bus-rental',
  '12-seater-tempo-traveller',
  '17-seater-tempo-traveller',
  '20-seater-tempo-traveller',
  '26-seater-bus',
  // Truck & Equipment Services
  'transporter',
  'mini-truck-rental',
  'trailer-on-rent',
  'packers-and-movers',
  'equipment-rental',
  'jcb-on-rent',
  'crane-on-rent',
  'hydra-on-rent',
  'excavator-on-rent',
  'generator-on-rent',
];

// Services with booking subpages (/[location]/book)
const SERVICES_WITH_BOOK_PAGE = [
  'car-rental',
  'chauffeur-service',
  'luxury-car-rental',
  'self-drive-car-rentals',
];

// Services with vehicle listing subpages
const SERVICES_WITH_CARS_PAGE = ['self-drive-car-rentals'];
const SERVICES_WITH_BIKES_PAGE = ['bike-on-rent'];

// =============================================================================
// STATIC PAGES CONFIGURATION
// =============================================================================
const STATIC_PAGES = [
  { path: '/about', changeFreq: 'monthly' as const, priority: 0.8 },
  { path: '/contact', changeFreq: 'monthly' as const, priority: 0.8 },
  { path: '/services', changeFreq: 'weekly' as const, priority: 0.9 },
  { path: '/fleet', changeFreq: 'weekly' as const, priority: 0.9 },
  { path: '/blog', changeFreq: 'daily' as const, priority: 0.8 },
  { path: '/faq', changeFreq: 'monthly' as const, priority: 0.7 },
  { path: '/privacy-policy', changeFreq: 'yearly' as const, priority: 0.3 },
  { path: '/terms-conditions', changeFreq: 'yearly' as const, priority: 0.3 },
  { path: '/refund-policy', changeFreq: 'yearly' as const, priority: 0.3 },
  { path: '/cancellation-policy', changeFreq: 'yearly' as const, priority: 0.3 },
];

// Special tour pages
const SPECIAL_PAGES = [
  { path: '/bike-tours/goa', changeFreq: 'monthly' as const, priority: 0.7 },
  { path: '/bike-tours/leh-ladakh', changeFreq: 'monthly' as const, priority: 0.7 },
  { path: '/bike-tours/rajasthan', changeFreq: 'monthly' as const, priority: 0.7 },
  { path: '/bike-tours/spiti-valley', changeFreq: 'monthly' as const, priority: 0.7 },
  { path: '/bike-trips/ladakh', changeFreq: 'monthly' as const, priority: 0.7 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// For FleetLocation which has tier field
function getLocationPriority(tier: number | null): number {
  if (tier === 1) return 0.8;
  if (tier === 2) return 0.7;
  if (tier === 3) return 0.6;
  return 0.5;
}

// For Location model (via parent state name)
// Metro cities in these states get higher priority
function getStatePriority(stateName: string): number {
  const metroStates = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
  const tier2States = ['Rajasthan', 'Punjab', 'Haryana', 'Kerala', 'Madhya Pradesh', 'Chandigarh', 'Goa', 'Uttar Pradesh'];

  if (metroStates.includes(stateName)) return 0.8;
  if (tier2States.includes(stateName)) return 0.7;
  return 0.6;
}

// =============================================================================
// SITEMAP GENERATION
// =============================================================================

// Generate sitemap index - 4 sitemaps (reduced from 5)
export async function generateSitemaps() {
  return [
    { id: 0 }, // Main pages + Blog
    { id: 1 }, // Service locations (from DB)
    { id: 2 }, // Fleet pages (from DB)
    { id: 3 }, // City homepages + Blog tags
  ];
}

// Generate individual sitemap based on ID
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  switch (id) {
    case 0:
      return generateMainSitemap(currentDate);
    case 1:
      return await generateServiceLocationsSitemap(currentDate);
    case 2:
      return await generateFleetSitemap(currentDate);
    case 3:
      return await generateCityTagSitemap(currentDate);
    default:
      return [];
  }
}

// =============================================================================
// SITEMAP 0: Main Pages + Blog (Static - no DB needed)
// =============================================================================
function generateMainSitemap(currentDate: string): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  // Homepage - highest priority
  routes.push({
    url: BASE_URL,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Static pages
  STATIC_PAGES.forEach((page) => {
    routes.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFreq,
      priority: page.priority,
    });
  });

  // Special tour pages
  SPECIAL_PAGES.forEach((page) => {
    routes.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFreq,
      priority: page.priority,
    });
  });

  // Service main pages (without location - these always exist)
  ALL_SERVICE_SLUGS.forEach((service) => {
    routes.push({
      url: `${BASE_URL}/${service}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  // Blog posts
  blogPosts.forEach((post) => {
    routes.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt).toISOString() : currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  // Blog categories
  blogCategories.forEach((category) => {
    routes.push({
      url: `${BASE_URL}/blog/category/${category.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  // Blog authors
  blogAuthors.forEach((author) => {
    routes.push({
      url: `${BASE_URL}/blog/author/${author.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  });

  // Blog search page
  routes.push({
    url: `${BASE_URL}/blog/search`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.5,
  });

  // Standalone booking pages
  routes.push({
    url: `${BASE_URL}/bike-on-rent/book`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  return routes;
}

// =============================================================================
// SITEMAP 1: Service + Location Pages (FROM DATABASE!)
// =============================================================================
async function generateServiceLocationsSitemap(currentDate: string): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Skip database calls during CI/CD build
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap] Skipping service locations - CI build');
    return [];
  }

  try {
    // Query ServiceLocation table - only get ACTIVE service+location combinations
    // Note: Location model doesn't have tier, so we check parent state for priority
    const serviceLocations = await prisma.service_locations.findMany({
      where: {
        isActive: true,
      },
      include: {
        services: {
          select: {
            slug: true,
            isActive: true,
          },
        },
        locations: {
          select: {
            slug: true,
            isActive: true,
            locations: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Filter for active services and locations
    const activeServiceLocations = serviceLocations.filter(
      (sl) => sl.services.isActive && sl.locations.isActive
    );

    // Generate URLs for each service+location combination
    activeServiceLocations.forEach((sl) => {
      const serviceSlug = sl.services.slug;
      const locationSlug = sl.locations.slug;
      // Determine priority based on parent state (metro states get higher priority)
      const priority = getStatePriority(sl.locations.locations?.name || '');

      // Main service location page
      routes.push({
        url: `${BASE_URL}/${serviceSlug}/${locationSlug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });

      // Add /book subpage if service has it
      if (SERVICES_WITH_BOOK_PAGE.includes(serviceSlug)) {
        routes.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/book`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: Math.max(0.3, priority - 0.1),
        });
      }

      // Add /cars subpage if service has it
      if (SERVICES_WITH_CARS_PAGE.includes(serviceSlug)) {
        routes.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/cars`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority,
        });
      }

      // Add /bikes subpage if service has it
      if (SERVICES_WITH_BIKES_PAGE.includes(serviceSlug)) {
        routes.push({
          url: `${BASE_URL}/${serviceSlug}/${locationSlug}/bikes`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority,
        });
      }
    });

    console.log(`[Sitemap] Generated ${routes.length} service location URLs from database`);
  } catch (error) {
    console.error('[Sitemap] Error fetching service locations:', error);
    // Return empty array on error - don't generate invalid URLs
  }

  return routes;
}

// =============================================================================
// SITEMAP 2: Fleet Pages (FROM DATABASE!)
// =============================================================================
async function generateFleetSitemap(currentDate: string): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Skip database calls during CI/CD build
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap] Skipping fleet sitemap - CI build');
    return [];
  }

  try {
    // Get all active fleet vehicles for main fleet pages
    const fleetVehicles = await prisma.fleet.findMany({
      where: {
        isActive: true,
      },
      select: {
        slug: true,
        priority: true,
      },
    });

    // Fleet vehicle main pages (these always exist if vehicle is active)
    fleetVehicles.forEach((vehicle) => {
      const priority = vehicle.priority >= 9 ? 0.8 : vehicle.priority >= 7 ? 0.7 : 0.6;
      routes.push({
        url: `${BASE_URL}/fleet/${vehicle.slug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });
    });

    // Get fleet+location combinations from FleetLocationRate table
    const fleetLocationRates = await prisma.fleet_location_rates.findMany({
      where: {
        isActive: true,
      },
      include: {
        fleet: {
          select: {
            slug: true,
            priority: true,
            isActive: true,
          },
        },
        fleet_locations: {
          select: {
            slug: true,
            tier: true,
            isActive: true,
          },
        },
      },
    });

    // Filter for active fleet and locations
    const activeFleetLocations = fleetLocationRates.filter(
      (flr) => flr.fleet.isActive && flr.fleet_locations.isActive
    );

    // Generate URLs for each fleet+location combination
    activeFleetLocations.forEach((flr) => {
      const vehicleSlug = flr.fleet.slug;
      const locationSlug = flr.fleet_locations.slug;

      // Calculate combined priority
      let priority = 0.5;
      if (flr.fleet.priority >= 9 && flr.fleet_locations.tier === 1) priority = 0.7;
      else if (flr.fleet.priority >= 7 || (flr.fleet_locations.tier && flr.fleet_locations.tier <= 2)) priority = 0.6;

      routes.push({
        url: `${BASE_URL}/fleet/${vehicleSlug}/${locationSlug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority,
      });
    });

    console.log(`[Sitemap] Generated ${routes.length} fleet URLs from database`);
  } catch (error) {
    console.error('[Sitemap] Error fetching fleet data:', error);
    // Return empty array on error - don't generate invalid URLs
  }

  return routes;
}

// =============================================================================
// SITEMAP 3: City Homepages + Blog Tags (FROM DATABASE!)
// =============================================================================
async function generateCityTagSitemap(currentDate: string): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Skip database calls during CI/CD build
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    console.log('[Sitemap] Skipping city/tag sitemap - CI build');
    return [];
  }

  try {
    // Get active cities from database with parent state for priority
    const cities = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        isActive: true,
      },
      select: {
        slug: true,
        locations: {
          select: {
            name: true,
          },
        },
      },
    });

    // City homepage URLs
    cities.forEach((city) => {
      routes.push({
        url: `${BASE_URL}/${city.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: getStatePriority(city.locations?.name || ''),
      });
    });

    console.log(`[Sitemap] Generated ${cities.length} city homepage URLs from database`);
  } catch (error) {
    console.error('[Sitemap] Error fetching cities:', error);
  }

  // Blog tags (from static data)
  if (blogTags && blogTags.length > 0) {
    blogTags.forEach((tag) => {
      routes.push({
        url: `${BASE_URL}/blog/tag/${tag.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });
  }

  return routes;
}
