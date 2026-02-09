import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { RouteOverview } from '@/components/routes/RouteOverview';
import { RouteFAQs } from '@/components/routes/RouteFAQs';
import { RouteNotAvailable } from '@/components/routes/RouteNotAvailable';
import { RoundTripRouteBookingHeroWithForm } from '@/components/round-trip/RoundTripRouteBookingHeroWithForm';

interface PageProps {
  params: {
    route: string;
  };
}

// Helper: Generate SEO-friendly slug
function generateSEOSlug(fromLocation: any, toLocation: any): string {
  return `${fromLocation.slug}-to-${toLocation.slug}-round-trip`;
}

// Helper: Parse route slug back to location names
function parseRouteSlug(slug: string): { from: string; to: string } | null {
  // Format: "delhi-to-agra-round-trip" or "round-trip-delhi-to-agra"
  const roundTripPattern1 = /^(.+?)-to-(.+?)-round-trip$/;
  const roundTripPattern2 = /^round-trip-(.+?)-to-(.+?)$/;

  let match = slug.match(roundTripPattern1);
  if (!match) {
    match = slug.match(roundTripPattern2);
  }

  if (match) {
    return {
      from: match[1],
      to: match[2],
    };
  }

  return null;
}

// Generate static params for ALL round trip routes at build time
export async function generateStaticParams() {
  try {
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[round-trip] Skipping database calls during build');
      return [];
    }

    // Fetch ALL active city-to-city routes (EXCLUDE airport routes)
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        // Only city-to-city routes, NO airport routes
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
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
    });

    const routeParams = routes.map((route) => {
      const fromLoc = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLoc = route.locations_chauffeur_route_packages_toLocationIdTolocations;
      const seoSlug = generateSEOSlug(fromLoc, toLoc);

      return { route: seoSlug };
    });

    console.log(`[round-trip] Generating ${routeParams.length} city-to-city round trip pages (airports excluded)`);
    return routeParams;
  } catch (error) {
    console.error('[round-trip] Error fetching routes:', error);
    return [];
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseRouteSlug(params.route);

  if (!parsed) {
    return {
      title: 'Round Trip Cab | TransRentals',
      description: 'Book round trip cabs for outstation travel',
    };
  }

  try {
    // Fetch locations from database
    const [fromLocation, toLocation] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: parsed.from, isActive: true },
        select: { id: true, name: true, slug: true, type: true },
      }),
      prisma.locations.findFirst({
        where: { slug: parsed.to, isActive: true },
        select: { id: true, name: true, slug: true, type: true },
      }),
    ]);

    if (!fromLocation || !toLocation) {
      return {
        title: 'Route Not Found | TransRentals',
      };
    }

    // Fetch route package for distance info
    const routePackage = await prisma.chauffeur_route_packages.findFirst({
      where: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        isActive: true,
      },
      select: {
        estimatedKm: true,
        estimatedDuration: true,
        basePrice: true,
        returnMultiplier: true,
      },
    });

    const fromCity = fromLocation.name;
    const toCity = toLocation.name;
    const distance = routePackage?.estimatedKm || 0;
    const roundTripPrice = routePackage ? Math.round(routePackage.basePrice * routePackage.returnMultiplier) : 0;

    return {
      title: `${fromCity} to ${toCity} Round Trip Cab | ${distance}km @₹${roundTripPrice} | Book Return Trip`,
      description: `Book round trip cab from ${fromCity} to ${toCity} and back. ${distance}km round trip @₹${roundTripPrice}. AC sedan, SUV, Innova available. Professional driver, all charges included.`,
      keywords: [
        `${fromCity} to ${toCity} round trip cab`,
        `${toCity} to ${fromCity} round trip`,
        `round trip taxi ${fromCity} ${toCity}`,
        `${fromCity} ${toCity} return cab`,
        `outstation round trip ${fromCity}`,
        `${fromCity} to ${toCity} cab return`,
        `round trip car rental ${fromCity}`,
        `${fromCity} to ${toCity} round trip taxi fare`,
        `book return cab ${fromCity} to ${toCity}`,
        `${fromCity} ${toCity} round trip package`,
        `round trip cab booking ${fromCity}`,
        `${toCity} round trip from ${fromCity}`,
        `${fromCity} to ${toCity} and back cab`,
        `return trip taxi ${fromCity} ${toCity}`,
      ],
      openGraph: {
        title: `${fromCity} to ${toCity} Round Trip Cab - Book Return Trip @₹${roundTripPrice}`,
        description: `Book round trip cab from ${fromCity} to ${toCity} and back. ${distance}km AC cabs with professional driver.`,
        url: `https://transrentals.in/round-trip/${params.route}`,
        type: 'website',
        images: [
          {
            url: 'https://transrentals.in/images/og-round-trip.jpg',
            width: 1200,
            height: 630,
            alt: `${fromCity} to ${toCity} Round Trip Cab Service`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${fromCity} to ${toCity} Round Trip Cab @₹${roundTripPrice}`,
        description: `Book return trip cab from ${fromCity} to ${toCity}. ${distance}km round trip with AC cars.`,
      },
      alternates: {
        canonical: `https://transrentals.in/round-trip/${params.route}`,
      },
    };
  } catch (error) {
    console.error('[round-trip] Metadata generation error:', error);
    return {
      title: 'Round Trip Cab | TransRentals',
    };
  }
}

