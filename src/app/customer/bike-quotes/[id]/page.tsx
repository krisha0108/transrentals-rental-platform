'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bike,
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
  Gauge,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { formatBookingDuration } from '@/lib/utils/duration';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  vehicleCategoryName?: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  helmetsRequired?: number;
  customerNotes?: string;
  status: string;
}

interface VendorQuote {
  id: string;
  quoteNumber: string;
  vendorId: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  registrationNumber?: string;
  vehicleImages?: string;
  vehicleFeatures?: string;
  dailyRate: number;
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
          <h3 className="font-medium text-gray-900 mb-2">Error Loading Request</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/customer/bike-quotes" className="text-emerald-600 hover:underline">
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
          <h3 className="font-medium text-gray-900 mb-2">Request Not Found</h3>
          <Link href="/customer/bike-quotes" className="text-emerald-600 hover:underline">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/customer/bike-quotes"
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <h1 className="text-xl font-bold">#{request.requestNumber}</h1>
          <p className="text-emerald-100">{quotes.length} quotes received</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Request Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Your Request</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Bike className="w-4 h-4 text-emerald-500" />
              <span>
                {request.vehicle_modelsName || request.vehicleCategoryName || 'Any Bike'}
                {request.vehicleBrand && ` (${request.vehicleBrand})`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{request.locationName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>
                {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' → '}
                {new Date(request.dropDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{formatBookingDuration(request)}</span>
              {request.pickupTime && <span className="text-gray-400">• {request.pickupTime}</span>}
            </div>
            {request.helmetsRequired && (
              <div className="flex items-center gap-2 text-sm">
                <HardHat className="w-4 h-4 text-emerald-500" />
                <span>{request.helmetsRequired} helmet(s) required</span>
              </div>
            )}
          </div>
          {request.customerNotes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Notes:</strong> {request.customerNotes}
            </div>
          )}

          {/* Cancel Request Button */}
          {(request.status === 'PENDING' || request.status === 'QUOTES_RECEIVED') && (
            <div className="mt-4 pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>

        {/* Quotes */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">Awaiting Quotes</h3>
            <p className="text-sm text-gray-500">
              Vendors are reviewing your request. You'll receive quotes within 24-48 hours.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-gray-900 mb-4">
              Compare Quotes ({quotes.length})
            </h2>

            <div className="space-y-4">
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

                return (
                  <div
                    key={quote.id}
                    className={`rounded-xl shadow-sm border-2 overflow-hidden transition ${
                      isExpired ? 'bg-gray-50 opacity-75 border-gray-200' : isSelected ? 'bg-white border-emerald-500 ring-2 ring-emerald-100' : 'bg-white border-transparent'
                    }`}
                  >
                    {/* Badges */}
                    {isExpired ? (
                      <div className="px-4 py-1.5 bg-red-500 text-white text-xs font-medium flex items-center gap-2">
                        <XCircle className="w-3 h-3" />
                        Quote Expired
                      </div>
                    ) : isLowestPrice ? (
                      <div className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium flex items-center gap-2">
                        <ThumbsUp className="w-3 h-3" />
                        Best Price
                      </div>
                    ) : null}

                    <div className="p-4">
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Bike className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {(quote as any).vendor?.businessName || quote.vendors?.businessName || 'Vendor'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">
                                  {((quote as any).vendor?.rating || quote.vendors?.rating)?.toFixed(1) || 'New'}
                                </span>
                              </div>
                              {(((quote as any).vendor?.totalTrips || quote.vendors?.totalTrips) || 0) > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">
                                    {(quote as any).vendor?.totalTrips || quote.vendors?.totalTrips} trips
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">
                            ₹{quote.grandTotal.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            for {request.totalDays} days
                          </p>
                          {isExpiringSoon && (
                            <p className="text-xs text-red-500 mt-1">Expires soon!</p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                        <span className="font-medium text-gray-900">{quote.vehicleName}</span>
                        {quote.vehicleBrand && (
                          <span className="text-gray-400">• {quote.vehicleBrand}</span>
                        )}
                        {quote.registrationNumber && (
                          <span className="text-gray-400">({quote.registrationNumber})</span>
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <HardHat className="w-4 h-4 text-emerald-500" />
                          {quote.helmetsIncluded} helmet(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="w-4 h-4 text-emerald-500" />
                          {quote.unlimitedKm || quote.kmLimitPerDay === 0 ? 'Unlimited KM' : quote.kmLimitPerDay ? `${quote.kmLimitPerDay} km/day` : 'No KM limit set'}
                        </span>
                        <span>Deposit: ₹{quote.securityDeposit.toLocaleString()}</span>
                        <span>Advance: {quote.advancePercent}%</span>
                      </div>

                      {/* Quick Inclusions */}
                      {inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {inclusions.slice(0, 4).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                            >
                              ✓ {item}
                            </span>
                          ))}
                          {inclusions.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{inclusions.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                          {/* Price Breakdown */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Price Breakdown</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Rental ({request.totalDays} days)</span>
                                <span>₹{quote.totalAmount.toLocaleString()}</span>
                              </div>
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
                              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                                <span>Total Amount to Pay</span>
                                <span>₹{(quote.grandTotal + (quote.securityDeposit || 0)).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-emerald-600">
                                <span>Advance {quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}</span>
                                <span>₹{quote.advanceAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Remaining at pickup</span>
                                <span>₹{(quote.grandTotal + (quote.securityDeposit || 0) - quote.advanceAmount).toLocaleString()}</span>
                              </div>
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
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Inclusions
                              </h4>
                              <ul className="grid md:grid-cols-2 gap-1">
                                {inclusions.map((item, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-600 flex items-start gap-2"
                                  >
                                    <span className="text-green-500">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exclusions */}
                          {exclusions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Exclusions
                              </h4>
                              <ul className="grid md:grid-cols-2 gap-1">
                                {exclusions.map((item, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-600 flex items-start gap-2"
                                  >
                                    <span className="text-red-500">✗</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Terms */}
                          {terms.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                              <ul className="space-y-1">
                                {terms.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor Notes */}
                          {quote.vendorMessage && (
                            <div className="bg-emerald-50 p-3 rounded-lg">
                              <h4 className="font-medium text-emerald-800 mb-1 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Message from Vendor
                              </h4>
                              <p className="text-sm text-emerald-700">{quote.vendorMessage}</p>
                            </div>
                          )}

                          <div className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {isExpired ? 'Expired on: ' : 'Valid until: '}
                            {new Date(quote.validTill).toLocaleString('en-IN', {
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
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <button
                          onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          {isExpanded ? 'Show Less' : 'View Details'}
                        </button>
                        {isExpired ? (
                          <div className="flex-1 py-2 text-center font-medium rounded-lg text-sm bg-red-50 text-red-500 cursor-not-allowed">
                            Quote Expired
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuote(quote.id)}
                            className={`flex-1 py-2 font-medium rounded-lg transition text-sm ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select This Quote'}
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

        {/* Re-Request Quotes Banner */}
        {allQuotesExpired && bookingDateInFuture && request?.status !== 'BOOKED' && !reRequestSuccess && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl overflow-hidden border border-amber-200">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">All quotes have expired</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your booking date is still upcoming. You can re-open this request so vendors can send fresh quotes.
                  </p>
                  {remainingAttempts > 0 ? (
                    <button
                      onClick={handleReRequestQuotes}
                      disabled={isReRequesting}
                      className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition disabled:opacity-50 shadow-sm"
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
              <div className="px-5 py-2.5 bg-amber-100/60 border-t border-amber-200 flex items-center justify-between">
                <span className="text-xs text-amber-700">
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
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl overflow-hidden border border-green-200">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">Request sent successfully!</h4>
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

        {/* Help */}
        <div className="bg-emerald-50 rounded-xl p-4 mt-6 border border-emerald-100">
          <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Booking Protection
          </h4>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• Verified vendors with ratings</li>
            <li>• Secure advance payment</li>
            <li>• Security deposit refunded after return</li>
            <li>• Valid license required at pickup</li>
          </ul>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Cancel Quote Request?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to cancel this quote request? This action cannot be undone and all received quotes will be discarded.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {(() => {
                  const q = quotes.find((q) => q.id === selectedQuote);
                  return (q as any)?.vendor?.businessName || q?.vendors?.businessName;
                })()}
              </p>
              <p className="text-lg font-bold text-emerald-600">
                ₹{quotes.find((q) => q.id === selectedQuote)?.grandTotal.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isAccepting ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
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
