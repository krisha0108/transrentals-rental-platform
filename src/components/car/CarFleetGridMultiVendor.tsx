'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Fuel,
  Settings2,
  Calendar,
  Clock,
  MapPin,
  Users,
  TrendingDown,
  Car,
  Gauge,
  X,
  ArrowLeft,
  Pencil,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SelfDriveQuoteRequestModal } from './SelfDriveQuoteRequestModal';
import { calculateRentalDuration } from '@/lib/utils/duration';

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  kmLimitPerDay?: number;
  extraKmCharge?: number;
  deposit: number;
  isVerified: boolean;
}

interface AggregatedCar {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  categoryId?: string;
  categoryName?: string;
  sideImage?: string;
  fuelType?: string;
  transmission?: string;
  engineCC?: number;
  mileage?: string;
  seatingCapacity?: number;
  features?: string[];
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

interface CarFleetGridMultiVendorProps {
  vehicles: AggregatedCar[];
  city: string;
  citySlug: string;
  locationId: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  brands?: string[];
  categories?: { name: string; slug: string }[];
}

// Filter options
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 1000 },
  { label: '₹1000 - ₹1500', min: 1000, max: 1500 },
  { label: '₹1500 - ₹2500', min: 1500, max: 2500 },
  { label: 'Above ₹2500', min: 2500, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'vendors', label: 'Most Vendors' },
  { value: 'name', label: 'Name (A-Z)' },
];

const CAR_TYPES = ['All', 'Hatchback', 'Sedan', 'Compact SUV', 'SUV', 'MUV', 'Luxury'];
const TRANSMISSION_TYPES = ['All', 'Manual', 'Automatic'];
const SEAT_OPTIONS = ['All', '5 Seater', '7 Seater', '8+ Seater'];

