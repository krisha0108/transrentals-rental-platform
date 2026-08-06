'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Star, Shield, Zap, MessageCircle,
  Loader2, CheckCircle2, ChevronRight, Phone,
  Users, Calendar, ArrowRight, BadgeCheck,
  Clock, Headphones, Minus, Plus, Bus, Navigation2,
  Search, ChevronDown, X, Check, ArrowLeft, User, Lock, Home, Flag,
  HardHat, Wrench, Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';
import { formatPriceHighlight } from '@/lib/utils';
import { useCustomerAuth } from '@/hooks/useCustomer';

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
  bookingVariant?: 'bus' | 'equipment';
}

/* ──────────────────────────── CONSTANTS ──────────────────────── */

const TRIP_TYPES = [
  { value: 'outstation', label: 'Outstation', sub: 'Intercity, out of city', Icon: Navigation2 },
  { value: 'local',      label: 'Local City',  sub: 'Within city travel',    Icon: Home },
];

const REQUIREMENT_CHIPS = [
  'AC', 'Non AC', 'Decoration', 'Music System',
  'Extra Luggage', 'Pushback Seats', 'Wheelchair', 'Other',
];

function getVehicleReco(pax: number) {
  if (pax <= 12) return { name: '12 Seater Tempo Traveller', desc: 'Ideal for 8–12 passengers with luggage' };
  if (pax <= 20) return { name: 'Mini Bus',         desc: 'Ideal for 13–20 passengers' };
  if (pax <= 35) return { name: 'Standard Bus',     desc: 'Ideal for 21–35 passengers' };
  return           { name: 'Luxury Coach',          desc: 'Ideal for large groups 36+' };
}

/* ──────────────────────────── CITY PICKER ────────────────────── */

interface CityPickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  locations: { name: string }[];
  allowCustom?: boolean;
  icon: React.ReactNode;
}

