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
} from 'lucide-react';
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
  needOperator: boolean;
  requirements: string;
  status: string;
}

interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorTotalRentals: number;
  equipmentModel: string;
  equipmentYear: number;
  vehicleImages?: string;
  totalAmount: number;
  dailyRate: number;
  deliveryCharges: number;
  operatorCharges: number;
  fuelCharges: number;
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

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/customer/equipment-quotes"
            className="inline-flex items-center gap-2 text-amber-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <h1 className="text-xl font-bold">#{request.requestNumber}</h1>
          <p className="text-amber-100">{quotes.length} quotes received</p>
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
          <h2 className="text-base font-semibold text-gray-900 mb-3">Your Request</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <HardHat className="w-4 h-4 text-amber-500" />
              <span>{getEquipmentName(request.equipmentType)}</span>
              <span className="text-gray-400">•</span>
              <span>Qty: {request.quantity}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{request.rentalDuration} {request.durationUnit}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span>{request.deliveryCity || request.city}</span>
                {request.deliveryAddress && (
                  <p className="text-xs text-gray-500 mt-0.5">{request.deliveryAddress}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>
                Start: {new Date(request.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {request.needOperator && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Operator Required</span>
            )}
          </div>
          {request.requirements && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Requirements:</strong> {request.requirements}
            </div>
          )}
        </div>

        {/* Payment safety notice — stays visible whether quotes are still
            pending or have already arrived */}
        <div className="mb-4">
          <QuotePaymentSafetyNotice />
        </div>

        {/* Quotes */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Awaiting Quotes</h3>
            <p className="text-sm text-gray-500">
              Vendors are reviewing your request. You'll receive quotes within 24-48 hours.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compare Quotes ({quotes.length})
            </h2>

            <div className="space-y-4">
              {sortedQuotes.map((quote, index) => {
                const isExpanded = expandedQuote === quote.id;
                const isSelected = selectedQuote === quote.id;
                const isLowestPrice = quote.totalAmount === lowestPrice;
                const isExpired = quote.validUntil && new Date(quote.validUntil).getTime() < Date.now();
                const isExpiringSoon = !isExpired && new Date(quote.validUntil).getTime() - Date.now() < 24 * 3600000;

                return (
                  <div
                    key={quote.id}
                    className={`rounded-xl shadow-sm border-2 overflow-hidden transition ${
                      isExpired ? 'bg-gray-50 opacity-75 border-gray-200' : isSelected ? 'bg-white border-amber-500 ring-2 ring-amber-100' : 'bg-white border-transparent'
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
                        Lowest Price
                      </div>
                    ) : null}

                    <div className="p-4">
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{quote.vendorName}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">{quote.vendorRating || 'New'}</span>
                              </div>
                              {quote.vendorTotalRentals > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">{quote.vendorTotalRentals} rentals</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600">
                            ₹{quote.totalAmount.toLocaleString()}
                          </p>
                          {quote.dailyRate && (
                            <p className="text-xs text-gray-500">₹{quote.dailyRate.toLocaleString()}/day</p>
                          )}
                          {isExpiringSoon && (
                            <p className="text-xs text-red-500">Expires soon!</p>
                          )}
                        </div>
                      </div>

                      {/* Equipment Info */}
                      {quote.equipmentModel && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Wrench className="w-4 h-4" />
                          <span>{quote.equipmentModel}</span>
                          {quote.equipmentYear && (
                            <span className="text-gray-400">({quote.equipmentYear})</span>
                          )}
                        </div>
                      )}

                      {/* Price Breakdown Summary */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                        {quote.dailyRate > 0 && (
                          <span>Daily: ₹{quote.dailyRate.toLocaleString()}</span>
                        )}
                        {quote.deliveryCharges > 0 && (
                          <span>Delivery: ₹{quote.deliveryCharges.toLocaleString()}</span>
                        )}
                        {quote.operatorCharges > 0 && (
                          <span>Operator: ₹{quote.operatorCharges.toLocaleString()}</span>
                        )}
                        {quote.securityDeposit > 0 && (
                          <span>Deposit: ₹{quote.securityDeposit.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Quick Inclusions */}
                      {quote.inclusions && quote.inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {quote.inclusions.slice(0, 4).map((item, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ {item}
                            </span>
                          ))}
                          {quote.inclusions.length > 4 && (
                            <span className="text-xs text-gray-500">+{quote.inclusions.length - 4} more</span>
                          )}
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                          {/* Price Breakdown */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Price Breakdown</h4>
                            <div className="space-y-1 text-sm">
                              {quote.dailyRate > 0 && (
                                <div className="flex justify-between">
                                  <span>Daily Rate</span>
                                  <span>₹{quote.dailyRate.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.deliveryCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Delivery Charges</span>
                                  <span>₹{quote.deliveryCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.operatorCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Operator Charges</span>
                                  <span>₹{quote.operatorCharges.toLocaleString()}</span>
                                </div>
                              )}
                              {quote.fuelCharges > 0 && (
                                <div className="flex justify-between">
                                  <span>Fuel Charges</span>
                                  <span>₹{quote.fuelCharges.toLocaleString()}</span>
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
                              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                                <span>Total Amount to Pay</span>
                                <span>₹{((quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0)).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-emerald-600">
                                <span>Advance {quote.advancePercent > 0 ? `(${quote.advancePercent}%)` : ''}</span>
                                <span>₹{(quote.advanceAmount || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Remaining at pickup</span>
                                <span>₹{((quote.grandTotal || quote.totalAmount) + (quote.securityDeposit || 0) - (quote.advanceAmount || 0)).toLocaleString()}</span>
                              </div>
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
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Inclusions
                              </h4>
                              <ul className="grid md:grid-cols-2 gap-1">
                                {quote.inclusions.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-500">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exclusions */}
                          {quote.exclusions && quote.exclusions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Exclusions
                              </h4>
                              <ul className="grid md:grid-cols-2 gap-1">
                                {quote.exclusions.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-red-500">✗</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Terms */}
                          {quote.termsConditions && quote.termsConditions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                              <ul className="space-y-1">
                                {quote.termsConditions.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor Notes */}
                          {quote.notes && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Message from Vendor
                              </h4>
                              <p className="text-sm text-amber-700">{quote.notes}</p>
                            </div>
                          )}

                          <div className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
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
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
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
                  <h4 className="text-base font-semibold text-gray-900">All quotes have expired</h4>
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
                  <h4 className="text-base font-semibold text-green-800">Request sent successfully!</h4>
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
        <div className="bg-amber-50 rounded-xl p-4 mt-6 border border-amber-100">
          <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Booking Protection
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Your payment is held securely until rental completion</li>
            <li>• Verified vendors with ratings and reviews</li>
            <li>• Equipment inspection before handover</li>
            <li>• 24/7 customer support during your rental</li>
          </ul>
        </div>
      </div>

      {/* Accept Button */}
      {selectedQuote && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {quotes.find((q) => q.id === selectedQuote)?.vendorName}
              </p>
              <p className="text-lg font-bold text-amber-600">
                ₹{quotes.find((q) => q.id === selectedQuote)?.totalAmount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className="px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
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
