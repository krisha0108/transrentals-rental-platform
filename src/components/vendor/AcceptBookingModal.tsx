'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Bike,
  DollarSign,
  Calendar,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleOption {
  id: string;
  name: string;
  registrationNumber?: string;
  dailyRate: number;
  fleetPricing: any[];
  fleetLocations: any[];
}

interface BookingData {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone?: string;
  vehicleName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  locationId: string;
  locationName: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  grandTotal?: number;
  status?: string;
  type?: 'direct' | 'quotation' | 'open';
  createdAt?: string;
}

interface AcceptBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingData | null;
  vehicles: VehicleOption[];
  onAccept: (data: { vehicleId: string; vehicleName: string; customRate?: number }) => Promise<void>;
}

export function AcceptBookingModal({
  isOpen,
  onClose,
  booking,
  vehicles,
  onAccept,
}: AcceptBookingModalProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  if (!booking) return null;

  // Robust matching helper to handle ID/Slug/Name inconsistencies
  const isLocationMatch = (locObj: any, targetId: string, targetName: string) => {
    if (!targetId && !targetName) return false;

    // 1. Direct ID match
    const locId = locObj.locationId || locObj.id;
    if (locId && targetId && locId === targetId) return true;

    // 2. Slug or Name match (fallback)
    const targetIdLower = targetId?.toLowerCase();
    const targetNameLower = targetName?.toLowerCase();

    const fleetLocName = locObj.location?.name?.toLowerCase() || locObj.name?.toLowerCase();
    const fleetLocSlug = locObj.location?.slug?.toLowerCase() || locObj.slug?.toLowerCase();

    return (
      (fleetLocName && fleetLocName === targetNameLower) ||
      (fleetLocSlug && (fleetLocSlug === targetIdLower || fleetLocSlug === targetNameLower))
    );
  };

  // Filter vehicles by city
  const filteredVehicles = vehicles.filter((v) =>
    v.fleetLocations.some((fl) => isLocationMatch(fl, booking.locationId, booking.locationName))
  );

  const selectedVehicleData = filteredVehicles.find((v) => v.id === selectedVehicle);

  // Find price for the specific city
  const getCityRate = (vehicle: VehicleOption) => {
    const cityPrice = vehicle.fleetPricing.find((p) =>
      isLocationMatch(p, booking.locationId, booking.locationName)
    );
    if (cityPrice) return cityPrice.perDayRate || cityPrice.basePrice;

    const defaultPrice = vehicle.fleetPricing.find((p) => !p.locationId);
    if (defaultPrice) return defaultPrice.perDayRate || defaultPrice.basePrice;

    return vehicle.dailyRate || booking.dailyRate;
  };

  const currentRate = selectedVehicleData ? getCityRate(selectedVehicleData) : booking.dailyRate;
  const rate = customRate ? parseFloat(customRate) : currentRate;
  const totalAmount = rate * booking.totalDays;
  const gst = Math.round(totalAmount * 0.18);
  const grandTotal = totalAmount + gst;

  const handleAccept = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAccept({
        vehicleId: selectedVehicle,
        vehicleName: selectedVehicleData?.name || booking.vehicleName,
        customRate: customRate ? parseFloat(customRate) : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.message?.includes('already taken') || err.status === 409) {
        setAlreadyTaken(true);
      } else {
        setError(err.message || 'Failed to accept booking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedVehicle('');
    setCustomRate('');
    setError(null);
    setSuccess(false);
    setAlreadyTaken(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success State */}
            {success && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Booking Accepted!
                </h2>
                <p className="text-gray-600 mb-6">
                  Waiting for customer payment. You'll be notified once paid.
                </p>
                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            )}

            {/* Already Taken State */}
            {alreadyTaken && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Booking Already Taken
                </h2>
                <p className="text-gray-600 mb-6">
                  Another vendor accepted this booking before you. Better luck next time!
                </p>
                <Button onClick={handleClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            )}

            {/* Accept Form */}
            {!success && !alreadyTaken && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Accept Booking</h2>
                      <p className="text-gray-500 text-sm">#{booking.bookingNumber}</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{booking.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Bike className="w-4 h-4" />
                      <span>{booking.vehicleName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Vehicle from Your Fleet
                    </label>
                    <div className="space-y-2">
                      {filteredVehicles.length === 0 ? (
                        <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                          No vehicles assigned to {booking.locationName} in your fleet.
                        </p>
                      ) : (
                        filteredVehicles.map((vehicle) => (
                          <label
                            key={vehicle.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${selectedVehicle === vehicle.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="vehicle"
                                value={vehicle.id}
                                checked={selectedVehicle === vehicle.id}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                className="text-blue-600"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{vehicle.name}</p>
                                {vehicle.registrationNumber && (
                                  <p className="text-sm text-gray-500">{vehicle.registrationNumber}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-gray-900">
                              ₹{getCityRate(vehicle)}/day
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Custom Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Daily Rate (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder={`Default: ₹${currentRate}`}
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default rate
                    </p>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Price Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          ₹{rate}/day × {booking.totalDays} days
                        </span>
                        <span className="font-medium">₹{totalAmount}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-green-200">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-green-600 text-lg">
                          ₹{grandTotal}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      This is a competitive booking. If another vendor accepts first, you won't be able to take this booking.
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting || (!selectedVehicle && filteredVehicles.length > 0)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Booking
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
