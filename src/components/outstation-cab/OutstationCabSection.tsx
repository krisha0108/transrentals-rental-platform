'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  seatingCapacity: number | null;
  acType: string | null;
  exampleVehicles: string | null;
  isPopular: boolean;
  dailyRate: number | null;
}

interface Pricing {
  vehicleCategoryId: string;
  baseKmRate: number | null;
  minKmPerDay: number | null;
  driverDayAllowance: number | null;
}

interface Props {
  categories: VehicleCategory[];
  pricingMap: Record<string, Pricing>;
}

const SEAT_GROUPS = [
  { label: 'All', min: 0, max: 9999 },
  { label: '4 Seater', min: 4, max: 4 },
  { label: '5–6 Seater', min: 5, max: 6 },
  { label: '7+ Seater', min: 7, max: 9999 },
];

export function OutstationCabSection({ categories, pricingMap }: Props) {
  const [activeAC, setActiveAC] = useState('All');
  const [activeSeat, setActiveSeat] = useState('All');

  // Derive unique AC types that actually exist
  const acTypes = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => { if (c.acType) set.add(c.acType); });
    return set.size > 1 ? ['All', ...Array.from(set).sort()] : [];
  }, [categories]);

  // Derive seat groups that actually have vehicles
  const seatGroups = useMemo(() => {
    return SEAT_GROUPS.filter(g => {
      if (g.label === 'All') return true;
      return categories.some(c => (c.seatingCapacity ?? 0) >= g.min && (c.seatingCapacity ?? 0) <= g.max);
    });
  }, [categories]);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const acOk = activeAC === 'All' || c.acType === activeAC;
      const sg = SEAT_GROUPS.find(g => g.label === activeSeat);
      const seatOk = activeSeat === 'All' || !sg
        ? true
        : (c.seatingCapacity ?? 0) >= sg.min && (c.seatingCapacity ?? 0) <= sg.max;
      return acOk && seatOk;
    });
  }, [categories, activeAC, activeSeat]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-1">
          Outstation Cab Options
        </h2>
        <p className="text-center text-gray-500 mb-5 text-sm">Select from our range of well-maintained vehicles</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          {/* AC Type Filter */}
          {acTypes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Type:</span>
              {acTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveAC(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeAC === t
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Seating Filter */}
          {seatGroups.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Seats:</span>
              {seatGroups.map(g => (
                <button
                  key={g.label}
                  onClick={() => setActiveSeat(g.label)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeSeat === g.label
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {filtered.map((cat) => {
              let examples: string[] = [];
              try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
              const pricing = pricingMap[cat.id];
              const rate = pricing?.baseKmRate ?? cat.dailyRate;
              const minKm = pricing?.minKmPerDay;
              const driverAllowance = pricing?.driverDayAllowance;
              return (
                <div
                  key={cat.id}
                  className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden flex flex-col ${
                    cat.isPopular ? 'ring-2 ring-purple-500 scale-[1.02]' : 'border border-purple-100'
                  }`}
                >
                  {cat.isPopular && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                      <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                        ⭐ POPULAR
                      </span>
                    </div>
                  )}
                  <div className={`relative h-44 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center ${cat.isPopular ? 'mt-6' : ''}`}>
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                    ) : (
                      <span className="text-7xl">🚗</span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-bold text-gray-900 capitalize">{cat.name}</h3>
                      <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                    </div>
                    {examples.length > 0 && (
                      <p className="text-sm text-gray-500 text-center mb-3">{examples.slice(0, 2).join(', ')}</p>
                    )}
                    <div className="text-center mb-4">
                      {rate ? (
                        <>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold text-purple-600">₹{rate.toLocaleString('en-IN')}</span>
                            <span className="text-sm text-gray-500">/km</span>
                          </div>
                          {minKm && <p className="text-xs text-gray-400 mt-0.5">Min {minKm} km/day</p>}
                        </>
                      ) : (
                        <p className="text-xl font-bold text-purple-600">Get Quote</p>
                      )}
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {[
                        `${cat.seatingCapacity} passengers`,
                        'AC & comfortable',
                        'Professional driver',
                        ...(driverAllowance ? [`Driver allowance ₹${driverAllowance}/day`] : []),
                      ].map((f) => (
                        <p key={f} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-purple-500">✓</span>{f}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          * Rates shown are per km. Final price includes driver allowance + GST (5%). Toll &amp; parking extra.
        </p>
      </div>
    </section>
  );
}
