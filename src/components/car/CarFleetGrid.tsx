'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Star,
  Users,
  Fuel,
  Gauge,
  Settings2,
  MapPin,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  X,
  Check,
  IndianRupee,
  Shield,
  Briefcase,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarVehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  pricePerDay: number;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  type: string; // Hatchback, Sedan, SUV, MUV, Luxury
  seats: number;
  transmission: string; // Manual, Automatic
  fuelType: string;
  mileage: string;
  features: string[];
  available: boolean;
}

interface CarFleetGridProps {
  vehicles: CarVehicle[];
  city: string;
  citySlug: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
}

// Car type filters
const CAR_TYPES = ['All', 'Hatchback', 'Sedan', 'Compact SUV', 'SUV', 'MUV', 'Luxury'];
const CAR_BRANDS = ['All', 'Maruti', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Mahindra', 'Kia', 'MG', 'Skoda'];
const TRANSMISSION_TYPES = ['All', 'Manual', 'Automatic'];
const SEAT_OPTIONS = ['All', '5 Seater', '7 Seater', '8+ Seater'];
const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 1000 },
  { label: '₹1000 - ₹1500', min: 1000, max: 1500 },
  { label: '₹1500 - ₹2500', min: 1500, max: 2500 },
  { label: 'Above ₹2500', min: 2500, max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
  { label: 'Name A-Z', value: 'name' },
];

