import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { OneWayRouteBookingHero } from '@/components/one-way-cab/OneWayRouteBookingHero';
import { OneWayCabComingSoon } from '@/components/one-way-cab/OneWayCabComingSoon';
import { RouteOverview } from '@/components/routes/RouteOverview';
import { RoutePricing } from '@/components/routes/RoutePricing';
import { SimilarRoutes } from '@/components/routes/SimilarRoutes';
import { PopularStops } from '@/components/routes/PopularStops';
import { TravelerTips } from '@/components/routes/TravelerTips';
import { RouteReviews } from '@/components/routes/RouteReviews';
import { RouteFAQs } from '@/components/routes/RouteFAQs';

// Routes not yet in DB — show Coming Soon instead of redirecting
const COMING_SOON_SLUGS = new Set([
  'chandigarh',
  'anantapur-to-chennai',
  'nashik',
  'rameswaram',
  'ajmer-to-bangalore',
  'mumbai-to-mahabaleshwar',
  'ambala-to-pune',
  'amritsar-to-jalandhar',
  'bangalore-to-chikkaballapur',
  'bikaner',
  'greater-noida',
  'mumbai-to-aurangabad',
  'noida-to-panipat',
  'patna-to-muzaffarpur',
  'shillong',
  'udaipur',
  'ahmedabad',
  'aihole',
  'ajmer-to-ahmedabad',
  'ajmer-to-chennai',
  'ajmer-to-hyderabad',
  'aligarh-to-kochi',
  'along-to-bangalore',
  'alwar-to-chennai',
  'ambarnath-to-ahmedabad',
  'ambarnath-to-bangalore',
  'ambikapur-to-ahmedabad',
  'amreli-to-hyderabad',
  'amreli-to-jamnagar',
  'amritsar-to-bangalore',
  'amritsar-to-dalhousie',
  'anand-to-ahmedabad',
  'anand-to-vadodara',
  'bundi',
  'darbhanga',
  'dhule',
  'jammu-and-kashmir',
  'kargil',
  'lonavala',
  'mumbai-to-hyderabad',
  'nadiad-to-udaipur-rajasthan',
  'nagpur-to-pune',
  'neermahal',
  'noida-to-dehradun',
  'patna',
  'rajkot-to-dwarka',
  'tura',
  'badami',
  'adilabad-to-kochi',
  'agra-to-lucknow',
  'akola-to-chennai',
  'aligarh-to-kolkata',
  'ambala-to-mumbai',
  'amreli-to-mumbai',
  'bangalore-to-mangalore',
  'chandipur',
  'chennai-to-tirupati',
  'coorg',
  'dalhousie',
  'durg',
  'jaipur',
  'jaipur-to-bikaner',
  'jamnagar',
  'mangalore',
  'mumbai-to-latur',
  'pathankot-to-jammu-and-kashmir',
  'port-blair',
  'pune',
  'rajkot',
  'tirupati',
  'ahmednagar-to-chennai',
  'ahmednagar-to-pune',
  'alipurduar-to-chennai',
  'alipurduar-to-hyderabad',
  'alipurduar-to-mumbai',
  'alwar-to-pune',
  'bangalore-to-hubballi',
  'bhopal-to-indore',
  'goalpara',
  'jalgaon',
  'mysore-to-chennai',
  'panipat',
  'pune-to-aurangabad',
  'arambol',
  'bangalore-to-tirupati',
  'jalandhar',
  'kota',
  'tiruchirappalli',
  'aizawl-to-bangalore',
  'alipurduar-to-pune',
  'ambikapur-to-mumbai',
  'amravati-to-pune',
  'amreli-to-bangalore',
  'anand-to-surat',
  'bhuj',
  'dehradun',
  'dindigul',
  'hubballi',
  'jaipur-to-sikar',
  'kolkata-to-jamshedpur',
  'patna-to-ranchi',
  'ranchi',
  'thiruvananthapuram',
  'vapi',
  'adilabad-to-mumbai',
  'adoni-to-bangalore',
  'amreli-to-vadodara',
  'jamshedpur',
  'karnal',
  'khanna',
  'nashik-to-aurangabad',
  'noida-to-aligarh',
  'rourkela',
  'sindhudurg',
  'vagator',
  'panipat-to-delhi',
]);

