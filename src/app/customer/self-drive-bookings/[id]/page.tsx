'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  IndianRupee,
  Shield,
  AlertCircle,
  Gauge,
  CreditCard,
  Settings2,
  Fuel,
  Users,
  FileText,
  Copy,
  ExternalLink,
  X,
  Loader2,
  QrCode,
  Banknote,
  Check,
  Upload,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerBookingChat from '@/components/customer/CustomerBookingChat';
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import BookingPaymentSafetyNotice from '@/components/customer/BookingPaymentSafetyNotice';
import RefundStatusCard from '@/components/customer/RefundStatusCard';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  upiId?: string;
  upiQrCode?: string;
  isPrimary: boolean;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationName: string;
  requestedVehicleName: string;
  requestedBrand?: string;
  requestedCategory?: string;
  requestedTransmission?: string;
  requestedFuelType?: string;
  requestedSeats?: number;
  numberOfVehicles?: number;
  assignedVehicleName?: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  pickupAddress?: string;
  dropAddress?: string;
  isDeliveryRequested: boolean;
  dailyRate: number;
  baseAmount: number;
  gstAmount: number;
  platformFee: number;
  securityDeposit: number;
  grandTotal: number;
  advanceAmount?: number;
  advancePercentage?: number;
  paidAmount?: number;
  refundAmount?: number;
  refundTransactionId?: string;
  kmLimitPerDay: number;
  extraKmRate: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  tripStartOtp?: string;
  customerNotes?: string;
  vendorNotes?: string;
  isB2B?: boolean;
  vendor?: {
    businessName: string;
    phone?: string;
  };
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  acceptedQuote?: {
    id: string;
    termsConditions?: string;
    inclusions?: string;
    exclusions?: string;
    vendorMessage?: string;
  } | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Verification', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  PENDING_VENDOR:   { label: 'Finding Vendor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  BROADCASTED:      { label: 'Finding Vendor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CONFIRMED:        { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  ACCEPTED:         { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  IN_PROGRESS:      { label: 'Trip Started', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED:        { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED:        { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Presentation only — maps the existing booking status onto the hero progress
// rail. Adds no state, no data and changes no behaviour.
const BOOKING_STEPS = ['Booked', 'Advance Payment', 'Confirmed', 'Ready for Pickup', 'Trip Ongoing', 'Completed'];

const STEP_INDEX_BY_STATUS: Record<string, number> = {
  PENDING_PAYMENT: 1,
  PAYMENT_SUBMITTED: 1,
  PAYMENT_VERIFIED: 2,
  PENDING_VENDOR: 2,
  BROADCASTED: 2,
  ACCEPTED: 2,
  CONFIRMED: 2,
  READY_FOR_PICKUP: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

const RAIL_HIDDEN_STATUSES = ['CANCELLED', 'EXPIRED', 'REFUNDED'];

const CANCEL_REASONS = [
  'Plans changed / Trip cancelled',
  'Found a better vehicle or deal',
  'Booked by mistake',
  'Emergency or urgent situation',
  'Pickup date or time needs to change',
  'Vehicle does not meet my requirements',
  'Payment issue',
  'Other',
];

export default function CustomerSelfDriveBookingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankAccount | null>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);

  // Cancel booking state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/customer/car-bookings/${id}`);
        const data = await response.json();

        if (data.success) {
          // Map assignedVendor to vendor for display
          const bookingData = {
            ...data.booking,
            vendor: data.booking.assignedVendor,
          };
          setBooking(bookingData);
        } else {
          setError(data.error || 'Failed to load booking');
        }
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    if (label) {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  // Fetch bank details for payment
  const fetchBankDetails = async () => {
    setLoadingBankDetails(true);
    try {
      const res = await fetch('/api/payment-details?service=self-drive-car-rentals');
      const data = await res.json();
      if (data.success && data.primaryAccount) {
        setBankDetails(data.primaryAccount);
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    } finally {
      setLoadingBankDetails(false);
    }
  };

  // Generate QR code URL from UPI ID
  const getQRCodeUrl = (upiId: string, amount: number) => {
    const upiUrl = `upi://pay?pa=${upiId}&pn=TransRentals&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  };

  // Open payment modal
  const openPaymentModal = async () => {
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setPaymentError(null);
    setPaymentReference('');
    if (!bankDetails) {
      await fetchBankDetails();
    }
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    if (paymentSuccess) {
      // Refresh booking data
      window.location.reload();
    }
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!paymentReference.trim()) {
      setPaymentError('Please enter the payment reference/UTR number');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/self-drive-bookings/${id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking?.advanceAmount || booking?.grandTotal,
          paymentReference: paymentReference.trim(),
          paymentMethod: 'UPI',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentSuccess(true);
      } else {
        setPaymentError(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    const finalReason = selectedCancelReason === 'Other'
      ? otherCancelReason.trim()
      : selectedCancelReason;

    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other'
        ? 'Please describe your reason'
        : 'Please select a reason for cancellation');
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/self-drive-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      });
      const data = await res.json();
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

  if (isLoading) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center p-4`}>
        <div className="bg-white rounded-xl p-8 text-center border max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="quote-serif font-medium text-gray-900 mb-2 text-[21px]">Booking Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'This booking could not be loaded'}</p>
          <Link
            href="/customer/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || {
    label: booking.status.replace(/_/g, ' '),
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  };

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(680px 300px at 92% -30%, rgba(42,210,145,.34), transparent 60%),' +
              'radial-gradient(460px 240px at 2% 130%, rgba(1,20,11,.7), transparent 58%),' +
              'repeating-linear-gradient(115deg, rgba(255,255,255,.045) 0 1px, transparent 1px 46px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <span className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Car className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="quote-serif text-[30px] sm:text-[38px] font-medium leading-tight tracking-[-0.01em]">
                  {booking.assignedVehicleName || booking.requestedVehicleName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.locationName && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.locationName}
                    </span>
                  )}
                  <span className="text-xs text-white/[0.62]">· Self-Drive Car Rental</span>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.56] whitespace-nowrap">Duration</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
              </div>
              <div className="border-l border-white/[0.12] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.56] whitespace-nowrap">Total to Pay</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{((booking.grandTotal || 0) + (booking.securityDeposit || 0)).toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.56] whitespace-nowrap">Advance</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.advanceAmount ? `₹${booking.advanceAmount.toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="border-l border-t border-white/[0.12] px-5 py-3 sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.56] whitespace-nowrap">Daily Rate</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{booking.dailyRate?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Progress rail — derived from booking.status, no new data */}
          {!RAIL_HIDDEN_STATUSES.includes(booking.status) && (
            <div className="mt-6 border-t border-white/[0.13] pt-5">
              <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_84%,transparent)] md:[mask-image:none]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">
          {/* Main Content */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* B2B Post-paid Banner */}
            {booking.isB2B && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-teal-800">B2B Corporate Booking</p>
                  <p className="text-sm text-teal-600">No advance payment required. Post-trip billing.</p>
                </div>
              </div>
            )}

            {/* Payment Action — split card: amount stub beside the actions. When
                the taller UPI / bank-transfer panel is showing, the `:has()` rule
                drops it to one column so the stub becomes a band rather than a
                half-empty green column. */}
            {booking.status === 'PENDING_PAYMENT' && !booking.isB2B && (
              <section className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_20px_52px_-22px_rgba(1,35,20,.45)] lg:grid-cols-[1.08fr_0.92fr] lg:has-[[data-manual-payment]]:grid-cols-1">
                {/* Amount stub */}
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
                      <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                        {booking.advanceAmount ? 'Advance Payment' : 'Amount Payable'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-[38px] font-extrabold leading-none tracking-[-0.035em] tabular-nums sm:text-[44px]">
                          ₹{(booking.advanceAmount || booking.grandTotal)?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs tabular-nums text-white/[0.68]">
                          of ₹{((booking.grandTotal || 0) + (booking.securityDeposit || 0)).toLocaleString('en-IN')} total
                        </span>
                      </div>
                    </div>

                    <div className="w-full min-w-0 sm:w-[300px]">
                      <div className="h-[5px] overflow-hidden rounded bg-white/[0.16]">
                        <span
                          className="block h-full rounded bg-[linear-gradient(90deg,#2AD291,#fff)]"
                          style={{
                            width: `${Math.min(100, Math.round(((booking.advanceAmount || booking.grandTotal || 0) / (((booking.grandTotal || 0) + (booking.securityDeposit || 0)) || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between gap-2.5 text-[10.5px] tabular-nums text-white/60">
                        <span>Paying now ₹{(booking.advanceAmount || booking.grandTotal)?.toLocaleString('en-IN')}</span>
                        <span>
                          Remaining ₹{(((booking.grandTotal || 0) + (booking.securityDeposit || 0)) - (booking.advanceAmount || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1.5 text-xs font-semibold">
                        <Car className="h-3.5 w-3.5" />
                        {booking.assignedVehicleName || booking.requestedVehicleName} · {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action panel */}
                <div className="flex flex-col justify-center px-4 py-5 sm:px-5">
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-4 flex items-center justify-between gap-2.5">
                      <p className="text-[15px] font-extrabold text-gray-900">Choose how to pay</p>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1 text-[11.5px] font-bold text-[#056B3E]">
                        <Shield className="h-3.5 w-3.5" />
                        Secure
                      </span>
                    </div>
                    {/* Scale the shared widget's compact sizing up to match the card */}
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
                        bookingType="self-drive"
                        amount={booking.advanceAmount || booking.grandTotal}
                        bookingNumber={booking.bookingNumber}
                        serviceSlug="self-drive-car-rentals"
                        onSuccess={() => window.location.reload()}
                        embedded
                      />
                    </div>
                    {booking.securityDeposit > 0 && (
                      <p className="mt-3 text-center text-[11.5px] text-gray-400">
                        Security deposit will be refunded after inspection
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Vehicle Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3">
                <h2 className="quote-serif text-[17px] font-medium text-gray-400">Vehicle Details</h2>
                {booking.requestedCategory && (
                  <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold text-[#056B3E]">
                    {booking.requestedCategory}
                  </span>
                )}
              </div>
              <div className="p-4">
                {/* headline: the car itself */}
                <div className="mb-3.5 flex flex-wrap items-center gap-4">
                  <span className="grid h-[100px] w-[150px] flex-none place-items-center rounded-2xl border border-gray-100 bg-gradient-to-br from-[#E9FAF2] to-[#DCFCE7] text-[#078F53]">
                    <Car className="h-[52px] w-[52px]" strokeWidth={1.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="quote-serif text-[21px] font-medium tracking-[-0.01em] text-gray-900">
                      {booking.assignedVehicleName || booking.requestedVehicleName}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {booking.requestedBrand && (
                        <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11.5px] font-bold text-[#056B3E]">
                          {booking.requestedBrand}
                        </span>
                      )}
                      {booking.requestedCategory && (
                        <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11.5px] font-bold text-gray-600">
                          {booking.requestedCategory}
                        </span>
                      )}
                      {booking.numberOfVehicles && booking.numberOfVehicles > 0 && (
                        <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11.5px] font-bold text-gray-600">
                          {booking.numberOfVehicles} Car{booking.numberOfVehicles > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* spec tiles */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {booking.requestedTransmission && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><Settings2 className="h-[15px] w-[15px]" /></span>
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Transmission</p>
                        <p className="mt-0.5 text-[13.5px] font-extrabold text-gray-900">{booking.requestedTransmission}</p>
                      </div>
                    </div>
                  )}
                  {booking.requestedFuelType && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><Fuel className="h-[15px] w-[15px]" /></span>
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Fuel Type</p>
                        <p className="mt-0.5 text-[13.5px] font-extrabold text-gray-900">{booking.requestedFuelType}</p>
                      </div>
                    </div>
                  )}
                  {booking.requestedSeats && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><Users className="h-[15px] w-[15px]" /></span>
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Seats</p>
                        <p className="mt-0.5 text-[13.5px] font-extrabold tabular-nums text-gray-900">{booking.requestedSeats}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><Gauge className="h-[15px] w-[15px]" /></span>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">KM Limit / Day</p>
                      <p className="mt-0.5 text-[13.5px] font-extrabold tabular-nums text-gray-900">{booking.kmLimitPerDay} km</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><IndianRupee className="h-[15px] w-[15px]" /></span>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Extra KM Rate</p>
                      <p className="mt-0.5 text-[13.5px] font-extrabold tabular-nums text-gray-900">₹{booking.extraKmRate}/km</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]"><MapPin className="h-[15px] w-[15px]" /></span>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Location</p>
                      <p className="mt-0.5 text-[13.5px] font-extrabold text-gray-900">{booking.locationName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3">
                <h2 className="quote-serif text-[17px] font-medium text-gray-400">Trip Details</h2>
                {booking.isDeliveryRequested && (
                  <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold text-[#056B3E]">
                    Home Delivery
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  {/* Pickup */}
                  <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] p-3.5 transition hover:-translate-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[#09B368] text-white">
                        <MapPin className="h-3 w-3" />
                      </span>
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[#056B3E]">Pickup</p>
                    </div>
                    <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">
                      {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-gray-600">
                      {formatTime(booking.pickupTime)}{booking.locationName ? ` · ${booking.locationName}` : ''}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col items-center gap-1.5 px-1">
                    <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1A15] px-3 py-1.5 text-[11.5px] font-bold text-white">
                      <Clock className="h-3 w-3" />
                      {booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}
                    </span>
                    <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                  </div>

                  {/* Drop-off */}
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3.5 transition hover:-translate-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-red-500 text-white">
                        <MapPin className="h-3 w-3" />
                      </span>
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-red-700">Drop-off</p>
                    </div>
                    <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">
                      {new Date(booking.dropDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-gray-600">
                      {formatTime(booking.dropTime)}{booking.locationName ? ` · ${booking.locationName}` : ''}
                    </p>
                  </div>
                </div>

                {/* Delivery + addresses */}
                <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Home Delivery</p>
                    <p className={`mt-0.5 text-[13.5px] font-extrabold ${booking.isDeliveryRequested ? 'text-[#056B3E]' : 'text-gray-400'}`}>
                      {booking.isDeliveryRequested ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Pickup Address</p>
                    <p className={`mt-0.5 break-words text-[13.5px] font-extrabold ${booking.pickupAddress ? 'text-gray-900' : 'text-gray-400'}`}>
                      {booking.pickupAddress || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Drop Address</p>
                    <p className={`mt-0.5 break-words text-[13.5px] font-extrabold ${booking.dropAddress ? 'text-gray-900' : 'text-gray-400'}`}>
                      {booking.dropAddress || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip OTP - Show when waiting for pickup */}
            {booking.tripStartOtp && ['READY_FOR_PICKUP', 'ACCEPTED'].includes(booking.status) && (
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
                <h3 className="quote-serif text-[17px] font-medium mb-2 flex items-center gap-1.5 opacity-80">
                  <Shield className="w-3.5 h-3.5" />
                  Trip Start OTP
                </h3>
                <p className="text-cyan-100 text-sm mb-4">
                  Share this OTP with the vendor when picking up the vehicle
                </p>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-[0.3em]">
                    {booking.tripStartOtp}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(booking.tripStartOtp || '', 'otp')}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm"
                >
                  {copiedText === 'otp' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy OTP
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trip In Progress */}
            {booking.status === 'IN_PROGRESS' && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="quote-serif text-[17px] font-medium mb-2 flex items-center gap-1.5 opacity-80">
                  <Car className="w-3.5 h-3.5" />
                  Trip In Progress
                </h3>
                <p className="text-purple-100 text-sm mb-4">
                  Enjoy your ride! Drive safely.
                </p>
                <div className="bg-white/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Vehicle</span>
                    <span className="font-medium">{booking.assignedVehicleName || booking.requestedVehicleName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">KM Limit</span>
                    <span className="font-medium">{(booking.kmLimitPerDay || 200) * booking.totalDays} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Return By</span>
                    <span className="font-medium">
                      {new Date(booking.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {formatTime(booking.dropTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Completed */}
            {booking.status === 'COMPLETED' && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <h3 className="quote-serif text-[17px] font-medium mb-2 flex items-center gap-1.5 opacity-80">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Trip Completed
                </h3>
                <p className="text-green-100 text-sm mb-4">
                  Thank you for choosing TransRentals!
                </p>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-100">We hope you had a great experience.</p>
                  <p className="text-xs text-green-200 mt-2">Security deposit will be refunded after inspection.</p>
                </div>
              </div>
            )}

            {/* Cancel Booking Button */}
            {['PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED'].includes(booking.status) && (
              <div className="bg-white rounded-xl border border-red-100 p-4">
                <h3 className="quote-serif text-[17px] font-medium text-gray-400 mb-1">Cancel Booking</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Once cancelled, refund will be processed as per vendor's cancellation policy.
                </p>
                <button
                  onClick={() => { setShowCancelModal(true); setCancelError(null); setCancelReason(''); setSelectedCancelReason(''); setOtherCancelReason(''); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel This Booking
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3">
                <h2 className="quote-serif text-[17px] font-medium text-gray-400">Pricing Details</h2>
                {booking.paymentStatus && (
                  <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-gray-600">
                    {booking.paymentStatus.toLowerCase()}
                  </span>
                )}
              </div>
              <div className="p-4">
              {(() => {
                const advPct = booking.advancePercentage || (booking.grandTotal > 0 && booking.advanceAmount ? Math.round((booking.advanceAmount / booking.grandTotal) * 100) : 30);
                const totalPayable = (booking.grandTotal || 0) + (booking.securityDeposit || 0);
                const balance = totalPayable - (booking.advanceAmount || 0);
                return (
                  <div>
                    <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                        <span className="text-[12.5px] text-gray-500">Daily Rate</span>
                        <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.dailyRate?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                        <span className="text-[12.5px] text-gray-500">Base Amount ({booking.totalDays} day{booking.totalDays > 1 ? 's' : ''})</span>
                        <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.baseAmount?.toLocaleString()}</span>
                      </div>
                      {booking.gstAmount > 0 && (
                        <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                          <span className="text-[12.5px] text-gray-500">GST</span>
                          <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.gstAmount?.toLocaleString()}</span>
                        </div>
                      )}
                      {booking.platformFee > 0 && (
                        <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                          <span className="text-[12.5px] text-gray-500">Platform Fee</span>
                          <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.platformFee?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                        <span className="text-sm font-extrabold text-gray-900">Rental Total</span>
                        <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{booking.grandTotal?.toLocaleString()}</span>
                      </div>
                    </div>

                    {booking.securityDeposit > 0 && (
                      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-amber-800">
                          <Shield className="h-4 w-4" />
                          Security Deposit
                          <span className="text-[11px] font-medium text-amber-700">(Refundable)</span>
                        </span>
                        <span className="text-sm font-extrabold tabular-nums text-amber-900">₹{booking.securityDeposit?.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-3.5">
                      <span className="text-sm font-extrabold text-gray-900">Total to Pay</span>
                      <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{totalPayable.toLocaleString()}</span>
                    </div>

                    {booking.advanceAmount > 0 && (
                      <div className="mt-2.5 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <span className="text-[12.5px] font-semibold text-[#056B3E]">Advance ({advPct}%)</span>
                          <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.advanceAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                          <span className="text-[12.5px] font-semibold text-[#056B3E]">Remaining at Pickup</span>
                          <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{balance.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            </div>

            {/* Refund Info - after cancellation */}
            {booking.status === 'CANCELLED' && booking.refundAmount != null && booking.refundAmount > 0 && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                <p className="quote-serif text-[17px] font-medium text-orange-600 mb-3 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  Refund Information
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Eligible Refund</span>
                    <span className="text-sm font-bold text-orange-700">₹{booking.refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {booking.refundTransactionId ? (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Refund ID</span>
                      <span className="text-xs font-mono text-gray-700">{booking.refundTransactionId}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-600 bg-orange-100 rounded-lg px-3 py-2 mt-1">
                      Refund will be processed within 5-7 business days after admin review.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Details */}
            {booking.vendor && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-50 bg-[#FCFDFC] px-4 py-3">
                  <h3 className="quote-serif text-[17px] font-medium text-gray-400">Vendor Details</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-2xl border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] text-[#056B3E]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400">Business Name</p>
                      <p className="mt-0.5 text-[15px] font-extrabold leading-tight text-gray-900">{booking.vendor.businessName}</p>
                      {booking.vendor.phone && (
                        <a href={`tel:${booking.vendor.phone}`} className="mt-1 block text-xs tabular-nums text-gray-500 hover:text-[#056B3E]">
                          {booking.vendor.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    <button
                      onClick={() => setShowChat(true)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#09B368] py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat with Vendor
                    </button>
                    <a
                      href={`tel:${booking.vendor.phone}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[13.5px] font-bold text-gray-700 transition hover:border-[#96E4C2] hover:bg-gray-50 hover:text-[#056B3E]"
                    >
                      <Phone className="w-4 h-4" />
                      Call Vendor
                    </a>
                  </div>
                </div>
              </div>
            )}


            {/* Customer Notes */}
            {booking.customerNotes && (
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <h3 className="quote-serif text-[17px] font-medium text-blue-700">Your Notes</h3>
                </div>
                <p className="p-4 text-[13px] leading-relaxed text-gray-700">{booking.customerNotes}</p>
              </div>
            )}

            {/* Vendor Notes */}
            {booking.vendorNotes && (
              <div className="overflow-hidden rounded-2xl border border-[#C8F1DF] bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#C8F1DF] bg-[#E9FAF2] px-4 py-3">
                  <FileText className="w-4 h-4 text-[#056B3E]" />
                  <h3 className="quote-serif text-[17px] font-medium text-[#056B3E]">Vendor Notes</h3>
                </div>
                <p className="p-4 text-[13px] leading-relaxed text-gray-700">{booking.vendorNotes}</p>
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
                      {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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

            {/* Help */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3">
                <Shield className="w-4 h-4 text-blue-700" />
                <h3 className="quote-serif text-[17px] font-medium text-blue-700">Need Help?</h3>
              </div>
              <div className="p-4">
                <p className="mb-3.5 text-[13px] leading-relaxed text-gray-600">
                  Contact our support team for any queries
                </p>
                <a
                  href="tel:+919737965551"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#09B368] py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
                >
                  <Phone className="w-4 h-4" />
                  Call Support
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Below both columns, at full content width — the same notice, but its
            rules read as short lines instead of a tall wall in the 372px rail. */}
        <div className="mt-4 space-y-5 lg:mt-5">
          {/* Renders itself away when there is no refund to talk about. A refund
              is owed whether or not a vendor was ever assigned, so it does not
              sit behind the notice's vendor guard. */}
          <RefundStatusCard source="car_bookings" bookingId={booking.id} />
          {booking.vendor && <BookingPaymentSafetyNotice />}
        </div>
      </div>

      {/* Payment Modal - replaced by BookingPayment component */}
      {false && booking && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 relative">
              <button
                onClick={closePaymentModal}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center -mb-12 shadow-lg relative z-10">
                  {paymentSuccess ? (
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-10">
              {paymentSuccess ? (
                <div className="text-center">
                  <h2 className="quote-serif text-[30px] font-medium text-gray-900 mb-2">Payment Submitted!</h2>
                  <p className="text-gray-600 mb-4">
                    Your payment is being verified. You'll receive a confirmation shortly.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">
                      Reference: {paymentReference}
                    </p>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
                </div>
              ) : loadingBankDetails ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading payment details...</p>
                </div>
              ) : !bankDetails ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="quote-serif text-[23px] font-medium text-gray-900 mb-2">Payment Details Unavailable</h3>
                  <p className="text-gray-600 mb-4">
                    Please contact support for payment instructions.
                  </p>
                  <a
                    href="tel:+919737965551"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    Call Support
                  </a>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-1">
                      Pay Advance Amount
                    </h2>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{(booking.advanceAmount || booking.grandTotal)?.toLocaleString()}
                    </p>
                  </div>

                  {/* QR Code Section */}
                  {bankDetails.upiId && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-3 text-center">Scan QR code to pay via UPI</p>
                      <div className="flex justify-center">
                        {bankDetails.upiQrCode ? (
                          <img
                            src={bankDetails.upiQrCode.startsWith('http') ? bankDetails.upiQrCode : `/uploads/${bankDetails.upiQrCode}`}
                            alt="Payment QR Code"
                            className="w-48 h-48 rounded-lg"
                          />
                        ) : (
                          <img
                            src={getQRCodeUrl(bankDetails.upiId, booking.advanceAmount || booking.grandTotal)}
                            alt="Payment QR Code"
                            className="w-48 h-48 rounded-lg"
                          />
                        )}
                      </div>
                      {/* UPI ID */}
                      <div className="mt-3 bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500 mb-1 text-center">UPI ID</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-semibold text-gray-900">{bankDetails.upiId}</span>
                          <button
                            onClick={() => copyToClipboard(bankDetails.upiId || '', 'upi')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {copiedText === 'upi' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Section */}
                  <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3">
                      <Banknote className="h-5 w-5" />
                      Bank Transfer Details
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-medium text-gray-900">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Account Holder</span>
                        <span className="font-medium text-gray-900">{bankDetails.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Account No.</span>
                        <button
                          onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                          className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                        >
                          {bankDetails.accountNumber}
                          {copiedText === 'account' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">IFSC Code</span>
                        <button
                          onClick={() => copyToClipboard(bankDetails.ifscCode, 'ifsc')}
                          className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                        >
                          {bankDetails.ifscCode}
                          {copiedText === 'ifsc' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      {bankDetails.branchName && (
                        <div className="flex justify-between items-center bg-white rounded-lg p-2">
                          <span className="text-gray-500">Branch</span>
                          <span className="font-medium text-gray-900">{bankDetails.branchName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Reference Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Reference / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Enter UTR or Transaction ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You'll find this in your payment app after completing the transaction
                    </p>
                  </div>

                  {/* Error Message */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {paymentError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitPayment}
                    disabled={isSubmittingPayment || !paymentReference.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        I've Made the Payment
                      </>
                    )}
                  </button>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By proceeding, you agree to our{' '}
                    <a href="/terms-and-conditions" target="_blank" className="text-blue-600 underline">Terms</a> and{' '}
                    <a href="/cancellations-and-refund" target="_blank" className="text-blue-600 underline">Refund Policy</a>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="quote-serif font-medium text-gray-900 text-[21px]">Cancel Booking</h2>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Booking summary */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-gray-800">Booking #{booking.bookingNumber}</p>
                <p className="text-gray-600">{booking.requestedVehicleName} · {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                {booking.paidAmount != null && booking.paidAmount > 0 && (
                  <p className="text-orange-600 font-medium">
                    Paid: ₹{booking.paidAmount.toLocaleString('en-IN')} — refund subject to cancellation policy
                  </p>
                )}
              </div>

              {/* Vendor T&C from accepted quote */}
              {booking.acceptedQuote?.termsConditions && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <p className="quote-serif text-[17px] font-medium text-amber-700 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Vendor Cancellation Policy
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {booking.acceptedQuote.termsConditions}
                  </p>
                </div>
              )}

              {/* Reason — predefined options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      onClick={() => { setSelectedCancelReason(reason); setCancelError(null); if (reason !== 'Other') setOtherCancelReason(''); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedCancelReason === reason
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selectedCancelReason === reason
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedCancelReason === reason && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={`text-sm ${selectedCancelReason === reason ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Other — freetext */}
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

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <strong>Note:</strong> This action cannot be undone. The vendor will be notified immediately.
              </div>
            </div>

            {/* Footer buttons */}
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
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Yes, Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <CustomerBookingChat
              bookingId={id}
              customerName={booking?.customerName}
              vendorName={booking?.vendors?.businessName}
              vendorPhone={booking?.vendor?.phone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
