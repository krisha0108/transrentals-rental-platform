'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search, Car, Shield, Star, Zap, KeyRound, AlertCircle, X, ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocations } from '@/components/booking/useLocations';
import { MiniDateInput, MiniTimeInput } from '@/components/booking/MiniDateInput';

interface CarSearchHeroProps {
  city: string;
  citySlug: string;
  pageHeading?: string;
  pageDescription?: string;
  // When true, the city pill becomes a real dropdown (populated from the
  // self-drive service's assigned locations) instead of a fixed label — for
  // hub-style pages (e.g. the main /self-drive-car-rentals page) that have
  // no single city of their own. `city`/`citySlug` are just the initial
  // selection in this mode.
  citySelectable?: boolean;
}

// Searchable city dropdown — type to filter instead of scrolling a long
// native <select>. Only used in citySelectable mode (hub pages with no
// single fixed city of their own).
function CitySearchSelect({
  value, onChange, options, error,
}: {
  value: string;
  onChange: (slug: string) => void;
  options: { slug?: string; name: string }[];
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find((o) => (o.slug || '') === value);

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
          'w-full flex items-center justify-between gap-2 px-4 py-3.5 border-2 rounded-xl text-base text-left bg-white transition-all',
          open ? 'border-primary ring-2 ring-primary/30' : (error ? 'border-red-500' : 'border-gray-200')
        )}
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {selected ? selected.name : 'Select city'}
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
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search city..."
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o.slug || o.name}
                type="button"
                onClick={() => { onChange(o.slug || ''); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-primary-50 transition',
                  (o.slug || '') === value ? 'bg-primary-50 text-primary font-medium' : 'text-gray-700'
                )}
              >
                {o.name}
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

