'use client';

import { useState } from 'react';
import Image from 'next/image';

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
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-2 text-center">
          Vintage Cars Available in {locationName}
        </h2>
        <p className="text-center text-gray-500 mb-10">Classic &amp; heritage vehicles · Chauffeur included</p>

        <div className={`grid gap-6 ${gridClass}`}>
          {visible.map((car) => (
            <div
              key={car.id}
              className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                car.isPopular ? 'ring-2 ring-amber-500 scale-[1.02]' : 'border border-gray-200'
              }`}
            >
              {car.isPopular && (
                <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                  <span className="bg-amber-700 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                    ⭐ POPULAR
                  </span>
                </div>
              )}

              <div className={`relative h-44 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center ${car.isPopular ? 'mt-6' : ''}`}>
                {car.sideImage ? (
                  <Image
                    src={car.sideImage}
                    alt={car.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  />
                ) : (
                  <span className="text-7xl">🚗</span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-3">
                  {car.brands?.name && (
                    <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">{car.brands.name}</p>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                  {car.tagline && <p className="text-sm text-gray-500 mt-0.5">{car.tagline}</p>}
                  {car.seatingCapacity && (
                    <p className="text-xs text-gray-400 mt-0.5">{car.seatingCapacity} Seater</p>
                  )}
                </div>

                {car.highlight && (
                  <p className="text-center text-xs bg-amber-50 text-amber-800 rounded-full px-3 py-1 mb-3 font-medium">
                    {car.highlight}
                  </p>
                )}

                <div className="text-center mt-auto">
                  <p className="text-sm font-semibold text-amber-700">Get Quote</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-amber-700 text-amber-700 font-semibold text-sm hover:bg-amber-700 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${cars.length} Vintage Cars ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          * Prices may vary based on vendor availability. Decoration &amp; chauffeur included.
        </p>
      </div>
    </section>
  );
}
