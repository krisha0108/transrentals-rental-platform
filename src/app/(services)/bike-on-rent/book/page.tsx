'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Shield,
  Check,
  ArrowLeft,
  Bike,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from '@/components/booking/useBookingSubmission';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { capitalize } from '@/lib/utils';
import { calculateRentalDuration } from '@/lib/utils/duration';

function BikeBookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission('bike');

  // Get params from URL - support both new (modelId, modelName, location) and legacy (bike, city) params
  const modelId = searchParams.get('modelId') || '';
  const modelName = searchParams.get('modelName') || '';
  const brandName = searchParams.get('brandName') || '';
  const vendorId = searchParams.get('vendorId') || '';
  const vendorFleetId = searchParams.get('vendorFleetId') || '';
  const dailyRateParam = searchParams.get('dailyRate') || '';
  const broadcastToAll = searchParams.get('broadcastToAll') === 'true';

  // Support both old and new parameter names
  const bikeSlug = searchParams.get('bike') || '';
  const citySlug = searchParams.get('city') || searchParams.get('location') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '';
  const dropDate = searchParams.get('dropDate') || '';
  const dropTime = searchParams.get('dropTime') || '';

  // Use modelName if available, otherwise derive from slug
  const cityName = capitalize(citySlug.replace(/-/g, ' '));
  const bikeName = modelName || capitalize(bikeSlug.replace(/-/g, ' '));
  const dailyRate = dailyRateParam ? parseFloat(dailyRateParam) : 0;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (isAuthenticated && customer) {
      setFormData((prev) => ({
        ...prev,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
      }));
    }
  }, [isAuthenticated, customer]);

  // Calculate duration with time precision
  const calculateDuration = () => {
    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      return { formatted: '1 day', totalDays: 1 };
    }
    return calculateRentalDuration(pickupDate, pickupTime, dropDate, dropTime);
  };

  const duration = calculateDuration();
  const durationText = duration.formatted;

  // Format helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    // Prepare customer info
    const customerInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    // Prepare booking data
    const bookingData = {
      service_id: 5,
      service_name: 'Bike on Rent',
      bike_slug: bikeSlug,
      bike_name: bikeName,
      bike_brand: brandName,
      model_id: modelId,           // VehicleModel ID for direct lookup
      vendor_id: vendorId,         // Specific vendor if selected
      vendor_fleet_id: vendorFleetId,  // Specific fleet vehicle if selected
      daily_rate: dailyRate,       // Pre-selected price
      broadcast_to_all: broadcastToAll,  // Whether to notify all vendors
      location_name: cityName,
      location_slug: citySlug,
      journey_datetime: `${pickupDate}T${pickupTime}:00`,
      return_datetime: `${dropDate}T${dropTime}:00`,
      duration_days: duration,
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canSubmit = formData.name && formData.email && formData.phone;

  // Redirect if no params - check for either modelId/modelName or bikeSlug
  const hasBikeInfo = modelId || modelName || bikeSlug;
  if (!hasBikeInfo || !citySlug || !pickupDate || !dropDate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Booking</h1>
          <p className="text-gray-600 mb-4">Missing booking information</p>
          <Button onClick={() => router.push('/bike-on-rent')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bike Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-8">
        <div className="container-custom">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Complete Your Booking</h1>
          <p className="text-emerald-100 mt-2">Just one more step to get your bike!</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>

              {isAuthenticated && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <Check className="w-5 h-5" />
                  <span>Welcome back, {customer?.name}! Your details are pre-filled.</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) updateFormData('phone', val);
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={formData.additionalDetails}
                    onChange={(e) => updateFormData('additionalDetails', e.target.value)}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-bold"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </motion.form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h2>

              {/* Vehicle */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Bike className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{bikeName}</h3>
                  <p className="text-sm text-gray-500">{brandName ? `${brandName} • ` : ''}Bike Rental</p>
                </div>
              </div>

              {/* Trip Details */}
              <div className="py-4 space-y-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{cityName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(pickupDate)} at {formatTime(pickupTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Drop-off</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(dropDate)} at {formatTime(dropTime)}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-emerald-700">
                    Duration: {durationText}
                  </p>
                </div>
              </div>

              {/* Price Summary */}
              {dailyRate > 0 && (
                <div className="py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Daily Rate</span>
                      <span className="font-medium">₹{dailyRate}/day</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{duration} day{duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{dailyRate * duration}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-emerald-600">₹{Math.round(dailyRate * duration * 1.18)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">*Security deposit payable at pickup</p>
                </div>
              )}

              {/* Inclusions */}
              <div className="py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Included</h3>
                <div className="space-y-2">
                  {['Helmet', 'Insurance', 'Roadside Assistance', '100 km/day'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="pt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Secure & Verified Booking
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BikeBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <BikeBookingPageContent />
    </Suspense>
  );
}
