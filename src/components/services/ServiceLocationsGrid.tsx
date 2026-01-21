'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
  code?: string;
  image?: string | null;
  state?: string | null;
}

interface ServiceLocationsGridProps {
  serviceSlug: string;
  title?: string;
  showSearch?: boolean;
  startingPrice?: string;
  priceUnit?: string;
}

// Group locations by state
function groupLocationsByState(locations: Location[]): Record<string, Location[]> {
  return locations.reduce((acc, location) => {
    const state = location.state || 'Other';
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(location);
    return acc;
  }, {} as Record<string, Location[]>);
}

export function ServiceLocationsGrid({
  serviceSlug,
  title,
  showSearch = true,
  startingPrice,
  priceUnit = '/day',
}: ServiceLocationsGridProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStates, setExpandedStates] = useState<string[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${serviceSlug}/locations`);
        const data = await response.json();

        if (data.success && data.locations) {
          setLocations(data.locations);
        } else {
          setError(data.error || 'Failed to fetch locations');
        }
      } catch (err) {
        setError('Failed to fetch locations');
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [serviceSlug]);

  // Filter by search
  const filteredLocations = searchQuery
    ? locations.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.state && loc.state.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : locations;

  // Get popular locations (first 12)
  const popularLocations = filteredLocations.slice(0, 12);

  const locationsByState = groupLocationsByState(filteredLocations);
  const states = Object.keys(locationsByState).sort();

  const toggleState = (state: string) => {
    setExpandedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const displayTitle = title || `Available Locations`;

  if (loading) {
    return null; // Don't show loading state, just hide until loaded
  }

  if (error || locations.length === 0) {
    return null; // Don't show section if no locations
  }

  return (
    <section id="locations" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{displayTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Available in {locations.length} cities with verified local vendors
          </p>
        </div>

        {/* Search Bar */}
        {showSearch && showAll && (
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

        {/* Popular Locations */}
        {!showAll && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {popularLocations.map((location) => (
              <Link
                key={location.id}
                href={`/${serviceSlug}/${location.slug}`}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition group text-center"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
                  <MapPin className="w-5 h-5 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  {location.name}
                </h3>
                {location.state && (
                  <p className="text-xs text-gray-500">{location.state}</p>
                )}
                {startingPrice && (
                  <p className="text-xs text-blue-600 mt-1">
                    From {startingPrice}{priceUnit}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* All Locations by State */}
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
                      {locationsByState[state].length} cities
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
                      {locationsByState[state].map((location) => (
                        <Link
                          key={location.id}
                          href={`/${serviceSlug}/${location.slug}`}
                          className="px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {location.name}
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
        {locations.length > 12 && (
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
                  View All {locations.length} Cities
                </>
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{locations.length}</p>
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

export default ServiceLocationsGrid;
