'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, MapPin, Users, Car, IndianRupee, Check, Briefcase, Fuel } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  nightChargesApply: boolean;
  nightChargeAmount: number | null;
  isPopular: boolean;
}

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  seatingCapacity: number;
  image: string | null;
  exampleVehicles: string | null;
  acType: string | null;
  luggageCapacity: string | null;
  fuelType: string | null;
  packages: Package[];
}

interface PackagesGridProps {
  categories: VehicleCategory[];
  title?: string;
  locationName?: string;
  locationSlug?: string;
  serviceSlug?: string;
}

export function PackagesGrid({
  categories = [],
  title,
  locationName,
  locationSlug,
  serviceSlug = 'car-rental',
}: PackagesGridProps) {
  const displayTitle = title || `Car Rental Packages${locationName ? ` in ${locationName}` : ''}`;

  // Parse example vehicles from JSON string
  const parseExampleVehicles = (value: string | null): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If it's a comma-separated string
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
  };

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">{displayTitle}</h2>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No packages available at this location currently.</p>
            <p className="text-gray-400 text-sm mt-2">Please check back later or try a different location.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-3 text-center">{displayTitle}</h2>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Choose from our range of vehicle categories and flexible rental packages
        </p>

        <div className="space-y-10">
          {categories.map((category) => {
            const exampleVehicles = parseExampleVehicles(category.exampleVehicles);

            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Category Image */}
                    {category.image && (
                      <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/fleet/honda-city.jpg';
                          }}
                        />
                      </div>
                    )}

                    {/* Category Info */}
                    <div className="flex-1 text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-white/90">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {category.seatingCapacity} Seater
                        </span>
                        {category.acType && (
                          <span className="flex items-center gap-1.5">
                            <Car className="w-4 h-4" />
                            {category.acType}
                          </span>
                        )}
                        {category.luggageCapacity && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            {category.luggageCapacity}
                          </span>
                        )}
                        {category.fuelType && (
                          <span className="flex items-center gap-1.5">
                            <Fuel className="w-4 h-4" />
                            {category.fuelType}
                          </span>
                        )}
                      </div>
                      {exampleVehicles.length > 0 && (
                        <p className="mt-2 text-sm text-white/80">
                          e.g., {exampleVehicles.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Starting Price */}
                    {category.packages.length > 0 && (
                      <div className="md:text-right">
                        <p className="text-white/80 text-sm">Starting from</p>
                        <p className="text-3xl font-bold text-white">
                          ₹{Math.min(...category.packages.map((p) => p.basePrice)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Packages Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {category.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                          pkg.isPopular
                            ? 'border-orange-500 bg-orange-50/50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {/* Popular Badge */}
                        {pkg.isPopular && (
                          <div className="absolute -top-2.5 left-4 bg-orange-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            Popular
                          </div>
                        )}

                        {/* Package Name */}
                        <h4 className="font-bold text-lg text-gray-900 mb-3">
                          {pkg.name || `${pkg.hours}hr / ${pkg.kms}km`}
                        </h4>

                        {/* Package Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>{pkg.hours} Hours</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span>{pkg.kms} Kilometers</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{pkg.basePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 font-medium mb-3">All inclusive</p>

                        {/* Extra Charges */}
                        <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-100">
                          <p className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            Extra km: ₹{pkg.extraKmCharge}/km
                          </p>
                          <p className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            Extra hour: ₹{pkg.extraHourCharge}/hr
                          </p>
                          {pkg.nightChargesApply && pkg.nightChargeAmount && (
                            <p className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-500" />
                              Night charge: ₹{pkg.nightChargeAmount}
                            </p>
                          )}
                          <p className="flex items-center gap-1 text-amber-600">
                            <IndianRupee className="w-3 h-3" />
                            Toll/Parking extra (as applicable)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