function CityPicker({ value, onChange, placeholder, locations, allowCustom, icon }: CityPickerProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = locations
    .filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 [&>svg]:w-4 [&>svg]:h-4">
        {icon}
      </span>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`w-full h-[46px] pl-10 pr-9 bg-white border text-sm text-left transition-all rounded-xl ${
          value ? 'text-gray-800 font-medium' : 'text-gray-400'
        } ${open ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
      >
        {value || placeholder}
      </button>
      {value && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onChange(''); }}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-black/10 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search city…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {allowCustom && search.trim() && !filtered.some(l => l.name.toLowerCase() === search.toLowerCase()) && (
              <button type="button"
                onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors border-b border-gray-50">
                + Add &ldquo;{search.trim()}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !(allowCustom && search.trim()) && (
              <p className="text-center text-sm text-gray-400 py-5">No cities found</p>
            )}
            {filtered.map(loc => (
              <button key={loc.name} type="button"
                onClick={() => { onChange(loc.name); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === loc.name ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── PROGRESS BAR ───────────────────── */

const DEFAULT_PROGRESS_STEPS = [
  { n: 1, label: 'Trip' },
  { n: 2, label: 'Journey' },
  { n: 3, label: 'Contact' },
  { n: 4, label: 'Review' },
];

function ProgressBar({ step, steps = DEFAULT_PROGRESS_STEPS }: { step: number; steps?: { n: number; label: string }[] }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
              step > s.n
                ? 'bg-emerald-500 text-white'
                : step === s.n
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                : 'bg-white border border-gray-200 text-gray-400'
            }`}>
              {step > s.n ? <Check className="w-3 h-3" /> : s.n}
            </div>
            <span className={`text-[11.5px] font-semibold whitespace-nowrap ${step >= s.n ? 'text-emerald-700' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-[2px] bg-gray-200 rounded-full overflow-hidden mx-0.5">
              <div className={`h-full bg-emerald-500 transition-all duration-500 ${step > s.n ? 'w-full' : 'w-0'}`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ──────────────────────────── REVIEW HELPERS ─────────────────── */

function ReviewSection({ title, icon, onEdit, children }: {
  title: string; icon: React.ReactNode; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3.5 mb-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <span className="text-emerald-600 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
          {title}
        </span>
        <button type="button" onClick={onEdit}
          className="text-[11.5px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
    </div>
  );
}

function RV({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10.5px] text-gray-400">{label}</p>
      <p className="text-[12.5px] font-semibold text-gray-800 mt-0.5 break-words">{value || '—'}</p>
    </div>
  );
}

/* ──────────────────────────── BUS BOOKING WIDGET ─────────────── */

type FormStep = 1 | 2 | 3 | 4 | 5;

function BusBookingWidget({ cityName, serviceType }: { cityName: string; serviceType?: string }) {
  const [step, setStep] = useState<FormStep>(1);

  const [locations, setLocations] = useState<{ name: string }[]>([]);
  useEffect(() => {
    fetch('/api/locations?serviceSlug=bus-rental&type=CITY')
      .then(r => r.json())
      .then(d => { if (d.locations) setLocations(d.locations); })
      .catch(() => {});
  }, []);

  const { customer, isAuthenticated } = useCustomerAuth();

  // Step 1 – Trip
  const [tripType,      setTripType]      = useState('outstation');
  const [fromCity,      setFromCity]      = useState(cityName);
  const [pickupAddress, setPickupAddress] = useState('');
  const [toCity,        setToCity]        = useState('');
  const [dropAddress,   setDropAddress]   = useState('');
  const [err1,          setErr1]          = useState('');

  // Step 2 – Journey
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [passengers, setPassengers] = useState(10);
  const [paxRaw,     setPaxRaw]     = useState('10');
  const [err2,       setErr2]       = useState('');

  // Step 3 – Contact + requirements
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [guestOverride, setGuestOverride] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [notes,         setNotes]         = useState('');
  const [err3,          setErr3]          = useState('');

  // Submit
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const today  = new Date().toISOString().split('T')[0];
  const vReco  = getVehicleReco(passengers);
  const showAutoFill = isAuthenticated && !!customer && !guestOverride;

  useEffect(() => {
    if (isAuthenticated && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
    }
  }, [isAuthenticated, customer]);

  const toggleChip = (chip: string) =>
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);

  const onStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity.trim())    { setErr1('Please select a pickup city'); return; }
    if (!pickupAddress.trim()) { setErr1('Please enter a pickup address'); return; }
    if (!toCity.trim())      { setErr1('Please select a drop city'); return; }
    if (!dropAddress.trim()) { setErr1('Please enter a drop address'); return; }
    setErr1(''); setStep(2);
  };

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) { setErr2('Please select a journey date'); return; }
    setErr2(''); setStep(3);
  };

  const onStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr3('Please enter your name'); return; }
    if (phone.replace(/\D/g, '').length < 10) { setErr3('Please enter a valid 10-digit mobile number'); return; }
    setErr3(''); setStep(4);
  };

  const onSubmit = async () => {
    setLoading(true); setSubmitErr('');
    try {
      const req = [
        ...selectedChips,
        ...(notes.trim() ? [notes.trim()] : []),
      ].join(', ') || undefined;

      const res = await fetch('/api/bus-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:  name.trim(),
          customerEmail: `${phone.trim()}@transrentals.in`,
          customerPhone: phone.trim(),
          pickupCity:    fromCity.trim(),
          pickupAddress: pickupAddress.trim() || undefined,
          dropCity:      toCity.trim() || undefined,
          dropAddress:   dropAddress.trim() || undefined,
          pickupDate:    travelDate,
          pickupTime,
          returnDate:    returnDate || undefined,
          passengers,
          tripType,
          requirements:  req,
          needAC:        selectedChips.includes('AC'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStep(5);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setTravelDate(''); setReturnDate(''); setToCity('');
    setPickupAddress(''); setDropAddress(''); setNotes(''); setSelectedChips([]);
    setGuestOverride(false);
    if (!isAuthenticated) { setName(''); setPhone(''); }
  };

  /* shared styles */
  const inputCls = "w-full h-[46px] pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all";
  const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-4 [&>svg]:h-4";
  const lblCls   = "block text-xs font-semibold text-gray-800 mb-1.5";
  const backBtn  = "flex-none w-[88px] h-12 border border-gray-200 bg-white text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-gray-50 hover:text-gray-700 transition-all text-sm";
  const nextBtn  = "flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 text-sm";

  /* ── SUCCESS ── */
  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-2">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mb-4"
        >
          <svg viewBox="0 0 52 52" className="w-20 h-20">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#16C47F" strokeWidth="2.5" />
            <path fill="none" stroke="#16C47F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
          </svg>
        </motion.div>
        <h2 className="text-[21px] font-black text-gray-900 mb-2">You&apos;re all set</h2>
        <p className="text-sm text-gray-500 mb-4">Our operators are preparing your quotes.</p>
        <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5">
          <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-left">
            <small className="block text-[11px] text-gray-400">Expected callback</small>
            <b className="text-sm text-emerald-700">within 15 minutes</b>
          </div>
        </div>
        <button onClick={resetForm} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
          New Request
        </button>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar step={step} />

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Trip Details ── */}
        {step === 1 && (
          <motion.form key="s1" onSubmit={onStep1}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Trip Details</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">Let&apos;s start with where you&apos;re headed.</p>
            </div>

            <label className={lblCls}>Trip Type</label>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              {TRIP_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setTripType(t.value)}
                  className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    tripType === t.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-px'
                  }`}>
                  <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${tripType === t.value ? 'bg-white' : 'bg-gray-50'}`}>
                    <t.Icon className={`w-4 h-4 ${tripType === t.value ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <b className="text-[13px] font-bold text-gray-800">{t.label}</b>
                    <small className="text-[10.5px] text-gray-400">{t.sub}</small>
                  </span>
                  <span className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    tripType === t.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200 bg-white'
                  }`}>
                    {tripType === t.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                </button>
              ))}
            </div>

            <label className={lblCls}>Pickup City</label>
            <div className="mb-3.5">
              <CityPicker value={fromCity} onChange={setFromCity}
                placeholder="Select pickup city" locations={locations} icon={<MapPin />} />
            </div>

            <label className={lblCls}>Pickup Address</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Home /></span>
              <input required type="text" placeholder="Enter pickup address or landmark"
                value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                className={inputCls} />
            </div>

            <label className={lblCls}>Drop City</label>
            <div className="mb-3.5">
              <CityPicker value={toCity} onChange={v => { setToCity(v); if (!v) setDropAddress(''); }}
                placeholder="Enter drop city" locations={locations} allowCustom icon={<Flag />} />
            </div>

            <label className={lblCls}>Drop Address</label>
            <div className="relative">
              <span className={iconCls}><MapPin /></span>
              <input type="text" placeholder="Enter drop address or landmark"
                value={dropAddress} onChange={e => setDropAddress(e.target.value)}
                className={inputCls} />
            </div>

            {err1 && <p className="text-xs text-red-500 font-semibold mt-2">{err1}</p>}

            <button type="submit" className={`${nextBtn} w-full mt-5`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: Journey Details ── */}
        {step === 2 && (
          <motion.form key="s2" onSubmit={onStep2}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Journey Details</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">When you travel &amp; how many people.</p>
            </div>

            {/* Date row */}
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Journey Date</label>
                <div className="relative">
                  <span className={iconCls}><Calendar /></span>
                  <input required type="date" min={today} value={travelDate}
                    onChange={e => setTravelDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={lblCls}>Return Date <small className="text-[11px] text-gray-400 font-normal">(optional)</small></label>
                <div className="relative">
                  <span className={iconCls}><Calendar /></span>
                  <input type="date" min={travelDate || today} value={returnDate}
                    onChange={e => setReturnDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <label className={lblCls}>Pickup Time</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Clock /></span>
              <input type="time" value={pickupTime}
                onChange={e => setPickupTime(e.target.value)} className={inputCls} />
            </div>

            <label className={lblCls}>Passengers</label>
            <div className="flex items-center justify-between border border-gray-200 rounded-xl p-2.5 bg-white mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-600" />
                </span>
                <span className="flex flex-col leading-tight">
                  <b className="text-[13px] font-bold text-gray-800">{passengers} Passengers</b>
                  <small className="text-[10.5px] text-gray-400">Adults travelling</small>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => { const n = Math.max(10, passengers - 1); setPassengers(n); setPaxRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-gray-200 bg-white text-emerald-700 text-[18px] font-semibold flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 active:scale-90 transition-all">
                  −
                </button>
                <input
                  type="number" min={10} max={60}
                  value={paxRaw}
                  onChange={e => setPaxRaw(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(paxRaw, 10);
                    const clamped = isNaN(v) ? 10 : Math.min(60, Math.max(10, v));
                    setPassengers(clamped);
                    setPaxRaw(String(clamped));
                  }}
                  className="w-12 text-center text-[15px] font-black text-gray-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button type="button"
                  onClick={() => { const n = Math.min(60, passengers + 1); setPassengers(n); setPaxRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-gray-200 bg-white text-emerald-700 text-[18px] font-semibold flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 active:scale-90 transition-all">
                  +
                </button>
              </div>
            </div>

            {/* Vehicle recommendation */}
            <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 mb-3.5">
              <span className="absolute -top-2 left-3 text-[8.5px] font-black tracking-widest text-white bg-emerald-500 px-2 py-0.5 rounded-md">RECOMMENDED</span>
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5 text-emerald-600" />
              </span>
              <div className="leading-tight">
                <b className="text-[13px] font-bold text-gray-800">{vReco.name}</b>
                <small className="block text-[11px] text-emerald-700">{vReco.desc}</small>
              </div>
            </div>

            {err2 && <p className="text-xs text-red-500 font-semibold mb-2">{err2}</p>}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(1)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="submit" className={nextBtn}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 3: Contact Details ── */}
        {step === 3 && (
          <motion.form key="s3" onSubmit={onStep3}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Contact Details</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">We&apos;ll send your quotes here.</p>
            </div>

            {showAutoFill ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-3.5">
                <p className="text-xs text-emerald-600 font-semibold mb-2">Booking as</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                    {(customer!.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{customer!.name}</p>
                    <p className="text-xs text-gray-500">{customer!.phone}</p>
                  </div>
                  <button type="button"
                    onClick={() => { setGuestOverride(true); setName(''); setPhone(''); }}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
                    Not you?
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label className={lblCls}>Name <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><User /></span>
                  <input required type="text" placeholder="Your full name" value={name}
                    onChange={e => { setName(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>

                <label className={lblCls}>Mobile <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><Phone /></span>
                  <input required type="tel" maxLength={10} placeholder="10-digit mobile number"
                    value={phone} onChange={e => { setPhone(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>
              </>
            )}

            <label className={lblCls}>
              Special requirements <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {REQUIREMENT_CHIPS.map(chip => (
                <button key={chip} type="button" onClick={() => toggleChip(chip)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    selectedChips.includes(chip)
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
            <textarea placeholder="e.g. decorations, AC bus, specific timing, route, permits…"
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} maxLength={250}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none mb-1" />

            {err3 && <p className="text-xs text-red-500 font-semibold mb-2">{err3}</p>}

            <div className="flex gap-2.5 mt-4">
              <button type="button" onClick={() => setStep(2)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="submit" className={nextBtn}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 4: Review & Confirm ── */}
        {step === 4 && (
          <motion.div key="s4"
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Review &amp; Confirm</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">Please review before requesting quotes.</p>
            </div>

            <ReviewSection title="Trip Details" icon={<MapPin />} onEdit={() => setStep(1)}>
              <RV label="Trip Type" value={tripType === 'outstation' ? 'Outstation' : 'Local City'} />
              <RV label="Pickup City" value={fromCity} />
              <RV label="Pickup Address" value={pickupAddress} full />
              <RV label="Drop City" value={toCity} />
              <RV label="Drop Address" value={dropAddress} full />
            </ReviewSection>

            <ReviewSection title="Journey Details" icon={<Calendar />} onEdit={() => setStep(2)}>
              <RV label="Journey Date" value={travelDate} />
              <RV label="Return Date" value={returnDate || 'Not set'} />
              <RV label="Pickup Time" value={pickupTime} />
              <RV label="Passengers" value={`${passengers} passengers`} />
            </ReviewSection>

            <ReviewSection title="Contact Details" icon={<User />} onEdit={() => setStep(3)}>
              <RV label="Name" value={name} />
              <RV label="Mobile" value={phone} />
            </ReviewSection>

            {(selectedChips.length > 0 || notes.trim()) && (
              <ReviewSection title="Requirements" icon={<MessageCircle />} onEdit={() => setStep(3)}>
                {selectedChips.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[10.5px] text-gray-400 mb-1.5">Selected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChips.map(c => (
                        <span key={c} className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {notes.trim() && <RV label="Notes" value={notes} full />}
              </ReviewSection>
            )}

            {submitErr && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3">{submitErr}</p>
            )}

            <div className="flex gap-2.5 mb-3">
              <button type="button" onClick={() => setStep(3)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={onSubmit} disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-100 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Get Instant Quotes'}
              </button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <Lock className="w-3 h-3" /> No advance payment · Best price guaranteed
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────── EQUIPMENT BOOKING WIDGET ────────── */
/* Field set mirrors what "Shivi" (the AI booking assistant) already
 * asks for equipment-rental — see askForEquipmentType / askForJobDuration /
 * askForNumberOfEquipment / askForLocation / askForPickupDateTime /
 * askForContactInfo / askForAdditionalDetails in ChatBookingHero.tsx. */

const EQUIPMENT_TYPES: { value: string; label: string; category: string }[] = [
  { value: '1',  label: 'Grove Crane',          category: 'crane' },
  { value: '2',  label: 'Truck Mounted Crane',  category: 'crane' },
  { value: '3',  label: 'Tower Crane',          category: 'crane' },
  { value: '4',  label: 'Telescopic Crane',     category: 'crane' },
  { value: '5',  label: 'Rough Terrain Crane',  category: 'crane' },
  { value: '6',  label: 'Overhead Crane',       category: 'crane' },
  { value: '7',  label: 'Bulldozer',            category: 'jcb' },
  { value: '8',  label: 'Dumper',               category: 'jcb' },
  { value: '9',  label: 'Loader',               category: 'jcb' },
  { value: '10', label: 'Excavator',            category: 'excavator' },
  { value: '11', label: 'Backhoe Loader',       category: 'jcb' },
];

const EQUIPMENT_DURATIONS: { value: string; label: string; rentalDuration: string; days: number }[] = [
  { value: '1', label: '1 to 5 Days',    rentalDuration: 'daily',   days: 3  },
  { value: '2', label: '6 to 15 Days',   rentalDuration: 'weekly',  days: 10 },
  { value: '3', label: '16 to 30 Days',  rentalDuration: 'monthly', days: 20 },
  { value: '4', label: 'More than 30 Days', rentalDuration: 'custom', days: 45 },
];

const EQUIPMENT_PROGRESS_STEPS = [
  { n: 1, label: 'Equipment' },
  { n: 2, label: 'Schedule' },
  { n: 3, label: 'Contact' },
  { n: 4, label: 'Review' },
];

function EquipmentBookingWidget({ cityName, serviceType }: { cityName: string; serviceType?: string }) {
  const [step, setStep] = useState<FormStep>(1);

  const [locations, setLocations] = useState<{ name: string }[]>([]);
  useEffect(() => {
    fetch('/api/locations?serviceSlug=equipment-rental&type=CITY')
      .then(r => r.json())
      .then(d => { if (d.locations) setLocations(d.locations); })
      .catch(() => {});
  }, []);

  const { customer, isAuthenticated } = useCustomerAuth();

  // Step 1 – Equipment details
  const [equipmentTypeValue, setEquipmentTypeValue] = useState('');
  const [city,               setCity]               = useState(cityName);
  const [address,            setAddress]            = useState('');
  const [err1,                setErr1]              = useState('');

  // Step 2 – Duration & schedule
  const [durationValue, setDurationValue] = useState('1');
  const [startDate,     setStartDate]     = useState('');
  const [quantity,      setQuantity]      = useState(1);
  const [qtyRaw,        setQtyRaw]        = useState('1');
  const [err2,          setErr2]          = useState('');

  // Step 3 – Contact + notes
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [guestOverride, setGuestOverride] = useState(false);
  const [notes,         setNotes]         = useState('');
  const [err3,          setErr3]          = useState('');

  // Submit
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const showAutoFill = isAuthenticated && !!customer && !guestOverride;

  useEffect(() => {
    if (isAuthenticated && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
    }
  }, [isAuthenticated, customer]);

  const selectedType     = EQUIPMENT_TYPES.find(t => t.value === equipmentTypeValue);
  const selectedDuration = EQUIPMENT_DURATIONS.find(d => d.value === durationValue) || EQUIPMENT_DURATIONS[0];

  const onStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentTypeValue) { setErr1('Please select equipment type'); return; }
    if (!city.trim())        { setErr1('Please select a pickup city'); return; }
    if (!address.trim())     { setErr1('Please enter a pickup address'); return; }
    setErr1(''); setStep(2);
  };

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) { setErr2('Please select a start date'); return; }
    setErr2(''); setStep(3);
  };

  const onStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr3('Please enter your name'); return; }
    if (phone.replace(/\D/g, '').length < 10) { setErr3('Please enter a valid 10-digit mobile number'); return; }
    setErr3(''); setStep(4);
  };

  const onSubmit = async () => {
    setLoading(true); setSubmitErr('');
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + selectedDuration.days - 1);

      const res = await fetch('/api/equipment-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:      name.trim(),
          customerEmail:     `${phone.trim()}@transrentals.in`,
          customerPhone:     phone.trim(),
          equipmentCategory: selectedType?.category,
          equipmentType:     selectedType?.label,
          quantity,
          rentalDuration:    selectedDuration.rentalDuration,
          rentalDays:        selectedDuration.days,
          deliveryCity:      city.trim(),
          deliveryAddress:   address.trim(),
          startDate:         start.toISOString(),
          endDate:           end.toISOString(),
          requirements:      notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStep(5);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setEquipmentTypeValue(''); setAddress(''); setNotes('');
    setDurationValue('1'); setStartDate(''); setQuantity(1); setQtyRaw('1');
    setGuestOverride(false);
    if (!isAuthenticated) { setName(''); setPhone(''); }
  };

  /* shared styles — matches BusBookingWidget's visual language */
  const inputCls = "w-full h-[46px] pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all";
  const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-4 [&>svg]:h-4";
  const lblCls   = "block text-xs font-semibold text-gray-800 mb-1.5";
  const backBtn  = "flex-none w-[88px] h-12 border border-gray-200 bg-white text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-gray-50 hover:text-gray-700 transition-all text-sm";
  const nextBtn  = "flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 text-sm";

  /* ── SUCCESS ── */
  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-2">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mb-4"
        >
          <svg viewBox="0 0 52 52" className="w-20 h-20">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#16C47F" strokeWidth="2.5" />
            <path fill="none" stroke="#16C47F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
          </svg>
        </motion.div>
        <h2 className="text-[21px] font-black text-gray-900 mb-2">You&apos;re all set</h2>
        <p className="text-sm text-gray-500 mb-4">Our operators are preparing your quotes.</p>
        <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5">
          <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-left">
            <small className="block text-[11px] text-gray-400">Expected callback</small>
            <b className="text-sm text-emerald-700">within 15 minutes</b>
          </div>
        </div>
        <button onClick={resetForm} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
          New Request
        </button>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar step={step} steps={EQUIPMENT_PROGRESS_STEPS} />

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Equipment Details ── */}
        {step === 1 && (
          <motion.form key="s1" onSubmit={onStep1}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Equipment Details</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">What do you need &amp; where.</p>
            </div>

            <label className={lblCls}>Equipment Type</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Wrench /></span>
              <select required value={equipmentTypeValue} onChange={e => setEquipmentTypeValue(e.target.value)}
                className={`${inputCls} pr-9 appearance-none`}>
                <option value="" disabled>Select equipment type</option>
                {EQUIPMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <label className={lblCls}>Pickup City</label>
            <div className="mb-3.5">
              <CityPicker value={city} onChange={setCity}
                placeholder="Select pickup city" locations={locations} icon={<MapPin />} />
            </div>

            <label className={lblCls}>Pickup Address</label>
            <div className="relative">
              <span className={iconCls}><Home /></span>
              <input required type="text" placeholder="Enter pickup address or landmark"
                value={address} onChange={e => setAddress(e.target.value)}
                className={inputCls} />
            </div>

            {err1 && <p className="text-xs text-red-500 font-semibold mt-2">{err1}</p>}

            <button type="submit" className={`${nextBtn} w-full mt-5`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: Schedule & Quantity ── */}
        {step === 2 && (
          <motion.form key="s2" onSubmit={onStep2}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Schedule &amp; Quantity</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">How long &amp; how many units.</p>
            </div>

            <label className={lblCls}>Rental Duration</label>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              {EQUIPMENT_DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDurationValue(d.value)}
                  className={`relative flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                    durationValue === d.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-px'
                  }`}>
                  <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${durationValue === d.value ? 'bg-white' : 'bg-gray-50'}`}>
                    <Clock className={`w-4 h-4 ${durationValue === d.value ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </span>
                  <b className="text-[12px] font-bold text-gray-800 leading-tight">{d.label}</b>
                  <span className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    durationValue === d.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200 bg-white'
                  }`}>
                    {durationValue === d.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                </button>
              ))}
            </div>

            <label className={lblCls}>Start Date</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Calendar /></span>
              <input required type="date" min={today} value={startDate}
                onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>

            <label className={lblCls}>Number of Equipment</label>
            <div className="flex items-center justify-between border border-gray-200 rounded-xl p-2.5 bg-white mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-emerald-600" />
                </span>
                <span className="flex flex-col leading-tight">
                  <b className="text-[13px] font-bold text-gray-800">{quantity} {quantity === 1 ? 'Unit' : 'Units'}</b>
                  <small className="text-[10.5px] text-gray-400">Equipment needed</small>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => { const n = Math.max(1, quantity - 1); setQuantity(n); setQtyRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-gray-200 bg-white text-emerald-700 text-[18px] font-semibold flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 active:scale-90 transition-all">
                  −
                </button>
                <input
                  type="number" min={1} max={20}
                  value={qtyRaw}
                  onChange={e => setQtyRaw(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(qtyRaw, 10);
                    const clamped = isNaN(v) ? 1 : Math.min(20, Math.max(1, v));
                    setQuantity(clamped);
                    setQtyRaw(String(clamped));
                  }}
                  className="w-12 text-center text-[15px] font-black text-gray-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button type="button"
                  onClick={() => { const n = Math.min(20, quantity + 1); setQuantity(n); setQtyRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-gray-200 bg-white text-emerald-700 text-[18px] font-semibold flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 active:scale-90 transition-all">
                  +
                </button>
              </div>
            </div>

            {err2 && <p className="text-xs text-red-500 font-semibold mb-2">{err2}</p>}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(1)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="submit" className={nextBtn}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 3: Contact Details ── */}
        {step === 3 && (
          <motion.form key="s3" onSubmit={onStep3}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Contact Details</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">We&apos;ll send your quotes here.</p>
            </div>

            {showAutoFill ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-3.5">
                <p className="text-xs text-emerald-600 font-semibold mb-2">Booking as</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                    {(customer!.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{customer!.name}</p>
                    <p className="text-xs text-gray-500">{customer!.phone}</p>
                  </div>
                  <button type="button"
                    onClick={() => { setGuestOverride(true); setName(''); setPhone(''); }}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
                    Not you?
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label className={lblCls}>Name <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><User /></span>
                  <input required type="text" placeholder="Your full name" value={name}
                    onChange={e => { setName(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>

                <label className={lblCls}>Mobile <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><Phone /></span>
                  <input required type="tel" maxLength={10} placeholder="10-digit mobile number"
                    value={phone} onChange={e => { setPhone(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>
              </>
            )}

            <label className={lblCls}>
              Additional details <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <textarea placeholder="e.g. site access, operator hours, specific model preference…"
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} maxLength={250}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none mb-1" />

            {err3 && <p className="text-xs text-red-500 font-semibold mb-2">{err3}</p>}

            <div className="flex gap-2.5 mt-4">
              <button type="button" onClick={() => setStep(2)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="submit" className={nextBtn}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 4: Review & Confirm ── */}
        {step === 4 && (
          <motion.div key="s4"
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Review &amp; Confirm</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">Please review before requesting quotes.</p>
            </div>

            <ReviewSection title="Equipment Details" icon={<Wrench />} onEdit={() => setStep(1)}>
              <RV label="Equipment Type" value={selectedType?.label || ''} full />
              <RV label="Pickup City" value={city} />
              <RV label="Pickup Address" value={address} full />
            </ReviewSection>

            <ReviewSection title="Schedule" icon={<Calendar />} onEdit={() => setStep(2)}>
              <RV label="Duration" value={selectedDuration.label} />
              <RV label="Start Date" value={startDate} />
              <RV label="Quantity" value={`${quantity} ${quantity === 1 ? 'unit' : 'units'}`} />
            </ReviewSection>

            <ReviewSection title="Contact Details" icon={<User />} onEdit={() => setStep(3)}>
              <RV label="Name" value={name} />
              <RV label="Mobile" value={phone} />
            </ReviewSection>

            {notes.trim() && (
              <ReviewSection title="Additional Details" icon={<MessageCircle />} onEdit={() => setStep(3)}>
                <RV label="Notes" value={notes} full />
              </ReviewSection>
            )}

            {submitErr && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3">{submitErr}</p>
            )}

            <div className="flex gap-2.5 mb-3">
              <button type="button" onClick={() => setStep(3)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={onSubmit} disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-100 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Get Instant Quotes'}
              </button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <Lock className="w-3 h-3" /> No advance payment · Best price guaranteed
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────── BOOKING CARD ───────────────────── */

function BookingCard({ cityName, serviceType, variant = 'bus' }: { cityName: string; serviceType?: string; variant?: 'bus' | 'equipment' }) {
  const [showChat, setShowChat] = useState(false);
  const isEquipment = variant === 'equipment';

  return (
    <div className="w-full lg:w-[500px] shrink-0 order-1 lg:order-2">
      <div className="bg-white rounded-[28px] shadow-2xl shadow-black/20 overflow-hidden flex flex-col lg:h-[620px]">

        {/* Header – 72px */}
        <div className="flex items-center justify-between px-[18px] h-[72px] border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-[42px] h-[42px] rounded-[13px] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/60">
              {isEquipment
                ? <HardHat className="w-[22px] h-[22px] text-white" />
                : <Bus className="w-[22px] h-[22px] text-white" />}
              {/* online dot */}
              <span className="absolute bottom-[-1px] right-[-1px] w-[11px] h-[11px] rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div>
              <p className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">
                {isEquipment ? 'Book Your Equipment' : 'Book Your Bus'}
              </p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">Free quote · No advance payment</p>
            </div>
          </div>
          {showChat ? (
            <button onClick={() => setShowChat(false)}
              className="text-[11.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[9px] px-3 py-1.5 hover:bg-emerald-100 transition-colors whitespace-nowrap">
              ← New chat
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Shield className="w-3 h-3" />
              100% Secure
            </div>
          )}
        </div>

        {/* Body – scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-[18px] py-4
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {showChat
            ? <DynamicChatBookingHero hideHeader serviceType={serviceType} />
            : isEquipment
              ? <EquipmentBookingWidget cityName={cityName} serviceType={serviceType} />
              : <BusBookingWidget cityName={cityName} serviceType={serviceType} />
          }
        </div>

        {/* Footer – 70px */}
        <div className="flex items-center justify-between px-[18px] h-[70px] border-t border-gray-100 bg-white shrink-0">
          <div className="flex flex-col gap-[3px]">
            {[
              { text: 'Best Price' },
              { text: '500+ Operators' },
              { text: '15 Min Callback' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                <Check className="w-[13px] h-[13px] text-emerald-500 shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
          <button onClick={() => setShowChat(s => !s)}
            className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-500 transition-colors whitespace-nowrap">
            {showChat ? '← Back to form' : <>Book with AI Assistant <ChevronRight className="w-3.5 h-3.5" /></>}
          </button>
        </div>
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
  bookingVariant = 'bus',
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

        <div className="container-custom relative py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">

            {/* ── LEFT ── */}
            <div className="w-full lg:flex-1 order-2 lg:order-1">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3.5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {formatPriceHighlight(badge)}
                </div>
                {priceAnchor && (
                  <div className="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/25 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold">
                    ₹ {priceAnchor}
                  </div>
                )}
              </div>

              {/* Heading */}
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight">
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

              <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-sm">
                {pageDescription || description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2.5 mb-7">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </span>
                    <span className="text-gray-200 text-sm">{h}</span>
                  </li>
                ))}
              </ul>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-white text-xs font-bold">4.8 / 5</span>
                  <span className="text-gray-500 text-xs">2,400+ reviews</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white text-xs font-bold">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white text-xs font-bold">500+ Verified</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: booking card ── */}
            <BookingCard cityName={cityName} serviceType={serviceType} variant={bookingVariant} />
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