export function CarFleetGrid({
  vehicles,
  city,
  citySlug,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
}: CarFleetGridProps) {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedSeats, setSelectedSeats] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarVehicle | null>(null);

  // Calculate rental duration
  const calculateDuration = () => {
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const drop = new Date(`${dropDate}T${dropTime}`);
    const hours = Math.ceil((drop.getTime() - pickup.getTime()) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    return { hours, days };
  };

  const duration = calculateDuration();

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Filter by type
    if (selectedType !== 'All') {
      result = result.filter((v) => v.type === selectedType);
    }

    // Filter by brand
    if (selectedBrand !== 'All') {
      result = result.filter((v) => v.brand === selectedBrand);
    }

    // Filter by transmission
    if (selectedTransmission !== 'All') {
      result = result.filter((v) => v.transmission === selectedTransmission);
    }

    // Filter by seats
    if (selectedSeats !== 'All') {
      if (selectedSeats === '5 Seater') {
        result = result.filter((v) => v.seats === 5);
      } else if (selectedSeats === '7 Seater') {
        result = result.filter((v) => v.seats === 7);
      } else if (selectedSeats === '8+ Seater') {
        result = result.filter((v) => v.seats >= 8);
      }
    }

    // Filter by price range
    result = result.filter(
      (v) => v.pricePerDay >= selectedPriceRange.min && v.pricePerDay < selectedPriceRange.max
    );

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case 'price_desc':
        result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Popular - keep original order (could be based on bookings count)
        break;
    }

    return result;
  }, [vehicles, selectedType, selectedBrand, selectedTransmission, selectedSeats, selectedPriceRange, sortBy]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateTotal = (pricePerDay: number) => {
    const baseAmount = pricePerDay * duration.days;
    const gstAmount = Math.round(baseAmount * 0.18);
    return { baseAmount, gstAmount, total: baseAmount + gstAmount };
  };

  const clearFilters = () => {
    setSelectedType('All');
    setSelectedBrand('All');
    setSelectedTransmission('All');
    setSelectedSeats('All');
    setSelectedPriceRange(PRICE_RANGES[0]);
  };

  const hasActiveFilters =
    selectedType !== 'All' ||
    selectedBrand !== 'All' ||
    selectedTransmission !== 'All' ||
    selectedSeats !== 'All' ||
    selectedPriceRange.label !== 'All';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trip Summary Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    {duration.days} Day{duration.days > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/self-drive-car-rentals/${citySlug}`}>
              <Button variant="outline" size="sm">
                Modify Search
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Car Type */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Car Type</h3>
                <div className="space-y-2">
                  {CAR_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        selectedType === type
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {CAR_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        selectedBrand === brand
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Transmission</h3>
                <div className="space-y-2">
                  {TRANSMISSION_TYPES.map((trans) => (
                    <button
                      key={trans}
                      onClick={() => setSelectedTransmission(trans)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        selectedTransmission === trans
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {trans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seats */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Seating</h3>
                <div className="space-y-2">
                  {SEAT_OPTIONS.map((seats) => (
                    <button
                      key={seats}
                      onClick={() => setSelectedSeats(seats)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        selectedSeats === seats
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {seats}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setSelectedPriceRange(range)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        selectedPriceRange.label === range.label
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 w-5 h-5 rounded-full text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredVehicles.length}</span> cars available
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-0 bg-transparent font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cars Grid */}
            {filteredVehicles.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters to find more options</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredVehicles.map((car, index) => (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                        <Image
                          src={car.image}
                          alt={car.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/fleet/default-car.jpg';
                          }}
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                            {car.type}
                          </span>
                          {car.transmission === 'Automatic' && (
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              Auto
                            </span>
                          )}
                        </div>
                        {/* Rating */}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold">{car.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{car.name}</h3>
                            <p className="text-sm text-gray-500">{car.brand}</p>
                          </div>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-600">{car.seats} Seats</span>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <Settings2 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-600">{car.transmission}</span>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <Fuel className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-600">{car.fuelType}</span>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <Gauge className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-600">{car.mileage}</span>
                          </div>
                        </div>

                        {/* Features Preview */}
                        {car.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {car.features.slice(0, 3).map((feature) => (
                              <span
                                key={feature}
                                className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                            {car.features.length > 3 && (
                              <span className="text-gray-400 text-xs">+{car.features.length - 3} more</span>
                            )}
                          </div>
                        )}

                        {/* Price & Book */}
                        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              ₹{car.pricePerDay}
                              <span className="text-sm font-normal text-gray-500">/day</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              ₹{calculateTotal(car.pricePerDay).total} for {duration.days} days
                            </p>
                          </div>
                          <Button
                            onClick={() => setSelectedCar(car)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
                {/* Mobile filter content - same as sidebar */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Car Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {CAR_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition",
                          selectedType === type
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                  <div className="flex flex-wrap gap-2">
                    {CAR_BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition",
                          selectedBrand === brand
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Transmission</h3>
                  <div className="flex flex-wrap gap-2">
                    {TRANSMISSION_TYPES.map((trans) => (
                      <button
                        key={trans}
                        onClick={() => setSelectedTransmission(trans)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition",
                          selectedTransmission === trans
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {trans}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Seating</h3>
                  <div className="flex flex-wrap gap-2">
                    {SEAT_OPTIONS.map((seats) => (
                      <button
                        key={seats}
                        onClick={() => setSelectedSeats(seats)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition",
                          selectedSeats === seats
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {seats}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPriceRange(range)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition",
                          selectedPriceRange.label === range.label
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
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

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedCar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedCar(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Car Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <Image
                  src={selectedCar.image}
                  alt={selectedCar.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedCar(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCar.name}</h2>
                <p className="text-gray-500 mb-4">{selectedCar.brand} • {selectedCar.type}</p>

                {/* Trip Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Trip Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pickup</span>
                      <span>{formatDate(pickupDate)} at {formatTime(pickupTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Drop-off</span>
                      <span>{formatDate(dropDate)} at {formatTime(dropTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold">{duration.days} Day{duration.days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location</span>
                      <span>{city}</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        ₹{selectedCar.pricePerDay} × {duration.days} days
                      </span>
                      <span>₹{calculateTotal(selectedCar.pricePerDay).baseAmount}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">₹{calculateTotal(selectedCar.pricePerDay).total}</span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-amber-900 mb-2">Requirements</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Valid Driving License (min 1 year)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      ID Proof (Aadhar/PAN)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Security Deposit: ₹5,000 - ₹10,000
                    </li>
                  </ul>
                </div>

                {/* Proceed Button */}
                <Link
                  href={`/self-drive-car-rentals/${citySlug}/book?car=${selectedCar.slug}&pickupDate=${pickupDate}&pickupTime=${pickupTime}&dropDate=${dropDate}&dropTime=${dropTime}`}
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
                    <KeyRound className="w-5 h-5 mr-2" />
                    Proceed to Book
                  </Button>
                </Link>

                <p className="text-center text-xs text-gray-500 mt-3">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Fully insured • Free cancellation up to 24 hours
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