// Main page component
export default async function RoundTripRoutePage({ params }: PageProps) {
  const parsed = parseRouteSlug(params.route);

  if (!parsed) {
    return <RouteNotAvailable />;
  }

  try {
    // Fetch locations
    const [fromLocation, toLocation] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: parsed.from, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          parentId: true,
          locations: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      prisma.locations.findFirst({
        where: { slug: parsed.to, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          parentId: true,
          locations: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
    ]);

    if (!fromLocation || !toLocation) {
      notFound();
    }

    // Fetch route package
    const routePackage = await prisma.chauffeur_route_packages.findFirst({
      where: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        isActive: true,
      },
      select: {
        estimatedKm: true,
        estimatedDuration: true,
        routeDescription: true,
        basePrice: true,
        returnMultiplier: true,
        tollsEstimate: true,
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            description: true,
          },
        },
      },
    });

    if (!routePackage) {
      return <RouteNotAvailable />;
    }

    // Calculate round trip pricing
    const roundTripPrice = Math.round(routePackage.basePrice * routePackage.returnMultiplier);
    const perKmRate = Math.round(roundTripPrice / (routePackage.estimatedKm * 2));

    // Get parent location names for breadcrumb/location info
    const fromState = fromLocation.locations?.name || '';
    const toState = toLocation.locations?.name || '';

    return (
      <>
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/round-trip" className="hover:text-primary">Round Trip Cabs</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">
                {fromLocation.name} to {toLocation.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Booking Hero with Form */}
        <RoundTripRouteBookingHeroWithForm
          fromCity={fromLocation.name}
          fromSlug={fromLocation.slug}
          fromRegion={fromState}
          toCity={toLocation.name}
          toSlug={toLocation.slug}
          toRegion={toState}
          distance={routePackage.estimatedKm}
          estimatedTime={routePackage.estimatedDuration}
          minPrice={roundTripPrice}
        />

        {/* Route Overview */}
        <RouteOverview
          fromCity={fromLocation.name}
          fromState={fromState}
          toCity={toLocation.name}
          toState={toState}
          distance={routePackage.estimatedKm * 2} // Round trip distance
          estimatedTime={routePackage.estimatedDuration}
          tollCharges={routePackage.tollsEstimate}
          routeDescription={routePackage.routeDescription}
          routeType="round-trip"
        />

        {/* Why Round Trip */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              Why Book Round Trip Cab from {fromLocation.name} to {toLocation.name}?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '💰',
                  title: 'Cost Effective',
                  desc: 'Round trip is 20-30% cheaper than booking two one-way trips',
                },
                {
                  icon: '🔄',
                  title: 'Same Driver',
                  desc: 'Familiar driver for both ways, no coordination hassle',
                },
                {
                  icon: '⏰',
                  title: 'Flexible Return',
                  desc: 'Return anytime within package duration, no rush',
                },
                {
                  icon: '🎯',
                  title: 'No Return Search',
                  desc: 'Cab waits for you, no last-minute booking stress',
                },
                {
                  icon: '🛡️',
                  title: 'Peace of Mind',
                  desc: 'Confirmed return journey, travel worry-free',
                },
                {
                  icon: '🚗',
                  title: 'Better Service',
                  desc: 'Driver ensures best experience for return business',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Package Details */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              Round Trip Package Details
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* What's Included */}
              <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-xl border-2 border-emerald-200">
                <h3 className="text-2xl font-bold mb-6 text-emerald-700">
                  ✓ What's Included
                </h3>
                <ul className="space-y-4">
                  {[
                    'Round trip travel ({fromCity} → {toCity} → {fromCity})',
                    'Professional & experienced driver',
                    'Fuel charges for entire trip',
                    'Driver allowance & accommodation',
                    'Toll charges & parking fees',
                    'State permits & taxes',
                    'Full vehicle insurance',
                    '24/7 customer support',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-emerald-600 font-bold text-xl mt-0.5">✓</span>
                      <span className="text-gray-700">
                        {item.replace('{fromCity}', fromLocation.name).replace('{toCity}', toLocation.name)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trip Guidelines */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border-2 border-blue-200">
                <h3 className="text-2xl font-bold mb-6 text-blue-700">
                  📋 Trip Guidelines
                </h3>
                <ul className="space-y-4">
                  {[
                    `Total distance: ${routePackage.estimatedKm * 2}km (both ways)`,
                    `One way: ${routePackage.estimatedKm}km approximately`,
                    'Minimum 250km/day usage applies',
                    'Extra km charged at ₹{perKm}/km',
                    'Driver stays at your expense',
                    'Night charges if applicable',
                    'Flexible stops allowed en route',
                    'Clean & sanitized AC vehicles',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl mt-0.5">•</span>
                      <span className="text-gray-700">
                        {item.replace('{perKm}', perKmRate.toString())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <RouteFAQs
          fromCity={fromLocation.name}
          toCity={toLocation.name}
          distance={routePackage.estimatedKm}
          routeType="round-trip"
        />

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: `Round Trip Cab from ${fromLocation.name} to ${toLocation.name}`,
              description: `Book round trip cab service from ${fromLocation.name} to ${toLocation.name} and back. ${routePackage.estimatedKm * 2}km round trip with professional driver.`,
              offers: {
                '@type': 'Offer',
                price: roundTripPrice,
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: `https://transrentals.in/round-trip/${params.route}`,
              },
              brand: {
                '@type': 'Brand',
                name: 'TransRentals',
              },
              provider: {
                '@type': 'Organization',
                name: 'TransRentals',
                url: 'https://transrentals.in',
              },
            }),
          }}
        />
      </>
    );
  } catch (error) {
    console.error('[round-trip] Page error:', error);
    return <RouteNotAvailable />;
  }
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Allow dynamic route generation for new routes
export const dynamicParams = true;
