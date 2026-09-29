'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  Star,
  Copy,
  CreditCard,
  Shield,
  Download,
  MessageCircle,
  Loader2,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import BookingPaymentSafetyNotice from '@/components/customer/BookingPaymentSafetyNotice';
import RefundStatusCard from '@/components/customer/RefundStatusCard';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface BusBooking {
  id: string;
  bookingNumber: string;
  customerId?: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  passengers: number;
  pickupCity: string;
  pickupAddress?: string;
  dropCity?: string;
  dropAddress?: string;
  routeDetails?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  tripDays: number;
  baseAmount: number;
  additionalCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  tripStartOtp?: string;
  tripEndOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  rating?: number;
  review?: string;
  vendor?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Bus },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
};

// Presentation only — maps the existing booking status onto the hero progress
// rail. Adds no state and changes no behaviour.
const BOOKING_STEPS = ['Booked', 'Advance Payment', 'Confirmed', 'Vehicle Assigned', 'Trip in Progress', 'Completed'];

const STEP_INDEX_BY_STATUS: Record<string, number> = {
  PENDING_PAYMENT: 1,
  PAYMENT_SUBMITTED: 1,
  ADVANCE_PAID: 2,
  CONFIRMED: 2,
  VEHICLE_ASSIGNED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

// The rail describes a booking moving forward — it says nothing useful once a
// booking is cancelled, so it is hidden there.
const RAIL_HIDDEN_STATUSES = ['CANCELLED'];

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

export default function CustomerBusBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booking, setBooking] = useState<BusBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication from localStorage
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (!customer) return;

    const fetchBooking = async () => {
      try {
        const identifier = customer.phone || customer.email;
        const response = await fetch(`/api/bus-bookings/${params.id}?phone=${encodeURIComponent(identifier)}`);
        const data = await response.json();

        if (data.success) {
          console.log('[Bus Booking] Booking loaded:', {
            id: data.booking.id,
            status: data.booking.status,
            hasVendor: !!data.booking.vendor,
            vendorId: data.booking.vendor?.id,
            customerId: data.booking.customerId
          });
          setBooking(data.booking);
        } else {
          setError(data.error || 'Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, customer]);

  const fetchChatMessages = async (showLoader = true) => {
    if (!booking?.id || !booking?.vendor?.id) return;

    try {
      if (showLoader) setIsLoadingMessages(true);
      const res = await fetch(
        `/api/customer/booking/${booking.id}/chat/${booking.vendor.id}?customer_id=${booking.customerId || ''}`
      );
      const data = await res.json();

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
          customer_name: customer?.name
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewChatMessage('');
        fetchChatMessages(false); // Refresh messages without loader
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (showChat && booking?.id && booking?.vendor?.id) {
      fetchChatMessages(true);
      const interval = setInterval(() => fetchChatMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [showChat, booking?.id, booking?.vendor?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRawTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const copyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitRating = async () => {
    if (rating === 0 || !booking) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/bus-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          rating,
          review
        })
      });

      const data = await response.json();
      if (data.success) {
        setBooking({ ...booking, rating, review });
        setShowRateModal(false);
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const downloadInvoice = () => {
    if (!booking) return;
    window.open(`/api/bus-bookings/${booking.id}/invoice`, '_blank');
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
      const response = await fetch(`/api/bus-bookings/${booking.id}`, {
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

  if (isLoading || !customer) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 p-4`}>
        <div className="max-w-2xl mx-auto">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600">{error || 'This booking does not exist or you do not have access to it.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

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
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <div className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Bus className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="quote-serif text-[30px] sm:text-[38px] font-medium leading-tight tracking-[-0.01em]">{booking.vehicleName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.pickupCity && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.pickupCity}
                    </span>
                  )}
                  {booking.tripType && (
                    <span className="text-xs capitalize text-white/[0.62]">{booking.tripType}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Trip Days</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.tripDays} Day{booking.tripDays > 1 ? 's' : ''}</p>
              </div>
              <div className="border-l border-white/[0.12] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Passengers</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.passengers}</p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Total Amount</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{(booking.baseAmount + (booking.additionalCharges || 0))?.toLocaleString('en-IN')}</p>
              </div>
              <div className="border-l border-t border-white/[0.12] px-5 py-3 sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Advance Paid</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.advancePaid ? `₹${booking.advancePaid.toLocaleString('en-IN')}` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Progress rail — derived from booking.status, no new state */}
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

        {/* Payment Required — split card: amount stub beside the actions. When
            the taller UPI / bank-transfer panel is showing, the `:has()` rule
            drops it to one column so the stub becomes a band rather than a
            half-empty green column. */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount && (
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
                  <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Advance Payment</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[38px] font-extrabold leading-none tracking-[-0.035em] tabular-nums sm:text-[44px]">
                      ₹{booking.advanceAmount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs tabular-nums text-white/[0.68]">
                      of ₹{booking.totalAmount?.toLocaleString('en-IN')} total
                    </span>
                  </div>
                </div>

                <div className="w-full min-w-0 sm:w-[300px]">
                  <div className="h-[5px] overflow-hidden rounded bg-white/[0.16]">
                    <span
                      className="block h-full rounded bg-[linear-gradient(90deg,#2AD291,#fff)]"
                      style={{ width: `${Math.min(100, Math.round((booking.advanceAmount / (booking.totalAmount || 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between gap-2.5 text-[10.5px] tabular-nums text-white/60">
                    <span>Paying now ₹{booking.advanceAmount?.toLocaleString('en-IN')}</span>
                    {booking.balanceAmount != null && <span>Balance ₹{booking.balanceAmount.toLocaleString('en-IN')}</span>}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1.5 text-xs font-semibold">
                    <Bus className="h-3.5 w-3.5" />
                    {booking.vehicleName}{booking.vehicleNumber ? ` · ${booking.vehicleNumber}` : ''}
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
                    bookingType="bus"
                    amount={booking.advanceAmount}
                    bookingNumber={booking.bookingNumber}
                    serviceSlug="bus-rental"
                    onSuccess={() => window.location.reload()}
                    embedded
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Payment Submitted - Under Review */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="quote-serif font-medium text-amber-800 mb-1 text-[21px]">Payment Under Verification</h3>
                <p className="text-sm text-amber-700">
                  Your payment is being verified. This usually takes 15-30 minutes during business hours.
                  You will receive a notification once verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trip Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC] flex items-center justify-between gap-2">
            <p className="quote-serif text-[17px] font-medium text-gray-400">Trip Details</p>
            {booking.tripType && (
              <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#056B3E]">
                {booking.tripType}
              </span>
            )}
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
                <p className="mt-2.5 text-base font-extrabold text-gray-900">{booking.pickupCity}</p>
                {booking.pickupAddress && <p className="text-xs text-gray-500 mt-0.5">{booking.pickupAddress}</p>}
                <p className="mt-1.5 text-[12.5px] font-semibold text-gray-700 tabular-nums">
                  {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  {booking.pickupTime ? ` · ${formatRawTime(booking.pickupTime)}` : ''}
                </p>
              </div>
              {/* Duration */}
              <div className="flex flex-col items-center gap-1.5 px-1">
                <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1A15] px-3 py-1.5 text-[11.5px] font-bold text-white">
                  <Clock className="w-3 h-3" />
                  {booking.tripDays} Day{booking.tripDays > 1 ? 's' : ''}
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
                <p className="mt-2.5 text-base font-extrabold text-gray-900">{booking.dropCity || '—'}</p>
                {booking.dropAddress && <p className="text-xs text-gray-500 mt-0.5">{booking.dropAddress}</p>}
                {booking.returnDate && (
                  <p className="mt-1.5 text-[12.5px] font-semibold text-gray-700 tabular-nums">
                    {new Date(booking.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {booking.returnTime ? ` · ${formatRawTime(booking.returnTime)}` : ' · Return'}
                  </p>
                )}
              </div>
            </div>

            {/* Facts */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Passengers</p>
                <p className="mt-0.5 text-sm font-extrabold text-gray-900 tabular-nums">{booking.passengers}</p>
              </div>
              {booking.tripType && (
                <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Trip Type</p>
                  <p className="mt-0.5 text-sm font-extrabold capitalize text-gray-900">{booking.tripType}</p>
                </div>
              )}
              {booking.chauffeur_vehicle_categories && (
                <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Vehicle Class</p>
                  <p className="mt-0.5 text-sm font-extrabold capitalize text-gray-900">{booking.chauffeur_vehicle_categories}</p>
                </div>
              )}
            </div>

            {/* Route details if any */}
            {booking.routeDetails && (
              <div className="mt-3.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-blue-700">Route</p>
                <p className="mt-1 text-[13px] leading-relaxed text-blue-900">{booking.routeDetails}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle & Driver */}
        {(booking.vehicleNumber || booking.driverName) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
              <p className="quote-serif text-[17px] font-medium text-gray-400">Vehicle &amp; Driver</p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-[100px] w-[150px] flex-none items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-br from-[#E9FAF2] to-[#DCFCE7] text-[#078F53]">
                  <Bus className="h-[52px] w-[52px]" strokeWidth={1.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-extrabold tracking-tight text-gray-900">{booking.vehicleName}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {booking.vehicleNumber && (
                      <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11.5px] font-bold text-[#056B3E]">
                        {booking.vehicleNumber}
                      </span>
                    )}
                    {booking.chauffeur_vehicle_categories && (
                      <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11.5px] font-bold capitalize text-gray-600">
                        {booking.chauffeur_vehicle_categories}
                      </span>
                    )}
                    {booking.vehicle_model && (
                      <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11.5px] font-bold text-gray-600">
                        {booking.vehicle_model}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver — shown as pending rather than hidden, so the customer
                  knows details are still to come. */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                    <Users className="h-[19px] w-[19px]" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Driver</p>
                    {booking.driverName ? (
                      <p className="mt-0.5 text-[14.5px] font-extrabold text-gray-900">{booking.driverName}</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-gray-500">Not assigned yet — vendor will share details before pickup</p>
                    )}
                  </div>
                </div>
                {booking.driverPhone && (
                  <a href={`tel:${booking.driverPhone}`} className="flex items-center gap-2 px-4 py-2.5 bg-[#09B368] text-white rounded-xl hover:bg-[#078F53] transition text-[13.5px] font-bold shadow-lg shadow-[#09B368]/25">
                    <Phone className="w-4 h-4" />
                    Call Driver
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trip OTP */}
        {booking.tripStartOtp && ['VEHICLE_ASSIGNED', 'CONFIRMED'].includes(booking.status) && (
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#056B3E,#09B368)] p-5 text-white shadow-[0_18px_44px_-14px_rgba(9,179,104,.5)]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(420px 180px at 90% -20%, rgba(255,255,255,.25), transparent 60%)' }}
            />
            <div className="relative z-10">
              <p className="text-white/[0.72] text-[10.5px] font-extrabold uppercase tracking-[0.12em]">Trip Start OTP</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3.5">
                <span className="flex gap-2">
                  {booking.tripStartOtp.split('').map((d, i) => (
                    <span
                      key={i}
                      className="flex h-[52px] w-11 items-center justify-center rounded-xl border border-white/[0.28] bg-white/[0.16] text-2xl font-extrabold tabular-nums"
                    >
                      {d}
                    </span>
                  ))}
                </span>
                <button
                  onClick={() => copyOtp(booking.tripStartOtp!)}
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 text-[12.5px] font-bold transition hover:bg-white/[0.32]"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-white/[0.72] text-[11.5px] mt-3">Share this with the driver to start the trip</p>
              {booking.tripEndOtp && (
                <p className="mt-3.5 border-t border-white/[0.18] pt-3.5 text-xs text-white/80">
                  Trip End OTP <b className="font-extrabold tabular-nums">{booking.tripEndOtp}</b>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC] flex items-center justify-between gap-2">
            <p className="quote-serif text-[17px] font-medium text-gray-400">Payment Summary</p>
            {booking.paymentStatus && (
              <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-gray-600">
                {booking.paymentStatus.toLowerCase()}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
              <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                <span className="text-[12.5px] text-gray-500">Base Fare</span>
                <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.baseAmount?.toLocaleString('en-IN')}</span>
              </div>
              {booking.additionalCharges > 0 && (
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Additional Charges</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.additionalCharges?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.gstAmount > 0 && (
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">GST</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.gstAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                <span className="text-sm font-extrabold text-gray-900">Total Amount</span>
                <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{(booking.baseAmount + (booking.additionalCharges || 0))?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {booking.advanceAmount != null && booking.advanceAmount > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#056B3E]">Advance Required</span>
                  <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.advanceAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#056B3E]">Advance Paid</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{(booking.advancePaid || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {booking.balanceAmount != null && booking.balanceAmount > 0 && (
              <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <span className="text-[12.5px] font-semibold text-amber-800">Balance Amount</span>
                <span className="text-sm font-extrabold tabular-nums text-amber-900">₹{booking.balanceAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

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

        {/* Rating (for completed trips) */}
        {booking.status === 'COMPLETED' && booking.rating && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="quote-serif font-medium text-gray-900 text-[21px]">Your Rating</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= booking.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="font-medium text-gray-900 ml-2">{booking.rating}/5</span>
              </div>
              {booking.review && (
                <p className="text-gray-600 mt-2">{booking.review}</p>
              )}
            </div>
          </div>
        )}

        {/* Cancel Booking */}
        {['PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'].includes(booking.status) && (
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100 bg-red-50">
              <p className="quote-serif text-[17px] font-medium text-red-700">Cancel Booking</p>
            </div>
            <div className="p-4">
              <p className="text-[12.5px] leading-relaxed text-gray-500 mb-3">
                Once cancelled, refund will be processed as per vendor&apos;s cancellation policy.
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

          {/* Vendor Details */}
          {booking.vendor && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
                <p className="quote-serif text-[17px] font-medium text-gray-400">Vendor Details</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-[46px] h-[46px] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] border border-[#C8F1DF] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Bus className="w-5 h-5 text-[#056B3E]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-900 text-[15px] leading-tight">{booking.vendor.name}</p>
                    {booking.vendor.rating > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(booking.vendor!.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-[11.5px] font-semibold text-gray-500 ml-1.5">{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {booking.vendor.phone && <p className="text-xs text-gray-500 mt-1 tabular-nums">{booking.vendor.phone}</p>}
                  </div>
                </div>
                <div className="mt-3.5 flex flex-col gap-2.5">
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#09B368] text-white rounded-xl hover:bg-[#078F53] transition text-[13.5px] font-bold shadow-lg shadow-[#09B368]/25"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat with Vendor
                  </button>
                  <a
                    href={`tel:${booking.vendor.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-[#96E4C2] hover:text-[#056B3E] transition text-[13.5px] font-bold"
                  >
                    <Phone className="w-4 h-4" />
                    Call Vendor
                  </a>
                </div>
              </div>
            </div>
          )}


          {/* Booking Info */}
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
                {booking.createdAt && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Booked On</span>
                    <span className="text-[13px] font-bold text-gray-900">
                      {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {booking.paymentStatus && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Payment Status</span>
                    <span className="text-[13px] font-bold capitalize text-gray-900">{booking.paymentStatus.toLowerCase()}</span>
                  </div>
                )}
                {booking.tripType && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Trip Type</span>
                    <span className="text-[13px] font-bold capitalize text-gray-900">{booking.tripType}</span>
                  </div>
                )}
                {booking.vehicleNumber && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Vehicle No.</span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-900">{booking.vehicleNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-[#FCFDFC]">
              <p className="quote-serif text-[17px] font-medium text-gray-400">Need a hand</p>
            </div>
            <div className="p-4 flex flex-col gap-2.5">
          {booking.status === 'COMPLETED' && !booking.rating && (
            <button
              onClick={() => setShowRateModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition text-[13.5px] shadow-sm"
            >
              <Star className="w-4 h-4 fill-white" />
              Rate Your Experience
            </button>
          )}
          <div className="flex flex-col gap-2.5">
            <Link
              href="/customer/helpdesk"
              className="flex items-center justify-center gap-2 py-3 bg-[#09B368] text-white font-bold rounded-xl hover:bg-[#078F53] transition text-[13.5px] shadow-lg shadow-[#09B368]/25"
            >
              <MessageCircle className="w-4 h-4" />
              Need Help?
            </Link>
            <button
              onClick={downloadInvoice}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-[#96E4C2] hover:text-[#056B3E] transition text-[13.5px]"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
            <Link
              href="/customer/dashboard"
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-[#96E4C2] hover:text-[#056B3E] transition text-[13.5px]"
            >
              Back to Dashboard
            </Link>
          </div>
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
        <RefundStatusCard source="bus_bookings" bookingId={booking.id} />
        {booking.vendor && <BookingPaymentSafetyNotice />}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Ribbon — states the consequence before anything else is read */}
            <div className="relative overflow-hidden bg-[linear-gradient(150deg,#7F1D1D,#B91C1C_70%)] px-5 pb-[18px] pt-5 text-white">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(420px 180px at 100% -40%, rgba(255,255,255,.2), transparent 62%)' }}
              />
              <div className="relative z-10 flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/[0.26] bg-white/[0.18]">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h2 className="quote-serif text-[21px] font-medium">Cancel this booking?</h2>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/[0.82]">
                    The vendor is notified immediately and the vehicle is released. This cannot be undone.
                  </p>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-white/80 transition hover:bg-white/20 hover:text-white">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* What is being cancelled */}
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] text-[#056B3E]">
                  <Bus className="h-[22px] w-[22px]" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-extrabold text-gray-900">{booking.vehicleName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {booking.bookingNumber}
                    {booking.pickupCity ? ` · ${booking.pickupCity}` : ''}
                    {booking.dropCity ? ` → ${booking.dropCity}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    {booking.pickupTime ? ` · ${formatRawTime(booking.pickupTime)}` : ''}
                    {` · ${booking.passengers} passenger${booking.passengers > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* The money, stated plainly */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400">You paid</p>
                  <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-gray-900">₹{(booking.advancePaid || 0).toLocaleString('en-IN')}</p>
                </div>
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-gray-100 text-gray-400">
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400">Estimated refund</p>
                  <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-[#056B3E]">₹{(booking.advancePaid || 0).toLocaleString('en-IN')}</p>
                </div>
                <p className="col-span-3 border-t border-gray-100 pt-2.5 text-[11.5px] leading-relaxed text-gray-500">
                  {booking.advancePaid && booking.advancePaid > 0
                    ? 'The final refund follows the vendor’s cancellation policy and may be lower than the amount shown.'
                    : 'Nothing has been paid yet, so there is nothing to refund.'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[12.5px] font-bold text-gray-700">
                  Why are you cancelling? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      onClick={() => { setSelectedCancelReason(reason); setCancelError(null); if (reason !== 'Other') setOtherCancelReason(''); }}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[13px] leading-snug transition-all ${selectedCancelReason === reason ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`mt-px flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedCancelReason === reason ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                        {selectedCancelReason === reason && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={selectedCancelReason === reason ? 'font-semibold text-red-700' : 'text-gray-700'}>{reason}</span>
                    </label>
                  ))}
                </div>
                {selectedCancelReason === 'Other' && (
                  <textarea
                    value={otherCancelReason}
                    onChange={(e) => setOtherCancelReason(e.target.value)}
                    placeholder="Tell us what happened…"
                    rows={3}
                    autoFocus
                    className="w-full mt-2.5 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  />
                )}
              </div>

              {cancelError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {cancelError}
                </div>
              )}

              {/* An exit that isn't cancelling */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#C8F1DF] bg-[#E9FAF2] px-3.5 py-3 text-[12.5px] leading-snug text-[#056B3E]">
                <MessageCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  Only the date or vehicle is a problem?{' '}
                  <button
                    onClick={() => { setShowCancelModal(false); setShowChat(true); }}
                    className="font-extrabold underline underline-offset-2"
                  >
                    Message the vendor
                  </button>{' '}
                  — most changes can be sorted without cancelling.
                </span>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition text-[13.5px]"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !selectedCancelReason || (selectedCancelReason === 'Other' && !otherCancelReason.trim())}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition text-[13.5px] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (<><Loader2 className="w-4 h-4 animate-spin" />Cancelling...</>) : (<><XCircle className="w-4 h-4" />Cancel Booking</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="quote-serif text-[26px] font-medium text-gray-900">How was your trip?</h2>
              <p className="text-sm text-gray-500 mt-1">Your feedback helps us improve our service.</p>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 group transition-transform hover:scale-110">
                  <Star className={`w-10 h-10 transition-colors ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 group-hover:text-amber-200'}`} />
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Share your experience (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you like or what could be better?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all resize-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm" onClick={() => setShowRateModal(false)} disabled={isSubmittingRating}>
                Cancel
              </button>
              <button className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm" onClick={handleSubmitRating} disabled={rating === 0 || isSubmittingRating}>
                {isSubmittingRating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && booking?.vendor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(6,20,14,.62)] p-4 backdrop-blur-[3px] sm:items-center">
          <div className="flex h-[min(560px,80vh)] w-full max-w-[460px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_40px_90px_-30px_rgba(6,20,14,.6)]">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-[linear-gradient(100deg,#056B3E,#09B368)] px-[18px] py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/[0.24] bg-white/20">
                  <Bus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <b className="block truncate text-[15px] font-extrabold">{booking.vendor.name}</b>
                  <span className="text-[11.5px] text-white/[0.78]">Bus Booking #{booking.bookingNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="grid h-9 w-9 flex-none place-items-center rounded-[10px] text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#F4F8F6] p-4">
              {isLoadingMessages ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#09B368]" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-gray-100 bg-white">
                    <MessageCircle className="w-6 h-6 text-gray-300" />
                  </span>
                  <p className="text-[13px] font-semibold text-gray-500">No messages yet</p>
                  <p className="mt-0.5 text-xs text-gray-400">Ask the vendor anything about your trip</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => {
                  const mine = msg.sender_type === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                        mine
                          ? 'self-end rounded-br-[5px] bg-[#09B368] text-white'
                          : 'self-start rounded-bl-[5px] border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                      <time className={`mt-1 block text-[10px] ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </time>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2.5 border-t border-gray-100 bg-white px-3.5 py-3">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendChatMessage()}
                placeholder="Type a message"
                className="flex-1 rounded-full border border-gray-200 bg-[#F4F8F6] px-4 py-2.5 text-[13px] outline-none transition focus:border-[#09B368] focus:bg-white focus:ring-2 focus:ring-[#E9FAF2]"
                disabled={isSendingMessage}
              />
              <button
                onClick={sendChatMessage}
                disabled={!newChatMessage.trim() || isSendingMessage}
                className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full bg-[#09B368] text-white transition hover:bg-[#078F53] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isSendingMessage ? <Loader2 className="w-[17px] h-[17px] animate-spin" /> : <Send className="w-[17px] h-[17px]" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
