'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Weight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Phone,
  Shield,
  ThumbsUp,
  MessageSquare,
  Package,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { quoteDisplay } from '@/lib/quote-font';
import { useCustomerAuth } from '@/hooks/useCustomer';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import CustomerHeader from '@/components/customer/CustomerHeader';
import TruckRequestDetails from '@/components/truck/TruckRequestDetails';
import QuotePaymentSafetyNotice from '@/components/customer/QuotePaymentSafetyNotice';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  // The page has always read `vehicle_category` first; the API actually
  // returns `vehicleCategoryName`, so both stay in the fallback chain.
  vehicle_category?: string;
  vehicleCategory?: string;
  vehicleCategoryName?: string;
  truckBodyType?: string;
  tripDirection?: string;
  goodsType: string;
  goodsDescription?: string;
  estimatedWeight: number | null;
  estimatedVolume?: string;
  pickupCity: string;
  pickupAddress: string;
  pickupPincode?: string;
  pickupFloor?: number | null;
  hasPickupLift?: boolean;
  dropCity: string;
  dropAddress: string;
  dropPincode?: string;
  dropFloor?: number | null;
  hasDropLift?: boolean;
  pickupDate: string;
  pickupTime?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  requiresLabour?: boolean;
  labourCount?: number;
  hasMultipleStops?: boolean;
  multipleStopsDetails?: string;
  receiverName?: string;
  receiverPhone?: string;
  requiresPOD?: boolean;
  isFlexibleDate?: boolean;
  needInsurance?: boolean;
  needPackaging?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  requirements: string;
  status: string;
}

interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorTotalTrips: number;
  vehicleType: string;
  vehicleNumber: string;
  vehicleImages?: string;
  totalAmount: number;
  baseRate: number;
  loadingCharges: number;
  unloadingCharges: number;
  tollCharges: number;
  gstAmount: number;
  grandTotal: number;
  securityDeposit: number;
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

const CANCEL_REASONS = [
  'Plans changed / Shipment cancelled',
  'Found a better deal',
  'Submitted by mistake',
  'Pickup date or location needs to change',
  'No suitable quotes received',
  'Goods type or weight changed',
  'Emergency or urgent situation',
  'Other',
];

