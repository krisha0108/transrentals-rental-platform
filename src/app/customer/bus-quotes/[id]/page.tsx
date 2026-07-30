'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bus, ArrowLeft, MapPin, Calendar, Clock, Users,
  CheckCircle, XCircle, AlertCircle, Star, Shield,
  ThumbsUp, MessageSquare, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Check, Zap,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { BUS_CATEGORIES, BUS_TRIP_TYPES } from '@/lib/bus-categories';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import CustomerHeader from '@/components/customer/CustomerHeader';
import QuotePaymentSafetyNotice from '@/components/customer/QuotePaymentSafetyNotice';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  tripType: string;
  busCategory: string;
  passengerCount: number;
  pickupCity: string;
  pickupAddress: string;
  dropCity: string;
  dropAddress: string;
  journeyDate: string;
  returnDate: string;
  requirements: string;
  status: string;
}

interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorTotalTrips: number;
  busCategory: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleImages?: string;
  totalAmount: number;
  baseRate: number;
  driverAllowance: number;
  tollCharges: number;
  parkingCharges: number;
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

function fmt(d: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomerBusQuoteDetailPage() {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const [request, setRequest]                 = useState<QuoteRequest | null>(null);
  const [quotes, setQuotes]                   = useState<VendorQuote[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [selectedQuote, setSelectedQuote]     = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote]     = useState<string | null>(null);
  const [isAccepting, setIsAccepting]         = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [isReRequesting, setIsReRequesting]   = useState(false);
  const [reRequestSuccess, setReRequestSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !customer) {
      router.push(`/customer/login?redirect=/customer/bus-quotes/${params.id}`);
      return;
    }
    fetchQuoteRequest();
    fetchReRequestCount();
  }, [authLoading, isAuthenticated, customer, params.id]);

  const fetchReRequestCount = async () => {
    try {
      const res = await fetch(`/api/customer/re-request-quotes?serviceType=bus&requestId=${params.id}`);
      const data = await res.json();
      setRemainingAttempts(data.remainingAttempts ?? 3);
    } catch {}
  };

  const fetchQuoteRequest = async () => {
    try {
      const response = await fetch(`/api/customer/quote-requests/bus/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setRequest(data.request);
        const parsedQuotes = (data.quotes || []).map((q: any) => ({
          ...q,
          inclusions:     Array.isArray(q.inclusions)     ? q.inclusions     : (q.inclusions     ? q.inclusions.split(',').map((s: string) => s.trim()).filter(Boolean)     : []),
          exclusions:     Array.isArray(q.exclusions)     ? q.exclusions     : (q.exclusions     ? q.exclusions.split(',').map((s: string) => s.trim()).filter(Boolean)     : []),
          termsConditions:Array.isArray(q.termsConditions)? q.termsConditions: (q.termsConditions? q.termsConditions.split(',').map((s: string) => s.trim()).filter(Boolean): []),
        }));
        setQuotes(parsedQuotes);
      } else {
        setError(data.message || 'Failed to fetch quote request');
      }
    } catch (err) {
      setError('Failed to load quote request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!selectedQuote) return;
    setIsAccepting(true); setError(null);
    try {
      const response = await fetch('/api/customer/accept-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: 'bus', quoteRequestId: params.id, quoteId: selectedQuote }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/customer/bus-bookings/${data.bookingId}`);
      } else {
        setError(data.message || 'Failed to accept quote');
      }
    } catch {
      setError('Failed to accept quote. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true); setError(null);
    try {
      const response = await fetch(`/api/bus-quote-requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/customer/bus-quotes');
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
    setIsReRequesting(true); setError(null); setReRequestSuccess(null);
    try {
      const response = await fetch('/api/customer/re-request-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: 'bus', requestId: params.id, customerId: customer.id }),
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

  const allQuotesExpired   = quotes.length > 0 && quotes.every(q => {
    const validDate = q.validUntil || (q as any).validTill;
    return validDate ? new Date(validDate).getTime() < Date.now() : q.status === 'EXPIRED';
  });
  const bookingDateInFuture = request?.journeyDate && new Date(request.journeyDate) > new Date();
  const canReRequest        = allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && remainingAttempts > 0;

  const getCategoryName = (id: string) => BUS_CATEGORIES.find(c => c.id === id)?.shortName || id || 'Bus';
  const getTripTypeName = (id: string) => BUS_TRIP_TYPES.find(t => t.id === id)?.name    || id || 'Trip';

  const sortedQuotes  = [...quotes].sort((a, b) => {
    const aExp = a.validUntil && new Date(a.validUntil).getTime() < Date.now() ? 1 : 0;
    const bExp = b.validUntil && new Date(b.validUntil).getTime() < Date.now() ? 1 : 0;
    if (aExp !== bExp) return aExp - bExp;
    return a.totalAmount - b.totalAmount;
  });
  const activeQuotes  = sortedQuotes.filter(q => !(q.validUntil && new Date(q.validUntil).getTime() < Date.now()));
  const lowestPrice   = activeQuotes[0]?.totalAmount ?? sortedQuotes[0]?.totalAmount;

  /* ── Loading ── */
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  /* ── Error / Not found ── */
  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Request</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/customer/bus-quotes" className="text-sm font-medium text-orange-600 hover:underline">← Back to Requests</Link>
        </div>
      </div>
    );
  }
  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Not Found</h3>
          <Link href="/customer/bus-quotes" className="text-sm font-medium text-orange-600 hover:underline">← Back to Requests</Link>
        </div>
      </div>
    );
  }

  const selectedQ = quotes.find(q => q.id === selectedQuote);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-16">
      <CustomerHeader showBackButton />

      {/* ── PAGE HEADER ── */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 py-5">
          <Link href="/customer/bus-quotes"
            className="inline-flex items-center gap-1.5 text-orange-100 hover:text-white text-sm font-medium mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Requests
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-orange-200 text-xs font-semibold uppercase tracking-widest mb-1">Quote Request</p>
              <h1 className="text-xl font-black text-white">#{request.requestNumber}</h1>
              <p className="text-orange-100 text-sm mt-0.5">
                {quotes.length > 0 ? `${quotes.length} quote${quotes.length !== 1 ? 's' : ''} received` : 'Awaiting quotes from vendors'}
              </p>
            </div>
            <div className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
              request.status === 'BOOKED'          ? 'bg-emerald-500 text-white' :
              request.status === 'QUOTES_RECEIVED' ? 'bg-white text-orange-600'  :
              request.status === 'CANCELLED'       ? 'bg-red-200 text-red-800'   :
              'bg-white/20 text-white border border-white/30'
            }`}>
              {request.status === 'QUOTES_RECEIVED' ? 'Quotes Ready' :
               request.status === 'PENDING'         ? 'Pending'      :
               request.status === 'BOOKED'          ? 'Booked'       :
               request.status === 'CANCELLED'       ? 'Cancelled'    : request.status}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 space-y-4">

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ── TRIP SUMMARY ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Your Trip</h2>
            {(request.status === 'PENDING' || request.status === 'QUOTES_RECEIVED') && (
              <button onClick={() => setShowCancelConfirm(true)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                Cancel Request
              </button>
            )}
          </div>
          <div className="p-4">
            {/* Route */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{request.pickupCity}</p>
                  {request.pickupAddress && <p className="text-xs text-gray-400 mt-0.5">{request.pickupAddress}</p>}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{request.dropCity}</p>
                  {request.dropAddress && <p className="text-xs text-gray-400 mt-0.5">{request.dropAddress}</p>}
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Journey</p>
                  <p className="text-xs font-semibold text-gray-800">{fmt(request.journeyDate)}</p>
                </div>
              </div>
              {request.returnDate && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">Return</p>
                    <p className="text-xs font-semibold text-gray-800">{fmt(request.returnDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Passengers</p>
                  <p className="text-xs font-semibold text-gray-800">{request.passengerCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Bus className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Trip Type</p>
                  <p className="text-xs font-semibold text-gray-800">{getTripTypeName(request.tripType)}</p>
                </div>
              </div>
            </div>

            {request.requirements && (
              <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-0.5">Requirements</p>
                <p className="text-xs text-amber-800">{request.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment safety notice — stays visible whether quotes are still
            pending or have already arrived */}
        <div className="mb-4">
          <QuotePaymentSafetyNotice />
        </div>

        {/* ── QUOTES ── */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Waiting for Quotes</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Vendors are reviewing your request. You'll receive quotes within 24–48 hours.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">
              Compare Quotes <span className="text-gray-400 font-normal">({quotes.length})</span>
            </p>

            <div className="space-y-3">
              {sortedQuotes.map((quote) => {
                const isExpanded     = expandedQuote === quote.id;
                const isSelected     = selectedQuote === quote.id;
                const isLowest       = quote.totalAmount === lowestPrice;
                const isExpired      = quote.validUntil && new Date(quote.validUntil).getTime() < Date.now();
                const isExpiringSoon = !isExpired && quote.validUntil && (new Date(quote.validUntil).getTime() - Date.now() < 24 * 3600000);
                const grand          = (quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0);

                return (
                  <div key={quote.id}
                    className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
                      isExpired  ? 'border-gray-100 opacity-70' :
                      isSelected ? 'border-orange-400 ring-4 ring-orange-50' :
                      'border-gray-100 hover:border-orange-200'
                    }`}>

                    {/* Top badge */}
                    {isExpired ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold">
                        <XCircle className="w-3 h-3" /> Quote Expired
                      </div>
                    ) : isLowest ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold">
                        <ThumbsUp className="w-3 h-3" /> Lowest Price
                      </div>
                    ) : null}

                    <div className="p-4">
                      {/* Vendor + Price row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Bus className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{quote.vendorName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-semibold text-gray-700">{quote.vendorRating || 'New'}</span>
                              </div>
                              {quote.vendorTotalTrips > 0 && (
                                <span className="text-xs text-gray-400">{quote.vendorTotalTrips} trips</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-orange-600">₹{quote.totalAmount.toLocaleString()}</p>
                          {isExpiringSoon && (
                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">⏰ Expires soon</p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle name */}
                      {quote.vehicleName && (
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
                          <Bus className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-700">{quote.vehicleName}</span>
                          {quote.vehicleNumber && (
                            <span className="text-xs text-gray-400 ml-auto">{quote.vehicleNumber}</span>
                          )}
                        </div>
                      )}

                      {/* Price breakdown pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                          Base ₹{(quote.baseRate || quote.totalAmount).toLocaleString()}
                        </span>
                        {quote.driverAllowance > 0 && (
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            Driver ₹{quote.driverAllowance.toLocaleString()}
                          </span>
                        )}
                        {quote.tollCharges > 0 && (
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            Toll ₹{quote.tollCharges.toLocaleString()}
                          </span>
                        )}
                        {quote.gstAmount > 0 && (
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            GST ₹{quote.gstAmount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Inclusions chips */}
                      {quote.inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {quote.inclusions.slice(0, 4).map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                              <Check className="w-3 h-3" /> {item}
                            </span>
                          ))}
                          {quote.inclusions.length > 4 && (
                            <span className="text-[11px] text-gray-400 px-1 self-center">
                              +{quote.inclusions.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* ── EXPANDED DETAILS ── */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 pt-4 mt-1 space-y-4">

                          {/* Price breakdown table */}
                          <div className="bg-gray-50 rounded-2xl p-3.5">
                            <p className="text-xs font-bold text-gray-700 mb-2.5">Price Breakdown</p>
                            <div className="space-y-1.5 text-sm">
                              {[
                                { label: 'Base Fare',             val: quote.baseRate || quote.totalAmount },
                                { label: 'Driver Allowance',      val: quote.driverAllowance,   show: quote.driverAllowance > 0 },
                                { label: 'Toll Charges',          val: quote.tollCharges,        show: quote.tollCharges > 0 },
                                { label: 'Parking Charges',       val: quote.parkingCharges,     show: quote.parkingCharges > 0 },
                                { label: 'GST',                   val: quote.gstAmount,          show: quote.gstAmount > 0 },
                                { label: 'Security Deposit (Refundable)', val: quote.securityDeposit, show: quote.securityDeposit > 0 },
                              ].filter(r => r.show !== false).map((r, i) => (
                                <div key={i} className="flex justify-between text-gray-600">
                                  <span>{r.label}</span>
                                  <span className="font-medium">₹{r.val.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                                <span>Total</span>
                                <span>₹{grand.toLocaleString()}</span>
                              </div>
                              {quote.advanceAmount > 0 && (
                                <>
                                  <div className="flex justify-between text-emerald-600 font-semibold">
                                    <span>Advance {quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}</span>
                                    <span>₹{quote.advanceAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-500">
                                    <span>Remaining at pickup</span>
                                    <span>₹{(grand - quote.advanceAmount).toLocaleString()}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Vehicle images */}
                          <VehicleImageGallery vehicleImages={quote.vehicleImages} vehicleName={quote.vehicleName} />

                          {/* Inclusions */}
                          {quote.inclusions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Inclusions
                              </p>
                              <ul className="grid grid-cols-2 gap-1">
                                {quote.inclusions.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <span className="text-emerald-500 mt-0.5">✓</span>{item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exclusions */}
                          {quote.exclusions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-red-400" /> Exclusions
                              </p>
                              <ul className="grid grid-cols-2 gap-1">
                                {quote.exclusions.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <span className="text-red-400 mt-0.5">✗</span>{item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Terms */}
                          {quote.termsConditions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-700 mb-2">Terms & Conditions</p>
                              <ul className="space-y-1">
                                {quote.termsConditions.map((item, i) => (
                                  <li key={i} className="text-xs text-gray-500">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor note */}
                          {quote.notes && (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                              <p className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" /> Message from Vendor
                              </p>
                              <p className="text-xs text-orange-700">{quote.notes}</p>
                            </div>
                          )}

                          {/* Valid until */}
                          {quote.validUntil && (
                            <p className={`text-xs ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                              {isExpired ? 'Expired' : 'Valid'} until{' '}
                              {new Date(quote.validUntil).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors">
                          {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Details</>}
                        </button>
                        <div className="flex-1" />
                        {isExpired ? (
                          <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400">
                            Expired
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuote(isSelected ? null : quote.id)}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                            }`}>
                            {isSelected ? <><Check className="w-3.5 h-3.5" /> Selected</> : 'Select Quote'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RE-REQUEST ── */}
        {allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && !reRequestSuccess && (
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">All quotes have expired</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">
                    Your booking date is upcoming — request fresh quotes from vendors.
                  </p>
                  {remainingAttempts > 0 ? (
                    <button onClick={handleReRequestQuotes} disabled={isReRequesting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-sm">
                      {isReRequesting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                        : <><RefreshCw className="w-3.5 h-3.5" /> Request Fresh Quotes</>}
                    </button>
                  ) : (
                    <p className="text-xs font-semibold text-red-600">
                      All 3 re-request attempts used. Please create a new request.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {remainingAttempts > 0 && (
              <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-amber-700">{remainingAttempts} of 3 re-requests remaining</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= (3 - remainingAttempts) ? 'bg-amber-400' : 'bg-amber-200'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RE-REQUEST SUCCESS ── */}
        {reRequestSuccess && (
          <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-sm">Request sent!</p>
                <p className="text-xs text-emerald-700 mt-0.5">{reRequestSuccess}</p>
              </div>
            </div>
            {remainingAttempts > 0 && (
              <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100">
                <span className="text-xs text-emerald-700">{remainingAttempts} re-request{remainingAttempts !== 1 ? 's' : ''} remaining</span>
              </div>
            )}
          </div>
        )}

        {/* ── BOOKING PROTECTION ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" /> Booking Protection
          </p>
          <ul className="space-y-2">
            {[
              'Payment held securely until trip completion',
              'Verified vendors with ratings & reviews',
              '24/7 customer support during your trip',
              'Free cancellation up to 48 hrs before (check T&C)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── CANCEL CONFIRM MODAL ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Cancel Quote Request?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              This cannot be undone. All received quotes will be discarded.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} disabled={isCancelling}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition">
                Keep
              </button>
              <button onClick={handleCancelRequest} disabled={isCancelling}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isCancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCEPT BOTTOM BAR ── */}
      {selectedQuote && selectedQ && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl shadow-black/10 px-4 py-3 z-40">
          <div className="container mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{selectedQ.vendorName}</p>
              <p className="text-[11px] text-gray-400">
                {selectedQ.vehicleName && `${selectedQ.vehicleName} · `}
                Advance ₹{(selectedQ.advanceAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-black text-orange-600">₹{selectedQ.totalAmount.toLocaleString()}</p>
              </div>
              <button onClick={handleAcceptQuote} disabled={isAccepting}
                className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition disabled:opacity-50 text-sm shadow-lg shadow-orange-200">
                {isAccepting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</>
                  : <><CheckCircle className="w-4 h-4" /> Accept & Book</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
