'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Loader2,
  FileText,
  MessageCircle,
  Package,
  User,
  Send,
  X,
  Headphones,
  HelpCircle,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  customerId?: string;
  equipmentCategory: string;
  equipmentType: string;
  equipmentModel?: string;
  quantity: number;
  deliveryLocation: string;
  deliveryAddress?: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyRate: number;
  baseAmount: number;
  additionalCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: string;
  rating?: number;
  review?: string;
  vendor?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  operator?: {
    name: string;
    phone: string;
  };
  deliveryOtp?: string;
  returnOtp?: string;
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
  EQUIPMENT_DEPLOYED: { label: 'Equipment Deployed', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Package },
  IN_USE: { label: 'In Use', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Wrench },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
};

export default function CustomerEquipmentBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booking, setBooking] = useState<EquipmentBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
        const response = await fetch(`/api/equipment-bookings/${params.id}?phone=${encodeURIComponent(identifier)}`);
        const data = await response.json();

        if (data.success) {
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
        fetchChatMessages(false);
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

  const handleSubmitRating = async () => {
    if (rating === 0 || !booking) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/equipment-bookings/${booking.id}`, {
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
    window.open(`/api/equipment-bookings/${booking.id}/invoice`, '_blank');
  };

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600">{error || 'This booking does not exist or you do not have access to it.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const StatusIcon = statusConfig.icon;

  // Progress rail — presentation only, derived from booking.status. No new state.
  const BOOKING_STEPS = [
    'Pending Payment',
    'Payment Review',
    'Advance Paid',
    'Confirmed',
    'Equipment Deployed',
    'In Use',
    'Completed',
  ];
  const STEP_INDEX_BY_STATUS: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PAYMENT_SUBMITTED: 1,
    ADVANCE_PAID: 2,
    CONFIRMED: 3,
    DELIVERED: 4,
    EQUIPMENT_DEPLOYED: 4,
    PICKUP_SCHEDULED: 5,
    IN_USE: 5,
    RETURNED: 6,
    COMPLETED: 6,
  };
  const currentStepIdx = STEP_INDEX_BY_STATUS[booking.status] ?? 0;

  const CARD = 'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm';
  const CARD_HEAD = 'flex items-center justify-between gap-3 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3';
  const CARD_LABEL = 'text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400';
  const ACTION_ROW =
    'group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-[#C8F1DF] hover:bg-[#FCFDFC] hover:shadow-[0_10px_24px_-14px_rgba(1,35,20,.45)]';
  // No colour here on purpose — each row supplies its own tint. Tailwind picks
  // the winner by stylesheet order, not by class-string order, so a base
  // bg/text would not be reliably overridden.
  const ACTION_ICON =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition';

  /** One labelled value tile. */
  const Tile = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: React.ReactNode; highlight?: boolean }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div
        className={`group flex min-w-0 items-start gap-2.5 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(1,35,20,.35)] ${
          highlight ? 'border-[#C8F1DF] bg-[#E9FAF2]' : 'border-gray-100 bg-white hover:border-[#C8F1DF]'
        }`}
      >
        <span
          className={`mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] transition ${
            highlight ? 'bg-white text-[#056B3E]' : 'bg-gray-100 text-gray-500 group-hover:bg-[#E9FAF2] group-hover:text-[#056B3E]'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">{label}</span>
          <span className={`mt-0.5 block break-words text-[13.5px] leading-snug ${highlight ? 'font-extrabold text-[#056B3E]' : 'font-semibold text-gray-900'}`}>
            {value}
          </span>
        </span>
      </div>
    );
  };

  /** Gradient OTP panel, same shape the other booking pages use. */
  const OtpPanel = ({ label, otp, hint, gradient }: { label: string; otp: string; hint: string; gradient: string }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(420px 180px at 90% -20%, rgba(255,255,255,.25), transparent 60%)' }}
      />
      <div className="relative z-10">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/[0.75]">{label}</p>
        <span className="mt-2.5 flex gap-2">
          {otp.split('').map((d, i) => (
            <span
              key={i}
              className="flex h-[52px] w-11 items-center justify-center rounded-xl border border-white/30 bg-white/[0.18] text-2xl font-extrabold tabular-nums"
            >
              {d}
            </span>
          ))}
        </span>
        <p className="mt-3 text-[11.5px] text-white/[0.78]">{hint}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />

      {/* ══════════════ Hero header ══════════════ */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#056B3E_0%,#078F53_42%,#09B368_100%)]" />
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
          {/* Back link + status */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <div className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </div>
          </div>

          {/* Title + stat strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Wrench className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight tracking-tight">{booking.equipmentType}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.deliveryLocation && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.deliveryLocation}
                    </span>
                  )}
                  <span className="text-xs capitalize text-white/[0.62]">
                    {booking.equipmentCategory} · Qty {booking.quantity}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Start</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="border-l border-white/[0.12] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">End</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Duration</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="border-l border-t border-white/[0.12] px-5 py-3 sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Total</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Progress rail — reflects booking.status, no new state */}
          {booking.status !== 'CANCELLED' && (
            <div className="mt-6 border-t border-white/[0.13] pt-5">
              <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_82%,transparent)] md:[mask-image:none]">
                {BOOKING_STEPS.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isNow = i === currentStepIdx;
                  return (
                    <div key={step} className="relative min-w-[118px] flex-1 text-center">
                      {i > 0 && (
                        <span className="absolute top-[10px] left-[calc(-50%+12px)] right-[calc(50%+12px)] h-0.5 overflow-hidden rounded-sm bg-white/20">
                          <span className={`block h-full rounded-sm bg-white transition-[width] duration-700 ${i <= currentStepIdx ? 'w-full' : 'w-0'}`} />
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

      {/* ══════════════ Body ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">

        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">

          {/* Payment Required — amount stub beside the existing widget */}
          {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount && (
            <section className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_20px_52px_-22px_rgba(1,35,20,.45)] lg:grid-cols-[1.08fr_0.92fr] lg:has-[[data-manual-payment]]:grid-cols-1">
              <div className="relative overflow-hidden bg-[linear-gradient(155deg,#01301B_0%,#056B3E_58%,#078F53_100%)] px-5 py-5 text-white">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(520px 240px at 100% -30%, rgba(42,210,145,.42), transparent 62%),' +
                      'repeating-linear-gradient(128deg, rgba(255,255,255,.045) 0 1px, transparent 1px 38px)',
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                      <Package className="h-4 w-4" />
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
                    <span className="text-xs tabular-nums text-white/[0.68]">of ₹{booking.totalAmount?.toLocaleString('en-IN')} total</span>
                  </div>
                  {booking.balanceAmount != null && (
                    <p className="mt-4 text-[11px] font-semibold tabular-nums text-white/[0.6]">
                      Balance · ₹{booking.balanceAmount.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* The widget keeps its own Razorpay + UPI/bank flows; this card
                  only supplies the surrounding chrome, so it runs embedded. */}
              <div
                className="flex flex-col justify-center gap-3.5 px-5 py-5
                  [&>div:not([data-manual-payment])>button]:!py-3
                  [&>div:not([data-manual-payment])>div]:!mt-3.5
                  [&>button]:!pt-3"
              >
                <BookingPayment
                  bookingId={booking.id}
                  bookingType="equipment"
                  amount={booking.advanceAmount}
                  bookingNumber={booking.bookingNumber}
                  serviceSlug="equipment-rental"
                  onSuccess={() => window.location.reload()}
                  embedded
                />
              </div>
            </section>
          )}

          {/* Payment Submitted - Under Review */}
          {booking.status === 'PAYMENT_SUBMITTED' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="mb-1 font-extrabold text-amber-800">Payment Under Verification</h3>
                  <p className="text-sm leading-relaxed text-amber-700">
                    Your payment is being verified. This usually takes 15-30 minutes during business hours.
                    You will receive a notification once verified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Equipment Details ── */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <p className={CARD_LABEL}>Equipment Details</p>
              {booking.equipmentCategory && (
                <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#056B3E]">
                  {booking.equipmentCategory}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <Tile icon={Package} label="Equipment Type" value={booking.equipmentType} highlight />
                <Tile icon={Wrench} label="Category" value={booking.equipmentCategory ? <span className="capitalize">{booking.equipmentCategory}</span> : null} />
                <Tile icon={FileText} label="Model" value={booking.equipmentModel} />
                <Tile icon={Package} label="Quantity" value={booking.quantity ? `${booking.quantity} ${booking.quantity === 1 ? 'unit' : 'units'}` : null} />
                <Tile icon={MapPin} label="Delivery Location" value={booking.deliveryLocation} />
                <Tile icon={MapPin} label="Delivery Address" value={booking.deliveryAddress} />
              </div>

              {/* Rental window */}
              <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] p-3.5 transition hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#09B368]">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[#056B3E]">Start Date</p>
                  </div>
                  <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{formatDate(booking.startDate)}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 px-1">
                  <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1A15] px-3 py-1.5 text-[11.5px] font-bold text-white">
                    <Clock className="h-3 w-3" />
                    {booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}
                  </span>
                  <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 transition hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-blue-700">End Date</p>
                  </div>
                  <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{formatDate(booking.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Assigned Operator ── */}
          {booking.operator && ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) && (
            <div className={CARD}>
              <div className={CARD_HEAD}><p className={CARD_LABEL}>Assigned Operator</p></div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <User className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold leading-tight text-gray-900">{booking.operator.name}</p>
                    <p className="mt-1 text-xs text-gray-500">Equipment Operator</p>
                  </div>
                  <a
                    href={`tel:${booking.operator.phone}`}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-[12.5px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Call
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── OTPs ── */}
          {booking.deliveryOtp && ['CONFIRMED', 'DELIVERED'].includes(booking.status) && (
            <OtpPanel
              label="Delivery Verification"
              otp={booking.deliveryOtp}
              hint="Share this OTP with the operator to confirm equipment delivery"
              gradient="bg-[linear-gradient(125deg,#B45309,#F59E0B)] shadow-[0_18px_44px_-14px_rgba(245,158,11,.5)]"
            />
          )}
          {booking.returnOtp && ['PICKUP_SCHEDULED', 'IN_USE'].includes(booking.status) && (
            <OtpPanel
              label="Return Verification"
              otp={booking.returnOtp}
              hint="Share this OTP with the operator to confirm equipment return"
              gradient="bg-[linear-gradient(125deg,#056B3E,#09B368)] shadow-[0_18px_44px_-14px_rgba(9,179,104,.5)]"
            />
          )}

          {/* ── Payment Details ── */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <p className={CARD_LABEL}>Payment Details</p>
              {booking.paymentStatus && (
                <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold capitalize text-gray-500">
                  {booking.paymentStatus.toLowerCase()}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Daily Rate</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.dailyRate?.toLocaleString('en-IN')}/day</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Rental Duration</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">
                    {booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] text-gray-500">Base Amount</span>
                  <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.baseAmount?.toLocaleString('en-IN')}</span>
                </div>
                {booking.additionalCharges > 0 && (
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] text-gray-500">Additional Charges</span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.additionalCharges?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                  <span className="text-sm font-extrabold text-gray-900">Total Amount</span>
                  <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {booking.advancePaid && booking.advancePaid > 0 ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#056B3E]">
                      <CheckCircle className="h-3.5 w-3.5" /> Advance Paid
                    </span>
                    <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">- ₹{booking.advancePaid?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                    <span className="text-[12.5px] font-semibold text-[#056B3E]">Balance Due</span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{booking.balanceAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Cancellation Details ── */}
          {booking.status === 'CANCELLED' && booking.cancelledAt && (
            <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-3">
                <XCircle className="h-3.5 w-3.5 text-red-700" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-red-700">Cancellation Details</p>
              </div>
              <div className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5">
                    <span className="text-xs text-gray-400">Cancelled At</span>
                    <span className="text-[12.5px] font-semibold text-gray-800">
                      {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                    </span>
                  </div>
                  {booking.cancelledBy && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs text-gray-400">Cancelled By</span>
                      <span className="text-[12.5px] font-semibold capitalize text-gray-800">{booking.cancelledBy}</span>
                    </div>
                  )}
                </div>
                {booking.cancellationReason && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-red-700">Reason</p>
                    <p className="text-[13.5px] leading-relaxed text-red-800">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Your Rating ── */}
          {booking.status === 'COMPLETED' && booking.rating && (
            <div className={CARD}>
              <div className={CARD_HEAD}><p className={CARD_LABEL}>Your Rating</p></div>
              <div className="p-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= booking.rating! ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                    />
                  ))}
                  <span className="ml-2 text-[13px] font-bold text-gray-700">{booking.rating}/5</span>
                </div>
                {booking.review && <p className="mt-3 text-[13.5px] leading-relaxed text-gray-600">{booking.review}</p>}
              </div>
            </div>
          )}
        </div>
        {/* ══ /Left column ══ */}

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          {/* ── Vendor ── */}
          {booking.vendor && (
            <div className={CARD}>
              <div className={CARD_HEAD}><p className={CARD_LABEL}>Vendor</p></div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-2xl border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF]">
                    <Wrench className="h-5 w-5 text-[#056B3E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold leading-tight text-gray-900">{booking.vendor.name}</p>
                    {booking.vendor.rating > 0 && (
                      <div className="mt-1 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${s <= Math.round(booking.vendor!.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                          />
                        ))}
                        <span className="ml-1.5 text-[11.5px] font-semibold text-gray-500">{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {booking.vendor.phone && <p className="mt-1 text-xs tabular-nums text-gray-500">{booking.vendor.phone}</p>}
                  </div>
                </div>
                <a
                  href={`tel:${booking.vendor.phone}`}
                  className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#09B368] px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Call Vendor
                </a>
              </div>
            </div>
          )}

          <div className={CARD}>
            <div className={CARD_HEAD}><p className={CARD_LABEL}>Need a hand</p></div>
            <div className="p-4">
              {/* Dark strip so the panel reads as a support desk rather than a
                  fourth stack of grey rows. */}
              <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#01301B_0%,#056B3E_62%,#078F53_100%)] p-4 text-white">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(300px 140px at 100% -30%, rgba(42,210,145,.45), transparent 62%),' +
                      'repeating-linear-gradient(128deg, rgba(255,255,255,.05) 0 1px, transparent 1px 34px)',
                  }}
                />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.22] bg-white/[0.16]">
                    <Headphones className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold leading-tight">Need help with this rental?</p>
                    <p className="mt-0.5 text-[11.5px] tabular-nums text-white/[0.66]">Booking {booking.bookingNumber}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {booking.status === 'COMPLETED' && !booking.rating && (
                  <button
                    onClick={() => setShowRateModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:bg-amber-600"
                  >
                    <Star className="h-4 w-4 fill-white" />
                    Rate Your Experience
                  </button>
                )}

                {booking.vendor && (
                  <button onClick={() => setShowChat(true)} className={ACTION_ROW}>
                    <span className={`${ACTION_ICON} bg-[#E9FAF2] text-[#056B3E]`}><MessageCircle className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-gray-800">Chat with Vendor</span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-gray-400">Message {booking.vendor.name}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
                  </button>
                )}

                <button onClick={downloadInvoice} className={ACTION_ROW}>
                  <span className={`${ACTION_ICON} bg-blue-50 text-blue-700`}><FileText className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-gray-800">Download Invoice</span>
                    <span className="mt-0.5 block text-[11.5px] text-gray-400">Tax invoice for this booking</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
                </button>

                <Link href="/customer/helpdesk" className={ACTION_ROW}>
                  <span className={`${ACTION_ICON} bg-amber-50 text-amber-700`}><HelpCircle className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-gray-800">Contact Support</span>
                    <span className="mt-0.5 block text-[11.5px] text-gray-400">Reach the TransRentals helpdesk</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
                </Link>

                <Link href="/customer/dashboard" className={ACTION_ROW}>
                  <span className={`${ACTION_ICON} bg-gray-100 text-gray-500`}><LayoutGrid className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-gray-800">Back to Dashboard</span>
                    <span className="mt-0.5 block text-[11.5px] text-gray-400">All your bookings in one place</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
                </Link>
              </div>
            </div>
          </div>
        </aside>
        {/* ══ /Right rail ══ */}
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012314]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Star className="h-8 w-8 fill-amber-500 text-amber-500" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">How was your rental?</h2>
              <p className="text-[13px] text-gray-500">Your feedback helps us improve our service.</p>
            </div>

            <div className="mb-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110">
                  <Star className={`h-10 w-10 transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12.5px] font-semibold text-gray-700">
                Share your experience (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you like or what could be better?"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[13px] outline-none transition-all focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-[13.5px] font-bold text-gray-600 transition hover:bg-gray-50"
                onClick={() => setShowRateModal(false)}
                disabled={isSubmittingRating}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-amber-500 px-6 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && booking?.vendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl bg-[linear-gradient(118deg,#056B3E_0%,#078F53_60%,#09B368_100%)] p-5 text-white">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">{booking.vendor.name}</h3>
                <p className="text-xs text-white/[0.72]">Equipment Booking #{booking.bookingNumber}</p>
              </div>
              <button onClick={() => setShowChat(false)} className="rounded-full p-2 transition hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {isLoadingMessages ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#09B368]" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="mb-2 h-10 w-10" />
                  <p className="text-[13px]">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'customer' ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="break-words text-[13px]">{msg.message}</p>
                      <p className={`mt-1 text-[11px] ${msg.sender_type === 'customer' ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendChatMessage()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:border-[#96E4C2] focus:ring-2 focus:ring-[#E9FAF2]"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim() || isSendingMessage}
                  className="flex items-center gap-2 rounded-xl bg-[#09B368] px-5 py-3 text-[13.5px] font-bold text-white transition hover:bg-[#078F53] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Send className="h-4 w-4" />Send</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
