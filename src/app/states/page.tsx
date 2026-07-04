import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Building2, ArrowRight, ChevronRight } from 'lucide-react';
import { INDIAN_STATES, getCitiesByState } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'All States | TransRentals — Rental Services Across India',
  description: 'Browse rental services by state across India. Find bike rental, cab, packers & movers, bus rental in every state and union territory.',
  alternates: { canonical: 'https://transrentals.in/states' },
  openGraph: {
    title: 'All States | TransRentals',
    description: 'Rental services across all states and union territories in India.',
    url: 'https://transrentals.in/states',
    type: 'website',
  },
};

const STATE_ICONS: Record<string, string> = {
  MH: '🏙️', GJ: '🏛️', KA: '🌿', TN: '🏖️', DL: '🏛️', WB: '🎨',
  RJ: '🏜️', UP: '🕌', TS: '💎', KL: '🌴', MP: '🌾', PB: '🌾',
  HR: '🌻', GJ2: '🦁', HP: '⛰️', UK: '🏔️', JK: '❄️',
};

export default function StatesPage() {
  const statesWithData = INDIAN_STATES.map((state) => {
    const cities = getCitiesByState(state.code).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const topCities = cities.slice(0, 4);
    return { ...state, cities, topCities, cityCount: cities.length };
  }).sort((a, b) => b.cityCount - a.cityCount);

  const mainStates = statesWithData.filter((s) => s.cityCount >= 5);
  const otherStates = statesWithData.filter((s) => s.cityCount < 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700 text-white">
        <div className="container-custom py-12 md:py-16">
          <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">States</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">All States & UTs</h1>
          <p className="text-indigo-200 text-base md:text-lg max-w-2xl">
            Rental services across <span className="text-white font-bold">{INDIAN_STATES.length} states</span> and union territories — explore by region.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-white">{mainStates.length}</span> <span className="text-indigo-200">Major States</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-white">{otherStates.length}</span> <span className="text-indigo-200">UTs & Small States</span>
            </div>
            <Link href="/cities" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 transition-colors">
              Browse All Cities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">

        {/* Main States Grid */}
        <h2 className="text-xl font-black text-gray-900 mb-1">States</h2>
        <p className="text-sm text-gray-500 mb-6">Click a state to explore all services in that region</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {mainStates.map((state) => (
            <Link key={state.code} href={`/${state.slug}`}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-lg p-5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{state.code}</span>
              </div>
              <h3 className="font-black text-gray-900 text-base group-hover:text-indigo-700 transition-colors mb-1">{state.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{state.cityCount} cities covered</p>

              {/* Top cities */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {state.topCities.map((city) => (
                  <span key={city.slug} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {city.name}
                  </span>
                ))}
                {state.cityCount > 4 && (
                  <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold">
                    +{state.cityCount - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                Explore {state.name} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* UTs & Small States */}
        {otherStates.length > 0 && (
          <>
            <h2 className="text-xl font-black text-gray-900 mb-1">Union Territories & Small States</h2>
            <p className="text-sm text-gray-500 mb-5">Smaller regions with limited coverage</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {otherStates.map((state) => (
                <Link key={state.code} href={`/${state.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md p-4 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">{state.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{state.cityCount} {state.cityCount === 1 ? 'city' : 'cities'}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
