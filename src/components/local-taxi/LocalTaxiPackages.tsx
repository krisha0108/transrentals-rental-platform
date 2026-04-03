'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VehiclePkg {
  id: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number | null;
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

interface HourGroup {
  hours: number;
  kms: number;
  vehicles: VehiclePkg[];
}

interface Props {
  hourGroups: HourGroup[];
  locationName: string;
}

export function LocalTaxiPackages({ hourGroups, locationName }: Props) {
  const [activeHours, setActiveHours] = useState(hourGroups[0]?.hours ?? null);

  const activeGroup = hourGroups.find((g) => g.hours === activeHours);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-2">Local Taxi Packages in {locationName}</h2>
        <p className="text-center text-gray-500 mb-10">All-inclusive · Driver + fuel · Multiple stops</p>

        {/* Hour tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {hourGroups.map((group) => (
            <button
              key={group.hours}
              onClick={() => setActiveHours(group.hours)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
                activeHours === group.hours
                  ? 'bg-green-600 border-green-600 text-white shadow-md'
                  : 'bg-white border-green-400 text-green-700 hover:bg-green-50'
              }`}
            >
              <span>⏱</span>
              {group.hours} hrs · {group.kms} km
              <span className={`text-xs font-normal ${activeHours === group.hours ? 'text-green-100' : 'text-gray-400'}`}>
                {group.vehicles.length} vehicles
              </span>
            </button>
          ))}
        </div>

        {/* Active group vehicles */}
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
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                    pkg.isPopular ? 'ring-2 ring-green-500 scale-[1.02]' : 'border border-gray-200'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                      <span className="bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">⭐ POPULAR</span>
                    </div>
                  )}

                  {/* Vehicle image */}
                  <div className={`relative h-40 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center ${pkg.isPopular ? 'mt-6' : ''}`}>
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                    ) : (
                      <span className="text-7xl">🚗</span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-center mb-3">
                      <h4 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h4>
                      <p className="text-sm text-gray-500">
                        {cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}
                      </p>
                      {examples.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{examples.slice(0, 2).join(', ')}</p>
                      )}
                    </div>

                    <div className="flex justify-center gap-3 mb-4">
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                        {activeGroup.hours}hr
                      </span>
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                        {activeGroup.kms}km incl.
                      </span>
                    </div>

                    <div className="text-center mb-2">
                      <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                      <p className="text-3xl font-bold text-green-700">₹{pkg.basePrice.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">All inclusive · driver + fuel</p>
                      {pkg.extraKmCharge && (
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
      </div>
    </section>
  );
}
