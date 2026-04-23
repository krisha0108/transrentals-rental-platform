import { Metadata } from 'next';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { permanentRedirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { AirportRouteBookingHero } from '@/components/airport-transfer/AirportRouteBookingHero';
import { AirportRouteComingSoon } from '@/components/airport-transfer/AirportRouteComingSoon';
import { RouteOverview } from '@/components/routes/RouteOverview';
import { RoutePricing } from '@/components/routes/RoutePricing';
import { RouteReviews } from '@/components/routes/RouteReviews';
import { RouteFAQs } from '@/components/routes/RouteFAQs';
import { TravelerTips } from '@/components/routes/TravelerTips';

// Slugs that are not yet in the DB — show Coming Soon instead of redirecting
const COMING_SOON_SLUGS = new Set([
  'ahmedabad-to-vadodara-airport',
  'bangalore-airport-to-tumkur',
  'bangalore-to-coimbatore-airport',
  'city-to-thiruvananthapuram-airport',
  'city-to-vadodara-airport',
  'jalandhar-to-amritsar-airport',
  'kolkata-to-nagpur-airport',
  'lonavala-to-mumbai-airport',
  'pune-to-dehradun-airport',
  'vadodara-airport-to-ankleshwar',
  'vijayawada-airport-to-ongole',
  'ahmedabad-airport-to-bhavnagar',
  'ahmedabad-airport-to-gandhinagar',
  'bhubaneswar-airport-to-puri',
  'chennai-airport-to-nellore',
  'city-to-goa-airport',
  'hyderabad-airport-to-karimnagar',
  'hyderabad-to-coimbatore-airport',
  'hyderabad-to-delhi-airport',
  'jaipur-airport-to-ajmer',
  'kolkata-airport-to-durgapur',
  'kolkata-to-delhi-airport',
  'kolkata-to-goa-airport',
  'kolkata-to-kozhikode-airport',
  'madurai-airport-to-kanyakumari',
  'mumbai-to-ahmedabad-airport',
  'mumbai-to-bangalore-airport',
  'mumbai-to-kolkata-airport',
  'mumbai-to-mangalore-airport',
  'pune-to-kochi-airport',
  'pune-to-nagpur-airport',
  'tirupati-airport-to-chittoor',
  'vijayawada-airport-to-machilipatnam',
  'ahmedabad-to-tirupati-airport',
  'bangalore-to-kolkata-airport',
  'bangalore-to-pune-airport',
  'bangalore-to-surat-airport',
  'chandigarh-airport-to-patiala',
  'chennai-to-ahmedabad-airport',
  'chennai-to-goa-airport',
  'chennai-to-kolkata-airport',
  'city-to-udaipur-airport',
  'hyderabad-to-goa-airport',
  'hyderabad-to-jodhpur-airport',
  'hyderabad-to-mumbai-airport',
  'hyderabad-to-tirupati-airport',
  'hyderabad-to-udaipur-airport',
  'jaipur-airport-to-alwar',
  'kolkata-to-ahmedabad-airport',
  'kolkata-to-bangalore-airport',
  'kolkata-to-surat-airport',
  'lucknow-airport-to-ayodhya',
  'mumbai-to-nagpur-airport',
  'pathankot-to-amritsar-airport',
  'pune-to-hyderabad-airport',
  'chennai-to-coimbatore-airport',
  'chennai-to-delhi-airport',
  'chennai-to-jaipur-airport',
  'city-to-kolkata-airport',
  'coimbatore-airport-to-narasaraopet',
  'hyderabad-to-varanasi-airport',
  'kolkata-to-chennai-airport',
  'mumbai-to-amritsar-airport',
  'mumbai-to-indore-airport',
  'mumbai-to-jaipur-airport',
  'pune-to-chandigarh-airport',
  'pune-to-vadodara-airport',
  'rajkot-airport-to-gondal',
  'ranchi-airport-to-hazaribagh',
  'visakhapatnam-airport-to-rajahmundry',
  'bangalore-airport-to-kolar',
  'chennai-to-lucknow-airport',
  'chennai-to-nagpur-airport',
  'chennai-to-thiruvananthapuram-airport',
  'city-to-lucknow-airport',
  'hyderabad-to-amritsar-airport',
  'hyderabad-to-rajkot-airport',
  'hyderabad-to-thiruvananthapuram-airport',
  'indore-airport-to-ratlam',
  'kolkata-to-pune-airport',
  'mumbai-to-varanasi-airport',
  'ahmedabad-to-jodhpur-airport',
  'ahmedabad-to-nagpur-airport',
  'bhubaneswar-airport-to-cuttack',
  'chennai-to-bangalore-airport',
  'city-to-amritsar-airport',
  'city-to-chennai-airport',
  'city-to-tirupati-airport',
  'hyderabad-to-patna-airport',
  'lucknow-airport-to-kanpur',
  'mumbai-airport-to-thane',
  'mumbai-to-delhi-airport',
  'mumbai-to-surat-airport',
  'pune-to-kozhikode-airport',
  'pune-to-varanasi-airport',
  'tirupati-airport-to-nellore',
  'visakhapatnam-airport-to-srikakulam',
  'ahmedabad-airport-to-udaipur-rajasthan',
  'ahmedabad-to-amritsar-airport',
  'ahmedabad-to-pune-airport',
  'bangalore-airport-to-mysore',
  'bangalore-to-delhi-airport',
  'bangalore-to-hyderabad-airport',
  'bangalore-to-madurai-airport',
  'bangalore-to-mumbai-airport',
  'bangalore-to-nagpur-airport',
  'bangalore-to-tirupati-airport',
  'chennai-to-madurai-airport',
  'chennai-to-mangalore-airport',
  'chennai-to-surat-airport',
  'chennai-to-udaipur-airport',
  'city-to-madurai-airport',
  'city-to-mysore-airport',
  'city-to-patna-airport',
  'delhi-airport-to-meerut',
  'hyderabad-to-lucknow-airport',
  'mumbai-to-bhopal-airport',
  'pune-to-mangalore-airport',
  'vadodara-airport-to-nadiad',
  'ahmedabad-airport-to-surendranagar',
  'ahmedabad-to-mumbai-airport',
  'city-to-vijayawada-airport',
]);

interface PageProps {
  params: {
    slug: string;
  };
}

// Helper function to create SEO-friendly airport slug
function getAirportSlugForSEO(airportName: string, airportSlug: string): string {
  // Remove airport codes and technical suffixes from slug for SEO
  // ahmedabad-airport-amd -> ahmedabad-airport
  // delhi-airport-del -> delhi-airport
  return airportSlug.replace(/-[a-z]{3}$/i, '');
}

// Helper function to parse route slug (handles both old and new formats)
function parseRouteSlug(slug: string) {
  // Supports formats:
  // 1. ahmedabad-airport-to-city (new SEO format)
  // 2. ahmedabad-airport-to-ahmedabad (new specific city)
  // 3. ahmedabad-airport-amd-to-ahmedabad (old format - backward compatible)

  const parts = slug.split('-to-');
  if (parts.length !== 2) return null;

  let from = parts[0];
  let to = parts[1];

  // Handle "to-city" format - will need to resolve city from airport location
  const isCityGeneric = to === 'city';

  return { from, to, isCityGeneric };
}

// Generate SEO-friendly slug for route
function generateSEOSlug(fromLocation: any, toLocation: any): string {
  const isAirportPickup = fromLocation.type === 'AIRPORT';

  if (isAirportPickup) {
    // Airport to City format
    const airportSlug = getAirportSlugForSEO(fromLocation.name, fromLocation.slug);

    // Check if destination city is same as airport city (parent location)
    const airportCityName = fromLocation.locations?.name || '';
    const isSameCity = airportCityName.toLowerCase().includes(toLocation.name.toLowerCase()) ||
                       toLocation.name.toLowerCase().includes(airportCityName.toLowerCase());

    if (isSameCity) {
      // Same city: use "airport-to-city" format for better SEO
      return `${airportSlug}-to-city`;
    } else {
      // Different city: use specific city name
      return `${airportSlug}-to-${toLocation.slug}`;
    }
  } else {
    // City to Airport format
    const airportSlug = getAirportSlugForSEO(toLocation.name, toLocation.slug);

    // Check if source city is same as airport city
    const airportCityName = toLocation.locations?.name || '';
    const isSameCity = airportCityName.toLowerCase().includes(fromLocation.name.toLowerCase()) ||
                       fromLocation.name.toLowerCase().includes(airportCityName.toLowerCase());

    if (isSameCity) {
      // Same city: use "city-to-airport" format
      return `city-to-${airportSlug}`;
    } else {
      // Different city: use specific city name
      return `${fromLocation.slug}-to-${airportSlug}`;
    }
  }
}

// Generate static params - ONLY popular airport routes with SEO-friendly slugs
export async function generateStaticParams() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[airport-transfer routes] Skipping database calls during build');
      return [];
    }

    // Fetch ALL active airport routes from database for build time
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        // ✅ No isPopular filter - generate ALL routes
        OR: [
          {
            locations_chauffeur_route_packages_fromLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
          {
            locations_chauffeur_route_packages_toLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
        ],
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: {
            slug: true,
            name: true,
            type: true,
            locations: {
              select: { name: true }
            }
          },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: {
            slug: true,
            name: true,
            type: true,
            locations: {
              select: { name: true }
            }
          },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      // ✅ No take limit - generate ALL routes
    });

    const routeParams = routes.map((route) => {
      const fromLoc = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLoc = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      // Generate SEO-friendly slug
      const seoSlug = generateSEOSlug(fromLoc, toLoc);

      return { slug: seoSlug };
    });

    console.log(`[airport-transfer] Generating ALL ${routeParams.length} airport route pages at build time`);
    return routeParams;
  } catch (error) {
    console.error('[airport-transfer] Error fetching routes:', error);
    return [];
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new routes without rebuild
export const dynamicParams = true;

// Resolve actual locations from SEO-friendly slug
async function resolveLocationsFromSlug(fromSlug: string, toSlug: string, isCityGeneric: boolean) {
  try {
    // Find the "from" location
    const fromLocation = await prisma.locations.findFirst({
      where: {
        OR: [
          { slug: fromSlug },
          { slug: { startsWith: fromSlug } }, // Handle cleaned slugs
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        code: true,
        parentId: true,
        locations: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!fromLocation) {
      console.log(`[Airport Route] From location not found: ${fromSlug}`);
      return null;
    }

    let toLocation;

    if (isCityGeneric) {
      // Handle "to-city" format - find city in same area as airport
      if (fromLocation.type === 'AIRPORT') {
        // Find the main city where this airport is located
        // Try multiple strategies to find the right city

        const cityQueries = [];

        // Strategy 1: Same parent location as airport
        if (fromLocation.parentId) {
          cityQueries.push({
            parentId: fromLocation.parentId,
            type: 'CITY',
            isActive: true,
          });
        }

        // Strategy 2: City name similar to airport's parent location name
        if (fromLocation.locations?.name) {
          const parentName = fromLocation.locations.name;
          cityQueries.push({
            name: { contains: parentName },
            type: 'CITY',
            isActive: true,
          });
        }

        // Strategy 3: City slug similar to airport slug (without -airport suffix)
        const citySlugGuess = fromLocation.slug.replace(/-airport.*$/i, '');
        if (citySlugGuess && citySlugGuess !== fromLocation.slug) {
          cityQueries.push({
            slug: citySlugGuess,
            type: 'CITY',
            isActive: true,
          });
        }

        // Try each strategy until we find a city
        for (const query of cityQueries) {
          toLocation = await prisma.locations.findFirst({
            where: query,
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              code: true,
              parentId: true,
              locations: {
                select: { id: true, name: true, type: true },
              },
            },
          });

          if (toLocation) break;
        }

        if (!toLocation) {
          console.log(`[Airport Route] Could not find city for airport: ${fromLocation.slug}`);
          return null;
        }
      } else {
        console.log(`[Airport Route] Invalid "to-city" format for non-airport source`);
        return null;
      }
    } else {
      // Regular city slug
      toLocation = await prisma.locations.findFirst({
        where: {
          OR: [
            { slug: toSlug },
            { slug: { startsWith: toSlug } }, // Handle cleaned slugs
          ],
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          code: true,
          parentId: true,
          locations: {
            select: { id: true, name: true, type: true },
          },
        },
      });
    }

    if (!toLocation) {
      console.log(`[Airport Route] To location not found: ${toSlug}`);
      return null;
    }

    return { fromLocation, toLocation };
  } catch (error) {
    console.error('[Airport Route] Error resolving locations:', error);
    return null;
  }
}

// Fetch route data from database
async function getRouteData(fromSlug: string, toSlug: string, isCityGeneric: boolean = false) {
  try {
    // Resolve actual locations from SEO slug
    const locations = await resolveLocationsFromSlug(fromSlug, toSlug, isCityGeneric);
    if (!locations) return null;

    const { fromLocation, toLocation } = locations;

    // Verify at least one location is an airport
    const isAirportRoute = fromLocation.type === 'AIRPORT' || toLocation.type === 'AIRPORT';
    if (!isAirportRoute) {
      console.log(`[Airport Route] Not an airport route: ${fromSlug} -> ${toSlug}`);
      return null;
    }

    // Get route packages for all vehicle categories
    const routePackages = await prisma.chauffeur_route_packages.findMany({
      where: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        isActive: true,
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            code: true,
            locations: {
              select: { name: true, type: true },
            },
          },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            code: true,
            locations: {
              select: { name: true, type: true },
            },
          },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            exampleVehicles: true,
            image: true,
          },
        },
      },
      orderBy: { basePrice: 'asc' },
    });

    // If no packages found, return null to show 404
    if (routePackages.length === 0) return null;

    return {
      packages: routePackages,
      from: fromLocation,
      to: toLocation,
      isAirportPickup: fromLocation.type === 'AIRPORT',
    };
  } catch (error) {
    console.error('[Airport Route] Error fetching route data:', error);
    return null;
  }
}