function slugToLabel(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function routeSlugToLabel(slug: string): string {
  // ambala-to-pune → "Ambala to Pune"
  const parts = slug.split('-to-');
  if (parts.length === 2) return `${slugToLabel(parts[0])} to ${slugToLabel(parts[1])}`;
  return slugToLabel(slug);
}

interface PageProps {
  params: {
    route: string;
  };
}

// Helper function to parse route slug
function parseRouteSlug(slug: string) {
  // delhi-to-agra -> { from: 'delhi', to: 'agra' }
  const parts = slug.split('-to-');
  if (parts.length !== 2) return null;
  return { from: parts[0], to: parts[1] };
}

// Helper function to get region name (State/UT/Country)
function getRegionName(location: any): string {
  // If location is UNION_TERRITORY or STATE, return its own name
  if (location.type === 'UNION_TERRITORY' || location.type === 'STATE') {
    return location.name;
  }

  // If location has parent, return parent name
  if (location.locations && location.locations.name) {
    return location.locations.name;
  }

  // Fallback to India
  return 'India';
}

// Generate static params from DATABASE - Only popular routes
export async function generateStaticParams() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[one-way-cab routes] Skipping database calls during build');
      return [];
    }

    // Fetch popular routes from database (EXCLUDE airport routes)
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        isPopular: true, // Only generate static pages for popular routes
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
          select: { slug: true, name: true, type: true }
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { slug: true, name: true, type: true }
        }
      },
      distinct: ['fromLocationId', 'toLocationId'], // Unique routes only
      take: 100, // Limit to top 100 popular routes
    });

    const routeParams = routes.map((route) => ({
      route: `${route.locations_chauffeur_route_packages_fromLocationIdTolocations.slug}-to-${route.locations_chauffeur_route_packages_toLocationIdTolocations.slug}`,
    }));

    console.log(`[one-way-cab routes] Generating ${routeParams.length} city-to-city route pages (airports excluded)`);
    return routeParams;
  } catch (error) {
    console.error('[one-way-cab routes] Error fetching routes:', error);
    return [];
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new routes without rebuild
export const dynamicParams = true;

// Fetch route data from database
async function getRouteData(fromSlug: string, toSlug: string) {
  try {
    // Get location IDs with parent info
    const [fromLocation, toLocation] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: fromSlug, isActive: true },
        include: {
          locations: { // parent location
            select: { name: true, type: true }
          }
        }
      }),
      prisma.locations.findFirst({
        where: { slug: toSlug, isActive: true },
        include: {
          locations: { // parent location
            select: { name: true, type: true }
          }
        }
      }),
    ]);

    if (!fromLocation || !toLocation) {
      console.log(`[Route] Location not found: ${fromSlug} -> ${toSlug}`);
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
          locations: { // parent location
            select: { name: true, type: true }
          }
        }
      },
      locations_chauffeur_route_packages_toLocationIdTolocations: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          locations: { // parent location
            select: { name: true, type: true }
          }
        }
      },
      chauffeur_vehicle_categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          seatingCapacity: true,
          exampleVehicles: true,
          image: true,
        }
      }
    },
    orderBy: { basePrice: 'asc' }
  });

  // If no packages found, return null to show 404
  if (routePackages.length === 0) return null;

    return {
      packages: routePackages,
      from: fromLocation,
      to: toLocation,
    };
  } catch (error) {
    console.error('[Route] Error fetching route data:', error);
    return null;
  }
}

