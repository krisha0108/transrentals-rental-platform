'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bus as BusIcon } from 'lucide-react';

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
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-2">
          Corporate Buses <span className="text-emerald-600">Available</span>
        </h2>
        <p className="text-center text-gray-500 mb-10">Choose from our verified fleet across India</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((bus, idx) => (
            <div
              key={bus.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
              style={{ animation: `bfg-rise .6s cubic-bezier(.22,1,.36,1) ${Math.min(idx, 8) * 70}ms forwards`, opacity: 0 }}
            >
              <div className="relative h-44 bg-emerald-50/60 flex items-center justify-center">
                {bus.sideImage ? (
                  <Image
                    src={bus.sideImage}
                    alt={bus.name}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <BusIcon className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{bus.name}</h3>
                  {bus.rating && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
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
                  <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${buses.length} Buses ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">* Get a custom quote based on your route and requirement</p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bfg-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="bfg-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
