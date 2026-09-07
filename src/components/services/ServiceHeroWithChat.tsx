'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Star, Shield, Zap, MessageCircle,
  Loader2, CheckCircle2, ChevronRight, Phone,
  Users, Calendar, ArrowRight, BadgeCheck,
  Clock, Headphones, Minus, Plus, Bus, Navigation2,
  Search, ChevronDown, X, Check, ArrowLeft, User, Lock, Home, Flag,
  HardHat, Wrench, Package, Mail, Truck, ShieldCheck, Tag, UserCheck,
  Briefcase, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';
import { formatPriceHighlight } from '@/lib/utils';
import { useCustomerAuth } from '@/hooks/useCustomer';

/* ──────────────────────────── TYPES ──────────────────────────── */

interface FeatureProp {
  icon: 'star' | 'shield' | 'zap' | 'bus' | 'users' | 'tag' | 'clock' | 'check' | 'headphones' | 'map';
  text: string;
  color: string;
  /** Photo wale hero me label ke neeche chhoti line (equipment hero jaisa). */
  sub?: string;
}

const FEATURE_ICONS = {
  star: Star, shield: Shield, zap: Zap, bus: Bus, users: Users,
  tag: Tag, clock: Clock, check: BadgeCheck, headphones: Headphones, map: MapPin,
} as const;

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
  bookingVariant?: 'bus' | 'equipment' | 'truck' | 'tempo';
  /** Light hero ke peeche ek photo. Na dene par pehle jaisa gradient hi rehta hai. */
  backgroundImage?: string;
  /** Photo wale hero me features ke neeche stats card. Khaali ho to card nahi aata. */
  heroStats?: { icon: FeatureProp['icon']; value: string; label: string }[];
}

/* ──────────────────────────── CONSTANTS ──────────────────────── */

const TRIP_TYPES = [
  { value: 'outstation', label: 'Outstation', sub: 'Intercity, out of city', Icon: Navigation2 },
  { value: 'local',      label: 'Local City',  sub: 'Within city travel',    Icon: Home },
];

/* Photo wale hero par text ke peeche safed halo — parda halka rakhne ke
   baawajood heading padhi ja sake. */
const HERO_PHOTO_TEXT_HALO =
  '0 1px 3px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.45), 0 0 26px rgba(0,0,0,0.4)';

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
  iconAccent?: 'gray' | 'green';
}

