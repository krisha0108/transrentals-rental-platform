import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, Check, Weight, Lightbulb,
  Truck, Container, Snowflake, Droplet, Construction,
} from 'lucide-react';

const FEATURED_TRUCK = {
  id: 'mini-truck',
  name: 'Mini Truck / Tata Ace',
  icon: Truck,
  capacity: '750 KG – 1.5 TON',
  bestFor: 'Compact trucks for city deliveries',
  features: ['City delivery', 'Fuel efficient', 'Quick booking'],
  url: '/mini-truck-rental',
};

const TRUCK_TYPES = [
  {
    id: 'tata-ace',
    name: 'Tata Ace / Mini Truck',
    icon: Truck,
    capacity: '750 KG – 1 TON',
    bestFor: 'Small goods transport',
    features: ['City delivery', 'Compact size'],
  },
  {
    id: 'pickup',
    name: 'Pickup Truck',
    icon: Truck,
    capacity: '1–2 TON',
    bestFor: 'Open body goods carrier',
    features: ['Open/Closed body', 'Flexible loading'],
  },
  {
    id: 'canter-14ft',
    name: '14 Feet Truck (Canter)',
    icon: Truck,
    capacity: '3–4 TON',
    bestFor: 'Medium goods transport',
    features: ['Covered body', 'City & highway'],
  },
  {
    id: 'canter-17ft',
    name: '17 Feet Truck (Canter)',
    icon: Truck,
    capacity: '5–6 TON',
    bestFor: 'Large capacity transport',
    features: ['Full body', 'Long distance'],
  },
  {
    id: 'canter-19ft',
    name: '19 Feet Truck',
    icon: Truck,
    capacity: '7–8 TON',
    bestFor: 'Extra large capacity',
    features: ['Extended body', 'Bulk goods'],
  },
  {
    id: 'canter-22ft',
    name: '22 Feet Truck',
    icon: Truck,
    capacity: '9–10 TON',
    bestFor: 'Heavy duty transport',
    features: ['Full container', 'Interstate'],
  },
  {
    id: 'container',
    name: '32 Feet Container',
    icon: Container,
    capacity: '15–20 TON',
    bestFor: 'Heavy commercial transport',
    features: ['Full container', 'Long haul'],
  },
  {
    id: 'trailer',
    name: 'Trailer / Multi-Axle',
    icon: Truck,
    capacity: '25+ TON',
    bestFor: 'Extra heavy transport',
    features: ['Multi-axle', 'Industrial'],
  },
];

const SPECIALIZED_TRUCKS = [
  {
    id: 'refrigerated',
    name: 'Refrigerated Truck',
    icon: Snowflake,
    capacity: 'Cold Chain',
    bestFor: 'Temperature controlled transport',
    features: ['Food grade', 'Temperature monitoring'],
  },
  {
    id: 'tanker',
    name: 'Tanker Truck',
    icon: Droplet,
    capacity: 'Liquid Goods',
    bestFor: 'Liquid goods transport',
    features: ['Water', 'Fuel', 'Chemical grade'],
  },
  {
    id: 'tipper',
    name: 'Tipper Truck',
    icon: Construction,
    capacity: 'Auto-Unload',
    bestFor: 'Construction material transport',
    features: ['Sand/gravel', 'Construction sites'],
  },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Specialized Car Rental Services me use hui hai. */
const TTC_CSS = `
.ttc-card {
  opacity: 0;
  animation: ttc-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes ttc-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.ttc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}

.ttc-icon { transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.ttc-card:hover .ttc-icon { transform: scale(1.08); }

.ttc-arrow { transition: background-color .3s ease, color .3s ease, transform .3s ease; }
.ttc-card:hover .ttc-arrow { transform: translateX(3px); }

/* info box */
.ttc-info { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
.ttc-info:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px -16px rgba(16,185,129,.32);
  border-color: rgb(167 243 208);
}
.ttc-info-icon { transition: background-color .3s ease, transform .3s ease; }
.ttc-info:hover .ttc-info-icon { transform: scale(1.06); }

@media (prefers-reduced-motion: reduce) {
  .ttc-card, .ttc-info { opacity: 1; animation: none; }
  .ttc-card:hover, .ttc-info:hover { transform: none; }
  .ttc-icon, .ttc-arrow, .ttc-info-icon,
  .ttc-card:hover .ttc-icon,
  .ttc-card:hover .ttc-arrow,
  .ttc-info:hover .ttc-info-icon { transition: none; transform: none; }
}
`;

function TruckCard({ truck, idx }: { truck: typeof TRUCK_TYPES[number]; idx: number }) {
  return (
    <div
      className="ttc-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
        <span className="ttc-icon">
          <truck.icon className="w-9 h-9 text-emerald-600" strokeWidth={1.7} />
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-center leading-tight text-emerald-700">
          <Weight className="w-3 h-3 shrink-0" />
          {truck.capacity}
        </span>
      </div>

      <div className="flex-1 min-w-0 p-5">
        <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{truck.name}</h3>

        <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
        <p className="mt-0.5 text-[13px] text-gray-600">{truck.bestFor}</p>

        <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
          {truck.features.map((f) => (
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

export function TruckTypesCards() {
  return (
    <section className="ttc relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: TTC_CSS }} />

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
            Truck Fleet
          </span>
          <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
            Truck Types by Size &amp; Capacity
          </h2>
          <p className="text-gray-500">
            Choose the right truck size for your goods transport needs
          </p>
        </div>

        {/* Dedicated Page — the only clickable card, links to mini-truck-rental */}
        <div className="mb-12 max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Has Its Own Dedicated Page</h3>
          <Link
            href={FEATURED_TRUCK.url}
            className="ttc-card group relative flex w-full max-w-2xl mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="w-[140px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
              <span className="ttc-icon">
                <FEATURED_TRUCK.icon className="w-10 h-10 text-emerald-600" strokeWidth={1.7} />
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-center leading-tight text-emerald-700">
                <Weight className="w-3 h-3 shrink-0" />
                {FEATURED_TRUCK.capacity}
              </span>
            </div>

            <div className="flex-1 min-w-0 p-5">
              <h3 className="text-[17px] font-bold text-gray-900 leading-snug">{FEATURED_TRUCK.name}</h3>
              <p className="mt-1.5 text-[13px] leading-snug text-gray-500">{FEATURED_TRUCK.bestFor}</p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {FEATURED_TRUCK.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                        <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="ttc-arrow w-8 h-8 rounded-full bg-emerald-50 grid place-items-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* All Truck Types */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 max-w-6xl mx-auto">All Truck Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {TRUCK_TYPES.map((truck, idx) => (
              <TruckCard key={truck.id} truck={truck} idx={idx} />
            ))}
          </div>
        </div>

        {/* Specialized Trucks */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 max-w-6xl mx-auto">Specialized Trucks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {SPECIALIZED_TRUCKS.map((truck, idx) => (
              <TruckCard key={truck.id} truck={truck} idx={idx} />
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="ttc-info group mt-12 max-w-6xl mx-auto bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 border-l-4 border-emerald-500 transition-colors group-hover:bg-emerald-50/30">
            <div className="ttc-info-icon w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[17px] tracking-tight text-gray-900 mb-1.5">Need help choosing the right truck?</h4>
              <p className="text-[14.5px] text-gray-600 leading-relaxed">
                Use the main booking form to tell us your goods type, weight, and route. We&apos;ll recommend the perfect truck size and provide competitive quotes from verified transporters!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
