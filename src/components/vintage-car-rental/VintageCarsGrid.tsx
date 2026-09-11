'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Car as CarIcon, Users, ArrowRight } from 'lucide-react';

interface Car {
  id: string;
  name: string;
  sideImage: string | null;
  seatingCapacity: number | null;
  isPopular: boolean;
  tagline: string | null;
  highlight: string | null;
  brands: { name: string } | null;
  price: number | null;
}

interface Props {
  cars: Car[];
  locationName: string;
}

const INITIAL_LIMIT = 8;

export function VintageCarsGrid({ cars, locationName }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? cars : cars.slice(0, INITIAL_LIMIT);
  const hasMore = cars.length > INITIAL_LIMIT;

  const gridClass =
    cars.length === 1 ? 'max-w-sm mx-auto' :
    cars.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
    cars.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' :
    'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
            Vintage Cars <span className="text-emerald-600">Available in {locationName}</span>
          </h2>
          <p className="text-gray-500 mt-3">Classic &amp; heritage vehicles · Chauffeur included</p>
        </div>

        <div className={`grid gap-6 ${gridClass}`}>
          {visible.map((car, idx) => (
            <div
              key={car.id}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              style={{ animation: `vcg-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 70}ms forwards`, opacity: 0 }}
            >
              <div className="relative h-44 bg-emerald-50 flex items-center justify-center">
                {car.sideImage ? (
                  <Image
                    src={car.sideImage}
                    alt={car.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  />
                ) : (
                  <CarIcon className="w-16 h-16 text-emerald-300" strokeWidth={1.3} />
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-3">
                  {car.brands?.name && (
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">{car.brands.name}</p>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                  {car.tagline && <p className="text-sm text-gray-500 mt-0.5">{car.tagline}</p>}
                  {car.seatingCapacity && (
                    <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1">
                      <Users className="w-3.5 h-3.5" /> {car.seatingCapacity} Seater
                    </p>
                  )}
                </div>

                {car.highlight && (
                  <p className="text-center text-xs bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 mb-3 font-medium">
                    {car.highlight}
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5 mt-auto pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${cars.length} Vintage Cars ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          * Prices may vary based on vendor availability. Decoration &amp; chauffeur included.
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vcg-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="vcg-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
