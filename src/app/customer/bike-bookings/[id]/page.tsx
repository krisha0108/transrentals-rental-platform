'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  Bike,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  Star,
  User,
  Loader2,
  Shield,
  Copy,
  KeyRound,
  Play,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCustomerAuth } from '@/hooks/useCustomer';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { useSocket } from '@/hooks/useSocket';
import { BookingPayment } from '@/components/payment/BookingPayment';
import { BikeBookingChat } from '@/components/bike/BikeBookingChat';

type BikeBookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PENDING_VENDOR'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

// Mock booking detail
const MOCK_BOOKING = {
  id: '1',
  bookingNumber: 'BK-2024-089',
  customerId: null as string | null,
  vehicleName: 'Honda Activa 6G',
  vehicleType: 'Scooter',
  vehicleImage: '/images/fleet/activa-6g.jpg',
  vehicleSpecs: {
    engine: '110cc',
    mileage: '50 km/l',
    transmission: 'Automatic',
    fuelType: 'Petrol',
  },
  vendorId: 'vendor-1',
  vendorName: 'Bike Zone Mumbai',
  vendorPhone: '+91 9737965551',
  vendorRating: 4.8,
  vendorReviewCount: 156,
  vendorAddress: 'Shop 12, Colaba Causeway, Near Regal Cinema, Mumbai 400001',
  location: 'Mumbai',
  pickupAddress: 'Near Gateway of India, Colaba',
  pickupDate: '2024-12-15',
  pickupTime: '10:00',
  dropDate: '2024-12-17',
  dropTime: '18:00',
  totalDays: 3,
  dailyRate: 299,
  totalAmount: 897,
  gstAmount: 161,
  platformFee: 50,
  advanceAmount: 500,
  advancePercentage: 30,
  grandTotal: 1108,
  securityDeposit: 500,
  amountPaid: 1108,
  status: 'ACCEPTED' as BikeBookingStatus,
  paymentStatus: 'PAID',
  paymentMethod: 'UPI',
  transactionId: 'TXN123456789',
  createdAt: '2024-12-10T14:30:00',
  confirmedAt: '2024-12-10T16:45:00',
  helmetIncluded: true,
  extras: ['USB Charger', 'Phone Mount'],
  documents: {
    drivingLicense: true,
    aadharCard: true,
  },
  timeline: [
    { status: 'CREATED', timestamp: '2024-12-10T14:30:00', message: 'Booking request created' },
    { status: 'PAYMENT_COMPLETED', timestamp: '2024-12-10T14:32:00', message: 'Payment of ₹1,108 received' },
    { status: 'PENDING_VENDOR', timestamp: '2024-12-10T14:32:00', message: 'Sent to Bike Zone Mumbai' },
    { status: 'ACCEPTED', timestamp: '2024-12-10T16:45:00', message: 'Booking confirmed by vendor' },
  ],
  cancellationPolicy: 'Free cancellation up to 24 hours before pickup. 50% refund for cancellations within 24 hours.',
  termsAccepted: true,
};

const CANCEL_REASONS = [
  'Plans changed / Trip cancelled',
  'Found a better deal',
  'Booked by mistake',
  'Emergency or urgent situation',
  'Pickup date or time needs to change',
  'Vehicle does not meet my requirements',
  'Payment issue',
  'Other',
];

