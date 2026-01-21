'use client';

import React, { useState, useMemo } from 'react';
import { Crown, Filter, SlidersHorizontal, X } from 'lucide-react';
import { LuxuryVehicleCard, LuxuryVehicle } from './LuxuryVehicleCard';
import { LuxuryBookingModal } from './LuxuryBookingModal';

interface LuxuryVehicleGridProps {
  vehicles: LuxuryVehicle[];
  location?: string;
  locationSlug?: string;
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'featured';
}

const VEHICLE_TYPES = ['All', 'Luxury Sedan', 'Luxury SUV', 'Premium Sedan', 'Sports Car', 'Convertible', 'Limousine'];
const BRANDS = ['All', 'Mercedes-Benz', 'BMW', 'Audi', 'Jaguar', 'Land Rover', 'Porsche', 'Bentley', 'Rolls-Royce'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹6,000/day', min: 0, max: 6000 },
  { label: '₹6,000 - ₹8,000/day', min: 6000, max: 8000 },
  { label: '₹8,000 - ₹15,000/day', min: 8000, max: 15000 },
  { label: 'Above ₹15,000/day', min: 15000, max: Infinity },
];

export function LuxuryVehicleGrid({
  vehicles,
  location,
  locationSlug,
  title,
  subtitle,
  showFilters = true,
  maxItems,
  layout = 'grid',
}: LuxuryVehicleGridProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<LuxuryVehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (selectedType !== 'All') {
      filtered = filtered.filter((v) => v.type === selectedType);
    }

    if (selectedBrand !== 'All') {
      filtered = filtered.filter((v) => v.brand === selectedBrand);
    }

    filtered = filtered.filter(
      (v) => v.basePrice >= selectedPriceRange.min && v.basePrice < selectedPriceRange.max
    );

    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }, [vehicles, selectedType, selectedBrand, selectedPriceRange, maxItems]);

  const handleBookNow = (vehicle: LuxuryVehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const clearFilters = () => {
    setSelectedType('All');
    setSelectedBrand('All');
    setSelectedPriceRange(PRICE_RANGES[0]);
  };

  const hasActiveFilters = selectedType !== 'All' || selectedBrand !== 'All' || selectedPriceRange.min !== 0;

  const displayTitle = title || `Luxury Cars${location ? ` in ${location}` : ''}`;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />
            Premium Collection
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {displayTitle}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <>
            {/* Desktop Filters */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-4 mb-10">
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
                >
                  {BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === 'All' ? 'All Brands' : brand}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Price Filter */}
              <div className="relative">
                <select
                  value={selectedPriceRange.label}
                  onChange={(e) => {
                    const range = PRICE_RANGES.find((r) => r.label === e.target.value);
                    if (range) setSelectedPriceRange(range);
                  }}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.label} value={range.label}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <div className="md:hidden flex justify-center mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Filters</h3>
                    <button onClick={() => setShowMobileFilters(false)}>
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                      >
                        {VEHICLE_TYPES.map((type) => (
                          <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                      >
                        {BRANDS.map((brand) => (
                          <option key={brand} value={brand}>{brand === 'All' ? 'All Brands' : brand}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <select
                        value={selectedPriceRange.label}
                        onChange={(e) => {
                          const range = PRICE_RANGES.find((r) => r.label === e.target.value);
                          if (range) setSelectedPriceRange(range);
                        }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                      >
                        {PRICE_RANGES.map((range) => (
                          <option key={range.label} value={range.label}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={clearFilters}
                      className="flex-1 border border-gray-200 rounded-xl py-3 font-medium text-gray-700"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="flex-1 bg-purple-900 text-white rounded-xl py-3 font-medium"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">
            Showing <span className="font-semibold text-gray-900">{filteredVehicles.length}</span> luxury vehicles
            {location && <span> in {location}</span>}
          </p>
        </div>

        {/* Vehicle Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16">
            <Crown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters to see more options</p>
            <button
              onClick={clearFilters}
              className="bg-purple-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : layout === 'featured' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredVehicles.map((vehicle, index) => (
              <LuxuryVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                location={location}
                locationSlug={locationSlug}
                onBookNow={handleBookNow}
                variant={index === 0 ? 'featured' : 'default'}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <LuxuryVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                location={location}
                locationSlug={locationSlug}
                onBookNow={handleBookNow}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <LuxuryBookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vehicle={selectedVehicle}
        location={location}
        locationSlug={locationSlug}
      />
    </section>
  );
}

export default LuxuryVehicleGrid;
