'use client';

import { useState } from 'react';
import { KeyRound, User, ChevronRight, ShieldCheck, Headphones, MapPin } from 'lucide-react';
import { CarSearchHero } from '@/components/car/CarSearchHero';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { useLocation } from '@/contexts/LocationContext';

type RentalType = 'self-drive' | 'with-driver' | null;

interface SwiftRentalTypeHeroProps {
  city?: string;
  citySlug?: string;
  vehicleName?: string;
  /** Omit to show no rate at all — the self-drive pages quote none, because
   *  the real price depends on the partner and the dates. */
  selfDrivePrice?: string;
}

export function SwiftRentalTypeHero({
  city: cityProp,
  citySlug: citySlugProp,
  vehicleName = 'Maruti Swift',
  selfDrivePrice,
}: SwiftRentalTypeHeroProps) {
  const { currentCity } = useLocation();
  const city = cityProp || currentCity?.name || 'India';
  const citySlug = citySlugProp || currentCity?.slug || '';
  const [selected, setSelected] = useState<RentalType>(null);

  if (selected === 'self-drive') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 bg-blue-50 w-full border-b border-blue-100"
        >
          ← Change rental type
        </button>
        <CarSearchHero city={city} citySlug={citySlug} />
      </div>
    );
  }

  if (selected === 'with-driver') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 bg-blue-50 w-full border-b border-blue-100"
        >
          ← Change rental type
        </button>
        <CarRentalBookingHero
          city={city}
          citySlug={citySlug}
          serviceSlug="car-rental"
          serviceTitle="Car Rental"
        />
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* A real photograph behind the chooser — the flat slate panel gave the
          two options nothing to sit on. It sits at low opacity over a solid
          dark base rather than under a translucent overlay, so the copy stays
          readable no matter how bright the photo is. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-[0.22]"
        style={{ backgroundImage: "url('/images/hero/fleet-lineup-night.png')" }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-emerald-950/70" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '26px 26px' }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative container-custom py-14 md:py-20">
        <div className="text-center mb-9 md:mb-11">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            {vehicleName} on Rent — {city}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl md:text-[2.75rem] md:leading-[1.1] font-black tracking-tight">
            {vehicleName} on Rent in <span className="text-emerald-300">{city}</span>
          </h1>
          <p className="mt-3 text-sm md:text-[15px] text-white/70">
            How would you like to rent the {vehicleName.split(' ').pop()}?
          </p>
        </div>

        {/* Same two choices, same actions — just given the weight of a real
            decision instead of two flat boxes. */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setSelected('self-drive')}
            className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 md:p-7 text-left backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-sky-300/50 hover:bg-white/[0.12] hover:shadow-2xl hover:shadow-sky-900/30"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sky-400 to-blue-500 opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/30 transition-colors group-hover:bg-sky-500/30">
              <KeyRound className="h-6 w-6 text-sky-300" />
            </span>
            <h2 className="mt-4 text-lg md:text-xl font-bold">Self Drive</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              Drive yourself, no driver needed. Pay per day.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300">
              {selfDrivePrice ? `From ${selfDrivePrice}` : 'Book self drive'}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelected('with-driver')}
            className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 md:p-7 text-left backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-white/[0.12] hover:shadow-2xl hover:shadow-emerald-900/30"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-500 opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30 transition-colors group-hover:bg-emerald-500/30">
              <User className="h-6 w-6 text-emerald-300" />
            </span>
            <h2 className="mt-4 text-lg md:text-xl font-bold">With Driver</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              Sit back &amp; relax, our driver takes you there.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
              Local, Outstation &amp; Airport
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/55">
          {[
            { Icon: ShieldCheck, text: 'Verified partners' },
            { Icon: Headphones, text: '24/7 support' },
            { Icon: MapPin, text: 'Doorstep delivery' },
          ].map((item) => (
            <span key={item.text} className="inline-flex items-center gap-1.5">
              <item.Icon className="h-3.5 w-3.5 text-emerald-400/80" />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
