'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Bike,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  HardHat,
  FileText,
  Send,
  CheckCircle,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/hooks/useCustomer';

type AuthMode = 'check' | 'login' | 'register';

interface BikeQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikeDetails: {
    id: string;
    name: string;
    brandName: string;
    sideImage?: string;
    categoryName?: string;
    categoryId?: string;
    engineCC?: number;
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

export function BikeQuoteRequestModal({
  isOpen,
  onClose,
  bikeDetails,
  location,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  rentalDays,
}: BikeQuoteRequestModalProps) {
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuth();

  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [password, setPassword] = useState('');
  const [helmetsRequired, setHelmetsRequired] = useState(1);
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
  const [isB2B, setIsB2B] = useState(false);

  // Check if user is already logged in on mount
  React.useEffect(() => {
    if (isOpen) {
      // Check localStorage for existing auth
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
                .then(data => { if (data.isB2B) setIsB2B(true); })
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
      setHelmetsRequired(1);
      setPassword('');
      setAuthMode('check');
      setShowPassword(false);
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
        vehicleModelId: bikeDetails?.id,
        vehicleModelName: bikeDetails?.name,
        vehicleBrand: bikeDetails?.brandName,
        vehicleCategory: bikeDetails?.categoryId,
        vehicleCategoryName: bikeDetails?.categoryName,

        // Location
        locationId: location.id,
        locationName: location.name,

        // Dates
        pickupDate,
        pickupTime,
        dropDate,
        dropTime,

        // Requirements
        helmetsRequired,
        customerNotes: customerNotes.trim() || null,
      };

      console.log('Sending quote request:', requestData);

      const response = await fetch('/api/bike-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('Quote request response:', data);

      if (data.success) {
        // API returns 'quoteRequest' not 'request'
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
        // Customer EXISTS - show login password screen
        setExistingCustomer(data.customers);
        setAuthMode('login');
      } else {
        // Customer NOT exists - show create password screen
        setAuthMode('register');
      }
    } catch (err) {
      // Fallback: assume new customer
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
        // Store auth data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        // Update form data with customer info
        setCustomerName(data.customers.name);
        setCustomerEmail(data.customers.email);
        setCustomerPhone(data.customers.phone);
        setIsLoggedIn(true);

        // Submit quote request
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
        // Store auth data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setIsLoggedIn(true);

        // Submit quote request
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
      // Already logged in - submit directly
      await submitQuoteRequest();
    } else {
      // Not logged in - go through auth flow
      await checkCustomerAndProceed();
    }
  };

  const handleViewQuotes = () => {
    onClose();
    router.push(`/customer/bike-quotes/${requestId}`);
  };

  if (!isOpen || !bikeDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Request Quote</h2>
                <p className="text-emerald-100 text-sm">Get best prices from vendors</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quote Request Sent!</h3>
            <p className="text-gray-600 mb-2">
              Your request number is <span className="font-mono font-bold text-emerald-600">#{requestNumber}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vendors will review your request and send quotes within 24-48 hours.
              You'll receive notifications when quotes are available.
            </p>

            <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-emerald-800 mb-2">What's next?</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>1. Vendors will send their quotes with pricing</li>
                <li>2. Compare quotes and select the best one</li>
                <li>3. Pay advance to confirm your booking</li>
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                View My Requests
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Bike Summary */}
            <div className="flex gap-4 p-3 bg-gray-50 rounded-xl mb-4">
              {bikeDetails.sideImage ? (
                <Image
                  src={bikeDetails.sideImage}
                  alt={bikeDetails.name}
                  width={80}
                  height={60}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Bike className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-xs text-emerald-600 font-medium">{bikeDetails.brandName}</p>
                <h3 className="font-bold text-gray-900">{bikeDetails.name}</h3>
                {bikeDetails.categoryName && (
                  <p className="text-xs text-gray-500">{bikeDetails.categoryName}</p>
                )}
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
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-600">{customerPhone} • {customerEmail}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* B2B Warning */}
                {isB2B && (
                  <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Advance Payment Required</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Bike Rental is <strong>not covered under your B2B agreement</strong>. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Requirements</h4>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      <HardHat className="w-4 h-4 inline mr-1" />
                      Helmets Required
                    </label>
                    <select
                      value={helmetsRequired}
                      onChange={(e) => setHelmetsRequired(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={1}>1 Helmet</option>
                      <option value={2}>2 Helmets</option>
                    </select>
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Request Quotes
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  By submitting, you agree to receive quotes from multiple vendors
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    {/* Requirements */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900">Requirements</h4>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          <HardHat className="w-4 h-4 inline mr-1" />
                          Helmets Required
                        </label>
                        <select
                          value={helmetsRequired}
                          onChange={(e) => setHelmetsRequired(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value={1}>1 Helmet</option>
                          <option value={2}>2 Helmets</option>
                        </select>
                      </div>

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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={checkCustomerAndProceed}
                      disabled={isSubmitting || !customerName || !customerPhone || !customerEmail}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
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

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
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
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
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

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
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
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
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
