'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Search, X, ArrowRight } from 'lucide-react';

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
        return { ...state, cities: matchedCities };
      })
      .filter((s) => s.cities.length > 0);
  }, [query, statesWithCities]);

  const totalResults = filtered.reduce((sum, s) => sum + s.cities.length, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 overflow-hidden">
        {/* bg blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative container-custom pt-10 pb-14">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs mb-8">
            <Link href="/" className="hover:text-emerald-300 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-emerald-300">Locations</span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Explore Locations
            </h1>
            <p className="text-emerald-300/80 text-base mb-8">
              Find rental services in <span className="text-white font-semibold">{totalCities}+ cities</span> across <span className="text-white font-semibold">{statesWithCities.length} states</span> — bike rental, cab, packers & movers, and more.
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or state... e.g. Surat, Gujarat"
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {query ? (
                <button onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              ) : null}
            </div>

            {query && (
              <p className="text-emerald-400/70 text-xs mt-2.5 ml-1">
                {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;<span className="text-emerald-300">{query}</span>&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="container-custom py-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-bold text-gray-800 text-lg mb-1">No results found</p>
            <p className="text-sm text-gray-400 mb-5">Try searching a different city or state</p>
            <button onClick={() => setQuery('')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((state) => (
              <div key={state.code}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* State row */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-black text-gray-900 text-[15px]">{state.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{state.cities.length} cities</span>
                    </div>
                  </div>
                  <Link href={`/${state.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                    State page <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Cities */}
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {state.cities.map((city) => (
                    <Link key={city.slug} href={`/${city.slug}`}
                      className={`
                        inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                        ${(city.tier ?? 5) === 1
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                          : (city.tier ?? 5) === 2
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }
                      `}>
                      {city.name}
                      {(city.tier ?? 5) === 1 && (
                        <span className="text-[9px] font-bold bg-blue-200 text-blue-800 px-1 rounded">M</span>
                      )}
                    </Link>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
