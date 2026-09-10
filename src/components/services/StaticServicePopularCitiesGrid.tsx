'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp, Search, ArrowRight, Building2, Users, Headphones } from 'lucide-react';
import { ALL_CITIES, City } from '@/data/indian-cities';

interface StaticServicePopularCitiesGridProps {
  serviceSlug: string;
  title: string;
  startingPrice?: string;
  priceUnit?: string;
}

function groupCitiesByState(cities: City[]): Record<string, City[]> {
  return cities.reduce((acc, city) => {
    if (!acc[city.state]) acc[city.state] = [];
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);
}

function getFeaturedCities(): City[] {
  return ALL_CITIES.filter((c) => c.tier === 1 || (c.tier === 2 && c.priority >= 8)).slice(0, 12);
}

/* Wahi city-skyline banner design jo Car Rental / Transporter ke
   "Available Cities" section me hai — bas locations DB se nahi, static
   ALL_CITIES list se aati hain (in services ke liye DB me service_locations
   registered nahi hai). */
export function StaticServicePopularCitiesGrid({
  serviceSlug,
  title,
  startingPrice,
  priceUnit = '/day',
}: StaticServicePopularCitiesGridProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStates, setExpandedStates] = useState<string[]>([]);

  const filteredCities = searchQuery
    ? ALL_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_CITIES;

  const visibleCities = getFeaturedCities();
  const citiesByState = groupCitiesByState(filteredCities);
  const states = Object.keys(citiesByState).sort();

  const toggleState = (state: string) => {
    setExpandedStates((prev) => (prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]));
  };

  return (
    <section id="locations" className="relative bg-white overflow-hidden">
      {/* City-skyline banner — same motif as Car Rental / Transporter "Available Cities" */}
      <div
        className="relative bg-no-repeat bg-top bg-cover pt-14 md:pt-20 pb-40 md:pb-52"
        style={{ backgroundImage: "url('/images/sections/nearby-locations-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white" />
        <div className="container-custom relative text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <MapPin className="w-4 h-4" />
            {ALL_CITIES.length}+ Cities
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Verified local vendors, transparent pricing, and instant quotes across {ALL_CITIES.length} cities in India.
          </p>
        </div>
      </div>

      {/* City cards — pulled up to overlap the banner fade */}
      <div className="container-custom -mt-28 md:-mt-36 relative pb-16">
        {/* Search */}
        {showAll && (
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search city or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Available Cities */}
        {!showAll && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleCities.map((city) => (
              <Link
                key={city.slug}
                href={`/${serviceSlug}/${city.slug}`}
                className="group bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                      <MapPin className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                        {city.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {city.state}
                        {startingPrice && (
                          <span className="text-emerald-600 font-medium"> · From {startingPrice}{priceUnit}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All Cities by State */}
        {showAll && (
          <div className="max-w-3xl mx-auto space-y-3">
            {states.map((state) => (
              <div key={state} className="bg-white border border-gray-100 shadow-md rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleState(state)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-gray-900">{state}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {citiesByState[state].length} {citiesByState[state].length === 1 ? 'city' : 'cities'}
                    </span>
                  </div>
                  {expandedStates.includes(state) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {expandedStates.includes(state) && (
                  <div className="px-5 pb-4 pt-1 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 pt-3">
                      {citiesByState[state]
                        .sort((a, b) => b.priority - a.priority)
                        .map((city) => (
                          <Link
                            key={city.slug}
                            href={`/${serviceSlug}/${city.slug}`}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span className="truncate">{city.name}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toggle Link */}
        {ALL_CITIES.length > 12 && (
          <div className="text-center mt-10 md:mt-12">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-50 rounded-xl transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  Show Less
                </>
              ) : (
                <>
                  View All {ALL_CITIES.length} Cities
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-14 md:mt-20 bg-white border border-gray-100 shadow-lg shadow-gray-100/80 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-gray-100 md:divide-y-0 md:divide-x">
            {[
              { icon: MapPin, value: `${ALL_CITIES.length}`, label: 'Cities' },
              { icon: Building2, value: `${states.length || Object.keys(groupCitiesByState(ALL_CITIES)).length}`, label: 'States' },
              { icon: Users, value: '1000+', label: 'Vendors' },
              { icon: Headphones, value: '24/7', label: 'Support' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group flex flex-col items-center text-center gap-2.5 py-7 px-3 hover:bg-emerald-50/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <stat.icon className="w-5.5 h-5.5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tabular-nums leading-none">{stat.value}</p>
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StaticServicePopularCitiesGrid;
