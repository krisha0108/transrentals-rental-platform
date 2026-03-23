'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search, Bike, Shield, Star, Zap, AlertCircle, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BikeSearchHeroProps {
  city: string;
  citySlug: string;
  pageHeading?: string;
  pageDescription?: string;
}

export function BikeSearchHero({ city, citySlug, pageHeading, pageDescription }: BikeSearchHeroProps) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateError, setDateError] = useState('');

  // Minimum advance booking: pickup must be at least 12 hours from now
  const MIN_ADVANCE_HOURS = 12;

  const getMinBookingDate = () => {
    const now = new Date();
    const minDateTime = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    return minDateTime.toISOString().split('T')[0];
  };

  const isPickupTooSoon = (date: string, time: string) => {
    const pickupDateTime = new Date(`${date}T${time || '00:00'}:00`);
    const now = new Date();
    const diffMs = pickupDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < MIN_ADVANCE_HOURS;
  };

  const minBookingDate = getMinBookingDate();

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      const time24 = `${hour}:${minute}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const timeLabel = `${hour12}:${minute} ${ampm}`;
      timeOptions.push({ value: time24, label: timeLabel });
    }
  }

  const handleSearch = () => {
    const newErrors: Record<string, string> = {};

    if (!pickupDate) newErrors.pickupDate = 'Please select pickup date';
    if (!pickupTime) newErrors.pickupTime = 'Please select pickup time';
    if (!dropDate) newErrors.dropDate = 'Please select drop date';
    if (!dropTime) newErrors.dropTime = 'Please select drop time';

    // Validate drop date is after pickup date
    if (pickupDate && dropDate && pickupDate > dropDate) {
      newErrors.dropDate = 'Drop date must be after pickup date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate pickup date+time is at least 12 hours from now
    if (isPickupTooSoon(pickupDate, pickupTime)) {
      const now = new Date();
      const earliest = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
      const formattedDate = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedTime = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      setDateError(`Booking requires at least ${MIN_ADVANCE_HOURS} hours advance notice. Earliest pickup: ${formattedDate}, ${formattedTime}.`);
      setTimeout(() => setDateError(''), 5000);
      return;
    }
    setDateError('');

    // Navigate to fleet page with search params
    const searchParams = new URLSearchParams({
      city: citySlug,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
    });

    router.push(`/bike-on-rent/${citySlug}/bikes?${searchParams.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        {/* Bike Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 text-[200px]">🏍️</div>
          <div className="absolute bottom-20 left-20 text-[150px]">🛵</div>
        </div>
      </div>

      <div className="container-custom relative py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-white font-medium">{city}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {pageHeading || `Bike Rentals in ${city}`}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {pageDescription || `Rent bikes & scooters starting ₹299/day. Royal Enfield, Activa, KTM & more.`}
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Search Your Next Ride
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Pickup Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Pickup Date
                </label>
                <input
                  type="date"
                  min={minBookingDate}
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    setErrors({ ...errors, pickupDate: '' });
                    setDateError('');
                    // Auto-set drop date if not set
                    if (!dropDate || e.target.value > dropDate) {
                      setDropDate(e.target.value);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all",
                    errors.pickupDate ? "border-red-500" : "border-gray-200"
                  )}
                />
                {errors.pickupDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.pickupDate}</p>
                )}
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Pickup Time
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => {
                    setPickupTime(e.target.value);
                    setErrors({ ...errors, pickupTime: '' });
                    setDateError('');
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all",
                    errors.pickupTime ? "border-red-500" : "border-gray-200"
                  )}
                >
                  <option value="">Select Time</option>
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.pickupTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>
                )}
              </div>

              {/* Drop Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Drop-off Date
                </label>
                <input
                  type="date"
                  min={pickupDate || minBookingDate}
                  value={dropDate}
                  onChange={(e) => {
                    setDropDate(e.target.value);
                    setErrors({ ...errors, dropDate: '' });
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all",
                    errors.dropDate ? "border-red-500" : "border-gray-200"
                  )}
                />
                {errors.dropDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dropDate}</p>
                )}
              </div>

              {/* Drop Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Drop-off Time
                </label>
                <select
                  value={dropTime}
                  onChange={(e) => {
                    setDropTime(e.target.value);
                    setErrors({ ...errors, dropTime: '' });
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all",
                    errors.dropTime ? "border-red-500" : "border-gray-200"
                  )}
                >
                  <option value="">Select Time</option>
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.dropTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.dropTime}</p>
                )}
              </div>
            </div>

            {/* Date Validation Error */}
            <AnimatePresence>
              {dateError && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2.5 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm font-medium text-red-800">{dateError}</p>
                  <button
                    type="button"
                    onClick={() => setDateError('')}
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Available Bikes
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6 mt-8"
          >
            {[
              { icon: Star, text: '4.8/5 Rating', color: 'text-amber-400' },
              { icon: Shield, text: 'Fully Insured', color: 'text-emerald-300' },
              { icon: Zap, text: 'Instant Booking', color: 'text-yellow-300' },
              { icon: Bike, text: '500+ Bikes', color: 'text-white' },
            ].map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <badge.icon className={cn("w-5 h-5", badge.color)} />
                <span className="text-white font-medium text-sm">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
