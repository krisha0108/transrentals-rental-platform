// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key,
  MessageCircle,
  Gift,
  Copy,
  RefreshCw,
  CreditCard,
  Building2,
  Wallet,
  Download,
  FileText,
  Send,
  X,
  Loader2,
} from 'lucide-react';
// Chat will be inline - no external component needed
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';

interface BookingDetail {
  id: string;
  bookingNumber: string;
  customerId?: string;
  tripType: string;
  occasion: string | null;
  carCategory: string;
  carCategoryName: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  customerName: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress: string | null;
  dropCity: string | null;
  dropAddress: string | null;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  tripDays: number;
  tripHours: number | null;
  needDecoration: boolean;
  decorationType: string | null;
  requirements: string | null;
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  gstAmount: number;
  grandTotal: number;
  advanceAmount: number;
  advancePercent: number;
  balanceAmount: number;
  advancePaid: number;
  status: string;
  paymentStatus: string | null;
  driverName: string | null;
  driverPhone: string | null;
  tripStartOtp: string | null;
  tripEndOtp: string | null;
  rating: number | null;
  review: string | null;
  vendors: {
    id: string;
    businessName: string;
    phone: string;
    rating: number | null;
  } | null;
  acceptedQuote: {
    quoteNumber: string;
    vehicleName: string;
    inclusions: string[];
    exclusions: string[];
    vendorMessage: string | null;
  } | null;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  PENDING_PAYMENT: {
    label: 'Payment Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Wallet,
    description: 'Please pay the advance amount to confirm your booking',
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Clock,
    description: 'Your payment is being verified. We will confirm shortly.',
  },
  ADVANCE_PAID: {
    label: 'Advance Paid',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Your advance payment is received. Booking confirmed!',
  },
  CONFIRMED: {
    label: 'Booking Confirmed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Your booking is confirmed. Driver will be assigned soon.',
  },
  DRIVER_ASSIGNED: {
    label: 'Driver Assigned',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: User,
    description: 'Your driver is ready. When driver asks, share the OTP shown below.',
  },
  IN_PROGRESS: {
    label: 'Trip in Progress',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Car,
    description: 'Enjoy your luxurious journey!',
  },
  COMPLETED: {
    label: 'Trip Completed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: CheckCircle,
    description: 'Thank you for choosing our premium service',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: 'This booking has been cancelled',
  },
};

const TRIP_TYPES: Record<string, string> = {
  local: 'Local',
  outstation: 'Outstation',
  airport: 'Airport Transfer',
};

interface PaymentSettings {
  upiId: string;
  upiName: string;
  qrCode: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankHolder: string;
  bankBranch: string;
  instructions: string;
}

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