export default function CustomerTruckQuoteDetailPage() {
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push(`/customer/login?redirect=/customer/truck-quotes/${params.id}`);
      return;
    }

    fetchQuoteRequest();
    fetchReRequestCount();
  }, [authLoading, isAuthenticated, customer, params.id]);

  const fetchReRequestCount = async () => {
    try {
      const res = await fetch(`/api/customer/re-request-quotes?serviceType=truck&requestId=${params.id}`);
      const data = await res.json();
      setRemainingAttempts(data.remainingAttempts ?? 3);
    } catch {}
  };

  const fetchQuoteRequest = async () => {
    try {
      const response = await fetch(`/api/customer/quote-requests/truck/${params.id}`);
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
          serviceType: 'truck',
          quoteRequestId: params.id,
          quoteId: selectedQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/customer/truck-bookings/${data.bookingId}`);
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
          serviceType: 'truck',
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

  const handleCancelRequest = async () => {
    const finalReason = selectedCancelReason === 'Other' ? otherCancelReason.trim() : selectedCancelReason;
    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other' ? 'Please describe your reason' : 'Please select a reason');
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/customer/quote-requests/truck/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        fetchQuoteRequest();
      } else {
        setCancelError(data.message || 'Failed to cancel request');
      }
    } catch {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    const aExpired = a.validUntil && new Date(a.validUntil).getTime() < Date.now() ? 1 : 0;
    const bExpired = b.validUntil && new Date(b.validUntil).getTime() < Date.now() ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired;
    return a.totalAmount - b.totalAmount;
  });
  const activeQuotes = sortedQuotes.filter(q => !(q.validUntil && new Date(q.validUntil).getTime() < Date.now()));
  const lowestPrice = activeQuotes[0]?.totalAmount ?? sortedQuotes[0]?.totalAmount;

  const allQuotesExpired = quotes.length > 0 && quotes.every(q => {
    if (!q.validUntil && !q.validTill) return q.status === 'EXPIRED';
    const validDate = q.validUntil || q.validTill;
    return new Date(validDate).getTime() < Date.now();
  });
  const bookingDateInFuture = request?.pickupDate && new Date(request.pickupDate) > new Date();
  const canReRequestQuotes = allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && remainingAttempts > 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-[#09B368] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-[19px] font-extrabold text-gray-900 mb-2">Error Loading Request</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/customer/truck-quotes" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#09B368] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#078F53]">
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
          <h3 className="text-[19px] font-extrabold text-gray-900 mb-2">Request Not Found</h3>
          <Link href="/customer/truck-quotes" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#09B368] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#078F53]">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-[#F4F8F6] pb-32 pt-16`}>
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        {/* Motion layers, matching the bus-quotes hero. Scoped class names so
            nothing here can leak into another page's stylesheet. */}
        <style>{`
          @keyframes trtkPan{to{background-position-x:-46px}}
          @keyframes trtkPosts{to{background-position-x:-96px}}
          @keyframes trtkHaze{to{transform:translate(70px,-26px) scale(1.18);opacity:.78}}
          @keyframes trtkRing{0%{opacity:.5;transform:scale(.94)}70%,100%{opacity:0;transform:scale(1.18)}}
          @keyframes trtkTarmac{to{background-position-x:-12px}}
          @keyframes trtkRide{
            0%{transform:translateX(0);opacity:0}
            6%{opacity:1}
            92%{opacity:1}
            100%{transform:translateX(calc(100cqw - 26px));opacity:0}}
          @keyframes trtkUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
          .trtk-up{animation:trtkUp .62s cubic-bezier(.2,.9,.25,1) var(--trtk-d,0s) both}
          /* A map grid drifting the same way the truck travels, so the whole
             panel reads as ground moving under the vehicle. Masked to a soft
             oval so it never looks like plain graph paper. */
          .trtk-grid{background-image:
              linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),
              linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);
            background-size:46px 46px;
            -webkit-mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            mask-image:radial-gradient(130% 105% at 50% 42%,#000 26%,transparent 80%);
            animation:trtkPan 22s linear infinite}
          /* Roadside posts sliding past in the foreground. Faster than the grid
             above, so the two speeds read as depth rather than one flat pattern. */
          .trtk-posts{background-image:repeating-linear-gradient(90deg,
              rgba(255,255,255,.11) 0 1px, transparent 1px 96px);
            -webkit-mask-image:linear-gradient(transparent 8%,#000 78%);
            mask-image:linear-gradient(transparent 8%,#000 78%);
            animation:trtkPosts 9s linear infinite}
          .trtk-haze{background:radial-gradient(circle,rgba(42,210,145,.34),transparent 68%);
            opacity:.5;filter:blur(46px);
            animation:trtkHaze 14s cubic-bezier(.2,.9,.25,1) infinite alternate}
          .trtk-tile::after{content:"";position:absolute;inset:-6px;border-radius:20px;
            border:1px solid rgba(255,255,255,.25);opacity:0;
            animation:trtkRing 3.4s cubic-bezier(.2,.9,.25,1) infinite}
          .trtk-lane{container-type:inline-size}
          /* Steady cruise: linear keeps the speed constant, and the dash rate
             is scaled to match it. */
          .trtk-tar{animation:trtkTarmac 1.6s linear infinite}
          .trtk-truck{animation:trtkRide 10s linear infinite}
          @media(prefers-reduced-motion:reduce){
            .trtk-up,.trtk-grid,.trtk-posts,.trtk-haze,.trtk-tile::after,
            .trtk-tar,.trtk-truck{animation:none!important}
            .trtk-up{opacity:1!important;transform:none!important}
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
        <span className="trtk-grid pointer-events-none absolute inset-0" />
        <span className="trtk-posts pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" />
        <span className="trtk-haze pointer-events-none absolute -left-16 top-8 h-[320px] w-[420px] rounded-full" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          <div className="trtk-up flex items-center justify-between gap-3">
            <Link
              href="/customer/truck-quotes"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Requests
            </Link>
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1.5 text-[11.5px] font-extrabold text-[#056B3E] shadow-lg shadow-black/20">
              {quotes.length > 0 ? `${quotes.length} Quote${quotes.length > 1 ? 's' : ''} Received` : 'Awaiting Quotes'}
            </span>
          </div>

          <div className="trtk-up mt-[22px] flex flex-wrap items-end justify-between gap-6" style={{ ['--trtk-d' as any]: '.08s' }}>
            <div className="flex items-center gap-4 min-w-0">
              <div className="trtk-tile relative w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Truck className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/[0.55]">Quote Request</span>
                <h1 className="quote-serif mt-0.5 text-[30px] sm:text-[38px] font-medium leading-[1.05] tracking-[-0.01em] tabular-nums">{request.requestNumber}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/[0.64]">
                  {request.serviceType && <span className="capitalize">{request.serviceType.replace(/-/g, ' ')}</span>}
                  {request.vehicleCategoryName && <span>· {request.vehicleCategoryName}</span>}
                  {request.truckBodyType && <span className="capitalize">· {request.truckBodyType.replace(/_/g, ' ').toLowerCase()}</span>}
                  {request.tripDirection && <span className="capitalize">· {request.tripDirection.replace(/_/g, ' ').toLowerCase()}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Route strip */}
          <div
            className="trtk-up mt-[22px] flex flex-wrap items-center gap-3.5 rounded-[18px] border border-white/[0.15] bg-white/[0.08] px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
            style={{ ['--trtk-d' as any]: '.16s' }}
          >
            <div className="min-w-0 flex-[1_1_180px]">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Pickup</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{request.pickupCity}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">
                {[request.pickupAddress, request.pickupPincode].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            {/* Grows faster than the pickup/drop columns so the road reads as
                the long leg of the journey, not a short connector. */}
            <div className="trtk-lane relative hidden h-[26px] min-w-[140px] flex-[2_1_200px] sm:block">
              <span className="trtk-tar absolute left-0 right-0 top-3 h-0.5 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.42)_0_6px,transparent_6px_12px)]" />
              <span className="trtk-truck absolute left-0 top-0 grid h-[26px] w-[26px] place-items-center rounded-lg bg-white text-[#056B3E]">
                <Truck className="h-[15px] w-[15px]" />
              </span>
            </div>
            <div className="min-w-0 flex-[1_1_180px] sm:text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">Drop</p>
              <p className="mt-0.5 text-[17px] font-extrabold">{request.dropCity}</p>
              <p className="mt-px text-[11.5px] text-white/[0.6]">
                {[request.dropAddress, request.dropPincode].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">

        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}


        {/* Quotes */}
        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-200 bg-amber-50">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </span>
            <h3 className="text-[17px] font-extrabold text-gray-900">Awaiting Quotes</h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-gray-500">
              Vendors are reviewing your request. You&apos;ll receive quotes within 24-48 hours.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="quote-serif text-[26px] font-medium text-gray-900">Compare Quotes</h2>
              <p className="text-[12.5px] text-gray-500">
                {quotes.length} quote{quotes.length > 1 ? 's' : ''} · sorted by price
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              {sortedQuotes.map((quote, index) => {
                const isExpanded = expandedQuote === quote.id;
                const isSelected = selectedQuote === quote.id;
                const isLowestPrice = quote.totalAmount === lowestPrice;
                const isExpired = quote.validUntil && new Date(quote.validUntil).getTime() < Date.now();
                const isExpiringSoon = !isExpired && new Date(quote.validUntil).getTime() - Date.now() < 24 * 3600000;

                return (
                  <div
                    key={quote.id}
                    className={`rounded-[20px] overflow-hidden border bg-white transition ${
                      isExpired
                        ? 'border-gray-200 opacity-[0.72] saturate-50'
                        : isSelected
                          ? 'border-[#09B368] shadow-[0_0_0_3px_#E9FAF2,0_22px_46px_-18px_rgba(9,179,104,.4)]'
                          : 'border-gray-100 shadow-[0_2px_4px_rgba(15,26,21,.05),0_12px_28px_-10px_rgba(15,26,21,.16)] hover:-translate-y-0.5 hover:border-[#96E4C2]'
                    }`}
                  >
                    {/* Badges */}
                    {isExpired ? (
                      <div className="flex items-center gap-2 bg-[linear-gradient(100deg,#991B1B,#DC2626)] px-[18px] py-[7px] text-[11px] font-extrabold uppercase tracking-[0.05em] text-white">
                        <XCircle className="w-3 h-3" />
                        Quote Expired
                      </div>
                    ) : isLowestPrice ? (
                      <div className="flex items-center gap-2 bg-[linear-gradient(100deg,#056B3E,#09B368)] px-[18px] py-[7px] text-[11px] font-extrabold uppercase tracking-[0.05em] text-white">
                        <ThumbsUp className="w-3 h-3" />
                        Lowest Price
                      </div>
                    ) : null}

                    <div className="p-[18px]">
                      {/* Vendor Info */}
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[15px] border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] text-[#056B3E]">
                            <Truck className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="quote-serif text-[21px] font-medium leading-tight text-gray-900">{quote.vendorName}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                              <Star className="w-[13px] h-[13px] text-amber-400 fill-amber-400" />
                              <b className="font-bold text-gray-900">{quote.vendorRating || 'New'}</b>
                              <span>· {quote.vendorTotalTrips > 0 ? `${quote.vendorTotalTrips} trips` : 'New vendor · 0 trips'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-none text-right">
                          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Total Amount</p>
                          <p className="quote-serif mt-0.5 text-[34px] sm:text-[42px] font-medium leading-[1.05] tracking-[-0.02em] tabular-nums text-gray-900">
                            ₹{quote.totalAmount.toLocaleString('en-IN')}
                          </p>
                          {quote.advanceAmount > 0 && (
                            <span className="mt-1.5 inline-block rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#056B3E]">
                              ₹{quote.advanceAmount.toLocaleString('en-IN')} advance{quote.advancePercent > 0 ? ` (${quote.advancePercent}%)` : ''}
                            </span>
                          )}
                          {isExpiringSoon && (
                            <p className="mt-1 text-xs font-semibold text-red-500">Expires soon!</p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      {quote.vehicleType && (
                        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-xl border border-gray-100 bg-[#F4F8F6] px-3.5 py-2.5 text-[12.5px] text-gray-600">
                          <Truck className="w-[15px] h-[15px]" />
                          <b className="font-bold text-gray-900">{quote.vehicleType}</b>
                          {quote.vehicleNumber && (
                            <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-extrabold tracking-[0.04em]">
                              {quote.vehicleNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price Breakdown Summary */}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-gray-50 bg-[#FCFDFC] px-3 py-2.5">
                          <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">Base Rate</p>
                          <p className="mt-0.5 text-sm font-extrabold tabular-nums">₹{(quote.baseRate || 0).toLocaleString('en-IN')}</p>
                        </div>
                        {quote.loadingCharges > 0 && (
                          <div className="rounded-xl border border-gray-50 bg-[#FCFDFC] px-3 py-2.5">
                            <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">Loading</p>
                            <p className="mt-0.5 text-sm font-extrabold tabular-nums">₹{quote.loadingCharges.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {quote.unloadingCharges > 0 && (
                          <div className="rounded-xl border border-gray-50 bg-[#FCFDFC] px-3 py-2.5">
                            <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">Unloading</p>
                            <p className="mt-0.5 text-sm font-extrabold tabular-nums">₹{quote.unloadingCharges.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {quote.tollCharges > 0 && (
                          <div className="rounded-xl border border-gray-50 bg-[#FCFDFC] px-3 py-2.5">
                            <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">Toll</p>
                            <p className="mt-0.5 text-sm font-extrabold tabular-nums">₹{quote.tollCharges.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Inclusions */}
                      {quote.inclusions && quote.inclusions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {quote.inclusions.slice(0, 4).map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11.5px] font-semibold text-[#056B3E]">
                              <CheckCircle className="w-3 h-3" />
                              {item}
                            </span>
                          ))}
                          {quote.inclusions.length > 4 && (
                            <span className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11.5px] font-semibold text-gray-500">
                              +{quote.inclusions.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Validity */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-gray-500">
                        <Calendar className="w-[13px] h-[13px]" />
                        <span>
                          Valid until{' '}
                          <b className="font-bold text-gray-700">
                            {new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </b>
                        </span>
                        <span className="ml-auto text-gray-400">
                          Sent {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {quote.status ? ` · ${quote.status.charAt(0) + quote.status.slice(1).toLowerCase()}` : ''}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-50 pt-4 mt-4 flex flex-col gap-3.5">
                          {/* Price Breakdown */}
                          <div className="overflow-hidden rounded-2xl border border-gray-100">
                            <h4 className="border-b border-gray-50 bg-[#FCFDFC] px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-gray-400">Price Breakdown</h4>
                            <div className="[&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-3 [&>div]:px-4 [&>div]:py-2.5 [&>div]:text-[12.5px] [&>div+div]:border-t [&>div+div]:border-gray-50 [&>div>span:last-child]:font-bold [&>div>span:last-child]:tabular-nums">
                              <div className="flex justify-between">
                                <span>Base</span>
                                <span>₹{(quote.baseRate || 0).toLocaleString()}</span>
                              </div>
                              {quote.loadingCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Loading Charges</span>
                                  <span>₹{quote.loadingCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.unloadingCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Unloading Charges</span>
                                  <span>₹{quote.unloadingCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.tollCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Toll Charges</span>
                                  <span>₹{quote.tollCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.gstAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>GST</span>
                                  <span>₹{quote.gstAmount.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.securityDeposit > 0 && (
                                <div className="flex justify-between">
                                  <span>Security Deposit (Refundable)</span>
                                  <span>₹{quote.securityDeposit.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="!bg-[#F4F8F6] !py-3.5 font-extrabold [&>span:last-child]:!text-[17px] [&>span:last-child]:!text-[#056B3E]">
                                <span className="text-[14px]">Total Amount to Pay</span>
                                <span>₹{((quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0)).toLocaleString()}</span>
                              </div>
                              <div className="[&>span]:!text-[#056B3E] [&>span]:!font-bold">
                                <span>Advance {quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}</span>
                                <span>₹{(quote.advanceAmount || 0).toLocaleString()}</span>
                              </div>
                              <div className="[&>span]:!text-gray-500">
                                <span>Remaining at pickup</span>
                                <span>₹{((quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0) - (quote.advanceAmount || 0)).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Images */}
                          <VehicleImageGallery
                            vehicleImages={quote.vehicleImages}
                            vehicleName={quote.vehicleType}
                          />

                          {/* Inclusions + Exclusions, side by side */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {quote.inclusions && quote.inclusions.length > 0 && (
                            <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] px-4 py-3.5">
                              <h4 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-gray-400">Inclusions</h4>
                              <ul className="flex flex-col gap-1.5">
                                {quote.inclusions.map((item, i) => (
                                  <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-gray-600">
                                    <CheckCircle className="mt-0.5 h-[13px] w-[13px] flex-none text-[#09B368]" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {quote.exclusions && quote.exclusions.length > 0 && (
                            <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] px-4 py-3.5">
                              <h4 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-gray-400">Exclusions</h4>
                              <ul className="flex flex-col gap-1.5">
                                {quote.exclusions.map((item, i) => (
                                  <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-gray-600">
                                    <XCircle className="mt-0.5 h-[13px] w-[13px] flex-none text-red-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          </div>

                          {/* Terms */}
                          {quote.termsConditions && quote.termsConditions.length > 0 && (
                            <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] px-4 py-3.5">
                              <h4 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-gray-400">Terms &amp; Conditions</h4>
                              <ul className="flex flex-col gap-1.5">
                                {quote.termsConditions.map((item, i) => (
                                  <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-gray-600">
                                    <AlertCircle className="mt-0.5 h-[13px] w-[13px] flex-none text-gray-400" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor Notes */}
                          {quote.notes ? (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                              <h4 className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-blue-700">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Message from Vendor
                              </h4>
                              <p className="mt-1 text-[12.5px] leading-relaxed text-blue-900">{quote.notes}</p>
                            </div>
                          ) : (
                            <p className="rounded-xl border border-gray-100 bg-[#F4F8F6] px-4 py-3 text-[12.5px] italic text-gray-400">
                              Vendor left no additional notes on this quote.
                            </p>
                          )}

                          <div className={`text-[11.5px] ${isExpired ? 'font-semibold text-red-500' : 'text-gray-400'}`}>
                            {isExpired ? 'Expired on: ' : 'Valid until: '}{new Date(quote.validUntil).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2.5 border-t border-gray-50 pt-4">
                        <button
                          onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                          className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-[13.5px] font-bold text-gray-600 transition hover:border-[#96E4C2] hover:bg-[#F4F8F6] hover:text-[#056B3E]"
                        >
                          {isExpanded ? 'Show Less' : 'View Details'}
                        </button>
                        {isExpired ? (
                          <div className="flex-1 cursor-not-allowed rounded-xl border border-red-200 bg-red-50 py-3 text-center text-[13.5px] font-bold text-red-600">
                            Quote Expired
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuote(quote.id)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold transition ${
                              isSelected
                                ? 'bg-[#09B368] text-white shadow-lg shadow-[#09B368]/30'
                                : 'border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E] hover:bg-[#C8F1DF]'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4" />}
                            {isSelected ? 'Selected' : 'Select This Quote'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Payment safety notice — stays visible whether quotes are still
            pending or have already arrived */}
        <QuotePaymentSafetyNotice />

        {/* Re-Request Quotes Banner */}
        {allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && !reRequestSuccess && (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#FFFBEB,#FFF7ED)]">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#FDE68A] text-[#92400E]">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14.5px] font-extrabold text-[#78350F]">All quotes have expired</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your booking date is still upcoming. You can re-open this request so vendors can send fresh quotes.
                  </p>
                  {remainingAttempts > 0 ? (
                    <button
                      onClick={handleReRequestQuotes}
                      disabled={isReRequesting}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[#D97706] disabled:opacity-50"
                    >
                      {isReRequesting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending request...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
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
            </div>
            {remainingAttempts > 0 && (
              <div className="flex items-center justify-between gap-2.5 border-t border-amber-200 bg-amber-200/50 px-[18px] py-2.5">
                <span className="text-[11.5px] font-semibold text-[#78350F]">
                  {remainingAttempts} of 3 re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= (3 - remainingAttempts) ? 'bg-amber-500' : 'bg-amber-300'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {reRequestSuccess && (
          <div className="overflow-hidden rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(120deg,#E9FAF2,#fff)]">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#C8F1DF] bg-white text-[#056B3E]">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14.5px] font-extrabold text-[#056B3E]">Request sent successfully!</h4>
                  <p className="text-sm text-green-700 mt-1">{reRequestSuccess}</p>
                </div>
              </div>
            </div>
            {remainingAttempts > 0 && (
              <div className="px-5 py-2.5 bg-green-100/60 border-t border-green-200">
                <span className="text-xs text-green-700">
                  {remainingAttempts} re-request{remainingAttempts !== 1 ? 's' : ''} remaining
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Request */}
        {request && ['PENDING', 'QUOTES_RECEIVED'].includes(request.status) && (
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">
            <div className="border-b border-red-100 bg-red-50 px-4 py-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-red-700">Cancel Request</h3>
            </div>
            <div className="p-4">
              <p className="mb-3 text-[12.5px] leading-relaxed text-gray-500">
                Cancel this quote request if your plans have changed. Vendors will be notified immediately.
              </p>
              <button
                onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-[13.5px] font-bold text-red-600 transition hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
                Cancel This Request
              </button>
            </div>
          </div>
        )}

        {/* Cancelled Banner */}
        {request?.status === 'CANCELLED' && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-red-200 bg-white text-red-500">
              <XCircle className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[14.5px] font-extrabold text-red-800">This quote request has been cancelled</p>
              <p className="mt-0.5 text-[12.5px] text-red-600">No further quotes will be received for this request.</p>
            </div>
          </div>
        )}

        </div>
        {/* /Left column */}

        {/* Right rail */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
        {/* Request Summary */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Dark head, same family as the hero, so the rail reads as a proper
              document rather than a plain box. */}
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
                  <Truck className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="quote-serif block text-[18px] font-medium">Your Request</span>
                  <span className="mt-px flex min-w-0 items-center gap-1 truncate text-[11px] text-white/[0.66]">
                    {request.pickupCity}
                    <ArrowRight className="h-3 w-3 flex-none" />
                    {request.dropCity}
                  </span>
                </span>
              </div>
              <span className="flex-none rounded-full border border-white/[0.22] bg-white/[0.14] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-white/[0.9]">
                {request.requestNumber}
              </span>
            </div>
          </div>

          <div className="p-3">
            {/* Journey window — a compact rail so pickup and delivery read as
                one span instead of two unrelated rows. */}
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
                  <span className="relative inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#0F1A15] px-2.5 py-1 text-[10px] font-extrabold capitalize text-white shadow-[0_8px_16px_-10px_rgba(1,35,20,.9)]">
                    <Truck className="h-2.5 w-2.5" />
                    {request.tripDirection ? request.tripDirection.replace(/_/g, ' ').toLowerCase() : 'Transport'}
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <p className="flex items-center justify-end gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                    Delivery
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F87171] shadow-[0_0_0_2.5px_rgba(248,113,113,.18)]" />
                  </p>
                  <p className="mt-1 truncate text-[13.5px] font-extrabold capitalize text-gray-900">
                    {request.expectedDeliveryDate
                      ? new Date(request.expectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : request.expectedDeliveryTime
                        ? request.expectedDeliveryTime.toLowerCase()
                        : '—'}
                  </p>
                  {request.expectedDeliveryDate && request.expectedDeliveryTime && (
                    <p className="mt-px truncate text-[11px] capitalize text-gray-400">{request.expectedDeliveryTime.toLowerCase()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stat tiles. gap-px over a grey ground draws the hairlines, so the
                dividers stay correct however the tiles wrap. Tints live on each
                cell, not on a shared base — Tailwind resolves by stylesheet
                order, not class-string order. */}
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100">
              {[
                {
                  icon: Package,
                  label: 'Service',
                  value: <span className="capitalize">{request.serviceType?.replace(/-/g, ' ')}</span>,
                  tint: 'bg-[#E9FAF2] text-[#056B3E]',
                },
                {
                  icon: Truck,
                  label: 'Truck Type',
                  // The page has always read `vehicle_category` first; the API
                  // actually returns `vehicleCategoryName`, so both stay in the chain.
                  value:
                    request.vehicle_category ||
                    request.vehicleCategoryName ||
                    request.chauffeur_vehicle_categories ||
                    '—',
                  tint: 'bg-blue-50 text-blue-600',
                },
                {
                  icon: Package,
                  label: 'Goods',
                  value: request.goodsDescription || request.goodsType || '—',
                  tint: 'bg-amber-50 text-amber-700',
                },
                {
                  icon: Weight,
                  label: 'Weight',
                  value: request.estimatedWeight ? `${request.estimatedWeight} kg` : '—',
                  tint: 'bg-gray-100 text-gray-600',
                },
              ].map(({ icon: Icon, label, value, tint }) => (
                <div
                  key={label}
                  className="group flex items-center gap-2.5 bg-white px-3 py-2.5 transition hover:bg-[#E9FAF2]"
                >
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-[10px] transition group-hover:bg-white group-hover:text-[#056B3E] ${tint}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400 transition group-hover:text-[#056B3E]/70">
                      {label}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] font-extrabold leading-snug text-gray-900 transition group-hover:text-[#056B3E]">
                      {value}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Addresses */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2.5 rounded-2xl border border-gray-100 bg-[#FCFDFC] px-3 py-2.5 transition hover:border-[#C8F1DF] hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(1,35,20,.45)]">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#E9FAF2] text-[#056B3E]">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Pickup Address</span>
                  <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-gray-700">
                    {[request.pickupCity, request.pickupAddress, request.pickupPincode].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </div>
              <div className="flex gap-2.5 rounded-2xl border border-gray-100 bg-[#FCFDFC] px-3 py-2.5 transition hover:border-blue-200 hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(1,35,20,.45)]">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Drop Address</span>
                  <span className="mt-0.5 block break-words text-[12.5px] leading-relaxed text-gray-700">
                    {[request.dropCity, request.dropAddress, request.dropPincode].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </div>
            </div>

            {/* Extended truck quotation details */}
            <div className="mt-3 rounded-2xl border border-gray-100 bg-[#FCFDFC] p-3">
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Shipment Details</p>
              <TruckRequestDetails data={request as any} hideVehicle variant="rows" />
            </div>
          </div>
        </div>
        {/* ══ /Request Summary ══ */}

        {/* Help */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* Blue header so this card is unmistakable at a glance */}
          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3">
            <Shield className="w-4 h-4 text-blue-700" />
            <h4 className="quote-serif text-[18px] font-medium text-blue-700">Booking Protection</h4>
          </div>
          <ul className="flex flex-col gap-2.5 p-4">
            <li className="flex gap-2.5 text-[12.5px] leading-snug text-gray-600">
              <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-none text-blue-600" />
              Your payment is held securely until delivery completion
            </li>
            <li className="flex gap-2.5 text-[12.5px] leading-snug text-gray-600">
              <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-none text-blue-600" />
              Verified vendors with ratings and reviews
            </li>
            <li className="flex gap-2.5 text-[12.5px] leading-snug text-gray-600">
              <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-none text-blue-600" />
              24/7 customer support during your transport
            </li>
            <li className="flex gap-2.5 text-[12.5px] leading-snug text-gray-600">
              <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-none text-blue-600" />
              Insurance coverage for your goods
            </li>
          </ul>
        </div>

        {/* Need a hand */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 bg-[#FCFDFC] px-4 py-3">
            <h4 className="quote-serif text-[18px] font-medium text-gray-600">Need a hand</h4>
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <Link
              href="/customer/helpdesk"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#09B368] py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
            >
              <MessageSquare className="w-4 h-4" />
              Need Help?
            </Link>
            <Link
              href="/customer/truck-quotes"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[13.5px] font-bold text-gray-700 transition hover:border-[#96E4C2] hover:bg-gray-50 hover:text-[#056B3E]"
            >
              Back to Requests
            </Link>
          </div>
        </div>
        </aside>
        {/* /Right rail */}
      </div>

      {/* Accept Button */}
      {selectedQuote && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white/[0.92] shadow-[0_-12px_40px_-18px_rgba(15,26,21,.3)] backdrop-blur-[14px]">
          {/* The banner at the top of the column is a screen away from here, so
              a failed accept has to say so next to the button that failed. */}
          {error && (
            <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
              <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
                <AlertCircle className="mt-[1px] h-4 w-4 shrink-0" />
                {error}
              </p>
            </div>
          )}
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl border border-[#C8F1DF] bg-[#E9FAF2] text-[#056B3E]">
                <CheckCircle className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Selected quote</p>
                <p className="truncate text-[14.5px] font-extrabold text-gray-900">
                  {quotes.find((q) => q.id === selectedQuote)?.vendorName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-[18px]">
              <div className="text-right">
                {(quotes.find((q) => q.id === selectedQuote)?.advanceAmount ?? 0) > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                    Pay now ₹{quotes.find((q) => q.id === selectedQuote)?.advanceAmount?.toLocaleString('en-IN')}
                  </p>
                )}
                <span className="block text-[22px] font-extrabold tabular-nums text-[#056B3E]">
                  ₹{quotes.find((q) => q.id === selectedQuote)?.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={handleAcceptQuote}
                disabled={isAccepting}
                className="flex items-center gap-2 rounded-xl bg-[#09B368] px-[26px] py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#09B368]/30 transition hover:bg-[#078F53] disabled:opacity-50"
              >
                {isAccepting ? (
                  <>
                    <span className="animate-spin w-[17px] h-[17px] border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-[17px] h-[17px]" />
                    Accept &amp; Book
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header — states the consequence before anything else */}
            <div className="relative overflow-hidden bg-[linear-gradient(150deg,#7F1D1D,#B91C1C_70%)] px-5 pb-[18px] pt-5 text-white">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(420px 180px at 100% -40%, rgba(255,255,255,.2), transparent 62%)' }}
              />
              <div className="relative z-10 flex items-start gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-white/[0.26] bg-white/[0.18]">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <h3 className="text-[17px] font-extrabold">Cancel this quote request?</h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/[0.82]">
                    The request closes for every vendor and the quotes you have received will no longer be available. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <XCircle className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Request Summary */}
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF] text-[#056B3E]">
                  <Truck className="w-[22px] h-[22px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-extrabold text-gray-900">{request?.requestNumber}</p>
                  <p className="mt-0.5 text-xs capitalize text-gray-500">
                    {request?.serviceType?.replace(/-/g, ' ')}
                    {request?.pickupCity ? ` · ${request.pickupCity}` : ''}
                    {request?.dropCity ? ` → ${request.dropCity}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[
                      request?.pickupAddress,
                      request?.dropAddress,
                      request?.goodsType,
                      request?.estimatedWeight ? `${request.estimatedWeight} kg` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {quotes.length} quote{quotes.length === 1 ? '' : 's'} received
                  </p>
                </div>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="mb-2 block text-[12.5px] font-bold text-gray-700">
                  Why are you cancelling? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[13px] leading-snug transition ${
                        selectedCancelReason === reason
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={selectedCancelReason === reason}
                        onChange={() => { setSelectedCancelReason(reason); setCancelError(null); }}
                        className="mt-0.5 accent-red-500"
                      />
                      <span className={selectedCancelReason === reason ? 'font-semibold text-red-700' : 'text-gray-700'}>{reason}</span>
                    </label>
                  ))}
                </div>

                {selectedCancelReason === 'Other' && (
                  <textarea
                    value={otherCancelReason}
                    onChange={(e) => { setOtherCancelReason(e.target.value); setCancelError(null); }}
                    placeholder="Tell us what happened…"
                    rows={3}
                    className="mt-2.5 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm text-gray-700 resize-none transition"
                  />
                )}

                {cancelError && (
                  <p className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {cancelError}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-relaxed text-red-800">
                <strong>Note:</strong> This action cannot be undone. All vendors will be notified that the request is closed.
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[13.5px] font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCancelling || !selectedCancelReason}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-[13.5px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
