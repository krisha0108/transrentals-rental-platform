'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, Lightbulb, Sparkles,
  Zap, Compass, Gauge, Route, Mountain, Wind,
} from 'lucide-react';

const FEATURED_BIKES = [
  {
    id: 'activa-on-rent',
    name: 'Activa on Rent',
    icon: Zap,
    anim: 'pulse',
    bestFor: 'Easy to ride scooters for city commute',
    features: ['110-125cc', 'Automatic', 'Fuel efficient'],
    url: '/activa-on-rent',
  },
  {
    id: 'royal-enfield',
    name: 'Royal Enfield',
    icon: Compass,
    anim: 'tick',
    bestFor: 'Classic bikes for road trips',
    features: ['Classic 350', 'Himalayan', 'Perfect for tours'],
    url: '/royal-enfield-on-rent',
  },
];

const BIKE_TYPES = [
  {
    id: 'sport',
    name: 'Sport Bikes',
    icon: Gauge,
    anim: 'pulse',
    bestFor: 'High performance racing bikes',
    features: ['200cc+', 'Racing position', 'High speed'],
  },
  {
    id: 'scooter',
    name: 'Scooters',
    icon: Zap,
    anim: 'pulse',
    bestFor: 'Easy & convenient city rides',
    features: ['110-125cc', 'Automatic', 'Fuel efficient'],
  },
  {
    id: 'cruiser',
    name: 'Cruiser Bikes',
    icon: Compass,
    anim: 'tick',
    bestFor: 'Comfortable long-distance rides',
    features: ['Royal Enfield', 'Relaxed riding', 'Classic style'],
  },
  {
    id: 'street',
    name: 'Street/Naked Bikes',
    icon: Route,
    anim: 'drive',
    bestFor: 'Urban commuting champions',
    features: ['150-200cc', 'Upright position', 'City friendly'],
  },
  {
    id: 'adventure',
    name: 'Adventure Tourers',
    icon: Mountain,
    anim: 'lift',
    bestFor: 'Built for long journeys',
    features: ['200cc+', 'Long range', 'All terrain'],
  },
  {
    id: 'dirt',
    name: 'Dirt Bikes',
    icon: Wind,
    anim: 'drive',
    bestFor: 'Off-road adventure bikes',
    features: ['Off-road', 'Trail riding', 'Adventure ready'],
  },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Truck/Equipment Types sections me use hui hai. */
const BKC_CSS = `
.bkc-card {
  opacity: 0;
  animation: bkc-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes bkc-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.bkc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
.bkc-arrow { transition: background-color .3s ease, color .3s ease, transform .3s ease; }
.bkc-card:hover .bkc-arrow { transform: translateX(3px); }

.bkc-info { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
.bkc-info:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px -16px rgba(16,185,129,.32);
  border-color: rgb(167 243 208);
}
.bkc-info-icon { transition: background-color .3s ease, transform .3s ease; }
.bkc-info:hover .bkc-info-icon { transform: scale(1.06); }

@media (prefers-reduced-motion: reduce) {
  .bkc-card, .bkc-info { opacity: 1; animation: none; }
  .bkc-card:hover, .bkc-info:hover { transform: none; }
  .bkc-arrow, .bkc-info-icon,
  .bkc-card:hover .bkc-arrow,
  .bkc-info:hover .bkc-info-icon { transition: none; transform: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes
   (custom CSS keyframe hover animations didn't render reliably in the browser). */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
};

function BikeCard({ bike, idx }: { bike: typeof BIKE_TYPES[number]; idx: number }) {
  return (
    <div
      className="bkc-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="w-[104px] shrink-0 flex items-center justify-center px-3 py-6 bg-emerald-50">
        <span className="inline-flex">
          <bike.icon
            className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[bike.anim]}`}
            strokeWidth={1.7}
          />
        </span>
      </div>

      <div className="flex-1 min-w-0 p-5">
        <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{bike.name}</h3>

        <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
        <p className="mt-0.5 text-[13px] text-gray-600">{bike.bestFor}</p>

        <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
          {bike.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
              <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BikeTypesCards() {
  return (
    <section className="bkc relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: BKC_CSS }} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)',
        }}
      />

      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Two-Wheeler Fleet
          </span>
          <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
            Choose Your Bike Type
          </h2>
          <p className="text-gray-500">
            From city scooters to adventure bikes, find the perfect two-wheeler for your journey
          </p>
        </div>

        {/* Dedicated Pages — the two clickable cards, link to their own pages */}
        <div className="mb-12 max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Have Their Own Dedicated Page</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURED_BIKES.map((bike, idx) => (
              <Link
                key={bike.id}
                href={bike.url}
                className="bkc-card group relative flex w-full rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div className="w-[124px] shrink-0 flex items-center justify-center px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <bike.icon
                      className={`w-10 h-10 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[bike.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[17px] font-bold text-gray-900 leading-snug">{bike.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-snug text-gray-500">{bike.bestFor}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <ul className="flex flex-wrap gap-x-5 gap-y-2">
                      {bike.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                            <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <span className="bkc-arrow w-8 h-8 rounded-full bg-emerald-50 grid place-items-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Bike Types */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 max-w-6xl mx-auto">All Bike Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {BIKE_TYPES.map((bike, idx) => (
              <BikeCard key={bike.id} bike={bike} idx={idx} />
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bkc-info group mt-12 max-w-6xl mx-auto bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 border-l-4 border-emerald-500 transition-colors group-hover:bg-emerald-50/30">
            <div className="bkc-info-icon w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[17px] tracking-tight text-gray-900 mb-1.5">All bike types available!</h4>
              <p className="text-[14.5px] text-gray-600 leading-relaxed">
                Use the booking form above to specify your preferred bike type, or let us recommend the best bike for your journey based on distance and duration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
