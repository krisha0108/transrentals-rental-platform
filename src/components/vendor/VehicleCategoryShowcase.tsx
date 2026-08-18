'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Car, Bike, Bus, Truck, Construction } from 'lucide-react';

const CATEGORIES = [
  { icon: Car, name: 'Car Rental', tagline: 'Sedans, SUVs & hatchbacks', image: '/images/categories/car.png' },
  { icon: Bike, name: 'Bike Rental', tagline: 'Scooters & motorcycles', image: '/images/categories/bike.png' },
  { icon: Bus, name: 'Bus Rental', tagline: 'Mini & luxury coaches', image: '/images/categories/bus.png' },
  { icon: Truck, name: 'Truck Rental', tagline: 'Mini trucks & tempos', image: '/images/categories/truck.png' },
  { icon: Construction, name: 'Equipment Rental', tagline: 'JCBs & heavy machinery', image: '/images/categories/equipment.png' },
];

const CYCLE_MS = 3000;

export function VehicleCategoryShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      setActive((prev) => (prev + 1) % CATEGORIES.length);
    }, CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl ring-1 ring-gray-200 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex aspect-square sm:aspect-auto sm:h-[440px]">
        {CATEGORIES.map((category, i) => {
          const isActive = i === active;
          return (
            <button
              key={category.name}
              type="button"
              onClick={() => setActive(i)}
              aria-label={category.name}
              className="relative h-full overflow-hidden bg-white transition-[flex-grow] duration-700 ease-in-out"
              style={{ flexGrow: isActive ? 7 : 1, flexBasis: 0 }}
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(min-width: 640px) 60vw, 90vw"
                className={`object-contain object-center transition-all duration-700 ${
                  isActive ? 'grayscale-0 p-6' : 'grayscale opacity-70 p-1'
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t transition-all duration-700 ${
                  isActive ? 'from-black/85 via-black/10 to-transparent' : 'from-black/60 via-black/25 to-black/10'
                }`}
              />
              <div className="absolute inset-y-0 right-0 w-px bg-white/20" />

              <div className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center flex-shrink-0">
                <category.icon className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h3
                  className={`font-extrabold text-white leading-tight whitespace-nowrap transition-all duration-700 ${
                    isActive ? 'text-lg sm:text-xl' : 'text-[0px] sm:text-xs opacity-0 sm:opacity-100'
                  }`}
                >
                  {category.name}
                </h3>
                <p
                  className={`text-white/75 mt-1 max-w-xs overflow-hidden transition-all duration-500 ${
                    isActive ? 'text-xs sm:text-sm max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {category.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {CATEGORIES.map((category, i) => (
          <span
            key={category.name}
            className={`h-1 rounded-full transition-all duration-500 ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
