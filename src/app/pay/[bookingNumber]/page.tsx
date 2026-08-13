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
  Lock,
  CreditCard,
  Car,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Gauge,
  User,
  CheckCircle,
  MessageCircle,
  FileText,
  RefreshCw,
  ChevronRight,
  Headphones,
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
  // ── also returned by the same API call, shown in the summary panels ──
  tripType?: string;
  pickupAddress?: string;
  dropCity?: string;
  totalDays?: number;
  localPackageId?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  baseFare?: number;
  perKmRate?: number;
  chargeableKm?: number;
  kmCharges?: number;
  driverBatta?: number;
  nightCharges?: number;
  tollCharges?: number;
  statePermitCharges?: number;
  gstAmount?: number;
  platformFee?: number;
  paidAmount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  driverName?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  source?: string;
  bookingMode?: string;
  createdAt?: string;
}

/** Presentation only — label for the status the API already returns. */
const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_SUBMITTED: 'Payment Under Review',
  PENDING_VENDOR: 'Finding Driver',
  BROADCASTED: 'Finding Driver',
  ACCEPTED: 'Confirmed',
  DRIVER_ASSIGNED: 'Driver Assigned',
  IN_PROGRESS: 'Trip in Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** Presentation only — which of the four steps the booking has reached. */
const FLOW_STEPS = ['Pay advance', 'Vendor accepts', 'Driver assigned', 'Trip starts'];
const FLOW_INDEX_BY_STATUS: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PAYMENT_SUBMITTED: 0,
  PENDING_VENDOR: 1,
  BROADCASTED: 1,
  ACCEPTED: 2,
  DRIVER_ASSIGNED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 3,
};

const CARD = 'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm';
const CARD_HEAD = 'flex items-center justify-between gap-3 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3';
const CARD_LABEL = 'text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400';

/** One labelled tile in the trip summary. */
function Tile({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: React.ReactNode; highlight?: boolean }) {
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
}

/** One charge line. Zero rows stay visible but recede. */
function FareRow({ label, amount }: { label: string; amount?: number }) {
  const zero = !amount;
  return (
    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
      <span className={`text-[12.5px] ${zero ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-[13px] tabular-nums ${zero ? 'font-medium text-gray-400' : 'font-bold text-gray-800'}`}>
        ₹{(amount || 0).toLocaleString('en-IN')}
      </span>
    </div>
  );
}

/** Key/value row in the info panels. */
function MetaRow({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === '') return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5 last:border-b-0">
      <span className="text-xs text-gray-400">{k}</span>
      <span className="break-words text-right text-[12.5px] font-semibold text-gray-800">{v}</span>
    </div>
  );
}

