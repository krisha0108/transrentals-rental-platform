'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LocalPkg {
  id: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  isPopular: boolean;
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

interface OutstationPricing {
  vehicleCategoryId: string;
  baseKmRate: number;
  minKmPerDay: number;
  driverDayAllowance: number;
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
  vehicles: LocalPkg[];
}

interface Props {
  hourGroups: HourGroup[];
  outstationPricing: OutstationPricing[];
  locationName: string;
}

type Tab = 'local' | 'outstation';

export function ChauffeurPackages({ hourGroups, outstationPricing, locationName }: Props) {
  const hasLocal = hourGroups.length > 0;
  const hasOutstation = outstationPricing.length > 0;

  const defaultTab: Tab = hasLocal ? 'local' : 'outstation';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [activeHours, setActiveHours] = useState(hourGroups[0]?.hours ?? null);

  if (!hasLocal && !hasOutstation) return null;

  const activeGroup = hourGroups.find((g) => g.hours === activeHours);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-2">Chauffeur Packages in {locationName}</h2>
        <p className="text-center text-gray-500 mb-8">Professional drivers · All-inclusive pricing</p>

        {/* Local / Outstation tabs */}
        {hasLocal && hasOutstation && (
          <div className="flex justify-center gap-3 mb-8">
            {([['local', '🕐 Local / Hourly'], ['outstation', '🗺️ Outstation']] as [Tab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── LOCAL PACKAGES ── */}
        {activeTab === 'local' && hasLocal && (
          <>
            {/* Hour tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {hourGroups.map((group) => (
                <button
                  key={group.hours}
                  onClick={() => setActiveHours(group.hours)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 font-semibold text-sm transition-all ${
                    activeHours === group.hours
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  ⏱ {group.hours} hrs · {group.kms} km
                  <span className={`text-xs font-normal ${activeHours === group.hours ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {group.vehicles.length} vehicles
                  </span>
                </button>
              ))}
            </div>

            {activeGroup && (
              <div className={`grid gap-6 ${
                activeGroup.vehicles.length === 1 ? 'max-w-xs mx-auto' :
                activeGroup.vehicles.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
                'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
              }`}>
                {activeGroup.vehicles.map((pkg) => {
                  const cat = pkg.chauffeur_vehicle_categories;
                  let examples: string[] = [];
                  try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                  return (
                    <div key={pkg.id} className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                      pkg.isPopular ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'border border-gray-200'
                    }`}>
                      {pkg.isPopular && (
                        <div className="absolute top-0 left-0 right-0 flex justify-center">
                          <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">⭐ POPULAR</span>
                        </div>
                      )}
                      <div className={`relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center ${pkg.isPopular ? 'mt-6' : ''}`}>
                        {cat.image ? (
                          <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                        ) : (
                          <span className="text-7xl">🚗</span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="text-center mb-3">
                          <h4 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h4>
                          <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                          {examples.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{examples.slice(0, 2).join(', ')}</p>}
                        </div>
                        <div className="flex justify-center gap-3 mb-4">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{activeGroup.hours}hr</span>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{activeGroup.kms}km incl.</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                          <p className="text-3xl font-bold text-indigo-700">₹{pkg.basePrice.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-400">All inclusive · driver + fuel</p>
                          {pkg.extraKmCharge > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">+₹{pkg.extraKmCharge}/km beyond {activeGroup.kms}km</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-center text-xs text-gray-400 mt-8">
              * Prices include driver, fuel & GST. Extra km/hr charges apply beyond package limits.
            </p>
          </>
        )}

        {/* ── OUTSTATION PRICING ── */}
        {activeTab === 'outstation' && hasOutstation && (
          <>
            <div className={`grid gap-6 ${
              outstationPricing.length === 1 ? 'max-w-xs mx-auto' :
              outstationPricing.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
              'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
            }`}>
              {outstationPricing.map((p) => {
                const cat = p.chauffeur_vehicle_categories;
                let examples: string[] = [];
                try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                return (
                  <div key={p.vehicleCategoryId} className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                    cat.isPopular ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'border border-gray-200'
                  }`}>
                    {cat.isPopular && (
                      <div className="absolute top-0 left-0 right-0 flex justify-center">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">⭐ POPULAR</span>
                      </div>
                    )}
                    <div className={`relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center ${cat.isPopular ? 'mt-6' : ''}`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                      ) : (
                        <span className="text-7xl">🚗</span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="text-center mb-3">
                        <h4 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h4>
                        <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                        {examples.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{examples.slice(0, 2).join(', ')}</p>}
                      </div>
                      <div className="text-center mb-3">
                        <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-indigo-700">₹{p.baseKmRate}</span>
                          <span className="text-sm text-gray-500">/km</span>
                        </div>
                        <p className="text-xs text-gray-400">Min {p.minKmPerDay} km/day</p>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mt-auto">
                        <p className="flex items-center gap-2"><span className="text-indigo-500">✓</span>Driver allowance ₹{p.driverDayAllowance}/day</p>
                        <p className="flex items-center gap-2"><span className="text-indigo-500">✓</span>Professional driver</p>
                        <p className="flex items-center gap-2"><span className="text-indigo-500">✓</span>All India permit</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-8">
              * Rates are per km. Final price includes driver allowance + GST (5%). Toll & parking extra.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
