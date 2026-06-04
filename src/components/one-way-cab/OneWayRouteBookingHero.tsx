'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Users,
  Shield,
  Star,
  Fuel,
} from 'lucide-react';
import { CarRentalBookingConfirmModal } from '../car-rental/CarRentalBookingConfirmModal';

interface VehiclePackage {
  id: string;
  vehicleCategory: {
    id: string;
    name: string;
    slug: string;
    seatingCapacity: number;
    luggageCapacity: string | null;
    acType: string | null;
    fuelType: string | null;
    image: string | null;
    exampleVehicles: string[] | null;
  };
  basePrice: number;
  estimatedTime: string | null;
}

interface PricingResult {
  success: boolean;
  pricing: {
    grandTotal: number;
    totalBeforeGst: number;
    gst: number;
  };
}

interface OneWayRouteBookingHeroProps {
  fromCity: string;
  fromSlug: string;
  fromRegion: string;
  toCity: string;
  toSlug: string;
  toRegion: string;
  distance: number;
  estimatedTime: string | null;
  minPrice: number;
}

export function OneWayRouteBookingHero({
  fromCity,
  fromSlug,
  fromRegion,
  toCity,
  toSlug,
  toRegion,
  distance,
  estimatedTime,
  minPrice,
}: OneWayRouteBookingHeroProps) {
  // Form state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dateError, setDateError] = useState('');

  // Data state
  const [vehiclePackages, setVehiclePackages] = useState<VehiclePackage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showVehicles, setShowVehicles] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, PricingResult>>({});

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Set default date (now + 24 hours)
  useEffect(() => {
    const min = new Date();
    min.setHours(min.getHours() + 24);
    setPickupDate(min.toISOString().split('T')[0]);
  }, []);

  const getMinAllowedDate = () => {
    const min = new Date();
    min.setHours(min.getHours() + 24);
    return min;
  };

  const formatEarliestPickup = (date: Date) =>
    date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const validateDateTime = (date: string, time: string) => {
    if (!date || !time) return;
    const selected = new Date(`${date}T${time}`);
    const minAllowed = getMinAllowedDate();
    if (selected < minAllowed) {
      setDateError(
        `Booking requires at least 24 hours advance notice. Earliest pickup: ${formatEarliestPickup(minAllowed)}.`
      );
    } else {
      setDateError('');
    }
  };

  // Fetch available vehicle packages for this route
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(
          `/api/services/one-way-cab/route-packages?from=${fromSlug}&to=${toSlug}`
        );
        const data = await response.json();

        if (data.success && data.packages) {
          setVehiclePackages(data.packages);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchVehicles();
  }, [fromSlug, toSlug]);

  // Fetch prices for all vehicles
  const fetchPrices = useCallback(async () => {
    if (vehiclePackages.length === 0) return;

    setLoadingPrices(true);
    const prices: Record<string, PricingResult> = {};

    try {
      await Promise.all(
        vehiclePackages.map(async (pkg) => {
          try {
            // Use basePrice directly (GST already included in database)
            const basePrice = pkg.basePrice;

            prices[pkg.vehicleCategory.id] = {
              success: true,
              pricing: {
                grandTotal: basePrice,
                totalBeforeGst: basePrice,
                gst: 0,
              },
            };
          } catch (err) {
            prices[pkg.vehicleCategory.id] = {
              success: false,
              pricing: { grandTotal: 0, totalBeforeGst: 0, gst: 0 },
            };
          }
        })
      );
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    setVehiclePrices(prices);
    setLoadingPrices(false);
  }, [vehiclePackages]);

  // Handle search
  const handleExplore = () => {
    if (!pickupDate) {
      alert('Please select pickup date');
      return;
    }
    if (dateError) return;
    const selected = new Date(`${pickupDate}T${pickupTime}`);
    if (selected < getMinAllowedDate()) {
      validateDateTime(pickupDate, pickupTime);
      return;
    }
    setShowVehicles(true);
    fetchPrices();
  };

  // Handle booking
  const handleBook = (packageId: string) => {
    const pkg = vehiclePackages.find((p) => p.id === packageId);
    const priceData = pkg ? vehiclePrices[pkg.vehicleCategory.id] : null;

    if (!pkg || !priceData?.success) return;

    const details = {
      vehicle: {
        id: pkg.vehicleCategory.id,
        name: pkg.vehicleCategory.name,
        seatingCapacity: pkg.vehicleCategory.seatingCapacity,
        luggageCapacity: pkg.vehicleCategory.luggageCapacity,
        acType: pkg.vehicleCategory.acType,
        fuelType: pkg.vehicleCategory.fuelType,
        image: pkg.vehicleCategory.image,
        exampleVehicles: pkg.vehicleCategory.exampleVehicles,
      },
      tripType: 'outstation',
      outstationMode: 'one-way',
      pickupCity: fromCity,
      pickupCitySlug: fromSlug,
      pickupDate,
      pickupTime,
      dropCity: toCity,
      dropCitySlug: toSlug,
      distance,
      estimatedTime,
      packageId,
      pricing: priceData.pricing,
      serviceSlug: 'one-way-cab',
    };

    setBookingDetails(details);
    setShowBookingModal(true);
  };

  // No early spinner-return on loadingData — it shrank the hero then jumped to
  // full height after the client fetch (CLS). Route info & price come from props
  // and the form selects render at fixed height, so render the full hero now.

  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative container-custom py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left - Route Info */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Car className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">One Way Cab - No Return Charges</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              {fromCity} to{' '}
              <span className="text-emerald-400">{toCity}</span> Cab
            </motion.h1>

            {/* Route Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start gap-4 text-lg mb-6"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>{distance} km</span>
              </div>
              {estimatedTime && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span>{estimatedTime}</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Starting Price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto lg:mx-0"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-emerald-200 text-sm">Starting from</p>
                  <p className="text-4xl font-bold">₹{minPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-200 text-sm">Per journey</p>
                  <p className="text-lg font-semibold">All inclusive</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">
                  ✓ No return charges
                </span>
                <span className="inline-flex items-center gap-1 bg-teal-500/20 text-teal-200 px-3 py-1 rounded-full">
                  ✓ Professional drivers
                </span>
                <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 px-3 py-1 rounded-full">
                  ✓ 24/7 support
                </span>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              {[
                { icon: Shield, text: 'Verified Drivers' },
                { icon: Fuel, text: 'Fuel Included' },
                { icon: Star, text: '4.8 Rating' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                >
                  <item.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden text-gray-900"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Quick Booking</h3>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {!showVehicles ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Route Display */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">From</p>
                          <p className="text-lg font-bold text-gray-900">{fromCity}</p>
                          <p className="text-xs text-gray-500">{fromRegion}</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-emerald-600" />
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">To</p>
                          <p className="text-lg font-bold text-gray-900">{toCity}</p>
                          <p className="text-xs text-gray-500">{toRegion}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => {
                              setPickupDate(e.target.value);
                              validateDateTime(e.target.value, pickupTime);
                            }}
                            min={(() => { const m = new Date(); m.setHours(m.getHours() + 24); return m.toISOString().split('T')[0]; })()}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 ${dateError ? 'border-red-400' : 'border-gray-200'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Time
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => {
                              setPickupTime(e.target.value);
                              validateDateTime(pickupDate, e.target.value);
                            }}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 ${dateError ? 'border-red-400' : 'border-gray-200'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date validation error */}
                    {dateError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{dateError}</span>
                      </div>
                    )}

                    {/* Explore Button */}
                    <button
                      onClick={handleExplore}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-4 rounded-lg transition hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2"
                    >
                      Explore Cabs
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="text-xs text-gray-500 text-center">
                      Fixed fare for one-way • Toll charges extra
                    </div>
                  </motion.div>
                ) : (
                  /* Vehicle Selection */
                  <motion.div
                    key="vehicles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Back Button */}
                    <button
                      onClick={() => setShowVehicles(false)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                    >
                      ← Modify Search
                    </button>

                    {/* Trip Summary */}
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">
                          {fromCity} → {toCity} ({distance} km)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-emerald-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pickupTime}
                        </span>
                      </div>
                    </div>

                    {/* Loading State */}
                    {loadingPrices && (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      </div>
                    )}

                    {/* Vehicle Options */}
                    {!loadingPrices && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {vehiclePackages.map((pkg) => {
                          const priceData = vehiclePrices[pkg.vehicleCategory.id];
                          const hasPrice =
                            priceData?.success && priceData.pricing?.grandTotal > 0;

                          return (
                            <div
                              key={pkg.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                                selectedVehicle === pkg.id
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : hasPrice
                                    ? 'border-gray-200 hover:border-emerald-200'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                              }`}
                              onClick={() => hasPrice && setSelectedVehicle(pkg.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {pkg.vehicleCategory.image ? (
                                      <Image
                                        src={pkg.vehicleCategory.image}
                                        alt={pkg.vehicleCategory.name}
                                        width={56}
                                        height={40}
                                        className="object-contain"
                                      />
                                    ) : (
                                      <Car className="w-8 h-8 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {pkg.vehicleCategory.name}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      {Array.isArray(pkg.vehicleCategory.exampleVehicles)
                                        ? pkg.vehicleCategory.exampleVehicles
                                            .slice(0, 3)
                                            .join(', ')
                                        : 'Swift, Dzire, Innova'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {pkg.vehicleCategory.seatingCapacity}
                                      </span>
                                      <span>•</span>
                                      <span>{pkg.vehicleCategory.acType || 'AC'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {hasPrice ? (
                                    <>
                                      <div className="text-xl font-bold text-gray-900">
                                        ₹{priceData.pricing.grandTotal.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-500">Fixed fare</div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>Not available</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {selectedVehicle === pkg.id && hasPrice && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 pt-4 border-t border-emerald-200"
                                >
                                  {/* Fare Breakdown */}
                                  <div className="text-xs space-y-1 text-gray-600 mb-4">
                                    <div className="flex justify-between">
                                      <span>Fixed route fare ({distance} km)</span>
                                      <span>₹{priceData.pricing.totalBeforeGst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-amber-600">
                                      <span>Toll/Parking</span>
                                      <span>Extra (as applicable)</span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleBook(pkg.id)}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Book {pkg.vehicleCategory.name}
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <CarRentalBookingConfirmModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingDetails(null);
        }}
        bookingDetails={bookingDetails}
      />
    </section>
  );
}
