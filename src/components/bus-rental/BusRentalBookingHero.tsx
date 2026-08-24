'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Bus,
  Armchair,
  UserCheck,
  ShieldCheck,
  Tag,
  MapPin,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ArrowRight,
  Navigation,
  Home,
  CheckCircle2,
} from 'lucide-react';

type TripType = 'outstation' | 'local';

interface BusRentalBookingHeroProps {
  city: string;
  citySlug: string;
  heroImage?: string;
}

const HERO_FEATURES = [
  { icon: Armchair, text: '9 to 55 Seater', sub: 'AC & Non-AC' },
  { icon: UserCheck, text: 'Verified Drivers', sub: '& Staff' },
  { icon: ShieldCheck, text: 'Safe & Secure', sub: 'Journey' },
  { icon: Tag, text: 'Best Price', sub: 'Guaranteed' },
];

const HERO_STATS = [
  { icon: Users, value: '500+', label: 'Verified\nOperators' },
  { icon: CheckCircle2, value: '50K+', label: 'Happy\nCustomers' },
  { icon: Bus, value: '1000+', label: 'Buses\nAvailable' },
  { icon: Clock, value: '24/7', label: 'Customer\nSupport' },
];

const SEAT_OPTIONS = [
  { value: '9-20', label: '9–20 Seater (Tempo Traveller)' },
  { value: '20-32', label: '20–32 Seater (Mini Bus)' },
  { value: '35-45', label: '35–45 Seater (Standard Bus)' },
  { value: '45-55', label: '45–55 Seater (Luxury Coach)' },
];

const STEPS = ['Trip', 'Journey', 'Contact', 'Review'];

const FOOTER_STATS = [
  { icon: Tag, text: 'Best Price', sub: 'Guaranteed' },
  { icon: ShieldCheck, text: '500+ Verified', sub: 'Operators' },
  { icon: Clock, text: '15 Min', sub: 'Callback' },
  { icon: UserCheck, text: '24/7', sub: 'Support' },
];

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BusRentalBookingHero({
  city,
  citySlug,
  heroImage = '/images/sections/bus-rental-hero-bg.png',
}: BusRentalBookingHeroProps) {
  const [tripType, setTripType] = useState<TripType>('outstation');
  const [pickupDate, setPickupDate] = useState(() => toLocalDateString(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [seatRange, setSeatRange] = useState('');

  const handleExplore = () => {
    document.getElementById('bus-fleet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative bg-slate-50 text-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <Image src={heroImage} alt="" fill priority className="object-cover object-center" />
      </div>

      <div className="relative container-custom py-6 lg:py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-20 items-start">
          {/* LEFT — Marketing content */}
          <div className="lg:pr-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2 mb-5 shadow-sm"
            >
              <Bus className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Bus Rental in {city}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 leading-tight"
            >
              Explore {city}
              <br />
              Like <span className="text-green-600">Never Before</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-slate-500 mb-5 max-w-md"
            >
              Comfortable buses, professional drivers and transparent pricing for every journey in and around {city}.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
            >
              {HERO_FEATURES.map((item) => (
                <div key={item.text} className="flex flex-col items-start gap-2">
                  <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-slate-600 leading-snug">
                    <div className="font-semibold text-slate-900">{item.text}</div>
                    {item.sub}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg"
            >
              {HERO_STATS.map((stat) => (
                <div key={stat.value} className="flex flex-col items-start gap-1.5">
                  <stat.icon className="w-5 h-5 text-green-600" />
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 leading-snug whitespace-pre-line">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Booking wizard card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full lg:ml-auto lg:max-w-md"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-base">Book Your Bus</div>
                  <div className="text-green-100 text-xs">Free quote &bull; No advance payment</div>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-white rounded-full px-2.5 py-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Secure
              </span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 px-6 pt-4 text-xs font-medium text-slate-400 overflow-x-auto">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`flex items-center gap-1.5 ${idx === 0 ? 'text-green-700' : 'text-slate-400'}`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        idx === 0 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {step}
                  </span>
                  {idx < STEPS.length - 1 && <span className="w-5 h-px bg-slate-200" />}
                </div>
              ))}
            </div>

            <div className="p-6 pt-4">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">Trip Details</h2>
                <p className="text-xs text-slate-500">Tell us your travel plans</p>
              </div>

              {/* Trip Type */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Trip Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTripType('outstation')}
                    className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                      tripType === 'outstation'
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-green-200'
                    }`}
                  >
                    {tripType === 'outstation' && (
                      <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-green-600" />
                    )}
                    <Navigation className="w-4 h-4 text-green-600 mb-1.5" />
                    <div className="text-sm font-semibold text-slate-900">Outstation</div>
                    <div className="text-xs text-slate-500">Intercity, out of city</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('local')}
                    className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                      tripType === 'local'
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-green-200'
                    }`}
                  >
                    {tripType === 'local' && (
                      <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-green-600" />
                    )}
                    <Home className="w-4 h-4 text-green-600 mb-1.5" />
                    <div className="text-sm font-semibold text-slate-900">Local City</div>
                    <div className="text-xs text-slate-500">Within city travel</div>
                  </button>
                </div>
              </div>

              {/* Pickup City */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Pickup City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  <div className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-medium bg-white">
                    {city}
                  </div>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Pickup Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    <input
                      type="date"
                      aria-label="Pickup date"
                      value={pickupDate}
                      min={toLocalDateString(new Date())}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Pickup Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    <input
                      type="time"
                      aria-label="Pickup time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger / Seats */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Passenger / Seats</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                  <select
                    value={seatRange}
                    onChange={(e) => setSeatRange(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm bg-white appearance-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select seats or passengers</option>
                    {SEAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleExplore}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                Explore Buses
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Footer stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
                {FOOTER_STATS.map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="text-[11px] leading-tight text-slate-600">
                      <div className="font-semibold text-slate-900">{item.text}</div>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
