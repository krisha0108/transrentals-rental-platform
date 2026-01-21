'use client';

import React, { useState, Suspense } from 'react';
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
import { getCarCategory, getLocalPackage } from '@/lib/chauffeur-pricing';

function BookingContent({ location }: { location: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get booking details from URL params
  const tripType = searchParams.get('tripType') || 'local';
  const carCategory = searchParams.get('carCategory') || 'sedan';
  const carName = searchParams.get('carName') || 'Sedan';
  const pickupCity = searchParams.get('pickupCity') || location;
  const dropCity = searchParams.get('dropCity') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnDate = searchParams.get('returnDate') || '';
  const localPackage = searchParams.get('package') || '8hr-80km';
  const mode = searchParams.get('mode') || 'round-trip';
  const airportMode = searchParams.get('airportMode') || 'pickup';
  const fare = parseInt(searchParams.get('fare') || '0');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const car = getCarCategory(carCategory);
  const pkg = tripType === 'local' ? getLocalPackage(localPackage) : null;

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

    if (!agreeTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        tripType,
        carCategory,
        carCategoryName: carName,
        pickupCity,
        dropCity: dropCity || pickupCity,
        pickupAddress,
        dropAddress,
        pickupDate,
        pickupTime,
        returnDate: returnDate || undefined,
        localPackageId: tripType === 'local' ? localPackage : undefined,
        localPackageHours: pkg?.hours,
        localPackageKm: pkg?.km,
        mode: tripType.includes('outstation') ? mode : undefined,
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

      const response = await fetch('/api/chauffeur-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to payment page
        router.push(`/pay/${result.booking.bookingNumber}`);
      } else {
        alert(result.error || 'Failed to create booking');
      }
    } catch (error) {
      // Error handling - booking failed
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-emerald-900 text-white py-6">
        <div className="container-custom">
          <Link
            href={`/chauffeur-service/${location}`}
            className="inline-flex items-center gap-2 text-emerald-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
          <p className="text-emerald-200">Enter your details to confirm the cab booking</p>
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
                  <TripIcon className="w-5 h-5 text-emerald-600" />
                  Trip Summary
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <Car className="w-10 h-10 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{carName}</div>
                      <div className="text-sm text-gray-600">{car?.examples}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">{getTripTypeLabel()}</div>
                    <div className="font-semibold text-gray-900">
                      {tripType === 'local' && pkg?.label}
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
                    {car?.seats} Seats
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

              {/* Pickup/Drop Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-lg mb-4">Pickup & Drop Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-emerald-500" />
                      <textarea
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter complete pickup address with landmark"
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-lg mb-4">Traveller Details</h2>

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
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        pattern="[0-9]{10}"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requirements or instructions for the driver..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-emerald-600 hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-emerald-600 hover:underline">
                      Privacy Policy
                    </Link>
                    . I understand that toll charges, parking fees, and state permits are not
                    included in the fare and will be charged extra as applicable.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Booking • ₹{grandTotal.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Fare Breakdown</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {tripType === 'local' && `Base fare (${pkg?.label})`}
                    {tripType === 'outstation' && 'Trip fare (incl. driver batta)'}
                    {tripType === 'airport' && 'Airport transfer fare'}
                  </span>
                  <span className="font-medium">₹{fare.toLocaleString()}</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-base">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-emerald-600">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* What's Included */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Inclusions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Fuel charges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Driver allowance
                  </li>
                  {tripType === 'airport' && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      45 min waiting at airport
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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

              {/* Support */}
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-500">Need help?</p>
                <a
                  href="tel:+919876543210"
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Call +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChauffeurBookingPage({
  params,
}: {
  params: { location: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <BookingContent location={params.location} />
    </Suspense>
  );
}
