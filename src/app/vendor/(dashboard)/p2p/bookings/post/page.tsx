'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Info,
  CheckCircle,
  Users,
  Truck,
  AlertTriangle,
  Package,
} from 'lucide-react';

export default function PostBookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bookingType: '',
    vehicleRequired: '',
    routeFrom: '',
    routeTo: '',
    isRoundTrip: false,
    tripDate: '',
    tripTime: '',
    returnDate: '',
    passengers: '',
    customerBudget: '',
    yourCommission: '',
    reason: '',
    customerName: '',
    customerPhone: '',
    additionalNotes: '',
    urgency: 'medium',
  });

  const bookingTypes = [
    'Outstation Trip',
    'Local Rental',
    'Airport Transfer',
    'Wedding Car',
    'Corporate Trip',
    'Pilgrimage Tour',
    'Goods Transport',
    'Packers & Movers',
  ];

  const vehicleTypes = [
    'Sedan (4-Seater)',
    'SUV (6-7 Seater)',
    'MUV (7 Seater)',
    'Tempo Traveller (12 Seater)',
    'Tempo Traveller (17 Seater)',
    'Mini Bus (20 Seater)',
    'Bus (35 Seater)',
    'Bus (45 Seater)',
    'Mini Truck (Tata Ace)',
    'Truck (14ft)',
    'Truck (20ft)',
    'Any',
  ];

  const reasons = [
    'No vehicle available',
    'Vehicle under maintenance',
    'Driver not available',
    'Overbooked',
    'Route not serviceable',
    'Customer requirement mismatch',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Redirect to P2P dashboard
    router.push('/vendor/p2p?posted=booking');
  };

  const calculatePartnerEarning = () => {
    const budget = Number(formData.customerBudget) || 0;
    const commission = Number(formData.yourCommission) || 0;
    return budget - commission;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/p2p"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Share Booking</h1>
          <p className="text-gray-600">Let other vendors fulfill your booking</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-purple-900">How booking sharing works</h3>
          <p className="text-sm text-purple-700 mt-1">
            Got a booking but can't fulfill it? Share it with other vendors. They complete the trip,
            customer pays you, and you pay the partner vendor minus your commission. Everyone wins!
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Booking Type & Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Type *
            </label>
            <select
              value={formData.bookingType}
              onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select type</option>
              {bookingTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Required *
            </label>
            <select
              value={formData.vehicleRequired}
              onChange={(e) => setFormData({ ...formData, vehicleRequired: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select vehicle type</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Pickup Location *
            </label>
            <input
              type="text"
              value={formData.routeFrom}
              onChange={(e) => setFormData({ ...formData, routeFrom: e.target.value })}
              required
              placeholder="e.g., Mumbai Airport"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Drop Location *
            </label>
            <input
              type="text"
              value={formData.routeTo}
              onChange={(e) => setFormData({ ...formData, routeTo: e.target.value })}
              required
              placeholder="e.g., Pune"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Round Trip */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRoundTrip}
              onChange={(e) => setFormData({ ...formData, isRoundTrip: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">This is a round trip</span>
          </label>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Trip Date *
            </label>
            <input
              type="date"
              value={formData.tripDate}
              onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Pickup Time *
            </label>
            <input
              type="time"
              value={formData.tripTime}
              onChange={(e) => setFormData({ ...formData, tripTime: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {formData.isRoundTrip && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Return Date
              </label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Number of Passengers
          </label>
          <input
            type="number"
            value={formData.passengers}
            onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
            placeholder="e.g., 4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IndianRupee className="w-4 h-4 inline mr-1" />
              Customer's Total Budget *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.customerBudget}
                onChange={(e) => setFormData({ ...formData, customerBudget: e.target.value })}
                required
                placeholder="15000"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount customer is paying you</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IndianRupee className="w-4 h-4 inline mr-1" />
              Your Commission *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.yourCommission}
                onChange={(e) => setFormData({ ...formData, yourCommission: e.target.value })}
                required
                placeholder="1500"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Your cut for sharing this booking</p>
          </div>
        </div>

        {/* Commission Summary */}
        {formData.customerBudget && formData.yourCommission && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Partner vendor will earn:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{calculatePartnerEarning().toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              (Customer Budget ₹{Number(formData.customerBudget).toLocaleString()} - Your Commission ₹{Number(formData.yourCommission).toLocaleString()})
            </p>
          </div>
        )}

        {/* Reason for Sharing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Why are you sharing this booking? *
          </label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select reason</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
          <div className="flex gap-4">
            {[
              { value: 'high', label: 'Urgent', color: 'red' },
              { value: 'medium', label: 'Medium', color: 'yellow' },
              { value: 'low', label: 'Flexible', color: 'green' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex-1 p-3 border rounded-lg cursor-pointer transition text-center ${formData.urgency === option.value
                    ? `border-${option.color}-500 bg-${option.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={formData.urgency === option.value}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="sr-only"
                />
                <span className={formData.urgency === option.value ? 'font-medium' : ''}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Customer Details (Optional) */}
        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Customer Details (Optional - shared with partner)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Customer name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+91 9737965551"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            rows={3}
            placeholder="Any specific requirements or instructions..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Link
            href="/vendor/p2p"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <CalendarCheck className="w-5 h-5" />
                Share Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
