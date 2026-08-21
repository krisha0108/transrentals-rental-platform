'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bike,
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Shield,
  ThumbsUp,
  MessageSquare,
  HardHat,
  Gauge,
  RefreshCw,
  Loader2,
  ChevronDown,
  CreditCard,
  FileText,
  Hash,
  StickyNote,
  ShieldCheck,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { quoteDisplay } from '@/lib/quote-font';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { formatBookingDuration } from '@/lib/utils/duration';
import CustomerHeader from '@/components/customer/CustomerHeader';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import QuotePaymentSafetyNotice from '@/components/customer/QuotePaymentSafetyNotice';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  // The page has always read `vehicle_modelsName` first; the API actually
  // returns `vehicleModelName`, so both stay in the fallback chain below.
  vehicle_modelsName?: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  vehicleCategory?: string;
  vehicleCategoryName?: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  helmetsRequired?: number;
  numberOfVehicles?: number;
  pickupAddress?: string;
  customerNotes?: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalQuotesReceived?: number;
  quotesOpenTill?: string;
  expiresAt?: string;
  createdAt?: string;
}

interface VendorQuote {
  id: string;
  quoteNumber: string;
  vendorId: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  vehicleCategory?: string;
  registrationNumber?: string;
  vehicleImages?: string;
  vehicleFeatures?: string;
  dailyRate: number;
  totalPrice?: number;
  totalAmount: number;
  gstAmount: number;
  securityDeposit: number;
  grandTotal: number;
  advancePercent: number;
  advanceAmount: number;
  helmetsIncluded: number;
  kmLimitPerDay?: number;
  unlimitedKm?: boolean;
  extraKmCharge?: number;
  inclusions?: string;
  exclusions?: string;
  termsConditions?: string;
  vendorMessage?: string;
  validTill: string;
  validityDays: number;
  viewCount: number;
  status: string;
  vendors: {
    id: string;
    businessName: string;
    rating?: number;
    totalTrips?: number;
    logo?: string | null;
  };
  createdAt: string;
}

