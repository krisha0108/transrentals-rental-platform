'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BIKE_TYPES, BIKE_DURATIONS } from '@/lib/constants/services';

interface QuickBookingWidgetProps {
  serviceType: string;
  location: string;
  locationName: string;
}

export function QuickBookingWidget({
  serviceType,
  location,
  locationName,
}: QuickBookingWidgetProps) {
  const [formData, setFormData] = useState({
    bikeType: '',
    duration: '',
    pickupDate: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to booking page or open modal
    window.location.href = `/book/${serviceType}?location=${location}`;
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-primary/20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
              Quick Booking
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={locationName}
                      readOnly
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                {/* Bike Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bike Type
                  </label>
                  <select
                    value={formData.bikeType}
                    onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Select bike type</option>
                    {BIKE_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Select duration</option>
                    {BIKE_DURATIONS.map((duration) => (
                      <option key={duration.id} value={duration.id}>
                        {duration.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10}"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Get Quotes from Vendors
              </Button>

              <p className="text-sm text-gray-500 text-center">
                You'll receive quotes from verified vendors. No payment required now.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
