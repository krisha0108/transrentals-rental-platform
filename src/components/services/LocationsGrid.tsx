'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { ALL_CITIES, City } from '@/data/indian-cities';
import { isHubBasedService, getServiceConfig } from '@/data/service-config';
import { getCitiesWithSelfDrive, getCitiesWithBikeRental } from '@/data/rental-hubs';

interface LocationsGridProps {
  service: string;
  title?: string;
  showAllCities?: boolean;
}

// Group cities by state
function groupCitiesByState(cities: City[]): Record<string, City[]> {
  return cities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);
}

// Get popular cities (tier 1 and high priority tier 2)
function getPopularCities(): City[] {
  return ALL_CITIES.filter(c => c.tier === 1 || (c.tier === 2 && c.priority >= 8)).slice(0, 12);
}

export function LocationsGrid({ service, title, showAllCities = false }: LocationsGridProps) {
  const [showAll, setShowAll] = useState(showAllCities);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStates, setExpandedStates] = useState<string[]>([]);

  const serviceConfig = getServiceConfig(service);
  const isHubBased = isHubBasedService(service);

  // For hub-based services, only show cities with hubs
  let availableCities: City[] = ALL_CITIES;

  if (isHubBased) {
    const hubType = service.includes('bike') || service.includes('activa') || service.includes('enfield')
      ? 'bike'
      : 'self-drive';
    const citiesWithHubs = hubType === 'bike' ? getCitiesWithBikeRental() : getCitiesWithSelfDrive();
    availableCities = ALL_CITIES.filter(c => citiesWithHubs.includes(c.slug));
  }

  // Filter by search
  const filteredCities = searchQuery
    ? availableCities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCities;

  const popularCities = getPopularCities().filter(c =>
    availableCities.some(ac => ac.slug === c.slug)
  );

  const citiesByState = groupCitiesByState(filteredCities);
  const states = Object.keys(citiesByState).sort();

  const toggleState = (state: string) => {
    setExpandedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const displayTitle = title || (isHubBased
    ? `${serviceConfig?.name || 'Service'} Available Locations`
    : `${serviceConfig?.name || 'Service'} in ${availableCities.length}+ Cities`
  );

  return (
    <section id="locations" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{displayTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isHubBased
              ? 'Pick up and drop at convenient hub locations across India'
              : 'Available in all major cities with verified local vendors'
            }
          </p>
        </div>

        {/* Search Bar */}
        {showAll && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search city or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Popular Cities */}
        {!showAll && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/${service}/${city.slug}`}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition group text-center"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
                  <MapPin className="w-5 h-5 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  {city.name}
                </h3>
                <p className="text-xs text-gray-500">{city.state}</p>
                {serviceConfig?.startingPrice && (
                  <p className="text-xs text-blue-600 mt-1">
                    From ₹{serviceConfig.startingPrice}{serviceConfig.priceUnit}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* All Cities by State */}
        {showAll && (
          <div className="space-y-4">
            {states.map((state) => (
              <div key={state} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleState(state)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{state}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {citiesByState[state].length} cities
                    </span>
                  </div>
                  {expandedStates.includes(state) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedStates.includes(state) && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {citiesByState[state]
                        .sort((a, b) => b.priority - a.priority)
                        .map((city) => (
                          <Link
                            key={city.slug}
                            href={`/${service}/${city.slug}`}
                            className="px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {city.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toggle Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                View All {availableCities.length}+ Cities
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{availableCities.length}+</p>
            <p className="text-sm text-gray-600">Cities</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{states.length}</p>
            <p className="text-sm text-gray-600">States</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">1000+</p>
            <p className="text-sm text-gray-600">Vendors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">24/7</p>
            <p className="text-sm text-gray-600">Support</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Simple grid for backwards compatibility
export function SimpleLocationsGrid({ service }: { service: string }) {
  const popularCities = getPopularCities().slice(0, 12);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Locations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {popularCities.map((city) => (
            <Link
              key={city.slug}
              href={`/${service}/${city.slug}`}
              className="bg-gray-50 rounded-lg p-6 text-center hover:bg-blue-600 hover:text-white transition-all"
            >
              <h3 className="font-semibold">📍 {city.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