export default function CustomerBikeQuoteDetailPage() {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReRequesting, setIsReRequesting] = useState(false);
  const [reRequestSuccess, setReRequestSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push(`/customer/login?redirect=/customer/bike-quotes/${params.id}`);
      return;
    }

    fetchQuoteRequest();
    fetchReRequestCount();
  }, [authLoading, isAuthenticated, customer, params.id]);

  const fetchReRequestCount = async () => {
    try {
      const res = await fetch(`/api/customer/re-request-quotes?serviceType=bike&requestId=${params.id}`);
      const data = await res.json();
      setRemainingAttempts(data.remainingAttempts ?? 3);
    } catch {}
  };

  const fetchQuoteRequest = async () => {
    try {
      // Fetch quote request details
      const response = await fetch(`/api/bike-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRequest(data.request);
        const parsedQuotes = (data.quotes || []).map((quote: any) => ({
          ...quote,
          inclusions: Array.isArray(quote.inclusions)
            ? quote.inclusions
            : typeof quote.inclusions === 'string' && quote.inclusions
            ? quote.inclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          exclusions: Array.isArray(quote.exclusions)
            ? quote.exclusions
            : typeof quote.exclusions === 'string' && quote.exclusions
            ? quote.exclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          termsConditions: Array.isArray(quote.termsConditions)
            ? quote.termsConditions
            : typeof quote.termsConditions === 'string' && quote.termsConditions
            ? quote.termsConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        }));
        setQuotes(parsedQuotes);
      } else {
        setError(data.error || 'Failed to fetch quote request');
      }
    } catch (err) {
      console.error('Failed to fetch quote request:', err);
      setError('Failed to load quote request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!selectedQuote) return;
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/accept-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'bike',
          quoteRequestId: params.id,
          quoteId: selectedQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to booking detail page for payment
        router.push(`/customer/bike-bookings/${data.bookingId}`);
      } else {
        setError(data.message || 'Failed to accept quote');
      }
    } catch (err) {
      setError('Failed to accept quote. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    setError(null);
    try {
      const response = await fetch(`/api/bike-quote-requests/${params.id}`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (data.success) {
        router.push('/customer/bike-quotes');
      } else {
        setError(data.error || 'Failed to cancel request');
        setShowCancelConfirm(false);
      }
    } catch {
      setError('Failed to cancel request. Please try again.');
      setShowCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReRequestQuotes = async () => {
    if (!customer) return;
    setIsReRequesting(true);
    setError(null);
    setReRequestSuccess(null);

    try {
      const response = await fetch('/api/customer/re-request-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'bike',
          requestId: params.id,
          customerId: customer.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReRequestSuccess(data.message);
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
        setTimeout(() => fetchQuoteRequest(), 3000);
      } else {
        setError(data.message || 'Failed to re-request quotes');
      }
    } catch {
      setError('Failed to re-request quotes. Please try again.');
    } finally {
      setIsReRequesting(false);
    }
  };

  const allQuotesExpired = quotes.length > 0 && quotes.every(q => {
    if (!q.validTill) return q.status === 'EXPIRED';
    return new Date(q.validTill).getTime() < Date.now();
  });
  const bookingDateInFuture = request?.pickupDate && new Date(request.pickupDate) > new Date();
  const canReRequestQuotes = allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && remainingAttempts > 0;

  const parseJsonSafe = (str: string | undefined | null): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    const aExpired = a.validTill && new Date(a.validTill).getTime() < Date.now() ? 1 : 0;
    const bExpired = b.validTill && new Date(b.validTill).getTime() < Date.now() ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired;
    return a.grandTotal - b.grandTotal;
  });
  const activeQuotes = sortedQuotes.filter(q => !(q.validTill && new Date(q.validTill).getTime() < Date.now()));
  const lowestPrice = activeQuotes[0]?.grandTotal ?? sortedQuotes[0]?.grandTotal;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Request</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/customer/dashboard" className="text-emerald-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request Not Found</h3>
          <Link href="/customer/dashboard" className="text-emerald-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────
     Presentation helpers. Everything below derives from the state
     already fetched above — no new requests, no new state.
     ──────────────────────────────────────────────────────────────── */

  const CARD = 'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm';
  const CARD_HEAD = 'flex items-center justify-between gap-3 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3';
  const CARD_LABEL = 'quote-serif text-[18px] font-medium text-gray-600';
  const BTN = 'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition active:translate-y-px';

  const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Awaiting Quotes', cls: 'bg-[#FEF3C7] text-[#92400E]' },
    QUOTES_RECEIVED: { label: 'Quotes Received', cls: 'bg-[#D1FAE5] text-[#065F46]' },
    QUOTE_SENT: { label: 'Quotes Received', cls: 'bg-[#D1FAE5] text-[#065F46]' },
    BOOKED: { label: 'Booked', cls: 'bg-gray-100 text-gray-700' },
    CONFIRMED: { label: 'Booked', cls: 'bg-gray-100 text-gray-700' },
    EXPIRED: { label: 'Quotes Expired', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  };
  const statusChip =
    STATUS_CHIP[request.status] || { label: request.status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-700' };

  const fmtDateLong = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const fmtDateTime = (d?: string | null) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

  const bikeLabel =
    request.vehicle_modelsName || request.vehicleModelName || request.vehicleCategoryName || 'Any Bike';

  /** One row in a quote's price breakdown. */
  const FareRow = ({ label, value, variant }: { label: string; value: string; variant?: 'total' | 'advance' }) => (
    <div
      className={`flex items-center justify-between gap-3 bg-white ${
        variant === 'total' ? 'px-3.5 py-3' : 'px-3.5 py-2.5'
      } ${variant === 'advance' ? '!bg-[#E9FAF2]' : ''}`}
    >
      <span
        className={
          variant === 'total'
            ? 'text-[13.5px] font-extrabold text-gray-900'
            : variant === 'advance'
              ? 'text-[12.5px] font-extrabold text-[#056B3E]'
              : 'text-[12.5px] text-gray-500'
        }
      >
        {label}
      </span>
      <span
        className={
          variant === 'total'
            ? 'text-[17px] font-extrabold tabular-nums text-gray-900'
            : variant === 'advance'
              ? 'text-[13px] font-extrabold tabular-nums text-[#056B3E]'
              : 'text-[13px] font-bold tabular-nums text-gray-800'
        }
      >
        {value}
      </span>
    </div>
  );

  /** Section heading inside an expanded quote. */
  const DetailHead = ({ icon: Icon, label, tone }: { icon: any; label: string; tone: 'ok' | 'no' | 'neutral' }) => (
    <div className="mb-2.5 flex items-center gap-2">
      <span
        className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[7px] ${
          tone === 'ok' ? 'bg-[#E9FAF2] text-[#056B3E]' : tone === 'no' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <Icon className="h-3 w-3" />
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-500">{label}</span>
    </div>
  );

  /** One key/value line in the right-rail info card. */
  const MetaRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5 last:border-b-0">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="break-words text-right text-[12.5px] font-semibold text-gray-800">{value}</span>
      </div>
    );
  };

  const selected = selectedQuote ? quotes.find(q => q.id === selectedQuote) : undefined;

  return (
    // pt-16 clears the fixed CustomerHeader
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16 ${selectedQuote ? 'pb-32' : 'pb-10'}`}>
      <CustomerHeader showBackButton />

      {/* ══════════════ Hero ══════════════ */}
      <section className="relative overflow-hidden bg-[#012314] text-white">
        {/* Motion layers. Scoped class names so nothing here can leak into
            another page's stylesheet. */}
        <style>{`
          @keyframes trbqPan{to{background-position-x:-46px}}
          @keyframes trbqPosts{to{background-position-x:-96px}}
          @keyframes trbqHaze{to{transform:translate(70px,-26px) scale(1.18);opacity:.78}}
          @keyframes trbqRing{0%{opacity:.5;transform:scale(.94)}70%,100%{opacity:0;transform:scale(1.18)}}
          @keyframes trbqTarmac{to{background-position-x:-12px}}
          @keyframes trbqRide{
            0%{transform:translateX(0);opacity:0}
            6%{opacity:1}
            92%{opacity:1}
            100%{transform:translateX(calc(100cqw - 26px));opacity:0}}
          @keyframes trbqUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
          .trbq-up{animation:trbqUp .62s cubic-bezier(.2,.9,.25,1) var(--trbq-d,0s) both}
          /* A map grid drifting the same way the rider travels, so the whole
             panel reads as ground moving under the vehicle. Masked to a soft
             oval so it never looks like plain graph paper. */
          .trbq-grid{background-image:
              linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),
              linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);
            background-size:46px 46px;
            -webkit-mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            animation:trbqPan 22s linear infinite}
          /* Roadside posts sliding past in the foreground. Faster than the grid
             above, so the two speeds read as depth rather than one flat pattern. */
          .trbq-posts{background-image:repeating-linear-gradient(90deg,
              rgba(255,255,255,.11) 0 1px, transparent 1px 96px);
            -webkit-mask-image:linear-gradient(transparent 8%,#000 78%);
            mask-image:linear-gradient(transparent 8%,#000 78%);
            animation:trbqPosts 9s linear infinite}
          .trbq-haze{background:radial-gradient(circle,rgba(42,210,145,.34),transparent 68%);
            opacity:.5;filter:blur(46px);
            animation:trbqHaze 14s cubic-bezier(.2,.9,.25,1) infinite alternate}
          .trbq-tile::after{content:"";position:absolute;inset:-6px;border-radius:20px;
            border:1px solid rgba(255,255,255,.25);opacity:0;
            animation:trbqRing 3.4s cubic-bezier(.2,.9,.25,1) infinite}
          .trbq-lane{container-type:inline-size}
          /* Steady cruise: linear keeps the speed constant, and the dash rate
             is scaled to match it. */
          .trbq-tar{animation:trbqTarmac 1.6s linear infinite}
          .trbq-rider{animation:trbqRide 10s linear infinite}
          @media(prefers-reduced-motion:reduce){
            .trbq-up,.trbq-grid,.trbq-posts,.trbq-haze,.trbq-tile::after,
            .trbq-tar,.trbq-rider{animation:none!important}
            .trbq-up{opacity:1!important;transform:none!important}
          }
        `}</style>

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
        <span className="trbq-grid pointer-events-none absolute inset-0" />
        <span className="trbq-posts pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" />
        <span className="trbq-haze pointer-events-none absolute -left-16 top-8 h-[320px] w-[420px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 lg:px-8">
          {/* Back link + status */}
          <div className="trbq-up flex items-center justify-between gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
            <div className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-extrabold shadow-lg shadow-black/20 ${statusChip.cls}`}>
              {statusChip.label}
            </div>
          </div>

          {/* Title. The drop date and duration used to sit in a stat strip
              here, but the road below already carries both. */}
          <div className="mt-6">
            <div className="trbq-up flex min-w-0 items-center gap-4" style={{ ['--trbq-d' as any]: '.08s' }}>
              <span className="trbq-tile relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.24] bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Bike className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h1 className="quote-serif text-[30px] font-medium leading-[1.05] tracking-[-0.01em] sm:text-[38px]">{bikeLabel}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {request.requestNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                    <MapPin className="h-3.5 w-3.5" />
                    {request.locationName}
                  </span>
                  {(request.vehicleCategoryName || request.vehicleBrand) && (
                    <span className="text-xs text-white/[0.62]">
                      {[request.vehicleCategoryName, request.vehicleBrand].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Route strip — same shape as the truck-quotes hero */}
          <div
            className="trbq-up mt-[22px] flex flex-wrap items-center gap-3.5 rounded-[18px] border border-white/[0.15] bg-white/[0.08] px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
            style={{ ['--trbq-d' as any]: '.16s' }}
          >
            <div className="min-w-0 flex-[1_1_180px]">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Pickup</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{fmtDateLong(request.pickupDate)}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">
                {[request.pickupTime, request.pickupAddress].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="trbq-lane relative hidden h-[26px] min-w-[140px] flex-[2_1_200px] sm:block">
              <span className="trbq-tar absolute left-0 right-0 top-3 h-0.5 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.42)_0_6px,transparent_6px_12px)]" />
              <span className="trbq-rider absolute left-0 top-0 grid h-[26px] w-[26px] place-items-center rounded-lg bg-white text-[#056B3E]">
                <Bike className="h-[15px] w-[15px]" />
              </span>
            </div>
            <div className="min-w-0 flex-[1_1_180px] sm:text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Drop</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{fmtDateLong(request.dropDate)}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">
                {[request.dropTime, formatBookingDuration(request)].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ Body ══════════════ */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5 lg:px-8">
        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Error Display */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {/* Quotes */}
          {quotes.length === 0 ? (
            <section className={CARD}>
              <div className="px-5 py-11 text-center">
                <span className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50 text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                </span>
                <h3 className="text-base font-extrabold text-gray-900">Awaiting Quotes</h3>
                <p className="mt-1.5 text-[13px] text-gray-500">
                  Vendors are reviewing your request. You'll receive quotes within 24-48 hours.
                </p>
              </div>
            </section>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="quote-serif text-[26px] font-medium text-gray-900">
                  Compare Quotes <span className="text-gray-400">({quotes.length})</span>
                </h2>
                <span className="text-[11.5px] text-gray-400">Sorted by price</span>
              </div>

              <div className="flex flex-col gap-4">
                {sortedQuotes.map((quote) => {
                  const isExpanded = expandedQuote === quote.id;
                  const isSelected = selectedQuote === quote.id;
                  const isLowestPrice = quote.grandTotal === lowestPrice;
                  const isExpired = quote.validTill && new Date(quote.validTill).getTime() < Date.now();
                  const isExpiringSoon =
                    !isExpired && new Date(quote.validTill).getTime() - Date.now() < 24 * 3600000;
                  const inclusions = parseJsonSafe(quote.inclusions);
                  const exclusions = parseJsonSafe(quote.exclusions);
                  const terms = parseJsonSafe(quote.termsConditions);

                  const vendorName =
                    (quote as any).vendor?.businessName || quote.vendors?.businessName || 'Vendor';
                  const vendorRating = (quote as any).vendor?.rating || quote.vendors?.rating;
                  const vendorTrips = (quote as any).vendor?.totalTrips || quote.vendors?.totalTrips;

                  return (
                    <article
                      key={quote.id}
                      className={`overflow-hidden rounded-[18px] border-2 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(1,35,20,.4)] ${
                        isExpired
                          ? '!bg-gray-50 border-gray-200 opacity-[.78]'
                          : isSelected
                            ? 'border-[#09B368] shadow-[0_0_0_4px_#E9FAF2,0_18px_40px_-22px_rgba(1,35,20,.4)]'
                            : 'border-gray-100'
                      }`}
                    >
                      {/* Badges */}
                      {isExpired ? (
                        <div className="flex items-center gap-2 bg-[linear-gradient(90deg,#B91C1C,#EF4444)] px-4 py-[7px] text-[11px] font-extrabold tracking-wide text-white">
                          <XCircle className="h-3 w-3" />
                          Quote Expired
                        </div>
                      ) : isLowestPrice ? (
                        <div className="flex items-center gap-2 bg-[linear-gradient(90deg,#056B3E,#09B368)] px-4 py-[7px] text-[11px] font-extrabold tracking-wide text-white">
                          <ThumbsUp className="h-3 w-3" />
                          Best Price
                        </div>
                      ) : null}

                      {/* Vendor Info */}
                      <div className="flex flex-wrap items-start justify-between gap-3.5 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(135deg,#E9FAF2,#C8F1DF)] text-base font-extrabold text-[#056B3E]">
                            {vendorName.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="quote-serif text-[21px] font-medium leading-tight text-gray-900">{vendorName}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                  key={i}
                                  className={`h-[13px] w-[13px] ${
                                    vendorRating && i <= Math.round(vendorRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-gray-200 text-gray-200'
                                  }`}
                                />
                              ))}
                              <b className="ml-1.5 text-xs font-bold text-gray-700">
                                {vendorRating?.toFixed(1) || 'New'}
                              </b>
                              {(vendorTrips || 0) > 0 && (
                                <>
                                  <span className="text-xs text-gray-400">·</span>
                                  <span className="text-xs text-gray-400">{vendorTrips} trips</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-none text-right">
                          <p className="quote-serif text-[36px] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#056B3E]">
                            ₹{quote.grandTotal.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[11.5px] text-gray-400">for {request.totalDays} days</p>
                          {isExpiringSoon && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10.5px] font-extrabold text-red-700">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Expires soon!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                        <span className="text-sm font-extrabold text-gray-900">{quote.vehicleName}</span>
                        {quote.vehicleBrand && <span className="text-[12.5px] text-gray-400">· {quote.vehicleBrand}</span>}
                        {quote.registrationNumber && (
                          <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-[11.5px] font-bold text-gray-700">
                            {quote.registrationNumber}
                          </span>
                        )}
                        {quote.quoteNumber && (
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-500">
                            {quote.quoteNumber}
                          </span>
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="grid grid-cols-2 gap-2 px-4 pb-3.5 sm:grid-cols-4">
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <HardHat className="h-2.5 w-2.5" />
                            Helmets
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold text-gray-900">{quote.helmetsIncluded} included</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <Gauge className="h-2.5 w-2.5" />
                            KM Limit
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            {quote.unlimitedKm || quote.kmLimitPerDay === 0
                              ? 'Unlimited KM'
                              : quote.kmLimitPerDay
                                ? `${quote.kmLimitPerDay} km/day`
                                : 'No KM limit set'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <Shield className="h-2.5 w-2.5" />
                            Deposit
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            ₹{quote.securityDeposit.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <CreditCard className="h-2.5 w-2.5" />
                            Advance
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">{quote.advancePercent}%</p>
                        </div>
                      </div>

                      {/* Quick Inclusions */}
                      {inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-4 pb-3.5">
                          {inclusions.slice(0, 4).map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11px] font-bold text-[#056B3E]"
                            >
                              <CheckCircle className="h-2.5 w-2.5" />
                              {item}
                            </span>
                          ))}
                          {inclusions.length > 4 && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                              +{inclusions.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="flex flex-col gap-4 border-t border-gray-100 bg-[#FCFDFC] p-4">
                          {/* Price Breakdown */}
                          <div>
                            <DetailHead icon={CreditCard} label="Price Breakdown" tone="neutral" />
                            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-100">
                              <FareRow label={`Rental (${request.totalDays} days)`} value={`₹${quote.totalAmount.toLocaleString()}`} />
                              {quote.dailyRate > 0 && (
                                <FareRow label="Daily Rate" value={`₹${quote.dailyRate.toLocaleString()}/day`} />
                              )}
                              {quote.gstAmount > 0 && <FareRow label="GST" value={`₹${quote.gstAmount.toLocaleString()}`} />}
                              {quote.securityDeposit > 0 && (
                                <FareRow label="Security Deposit (Refundable)" value={`₹${quote.securityDeposit.toLocaleString()}`} />
                              )}
                              {quote.extraKmCharge ? (
                                <FareRow label="Extra KM Charge" value={`₹${quote.extraKmCharge.toLocaleString()}/km`} />
                              ) : null}
                              <FareRow
                                label="Total Amount to Pay"
                                value={`₹${(quote.grandTotal + (quote.securityDeposit || 0)).toLocaleString()}`}
                                variant="total"
                              />
                              <FareRow
                                label={`Advance ${quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}`.trim()}
                                value={`₹${quote.advanceAmount.toLocaleString()}`}
                                variant="advance"
                              />
                              <FareRow
                                label="Remaining at pickup"
                                value={`₹${(quote.grandTotal + (quote.securityDeposit || 0) - quote.advanceAmount).toLocaleString()}`}
                              />
                            </div>
                          </div>

                          {/* Vehicle Images */}
                          <VehicleImageGallery
                            vehicleImages={quote.vehicleImages}
                            vehicleName={quote.vehicleName}
                          />

                          {/* All Inclusions */}
                          {inclusions.length > 0 && (
                            <div>
                              <DetailHead icon={CheckCircle} label="Inclusions" tone="ok" />
                              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {inclusions.map((item, i) => (
                                  <li key={i} className="flex gap-2 text-[12.5px] leading-normal text-gray-700">
                                    <span className="mt-px flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-[#E9FAF2] text-[#056B3E]">
                                      <CheckCircle className="h-2.5 w-2.5" />
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exclusions */}
                          {exclusions.length > 0 && (
                            <div>
                              <DetailHead icon={XCircle} label="Exclusions" tone="no" />
                              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {exclusions.map((item, i) => (
                                  <li key={i} className="flex gap-2 text-[12.5px] leading-normal text-gray-700">
                                    <span className="mt-px flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-red-50 text-red-600">
                                      <XCircle className="h-2.5 w-2.5" />
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Terms */}
                          {terms.length > 0 && (
                            <div>
                              <DetailHead icon={FileText} label="Terms & Conditions" tone="neutral" />
                              <ul className="flex flex-col gap-1.5">
                                {terms.map((item, i) => (
                                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-gray-500">
                                    <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-gray-100 text-[10px] font-extrabold text-gray-500">
                                      {i + 1}
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor Notes */}
                          {quote.vendorMessage && (
                            <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] px-3.5 py-3">
                              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#056B3E]">
                                <MessageSquare className="h-[11px] w-[11px]" />
                                Message from Vendor
                              </p>
                              <p className="quote-serif text-[16px] italic leading-relaxed text-[#064E3B]">{quote.vendorMessage}</p>
                            </div>
                          )}

                          <div
                            className={`flex items-center gap-1.5 text-[11.5px] ${
                              isExpired ? 'font-bold text-red-600' : 'text-gray-400'
                            }`}
                          >
                            <Clock className="h-3 w-3 flex-none" />
                            {isExpired ? 'Expired on: ' : 'Valid until: '}
                            {new Date(quote.validTill).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                            {quote.viewCount > 0 && ` · viewed ${quote.viewCount} time${quote.viewCount > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2.5 border-t border-gray-100 p-4">
                        <button
                          onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                          className={`${BTN} flex-1 border border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:bg-gray-50`}
                        >
                          <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpired ? (
                          <div className={`${BTN} flex-1 cursor-not-allowed bg-red-50 text-red-600`}>Quote Expired</div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuote(quote.id)}
                            className={`${BTN} flex-1 ${
                              isSelected
                                ? 'bg-[#09B368] text-white shadow-[0_10px_15px_-3px_rgba(9,179,104,.25)] hover:-translate-y-0.5 hover:bg-[#078F53]'
                                : 'border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E] hover:-translate-y-0.5 hover:bg-[#C8F1DF]'
                            }`}
                          >
                            {isSelected && <CheckCircle className="h-4 w-4" />}
                            {isSelected ? 'Selected' : 'Select This Quote'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* Payment safety notice — sits under the quote cards, i.e. right
              where the customer is about to pick one. Outside the branch above
              so it stays visible while quotes are still pending too. */}
          <QuotePaymentSafetyNotice />

          {/* Re-Request Quotes Banner */}
          {allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && !reRequestSuccess && (
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#FFFBEB,#FFF7ED)]">
              <div className="flex items-start gap-3.5 p-[18px]">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h4 className="text-[15px] font-extrabold text-gray-900">All quotes have expired</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
                    Your booking date is still upcoming. You can re-open this request so vendors can send fresh quotes.
                  </p>
                  {remainingAttempts > 0 ? (
                    <button
                      onClick={handleReRequestQuotes}
                      disabled={isReRequesting}
                      className={`${BTN} mt-3 inline-flex bg-amber-500 px-[18px] text-white shadow-sm hover:-translate-y-0.5 hover:bg-amber-600 disabled:opacity-50`}
                    >
                      {isReRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending request...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Request Fresh Quotes
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      You have used all 3 re-request attempts. Please create a new quote request.
                    </p>
                  )}
                </div>
              </div>
              {remainingAttempts > 0 && (
                <div className="flex items-center justify-between gap-2.5 border-t border-amber-200 bg-amber-100/60 px-[18px] py-2.5">
                  <span className="text-[11.5px] font-semibold text-amber-700">
                    {remainingAttempts} of 3 re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full ${i <= 3 - remainingAttempts ? 'bg-amber-500' : 'bg-amber-300'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {reRequestSuccess && (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-[linear-gradient(120deg,#ECFDF5,#E9FAF2)]">
              <div className="flex items-start gap-3.5 p-[18px]">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#D1FAE5] text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h4 className="text-[15px] font-extrabold text-emerald-800">Request sent successfully!</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-emerald-700">{reRequestSuccess}</p>
                </div>
              </div>
              {remainingAttempts > 0 && (
                <div className="border-t border-emerald-200 bg-emerald-100/60 px-[18px] py-2.5">
                  <span className="text-[11.5px] font-semibold text-emerald-700">
                    {remainingAttempts} re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          {/* ── REQUEST DETAILS ── */}
          <section className={CARD}>
            {/* Dark head, same family as Booking Protection, so the rail reads
                as two proper documents rather than plain boxes. */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#01301B_0%,#056B3E_62%,#078F53_100%)] px-4 py-3.5 text-white">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(420px 180px at 100% -40%, rgba(42,210,145,.45), transparent 62%),' +
                    'repeating-linear-gradient(128deg, rgba(255,255,255,.045) 0 1px, transparent 1px 34px)',
                }}
              />
              <div className="relative z-10 flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                    <Bike className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="quote-serif block text-[18px] font-medium">Request Details</span>
                    <span className="mt-px flex min-w-0 items-center gap-1 truncate text-[11px] text-white/[0.66]">
                      <MapPin className="h-3 w-3 flex-none" />
                      {request.locationName}
                    </span>
                  </span>
                </div>
                <span className="flex-none rounded-full border border-white/[0.22] bg-white/[0.14] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-white/[0.9]">
                  {request.requestNumber}
                </span>
              </div>
            </div>

            <div className="p-3">
              {/* Rental window — a compact rail so the two dates read as one
                  span instead of two unrelated tiles. */}
              <div className="relative overflow-hidden rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(140deg,#F1FAF5_0%,#FFFFFF_64%)] px-3.5 py-3">
                <div className="relative flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#09B368] shadow-[0_0_0_2.5px_rgba(9,179,104,.18)]" />
                      Pickup
                    </p>
                    <p className="mt-1 truncate text-[13.5px] font-extrabold text-gray-900">
                      {new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {request.pickupTime && (
                      <p className="mt-px truncate text-[11px] tabular-nums text-gray-400">{request.pickupTime}</p>
                    )}
                  </div>
                  <div className="relative flex flex-none items-center justify-center px-1">
                    <span className="absolute inset-x-[-14px] top-1/2 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#CFE4DA_0_4px,transparent_4px_8px)]" />
                    <span className="relative inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#0F1A15] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_8px_16px_-10px_rgba(1,35,20,.9)]">
                      <Clock className="h-2.5 w-2.5" />
                      {formatBookingDuration(request)}
                    </span>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="flex items-center justify-end gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                      Drop
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F87171] shadow-[0_0_0_2.5px_rgba(248,113,113,.18)]" />
                    </p>
                    <p className="mt-1 truncate text-[13.5px] font-extrabold text-gray-900">
                      {new Date(request.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {request.dropTime && (
                      <p className="mt-px truncate text-[11px] tabular-nums text-gray-400">{request.dropTime}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stat tiles. gap-px over a grey ground draws the hairlines, so
                  the dividers stay correct however the tiles wrap. Tints live on
                  each cell, not on a shared base — Tailwind resolves by
                  stylesheet order, not class-string order. */}
              <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100">
                {[
                  {
                    icon: Bike,
                    label: 'Bike',
                    value: (
                      <>
                        {bikeLabel}
                        {request.vehicleBrand && <span className="font-medium text-gray-400"> ({request.vehicleBrand})</span>}
                      </>
                    ),
                    tint: 'bg-[#E9FAF2] text-[#056B3E]',
                  },
                  request.vehicleCategoryName
                    ? { icon: Hash, label: 'Category', value: request.vehicleCategoryName, tint: 'bg-blue-50 text-blue-600' }
                    : null,
                  request.helmetsRequired
                    ? {
                        icon: HardHat,
                        label: 'Helmets',
                        value: `${request.helmetsRequired} helmet${request.helmetsRequired > 1 ? 's' : ''}`,
                        tint: 'bg-amber-50 text-amber-700',
                      }
                    : null,
                  request.numberOfVehicles
                    ? {
                        icon: Bike,
                        label: 'Bikes',
                        value: `${request.numberOfVehicles} bike${request.numberOfVehicles > 1 ? 's' : ''}`,
                        tint: 'bg-gray-100 text-gray-600',
                      }
                    : null,
                ]
                  .filter(Boolean)
                  .map((t: any) => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.label}
                        className="group flex items-center gap-2.5 bg-white px-3 py-2.5 transition hover:bg-[#E9FAF2]"
                      >
                        <span
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-[10px] transition group-hover:bg-white group-hover:text-[#056B3E] ${t.tint}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400 transition group-hover:text-[#056B3E]/70">
                            {t.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] font-extrabold leading-snug text-gray-900 transition group-hover:text-[#056B3E]">
                            {t.value}
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Pickup location + address */}
              <div className="mt-3 flex gap-2.5 rounded-2xl border border-gray-100 bg-[#FCFDFC] px-3 py-2.5 transition hover:border-[#C8F1DF] hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(1,35,20,.45)]">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#E9FAF2] text-[#056B3E]">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Pickup Address</span>
                  <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-gray-700">
                    {[request.locationName, request.pickupAddress].filter(Boolean).join(' · ')}
                  </span>
                  {!request.pickupAddress && (
                    <span className="mt-0.5 block text-[11px] text-gray-400">Exact address not specified</span>
                  )}
                </span>
              </div>

              {request.customerNotes && (
                <div className="mt-3 flex gap-2.5 rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#FFFBEB,#FFF7ED)] px-3 py-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] border border-amber-200 bg-white text-amber-700">
                    <StickyNote className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-amber-700">Your Notes</span>
                    <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-amber-800">{request.customerNotes}</span>
                  </span>
                </div>
              )}

              {/* Cancel Request Button */}
              {(request.status === 'PENDING' || request.status === 'QUOTES_RECEIVED') && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className={`${BTN} mt-3 w-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Request
                </button>
              )}
            </div>
          </section>

          <section className={CARD}>
            <div className={CARD_HEAD}>
              <p className={CARD_LABEL}>Request Info</p>
            </div>
            <div className="px-4 py-1">
              {/* Request number, status and the quote count all appear above —
                  in the hero chips and the "Compare Quotes" heading — so only
                  the dates live here. */}
              <div className="flex flex-col">
                <MetaRow label="Requested On" value={fmtDateTime(request.createdAt)} />
                <MetaRow label="Quotes Open Till" value={fmtDateTime(request.quotesOpenTill)} />
                <MetaRow label="Request Expires" value={fmtDateTime(request.expiresAt)} />
              </div>
            </div>
          </section>

          {/* Help. Same four promises as before — each one now carries its own
              icon and tint so the list scans instead of reading as four
              identical ticks. Colours live on the rows, not on a shared base
              class, because Tailwind resolves by stylesheet order. */}
          <section className={CARD}>
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#01301B_0%,#056B3E_62%,#078F53_100%)] px-4 py-3.5 text-white">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(420px 180px at 100% -40%, rgba(42,210,145,.45), transparent 62%),' +
                    'repeating-linear-gradient(128deg, rgba(255,255,255,.045) 0 1px, transparent 1px 34px)',
                }}
              />
              <div className="relative z-10 flex items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="quote-serif block text-[18px] font-medium">Booking Protection</span>
                  <span className="mt-px block text-[11px] text-white/[0.66]">Every quote on this page is covered</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {[
                { icon: ShieldCheck, text: 'Verified vendors with ratings', tint: 'bg-[#E9FAF2] text-[#056B3E]' },
                { icon: Lock, text: 'Secure advance payment', tint: 'bg-blue-50 text-blue-600' },
                { icon: RotateCcw, text: 'Security deposit refunded after return', tint: 'bg-amber-50 text-amber-700' },
                { icon: FileText, text: 'Valid license required at pickup', tint: 'bg-gray-100 text-gray-600' },
              ].map(({ icon: Icon, text, tint }) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-2.5 py-2 transition hover:-translate-y-0.5 hover:border-[#C8F1DF] hover:bg-[#FCFDFC] hover:shadow-[0_10px_24px_-14px_rgba(1,35,20,.45)]"
                >
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-[10px] ${tint}`}>
                    <Icon className="h-[15px] w-[15px]" />
                  </span>
                  <span className="text-[12.5px] font-semibold leading-snug text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[420px] rounded-[20px] bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,.45)]">
            <div className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle className="h-5 w-5" />
              </span>
              <h3 className="text-[15.5px] font-extrabold text-gray-900">Cancel Quote Request?</h3>
            </div>
            <p className="px-4 text-[13px] leading-relaxed text-gray-500">
              Are you sure you want to cancel this quote request? This action cannot be undone and all received quotes will be discarded.
            </p>
            <div className="flex gap-2.5 p-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className={`${BTN} flex-1 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                className={`${BTN} flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50`}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Button */}
      {selectedQuote && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 py-3 shadow-[0_-12px_30px_-18px_rgba(1,35,20,.4)] backdrop-blur-[14px]">
          <div className="mx-auto flex max-w-7xl items-center gap-3.5 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400">Selected quote</p>
              <p className="quote-serif mt-0.5 truncate text-[19px] font-medium text-gray-900">
                {(selected as any)?.vendor?.businessName || selected?.vendors?.businessName}
              </p>
            </div>
            <div className="flex-none text-right">
              <span className="quote-serif block text-[30px] font-medium leading-tight tabular-nums text-[#056B3E]">
                ₹{selected?.grandTotal.toLocaleString()}
              </span>
              {selected?.advanceAmount ? (
                <span className="block text-[10.5px] tabular-nums text-gray-400">
                  advance ₹{selected.advanceAmount.toLocaleString()}
                </span>
              ) : null}
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className={`${BTN} flex-none bg-[#09B368] px-6 py-3.5 text-sm text-white shadow-[0_10px_15px_-3px_rgba(9,179,104,.25)] hover:-translate-y-0.5 hover:bg-[#078F53] disabled:opacity-50`}
            >
              {isAccepting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Accept & Book
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