// Get similar routes from same airport
async function getSimilarAirportRoutes(
  airportLocationId: string,
  isPickup: boolean,
  excludeLocationId: string
) {
  try {
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        ...(isPickup
          ? {
              fromLocationId: airportLocationId,
              toLocationId: { not: excludeLocationId },
            }
          : {
              toLocationId: airportLocationId,
              fromLocationId: { not: excludeLocationId },
            }),
        isActive: true,
        isPopular: true,
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: {
            name: true,
            slug: true,
            code: true,
            type: true,
            locations: {
              select: { name: true }
            }
          },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: {
            name: true,
            slug: true,
            code: true,
            type: true,
            locations: {
              select: { name: true }
            }
          },
        },
        chauffeur_vehicle_categories: {
          select: { name: true },
        },
      },
      distinct: isPickup ? ['toLocationId'] : ['fromLocationId'],
      take: 6,
      orderBy: { displayOrder: 'asc' },
    });

    return routes.map((route) => {
      const fromLoc = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLoc = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      // Generate SEO-friendly slug for similar routes too
      const seoSlug = generateSEOSlug(fromLoc, toLoc);

      return {
        fromCity: fromLoc.name,
        fromSlug: fromLoc.slug,
        fromCode: fromLoc.code,
        toCity: toLoc.name,
        toSlug: toLoc.slug,
        toCode: toLoc.code,
        routeSlug: seoSlug, // Use SEO slug
        distance: route.estimatedKm,
        estimatedTime: route.estimatedDuration,
        price: route.basePrice,
        vehicleType: route.chauffeur_vehicle_categories.name,
      };
    });
  } catch (error) {
    console.error('[Airport Route] Error fetching similar routes:', error);
    return [];
  }
}

