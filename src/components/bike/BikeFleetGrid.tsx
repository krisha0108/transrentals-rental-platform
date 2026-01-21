'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Filter,
  X,
  ChevronDown,
  Fuel,
  Settings,
  Calendar,
  Clock,
  MapPin,
  Check,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BikeVehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  pricePerDay: number;
  pricePerHour?: number;
  rating: number;
  reviewCount?: number;
  type: string; // Scooter, Bike, Sports, Cruiser
  engine: string;
  mileage: string;
  transmission: string;
  fuelType: string;
  features: string[];
  available: boolean;
}

interface BikeFleetGridProps {
  vehicles: BikeVehicle[];
  city: string;
  citySlug: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  brands?: string[]; // Dynamic brands from database
}

// Filter options
const BIKE_TYPES = ['All', 'Scooter', 'Bike', 'Sports', 'Cruiser', 'Electric'];
const BRANDS = ['All', 'Honda', 'Royal Enfield', 'TVS', 'Bajaj', 'KTM', 'Yamaha', 'Suzuki', 'Hero'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹800', min: 500, max: 800 },
  { label: '₹800 - ₹1200', min: 800, max: 1200 },
  { label: 'Above ₹1200', min: 1200, max: Infinity },
];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

// Generate time slots for dropdown
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}` };
});

export function BikeFleetGrid({
  vehicles,
  city,
  citySlug,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  brands,
}: BikeFleetGridProps) {
  // Use dynamic brands from props or fallback to hardcoded defaults
  const brandOptions = useMemo(() => {
    if (brands && brands.length > 0) {
      return ['All', ...brands];
    }
    return BRANDS;
  }, [brands]);
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBike, setSelectedBike] = useState<BikeVehicle | null>(null);

  // Date/Time picker modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState(pickupDate);
  const [editPickupTime, setEditPickupTime] = useState(pickupTime);
  const [editDropDate, setEditDropDate] = useState(dropDate);
  const [editDropTime, setEditDropTime] = useState(dropTime);

  // Handle date/time update
  const handleDateTimeUpdate = () => {
    // Validate dates
    if (!editPickupDate || !editDropDate || !editPickupTime || !editDropTime) {
      alert('Please select all date and time fields');
      return;
    }

    const pickupDateTime = new Date(`${editPickupDate}T${editPickupTime}`);
    const dropDateTime = new Date(`${editDropDate}T${editDropTime}`);

    if (dropDateTime <= pickupDateTime) {
      alert('Drop-off date/time must be after pickup date/time');
      return;
    }

    // Redirect to the same page with updated params
    const params = new URLSearchParams({
      city: citySlug,
      pickupDate: editPickupDate,
      pickupTime: editPickupTime,
      dropDate: editDropDate,
      dropTime: editDropTime,
    });

    router.push(`/bike-on-rent/${citySlug}/bikes?${params.toString()}`);
    setShowDatePicker(false);
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Calculate rental duration
  const rentalDays = useMemo(() => {
    if (!pickupDate || !dropDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [pickupDate, dropDate]);

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

    // Filter by price
    const priceRange = PRICE_RANGES[selectedPriceRange];
    result = result.filter(
      (v) => v.pricePerDay >= priceRange.min && v.pricePerDay < priceRange.max
    );

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // popular - keep original order
        break;
    }

    return result;
  }, [vehicles, selectedType, selectedBrand, selectedPriceRange, sortBy]);

  // Format date for display
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Header with Trip Info */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container-custom py-3 md:py-4 mt-6 ">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between gap-4 mt-6">
            {/* Location Badge */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-700">{city}</span>
            </div>

            {/* Clickable Date/Time Section - Desktop */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center gap-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 px-4 py-2.5 rounded-xl transition-all group cursor-pointer"
            >
              {/* Pickup */}
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Pickup</p>
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-sm font-medium">{formatDate(pickupDate)}</span>
                  <span className="text-gray-400">|</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-sm font-medium">{formatTime(pickupTime)}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center px-2">
                <span className="text-emerald-500 text-lg">→</span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  {rentalDays} Day{rentalDays > 1 ? 's' : ''}
                </span>
              </div>

              {/* Drop-off */}
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Drop-off</p>
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-sm font-medium">{formatDate(dropDate)}</span>
                  <span className="text-gray-400">|</span>
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-sm font-medium">{formatTime(dropTime)}</span>
                </div>
              </div>

              {/* Edit Icon */}
              <div className="ml-2 p-2 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg transition-colors">
                <Edit3 className="w-4 h-4 text-emerald-700" />
              </div>
            </button>

            {/* Placeholder for alignment */}
            <div className="w-10"></div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {/* Location + Filter Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700 text-sm">{city}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
            </div>

            {/* Clickable Date/Time Section - Mobile */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 px-3 py-2.5 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Pickup */}
                <div className="text-left flex-1">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">Pickup</p>
                  <p className="text-xs font-medium text-gray-800">{formatDate(pickupDate)}</p>
                  <p className="text-[10px] text-gray-500">{formatTime(pickupTime)}</p>
                </div>

                {/* Duration */}
                <div className="flex flex-col items-center">
                  <span className="text-emerald-500">→</span>
                  <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full">
                    {rentalDays}D
                  </span>
                </div>

                {/* Drop-off */}
                <div className="text-left flex-1">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">Drop-off</p>
                  <p className="text-xs font-medium text-gray-800">{formatDate(dropDate)}</p>
                  <p className="text-[10px] text-gray-500">{formatTime(dropTime)}</p>
                </div>
              </div>

              {/* Edit Icon */}
              <div className="ml-2 p-1.5 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg transition-colors">
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {(showFilters || true) && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className={cn(
                  "w-64 flex-shrink-0 hidden lg:block",
                  showFilters && "fixed inset-0 z-50 bg-white lg:relative lg:bg-transparent"
                )}
              >
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                    <button
                      onClick={() => {
                        setSelectedType('All');
                        setSelectedBrand('All');
                        setSelectedPriceRange(0);
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Type Filter */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Vehicle Type</h4>
                    <div className="space-y-2">
                      {BIKE_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg transition-all text-sm",
                            selectedType === type
                              ? "bg-emerald-100 text-emerald-700 font-medium"
                              : "hover:bg-gray-100 text-gray-600"
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
                      {brandOptions.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => setSelectedBrand(brand)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg transition-all text-sm",
                            selectedBrand === brand
                              ? "bg-emerald-100 text-emerald-700 font-medium"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          {brand}
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
                            "w-full text-left px-3 py-2 rounded-lg transition-all text-sm",
                            selectedPriceRange === idx
                              ? "bg-emerald-100 text-emerald-700 font-medium"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredVehicles.length}</span> bikes available
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <div className="text-6xl mb-4">🏍️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No bikes found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more options</p>
                <Button
                  onClick={() => {
                    setSelectedType('All');
                    setSelectedBrand('All');
                    setSelectedPriceRange(0);
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((bike, index) => (
                  <motion.div
                    key={bike.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      <Image
                        src={bike.image}
                        alt={bike.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                          {bike.type}
                        </span>
                      </div>
                      {/* Rating */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold text-gray-800">{bike.rating}</span>
                      </div>
                      {/* Availability */}
                      {!bike.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                            Not Available
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Brand */}
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                        {bike.brand}
                      </p>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                        {bike.name}
                      </h3>

                      {/* Specs */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          <Settings className="w-3 h-3" />
                          {bike.engine}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          <Fuel className="w-3 h-3" />
                          {bike.mileage}
                        </span>
                      </div>

                      {/* Price & Book */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{bike.pricePerDay * rentalDays}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            total
                          </span>
                          <p className="text-xs text-gray-400">₹{bike.pricePerDay}/day × {rentalDays} days</p>
                        </div>
                        <Button
                          onClick={() => setSelectedBike(bike)}
                          disabled={!bike.available}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Book Now
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

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedBike && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedBike(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={selectedBike.image}
                  alt={selectedBike.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedBike(null)}
                  className="absolute top-4 right-4 bg-white/90 p-2 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide mb-1">
                  {selectedBike.brand}
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedBike.name}</h2>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location</span>
                      <span className="font-medium">{city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pickup</span>
                      <span className="font-medium">{formatDate(pickupDate)}, {formatTime(pickupTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Drop-off</span>
                      <span className="font-medium">{formatDate(dropDate)}, {formatTime(dropTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{rentalDays} Day{rentalDays > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">₹{selectedBike.pricePerDay}/day × {rentalDays} days</span>
                      <span className="font-medium">₹{selectedBike.pricePerDay * rentalDays}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        ₹{Math.round(selectedBike.pricePerDay * rentalDays * 1.18)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Included</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Helmet', 'Insurance', 'Roadside Assistance', '100km/day'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-bold"
                  onClick={() => {
                    // Navigate to booking confirmation or open form
                    // Extract model ID from the bike id (remove 'admin-' prefix if present)
                    const modelId = selectedBike.id.startsWith('admin-')
                      ? selectedBike.id.replace('admin-', '')
                      : selectedBike.id;

                    const params = new URLSearchParams({
                      bike: selectedBike.slug,
                      modelId: modelId,
                      modelName: selectedBike.name,
                      brandName: selectedBike.brand,
                      dailyRate: selectedBike.pricePerDay.toString(),
                      city: citySlug,
                      location: citySlug,
                      pickupDate,
                      pickupTime,
                      dropDate,
                      dropTime,
                      broadcastToAll: 'true', // Broadcast to all vendors for this model
                    });
                    window.location.href = `/bike-on-rent/book?${params.toString()}`;
                  }}
                >
                  Proceed to Book
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date/Time Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Modify Dates & Times</h2>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Pickup Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Pickup
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={editPickupDate}
                        min={today}
                        onChange={(e) => setEditPickupDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Time</label>
                      <select
                        value={editPickupTime}
                        onChange={(e) => setEditPickupTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-gray-500 text-sm">to</span>
                  </div>
                </div>

                {/* Drop-off Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Drop-off
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={editDropDate}
                        min={editPickupDate || today}
                        onChange={(e) => setEditDropDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Time</label>
                      <select
                        value={editDropTime}
                        onChange={(e) => setEditDropTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Duration Preview */}
                {editPickupDate && editDropDate && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <span className="text-blue-700 font-medium">
                      {(() => {
                        const start = new Date(editPickupDate);
                        const end = new Date(editDropDate);
                        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        return `${diffDays || 1} Day${diffDays > 1 ? 's' : ''} rental`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDateTimeUpdate}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Update Search
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