// Get similar routes (same FROM city)
async function getSimilarRoutesFrom(fromLocationId: string, excludeToLocationId: string) {
  try {
    const routes = await prisma.chauffeur_route_packages.findMany({
    where: {
      fromLocationId,
      toLocationId: { not: excludeToLocationId },
      isActive: true,
      isPopular: true,
    },
    include: {
      locations_chauffeur_route_packages_toLocationIdTolocations: {
        select: { name: true, slug: true }
      },
      chauffeur_vehicle_categories: {
        select: { name: true }
      }
    },
    distinct: ['toLocationId'],
    take: 6,
    orderBy: { displayOrder: 'asc' }
  });

    return routes.map(route => ({
      toCity: route.locations_chauffeur_route_packages_toLocationIdTolocations.name,
      toSlug: route.locations_chauffeur_route_packages_toLocationIdTolocations.slug,
      distance: route.estimatedKm,
      estimatedTime: route.estimatedDuration,
      price: route.basePrice,
      vehicleType: route.chauffeur_vehicle_categories.name,
    }));
  } catch (error) {
    console.error('[Route] Error fetching similar routes FROM:', error);
    return [];
  }
}

// Get similar routes (same TO city)
async function getSimilarRoutesTo(toLocationId: string, excludeFromLocationId: string) {
  try {
    const routes = await prisma.chauffeur_route_packages.findMany({
    where: {
      toLocationId,
      fromLocationId: { not: excludeFromLocationId },
      isActive: true,
      isPopular: true,
    },
    include: {
      locations_chauffeur_route_packages_fromLocationIdTolocations: {
        select: { name: true, slug: true }
      },
      chauffeur_vehicle_categories: {
        select: { name: true }
      }
    },
    distinct: ['fromLocationId'],
    take: 6,
    orderBy: { displayOrder: 'asc' }
  });

    return routes.map(route => ({
      fromCity: route.locations_chauffeur_route_packages_fromLocationIdTolocations.name,
      fromSlug: route.locations_chauffeur_route_packages_fromLocationIdTolocations.slug,
      distance: route.estimatedKm,
      estimatedTime: route.estimatedDuration,
      price: route.basePrice,
      vehicleType: route.chauffeur_vehicle_categories.name,
    }));
  } catch (error) {
    console.error('[Route] Error fetching similar routes TO:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseRouteSlug(params.route);

  if (!parsed) {
    if (COMING_SOON_SLUGS.has(params.route)) {
      const label = routeSlugToLabel(params.route);
      return {
        title: `${label} One Way Cab — Coming Soon | TransRentals`,
        description: `${label} one way cab service is launching soon on TransRentals. Browse 500+ available one way routes across India.`,
        robots: { index: true, follow: true },
      };
    }
    return { title: 'One Way Cab | TransRentals' };
  }

  const routeData = await getRouteData(parsed.from, parsed.to);
  if (!routeData) {
    if (COMING_SOON_SLUGS.has(params.route)) {
      const label = routeSlugToLabel(params.route);
      return {
        title: `${label} One Way Cab — Coming Soon | TransRentals`,
        description: `${label} one way cab service is launching soon on TransRentals. Browse 500+ available one way routes across India.`,
        robots: { index: true, follow: true },
      };
    }
    return { title: 'One Way Cab | TransRentals' };
  }

  const { from, to, packages } = routeData;

  // If no packages, return basic metadata (will show 404 anyway)
  if (!packages || packages.length === 0) {
    return {
      title: `${from.name} to ${to.name} Cab | TransRentals`,
      description: `One way cab service from ${from.name} to ${to.name}. Book your ride with TransRentals.`,
    };
  }

  const minPrice = Math.min(...packages.map(p => p.basePrice));
  const avgDistance = packages[0]?.estimatedKm || 0;
  const avgTime = packages[0]?.estimatedDuration || '';

  const _seoDb = await resolvePageMeta(`one-way-cab:${params.route}`);
  return {
    title: _seoDb?.metaTitle || `${from.name} to ${to.name} Cab | One Way Taxi @₹${minPrice} | No Return Fare`,
    description: _seoDb?.metaDescription || `Book ${from.name} to ${to.name} one way cab (${avgDistance} km, ${avgTime}). Starting @₹${minPrice}. No return charges. Professional drivers. Instant booking. 24/7 support.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `${from.name} to ${to.name} cab`,
      `${from.name} to ${to.name} taxi`,
      `one way cab ${from.name} to ${to.name}`,
      `${from.name} ${to.name} one way taxi`,
      `cab from ${from.name} to ${to.name}`,
      `taxi service ${from.name} to ${to.name}`,
      `${from.name} to ${to.name} car rental`,
      `drop taxi ${from.name} to ${to.name}`,
    ],
    openGraph: {
      title: `${from.name} to ${to.name} Cab - One Way @₹${minPrice}`,
      description: `Travel ${avgDistance} km from ${from.name} to ${to.name}. Starting @₹${minPrice}. No return charges.`,
      url: `https://transrentals.in/one-way-cab/${params.route}`,
      type: 'website',
      images: [
        {
          url: '/images/og/one-way-cab.jpg',
          width: 1200,
          height: 630,
          alt: `${from.name} to ${to.name} Cab Service`,
        },
      ],
    },
    alternates: {
      canonical: `https://transrentals.in/one-way-cab/${params.route}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function OneWayCabRoutePage({ params }: PageProps) {
  const parsed = parseRouteSlug(params.route);

  // Invalid route format (not "city-to-city") — check coming soon before redirecting
  if (!parsed) {
    if (COMING_SOON_SLUGS.has(params.route)) {
      return <OneWayCabComingSoon label={routeSlugToLabel(params.route)} slug={params.route} />;
    }
    notFound();
  }

  const routeData = await getRouteData(parsed.from, parsed.to);

  // Route not found in database — check coming soon before redirecting
  if (!routeData) {
    if (COMING_SOON_SLUGS.has(params.route)) {
      return <OneWayCabComingSoon label={routeSlugToLabel(params.route)} slug={params.route} />;
    }
    notFound();
  }

  const { from, to, packages } = routeData;

  // Get similar routes
  const [similarFrom, similarTo] = await Promise.all([
    getSimilarRoutesFrom(from.id, to.id),
    getSimilarRoutesTo(to.id, from.id),
  ]);

  // Calculate route statistics
  const minPrice = Math.min(...packages.map(p => p.basePrice));
  const maxPrice = Math.max(...packages.map(p => p.basePrice));
  const avgDistance = packages[0]?.estimatedKm || 0;
  const avgTime = packages[0]?.estimatedDuration || '';
  const avgToll = packages[0]?.tollsEstimate || 0;

  // Get region names (State/UT)
  const fromRegion = getRegionName(from);
  const toRegion = getRegionName(to);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/one-way-cab" className="hover:text-primary">One Way Cab</a>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{from.name}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{to.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section with Booking Form & Vehicle Selection */}
      <OneWayRouteBookingHero
        fromCity={from.name}
        fromSlug={from.slug}
        fromRegion={fromRegion}
        toCity={to.name}
        toSlug={to.slug}
        toRegion={toRegion}
        distance={avgDistance}
        estimatedTime={avgTime}
        minPrice={minPrice}
      />

      {/* Route Overview */}
      <RouteOverview
        fromCity={from.name}
        fromState={fromRegion}
        toCity={to.name}
        toState={toRegion}
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
        routeSlug={params.route}
      />

      {/* Popular Stops */}
      <PopularStops
        fromCity={from.name}
        toCity={to.name}
        distance={avgDistance}
      />

      {/* Why Book This Route */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Book {from.name} to {to.name} One Way Cab?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎯', title: 'No Return Charges', desc: 'Pay only for one-way journey' },
              { icon: '💰', title: 'Best Price', desc: `Starting @₹${minPrice}` },
              { icon: '👨‍✈️', title: 'Professional Drivers', desc: 'Experienced route drivers' },
              { icon: '📱', title: 'Instant Booking', desc: 'Book in 2 minutes' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
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

      {/* Similar Routes */}
      <SimilarRoutes
        fromCity={from.name}
        fromSlug={from.slug}
        toCity={to.name}
        toSlug={to.slug}
        similarFrom={similarFrom}
        similarTo={similarTo}
      />

      {/* Return Journey Option */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container-custom max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need a Return Journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Book {to.name} to {from.name} cab for your return trip
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`/one-way-cab/${to.slug}-to-${from.slug}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              🔄 Book Return Journey
            </a>
            <a
              href={`/outstation-cab/${from.slug}-${to.slug}-roundtrip`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition border-2 border-blue-200"
            >
              🔁 Book Round Trip Package
            </a>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <RouteReviews
        fromCity={from.name}
        toCity={to.name}
        routeSlug={params.route}
      />

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
            serviceType: 'One Way Cab Service',
            name: `One Way Cab from ${from.name} to ${to.name}`,
            description: `Book one way cab from ${from.name} to ${to.name}. ${avgDistance}km journey starting from ₹${minPrice}. No return charges. Professional drivers, AC cars.`,
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
            areaServed: [
              {
                '@type': 'City',
                name: from.name,
              },
              {
                '@type': 'City',
                name: to.name,
              },
            ],
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: minPrice.toString(),
              highPrice: maxPrice.toString(),
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `https://transrentals.in/one-way-cab/${params.route}`,
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
                name: 'One Way Cab',
                item: 'https://transrentals.in/one-way-cab',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${from.name} to ${to.name}`,
                item: `https://transrentals.in/one-way-cab/${params.route}`,
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
                name: `How much does a cab from ${from.name} to ${to.name} cost?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `A one-way cab from ${from.name} to ${to.name} starts from ₹${minPrice}. The price varies based on vehicle type (sedan, SUV, etc.). All prices include fuel, driver charges, toll (₹${avgToll || 'applicable'}), and taxes. No hidden charges.`,
                },
              },
              {
                '@type': 'Question',
                name: `What is the distance from ${from.name} to ${to.name}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `The distance from ${from.name} to ${to.name} is approximately ${avgDistance} km. The journey takes around ${avgTime} depending on traffic and route conditions.`,
                },
              },
              {
                '@type': 'Question',
                name: 'Is this a one-way or round trip service?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `This is a ONE-WAY service. You pay only for ${from.name} to ${to.name} journey. No return charges. If you need round trip, we also offer ${from.name}-${to.name} round trip packages at discounted rates.`,
                },
              },
              {
                '@type': 'Question',
                name: `What is included in the ${from.name} to ${to.name} cab fare?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `The fare includes: (1) Base fare for ${avgDistance} km journey, (2) Complete fuel charges, (3) Driver charges and allowance, (4) Toll and parking charges (₹${avgToll || 'as applicable'}), (5) State permits and taxes, (6) GST 5%. There are NO hidden charges.`,
                },
              },
              {
                '@type': 'Question',
                name: `How do I book a cab from ${from.name} to ${to.name}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Booking is simple: (1) Select your pickup date and time above, (2) Choose your vehicle type, (3) Enter passenger details, (4) Make payment. You will receive instant confirmation with driver details via SMS and email.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I change my pickup time after booking?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, you can change pickup time up to 6 hours before journey. Contact our support team or use the "Modify Booking" option in your confirmation email. No charges for time changes.',
                },
              },
              {
                '@type': 'Question',
                name: `What if I want to make stops during ${from.name} to ${to.name} journey?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'You can make stops for refreshments, meals, or sightseeing. Inform your driver in advance. Most stops (15-30 minutes) are complimentary. Extended stops may incur minimal waiting charges.',
                },
              },
            ],
          }),
        }}
      />
    </>
  );
}
