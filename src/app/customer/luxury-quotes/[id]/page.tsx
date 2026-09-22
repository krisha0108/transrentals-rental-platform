// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
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
  Car,
  Gift,
  User,
  Phone,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Cormorant_Garamond } from 'next/font/google';
import { useCustomerAuth } from '@/hooks/useCustomer';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import CustomerHeader from '@/components/customer/CustomerHeader';

// Display face for the luxury treatment. Exposed as a CSS variable so the
// scoped <style> below can use it without touching the global font config.
const luxDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--lux-display',
});

const LUXURY_CATEGORIES: Record<string, string> = {
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
  vintage: 'Vintage Car',
  sports: 'Sports Car',
  limousine: 'Limousine',
  convertible: 'Convertible',
};

const TRIP_TYPES: Record<string, string> = {
  local: 'Local Rental',
  outstation: 'Outstation',
  airport: 'Airport Transfer',
};

interface QuoteRequest {
  id: string;
  requestNumber: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName: string;
  specificModel: string;
  passengers: number;
  pickupCity: string;
  pickupAddress: string;
  dropCity: string;
  dropAddress: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  tripDays: number;
  tripHours: number;
  occasion: string;
  needDecoration: boolean;
  decorationType: string;
  needChauffeur: boolean;
  requirements: string;
  status: string;
  totalQuotesReceived: number;
  quotes: VendorQuote[];
}

interface VendorQuote {
  id: string;
  quoteNumber: string;
  vendorId: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicle_models: string;
  vehicleYear: number;
  vehicleImages?: string;
  vehicleFeatures: string[];
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  perKmRate: number;
  perHourRate: number;
  extraKmRate: number;
  extraHourRate: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount: number;
  advancePercent: number;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  vendorMessage: string;
  validTill: string;
  status: string;
  createdAt: string;
  vendors: {
    id: string;
    businessName: string;
    rating: number;
    phone: string;
  };
}

