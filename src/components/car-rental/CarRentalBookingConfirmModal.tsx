'use client';

import React, { useState, useEffect } from 'react';
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
  Car,
  Users,
  Fuel,
  Navigation,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PricingData {
  grandTotal: number;
  totalBeforeGst: number;
  gst: number;
  baseKmCharge?: number;
  totalKm?: number;
  perKmRate?: number;
  driverAllowance?: number;
  nightCharge?: number;
  tollEstimate?: number;
  basePrice?: number;
  hours?: number;
  kms?: number;
  extraKmCharge?: number;
  extraHourCharge?: number;
}

interface VehicleData {
  id: string;
  name: string;
  seatingCapacity: number;
  luggageCapacity?: string | null;
  acType?: string | null;
  fuelType?: string | null;
  image?: string | null;
  exampleVehicles?: string[] | null;
}

interface BookingDetails {
  vehicle: VehicleData;
  tripType: 'local' | 'outstation' | 'airport';
  pickupCity: string;
  pickupCitySlug: string;
  pickupLocationId?: string;
  pickupDate: string;
  pickupTime: string;
  dropCity?: string;
  dropLocationId?: string;
  returnDate?: string;
  outstationMode?: 'one-way' | 'round-trip';
  airportMode?: 'pickup' | 'drop';
  airportName?: string;
  packageId?: string;
  packageName?: string;
  packageHours?: number;
  packageKms?: number;
  pricing: PricingData;
  serviceSlug: string;
  intermediateStops?: Array<{ id: string; locationId: string; cityText: string }>;
  legs?: Array<{ from: string; to: string; km: number }>;
}

interface CarRentalBookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
  colorScheme?: 'blue' | 'purple';
}

type Step = 'confirm' | 'auth' | 'processing';
type AuthMode = 'check' | 'login' | 'register';

