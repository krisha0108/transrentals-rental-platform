'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

interface RouteHeroProps {
  fromCity: string;
  fromSlug: string;
  toCity: string;
  toSlug: string;
  distance: number;
  estimatedTime?: string | null;
  minPrice: number;
  serviceType: string;
}

export function RouteHero({
  fromCity,
  fromSlug,
  toCity,
  toSlug,
  distance,
  estimatedTime,
  minPrice,
  serviceType,
}: RouteHeroProps) {
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const handleBookNow = () => {
    // Redirect to booking page with pre-filled data
    const params = new URLSearchParams({
      from: fromSlug,
      to: toSlug,
      date: pickupDate,
      time: pickupTime,
      service: serviceType,
    });
    window.location.href = `/book?${params.toString()}`;
  };

  return (
    <section className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-16">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ⚡ One Way Cab - No Return Charges
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {fromCity} to {toCity} Cab
            </h1>

            <div className="flex items-center gap-4 text-lg text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>{distance} km</span>
              </div>
              {estimatedTime && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span>{estimatedTime}</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-3xl font-bold text-emerald-600">₹{minPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Per journey</p>
                  <p className="text-lg font-semibold text-gray-700">All inclusive</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                  ✓ No return charges
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  ✓ Professional drivers
                </span>
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  ✓ 24/7 support
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-yellow-500">★★★★★</span>
                <span className="font-semibold">4.8/5</span>
                <span className="text-gray-400">|</span>
                <span>2,400+ trips</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Booking Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Booking
            </h3>

            <div className="space-y-4">
              {/* Route Display */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="text-lg font-bold text-gray-900">{fromCity}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-emerald-600" />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">To</p>
                    <p className="text-lg font-bold text-gray-900">{toCity}</p>
                  </div>
                </div>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleBookNow}
                disabled={!pickupDate || !pickupTime}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Book Now - Starting ₹{minPrice}
              </button>

              <p className="text-center text-sm text-gray-500">
                Instant confirmation • No hidden charges
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
