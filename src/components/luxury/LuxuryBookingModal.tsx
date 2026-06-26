'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Crown, Calendar, MapPin, Clock, User, Mail, Phone, ChevronRight, Check, Loader2, Users, Fuel, Settings, Lock, Eye, EyeOff } from 'lucide-react';
import { LuxuryVehicle } from './LuxuryVehicleCard';
import { useCustomerAuth } from '@/hooks/useCustomer';

interface LuxuryBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: LuxuryVehicle | null;
  location?: string;
  locationSlug?: string;
}

type BookingType = 'wedding' | 'reception' | 'engagement' | 'birthday' | 'corporate' | 'personal' | 'airport' | 'photoshoot';
type BookingStep = 'details' | 'contact' | 'confirm';
type PostBookingStep = 'none' | 'create_password' | 'enter_password';

const BOOKING_TYPES: { value: BookingType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'reception', label: 'Reception', icon: '🥂' },
  { value: 'engagement', label: 'Engagement', icon: '💍' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'corporate', label: 'Corporate', icon: '💼' },
  { value: 'personal', label: 'Personal', icon: '🎉' },
  { value: 'airport', label: 'Airport Transfer', icon: '✈️' },
  { value: 'photoshoot', label: 'Photo/Film Shoot', icon: '📸' },
];

// Duty package options (hours / km) shown to the customer
const PACKAGE_OPTIONS = [
  '8hr/80km',
  '12hr/120km',
  'Full Day',
  'Outstation',
  'Custom',
];

// Wedding-family occasions map to the "wedding" luxury category
const WEDDING_OCCASIONS: BookingType[] = ['wedding', 'reception', 'engagement'];

