'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

interface Car {
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
  cars: Car[];
  locationName: string;
}

export function WeddingFleetSection({ cars, locationName }: Props) {
  const [activeBrand, setActiveBrand] = useState('All');

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    cars.forEach(c => { if (c.brands?.name) set.add(c.brands.name); });
    return ['All', ...Array.from(set).sort()];
  }, [cars]);

  const filtered = activeBrand === 'All'
    ? cars
    : cars.filter(c => c.brands?.name === activeBrand);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-2">Wedding Cars Available in {locationName}</h2>
        <p className="text-gray-500 mb-6">Premium luxury fleet for your special day</p>

        {/* Brand Filter Pills */}
        {brands.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeBrand === brand
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No cars found for this brand.</div>
        ) : (
          <div className={`grid gap-6 ${
            filtered.length === 1 ? 'max-w-sm mx-auto' :
            filtered.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
            filtered.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' :
            'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filtered.map((car) => (
              <div key={car.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-rose-100 overflow-hidden flex flex-col">
                <div className="relative h-44 bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                  {car.sideImage ? (
                    <Image src={car.sideImage} alt={car.name} fill className="object-contain p-3" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" />
                  ) : (
                    <span className="text-7xl">🚗</span>
                  )}
                  {car.isPopular && (
                    <span className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐ Popular</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{car.name}</h3>
                    {car.rating && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                        ★ {car.rating}
                      </span>
                    )}
                  </div>
                  {car.brands?.name && (
                    <p className="text-xs text-rose-400 font-medium mb-1">{car.brands.name}</p>
                  )}
                  {car.tagline && <p className="text-xs text-gray-500 mb-3 flex-1">{car.tagline}</p>}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    {car.basePricePerDay ? (
                      <p className="text-base font-bold text-rose-700">
                        <span className="text-xs font-normal text-gray-500">Starting From </span>
                        ₹{car.basePricePerDay.toLocaleString('en-IN')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-rose-700">Get Quote</p>
                    )}
                    {car.highlight && <p className="text-xs text-green-600 mt-1">{car.highlight}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          * Prices may vary based on vendor quotes. Decoration & chauffeur included.
        </p>
      </div>
    </section>
  );
}
