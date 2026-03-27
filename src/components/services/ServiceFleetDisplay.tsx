'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Car, Loader2, ChevronRight, Users, Fuel, Settings } from 'lucide-react';

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
}

export function ServiceFleetDisplay({
  serviceSlug,
  title = 'Our Fleet',
  showCategories = true,
  limit = 12,
  showViewAll = true,
  priceUnit = '/day',
  locationSlug = '',
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

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our wide selection of vehicles available for rent
          </p>
        </div>

        {/* Category Tabs */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === category.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Fleet Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : fleet.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No vehicles found in this category</p>
          </div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fleet.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition group"
            >
              {/* Vehicle Image */}
              <div className="relative h-48 bg-gray-100">
                {vehicle.image ? (
                  <Image
                    src={vehicle.image}
                    alt={vehicle.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {vehicle.category && vehicle.category !== 'Uncategorized' && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    {vehicle.category}
                  </span>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="p-4">
                {vehicle.brand && (() => {
                  const name = vehicle.name.toLowerCase();
                  const brand = vehicle.brand.toLowerCase();
                  const brandFirst = brand.split(/[\s-]/)[0];
                  return !name.startsWith(brand) && !name.startsWith(brandFirst);
                })() && (
                  <div className="flex items-center gap-2 mb-2">
                    {vehicle.brandLogo && (
                      <Image
                        src={vehicle.brandLogo}
                        alt={vehicle.brand}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    )}
                    <span className="text-sm text-gray-500">{vehicle.brand}</span>
                  </div>
                )}

                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {vehicle.name}
                </h3>

                {/* Specs */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                  {vehicle.seatingCapacity && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{vehicle.seatingCapacity} Seats</span>
                    </div>
                  )}
                  {vehicle.fuelType && (
                    <div className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.fuelType}</span>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      <span>{vehicle.transmission}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                {vehicle.basePricePerDay && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Starting from</p>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{vehicle.basePricePerDay.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* View All Button */}
        {showViewAll && fleet.length >= limit && (
          <div className="text-center mt-8">
            <Link
              href={`/${serviceSlug}#locations`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View All Vehicles
              <ChevronRight className="w-5 h-5" />
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
