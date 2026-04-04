'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';

interface TempoVehicle {
  id: string;
  name: string;
  sideImage: string | null;
  basePricePerDay: number | null;
  rating: number | null;
  tagline: string | null;
  highlight: string | null;
  isPopular: boolean;
  seatingCapacity: number | null;
  brands: { name: string } | null;
}

interface Props {
  vehicles: TempoVehicle[];
  locationName: string;
}

const CAPACITY_GROUPS = [
  { label: 'All', min: 0, max: 9999 },
  { label: '12 Seater', min: 10, max: 13 },
  { label: '14–16 Seater', min: 14, max: 16 },
  { label: '17 Seater', min: 17, max: 18 },
  { label: '20+ Seater', min: 19, max: 9999 },
];

export function TempoFleetSection({ vehicles, locationName }: Props) {
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeCapacity, setActiveCapacity] = useState('All');

  const brands = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => { if (v.brands?.name) set.add(v.brands.name); });
    return ['All', ...Array.from(set).sort()];
  }, [vehicles]);

  // Only show capacity groups that have at least 1 vehicle
  const activeCapacityGroups = useMemo(() => {
    const groups = CAPACITY_GROUPS.filter(g => {
      if (g.label === 'All') return true;
      return vehicles.some(v => (v.seatingCapacity ?? 0) >= g.min && (v.seatingCapacity ?? 0) <= g.max);
    });
    return groups.length > 1 ? groups : []; // hide if only 'All' exists
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const brandOk = activeBrand === 'All' || v.brands?.name === activeBrand;
      const capGroup = CAPACITY_GROUPS.find(g => g.label === activeCapacity);
      const capOk = activeCapacity === 'All' || !capGroup
        ? true
        : (v.seatingCapacity ?? 0) >= capGroup.min && (v.seatingCapacity ?? 0) <= capGroup.max;
      return brandOk && capOk;
    });
  }, [vehicles, activeBrand, activeCapacity]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-1">Tempo Travellers Available in {locationName}</h2>
        <p className="text-gray-500 mb-5 text-sm">AC vehicles for group travel, pilgrimages & corporate trips</p>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Brand Filter */}
          {brands.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Brand:</span>
              {brands.map(b => (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeBrand === b
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {/* Capacity Filter — only groups with actual vehicles */}
          {activeCapacityGroups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Capacity:</span>
              {activeCapacityGroups.map(g => (
                <button
                  key={g.label}
                  onClick={() => setActiveCapacity(g.label)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeCapacity === g.label
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No vehicles found for selected filters.</div>
        ) : (
          <div className={`grid gap-6 ${
            filtered.length === 1 ? 'max-w-sm mx-auto' :
            filtered.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
            filtered.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' :
            'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filtered.map(v => (
              <div key={v.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-orange-100 overflow-hidden flex flex-col">
                <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                  {v.sideImage ? (
                    <Image src={v.sideImage} alt={v.name} fill className="object-contain p-3" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" />
                  ) : (
                    <span className="text-7xl">🚌</span>
                  )}
                  {v.isPopular && (
                    <span className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐ Popular</span>
                  )}
                  {v.seatingCapacity && (
                    <span className="absolute top-2 left-2 bg-white/90 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Users className="w-3 h-3" /> {v.seatingCapacity} Seater
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{v.name}</h3>
                    {v.rating && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                        ★ {v.rating}
                      </span>
                    )}
                  </div>
                  {v.brands?.name && (
                    <p className="text-xs text-orange-500 font-medium mb-1">{v.brands.name}</p>
                  )}
                  {v.tagline && <p className="text-xs text-gray-500 mb-3 flex-1">{v.tagline}</p>}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    {v.basePricePerDay ? (
                      <p className="text-base font-bold text-orange-700">
                        <span className="text-xs font-normal text-gray-500">Starting From </span>
                        ₹{v.basePricePerDay.toLocaleString('en-IN')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-orange-700">Get Quote</p>
                    )}
                    {v.highlight && <p className="text-xs text-green-600 mt-1">{v.highlight}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          * Prices vary based on distance & duration. Driver & fuel included.
        </p>
      </div>
    </section>
  );
}