/** One action in the help panel. */
function HelpRow({ icon: Icon, title, hint, href }: { icon: any; title: string; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:border-[#C8F1DF] hover:bg-[#FCFDFC] hover:shadow-[0_8px_20px_-12px_rgba(1,35,20,.35)]"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition group-hover:bg-[#E9FAF2] group-hover:text-[#056B3E]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-gray-800">{title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-gray-400">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
    </Link>
  );
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
          <Loader2 className="w-8 h-8 animate-spin text-[#09B368] mx-auto mb-3" />
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
          <Link href="/" className="inline-block px-6 py-2.5 bg-[#09B368] text-white rounded-xl font-bold text-sm hover:bg-[#078F53]">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const vehicleName = booking?.requestedVehicleName || booking?.carCategoryName || booking?.carCategory;
  const cityName = booking?.locationName || booking?.pickupCity;
  const balanceAfterAdvance = booking ? booking.grandTotal - advanceAmount : 0;
  const tripTypeLabel = booking?.tripType ? booking.tripType.replace(/_/g, ' ').toLowerCase() : '';
  const flowIdx = booking ? (FLOW_INDEX_BY_STATUS[booking.status] ?? 0) : 0;
  const permitAndToll = (booking?.tollCharges || 0) + (booking?.statePermitCharges || 0);

  return (
    // LayoutWrapper offsets content by md:pt-[88px] but the fixed site header is
    // 134px tall on desktop, so the first 46px of any page sits behind it. This
    // page starts with a slim bar, so it reclaims those 46px for itself.
    <div className="min-h-screen bg-gray-50 pb-24 md:pt-[46px] lg:pb-10">
      {/* ── Header ── */}
      <header className="sticky top-16 z-40 h-14 border-b border-gray-100 bg-white/90 backdrop-blur-xl md:top-[134px]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[13.5px] font-extrabold leading-tight text-gray-900">Complete Payment</p>
            <p className="text-[11.5px] tabular-nums text-gray-400">#{bookingNumber}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1.5 text-[11px] font-bold text-[#056B3E]">
            <Shield className="w-3 h-3" />
            Secure
          </span>
        </div>
      </header>

      <div>
        {/* ── Amount hero ── */}
        <section className="tr-pay-hero relative overflow-hidden rounded-b-3xl bg-[#012314] text-white">
          {/* Hero-only keyframes. Names are prefixed so they cannot collide with
              anything else, and everything is disabled under reduced motion. */}
          <style>{`
            @keyframes tr-pay-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
            @keyframes tr-pay-sheen {
              0%   { transform: translateX(-130%) skewX(-18deg) }
              55%, 100% { transform: translateX(420%) skewX(-18deg) }
            }
            @media (prefers-reduced-motion: reduce) {
              .tr-pay-hero, .tr-pay-hero * {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            }
          `}</style>
          <div className="absolute inset-0 bg-[linear-gradient(118deg,#056B3E_0%,#078F53_42%,#09B368_100%)]" />
          {/* slow light sweep */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1/2 left-0 h-[220%] w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)]"
            style={{ animation: 'tr-pay-sheen 7s cubic-bezier(.2,.9,.25,1) 1.2s infinite' }}
          />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(680px 300px at 90% -30%, rgba(255,255,255,.24), transparent 60%),' +
                'radial-gradient(460px 240px at 4% 130%, rgba(1,35,20,.6), transparent 58%),' +
                'repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 1px, transparent 1px 46px)',
            }}
          />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-7">

              {/* Amount */}
              <div className="min-w-[280px] flex-1">
                <div className="flex flex-wrap items-center gap-2.5 animate-fade-in-up [animation-fill-mode:both]">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    <CreditCard className="w-3 h-3" />
                    Advance to pay now
                  </p>
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-white/[0.72]">
                    {bookingNumber}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 animate-fade-in-up [animation-delay:80ms] [animation-fill-mode:both]">
                  <span className="flex items-center text-[clamp(40px,7vw,58px)] font-extrabold leading-none tracking-[-0.038em] tabular-nums drop-shadow-[0_2px_12px_rgba(1,35,20,.35)]">
                    <IndianRupee className="w-[0.6em] h-[0.6em]" strokeWidth={2.7} />
                    {advanceAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-white/70">
                    of ₹{booking?.grandTotal.toLocaleString('en-IN')} total ·{' '}
                    <span className="font-bold text-white">{advancePercent}% advance</span>
                  </span>
                </div>

                {/* advance / balance split — the fill grows in from the left */}
                <div className="mt-4 flex h-1.5 max-w-md overflow-hidden rounded-full bg-white/20 animate-fade-in-up [animation-delay:160ms] [animation-fill-mode:both]">
                  <span
                    className="block h-full origin-left rounded-full bg-white"
                    style={{ width: `${advancePercent}%`, animation: 'tr-pay-grow .9s cubic-bezier(.2,.9,.25,1) .4s both' }}
                  />
                  <span
                    className="block h-full origin-left bg-white/[0.38]"
                    style={{ width: `${100 - advancePercent}%`, animation: 'tr-pay-grow .9s cubic-bezier(.2,.9,.25,1) .55s both' }}
                  />
                </div>
                <div className="mt-2 flex max-w-md justify-between text-[10.5px] font-bold text-white/[0.62] animate-fade-in-up [animation-delay:220ms] [animation-fill-mode:both]">
                  <span className="tabular-nums">Advance ₹{advanceAmount.toLocaleString('en-IN')}</span>
                  <span className="tabular-nums">Balance after trip ₹{balanceAfterAdvance.toLocaleString('en-IN')}</span>
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-white/[0.6] animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:both]">
                  <Lock className="w-3 h-3" />
                  Pay securely with UPI, cards, net banking or wallets
                </p>
              </div>

              {/* Trip strip — same treatment as the booking pages */}
              <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:both] [&>div]:transition-colors [&>div]:duration-300 [&>div:hover]:bg-white/[0.08]">
                <div className="px-5 py-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">
                    <Car className="w-3 h-3" />Vehicle
                  </p>
                  <p className="mt-1 text-[15px] font-extrabold capitalize whitespace-nowrap">{vehicleName || '—'}</p>
                </div>
                <div className="border-l border-white/[0.12] px-5 py-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">
                    <Navigation className="w-3 h-3" />Trip
                  </p>
                  <p className="mt-1 text-[15px] font-extrabold capitalize whitespace-nowrap">{tripTypeLabel || '—'}</p>
                  {booking?.localPackageId && (
                    <p className="mt-0.5 text-[11px] tabular-nums text-white/[0.62] whitespace-nowrap">
                      {booking.localPackageHours} hrs / {booking.localPackageKm} km
                    </p>
                  )}
                </div>
                <div className="border-t border-white/[0.12] px-5 py-3.5 sm:border-t-0 sm:border-l">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">
                    <MapPin className="w-3 h-3" />City
                  </p>
                  <p className="mt-1 text-[15px] font-extrabold whitespace-nowrap">{cityName || '—'}</p>
                </div>
                <div className="border-l border-t border-white/[0.12] px-5 py-3.5 sm:border-t-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">
                    <Calendar className="w-3 h-3" />Pickup
                  </p>
                  <p className="mt-1 text-[15px] font-extrabold tabular-nums whitespace-nowrap">
                    {booking?.pickupDate
                      ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                  {booking?.pickupTime && (
                    <p className="mt-0.5 text-[11px] tabular-nums text-white/[0.62] whitespace-nowrap">{booking.pickupTime}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5 lg:px-8">

          {/* ══ Left ══ */}
          <div className="flex min-w-0 flex-col gap-4">

            {/* Pay card */}
            {booking && (
              // Split card, same as the bike/bus booking pages: amount stub on the
              // left, the payment widget on the right. When the much taller UPI /
              // bank-transfer panel is showing, the `:has()` rule drops the card
              // back to one column so the stub becomes a band across the top
              // instead of a half-empty green column — the page keeps its two
              // columns either way.
              <section
                id="pay"
                className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_20px_52px_-22px_rgba(1,35,20,.45)] lg:grid-cols-[1.08fr_0.92fr] lg:has-[[data-manual-payment]]:grid-cols-1"
              >
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
                  <div className="relative z-10">
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
                        ₹{advanceAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs tabular-nums text-white/[0.68]">
                        of ₹{booking.grandTotal.toLocaleString('en-IN')} total ·{' '}
                        <span className="font-bold text-white">{advancePercent}% advance</span>
                      </span>
                    </div>
                    <p className="mt-4 text-[11px] font-semibold tabular-nums text-white/[0.6]">
                      Balance after trip · ₹{balanceAfterAdvance.toLocaleString('en-IN')}
                    </p>
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
                    bookingType="chauffeur"
                    amount={advanceAmount}
                    bookingNumber={booking.bookingNumber}
                    onSuccess={() => router.push(`/customer/dashboard`)}
                    embedded
                  />
                </div>
              </section>
            )}

            {/* What happens next */}
            {booking && (
              <section className={CARD}>
                <div className={CARD_HEAD}>
                  <p className={CARD_LABEL}>What happens next</p>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FLOW_STEPS.map((step, i) => {
                      const isDone = i < flowIdx;
                      const isNow = i === flowIdx;
                      return (
                        <div key={step} className="relative min-w-[118px] flex-1 pt-6 text-center">
                          {i > 0 && (
                            <span className="absolute top-[8px] left-[calc(-50%+11px)] right-[calc(50%+11px)] h-0.5 overflow-hidden rounded-sm bg-gray-200">
                              <span className={`block h-full rounded-sm bg-[#09B368] transition-[width] duration-700 ${i <= flowIdx ? 'w-full' : 'w-0'}`} />
                            </span>
                          )}
                          <span
                            className={`absolute left-1/2 top-0 z-10 flex h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full border-2 transition ${
                              isNow
                                ? 'border-[#09B368] bg-[#E9FAF2] text-[#056B3E] shadow-[0_0_0_4px_#E9FAF2]'
                                : isDone
                                  ? 'border-[#09B368] bg-[#09B368] text-white'
                                  : 'border-gray-200 bg-white text-transparent'
                            }`}
                          >
                            <CheckCircle className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </span>
                          <span className={`block text-[11px] leading-tight ${isNow ? 'font-extrabold text-[#056B3E]' : isDone ? 'font-semibold text-gray-600' : 'font-semibold text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Trip Summary */}
            {booking && (
              <section className={CARD}>
                <div className={CARD_HEAD}>
                  <p className={CARD_LABEL}>Trip Summary</p>
                  {booking.localPackageId && (
                    <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold text-[#056B3E]">
                      Local Package
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] p-3.5">
                    <span className="mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[#09B368] text-white">
                      <MapPin className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[#056B3E]">Pickup</p>
                      <p className="mt-1 text-[16px] font-extrabold text-gray-900">
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {booking.pickupTime ? ` · ${booking.pickupTime}` : ''}
                      </p>
                      {(booking.pickupAddress || cityName) && (
                        <p className="mt-0.5 break-words text-[12.5px] text-gray-500">{booking.pickupAddress || cityName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    <Tile icon={Car} label="Vehicle" value={vehicleName ? <span className="capitalize">{vehicleName}</span> : null} />
                    <Tile icon={Navigation} label="Trip Type" value={tripTypeLabel ? <span className="capitalize">{tripTypeLabel}</span> : null} highlight />
                    <Tile icon={Clock} label="Package Hours" value={booking.localPackageHours ? `${booking.localPackageHours} hrs` : null} />
                    <Tile icon={Gauge} label="Package KM" value={booking.localPackageKm ? `${booking.localPackageKm} km` : null} />
                    <Tile icon={Gauge} label="Distance" value={booking.chargeableKm ? `${booking.chargeableKm} km` : null} />
                    <Tile icon={MapPin} label="Pickup City" value={cityName} />
                    <Tile icon={MapPin} label="Drop City" value={booking.dropCity} />
                    <Tile icon={Calendar} label="Duration" value={booking.totalDays ? `${booking.totalDays} day${booking.totalDays > 1 ? 's' : ''}` : null} />
                  </div>
                </div>
              </section>
            )}

            {/* Fare Breakdown */}
            {booking && (
              <section className={CARD}>
                <div className={CARD_HEAD}>
                  <p className={CARD_LABEL}>Fare Breakdown</p>
                  {booking.paymentStatus && (
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold capitalize text-gray-500">
                      {booking.paymentStatus.toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
                    <FareRow label="Base Fare" amount={booking.baseFare} />
                    <FareRow label="Distance Charges" amount={booking.kmCharges} />
                    <FareRow label="Driver Batta" amount={booking.driverBatta} />
                    <FareRow label="Night Charges" amount={booking.nightCharges} />
                    <FareRow label="Toll & State Permit" amount={permitAndToll} />
                    <FareRow label="GST" amount={booking.gstAmount} />
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                      <span className="text-sm font-extrabold text-gray-900">Grand Total</span>
                      <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">
                        ₹{booking.grandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-semibold text-[#056B3E]">Advance ({advancePercent}%)</span>
                      <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{advanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                      <span className="text-[12.5px] font-semibold text-[#056B3E]">Paid so far</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{(booking.paidAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                      <span className="text-[12.5px] font-semibold text-[#056B3E]">Balance after trip</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{balanceAfterAdvance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-relaxed text-gray-400">
                    Extra hours, extra kilometres, tolls and parking beyond the package are billed at the end of the trip.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ══ Right ══ */}
          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[72px]">

            {/* Booking Info */}
            {booking && (
              <section className={CARD}>
                <div className={CARD_HEAD}><p className={CARD_LABEL}>Booking Info</p></div>
                <div className="p-4">
                  <div className="flex flex-col">
                    <MetaRow k="Booking Number" v={<span className="tabular-nums">{booking.bookingNumber}</span>} />
                    <MetaRow k="Status" v={STATUS_LABELS[booking.status] || booking.status} />
                    <MetaRow k="Payment Status" v={booking.paymentStatus ? <span className="capitalize">{booking.paymentStatus.toLowerCase()}</span> : null} />
                    <MetaRow
                      k="Booked On"
                      v={booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null}
                    />
                    <MetaRow k="Booked By" v={booking.customerName} />
                    <MetaRow k="Contact" v={booking.customerPhone ? <span className="tabular-nums">{booking.customerPhone}</span> : null} />
                    <MetaRow k="Email" v={booking.customerEmail} />
                    <MetaRow k="Booking Mode" v={booking.bookingMode ? <span className="capitalize">{booking.bookingMode.toLowerCase()}</span> : null} />
                    <MetaRow k="Source" v={booking.source ? <span className="capitalize">{booking.source}</span> : null} />
                  </div>
                </div>
              </section>
            )}

            {/* Driver & Vehicle */}
            {booking && (
              <section className={CARD}>
                <div className={CARD_HEAD}>
                  <p className={CARD_LABEL}>Driver &amp; Vehicle</p>
                  {!booking.driverName && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                      After confirmation
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Tile icon={User} label="Driver" value={booking.driverName || <span className="font-medium text-gray-400">Assigned after payment</span>} />
                    <Tile
                      icon={Car}
                      label="Vehicle Number"
                      value={booking.vehicleNumber || <span className="font-medium text-gray-400">Shared before pickup</span>}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Need a hand */}
            <section className={CARD}>
              <div className={CARD_HEAD}><p className={CARD_LABEL}>Need a hand</p></div>
              <div className="p-4">
                <div className="relative overflow-hidden rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(140deg,#E9FAF2_0%,#FFFFFF_78%)] p-3.5">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(240px 120px at 100% -40%, rgba(9,179,104,.16), transparent 62%)' }}
                  />
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#09B368] text-white shadow-lg shadow-[#09B368]/25">
                      <Headphones className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-extrabold leading-tight text-gray-900">Payment not going through?</p>
                      <p className="mt-0.5 text-[11.5px] tabular-nums text-gray-500">Booking {bookingNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <HelpRow icon={RefreshCw} title="Retry Payment" hint="Jump back to the payment options" href="#pay" />
                  <HelpRow icon={MessageCircle} title="Contact Support" hint="Raise it with the TransRentals helpdesk" href="/customer/helpdesk" />
                  <HelpRow
                    icon={FileText}
                    title="View Booking Details"
                    hint="Full trip, fare and driver details"
                    href={`/customer/car-rental-bookings/${bookingNumber}`}
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* ── Trust strip ── */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pb-6 text-[11.5px] text-gray-400 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5"><Shield className="w-3 h-3" />Secure payment</span>
          <span className="h-1 w-1 rounded-full bg-gray-200" />
          <span className="inline-flex items-center gap-1.5"><Lock className="w-3 h-3" />Encrypted by Razorpay</span>
          <span className="h-1 w-1 rounded-full bg-gray-200" />
          <span>24/7 Support</span>
        </div>
      </div>

      {/* ── Mobile sticky pay bar ── */}
      {booking && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pb-3 pt-2.5 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0">
              <p className="text-[19px] font-extrabold leading-tight tabular-nums text-gray-900">
                ₹{advanceAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10.5px] tabular-nums text-gray-400">
                {advancePercent}% of ₹{booking.grandTotal.toLocaleString('en-IN')}
              </p>
            </div>
            <a
              href="#pay"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#09B368] px-4 py-3 text-[13.5px] font-extrabold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
            >
              <Lock className="w-4 h-4" />
              Pay Securely
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
