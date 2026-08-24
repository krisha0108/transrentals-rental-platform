import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { ALL_CITIES, getCityBySlug } from '@/data/indian-cities';

interface NearbyLocationsProps {
  locationSlug?: string;
  service?: string;
}

// Get nearby cities based on state and tier
function getNearbyCities(citySlug: string, limit: number = 8): { name: string; slug: string; state: string }[] {
  const currentCity = getCityBySlug(citySlug);
  if (!currentCity) return [];

  // First, get cities from the same state
  const sameSateCities = ALL_CITIES.filter(
    (city) => city.stateCode === currentCity.stateCode && city.slug !== citySlug
  );

  // Sort by priority (higher first) and tier (lower tier first)
  sameSateCities.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.priority - a.priority;
  });

  // If we have enough from same state, return those
  if (sameSateCities.length >= limit) {
    return sameSateCities.slice(0, limit).map((city) => ({
      name: city.name,
      slug: city.slug,
      state: city.state,
    }));
  }

  // Otherwise, add nearby major cities from neighboring states
  const neighboringStates: Record<string, string[]> = {
    GJ: ['MH', 'RJ', 'MP'], // Gujarat neighbors
    MH: ['GJ', 'KA', 'TN', 'MP', 'GJ'], // Maharashtra neighbors
    KA: ['MH', 'TN', 'KL', 'AP', 'TS'], // Karnataka neighbors
    TN: ['KA', 'KL', 'AP'], // Tamil Nadu neighbors
    DL: ['HR', 'UP', 'RJ'], // Delhi neighbors
    UP: ['DL', 'HR', 'RJ', 'MP', 'BR'], // UP neighbors
    RJ: ['DL', 'HR', 'UP', 'MP', 'GJ'], // Rajasthan neighbors
    TS: ['KA', 'MH', 'AP'], // Telangana neighbors
    AP: ['TN', 'KA', 'TS'], // Andhra neighbors
    WB: ['OR', 'JH', 'BR'], // West Bengal neighbors
    KL: ['TN', 'KA'], // Kerala neighbors
    HR: ['DL', 'PB', 'UP', 'RJ'], // Haryana neighbors
    PB: ['HR', 'HP', 'JK'], // Punjab neighbors
  };

  const neighborCodes = neighboringStates[currentCity.stateCode] || [];
  const neighborCities = ALL_CITIES.filter(
    (city) =>
      neighborCodes.includes(city.stateCode) &&
      city.slug !== citySlug &&
      city.tier <= 2 // Only include tier 1 and 2 cities from other states
  );

  neighborCities.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.priority - a.priority;
  });

  const combined = [
    ...sameSateCities.map((city) => ({
      name: city.name,
      slug: city.slug,
      state: city.state,
    })),
    ...neighborCities.slice(0, limit - sameSateCities.length).map((city) => ({
      name: city.name,
      slug: city.slug,
      state: city.state,
    })),
  ];

  return combined.slice(0, limit);
}

export function NearbyLocations({ locationSlug, service }: NearbyLocationsProps) {
  const nearbyCities = locationSlug ? getNearbyCities(locationSlug) : [];

  if (nearbyCities.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-white overflow-hidden">
      {/* City-skyline banner */}
      <div
        className="relative bg-no-repeat bg-top bg-cover pt-14 md:pt-20 pb-40 md:pb-52"
        style={{ backgroundImage: "url('/images/sections/nearby-locations-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white" />
        <div className="container-custom relative text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <MapPin className="w-4 h-4" />
            Explore More Locations
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Nearby Locations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Expand your travel options with our services in these nearby cities
          </p>
        </div>
      </div>

      {/* City cards — pulled up to overlap the banner fade */}
      <div className="container-custom -mt-28 md:-mt-36 relative pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {nearbyCities.map((city) => (
            <Link
              key={city.slug}
              href={service ? `/${service}/${city.slug}` : `/${city.slug}`}
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                    <MapPin className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {city.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{city.state}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {/* View All Cities Link */}
        {service && (
          <div className="text-center mt-8">
            <Link
              href={`/${service}`}
              className="inline-flex items-center gap-2 px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-50 rounded-xl transition-colors"
            >
              View All Locations
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
