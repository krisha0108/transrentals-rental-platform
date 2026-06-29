'use client';

import React, { useState } from 'react';
import {
  MapPin, Star, Shield, Zap, MessageCircle,
  Loader2, CheckCircle2, ChevronRight, Phone,
  Users, Calendar, ArrowRight, BadgeCheck,
  Clock, Headphones, Minus, Plus, Bus, Navigation2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';
import { formatPriceHighlight } from '@/lib/utils';

/* ──────────────────────────── TYPES ──────────────────────────── */

interface FeatureProp {
  icon: 'star' | 'shield' | 'zap';
  text: string;
  color: string;
}

export interface ServiceHeroWithChatProps {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  pageHeading?: string;
  pageDescription?: string;
  serviceType?: string;
  features?: FeatureProp[];
  gradientFrom?: string;
  gradientTo?: string;
  showQuickForm?: boolean;
  cityName?: string;
  priceAnchor?: string;
  heroHighlights?: string[];
}

/* ──────────────────────────── CONSTANTS ──────────────────────── */

const TRIP_TYPES = [
  { value: 'outstation', label: 'Outstation', icon: '🛣️' },
  { value: 'local',      label: 'Local City', icon: '🏙️' },
  { value: 'wedding',    label: 'Wedding',    icon: '💍' },
  { value: 'corporate',  label: 'Corporate',  icon: '💼' },
];

/* ──────────────────────────── BUS BOOKING WIDGET ─────────────── */

function BusBookingWidget({ cityName, serviceType }: { cityName: string; serviceType?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [showChat, setShowChat] = useState(false);

  // Trip details
  const [tripType,       setTripType]       = useState('outstation');
  const [fromCity,       setFromCity]       = useState(cityName);
  const [pickupAddress,  setPickupAddress]  = useState('');
  const [toCity,         setToCity]         = useState('');
  const [dropAddress,    setDropAddress]    = useState('');
  const [travelDate,     setTravelDate]     = useState('');
  const [pickupTime,     setPickupTime]     = useState('09:00');
  const [returnDate,     setReturnDate]     = useState('');
  const [passengers,     setPassengers]     = useState(20);

  // Contact + extras
  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState('');

  const today      = new Date().toISOString().split('T')[0];
  const needReturn = tripType !== 'local';

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bus-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:   name.trim(),
          customerEmail:  `${phone.trim()}@transrentals.in`,
          customerPhone:  phone.trim(),
          pickupCity:     fromCity.trim(),
          pickupAddress:  pickupAddress.trim() || undefined,
          dropCity:       toCity.trim() || undefined,
          dropAddress:    dropAddress.trim() || undefined,
          pickupDate:     travelDate,
          pickupTime:     pickupTime,
          returnDate:     returnDate || undefined,
          passengers,
          tripType,
          requirements:   requirements.trim() || undefined,
          needAC: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS ── */
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-100"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h3 className="text-xl font-black text-gray-900 mb-2">You're all set! 🎉</h3>
        <p className="text-gray-500 text-sm mb-1">Our team will call <span className="font-bold text-gray-700">{name}</span> at</p>
        <p className="text-emerald-600 font-black text-lg mb-1">{phone}</p>
        <p className="text-gray-400 text-xs mb-6">within <span className="font-semibold text-gray-600">15 minutes</span></p>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm text-amber-700 font-medium">
          🚌 {passengers} passengers · {fromCity}{toCity ? ` → ${toCity}` : ''} · {tripType}
          {returnDate && <> · Return {returnDate}</>}
        </div>
        <button onClick={() => { setSuccess(false); setStep(1); setName(''); setPhone(''); setToCity(''); setPickupAddress(''); setDropAddress(''); setTravelDate(''); setReturnDate(''); setRequirements(''); }}
          className="mt-6 text-sm text-blue-600 hover:underline font-medium">
          New request
        </button>
      </div>
    );
  }

  /* ── CHAT MODE ── */
  if (showChat) {
    return (
      <div>
        <button onClick={() => setShowChat(false)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 font-medium">
          ← Back to Quick Quote
        </button>
        <DynamicChatBookingHero hideHeader serviceType={serviceType} />
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        <span className="text-xs text-gray-400 font-medium ml-1">
          {step === 1 ? 'Trip details' : 'Your contact'}
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Trip details ── */}
        {step === 1 && (
          <motion.form key="step1" onSubmit={handleStep1}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }} className="space-y-5">

            {/* Trip type pills */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">What kind of trip?</p>
              <div className="grid grid-cols-2 gap-2">
                {TRIP_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setTripType(t.value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                      tripType === t.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                    }`}>
                    <span className="text-lg leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* From → To */}
            <div className="space-y-2">
              {/* From city + pickup address */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <input required type="text" placeholder="From city" value={fromCity}
                  onChange={e => setFromCity(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
              </div>
              <input required type="text"
                placeholder={`Pickup address in ${fromCity || 'city'} (Building, Area, Landmark)`}
                value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />

              {/* Divider arrow */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* To city + drop address */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Navigation2 className="w-4 h-4 text-blue-600" />
                </div>
                <input type="text" placeholder="To city (optional for local trips)" value={toCity}
                  onChange={e => setToCity(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
              </div>
              {toCity && (
                <input type="text"
                  placeholder={`Drop address in ${toCity} (Building, Area, Landmark)`}
                  value={dropAddress} onChange={e => setDropAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
              )}
            </div>

            {/* Date + Time | Passengers */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left col: date stacked over time */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Travel Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="date" min={today} value={travelDate}
                      onChange={e => setTravelDate(e.target.value)}
                      className="w-full pl-10 pr-2 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pickup Time</p>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="time" value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="w-full pl-10 pr-2 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
                  </div>
                </div>
              </div>

              {/* Right col: Passengers */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Passengers</p>
                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-3 py-2.5 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <button type="button" onClick={() => setPassengers(p => Math.max(1, p - 5))}
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-400 transition-colors shrink-0">
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-lg font-black text-gray-900">{passengers}</span>
                    <p className="text-[10px] text-gray-400 leading-none">people</p>
                  </div>
                  <button type="button" onClick={() => setPassengers(p => Math.min(60, p + 5))}
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-400 transition-colors shrink-0">
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>

                {/* Capacity hint */}
                <div className="mt-2 space-y-1">
                  {passengers <= 12 && <p className="text-[10px] text-gray-400">💡 Tempo Traveller (9–12 seats)</p>}
                  {passengers > 12 && passengers <= 20 && <p className="text-[10px] text-gray-400">💡 Mini Bus (13–20 seats)</p>}
                  {passengers > 20 && passengers <= 35 && <p className="text-[10px] text-gray-400">💡 Standard Bus (21–35 seats)</p>}
                  {passengers > 35 && <p className="text-[10px] text-gray-400">💡 Luxury Coach (36–55 seats)</p>}
                </div>
              </div>
            </div>

            {/* Return Date (shown for outstation / wedding / corporate) */}
            {needReturn && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Return Date <span className="text-gray-300 font-normal normal-case">(optional · leave blank for one-way)</span>
                </p>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" min={travelDate || today} value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
                </div>
              </div>
            )}

            <button type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-emerald-200 text-base">
              Check Available Buses
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: Contact ── */}
        {step === 2 && (
          <motion.form key="step2" onSubmit={handleStep2}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }} className="space-y-4">

            {/* Trip summary pill */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <Bus className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-800 truncate">
                  {fromCity}{toCity ? ` → ${toCity}` : ''} · {passengers} pax
                </p>
                <p className="text-xs text-emerald-600 capitalize">
                  {tripType} · {travelDate ? `${travelDate} ${pickupTime}` : 'Date TBD'}
                  {returnDate ? ` → ${returnDate}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)}
                className="text-xs text-emerald-600 font-bold hover:underline shrink-0">
                Edit
              </button>
            </div>

            <div>
              <p className="text-sm font-black text-gray-800 mb-1">Where should we send the quotes?</p>
              <p className="text-xs text-gray-400 mb-4">We'll call you with the best bus options</p>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <input required type="text" placeholder="Your name" value={name}
                    onChange={e => { setName(e.target.value); setError(''); }}
                    className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <input required type="tel" placeholder="10-digit mobile number" value={phone} maxLength={10}
                    onChange={e => { setPhone(e.target.value); setError(''); }}
                    className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all" />
                </div>

                <div className="relative">
                  <textarea
                    placeholder="Any special requirements? e.g. decorations, AC bus, specific timing (optional)"
                    value={requirements}
                    onChange={e => { setRequirements(e.target.value); }}
                    rows={2}
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-emerald-200 text-base">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Getting Quotes…</>
                : <>Get Bus Quotes on WhatsApp <ChevronRight className="w-5 h-5" /></>}
            </button>

            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 text-xs text-gray-400"><BadgeCheck className="w-3.5 h-3.5 text-green-500" />Free</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3.5 h-3.5 text-blue-500" />15 min callback</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><Shield className="w-3.5 h-3.5 text-purple-500" />No spam</span>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Chat option */}
      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <button onClick={() => setShowChat(true)}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
          <MessageCircle className="w-4 h-4" />
          Prefer to chat? Talk to Shivi →
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────── MAIN EXPORT ────────────────────── */

export function ServiceHeroWithChat({
  badge,
  title,
  titleHighlight,
  description,
  pageHeading,
  pageDescription,
  serviceType,
  features = [
    { icon: 'star',   text: '4.8/5 Rating',    color: 'text-amber-500' },
    { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600'  },
    { icon: 'zap',    text: 'Instant Booking',  color: 'text-green-600' },
  ],
  gradientFrom  = 'purple-50',
  gradientTo    = 'blue-50',
  showQuickForm = false,
  cityName      = '',
  priceAnchor   = '',
  heroHighlights = [],
}: ServiceHeroWithChatProps) {

  /* ── PREMIUM HERO (showQuickForm = true) ── */
  if (showQuickForm) {
    const highlights = heroHighlights.length ? heroHighlights : [
      'Driver included on all trips',
      'AC & Non-AC · 9 to 55 seater buses',
      '500+ verified operators near you',
    ];

    return (
      <section id="booking" className="relative bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="container-custom relative py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center">

            {/* ── LEFT ── */}
            <div className="order-2 lg:order-1">
              {/* Location pill */}
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-4 py-2 rounded-full text-sm font-semibold mb-5 backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {formatPriceHighlight(badge)}
              </div>

              {/* Price anchor */}
              {priceAnchor && (
                <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/25 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5 ml-3">
                  ₹ {priceAnchor}
                </div>
              )}

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.08] mb-5 tracking-tight">
                {pageHeading || (
                  <>
                    {title}
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                      {formatPriceHighlight(titleHighlight)}
                    </span>
                  </>
                )}
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-md">
                {pageDescription || description}
              </p>

              {/* Highlights */}
              <ul className="space-y-3.5 mb-10">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                    <span className="text-gray-200 text-sm font-medium">{h}</span>
                  </li>
                ))}
              </ul>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-white text-xs font-bold">4.8 / 5</span>
                  <span className="text-gray-500 text-xs">2,400+ reviews</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span className="text-white text-xs font-bold">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <BadgeCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-xs font-bold">500+ Verified Buses</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: booking card ── */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Bus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-base leading-tight">Book Your Bus</p>
                      <p className="text-emerald-100 text-xs mt-0.5">Free quote · No advance payment</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <BusBookingWidget cityName={cityName} serviceType={serviceType} />
                </div>
              </div>

              <p className="text-center text-gray-500/70 text-xs mt-4">
                🔒 Your details are private · No spam calls
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── ORIGINAL LIGHT HERO (other services) ── */
  return (
    <section id="booking" className={`relative bg-gradient-to-br from-${gradientFrom} via-white to-${gradientTo} overflow-hidden`}>
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="container-custom relative py-12 md:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>{formatPriceHighlight(badge)}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {pageHeading || (
              <>
                {title}<br />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {formatPriceHighlight(titleHighlight)}
                </span>
              </>
            )}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {pageDescription || description}
          </p>
        </div>

        <DynamicChatBookingHero hideHeader serviceType={serviceType} />

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          {features.map((feature) => {
            const Icon = feature.icon === 'star' ? Star : feature.icon === 'shield' ? Shield : Zap;
            return (
              <div key={feature.text} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md ${feature.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
