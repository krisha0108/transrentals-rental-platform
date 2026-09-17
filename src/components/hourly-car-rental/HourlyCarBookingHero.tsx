'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, Car, ArrowRight,
  Users, Shield, Star, Fuel, Loader2, AlertCircle,
  Timer, Gauge, CheckCircle2, ChevronDown,
} from 'lucide-react';

// AM/PM time picker — dropdown, 30-min slots, same as car-rental
function TimePickerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const slots: { label: string; value24: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h >= 12 ? 'PM' : 'AM';
      const label = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      const value24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ label, value24 });
    }
  }
  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        value={value || '10:00'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer font-medium"
      >
        {slots.map((s) => (
          <option key={s.value24} value={s.value24}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
import { CarRentalBookingConfirmModal } from '@/components/car-rental/CarRentalBookingConfirmModal';

interface HourlyPackage {
  id: string;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  isPopular: boolean;
  vehicleCategory: {
    id: string;
    name: string;
    slug: string;
    seatingCapacity: number;
    luggageCapacity: string | null;
    acType: string | null;
    fuelType: string | null;
    image: string | null;
    exampleVehicles: string[];
  };
}

interface HourlyCarBookingHeroProps {
  cityName: string;
  citySlug: string;
  /** Opt-in: show the packages without their fares. The page this hero sits
   *  on quotes no rate anywhere, so the hero must not either. Off by default,
   *  so nothing else that mounts this component changes. */
  hidePrices?: boolean;
}

export function HourlyCarBookingHero({ cityName, citySlug, hidePrices = false }: HourlyCarBookingHeroProps) {
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [packages, setPackages] = useState<HourlyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPackages, setShowPackages] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [dateError, setDateError] = useState('');
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [expandedSectionPkgId, setExpandedSectionPkgId] = useState<string | null>(null);

  const MIN_ADVANCE_HOURS = 12;

  const getMinBookingDate = () => {
    const now = new Date();
    const minDateTime = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    return minDateTime.toISOString().split('T')[0];
  };

  const isPickupTooSoon = (date: string, time: string) => {
    const pickupDateTime = new Date(`${date}T${time || '00:00'}:00`);
    const now = new Date();
    const diffHours = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < MIN_ADVANCE_HOURS;
  };

  // Default date: earliest date where 10:00 AM is ≥12hrs away
  useEffect(() => {
    const now = new Date();
    const minPickup = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    const defaultPickup = new Date(minPickup);
    if (defaultPickup.getHours() >= 10) {
      defaultPickup.setDate(defaultPickup.getDate() + 1);
    }
    setPickupDate(defaultPickup.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/services/hourly-car-rental/packages?locationSlug=${citySlug}`
        );
        const data = await res.json();
        if (data.success) setPackages(data.packages || []);
      } catch (err) {
        console.error('Failed to fetch packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [citySlug]);

  // Auto-select first hours tab when packages load
  useEffect(() => {
    if (packages.length > 0 && selectedHours === null) {
      const hours = [...new Set(packages.map((p) => p.hours))].sort((a, b) => a - b);
      setSelectedHours(hours[0]);
    }
  }, [packages]);

  // Unique hour options sorted ascending
  const hourOptions = [...new Set(packages.map((p) => p.hours))].sort((a, b) => a - b);

  // Packages filtered by selected hours
  const filteredPackages = selectedHours !== null
    ? packages.filter((p) => p.hours === selectedHours)
    : packages;

  const minPrice = packages.length > 0 ? Math.min(...packages.map((p) => p.basePrice)) : 0;

  const handleSearch = () => {
    if (!pickupDate) {
      setDateError('Please select a pickup date.');
      setTimeout(() => setDateError(''), 5000);
      return;
    }
    if (isPickupTooSoon(pickupDate, pickupTime)) {
      const now = new Date();
      const earliest = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
      const formattedDate = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedTime = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      setDateError(`Booking requires at least ${MIN_ADVANCE_HOURS} hours advance notice. Earliest pickup: ${formattedDate}, ${formattedTime}.`);
      setTimeout(() => setDateError(''), 6000);
      return;
    }
    setDateError('');
    setShowPackages(true);
  };

  const handleBook = (pkg: HourlyPackage) => {
    if (!pickupDate) { alert('Please select pickup date first'); return; }
    setSelectedPkgId(pkg.id);
    setBookingDetails({
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
      tripType: 'local',
      pickupCity: cityName,
      pickupCitySlug: citySlug,
      pickupDate,
      pickupTime,
      packageId: pkg.id,
      packageName: pkg.name,
      packageHours: pkg.hours,
      packageKms: pkg.kms,
      pricing: {
        grandTotal: pkg.basePrice,
        totalBeforeGst: pkg.basePrice,
        gst: 0,
        basePrice: pkg.basePrice,
        hours: pkg.hours,
        kms: pkg.kms,
        extraKmCharge: pkg.extraKmCharge,
        extraHourCharge: pkg.extraHourCharge,
      },
      serviceSlug: 'car-rental',
    });
    setShowModal(true);
  };

  return (
    <>
      <section className="relative bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 text-white overflow-hidden">
        {/* Background pattern */}
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

            {/* Left — city info */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <Timer className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium">Hourly Car Rental — Driver Included</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              >
                Hourly Car Rental in{' '}
                <span className="text-blue-300">{cityName}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-blue-100 text-lg mb-6"
              >
                Book a car with driver by the hour. Perfect for meetings, errands, and city travel.
              </motion.p>

              {/* Min price */}
              {!hidePrices && minPrice > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto lg:mx-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-blue-200 text-sm">Starting from</p>
                      <p className="text-4xl font-bold">₹{minPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-sm">All inclusive</p>
                      <p className="text-lg font-semibold">Driver + Fuel</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {['✓ Driver included', '✓ Fuel included', '✓ AC car'].map((t) => (
                      <span key={t} className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                {[
                  { icon: Shield, text: 'Verified Drivers' },
                  { icon: Fuel, text: 'Fuel Included' },
                  { icon: Star, text: '4.8 Rating' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <item.icon className="w-4 h-4 text-blue-300" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — booking form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden text-gray-900"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Book Hourly Cab</h3>
                <p className="text-blue-100 text-sm mt-0.5">{cityName}</p>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {!showPackages ? (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {/* City display */}
                      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pickup City</p>
                          <p className="font-bold text-gray-900">{cityName}</p>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="date"
                              value={pickupDate}
                              onChange={(e) => { setPickupDate(e.target.value); setDateError(''); }}
                              min={getMinBookingDate()}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <TimePickerSelect value={pickupTime} onChange={setPickupTime} />
                        </div>
                      </div>

                      {dateError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{dateError}</span>
                        </div>
                      )}

                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>View Packages <ArrowRight className="w-5 h-5" /></>}
                      </button>

                      <p className="text-xs text-gray-400 text-center">Driver + fuel included in all packages</p>
                    </motion.div>

                  ) : (
                    <motion.div key="packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <button
                        onClick={() => setShowPackages(false)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        ← Modify Search
                      </button>

                      {/* Summary */}
                      <div className="bg-blue-50 rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 text-blue-800">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{cityName}</span>
                        <span className="text-blue-300">•</span>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{pickupTime}</span>
                      </div>

                      {/* No packages */}
                      {packages.length === 0 && (
                        <div className="py-8 text-center">
                          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No packages available for {cityName}</p>
                          <p className="text-gray-400 text-xs mt-1">Contact us for a custom quote</p>
                        </div>
                      )}

                      {/* Step 1: Hour duration tabs */}
                      {hourOptions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Select Package Duration</p>
                          <div className="flex flex-wrap gap-2">
                            {hourOptions.map((hr) => {
                              const kms = packages.find((p) => p.hours === hr)?.kms;
                              return (
                                <button
                                  key={hr}
                                  onClick={() => { setSelectedHours(hr); setSelectedPkgId(null); }}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                                    selectedHours === hr
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-gray-200 text-gray-700 hover:border-blue-300'
                                  }`}
                                >
                                  <Timer className="w-3.5 h-3.5" />
                                  {hr} hrs
                                  {kms && <span className={`text-[11px] font-normal ${selectedHours === hr ? 'text-blue-100' : 'text-gray-400'}`}>/ {kms} km</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Vehicles for selected duration */}
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {filteredPackages.map((pkg) => {
                          const cat = pkg.vehicleCategory;
                          const isSelected = selectedPkgId === pkg.id;
                          return (
                            <div
                              key={pkg.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                              onClick={() => setSelectedPkgId(isSelected ? null : pkg.id)}
                            >
                              {/* Top: vehicle info + price */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                    {cat.image ? (
                                      <Image src={cat.image} alt={cat.name} width={56} height={40} className="object-contain" />
                                    ) : (
                                      <Car className="w-8 h-8 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                                      {pkg.isPopular && (
                                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">Popular</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {cat.exampleVehicles?.slice(0, 2).join(', ') || 'Swift, Dzire'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{cat.seatingCapacity}</span>
                                      <span>•</span>
                                      <span>{cat.acType || 'AC'}</span>
                                      {cat.luggageCapacity && <><span>•</span><span>{cat.luggageCapacity}</span></>}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {!hidePrices && (
                                    <p className="text-xl font-bold text-gray-900">₹{pkg.basePrice.toLocaleString('en-IN')}</p>
                                  )}
                                  <p className="text-xs text-gray-500">All inclusive</p>
                                </div>
                              </div>

                              {/* Expanded: fare breakdown + book button */}
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 pt-4 border-t border-blue-200"
                                >
                                  <div className="text-xs space-y-1.5 text-gray-600 mb-4">
                                    {!hidePrices && (
                                      <>
                                        <div className="flex justify-between font-medium text-gray-800">
                                          <span>Base fare ({pkg.hours}hr/{pkg.kms}km)</span>
                                          <span>₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Extra km charge</span>
                                          <span>₹{pkg.extraKmCharge}/km</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Extra hour charge</span>
                                          <span>₹{pkg.extraHourCharge}/hr</span>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex justify-between text-amber-600">
                                      <span>Toll/Parking</span>
                                      <span>Extra (as applicable)</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBook(pkg); }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Book {cat.name}
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Packages section ── */}
      {!loading && packages.length > 0 && (
        <section className="py-14 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Available Packages in {cityName}
              </h2>
              <p className="text-gray-500">Choose your duration, then pick the vehicle that fits</p>
            </div>

            {/* Hour tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {hourOptions.map((hr) => {
                const kms = packages.find((p) => p.hours === hr)?.kms;
                const count = packages.filter((p) => p.hours === hr).length;
                return (
                  <button
                    key={hr}
                    onClick={() => { setSelectedHours(hr); setSelectedPkgId(null); setExpandedSectionPkgId(null); }}
                    className={`flex flex-col items-center px-6 py-3 rounded-xl border-2 font-semibold transition ${
                      selectedHours === hr
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <span className="text-lg">{hr} hrs</span>
                    {kms && <span className={`text-xs font-normal ${selectedHours === hr ? 'text-blue-100' : 'text-gray-400'}`}>{kms} km incl. • {count} vehicle{count !== 1 ? 's' : ''}</span>}
                  </button>
                );
              })}
            </div>

            {/* Vehicle grid — layout adapts to count */}
            <div className={
              filteredPackages.length === 1
                ? 'max-w-2xl mx-auto'
                : filteredPackages.length === 2
                ? 'grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto items-start'
                : filteredPackages.length === 3
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto items-start'
                : 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start'
            }>
              {filteredPackages.map((pkg) => {
                const cat = pkg.vehicleCategory;
                const isExpanded = expandedSectionPkgId === pkg.id;
                const isSingle = filteredPackages.length === 1;
                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden ${
                      isSingle ? 'flex flex-row' : 'flex flex-col'
                    } ${isExpanded ? 'ring-2 ring-blue-500' : ''} ${pkg.isPopular ? 'ring-2 ring-emerald-500' : ''}`}
                  >
                    {/* Popular badge */}
                    {pkg.isPopular && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⭐ POPULAR</span>
                      </div>
                    )}

                    {/* Vehicle image */}
                    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 ${
                      isSingle ? 'w-52 min-h-full py-6 px-8' : 'px-6 pt-6 pb-3 min-h-[100px]'
                    }`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} width={192} height={96} className="object-contain drop-shadow-sm" />
                      ) : (
                        <Car className="w-16 h-16 text-blue-300" />
                      )}
                    </div>

                    <div className={`p-5 flex flex-col flex-1 ${isSingle ? 'border-l border-gray-100' : ''}`}>
                      {/* Name + seats */}
                      <div className="mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                        <p className="text-xs text-gray-400">{cat.seatingCapacity} Seater</p>
                      </div>

                      {/* Example vehicles */}
                      {cat.exampleVehicles?.length > 0 && (
                        <p className="text-sm text-gray-500 mb-3">{cat.exampleVehicles.slice(0, 3).join(' / ')}</p>
                      )}

                      {/* Pills: AC, fuel, hours, km */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {cat.acType && <span className="bg-blue-50 text-blue-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{cat.acType}</span>}
                        {cat.fuelType && <span className="bg-green-50 text-green-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{cat.fuelType}</span>}
                        <span className="bg-indigo-50 text-indigo-600 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><Timer className="w-2.5 h-2.5" />{pkg.hours}hr</span>
                        <span className="bg-indigo-50 text-indigo-600 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><Gauge className="w-2.5 h-2.5" />{pkg.kms}km</span>
                      </div>

                      {/* Price */}
                      <div className={`mt-auto ${isSingle ? 'flex items-end gap-6' : ''}`}>
                        <div className={isSingle ? 'shrink-0' : ''}>
                          {!hidePrices && (
                            <div className="flex items-baseline gap-1 mb-0.5">
                              <span className="text-3xl font-bold text-gray-900">₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mb-4">All inclusive · driver + fuel</p>
                        </div>

                        <div className={`flex-1 ${isSingle ? '' : ''}`}>
                          {/* Fare breakdown toggle */}
                          <button
                            onClick={() => setExpandedSectionPkgId(isExpanded ? null : pkg.id)}
                            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mb-3"
                          >
                            {isExpanded ? 'Hide' : 'View'} fare breakdown
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2 mb-4">
                                  {!hidePrices && (
                                    <>
                                      <div className="flex justify-between font-semibold text-gray-800">
                                        <span>Base fare ({pkg.hours}hr / {pkg.kms}km)</span>
                                        <span>₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500">
                                        <span>Extra km charge</span>
                                        <span>₹{pkg.extraKmCharge}/km</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500">
                                        <span>Extra hour charge</span>
                                        <span>₹{pkg.extraHourCharge}/hr</span>
                                      </div>
                                    </>
                                  )}
                                  <div className="flex justify-between text-amber-600 pt-1 border-t border-gray-200">
                                    <span>Toll / Parking</span>
                                    <span>Extra (as applicable)</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => handleBook(pkg)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Book {cat.name}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Included / Good to know */}
            <div className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-center mb-6 text-gray-900">What's Included</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">✓ Included in fare</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {['Base fare for selected hours & km', 'Fuel charges', 'Driver charges & allowance', 'GST (as applicable)'].map((t) => (
                      <li key={t} className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span><span>{t}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">ℹ️ Good to know</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {['Extra km & hours charged as applicable', 'Toll & parking paid separately', 'Driver stays with you the full duration', '12 hrs advance booking required'].map((t) => (
                      <li key={t} className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span><span>{t}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <CarRentalBookingConfirmModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedPkgId(null); }}
        bookingDetails={bookingDetails}
      />
    </>
  );
}
