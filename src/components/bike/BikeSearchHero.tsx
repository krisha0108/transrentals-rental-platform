'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Search, Bike, Shield, Star,
  Headphones, FileCheck, AlertCircle, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BikeSearchHeroProps {
  city?: string;
  citySlug?: string;
  pageHeading?: string;
  pageDescription?: string;
}

const FEATURE_HIGHLIGHTS = [
  { icon: Shield, label: 'Best Prices Guaranteed' },
  { icon: Bike, label: 'Well Maintained Bikes' },
  { icon: Headphones, label: '24/7 Roadside Assistance' },
  { icon: FileCheck, label: 'Easy Booking Process' },
];

const POPULAR_SEARCHES = ['Scooty', 'Sports Bike', 'Bullet', 'Activa', 'Honda', 'Yamaha'];

export function BikeSearchHero({ city = '', citySlug = '', pageHeading, pageDescription }: BikeSearchHeroProps) {
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

  const scrollToFleet = () => {
    document.getElementById('bikes-fleet')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative">
      {/* Hero image zone — sized to its own content, not the search card below */}
      <div className="relative bg-gradient-to-b from-emerald-50/60 via-white to-white overflow-hidden rounded-b-[2rem] md:rounded-b-[3rem]">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover"
            style={{ backgroundImage: "url('/images/sections/bike-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent md:via-white/10" />
        </div>

        <div className="relative container-custom pt-8 md:pt-10 pb-16 md:pb-24 min-h-[440px] md:min-h-[560px] lg:min-h-[640px] flex flex-col justify-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-emerald-700 bg-emerald-100 px-3.5 py-2 rounded-full mb-5">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              #1 BIKE RENTAL PLATFORM IN {city.toUpperCase()}
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
              {pageHeading ? (
                pageHeading
              ) : (
                <>
                  Bike on Rent
                  <br />
                  <span className="text-emerald-600">in {city}</span>
                </>
              )}
            </h1>
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-lg">
              {pageDescription || `Rent bikes at best prices and explore ${city} on two wheels. Flexible plans, easy booking, zero hassle.`}
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FEATURE_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl px-3.5 py-3.5 shadow-sm"
                >
                  <span className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2.25} />
                  </span>
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search card — floats on plain white, overlapping the hero's rounded edge */}
      <div className="relative container-custom -mt-24 md:-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-5 md:p-7"
        >
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-5">
            <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            Find Your Perfect Bike
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-2">
            {/* Pick-up Location */}
            <div className="lg:flex-1 lg:min-w-0">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Pick-up Location
              </label>
              <div className="flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium text-sm">
                {city}
              </div>
            </div>

            {/* Pickup Date */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="pickupDate" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Pickup Date
              </label>
              <input
                id="pickupDate"
                type="date"
                min={minBookingDate}
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  setErrors({ ...errors, pickupDate: '' });
                  setDateError('');
                  if (!dropDate || e.target.value > dropDate) {
                    setDropDate(e.target.value);
                  }
                }}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all text-sm',
                  errors.pickupDate ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.pickupDate && <p className="text-red-500 text-xs mt-1">{errors.pickupDate}</p>}
            </div>

            {/* Pickup Time */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="pickupTime" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Pickup Time
              </label>
              <select
                id="pickupTime"
                value={pickupTime}
                aria-label="Pickup time"
                onChange={(e) => {
                  setPickupTime(e.target.value);
                  setErrors({ ...errors, pickupTime: '' });
                  setDateError('');
                }}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all text-sm',
                  errors.pickupTime ? 'border-red-500' : 'border-gray-200'
                )}
              >
                <option value="">Select Time</option>
                {timeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.pickupTime && <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>}
            </div>

            {/* Return Date */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="dropDate" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Return Date
              </label>
              <input
                id="dropDate"
                type="date"
                min={pickupDate || minBookingDate}
                value={dropDate}
                onChange={(e) => {
                  setDropDate(e.target.value);
                  setErrors({ ...errors, dropDate: '' });
                }}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all text-sm',
                  errors.dropDate ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.dropDate && <p className="text-red-500 text-xs mt-1">{errors.dropDate}</p>}
            </div>

            {/* Return Time */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="dropTime" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Return Time
              </label>
              <select
                id="dropTime"
                value={dropTime}
                aria-label="Return time"
                onChange={(e) => {
                  setDropTime(e.target.value);
                  setErrors({ ...errors, dropTime: '' });
                }}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all text-sm',
                  errors.dropTime ? 'border-red-500' : 'border-gray-200'
                )}
              >
                <option value="">Select Time</option>
                {timeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.dropTime && <p className="text-red-500 text-xs mt-1">{errors.dropTime}</p>}
            </div>

            {/* Search Button — same row as the fields on large screens */}
            <div className="lg:shrink-0">
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Bikes
              </Button>
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
                className="flex items-start gap-2.5 p-3 mt-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-sm font-medium text-red-800">{dateError}</p>
                <button type="button" onClick={() => setDateError('')} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Searches */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 mr-1">Popular Searches:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={scrollToFleet}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="h-8 md:h-12 bg-white" />
    </section>
  );
}
