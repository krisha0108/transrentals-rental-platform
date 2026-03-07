import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { getAvailableLocationsForService } from '@/lib/services/service-availability';
import { getCityBySlug } from '@/data/indian-cities';

interface NearbyActiveCitiesProps {
  currentCitySlug: string;
  serviceSlug: string;
  serviceName: string;
  limit?: number;
}

// Neighboring states map for proximity sorting
const NEIGHBORING_STATES: Record<string, string[]> = {
  GJ: ['MH', 'RJ', 'MP'],
  MH: ['GJ', 'KA', 'TN', 'MP'],
  KA: ['MH', 'TN', 'KL', 'AP', 'TS'],
  TN: ['KA', 'KL', 'AP'],
  DL: ['HR', 'UP', 'RJ'],
  UP: ['DL', 'HR', 'RJ', 'MP', 'BR'],
  RJ: ['DL', 'HR', 'UP', 'MP', 'GJ'],
  TS: ['KA', 'MH', 'AP'],
  AP: ['TN', 'KA', 'TS'],
  WB: ['OR', 'JH', 'BR'],
  KL: ['TN', 'KA'],
  HR: ['DL', 'PB', 'UP', 'RJ'],
  PB: ['HR', 'HP', 'JK'],
};

export async function NearbyActiveCities({
  currentCitySlug,
  serviceSlug,
  serviceName,
  limit = 8,
}: NearbyActiveCitiesProps) {
  const currentCity = getCityBySlug(currentCitySlug);
  if (!currentCity) return null;

  // Fetch all DB-enabled locations for this service
  const activeLocs = await getAvailableLocationsForService(serviceSlug);
  if (activeLocs.length === 0) return null;

  const neighborCodes = NEIGHBORING_STATES[currentCity.stateCode] ?? [];

  // Enrich with city data and sort: same state > neighboring > others, then by tier
  const enriched = activeLocs
    .filter((loc) => loc.slug !== currentCitySlug)
    .map((loc) => {
      const cityData = getCityBySlug(loc.slug);
      return {
        name: loc.name,
        slug: loc.slug,
        stateCode: cityData?.stateCode ?? '',
        state: cityData?.state ?? '',
        tier: cityData?.tier ?? 5,
      };
    })
    .sort((a, b) => {
      const aScore =
        a.stateCode === currentCity.stateCode ? 0 : neighborCodes.includes(a.stateCode) ? 1 : 2;
      const bScore =
        b.stateCode === currentCity.stateCode ? 0 : neighborCodes.includes(b.stateCode) ? 1 : 2;
      if (aScore !== bScore) return aScore - bScore;
      return a.tier - b.tier;
    })
    .slice(0, limit);

  if (enriched.length === 0) return null;

  return (
    <section id="nearby-cities" className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full mb-4">
            <MapPin className="w-4 h-4" />
            Available Nearby
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Book {serviceName} in Nearby Cities
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our service is live in these nearby cities — book instantly with verified vendors!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {enriched.map((city) => (
            <Link
              key={city.slug}
              href={`/${serviceSlug}/${city.slug}`}
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200"
            >
              <div className="flex items-start justify-between mb-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {city.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{city.state}</p>
              <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Available Now
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href={`/${serviceSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition-colors"
          >
            View All Locations
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
