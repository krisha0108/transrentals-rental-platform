'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Search, Bike, Shield, Star,
  Headphones, FileCheck, AlertCircle, X, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MiniDateInput, MiniTimeInput } from '@/components/booking/MiniDateInput';

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

interface ServiceCity {
  slug: string;
  name: string;
  displayName?: string;
}

// Searchable city dropdown — type to filter instead of scrolling a long
// native <select>. Mirrors the pattern used on CarSearchHero.
function CitySearchSelect({
  value, onChange, options, placeholder, error,
}: {
  value: string;
  onChange: (slug: string) => void;
  options: ServiceCity[];
  placeholder: string;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((o) => (o.displayName || o.name).toLowerCase().includes(query.toLowerCase()));
  const selected = options.find((o) => o.slug === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 border-2 rounded-xl text-sm text-left bg-white transition-all',
          open ? 'border-emerald-500 ring-2 ring-emerald-400/30' : (error ? 'border-red-400' : 'border-gray-200')
        )}
      >
        <span className={selected ? 'text-gray-900 font-medium truncate' : 'text-gray-400 truncate'}>
          {selected ? (selected.displayName || selected.name) : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Search city..."
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o.slug}
                type="button"
                onClick={() => { onChange(o.slug); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-emerald-50 transition',
                  o.slug === value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                )}
              >
                {o.displayName || o.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">No cities found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BikeSearchHero({ city = '', citySlug = '', pageHeading, pageDescription }: BikeSearchHeroProps) {
  const router = useRouter();

  // The service landing page (/bike-on-rent) has no city of its own, so the
  // pick-up field becomes a chooser there. City pages keep the fixed label.
  const cityFixed = !!citySlug;
  const [cities, setCities] = useState<ServiceCity[]>([]);
  const [chosenCity, setChosenCity] = useState('');

  useEffect(() => {
    if (cityFixed) return;
    let cancelled = false;
    fetch('/api/services/bike-on-rent/locations')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.locations) return;
        setCities(d.locations);
      })
      .catch(() => {
        // A failed list just leaves the chooser empty — the page still renders.
      });
    return () => { cancelled = true; };
  }, [cityFixed]);

  const searchCitySlug = cityFixed ? citySlug : chosenCity;
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

  const handleSearch = () => {
    const newErrors: Record<string, string> = {};

    if (!cityFixed && !chosenCity) newErrors.city = 'Please select a city';
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
      city: searchCitySlug,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
    });

    router.push(`/bike-on-rent/${searchCitySlug}/bikes?${searchParams.toString()}`);
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

        <div
          className={cn(
            'relative container-custom pb-16 md:pb-24 min-h-[440px] md:min-h-[560px] lg:min-h-[640px] flex flex-col justify-start',
            // The site header is fixed, and it is at its tallest in the tablet
            // range — where the breadcrumb strip above the city hero no longer
            // clears it, so both variants reserve extra room there. The landing
            // page has nothing above it at all, so it reserves the most.
            cityFixed ? 'pt-8 md:pt-24 lg:pt-10' : 'pt-16 md:pt-32 lg:pt-24',
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-emerald-700 bg-emerald-100 px-3.5 py-2 rounded-full mb-5">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              #1 BIKE RENTAL PLATFORM {city ? `IN ${city.toUpperCase()}` : 'IN INDIA'}
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
              {pageHeading ? (
                pageHeading
              ) : city ? (
                <>
                  Bike on Rent
                  <br />
                  <span className="text-emerald-600">in {city}</span>
                </>
              ) : (
                <>
                  Rent Bikes
                  <br />
                  <span className="text-emerald-600">Starting @&#8377;399/Day</span>
                </>
              )}
            </h1>
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-lg">
              {pageDescription ||
                (city
                  ? `Rent bikes at best prices and explore ${city} on two wheels. Flexible plans, easy booking, zero hassle.`
                  : 'Royal Enfield, KTM, Honda, Yamaha and more across 500+ cities. Flexible plans, easy booking, zero hassle.')}
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
      {/* Pulled further up over the hero on desktop so the search card sits
          closer to the headline. Mobile keeps the smaller offset — the feature
          cards wrap to two rows there, and a big pull hides the second row
          behind this card. Tablets sit between the two: the hero is short but
          the cards are already in one row, so they need a middle value. */}
      <div
        className={cn(
          'relative container-custom -mt-8',
          // The landing page reserves extra room at the top for the fixed
          // header, which makes its hero taller — so it pulls the card up
          // further to keep the same gap under the feature cards.
          cityFixed ? 'md:-mt-16 lg:-mt-44' : 'lg:-mt-[7.5rem]',
        )}
      >
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
              {cityFixed ? (
                <div className="flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium text-sm">
                  {city}
                </div>
              ) : (
                <>
                  <CitySearchSelect
                    value={chosenCity}
                    onChange={(slug) => {
                      setChosenCity(slug);
                      setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    options={cities}
                    placeholder={cities.length ? 'Select city' : 'Loading cities…'}
                    error={errors.city}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </>
              )}
            </div>

            {/* Pickup Date */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="pickupDate" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Pickup Date
              </label>
              <MiniDateInput
                value={pickupDate}
                min={minBookingDate}
                error={errors.pickupDate}
                onChange={(v) => {
                  setPickupDate(v);
                  setErrors({ ...errors, pickupDate: '' });
                  setDateError('');
                  if (!dropDate || v > dropDate) {
                    setDropDate(v);
                  }
                }}
              />
              {errors.pickupDate && <p className="text-red-500 text-xs mt-1">{errors.pickupDate}</p>}
            </div>

            {/* Pickup Time */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="pickupTime" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Pickup Time
              </label>
              <MiniTimeInput
                value={pickupTime}
                error={errors.pickupTime}
                onChange={(v) => {
                  setPickupTime(v);
                  setErrors({ ...errors, pickupTime: '' });
                  setDateError('');
                }}
              />
              {errors.pickupTime && <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>}
            </div>

            {/* Return Date */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="dropDate" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Return Date
              </label>
              <MiniDateInput
                value={dropDate}
                min={pickupDate || minBookingDate}
                error={errors.dropDate}
                onChange={(v) => {
                  setDropDate(v);
                  setErrors({ ...errors, dropDate: '' });
                }}
              />
              {errors.dropDate && <p className="text-red-500 text-xs mt-1">{errors.dropDate}</p>}
            </div>

            {/* Return Time */}
            <div className="lg:flex-1 lg:min-w-0">
              <label htmlFor="dropTime" className="block text-xs font-semibold text-gray-500 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Return Time
              </label>
              <MiniTimeInput
                value={dropTime}
                error={errors.dropTime}
                onChange={(v) => {
                  setDropTime(v);
                  setErrors({ ...errors, dropTime: '' });
                }}
              />
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
