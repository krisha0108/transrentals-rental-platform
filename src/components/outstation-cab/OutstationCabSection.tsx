'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Car as CarIcon } from 'lucide-react';

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
    <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-2">
          <h2 className="text-2xl md:text-[2rem] font-black tracking-tight text-gray-900">
            Outstation Cab <span className="text-emerald-600">Options</span>
          </h2>
        </div>
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
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
            {filtered.map((cat, idx) => {
              let examples: string[] = [];
              try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
              const pricing = pricingMap[cat.id];
              const minKm = pricing?.minKmPerDay;
              const driverAllowance = pricing?.driverDayAllowance;
              return (
                <div
                  key={cat.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  style={{ animation: `ocs-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 70}ms forwards`, opacity: 0 }}
                >
                  <div className="relative h-44 bg-emerald-50 flex items-center justify-center">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                    ) : (
                      <CarIcon className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
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
                      <p className="text-xl font-bold text-emerald-700">Get Quote</p>
                      {minKm && <p className="text-xs text-gray-400 mt-0.5">Min {minKm} km/day</p>}
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {[
                        `${cat.seatingCapacity} passengers`,
                        'AC & comfortable',
                        'Professional driver',
                        ...(driverAllowance ? ['Driver allowance included'] : []),
                      ].map((f) => (
                        <p key={f} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>{f}
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
          * All-inclusive quote covers driver allowance &amp; GST. Toll &amp; parking extra.
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ocs-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="ocs-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