export default function CustomerLuxuryQuoteDetailPage() {
  const { customer } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReRequesting, setIsReRequesting] = useState(false);
  const [reRequestSuccess, setReRequestSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  useEffect(() => {
    fetchQuoteRequest();
    fetchReRequestCount();
  }, [params.id]);

  const fetchReRequestCount = async () => {
    try {
      const res = await fetch(`/api/customer/re-request-quotes?serviceType=luxury&requestId=${params.id}`);
      const data = await res.json();
      setRemainingAttempts(data.remainingAttempts ?? 3);
    } catch {}
  };

  const fetchQuoteRequest = async () => {
    try {
      const response = await fetch(`/api/luxury-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success) {
        // Parse string fields to arrays if needed
        const quoteRequest = {
          ...data.quoteRequest,
          quotes: (data.quoteRequest.luxury_quotes || data.quoteRequest.quotes || []).map((quote: any) => ({
            ...quote,
            vendor: quote.vendors || quote.vendor, // Map vendors (API) to vendor (frontend)
            vehicleFeatures: Array.isArray(quote.vehicleFeatures)
              ? quote.vehicleFeatures
              : typeof quote.vehicleFeatures === 'string' && quote.vehicleFeatures
              ? quote.vehicleFeatures.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
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
          })),
        };
        setRequest(quoteRequest);
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
      const response = await fetch(`/api/luxury-quote-requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_quote',
          quoteId: selectedQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to booking detail page for payment
        router.push(`/customer/luxury-bookings/${data.booking.id}`);
      } else {
        setError(data.error || 'Failed to accept quote');
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
          serviceType: 'luxury',
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

  const getCategoryName = (id: string) => LUXURY_CATEGORIES[id] || id || 'Luxury Car';
  const getTripTypeName = (id: string) => TRIP_TYPES[id] || id || 'Trip';

  const quotes = request?.quotes || [];
  const sortedQuotes = [...quotes].sort((a, b) => {
    const aExpired = a.validTill && new Date(a.validTill).getTime() < Date.now() ? 1 : 0;
    const bExpired = b.validTill && new Date(b.validTill).getTime() < Date.now() ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired;
    return a.totalAmount - b.totalAmount;
  });
  const activeQuotes = sortedQuotes.filter(q => !(q.validTill && new Date(q.validTill).getTime() < Date.now()));
  const lowestPrice = activeQuotes[0]?.totalAmount ?? sortedQuotes[0]?.totalAmount;

  const allQuotesExpired = quotes.length > 0 && quotes.every(q => {
    if (q.status === 'EXPIRED') return true;
    if (!q.validTill) return false;
    return new Date(q.validTill).getTime() < Date.now();
  });
  const bookingDateInFuture = request?.pickupDate && new Date(request.pickupDate) > new Date();
  const canReRequestQuotes = allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && request?.status !== 'ACCEPTED' && remainingAttempts > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading quote details...</p>
        </div>
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
          <Link href="/customer/dashboard" className="text-amber-600 hover:underline">
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
          <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request Not Found</h3>
          <Link href="/customer/dashboard" className="text-amber-600 hover:underline">
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

  const fmtShort = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const fmtLong = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const fmtDateTime = (d?: string | null) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        })
      : null;

  const categoryLabel = request.vehicleCategoryName || getCategoryName(request.vehicle_category);
  const tripLabel = getTripTypeName(request.tripType);
  const titleLabel = request.specificModel || categoryLabel;
  const durationLabel = [
    request.tripDays ? `${request.tripDays} day${request.tripDays > 1 ? 's' : ''}` : null,
    request.tripHours ? `${request.tripHours} hours` : null,
  ].filter(Boolean).join(' · ');
  const selectedQ = quotes.find((q) => q.id === selectedQuote);

  /** Small-caps label — the page's signature. */
  const L = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 ${className}`}>{children}</span>
  );

  /** One key/value line in a rail list. */
  const Row = ({ label, value, gold, off }: { label: string; value: React.ReactNode; gold?: boolean; off?: boolean }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-baseline justify-between gap-3.5 border-b border-gray-100 py-3 last:border-b-0">
        <L>{label}</L>
        <span
          className={`max-w-[60%] break-words text-right text-[13px] ${
            gold ? 'font-medium text-amber-700' : off ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
      </div>
    );
  };

  /** Section heading inside an expanded quote — label plus a rule. */
  const DHead = ({ label }: { label: string }) => (
    <div className="mb-3.5 flex items-center gap-3">
      <L>{label}</L>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );

  return (
    // pt-16 clears the fixed CustomerHeader
    <div className={`${luxDisplay.variable} min-h-screen bg-gray-50 pt-16 ${selectedQuote ? 'pb-32' : 'pb-12'}`}>
      <CustomerHeader showBackButton />

      {/* Type + motion for the luxury treatment. Scoped class names so nothing
          here can leak into another page's stylesheet. */}
      <style>{`
        .lux-serif{font-family:var(--lux-display),Georgia,serif}
        @keyframes luxBreathe{to{transform:translate(70px,44px) scale(1.16);opacity:.5}}
        @keyframes luxUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .lux-up{animation:luxUp .8s cubic-bezier(.2,.9,.25,1) var(--lux-d,0s) both}
        .lux-grain{background-image:
          repeating-linear-gradient(52deg,rgba(245,243,239,.028) 0 1px,transparent 1px 7px),
          repeating-linear-gradient(-52deg,rgba(245,243,239,.02) 0 1px,transparent 1px 9px);opacity:.5}
        .lux-glow{background:radial-gradient(circle,rgba(245,196,106,.55),transparent 66%);
          filter:blur(80px);opacity:.34;animation:luxBreathe 16s cubic-bezier(.2,.9,.25,1) infinite alternate}
        /* a gilt edge where the dark hero meets the page */
        .lux-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(232,199,102,.55) 30%,rgba(232,199,102,.55) 70%,transparent)}
        .lux-back{transition:color .35s cubic-bezier(.2,.9,.25,1),gap .35s cubic-bezier(.2,.9,.25,1)}
        .lux-back:hover{gap:13px}
        .lux-terms{counter-reset:luxt}
        .lux-terms li::before{counter-increment:luxt;content:counter(luxt,decimal-leading-zero);
          font-family:var(--lux-display),Georgia,serif;font-size:15px;color:#B45309;opacity:.8;
          min-width:20px;flex:none}
        @media(prefers-reduced-motion:reduce){
          .lux-up,.lux-glow{animation:none!important}
          .lux-up{opacity:1!important;transform:none!important}
        }
      `}</style>

      {/* ══════════════ Hero — colour unchanged ══════════════ */}
      <div className="lux-hero relative overflow-hidden bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-[#F5F3EF]">
        {/* depth only — the gradient above stays the colour of record */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(900px 380px at 50% -30%, rgba(245,196,106,.16), transparent 64%),' +
              'radial-gradient(620px 320px at 50% 130%, rgba(0,0,0,.34), transparent 62%)',
          }}
        />
        <div className="lux-grain pointer-events-none absolute inset-0" />
        <div className="lux-glow pointer-events-none absolute left-1/2 top-[-42%] -ml-[340px] h-[680px] w-[680px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-7 pt-6 sm:px-6 lg:px-8">
          {/* Back link + status */}
          <div className="lux-up flex items-center justify-between gap-3">
            <Link
              href="/customer/luxury-quotes"
              className="lux-back inline-flex items-center gap-2.5 text-[10.5px] font-medium uppercase tracking-[0.2em] text-[#F5F3EF]/50 hover:text-[#F5E7B8]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Requests
            </Link>
            <span className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#E8C766]/40 bg-black/30 px-[15px] py-[7px] text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#F5E7B8] backdrop-blur-[6px]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#E8C766] shadow-[0_0_0_3px_rgba(232,199,102,.18)]" />
              {request.status === 'QUOTES_RECEIVED'
                ? 'Quotes Received'
                : request.status === 'BOOKED' || request.status === 'ACCEPTED'
                  ? 'Booked'
                  : request.status === 'CANCELLED'
                    ? 'Cancelled'
                    : 'Awaiting Quotes'}
            </span>
          </div>

          {/* Crest + title */}
          <div className="lux-up mt-6 flex min-w-0 items-center gap-5" style={{ ['--lux-d' as any]: '.1s' }}>
            <span
              className="relative grid h-[64px] w-[64px] flex-none place-items-center rounded-full border border-[#E8C766]/45 text-[#F5E7B8] shadow-[inset_0_1px_0_rgba(245,196,106,.25)] after:absolute after:-inset-2 after:rounded-full after:border after:border-[#E8C766]/20 after:content-['']"
              style={{ background: 'radial-gradient(circle at 34% 28%, rgba(245,196,106,.26), rgba(0,0,0,.22))' }}
            >
              <Crown className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-3">
                <span className="h-px w-[34px] bg-gradient-to-r from-[#E8C766] to-transparent" />
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-[#F5E7B8]">
                  {[categoryLabel, request.occasion].filter(Boolean).join(' · ')}
                </span>
              </p>
              <h1 className="lux-serif mt-2.5 text-[30px] font-medium leading-[1] tracking-[-0.02em] [text-shadow:0_2px_24px_rgba(0,0,0,.35)] sm:text-[38px] lg:text-[46px]">
                {titleLabel}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
                <span className="text-xs tracking-[0.1em] text-[#F5F3EF]/[0.72] tabular-nums">{request.requestNumber}</span>
                <span className="relative inline-flex items-center gap-2 text-xs text-[#F5F3EF]/[0.56] before:absolute before:-left-[9px] before:top-1/2 before:-mt-[1.5px] before:h-[3px] before:w-[3px] before:rounded-full before:bg-[#E8C766]/60 before:content-['']">
                  <MapPin className="h-3 w-3 text-[#E8C766]/75" />
                  {request.pickupCity}
                </span>
                {request.passengers ? (
                  <span className="relative inline-flex items-center gap-2 text-xs text-[#F5F3EF]/[0.56] before:absolute before:-left-[9px] before:top-1/2 before:-mt-[1.5px] before:h-[3px] before:w-[3px] before:rounded-full before:bg-[#E8C766]/60 before:content-['']">
                    <User className="h-3 w-3 text-[#E8C766]/75" />
                    <b className="font-medium text-[#F5F3EF]">{request.passengers}</b>&nbsp;guests
                  </span>
                ) : null}
                <span className="relative inline-flex items-center gap-2 text-xs capitalize text-[#F5F3EF]/[0.56] before:absolute before:-left-[9px] before:top-1/2 before:-mt-[1.5px] before:h-[3px] before:w-[3px] before:rounded-full before:bg-[#E8C766]/60 before:content-['']">
                  <Car className="h-3 w-3 text-[#E8C766]/75" />
                  {tripLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Journey rail */}
          <div
            className="lux-up mt-6 grid grid-cols-1 items-center gap-5 border-t border-[#F5F3EF]/[0.12] pt-5 lg:grid-cols-[1fr_auto_1fr]"
            style={{ ['--lux-d' as any]: '.2s' }}
          >
            <div className="min-w-0">
              <L className="!text-[#F5F3EF]/45">Pickup</L>
              <p className="lux-serif mt-1.5 text-[23px] font-medium leading-[1.1] tracking-[-0.01em]">{request.pickupCity}</p>
              <p className="mt-1.5 text-[12.5px] text-[#F5F3EF]/[0.58]">
                {fmtLong(request.pickupDate)}
                {request.pickupTime && ` · ${request.pickupTime}`}
              </p>
              {request.pickupAddress && <p className="mt-1 text-[12.5px] text-[#F5F3EF]/[0.3]">{request.pickupAddress}</p>}
            </div>

            <div className="flex min-w-[230px] flex-col items-center gap-3">
              <span className="relative h-px w-full bg-[linear-gradient(90deg,transparent,rgba(232,199,102,.42)_20%,rgba(232,199,102,.42)_80%,transparent)] before:absolute before:left-0 before:top-1/2 before:-mt-[2.5px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#E8C766] before:shadow-[0_0_0_3px_rgba(232,199,102,.16)] before:content-[''] after:absolute after:right-0 after:top-1/2 after:-mt-[2.5px] after:h-[5px] after:w-[5px] after:rounded-full after:bg-[#E8C766] after:shadow-[0_0_0_3px_rgba(232,199,102,.16)] after:content-['']" />
              <span className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[#E8C766]/[0.34] bg-black/[0.28] px-4 py-[7px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5E7B8]">
                <Clock className="h-3 w-3" />
                {durationLabel || tripLabel}
              </span>
              <span className="relative h-px w-full bg-[linear-gradient(90deg,transparent,rgba(232,199,102,.42)_20%,rgba(232,199,102,.42)_80%,transparent)] before:absolute before:left-0 before:top-1/2 before:-mt-[2.5px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#E8C766] before:shadow-[0_0_0_3px_rgba(232,199,102,.16)] before:content-[''] after:absolute after:right-0 after:top-1/2 after:-mt-[2.5px] after:h-[5px] after:w-[5px] after:rounded-full after:bg-[#E8C766] after:shadow-[0_0_0_3px_rgba(232,199,102,.16)] after:content-['']" />
            </div>

            <div className="min-w-0 lg:text-right">
              <L className="!text-[#F5F3EF]/45">Drop</L>
              <p className="lux-serif mt-1.5 text-[23px] font-medium leading-[1.1] tracking-[-0.01em]">
                {request.dropCity || request.pickupCity}
              </p>
              <p className="mt-1.5 text-[12.5px] text-[#F5F3EF]/[0.58]">
                {request.returnDate
                  ? `Returns ${fmtLong(request.returnDate)}${request.returnTime ? ` · ${request.returnTime}` : ''}`
                  : durationLabel || '—'}
              </p>
              {request.dropAddress ? (
                <p className="mt-1 text-[12.5px] text-[#F5F3EF]/[0.3]">{request.dropAddress}</p>
              ) : !request.returnDate ? (
                <p className="mt-1 text-[12.5px] text-[#F5F3EF]/[0.3]">Return not specified</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ Body ══════════════ */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-[22px] px-4 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-[26px] lg:px-8">
        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-[22px]">
          {/* Error Display */}
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {/* Quotes */}
          {quotes.length === 0 ? (
            <section className="overflow-hidden rounded border border-amber-100 bg-white">
              <div className="px-6 py-16 text-center">
                <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                  <Clock className="h-[26px] w-[26px]" />
                </span>
                <h3 className="lux-serif text-[27px] font-medium">Awaiting Quotes</h3>
                <p className="mx-auto mt-2.5 max-w-[360px] text-[13px] leading-relaxed text-gray-500">
                  Premium vendors are reviewing your request. You'll receive quotes shortly.
                </p>
              </div>
            </section>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3.5">
                <h2 className="lux-serif text-[29px] font-medium tracking-[-0.01em]">
                  Curated Offers <span className="text-amber-700">({quotes.length})</span>
                </h2>
                <L>Sorted by price</L>
              </div>

              <div className="flex flex-col gap-[22px]">
                {sortedQuotes.map((quote) => {
                  const isExpanded = expandedQuote === quote.id;
                  const isSelected = selectedQuote === quote.id;
                  const isLowestPrice = quote.totalAmount === lowestPrice;
                  const isExpired = quote.validTill && new Date(quote.validTill).getTime() < Date.now();
                  const isExpiringSoon =
                    !isExpired && quote.validTill && new Date(quote.validTill).getTime() - Date.now() < 24 * 3600000;

                  return (
                    <article
                      key={quote.id}
                      className={`relative overflow-hidden rounded border bg-white transition ${
                        isExpired
                          ? 'border-gray-200 opacity-[.55]'
                          : isSelected
                            ? 'border-amber-200 shadow-[0_0_0_1px_rgba(201,162,39,.16),0_24px_60px_-40px_rgba(180,83,9,.5)]'
                            : 'border-amber-100 hover:border-amber-200 hover:shadow-[0_18px_44px_-34px_rgba(17,24,39,.4)]'
                      }`}
                    >
                      {/* Badges */}
                      {isExpired ? (
                        <div className="flex items-center gap-2.5 border-b border-red-200 bg-gradient-to-r from-red-100 to-red-50 px-5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-red-700">
                          <XCircle className="h-3 w-3" />
                          Quote Expired
                        </div>
                      ) : isLowestPrice ? (
                        <div className="flex items-center gap-2.5 border-b border-amber-200 bg-gradient-to-r from-amber-200 to-amber-50 px-5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-amber-900">
                          <ThumbsUp className="h-3 w-3" />
                          Best Value
                        </div>
                      ) : null}

                      {/* Vendor + price */}
                      <div className="flex flex-wrap items-start justify-between gap-[22px] px-5 pb-5 pt-6">
                        <div className="flex min-w-0 items-center gap-[15px]">
                          <span className="grid h-14 w-14 flex-none place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                            <Crown className="h-6 w-6" />
                          </span>
                          <div className="min-w-0">
                            <p className="lux-serif text-[23px] font-medium leading-[1.15]">{quote.vendors.businessName}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              {quote.vendors.rating ? (
                                <>
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i <= Math.round(quote.vendors.rating) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'
                                      }`}
                                    />
                                  ))}
                                  <b className="ml-1.5 text-[11.5px] font-medium text-gray-700">{quote.vendors.rating}</b>
                                </>
                              ) : (
                                <span className="text-[11.5px] text-gray-500">New Vendor</span>
                              )}
                              {quote.vendors.phone && (
                                <span className="text-[11.5px] text-gray-400">· {quote.vendors.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-none text-right">
                          <p className="lux-serif text-[44px] font-medium leading-none tracking-[-0.02em] tabular-nums">
                            ₹{quote.totalAmount.toLocaleString()}
                          </p>
                          <p className="mt-1.5 text-[11px] tracking-[0.06em] text-gray-400">
                            All inclusive{durationLabel ? ` · ${durationLabel}` : ''}
                          </p>
                          {isExpiringSoon && (
                            <span className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              Expires soon
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vehicle line */}
                      <div className="flex flex-wrap items-center gap-2.5 px-5 pb-5">
                        <span className="lux-serif text-[19px] font-medium">{quote.vehicleName}</span>
                        {quote.vehicleYear ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-[3px] text-[10.5px] uppercase tracking-[0.1em] text-amber-700">
                            {quote.vehicleYear}
                          </span>
                        ) : null}
                        {quote.vehicleNumber && (
                          <span className="rounded-sm border border-gray-200 bg-gray-50 px-2 py-[3px] font-mono text-[11px] tracking-[0.08em] text-gray-700">
                            {quote.vehicleNumber}
                          </span>
                        )}
                        {(quote.chauffeur_vehicle_categories || quote.vehicleCategory) && (
                          <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-[3px] text-[10.5px] uppercase tracking-[0.1em] text-gray-500">
                            {getCategoryName(quote.chauffeur_vehicle_categories || quote.vehicleCategory)}
                          </span>
                        )}
                        {quote.quoteNumber && (
                          <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-[3px] text-[10.5px] uppercase tracking-[0.1em] tabular-nums text-gray-500">
                            {quote.quoteNumber}
                          </span>
                        )}
                      </div>

                      {/* Vehicle features */}
                      {quote.vehicleFeatures && quote.vehicleFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-5 pb-5">
                          {quote.vehicleFeatures.slice(0, 4).map((feature, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-[5px] text-[11px] text-amber-700"
                            >
                              {feature}
                            </span>
                          ))}
                          {quote.vehicleFeatures.length > 4 && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-[5px] text-[11px] text-gray-400">
                              +{quote.vehicleFeatures.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Spec strip — hairline grid, no boxes */}
                      <div className="mx-5 mb-5 grid grid-cols-2 border-l border-t border-gray-100 sm:grid-cols-4">
                        {[
                          { label: 'Chauffeur', value: quote.chauffeurCharges > 0 ? `₹${quote.chauffeurCharges.toLocaleString()}` : '—' },
                          {
                            label: 'Advance',
                            value:
                              quote.advanceAmount > 0
                                ? `${quote.advancePercent > 0 ? `${quote.advancePercent}% · ` : ''}₹${quote.advanceAmount.toLocaleString()}`
                                : '—',
                          },
                          { label: 'Extra / km', value: quote.extraKmRate > 0 ? `₹${quote.extraKmRate}` : '—' },
                          { label: 'Extra / hour', value: quote.extraHourRate > 0 ? `₹${quote.extraHourRate}` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="border-b border-r border-gray-100 px-4 py-3.5">
                            <L>{label}</L>
                            <p className="mt-[7px] text-sm font-medium tabular-nums text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Money line — quiet, every figure is itemised below */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-5 text-[11.5px] text-gray-400">
                        <span>
                          Base <b className="font-medium tabular-nums text-gray-700">₹{quote.baseAmount.toLocaleString()}</b>
                        </span>
                        {quote.decorationCharges > 0 && (
                          <>
                            <span className="text-gray-300">—</span>
                            <span>
                              Decoration <b className="font-medium tabular-nums text-gray-700">₹{quote.decorationCharges.toLocaleString()}</b>
                            </span>
                          </>
                        )}
                        {quote.gstAmount > 0 && (
                          <>
                            <span className="text-gray-300">—</span>
                            <span>
                              GST <b className="font-medium tabular-nums text-gray-700">₹{quote.gstAmount.toLocaleString()}</b>
                            </span>
                          </>
                        )}
                        {quote.validTill && (
                          <>
                            <span className="text-gray-300">—</span>
                            <span>
                              Valid till{' '}
                              <b className="font-medium tabular-nums text-gray-700">
                                {new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </b>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Quick inclusions */}
                      {quote.inclusions && quote.inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-5 pb-[22px]">
                          {quote.inclusions.slice(0, 3).map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-[7px] rounded-full border border-amber-200 bg-amber-50 px-3 py-[5px] text-[11px] text-amber-700"
                            >
                              <CheckCircle className="h-2.5 w-2.5" />
                              {item}
                            </span>
                          ))}
                          {quote.inclusions.length > 3 && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-[5px] text-[11px] text-gray-400">
                              +{quote.inclusions.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expanded */}
                      {isExpanded && (
                        <div className="flex flex-col gap-7 border-t border-gray-100 bg-gray-50 px-5 py-6">
                          {/* Price breakdown */}
                          <div>
                            <DHead label="Price Breakdown" />
                            <div className="flex flex-col">
                              <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                <span className="text-[12.5px] text-gray-500">Base</span>
                                <span className="text-[13.5px] tabular-nums text-gray-700">₹{quote.baseAmount.toLocaleString()}</span>
                              </div>
                              {quote.chauffeurCharges > 0 && (
                                <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                  <span className="text-[12.5px] text-gray-500">Chauffeur Charges</span>
                                  <span className="text-[13.5px] tabular-nums text-gray-700">₹{quote.chauffeurCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.decorationCharges > 0 && (
                                <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                  <span className="text-[12.5px] text-gray-500">Decoration Charges</span>
                                  <span className="text-[13.5px] tabular-nums text-gray-700">₹{quote.decorationCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.gstAmount > 0 && (
                                <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                  <span className="text-[12.5px] text-gray-500">GST</span>
                                  <span className="text-[13.5px] tabular-nums text-gray-700">₹{quote.gstAmount.toLocaleString()}</span>
                                </div>
                              )}
                              {(quote.extraKmRate > 0 || quote.extraHourRate > 0) && (
                                <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                  <span className="text-[12.5px] text-gray-500">Extra Charges</span>
                                  <span className="text-[13.5px] tabular-nums text-gray-700">
                                    {[
                                      quote.extraKmRate > 0 ? `₹${quote.extraKmRate}/km` : null,
                                      quote.extraHourRate > 0 ? `₹${quote.extraHourRate}/hr` : null,
                                    ].filter(Boolean).join(' · ')}
                                  </span>
                                </div>
                              )}
                              <div className="mt-1.5 flex items-baseline justify-between gap-4 border-y border-amber-200 py-4">
                                <L className="!text-gray-700">Total Amount to Pay</L>
                                <span className="lux-serif text-[30px] font-medium tabular-nums text-gray-900">
                                  ₹{quote.totalAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-[11px]">
                                <span className="text-[12.5px] font-medium text-amber-700">
                                  Advance {quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}
                                </span>
                                <span className="text-[13.5px] font-medium tabular-nums text-amber-700">
                                  ₹{quote.advanceAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 py-[11px]">
                                <span className="text-[12.5px] text-gray-500">Remaining at pickup</span>
                                <span className="text-[13.5px] tabular-nums text-gray-700">
                                  ₹{(quote.totalAmount - quote.advanceAmount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vehicle images. The gallery renders nothing when the
                              vendor attached none, so the heading is gated too
                              rather than left standing over empty space. */}
                          {quote.vehicleImages ? (
                            <div>
                              <DHead label="Vehicle Images" />
                              <VehicleImageGallery vehicleImages={quote.vehicleImages} vehicleName={quote.vehicleName} />
                            </div>
                          ) : (
                            <div>
                              <DHead label="Vehicle Images" />
                              <p className="rounded-sm border border-dashed border-gray-200 px-[18px] py-[15px] text-[12.5px] text-gray-400">
                                Vendor has not attached photographs for this vehicle
                              </p>
                            </div>
                          )}

                          {/* Inclusions */}
                          {quote.inclusions && quote.inclusions.length > 0 && (
                            <div>
                              <DHead label="Inclusions" />
                              <ul className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 sm:gap-x-[26px]">
                                {quote.inclusions.map((item, i) => (
                                  <li key={i} className="flex gap-[11px] text-[13px] leading-relaxed text-gray-700">
                                    <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-amber-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exclusions */}
                          {quote.exclusions && quote.exclusions.length > 0 && (
                            <div>
                              <DHead label="Exclusions" />
                              <ul className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 sm:gap-x-[26px]">
                                {quote.exclusions.map((item, i) => (
                                  <li key={i} className="flex gap-[11px] text-[13px] leading-relaxed text-gray-700">
                                    <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-red-400" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Extra rates */}
                          {(quote.extraKmRate > 0 || quote.extraHourRate > 0) && (
                            <div>
                              <DHead label="Extra Charges" />
                              <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-gray-700">
                                {quote.extraKmRate > 0 && (
                                  <span>
                                    Extra Km <b className="font-medium tabular-nums text-amber-700">₹{quote.extraKmRate}/km</b>
                                  </span>
                                )}
                                {quote.extraHourRate > 0 && (
                                  <span>
                                    Extra Hour <b className="font-medium tabular-nums text-amber-700">₹{quote.extraHourRate}/hr</b>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Terms */}
                          {quote.termsConditions && quote.termsConditions.length > 0 && (
                            <div>
                              <DHead label="Terms & Conditions" />
                              <ul className="lux-terms flex flex-col gap-3">
                                {quote.termsConditions.map((item, i) => (
                                  <li key={i} className="flex gap-3.5 text-[12.5px] leading-relaxed text-gray-500">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor message */}
                          {quote.vendorMessage && (
                            <div className="rounded-sm border border-amber-200 bg-amber-50 px-5 py-[18px]">
                              <MessageSquare className="h-5 w-5 text-amber-500/70" />
                              <p className="lux-serif mt-2 text-[18px] font-normal italic leading-relaxed text-gray-900">
                                {quote.vendorMessage}
                              </p>
                              <p className="mt-3 text-[10.5px] uppercase tracking-[0.16em] text-gray-400">
                                {quote.vendors.businessName}
                              </p>
                            </div>
                          )}

                          {/* Validity + call */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span
                              className={`inline-flex items-center gap-2.5 text-[11px] tracking-[0.06em] ${
                                isExpired ? 'text-red-600' : 'text-gray-400'
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {isExpired ? 'Expired on ' : 'Valid until '}
                              {new Date(quote.validTill).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                              {quote.validityDays > 0 && ` · ${quote.validityDays} day validity`}
                            </span>
                            <a
                              href={`tel:${quote.vendors.phone}`}
                              className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-amber-700 hover:text-amber-800"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call Vendor
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-[18px]">
                        <button
                          onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                          className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-sm border border-gray-200 bg-white px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:border-amber-200 hover:text-amber-700"
                        >
                          {isExpanded ? 'Show Less' : 'View Details'}
                        </button>
                        {isExpired ? (
                          <div className="inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-sm border border-red-200 px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                            Quote Expired
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuote(quote.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-2.5 rounded-sm px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                              isSelected
                                ? 'bg-gradient-to-br from-[#E8C766] to-[#C9A227] text-[#241C05] shadow-[0_14px_30px_-18px_rgba(201,162,39,.9)] hover:brightness-105'
                                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
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

          {/* Payment safety notice. Rendered inline rather than through
              QuotePaymentSafetyNotice so it can carry this page's serif +
              hairline treatment; the wording is a condensed version of that
              component's, in the same tone. It stays in use on the other quote
              pages untouched.
              Sits under the offers, i.e. right where the customer is about to
              pick one, and outside the branch above so it stays visible while
              quotes are still pending too. */}
          <div className="relative overflow-hidden rounded border border-red-200 bg-gradient-to-br from-red-50 to-white px-6 py-[22px]">
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded border border-red-300 motion-reduce:animate-none" />

            {/* Diagonal light sweep */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded">
              <div className="tr-safety-sweep absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>

            <div className="relative flex items-start gap-4">
              <span className="relative h-10 w-10 flex-none">
                <span className="absolute inset-0 rounded-full bg-red-300 opacity-75 animate-ping motion-reduce:animate-none" />
                <span className="tr-safety-icon-breathe relative grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-white text-red-600">
                  <Shield className="h-5 w-5" />
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="lux-serif text-[22px] font-medium text-gray-900">Please Pay Only Through TransRentals</h3>
                <p className="mt-[7px] text-[13px] leading-relaxed text-gray-500">
                  Before accepting a quote or making a payment, please make sure you are on the official
                  TransRentals platform. We request that you do not pay a vendor directly outside TransRentals
                  &mdash; not for booking confirmation, not for the quotation, and not at any point until your
                  trip is complete.
                </p>
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  <li className="flex gap-[11px] text-[12.5px] leading-relaxed text-gray-500">
                    <CheckCircle className="mt-[3px] h-4 w-4 flex-none text-emerald-600" />
                    Please accept quotes and complete all payments only on the TransRentals platform
                  </li>
                  <li className="flex gap-[11px] text-[12.5px] leading-relaxed text-gray-500">
                    <XCircle className="mt-[3px] h-4 w-4 flex-none text-red-500" />
                    Please note: where a payment is made to a vendor directly, TransRentals will not be able to
                    help with any issue, refund, or dispute for that booking
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Expired — Booking Date Passed (cannot re-request) */}
          {allQuotesExpired && !bookingDateInFuture && request?.status !== 'BOOKED' && request?.status !== 'ACCEPTED' && (
            <div className="overflow-hidden rounded border border-gray-200 bg-white">
              <div className="flex items-start gap-4 p-6">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-red-200 bg-red-50 text-red-600">
                  <XCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h4 className="lux-serif text-[22px] font-medium">Quotes Expired — Booking Date Passed</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                    All vendor quotes have expired and your pickup date{' '}
                    {request?.pickupDate && <span className="font-medium text-gray-700">({fmtShort(request.pickupDate)})</span>}{' '}
                    has already passed. Re-requesting is no longer possible for this booking.
                  </p>
                  <a
                    href="/customer/luxury-fleet"
                    className="mt-4 inline-flex items-center gap-2.5 rounded-sm bg-gray-900 px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-gray-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Create a New Request
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Re-Request Quotes Banner */}
          {allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && request?.status !== 'ACCEPTED' && !reRequestSuccess && (
            <div className="overflow-hidden rounded border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-start gap-4 p-6">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-amber-200 bg-white text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h4 className="lux-serif text-[22px] font-medium">All quotes have expired</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                    Your booking date is still upcoming. You can re-open this request so vendors can send fresh quotes.
                  </p>
                  {remainingAttempts > 0 ? (
                    <button
                      onClick={handleReRequestQuotes}
                      disabled={isReRequesting}
                      className="mt-4 inline-flex items-center gap-2.5 rounded-sm bg-gradient-to-br from-[#E8C766] to-[#C9A227] px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#241C05] shadow-[0_14px_30px_-18px_rgba(201,162,39,.9)] transition hover:brightness-105 disabled:opacity-50"
                    >
                      {isReRequesting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Sending request...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Request Fresh Quotes
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="mt-4 text-[13px] font-medium text-red-600">
                      You have used all 3 re-request attempts. Please create a new quote request.
                    </p>
                  )}
                </div>
              </div>
              {remainingAttempts > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-white/60 px-6 py-3">
                  <span className="text-[11px] tracking-[0.1em] text-gray-400">
                    {remainingAttempts} of 3 re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <span
                        key={i}
                        className={`h-[5px] w-[5px] rounded-full ${i <= 3 - remainingAttempts ? 'bg-amber-500' : 'bg-amber-200'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {reRequestSuccess && (
            <div className="overflow-hidden rounded border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-start gap-4 p-6">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-emerald-200 bg-white text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h4 className="lux-serif text-[22px] font-medium text-emerald-800">Request sent successfully!</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-emerald-700">{reRequestSuccess}</p>
                </div>
              </div>
              {remainingAttempts > 0 && (
                <div className="border-t border-emerald-100 bg-white/60 px-6 py-3">
                  <span className="text-[11px] tracking-[0.1em] text-emerald-700">
                    {remainingAttempts} re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-[22px] lg:sticky lg:top-[92px]">
          {/* Your Request */}
          <section className="overflow-hidden rounded border border-amber-100 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
              <L>Your Request</L>
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] tabular-nums text-amber-700">
                {request.requestNumber}
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-col">
                <Row label="Occasion" value={request.occasion ? <span className="capitalize">{request.occasion}</span> : null} gold />
                <Row label="Trip Type" value={<span className="capitalize">{tripLabel}</span>} />
                <Row label="Category" value={categoryLabel} />
                <Row label="Preferred Model" value={request.specificModel} />
                <Row label="Guests" value={request.passengers ? <span className="tabular-nums">{request.passengers}</span> : null} />
                <Row label="Duration" value={durationLabel} />
                <Row
                  label="Pickup"
                  value={
                    <>
                      {fmtLong(request.pickupDate)}
                      {request.pickupTime && <span className="tabular-nums"> · {request.pickupTime}</span>}
                    </>
                  }
                />
                <Row
                  label="Pickup Address"
                  value={[request.pickupCity, request.pickupAddress].filter(Boolean).join(' · ')}
                />
                <Row
                  label="Drop"
                  value={
                    request.dropCity
                      ? [request.dropCity, request.dropAddress].filter(Boolean).join(' · ')
                      : <span className="text-gray-400">Not specified</span>
                  }
                />
                <Row
                  label="Return"
                  value={
                    request.returnDate
                      ? `${fmtLong(request.returnDate)}${request.returnTime ? ` · ${request.returnTime}` : ''}`
                      : <span className="text-gray-400">Not specified</span>
                  }
                />
              </div>

              {/* What the customer asked for */}
              <div className="mt-5 border-t border-gray-100 pt-1">
                <p className="my-3.5">
                  <L>Requested</L>
                </p>
                {[
                  { on: request.needChauffeur, icon: User, label: 'Chauffeur', extra: null },
                  {
                    on: request.needDecoration,
                    icon: Gift,
                    label: 'Decoration',
                    extra: request.needDecoration && request.decorationType ? request.decorationType : null,
                  },
                ].map(({ on, icon: Icon, label, extra }) => (
                  <div key={label} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-b-0">
                    <Icon className={`h-4 w-4 flex-none ${on ? 'text-amber-700' : 'text-gray-300'}`} />
                    <span className={`flex-1 text-[13px] ${on ? 'text-gray-700' : 'text-gray-400'}`}>
                      {label}
                      {extra && <span className="text-gray-400"> · {extra}</span>}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        on ? 'text-amber-700' : 'text-gray-400'
                      }`}
                    >
                      {on ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
              </div>

              {request.requirements && (
                <div className="mt-[18px] border-l-2 border-amber-200 py-0.5 pl-4">
                  <L>Special Requirements</L>
                  <p className="lux-serif mt-1.5 text-[17px] italic leading-relaxed text-gray-700">{request.requirements}</p>
                </div>
              )}
            </div>
          </section>

          {/* Request Info */}
          <section className="overflow-hidden rounded border border-amber-100 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
              <L>Request Info</L>
            </div>
            <div className="p-5">
              <div className="flex flex-col">
                {[
                  { k: 'Requested On', v: fmtDateTime(request.createdAt) },
                  { k: 'Quotes Open Till', v: fmtDateTime(request.quotesOpenTill) },
                  { k: 'Request Expires', v: fmtDateTime(request.expiresAt) },
                ]
                  .filter(r => r.v)
                  .map(r => (
                    <div key={r.k} className="flex items-baseline justify-between gap-3.5 border-b border-gray-100 py-3 last:border-b-0">
                      <span className="text-[11.5px] text-gray-400">{r.k}</span>
                      <span className="text-right text-[12.5px] text-gray-700">{r.v}</span>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* Premium Booking Protection */}
          <section className="overflow-hidden rounded border border-amber-100 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
              <L>Premium Booking Protection</L>
            </div>
            <div className="p-5">
              <div className="flex flex-col">
                {[
                  { icon: Shield, text: 'Your payment is held securely until trip completion' },
                  { icon: Crown, text: 'Verified premium vendors with luxury fleet' },
                  { icon: Phone, text: '24/7 concierge support during your trip' },
                  { icon: Calendar, text: 'Free cancellation up to 48 hours before (check T&C)' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-3.5 border-b border-gray-100 py-3.5 last:border-b-0">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[12.5px] leading-snug text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Accept Button */}
      {selectedQuote && selectedQ && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-white/95 py-4 shadow-[0_-14px_34px_-26px_rgba(17,24,39,.5)] backdrop-blur-[16px]">
          <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <L>Selected offer</L>
              <p className="lux-serif mt-1.5 truncate text-[20px] font-medium">
                {selectedQ.vendor?.businessName || selectedQ.vendors?.businessName}
              </p>
              <p className="mt-1 truncate text-[11px] tabular-nums text-gray-400">
                {selectedQ.vehicleName && `${selectedQ.vehicleName} · `}
                advance ₹{(selectedQ.advanceAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex-none text-right">
              <L>Total</L>
              <p className="lux-serif mt-1 text-[34px] font-medium leading-tight tabular-nums">
                ₹{selectedQ.totalAmount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className="inline-flex flex-none items-center justify-center gap-2.5 rounded-sm bg-gradient-to-br from-[#E8C766] to-[#C9A227] px-[26px] py-[15px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#241C05] shadow-[0_14px_30px_-18px_rgba(201,162,39,.9)] transition hover:brightness-105 disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#241C05] border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Accept &amp; Proceed
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