// Generate SEO-optimized metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseRouteSlug(params.slug);

  if (!parsed) {
    if (COMING_SOON_SLUGS.has(params.slug)) {
      const parts = params.slug.split('-to-');
      const from = slugToLabel(parts[0]);
      const to = slugToLabel(parts[1] ?? '');
      return {
        title: `${from} to ${to} Airport Transfer — Coming Soon | TransRentals`,
        description: `${from} to ${to} airport transfer service is launching soon on TransRentals. Book from 500+ available airport routes across India.`,
        robots: { index: true, follow: true },
      };
    }
    return { title: 'Airport Transfer | TransRentals' };
  }

  const routeData = await getRouteData(parsed.from, parsed.to, parsed.isCityGeneric);
  if (!routeData) {
    if (COMING_SOON_SLUGS.has(params.slug)) {
      const from = slugToLabel(parsed.from);
      const to = slugToLabel(parsed.to);
      return {
        title: `${from} to ${to} Airport Transfer — Coming Soon | TransRentals`,
        description: `${from} to ${to} airport transfer service is launching soon on TransRentals. Book from 500+ available airport routes across India.`,
        robots: { index: true, follow: true },
      };
    }
    return { title: 'Airport Transfer | TransRentals' };
  }

  const { from, to, packages, isAirportPickup } = routeData;

  if (!packages || packages.length === 0) {
    return {
      title: `${from.name} to ${to.name} Cab | TransRentals`,
      description: `Airport transfer service from ${from.name} to ${to.name}. Book your ride with TransRentals.`,
    };
  }

  const minPrice = Math.min(...packages.map((p) => p.basePrice));
  const avgDistance = packages[0]?.estimatedKm || 0;
  const avgTime = packages[0]?.estimatedDuration || '';

  // SEO-optimized display names
  const airportName = isAirportPickup ? from.name : to.name;
  const cityName = isAirportPickup ? to.name : from.name;
  const airportCode = (isAirportPickup ? from.code : to.code) || '';

  // Simplified airport name for SEO (without "International Airport" etc)
  const airportShortName = airportName.split(' ')[0]; // e.g., "Ahmedabad" from "Ahmedabad Airport"

  const serviceType = isAirportPickup ? 'Airport Pickup' : 'Airport Drop';
  const serviceAction = isAirportPickup ? 'from' : 'to';

  // SEO-optimized title with high-traffic keywords
  const title = isAirportPickup
    ? `${airportShortName} Airport to City Taxi @₹${minPrice} | ${airportCode} Cab Booking`
    : `${cityName} to ${airportShortName} Airport Cab @₹${minPrice} | ${serviceType}`;

  // SEO-optimized description with keyword variations
  const description = isAirportPickup
    ? `Book ${airportShortName} Airport to ${cityName} City taxi service. Starting @₹${minPrice}. Cab from ${airportCode} airport with 45 min free wait. Professional drivers, flight tracking, 24/7 support.`
    : `Book ${cityName} to ${airportShortName} Airport cab service. Starting @₹${minPrice}. Airport drop with on-time pickup, professional drivers, and 24/7 support.`;

  // Comprehensive keyword list for SEO
  const keywords = [
    // Primary keywords
    `${airportShortName.toLowerCase()} airport to city taxi`,
    `${airportShortName.toLowerCase()} airport cab`,
    `cab from ${airportShortName.toLowerCase()} airport`,
    `${airportCode.toLowerCase()} airport to city`,

    // Secondary keywords
    `${airportShortName.toLowerCase()} airport transfer`,
    `taxi service ${airportShortName.toLowerCase()} airport`,
    `${airportShortName.toLowerCase()} airport ${isAirportPickup ? 'pickup' : 'drop'}`,
    `${airportName.toLowerCase()} taxi`,

    // Long-tail keywords
    `${airportShortName.toLowerCase()} airport to ${cityName.toLowerCase()} cab`,
    `${airportCode.toLowerCase()} to ${cityName.toLowerCase()} taxi`,
    `book ${airportShortName.toLowerCase()} airport taxi`,
    `${airportShortName.toLowerCase()} airport cab booking`,

    // Brand + location
    `${airportName.toLowerCase()} to ${cityName.toLowerCase()} transfer`,
    isAirportPickup ? `${airportCode.toLowerCase()} airport pickup service` : `${cityName.toLowerCase()} to airport drop`,
  ];

  const _seoDb = await resolvePageMeta(`airport-transfer:${params.slug}`);
  return {
    title: _seoDb?.metaTitle || title,
    description: _seoDb?.metaDescription || description,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : keywords,
    openGraph: {
      title: `${airportShortName} Airport ${serviceAction} City Taxi @₹${minPrice}`,
      description: `Travel ${avgDistance} km. Starting @₹${minPrice}. 45 min free wait. Book now!`,
      url: `https://transrentals.in/airport-transfer/${params.slug}`,
      type: 'website',
      images: [
        {
          url: '/images/og/airport-transfer.jpg',
          width: 1200,
          height: 630,
          alt: `${airportName} to ${cityName} Airport Transfer Service`,
        },
      ],
    },
    alternates: {
      canonical: `https://transrentals.in/airport-transfer/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

function slugToLabel(part: string): string {
  return part.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function AirportTransferRoutePage({ params }: PageProps) {
  const parsed = parseRouteSlug(params.slug);

  // Invalid route format - must contain "-to-"
  if (!parsed) {
    if (COMING_SOON_SLUGS.has(params.slug)) {
      const parts = params.slug.split('-to-');
      return <AirportRouteComingSoon fromLabel={slugToLabel(parts[0])} toLabel={slugToLabel(parts[1] ?? '')} slug={params.slug} />;
    }
    permanentRedirect('/airport-transfer');
  }

  const routeData = await getRouteData(parsed.from, parsed.to, parsed.isCityGeneric);

  // Route not found or not an airport route — show Coming Soon for known slugs
  if (!routeData) {
    if (COMING_SOON_SLUGS.has(params.slug)) {
      return (
        <AirportRouteComingSoon
          fromLabel={slugToLabel(parsed.from)}
          toLabel={slugToLabel(parsed.to)}
          slug={params.slug}
        />
      );
    }
    permanentRedirect('/airport-transfer');
  }

  const { from, to, packages, isAirportPickup } = routeData;

  // Get similar airport routes
  const airportId = isAirportPickup ? from.id : to.id;
  const otherLocationId = isAirportPickup ? to.id : from.id;
  const similarRoutes = await getSimilarAirportRoutes(airportId, isAirportPickup, otherLocationId);

  // Calculate route statistics
  const minPrice = Math.min(...packages.map((p) => p.basePrice));
  const maxPrice = Math.max(...packages.map((p) => p.basePrice));
  const avgDistance = packages[0]?.estimatedKm || 0;
  const avgTime = packages[0]?.estimatedDuration || '';
  const avgToll = packages[0]?.tollsEstimate || 0;

  // SEO-optimized display values
  const airportName = isAirportPickup ? from.name : to.name;
  const cityName = isAirportPickup ? to.name : from.name;
  const airportCode = (isAirportPickup ? from.code : to.code) || '';
  const airportShortName = airportName.split(' ')[0];

  const fromDisplay = isAirportPickup ? airportShortName + ' Airport' : cityName;
  const toDisplay = isAirportPickup ? cityName + ' City' : airportShortName + ' Airport';
  const serviceType = isAirportPickup ? 'Pickup' : 'Drop';

  // Generate SEO-friendly slug for this route (for canonical and links)
  const seoSlug = generateSEOSlug(from, to);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/airport-transfer" className="hover:text-primary">
              Airport Transfer
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {fromDisplay} to {toDisplay}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section with Booking Form & Vehicle Selection */}
      <AirportRouteBookingHero
        fromCity={from.name}
        fromSlug={from.slug}
        fromCode={from.code}
        toCity={to.name}
        toSlug={to.slug}
        toCode={to.code}
        distance={avgDistance}
        estimatedTime={avgTime}
        minPrice={minPrice}
        isAirportPickup={isAirportPickup}
      />

      {/* SEO-Optimized Content Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            {airportShortName} Airport to City Taxi Service
          </h1>
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-4">
              Book reliable cab from {airportShortName} Airport ({airportCode}) to {cityName} city.
              Professional taxi service with {avgDistance} km coverage in just {avgTime}.
              Starting at ₹{minPrice} with 45 minutes free waiting time.
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {airportCode} Airport to {cityName} Cab Booking
            </h2>
            <p className="text-gray-700">
              TransRentals offers the best {airportShortName.toLowerCase()} airport taxi service
              with instant booking confirmation. Our {airportShortName.toLowerCase()} airport to city
              transfer service includes flight tracking, meet & greet, and professional chauffeurs.
            </p>
          </div>
        </div>
      </section>

      {/* Route Overview */}
      <RouteOverview
        fromCity={from.name}
        fromState={from.locations?.name || 'India'}
        toCity={to.name}
        toState={to.locations?.name || 'India'}
        distance={avgDistance}
        estimatedTime={avgTime}
        tollCharges={avgToll}
        routeDescription={packages[0]?.routeDescription}
      />

      {/* Pricing Cards */}
      <RoutePricing
        packages={packages}
        fromCity={from.name}
        toCity={to.name}
        routeSlug={seoSlug}
      />

      {/* Why Book Airport Transfer */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Book {fromDisplay} to {toDisplay} Airport Transfer?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⏱️', title: '45 Min Free Wait', desc: 'Free waiting time at airport' },
              { icon: '💰', title: 'Best Price', desc: `Starting @₹${minPrice}` },
              { icon: '✈️', title: 'Flight Tracking', desc: 'Monitor your flight status' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book in 2 minutes' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Airport Transfer Features */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {airportName} {serviceType} Service Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-blue-600 text-3xl mb-4">🛬</div>
              <h3 className="font-semibold text-xl mb-3">Meet & Greet</h3>
              <p className="text-gray-600">
                {isAirportPickup
                  ? 'Driver will meet you at arrival gate with name board'
                  : 'Driver will pick you up from your doorstep on time'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-blue-600 text-3xl mb-4">📦</div>
              <h3 className="font-semibold text-xl mb-3">Luggage Assistance</h3>
              <p className="text-gray-600">
                Professional drivers help with loading and unloading your luggage safely
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-blue-600 text-3xl mb-4">🚗</div>
              <h3 className="font-semibold text-xl mb-3">Clean & Sanitized</h3>
              <p className="text-gray-600">All vehicles are regularly cleaned and sanitized for your safety</p>
            </div>
          </div>
        </div>
      </section>

      {/* Traveler Tips */}
      <TravelerTips
        fromCity={from.name}
        toCity={to.name}
        distance={avgDistance}
        estimatedTime={avgTime}
      />

      {/* Similar Airport Routes */}
      {similarRoutes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8 text-center">
              More Routes from {airportName}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarRoutes.map((route, index) => (
                <a
                  key={index}
                  href={`/airport-transfer/${route.routeSlug}`}
                  className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-400 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="text-lg font-bold">{route.fromCode || route.fromCity}</p>
                    </div>
                    <div className="text-blue-600">→</div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">To</p>
                      <p className="text-lg font-bold">{route.toCode || route.toCity}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                    <span className="text-sm text-gray-600">{route.distance} km</span>
                    <span className="text-lg font-bold text-blue-600">₹{route.price}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Return Journey Option */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container-custom max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Return Journey?</h2>
          <p className="text-gray-600 mb-6">
            Book {toDisplay} to {fromDisplay} cab for your return trip
          </p>
          <a
            href={`/airport-transfer/${generateSEOSlug(to, from)}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            🔄 Book Return Journey
          </a>
        </div>
      </section>

      {/* Reviews */}
      <RouteReviews fromCity={from.name} toCity={to.name} routeSlug={seoSlug} />

      {/* FAQs */}
      <RouteFAQs
        fromCity={from.name}
        toCity={to.name}
        distance={avgDistance}
        estimatedTime={avgTime}
        minPrice={minPrice}
        tollCharges={avgToll}
      />

      {/* Schema Markup for SEO - Multiple schemas for rich snippets */}

      {/* 1. Service Schema with AggregateRating */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Airport Transfer Service',
            name: `${airportShortName} Airport ${serviceType} Service`,
            description: `Book ${airportShortName} airport taxi from ${fromDisplay} to ${toDisplay}. ${avgDistance} km in ${avgTime}. Starting @₹${minPrice}. 45 minutes free waiting time.`,
            provider: {
              '@type': 'LocalBusiness',
              name: 'TransRentals',
              url: 'https://transrentals.in',
              telephone: '+91-9737965551',
              priceRange: '₹₹',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'IN',
              },
            },
            areaServed: {
              '@type': 'City',
              name: cityName,
            },
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: minPrice.toString(),
              highPrice: maxPrice.toString(),
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `https://transrentals.in/airport-transfer/${params.slug}`,
              priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '2847',
              bestRating: '5',
              worstRating: '1',
            },
          }),
        }}
      />

      {/* 2. BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://transrentals.in',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Airport Transfer',
                item: 'https://transrentals.in/airport-transfer',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${airportShortName} ${serviceType}`,
                item: `https://transrentals.in/airport-transfer/${params.slug}`,
              },
            ],
          }),
        }}
      />

      {/* 3. FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `How much does ${airportShortName} airport taxi cost?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `${airportShortName} airport taxi starts from ₹${minPrice}. Price varies by vehicle type (sedan, SUV, Innova). All prices include fuel, driver charges, toll (₹${avgToll || 'applicable'}), parking, and 45 minutes free waiting time. No hidden charges.`,
                },
              },
              {
                '@type': 'Question',
                name: `What is the distance from ${airportShortName} to ${cityName}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `The distance from ${airportName} to ${cityName} city is approximately ${avgDistance} km. The journey takes around ${avgTime} depending on traffic conditions.`,
                },
              },
              {
                '@type': 'Question',
                name: 'Is 45 minutes free waiting time included?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! All airport pickups include 45 minutes complimentary waiting time from your flight landing time. We track your flight status in real-time. If your flight is delayed, no extra charges for waiting.',
                },
              },
              {
                '@type': 'Question',
                name: 'How will the driver find me at the airport?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `For airport pickups, driver will wait at arrival gate with a name board displaying your name. You'll receive driver details (name, photo, contact) 1 hour before pickup time via SMS and email.`,
                },
              },
              {
                '@type': 'Question',
                name: `What is included in ${airportShortName} airport taxi fare?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Airport taxi fare includes: (1) Base fare for ${avgDistance} km, (2) Fuel charges, (3) Driver charges, (4) Toll & parking (₹${avgToll || 'as applicable'}), (5) 45 min free waiting, (6) State permits, (7) GST 5%. NO hidden charges.`,
                },
              },
              {
                '@type': 'Question',
                name: 'Can I book airport drop taxi?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Yes! We provide both airport pickup and airport drop services. For drop, driver will pick you from your location in ${cityName} and drop you at ${airportName} terminal. Flight tracking available for on-time arrival.`,
                },
              },
              {
                '@type': 'Question',
                name: 'What if my flight is delayed?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No worries! We track your flight in real-time. If delayed, driver will adjust pickup time automatically. 45 minutes free waiting time starts from actual landing time. No extra charges for flight delays.',
                },
              },
            ],
          }),
        }}
      />
    </>
  );
}