export default function BikeBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, customer } = useCustomerAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<typeof MOCK_BOOKING | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
  const [tripOtp, setTripOtp] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);

  // Real-time socket connection for booking updates
  const { isConnected, joinBookingRoom, leaveBookingRoom, on, off } = useSocket();

  useEffect(() => {
    async function fetchBooking() {
      try {
        // Fetch booking - could be ID or booking number
        const idOrNumber = params.id as string;
        // If starts with 'BK-' it's a booking number, otherwise it's an ID
        const paramKey = idOrNumber.startsWith('BK-') ? 'number' : 'id';
        const response = await fetch(`/api/bookings?${paramKey}=${idOrNumber}`);
        const data = await response.json();

        if (data.success && data.booking) {
          // Transform API response to component format
          const apiBooking = data.booking;
          // Use API values directly for pricing
          const totalAmount = apiBooking.totalAmount || 0;
          const gstAmount = apiBooking.gstAmount || Math.round(totalAmount * 0.18);
          const platformFee = apiBooking.platformFee || 0;
          const grandTotal = apiBooking.grandTotal || (totalAmount + gstAmount + platformFee);
          const securityDeposit = apiBooking.securityDeposit || 500;

          setBooking({
            id: apiBooking.id,
            bookingNumber: apiBooking.bookingNumber,
            customerId: apiBooking.customerId || null,
            vehicleName: apiBooking.requestedVehicleName || 'Bike',
            vehicleType: apiBooking.requestedCategory || 'Scooter',
            vehicleImage: apiBooking.vehicleImage || '/images/fleet/default-bike.jpg',
            vehicleSpecs: {
              engine: '110cc',
              mileage: '50 km/l',
              transmission: 'Automatic',
              fuelType: 'Petrol',
            },
            vendorId: apiBooking.assignedVendorId || apiBooking.vendorId || null,
            vendorName: apiBooking.vendorName || null,
            vendorPhone: apiBooking.vendorPhone || null,
            vendorRating: 4.5,
            vendorReviewCount: 0,
            vendorAddress: apiBooking.vendorAddress || '',
            location: apiBooking.locationName || '',
            pickupAddress: apiBooking.locationName || '',
            pickupDate: apiBooking.pickupDate?.split('T')[0] || '',
            pickupTime: apiBooking.pickupTime || '10:00',
            dropDate: apiBooking.dropDate?.split('T')[0] || '',
            dropTime: apiBooking.dropTime || '18:00',
            totalDays: apiBooking.totalDays || 1,
            dailyRate: apiBooking.dailyRate || 0,
            totalAmount,
            gstAmount,
            platformFee,
            grandTotal,
            advanceAmount: apiBooking.advanceAmount || 0,
            advancePercentage: apiBooking.advancePercentage || 30,
            securityDeposit,
            amountPaid: apiBooking.paidAmount || apiBooking.amountPaid || 0,
            status: (apiBooking.status || 'PENDING') as BikeBookingStatus,
            paymentStatus: apiBooking.paymentStatus || 'PENDING',
            paymentMethod: apiBooking.paymentMethod || '',
            transactionId: apiBooking.transactionId || '',
            createdAt: apiBooking.createdAt || new Date().toISOString(),
            confirmedAt: apiBooking.confirmedAt || null,
            helmetIncluded: true,
            extras: [],
            documents: {
              drivingLicense: false,
              aadharCard: false,
            },
            timeline: [
              { status: 'CREATED', timestamp: apiBooking.createdAt || new Date().toISOString(), message: 'Booking request submitted' },
            ],
            cancellationPolicy: 'Free cancellation up to 24 hours before pickup.',
            termsAccepted: true,
          });

          // Set OTP if available (for READY_FOR_PICKUP status)
          if (apiBooking.tripStartOtp) {
            setTripOtp(apiBooking.tripStartOtp);
          }
        } else {
          // Booking not found - redirect to bookings list or show error
          setBooking(null);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setBooking(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [params.id]);

  // Real-time socket subscription for booking status updates
  useEffect(() => {
    if (!booking?.id || !isConnected) return;

    // Join the booking room to receive updates
    joinBookingRoom(booking.id);

    // Listen for booking accepted event
    const handleBookingAccepted = (data: any) => {
      if (data.bookingId === booking.id || data.bookingNumber === booking.bookingNumber) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'ACCEPTED' as BikeBookingStatus,
          vendorName: data.vendorName || prev.vendorName,
          vendorPhone: data.vendorPhone || prev.vendorPhone,
          confirmedAt: data.acceptedAt || new Date().toISOString(),
          timeline: [
            ...prev.timeline,
            {
              status: 'ACCEPTED',
              timestamp: data.acceptedAt || new Date().toISOString(),
              message: `Booking confirmed by ${data.vendorName || 'vendor'}`,
            },
          ],
        } : prev);
        setStatusUpdateMessage('Your booking has been accepted!');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Listen for booking cancelled event
    const handleBookingCancelled = (data: any) => {
      if (data.bookingId === booking.id) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'CANCELLED' as BikeBookingStatus,
          timeline: [
            ...prev.timeline,
            {
              status: 'CANCELLED',
              timestamp: new Date().toISOString(),
              message: data.reason || 'Booking was cancelled',
            },
          ],
        } : prev);
        setStatusUpdateMessage('Your booking has been cancelled.');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Listen for booking expired event
    const handleBookingExpired = (data: any) => {
      if (data.bookingId === booking.id) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'EXPIRED' as BikeBookingStatus,
        } : prev);
        setStatusUpdateMessage('Your booking has expired.');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Subscribe to events
    on('booking:accepted', handleBookingAccepted);
    on('booking:cancelled', handleBookingCancelled);
    on('booking:expired', handleBookingExpired);

    // Cleanup
    return () => {
      leaveBookingRoom(booking.id);
      off('booking:accepted', handleBookingAccepted);
      off('booking:cancelled', handleBookingCancelled);
      off('booking:expired', handleBookingExpired);
    };
  }, [booking?.id, booking?.bookingNumber, isConnected, joinBookingRoom, leaveBookingRoom, on, off]);

  const getStatusConfig = (status: BikeBookingStatus) => {
    const configs: Record<BikeBookingStatus, { label: string; bg: string; text: string; borderColor: string }> = {
      PENDING: {
        label: 'Pending Confirmation',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        borderColor: 'border-amber-200',
      },
      PENDING_PAYMENT: {
        label: 'Payment Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        borderColor: 'border-yellow-200',
      },
      PAYMENT_SUBMITTED: {
        label: 'Payment Under Review',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        borderColor: 'border-amber-200',
      },
      PAYMENT_VERIFIED: {
        label: 'Payment Verified',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      PENDING_VENDOR: {
        label: 'Awaiting Confirmation',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      BROADCASTED: {
        label: 'Finding Vendor',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        borderColor: 'border-purple-200',
      },
      ACCEPTED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-700',
        borderColor: 'border-green-200',
      },
      READY_FOR_PICKUP: {
        label: 'Ready for Pickup',
        bg: 'bg-cyan-100',
        text: 'text-cyan-700',
        borderColor: 'border-cyan-200',
      },
      IN_PROGRESS: {
        label: 'Ongoing',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        borderColor: 'border-emerald-200',
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        borderColor: 'border-red-200',
      },
      EXPIRED: {
        label: 'Expired',
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        borderColor: 'border-gray-200',
      },
      REFUNDED: {
        label: 'Refunded',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
    };
    return configs[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCancelBooking = async () => {
    const finalReason = selectedCancelReason === 'Other' ? otherCancelReason.trim() : selectedCancelReason;
    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other' ? 'Please describe your reason' : 'Please select a reason for cancellation');
      return;
    }
    if (!booking) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch(`/api/bike-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      });
      const data = await response.json();
      if (data.success) {
        setShowCancelModal(false);
        window.location.reload();
      } else {
        setCancelError(data.error || 'Failed to cancel booking');
      }
    } catch {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!rating || rating < 1) return;
    try {
      const res = await fetch(`/api/bike-bookings/${booking?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate', rating, review }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRatingModal(false);
        setBooking((prev: any) => prev ? { ...prev, rating } : prev);
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch {
      alert('Failed to submit rating. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a booking with number: <strong>{params.id}</strong>
          </p>
          <div className="space-y-3">
            <Link href="/bike-on-rent">
              <Button className="w-full">Browse Bikes</Button>
            </Link>
            <Link href="/customer/bike-bookings">
              <Button variant="outline" className="w-full">View All Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const isActive = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS'].includes(
    booking.status
  );
  const showPaymentConfirmation = booking.status === 'PENDING_PAYMENT' && !!booking.advanceAmount;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between gap-4">
            {/* Left: icon + name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                <Bike className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{booking.vehicleName}</h1>
                <p className="text-white/70 text-sm mt-0.5">#{booking.bookingNumber}</p>
                {booking.location && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{booking.location}
                  </p>
                )}
              </div>
            </div>
            {/* Right: status badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Duration</p>
              <p className="text-white font-bold text-sm mt-0.5">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Grand Total</p>
              <p className="text-white font-bold text-sm mt-0.5">₹{(booking.grandTotal || booking.totalAmount)?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Advance</p>
              <p className="text-white font-bold text-sm mt-0.5">₹{booking.advanceAmount?.toLocaleString('en-IN') || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* Live update toast */}
        {statusUpdateMessage && (
          <div className="bg-green-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-sm">{statusUpdateMessage}</p>
          </div>
        )}

        {/* B2B Banner */}
        {booking.isB2B && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-teal-800 text-sm">B2B Corporate Booking</p>
              <p className="text-xs text-teal-600 mt-0.5">No advance payment required. Post-trip billing.</p>
            </div>
          </div>
        )}

        {/* Payment Required */}
        {showPaymentConfirmation && (
          <BookingPayment
            bookingId={booking.id}
            bookingType="bike"
            amount={booking.advanceAmount}
            bookingNumber={booking.bookingNumber}
            onSuccess={() => window.location.reload()}
          />
        )}

        {/* Payment Submitted */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Payment Under Verification</p>
              <p className="text-xs text-amber-700 mt-0.5">Usually takes 15–30 min during business hours. We'll notify you once verified.</p>
            </div>
          </div>
        )}

        {/* Trip OTP */}
        {booking.status === 'READY_FOR_PICKUP' && tripOtp && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Trip Start OTP</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-bold tracking-[0.5em] font-mono">{tripOtp}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(tripOtp); setOtpCopied(true); setTimeout(() => setOtpCopied(false), 2000); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition text-sm font-medium"
              >
                {otpCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {otpCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-white/60 text-xs mt-3">Share this OTP with the vendor at pickup to start your trip</p>
          </div>
        )}

        {/* In Progress */}
        {booking.status === 'IN_PROGRESS' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-sm">Trip In Progress 🏍️</p>
              <p className="text-xs text-emerald-700 mt-0.5">Enjoy your ride! Return by {formatDate(booking.dropDate)} at {formatTime(booking.dropTime)}</p>
            </div>
          </div>
        )}

        {/* ── Vehicle Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</p>
          </div>
          <div className="p-4 flex gap-4 items-center">
            <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
              <Image src={booking.vehicleImage} alt={booking.vehicleName} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base">{booking.vehicleName}</p>
              <p className="text-sm text-gray-500">{booking.vehicleType}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {booking.helmetIncluded && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" /> Helmet Included
                  </span>
                )}
                {booking.extras?.map((extra) => (
                  <span key={extra} className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">{extra}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Trip Details ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trip Details</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Pickup */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Pickup</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatDate(booking.pickupDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatTime(booking.pickupTime)}</p>
              </div>
              {/* Drop */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Drop-off</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatDate(booking.dropDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatTime(booking.dropTime)}</p>
              </div>
            </div>
            {/* Duration pill */}
            <div className="mt-3 flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 rounded-lg py-2">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</p>
            </div>
          </div>
        </div>

        {/* ── Vendor Details ── */}
        {booking.vendorName && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor Details</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{booking.vendorName}</p>
                    {booking.vendorRating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(booking.vendorRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{booking.vendorRating}</span>
                        {booking.vendorReviewCount > 0 && <span className="text-xs text-gray-400">· {booking.vendorReviewCount} reviews</span>}
                      </div>
                    )}
                    {booking.vendorAddress && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{booking.vendorAddress}</p>}
                  </div>
                </div>
                {booking.vendorPhone && (
                  <a href={`tel:${booking.vendorPhone}`} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold shadow-sm">
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
              </div>
              {customer && booking.vendorId && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <BikeBookingChat
                    bookingId={booking.id}
                    vendorId={booking.vendorId}
                    vendorName={booking.vendorName || 'Vendor'}
                    customerId={customer?.id?.toString() || booking.customerId || `guest-${booking.id}`}
                    customerName={customer?.name || 'Customer'}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Payment Summary ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Summary</p>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Daily Rate × {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
              <span className="font-medium text-gray-800">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            {booking.gstAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-medium text-gray-800">₹{booking.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
              <span className="font-bold text-gray-900">Grand Total</span>
              <span className="font-bold text-green-700 text-lg">₹{(booking.grandTotal || booking.totalAmount)?.toLocaleString('en-IN')}</span>
            </div>

            {booking.advanceAmount > 0 && (
              <div className="mt-1 bg-green-50 border border-green-100 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 font-medium">Advance ({booking.advancePercentage}%)</span>
                  <span className="font-bold text-green-700">₹{booking.advanceAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-green-100 pt-2">
                  <span className="text-gray-500">Balance at Pickup</span>
                  <span className="font-medium text-gray-700">₹{(booking.totalAmount - booking.advanceAmount)?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {booking.securityDeposit > 0 && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-800 font-medium">Security Deposit</span>
                  <span className="text-xs text-amber-600">(Refundable)</span>
                </div>
                <span className="font-bold text-amber-800">₹{booking.securityDeposit?.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Cancellation Details ── */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Cancellation Details
            </p>
            <p className="text-xs text-gray-500 mb-1">Reason</p>
            <p className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2 leading-relaxed">{booking.cancellationReason}</p>
          </div>
        )}

        {/* ── Cancel Booking ── */}
        {isActive && (
          <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-red-50">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Cancel Booking</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Once cancelled, refund will be processed as per vendor's cancellation policy.</p>
              <button
                onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" />
                Cancel This Booking
              </button>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="space-y-3 pb-6">
          {booking.status === 'COMPLETED' && !booking.rating && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
            >
              <Star className="w-5 h-5 fill-white" />
              Rate Your Experience
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/customer/helpdesk"
              className="py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              Need Help?
            </Link>
            <Link
              href="/customer/dashboard"
              className="py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center text-sm hover:bg-gray-50 transition shadow-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-gray-900">Cancel Booking</h2>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-gray-800">Booking #{booking.bookingNumber}</p>
                <p className="text-gray-600">{booking.vehicleName} · {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                {booking.advanceAmount > 0 && (
                  <p className="text-orange-600 font-medium">Paid: ₹{booking.advanceAmount.toLocaleString('en-IN')} — refund subject to cancellation policy</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      onClick={() => { setSelectedCancelReason(reason); setCancelError(null); if (reason !== 'Other') setOtherCancelReason(''); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCancelReason === reason ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedCancelReason === reason ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                        {selectedCancelReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${selectedCancelReason === reason ? 'text-red-700 font-medium' : 'text-gray-700'}`}>{reason}</span>
                    </label>
                  ))}
                </div>
                {selectedCancelReason === 'Other' && (
                  <textarea
                    value={otherCancelReason}
                    onChange={(e) => setOtherCancelReason(e.target.value)}
                    placeholder="Please describe your reason..."
                    rows={3}
                    autoFocus
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  />
                )}
              </div>
              {cancelError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {cancelError}
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <strong>Note:</strong> This action cannot be undone. The vendor will be notified immediately.
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !selectedCancelReason || (selectedCancelReason === 'Other' && !otherCancelReason.trim())}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (<><Loader2 className="w-4 h-4 animate-spin" />Cancelling...</>) : (<><XCircle className="w-4 h-4" />Yes, Cancel</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rating Modal ── */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-sm text-gray-500 mt-1">How was your bike rental?</p>
            </div>
            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 transition hover:scale-110">
                  <Star className={cn('w-9 h-9 transition', star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300')} />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
