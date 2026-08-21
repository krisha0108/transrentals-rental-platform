'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';
import {
  ArrowLeft,
  Truck,
  Car,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  Info,
  Loader2,
  CheckCircle,
  Briefcase,
  Send,
  Sparkles,
  Route,
  FileText,
  Wallet,
  Network,
  Zap,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ServiceType = 'truck' | 'car';

interface ServiceOption {
  key: ServiceType;
  label: string;
  icon: React.ElementType;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { key: 'truck', label: 'Truck', icon: Truck },
  { key: 'car', label: 'Car', icon: Car },
];

const VEHICLE_OPTIONS: Record<ServiceType, string[]> = {
  truck: ['Mini Truck', 'LCV', '14ft', '17ft', '19ft', '22ft', '32ft'],
  car: ['Sedan', 'SUV', 'Luxury', 'Tempo Traveller'],
};

const REASON_OPTIONS = [
  'No Vehicle Available',
  'Vehicle Under Maintenance',
  'Overbooked',
  'Route Not Covered',
  'Other',
];

const URGENCY_OPTIONS = [
  {
    value: 'HIGH',
    label: 'High',
    sub: 'Needs partner ASAP',
    gradient: 'from-red-500 to-rose-600',
    ring: 'ring-red-400',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    sub: 'Within a day',
    gradient: 'from-emerald-400 to-emerald-500',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  {
    value: 'LOW',
    label: 'Low',
    sub: 'Flexible timeline',
    gradient: 'from-emerald-500 to-green-600',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostBookingPage() {
  const router = useRouter();
  const { isApproved, openVerificationModal } = useVendorVerification();

  // ---- form state ----
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [vehicleRequired, setVehicleRequired] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [tripTime, setTripTime] = useState('');
  const [passengers, setPassengers] = useState('');
  const [goodsType, setGoodsType] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [needInsurance, setNeedInsurance] = useState(false);
  const [needLabour, setNeedLabour] = useState(false);
  const [labourCount, setLabourCount] = useState('');
  const [customerBudget, setCustomerBudget] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [urgency, setUrgency] = useState('MEDIUM');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // ---- ui state ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---- derived values ----
  const budget = Number(customerBudget) || 0;
  const commissionAmount = useMemo(() => Math.round(budget * commissionPercent / 100), [budget, commissionPercent]);
  const partnerEarning = useMemo(() => budget - commissionAmount, [budget, commissionAmount]);
  const platformFee = useMemo(() => Math.round(partnerEarning * 0.05), [partnerEarning]);

  // ---- helpers ----
  const resetServiceFields = () => {
    setVehicleRequired('');
    setVehicleCategory('');
    setPassengers('');
    setGoodsType('');
    setEstimatedWeight('');
    setNeedInsurance(false);
    setNeedLabour(false);
    setLabourCount('');
  };

  const handleServiceSelect = (key: ServiceType) => {
    if (key === serviceType) return;
    setServiceType(key);
    resetServiceFields();
  };

  // ---- submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // client-side validation
    if (!serviceType) { setError('Please select a service type.'); return; }
    if (!fromCity.trim()) { setError('Please enter the pickup city.'); return; }
    if (!toCity.trim()) { setError('Please enter the destination city.'); return; }
    if (!tripDate) { setError('Please select a trip date.'); return; }
    if (!customerBudget || budget <= 0) { setError('Please enter a valid customer budget.'); return; }

    setIsSubmitting(true);

    try {
      const body = {
        serviceType,
        bookingType: 'One Way',
        vehicleRequired,
        vehicleCategory,
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        tripDate,
        tripTime,
        passengers: passengers ? Number(passengers) : undefined,
        goodsType: goodsType || undefined,
        estimatedWeight: estimatedWeight ? Number(estimatedWeight) : undefined,
        needInsurance,
        needLabour,
        labourCount: needLabour && labourCount ? Number(labourCount) : undefined,
        customerBudget: budget,
        partnerEarning,
        commission: commissionAmount,
        urgency,
        reason,
        notes: notes || undefined,
      };

      const res = await fetch('/api/p2p/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to post booking');
      }

      router.push('/vendor/p2p/my-postings');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- input classes ----
  const inputCls =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none';
  const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide';
  const cardCls = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5';

  // ====================================================================
  // Render
  // ====================================================================
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* ---- Animated Gradient Header ---- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up text-white">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Link
            href="/vendor/p2p/bookings"
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Share a Booking
              <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
            </h1>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">
              Let partner vendors fulfill a booking you cannot handle
            </p>
          </div>
        </div>
      </div>

      {/* ---- Info banner ---- */}
      <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3 animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">How booking sharing works</h3>
          <p className="text-sm text-gray-600 mt-1">
            Got a booking but can&apos;t fulfill it? Share it with partner vendors.
            They complete the trip, the customer pays you, and you pay the partner minus your commission. Everyone wins!
          </p>
        </div>
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-up">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={isApproved ? handleSubmit : (e) => { e.preventDefault(); openVerificationModal(); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==============================================================
            Service Type Selector
        =============================================================== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
              <Network className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Service Type</h2>
          </div>
          <div className="p-6">
            <p className="text-xs text-gray-500 mb-4">Choose what type of trip you want to share with partner vendors</p>
            <div className="grid grid-cols-2 gap-4">
              {SERVICE_OPTIONS.map(({ key, label, icon: Icon }) => {
                const selected = serviceType === key;
                const desc = key === 'truck' ? 'Goods, freight & cargo' : 'Passengers & travel';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleServiceSelect(key)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                      selected
                        ? 'border-transparent bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-200 scale-[1.02]'
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${
                      selected ? 'bg-white/20 group-hover:scale-150' : 'bg-emerald-200/30 group-hover:scale-150 group-hover:bg-emerald-300/40'
                    }`}></div>
                    {selected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/40">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                        selected
                          ? 'bg-white/25 backdrop-blur-sm ring-1 ring-white/40 text-white'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className={`font-bold text-base mb-0.5 ${selected ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
                      <p className={`text-xs ${selected ? 'text-white/80' : 'text-gray-500'}`}>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==============================================================
            Route & Schedule
        =============================================================== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Route className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Route &amp; Schedule</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <MapPin className="w-4 h-4 inline mr-1" />
                From City *
              </label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="e.g., Mumbai"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <MapPin className="w-4 h-4 inline mr-1" />
                To City *
              </label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="e.g., Pune"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Trip Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <Clock className="w-4 h-4 inline mr-1" />
                Trip Time
              </label>
              <input
                type="time"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        </div>

        {/* ==============================================================
            Dynamic Fields by Service Type
        =============================================================== */}
        {serviceType && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Vehicle &amp; Trip Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vehicle Required</label>
                <select value={vehicleRequired} onChange={(e) => setVehicleRequired(e.target.value)} className={inputCls}>
                  <option value="">Select vehicle</option>
                  {VEHICLE_OPTIONS[serviceType].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Category — for truck */}
              {serviceType === 'truck' && (
                <div>
                  <label className={labelCls}>Vehicle Category</label>
                  <input
                    type="text"
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value)}
                    placeholder="e.g., Open Body, Container"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Car-specific: passengers */}
              {serviceType === 'car' && (
                <div>
                  <label className={labelCls}>Passengers</label>
                  <input
                    type="number"
                    min={1}
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    placeholder="Number of passengers"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Truck-specific goods fields */}
              {serviceType === 'truck' && (
                <>
                  <div>
                    <label className={labelCls}>Goods Type</label>
                    <input
                      type="text"
                      value={goodsType}
                      onChange={(e) => setGoodsType(e.target.value)}
                      placeholder="e.g., Furniture, Electronics"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Estimated Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(e.target.value)}
                      placeholder="e.g., 500"
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              {/* Insurance / Labour — truck only */}
              {serviceType === 'truck' && (
                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needInsurance}
                      onChange={(e) => setNeedInsurance(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Need Insurance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needLabour}
                      onChange={(e) => setNeedLabour(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Need Labour</span>
                  </label>
                  {needLabour && (
                    <div className="w-32">
                      <input
                        type="number"
                        min={1}
                        value={labourCount}
                        onChange={(e) => setLabourCount(e.target.value)}
                        placeholder="Count"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              )}
          </div>
          </div>
        )}

        {/* ==============================================================
            Urgency Selector
        =============================================================== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="bg-gradient-to-r from-slate-50 to-rose-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Urgency Level</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-3">
            {URGENCY_OPTIONS.map((opt) => {
              const selected = urgency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`relative rounded-xl p-4 text-center transition-all border-2 ${
                    selected
                      ? `${opt.border} ${opt.bg} ring-2 ${opt.ring}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`mx-auto w-10 h-10 rounded-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center mb-2`}
                  >
                    {opt.value === 'HIGH' && <AlertCircle className="w-5 h-5 text-white" />}
                    {opt.value === 'MEDIUM' && <Clock className="w-5 h-5 text-white" />}
                    {opt.value === 'LOW' && <CheckCircle className="w-5 h-5 text-white" />}
                  </div>
                  <p className={`font-semibold text-sm ${selected ? opt.text : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ==============================================================
            Reason & Notes
        =============================================================== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Reason &amp; Notes</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Why are you sharing this booking?</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
                <option value="">Select reason</option>
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requirements, instructions for the partner vendor..."
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ==============================================================
            Budget & Commission Calculator
        =============================================================== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '360ms' }}>
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Budget &amp; Commission</h2>
          </div>
          <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Budget */}
            <div>
              <label className={labelCls}>Customer Budget *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={customerBudget}
                  onChange={(e) => setCustomerBudget(e.target.value)}
                  placeholder="e.g., 15000"
                  className={`${inputCls} pl-7`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Amount the customer is paying you</p>
            </div>

            {/* Commission % */}
            <div>
              <label className={labelCls}>Your Commission %</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <div className="w-20">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className={`${inputCls} text-center`}
                  />
                </div>
                <span className="text-sm text-gray-500 font-medium">%</span>
              </div>
            </div>
          </div>

          {/* Preview card */}
          {budget > 0 && (
            <div className="mt-5 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-emerald-50 border border-emerald-100 rounded-2xl p-5 animate-fade-up">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl animate-float-slow" />
              <h3 className="relative text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Earnings Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Customer Budget</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Your Commission</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{formatPrice(commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Partner Earning</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{formatPrice(partnerEarning)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Platform Fee (5%)</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{formatPrice(platformFee)}</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        </div>

        {/* ==============================================================
            Submit
        =============================================================== */}
        <div className="flex gap-4 pt-2 animate-fade-up" style={{ animationDelay: '420ms' }}>
          <Link
            href="/vendor/p2p/bookings"
            className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-center font-semibold text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-emerald-200 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Share Booking
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
