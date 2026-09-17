import React from 'react';
import Link from 'next/link';
import { Navigation, ArrowRight, MapPin } from 'lucide-react';
import { getPopularRoutes, getDestinationIcon } from '@/data/popular-routes';
import { prisma } from '@/lib/db/prisma';

interface PopularRoutesProps {
  location?: string;
  locationSlug?: string;
  serviceSlug?: string;
}

// Only these services have relevant chauffeur/outstation route data in DB
const CHAUFFEUR_SERVICES = new Set([
  'chauffeur', 'chauffeur-service', 'airport-transfer',
  'outstation-cab', 'outstation-car-rental', 'one-way-cab',
]);

export async function PopularRoutes({ location, locationSlug, serviceSlug = 'bike-on-rent' }: PopularRoutesProps) {
  // Only query chauffeur_route_packages for relevant services
  const dbRoutes = locationSlug && CHAUFFEUR_SERVICES.has(serviceSlug) ? await prisma.chauffeur_route_packages.findMany({
    where: {
      isActive: true,
      isPopular: true,
      locations_chauffeur_route_packages_fromLocationIdTolocations: { slug: locationSlug },
    },
    select: {
      id: true,
      estimatedKm: true,
      basePrice: true,
      returnMultiplier: true,
      locations_chauffeur_route_packages_toLocationIdTolocations: {
        select: { name: true, slug: true, description: true },
      },
    },
    orderBy: [{ estimatedKm: 'asc' }],
    take: 6,
  }) : [];

  // Fall back to static data if no DB routes
  const staticRoutes = locationSlug ? getPopularRoutes(locationSlug) : [];

  if (dbRoutes.length === 0 && staticRoutes.length === 0) return null;

  const useDb = dbRoutes.length > 0;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-4">
            <Navigation className="w-4 h-4" />
            Popular Destinations
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Popular Routes from {location}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore these amazing destinations from {location}. Book your ride and start your adventure!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useDb ? dbRoutes.map((rp) => {
            const dest = rp.locations_chauffeur_route_packages_toLocationIdTolocations;
            const roundTrip = Math.round(rp.basePrice * rp.returnMultiplier);
            return (
              <Link
                key={rp.id}
                href={`/${serviceSlug}/${dest.slug}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <h3 className="text-[15px] leading-snug font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {dest.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {dest.description || `Popular outstation destination from ${location}`}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>{rp.estimatedKm} km</span>
                    </div>
                    <span className="text-green-600 font-medium">₹{roundTrip.toLocaleString('en-IN')}+</span>
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{location} → {dest.name}</span>
                  <span className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Book Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          }) : staticRoutes.slice(0, 6).map((route, index) => (
            <Link
              key={index}
              href={`/${serviceSlug}/${route.slug}`}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
            >
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getDestinationIcon(route.type)}</span>
                    <div>
                      <h3 className="text-[15px] leading-snug font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {route.name}
                      </h3>
                      <span className="inline-block text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize mt-1">
                        {route.type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{route.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {route.distance && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>{route.distance}</span>
                    </div>
                  )}
                  <span className="text-green-600 font-medium">{route.vehicles}</span>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{location} → {route.name}</span>
                <span className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                  Book Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${serviceSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            View All Locations
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
