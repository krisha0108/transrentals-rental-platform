'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  CreditCard,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useBookingStatus, BookingStatusType } from '@/hooks/useBookingStatus';
import { RazorpayPayment } from '@/components/payment/RazorpayPayment';
import { Button } from '@/components/ui/button';

interface BookingData {
  id: string;
  bookingNumber: string;
  vehicleName: string;
  brandName?: string;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  grandTotal: number;
  notifiedVendorCount?: number;
}

interface BookingStatusTrackerProps {
  booking: BookingData;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export function BookingStatusTracker({
  booking,
  onPaymentSuccess,
  onPaymentError,
}: BookingStatusTrackerProps) {
  const [showPayment, setShowPayment] = useState(false);

  const {
    status,
    isConnected,
    acceptedData,
    paymentData,
    error,
  } = useBookingStatus({
    bookingId: booking.id,
    onAccepted: (data) => {
      console.log('Vendor accepted:', data);
    },
    onPaymentConfirmed: (data) => {
      console.log('Payment confirmed:', data);
      onPaymentSuccess?.();
    },
  });

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Step indicators
  const steps = [
    { key: 'WAITING', label: 'Finding Vendors', icon: Users },
    { key: 'ACCEPTED', label: 'Vendor Found', icon: CheckCircle },
    { key: 'PAYMENT', label: 'Payment', icon: CreditCard },
    { key: 'PAID', label: 'Confirmed', icon: CheckCircle },
  ];

  const getCurrentStep = () => {
    switch (status) {
      case 'WAITING':
        return 0;
      case 'ACCEPTED':
        return showPayment ? 2 : 1;
      case 'PAID':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-100 text-sm">Booking</p>
            <h2 className="text-2xl font-bold">#{booking.bookingNumber}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-emerald-100">
              {isConnected ? 'Live updates' : 'Reconnecting...'}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;
            const isFailed = status === 'CANCELLED' || status === 'EXPIRED';

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete
                        ? 'bg-white text-emerald-600'
                        : isActive
                        ? 'bg-white/20 text-white ring-2 ring-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-white font-medium' : 'text-emerald-200'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      idx < currentStep ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status: WAITING */}
        {status === 'WAITING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="relative inline-block mb-4">
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Finding Available Vendors...
            </h3>
            <p className="text-gray-600 mb-4">
              {booking.notifiedVendorCount
                ? `Notifying ${booking.notifiedVendorCount} vendor${booking.notifiedVendorCount > 1 ? 's' : ''} in your area`
                : 'Searching for vendors with your selected bike'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Usually takes less than 5 minutes</span>
            </div>
          </motion.div>
        )}

        {/* Status: ACCEPTED */}
        {status === 'ACCEPTED' && acceptedData && !showPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Vendor Found!
              </h3>
              <p className="text-gray-600">
                {acceptedData.vendorName} has accepted your booking
              </p>
            </div>

            {/* Vendor Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Vendor Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-emerald-600">
                      {acceptedData.vendorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{acceptedData.vendorName}</p>
                    {acceptedData.vendorPhone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {acceptedData.vendorPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Price Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-medium">{acceptedData.acceptedVehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate</span>
                  <span className="font-medium">₹{acceptedData.dailyRate}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    ₹{acceptedData.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={() => setShowPayment(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-bold"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ₹{acceptedData.totalAmount.toLocaleString()}
            </Button>
          </motion.div>
        )}

        {/* Payment Modal */}
        {status === 'ACCEPTED' && showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RazorpayPayment
              bookingId={booking.id}
              onSuccess={(data) => {
                onPaymentSuccess?.();
              }}
              onError={(err) => {
                onPaymentError?.(err);
              }}
              onCancel={() => setShowPayment(false)}
              autoOpen
            />
          </motion.div>
        )}

        {/* Status: PAID */}
        {status === 'PAID' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-6">
              Your payment was successful. Get ready to ride!
            </p>

            {/* Booking Summary Card */}
            <div className="bg-gray-50 rounded-xl p-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-semibold">{acceptedData?.acceptedVehicleName || booking.vehicleName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p className="font-semibold">{acceptedData?.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Pickup
                  </p>
                  <p className="font-semibold">{booking.locationName}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(booking.pickupDate)}, {formatTime(booking.pickupTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Drop-off
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(booking.dropDate)}, {formatTime(booking.dropTime)}
                  </p>
                </div>
              </div>

              {paymentData && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{paymentData.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Transaction ID: {paymentData.paymentId}
                  </p>
                </div>
              )}
            </div>

            {/* Vendor Contact */}
            {acceptedData?.vendorPhone && (
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Vendor: {acceptedData.vendorPhone}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Status: CANCELLED or EXPIRED */}
        {(status === 'CANCELLED' || status === 'EXPIRED') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {status === 'CANCELLED' ? 'Booking Cancelled' : 'Booking Expired'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'No vendors were available to accept your booking at this time.'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Error State */}
        {error && status !== 'CANCELLED' && status !== 'EXPIRED' && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Something went wrong</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