export function LuxuryBookingModal({
  isOpen,
  onClose,
  vehicle,
  location,
  locationSlug,
}: LuxuryBookingModalProps) {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [step, setStep] = useState<BookingStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Post-booking password flow
  const [postBookingStep, setPostBookingStep] = useState<PostBookingStep>('none');
  const [bookingResponse, setBookingResponse] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  const [formData, setFormData] = useState({
    bookingType: 'personal' as BookingType,
    pickupLocation: location || '',
    pickupPincode: '',
    destination: '',
    dropPincode: '',
    tripType: 'local' as 'local' | 'outstation' | 'airport',
    packageType: '8hr/80km',
    estimatedKm: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    needDecoration: false,
    decorationType: '',
    needDressCode: true,
    name: '',
    email: '',
    phone: '',
    additionalRequests: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setIsSuccess(false);
      setPostBookingStep('none');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setFormData((prev) => ({
        ...prev,
        pickupLocation: location || prev.pickupLocation,
      }));
    }
  }, [isOpen, location]);

  // Auto-fill customer data when auth is ready
  useEffect(() => {
    if (isOpen && !authLoading && isAuthenticated && customer) {
      setFormData((prev) => ({
        ...prev,
        name: customer.name || prev.name,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
      }));
    }
  }, [isOpen, authLoading, isAuthenticated, customer]);

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingTypeSelect = (type: BookingType) => {
    setFormData((prev) => ({ ...prev, bookingType: type }));
  };

  const validateStep = (currentStep: BookingStep): boolean => {
    if (currentStep === 'details') {
      return !!(formData.pickupLocation && formData.pickupDate && formData.pickupTime);
    }
    if (currentStep === 'contact') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      return !!(formData.name && emailRegex.test(formData.email) && phoneRegex.test(formData.phone));
    }
    return true;
  };

  // Check if user is logged in (after auth loading completes)
  const isLoggedIn = !authLoading && isAuthenticated && customer;

  const nextStep = () => {
    if (step === 'details' && validateStep('details')) {
      // Skip contact step if user is logged in (already has customer data)
      if (isLoggedIn) {
        setStep('confirm');
      } else {
        setStep('contact');
      }
    } else if (step === 'contact' && validateStep('contact')) {
      setStep('confirm');
    }
  };

  const prevStep = () => {
    if (step === 'contact') setStep('details');
    if (step === 'confirm') {
      // Go back to details if logged in (since we skipped contact)
      if (isLoggedIn) {
        setStep('details');
      } else {
        setStep('contact');
      }
    }
  };

  const handleSubmit = async () => {
    if (!vehicle) return;

    setIsSubmitting(true);

    try {
      const bookingPayload = {
        bookingType: 'luxury',
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        bookingData: {
          service_id: 4, // Luxury Car Rental
          service_name: 'Luxury Car Rental',
          vehicle_name: vehicle.name,
          vehicle_id: vehicle.id,
          luxury_type: WEDDING_OCCASIONS.includes(formData.bookingType) ? 1 : formData.bookingType === 'corporate' ? 3 : 2,
          occasion: formData.bookingType,
          location_name: formData.pickupLocation,
          pickup_pincode: formData.pickupPincode || null,
          destination: formData.destination,
          drop_pincode: formData.dropPincode || null,
          trip_type: formData.tripType,
          package_type: formData.packageType,
          estimated_km: formData.estimatedKm || null,
          journey_datetime: `${formData.pickupDate}T${formData.pickupTime}:00`,
          return_datetime: formData.returnDate && formData.returnTime
            ? `${formData.returnDate}T${formData.returnTime}:00`
            : null,
          need_decoration: formData.needDecoration,
          decoration_type: formData.needDecoration ? (formData.decorationType || null) : null,
          need_dress_code: formData.needDressCode,
          other_info: formData.additionalRequests,
        },
        isLoggedIn: isLoggedIn,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBookingResponse(data);

        // If user is already logged in, just show success
        if (isLoggedIn) {
          setIsSuccess(true);
        } else {
          // Check if customer exists or is new
          if (data.isNewCustomer) {
            setPostBookingStep('create_password');
          } else if (data.customerExists && !data.hasPassword) {
            // Customer exists but no password set
            setPostBookingStep('create_password');
          } else if (data.customerExists && data.hasPassword) {
            // Customer exists with password - ask to login
            setPostBookingStep('enter_password');
          } else {
            setIsSuccess(true);
          }
        }
      } else {
        throw new Error(data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error submitting your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async () => {
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/customer/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save customer to localStorage
        if (data.customers && data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('customer', JSON.stringify(data.customers));
        }
        setIsSuccess(true);
        setPostBookingStep('none');
      } else {
        setPasswordError(data.message || 'Failed to set password');
      }
    } catch (error) {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/customer/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save customer to localStorage
        if (data.customers && data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('customer', JSON.stringify(data.customers));
        }
        setIsSuccess(true);
        setPostBookingStep('none');
      } else {
        setPasswordError(data.message || 'Incorrect password');
      }
    } catch (error) {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSkipPassword = () => {
    setIsSuccess(true);
    setPostBookingStep('none');
  };

  const getImageUrl = () => {
    if (!vehicle) return '';
    if (imageError) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
    }
    return vehicle.imageUrl || vehicle.images?.[0] || `/images/fleet/${vehicle.slug}.jpg`;
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Vehicle Preview (Left Side) */}
        <div className="relative w-full md:w-2/5 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex flex-col">
          {/* Vehicle Image */}
          <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-4">
            <Image
              src={getImageUrl()}
              alt={vehicle.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Vehicle Info */}
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
                {vehicle.brand}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-3">{vehicle.name}</h3>

            {/* Specs */}
            <div className="flex flex-wrap gap-3 mb-4">
              {vehicle.specs.seating && (
                <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                  <Users className="w-4 h-4 text-amber-400" />
                  {vehicle.specs.seating} Seats
                </span>
              )}
              {vehicle.specs.transmission && (
                <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                  <Settings className="w-4 h-4 text-amber-400" />
                  {vehicle.specs.transmission}
                </span>
              )}
              {vehicle.specs.fuelType && (
                <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  {vehicle.specs.fuelType}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Starting from</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₹{vehicle.basePrice.toLocaleString()}</span>
                <span className="text-gray-400">/day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form (Right Side) */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {postBookingStep === 'create_password' ? (
            /* Create Password State */
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h3>
              <p className="text-gray-600 mb-6 max-w-sm text-sm">
                Create a password to track your bookings and get exclusive offers
              </p>

              <div className="w-full max-w-xs space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                <button
                  onClick={handleSetPassword}
                  disabled={isSettingPassword}
                  className="w-full bg-purple-900 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
                <button
                  onClick={handleSkipPassword}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 py-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : postBookingStep === 'enter_password' ? (
            /* Enter Password State (Existing Customer) */
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h3>
              <p className="text-gray-600 mb-1 text-sm">Welcome back!</p>
              <p className="text-gray-500 mb-6 max-w-sm text-sm">
                Enter your password to access your bookings
              </p>

              <div className="w-full max-w-xs space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                <button
                  onClick={handleVerifyPassword}
                  disabled={isSettingPassword}
                  className="w-full bg-purple-900 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Login & Track Booking'
                  )}
                </button>
                <button
                  onClick={handleSkipPassword}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 py-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Thank you for choosing TransRentals. We&apos;ll contact you shortly to confirm your {vehicle.name} booking.
              </p>
              <button
                onClick={onClose}
                className="bg-purple-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {(isLoggedIn ? ['details', 'confirm'] : ['details', 'contact', 'confirm']).map((s, idx, arr) => (
                  <React.Fragment key={s}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        step === s
                          ? 'bg-purple-900 text-white'
                          : arr.indexOf(step) > idx
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {arr.indexOf(step) > idx ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < arr.length - 1 && (
                      <div
                        className={`w-12 h-1 rounded-full ${
                          arr.indexOf(step) > idx
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Booking Details */}
              {step === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Booking Details</h3>
                    <p className="text-gray-500 text-sm">Select your occasion and schedule</p>
                  </div>

                  {/* Booking Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Occasion</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {BOOKING_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleBookingTypeSelect(type.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            formData.bookingType === type.value
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-gray-200 hover:border-purple-300 text-gray-700'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{type.icon}</span>
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pickup Location *
                    </label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="Enter city or address"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>

                  {/* Pickup Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Pincode</label>
                    <input
                      type="text"
                      name="pickupPincode"
                      value={formData.pickupPincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 583201"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Destination (Optional)
                    </label>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="Enter destination if known"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Drop Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drop Pincode (Optional)</label>
                    <input
                      type="text"
                      name="dropPincode"
                      value={formData.dropPincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 560001"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Trip type + Duty package */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                      <select
                        name="tripType"
                        value={formData.tripType}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      >
                        <option value="local">Local</option>
                        <option value="outstation">Outstation</option>
                        <option value="airport">Airport</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duty Package</label>
                      <select
                        name="packageType"
                        value={formData.packageType}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      >
                        {PACKAGE_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estimated Total KM */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Total KM (Optional)</label>
                    <input
                      type="number"
                      name="estimatedKm"
                      value={formData.estimatedKm}
                      onChange={handleInputChange}
                      placeholder="e.g. 250"
                      min={0}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Pickup Date *
                      </label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        min={today}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Pickup Time *
                      </label>
                      <input
                        type="time"
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Return Date & Time (Optional) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleInputChange}
                        min={formData.pickupDate || today}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Time (Optional)
                      </label>
                      <input
                        type="time"
                        name="returnTime"
                        value={formData.returnTime}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                  </div>

                  {/* Add-ons: decoration + driver dress code */}
                  <div className="space-y-3 rounded-xl bg-purple-50/50 border border-purple-100 p-4">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Decoration required?</span>
                      <input
                        type="checkbox"
                        checked={formData.needDecoration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, needDecoration: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    {formData.needDecoration && (
                      <input
                        type="text"
                        name="decorationType"
                        value={formData.decorationType}
                        onChange={handleInputChange}
                        placeholder="Decoration details (flowers, ribbon, preferred color...)"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    )}
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Driver dress code required?</span>
                      <input
                        type="checkbox"
                        checked={formData.needDressCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, needDressCode: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Info */}
              {step === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h3>
                    <p className="text-gray-500 text-sm">We&apos;ll use this to confirm your booking</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Requests (Optional)
                    </label>
                    <textarea
                      name="additionalRequests"
                      value={formData.additionalRequests}
                      onChange={handleInputChange}
                      placeholder="Any special requests or requirements..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 'confirm' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Your Booking</h3>
                    <p className="text-gray-500 text-sm">Please review your details before submitting</p>
                  </div>

                  {/* Logged in indicator */}
                  {isLoggedIn && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Logged in as <strong>{customer?.email}</strong>
                      </span>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-semibold text-gray-900">{vehicle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occasion</span>
                      <span className="font-semibold text-gray-900 capitalize">{formData.bookingType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pickup</span>
                      <span className="font-semibold text-gray-900">{formData.pickupLocation}</span>
                    </div>
                    {formData.destination && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destination</span>
                        <span className="font-semibold text-gray-900">{formData.destination}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(formData.pickupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        at {formData.pickupTime}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name</span>
                        <span className="font-semibold text-gray-900">{formData.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-semibold text-gray-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-semibold text-gray-900">+91 {formData.phone}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> Final pricing will be confirmed by our team based on your specific requirements.
                      Base price starts at ₹{vehicle.basePrice.toLocaleString()}/day.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                {step !== 'details' ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step === 'confirm' ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep(step)}
                    className="bg-purple-900 hover:bg-purple-800 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LuxuryBookingModal;
