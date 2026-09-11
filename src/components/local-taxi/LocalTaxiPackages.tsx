'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Car as CarIcon, MapPin, Route, ArrowRight } from 'lucide-react';

interface VehiclePkg {
  id: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number | null;
  isPopular: boolean;
  locationName?: string | null;
  chauffeur_vehicle_categories: {
    id: string;
    name: string;
    image: string | null;
    seatingCapacity: number | null;
    acType: string | null;
    exampleVehicles: string | null;
    isPopular: boolean;
  };
}

interface HourGroup {
  hours: number;
  kms: number;
  vehicles: VehiclePkg[];
}

interface Props {
  hourGroups: HourGroup[];
  locationName: string;
}

const INITIAL_LIMIT = 3;

export function LocalTaxiPackages({ hourGroups, locationName }: Props) {
  const [activeHours, setActiveHours] = useState(hourGroups[0]?.hours ?? null);
  const [showAll, setShowAll] = useState(false);

  const activeGroup = hourGroups.find((g) => g.hours === activeHours);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-2">
          Local Taxi Packages in <span className="text-emerald-600">{locationName}</span>
        </h2>
        <p className="text-center text-gray-500 mb-10">All-inclusive · Driver + fuel · Multiple stops</p>

        {/* Hour tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {hourGroups.map((group) => (
            <button
              key={group.hours}
              onClick={() => { setActiveHours(group.hours); setShowAll(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
                activeHours === group.hours
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'bg-white border-emerald-400 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {group.hours} hrs · {group.kms} km
              <span className={`text-xs font-normal ${activeHours === group.hours ? 'text-emerald-100' : 'text-gray-400'}`}>
                {group.vehicles.length} vehicles
              </span>
            </button>
          ))}
        </div>

        {/* Active group vehicles */}
        {activeGroup && (() => {
          const visible = showAll ? activeGroup.vehicles : activeGroup.vehicles.slice(0, INITIAL_LIMIT);
          const hasMore = activeGroup.vehicles.length > INITIAL_LIMIT;
          return (
          <>
          <div className={`grid gap-6 ${
            visible.length === 1 ? 'max-w-xs mx-auto' :
            visible.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
            'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
          }`}>
            {visible.map((pkg, idx) => {
              const cat = pkg.chauffeur_vehicle_categories;
              let examples: string[] = [];
              try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
              return (
                <div
                  key={pkg.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  style={{ animation: `ltp-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
                >
                  {/* Vehicle image */}
                  <div className="relative h-40 bg-emerald-50 flex items-center justify-center">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                    ) : (
                      <CarIcon className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900 capitalize">{cat.name}</h4>
                      <p className="text-sm text-gray-500">
                        {cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}
                      </p>
                      {examples.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{examples.slice(0, 2).join(', ')}</p>
                      )}
                      {pkg.locationName && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3" /> {pkg.locationName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-5 py-3 border-y border-gray-100">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-emerald-600" /> {activeGroup.hours} hrs
                      </span>
                      <span className="w-px h-4 bg-gray-200" />
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <Route className="w-4 h-4 text-emerald-600" /> {activeGroup.kms} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 mt-auto">
                    <span className="text-xs text-emerald-700/80">All inclusive · driver + fuel</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-emerald-700 group-hover:gap-1.5 transition-all">
                      Get Quote <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-600 hover:text-white transition-all"
              >
                {showAll ? 'Show Less ↑' : `View All ${activeGroup.vehicles.length} Vehicles ↓`}
              </button>
            </div>
          )}
          </>
          );
        })()}

        <p className="text-center text-xs text-gray-400 mt-8">
          * All-inclusive quote covers driver, fuel &amp; GST. Extra km/hr charges apply beyond package limits.
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ltp-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="ltp-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
