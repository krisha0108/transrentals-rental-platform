'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Shield,
  CheckCircle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
  totalBookings?: number;
}

interface BikeData {
  id: string;
  name: string;
  brandName: string;
  brandLogo?: string;
  sideImage?: string;
  categoryName?: string;
  fuelType?: string;
  engineCC?: number;
  mileage?: string;
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

interface VendorPriceComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  bike: BikeData | null;
  rentalDays: number;
  onBookWithVendor: (vendorPrice: VendorPrice) => void;
  onBookAnyVendor: () => void;
}

export function VendorPriceComparison({
  isOpen,
  onClose,
  bike,
  rentalDays,
  onBookWithVendor,
  onBookAnyVendor,
}: VendorPriceComparisonProps) {
  if (!bike) return null;

  const sortedVendors = [...bike.vendorPrices].sort((a, b) => a.dailyRate - b.dailyRate);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">
                    {bike.brandName}
                  </p>
                  <h2 className="text-2xl font-bold">{bike.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-emerald-100">
                    {bike.engineCC && <span>{bike.engineCC}cc</span>}
                    {bike.mileage && <span>• {bike.mileage}</span>}
                    {bike.categoryName && <span>• {bike.categoryName}</span>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-emerald-100 text-xs">Starting from</p>
                  <p className="text-2xl font-bold">₹{bike.lowestPrice}/day</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs">Vendors available</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {bike.vendorCount}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs">For {rentalDays} day{rentalDays > 1 ? 's' : ''}</p>
                  <p className="text-2xl font-bold">
                    ₹{bike.lowestPrice * rentalDays}
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Compare {bike.vendorCount} Vendor{bike.vendorCount > 1 ? 's' : ''}
                </h3>
                <span className="text-sm text-gray-500">Sorted by price</span>
              </div>

              <div className="space-y-3">
                {sortedVendors.map((vendor, index) => {
                  const totalPrice = vendor.dailyRate * rentalDays;
                  const gst = Math.round(totalPrice * 0.18);
                  const grandTotal = totalPrice + gst;
                  const isLowest = index === 0;

                  return (
                    <div
                      key={vendor.vendorFleetId}
                      className={`relative border rounded-xl p-4 transition-all ${isLowest
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                    >
                      {/* Best Price Badge */}
                      {isLowest && (
                        <div className="absolute -top-2 left-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          BEST PRICE
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {/* Vendor Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-600">
                              {vendor.vendorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">
                                {vendor.vendorName}
                              </h4>
                              {vendor.isVerified && (
                                <Shield className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {vendor.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  {vendor.rating}
                                </span>
                              )}
                              {vendor.totalBookings && (
                                <span>• {vendor.totalBookings}+ bookings</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price & Book */}
                        <div className="text-right">
                          <div className="mb-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{vendor.dailyRate}
                            </span>
                            <span className="text-gray-500 text-sm">/day</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Total: ₹{grandTotal}
                          </p>
                          <Button
                            size="sm"
                            className={
                              isLowest
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                            }
                            onClick={() => onBookWithVendor(vendor)}
                          >
                            Book Now
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {/* Deposit Info */}
                      {vendor.deposit > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Security deposit: ₹{vendor.deposit} (refundable)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer - Book Any Vendor */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Not sure which vendor? Let us find the best available one for you.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    All {bike.vendorCount} vendors will be notified. First to confirm wins!
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  onClick={onBookAnyVendor}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Book Any Vendor
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
