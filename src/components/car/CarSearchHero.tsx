'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search, Car, Shield, Star, Zap, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarSearchHeroProps {
  city: string;
  citySlug: string;
}

export function CarSearchHero({ city, citySlug }: CarSearchHeroProps) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

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

    // Navigate to fleet page with search params
    const searchParams = new URLSearchParams({
      city: citySlug,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
    });

    router.push(`/self-drive-car-rentals/${citySlug}/cars?${searchParams.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        {/* Car Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 text-[200px]">🚗</div>
          <div className="absolute bottom-20 left-20 text-[150px]">🔑</div>
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
              Self Drive Cars in {city}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Drive yourself without a driver. Hatchbacks, Sedans, SUVs starting ₹899/day.
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
              <KeyRound className="w-5 h-5 inline mr-2 text-blue-600" />
              Book Your Self-Drive Car
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
                  min={today}
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    setErrors({ ...errors, pickupDate: '' });
                    // Auto-set drop date if not set
                    if (!dropDate || e.target.value > dropDate) {
                      setDropDate(e.target.value);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
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
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
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
                  min={pickupDate || today}
                  value={dropDate}
                  onChange={(e) => {
                    setDropDate(e.target.value);
                    setErrors({ ...errors, dropDate: '' });
                  }}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
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
                    "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
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

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Available Cars
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
              { icon: Shield, text: 'Fully Insured', color: 'text-blue-300' },
              { icon: Zap, text: 'Instant Booking', color: 'text-yellow-300' },
              { icon: Car, text: '200+ Cars', color: 'text-white' },
              { icon: KeyRound, text: 'No Driver Needed', color: 'text-emerald-300' },
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
