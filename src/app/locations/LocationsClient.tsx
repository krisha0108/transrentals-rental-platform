'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin, Search, X, ArrowRight, Bike, Car, Package, MoreHorizontal,
  Building2, Star, ShieldCheck, Headphones, CreditCard,
} from 'lucide-react';

const STATE_ACCENT = {
  solid: 'bg-emerald-600', text: 'text-emerald-700', soft: 'bg-emerald-50', ring: 'border-emerald-200',
  blob: 'from-emerald-100 to-emerald-50', hoverPill: 'hover:bg-emerald-50 hover:text-emerald-700',
};

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

  const popularCities = useMemo(() => {
    return statesWithCities
      .flatMap((s) => s.cities)
      .sort((a, b) => (a.tier ?? 5) - (b.tier ?? 5) || (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 24);
  }, [statesWithCities]);

  const SERVICE_HIGHLIGHTS = [
    { icon: Bike, label: 'Bike Rentals', desc: 'Ride Anywhere' },
    { icon: Car, label: 'Cabs & Travel', desc: 'Travel Comfortably' },
    { icon: Package, label: 'Packers & Movers', desc: 'Move Hassle-Free' },
    { icon: MoreHorizontal, label: '& Many More', desc: 'All Services' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-b from-sky-50 via-white to-white overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] pb-16 md:pb-20">
        {/* bg illustration */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover"
            style={{ backgroundImage: "url('/images/sections/locations-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/55 to-transparent md:via-white/20" />
          <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container-custom pt-14 md:pt-16 pb-8">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-emerald-600 font-medium">Locations</span>
          </div>

          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold tracking-wide text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full mb-3.5">
              {totalCities}+ CITIES &bull; {statesWithCities.length} STATES
            </span>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
              India Connected.
              <br />
              <span className="text-emerald-600">Rent Anywhere.</span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-6 max-w-md">
              A vast network of vehicles &amp; equipment across <span className="text-gray-900 font-semibold">{totalCities}+ cities</span> in India.
            </p>

            {/* Service highlights */}
            <div className="flex flex-wrap gap-x-7 gap-y-4">
              {SERVICE_HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mb-1.5 shadow-md shadow-emerald-600/20">
                    <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 leading-tight whitespace-nowrap">{label}</span>
                  <span className="text-[11px] text-gray-400 leading-tight whitespace-nowrap mt-0.5">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating search card */}
        <div className="relative container-custom">
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-5 md:p-6 max-w-4xl">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-3">
              <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              Where do you want to go?
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search city or state... e.g. Surat, Gujarat"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
                {query ? (
                  <button onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                ) : null}
              </div>
              <button
                onClick={() => document.getElementById('locations-results')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-colors shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
                Explore Now
              </button>
            </div>

            {query && (
              <p className="text-emerald-600 text-xs mt-2.5 ml-1">
                {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Popular Searches ─────────────────────────────── */}
      {popularCities.length > 0 && (
        <div className="container-custom pt-8 md:pt-10">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-3.5">
            <span className="w-2 h-2 rounded-full border-2 border-emerald-500" />
            Popular Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {popularCities.map((city, i) => (
              <Link key={city.slug} href={`/${city.slug}`}
                className={`
                  inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors
                  ${i === 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                  }
                `}>
                {city.name}
                {i === 0 && <ArrowRight className="w-3.5 h-3.5" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────── */}
      <div
        id="locations-results"
        className="relative overflow-hidden py-12 md:py-14"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.16) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          backgroundColor: '#f4faf7',
        }}
      >
        <div className="absolute top-0 right-0 w-[380px] h-[380px] bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="relative container-custom">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
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
              {filtered.map((state) => {
                const accent = STATE_ACCENT;
                const heroCities = state.cities.slice(0, 2);
                const pillCities = state.cities.slice(2, 8);
                const overflowCount = state.cities.length - 8;
                const popularCities = state.cities.slice(8, 15);

                return (
                  <div key={state.code}
                    className="relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 md:p-6">

                    {/* State header */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent.blob} flex items-center justify-center shrink-0`}>
                        <MapPin className={`w-6 h-6 ${accent.text}`} strokeWidth={2.25} />
                      </div>
                      <div>
                        <span className="font-black text-gray-900 text-lg block leading-tight">{state.name}</span>
                        <span className={`inline-block mt-1 text-[11px] font-bold ${accent.text} ${accent.soft} px-2 py-0.5 rounded-full`}>
                          {state.cities.length} cities
                        </span>
                      </div>
                    </div>

                    {/* City pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {heroCities.map((city) => (
                        <Link key={city.slug} href={`/${city.slug}`}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white ${accent.solid} hover:opacity-90 transition-opacity`}>
                          {city.name}
                          {(city.tier ?? 5) === 1 && <Building2 className="w-3.5 h-3.5 opacity-80" />}
                        </Link>
                      ))}
                      {pillCities.map((city) => (
                        <Link key={city.slug} href={`/${city.slug}`}
                          className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:border-transparent transition-colors ${accent.hoverPill}`}>
                          {city.name}
                        </Link>
                      ))}
                      {overflowCount > 0 && (
                        <span className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold ${accent.text} ${accent.soft}`}>
                          +{overflowCount} more
                        </span>
                      )}
                    </div>

                    {/* Popular cities strip + CTA */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-gray-100">
                      {popularCities.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400 min-w-0">
                          <Star className={`w-3.5 h-3.5 ${accent.text} shrink-0`} fill="currentColor" />
                          <span className="font-semibold text-gray-500 shrink-0">Popular Cities</span>
                          {popularCities.map((city, i) => (
                            <span key={city.slug} className="flex items-center gap-2">
                              {i > 0 && <span className="text-gray-300">&bull;</span>}
                              <Link href={`/${city.slug}`} className="hover:text-emerald-600 transition-colors">{city.name}</Link>
                            </span>
                          ))}
                        </div>
                      ) : <span />}
                      <Link href={`/${state.slug}`}
                        className={`inline-flex items-center gap-1.5 text-sm font-bold text-white ${accent.solid} hover:opacity-90 px-4 py-2 rounded-xl transition-opacity shrink-0 self-start md:self-auto`}>
                        Explore {state.name} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trust stats strip */}
          <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, label: `${totalCities}+ Cities`, desc: `Across ${statesWithCities.length} States` },
              { icon: ShieldCheck, label: 'Trusted Services', desc: 'Verified & Reliable' },
              { icon: Headphones, label: '24/7 Support', desc: "We're Here to Help" },
              { icon: CreditCard, label: 'Secure Payments', desc: '100% Safe & Secure' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight truncate">{label}</p>
                  <p className="text-xs text-gray-400 leading-tight truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
