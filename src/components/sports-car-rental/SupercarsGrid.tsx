'use client';

import { useState, useMemo } from 'react';
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

const SEAT_GROUPS = [
  { label: 'All', min: 0, max: 9999 },
  { label: '2 Seater', min: 2, max: 2 },
  { label: '4 Seater', min: 4, max: 4 },
  { label: '5+ Seater', min: 5, max: 9999 },
];

const INITIAL_LIMIT = 8;

export function SupercarsGrid({ cars, locationName }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeSeat, setActiveSeat] = useState('All');

  const brands = useMemo(() => {
    const set = new Set<string>();
    cars.forEach(c => { if (c.brands?.name) set.add(c.brands.name); });
    return set.size > 1 ? ['All', ...Array.from(set).sort()] : [];
  }, [cars]);

  const seatGroups = useMemo(() => {
    return SEAT_GROUPS.filter(g => {
      if (g.label === 'All') return true;
      return cars.some(c => (c.seatingCapacity ?? 0) >= g.min && (c.seatingCapacity ?? 0) <= g.max);
    });
  }, [cars]);

  const filtered = useMemo(() => {
    return cars.filter(c => {
      const brandOk = activeBrand === 'All' || c.brands?.name === activeBrand;
      const sg = SEAT_GROUPS.find(g => g.label === activeSeat);
      const seatOk = activeSeat === 'All' || !sg
        ? true
        : (c.seatingCapacity ?? 0) >= sg.min && (c.seatingCapacity ?? 0) <= sg.max;
      return brandOk && seatOk;
    });
  }, [cars, activeBrand, activeSeat]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = filtered.length > INITIAL_LIMIT;

  const gridClass =
    filtered.length === 1 ? 'max-w-sm mx-auto' :
    filtered.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
    filtered.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' :
    'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-2 text-center">
          Supercars Available in {locationName}
        </h2>
        <p className="text-center text-gray-500 mb-5">Exotic &amp; luxury fleet · Chauffeur or self-drive</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          {brands.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Brand:</span>
              {brands.map(b => (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeBrand === b
                      ? 'bg-red-700 text-white border-red-700 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-500 hover:text-red-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {seatGroups.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Seats:</span>
              {seatGroups.map(g => (
                <button
                  key={g.label}
                  onClick={() => setActiveSeat(g.label)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeSeat === g.label
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600'
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
        <div className={`grid gap-6 ${gridClass}`}>
          {visible.map((car) => (
            <div
              key={car.id}
              className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                car.isPopular ? 'ring-2 ring-red-500 scale-[1.02]' : 'border border-gray-200'
              }`}
            >
              {car.isPopular && (
                <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                  <span className="bg-red-700 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                    ⭐ POPULAR
                  </span>
                </div>
              )}

              <div className={`relative h-44 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center ${car.isPopular ? 'mt-6' : ''}`}>
                {car.sideImage ? (
                  <Image
                    src={car.sideImage}
                    alt={car.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  />
                ) : (
                  <span className="text-7xl">🏎️</span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-3">
                  {car.brands?.name && (
                    <p className="text-xs text-red-700 font-semibold uppercase tracking-wide mb-1">{car.brands.name}</p>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                  {car.tagline && <p className="text-sm text-gray-500 mt-0.5">{car.tagline}</p>}
                  {car.seatingCapacity && (
                    <p className="text-xs text-gray-400 mt-0.5">{car.seatingCapacity} Seater</p>
                  )}
                </div>

                {car.highlight && (
                  <p className="text-center text-xs bg-red-50 text-red-800 rounded-full px-3 py-1 mb-3 font-medium">
                    {car.highlight}
                  </p>
                )}

                <div className="text-center mt-auto">
                  <p className="text-sm font-semibold text-red-700">Get Quote</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* View All / Show Less button */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-red-700 text-red-700 font-semibold text-sm hover:bg-red-700 hover:text-white transition-all"
            >
              {showAll ? (
                <>Show Less ↑</>
              ) : (
                <>View All {filtered.length} Supercars ↓</>
              )}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          * Prices may vary based on vendor availability. Security deposit required.
        </p>
      </div>
    </section>
  );
}
