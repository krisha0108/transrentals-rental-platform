import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Building2, ChevronRight } from 'lucide-react';
import { INDIAN_STATES, getCitiesByState } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Locations | TransRentals — Services Across India',
  description: 'Find rental services in 500+ cities across India. Browse by state — bike rental, cab, packers & movers, bus rental and more.',
  alternates: { canonical: 'https://transrentals.in/locations' },
  openGraph: {
    title: 'Locations | TransRentals',
    description: 'Rental services across 500+ cities and all states in India.',
    url: 'https://transrentals.in/locations',
    type: 'website',
  },
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-gray-100 text-gray-500',
  5: 'bg-gray-100 text-gray-400',
};

export default function LocationsPage() {
  const statesWithCities = INDIAN_STATES.map((state) => ({
    ...state,
    cities: getCitiesByState(state.code).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
  })).filter((s) => s.cities.length > 0).sort((a, b) => b.cities.length - a.cities.length);

  const totalCities = statesWithCities.reduce((sum, s) => sum + s.cities.length, 0);

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
          <h1 className="text-3xl md:text-4xl font-black mb-3">All Locations</h1>
          <p className="text-emerald-200 text-base max-w-xl">
            Rental services across <span className="text-white font-bold">{totalCities}+ cities</span> in <span className="text-white font-bold">{statesWithCities.length} states</span> — bike rental, cab, packers & movers, and more.
          </p>
        </div>
      </div>

      {/* States + Cities */}
      <div className="container-custom py-10 space-y-6">
        {statesWithCities.map((state) => (
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
                  <p className="text-xs text-gray-400">{state.cities.length} cities</p>
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
        ))}
      </div>
    </div>
  );
}