export function CarFleetGridMultiVendor({
  vehicles,
  city,
  citySlug,
  locationId,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  brands = [],
  categories = [],
}: CarFleetGridMultiVendorProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedSeats, setSelectedSeats] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('price_low');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCar, setSelectedCar] = useState<AggregatedCar | null>(null);
  const [editingDates, setEditingDates] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState(pickupDate);
  const [editPickupTime, setEditPickupTime] = useState(pickupTime);
  const [editDropDate, setEditDropDate] = useState(dropDate);
  const [editDropTime, setEditDropTime] = useState(dropTime);

  // Calculate rental duration
  // Calculate rental duration with time precision
  const rentalDuration = useMemo(() => {
    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      return { formatted: '1 day', totalDays: 1 };
    }
    return calculateRentalDuration(pickupDate, pickupTime, dropDate, dropTime);
  }, [pickupDate, dropDate, pickupTime, dropTime]);

  const rentalDays = rentalDuration.totalDays; // For pricing
  const durationText = rentalDuration.formatted; // For display

  // Get unique brands from data
  const availableBrands = useMemo(() => {
    const brandSet = new Set(vehicles.map((v) => v.brandName));
    return ['All', ...Array.from(brandSet)];
  }, [vehicles]);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Filter by type/category
    if (selectedType !== 'All') {
      result = result.filter((v) => v.categoryName === selectedType);
    }

    // Filter by brand
    if (selectedBrand !== 'All') {
      result = result.filter((v) => v.brandName === selectedBrand);
    }

    // Filter by transmission
    if (selectedTransmission !== 'All') {
      result = result.filter((v) => v.transmission === selectedTransmission);
    }

    // Filter by seats
    if (selectedSeats !== 'All') {
      if (selectedSeats === '5 Seater') {
        result = result.filter((v) => v.seatingCapacity === 5);
      } else if (selectedSeats === '7 Seater') {
        result = result.filter((v) => v.seatingCapacity === 7);
      } else if (selectedSeats === '8+ Seater') {
        result = result.filter((v) => (v.seatingCapacity || 5) >= 8);
      }
    }

    // Filter by price
    const priceRange = PRICE_RANGES[selectedPriceRange];
    result = result.filter(
      (v) => v.lowestPrice >= priceRange.min && v.lowestPrice < priceRange.max
    );

    // Sort
    switch (sortBy) {
      case 'price_high':
        result.sort((a, b) => b.lowestPrice - a.lowestPrice);
        break;
      case 'vendors':
        result.sort((a, b) => b.vendorCount - a.vendorCount);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_low':
      default:
        result.sort((a, b) => a.lowestPrice - b.lowestPrice);
        break;
    }

    return result;
  }, [vehicles, selectedType, selectedBrand, selectedTransmission, selectedSeats, selectedPriceRange, sortBy]);

  // Format helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleApplyDates = () => {
    if (!editPickupDate || !editPickupTime || !editDropDate || !editDropTime) return;
    const params = new URLSearchParams({
      pickupDate: editPickupDate,
      pickupTime: editPickupTime,
      dropDate: editDropDate,
      dropTime: editDropTime,
    });
    router.push(`/self-drive-car-rentals/${citySlug}/cars?${params.toString()}`);
    setEditingDates(false);
  };

  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Handle quote request
  const handleGetQuote = (car: AggregatedCar) => {
    setSelectedCar(car);
    setShowQuoteModal(true);
  };

  const clearFilters = () => {
    setSelectedType('All');
    setSelectedBrand('All');
    setSelectedTransmission('All');
    setSelectedSeats('All');
    setSelectedPriceRange(0);
  };

  const hasActiveFilters =
    selectedType !== 'All' ||
    selectedBrand !== 'All' ||
    selectedTransmission !== 'All' ||
    selectedSeats !== 'All' ||
    selectedPriceRange !== 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Header with Trip Info */}
      <div className="bg-white border-b mt-8 border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Trip Summary */}
            {editingDates ? (
              <div className="flex items-center gap-3 flex-wrap w-full">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">{city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={editPickupDate}
                    onChange={(e) => setEditPickupDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={editPickupTime}
                    onChange={(e) => setEditPickupTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={editDropDate}
                    onChange={(e) => setEditDropDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={editDropTime}
                    onChange={(e) => setEditDropTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleApplyDates}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Apply"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingDates(false);
                    setEditPickupDate(pickupDate);
                    setEditPickupTime(pickupTime);
                    setEditDropDate(dropDate);
                    setEditDropTime(dropTime);
                  }}
                  className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/self-drive-car-rentals/${citySlug}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Self-Drive Cars in {city}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(pickupDate)} {formatTime(pickupTime)}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(dropDate)} {formatTime(dropTime)}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {durationText}
                      </span>
                      <button
                        onClick={() => setEditingDates(true)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                        title="Edit dates"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-2 bg-blue-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                        !
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Car Type Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Car Type</h4>
                <div className="space-y-2">
                  {CAR_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedType === type
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Brand</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedBrand === brand
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Transmission</h4>
                <div className="space-y-2">
                  {TRANSMISSION_TYPES.map((trans) => (
                    <button
                      key={trans}
                      onClick={() => setSelectedTransmission(trans)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedTransmission === trans
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {trans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seats Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Seating</h4>
                <div className="space-y-2">
                  {SEAT_OPTIONS.map((seats) => (
                    <button
                      key={seats}
                      onClick={() => setSelectedSeats(seats)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedSeats === seats
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {seats}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() => setSelectedPriceRange(idx)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedPriceRange === idx
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & Results Count */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredVehicles.length}</span> cars
                available from multiple vendors
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle Grid */}
            {filteredVehicles.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No cars found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters to see more options
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((car, index) => (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      {car.sideImage ? (
                        <Image
                          src={car.sideImage}
                          alt={car.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Car className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {/* Category Badge */}
                      {car.categoryName && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                            {car.categoryName}
                          </span>
                        </div>
                      )}

                      {/* Vendor Count Badge */}
                      <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">
                          {car.vendorCount} vendor{car.vendorCount > 1 ? 's' : ''}
                        </span>
                      </div>

                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Brand */}
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                        {car.brandName}
                      </p>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {car.name}
                      </h3>

                      {/* Specs */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">{car.seatingCapacity || 5}</span>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Settings2 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">{car.transmission || 'Manual'}</span>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Fuel className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">{car.fuelType || 'Petrol'}</span>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Gauge className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">{car.mileage || '15 km/l'}</span>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded mb-3 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          Price may vary based on vendor quotes
                        </p>

                        {/* Get Quote Button */}
                        <Button
                          onClick={() => handleGetQuote(car)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Get Quote
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Mobile Car Type */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Car Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {CAR_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm transition',
                          selectedType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Brand */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm transition',
                          selectedBrand === brand
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Transmission */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Transmission</h3>
                  <div className="flex flex-wrap gap-2">
                    {TRANSMISSION_TYPES.map((trans) => (
                      <button
                        key={trans}
                        onClick={() => setSelectedTransmission(trans)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm transition',
                          selectedTransmission === trans
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {trans}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Price */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPriceRange(idx)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm transition',
                          selectedPriceRange === idx
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button className="flex-1 bg-blue-600 text-white" onClick={() => setShowFilters(false)}>
                  Show {filteredVehicles.length} Cars
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Request Modal */}
      <SelfDriveQuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedCar(null);
        }}
        carDetails={selectedCar ? {
          id: selectedCar.id,
          name: selectedCar.name,
          brandName: selectedCar.brandName,
          sideImage: selectedCar.sideImage,
          categoryName: selectedCar.categoryName,
          categoryId: selectedCar.categoryId,
          seatingCapacity: selectedCar.seatingCapacity,
          transmission: selectedCar.transmission,
          fuelType: selectedCar.fuelType,
        } : null}
        location={{ id: locationId, name: city, slug: citySlug }}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        dropDate={dropDate}
        dropTime={dropTime}
        rentalDays={rentalDays}
      />
    </div>
  );
}
