'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
  IndianRupee,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  // car_bookings fields
  requestedVehicleName?: string;
  locationName?: string;
  // legacy compat fields returned by API
  carCategory?: string;
  carCategoryName?: string;
  pickupCity?: string;
  pickupDate: string;
  pickupTime: string;
  grandTotal: number;
  partialPayment?: number;
  status: string;
  paymentStatus?: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.bookingNumber as string;

  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingNumber]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/car-rental/bookings/${bookingNumber}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
      } else {
        setError('Booking not found');
      }
    } catch {
      setError('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const advanceAmount = booking
    ? booking.partialPayment || Math.round(booking.grandTotal * 0.20)
    : 0;

  const advancePercent = booking
    ? Math.round((advanceAmount / booking.grandTotal) * 100)
    : 20;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center h-14">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="ml-2">
              <h1 className="font-semibold text-gray-900 text-sm">Complete Payment</h1>
              <p className="text-xs text-gray-500">#{bookingNumber}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-emerald-600">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Secure</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Amount Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs">Amount to Pay</p>
              <p className="text-2xl font-bold flex items-center">
                <IndianRupee className="w-5 h-5" />
                {advanceAmount.toLocaleString()}
              </p>
              <p className="text-emerald-200 text-xs mt-1">
                {advancePercent}% advance of ₹{booking?.grandTotal.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-xs">Booking</p>
              <p className="font-medium text-sm">{booking?.requestedVehicleName || booking?.carCategoryName || booking?.carCategory}</p>
              <p className="text-emerald-200 text-xs">
                {booking?.locationName || booking?.pickupCity}
              </p>
            </div>
          </div>
        </div>

        {/* Razorpay Payment */}
        {booking && (
          <div className="bg-white rounded-xl shadow-sm border">
            <BookingPayment
              bookingId={booking.id}
              bookingType="chauffeur"
              amount={advanceAmount}
              bookingNumber={booking.bookingNumber}
              onSuccess={() => router.push(`/customer/dashboard`)}
            />
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-400 uppercase mb-2">Booking Details</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Vehicle</p>
                <p className="font-medium text-gray-900">{booking.requestedVehicleName || booking.carCategoryName || booking.carCategory}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{booking.pickupTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Shield className="w-3 h-3" />
            <span>Secure Payment</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="text-gray-400 text-xs">24/7 Support</div>
        </div>
      </div>
    </div>
  );
}
