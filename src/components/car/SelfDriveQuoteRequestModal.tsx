'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Car,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  Send,
  CheckCircle,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronRight,
  Settings2,
  Fuel,
  Users,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/hooks/useCustomer';

type AuthMode = 'check' | 'login' | 'register';

interface SelfDriveQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  carDetails: {
    id: string;
    name: string;
    brandName: string;
    sideImage?: string;
    categoryName?: string;
    categoryId?: string;
    seatingCapacity?: number;
    transmission?: string;
    fuelType?: string;
  } | null;
  location: {
    id: string;
    name: string;
    slug: string;
  };
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  rentalDays: number;
}

export function SelfDriveQuoteRequestModal({
  isOpen,
  onClose,
  carDetails,
  location,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  rentalDays,
}: SelfDriveQuoteRequestModalProps) {
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuth();

  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [password, setPassword] = useState('');
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('check');
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // B2B state
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState<'personal' | 'company' | null>(null);
  const [numberOfVehicles, setNumberOfVehicles] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState('');

  // Check if user is already logged in on mount
  React.useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        const storedCustomer = localStorage.getItem('customer');
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (storedCustomer && token) {
          try {
            const parsedCustomer = JSON.parse(storedCustomer);
            setExistingCustomer(parsedCustomer);
            setIsLoggedIn(true);
            setCustomerName(parsedCustomer.name || '');
            setCustomerEmail(parsedCustomer.email || '');
            setCustomerPhone(parsedCustomer.phone || '');

            // Check B2B status
            const params = new URLSearchParams();
            if (parsedCustomer.id) params.set('customer_id', String(parsedCustomer.id));
            if (parsedCustomer.email) params.set('email', parsedCustomer.email);
            if (params.toString()) {
              fetch(`/api/customer/b2b-status?${params.toString()}`)
                .then(res => res.json())
                .then(data => { if (data.isB2B) setIsB2BCustomer(true); })
                .catch(() => {});
            }
          } catch (e) {
            console.error('Failed to parse stored customer:', e);
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      }
    }
  }, [isOpen]);

  // Update form when customer auth changes
  React.useEffect(() => {
    if (customer) {
      setCustomerName(customer.name || '');
      setCustomerEmail(customer.email || '');
      setCustomerPhone(customer.phone || '');
    }
  }, [customer]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setError(null);
      setCustomerNotes('');
      setIsDeliveryRequested(false);
      setPickupAddress('');
      setPassword('');
      setAuthMode('check');
      setShowPassword(false);
      setIsB2BCustomer(false);
      setBookingPurpose(null);
      setNumberOfVehicles('');
      setNumberOfPersons('');
    }
  }, [isOpen]);

  // Submit quote request
  const submitQuoteRequest = async (customerId?: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        // Customer details
        customerName,
        customerEmail,
        customerPhone,
        customerId: customerId || existingCustomer?.id || customer?.id || null,

        // Vehicle preference
        vehicleModelId: carDetails?.id,
        vehicleModelName: carDetails?.name,
        vehicleBrand: carDetails?.brandName,
        vehicleCategory: carDetails?.categoryId,
        vehicleCategoryName: carDetails?.categoryName,
        transmission: carDetails?.transmission,
        fuelType: carDetails?.fuelType,
        minSeats: carDetails?.seatingCapacity,

        // Location
        locationId: location.id,
        locationName: location.name,
        pickupAddress: isDeliveryRequested ? pickupAddress : null,

        // Dates
        pickupDate,
        pickupTime,
        dropDate,
        dropTime,

        // Requirements
        isDeliveryRequested,
        customerNotes: customerNotes.trim() || null,

        // B2B fields
        ...(bookingPurpose === 'company' && {
          isB2B: true,
          numberOfVehicles: numberOfVehicles ? parseInt(numberOfVehicles) : undefined,
          numberOfPersons: numberOfPersons ? parseInt(numberOfPersons) : undefined,
        }),
      };

      console.log('Sending self-drive quote request:', requestData);

      const response = await fetch('/api/self-drive-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('Self-drive quote request response:', data);

      if (data.success) {
        // B2B booking - redirect to B2B booking page
        if (data.isB2B && data.booking) {
          setRequestNumber(data.booking.bookingNumber || '');
          setRequestId(data.booking.id || '');
          setSubmitted(true);
          return;
        }
        setRequestNumber(data.quoteRequest?.requestNumber || data.request?.requestNumber || '');
        setRequestId(data.quoteRequest?.id || data.request?.id || '');
        setSubmitted(true);
      } else {
        console.error('Quote request error:', data);
        setError(data.error || data.message || data.details || 'Failed to submit quote request');
      }
    } catch (err: any) {
      console.error('Quote request exception:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if customer exists (for guest flow)
  const checkCustomerAndProceed = async () => {
    if (!customerName || !customerPhone || !customerEmail) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-exists',
          phone: customerPhone,
          email: customerEmail,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.exists) {
        setExistingCustomer(data.customers);
        setAuthMode('login');
      } else {
        setAuthMode('register');
      }
    } catch (err) {
      setAuthMode('register');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login existing customer
  const handleLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: existingCustomer?.email || customerEmail,
          password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        setCustomerName(data.customers.name);
        setCustomerEmail(data.customers.email);
        setCustomerPhone(data.customers.phone);
        setIsLoggedIn(true);

        // Check B2B status after login
        try {
          const b2bRes = await fetch(`/api/customer/b2b-status?customer_id=${data.customers.id}`);
          const b2bData = await b2bRes.json();
          if (b2bData.isB2B) setIsB2BCustomer(true);
        } catch {}

        await submitQuoteRequest(data.customers.id);
      } else {
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register new customer and submit quote
  const handleRegister = async () => {
    if (!customerName || !customerPhone || !customerEmail || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setIsLoggedIn(true);

        await submitQuoteRequest(data.customers.id);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submit for logged in users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      await submitQuoteRequest();
    } else {
      await checkCustomerAndProceed();
    }
  };

  const handleViewQuotes = () => {
    onClose();
    if (bookingPurpose === 'company') {
      router.push(`/customer/b2b-bookings/${requestId}`);
    } else {
      router.push(`/customer/self-drive-quotes/${requestId}`);
    }
  };

  if (!isOpen || !carDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Request Quote</h2>
                <p className="text-blue-100 text-sm">Get best prices from vendors</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {bookingPurpose === 'company' ? 'B2B Booking Created!' : 'Quote Request Sent!'}
            </h3>
            <p className="text-gray-600 mb-2">
              Your {bookingPurpose === 'company' ? 'booking' : 'request'} number is <span className="font-mono font-bold text-blue-600">#{requestNumber}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {bookingPurpose === 'company'
                ? 'Vendors will assign vehicles and send quotes. You will be notified when your quote is ready for approval.'
                : 'Vendors will review your request and send quotes within 24-48 hours. You\'ll receive notifications when quotes are available.'}
            </p>

            <div className={`${bookingPurpose === 'company' ? 'bg-teal-50' : 'bg-blue-50'} rounded-xl p-4 mb-6 text-left`}>
              <h4 className={`font-semibold ${bookingPurpose === 'company' ? 'text-teal-800' : 'text-blue-800'} mb-2`}>What's next?</h4>
              <ul className={`text-sm ${bookingPurpose === 'company' ? 'text-teal-700' : 'text-blue-700'} space-y-1`}>
                {bookingPurpose === 'company' ? (
                  <>
                    <li>1. Vendors will assign vehicles with pricing</li>
                    <li>2. Our team will prepare a consolidated quote</li>
                    <li>3. Review and accept the quote to confirm</li>
                    <li>4. No advance payment — corporate post-paid billing</li>
                  </>
                ) : (
                  <>
                    <li>1. Vendors will send their quotes with pricing</li>
                    <li>2. Compare quotes and select the best one</li>
                    <li>3. Pay advance to confirm your booking</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Continue Browsing
              </Button>
              <Button
                onClick={handleViewQuotes}
                className={`flex-1 ${bookingPurpose === 'company' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {bookingPurpose === 'company' ? 'View B2B Booking' : 'View My Requests'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Car Summary */}
            <div className="flex gap-4 p-3 bg-gray-50 rounded-xl mb-4">
              {carDetails.sideImage ? (
                <Image
                  src={carDetails.sideImage}
                  alt={carDetails.name}
                  width={100}
                  height={70}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">{carDetails.brandName}</p>
                <h3 className="font-bold text-gray-900">{carDetails.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {carDetails.categoryName && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{carDetails.categoryName}</span>
                  )}
                  {carDetails.transmission && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Settings2 className="w-3 h-3" />
                      {carDetails.transmission}
                    </span>
                  )}
                  {carDetails.seatingCapacity && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {carDetails.seatingCapacity} seats
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="font-medium text-gray-900">{location.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Duration
                </div>
                <p className="font-medium text-gray-900">{rentalDays} Day{rentalDays > 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  Pickup
                </div>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {pickupTime && ` ${pickupTime}`}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  Drop
                </div>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {dropTime && ` ${dropTime}`}
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* LOGGED IN USER - Show simplified form */}
            {isLoggedIn ? (
              <form onSubmit={handleSubmit}>
                {/* Logged in user info */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-600">{customerPhone} • {customerEmail}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Booking Purpose Toggle - Personal or Company */}
                {isB2BCustomer && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
                    <p className="text-sm font-semibold text-gray-800">This booking is for:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button"
                        onClick={() => setBookingPurpose('personal')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          bookingPurpose === 'personal'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <User className="w-4 h-4" /> Personal
                      </button>
                      <button type="button"
                        onClick={() => setBookingPurpose('company')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          bookingPurpose === 'company'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Users className="w-4 h-4" /> Company
                      </button>
                    </div>

                    {bookingPurpose === 'company' && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Number of Vehicles *</label>
                            <input
                              type="number"
                              value={numberOfVehicles}
                              onChange={(e) => setNumberOfVehicles(e.target.value)}
                              placeholder="e.g. 10"
                              min="1"
                              max="500"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Number of Persons</label>
                            <input
                              type="number"
                              value={numberOfPersons}
                              onChange={(e) => setNumberOfPersons(e.target.value)}
                              placeholder="e.g. 50"
                              min="1"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-teal-600">No advance payment required. Post-trip corporate billing.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirements */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Requirements</h4>

                  {/* Delivery Option */}
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="delivery"
                      checked={isDeliveryRequested}
                      onChange={(e) => setIsDeliveryRequested(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="delivery" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <Truck className="w-4 h-4" />
                      Request home delivery
                    </label>
                  </div>

                  {isDeliveryRequested && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Delivery Address
                      </label>
                      <textarea
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter your delivery address..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any specific requirements or questions..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 font-semibold ${bookingPurpose === 'company' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {bookingPurpose === 'company' ? 'Submit B2B Booking Request' : 'Request Quotes'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  {bookingPurpose === 'company'
                    ? 'B2B booking — no advance payment, corporate post-paid billing'
                    : 'By submitting, you agree to receive quotes from multiple vendors'}
                </p>
              </form>
            ) : (
              /* GUEST USER - Show auth flow */
              <div className="space-y-4">
                {/* Auth Mode: Check - Enter details */}
                {authMode === 'check' && (
                  <>
                    <div className="text-center mb-2">
                      <h4 className="font-semibold text-gray-900">Enter your details</h4>
                      <p className="text-sm text-gray-500">We'll create an account to track your quotes</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10 digit mobile number"
                        pattern="[0-9]{10}"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Booking Purpose Toggle - Guest */}
                    {isB2BCustomer && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-gray-800">This booking is for:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button"
                            onClick={() => setBookingPurpose('personal')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              bookingPurpose === 'personal'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <User className="w-4 h-4" /> Personal
                          </button>
                          <button type="button"
                            onClick={() => setBookingPurpose('company')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              bookingPurpose === 'company'
                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Users className="w-4 h-4" /> Company
                          </button>
                        </div>

                        {bookingPurpose === 'company' && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-3 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Number of Vehicles *</label>
                                <input
                                  type="number"
                                  value={numberOfVehicles}
                                  onChange={(e) => setNumberOfVehicles(e.target.value)}
                                  placeholder="e.g. 10"
                                  min="1"
                                  max="500"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Number of Persons</label>
                                <input
                                  type="number"
                                  value={numberOfPersons}
                                  onChange={(e) => setNumberOfPersons(e.target.value)}
                                  placeholder="e.g. 50"
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-teal-600">No advance payment required. Post-trip corporate billing.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requirements */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900">Requirements</h4>

                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          id="delivery-guest"
                          checked={isDeliveryRequested}
                          onChange={(e) => setIsDeliveryRequested(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="delivery-guest" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <Truck className="w-4 h-4" />
                          Request home delivery
                        </label>
                      </div>

                      {isDeliveryRequested && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Delivery Address
                          </label>
                          <textarea
                            value={pickupAddress}
                            onChange={(e) => setPickupAddress(e.target.value)}
                            placeholder="Enter your delivery address..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          <FileText className="w-4 h-4 inline mr-1" />
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Any specific requirements or questions..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={checkCustomerAndProceed}
                      disabled={isSubmitting || !customerName || !customerPhone || !customerEmail}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Checking...
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Auth Mode: Login - Existing customer */}
                {authMode === 'login' && (
                  <>
                    <div className="text-center mb-2">
                      <h4 className="font-semibold text-gray-900">Welcome back!</h4>
                      <p className="text-sm text-gray-500">Enter your password to continue</p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{existingCustomer?.name || customerName}</p>
                          <p className="text-sm text-gray-600">{existingCustomer?.email || customerEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Enter your password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleLogin}
                      disabled={isSubmitting || !password}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Login & Request Quote
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('check');
                        setPassword('');
                        setError(null);
                      }}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to edit details
                    </button>
                  </>
                )}

                {/* Auth Mode: Register - New customer */}
                {authMode === 'register' && (
                  <>
                    <div className="text-center mb-2">
                      <h4 className="font-semibold text-gray-900">Create a password</h4>
                      <p className="text-sm text-gray-500">Set a password to track your quotes</p>
                    </div>

                    <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customerName}</p>
                          <p className="text-sm text-gray-600">{customerPhone} • {customerEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Create a password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          minLength={6}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">You'll use this password to login to your account</p>
                    </div>

                    <Button
                      onClick={handleRegister}
                      disabled={isSubmitting || !password || password.length < 6}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Register & Request Quote
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('check');
                        setPassword('');
                        setError(null);
                      }}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to edit details
                    </button>
                  </>
                )}

                <p className="text-xs text-gray-500 text-center mt-2">
                  By submitting, you agree to receive quotes from multiple vendors
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
