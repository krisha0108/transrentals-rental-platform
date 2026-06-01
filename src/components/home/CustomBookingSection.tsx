import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Sparkles,
  ArrowRight,
  Users,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const EVENT_TYPES = [
  { icon: '💒', name: 'Weddings' },
  { icon: '🏢', name: 'Corporate' },
  { icon: '🗺️', name: 'Tours & Trips' },
  { icon: '🎂', name: 'Parties' },
  { icon: '🛕', name: 'Religious' },
  { icon: '⚽', name: 'Sports' },
];

const HIGHLIGHTS = [
  { icon: CalendarDays, label: 'Multi-day support' },
  { icon: Layers, label: 'Multiple vehicles' },
  { icon: Users, label: 'One event manager' },
];

export function CustomBookingSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white shadow-2xl">
          {/* Decorative glows + dot grid */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12% 18%, #34d399 0%, transparent 38%), radial-gradient(circle at 88% 85%, #2dd4bf 0%, transparent 42%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <CalendarDays className="absolute -bottom-10 -right-8 w-64 h-64 text-white/[0.06] pointer-events-none hidden lg:block" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12">
            {/* Left — copy + CTA */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> Bulk &amp; Multi-Day Booking
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                Planning an event?{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-200">
                  Book your entire fleet in one go.
                </span>
              </h2>
              <p className="text-emerald-50/90 mt-4 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Bikes, cars, buses and trucks for weddings, corporate events, tours and parties —
                planned day-by-day in a single booking, managed by one dedicated specialist.
              </p>

              {/* Highlights */}
              <div className="mt-5 flex flex-wrap gap-3 justify-center lg:justify-start">
                {HIGHLIGHTS.map((h) => (
                  <span
                    key={h.label}
                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    <h.icon className="w-4 h-4 text-amber-300" /> {h.label}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/custom-booking"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                >
                  Plan your event <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/custom-booking"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold text-base px-6 py-3.5 rounded-xl"
                >
                  See how it works
                </Link>
              </div>

              <p className="mt-4 text-xs text-emerald-100/80 inline-flex items-center gap-1.5 justify-center lg:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> 99.5% on-time across 10,000+ events
              </p>
            </div>

            {/* Right — event-type cards */}
            <div className="grid grid-cols-3 gap-3">
              {EVENT_TYPES.map((e) => (
                <Link
                  key={e.name}
                  href="/custom-booking"
                  className="group bg-white/10 hover:bg-white/15 backdrop-blur border border-white/20 hover:border-amber-300/50 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
                >
                  <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">{e.icon}</div>
                  <p className="text-xs font-bold text-white">{e.name}</p>
                </Link>
              ))}
              <Link
                href="/custom-booking"
                className="col-span-3 mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-amber-200 hover:text-white transition-colors"
              >
                Start a custom booking <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
