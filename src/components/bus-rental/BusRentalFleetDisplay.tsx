'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bus, Car, Truck, HardHat, ChevronRight, ArrowRight, LayoutGrid, Users, Fuel, Settings } from 'lucide-react';

/* Icon naam se aata hai, component se nahi — server component se function
   pass karna React allow nahi karta. */
const FLEET_ICONS = { bus: Bus, car: Car, truck: Truck, equipment: HardHat } as const;

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandLogo?: string | null;
  category: string;
  categorySlug?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  seatingCapacity?: number | null;
  engineCC?: number | null;
  mileage?: string | null;
  image?: string | null;
  specs?: any;
  features?: string[] | null;
  basePricePerDay?: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
}

interface BusRentalFleetDisplayProps {
  serviceSlug: string;
  title?: string;
  showCategories?: boolean;
  limit?: number;
  showViewAll?: boolean;
  priceUnit?: string;
  /* Neeche ke teen props isliye hain taaki yahi section doosri services
     par bhi lag sake. Na dene par bus-rental jaisa hi rehta hai. */
  icon?: keyof typeof FLEET_ICONS;
  eyebrow?: string;
  subtitle?: string;
  viewAllLabel?: string;
  /** Section ke upar ka banner. `null` dene par skyline ki jagah
   *  halka gradient + dotted pattern aata hai. */
  bannerImage?: string | null;
}

function vehicleSpecChips(vehicle: Vehicle): { icon: typeof Users; label: string }[] {
  const parts: { icon: typeof Users; label: string }[] = [];
  if (vehicle.seatingCapacity) parts.push({ icon: Users, label: `${vehicle.seatingCapacity} Seats` });
  if (vehicle.fuelType) parts.push({ icon: Fuel, label: vehicle.fuelType });
  if (vehicle.transmission) parts.push({ icon: Settings, label: vehicle.transmission });
  return parts;
}

export function BusRentalFleetDisplay({
  serviceSlug,
  title = 'Choose Your Bus or Tempo Traveller',
  showCategories = true,
  limit = 12,
  showViewAll = true,
  priceUnit = '/day',
  icon = 'bus',
  eyebrow = 'Explore & Ride',
  subtitle = 'AC & Non-AC options across every group size \u2014 from a 9-seater Tempo Traveller to a 50-seater luxury coach',
  viewAllLabel = 'View All Buses',
  bannerImage = '/images/sections/routes-skyline-bg.png',
}: BusRentalFleetDisplayProps) {
  const Icon = FLEET_ICONS[icon] ?? Bus;
  const [allFleet, setAllFleet] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFleet() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('limit', String(limit));

        const response = await fetch(`/api/services/${serviceSlug}/fleet?${params}`);
        const data = await response.json();

        if (data.success) {
          setAllFleet(data.fleet || []);
          if (data.categories) setCategories(data.categories);
        } else {
          setError(data.error || 'Failed to fetch fleet');
        }
      } catch (err) {
        setError('Failed to fetch fleet');
        console.error('Error fetching fleet:', err);
      } finally {
        setLoading(false);
        setInitialLoaded(true);
      }
    }

    fetchFleet();
  }, [serviceSlug, limit]);

  const fleet = selectedCategory
    ? allFleet.filter((v) => v.categorySlug === selectedCategory || v.category === categories.find(c => c.slug === selectedCategory)?.name)
    : allFleet;

  if (!initialLoaded) return null;
  if (!loading && allFleet.length === 0 && categories.length === 0) return null;

  const bookHref = `/${serviceSlug}#locations`;

  return (
    <section className="relative bg-white py-16 md:py-20 overflow-hidden">
      {/* Fixed-height banner — stays the same regardless of how many rows the fleet grid grows to */}
      {bannerImage ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-cover bg-top opacity-90"
            style={{ backgroundImage: `url('${bannerImage}')` }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-transparent via-transparent to-white" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage:
                'radial-gradient(420px 320px at 5% 8%, #000 0%, transparent 72%), radial-gradient(420px 320px at 95% 30%, #000 0%, transparent 72%)',
              maskImage:
                'radial-gradient(420px 320px at 5% 8%, #000 0%, transparent 72%), radial-gradient(420px 320px at 95% 30%, #000 0%, transparent 72%)',
            }}
          />
        </>
      )}
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Icon className="w-4 h-4" />
            {eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-500">{subtitle}</p>
        </div>

        {/* Category Tabs */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2.5 mb-10">
            <button
              onClick={() => setSelectedCategory('')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              All Vehicles
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${selectedCategory === category.slug
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
              >
                {category.icon ? <span>{category.icon}</span> : <Icon className="w-3.5 h-3.5" />}
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Fleet Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-[138px] bg-gray-100 rounded-[6px] mb-4" />
                <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : fleet.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No vehicles found in this category</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-6">
            {fleet.map((vehicle) => (
              <div key={vehicle.id} className="group relative flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl p-3 overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 hover:scale-[1.04] hover:z-10 transition-all duration-300">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

                <div className="relative h-[92px] bg-gray-50 rounded-lg mb-2.5 overflow-hidden">
                  {vehicle.image ? (
                    <Image
                      src={vehicle.image}
                      alt={vehicle.name}
                      fill
                      className="object-contain group-hover:scale-125 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Icon className="w-9 h-9 text-gray-200" />
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-extrabold text-gray-900 leading-snug line-clamp-2">
                    {vehicle.name}
                  </h3>
                  {vehicle.category && vehicle.category !== 'Uncategorized' && (
                    <span className="shrink-0 max-w-[90px] truncate text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {vehicle.category}
                    </span>
                  )}
                </div>

                {vehicleSpecChips(vehicle).length > 0 && (
                  <div className="flex flex-col gap-1 mb-3">
                    {vehicleSpecChips(vehicle).map((spec) => (
                      <div key={spec.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <spec.icon className="w-3 h-3 text-emerald-500 shrink-0" />
                        {spec.label}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                <div className="h-px bg-gray-100 mb-2.5" />

                <div className="flex items-center justify-between">
                  {vehicle.basePricePerDay ? (
                    <div>
                      <span className="text-[15px] font-black text-gray-900">
                        ₹{vehicle.basePricePerDay.toLocaleString()}
                      </span>
                      <span className="text-[10.5px] font-semibold text-gray-400">{priceUnit}</span>
                    </div>
                  ) : <span />}
                  <Link
                    href={bookHref}
                    aria-label={`Book ${vehicle.name}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {showViewAll && fleet.length >= limit && (
          <div className="text-center mt-10">
            <Link
              href={`/${serviceSlug}#locations`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-800 font-bold text-sm rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
            >
              {viewAllLabel}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default BusRentalFleetDisplay;