// Generate UPI payment link with amount
const generateUpiLink = (upiId: string, name: string, amount: number, bookingNumber: string) => {
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(`Advance for ${bookingNumber}`);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&tn=${encodedNote}&cu=INR`;
};

// Generate QR code URL using a free API
const generateQrCodeUrl = (data: string, size: number = 200) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
};

function BookingDetailContent({ bookingId }: { bookingId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === 'true';

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [copied, setCopied] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/luxury-bookings/${bookingId}`);
      const data = await res.json();

      if (data.success) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Booking not found');
      }
    } catch (err) {
      setError('Failed to fetch booking');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success) {
        setPaymentSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch payment settings');
    }
  };

  const fetchChatMessages = async (showLoader = true) => {
    if (!booking?.id || !booking?.vendor?.id) return;

    try {
      if (showLoader) setIsLoadingMessages(true);
      console.log('[Customer Web] Fetching messages for:', {
        bookingId: booking.id,
        vendorId: booking.vendor.id,
        customerId: booking.customerId || 'empty'
      });
      const res = await fetch(
        `/api/customer/booking/${booking.id}/chat/${booking.vendor.id}?customer_id=${booking.customerId || ''}`
      );
      const data = await res.json();
      console.log('[Customer Web] Messages received:', data.messages?.length || 0);

      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !booking?.id || !booking?.vendor?.id) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch(`/api/customer/booking/${booking.id}/chat/${booking.vendor.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newChatMessage.trim(),
          customer_id: booking.customerId || '',
          customer_name: booking.customerName
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewChatMessage('');
        fetchChatMessages(); // Refresh messages
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchPaymentSettings();
  }, [bookingId]);

  useEffect(() => {
    if (showChat && booking?.id && booking?.vendor?.id) {
      fetchChatMessages(true); // Show loader on initial load
      // Poll for new messages every 5 seconds without showing loader
      const interval = setInterval(() => fetchChatMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [showChat, booking?.id, booking?.vendor?.id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/luxury-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_payment',
          paymentMethod,
          transactionId: transactionId.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Payment submitted! We will verify and confirm shortly.');
        setShowPaymentModal(false);
        fetchBooking();
      } else {
        alert(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      alert('Failed to submit payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatRawTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleCancel = async () => {
    const finalReason = selectedCancelReason === 'Other' ? otherCancelReason.trim() : selectedCancelReason;
    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other' ? 'Please describe your reason' : 'Please select a reason for cancellation');
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/luxury-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason, cancelledBy: 'CUSTOMER' }),
      });

      const data = await res.json();

      if (data.success) {
        setShowCancelModal(false);
        setSelectedCancelReason('');
        setOtherCancelReason('');
        fetchBooking();
      } else {
        setCancelError(data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/luxury-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate', rating, review }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Thank you for your rating!');
        setShowRatingModal(false);
        fetchBooking();
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center p-4`}>
        <div className="text-center">
          <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-2">{error || 'Booking not found'}</h2>
          <Link href="/customer/dashboard" className="text-amber-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <button
              onClick={fetchBooking}
              className="p-2 text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="quote-serif text-[26px] font-medium">#{booking.bookingNumber}</h1>
              <p className="text-amber-200 text-sm">Luxury Car Booking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* New Booking Confirmation */}
        {isNew && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="quote-serif font-medium text-green-800 text-[23px] mb-1">Booking Created!</h2>
                <p className="text-green-700">
                  Your luxury car booking is created. Please pay the advance to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className={`${statusConfig.bgColor} rounded-xl p-6`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white flex-shrink-0">
              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${statusConfig.color}`}>{statusConfig.label}</h2>
              <p className="text-gray-700">{statusConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Payment Section - Show for PENDING_PAYMENT status */}
        {booking.status === 'PENDING_PAYMENT' && (
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <p className="font-bold text-gray-900 mb-1">Pay Advance to Confirm</p>
            <p className="text-sm text-gray-500 mb-3">{booking.advancePercent}% advance — ₹{booking.advanceAmount?.toLocaleString()}</p>
            <BookingPayment
              bookingId={booking.id}
              bookingType="luxury"
              amount={booking.advanceAmount || 0}
              bookingNumber={booking.bookingNumber}
              serviceSlug="luxury-car-rental"
              onSuccess={() => window.location.reload()}
            />
          </div>
        )}

        {/* Payment Submitted - Waiting for verification */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-blue-800">Payment Under Verification</p>
                <p className="text-blue-700 text-sm">
                  We are verifying your payment. You will receive confirmation shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OTP Card - Driver will ask for this */}
        {booking.status === 'DRIVER_ASSIGNED' && (
          booking.tripStartOtp ? (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-6 text-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-8 h-8" />
                  <div>
                    <p className="text-sm font-medium">Your Trip OTP</p>
                    <p className="text-sm opacity-80">Driver will ask for this OTP to start trip</p>
                  </div>
                </div>
                <div className="text-4xl font-mono font-bold tracking-widest">{booking.tripStartOtp}</div>
              </div>
              <p className="mt-3 text-sm bg-white/20 rounded-lg p-2 text-center">
                Keep this OTP ready. Share it verbally with the driver when asked.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold">Driver Assigned</p>
                  <p className="text-sm opacity-80">
                    {booking.driverName} will generate OTP when ready to start. Refresh page to see OTP.
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-amber-900 px-4 py-3">
            <h3 className="quote-serif font-medium text-amber-200 flex items-center gap-2 text-[21px]">
              <Crown className="w-4 h-4" />
              Your Luxury Vehicle
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
                <Car className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h4 className="quote-serif font-medium text-[26px] text-gray-900">
                  {booking.vehicleName || booking.carCategoryName || booking.carCategory}
                </h4>
                {booking.vehicleNumber && (
                  <p className="font-mono text-sm text-gray-600">{booking.vehicleNumber}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <span className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
                {TRIP_TYPES[booking.tripType] || booking.tripType}
              </span>
              {booking.occasion && (
                <span className="flex items-center gap-1 text-sm bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full">
                  <Gift className="w-4 h-4" />
                  {booking.occasion}
                </span>
              )}
              {booking.needDecoration && (
                <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
                  {booking.decorationType || 'Decoration'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Driver Details */}
        {booking.driverName && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="quote-serif font-medium text-gray-900 flex items-center gap-2 text-[21px]">
                <Star className="w-4 h-4 text-amber-500" />
                Your Driver
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {booking.driverName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="quote-serif font-medium text-[23px] text-gray-900">{booking.driverName}</h4>
                  {booking.vendor && (
                    <p className="text-gray-500 flex items-center gap-1">
                      {booking.vendor.businessName}
                      {booking.vendor.rating && (
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {booking.vendor.rating}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {booking.driverPhone && (
                <a
                  href={`tel:${booking.driverPhone}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-gray-900 font-bold rounded-xl hover:bg-amber-600 transition"
                >
                  <Phone className="w-5 h-5" />
                  Call Driver
                </a>
              )}
            </div>
          </div>
        )}

        {/* Trip Details */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="quote-serif font-medium text-gray-900 text-[21px]">Trip Details</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium text-gray-900">{booking.pickupAddress || booking.pickupCity}</p>
              </div>
            </div>

            {booking.dropAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Drop</p>
                  <p className="font-medium text-gray-900">{booking.dropAddress || booking.dropCity}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  at {formatRawTime(booking.pickupTime)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">
                  {booking.tripHours ? `${booking.tripHours} hours` : `${booking.tripDays} day(s)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="quote-serif font-medium text-gray-900 text-[21px]">Fare Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">₹{booking.baseAmount?.toLocaleString()}</span>
              </div>
              {booking.chauffeurCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Chauffeur Charges</span>
                  <span className="font-medium">₹{booking.chauffeurCharges?.toLocaleString()}</span>
                </div>
              )}
              {booking.decorationCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Decoration</span>
                  <span className="font-medium">₹{booking.decorationCharges?.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-base">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-amber-600">₹{(booking.baseAmount + (booking.chauffeurCharges || 0) + (booking.decorationCharges || 0))?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Advance ({booking.advancePercent}%)</span>
                <span className="font-medium">₹{booking.advanceAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-medium">₹{booking.balanceAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Download - Show after advance is paid */}
        {['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="quote-serif font-medium text-gray-900 text-[21px]">Booking Invoice</h3>
                    <p className="text-sm text-gray-600">Download your payment receipt</p>
                  </div>
                </div>
                <a
                  href={`/api/luxury-bookings/${booking.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Details */}
        {booking.vendor && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="quote-serif font-medium text-gray-900 flex items-center gap-2 text-[21px]">
                <Building2 className="w-4 h-4" />
                Service Provider
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{booking.vendor.businessName}</p>
                  {booking.vendor.rating && (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400" />
                      {booking.vendor.rating} Rating
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${booking.vendor.phone}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <button
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition flex items-center justify-center gap-2 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Details */}
        {booking.status === 'CANCELLED' && booking.cancelledAt && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="quote-serif text-[17px] font-medium text-red-600 mb-3 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Cancellation Details
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cancelled At</span>
                <span className="text-xs font-semibold text-gray-800">
                  {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                </span>
              </div>
              {booking.cancelledBy && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Cancelled By</span>
                  <span className="text-xs font-semibold text-gray-800 capitalize">{booking.cancelledBy}</span>
                </div>
              )}
              {booking.cancellationReason && (
                <div className="pt-1 border-t border-red-200 mt-1">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2">{booking.cancellationReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rate Trip */}
        {booking.status === 'COMPLETED' && !booking.rating && (
          <button
            onClick={() => setShowRatingModal(true)}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            Rate Your Experience
          </button>
        )}

        {/* Cancel Option */}
        {['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
          <div className="bg-white rounded-xl border border-red-100 p-4">
            <h3 className="quote-serif text-[17px] font-medium text-gray-400 mb-1">Cancel Booking</h3>
            <p className="text-sm text-gray-500 mb-3">
              Once cancelled, refund will be processed as per vendor's cancellation policy.
            </p>
            <button
              onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Cancel This Booking
            </button>
          </div>
        )}

        {/* Support */}
        <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
          <p className="text-sm text-amber-800 mb-1">Need help with your booking?</p>
          <a href="tel:+919737965551" className="text-amber-700 font-bold hover:underline">
            Call Concierge: +91 97379 65551
          </a>
        </div>
      </div>

      {/* Payment Modal - replaced by BookingPayment component */}
      {false && showPaymentModal && paymentSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="quote-serif text-[26px] font-medium mb-2 text-center">Pay Advance</h2>
              <p className="text-center text-3xl font-bold text-amber-600 mb-1">
                ₹{booking.advanceAmount?.toLocaleString()}
              </p>
              <p className="text-center text-sm text-gray-500 mb-6">
                {booking.advancePercent}% of ₹{booking.grandTotal?.toLocaleString()}
              </p>

              {/* Payment Methods */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  {['UPI', 'Bank Transfer'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
                        paymentMethod === method
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'UPI' && paymentSettings.upiId && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    {/* QR Code */}
                    <div className="flex justify-center mb-4">
                      {paymentSettings.qrCode ? (
                        <img
                          src={paymentSettings.qrCode}
                          alt="UPI QR Code"
                          className="w-48 h-48 rounded-lg border-2 border-amber-200"
                        />
                      ) : (
                        <img
                          src={generateQrCodeUrl(
                            generateUpiLink(
                              paymentSettings.upiId,
                              paymentSettings.upiName,
                              booking.advanceAmount || 0,
                              booking.bookingNumber
                            ),
                            200
                          )}
                          alt="UPI QR Code"
                          className="w-48 h-48 rounded-lg border-2 border-amber-200"
                        />
                      )}
                    </div>
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Scan QR code to pay ₹{booking.advanceAmount?.toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-500 mb-2">Or pay via UPI ID</p>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <span className="font-mono font-medium">{paymentSettings.upiId}</span>
                      <button
                        onClick={() => handleCopy(paymentSettings.upiId, 'UPI')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    {copied === 'UPI' && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                  </div>
                )}

                {paymentMethod === 'Bank Transfer' && paymentSettings.bankAccount && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Account Holder Name</p>
                      <p className="font-medium">{paymentSettings.bankHolder}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Account Number</p>
                        <p className="font-mono font-medium">{paymentSettings.bankAccount}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentSettings.bankAccount, 'Account')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">IFSC Code</p>
                        <p className="font-mono font-medium">{paymentSettings.bankIfsc}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentSettings.bankIfsc, 'IFSC')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bank</p>
                      <p className="font-medium">{paymentSettings.bankName}</p>
                    </div>
                    {paymentSettings.bankBranch && (
                      <div>
                        <p className="text-xs text-gray-500">Branch</p>
                        <p className="font-medium">{paymentSettings.bankBranch}</p>
                      </div>
                    )}
                    {copied && copied !== 'UPI' && <p className="text-xs text-green-600">{copied} Copied!</p>}
                  </div>
                )}

                {/* Payment Instructions */}
                {paymentSettings.instructions && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-sm text-amber-800">{paymentSettings.instructions}</p>
                  </div>
                )}
              </div>

              {/* Transaction ID Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction reference"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitPayment}
                  disabled={submittingPayment || !transactionId.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingPayment ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
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
                <p className="text-gray-600">{booking.vehicleName || booking.carCategory} · {booking.tripType}</p>
                {booking.advancePaid != null && booking.advancePaid > 0 && (
                  <p className="text-amber-600 font-medium">Paid: ₹{booking.advancePaid.toLocaleString('en-IN')} — refund subject to cancellation policy</p>
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
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedCancelReason === reason ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
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
                onClick={handleCancel}
                disabled={cancelling || !selectedCancelReason || (selectedCancelReason === 'Other' && !otherCancelReason.trim())}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (<><Loader2 className="w-4 h-4 animate-spin" />Cancelling...</>) : (<><XCircle className="w-4 h-4" />Yes, Cancel</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="quote-serif text-[26px] font-medium mb-4 text-center">Rate Your Experience</h2>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-xl disabled:opacity-50"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && booking && booking.vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-amber-500 to-yellow-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="quote-serif font-medium text-gray-900 text-[21px]">{booking.vendor.businessName}</h3>
                  <p className="text-sm text-gray-700">Luxury Booking #{booking.bookingNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Start a conversation with your service provider</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'customer' || msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.senderType === 'customer' || msg.sender_type === 'customer'
                          ? 'bg-amber-500 text-gray-900'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message || msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderType === 'customer' || msg.sender_type === 'customer'
                          ? 'text-gray-700'
                          : 'text-gray-500'
                      }`}>
                        {new Date(msg.createdAt || msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={isSendingMessage || !newChatMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LuxuryBookingDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <BookingDetailContent bookingId={params.id} />
    </Suspense>
  );
}
