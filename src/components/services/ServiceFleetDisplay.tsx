'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Car, Bike, ChevronRight, ArrowRight, Users, Fuel, Gauge, KeyRound, LayoutGrid } from 'lucide-react';

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

interface ServiceFleetDisplayProps {
  serviceSlug: string;
  title?: string;
  showCategories?: boolean;
  limit?: number;
  showViewAll?: boolean;
  priceUnit?: string;
  locationSlug?: string;
  /** Opt-in: render the cards without any rate. Off by default, so every
   *  other service page keeps showing prices exactly as before. */
  hidePrices?: boolean;
}

export function ServiceFleetDisplay({
  serviceSlug,
  title = 'Our Fleet',
  showCategories = true,
  limit = 12,
  showViewAll = true,
  priceUnit = '/day',
  locationSlug = '',
  hidePrices = false,
}: ServiceFleetDisplayProps) {
  const [allFleet, setAllFleet] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all vehicles once — filtering is done client-side
  useEffect(() => {
    async function fetchFleet() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        if (locationSlug) params.set('location', locationSlug);

        const url = `/api/services/${serviceSlug}/fleet?${params}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setAllFleet(data.fleet || []);
          if (data.categories) {
            setCategories(data.categories);
          }
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
  }, [serviceSlug, limit, locationSlug]);

  // Client-side category filter — match by slug or name
  const fleet = selectedCategory
    ? allFleet.filter((v) => v.categorySlug === selectedCategory || v.category === categories.find(c => c.slug === selectedCategory)?.name)
    : allFleet;

  // Hide entire section until first fetch completes
  if (!initialLoaded) {
    return null;
  }

  // If no data at all, hide section
  if (!loading && allFleet.length === 0 && categories.length === 0) {
    return null;
  }

  const bookHref = locationSlug ? `/${serviceSlug}/${locationSlug}/bikes` : `/${serviceSlug}#locations`;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold tracking-widest text-emerald-600 mb-2">
            EXPLORE &amp; RIDE
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{title}</h2>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="w-8 h-0.5 rounded-full bg-emerald-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
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
              All Bikes
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
                {category.icon ? <span>{category.icon}</span> : <Bike className="w-3.5 h-3.5" />}
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Fleet Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded-full mb-4" />
                <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : fleet.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No vehicles found in this category</p>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {fleet.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all group flex flex-col p-4"
            >
              {/* Category badge */}
              {vehicle.category && vehicle.category !== 'Uncategorized' && (
                <span className="self-start bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
                  {vehicle.category}
                </span>
              )}

              {/* Vehicle Image */}
              <div className="relative h-36 md:h-40 mb-3">
                {vehicle.image ? (
                  <Image
                    src={vehicle.image}
                    alt={vehicle.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Bike className="w-14 h-14 text-gray-200" />
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">
                {vehicle.name}
              </h3>

              {/* Specs */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-4">
                {vehicle.engineCC && (
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    {vehicle.engineCC}cc
                  </span>
                )}
                {vehicle.mileage && (
                  <span className="inline-flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5" />
                    {vehicle.mileage}
                  </span>
                )}
                {vehicle.transmission && (
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    {vehicle.transmission}
                  </span>
                )}
                {vehicle.seatingCapacity && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {vehicle.seatingCapacity} Seats
                  </span>
                )}
              </div>

              {/* Price + Book Now */}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                {!hidePrices && vehicle.basePricePerDay ? (
                  <span className="text-lg font-black text-gray-900">
                    ₹{vehicle.basePricePerDay.toLocaleString()}
                    <span className="text-xs font-medium text-gray-400">{priceUnit}</span>
                  </span>
                ) : <span />}
                <Link
                  href={bookHref}
                  className="inline-flex items-center gap-1 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                  Book Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
              View All Bikes
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Simple category cards display
export function ServiceCategoriesDisplay({
  serviceSlug,
  title = 'Vehicle Categories',
}: {
  serviceSlug: string;
  title?: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/services/${serviceSlug}/fleet?limit=1`);
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [serviceSlug]);

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${serviceSlug}?category=${category.slug}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition group"
            >
              {category.icon && (
                <div className="text-4xl mb-4">{category.icon}</div>
              )}
              <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 text-sm">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServiceFleetDisplay;
