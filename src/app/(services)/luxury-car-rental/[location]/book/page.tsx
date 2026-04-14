'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { motion } from 'framer-motion';
import {
  MapPin,
  Car,
  User,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Crown,
  Users,
  Navigation,
  Plane,
  Sparkles,
  Gift,
  Clock,
  Send,
  Lock,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import {
  LUXURY_OCCASIONS,
  getLuxuryCarCategory,
  getLuxuryLocalPackage,
  LUXURY_CAR_CATEGORIES,
} from '@/lib/luxury-pricing';

// Specific car models for each category
const CAR_MODELS: Record<string, { name: string; image?: string }[]> = {
  'luxury-sedan': [
    { name: 'Mercedes E-Class' },
    { name: 'BMW 5 Series' },
    { name: 'Audi A6' },
    { name: 'Jaguar XF' },
  ],
  'luxury-sedan-premium': [
    { name: 'Mercedes S-Class' },
    { name: 'BMW 7 Series' },
    { name: 'Audi A8' },
    { name: 'Lexus LS' },
  ],
  'luxury-suv': [
    { name: 'Mercedes GLE' },
    { name: 'BMW X5' },
    { name: 'Audi Q7' },
    { name: 'Volvo XC90' },
  ],
  'luxury-suv-premium': [
    { name: 'Range Rover Vogue' },
    { name: 'Mercedes GLS' },
    { name: 'BMW X7' },
    { name: 'Lexus LX' },
  ],
  'super-luxury': [
    { name: 'Rolls Royce Ghost' },
    { name: 'Bentley Flying Spur' },
    { name: 'Mercedes Maybach S-Class' },
  ],
  'convertible': [
    { name: 'Mercedes AMG GT Roadster' },
    { name: 'BMW Z4' },
    { name: 'Porsche 911 Cabriolet' },
  ],
  'limousine': [
    { name: 'Lincoln Town Car Limo' },
    { name: 'Mercedes Pullman' },
    { name: 'Cadillac Escalade Limo' },
  ],
  'vintage': [
    { name: 'Rolls Royce Silver Cloud' },
    { name: 'Mercedes 300SL' },
    { name: 'Jaguar E-Type' },
    { name: 'Chevrolet Impala' },
  ],
};

function LuxuryBookingContent({ location }: { location: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { customer: localCustomer, isAuthenticated: isLocalAuth } = useCustomerAuth();

  // Get booking details from URL params
  const tripType = searchParams.get('tripType') || 'local';
  const carCategory = searchParams.get('carCategory') || 'luxury-sedan';
  const carName = searchParams.get('carName') || 'Luxury Sedan';
  const pickupCity = searchParams.get('pickupCity') || location;
  const dropCity = searchParams.get('dropCity') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnDate = searchParams.get('returnDate') || '';
  const localPackage = searchParams.get('package') || '8hr-80km';
  const mode = searchParams.get('mode') || 'round-trip';
  const airportMode = searchParams.get('airportMode') || 'pickup';

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [needDecoration, setNeedDecoration] = useState(false);
  const [decorationType, setDecorationType] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState('');

  // Password flow state
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pendingRequestData, setPendingRequestData] = useState<any>(null);

  // B2B state
  const [isB2B, setIsB2B] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState<'personal' | 'company'>('personal');
  const [numberOfVehicles, setNumberOfVehicles] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [b2bCustomerId, setB2bCustomerId] = useState<string | null>(null);

  // Customer is logged in via next-auth (admin/manager) OR localStorage (regular/B2B customer)
  const isNextAuthLoggedIn = status === 'authenticated' && session?.user?.role === 'customer';
  const isCustomerLoggedIn = isNextAuthLoggedIn || isLocalAuth;

  // Auto-fill from next-auth session
  useEffect(() => {
    if (isNextAuthLoggedIn && session?.user) {
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
      setCustomerPhone((session.user as any).phone || '');
    }
  }, [isNextAuthLoggedIn, session]);

  // Auto-fill from localStorage customer (regular + B2B customers)
  useEffect(() => {
    if (isLocalAuth && localCustomer) {
      setCustomerName(prev => prev || localCustomer.name || '');
      setCustomerEmail(prev => prev || localCustomer.email || '');
      setCustomerPhone(prev => prev || localCustomer.phone || '');
      setB2bCustomerId(String(localCustomer.id));
      // Check B2B status
      const params = new URLSearchParams();
      if (localCustomer.id) params.set('customer_id', String(localCustomer.id));
      if (localCustomer.email) params.set('email', localCustomer.email);
      fetch(`/api/customer/b2b-status?${params.toString()}`)
        .then(res => res.json())
        .then(data => { if (data.isB2B) setIsB2B(true); })
        .catch(() => {});
    }
  }, [isLocalAuth, localCustomer]);

  const car = getLuxuryCarCategory(carCategory);
  const pkg = tripType === 'local' ? getLuxuryLocalPackage(localPackage) : null;
  const availableModels = CAR_MODELS[carCategory] || CAR_MODELS['luxury-sedan'];

  // Build quote request data
  const buildQuoteRequestData = () => {
    let tripDays = 1;
    if (returnDate && pickupDate) {
      const diff = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
      tripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      customerName,
      customerPhone,
      customerEmail,
      tripType,
      occasion: occasion || null,
      vehicle_category: carCategory,
      vehicleCategoryName: carName,
      passengers: car?.seats || 4,
      specificModel: selectedModel || null,
      pickupCity,
      pickupAddress: pickupAddress || null,
      dropCity: dropCity || null,
      dropAddress: dropAddress || null,
      pickupDate,
      pickupTime,
      returnDate: returnDate || null,
      tripDays,
      tripHours: pkg?.hours || null,
      packageType: tripType === 'local' ? localPackage : null,
      requirements: specialRequests || null,
      needChauffeur: true,
      needDecoration,
      decorationType: needDecoration ? decorationType : null,
      // B2B fields
      ...(isB2B && bookingPurpose === 'company' && {
        is_b2b: true,
        booking_purpose: 'company',
        number_of_vehicles: parseInt(numberOfVehicles) || 1,
        number_of_persons: parseInt(numberOfPersons) || 1,
        b2b_customer_id: b2bCustomerId,
      }),
    };
  };

  // Submit as B2B booking (when Company purpose selected)
  const submitB2BBooking = async () => {
    if (!b2bCustomerId) {
      alert('B2B customer ID not found. Please login again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const b2bData = {
        customerId: b2bCustomerId,
        serviceType: 'luxury',
        vehiclesRequired: parseInt(numberOfVehicles) || 1,
        passengerCount: parseInt(numberOfPersons) || undefined,
        vehicleCategory: carName,
        pickupLocation: `${pickupCity}${pickupAddress ? ', ' + pickupAddress : ''}`,
        dropLocation: dropCity || undefined,
        tripType: tripType === 'local' ? 'HOURLY' : tripType === 'airport' ? 'ONE_WAY' : 'ONE_WAY',
        scheduledDate: pickupDate,
        scheduledTime: pickupTime,
        returnDate: returnDate || undefined,
        specialNotes: `Luxury Car: ${carName}${selectedModel ? ' - ' + selectedModel : ''}${occasion ? ' | Occasion: ' + occasion : ''}${specialRequests ? ' | ' + specialRequests : ''}`,
      };
      const res = await fetch('/api/b2b/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b2bData),
      });
      const data = await res.json();
      if (data.status === 'success') {
        router.push(`/customer/b2b-bookings/${data.booking.id}?customer_id=${b2bCustomerId}`);
      } else {
        alert(data.error || 'Failed to create B2B booking');
      }
    } catch (error) {
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit quote request (final step) - for personal bookings
  const submitQuoteRequest = async (requestData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/luxury-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
        setRequestNumber(result.quoteRequest.requestNumber);
      } else {
        alert(result.error || 'Failed to submit request');
      }
    } catch (error) {
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !customerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      alert('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    if (!agreeTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    // B2B Company booking → goes to B2B module
    if (isB2B && bookingPurpose === 'company') {
      if (!numberOfVehicles || !numberOfPersons) {
        alert('Please enter number of vehicles and persons for company booking');
        return;
      }
      await submitB2BBooking();
      return;
    }

    const quoteRequestData = buildQuoteRequestData();

    // If customer is logged in, submit directly
    if (isCustomerLoggedIn) {
      await submitQuoteRequest(quoteRequestData);
      return;
    }

    // For non-logged-in users, check if customer exists
    setIsSubmitting(true);
    try {
      const checkResponse = await fetch('/api/customer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail }),
      });

      const checkResult = await checkResponse.json();

      // Store pending request data
      setPendingRequestData(quoteRequestData);

      if (checkResult.exists) {
        // Existing customer - ask for password
        setIsNewCustomer(false);
        setShowPasswordStep(true);
      } else {
        // New customer - ask to create password
        setIsNewCustomer(true);
        setShowPasswordStep(true);
      }
    } catch (error) {
      // If check fails, still allow submission without account
      await submitQuoteRequest(quoteRequestData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password step submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (isNewCustomer) {
      // Creating new account
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      setIsSubmitting(true);
      try {
        // Create customer account
        const createResponse = await fetch('/api/customer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            password,
          }),
        });

        const createResult = await createResponse.json();

        if (createResult.success) {
          // Submit the quote request with customer ID
          await submitQuoteRequest({
            ...pendingRequestData,
            customerId: createResult.customer.id,
          });
        } else {
          setPasswordError(createResult.error || 'Failed to create account');
        }
      } catch (error) {
        setPasswordError('Failed to create account. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Existing customer - verify password
      setIsSubmitting(true);
      try {
        const loginResponse = await fetch('/api/customer/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            password,
          }),
        });

        const loginResult = await loginResponse.json();

        if (loginResult.success) {
          // Submit the quote request with customer ID
          await submitQuoteRequest({
            ...pendingRequestData,
            customerId: loginResult.customer.id,
          });
        } else {
          setPasswordError(loginResult.error || 'Invalid password');
        }
      } catch (error) {
        setPasswordError('Failed to verify password. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Skip password step and submit without account
  const handleSkipPassword = async () => {
    await submitQuoteRequest(pendingRequestData);
  };

  const getTripTypeLabel = () => {
    switch (tripType) {
      case 'local':
        return 'Local Trip';
      case 'outstation':
        return mode === 'one-way' ? 'Outstation (One-way)' : 'Outstation (Round Trip)';
      case 'airport':
        return airportMode === 'pickup' ? 'Airport Pickup' : 'Airport Drop';
      default:
        return 'Trip';
    }
  };

  const getTripIcon = () => {
    switch (tripType) {
      case 'local':
        return Navigation;
      case 'outstation':
        return MapPin;
      case 'airport':
        return Plane;
      default:
        return Car;
    }
  };

  const TripIcon = getTripIcon();

  // Success Screen
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Your request number is:
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <span className="text-2xl font-bold text-amber-600">{requestNumber}</span>
          </div>
          <p className="text-gray-600 mb-6">
            Our premium vendors will review your requirements and send you personalized quotes within 24-48 hours.
          </p>
          <div className="space-y-3">
            <Link
              href="/customer/dashboard"
              className="block w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold py-3 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
              Track Your Booking
            </Link>
            <Link
              href={`/luxury-car-rental/${location}`}
              className="block w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all"
            >
              Back to Luxury Cars
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Password Step Screen (for non-logged-in users)
  if (showPasswordStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isNewCustomer ? 'Create Your Account' : 'Welcome Back!'}
            </h1>
            <p className="text-gray-600">
              {isNewCustomer
                ? 'Create a password to track your bookings on your dashboard'
                : 'Enter your password to manage your bookings'}
            </p>
          </div>

          {/* Customer Info Display */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{customerName}</div>
                <div className="text-sm text-gray-500">{customerEmail}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNewCustomer ? 'Create Password' : 'Enter Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isNewCustomer ? 'Create a strong password' : 'Enter your password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isNewCustomer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            )}

            {passwordError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                  {isNewCustomer ? 'Creating Account...' : 'Verifying...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {isNewCustomer ? 'Create Account & Submit' : 'Login & Submit'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipPassword}
              disabled={isSubmitting}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            >
              Skip for now (You can create account later)
            </button>
          </form>

          {!isNewCustomer && (
            <div className="mt-4 text-center">
              <Link href="/customer/forgot-password" className="text-amber-600 hover:underline text-sm">
                Forgot password?
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white py-8">
        <div className="container-custom">
          <Link
            href={`/luxury-car-rental/${location}`}
            className="inline-flex items-center gap-2 text-amber-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to selection
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-bold">Request a Luxury Quote</h1>
          </div>
          <p className="text-amber-200">Tell us your requirements and receive personalized quotes from premium vendors</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100"
              >
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <TripIcon className="w-5 h-5 text-amber-600" />
                  Your Trip Details
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{carName}</div>
                      <div className="text-sm text-gray-600">{car?.examples}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500">{getTripTypeLabel()}</div>
                    <div className="font-semibold text-gray-900">
                      {tripType === 'local' && pkg?.label}
                      {tripType === 'outstation' && `${pickupCity} → ${dropCity}`}
                      {tripType === 'airport' &&
                        (airportMode === 'pickup' ? 'Airport → City' : 'City → Airport')}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500">Pickup Date & Time</div>
                    <div className="font-semibold text-gray-900">
                      {pickupDate
                        ? new Date(pickupDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}{' '}
                      at {pickupTime}
                    </div>
                  </div>

                  {returnDate && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-500">Return Date</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(returnDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Luxury Features */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4 text-amber-600" />
                    {car?.seats} Seats
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Crown className="w-4 h-4 text-amber-600" />
                    Professional Chauffeur
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Shield className="w-4 h-4 text-amber-600" />
                    Premium Service
                  </span>
                </div>
              </motion.div>

              {/* Specific Car Model Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-amber-600" />
                  Preferred Car Model (Optional)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Select your preferred model or leave blank for any available vehicle in this category
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModels.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      onClick={() => setSelectedModel(selectedModel === model.name ? '' : model.name)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedModel === model.name
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <Car className={`w-8 h-8 mx-auto mb-2 ${selectedModel === model.name ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium block">{model.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Occasion Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  What&apos;s the Occasion?
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LUXURY_OCCASIONS.map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setOccasion(occasion === occ.id ? '' : occ.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        occasion === occ.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{occ.icon}</span>
                      <span className="text-sm font-medium">{occ.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Decoration Options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  Car Decoration
                </h2>

                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={needDecoration}
                    onChange={(e) => setNeedDecoration(e.target.checked)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-gray-700">I need car decoration</span>
                </label>

                {needDecoration && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'floral', name: 'Floral', icon: '💐' },
                      { id: 'ribbon', name: 'Ribbon', icon: '🎀' },
                      { id: 'premium', name: 'Premium', icon: '✨' },
                    ].map((dec) => (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => setDecorationType(dec.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          decorationType === dec.id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{dec.icon}</span>
                        <span className="text-sm font-medium">{dec.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* B2B Booking Purpose */}
              {isB2B && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100"
                >
                  <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    Booking Purpose
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Is this booking for personal use or on behalf of your company?</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setBookingPurpose('personal')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        bookingPurpose === 'personal'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <User className={`w-7 h-7 mx-auto mb-2 ${bookingPurpose === 'personal' ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold text-sm ${bookingPurpose === 'personal' ? 'text-teal-700' : 'text-gray-700'}`}>Personal</span>
                      <p className="text-xs text-gray-500 mt-0.5">For personal use</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingPurpose('company')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        bookingPurpose === 'company'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <Building2 className={`w-7 h-7 mx-auto mb-2 ${bookingPurpose === 'company' ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold text-sm ${bookingPurpose === 'company' ? 'text-teal-700' : 'text-gray-700'}`}>Company</span>
                      <p className="text-xs text-gray-500 mt-0.5">Corporate B2B booking</p>
                    </button>
                  </div>

                  {bookingPurpose === 'company' && (
                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-200 space-y-3">
                      <p className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Corporate Booking Details
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">No. of Vehicles *</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={numberOfVehicles}
                            onChange={(e) => setNumberOfVehicles(e.target.value)}
                            placeholder="e.g. 5"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">No. of Persons *</label>
                          <input
                            type="number"
                            min="1"
                            value={numberOfPersons}
                            onChange={(e) => setNumberOfPersons(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-teal-600">This booking will be counted as a B2B corporate booking. Post-trip billing applies.</p>
                    </div>
                  )}

                  {bookingPurpose === 'personal' && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-amber-600 text-sm">⚠️</span>
                      <p className="text-xs text-amber-700">
                        Personal bookings require advance payment. Select <strong>Company</strong> above for post-trip B2B billing.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Pickup/Drop Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="font-semibold text-lg mb-4">Pickup & Drop Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-amber-500" />
                      <textarea
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter complete pickup address with landmark"
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {(tripType === 'outstation' || tripType === 'airport') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drop Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                        <textarea
                          value={dropAddress}
                          onChange={(e) => setDropAddress(e.target.value)}
                          placeholder="Enter drop address"
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Customer Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="font-semibold text-lg mb-4">
                  {isCustomerLoggedIn ? 'Your Account Details' : 'Your Details'}
                </h2>

                {isCustomerLoggedIn ? (
                  // Show logged-in user details (read-only)
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{customerName}</div>
                        <div className="text-sm text-gray-600">Logged in</div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {customerEmail}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {customerPhone || 'Not provided'}
                      </div>
                    </div>

                    {/* Special Requirements for logged-in users */}
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requirements (Optional)
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requirements or preferences for your luxury experience..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  // Show form for non-logged-in users
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 10) setCustomerPhone(val);
                          }}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) &&
                              !(e.ctrlKey || e.metaKey)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          inputMode="numeric"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requirements (Optional)
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requirements or preferences for your luxury experience..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Terms & Submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-amber-600 hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-amber-600 hover:underline">
                      Privacy Policy
                    </Link>
                    . I understand that vendors will send me quotes based on my requirements.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-400 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Quote Request
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </div>

          {/* Right - Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-lg">How It Works</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Submit Your Request</div>
                    <div className="text-sm text-gray-500">Tell us your requirements</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Receive Quotes</div>
                    <div className="text-sm text-gray-500">Get personalized quotes within 24-48 hours</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Compare & Choose</div>
                    <div className="text-sm text-gray-500">Select the best quote for you</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Confirm Booking</div>
                    <div className="text-sm text-gray-500">Pay advance and enjoy your ride</div>
                  </div>
                </div>
              </div>

              {/* Premium Inclusions */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  What&apos;s Typically Included
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Fuel charges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Professional chauffeur
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Premium refreshments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Meet & greet service
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="mt-6 pt-6 border-t bg-gradient-to-r from-amber-50 to-yellow-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <p className="text-sm text-gray-600 mb-1">Need Help?</p>
                <a
                  href="tel:+919737965551"
                  className="text-amber-700 font-bold text-lg hover:underline"
                >
                  +91 97379 65551
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LuxuryBookingPage({
  params,
}: {
  params: { location: string };
}) {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-amber-900">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-amber-200">Loading luxury experience...</p>
            </div>
          </div>
        }
      >
        <LuxuryBookingContent location={params.location} />
      </Suspense>
    </SessionProvider>
  );
}
