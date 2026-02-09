import { prisma } from '@/lib/db/prisma';
import { ArrowLeftRight, MapPin, Clock, IndianRupee } from 'lucide-react';
import Link from 'next/link';

// Helper: Generate SEO-friendly slug
function generateSEOSlug(fromLocation: any, toLocation: any): string {
  return `${fromLocation.slug}-to-${toLocation.slug}-round-trip`;
}

export async function RoundTripRoutesGrid() {
  try {
    // Fetch popular round trip routes from database
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        isPopular: true, // Show only popular routes on main page
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
        chauffeur_vehicle_categories: {
          select: {
            name: true,
            seatingCapacity: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
      take: 12, // Show top 12 popular routes
      distinct: ['fromLocationId', 'toLocationId'],
    });

    if (routes.length === 0) {
      return (
        <section className="py-16 bg-white">
          <div className="container-custom max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              Popular Round Trip Routes
            </h2>
            <div className="text-center text-gray-600">
              <p>Round trip routes will be available soon.</p>
              <p className="mt-2">
                <a href="/contact" className="text-primary hover:underline">
                  Contact us
                </a>{' '}
                for custom round trip packages.
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-16 bg-white">
        <div className="container-custom max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Popular Round Trip Routes
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Book your round trip cab and save 20-30% compared to one-way trips
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => {
              const fromLoc = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
              const toLoc = route.locations_chauffeur_route_packages_toLocationIdTolocations;
              const routeSlug = generateSEOSlug(fromLoc, toLoc);
              const roundTripPrice = Math.round(route.basePrice * route.returnMultiplier);
              const roundTripDistance = route.estimatedKm * 2;

              return (
                <Link
                  key={route.id}
                  href={`/round-trip/${routeSlug}`}
                  className="group bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-100 rounded-xl p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Route Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-purple-600">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium">Round Trip</span>
                    </div>
                    <ArrowLeftRight className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Cities */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        A
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{fromLoc.name}</p>
                        <p className="text-xs text-gray-500">Starting Point</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        B
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{toLoc.name}</p>
                        <p className="text-xs text-gray-500">Destination & Return</p>
                      </div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/60 rounded-lg p-3 text-center">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                      <p className="text-xs text-gray-600 mb-1">Distance</p>
                      <p className="font-bold text-gray-900">{roundTripDistance}km</p>
                    </div>
                    {route.estimatedDuration && (
                      <div className="bg-white/60 rounded-lg p-3 text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                        <p className="text-xs text-gray-600 mb-1">Duration</p>
                        <p className="font-bold text-gray-900">{route.estimatedDuration}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 text-white text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <IndianRupee className="w-5 h-5" />
                      <p className="text-3xl font-bold">{roundTripPrice.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-white/90">Round Trip Fare</p>
                    <p className="text-xs text-white/70 mt-1">
                      Starting price • {route.chauffeur_vehicle_categories.name}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                      View Details & Book
                      <ArrowLeftRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Link */}
          <div className="text-center mt-10">
            <p className="text-gray-600">
              Can't find your route?{' '}
              <a href="/contact" className="text-purple-600 font-semibold hover:underline">
                Contact us
              </a>{' '}
              for custom round trip packages
            </p>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('[RoundTripRoutesGrid] Error fetching routes:', error);
    return (
      <section className="py-16 bg-white">
        <div className="container-custom max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Popular Round Trip Routes
          </h2>
          <div className="text-center text-gray-600">
            <p>Unable to load routes at the moment.</p>
          </div>
        </div>
      </section>
    );
  }
}
