import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Building2, ArrowRight } from 'lucide-react';
import { ALL_CITIES, INDIAN_STATES, getCitiesByState } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'All Cities | TransRentals — Rental Services Across India',
  description: 'Find rental services in 500+ cities across India. Bike rental, cab, packers & movers, bus rental and more. Browse by state or search your city.',
  alternates: { canonical: 'https://transrentals.in/cities' },
  openGraph: {
    title: 'All Cities | TransRentals',
    description: 'Rental services in 500+ cities across India.',
    url: 'https://transrentals.in/cities',
    type: 'website',
  },
};

const TIER_LABELS: Record<number, string> = {
  1: 'Metro',
  2: 'Tier 1',
  3: 'Tier 2',
  4: 'Tier 3',
  5: 'Tier 4',
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-green-100 text-green-700',
  4: 'bg-amber-100 text-amber-700',
  5: 'bg-gray-100 text-gray-600',
};

export default function CitiesPage() {
  const statesWithCities = INDIAN_STATES.map((state) => ({
    ...state,
    cities: getCitiesByState(state.code).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
  })).filter((s) => s.cities.length > 0).sort((a, b) => b.cities.length - a.cities.length);

  const totalCities = ALL_CITIES.length;
  const topCities = ALL_CITIES.filter((c) => (c.tier ?? 5) <= 2).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white">
        <div className="container-custom py-12 md:py-16">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Cities</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">All Cities</h1>
          <p className="text-blue-200 text-base md:text-lg max-w-2xl">
            Rental services across <span className="text-white font-bold">{totalCities}+ cities</span> in India — bike rental, cab booking, packers & movers, bus rental and more.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-white">{totalCities}+</span> <span className="text-blue-200">Cities</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-white">{INDIAN_STATES.length}</span> <span className="text-blue-200">States & UTs</span>
            </div>
            <Link href="/states" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 transition-colors">
              Browse by State <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Top Cities */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-gray-900 mb-1">Top Cities</h2>
          <p className="text-sm text-gray-500 mb-5">Metro & Tier 1 cities with full service coverage</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/${city.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md p-4 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIER_COLORS[city.tier ?? 5]}`}>
                    {TIER_LABELS[city.tier ?? 5]}
                  </span>
                </div>
                <p className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{city.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* By State */}
        <h2 className="text-xl font-black text-gray-900 mb-1">Browse by State</h2>
        <p className="text-sm text-gray-500 mb-6">All cities grouped by state</p>

        <div className="space-y-8">
          {statesWithCities.map((state) => (
            <div key={state.code} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <Link href={`/${state.slug}`} className="font-bold text-gray-900 hover:text-blue-700 transition-colors">
                      {state.name}
                    </Link>
                    <p className="text-xs text-gray-400">{state.cities.length} cities</p>
                  </div>
                </div>
                <Link href={`/${state.slug}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                  View State <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {state.cities.map((city) => (
                    <Link key={city.slug} href={`/${city.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-full text-sm text-gray-700 hover:text-blue-700 font-medium transition-all">
                      {city.name}
                      {(city.tier ?? 5) <= 2 && (
                        <span className={`text-[9px] font-bold px-1 rounded ${TIER_COLORS[city.tier ?? 5]}`}>
                          {TIER_LABELS[city.tier ?? 5]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
