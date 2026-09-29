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
  CreditCard,
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
import { quoteDisplay } from '@/lib/quote-font';
import BookingPaymentSafetyNotice from '@/components/customer/BookingPaymentSafetyNotice';
import RefundStatusCard from '@/components/customer/RefundStatusCard';

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

// Presentation only — maps the existing booking status onto the hero progress
// rail. Adds no state and changes no behaviour.
const BOOKING_STEPS = ['Booked', 'Advance Payment', 'Vendor Confirms', 'Ready for Pickup', 'Trip Ongoing', 'Completed'];

const STEP_INDEX_BY_STATUS: Partial<Record<BikeBookingStatus, number>> = {
  PENDING: 0,
  PENDING_PAYMENT: 1,
  PAYMENT_SUBMITTED: 1,
  PAYMENT_VERIFIED: 2,
  PENDING_VENDOR: 2,
  BROADCASTED: 2,
  ACCEPTED: 3,
  READY_FOR_PICKUP: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

// The rail describes a booking moving forward — it says nothing useful once a
// booking is cancelled, expired or refunded, so it is hidden for those.
const RAIL_HIDDEN_STATUSES: BikeBookingStatus[] = ['CANCELLED', 'EXPIRED', 'REFUNDED'];

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
            pickupAddress: apiBooking.pickupAddress || apiBooking.locationName || '',
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
      <div className={`${quoteDisplay.variable} min-h-screen flex items-center justify-center bg-gray-50`}>
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="quote-serif text-[30px] font-medium text-gray-900 mb-2">Booking Not Found</h1>
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
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(680px 300px at 90% -30%, rgba(255,255,255,.24), transparent 60%),' +
              'radial-gradient(460px 240px at 4% 130%, rgba(1,35,20,.6), transparent 58%),' +
              'repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 1px, transparent 1px 46px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          {/* Back link + status on one line */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <div className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </div>
          </div>

          {/* Title + stat strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Bike className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="quote-serif text-[30px] sm:text-[38px] font-medium leading-tight tracking-[-0.01em]">{booking.vehicleName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.location && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Duration</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
              </div>
              <div className="border-l border-white/[0.12] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Grand Total</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{(booking.grandTotal || booking.totalAmount)?.toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Advance {booking.advancePercentage}%</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{booking.advanceAmount?.toLocaleString('en-IN') || '—'}</p>
              </div>
              <div className="border-l border-t border-white/[0.12] px-5 py-3 sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Daily Rate</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{booking.dailyRate?.toLocaleString('en-IN') || '—'}</p>
              </div>
            </div>
          </div>

          {/* Progress rail — reflects booking.status, no new state */}
          {!RAIL_HIDDEN_STATUSES.includes(booking.status) && (
          <div className="mt-6 border-t border-white/[0.13] pt-5">
            <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_82%,transparent)] md:[mask-image:none]">
              {BOOKING_STEPS.map((step, i) => {
                const currentIdx = STEP_INDEX_BY_STATUS[booking.status] ?? 0;
                const isDone = i < currentIdx;
                const isNow = i === currentIdx;
                return (
                  <div key={step} className="relative min-w-[104px] flex-1 text-center">
                    {i > 0 && (
                      <span className="absolute top-[10px] left-[calc(-50%+12px)] right-[calc(50%+12px)] h-0.5 overflow-hidden rounded-sm bg-white/20">
                        <span className={`block h-full rounded-sm bg-white transition-[width] duration-700 ${i <= currentIdx ? 'w-full' : 'w-0'}`} />
                      </span>
                    )}
                    <span
                      className={`relative z-10 mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition ${
                        isNow
                          ? 'border-amber-100 bg-amber-100 text-amber-800 shadow-[0_0_0_5px_rgba(254,243,199,.2)]'
                          : isDone
                            ? 'border-white bg-white text-[#056B3E]'
                            : 'border-white/30 bg-white/[0.16] text-white/50'
                      }`}
                    >
                      {isDone && <CheckCircle className="h-3 w-3" strokeWidth={3.5} />}
                      {isNow && <Clock className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className={`mt-2.5 block whitespace-nowrap text-[11px] ${isNow ? 'font-bold text-white' : isDone ? 'font-semibold text-white/90' : 'font-semibold text-white/[0.55]'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">

        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">

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

        {/* Payment Required — split card: amount stub on the left, the existing
            BookingPayment widget (embedded, so it keeps its own Razorpay and
            manual-UPI flows) on the right. When the much taller UPI / bank
            transfer panel is showing, the `:has()` rule below drops the card
            back to a single column, so the stub becomes a band across the top
            instead of a half-empty green column. */}
        {showPaymentConfirmation && (
          <section className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_20px_52px_-22px_rgba(1,35,20,.45)] lg:grid-cols-[1.08fr_0.92fr] lg:has-[[data-manual-payment]]:grid-cols-1">
            {/* Amount stub. Its two blocks sit side by side when the card is
                full width and stack when it is a narrow column — no mode-specific
                classes needed. */}
            <div className="relative overflow-hidden bg-[linear-gradient(155deg,#01301B_0%,#056B3E_58%,#078F53_100%)] px-5 py-5 text-white">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(520px 240px at 100% -30%, rgba(42,210,145,.42), transparent 62%),' +
                    'repeating-linear-gradient(128deg, rgba(255,255,255,.045) 0 1px, transparent 1px 38px)',
                }}
              />
              <div className="relative z-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                {/* amount */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[13px] font-extrabold">Complete Your Booking</span>
                      <span className="mt-px block text-[11px] text-white/[0.66]">Pay advance to confirm</span>
                    </span>
                  </div>
                  <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Advance Payment</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[38px] font-extrabold leading-none tracking-[-0.035em] tabular-nums sm:text-[44px]">
                      ₹{booking.advanceAmount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs tabular-nums text-white/[0.68]">
                      of ₹{(booking.grandTotal || booking.totalAmount)?.toLocaleString('en-IN')} total ·{' '}
                      <span className="font-bold text-white">{booking.advancePercentage}% advance</span>
                    </span>
                  </div>
                </div>

                {/* split + vehicle */}
                <div className="w-full min-w-0 sm:w-[300px]">
                  <div className="h-[5px] overflow-hidden rounded bg-white/[0.16]">
                    <span
                      className="block h-full rounded bg-[linear-gradient(90deg,#2AD291,#fff)]"
                      style={{ width: `${Math.min(100, Math.round((booking.advanceAmount / (booking.grandTotal || booking.totalAmount || 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between gap-2.5 text-[10.5px] tabular-nums text-white/60">
                    <span>Paying now ₹{booking.advanceAmount?.toLocaleString('en-IN')}</span>
                    <span>Balance ₹{(booking.totalAmount - booking.advanceAmount)?.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1.5 text-xs font-semibold">
                    <Bike className="h-3.5 w-3.5" />
                    {booking.vehicleName}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment panel — full width, centred. Holds both the Razorpay view
                and the taller UPI / bank-transfer view without reflowing. */}
            <div className="flex flex-col justify-center px-4 py-5 sm:px-5">
              <div className="mx-auto w-full max-w-4xl">
                <div className="mb-4 flex items-center justify-between gap-2.5">
                  <p className="text-[15px] font-extrabold text-gray-900">Choose how to pay</p>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1 text-[11.5px] font-bold text-[#056B3E]">
                    <Shield className="h-3.5 w-3.5" />
                    Secure
                  </span>
                </div>
                {/* The embedded widget ships at "compact" sizing — a small
                    button with 8px gaps — which reads as cramped next to the
                    amount panel. Scale the button and open up the spacing from
                    here, so the shared component keeps its compact defaults for
                    every other caller.
                      [&>div]        → RazorpayPayment root
                      [&>div>button] → Pay Securely
                      [&>div>div]    → the method pills and the Razorpay line
                      [&>button]     → "Having trouble?" fallback link */}
                <div
                  className="
                    [&>div>button]:rounded-2xl [&>div>button]:py-4 [&>div>button]:text-[15px]
                    [&>div>div]:mt-4 [&>div>div]:gap-2
                    [&_span]:text-[11.5px]
                    [&>button]:mt-5 [&>button]:border-t [&>button]:border-gray-100 [&>button]:pt-4
                    [&>button]:text-[12.5px] [&>button]:text-gray-500 [&>button]:hover:text-[#056B3E]
                  "
                >
                  <BookingPayment
                    bookingId={booking.id}
                    bookingType="bike"
                    amount={booking.advanceAmount}
                    bookingNumber={booking.bookingNumber}
                    onSuccess={() => window.location.reload()}
                    embedded
                  />
                </div>
              </div>
            </div>
          </section>
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
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#056B3E,#09B368)] p-5 text-white shadow-[0_18px_44px_-14px_rgba(9,179,104,.5)]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(420px 180px at 90% -20%, rgba(255,255,255,.25), transparent 60%)' }}
            />
            <div className="relative z-10">
              <p className="text-white/[0.72] text-[10.5px] font-extrabold uppercase tracking-[0.12em]">Trip Start OTP</p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3.5">
                <span className="flex gap-2">
                  {tripOtp.split('').map((d, i) => (
                    <span
                      key={i}
                      className="flex h-[52px] w-11 items-center justify-center rounded-xl border border-white/[0.28] bg-white/[0.16] text-2xl font-extrabold tabular-nums"
                    >
                      {d}
                    </span>
                  ))}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(tripOtp); setOtpCopied(true); setTimeout(() => setOtpCopied(false), 2000); }}
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 text-[12.5px] font-bold transition hover:bg-white/[0.32]"
                >
                  {otpCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {otpCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-white/[0.72] text-[11.5px] mt-3">Share this OTP with the vendor at pickup to start your trip</p>
            </div>
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
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC] flex items-center justify-between">
            <p className="quote-serif text-[17px] font-medium text-gray-400">Vehicle Details</p>
            {booking.helmetIncluded && (
              <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold text-[#056B3E]">
                Helmet included
              </span>
            )}
          </div>
          <div className="p-4 flex gap-4 items-center">
            <div className="relative w-32 h-[92px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#E9FAF2] to-[#DCFCE7] flex-shrink-0 border border-gray-100">
              <Image src={booking.vehicleImage} alt={booking.vehicleName} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-gray-900 text-[17px] tracking-tight">{booking.vehicleName}</p>
              <p className="text-[12.5px] text-gray-500 mt-0.5">{booking.vehicleType}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {booking.helmetIncluded && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11px] font-bold text-[#056B3E]">
                    <CheckCircle className="w-3 h-3" /> Helmet Included
                  </span>
                )}
                {booking.extras?.map((extra) => (
                  <span key={extra} className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600">{extra}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Trip Details ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
            <p className="quote-serif text-[17px] font-medium text-gray-400">Trip Details</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              {/* Pickup */}
              <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] p-3.5 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-[22px] h-[22px] bg-[#09B368] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[10.5px] font-extrabold text-[#056B3E] uppercase tracking-[0.09em]">Pickup</p>
                </div>
                <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{formatDate(booking.pickupDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  {formatTime(booking.pickupTime)}{booking.location ? ` · ${booking.location}` : ''}
                </p>
              </div>
              {/* Duration */}
              <div className="flex flex-col items-center gap-1.5 px-1">
                <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1A15] px-3 py-1.5 text-[11.5px] font-bold text-white">
                  <Clock className="w-3 h-3" />
                  {booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}
                </span>
                <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
              </div>
              {/* Drop */}
              <div className="rounded-2xl border border-red-100 bg-red-50 p-3.5 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-[22px] h-[22px] bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[10.5px] font-extrabold text-red-700 uppercase tracking-[0.09em]">Drop-off</p>
                </div>
                <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{formatDate(booking.dropDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  {formatTime(booking.dropTime)}{booking.location ? ` · ${booking.location}` : ''}
                </p>
              </div>
            </div>
            {booking.pickupAddress && (
              <div className="mt-3.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-blue-700">Pickup Address</p>
                <p className="mt-1 text-[13px] leading-relaxed text-blue-900">{booking.pickupAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
            <p className="quote-serif text-[17px] font-medium text-gray-400">Payment Summary</p>
          </div>
          <div className="p-4">
            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
              <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                <span className="text-[12.5px] text-gray-500">Daily Rate × {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              {booking.gstAmount > 0 && (
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">GST (18%)</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.gstAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                <span className="text-sm font-extrabold text-gray-900">Grand Total</span>
                <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{(booking.grandTotal || booking.totalAmount)?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {booking.advanceAmount > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#056B3E]">Advance ({booking.advancePercentage}%)</span>
                  <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.advanceAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#056B3E]">Balance at Pickup</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{(booking.totalAmount - booking.advanceAmount)?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {booking.securityDeposit > 0 && (
              <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-amber-800">
                  <Shield className="w-4 h-4" />
                  Security Deposit
                  <span className="text-[11px] font-medium text-amber-700">(Refundable)</span>
                </span>
                <span className="text-sm font-extrabold tabular-nums text-amber-900">₹{booking.securityDeposit?.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Cancellation Details ── */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="quote-serif text-[17px] font-medium text-red-500 mb-2 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Cancellation Details
            </p>
            <p className="text-xs text-gray-500 mb-1">Reason</p>
            <p className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2 leading-relaxed">{booking.cancellationReason}</p>
          </div>
        )}

        {/* ── Cancel Booking ── */}
        {isActive && (
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100 bg-red-50">
              <p className="quote-serif text-[17px] font-medium text-red-700">Cancel Booking</p>
            </div>
            <div className="p-4">
              <p className="text-[12.5px] leading-relaxed text-gray-500 mb-3">
                Once cancelled, refund will be processed as per vendor&apos;s cancellation policy.
                {booking.cancellationPolicy ? ` ${booking.cancellationPolicy}` : ''}
              </p>
              <button
                onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition text-[13.5px] font-bold"
              >
                <XCircle className="w-4 h-4" />
                Cancel This Booking
              </button>
            </div>
          </div>
        )}
        </div>
        {/* ══ /Left column ══ */}

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">

          {/* ── Vendor Details ── */}
          {booking.vendorName && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
                <p className="quote-serif text-[17px] font-medium text-gray-400">Vendor Details</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-[46px] h-[46px] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] border border-[#C8F1DF] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#056B3E]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-900 text-[15px] leading-tight">{booking.vendorName}</p>
                    {booking.vendorRating > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(booking.vendorRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-[11.5px] font-semibold text-gray-500 ml-1.5">{booking.vendorRating}</span>
                        {booking.vendorReviewCount > 0 && <span className="text-[11.5px] text-gray-400">· {booking.vendorReviewCount} reviews</span>}
                      </div>
                    )}
                    {booking.vendorPhone && <p className="text-xs text-gray-500 mt-1 tabular-nums">{booking.vendorPhone}</p>}
                    {booking.vendorAddress && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{booking.vendorAddress}</p>}
                  </div>
                </div>
                {booking.vendorPhone && (
                  <a
                    href={`tel:${booking.vendorPhone}`}
                    className="mt-3.5 flex items-center justify-center gap-2 px-4 py-3 bg-[#09B368] text-white rounded-xl hover:bg-[#078F53] transition text-[13.5px] font-bold shadow-lg shadow-[#09B368]/25"
                  >
                    <Phone className="w-4 h-4" />
                    Call Vendor
                  </a>
                )}
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


          {/* ── Booking Info ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
              <p className="quote-serif text-[17px] font-medium text-gray-400">Booking Info</p>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Booking No.</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-900">{booking.bookingNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Booked On</span>
                  <span className="text-[13px] font-bold text-gray-900">{formatDate(booking.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Payment Status</span>
                  <span className="text-[13px] font-bold text-gray-900">{booking.paymentStatus}</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Amount Paid</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-900">₹{booking.amountPaid?.toLocaleString('en-IN')}</span>
                </div>
                {booking.paymentMethod && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Payment Method</span>
                    <span className="text-[13px] font-bold text-gray-900">{booking.paymentMethod}</span>
                  </div>
                )}
                {booking.transactionId && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Transaction ID</span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-900">{booking.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
              <p className="quote-serif text-[17px] font-medium text-gray-400">Need a hand</p>
            </div>
            <div className="p-4 flex flex-col gap-2.5">
              {booking.status === 'COMPLETED' && !booking.rating && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-[13.5px] shadow-md transition"
                >
                  <Star className="w-4 h-4 fill-white" />
                  Rate Your Experience
                </button>
              )}
              <Link
                href="/customer/helpdesk"
                className="py-3 bg-[#09B368] hover:bg-[#078F53] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-[13.5px] shadow-lg shadow-[#09B368]/25 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Need Help?
              </Link>
              <Link
                href="/customer/dashboard"
                className="py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center text-[13.5px] hover:bg-gray-50 hover:border-[#96E4C2] hover:text-[#056B3E] transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </aside>
        {/* ══ /Right rail ══ */}
      </div>

      {/* Outside the grid on purpose: the right rail is sticky, and a sticky
          grid item paints over anything sharing its rows. Full content width. */}
      <div className="max-w-7xl mx-auto space-y-5 px-4 pb-5 sm:px-6 lg:px-8">
        {/* Renders itself away when there is no refund to talk about. A refund
            is owed whether or not a vendor was ever assigned, so it does not
            sit behind the notice's vendor guard. */}
        <RefundStatusCard source="bike_bookings" bookingId={booking.id} />
        {booking.vendorName && <BookingPaymentSafetyNotice />}
      </div>

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="quote-serif font-medium text-gray-900 text-[21px]">Cancel Booking</h2>
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
              <h2 className="quote-serif text-[26px] font-medium text-gray-900">Rate Your Experience</h2>
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
