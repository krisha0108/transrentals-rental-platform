'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Info,
  CheckCircle,
  Truck,
  Bus,
  AlertCircle,
} from 'lucide-react';

export default function PostVehiclePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleType: '',
    routeFrom: '',
    routeTo: '',
    availableDate: '',
    availableTime: '',
    expectedArrival: '',
    price: '',
    notes: '',
    driverIncluded: true,
    fuelIncluded: false,
  });

  // Mock vehicles from fleet
  const myVehicles = [
    { id: '1', name: 'Tempo Traveller 12-Seater', registration: 'MH02AB1234', type: 'tempo' },
    { id: '2', name: 'Tata 407 Truck', registration: 'MH04CD5678', type: 'truck' },
    { id: '3', name: 'Swift Dzire', registration: 'MH02EF9012', type: 'car' },
    { id: '4', name: 'Volvo Bus 45-Seater', registration: 'MH12GH3456', type: 'bus' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Redirect to P2P dashboard
    router.push('/vendor/p2p?posted=vehicle');
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
          <h1 className="text-2xl font-bold text-gray-900">Post Available Vehicle</h1>
          <p className="text-gray-600">Share your empty returning vehicle with other vendors</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900">How it works</h3>
          <p className="text-sm text-blue-700 mt-1">
            When your vehicle is returning empty on a route, post it here. Other vendors who need a vehicle
            on that route can request it. You earn money on what would otherwise be a dead run!
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Vehicle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vehicle *
          </label>
          <select
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose from your fleet</option>
            {myVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} ({vehicle.registration})
              </option>
            ))}
          </select>
        </div>

        {/* Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              From (Current Location) *
            </label>
            <input
              type="text"
              value={formData.routeFrom}
              onChange={(e) => setFormData({ ...formData, routeFrom: e.target.value })}
              required
              placeholder="e.g., Pune"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              To (Destination) *
            </label>
            <input
              type="text"
              value={formData.routeTo}
              onChange={(e) => setFormData({ ...formData, routeTo: e.target.value })}
              required
              placeholder="e.g., Mumbai"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Available Date *
            </label>
            <input
              type="date"
              value={formData.availableDate}
              onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Available Time *
            </label>
            <input
              type="time"
              value={formData.availableTime}
              onChange={(e) => setFormData({ ...formData, availableTime: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Expected Arrival
            </label>
            <input
              type="time"
              value={formData.expectedArrival}
              onChange={(e) => setFormData({ ...formData, expectedArrival: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <IndianRupee className="w-4 h-4 inline mr-1" />
            Price for this Route *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              placeholder="3500"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Set a competitive price. Platform fee: 5% of the trip value.
          </p>
        </div>

        {/* Inclusions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">What's Included?</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.driverIncluded}
                onChange={(e) => setFormData({ ...formData, driverIncluded: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Driver Included</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fuelIncluded}
                onChange={(e) => setFormData({ ...formData, fuelIncluded: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Fuel Included</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Any specific instructions or details..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Summary */}
        {formData.vehicleId && formData.routeFrom && formData.routeTo && formData.price && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Listing Preview
            </h4>
            <div className="mt-2 text-sm text-green-700">
              <p>
                <strong>{myVehicles.find(v => v.id === formData.vehicleId)?.name}</strong> will be available
                from <strong>{formData.routeFrom}</strong> to <strong>{formData.routeTo}</strong>
              </p>
              <p className="mt-1">
                On {formData.availableDate} at {formData.availableTime} for <strong>₹{formData.price}</strong>
              </p>
              <p className="mt-1 text-green-600">
                You'll earn: ₹{Math.round(Number(formData.price) * 0.95)} (after 5% platform fee)
              </p>
            </div>
          </div>
        )}

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
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <Car className="w-5 h-5" />
                Post Vehicle
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