export function CarSearchHero({ city, citySlug, pageHeading, pageDescription, citySelectable = false }: CarSearchHeroProps) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateError, setDateError] = useState('');

  const { locations } = useLocations(citySelectable ? { serviceSlug: 'self-drive-car-rental' } : {});
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const selectedCity = citySelectable
    ? locations.find((l) => (l.slug || '') === selectedCitySlug)?.name || city
    : city;
  const effectiveCitySlug = citySelectable ? selectedCitySlug : citySlug;

  // Default to the first available city once the list loads, if the page
  // didn't pass an initial one — keeps the search usable without forcing
  // the visitor to open the dropdown first.
  useEffect(() => {
    if (citySelectable && !selectedCitySlug && locations.length > 0) {
      setSelectedCitySlug(locations[0].slug || '');
    }
  }, [citySelectable, selectedCitySlug, locations]);

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

    if (citySelectable && !effectiveCitySlug) newErrors.city = 'Please select a city';
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
      city: effectiveCitySlug,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
    });

    router.push(`/self-drive-car-rentals/${effectiveCitySlug}/cars?${searchParams.toString()}`);
  };

  return (
    <section className="relative bg-slate-50 text-slate-900 overflow-hidden rounded-b-[2rem] md:rounded-b-[3rem]">
      {/* Hero photo par ek saman kaala parda — kisi ek taraf gehra nahi,
          warna ek side kaali aur doosri chamakdaar dikhti hai. Uske upar
          sirf halka upar-neeche ka gehrapan, cinematic depth ke liye. */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover"
          style={{
            backgroundImage: "url('/images/sections/self-drive-hero-bg.webp')",
            backgroundPosition: '42% 46%',
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-transparent to-black/28" />
      </div>

      <div className="relative container-custom pt-8 md:pt-24 pb-12 lg:pt-24 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-16 items-start lg:items-center">

          {/* LEFT — booking form. Chaudai bus-rental ke card jitni (max-w-md),
              isliye fields ek ke neeche ek. */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 lg:order-1 lg:mt-12 w-full lg:max-w-xl bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-7 md:p-8"
          >
            <div className="flex items-center gap-2.5 text-gray-900 font-bold text-lg mb-6">
              <span className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-primary" />
              </span>
              Book Your Self-Drive Car
            </div>

            <div className="flex flex-col gap-4 mb-2">
                {/* City (only in dropdown mode) */}
                {citySelectable && (
                  <div className="min-w-0">
                    <label htmlFor="citySelect" className="block text-sm font-semibold text-gray-500 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1 -mt-0.5" />
                      City
                    </label>
                    <CitySearchSelect
                      value={selectedCitySlug}
                      onChange={(slug) => {
                        setSelectedCitySlug(slug);
                        setErrors({ ...errors, city: '' });
                      }}
                      options={locations}
                      error={errors.city}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                )}

  

              {/* Pickup — date aur time ek hi qatar me, taaki card chhota rahe */}
              <div className="grid grid-cols-2 gap-3">
                {/* Pickup Date */}
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
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
                        // Auto-set drop date if not set
                        if (!dropDate || v > dropDate) {
                          setDropDate(v);
                        }
                      }}
                    />
                    {errors.pickupDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>
                    )}
                  </div>



                {/* Pickup Time */}
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
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
                    {errors.pickupTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.pickupTime}</p>
                    )}
                  </div>


              </div>

              {/* Drop-off — wahi jodi */}
              <div className="grid grid-cols-2 gap-3">
                {/* Drop Date */}
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
                      Drop-off Date
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
                    {errors.dropDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.dropDate}</p>
                    )}
                  </div>



                {/* Drop Time */}
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
                      Drop-off Time
                    </label>
                    <MiniTimeInput
                      value={dropTime}
                      error={errors.dropTime}
                      onChange={(v) => {
                        setDropTime(v);
                        setErrors({ ...errors, dropTime: '' });
                      }}
                    />
                    {errors.dropTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.dropTime}</p>
                    )}
                  </div>
              </div>

              {/* Search Button — form ke neeche, poori chaudai me */}
              <div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary-600 text-white font-bold px-8 py-3.5 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Cars
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
              {/* Car Rental (with driver) promo link */}
              <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4 shrink-0 text-primary" />
                  <span>Need a driver? Book a car with a professional chauffeur.</span>
                </div>
                <a
                  href={`/car-rental${effectiveCitySlug ? `/${effectiveCitySlug}` : ''}`}
                  className="font-bold text-primary hover:text-primary-600 flex items-center gap-1 shrink-0"
                >
                  Car Rental
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
          </motion.div>

          {/* RIGHT — location pill, title, description aur chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 lg:order-2 min-w-0 lg:pt-2"
          >
            {/* Location pill — chuni hui city, photo par tairti hui */}
            <div className="inline-flex items-center gap-2.5 bg-white shadow-lg shadow-black/20 ring-1 ring-black/[0.04] pl-2 pr-4 py-2 rounded-full mb-6">
              <span className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-primary-600" />
              </span>
              <span className="text-gray-900 font-bold text-[13.5px] tracking-tight">{selectedCity || 'Select your city'}</span>
            </div>

            {/* Title — doosra hissa brand hare me, jaise baaki service heroes me */}
            <h1
              className="text-[2.5rem] leading-[1.03] md:text-5xl lg:text-[3.75rem] font-black tracking-tight text-white mb-4 max-w-[16ch]"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 28px rgba(0,0,0,0.55)' }}
            >
              {pageHeading || (citySelectable ? (
                <>
                  Self Drive Cars
                  <br />
                  <span className="text-primary-400">Across India</span>
                </>
              ) : (
                <>
                  Self Drive Cars
                  <br />
                  <span className="text-primary-400">in {selectedCity}</span>
                </>
              ))}
            </h1>

            <p
              className="text-[15.5px] md:text-[18px] leading-relaxed text-white font-medium max-w-[31rem]"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 28px rgba(0,0,0,0.55)' }}
            >
              {pageDescription || `Drive yourself without a driver. Hatchbacks, Sedans, SUVs starting ₹899/day.`}
            </p>

            {/* Trust Badges — barabar chaudai ke khaanon me, taaki qatarein sidhi rahein */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7 lg:mt-9 max-w-[35rem]">
              {[
                { icon: Star, text: '4.8/5 Rating' },
                { icon: Shield, text: 'Fully Insured' },
                { icon: Zap, text: 'Instant Booking' },
                { icon: Car, text: '200+ Cars' },
                { icon: KeyRound, text: 'No Driver Needed' },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 shadow-lg shadow-black/20 ring-1 ring-black/[0.04]"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <badge.icon className="w-[18px] h-[18px] text-primary-600" strokeWidth={2.25} />
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 leading-tight whitespace-nowrap">{badge.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
