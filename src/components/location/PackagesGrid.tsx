'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Clock, MapPin, Users, Briefcase, Fuel, Wind, Star, Car } from 'lucide-react';

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

  // Track selected package index per category
  const [selectedIdx, setSelectedIdx] = useState<Record<string, number>>({});

  const getSelectedPkg = (category: VehicleCategory): Package | undefined => {
    const idx = selectedIdx[category.id] ?? 0;
    return category.packages[idx] ?? category.packages[0];
  };

  const parseExampleVehicles = (value: string | null): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
  };

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container-custom text-center py-12">
          <h2 className="text-3xl font-bold mb-4">{displayTitle}</h2>
          <p className="text-slate-500">No packages available at this location currently.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full mb-3">
            <Car className="w-3.5 h-3.5" />
            Fleet & Pricing
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">{displayTitle}</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Choose from our range of vehicle categories and flexible rental packages
          </p>
        </div>

        <div className="space-y-5">
          {categories.map((category) => {
            const selectedPkg = getSelectedPkg(category);
            const exampleVehicles = parseExampleVehicles(category.exampleVehicles);
            const currentIdx = selectedIdx[category.id] ?? 0;

            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">

                  {/* LEFT — Vehicle Image */}
                  <div className="lg:w-56 flex-shrink-0 bg-gradient-to-br from-green-50/60 to-slate-50 flex items-center justify-center p-6">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={200}
                        height={130}
                        sizes="224px"
                        quality={70}
                        className="object-contain drop-shadow-sm max-h-32 w-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/fleet/honda-city.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-36 h-24 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Car className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* MIDDLE — Info + Package Selector */}
                  <div className="flex-1 p-5 lg:p-6 border-t lg:border-t-0 lg:border-l border-slate-100">
                    {/* Vehicle Name */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                      {exampleVehicles.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          e.g., {exampleVehicles.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Specs */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {category.seatingCapacity} Seater
                      </span>
                      {category.acType && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Wind className="w-3 h-3" />
                          {category.acType}
                        </span>
                      )}
                      {category.luggageCapacity && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Briefcase className="w-3 h-3" />
                          {category.luggageCapacity}
                        </span>
                      )}
                      {category.fuelType && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Fuel className="w-3 h-3" />
                          {category.fuelType}
                        </span>
                      )}
                    </div>

                    {/* Package Tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.packages.map((pkg, idx) => (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedIdx((prev) => ({ ...prev, [category.id]: idx }))}
                          className={`relative px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                            currentIdx === idx
                              ? 'bg-green-600 text-white border-green-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-700'
                          }`}
                        >
                          {pkg.isPopular && currentIdx !== idx && (
                            <Star className="absolute -top-1.5 -right-1.5 w-3 h-3 text-green-500 fill-green-500" />
                          )}
                          {pkg.hours}hr / {pkg.kms}km
                        </button>
                      ))}
                    </div>

                    {/* Selected Package Info */}
                    {selectedPkg && (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-500" />
                          {selectedPkg.hours} Hours
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-green-500" />
                          {selectedPkg.kms} Km included
                        </span>
                        <span className="text-slate-500">+₹{selectedPkg.extraKmCharge}/extra km</span>
                        <span className="text-slate-500">+₹{selectedPkg.extraHourCharge}/extra hr</span>
                        {selectedPkg.nightChargesApply && selectedPkg.nightChargeAmount && (
                          <span className="text-slate-500">Night ₹{selectedPkg.nightChargeAmount}</span>
                        )}
                        <span className="text-amber-700 font-medium">Toll/Parking extra</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT — Price + Book */}
                  <div className="lg:w-52 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 p-5 lg:p-6 flex flex-col items-center justify-center gap-4 bg-green-50/40">
                    {selectedPkg && (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">All inclusive</p>
                          <p className="text-3xl font-bold text-slate-900">
                            ₹{selectedPkg.basePrice.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedPkg.hours}hr / {selectedPkg.kms}km
                          </p>
                        </div>

                        <p className="text-xs text-green-700 font-medium text-center">
                          ✓ Free cancellation
                        </p>
                      </>
                    )}
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
