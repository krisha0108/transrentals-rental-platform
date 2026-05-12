'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Plane,
  Navigation,
  ChevronRight,
  Shield,
  Star,
  Users,
  Fuel,
  Info,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Trip types
type TripType = 'local' | 'outstation' | 'airport';
type OutstationMode = 'one-way' | 'round-trip';
type AirportMode = 'pickup' | 'drop';

// Types from API
interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  seatingCapacity: number;
  luggageCapacity: string | null;
  acType: string | null;
  fuelType: string | null;
  image: string | null;
  exampleVehicles: string[] | null;
  isActive: boolean;
}

interface LocalPackage {
  id: string;
  vehicleCategoryId: string;
  locationId: string | null;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  nightChargesApply: boolean;
  nightChargeAmount: number;
  isPopular: boolean;
  vehicleCategory: { id: string; name: string };
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface PricingResult {
  success: boolean;
  tripType: string;
  pricingMethod?: string;
  pricing: {
    grandTotal: number;
    totalBeforeGst: number;
    gst: number;
    baseKmCharge?: number;
    totalKm?: number;
    perKmRate?: number;
    driverAllowance?: number;
    nightCharge?: number;
    tollEstimate?: number;
    basePrice?: number;
    hours?: number;
    kms?: number;
    extraKmCharge?: number;
    extraHourCharge?: number;
  };
  calculation?: {
    days: number;
    actualKm: number;
    chargeableKm: number;
    perKmRate: number;
  };
  route?: {
    from: Location;
    to: Location;
    oneWayDistance: number;
  };
  routePackage?: {
    basePrice: number;
    estimatedKm: number;
  };
  inclusions?: {
    tollsIncluded: boolean;
    parkingIncluded: boolean;
  };
  error?: string;
}

interface ChauffeurBookingHeroProps {
  city: string;
  citySlug: string;
}

export function ChauffeurBookingHero({ city, citySlug }: ChauffeurBookingHeroProps) {
  // Trip type state
  const [tripType, setTripType] = useState<TripType>('local');
  const [outstationMode, setOutstationMode] = useState<OutstationMode>('round-trip');
  const [airportMode, setAirportMode] = useState<AirportMode>('pickup');

  // Data from APIs
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [localPackages, setLocalPackages] = useState<LocalPackage[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [pickupCity, setPickupCity] = useState(city);
  const [pickupLocationId, setPickupLocationId] = useState<string>('');
  const [dropCity, setDropCity] = useState('');
  const [dropLocationId, setDropLocationId] = useState<string>('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Car selection state
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [showCarSelection, setShowCarSelection] = useState(false);
  const [carPrices, setCarPrices] = useState<Record<string, PricingResult>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Airport specific
  const [airportName, setAirportName] = useState('');
  const [terminalAddress, setTerminalAddress] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, packagesRes, locationsRes] = await Promise.all([
          fetch('/api/admin/chauffeur/vehicles'),
          fetch('/api/admin/chauffeur/packages'),
          fetch('/api/locations'),
        ]);

        const vehiclesData = await vehiclesRes.json();
        const packagesData = await packagesRes.json();
        const locationsData = await locationsRes.json();

        if (vehiclesData.success) {
          setVehicleCategories(vehiclesData.categories?.filter((c: VehicleCategory) => c.isActive) || []);
        }
        if (packagesData.success) {
          setLocalPackages(packagesData.packages || []);
        }
        if (locationsData.success) {
          const locs = locationsData.locations || [];
          setLocations(locs);

          // Find current location by slug
          const current = locs.find((l: Location) => l.slug === citySlug);
          if (current) {
            setCurrentLocation(current);
            setPickupLocationId(current.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [citySlug]);

  // Set default dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setReturnDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Set default package when packages load
  useEffect(() => {
    if (localPackages.length > 0 && !selectedPackageId) {
      // Find 8hr package or first available
      const defaultPkg = localPackages.find(p => p.hours === 8) || localPackages[0];
      if (defaultPkg) {
        setSelectedPackageId(defaultPkg.id);
      }
    }
  }, [localPackages, selectedPackageId]);

  // Get unique packages (grouped by hours/kms for display)
  const uniquePackages = localPackages.reduce((acc, pkg) => {
    const key = `${pkg.hours}-${pkg.kms}`;
    if (!acc.find(p => `${p.hours}-${p.kms}` === key)) {
      acc.push(pkg);
    }
    return acc;
  }, [] as LocalPackage[]);

  // Fetch prices for all vehicle categories
  const fetchPrices = useCallback(async () => {
    if (vehicleCategories.length === 0) return;

    setLoadingPrices(true);
    const prices: Record<string, PricingResult> = {};

    try {
      await Promise.all(
        vehicleCategories.map(async (vehicle) => {
          try {
            let url = '/api/chauffeur-pricing?';
            const params = new URLSearchParams({
              vehicleCategory: vehicle.id,
              tripType: tripType === 'outstation' ? outstationMode === 'one-way' ? 'one_way' : 'round_trip' : tripType,
            });

            if (tripType === 'local' && selectedPackageId) {
              // Find the package for this vehicle category
              const pkg = localPackages.find(
                p => p.vehicleCategoryId === vehicle.id &&
                     p.hours === localPackages.find(lp => lp.id === selectedPackageId)?.hours &&
                     p.kms === localPackages.find(lp => lp.id === selectedPackageId)?.kms
              ) || localPackages.find(p => p.id === selectedPackageId);

              if (pkg) {
                params.set('packageId', pkg.id);
              }
            }

            if (tripType === 'outstation' || tripType === 'airport') {
              if (pickupLocationId) params.set('from', pickupLocationId);
              if (dropLocationId) params.set('to', dropLocationId);
              if (pickupDate) params.set('startDate', pickupDate);
              if (returnDate && outstationMode === 'round-trip') params.set('endDate', returnDate);
            }

            if (pickupTime) params.set('pickupTime', pickupTime);

            const res = await fetch(url + params.toString());
            const data = await res.json();
            prices[vehicle.id] = data;
          } catch (err) {
            prices[vehicle.id] = { success: false, tripType, pricing: { grandTotal: 0, totalBeforeGst: 0, gst: 0 }, error: 'Failed to fetch' };
          }
        })
      );
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    setCarPrices(prices);
    setLoadingPrices(false);
  }, [vehicleCategories, tripType, outstationMode, selectedPackageId, localPackages, pickupLocationId, dropLocationId, pickupDate, returnDate, pickupTime]);

  // Handle search/proceed
  const handleSearch = () => {
    if (!pickupDate) {
      alert('Please select pickup date');
      return;
    }
    if (tripType === 'outstation' && !dropLocationId) {
      alert('Please select drop city');
      return;
    }
    setShowCarSelection(true);
    fetchPrices();
  };

  // Handle booking
  const handleBook = (vehicleId: string) => {
    const vehicle = vehicleCategories.find((c) => c.id === vehicleId);
    const priceData = carPrices[vehicleId];

    if (!vehicle || !priceData?.success) return;

    // Build query params
    const params = new URLSearchParams({
      tripType,
      carCategory: vehicleId,
      carName: vehicle.name,
      pickupCity,
      pickupDate,
      pickupTime,
      fare: priceData.pricing.totalBeforeGst.toString(),
    });

    if (tripType === 'local' && selectedPackageId) {
      params.set('package', selectedPackageId);
    }
    if (tripType === 'outstation') {
      params.set('dropCity', dropCity);
      params.set('mode', outstationMode);
      if (returnDate) params.set('returnDate', returnDate);
    }
    if (tripType === 'airport') {
      params.set('airportMode', airportMode);
      params.set('airport', airportName);
    }

    window.location.href = `/chauffeur-service/${citySlug}/book?${params.toString()}`;
  };

  // Get selected package details
  const selectedPackage = localPackages.find(p => p.id === selectedPackageId);

  if (loadingData) {
    return (
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white py-20">
        <div className="container-custom flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white overflow-hidden">
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
          {/* Left - Hero Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Car className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium">Car Rental with Driver in {city}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Book Outstation, Local &{' '}
              <span className="text-emerald-300">Airport Cabs</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              All-inclusive fares with fuel & driver. Transparent pricing, no hidden charges.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8"
            >
              {[
                { icon: Shield, text: 'Verified Drivers' },
                { icon: Fuel, text: 'Fuel Included' },
                { icon: Star, text: '4.8★ Rating' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                >
                  <item.icon className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Trip type info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto lg:mx-0"
            >
              {tripType === 'local' && (
                <div className="text-sm text-emerald-100">
                  <strong className="text-white">Local Trips:</strong> Perfect for city travel, meetings, shopping.
                  Extra charges apply beyond package limits.
                </div>
              )}
              {tripType === 'outstation' && (
                <div className="text-sm text-emerald-100">
                  <strong className="text-white">
                    {outstationMode === 'round-trip' ? 'Round Trip:' : 'One Way:'}
                  </strong>{' '}
                  {outstationMode === 'round-trip'
                    ? 'Min 250 km/day. Driver allowance included. Best for multi-day trips.'
                    : 'Fixed fare for one-way drops. No return trip charges.'}
                </div>
              )}
              {tripType === 'airport' && (
                <div className="text-sm text-emerald-100">
                  <strong className="text-white">Airport Transfer:</strong> Includes 45 min waiting time.
                  Meet & greet service available.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right - Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Trip Type Tabs */}
            <div className="flex border-b">
              {[
                { id: 'local' as TripType, label: 'Local', icon: Navigation },
                { id: 'outstation' as TripType, label: 'Outstation', icon: MapPin },
                { id: 'airport' as TripType, label: 'Airport', icon: Plane },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTripType(tab.id);
                    setShowCarSelection(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition ${
                    tripType === tab.id
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {!showCarSelection ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* LOCAL TRIP */}
                    {tripType === 'local' && (
                      <>
                        {/* City */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                              value={pickupLocationId}
                              onChange={(e) => {
                                setPickupLocationId(e.target.value);
                                const loc = locations.find(l => l.id === e.target.value);
                                if (loc) setPickupCity(loc.name);
                              }}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                            >
                              <option value="">Select city</option>
                              {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Package Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Package
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {uniquePackages.slice(0, 3).map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setSelectedPackageId(pkg.id)}
                                className={`p-3 rounded-lg border-2 text-center transition ${
                                  selectedPackage?.hours === pkg.hours && selectedPackage?.kms === pkg.kms
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-200'
                                }`}
                              >
                                <div className="font-semibold text-gray-900">{pkg.hours} Hrs</div>
                                <div className="text-xs text-gray-500">{pkg.kms} Km</div>
                              </button>
                            ))}
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* OUTSTATION TRIP */}
                    {tripType === 'outstation' && (
                      <>
                        {/* One-way / Round-trip Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setOutstationMode('one-way')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'one-way'
                                ? 'bg-white text-emerald-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <ArrowRight className="w-4 h-4" />
                            One Way
                          </button>
                          <button
                            onClick={() => setOutstationMode('round-trip')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'round-trip'
                                ? 'bg-white text-emerald-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                            Round Trip
                          </button>
                        </div>

                        {/* From / To */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              From
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                              <select
                                value={pickupLocationId}
                                onChange={(e) => {
                                  setPickupLocationId(e.target.value);
                                  const loc = locations.find(l => l.id === e.target.value);
                                  if (loc) setPickupCity(loc.name);
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                              >
                                <option value="">Select city</option>
                                {locations.map((loc) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              To
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                              <select
                                value={dropLocationId}
                                onChange={(e) => {
                                  setDropLocationId(e.target.value);
                                  const loc = locations.find(l => l.id === e.target.value);
                                  if (loc) setDropCity(loc.name);
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                              >
                                <option value="">Select city</option>
                                {locations.filter(l => l.id !== pickupLocationId).map((loc) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          {outstationMode === 'round-trip' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Date
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="date"
                                  value={returnDate}
                                  onChange={(e) => setReturnDate(e.target.value)}
                                  min={pickupDate || new Date().toISOString().split('T')[0]}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          ) : (
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
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {outstationMode === 'round-trip' && (
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* AIRPORT TRANSFER */}
                    {tripType === 'airport' && (
                      <>
                        {/* Pickup / Drop Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setAirportMode('pickup')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'pickup'
                                ? 'bg-white text-emerald-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4" />
                            From Airport
                          </button>
                          <button
                            onClick={() => setAirportMode('drop')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'drop'
                                ? 'bg-white text-emerald-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4 rotate-45" />
                            To Airport
                          </button>
                        </div>

                        {/* Airport & Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {airportMode === 'pickup' ? 'Airport' : 'Pickup Address'}
                          </label>
                          <div className="relative">
                            {airportMode === 'pickup' ? (
                              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            ) : (
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            )}
                            <input
                              type="text"
                              value={airportMode === 'pickup' ? airportName : terminalAddress}
                              onChange={(e) =>
                                airportMode === 'pickup'
                                  ? setAirportName(e.target.value)
                                  : setTerminalAddress(e.target.value)
                              }
                              placeholder={
                                airportMode === 'pickup'
                                  ? `${city} Airport`
                                  : 'Enter pickup address'
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {airportMode === 'pickup' ? 'Drop Address' : 'Airport'}
                          </label>
                          <div className="relative">
                            {airportMode === 'drop' ? (
                              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            ) : (
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            )}
                            <input
                              type="text"
                              value={airportMode === 'drop' ? airportName : terminalAddress}
                              onChange={(e) =>
                                airportMode === 'drop'
                                  ? setAirportName(e.target.value)
                                  : setTerminalAddress(e.target.value)
                              }
                              placeholder={
                                airportMode === 'drop'
                                  ? `${city} Airport`
                                  : 'Enter drop address'
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {airportMode === 'pickup' ? 'Flight Arrival' : 'Pickup Date'}
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {airportMode === 'pickup' ? 'Arrival Time' : 'Pickup Time'}
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      Explore Cabs
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Info */}
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {tripType === 'local' &&
                          'Extra km and hour charges apply beyond package limits'}
                        {tripType === 'outstation' && outstationMode === 'round-trip' &&
                          'Min 250 km/day. Driver allowance included. Toll/parking extra'}
                        {tripType === 'outstation' && outstationMode === 'one-way' &&
                          'Fixed fare for one-way. Toll charges extra'}
                        {tripType === 'airport' && 'Includes 45 min waiting time at airport'}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  /* Car Selection */
                  <motion.div
                    key="cars"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Back Button */}
                    <button
                      onClick={() => setShowCarSelection(false)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                    >
                      ← Modify Search
                    </button>

                    {/* Trip Summary */}
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">
                          {tripType === 'local' && `${pickupCity} - ${selectedPackage?.hours || 8}hr/${selectedPackage?.kms || 80}km`}
                          {tripType === 'outstation' && `${pickupCity} → ${dropCity} (${outstationMode})`}
                          {tripType === 'airport' && `${airportMode === 'pickup' ? 'Airport → City' : 'City → Airport'}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-emerald-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
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

                    {/* Car Options */}
                    {!loadingPrices && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {vehicleCategories.map((vehicle) => {
                          const priceData = carPrices[vehicle.id];
                          const hasPrice = priceData?.success && priceData.pricing?.grandTotal > 0;

                          return (
                            <div
                              key={vehicle.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                                selectedCar === vehicle.id
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : hasPrice
                                    ? 'border-gray-200 hover:border-emerald-200'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                              }`}
                              onClick={() => hasPrice && setSelectedCar(vehicle.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {vehicle.image ? (
                                      <Image src={vehicle.image} alt={vehicle.name} width={56} height={40} className="object-contain" />
                                    ) : (
                                      <Car className="w-8 h-8 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      {Array.isArray(vehicle.exampleVehicles)
                                        ? vehicle.exampleVehicles.slice(0, 3).join(', ')
                                        : typeof vehicle.exampleVehicles === 'string' && vehicle.exampleVehicles
                                        ? vehicle.exampleVehicles.split(',').slice(0, 3).map((v: string) => v.trim()).join(', ')
                                        : 'Swift, Dzire, Innova'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {vehicle.seatingCapacity}
                                      </span>
                                      <span>•</span>
                                      <span>{vehicle.acType || 'AC'}</span>
                                      <span>•</span>
                                      <span>{vehicle.luggageCapacity || '2 Bags'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {hasPrice ? (
                                    <>
                                      <div className="text-xl font-bold text-gray-900">
                                        ₹{priceData.pricing.grandTotal.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {tripType === 'local' && 'All inclusive'}
                                        {tripType === 'outstation' && (
                                          priceData.pricingMethod === 'route_package'
                                            ? 'Fixed fare'
                                            : 'Incl. driver allowance'
                                        )}
                                        {tripType === 'airport' && 'Fixed fare'}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>Not available</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {selectedCar === vehicle.id && hasPrice && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 pt-4 border-t border-emerald-200"
                                >
                                  {/* Fare Breakdown */}
                                  <div className="text-xs space-y-1 text-gray-600 mb-4">
                                    {tripType === 'local' && priceData.pricing && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>Base fare ({selectedPackage?.hours}hr/{selectedPackage?.kms}km)</span>
                                          <span>₹{priceData.pricing.totalBeforeGst?.toLocaleString()}</span>
                                        </div>
                                        {priceData.pricing.extraKmCharge && (
                                          <div className="flex justify-between text-gray-400">
                                            <span>Extra km charge</span>
                                            <span>₹{priceData.pricing.extraKmCharge}/km</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {tripType === 'outstation' && priceData.calculation && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>Distance ({priceData.calculation.chargeableKm} km × ₹{priceData.calculation.perKmRate})</span>
                                          <span>₹{priceData.pricing.baseKmCharge?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Driver allowance ({priceData.calculation.days} day)</span>
                                          <span>₹{priceData.pricing.driverAllowance?.toLocaleString()}</span>
                                        </div>
                                        {priceData.pricing.tollEstimate && priceData.pricing.tollEstimate > 0 && (
                                          <div className="flex justify-between">
                                            <span>Toll estimate</span>
                                            <span>₹{priceData.pricing.tollEstimate?.toLocaleString()}</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {tripType === 'outstation' && priceData.routePackage && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>Fixed route fare ({priceData.routePackage.estimatedKm} km)</span>
                                          <span>₹{priceData.pricing.totalBeforeGst?.toLocaleString()}</span>
                                        </div>
                                      </>
                                    )}
                                    {!priceData.inclusions?.tollsIncluded && (
                                      <div className="flex justify-between text-amber-600">
                                        <span>Toll/Parking</span>
                                        <span>Extra (as applicable)</span>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleBook(vehicle.id)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Book {vehicle.name}
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
    </section>
  );
}