function CityPicker({ value, onChange, placeholder, locations, allowCustom, icon, iconAccent = 'gray' }: CityPickerProps) {
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
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 [&>svg]:w-4 [&>svg]:h-4 ${iconAccent === 'green' ? 'text-green-600' : 'text-gray-400'}`}>
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

function ProgressBar({ step, steps = DEFAULT_PROGRESS_STEPS, accent = 'emerald' }: { step: number; steps?: { n: number; label: string }[]; accent?: 'emerald' | 'green' }) {
  const isGreen = accent === 'green';
  const dotFillCls = isGreen ? 'bg-green-500 text-white' : 'bg-emerald-500 text-white';
  const dotActiveCls = isGreen ? 'bg-green-500 text-white ring-4 ring-green-100' : 'bg-emerald-500 text-white ring-4 ring-emerald-100';
  const labelActiveCls = isGreen ? 'text-green-700' : 'text-emerald-700';
  const barFillCls = isGreen ? 'bg-green-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
              step > s.n
                ? dotFillCls
                : step === s.n
                ? dotActiveCls
                : 'bg-white border border-gray-200 text-gray-400'
            }`}>
              {step > s.n ? <Check className="w-3 h-3" /> : s.n}
            </div>
            <span className={`text-[11.5px] font-semibold whitespace-nowrap ${step >= s.n ? labelActiveCls : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-[2px] bg-gray-200 rounded-full overflow-hidden mx-0.5">
              <div className={`h-full ${barFillCls} transition-all duration-500 ${step > s.n ? 'w-full' : 'w-0'}`} />
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

export function BusBookingWidget({ cityName, serviceType, variant = 'bus' }: { cityName: string; serviceType?: string; variant?: 'bus' | 'tempo' }) {
  const [step, setStep] = useState<FormStep>(1);
  // Tempo Traveller wahi bus-family flow chalata hai, bas teen field zyada:
  // return time, booking purpose aur (company hone par) vehicles count —
  // taaki form Shivi ke poore sawaal-set se mel khaye.
  const isTempo = variant === 'tempo';

  const [locations, setLocations] = useState<{ name: string }[]>([]);
  useEffect(() => {
    fetch(`/api/locations?serviceSlug=${variant === 'tempo' ? 'tempo-traveller' : 'bus-rental'}&type=CITY`)
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
  const [returnTime, setReturnTime] = useState('');
  const [passengers, setPassengers] = useState(10);
  const [paxRaw,     setPaxRaw]     = useState('10');
  const [err2,       setErr2]       = useState('');

  // Step 3 – Contact + requirements
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [email,         setEmail]         = useState('');
  const [guestOverride, setGuestOverride] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [notes,         setNotes]         = useState('');
  const [err3,          setErr3]          = useState('');

  // Step 3 – Personal vs Company (real B2B routing when approved)
  const [bookingPurpose,    setBookingPurpose]    = useState<'personal' | 'company'>('personal');
  const [isB2BApproved,     setIsB2BApproved]     = useState(false);
  const [vehiclesRequired,  setVehiclesRequired]  = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('customer');
      if (stored) {
        const parsed = JSON.parse(stored);
        setIsB2BApproved(!!parsed?.isB2B && parsed?.b2bStatus === 'APPROVED');
      }
    } catch { /* ignore */ }
  }, []);

  // Submit
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [lastSubmitType, setLastSubmitType] = useState<'quote' | 'b2b'>('quote');
  const [lastB2BBookingNumber, setLastB2BBookingNumber] = useState('');

  const today  = new Date().toISOString().split('T')[0];
  const vReco  = getVehicleReco(passengers);
  const showAutoFill = isAuthenticated && !!customer && !guestOverride;

  useEffect(() => {
    if (isAuthenticated && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr3('Please enter a valid email address'); return; }
    if (isTempo && bookingPurpose === 'company' && vehiclesRequired < 1) {
      setErr3('Please enter how many vehicles you need');
      return;
    }
    setErr3(''); setStep(4);
  };

  const onSubmit = async () => {
    setLoading(true); setSubmitErr('');
    try {
      if (bookingPurpose === 'company' && isB2BApproved && customer) {
        // Real corporate booking — routes into b2b_bookings, not the
        // regular quote-request pool.
        const b2bTripType = tripType === 'local' ? 'HOURLY' : (returnDate ? 'ROUND_TRIP' : 'ONE_WAY');
        const specialNotes = [
          ...selectedChips,
          ...(notes.trim() ? [notes.trim()] : []),
        ].join(', ') || undefined;

        const res = await fetch('/api/b2b/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId:       String(customer.id),
            serviceType:      'bus',
            vehiclesRequired,
            passengerCount:   passengers,
            vehicleCategory:  'standard',
            pickupLocation:   fromCity.trim(),
            dropLocation:     toCity.trim() || undefined,
            tripType:         b2bTripType,
            scheduledDate:    travelDate,
            scheduledTime:    pickupTime,
            returnDate:       returnDate || undefined,
            returnTime:       returnDate ? pickupTime : undefined,
            specialNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') throw new Error(data.error || 'Something went wrong');
        setLastB2BBookingNumber(data.booking?.bookingNumber || '');
        setLastSubmitType('b2b');
        setStep(5);
        return;
      }

      const req = [
        ...selectedChips,
        // Company booking par vehicles count requirements me bhi likh dete hain —
        // guest quote-request row par uska apna column nahi hota.
        ...(isTempo && bookingPurpose === 'company'
          ? [`Corporate booking · ${vehiclesRequired} vehicle(s) required`]
          : []),
        ...(notes.trim() ? [notes.trim()] : []),
      ].join(', ') || undefined;

      const res = await fetch('/api/bus-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:  name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          pickupCity:    fromCity.trim(),
          pickupAddress: pickupAddress.trim() || undefined,
          dropCity:      toCity.trim() || undefined,
          dropAddress:   dropAddress.trim() || undefined,
          pickupDate:    travelDate,
          pickupTime,
          returnDate:    returnDate || undefined,
          returnTime:    returnTime || undefined,
          passengers,
          tripType,
          requirements:  req,
          needAC:        selectedChips.includes('AC'),
          ...(isTempo ? {
            vehicleCategoryName: vReco.name,
            taBookingMode: bookingPurpose === 'company' ? 'COMPANY' : 'PERSONAL',
            ...(bookingPurpose === 'company' ? {
              numberOfVehicles: vehiclesRequired,
              numberOfPersons: passengers,
            } : {}),
          } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setLastSubmitType('quote');
      setStep(5);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setTravelDate(''); setReturnDate(''); setReturnTime(''); setToCity('');
    setPickupAddress(''); setDropAddress(''); setNotes(''); setSelectedChips([]);
    setGuestOverride(false); setBookingPurpose('personal'); setVehiclesRequired(1);
    if (!isAuthenticated) { setName(''); setPhone(''); setEmail(''); }
  };

  /* shared styles */
  const inputCls = "w-full h-[46px] pl-10 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 transition-all";
  const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none [&>svg]:w-4 [&>svg]:h-4";
  const lblCls   = "block text-xs font-medium text-slate-600 mb-1.5";
  const backBtn  = "flex-none w-[88px] h-12 border border-slate-200 bg-white text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-slate-50 hover:text-slate-600 transition-all text-sm";
  const nextBtn  = "flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm";

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
        {lastSubmitType === 'b2b' ? (
          <>
            <h2 className="text-[21px] font-black text-slate-900 mb-2">Corporate Booking Created</h2>
            <p className="text-sm text-slate-500 mb-4">Vendors will be notified and start sending quotes shortly.</p>
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-5">
              <Building2 className="w-5 h-5 text-green-600 shrink-0" />
              <div className="text-left">
                <small className="block text-[11px] text-slate-400">Booking ID</small>
                <b className="text-sm text-green-700">{lastB2BBookingNumber || 'N/A'}</b>
              </div>
            </div>
            <a href="/customer/dashboard" className="text-sm text-green-700 hover:text-green-600 transition-colors font-semibold mb-2">
              Go to B2B Dashboard
            </a>
          </>
        ) : (
          <>
            <h2 className="text-[21px] font-black text-slate-900 mb-2">You&apos;re all set</h2>
            <p className="text-sm text-slate-500 mb-4">Our operators are preparing your quotes.</p>
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-5">
              <Clock className="w-5 h-5 text-green-600 shrink-0" />
              <div className="text-left">
                <small className="block text-[11px] text-slate-400">Expected callback</small>
                <b className="text-sm text-green-700">within 15 minutes</b>
              </div>
            </div>
          </>
        )}
        <button onClick={resetForm} className="text-sm text-slate-400 hover:text-slate-500 transition-colors font-medium">
          New Request
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 pb-4 text-xs font-medium text-slate-400 overflow-x-auto">
        {DEFAULT_PROGRESS_STEPS.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`flex items-center gap-1.5 ${step >= s.n ? 'text-green-700' : 'text-slate-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step >= s.n ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.n ? <Check className="w-2.5 h-2.5" /> : s.n}
              </span>
              {s.label}
            </span>
            {idx < DEFAULT_PROGRESS_STEPS.length - 1 && <span className="w-5 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Trip Details ── */}
        {step === 1 && (
          <motion.form key="s1" onSubmit={onStep1}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Trip Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">Let&apos;s start with where you&apos;re headed.</p>
            </div>

            <label className={lblCls}>Trip Type</label>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              {TRIP_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setTripType(t.value)}
                  className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    tripType === t.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-px'
                  }`}>
                  <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${tripType === t.value ? 'bg-white' : 'bg-slate-50'}`}>
                    <t.Icon className={`w-4 h-4 ${tripType === t.value ? 'text-green-600' : 'text-slate-400'}`} />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <b className="text-[13px] font-bold text-slate-700">{t.label}</b>
                    <small className="text-[10.5px] text-slate-400">{t.sub}</small>
                  </span>
                  <span className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    tripType === t.value ? 'border-green-500 bg-green-500' : 'border-slate-200 bg-white'
                  }`}>
                    {tripType === t.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                </button>
              ))}
            </div>

            <label className={lblCls}>Pickup City</label>
            <div className="mb-3.5">
              <CityPicker value={fromCity} onChange={setFromCity}
                placeholder="Select pickup city" locations={locations} icon={<MapPin />} iconAccent="green" />
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
                placeholder="Enter drop city" locations={locations} allowCustom icon={<Flag />} iconAccent="green" />
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
              <h2 className="text-base font-bold text-slate-900">Journey Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">When you travel &amp; how many people.</p>
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
                <label className={lblCls}>Return Date <small className="text-[11px] text-slate-400 font-normal">(optional)</small></label>
                <div className="relative">
                  <span className={iconCls}><Calendar /></span>
                  <input type="date" min={travelDate || today} value={returnDate}
                    onChange={e => setReturnDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {isTempo ? (
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <div>
                  <label className={lblCls}>Pickup Time</label>
                  <div className="relative">
                    <span className={iconCls}><Clock /></span>
                    <input type="time" value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={lblCls}>Return Time <small className="text-[11px] text-slate-400 font-normal">(optional)</small></label>
                  <div className="relative">
                    <span className={iconCls}><Clock /></span>
                    <input type="time" value={returnTime}
                      onChange={e => setReturnTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <label className={lblCls}>Pickup Time</label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><Clock /></span>
                  <input type="time" value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            <label className={lblCls}>Passengers</label>
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-2.5 bg-white mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[10px] bg-green-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </span>
                <span className="flex flex-col leading-tight">
                  <b className="text-[13px] font-bold text-slate-700">{passengers} Passengers</b>
                  <small className="text-[10.5px] text-slate-400">Adults travelling</small>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => { const n = Math.max(10, passengers - 1); setPassengers(n); setPaxRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-slate-200 bg-white text-green-700 text-[18px] font-semibold flex items-center justify-center hover:bg-green-50 hover:border-green-400 active:scale-90 transition-all">
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
                  className="w-12 text-center text-[15px] font-black text-slate-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button type="button"
                  onClick={() => { const n = Math.min(60, passengers + 1); setPassengers(n); setPaxRaw(String(n)); }}
                  className="w-8 h-8 rounded-[9px] border border-slate-200 bg-white text-green-700 text-[18px] font-semibold flex items-center justify-center hover:bg-green-50 hover:border-green-400 active:scale-90 transition-all">
                  +
                </button>
              </div>
            </div>

            {/* Vehicle recommendation */}
            <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-200 mb-3.5">
              <span className="absolute -top-2 left-3 text-[8.5px] font-black tracking-widest text-white bg-green-500 px-2 py-0.5 rounded-md">RECOMMENDED</span>
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5 text-green-600" />
              </span>
              <div className="leading-tight">
                <b className="text-[13px] font-bold text-slate-700">{vReco.name}</b>
                <small className="block text-[11px] text-green-700">{vReco.desc}</small>
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
              <h2 className="text-base font-bold text-slate-900">Contact Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">We&apos;ll send your quotes here.</p>
            </div>

            {showAutoFill ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-3.5">
                <p className="text-xs text-green-600 font-semibold mb-2">Booking as</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-black text-sm shrink-0">
                    {(customer!.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{customer!.name}</p>
                    <p className="text-xs text-slate-500">{customer!.phone}</p>
                  </div>
                  <button type="button"
                    onClick={() => { setGuestOverride(true); setName(''); setPhone(''); setEmail(''); }}
                    className="ml-auto text-xs text-slate-400 hover:text-slate-500 underline">
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

                <label className={lblCls}>Email <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><Mail /></span>
                  <input required type="email" placeholder="you@example.com"
                    value={email} onChange={e => { setEmail(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>
              </>
            )}

            {isTempo && (
              <>
                <label className={lblCls}>Booking For</label>
                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  {([
                    { v: 'personal', label: 'Personal', sub: 'Family / friends', Icon: User },
                    { v: 'company',  label: 'Company',  sub: 'Corporate trip',   Icon: Building2 },
                  ] as const).map(o => (
                    <button key={o.v} type="button" onClick={() => { setBookingPurpose(o.v); setErr3(''); }}
                      className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                        bookingPurpose === o.v
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-px'
                      }`}>
                      <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${bookingPurpose === o.v ? 'bg-white' : 'bg-slate-50'}`}>
                        <o.Icon className={`w-4 h-4 ${bookingPurpose === o.v ? 'text-green-600' : 'text-slate-400'}`} />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <b className="text-[13px] font-bold text-slate-700">{o.label}</b>
                        <small className="text-[10.5px] text-slate-400">{o.sub}</small>
                      </span>
                    </button>
                  ))}
                </div>

                {bookingPurpose === 'company' && (
                  <>
                    <label className={lblCls}>Number of Vehicles <span className="text-red-500">*</span></label>
                    <div className="relative mb-3.5">
                      <span className={iconCls}><Bus /></span>
                      <input type="number" min={1} max={50} placeholder="How many vehicles do you need?"
                        value={vehiclesRequired}
                        onChange={e => { setVehiclesRequired(Math.max(1, parseInt(e.target.value, 10) || 1)); setErr3(''); }}
                        className={inputCls} />
                    </div>
                  </>
                )}
              </>
            )}

            <label className={lblCls}>
              Special requirements <small className="text-[11px] text-slate-400 font-normal ml-1">(optional)</small>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {REQUIREMENT_CHIPS.map(chip => (
                <button key={chip} type="button" onClick={() => toggleChip(chip)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    selectedChips.includes(chip)
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
            <textarea placeholder="e.g. decorations, AC bus, specific timing, route, permits…"
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} maxLength={250}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50 transition-all resize-none mb-1" />

            {isB2BApproved && (
              <>
              <label className={`${lblCls} mt-3.5`}>Is this booking for personal use or your company/organization?</label>
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <button type="button" onClick={() => setBookingPurpose('personal')}
                  className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    bookingPurpose === 'personal'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-px'
                  }`}>
                  <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${bookingPurpose === 'personal' ? 'bg-white' : 'bg-slate-50'}`}>
                    <User className={`w-4 h-4 ${bookingPurpose === 'personal' ? 'text-green-600' : 'text-slate-400'}`} />
                  </span>
                  <b className="text-[13px] font-bold text-slate-700">Personal</b>
                  <span className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    bookingPurpose === 'personal' ? 'border-green-500 bg-green-500' : 'border-slate-200 bg-white'
                  }`}>
                    {bookingPurpose === 'personal' && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                </button>
                <button type="button" onClick={() => setBookingPurpose('company')}
                  className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    bookingPurpose === 'company'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-px'
                  }`}>
                  <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${bookingPurpose === 'company' ? 'bg-white' : 'bg-slate-50'}`}>
                    <Briefcase className={`w-4 h-4 ${bookingPurpose === 'company' ? 'text-green-600' : 'text-slate-400'}`} />
                  </span>
                  <b className="text-[13px] font-bold text-slate-700">Company / Corporate</b>
                  <span className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    bookingPurpose === 'company' ? 'border-green-500 bg-green-500' : 'border-slate-200 bg-white'
                  }`}>
                    {bookingPurpose === 'company' && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                </button>
              </div>

              {bookingPurpose === 'company' && (
                <>
                  <label className={lblCls}>How many buses do you need?</label>
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl p-2.5 bg-white mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-[10px] bg-green-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-green-600" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <b className="text-[13px] font-bold text-slate-700">{vehiclesRequired} {vehiclesRequired === 1 ? 'Bus' : 'Buses'}</b>
                        <small className="text-[10.5px] text-slate-400">Vehicles required</small>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button"
                        onClick={() => setVehiclesRequired(n => Math.max(1, n - 1))}
                        className="w-8 h-8 rounded-[9px] border border-slate-200 bg-white text-green-700 text-[18px] font-semibold flex items-center justify-center hover:bg-green-50 hover:border-green-400 active:scale-90 transition-all">
                        −
                      </button>
                      <span className="w-8 text-center text-[15px] font-black text-slate-900">{vehiclesRequired}</span>
                      <button type="button"
                        onClick={() => setVehiclesRequired(n => Math.min(500, n + 1))}
                        className="w-8 h-8 rounded-[9px] border border-slate-200 bg-white text-green-700 text-[18px] font-semibold flex items-center justify-center hover:bg-green-50 hover:border-green-400 active:scale-90 transition-all">
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}
              </>
            )}

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
              <h2 className="text-base font-bold text-slate-900">Review &amp; Confirm</h2>
              <p className="text-xs text-slate-500 mt-0.5">Please review before requesting quotes.</p>
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
              {isTempo && <RV label="Return Time" value={returnTime || 'Not set'} />}
              <RV label="Passengers" value={`${passengers} passengers`} />
              {isTempo && <RV label="Recommended" value={vReco.name} />}
            </ReviewSection>

            <ReviewSection title="Contact Details" icon={<User />} onEdit={() => setStep(3)}>
              <RV label="Name" value={name} />
              <RV label="Mobile" value={phone} />
              <RV label="Email" value={email} />
              {isTempo && <RV label="Booking For" value={bookingPurpose === 'company' ? 'Company' : 'Personal'} />}
              {isTempo && bookingPurpose === 'company' && <RV label="Vehicles Needed" value={String(vehiclesRequired)} />}
            </ReviewSection>

            {isB2BApproved && (
              <ReviewSection title="Booking For" icon={<Briefcase />} onEdit={() => setStep(3)}>
                <RV label="Purpose" value={bookingPurpose === 'company' ? 'Company / Corporate' : 'Personal'} />
                {bookingPurpose === 'company' && (
                  <RV label="Buses Required" value={String(vehiclesRequired)} />
                )}
              </ReviewSection>
            )}

            {(selectedChips.length > 0 || notes.trim()) && (
              <ReviewSection title="Requirements" icon={<MessageCircle />} onEdit={() => setStep(3)}>
                {selectedChips.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[10.5px] text-slate-400 mb-1.5">Selected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChips.map(c => (
                        <span key={c} className="text-[11px] font-semibold text-green-700 bg-white border border-green-200 px-2 py-0.5 rounded-full">{c}</span>
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
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : bookingPurpose === 'company' && isB2BApproved
                    ? 'Create Corporate Booking'
                    : 'Get Instant Quotes'}
              </button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
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

export function EquipmentBookingWidget({ cityName, serviceType }: { cityName: string; serviceType?: string }) {
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
  // Vendors price operator, delivery and installation separately, and their
  // quote form only shows the matching charge field when the request asks for
  // it — so the customer has to be the one to say.
  const [needOperator,     setNeedOperator]     = useState(false);
  const [needDelivery,     setNeedDelivery]     = useState(true);
  const [needInstallation, setNeedInstallation] = useState(false);
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
          needOperator,
          needDelivery,
          needInstallation,
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
    setNeedOperator(false); setNeedDelivery(true); setNeedInstallation(false);
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

            {/* What the vendor has to quote for. The vendor's quote form only
                shows the operator / installation charge fields when the request
                asks for them, so this has to be captured here. */}
            <div className="mb-4">
              <label className={lblCls}>What do you need?</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { on: needDelivery,     set: setNeedDelivery,     label: 'Delivery to site' },
                  { on: needOperator,     set: setNeedOperator,     label: 'Operator' },
                  { on: needInstallation, set: setNeedInstallation, label: 'Installation' },
                ] as const).map(({ on, set, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set(!on)}
                    className={`h-9 px-3.5 rounded-xl border text-[13px] font-semibold transition-all ${
                      on
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Vendors quote only for what you pick here.
              </p>
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

/* ──────────────────────────── TRUCK BOOKING WIDGET ────────────── */
/* Field set mirrors what "Shivi" (the AI booking assistant) already
 * asks for transporter/truck — see askForTruckMode / askForTruckBodyType /
 * askForTruckType / askForTruckGoodsType / askForMaterialDetails /
 * askForWeight / askForWeightUnit / askForEstimatedVolume / askForLocation /
 * askForPickupFullAddress / askForTruckPickupPincode / askForTruckPickupFloor /
 * askForTruckPickupLift / askForDestination / askForDestinationFullAddress /
 * askForTruckDropPincode / askForTruckDropFloor / askForTruckDropLift /
 * askForPickupDateTime / askForExpectedTruckDelivery / askForTruckDeliveryTime /
 * askForTripDirection / askForLoadingHelp / askForTruckLabourCount /
 * askForTruckMultipleStops / askForTruckMultipleStopsDesc /
 * askForTruckReceiverName / askForTruckReceiverPhone / askForTruckPOD /
 * askForContactInfo / askForAdditionalDetails in ChatBookingHero.tsx. */

const TRUCK_BODY_TYPES: { value: string; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED_BODY', label: 'Closed Body' },
  { value: 'CONTAINER', label: 'Container' },
  { value: 'TRAILER', label: 'Trailer' },
  { value: 'LCV', label: 'LCV' },
  { value: 'REFRIGERATED', label: 'Refrigerated' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'OTHER', label: 'Other' },
];

const TRUCK_TYPES: { value: string; label: string }[] = [
  { value: '14', label: 'Tata Ace' },
  { value: '12', label: 'Tata 407 (2.5 MT)' },
  { value: '4',  label: 'Canter 3MT (4 wheel)' },
  { value: '2',  label: 'Canter 17ft (4 wheel)' },
  { value: '3',  label: 'Canter 19ft (6 wheel)' },
  { value: '5',  label: 'Canter Close Body 20ft' },
  { value: '6',  label: 'Canter Close Body 24ft' },
  { value: '1',  label: 'Canter Jumbo' },
  { value: '13', label: 'Truck 9MT (6 Wheel)' },
  { value: '11', label: 'Truck 16MT (10 Wheel)' },
  { value: '9',  label: 'Truck 20MT (12 Wheel)' },
  { value: '10', label: 'Truck 25MT (14 Wheel)' },
  { value: '8',  label: 'Semi Low Bed Trailer' },
  { value: '7',  label: 'LCV' },
];

const GOODS_TYPES: string[] = [
  'Household Goods', 'Furniture & Wood', 'Electronics', 'Vehicles/Automobiles',
  'Building Materials', 'Industrial Equipment', 'Iron/Steel Material', 'Container',
  'Cement', 'Chemical', 'Machineries', 'Liquid/Oil Drums',
  'Granites/Marbles', 'Coal & Ash', 'Engineering Goods', 'Fertilizer',
  'Fruits & Vegetables', 'Marble Slab/Block', 'Medicines', 'Packed Foods',
  'Plastic Pipes', 'Books/Paper Rolls', 'Plastic Granules', 'Crop/Agriculture',
  'Scrap', 'Stones/Tiles', 'Textiles', 'Tyres & Rubber', 'Others',
];

const TRUCK_PROGRESS_STEPS = [
  { n: 1, label: 'Truck' },
  { n: 2, label: 'Route' },
  { n: 3, label: 'Contact' },
  { n: 4, label: 'Review' },
];

function YesNoToggle({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }: {
  value: boolean; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[{ v: true, l: yesLabel }, { v: false, l: noLabel }].map(opt => (
        <button key={String(opt.v)} type="button" onClick={() => onChange(opt.v)}
          className={`h-11 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            value === opt.v
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}>
          {value === opt.v && <Check className="w-3.5 h-3.5" />}
          {opt.l}
        </button>
      ))}
    </div>
  );
}

export function TruckBookingWidget({ cityName, serviceType }: { cityName: string; serviceType?: string }) {
  const [step, setStep] = useState<FormStep>(1);

  const [locations, setLocations] = useState<{ name: string }[]>([]);
  useEffect(() => {
    fetch('/api/locations?serviceSlug=transporter&type=CITY')
      .then(r => r.json())
      .then(d => { if (d.locations) setLocations(d.locations); })
      .catch(() => {});
  }, []);

  const { customer, isAuthenticated } = useCustomerAuth();

  // Step 1 – Truck & goods
  const [truckMode,        setTruckMode]        = useState('1');
  const [truckBodyType,    setTruckBodyType]    = useState('OPEN');
  const [truckTypeValue,   setTruckTypeValue]   = useState('14');
  const [goodsType,        setGoodsType]        = useState('');
  const [materialDetails,  setMaterialDetails]  = useState('');
  const [weightVal,        setWeightVal]        = useState('');
  const [weightUnit,       setWeightUnit]       = useState('1');
  const [estimatedVolume,  setEstimatedVolume]  = useState('');
  const [err1,             setErr1]             = useState('');

  // Step 2 – Pickup & drop
  const [pickupCity,     setPickupCity]     = useState(cityName);
  const [pickupAddress,  setPickupAddress]  = useState('');
  const [pickupPincode,  setPickupPincode]  = useState('');
  const [pickupFloor,    setPickupFloor]    = useState('');
  const [hasPickupLift,  setHasPickupLift]  = useState(false);
  const [dropCity,       setDropCity]       = useState('');
  const [dropAddress,    setDropAddress]    = useState('');
  const [dropPincode,    setDropPincode]    = useState('');
  const [dropFloor,      setDropFloor]      = useState('');
  const [hasDropLift,    setHasDropLift]    = useState(false);
  const [err2,           setErr2]           = useState('');

  // Step 3 – Schedule, requirements & contact
  const [pickupDate,           setPickupDate]           = useState('');
  const [pickupTime,           setPickupTime]           = useState('09:00');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState('');
  const [tripDirection,        setTripDirection]        = useState('ONE_WAY');
  const [requiresLabour,       setRequiresLabour]       = useState(false);
  const [labourCount,          setLabourCount]          = useState('');
  const [hasMultipleStops,     setHasMultipleStops]     = useState(false);
  const [multipleStopsDetails, setMultipleStopsDetails] = useState('');
  const [receiverName,         setReceiverName]         = useState('');
  const [receiverPhone,        setReceiverPhone]        = useState('');
  const [requiresPOD,          setRequiresPOD]          = useState(false);
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [email,         setEmail]         = useState('');
  const [guestOverride, setGuestOverride] = useState(false);
  const [requirements,  setRequirements]  = useState('');
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
      setEmail(customer.email || '');
    }
  }, [isAuthenticated, customer]);

  const selectedTruckType = TRUCK_TYPES.find(t => t.value === truckTypeValue);

  const onStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodsType) { setErr1('Please select the type of goods'); return; }
    setErr1(''); setStep(2);
  };

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCity.trim())    { setErr2('Please select a pickup city'); return; }
    if (!pickupAddress.trim()) { setErr2('Please enter a pickup address'); return; }
    if (!dropCity.trim())      { setErr2('Please select a drop city'); return; }
    if (!dropAddress.trim())   { setErr2('Please enter a drop address'); return; }
    setErr2(''); setStep(3);
  };

  const onStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate) { setErr3('Please select a pickup date'); return; }
    if (!name.trim()) { setErr3('Please enter your name'); return; }
    if (phone.replace(/\D/g, '').length < 10) { setErr3('Please enter a valid 10-digit mobile number'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr3('Please enter a valid email address'); return; }
    setErr3(''); setStep(4);
  };

  const onSubmit = async () => {
    setLoading(true); setSubmitErr('');
    try {
      const modeLabel = truckMode === '2' ? 'Commercial' : 'Personal';
      const weightUnitLabel = weightUnit === '2' ? 'TON' : 'KG';
      const parsedWeight = weightVal.trim() ? parseFloat(weightVal.trim()) : NaN;
      // estimatedWeight column is a plain Float with no unit column, so we
      // normalize everything to KG and keep the customer's original entry
      // (with unit) visible to vendors inside goodsDescription.
      const estimatedWeightKg = !isNaN(parsedWeight)
        ? (weightUnit === '2' ? parsedWeight * 1000 : parsedWeight)
        : undefined;
      const goodsDescription = [
        `Use: ${modeLabel}`,
        materialDetails.trim(),
        weightVal.trim() ? `Weight: ${weightVal.trim()} ${weightUnitLabel}` : '',
      ].filter(Boolean).join(' • ');

      const res = await fetch('/api/truck-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:  name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          serviceType:   serviceType || 'transporter',
          vehicle_category:     truckTypeValue,
          vehicleCategoryName:  selectedTruckType?.label,
          truckBodyType,
          tripDirection,
          goodsType,
          goodsDescription,
          estimatedWeight: estimatedWeightKg,
          estimatedVolume: estimatedVolume || undefined,
          requiresLabour,
          labourCount:   requiresLabour && labourCount.trim() ? parseInt(labourCount, 10) : undefined,
          pickupCity:    pickupCity.trim(),
          pickupAddress: pickupAddress.trim(),
          pickupPincode: pickupPincode.trim() || undefined,
          pickupFloor:   pickupFloor.trim() ? parseInt(pickupFloor, 10) : undefined,
          hasPickupLift,
          dropCity:      dropCity.trim(),
          dropAddress:   dropAddress.trim(),
          dropPincode:   dropPincode.trim() || undefined,
          dropFloor:     dropFloor.trim() ? parseInt(dropFloor, 10) : undefined,
          hasDropLift,
          pickupDate,
          pickupTime,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          expectedDeliveryTime: expectedDeliveryTime || undefined,
          hasMultipleStops,
          multipleStopsDetails: hasMultipleStops ? (multipleStopsDetails.trim() || undefined) : undefined,
          receiverName:  receiverName.trim() || undefined,
          receiverPhone: receiverPhone.trim() || undefined,
          requiresPOD,
          requirements: requirements.trim() || undefined,
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
    setStep(1); setTruckMode('1'); setTruckBodyType('OPEN'); setTruckTypeValue('14');
    setGoodsType(''); setMaterialDetails(''); setWeightVal(''); setWeightUnit('1'); setEstimatedVolume('');
    setPickupAddress(''); setPickupPincode(''); setPickupFloor(''); setHasPickupLift(false);
    setDropCity(''); setDropAddress(''); setDropPincode(''); setDropFloor(''); setHasDropLift(false);
    setPickupDate(''); setExpectedDeliveryDate(''); setExpectedDeliveryTime(''); setTripDirection('ONE_WAY');
    setRequiresLabour(false); setLabourCount(''); setHasMultipleStops(false); setMultipleStopsDetails('');
    setReceiverName(''); setReceiverPhone(''); setRequiresPOD(false); setRequirements('');
    setGuestOverride(false);
    if (!isAuthenticated) { setName(''); setPhone(''); setEmail(''); }
  };

  /* shared styles — matches Bus/Equipment widgets' visual language */
  const inputCls = "w-full h-[46px] pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all";
  const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-4 [&>svg]:h-4";
  const lblCls   = "block text-xs font-semibold text-gray-800 mb-1.5";
  const subHdCls = "text-[11px] font-black tracking-wide text-emerald-700 uppercase mb-2 mt-4 first:mt-0";
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
      <ProgressBar step={step} steps={TRUCK_PROGRESS_STEPS} />

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Truck & Goods ── */}
        {step === 1 && (
          <motion.form key="s1" onSubmit={onStep1}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Truck &amp; Goods</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">What are you moving &amp; how.</p>
            </div>

            <label className={lblCls}>Usage</label>
            <div className="mb-3.5">
              <YesNoToggle
                value={truckMode === '2'}
                onChange={v => setTruckMode(v ? '2' : '1')}
                yesLabel="🏭 Commercial"
                noLabel="🏠 Personal"
              />
            </div>

            <label className={lblCls}>Truck Body Type</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Truck /></span>
              <select value={truckBodyType} onChange={e => setTruckBodyType(e.target.value)}
                className={`${inputCls} pr-9 appearance-none`}>
                {TRUCK_BODY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <label className={lblCls}>Truck Type</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Truck /></span>
              <select value={truckTypeValue} onChange={e => setTruckTypeValue(e.target.value)}
                className={`${inputCls} pr-9 appearance-none`}>
                {TRUCK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <label className={lblCls}>Goods Type</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Package /></span>
              <select required value={goodsType} onChange={e => { setGoodsType(e.target.value); setErr1(''); }}
                className={`${inputCls} pr-9 appearance-none`}>
                <option value="" disabled>Select goods type</option>
                {GOODS_TYPES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <label className={lblCls}>
              Specific items <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <textarea placeholder="e.g., 10 boxes, 2 beds, machinery parts…"
              value={materialDetails} onChange={e => setMaterialDetails(e.target.value)}
              rows={2} maxLength={250}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none mb-3.5" />

            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Approx. Weight</label>
                <input type="text" inputMode="numeric" placeholder="e.g., 500"
                  value={weightVal} onChange={e => setWeightVal(e.target.value)}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div>
                <label className={lblCls}>Unit</label>
                <YesNoToggle value={weightUnit === '1'} onChange={v => setWeightUnit(v ? '1' : '2')} yesLabel="KG" noLabel="TON" />
              </div>
            </div>

            <label className={lblCls}>
              Estimated Volume <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'LIGHT', l: '🪶 Light' },
                { v: 'MEDIUM', l: '📦 Medium' },
                { v: 'LARGE', l: '🚛 Large' },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setEstimatedVolume(prev => prev === opt.v ? '' : opt.v)}
                  className={`h-10 rounded-xl border text-[12px] font-bold transition-all ${
                    estimatedVolume === opt.v
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  {opt.l}
                </button>
              ))}
            </div>

            {err1 && <p className="text-xs text-red-500 font-semibold mt-3">{err1}</p>}

            <button type="submit" className={`${nextBtn} w-full mt-5`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: Pickup & Drop ── */}
        {step === 2 && (
          <motion.form key="s2" onSubmit={onStep2}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Pickup &amp; Drop</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">Where the truck picks up &amp; delivers.</p>
            </div>

            <p className={subHdCls}>Pickup</p>
            <label className={lblCls}>Pickup City</label>
            <div className="mb-3.5">
              <CityPicker value={pickupCity} onChange={setPickupCity}
                placeholder="Select pickup city" locations={locations} icon={<MapPin />} />
            </div>
            <label className={lblCls}>Pickup Address</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><Home /></span>
              <input required type="text" placeholder="Enter pickup address or landmark"
                value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              <div className="col-span-1">
                <label className={lblCls}>Pincode <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="e.g., 110001"
                  value={pickupPincode} onChange={e => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div className="col-span-1">
                <label className={lblCls}>Floor</label>
                <input type="text" inputMode="numeric" placeholder="0 = Ground"
                  value={pickupFloor} onChange={e => setPickupFloor(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div className="col-span-1">
                <label className={lblCls}>Lift?</label>
                <YesNoToggle value={hasPickupLift} onChange={setHasPickupLift} yesLabel="Yes" noLabel="No" />
              </div>
            </div>

            <p className={subHdCls}>Drop</p>
            <label className={lblCls}>Drop City</label>
            <div className="mb-3.5">
              <CityPicker value={dropCity} onChange={setDropCity}
                placeholder="Enter drop city" locations={locations} allowCustom icon={<Flag />} />
            </div>
            <label className={lblCls}>Drop Address</label>
            <div className="relative mb-3.5">
              <span className={iconCls}><MapPin /></span>
              <input required type="text" placeholder="Enter drop address or landmark"
                value={dropAddress} onChange={e => setDropAddress(e.target.value)}
                className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-1">
                <label className={lblCls}>Pincode <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="e.g., 400001"
                  value={dropPincode} onChange={e => setDropPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div className="col-span-1">
                <label className={lblCls}>Floor</label>
                <input type="text" inputMode="numeric" placeholder="0 = Ground"
                  value={dropFloor} onChange={e => setDropFloor(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div className="col-span-1">
                <label className={lblCls}>Lift?</label>
                <YesNoToggle value={hasDropLift} onChange={setHasDropLift} yesLabel="Yes" noLabel="No" />
              </div>
            </div>

            {err2 && <p className="text-xs text-red-500 font-semibold mt-3">{err2}</p>}

            <div className="flex gap-2.5 mt-5">
              <button type="button" onClick={() => setStep(1)} className={backBtn}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="submit" className={nextBtn}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 3: Schedule, Requirements & Contact ── */}
        {step === 3 && (
          <motion.form key="s3" onSubmit={onStep3}
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28 }}>

            <div className="mb-4">
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Schedule &amp; Contact</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">When, extra needs &amp; who to reach.</p>
            </div>

            <p className={subHdCls}>Schedule</p>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Pickup Date</label>
                <div className="relative">
                  <span className={iconCls}><Calendar /></span>
                  <input required type="date" min={today} value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={lblCls}>Pickup Time</label>
                <div className="relative">
                  <span className={iconCls}><Clock /></span>
                  <input type="time" value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Delivery By <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                <div className="relative">
                  <span className={iconCls}><Calendar /></span>
                  <input type="date" min={pickupDate || today} value={expectedDeliveryDate}
                    onChange={e => setExpectedDeliveryDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={lblCls}>Trip Direction</label>
                <YesNoToggle value={tripDirection === 'ONE_WAY'} onChange={v => setTripDirection(v ? 'ONE_WAY' : 'ROUND_TRIP')} yesLabel="One Way" noLabel="Round Trip" />
              </div>
            </div>
            <label className={lblCls}>
              Preferred Delivery Time <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3.5">
              {[
                { v: 'MORNING', l: '🌅 Morn' },
                { v: 'AFTERNOON', l: '☀️ Aft' },
                { v: 'EVENING', l: '🌆 Eve' },
                { v: 'ANYTIME', l: '🌙 Any' },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setExpectedDeliveryTime(prev => prev === opt.v ? '' : opt.v)}
                  className={`h-10 rounded-xl border text-[11.5px] font-bold transition-all ${
                    expectedDeliveryTime === opt.v
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  {opt.l}
                </button>
              ))}
            </div>

            <p className={subHdCls}>Trip Requirements</p>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Loading/Unloading Help?</label>
                <YesNoToggle value={requiresLabour} onChange={setRequiresLabour} />
              </div>
              {requiresLabour && (
                <div>
                  <label className={lblCls}>Labourers <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                  <input type="text" inputMode="numeric" placeholder="e.g., 2, 4"
                    value={labourCount} onChange={e => setLabourCount(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
                </div>
              )}
            </div>
            <div className="mb-3.5">
              <label className={lblCls}>Multiple Stops Needed?</label>
              <YesNoToggle value={hasMultipleStops} onChange={setHasMultipleStops} />
            </div>
            {hasMultipleStops && (
              <textarea placeholder="Describe the additional stops…"
                value={multipleStopsDetails} onChange={e => setMultipleStopsDetails(e.target.value)}
                rows={2} maxLength={200}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none mb-3.5" />
            )}
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className={lblCls}>Receiver Name <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                <input type="text" placeholder="Who receives goods"
                  value={receiverName} onChange={e => setReceiverName(e.target.value)}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
              <div>
                <label className={lblCls}>Receiver Phone <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
                <input type="tel" maxLength={10} placeholder="10-digit number"
                  value={receiverPhone} onChange={e => setReceiverPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[46px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              </div>
            </div>
            <div className="mb-1">
              <label className={lblCls}>Need Proof of Delivery (POD)?</label>
              <YesNoToggle value={requiresPOD} onChange={setRequiresPOD} />
            </div>

            <p className={subHdCls}>Your Contact Details</p>
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
                    onClick={() => { setGuestOverride(true); setName(''); setPhone(''); setEmail(''); }}
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
                    value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErr3(''); }}
                    className={inputCls} />
                </div>

                <label className={lblCls}>Email <span className="text-red-500">*</span></label>
                <div className="relative mb-3.5">
                  <span className={iconCls}><Mail /></span>
                  <input required type="email" placeholder="you@example.com"
                    value={email} onChange={e => { setEmail(e.target.value); setErr3(''); }}
                    className={inputCls} />
                </div>
              </>
            )}

            <label className={lblCls}>
              Additional details <small className="text-[11px] text-gray-400 font-normal ml-1">(optional)</small>
            </label>
            <textarea placeholder="Any special requirements…"
              value={requirements} onChange={e => setRequirements(e.target.value)}
              rows={2} maxLength={250}
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

            <ReviewSection title="Truck & Goods" icon={<Truck />} onEdit={() => setStep(1)}>
              <RV label="Truck Type" value={selectedTruckType?.label || ''} />
              <RV label="Body Type" value={TRUCK_BODY_TYPES.find(t => t.value === truckBodyType)?.label || ''} />
              <RV label="Goods Type" value={goodsType} />
              <RV label="Weight" value={weightVal ? `${weightVal} ${weightUnit === '2' ? 'TON' : 'KG'}` : 'Not set'} />
            </ReviewSection>

            <ReviewSection title="Pickup & Drop" icon={<MapPin />} onEdit={() => setStep(2)}>
              <RV label="Pickup City" value={pickupCity} />
              <RV label="Pickup Address" value={pickupAddress} full />
              <RV label="Drop City" value={dropCity} />
              <RV label="Drop Address" value={dropAddress} full />
            </ReviewSection>

            <ReviewSection title="Schedule" icon={<Calendar />} onEdit={() => setStep(3)}>
              <RV label="Pickup Date" value={pickupDate} />
              <RV label="Pickup Time" value={pickupTime} />
              <RV label="Trip Direction" value={tripDirection === 'ONE_WAY' ? 'One Way' : 'Round Trip'} />
            </ReviewSection>

            <ReviewSection title="Contact Details" icon={<User />} onEdit={() => setStep(3)}>
              <RV label="Name" value={name} />
              <RV label="Mobile" value={phone} />
              <RV label="Email" value={email} />
            </ReviewSection>

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

export function BookingCard({ cityName, serviceType, variant = 'bus' }: { cityName: string; serviceType?: string; variant?: 'bus' | 'equipment' | 'truck' | 'tempo' }) {
  const [showChat, setShowChat] = useState(false);
  const isEquipment = variant === 'equipment';
  const isTruck = variant === 'truck';
  const isTempo = variant === 'tempo';
  // Tempo card equipment/truck jaisa panel hai — scrollable body aur
  // footer me AI assistant toggle. `isPanel` teenon ko ek saath rakhta hai.
  const isPanel = isEquipment || isTruck || isTempo;

  // Body scrollable hai.
  //  • Form par: toggle karte hi upar se shuru ho.
  //  • Chat par: naye message aur date-time/calendar panel message list ke
  //    NEECHE aate hain, isliye body ko content ke saath neeche pinned rakhte
  //    hain — warna panel aadha kata dikhta hai.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    if (!showChat) {
      el.scrollTop = 0;
      const id = requestAnimationFrame(() => { el.scrollTop = 0; });
      return () => cancelAnimationFrame(id);
    }

    const pin = () => { el.scrollTop = el.scrollHeight; };
    pin();
    const raf = requestAnimationFrame(pin);
    const ro = new ResizeObserver(pin);
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(pin);
    mo.observe(el, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); };
  }, [showChat]);

  return (
    <div className={`w-full min-w-0 shrink-0 ${isTempo ? '' : 'order-1 lg:order-2'} ${
      isTempo ? '' : (!isPanel ? 'lg:max-w-md lg:ml-auto' : 'lg:w-[500px]')
    }`}>
      <div className={`bg-white shadow-2xl shadow-black/20 overflow-hidden flex flex-col ${
        !isPanel
          ? 'rounded-2xl'
          : isTempo
            // Equipment card jaisa: min-height fix, aur body khud scroll
            // karta hai — isliye chat ka date-time panel bina page zoom
            // kiye poora dikhta hai.
            ? 'rounded-[28px] lg:min-h-[705px]'
            : 'rounded-[28px] lg:h-[620px]'
      }`}>

        {/* Header – 72px (equipment/truck); content-driven height on mobile for bus so wrapped text never clips */}
        <div className={`flex items-center justify-between shrink-0 gap-2 ${
          !isPanel
            ? 'min-h-[72px] py-3 px-4 sm:px-6 bg-gradient-to-r from-green-700 to-green-600'
            : 'h-[72px] px-[18px] border-b border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center shrink-0 ${
              !isPanel
                ? 'bg-white/15'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200/60'
            }`}>
              {isEquipment
                ? <HardHat className="w-[22px] h-[22px] text-white" />
                : isTruck
                  ? <Truck className="w-[22px] h-[22px] text-white" />
                  : <Bus className="w-[22px] h-[22px] text-white" />}
              {/* online dot */}
              <span className="absolute bottom-[-1px] right-[-1px] w-[11px] h-[11px] rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-[15px] sm:text-[17px] font-black leading-tight tracking-tight whitespace-nowrap ${!isPanel ? 'text-white' : 'text-gray-900'}`}>
                {isEquipment ? 'Book Your Equipment' : isTruck ? 'Book Your Truck' : isTempo ? 'Book Tempo Traveller' : 'Book Your Bus'}
              </p>
              <p className={`text-[10.5px] sm:text-[11.5px] mt-0.5 truncate ${!isPanel ? 'text-green-100' : 'text-gray-400'}`}>Free quote · No advance payment</p>
            </div>
          </div>
          {showChat ? (
            <button onClick={() => setShowChat(false)}
              className={`shrink-0 text-[11.5px] font-bold rounded-[9px] px-3 py-1.5 transition-colors whitespace-nowrap ${
                !isPanel
                  ? 'text-green-700 bg-white hover:bg-green-50'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              }`}>
              ← New chat
            </button>
          ) : (
            <div className={`shrink-0 flex items-center gap-1 text-xs font-semibold rounded-full whitespace-nowrap ${
              !isPanel
                ? 'gap-1 px-2 sm:px-2.5 py-1 text-green-700 bg-white'
                : 'gap-1.5 text-[11px] font-bold px-3 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200'
            }`}>
              {!isPanel ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3 h-3" />}
              {!isPanel ? <><span className="hidden sm:inline">100% </span>Secure</> : '100% Secure'}
            </div>
          )}
        </div>

        {/* Body – scrollable on fixed-height variants, natural height for bus */}
        <div ref={bodyRef} className={`${
          !isPanel
            ? 'p-6 pt-4'
            : `px-[18px] py-4 flex-1 min-h-0 overflow-y-auto ${isTempo ? 'max-h-[520px]' : ''}
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200
          [&::-webkit-scrollbar-thumb]:rounded-full`
        }`}>
          {showChat
            ? <DynamicChatBookingHero hideHeader serviceType={serviceType} />
            : isEquipment
              ? <EquipmentBookingWidget cityName={cityName} serviceType={serviceType} />
              : isTruck
                ? <TruckBookingWidget cityName={cityName} serviceType={serviceType} />
                : <BusBookingWidget cityName={cityName} serviceType={serviceType} variant={isTempo ? 'tempo' : 'bus'} />
          }
        </div>

        {/* Footer */}
        {!isPanel ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
            {[
              { icon: Tag, text: 'Best Price', sub: 'Guaranteed' },
              { icon: ShieldCheck, text: '500+ Verified', sub: 'Operators' },
              { icon: Clock, text: '15 Min', sub: 'Callback' },
              { icon: UserCheck, text: '24/7', sub: 'Support' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="text-[11px] leading-tight text-slate-600">
                  <div className="font-semibold text-slate-900">{item.text}</div>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        ) : isTempo ? (
          /* Equipment-rental form jaisa footer — 4 stats grid me, neeche
             poori chaudai ka AI assistant toggle. */
          <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { icon: Tag,         text: 'Best Price',    sub: 'Guaranteed' },
                { icon: ShieldCheck, text: '500+ Verified', sub: 'Operators'  },
                { icon: Clock,       text: '15 Min',        sub: 'Callback'   },
                { icon: UserCheck,   text: '24/7',          sub: 'Support'    },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="text-[11px] leading-tight text-slate-600">
                    <div className="font-semibold text-slate-900">{item.text}</div>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowChat(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-[13px] font-bold text-green-700 hover:text-green-600 transition-colors whitespace-nowrap pt-1">
              {showChat ? '← Back to form' : <>Book with AI Assistant <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        ) : (
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
        )}
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
  backgroundImage,
  heroStats = [],
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
    <section
      id="booking"
      className={`relative bg-gradient-to-br from-${gradientFrom} via-white to-${gradientTo} overflow-hidden`}
      /* 100 / 2.31 = 43.3vw — image ke apne anupat jitna, isliye CSS koi crop
         nahi karta. Oonchai khud image me upar aur neeche se kam ki gayi hai. */
      style={backgroundImage ? { minHeight: 'min(43.3vw, 700px)' } : undefined}
    >
      {/* Optional hero photo. Uske upar safed parda, taaki heading aur
          booking widget dono jaise the waise padhe ja saken. */}
      {/* Hero photo. Band ki oonchai image ke apne anupat (1717x916 ≈ 1.87)
          par bandhi hai, isliye na upar se kuch kata hai na neeche se.
          Koi safed parda nahi — photo apne poore rang me. */}
      {backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
          {/* Ek saman kaala parda + halka upar-neeche gehrapan. Tailwind ke
              opacity modifiers ki jagah seedha gradient, taaki maatra bilkul
              wahi mile jo likhi hai. */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.12)' }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.12) 100%)',
            }}
          />
        </div>
      )}

      {/* Baayin taraf ki khaali jagah ke liye dotted pattern. Sirf desktop par. */}
      {backgroundImage && (
        <div
          aria-hidden
          className="hidden lg:block absolute inset-y-0 left-0 w-[46%] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.95) 2px, transparent 2px)',
            backgroundSize: '24px 24px',
            WebkitMaskImage: 'radial-gradient(600px 500px at 12% 60%, #000 0%, #000 45%, transparent 82%)',
            maskImage: 'radial-gradient(600px 500px at 12% 60%, #000 0%, #000 45%, transparent 82%)',
          }}
        />
      )}

      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div
        className={`container-custom relative ${
          backgroundImage ? 'py-12 md:py-16 lg:pt-16 lg:pb-6' : 'py-12 md:py-16'
        }`}
      >
        {/* Ek hi content, do layout — photo wale hero me form baayin aur
            details daayin; baaki pages par pehle jaisa centered. */}
        {(() => {
          const badgeEl = backgroundImage ? (
            <div className="inline-flex items-center gap-2.5 bg-white shadow-lg shadow-black/25 ring-1 ring-black/[0.04] pl-2 pr-4 py-2 rounded-full mb-6">
              <span className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-primary-600" />
              </span>
              <span className="text-[13.5px] font-bold tracking-tight text-gray-900">
                {formatPriceHighlight(badge)}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              <span>{formatPriceHighlight(badge)}</span>
            </div>
          );

          const titleEl = (
            <h1
              className={
                backgroundImage
                  ? 'text-[2rem] leading-[1.08] md:text-[2.5rem] lg:text-[3rem] font-black tracking-tight text-white mb-4 max-w-[16ch]'
                  : 'text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'
              }
              style={backgroundImage ? { textShadow: HERO_PHOTO_TEXT_HALO } : undefined}
            >
              {pageHeading || (
                <>
                  {title}<br />
                  {/* Photo wale hero par gradient-clip text kaam nahi karta —
                      text-shadow transparent glyphs ke peeche paint hota hai
                      aur bharav dhul jaata hai. Isliye wahan thos brand rang. */}
                  <span
                    className={
                      backgroundImage
                        ? 'text-primary-400'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                    }
                  >
                    {formatPriceHighlight(titleHighlight)}
                  </span>
                </>
              )}
            </h1>
          );

          const descEl = (
            <p
              className={
                backgroundImage
                  ? 'text-[15px] md:text-[17px] leading-relaxed text-white font-semibold max-w-[31rem]'
                  : 'text-lg md:text-xl text-gray-600 max-w-3xl mx-auto'
              }
              style={backgroundImage ? { textShadow: HERO_PHOTO_TEXT_HALO } : undefined}
            >
              {pageDescription || description}
            </p>
          );

          const featuresEl = backgroundImage ? (
            /* Equipment hero jaisa: gol safed icon, neeche bold label aur
               ek halki sub-line. Photo par saaf padhne ke liye halo bhi. */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-[36rem] mx-auto lg:mx-0">
              {features.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon] ?? Star;
                return (
                  <div key={feature.text} className="flex flex-col items-center lg:items-start gap-2">
                    <div className="w-11 h-11 rounded-full bg-white shadow-lg shadow-black/25 ring-1 ring-black/[0.04] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" strokeWidth={2.1} />
                    </div>
                    <div
                      className="text-xs leading-snug text-center lg:text-left text-white/85"
                      style={{ textShadow: HERO_PHOTO_TEXT_HALO }}
                    >
                      <div className="font-bold text-[13px] text-white">{feature.text}</div>
                      {feature.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
          );

          // Photo wale hero me `bookingVariant` dene par poora booking card
          // aata hai — form + footer se "Book with AI Assistant" toggle.
          // Na dene par pehle jaisa sirf Shivi ka chat.
          const statsEl = backgroundImage && heroStats.length > 0 ? (
            /* Stats card — safed, har khaane ke beech halki lakeer, icon
               green tinted circle me aur aankda bada-bold. */
            <div className="mt-6 bg-white rounded-2xl shadow-xl shadow-black/20 ring-1 ring-black/[0.04] px-2 py-4 grid grid-cols-2 sm:grid-cols-4 max-w-[36rem] mx-auto lg:mx-0">
              {heroStats.map((stat, i) => {
                const Icon = FEATURE_ICONS[stat.icon] ?? Star;
                return (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center lg:items-start gap-1 px-3 ${
                      i % 2 === 1 ? 'border-l border-gray-100' : ''
                    } ${i >= 2 ? 'border-t sm:border-t-0 pt-3 sm:pt-0' : ''} ${
                      i === 2 ? 'sm:border-l sm:border-gray-100' : ''
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Icon className="w-[15px] h-[15px] text-primary-600" strokeWidth={2.2} />
                    </span>
                    <div className="text-[19px] font-black tracking-tight text-gray-900 tabular-nums leading-none mt-1">
                      {stat.value}
                    </div>
                    <div className="text-[11.5px] leading-snug text-gray-500 text-center lg:text-left">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null;

          const formEl = bookingVariant === 'tempo'
            ? <BookingCard cityName={cityName} serviceType={serviceType} variant="tempo" />
            : <DynamicChatBookingHero hideHeader serviceType={serviceType} />;

          if (!backgroundImage) {
            return (
              <>
                <div className="text-center mb-8">
                  {badgeEl}
                  {titleEl}
                  {descEl}
                </div>
                {formEl}
                {featuresEl}
              </>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-start">
              {/* LEFT — booking form */}
              <div className="order-2 lg:order-1 w-full lg:mt-4 lg:max-w-md">
                {formEl}
              </div>

              {/* RIGHT — badge, title, description aur features */}
              <div className="order-1 lg:order-2 min-w-0 text-center lg:text-left lg:pt-10">
                {badgeEl}
                {titleEl}
                {descEl}
                {featuresEl}
                {statsEl}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
