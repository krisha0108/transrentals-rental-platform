'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
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
  Car,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from '@/components/booking/useBookingSubmission';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { capitalize } from '@/lib/utils';
import { calculateRentalDuration } from '@/lib/utils/duration';

function SelfDriveBookingPageContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission('selfdrive');

  // Get params from URL
  const citySlug = params.location as string || '';
  const carSlug = searchParams.get('car') || '';
  const modelId = searchParams.get('modelId') || '';
  const modelName = searchParams.get('modelName') || '';
  const brandName = searchParams.get('brandName') || '';
  const vendorId = searchParams.get('vendorId') || '';
  const vendorFleetId = searchParams.get('vendorFleetId') || '';
  const vendorName = searchParams.get('vendorName') || '';
  const dailyRate = parseFloat(searchParams.get('dailyRate') || '0');
  const deposit = parseFloat(searchParams.get('deposit') || '0');
  const kmLimit = parseInt(searchParams.get('kmLimit') || '300');
  const extraKm = parseFloat(searchParams.get('extraKm') || '10');
  const broadcastToAll = searchParams.get('broadcastToAll') === 'true';
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '';
  const dropDate = searchParams.get('dropDate') || '';
  const dropTime = searchParams.get('dropTime') || '';

  const cityName = capitalize(citySlug.replace(/-/g, ' '));
  const carName = modelName || capitalize(carSlug.replace(/-/g, ' '));

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    additionalDetails: '',
  });
  const [showPassword, setShowPassword] = useState(false);

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
    if (!pickupDate || !pickupTime || !dropDate || !dropTime) {
      return { hours: 24, days: 1, totalDays: 1, totalHours: 24, formatted: '1 day' };
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

    // Validate password for non-authenticated users
    if (!isAuthenticated && !formData.password) {
      setError('Please create a password for your account');
      return;
    }

    if (!isAuthenticated && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Prepare customer info
    const customerInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: !isAuthenticated ? formData.password : undefined,
    };

    // Calculate pricing
    const baseAmount = dailyRate * duration.days;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;

    // Prepare booking data
    const bookingData = {
      service_id: 4,
      service_name: 'Self Drive Car Rental',
      car_slug: carSlug,
      car_name: carName,
      brand_name: brandName,
      model_id: modelId,
      vendor_id: vendorId,
      vendor_fleet_id: vendorFleetId,
      vendor_name: vendorName,
      broadcast_to_all: broadcastToAll,
      location_name: cityName,
      location_slug: citySlug,
      journey_datetime: `${pickupDate}T${pickupTime}:00`,
      return_datetime: `${dropDate}T${dropTime}:00`,
      duration_days: duration.days,
      duration_hours: duration.hours,
      daily_rate: dailyRate,
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      deposit_amount: deposit,
      km_limit_per_day: kmLimit,
      extra_km_charge: extraKm,
      license_number: formData.licenseNumber,
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canSubmit = formData.name && formData.email && formData.phone &&
    (isAuthenticated || (formData.password && formData.password.length >= 6));

  // Redirect if no params
  if (!carSlug || !citySlug || !pickupDate || !dropDate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Booking</h1>
          <p className="text-gray-600 mb-4">Missing booking information</p>
          <Button onClick={() => router.push('/self-drive-car-rentals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Car Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
        <div className="container-custom">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Complete Your Booking</h1>
          <p className="text-blue-100 mt-2">Just one more step to get your self-drive car!</p>
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
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
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
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
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
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                      }`}
                    required
                  />
                </div>

                {/* Password field for new users */}
                {!isAuthenticated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Create Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This password will be used to login and track your bookings
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <KeyRound className="w-4 h-4 inline mr-2" />
                    Driving License Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => updateFormData('licenseNumber', e.target.value)}
                    placeholder="DL-1234567890"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">You can provide this at pickup</p>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
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
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-bold"
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
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase">{brandName}</p>
                  <h3 className="font-bold text-gray-900">{carName}</h3>
                  <p className="text-sm text-gray-500">Self-Drive Rental</p>
                </div>
              </div>

              {/* Vendor Info */}
              {vendorName && !broadcastToAll && (
                <div className="py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Vendor:</span>
                    <span className="font-semibold text-gray-900">{vendorName}</span>
                  </div>
                </div>
              )}

              {broadcastToAll && (
                <div className="py-3 border-b border-gray-100">
                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">
                      Request will be sent to all available vendors
                    </p>
                  </div>
                </div>
              )}

              {/* Trip Details */}
              <div className="py-4 space-y-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{cityName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(pickupDate)} at {formatTime(pickupTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Drop-off</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(dropDate)} at {formatTime(dropTime)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-blue-700">
                    Duration: {durationText}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              {dailyRate > 0 && (
                <div className="py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">₹{dailyRate} × {duration.days} day{duration.days > 1 ? 's' : ''}</span>
                      <span>₹{dailyRate * duration.days}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">₹{Math.round(dailyRate * duration.days * 1.18)}</span>
                    </div>
                    {deposit > 0 && (
                      <div className="flex justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        <span>Security Deposit</span>
                        <span>₹{deposit}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              <div className="py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Included</h3>
                <div className="space-y-2">
                  {[
                    'Insurance Coverage',
                    'Roadside Assistance',
                    `${kmLimit} km/day (₹${extraKm}/extra km)`,
                    'Free Cancellation (24hrs)',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Required at Pickup</h3>
                <div className="space-y-2">
                  {[
                    'Valid Driving License (1+ year)',
                    'ID Proof (Aadhar/PAN)',
                    deposit > 0 ? `Security Deposit: ₹${deposit}` : 'Security Deposit',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-blue-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="pt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-blue-500" />
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

export default function SelfDriveBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SelfDriveBookingPageContent />
    </Suspense>
  );
}
