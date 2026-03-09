// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Truck, MapPin, Calendar, Clock, FileText,
  Users, Car, ChevronRight, Home, CheckCircle, Bike, Bus, AlertTriangle
} from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'car', label: 'Chauffeur Driven Car', icon: Car, color: 'indigo' },
  { value: 'self-drive', label: 'Self Drive Car', icon: Car, color: 'blue' },
  { value: 'bus', label: 'Bus Rental', icon: Bus, color: 'amber' },
  { value: 'bike', label: 'Bike Rental', icon: Bike, color: 'green' },
  { value: 'truck', label: 'Truck / Tempo', icon: Truck, color: 'red' },
  { value: 'luxury', label: 'Luxury Car', icon: Car, color: 'purple' },
];

const B2B_SERVICES = ['car', 'self-drive', 'bus'];

const VEHICLE_CATEGORIES = [
  'Sedan', 'SUV', 'Hatchback', 'Mini Bus', 'AC Bus', 'Non-AC Bus',
  'Tempo Traveller', 'Innova', 'Ertiga', 'Luxury Sedan', 'Luxury SUV',
];

const TRIP_TYPES = [
  { value: 'ONE_WAY', label: 'One Way', desc: 'Point A to B' },
  { value: 'ROUND_TRIP', label: 'Round Trip', desc: 'A to B and back' },
  { value: 'HOURLY', label: 'Hourly / Local', desc: 'Within city' },
];

export default function CreateB2BBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    serviceType: '',
    vehiclesRequired: '',
    passengerCount: '',
    vehicleCategory: '',
    pickupLocation: '',
    dropLocation: '',
    tripType: 'ONE_WAY',
    scheduledDate: '',
    scheduledTime: '',
    returnDate: '',
    returnTime: '',
    specialNotes: '',
  });

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!customerId) { setError('Customer ID missing. Please login again.'); return; }
    if (!form.serviceType) { setError('Please select a service type'); return; }
    if (!form.vehiclesRequired || parseInt(form.vehiclesRequired) < 1) { setError('Please enter number of vehicles required'); return; }
    if (!form.pickupLocation) { setError('Please enter pickup location'); return; }
    if (!form.scheduledDate) { setError('Please select pickup date'); return; }
    if (!form.scheduledTime) { setError('Please select pickup time'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/b2b/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, customerId }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        router.push(`/customer/b2b-bookings/${data.booking.id}?customer_id=${customerId}`);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/customer/b2b-bookings?customer_id=${customerId}`} className="p-2 hover:bg-white/10 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">New B2B Booking</h1>
                  <p className="text-green-300 text-xs">Corporate bulk transport</p>
                </div>
              </div>
            </div>
            <Link href={`/customer/b2b-bookings?customer_id=${customerId}`} className="p-2 hover:bg-white/10 rounded-lg transition">
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Service Type */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              Select Service Type
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map(s => {
                const Icon = s.icon;
                const isSelected = form.serviceType === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => updateForm('serviceType', s.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Vehicle Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Vehicle Requirements
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">No. of Vehicles *</label>
                  <input
                    type="number" min="1" max="500"
                    value={form.vehiclesRequired}
                    onChange={(e) => updateForm('vehiclesRequired', e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passenger Count</label>
                  <input
                    type="number" min="1"
                    value={form.passengerCount}
                    onChange={(e) => updateForm('passengerCount', e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Category</label>
                <select
                  value={form.vehicleCategory}
                  onChange={(e) => updateForm('vehicleCategory', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">Select category (optional)</option>
                  {VEHICLE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Trip Type */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Trip Details
            </h3>
            <div className="space-y-4">
              {/* Trip Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {TRIP_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => updateForm('tripType', t.value)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        form.tripType === t.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${form.tripType === t.value ? 'text-green-700' : 'text-gray-700'}`}>
                        {t.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="text"
                    value={form.pickupLocation}
                    onChange={(e) => updateForm('pickupLocation', e.target.value)}
                    placeholder="e.g. Corporate Office, SG Highway, Ahmedabad"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Drop Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  <input
                    type="text"
                    value={form.dropLocation}
                    onChange={(e) => updateForm('dropLocation', e.target.value)}
                    placeholder="e.g. Factory, Sanand Industrial Area"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Date & Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Schedule
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => updateForm('scheduledDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={form.scheduledTime}
                      onChange={(e) => updateForm('scheduledTime', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {form.tripType === 'ROUND_TRIP' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={form.returnDate}
                        onChange={(e) => updateForm('returnDate', e.target.value)}
                        min={form.scheduledDate || new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={form.returnTime}
                        onChange={(e) => updateForm('returnTime', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 5: Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Additional Requirements
            </h3>
            <textarea
              value={form.specialNotes}
              onChange={(e) => updateForm('specialNotes', e.target.value)}
              rows={3}
              placeholder="e.g. AC vehicles only, need GPS tracking, specific vehicle brand preference, etc."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Payment Info Banner */}
          {form.serviceType && !B2B_SERVICES.includes(form.serviceType) ? (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800">Advance Payment Required</h4>
                  <p className="text-sm text-amber-700 mt-0.5">
                    This service is <strong>not covered under your B2B agreement</strong>. This booking will not be counted as a B2B booking — advance payment will be required before trip confirmation.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">No Payment Required Now</h4>
                  <p className="text-sm text-green-700 mt-0.5">
                    This is a post-paid corporate booking. You'll receive quotes from vendors, and billing happens after trip completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-green-200 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <Truck className="w-5 h-5" />
                Create B2B Booking
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
