'use client';

import { useState } from 'react';
import { KeyRound, User, ChevronRight } from 'lucide-react';
import { CarSearchHero } from '@/components/car/CarSearchHero';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { useLocation } from '@/contexts/LocationContext';

type RentalType = 'self-drive' | 'with-driver' | null;

interface SwiftRentalTypeHeroProps {
  city?: string;
  citySlug?: string;
  vehicleName?: string;
  selfDrivePrice?: string;
}

export function SwiftRentalTypeHero({
  city: cityProp,
  citySlug: citySlugProp,
  vehicleName = 'Maruti Swift',
  selfDrivePrice = '₹899/day',
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
    <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative container-custom py-14 md:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-5">
            <span className="text-sm font-medium">{vehicleName} on Rent — {city}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            {vehicleName} on Rent in {city}
          </h1>
          <p className="text-white/70 text-lg">
            How would you like to rent the {vehicleName.split(' ').pop()}?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Self Drive */}
          <button
            type="button"
            onClick={() => setSelected('self-drive')}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-2xl p-7 text-left transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
              <KeyRound className="w-6 h-6 text-blue-300" />
            </div>
            <h2 className="text-xl font-bold mb-1">Self Drive</h2>
            <p className="text-white/60 text-sm mb-4">Drive yourself, no driver needed. Pay per day.</p>
            <div className="flex items-center gap-1.5 text-blue-300 text-sm font-medium">
              <span>From {selfDrivePrice}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* With Driver */}
          <button
            type="button"
            onClick={() => setSelected('with-driver')}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-2xl p-7 text-left transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition">
              <User className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold mb-1">With Driver</h2>
            <p className="text-white/60 text-sm mb-4">Sit back & relax, our driver takes you there.</p>
            <div className="flex items-center gap-1.5 text-emerald-300 text-sm font-medium">
              <span>Local, Outstation & Airport</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
