'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Filter,
  ChevronDown,
  Fuel,
  Settings,
  Calendar,
  Clock,
  MapPin,
  Users,
  TrendingDown,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BikeQuoteRequestModal } from './BikeQuoteRequestModal';
import { calculateRentalDuration } from '@/lib/utils/duration';

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
}

interface AggregatedBike {
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
  features?: string[];
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

interface BikeFleetGridMultiVendorProps {
  bikes: AggregatedBike[];
  location: {
    id: string;
    name: string;
    slug: string;
  };
  filters: {
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string; slug: string; logo?: string }[];
    priceRange: { min: number; max: number };
  };
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
}

// Filter options
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹400', min: 0, max: 400 },
  { label: '₹400 - ₹600', min: 400, max: 600 },
  { label: '₹600 - ₹900', min: 600, max: 900 },
  { label: 'Above ₹900', min: 900, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'vendors', label: 'Most Vendors' },
  { value: 'name', label: 'Name (A-Z)' },
];

export function BikeFleetGridMultiVendor({
  bikes,
  location,
  filters,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
}: BikeFleetGridMultiVendorProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('price_low');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBike, setSelectedBike] = useState<AggregatedBike | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState(pickupDate);
  const [editPickupTime, setEditPickupTime] = useState(pickupTime);
  const [editDropDate, setEditDropDate] = useState(dropDate);
  const [editDropTime, setEditDropTime] = useState(dropTime);

  // Calculate rental duration with time precision
  const rentalDuration = useMemo(() => {
    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      return { formatted: '1 day', totalDays: 1 };
    }
    return calculateRentalDuration(pickupDate, pickupTime, dropDate, dropTime);
  }, [pickupDate, dropDate, pickupTime, dropTime]);

  const rentalDays = rentalDuration.totalDays; // For pricing calculation
  const durationText = rentalDuration.formatted; // For display

  // Filter and sort bikes
  const filteredBikes = useMemo(() => {
    let result = [...bikes];

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter((b) => b.categoryName === selectedCategory);
    }

    // Filter by brand
    if (selectedBrand !== 'All') {
      result = result.filter((b) => b.brandName === selectedBrand);
    }

    // Filter by price
    const priceRange = PRICE_RANGES[selectedPriceRange];
    result = result.filter(
      (b) => b.lowestPrice >= priceRange.min && b.lowestPrice < priceRange.max
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
  }, [bikes, selectedCategory, selectedBrand, selectedPriceRange, sortBy]);

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
      city: location.slug,
      pickupDate: editPickupDate,
      pickupTime: editPickupTime,
      dropDate: editDropDate,
      dropTime: editDropTime,
    });
    router.push(`/bike-on-rent/${location.slug}/bikes?${params.toString()}`);
    setEditingDates(false);
  };

  // Handle quote request
  const handleGetQuote = (bike: AggregatedBike) => {
    setSelectedBike(bike);
    setShowQuoteModal(true);
  };

  // Get categories and brands from filters prop (from API)
  const categories = ['All', ...filters.categories.map((c) => c.name)];
  const brands = ['All', ...filters.brands.map((b) => b.name)];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Header with Trip Info */}
      <div className="bg-white border-b mt-8 border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Trip Summary */}
            {editingDates ? (
              <div className="flex items-center gap-3 flex-wrap w-full">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">{location.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Pickup</label>
                  <input
                    type="date"
                    value={editPickupDate}
                    onChange={(e) => setEditPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="time"
                    value={editPickupTime}
                    onChange={(e) => setEditPickupTime(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Drop</label>
                  <input
                    type="date"
                    value={editDropDate}
                    onChange={(e) => setEditDropDate(e.target.value)}
                    min={editPickupDate || new Date().toISOString().split('T')[0]}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="time"
                    value={editDropTime}
                    onChange={(e) => setEditDropTime(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleApplyDates}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Apply
                </button>
                <button
                  onClick={() => {
                    setEditingDates(false);
                    setEditPickupDate(pickupDate);
                    setEditPickupTime(pickupTime);
                    setEditDropDate(dropDate);
                    setEditDropTime(dropTime);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">{location.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(pickupDate)}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{formatTime(pickupTime)}</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(dropDate)}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{formatTime(dropTime)}</span>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-blue-700 font-medium">
                    {durationText}
                  </span>
                </div>
                <button
                  onClick={() => setEditingDates(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            )}

            {/* Mobile Filter Toggle */}
            {!editingDates && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={cn(
              'w-64 flex-shrink-0 hidden lg:block',
              showFilters && 'fixed inset-0 z-50 bg-white lg:relative lg:bg-transparent'
            )}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedBrand('All');
                    setSelectedPriceRange(0);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat || 'All')}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedCategory === cat
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      {cat || 'Uncategorized'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Brand</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedBrand === brand
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
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
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                        selectedPriceRange === idx
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredBikes.length}</span> bikes
                available from multiple vendors
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
            {filteredBikes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🏍️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No bikes found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters to see more options
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory('All');
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
                {filteredBikes.map((bike, index) => (
                  <motion.div
                    key={bike.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      {bike.sideImage ? (
                        <Image
                          src={bike.sideImage}
                          alt={bike.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-4xl">🏍️</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {bike.categoryName && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                            {bike.categoryName}
                          </span>
                        </div>
                      )}

                      {/* Vendor Count Badge */}
                      <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{bike.vendorCount} vendor{bike.vendorCount > 1 ? 's' : ''}</span>
                      </div>

                      {/* Price Savings Badge */}
                      {bike.highestPrice > bike.lowestPrice && (
                        <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">
                            Save ₹{bike.highestPrice - bike.lowestPrice}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Brand */}
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                        {bike.brandName}
                      </p>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                        {bike.name}
                      </h3>

                      {/* Specs */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {bike.engineCC && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Settings className="w-3 h-3" />
                            {bike.engineCC}cc
                          </span>
                        )}
                        {bike.mileage && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Fuel className="w-3 h-3" />
                            {bike.mileage}
                          </span>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500">Starting from</p>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{bike.lowestPrice}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {rentalDays} day{rentalDays > 1 ? 's' : ''} total
                            </p>
                            <p className="text-lg font-semibold text-emerald-600">
                              ₹{bike.lowestPrice * rentalDays}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded mb-3 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          Price may vary based on vendor quotes
                        </p>

                        {/* Get Quote Button */}
                        <Button
                          onClick={() => handleGetQuote(bike)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* Quote Request Modal */}
      <BikeQuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedBike(null);
        }}
        bikeDetails={selectedBike ? {
          id: selectedBike.id,
          name: selectedBike.name,
          brandName: selectedBike.brandName,
          sideImage: selectedBike.sideImage,
          categoryName: selectedBike.categoryName,
          categoryId: selectedBike.categoryId,
          engineCC: selectedBike.engineCC,
        } : null}
        location={location}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        dropDate={dropDate}
        dropTime={dropTime}
        rentalDays={rentalDays}
      />
    </div>
  );
}
