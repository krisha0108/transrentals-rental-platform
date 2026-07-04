'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Building2, ChevronRight, Search, X } from 'lucide-react';

interface City {
  name: string;
  slug: string;
  tier?: number;
  priority?: number;
}

interface StateWithCities {
  name: string;
  slug: string;
  code: string;
  cities: City[];
}

const TIER_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-gray-100 text-gray-500',
  5: 'bg-gray-100 text-gray-400',
};

export function LocationsClient({ statesWithCities }: { statesWithCities: StateWithCities[] }) {
  const [query, setQuery] = useState('');

  const totalCities = statesWithCities.reduce((sum, s) => sum + s.cities.length, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return statesWithCities;

    return statesWithCities
      .map((state) => {
        const stateMatch = state.name.toLowerCase().includes(q);
        const matchedCities = stateMatch
          ? state.cities
          : state.cities.filter((c) => c.name.toLowerCase().includes(q));
        return { ...state, cities: matchedCities, stateMatch };
      })
      .filter((s) => s.cities.length > 0);
  }, [query, statesWithCities]);

  const totalResults = filtered.reduce((sum, s) => sum + s.cities.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white">
        <div className="container-custom py-12 md:py-16">
          <div className="flex items-center gap-2 text-emerald-300 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Locations</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">All Locations</h1>
          <p className="text-emerald-200 text-base max-w-xl mb-7">
            Rental services across{' '}
            <span className="text-white font-bold">{totalCities}+ cities</span> in{' '}
            <span className="text-white font-bold">{statesWithCities.length} states</span>
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state or city... e.g. Gujarat, Surat"
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
          </div>

          {query && (
            <p className="text-emerald-300 text-xs mt-2 ml-1">
              {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-10 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-200 flex items-center justify-center">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-bold text-gray-700 mb-1">No results found</p>
            <p className="text-sm text-gray-400">Try a different city or state name</p>
            <button onClick={() => setQuery('')}
              className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((state) => (
            <div key={state.code} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* State Header */}
              <Link href={`/${state.slug}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-emerald-50 transition-colors group border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{state.name}</p>
                    <p className="text-xs text-gray-400">{state.cities.length} {state.cities.length === 1 ? 'city' : 'cities'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Cities */}
              <div className="p-4 flex flex-wrap gap-2">
                {state.cities.map((city) => (
                  <Link key={city.slug} href={`/${city.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 text-sm text-gray-700 hover:text-emerald-700 font-medium transition-all">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    {city.name}
                    {(city.tier ?? 5) <= 2 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TIER_COLORS[city.tier ?? 5]}`}>
                        {city.tier === 1 ? 'Metro' : 'T1'}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
