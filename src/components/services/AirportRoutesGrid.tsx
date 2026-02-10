'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, ChevronDown, ChevronUp, Search, Plane } from 'lucide-react';

interface Route {
  fromLocation: {
    id: string;
    name: string;
    slug: string;
    code: string | null;
    isAirport: boolean;
  };
  toLocation: {
    id: string;
    name: string;
    slug: string;
    code: string | null;
    isAirport: boolean;
  };
  distance: number;
  estimatedTime: string | null;
  minPrice: number;
  isPopular: boolean;
  routeSlug: string;
  isAirportPickup: boolean;
}

interface AirportRoutesGridProps {
  title?: string;
  showSearch?: boolean;
}

// Group routes by airport
function groupRoutesByAirport(routes: Route[]): Record<string, Route[]> {
  return routes.reduce((acc, route) => {
    const airport = route.isAirportPickup ? route.fromLocation.name : route.toLocation.name;
    if (!acc[airport]) {
      acc[airport] = [];
    }
    acc[airport].push(route);
    return acc;
  }, {} as Record<string, Route[]>);
}

export function AirportRoutesGrid({
  title,
  showSearch = true,
}: AirportRoutesGridProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAirports, setExpandedAirports] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoading(true);
        const response = await fetch('/api/services/airport-transfer/routes');
        const data = await response.json();

        if (data.success && data.routes) {
          setRoutes(data.routes);
        } else {
          setError(data.error || 'Failed to fetch routes');
        }
      } catch (err) {
        setError('Failed to fetch routes');
        console.error('Error fetching routes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  // Filter by search
  const filteredRoutes = searchQuery
    ? routes.filter(
        (route) =>
          route.fromLocation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.toLocation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (route.fromLocation.code && route.fromLocation.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (route.toLocation.code && route.toLocation.code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : routes;

  // Get popular routes (first 12)
  const popularRoutes = filteredRoutes.filter((r) => r.isPopular).slice(0, 12);
  const displayRoutes = popularRoutes.length > 0 ? popularRoutes : filteredRoutes.slice(0, 12);

  const routesByAirport = groupRoutesByAirport(filteredRoutes);
  const airports = Object.keys(routesByAirport).sort();

  const toggleAirport = (airport: string) => {
    setExpandedAirports((prev) =>
      prev.includes(airport) ? prev.filter((a) => a !== airport) : [...prev, airport]
    );
  };

  const displayTitle = title || 'Available Airport Transfer Routes';

  if (loading) {
    return null;
  }

  if (error || routes.length === 0) {
    return null;
  }

  return (
    <section id="routes" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{displayTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {routes.length} airport transfer routes with fixed pricing
          </p>
        </div>

        {/* Search Bar */}
        {showSearch && showAll && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search airport or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Popular Routes Grid */}
        {!showAll && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayRoutes.map((route) => (
              <Link
                key={route.routeSlug}
                href={`/airport-transfer/${route.routeSlug}`}
                className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-400 transition-all"
              >
                {/* Route Type Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                    route.isAirportPickup
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {route.isAirportPickup ? (
                      <>
                        <Plane className="w-3 h-3" />
                        Airport Pickup
                      </>
                    ) : (
                      <>
                        <Plane className="w-3 h-3 rotate-45" />
                        Airport Drop
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">From</p>
                    <p className="text-lg font-bold text-gray-900">
                      {route.fromLocation.code || route.fromLocation.name}
                    </p>
                    {route.fromLocation.code && (
                      <p className="text-xs text-gray-500">{route.fromLocation.name}</p>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">To</p>
                    <p className="text-lg font-bold text-gray-900">
                      {route.toLocation.code || route.toLocation.name}
                    </p>
                    {route.toLocation.code && (
                      <p className="text-xs text-gray-500">{route.toLocation.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                  <div>
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-semibold text-gray-700">{route.distance} km</p>
                  </div>
                  {route.estimatedTime && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-semibold text-gray-700">{route.estimatedTime}</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Starting from</p>
                    <p className="text-lg font-bold text-blue-600">₹{route.minPrice}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  Book Now
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All Routes by Airport */}
        {showAll && (
          <div className="space-y-4">
            {airports.map((airport) => (
              <div key={airport} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleAirport(airport)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{airport}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {routesByAirport[airport].length} routes
                    </span>
                  </div>
                  {expandedAirports.includes(airport) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedAirports.includes(airport) && (
                  <div className="px-6 pb-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {routesByAirport[airport].map((route) => (
                        <Link
                          key={route.routeSlug}
                          href={`/airport-transfer/${route.routeSlug}`}
                          className="flex items-center justify-between px-4 py-3 text-sm border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              route.isAirportPickup ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {route.isAirportPickup ? 'Pickup' : 'Drop'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {route.isAirportPickup ? route.toLocation.name : route.fromLocation.name}
                            </span>
                          </div>
                          <span className="text-blue-600 font-semibold">₹{route.minPrice}</span>
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
        {routes.length > 12 && (
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
                  View All {routes.length} Routes
                </>
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{routes.length}</p>
            <p className="text-sm text-gray-600">Routes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{airports.length}</p>
            <p className="text-sm text-gray-600">Airports</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">45 Min</p>
            <p className="text-sm text-gray-600">Free Waiting</p>
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

export default AirportRoutesGrid;
