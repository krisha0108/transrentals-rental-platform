'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    gradient: 'from-amber-400 to-yellow-500',
    ring: 'ring-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
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
    'rounded-lg border border-gray-300 px-3 py-2 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
  const cardCls = 'bg-white rounded-xl shadow-sm border border-gray-100 p-5';

  // ====================================================================
  // Render
  // ====================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ---- Header ---- */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/p2p/bookings"
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Share a Booking</h1>
            <p className="text-purple-200 text-sm mt-1">
              Let other vendors fulfill a booking you cannot handle
            </p>
          </div>
        </div>
      </div>

      {/* ---- Info banner ---- */}
      <div className={`${cardCls} flex items-start gap-3`}>
        <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-medium text-gray-900">How booking sharing works</h3>
          <p className="text-sm text-gray-600 mt-1">
            Got a booking but can&apos;t fulfill it? Share it with partner vendors.
            They complete the trip, the customer pays you, and you pay the partner minus your commission. Everyone wins!
          </p>
        </div>
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==============================================================
            Service Type Selector
        =============================================================== */}
        <div className={cardCls}>
          <label className={`${labelCls} mb-3`}>Service Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-2 max-w-xs gap-3">
            {SERVICE_OPTIONS.map(({ key, label, icon: Icon }) => {
              const selected = serviceType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleServiceSelect(key)}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all ${
                    selected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==============================================================
            Dynamic Fields by Service Type
        =============================================================== */}
        {serviceType && (
          <div className={cardCls}>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              Vehicle &amp; Trip Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Need Insurance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needLabour}
                      onChange={(e) => setNeedLabour(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
            Route & Schedule
        =============================================================== */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            Route &amp; Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* ==============================================================
            Urgency Selector
        =============================================================== */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            Urgency Level
          </h2>

          <div className="grid grid-cols-3 gap-3">
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

        {/* ==============================================================
            Reason & Notes
        =============================================================== */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600" />
            Reason &amp; Notes
          </h2>

          <div className="grid grid-cols-1 gap-4">
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
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            Budget &amp; Commission
          </h2>

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
                  className="flex-1 accent-purple-600"
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
            <div className="mt-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-purple-800 mb-3">Earnings Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Customer Budget</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Your Commission</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">{formatPrice(commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Partner Earning</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{formatPrice(partnerEarning)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Platform Fee (5%)</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">{formatPrice(platformFee)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==============================================================
            Submit
        =============================================================== */}
        <div className="flex gap-4 pt-2">
          <Link
            href="/vendor/p2p/bookings"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-purple-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Share Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
