'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Bus {
  id: string;
  name: string;
  sideImage: string | null;
  basePricePerDay: number | null;
  rating: number | null;
  seatingCapacity: number | null;
  brands: { name: string } | null;
}

interface Props {
  buses: Bus[];
}

const INITIAL_LIMIT = 8;

export function BusFleetGrid({ buses }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? buses : buses.slice(0, INITIAL_LIMIT);
  const hasMore = buses.length > INITIAL_LIMIT;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
          Corporate Buses Available
        </h2>
        <p className="text-center text-gray-500 mb-8">Choose from our verified fleet across India</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((bus) => (
            <div key={bus.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition border border-blue-200 overflow-hidden flex flex-col">
              <div className="relative h-44 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                {bus.sideImage ? (
                  <Image
                    src={bus.sideImage}
                    alt={bus.name}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <span className="text-7xl">🚌</span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{bus.name}</h3>
                  {bus.rating && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      ★ {bus.rating}
                    </span>
                  )}
                </div>
                {bus.brands?.name && (
                  <p className="text-xs text-gray-400 mb-1">{bus.brands.name}</p>
                )}
                {bus.seatingCapacity && (
                  <p className="text-xs text-gray-500 mb-2">{bus.seatingCapacity} Seater</p>
                )}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  {bus.basePricePerDay ? (
                    <p className="text-lg font-bold text-primary">
                      <span className="text-xs font-normal text-gray-500">Starting from </span>
                      ₹{Number(bus.basePricePerDay).toLocaleString('en-IN')}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-primary">Get Quote</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-blue-600 text-blue-700 font-semibold text-sm hover:bg-blue-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${buses.length} Buses ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">* Price may vary based on vendor quotes</p>
      </div>
    </section>
  );
}
