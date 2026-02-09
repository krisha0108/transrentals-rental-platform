'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  ArrowLeftRight,
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
  returnMultiplier: number;
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

interface RoundTripRouteBookingHeroWithFormProps {
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

export function RoundTripRouteBookingHeroWithForm({
  fromCity,
  fromSlug,
  fromRegion,
  toCity,
  toSlug,
  toRegion,
  distance,
  estimatedTime,
  minPrice,
}: RoundTripRouteBookingHeroWithFormProps) {
  // Form state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');

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

  // Set default date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Fetch available vehicle packages for this route
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(
          `/api/services/round-trip/route-packages?from=${fromSlug}&to=${toSlug}`
        );
        const data = await response.json();

        if (data.success && data.packages) {
          setVehiclePackages(data.packages);
        } else {
          console.error('Failed to fetch packages:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchVehicles();
  }, [fromSlug, toSlug]);

  // Fetch prices for all vehicles (round trip pricing)
  const fetchPrices = useCallback(async () => {
    if (vehiclePackages.length === 0) return;

    setLoadingPrices(true);
    const prices: Record<string, PricingResult> = {};

    try {
      await Promise.all(
        vehiclePackages.map(async (pkg) => {
          try {
            // Calculate round trip price: basePrice * returnMultiplier
            const roundTripPrice = Math.round(pkg.basePrice * pkg.returnMultiplier);

            prices[pkg.vehicleCategory.id] = {
              success: true,
              pricing: {
                grandTotal: roundTripPrice,
                totalBeforeGst: roundTripPrice,
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
      outstationMode: 'round-trip',
      pickupCity: fromCity,
      pickupCitySlug: fromSlug,
      pickupDate,
      pickupTime,
      dropCity: toCity,
      dropCitySlug: toSlug,
      distance: distance * 2, // Round trip distance
      estimatedTime,
      packageId,
      pricing: priceData.pricing,
      serviceSlug: 'round-trip',
    };

    setBookingDetails(details);
    setShowBookingModal(true);
  };

  if (loadingData) {
    return (
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white py-20">
        <div className="container-custom flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white overflow-hidden">
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
              <ArrowLeftRight className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium">Round Trip - Save 20-30%</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              {fromCity} <ArrowLeftRight className="inline w-8 h-8 mx-2 text-purple-300" /> <span className="text-purple-300">{toCity}</span>
            </motion.h1>

            {/* Route Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start gap-4 text-lg mb-6"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-300" />
                <span>{distance * 2} km (round trip)</span>
              </div>
              {estimatedTime && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-300" />
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
                  <p className="text-purple-200 text-sm">Round trip from</p>
                  <p className="text-4xl font-bold">₹{minPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-200 text-sm">Both ways</p>
                  <p className="text-lg font-semibold">All inclusive</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full">
                  ✓ Same driver
                </span>
                <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full">
                  ✓ Flexible return
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">
                  ✓ Save 20-30%
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
                  <item.icon className="w-4 h-4 text-purple-300" />
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
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
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">From</p>
                          <p className="text-lg font-bold text-gray-900">{fromCity}</p>
                          <p className="text-xs text-gray-500">{fromRegion}</p>
                        </div>
                        <ArrowLeftRight className="w-6 h-6 text-purple-600" />
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">To & Return</p>
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
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500"
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
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Explore Button */}
                    <button
                      onClick={handleExplore}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg transition hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                    >
                      Explore Round Trip Cabs
                      <ArrowLeftRight className="w-5 h-5" />
                    </button>

                    <div className="text-xs text-gray-500 text-center">
                      Round trip fare • Both ways included • Flexible return
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
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                    >
                      ← Modify Search
                    </button>

                    {/* Trip Summary */}
                    <div className="bg-purple-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-purple-800">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="font-medium">
                          {fromCity} ↔ {toCity} ({distance * 2} km round trip)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-purple-700">
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
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
                                  ? 'border-purple-500 bg-purple-50'
                                  : hasPrice
                                    ? 'border-gray-200 hover:border-purple-200'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                              }`}
                              onClick={() => hasPrice && setSelectedVehicle(pkg.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {pkg.vehicleCategory.image ? (
                                      <img
                                        src={pkg.vehicleCategory.image}
                                        alt={pkg.vehicleCategory.name}
                                        className="w-14 h-10 object-contain"
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
                                      <div className="text-xs text-gray-500">Round trip</div>
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
                                  className="mt-4 pt-4 border-t border-purple-200"
                                >
                                  {/* Fare Breakdown */}
                                  <div className="text-xs space-y-1 text-gray-600 mb-4">
                                    <div className="flex justify-between">
                                      <span>Round trip fare ({distance * 2} km both ways)</span>
                                      <span>₹{priceData.pricing.totalBeforeGst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600">
                                      <span>Driver allowance & accommodation</span>
                                      <span>Included</span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleBook(pkg.id)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Book Round Trip
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
