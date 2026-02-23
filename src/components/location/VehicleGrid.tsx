'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Fuel, Settings, Users } from 'lucide-react';

interface Vehicle {
  id: string | number;
  name: string;
  slug?: string;
  brand?: string;
  image: string;
  price: number;
  rating?: number;
  features?: string[];
  specs?: Record<string, string>;
}

interface VehicleGridProps {
  location?: string;
  locationSlug?: string;
  vehicles?: Vehicle[];
  title?: string;
  serviceSlug?: string;
  showViewDetails?: boolean;
  isClickable?: boolean;
}

export function VehicleGrid({
  location,
  locationSlug,
  vehicles = [],
  title,
  serviceSlug = 'bike-on-rent',
  showViewDetails = false,
  isClickable = false
}: VehicleGridProps) {
  const displayTitle = title || `Available Vehicles${location ? ` in ${location}` : ''}`;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {displayTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No vehicles available at this location currently.</p>
              <p className="text-gray-400 text-sm mt-2">Please check back later or try a different location.</p>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              // Use ID for vendor fleets, slug for legacy fleet
              const vehicleIdentifier = vehicle.slug || String(vehicle.id);

              const CardContent = (
                <div className={`${isClickable ? 'group' : ''} bg-white rounded-xl shadow-md ${isClickable ? 'hover:shadow-xl transition-all duration-300' : ''} overflow-hidden border border-gray-100 flex flex-col h-full`}>
                  {/* Vehicle Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden shrink-0">
                    <Image
                      src={vehicle.image}
                      alt={vehicle.name}
                      fill
                      className={`object-cover ${isClickable ? 'group-hover:scale-105' : ''} transition-transform duration-300`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/fleet/honda-city.jpg';
                      }}
                    />
                    {/* Rating Badge */}
                    {vehicle.rating && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold text-gray-800">{vehicle.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Brand */}
                    {vehicle.brand && (
                      <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">
                        {vehicle.brand}
                      </p>
                    )}

                    {/* Name */}
                    <h3 className={`text-lg font-bold text-gray-900 mb-2 ${isClickable ? 'group-hover:text-orange-600' : ''} transition-colors line-clamp-1`}>
                      {vehicle.name}
                    </h3>

                    {/* Specs */}
                    {vehicle.specs && Object.keys(vehicle.specs).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {vehicle.specs.engine && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Settings className="w-3 h-3" />
                            {vehicle.specs.engine}
                          </span>
                        )}
                        {vehicle.specs.mileage && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Fuel className="w-3 h-3" />
                            {vehicle.specs.mileage}
                          </span>
                        )}
                        {vehicle.specs.seating && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Users className="w-3 h-3" />
                            {vehicle.specs.seating}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Starting from</p>
                        <span className="text-2xl font-bold text-gray-900">₹{vehicle.price}</span>
                      </div>
                      {showViewDetails && (
                        <span className={`text-xs font-medium text-orange-600 ${isClickable ? 'group-hover:text-orange-700' : ''}`}>
                          View Details →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );

              if (isClickable) {
                return (
                  <Link
                    key={vehicle.id}
                    href={`/fleet/${vehicleIdentifier}${locationSlug ? `?location=${locationSlug}` : ''}`}
                    className="block h-full"
                  >
                    {CardContent}
                  </Link>
                );
              }

              return (
                <div key={vehicle.id} className="h-full">
                  {CardContent}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
