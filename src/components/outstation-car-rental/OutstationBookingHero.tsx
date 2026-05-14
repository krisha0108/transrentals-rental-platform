'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CarRentalBookingConfirmModal } from '@/components/car-rental/CarRentalBookingConfirmModal';
import {
  MapPin, Calendar, Clock, ChevronDown, Plus, X,
  Shield, Star, ArrowRight, ArrowLeftRight, Navigation, CheckCircle2,
} from 'lucide-react';

// ── Haversine distance (km) ────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Time picker (30-min slots, AM/PM) ─────────────────────────────────────────
function TimePickerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const slots: { label: string; value24: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h >= 12 ? 'PM' : 'AM';
      const label = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      slots.push({ label, value24: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` });
    }
  }
  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer font-medium"
      >
        {slots.map((s) => (
          <option key={s.value24} value={s.value24}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface LocationOption {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
}

// ── City autocomplete — proximity sorted, same as car-rental hero ──────────────
function CityInput({
  placeholder,
  value,
  selectedId,
  onSelect,
  icon,
  readOnly,
  locations,
  fromCoords,
  excludeId,
}: {
  placeholder: string;
  value: string;
  selectedId: string;
  onSelect: (loc: LocationOption) => void;
  icon?: React.ReactNode;
  readOnly?: boolean;
  locations: LocationOption[];
  fromCoords?: { lat: number; lng: number } | null;
  excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => { setText(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter & sort
  const filtered = (() => {
    const base = locations.filter((loc) => {
      if (excludeId && loc.id === excludeId) return false;
      if (!text) return true;
      return loc.name.toLowerCase().includes(text.toLowerCase());
    });

    // Sort by proximity when no text typed
    if (!text && fromCoords) {
      return [...base].sort((a, b) => {
        const dA = a.latitude && a.longitude ? haversineKm(fromCoords.lat, fromCoords.lng, a.latitude, a.longitude) : Infinity;
        const dB = b.latitude && b.longitude ? haversineKm(fromCoords.lat, fromCoords.lng, b.latitude, b.longitude) : Infinity;
        return dA - dB;
      });
    }
    return base;
  })();

  const nearbyCount = !text && fromCoords ? Math.min(5, filtered.length) : 0;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon ?? <MapPin className="w-4 h-4" />}
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={readOnly ? value : text}
          readOnly={readOnly}
          onChange={(e) => { if (!readOnly) { setText(e.target.value); setOpen(true); } }}
          onFocus={() => { if (!readOnly) setOpen(true); }}
          className={`w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none ${readOnly ? 'bg-gray-50 cursor-default font-semibold' : 'bg-white'}`}
        />
        {!readOnly && text && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setText(''); onSelect({ id: '', name: '', slug: '', latitude: null, longitude: null }); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && !readOnly && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs text-gray-500">
                {nearbyCount > 0 ? 'Nearby cities shown first' : 'Select destination'}
              </span>
            </div>
            <ul className="max-h-56 overflow-y-auto">
              {filtered.map((loc, idx) => {
                const dist = !text && fromCoords && loc.latitude && loc.longitude
                  ? Math.round(haversineKm(fromCoords.lat, fromCoords.lng, loc.latitude, loc.longitude))
                  : null;
                const isNearby = idx < nearbyCount;
                return (
                  <li key={loc.id}>
                    {idx === nearbyCount && nearbyCount > 0 && (
                      <div className="border-t border-gray-100" />
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { onSelect(loc); setText(loc.name); setOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-purple-50 transition ${selectedId === loc.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'}`}
                    >
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isNearby ? 'text-purple-400' : 'text-gray-300'}`} />
                      <span className="flex-1">{loc.name}</span>
                      {dist !== null && isNearby && (
                        <span className="text-xs text-purple-400 ml-auto">~{dist} km</span>
                      )}
                      {selectedId === loc.id && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
type TripType = 'roundtrip' | 'oneway';

const TRIP_TABS: { key: TripType; label: string; icon: React.ReactNode }[] = [
  { key: 'roundtrip', label: 'Round Trip', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  { key: 'oneway', label: 'One Way', icon: <ArrowRight className="w-3.5 h-3.5" /> },
];

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  seatingCapacity: number;
  luggageCapacity: string | null;
  acType: string | null;
  exampleVehicles: string | null;
  isPopular: boolean;
  dailyRate: number | null;
}

interface CityPricing {
  vehicleCategoryId: string;
  baseKmRate: number;
  minKmPerDay: number;
  driverDayAllowance: number;
}

interface Props {
  cityName: string;
  citySlug: string;
  vehicleCategories?: VehicleCategory[];
  cityPricing?: CityPricing[];
}

export function OutstationBookingHero({ cityName, citySlug, vehicleCategories = [], cityPricing = [] }: Props) {
  const [tripType, setTripType] = useState<TripType>('roundtrip');
  const [destination, setDestination] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [viaStops, setViaStops] = useState<{ name: string; id: string }[]>([]);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [submitted, setSubmitted] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [fromLocationId, setFromLocationId] = useState('');

  // Default dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
    setReturnDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Fetch all service locations once
  useEffect(() => {
    fetch('/api/services/car-rental/locations')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.locations) {
          setLocations(data.locations);
          // Find current city by slug
          const current = data.locations.find((l: LocationOption) => l.slug === citySlug);
          if (current) {
            setFromLocationId(current.id);
            if (current.latitude && current.longitude) {
              setFromCoords({ lat: current.latitude, lng: current.longitude });
            }
          }
        }
      })
      .catch(() => {});
  }, [citySlug]);

  const addStop = () => { if (viaStops.length < 3) setViaStops((s) => [...s, { name: '', id: '' }]); };
  const removeStop = (i: number) => setViaStops((s) => s.filter((_, idx) => idx !== i));
  const updateStop = (i: number, loc: LocationOption) =>
    setViaStops((s) => s.map((stop, idx) => idx === i ? { name: loc.name, id: loc.id } : stop));

  const handleExplore = () => {
    if (!destination.trim()) { alert('Please enter a destination city'); return; }
    setSubmitted(true);
    setExpandedCard(null);
  };

  // Format date for display
  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  // Compute route legs with ~km distances
  const getCoords = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc?.latitude && loc?.longitude ? { lat: loc.latitude, lng: loc.longitude } : null;
  };

  const routePoints = [
    { name: cityName, coords: fromCoords },
    ...viaStops.filter((s) => s.name).map((s) => ({ name: s.name, coords: getCoords(s.id) })),
    { name: destination, coords: getCoords(destinationId) },
  ].filter((p) => p.name);

  const routeLegs = routePoints.slice(0, -1).map((pt, i) => {
    const next = routePoints[i + 1];
    const dist = pt.coords && next.coords
      ? Math.round(haversineKm(pt.coords.lat, pt.coords.lng, next.coords.lat, next.coords.lng))
      : null;
    return { from: pt.name, to: next.name, dist };
  });

  const totalRouteDist = routeLegs.every((l) => l.dist !== null)
    ? routeLegs.reduce((sum, l) => sum + (l.dist ?? 0), 0)
    : null;

  const days = pickupDate && returnDate && returnDate >= pickupDate
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  // Build a lookup map: categoryId → pricing
  const pricingMap = new Map(cityPricing.map((p) => [p.vehicleCategoryId, p]));

  return (
    <>
    <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />

      <div className="relative container-custom py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* ── Left panel ───────────────────────────────────────────────── */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Navigation className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium">Outstation Car Rental — All India Permits</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Outstation Car Rental{' '}
              <span className="text-purple-300">from {cityName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="text-purple-100 text-lg mb-6"
            >
              Round trips, one-way drops & multi-city tours. Professional drivers with all India permits.
            </motion.p>

            {/* Price highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto lg:mx-0"
            >
              {(() => {
                const rates = cityPricing.map((p) => p.baseKmRate).filter(Boolean);
                const minRate = rates.length > 0 ? Math.min(...rates) : null;
                return (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-200 text-sm">Starting from</p>
                      {minRate ? (
                        <p className="text-4xl font-bold">₹{minRate}<span className="text-xl font-normal text-purple-200">/km</span></p>
                      ) : (
                        <p className="text-2xl font-bold">Get Quote</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-purple-200 text-sm">All-inclusive</p>
                      <p className="text-lg font-semibold">Driver + Fuel</p>
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-2 text-sm">
                {['✓ Driver included', '✓ Fuel included', '✓ All India permit'].map((t) => (
                  <span key={t} className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3"
            >
              {[
                { icon: Shield, text: 'Verified Drivers' },
                { icon: Star, text: '4.8 Rating' },
                { icon: Navigation, text: 'GPS Tracked' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <item.icon className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right panel — booking form ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden text-gray-900"
          >
            {/* Card header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Book Outstation Cab</h3>
              <p className="text-purple-100 text-sm mt-0.5">from {cityName}</p>
            </div>

            <div className="p-6">
              {submitted ? (
                // ── Results state ──
                <div>
                  {/* Route summary bar */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        {[cityName, ...viaStops.filter((s) => s.name).map((s) => s.name), destination].join(' → ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(pickupDate)}{tripType === 'roundtrip' ? ` — ${formatDate(returnDate)}` : ''} · {formatTime12(pickupTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-purple-600 font-semibold hover:underline shrink-0 ml-2"
                    >
                      Modify
                    </button>
                  </div>

                  {vehicleCategories.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">No vehicles available. Please contact us.</p>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {vehicleCategories.filter((cat) => cityPricing.length === 0 || pricingMap.has(cat.id)).map((cat) => {
                        let examples: string[] = [];
                        try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                        const pricing = pricingMap.get(cat.id);
                        const rate = pricing?.baseKmRate ?? (cat.dailyRate && cat.dailyRate > 0 ? cat.dailyRate : null);
                        const minKmPerDay = pricing?.minKmPerDay ?? 300;
                        const driverAllowancePerDay = pricing?.driverDayAllowance ?? 300;
                        const minKm = days * minKmPerDay;
                        const chargedKm = totalRouteDist !== null ? Math.max(totalRouteDist, minKm) : minKm;
                        const distCost = rate !== null ? chargedKm * rate : null;
                        const driverCost = driverAllowancePerDay * days;
                        const subtotal = distCost !== null ? distCost + driverCost : null;
                        const gst = subtotal !== null ? Math.round(subtotal * 0.05) : null;
                        const total = subtotal !== null && gst !== null ? subtotal + gst : null;
                        const isExpanded = expandedCard === cat.id;

                        return (
                          <div key={cat.id} className={`border rounded-xl transition ${isExpanded ? 'border-purple-400 shadow-md' : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'}`}>

                            {/* Card header */}
                            <div className="flex items-center gap-3 p-4">
                              <div className="w-16 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                {cat.image ? (
                                  <Image src={cat.image} alt={cat.name} width={64} height={48} className="object-contain p-1" />
                                ) : (
                                  <span className="text-2xl">🚗</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-bold text-gray-900 capitalize text-sm">{cat.name}</h4>
                                  {cat.isPopular && (
                                    <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">⭐ Popular</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                                {examples.length > 0 && (
                                  <p className="text-xs text-gray-500 truncate">{examples.slice(0, 2).join(', ')}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                {total !== null ? (
                                  <>
                                    <p className="text-xs text-gray-400">Est. total</p>
                                    <p className="font-bold text-primary text-sm">₹{total.toLocaleString('en-IN')}</p>
                                  </>
                                ) : rate !== null ? (
                                  <>
                                    <p className="text-xs text-gray-400">Starting</p>
                                    <p className="font-bold text-primary text-sm">₹{rate}/km</p>
                                  </>
                                ) : (
                                  <p className="text-sm font-semibold text-primary">Get Quote</p>
                                )}
                              </div>
                            </div>

                            {/* Route Breakdown — toggle */}
                            <div className="px-4 pb-4">
                              <button
                                onClick={() => setExpandedCard(isExpanded ? null : cat.id)}
                                className="w-full flex items-center justify-between text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition mb-2"
                              >
                                <span>Route Breakdown</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isExpanded && (
                                <div className="text-xs text-gray-600 space-y-1.5 bg-gray-50 rounded-lg p-3 mb-3">
                                  {/* Legs */}
                                  {routeLegs.map((leg, i) => (
                                    <div key={i} className="text-gray-500">{leg.from} → {leg.to}</div>
                                  ))}
                                  <div className="border-t border-gray-200 pt-1.5 mt-1">
                                    <p className="text-gray-400 mb-1">
                                      Min {days}d × {minKmPerDay} km/day = {minKm} km
                                      {totalRouteDist !== null && totalRouteDist > minKm && ` · Actual ~${totalRouteDist} km`}
                                    </p>
                                    <p className="text-gray-400 text-xs mb-2">
                                      Minimum {minKm} km charged for {days} day{days > 1 ? 's' : ''} ({minKmPerDay} km/day).{rate !== null ? ` Extra km beyond this charged at ₹${rate}/km.` : ''}
                                    </p>
                                  </div>
                                  {/* Cost lines */}
                                  {distCost !== null && (
                                    <div className="flex justify-between font-medium">
                                      <span>Distance ({chargedKm} km × ₹{rate}/km)</span>
                                      <span>₹{distCost.toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Driver allowance ({days}d)</span>
                                    <span>₹{driverCost.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Toll/Parking</span>
                                    <span>Extra (as applicable)</span>
                                  </div>
                                  {total !== null && (
                                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                                      <span>Est. Total</span>
                                      <span>₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-1.5 text-xs text-gray-500 mb-3">
                                {['✓ Driver incl.', '✓ Fuel incl.', '✓ All India permit'].map((f) => (
                                  <span key={f} className="bg-gray-100 px-2 py-0.5 rounded-full">{f}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  let exs: string[] = [];
                                  try { exs = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                                  setBookingDetails({
                                    vehicle: {
                                      id: cat.id,
                                      name: cat.name,
                                      seatingCapacity: cat.seatingCapacity,
                                      luggageCapacity: cat.luggageCapacity,
                                      acType: cat.acType,
                                      fuelType: null,
                                      image: cat.image,
                                      exampleVehicles: exs,
                                    },
                                    tripType: 'outstation',
                                    outstationMode: tripType === 'roundtrip' ? 'round-trip' : 'one-way',
                                    pickupCity: cityName,
                                    pickupCitySlug: citySlug,
                                    pickupLocationId: fromLocationId,
                                    pickupDate,
                                    pickupTime,
                                    dropCity: destination,
                                    dropLocationId: destinationId,
                                    returnDate: tripType === 'roundtrip' ? returnDate : undefined,
                                    intermediateStops: viaStops
                                      .filter((s) => s.id)
                                      .map((s, i) => ({ id: String(i), locationId: s.id, cityText: s.name })),
                                    legs: routeLegs.map((l) => ({ from: l.from, to: l.to, km: l.dist ?? 0 })),
                                    pricing: {
                                      grandTotal: total ?? 0,
                                      totalBeforeGst: subtotal ?? 0,
                                      gst: gst ?? 0,
                                      baseKmCharge: distCost ?? 0,
                                      totalKm: chargedKm,
                                      perKmRate: rate ?? 0,
                                      driverAllowance: driverCost,
                                    },
                                    serviceSlug: 'car-rental',
                                  });
                                  setShowModal(true);
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                              >
                                Book {cat.name}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* ── Trip type tabs ── */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
                    {TRIP_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setTripType(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                          tripType === tab.key
                            ? 'bg-white shadow text-purple-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {/* From */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
                      <CityInput
                        placeholder="Pickup city"
                        value={cityName}
                        selectedId={fromLocationId}
                        onSelect={() => {}}
                        readOnly
                        locations={locations}
                        fromCoords={fromCoords}
                        icon={<MapPin className="w-4 h-4 text-purple-500" />}
                      />
                    </div>

                    {/* Via stops */}
                    {viaStops.map((stop, i) => (
                      <div key={i}>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Stop {i + 1}</label>
                        <div className="relative">
                          <CityInput
                            placeholder="Via city..."
                            value={stop.name}
                            selectedId={stop.id}
                            onSelect={(loc) => updateStop(i, loc)}
                            locations={locations}
                            fromCoords={fromCoords}
                            icon={<Navigation className="w-4 h-4 text-gray-400" />}
                          />
                          <button
                            onClick={() => removeStop(i)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Stop */}
                    {viaStops.length < 3 && (
                      <button
                        onClick={addStop}
                        className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold hover:text-purple-800 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Stop
                      </button>
                    )}

                    {/* To */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
                      <CityInput
                        placeholder="Type or select destination..."
                        value={destination}
                        selectedId={destinationId}
                        onSelect={(loc) => { setDestination(loc.name); setDestinationId(loc.id); }}
                        locations={locations}
                        fromCoords={fromCoords}
                        icon={<MapPin className="w-4 h-4 text-red-400" />}
                      />
                    </div>

                    {/* Dates row */}
                    <div className={`grid gap-3 ${tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                          Pickup Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                          <input
                            type="date"
                            value={pickupDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPickupDate(val);
                                if (returnDate && returnDate < val) setReturnDate(val);
                              }}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {tripType === 'roundtrip' && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                            Return Date
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                            <input
                              type="date"
                              value={returnDate}
                              min={pickupDate || new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (pickupDate && val < pickupDate) return; // block invalid
                                setReturnDate(val);
                              }}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pickup time */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                        Pickup Time
                      </label>
                      <TimePickerSelect value={pickupTime} onChange={setPickupTime} />
                    </div>

                    {/* Note */}
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Distances shown (~km) are approximate and may vary from actual road distance. Final billing will be based on actual km travelled.
                    </p>

                    {/* CTA */}
                    <button
                      onClick={handleExplore}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-200 flex items-center justify-center gap-2"
                    >
                      <span>Explore Cabs</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Bottom note */}
                    <p className="text-center text-xs text-gray-400">
                      Min 300 km/day · Driver allowance included · Toll/parking extra
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>

    <CarRentalBookingConfirmModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      bookingDetails={bookingDetails}
      colorScheme="purple"
    />
    </>
  );
}
