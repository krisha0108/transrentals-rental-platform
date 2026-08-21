'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Shield,
  ThumbsUp,
  MessageSquare,
  HardHat,
  RefreshCw,
  Loader2,
  ChevronDown,
  CreditCard,
  FileText,
  StickyNote,
  ShieldCheck,
  Lock,
  Headphones,
  ClipboardCheck,
  Layers,
  Truck,
} from 'lucide-react';
import { quoteDisplay } from '@/lib/quote-font';
import { useCustomerAuth } from '@/hooks/useCustomer';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import QuotePaymentSafetyNotice from '@/components/customer/QuotePaymentSafetyNotice';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  quantity: number;
  rentalDuration: number;
  durationUnit: string;
  city: string;
  deliveryCity?: string;
  deliveryAddress: string;
  startDate: string;
  endDate?: string;
  needOperator: boolean;
  needDelivery?: boolean;
  needInstallation?: boolean;
  requirements: string;
  status: string;
  totalQuotesReceived?: number;
  quotesOpenTill?: string;
  expiresAt?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface VendorQuote {
  id: string;
  quoteNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorTotalRentals: number;
  equipmentName?: string;
  equipmentModel: string;
  equipmentYear: number;
  vehicleImages?: string;
  totalAmount: number;
  baseAmount?: number;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  deliveryCharges: number;
  pickupCharges?: number;
  operatorCharges: number;
  installationCharges?: number;
  fuelCharges: number;
  viewCount?: number;
  securityDeposit: number;
  gstAmount: number;
  grandTotal: number;
  advancePercent: number;
  advanceAmount: number;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  notes: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

function fmt(d: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

const EQUIPMENT_NAMES: Record<string, string> = {
  '1': 'Grove Crane',
  '2': 'Truck Mounted Crane',
  '3': 'Tower Crane',
  '4': 'Telescopic Crane',
  '5': 'Rough Terrain Crane',
  '6': 'Overhead Crane',
  '7': 'Bulldozer',
  '8': 'Dumper',
  '9': 'Loader',
  '10': 'Excavator',
  '11': 'Backhoe Loader',
};

export default function CustomerEquipmentQuoteDetailPage() {
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

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push(`/customer/login?redirect=/customer/equipment-quotes/${params.id}`);
      return;
    }

    fetchQuoteRequest();
    fetchReRequestCount();
  }, [authLoading, isAuthenticated, customer, params.id]);

  const fetchReRequestCount = async () => {
    try {
      const res = await fetch(`/api/customer/re-request-quotes?serviceType=equipment&requestId=${params.id}`);
      const data = await res.json();
      setRemainingAttempts(data.remainingAttempts ?? 3);
    } catch {}
  };

  const fetchQuoteRequest = async () => {
    try {
      const response = await fetch(`/api/customer/quote-requests/equipment/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRequest(data.request);
        // Parse string fields to arrays if needed
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
        setError(data.message || 'Failed to fetch quote request');
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
          serviceType: 'equipment',
          quoteRequestId: params.id,
          quoteId: selectedQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/customer/equipment-bookings/${data.bookingId}`);
      } else {
        setError(data.message || 'Failed to accept quote');
      }
    } catch (err) {
      setError('Failed to accept quote. Please try again.');
    } finally {
      setIsAccepting(false);
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
          serviceType: 'equipment',
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
    if (!q.validUntil && !q.validTill) return q.status === 'EXPIRED';
    const validDate = q.validUntil || q.validTill;
    return new Date(validDate).getTime() < Date.now();
  });
  const bookingDateInFuture = request?.startDate && new Date(request.startDate) > new Date();
  const canReRequestQuotes = allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && remainingAttempts > 0;

  const getEquipmentName = (type: string) => EQUIPMENT_NAMES[type] || type;
  const sortedQuotes = [...quotes].sort((a, b) => {
    const aExpired = a.validUntil && new Date(a.validUntil).getTime() < Date.now() ? 1 : 0;
    const bExpired = b.validUntil && new Date(b.validUntil).getTime() < Date.now() ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired;
    return a.totalAmount - b.totalAmount;
  });
  const activeQuotes = sortedQuotes.filter(q => !(q.validUntil && new Date(q.validUntil).getTime() < Date.now()));
  const lowestPrice = activeQuotes[0]?.totalAmount ?? sortedQuotes[0]?.totalAmount;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
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
          <Link href="/customer/equipment-quotes" className="text-amber-600 hover:underline">
            Back to Requests
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
          <Link href="/customer/equipment-quotes" className="text-amber-600 hover:underline">
            Back to Requests
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
    BOOKED: { label: 'Booked', cls: 'bg-gray-100 text-gray-700' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
    EXPIRED: { label: 'Quotes Expired', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  };
  const statusChip =
    STATUS_CHIP[request.status] || { label: request.status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-700' };

  const fmtLong = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const fmtDateTime = (d?: string | null) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        })
      : null;

  const equipmentLabel = getEquipmentName(request.equipmentType);
  const durationLabel = `${request.rentalDuration} ${request.durationUnit}`;
  const selectedQ = quotes.find(q => q.id === selectedQuote);

  /** One row in a quote's price breakdown. */
  const FareRow = ({ label, value, variant }: { label: string; value: string; variant?: 'total' | 'advance' }) => (
    <div
      className={`flex items-center justify-between gap-3 bg-white ${variant === 'total' ? 'px-3.5 py-3' : 'px-3.5 py-2.5'} ${
        variant === 'advance' ? '!bg-[#E9FAF2]' : ''
      }`}
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

  /** One "Delivery ₹1,200" style charge pill. */
  const ChargePill = ({ label, value }: { label: string; value: number }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
      {label} <b className="font-extrabold tabular-nums text-gray-800">₹{value.toLocaleString()}</b>
    </span>
  );

  return (
    // pt-16 clears the fixed CustomerHeader
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16 ${selectedQuote ? 'pb-32' : 'pb-10'}`}>
      <CustomerHeader showBackButton />

      {/* ══════════════ Hero ══════════════ */}
      <section className="relative overflow-hidden bg-[#012314] text-white">
        {/* Motion layers. Scoped class names so nothing here can leak into
            another page's stylesheet. */}
        <style>{`
          @keyframes treqPan{to{background-position-x:-46px}}
          @keyframes treqPosts{to{background-position-x:-96px}}
          @keyframes treqHaze{to{transform:translate(70px,-26px) scale(1.18);opacity:.78}}
          @keyframes treqRing{0%{opacity:.5;transform:scale(.94)}70%,100%{opacity:0;transform:scale(1.18)}}
          @keyframes treqTarmac{to{background-position-x:-12px}}
          @keyframes treqRide{
            0%{transform:translateX(0);opacity:0}
            6%{opacity:1}
            92%{opacity:1}
            100%{transform:translateX(calc(100cqw - 26px));opacity:0}}
          @keyframes treqUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
          .treq-up{animation:treqUp .62s cubic-bezier(.2,.9,.25,1) var(--treq-d,0s) both}
          /* A map grid drifting the same way the load travels, so the whole
             panel reads as ground moving under the machine. Masked to a soft
             oval so it never looks like plain graph paper. */
          .treq-grid{background-image:
              linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),
              linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);
            background-size:46px 46px;
            -webkit-mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            animation:treqPan 22s linear infinite}
          /* Roadside posts sliding past in the foreground. Faster than the grid
             above, so the two speeds read as depth rather than one flat pattern. */
          .treq-posts{background-image:repeating-linear-gradient(90deg,
              rgba(255,255,255,.11) 0 1px, transparent 1px 96px);
            -webkit-mask-image:linear-gradient(transparent 8%,#000 78%);
            mask-image:linear-gradient(transparent 8%,#000 78%);
            animation:treqPosts 9s linear infinite}
          .treq-haze{background:radial-gradient(circle,rgba(42,210,145,.34),transparent 68%);
            opacity:.5;filter:blur(46px);
            animation:treqHaze 14s cubic-bezier(.2,.9,.25,1) infinite alternate}
          .treq-tile::after{content:"";position:absolute;inset:-6px;border-radius:20px;
            border:1px solid rgba(255,255,255,.25);opacity:0;
            animation:treqRing 3.4s cubic-bezier(.2,.9,.25,1) infinite}
          .treq-lane{container-type:inline-size}
          /* Steady cruise: linear keeps the speed constant, and the dash rate
             is scaled to match it. */
          .treq-tar{animation:treqTarmac 1.6s linear infinite}
          .treq-rig{animation:treqRide 10s linear infinite}
          @media(prefers-reduced-motion:reduce){
            .treq-up,.treq-grid,.treq-posts,.treq-haze,.treq-tile::after,
            .treq-tar,.treq-rig{animation:none!important}
            .treq-up{opacity:1!important;transform:none!important}
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
        <span className="treq-grid pointer-events-none absolute inset-0" />
        <span className="treq-posts pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" />
        <span className="treq-haze pointer-events-none absolute -left-16 top-8 h-[320px] w-[420px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 lg:px-8">
          {/* Back link + status */}
          <div className="treq-up flex items-center justify-between gap-3">
            <Link
              href="/customer/equipment-quotes"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Requests
            </Link>
            <div className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-extrabold shadow-lg shadow-black/20 ${statusChip.cls}`}>
              {statusChip.label}
            </div>
          </div>

          {/* Title */}
          <div className="treq-up mt-6 flex min-w-0 items-center gap-4" style={{ ['--treq-d' as any]: '.08s' }}>
            <span className="treq-tile relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.24] bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
              <Wrench className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h1 className="quote-serif text-[30px] font-medium leading-[1.05] tracking-[-0.01em] sm:text-[38px]">{equipmentLabel}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                  {request.requestNumber}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.deliveryCity || request.city}
                </span>
                {request.equipmentCategory && (
                  <span className="text-xs capitalize text-white/[0.62]">
                    {request.equipmentCategory} · Qty {request.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rental window — same shape as the other quote heroes */}
          <div
            className="treq-up mt-[22px] flex flex-wrap items-center gap-3.5 rounded-[18px] border border-white/[0.15] bg-white/[0.08] px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
            style={{ ['--treq-d' as any]: '.16s' }}
          >
            <div className="min-w-0 flex-[1_1_180px]">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Starts</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{fmtLong(request.startDate)}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">
                {[request.deliveryCity || request.city, request.deliveryAddress].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="treq-lane relative hidden h-[26px] min-w-[140px] flex-[2_1_200px] sm:block">
              <span className="treq-tar absolute left-0 right-0 top-3 h-0.5 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.42)_0_6px,transparent_6px_12px)]" />
              <span className="treq-rig absolute left-0 top-0 grid h-[26px] w-[26px] place-items-center rounded-lg bg-white text-[#056B3E]">
                <Wrench className="h-[15px] w-[15px]" />
              </span>
            </div>
            <div className="min-w-0 flex-[1_1_180px] sm:text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Ends</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{fmtLong(request.endDate) || durationLabel}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">{durationLabel} rental</p>
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
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Quotes */}
          {quotes.length === 0 ? (
            <section className={CARD}>
              <div className="px-5 py-11 text-center">
                <span className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50 text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                </span>
                <h3 className="text-base font-extrabold text-gray-900">Awaiting Quotes</h3>
                <p className="mx-auto mt-1.5 max-w-[340px] text-[13px] text-gray-500">
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
                {sortedQuotes.map((quote, index) => {
                  const isExpanded = expandedQuote === quote.id;
                  const isSelected = selectedQuote === quote.id;
                  const isLowestPrice = quote.totalAmount === lowestPrice;
                  const isExpired = quote.validUntil && new Date(quote.validUntil).getTime() < Date.now();
                  const isExpiringSoon = !isExpired && new Date(quote.validUntil).getTime() - Date.now() < 24 * 3600000;

                  const grand = (quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0);
                  const hasExtras =
                    (quote.inclusions?.length || 0) > 0 ||
                    (quote.exclusions?.length || 0) > 0 ||
                    (quote.termsConditions?.length || 0) > 0;

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
                          Lowest Price
                        </div>
                      ) : null}

                      {/* Vendor Info */}
                      <div className="flex flex-wrap items-start justify-between gap-3.5 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(135deg,#E9FAF2,#C8F1DF)] text-base font-extrabold text-[#056B3E]">
                            {(quote.vendorName || 'V').slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="quote-serif text-[21px] font-medium leading-tight text-gray-900">{quote.vendorName}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                  key={i}
                                  className={`h-[13px] w-[13px] ${
                                    quote.vendorRating && i <= Math.round(quote.vendorRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-gray-200 text-gray-200'
                                  }`}
                                />
                              ))}
                              <b className="ml-1.5 text-xs font-bold text-gray-700">{quote.vendorRating || 'New'}</b>
                              {quote.vendorTotalRentals > 0 && (
                                <>
                                  <span className="text-xs text-gray-400">·</span>
                                  <span className="text-xs text-gray-400">{quote.vendorTotalRentals} rentals</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-none text-right">
                          <p className="quote-serif text-[36px] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#056B3E]">
                            ₹{quote.totalAmount.toLocaleString()}
                          </p>
                          {quote.dailyRate ? (
                            <p className="mt-1 text-[11.5px] tabular-nums text-gray-400">₹{quote.dailyRate.toLocaleString()}/day</p>
                          ) : null}
                          {isExpiringSoon && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10.5px] font-extrabold text-red-700">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Expires soon!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Equipment Info */}
                      {(quote.equipmentName || quote.equipmentModel) && (
                        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                          {quote.equipmentName && <span className="text-sm font-extrabold text-gray-900">{quote.equipmentName}</span>}
                          {quote.equipmentModel && (
                            <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-[11.5px] font-bold text-gray-700">
                              {quote.equipmentModel}
                            </span>
                          )}
                          {quote.equipmentYear ? <span className="text-[12.5px] text-gray-400">({quote.equipmentYear})</span> : null}
                          {quote.quoteNumber && (
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-500">
                              {quote.quoteNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Spec tiles */}
                      <div className="grid grid-cols-2 gap-2 px-4 pb-3.5 sm:grid-cols-4">
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <Clock className="h-2.5 w-2.5" /> Daily Rate
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            {quote.dailyRate > 0 ? `₹${quote.dailyRate.toLocaleString()}` : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <CreditCard className="h-2.5 w-2.5" /> Advance
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            {(quote.advanceAmount || 0) > 0
                              ? `${quote.advancePercent > 0 ? `${quote.advancePercent}% · ` : ''}₹${quote.advanceAmount.toLocaleString()}`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <Shield className="h-2.5 w-2.5" /> Deposit
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            {quote.securityDeposit > 0 ? `₹${quote.securityDeposit.toLocaleString()}` : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            <Calendar className="h-2.5 w-2.5" /> Valid Till
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-gray-900">
                            {quote.validUntil
                              ? new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Charge pills */}
                      <div className="flex flex-wrap gap-1.5 px-4 pb-3.5">
                        {quote.dailyRate > 0 && <ChargePill label="Daily" value={quote.dailyRate} />}
                        {quote.deliveryCharges > 0 && <ChargePill label="Delivery" value={quote.deliveryCharges} />}
                        {quote.operatorCharges > 0 && <ChargePill label="Operator" value={quote.operatorCharges} />}
                        {(quote.installationCharges || 0) > 0 && <ChargePill label="Installation" value={quote.installationCharges as number} />}
                        {quote.fuelCharges > 0 && <ChargePill label="Fuel" value={quote.fuelCharges} />}
                        {quote.gstAmount > 0 && <ChargePill label="GST" value={quote.gstAmount} />}
                        {quote.securityDeposit > 0 && <ChargePill label="Deposit" value={quote.securityDeposit} />}
                      </div>

                      {/* Quick Inclusions */}
                      {quote.inclusions && quote.inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-4 pb-3.5">
                          {quote.inclusions.slice(0, 4).map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11px] font-bold text-[#056B3E]"
                            >
                              <CheckCircle className="h-2.5 w-2.5" /> {item}
                            </span>
                          ))}
                          {quote.inclusions.length > 4 && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                              +{quote.inclusions.length - 4} more
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
                              {[
                                { label: 'Daily Rate',                     val: quote.dailyRate,                   show: quote.dailyRate > 0 },
                                { label: 'Base Amount',                    val: quote.baseAmount || 0,             show: (quote.baseAmount || 0) > 0 },
                                { label: 'Delivery Charges',               val: quote.deliveryCharges,             show: quote.deliveryCharges > 0 },
                                { label: 'Pickup Charges',                 val: quote.pickupCharges || 0,          show: (quote.pickupCharges || 0) > 0 },
                                { label: 'Operator Charges',               val: quote.operatorCharges,             show: quote.operatorCharges > 0 },
                                { label: 'Installation Charges',           val: quote.installationCharges || 0,    show: (quote.installationCharges || 0) > 0 },
                                { label: 'Fuel Charges',                   val: quote.fuelCharges,                 show: quote.fuelCharges > 0 },
                                { label: 'GST',                            val: quote.gstAmount,                   show: quote.gstAmount > 0 },
                                { label: 'Security Deposit (Refundable)',  val: quote.securityDeposit,             show: quote.securityDeposit > 0 },
                              ]
                                .filter(r => r.show !== false)
                                .map((r, i) => <FareRow key={i} label={r.label} value={`₹${r.val.toLocaleString()}`} />)}
                              <FareRow label="Total Amount to Pay" value={`₹${grand.toLocaleString()}`} variant="total" />
                              <FareRow
                                label={`Advance ${quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}`.trim()}
                                value={`₹${(quote.advanceAmount || 0).toLocaleString()}`}
                                variant="advance"
                              />
                              <FareRow
                                label="Remaining at pickup"
                                value={`₹${(grand - (quote.advanceAmount || 0)).toLocaleString()}`}
                              />
                            </div>
                          </div>

                          {/* Vehicle Images */}
                          <VehicleImageGallery
                            vehicleImages={quote.vehicleImages}
                            vehicleName={quote.equipmentModel}
                          />

                          {/* All Inclusions */}
                          {quote.inclusions && quote.inclusions.length > 0 && (
                            <div>
                              <DetailHead icon={CheckCircle} label="Inclusions" tone="ok" />
                              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {quote.inclusions.map((item, i) => (
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
                          {quote.exclusions && quote.exclusions.length > 0 && (
                            <div>
                              <DetailHead icon={XCircle} label="Exclusions" tone="no" />
                              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {quote.exclusions.map((item, i) => (
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
                          {quote.termsConditions && quote.termsConditions.length > 0 && (
                            <div>
                              <DetailHead icon={FileText} label="Terms & Conditions" tone="neutral" />
                              <ul className="flex flex-col gap-1.5">
                                {quote.termsConditions.map((item, i) => (
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

                          {/* Vendor left the extras blank — say so instead of a silent gap */}
                          {!hasExtras && (
                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-3.5 py-3 text-[12.5px] text-gray-400">
                              <FileText className="h-4 w-4 flex-none" />
                              Vendor has not listed inclusions, exclusions or terms for this quote
                            </div>
                          )}

                          {/* Vendor Notes */}
                          {quote.notes && (
                            <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] px-3.5 py-3">
                              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#056B3E]">
                                <MessageSquare className="h-[11px] w-[11px]" />
                                Message from Vendor
                              </p>
                              <p className="quote-serif text-[16px] italic leading-relaxed text-[#064E3B]">{quote.notes}</p>
                            </div>
                          )}

                          <div className={`flex items-center gap-1.5 text-[11.5px] ${isExpired ? 'font-bold text-red-600' : 'text-gray-400'}`}>
                            <Clock className="h-3 w-3 flex-none" />
                            {isExpired ? 'Expired on: ' : 'Valid until: '}
                            {new Date(quote.validUntil).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                            {(quote.viewCount || 0) > 0 && ` · viewed ${quote.viewCount} time${quote.viewCount === 1 ? '' : 's'}`}
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
                      <span key={i} className={`h-2 w-2 rounded-full ${i <= (3 - remainingAttempts) ? 'bg-amber-500' : 'bg-amber-300'}`} />
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
              <div className="relative z-10 flex items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                  <Wrench className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="quote-serif block text-[18px] font-medium">Request Details</span>
                  <span className="mt-px block truncate text-[11px] capitalize text-white/[0.66]">
                    {[request.deliveryCity || request.city, request.equipmentCategory].filter(Boolean).join(' · ')}
                  </span>
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
                      Starts
                    </p>
                    <p className="mt-1 truncate text-[13.5px] font-extrabold text-gray-900">{fmt(request.startDate)}</p>
                  </div>
                  <div className="relative flex flex-none items-center justify-center px-1">
                    <span className="absolute inset-x-[-14px] top-1/2 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#CFE4DA_0_4px,transparent_4px_8px)]" />
                    <span className="relative inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#0F1A15] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_8px_16px_-10px_rgba(1,35,20,.9)]">
                      <Clock className="h-2.5 w-2.5" />
                      {durationLabel}
                    </span>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="flex items-center justify-end gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                      Ends
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F87171] shadow-[0_0_0_2.5px_rgba(248,113,113,.18)]" />
                    </p>
                    <p className="mt-1 truncate text-[13.5px] font-extrabold text-gray-900">
                      {request.endDate ? fmt(request.endDate) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat tiles. gap-px over a grey ground draws the hairlines, so
                  the dividers stay correct however the tiles wrap. Tints live on
                  each cell, not on a shared base — Tailwind resolves by
                  stylesheet order, not class-string order. */}
              <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100">
                {[
                  { icon: HardHat, label: 'Equipment', value: equipmentLabel, tint: 'bg-[#E9FAF2] text-[#056B3E]' },
                  request.equipmentCategory
                    ? {
                        icon: Wrench,
                        label: 'Category',
                        value: <span className="capitalize">{request.equipmentCategory}</span>,
                        tint: 'bg-blue-50 text-blue-600',
                      }
                    : null,
                  { icon: Layers, label: 'Quantity', value: request.quantity, tint: 'bg-amber-50 text-amber-700' },
                  { icon: Clock, label: 'Duration', value: durationLabel, tint: 'bg-gray-100 text-gray-600' },
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

              {/* Delivery address */}
              {request.deliveryAddress && (
                <div className="mt-3 flex gap-2.5 rounded-2xl border border-gray-100 bg-[#FCFDFC] px-3 py-2.5 transition hover:border-[#C8F1DF] hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(1,35,20,.45)]">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#E9FAF2] text-[#056B3E]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Delivery Address</span>
                    <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-gray-700">
                      {[request.deliveryCity || request.city, request.deliveryAddress].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </div>
              )}

              {/* What the customer asked for — full rows rather than chips, so a
                  yes and a no are told apart at a glance. */}
              {(request.needOperator !== undefined || request.needDelivery !== undefined || request.needInstallation !== undefined) && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Asked for</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { on: request.needOperator, icon: HardHat, label: 'Operator' },
                      { on: request.needDelivery, icon: Truck, label: 'Delivery' },
                      { on: request.needInstallation, icon: Wrench, label: 'Installation' },
                    ].map(({ on, icon: Icon, label }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${
                          on ? 'border-[#C8F1DF] bg-[#E9FAF2]' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-[9px] ${
                            on ? 'bg-white text-[#056B3E]' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className={`flex-1 text-[12.5px] font-bold ${on ? 'text-[#056B3E]' : 'text-gray-400'}`}>{label}</span>
                        {on ? (
                          <CheckCircle className="h-4 w-4 flex-none text-[#09B368]" />
                        ) : (
                          <XCircle className="h-4 w-4 flex-none text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.requirements && (
                <div className="mt-3 flex gap-2.5 rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#FFFBEB,#FFF7ED)] px-3 py-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] border border-amber-200 bg-white text-amber-700">
                    <StickyNote className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-amber-700">Requirements</span>
                    <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-amber-800">{request.requirements}</span>
                  </span>
                </div>
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

          {/* ── BOOKING PROTECTION ── */}
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
            {/* Colours live on the rows, not on a shared base class, because
                Tailwind resolves by stylesheet order. */}
            <div className="flex flex-col gap-2 p-3">
              {[
                { icon: Lock, text: 'Your payment is held securely until rental completion', tint: 'bg-[#E9FAF2] text-[#056B3E]' },
                { icon: Shield, text: 'Verified vendors with ratings and reviews', tint: 'bg-blue-50 text-blue-600' },
                { icon: ClipboardCheck, text: 'Equipment inspection before handover', tint: 'bg-amber-50 text-amber-700' },
                { icon: Headphones, text: '24/7 customer support during your rental', tint: 'bg-gray-100 text-gray-600' },
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

      {/* Accept Button */}
      {selectedQuote && selectedQ && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 py-3 shadow-[0_-12px_30px_-18px_rgba(1,35,20,.4)] backdrop-blur-[14px]">
          <div className="mx-auto flex max-w-7xl items-center gap-3.5 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400">Selected quote</p>
              <p className="quote-serif mt-0.5 truncate text-[19px] font-medium text-gray-900">{selectedQ.vendorName}</p>
              {(selectedQ.equipmentName || (selectedQ.advanceAmount || 0) > 0) && (
                <p className="mt-px truncate text-[11px] text-gray-400">
                  {selectedQ.equipmentName && `${selectedQ.equipmentName} · `}
                  Advance ₹{(selectedQ.advanceAmount || 0).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex-none text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400">Total</p>
              <p className="quote-serif text-[30px] font-medium leading-tight tabular-nums text-[#056B3E]">
                ₹{selectedQ.totalAmount.toLocaleString()}
              </p>
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