export function CarRentalBookingConfirmModal({
  isOpen,
  onClose,
  bookingDetails,
  colorScheme = 'blue',
}: CarRentalBookingConfirmModalProps) {
  const clr = colorScheme === 'purple' ? {
    header: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    btn: 'bg-purple-600 hover:bg-purple-700',
    imgBg: 'bg-purple-100',
    imgIcon: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700',
    dot: 'bg-purple-500',
    routeBg: 'bg-purple-50',
    routeText: 'text-purple-700',
    routeBorder: 'border-purple-200',
    totalFare: 'text-purple-600',
    advance: 'bg-purple-50 text-purple-700',
    authSummary: 'bg-purple-50',
    authIcon: 'text-purple-600',
    loginCard: 'bg-purple-50 border-purple-200',
    loginAvatarBg: 'bg-purple-100',
    loginAvatarIcon: 'text-purple-600',
    inputFocus: 'focus:ring-purple-500 focus:border-purple-500',
    processingBg: 'bg-purple-100',
    processingIcon: 'text-purple-600',
  } : {
    header: 'bg-gradient-to-r from-blue-600 to-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    imgBg: 'bg-blue-100',
    imgIcon: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    routeBg: 'bg-blue-50',
    routeText: 'text-blue-700',
    routeBorder: 'border-blue-200',
    totalFare: 'text-blue-600',
    advance: 'bg-blue-50 text-blue-700',
    authSummary: 'bg-blue-50',
    authIcon: 'text-blue-600',
    loginCard: 'bg-blue-50 border-blue-200',
    loginAvatarBg: 'bg-blue-100',
    loginAvatarIcon: 'text-blue-600',
    inputFocus: 'focus:ring-blue-500 focus:border-blue-500',
    processingBg: 'bg-blue-100',
    processingIcon: 'text-blue-600',
  };
  const router = useRouter();
  const [step, setStep] = useState<Step>('confirm');
  const [authMode, setAuthMode] = useState<AuthMode>('check');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // B2B state
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState<'personal' | 'company' | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    pickupAddress: '',
    dropAddress: '',
    numberOfVehicles: '',
    numberOfEmployees: '',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setAuthMode('check');
      setError('');
      setIsB2BCustomer(false);
      setBookingPurpose(null);
      setFormData({ name: '', email: '', phone: '', password: '', pickupAddress: '', dropAddress: '', numberOfVehicles: '', numberOfEmployees: '' });
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

            // Check B2B status
            const params = new URLSearchParams();
            if (customer.id) params.set('customer_id', String(customer.id));
            if (customer.email) params.set('email', customer.email);
            if (params.toString()) {
              fetch(`/api/customer/b2b-status?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                  if (data.isB2B) setIsB2BCustomer(true);
                })
                .catch(() => {});
            }
          } catch (e) {
            console.error('Failed to parse stored customer:', e);
          }
        }
      }
    }
  }, [isOpen]);

  if (!bookingDetails) return null;

  const { vehicle, tripType, pickupCity, pickupDate, pickupTime, pricing, dropCity, airportName, airportMode, outstationMode, packageName, packageHours, packageKms, returnDate, intermediateStops, legs } = bookingDetails;
  const advanceAmount = Math.round(pricing.grandTotal * 0.3);

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

  const getTripTypeLabel = () => {
    switch (tripType) {
      case 'local': return packageName || 'Local Trip';
      case 'outstation': return outstationMode === 'round-trip' ? 'Round Trip' : 'One-Way Trip';
      case 'airport': return airportMode === 'pickup' ? 'Airport Pickup' : 'Airport Drop';
      default: return 'Car Rental';
    }
  };

  const getTripTypeIcon = () => {
    switch (tripType) {
      case 'local': return <Navigation className="w-4 h-4" />;
      case 'outstation': return <Car className="w-4 h-4" />;
      case 'airport': return <Plane className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Check if customer exists
  const checkCustomerAndProceed = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      setError('Please fill in all required fields');
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
        setExistingCustomer(data.customers);
        setAuthMode('login');
      } else {
        setAuthMode('register');
      }
    } catch (err) {
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
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        setFormData(prev => ({
          ...prev,
          name: data.customers.name,
          email: data.customers.email,
          phone: data.customers.phone,
        }));

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
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

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
        tripType,
        carCategory: vehicle.id,
        carCategoryName: vehicle.name,
        pickupCity,
        pickupLocationId: bookingDetails.pickupLocationId,
        pickupDate,
        pickupTime,
        pickupAddress: formData.pickupAddress || pickupCity,
        dropAddress: formData.dropAddress || dropCity || '',
        // Pricing - use correct field names expected by API
        baseFare: pricing.totalBeforeGst,
        perKmRate: pricing.perKmRate || 0,
        chargeableKm: pricing.totalKm || null,
        kmCharges: pricing.baseKmCharge || 0,
        driverBatta: pricing.driverAllowance || 0,
        gstAmount: pricing.gst,
        platformFee: 99,
        grandTotal: pricing.grandTotal,
        ...(tripType === 'local' && bookingDetails.packageId && {
          localPackageId: bookingDetails.packageId,
          localPackageHours: bookingDetails.packageHours,
          localPackageKm: bookingDetails.packageKms,
        }),
        ...(tripType === 'outstation' && {
          dropCity: dropCity,
          dropLocationId: bookingDetails.dropLocationId,
          mode: outstationMode,
          returnDate: outstationMode === 'round-trip' ? returnDate : undefined,
          intermediateStops: intermediateStops?.filter((s) => s.locationId || s.cityText.trim()) || [],
        }),
        ...(tripType === 'airport' && {
          airportMode,
          airport: airportName,
        }),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        ...(bookingPurpose === 'company' && {
          isB2B: true,
          numberOfVehicles: formData.numberOfVehicles ? parseInt(formData.numberOfVehicles) : undefined,
          numberOfEmployees: formData.numberOfEmployees ? parseInt(formData.numberOfEmployees) : undefined,
        }),
      };

      const response = await fetch('/api/car-rental/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_booking_id', result.booking?.id?.toString() || '');
          localStorage.setItem('last_booking_number', result.booking?.bookingNumber || '');

          if (result.customer) {
            const existingToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const customerToStore = {
              ...customer,
              ...result.customer,
            };
            localStorage.setItem('customer', JSON.stringify(customerToStore));

            if (!existingToken && result.token) {
              localStorage.setItem('auth_token', result.token);
              localStorage.setItem('token', result.token);
            }
          }
        }

        // Redirect to customer dashboard or payment page
        router.push(result.redirect_to || '/customer/car-bookings');
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
    if (existingCustomer && localStorage.getItem('auth_token')) {
      createBooking(existingCustomer);
    } else {
      setStep('auth');
    }
  };

  // Render booking summary
  const renderBookingSummary = () => (
    <div className="space-y-4">
      {/* Vehicle Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className={`w-20 h-20 ${clr.imgBg} rounded-lg flex items-center justify-center overflow-hidden`}>
          {vehicle.image ? (
            <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <Car className={`w-10 h-10 ${clr.imgIcon}`} />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{vehicle.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {vehicle.seatingCapacity} Seater
            </span>
            {vehicle.acType && (
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3" />
                {vehicle.acType}
              </span>
            )}
            {vehicle.fuelType && (
              <span className="flex items-center gap-1">
                <Fuel className="w-3 h-3" />
                {vehicle.fuelType}
              </span>
            )}
            {vehicle.luggageCapacity && (
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {vehicle.luggageCapacity}
              </span>
            )}
          </div>
          {vehicle.exampleVehicles && vehicle.exampleVehicles.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              e.g. {typeof vehicle.exampleVehicles === 'string'
                ? vehicle.exampleVehicles.split(',').slice(0, 2).map((v: string) => v.trim()).join(', ')
                : vehicle.exampleVehicles.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Trip Type Badge */}
      <div className={`flex items-center gap-2 p-3 ${clr.badge} rounded-lg`}>
        {getTripTypeIcon()}
        <span className={`font-medium ${clr.routeText}`}>{getTripTypeLabel()}</span>
        {tripType === 'local' && packageHours && packageKms && (
          <span className="text-sm text-blue-600">({packageHours}hrs / {packageKms}km)</span>
        )}
      </div>

      {/* Trip Details */}
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin className="w-4 h-4 text-green-600" />
            Pickup
          </div>
          <p className="font-medium text-gray-900">{pickupCity}</p>
          <p className="text-sm text-gray-600">{formatDate(pickupDate)} at {formatTime(pickupTime)}</p>
        </div>

        {tripType === 'outstation' && dropCity && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="w-4 h-4 text-red-600" />
              {outstationMode === 'round-trip' ? 'Destination & Return' : 'Drop'}
            </div>
            {intermediateStops && intermediateStops.length > 0 ? (
              <div className="space-y-1.5">
                {[pickupCity, ...intermediateStops.map((s) => s.cityText), dropCity].map((city, i, arr) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? clr.dot : i === arr.length - 1 ? 'bg-red-500' : 'bg-orange-400'}`} />
                      {i < arr.length - 1 && <div className="w-px h-3 bg-gray-300" />}
                    </div>
                    <span className={`text-sm ${i === 0 || i === arr.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {city}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-medium text-gray-900">{dropCity}</p>
            )}
          </div>
        )}

        {tripType === 'outstation' && outstationMode === 'round-trip' && returnDate && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Calendar className={`w-4 h-4 ${clr.imgIcon}`} />
              Return Date
            </div>
            <p className="font-medium text-gray-900">{formatDate(returnDate)}</p>
            {pickupTime && <p className="text-sm text-gray-600">at {formatTime(pickupTime)}</p>}
          </div>
        )}

        {tripType === 'airport' && airportName && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Plane className="w-4 h-4 text-blue-600" />
              {airportMode === 'pickup' ? 'Airport' : 'Drop at Airport'}
            </div>
            <p className="font-medium text-gray-900">{airportName}</p>
          </div>
        )}
      </div>

      {/* Booking Purpose - Personal or Company (only for B2B customers) */}
      {isB2BCustomer && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">This booking is for:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBookingPurpose('personal')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                bookingPurpose === 'personal'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" /> Personal
            </button>
            <button
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

          {/* B2B Corporate Fields */}
          {bookingPurpose === 'company' && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number of Vehicles *</label>
                  <input
                    type="number"
                    value={formData.numberOfVehicles}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfVehicles: e.target.value }))}
                    placeholder="e.g. 10"
                    min="1"
                    max="500"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number of Employees</label>
                  <input
                    type="number"
                    value={formData.numberOfEmployees}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfEmployees: e.target.value }))}
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

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Fare Details</h4>
        <div className="space-y-2 text-sm">
          {pricing.basePrice && (
            <div className="flex justify-between">
              <span className="text-gray-600">Base Fare</span>
              <span className="font-medium">₹{pricing.basePrice.toLocaleString()}</span>
            </div>
          )}
          {pricing.baseKmCharge && !legs && (
            <div className="flex justify-between">
              <span className="text-gray-600">Distance Charge ({pricing.totalKm} km)</span>
              <span className="font-medium">₹{pricing.baseKmCharge.toLocaleString()}</span>
            </div>
          )}
          {legs && legs.length > 0 && (
            <>
              <div className={`${clr.routeBg} rounded-lg p-2.5 space-y-1.5 mb-1`}>
                <p className={`text-xs font-semibold ${clr.routeText} mb-1`}>Route Breakdown</p>
                {legs.map((leg, i) => (
                  <div key={i} className="text-xs text-gray-600">
                    {leg.from} → {leg.to}
                  </div>
                ))}
                <div className={`flex justify-between text-xs font-semibold ${clr.routeText} border-t ${clr.routeBorder} pt-1`}>
                  <span>Total: {pricing.totalKm} km × ₹{pricing.perKmRate}/km</span>
                  <span>₹{pricing.baseKmCharge?.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
          {pricing.driverAllowance && pricing.driverAllowance > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Driver Allowance</span>
              <span className="font-medium">₹{pricing.driverAllowance.toLocaleString()}</span>
            </div>
          )}
          {pricing.nightCharge && pricing.nightCharge > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Night Charges</span>
              <span className="font-medium">₹{pricing.nightCharge.toLocaleString()}</span>
            </div>
          )}
          {pricing.extraKmCharge && (
            <div className="flex justify-between text-gray-400">
              <span>Extra km charge</span>
              <span>₹{pricing.extraKmCharge}/km</span>
            </div>
          )}
          {pricing.extraHourCharge && (
            <div className="flex justify-between text-gray-400">
              <span>Extra hour charge</span>
              <span>₹{pricing.extraHourCharge}/hr</span>
            </div>
          )}
          <div className="flex justify-between text-amber-600">
            <span>Toll/Parking</span>
            <span>Extra (as applicable)</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Total Fare</span>
            <span className={`font-bold ${clr.totalFare} text-lg`}>₹{pricing.grandTotal.toLocaleString()}</span>
          </div>
          {bookingPurpose === 'company' ? (
            <div className="flex justify-between text-teal-700 bg-teal-50 p-2 rounded-lg mt-2">
              <span className="font-medium">Payment Mode</span>
              <span className="font-bold">Corporate Post-Paid</span>
            </div>
          ) : (
            <div className={`flex justify-between ${clr.advance} p-2 rounded-lg mt-2`}>
              <span className="font-medium">Advance Payment (30%)</span>
              <span className="font-bold">₹{advanceAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Inclusions */}
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-sm font-medium text-green-800 mb-2">Included:</p>
        <div className="flex flex-wrap gap-2 text-xs text-green-700">
          <span className="bg-green-100 px-2 py-1 rounded">Professional Driver</span>
          <span className="bg-green-100 px-2 py-1 rounded">AC Vehicle</span>
          <span className="bg-green-100 px-2 py-1 rounded">Fuel</span>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-gray-500 text-center">
        * Toll, parking & state permit charges extra as applicable
      </p>
    </div>
  );

  // Render auth step
  const renderAuthStep = () => (
    <div className="space-y-4">
      {/* Compact Booking Summary */}
      <div className={`flex items-center gap-3 p-3 ${clr.authSummary} rounded-lg`}>
        <Car className={`w-8 h-8 ${clr.authIcon}`} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{vehicle.name}</p>
          <p className="text-sm text-gray-600">{getTripTypeLabel()} • ₹{pricing.grandTotal.toLocaleString()}</p>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 10) {
                    setFormData({ ...formData, phone: val });
                    setError('');
                  }
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
                placeholder="10 digit mobile number"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Enter complete pickup address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <Button
            onClick={checkCustomerAndProceed}
            disabled={isLoading || !formData.name || !formData.phone || !formData.email}
            className={`w-full ${clr.btn} text-white py-3`}
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

          <div className={`p-3 ${clr.loginCard} rounded-lg border`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${clr.loginAvatarBg} rounded-full flex items-center justify-center`}>
                <User className={`w-5 h-5 ${clr.loginAvatarIcon}`} />
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
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
            className={`w-full ${clr.btn} text-white py-3`}
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

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
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
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className={`w-full ${clr.btn} text-white py-3`}
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
      <div className={`w-16 h-16 mx-auto mb-4 ${clr.processingBg} rounded-full flex items-center justify-center`}>
        <Loader2 className={`w-8 h-8 ${clr.processingIcon} animate-spin`} />
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full flex flex-col"
            style={{ maxHeight: 'min(92vh, 100dvh - env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${clr.header} text-white rounded-t-2xl flex-shrink-0`}>
              <h2 className="font-bold text-lg">
                {step === 'confirm' && 'Confirm Booking'}
                {step === 'auth' && 'Complete Registration'}
                {step === 'processing' && 'Processing'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content — flex-1 so it fills remaining space, overflow-y-auto for scroll */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {step === 'confirm' && renderBookingSummary()}
              {step === 'auth' && renderAuthStep()}
              {step === 'processing' && renderProcessingStep()}
            </div>

            {/* Footer */}
            {step === 'confirm' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  onClick={handleConfirmBooking}
                  className={`w-full ${clr.btn} text-white py-3 text-lg font-semibold`}
                >
                  {existingCustomer ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {bookingPurpose === 'company' ? 'Confirm B2B Booking' : 'Confirm Booking'}
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
