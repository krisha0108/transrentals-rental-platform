'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Car,
  User,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Fuel,
  Users,
  Navigation,
  Plane,
  Info,
} from 'lucide-react';
import Link from 'next/link';

function BookingContent({ location }: { location: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get booking details from URL params
  const tripType = searchParams.get('tripType') || 'local';
  const carCategory = searchParams.get('carCategory') || 'sedan';
  const carName = searchParams.get('carName') || 'Sedan';
  const pickupCity = searchParams.get('pickupCity') || location;
  const pickupLocationId = searchParams.get('pickupLocationId') || '';
  const dropCity = searchParams.get('dropCity') || '';
  const dropLocationId = searchParams.get('dropLocationId') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnDate = searchParams.get('returnDate') || '';
  const localPackage = searchParams.get('package') || '';
  const mode = searchParams.get('mode') || 'round-trip';
  const airportMode = searchParams.get('airportMode') || 'pickup';
  const fare = parseInt(searchParams.get('fare') || '0');

  // Vehicle category data
  const [vehicle_category, setVehicleCategory] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);

  // Fetch vehicle category data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesRes = await fetch('/api/admin/services/car-rental/vehicles');
        const vehiclesData = await vehiclesRes.json();
        if (vehiclesData.categories) {
          const category = vehiclesData.categories.find((c: any) => c.id === carCategory);
          if (category) {
            setVehicleCategory(category);
          }
        }

        if (localPackage) {
          const packagesRes = await fetch('/api/admin/services/car-rental/packages');
          const packagesData = await packagesRes.json();
          if (packagesData.packages) {
            const pkg = packagesData.packages.find((p: any) => p.id === localPackage);
            if (pkg) {
              setPackageData(pkg);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicle data:', error);
      }
    };

    fetchData();
  }, [carCategory, localPackage]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Travel-agent flow
  const [isTravelAgent, setIsTravelAgent] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [taBookingMode, setTaBookingMode] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');

  // Check if user is logged in and pre-fill details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customerData = localStorage.getItem('customer');
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (customerData && token) {
        try {
          const customer = JSON.parse(customerData);
          setCustomerName(customer.name || '');
          setCustomerEmail(customer.email || '');
          setCustomerPhone(customer.phone || '');
          setIsLoggedIn(true);
          if (customer.linkedTravelAgentId) {
            setIsTravelAgent(true);
            setAgentName(customer.name || '');
          }
        } catch (e) {
          console.error('Failed to parse customer data:', e);
        }
      }
    }
  }, []);

  // Calculate GST (5% on cab fare)
  const gstAmount = Math.round(fare * 0.05);
  const platformFee = 99;
  const grandTotal = fare + gstAmount + platformFee;

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

    setIsSubmitting(true);

    try {
      const bookingData: any = {
        tripType,
        carCategory,
        carCategoryName: carName,
        pickupCity,
        pickupLocationId: pickupLocationId || undefined,
        dropCity: dropCity || pickupCity,
        dropLocationId: dropLocationId || undefined,
        pickupAddress,
        dropAddress,
        pickupDate,
        pickupTime,
        returnDate: returnDate || undefined,
        localPackageId: tripType === 'local' ? localPackage : undefined,
        localPackageHours: packageData?.hours,
        localPackageKm: packageData?.kms,
        mode: tripType === 'outstation' ? mode : undefined,
        airportMode: tripType === 'airport' ? airportMode : undefined,
        customerName,
        customerPhone,
        customerEmail,
        customerNotes: specialRequests,
        baseFare: fare,
        gstAmount,
        platformFee,
        grandTotal,
      };

      // Travel-agent: forward mode + (for COMPANY) number of vehicles/employees
      if (isTravelAgent) {
        bookingData.taBookingMode = taBookingMode;
        if (taBookingMode === 'COMPANY') {
          bookingData.numberOfVehicles = numberOfVehicles;
          if (numberOfEmployees) bookingData.numberOfEmployees = numberOfEmployees;
        } else {
          bookingData.numberOfVehicles = '1';
        }
      }

      const response = await fetch('/api/car-rental/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        // Auto-login: Store customer data and token (same as bike-rental flow)
        if (result.customer) {
          localStorage.setItem('customer', JSON.stringify(result.customer));
          // Generate session token like bike-rental does
          const sessionToken = result.token || `tr_${result.customer.id}_${Date.now()}`;
          localStorage.setItem('auth_token', sessionToken);
          localStorage.setItem('token', sessionToken);
        }

        // Redirect to payment page or specified redirect URL
        router.push(result.redirect_to || `/pay/${result.booking.bookingNumber}`);
      } else {
        alert(result.error || 'Failed to create booking');
      }
    } catch (error) {
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  // Get example vehicles from category
  const exampleVehicles = vehicle_category?.exampleVehicles
    ? Array.isArray(vehicle_category.exampleVehicles)
      ? vehicle_category.exampleVehicles.join(', ')
      : vehicle_category.exampleVehicles
    : 'Swift, Dzire, Innova';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-6">
        <div className="container-custom">
          <Link
            href={`/car-rental/${location}`}
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
          <p className="text-blue-200">Enter your details to confirm the cab booking</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Summary Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <TripIcon className="w-5 h-5 text-blue-600" />
                  Trip Summary
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Car className="w-10 h-10 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{carName}</div>
                      <div className="text-sm text-gray-600">{exampleVehicles}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">{getTripTypeLabel()}</div>
                    <div className="font-semibold text-gray-900">
                      {tripType === 'local' &&
                        (packageData
                          ? `${packageData.hours}hr / ${packageData.kms}km`
                          : 'Local Package')}
                      {tripType === 'outstation' && `${pickupCity} → ${dropCity}`}
                      {tripType === 'airport' &&
                        (airportMode === 'pickup' ? 'Airport → City' : 'City → Airport')}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
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
                    <div className="p-3 bg-gray-50 rounded-lg">
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

                {/* Features */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {vehicle_category?.seatingCapacity || 4} Seats
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Fuel className="w-4 h-4" />
                    Fuel Included
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    Verified Driver
                  </span>
                </div>
              </div>

              {/* ── Travel Agent mode selector (only when linked) ── */}
              {isTravelAgent && (
                <div className="bg-gradient-to-br from-indigo-50 via-emerald-50 to-teal-50 border border-indigo-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-base text-indigo-900">
                      Booking as Travel Agent — {agentName}
                    </h2>
                  </div>
                  <p className="text-xs text-indigo-700 mb-4">
                    No upfront payment required. Your request will be sent to the
                    manager who will share a quote and assign vehicles.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setTaBookingMode('PERSONAL')}
                      className={`text-left p-4 rounded-lg border-2 transition ${
                        taBookingMode === 'PERSONAL'
                          ? 'bg-white border-indigo-500 ring-2 ring-indigo-200'
                          : 'bg-white/60 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <p className="font-bold text-sm text-gray-900">Personal Booking</p>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        For you / your family. 1 vehicle, manager review.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaBookingMode('COMPANY')}
                      className={`text-left p-4 rounded-lg border-2 transition ${
                        taBookingMode === 'COMPANY'
                          ? 'bg-white border-indigo-500 ring-2 ring-indigo-200'
                          : 'bg-white/60 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏢</span>
                        <p className="font-bold text-sm text-gray-900">Company Booking</p>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        For your agency. Multi-vehicle, monthly invoiced.
                      </p>
                    </button>
                  </div>

                  {taBookingMode === 'COMPANY' && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-200">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-900 mb-1">
                          # of Vehicles *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={numberOfVehicles}
                          onChange={(e) => setNumberOfVehicles(e.target.value)}
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-900 mb-1">
                          # of Passengers
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={numberOfEmployees}
                          onChange={(e) => setNumberOfEmployees(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pickup/Drop Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-lg mb-4">Pickup & Drop Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-blue-500" />
                      <textarea
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter complete pickup address with landmark"
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-lg mb-4">Traveller Details</h2>

                {isLoggedIn ? (
                  <div className="flex items-center gap-3 p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                      {(customerName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-600">{customerPhone} · {customerEmail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setCustomerPhone(val);
                          }}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requirements or instructions for the driver..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    . I understand that toll charges, parking fees, and state permits are not
                    included in the fare and will be charged extra as applicable.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms}
                  className={`w-full mt-6 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 ${
                    isTravelAgent
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : isTravelAgent ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Request to Manager
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Booking - ₹{grandTotal.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right - Price Summary (or TA quote-pending notice) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              {isTravelAgent ? (
                <>
                  <h3 className="font-semibold text-lg mb-2 text-indigo-900">Quote Pending</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The manager will review your request and share a custom quote.
                    {taBookingMode === 'COMPANY'
                      ? ' Company bookings are billed monthly via invoice.'
                      : ' Personal bookings are billed after the trip.'}
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800 space-y-1.5">
                    <p className="font-semibold">Estimated reference fare</p>
                    <p className="text-gray-700">
                      ₹{fare.toLocaleString()} (subject to manager review)
                    </p>
                  </div>
                </>
              ) : (
                <>
              <h3 className="font-semibold text-lg mb-4">Fare Breakdown</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {tripType === 'local' &&
                      `Base fare (${packageData ? `${packageData.hours}hr/${packageData.kms}km` : 'Package'})`}
                    {tripType === 'outstation' && 'Trip fare (incl. driver batta)'}
                    {tripType === 'airport' && 'Airport transfer fare'}
                  </span>
                  <span className="font-medium">₹{fare.toLocaleString()}</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-base">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-blue-600">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
                </>
              )}

              {/* What's Included */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Inclusions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Fuel charges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Driver allowance
                  </li>
                  {tripType === 'airport' && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      45 min waiting at airport
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    AC cab
                  </li>
                </ul>
              </div>

              {/* What's Not Included */}
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Exclusions</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Toll charges
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Parking charges
                  </li>
                  {tripType === 'outstation' && (
                    <li className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      State permit (if applicable)
                    </li>
                  )}
                  {tripType === 'local' && (
                    <li className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Extra km/hr charges
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarRentalBookingPage({
  params,
}: {
  params: { location: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <BookingContent location={params.location} />
    </Suspense>
  );
}
