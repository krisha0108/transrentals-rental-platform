'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Bike,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
}

interface BikeData {
  id: string;
  name: string;
  brandName: string;
  sideImage?: string;
  categoryName?: string;
  engineCC?: number;
  mileage?: string;
}

interface BookingDetails {
  bike: BikeData;
  vendor: VendorPrice | null;
  broadcastToAll: boolean;
  location: { id: string; name: string; slug: string };
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  rentalDays: number;
}

interface BikeBookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
}

type Step = 'confirm' | 'auth' | 'processing';
type AuthMode = 'check' | 'login' | 'register';

export function BikeBookingConfirmModal({
  isOpen,
  onClose,
  bookingDetails,
}: BikeBookingConfirmModalProps) {
  const router = useRouter();
  const [config, setConfig] = useState<{
    gst: number;
    platformFee: number;
    advancePercentage: number;
    securityDeposit: number;
  } | null>(null);

  const [step, setStep] = useState<Step>('confirm');
  const [authMode, setAuthMode] = useState<AuthMode>('check');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  // Fetch payment config
  useEffect(() => {
    if (isOpen) {
      // Use 'svc_1' (Bike Rental) corresponding to Prisma DB Service ID
      fetch('/api/payment-config?serviceId=svc_1')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setConfig(data.config);
          }
        })
        .catch(err => console.error('Failed to load payment config', err));
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setAuthMode('check');
      setError('');
      setFormData({ name: '', email: '', phone: '', password: '' });
      setExistingCustomer(null);

      // Check if user is already logged in
      if (typeof window !== 'undefined') {
        const storedCustomer = localStorage.getItem('customer');
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (storedCustomer && token) {
          try {
            const customer = JSON.parse(storedCustomer);
            setExistingCustomer(customer);
            setFormData(prev => ({
              ...prev,
              name: customer.name || '',
              email: customer.email || '',
              phone: customer.phone || '',
            }));
          } catch (e) {
            console.error('Failed to parse stored customer:', e);
          }
        }
      }
    }
  }, [isOpen]);

  if (!bookingDetails) return null;

  const { bike, vendor, broadcastToAll, location, pickupDate, pickupTime, dropDate, dropTime, rentalDays } = bookingDetails;

  // Calculations based on config or defaults
  const dailyRate = vendor?.dailyRate || 0;
  const baseTotal = dailyRate * rentalDays;

  const gstPercent = config?.gst ?? 18;
  const platformFee = config?.platformFee ?? 0;
  const advancePercent = config?.advancePercentage ?? 20;

  // 1. GST on Base Rental
  const gstAmount = Math.round(baseTotal * (gstPercent / 100));

  // 2. Subtotal (Base + GST)
  const subTotal = baseTotal + gstAmount;

  // 3. Platform Fee (Added on top)
  const totalTripCost = subTotal + platformFee;

  // 4. Advance Calculation (Percentage of Subtotal usually, or Total)
  // Logic: Advance is % of (Base + GST) + Full Platform Fee?
  // User said: "after advance payment vo achhe s summary dikhni chahiye"
  // Let's stick to: Advance % of (Base + GST). Platform fee is extra payable now.
  const advanceOnRental = Math.round(subTotal * (advancePercent / 100));
  const payableNow = advanceOnRental + platformFee;

  // 5. Payable at Counter (The rest of the rental cost)
  const payableAtCounter = subTotal - advanceOnRental;

  // Format helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Check if customer exists, then show appropriate password screen
  const checkCustomerAndProceed = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-exists',
          phone: formData.phone,
          email: formData.email,
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
      setIsLoading(false);
    }
  };

  // Login existing customer
  const handleLogin = async () => {
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: existingCustomer?.email || formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.token) {
        // Store auth data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        // Update form data with customer info
        setFormData(prev => ({
          ...prev,
          name: data.customers.name,
          email: data.customers.email,
          phone: data.customers.phone,
        }));

        // Proceed to create booking
        await createBooking(data.customers);
      } else {
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register new customer and create booking
  const handleRegister = async () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.token) {
        // Store auth data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        // Proceed to create booking
        await createBooking(data.customers);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create booking
  const createBooking = async (customer: any) => {
    setStep('processing');
    setIsLoading(true);
    setError('');

    try {
      const bookingData = {
        service_id: 5,
        service_name: 'Bike on Rent',
        bike_name: bike.name,
        bike_brand: bike.brandName,
        model_id: bike.id,
        vendor_id: vendor?.vendorId || null,
        vendor_fleet_id: vendor?.vendorFleetId || null,
        daily_rate: dailyRate,
        broadcast_to_all: broadcastToAll,
        location_name: location.name,
        location_slug: location.slug,
        journey_datetime: `${pickupDate}T${pickupTime}:00`,
        return_datetime: `${dropDate}T${dropTime}:00`,
        duration_days: rentalDays,
        // Add payment details
        payment_breakdown: {
          base_total: baseTotal,
          gst_amount: gstAmount,
          platform_fee: platformFee,
          advance_amount: advanceOnRental,
          payable_now: payableNow,
          payable_at_counter: payableAtCounter,
          advance_percentage: advancePercent
        }
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType: 'bike',
          customerInfo: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
          bookingData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store booking ID and ensure customer data is saved
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_booking_id', result.booking_id?.toString() || '');
          localStorage.setItem('last_booking_number', result.booking_number || '');

          // Ensure customer is saved with returned data (in case of any updates)
          if (result.customer) {
            const existingCustomer = localStorage.getItem('customer');
            const existingToken = localStorage.getItem('auth_token') || localStorage.getItem('token');

            // Merge returned customer data with existing
            const customerToStore = {
              ...customer,
              ...result.customer,
            };
            localStorage.setItem('customer', JSON.stringify(customerToStore));

            // Generate token if not exists
            if (!existingToken) {
              const sessionToken = `tr_${result.customer_id}_${Date.now()}`;
              localStorage.setItem('auth_token', sessionToken);
              localStorage.setItem('token', sessionToken);
            }
          }
        }

        // Redirect to booking details page
        router.push(result.redirect_to || '/customer/bike-bookings');
        onClose();
      } else {
        setError(result.message || 'Failed to create booking');
        setStep('auth');
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      setStep('auth');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm button click
  const handleConfirmBooking = () => {
    // If already logged in, create booking directly
    if (existingCustomer && localStorage.getItem('auth_token')) {
      createBooking(existingCustomer);
    } else {
      // Move to auth step
      setStep('auth');
    }
  };

  // Render booking summary
  const renderBookingSummary = () => (
    <div className="space-y-4">
      {/* Bike Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center overflow-hidden">
          {bike.sideImage ? (
            <Image src={bike.sideImage} alt={bike.name} width={80} height={80} className="object-cover" />
          ) : (
            <Bike className="w-10 h-10 text-emerald-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-emerald-600 font-medium uppercase">{bike.brandName}</p>
          <h3 className="font-bold text-gray-900 text-lg">{bike.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {bike.engineCC && <span>{bike.engineCC}cc</span>}
            {bike.mileage && <span>• {bike.mileage}</span>}
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      {vendor && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="font-bold text-blue-600">{vendor.vendorName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{vendor.vendorName}</span>
              {vendor.isVerified && <Shield className="w-4 h-4 text-blue-500" />}
            </div>
            <p className="text-sm text-gray-500">Selected Vendor</p>
          </div>
        </div>
      )}

      {broadcastToAll && (
        <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
          All available vendors will be notified. First to confirm wins!
        </div>
      )}

      {/* Trip Details */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="p-3 bg-gray-50 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Pickup:</span>
          <span className="text-sm font-medium">{formatDate(pickupDate)} at {formatTime(pickupTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Drop:</span>
          <span className="text-sm font-medium">{formatDate(dropDate)} at {formatTime(dropTime)}</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Price Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Daily Rate × {rentalDays} days</span>
            <span className="font-medium">₹{baseTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Total Trip Cost</span>
            <span className="font-bold text-gray-900">₹{totalTripCost.toLocaleString()}</span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-lg mt-2 space-y-2 border border-emerald-100">
            <div className="flex justify-between text-emerald-700">
              <span className="font-medium">Advance Payment ({advancePercent}%)</span>
              <span>₹{advanceOnRental.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-800 pt-2 border-t border-emerald-200">
              <span className="font-bold">Payable Now</span>
              <span className="font-bold text-lg">₹{payableNow.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between text-gray-500 text-xs px-2">
            <span>Pay at Counter</span>
            <span>₹{payableAtCounter.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Security Deposit Note */}
      <p className="text-xs text-gray-500 text-center">
        * Refundable security deposit of ₹{config?.securityDeposit ?? (vendor?.deposit || 2000)} payable at pickup
      </p>
    </div>
  );


  // Render auth step
  const renderAuthStep = () => (
    <div className="space-y-4">
      {/* Compact Booking Summary */}
      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
        <Bike className="w-8 h-8 text-emerald-600" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{bike.brandName} {bike.name}</p>
          <p className="text-sm text-gray-600">{rentalDays} Days • ₹{totalTripCost.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {authMode === 'check' && (
        <>
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900">Enter your details</h3>
            <p className="text-sm text-gray-500">We need your contact info to confirm the booking</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setFormData({ ...formData, phone: val });
                  setError('');
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <Button
            onClick={checkCustomerAndProceed}
            disabled={isLoading || !formData.name || !formData.phone || !formData.email}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            {isLoading ? (
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

      {authMode === 'login' && (
        <>
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900">Welcome back!</h3>
            <p className="text-sm text-gray-500">Enter your password to login and confirm booking</p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{existingCustomer?.name || formData.name}</p>
                <p className="text-sm text-gray-600">{existingCustomer?.email || formData.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter your password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
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
            disabled={isLoading || !formData.password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Login & Confirm Booking
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('check');
              setFormData(prev => ({ ...prev, password: '' }));
              setError('');
            }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to edit details
          </button>
        </>
      )}

      {authMode === 'register' && (
        <>
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900">Create a password</h3>
            <p className="text-sm text-gray-500">Set a password to secure your account</p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{formData.name}</p>
                <p className="text-sm text-gray-600">{formData.phone} • {formData.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Create a password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
                minLength={6}
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
            disabled={isLoading || !formData.password || formData.password.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Register & Confirm Booking
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('check');
              setFormData(prev => ({ ...prev, password: '' }));
              setError('');
            }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to edit details
          </button>
        </>
      )}
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-2">Creating your booking...</h3>
      <p className="text-gray-500">Please wait while we confirm your reservation</p>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep('auth')}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-900">
                {step === 'confirm' && 'Confirm Booking'}
                {step === 'auth' && 'Complete Registration'}
                {step === 'processing' && 'Processing'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {step === 'confirm' && renderBookingSummary()}
              {step === 'auth' && renderAuthStep()}
              {step === 'processing' && renderProcessingStep()}
            </div>

            {/* Footer */}
            {step === 'confirm' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Button
                  onClick={handleConfirmBooking}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                >
                  {existingCustomer ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Confirm Booking
                    </>
                  ) : (
                    <>
                      Continue to Register
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  By confirming, you agree to our Terms & Conditions
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
