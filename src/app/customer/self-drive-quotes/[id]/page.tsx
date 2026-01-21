'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
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
  Gauge,
  Settings2,
  Fuel,
  Users,
  Truck,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  vehicleCategoryName?: string;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  locationId: string;
  locationName: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  isDeliveryRequested?: boolean;
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
  transmission?: string;
  fuelType?: string;
  seatingCapacity?: number;
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
  kmLimitPerDay?: number;
  extraKmRate?: number;
  deliveryCharge?: number;
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

export default function CustomerSelfDriveQuoteDetailPage() {
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

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push(`/customer/login?redirect=/customer/self-drive-quotes/${params.id}`);
      return;
    }

    fetchQuoteRequest();
  }, [authLoading, isAuthenticated, customer, params.id]);

  const fetchQuoteRequest = async () => {
    try {
      const response = await fetch(`/api/self-drive-quote-requests/${params.id}`);
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
          serviceType: 'self-drive',
          quoteRequestId: params.id,
          quoteId: selectedQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/customer/self-drive-bookings/${data.bookingId}`);
      } else {
        setError(data.message || 'Failed to accept quote');
      }
    } catch (err) {
      setError('Failed to accept quote. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const parseJsonSafe = (str: string | undefined | null): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => a.grandTotal - b.grandTotal);
  const lowestPrice = sortedQuotes[0]?.grandTotal;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
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
          <Link href="/customer/self-drive-quotes" className="text-blue-600 hover:underline">
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
          <Link href="/customer/self-drive-quotes" className="text-blue-600 hover:underline">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/customer/self-drive-quotes"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <h1 className="text-xl font-bold">#{request.requestNumber}</h1>
          <p className="text-blue-100">{quotes.length} quotes received</p>
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
              <Car className="w-4 h-4 text-blue-500" />
              <span>
                {request.vehicle_modelsName || request.vehicleCategoryName || 'Any Car'}
                {request.vehicleBrand && ` (${request.vehicleBrand})`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{request.locationName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
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
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}</span>
              {request.pickupTime && <span className="text-gray-400">• {request.pickupTime}</span>}
            </div>
          </div>

          {/* Vehicle Preferences */}
          <div className="flex flex-wrap gap-2 mt-3">
            {request.transmission && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                <Settings2 className="w-3 h-3" />
                {request.transmission}
              </span>
            )}
            {request.fuelType && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                <Fuel className="w-3 h-3" />
                {request.fuelType}
              </span>
            )}
            {request.minSeats && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                <Users className="w-3 h-3" />
                {request.minSeats}+ seats
              </span>
            )}
            {request.isDeliveryRequested && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                <Truck className="w-3 h-3" />
                Delivery Requested
              </span>
            )}
          </div>

          {request.customerNotes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Notes:</strong> {request.customerNotes}
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
                const isExpiringSoon =
                  new Date(quote.validTill).getTime() - Date.now() < 24 * 3600000;
                const inclusions = parseJsonSafe(quote.inclusions);
                const exclusions = parseJsonSafe(quote.exclusions);
                const terms = parseJsonSafe(quote.termsConditions);

                return (
                  <div
                    key={quote.id}
                    className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'
                    }`}
                  >
                    {/* Badges */}
                    {isLowestPrice && (
                      <div className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium flex items-center gap-2">
                        <ThumbsUp className="w-3 h-3" />
                        Best Price
                      </div>
                    )}

                    <div className="p-4">
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Car className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {quote.vendor?.businessName || 'Vendor'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">
                                  {quote.vendor?.rating?.toFixed(1) || 'New'}
                                </span>
                              </div>
                              {quote.vendor?.totalTrips && quote.vendor.totalTrips > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">
                                    {quote.vendor.totalTrips} trips
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{quote.grandTotal.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ₹{quote.dailyRate}/day × {request.totalDays} days
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

                      {/* Vehicle Specs */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {quote.transmission && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            <Settings2 className="w-3 h-3" />
                            {quote.transmission}
                          </span>
                        )}
                        {quote.fuelType && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                            <Fuel className="w-3 h-3" />
                            {quote.fuelType}
                          </span>
                        )}
                        {quote.seatingCapacity && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                            <Users className="w-3 h-3" />
                            {quote.seatingCapacity} seats
                          </span>
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                        {quote.kmLimitPerDay && (
                          <span className="flex items-center gap-1">
                            <Gauge className="w-4 h-4 text-blue-500" />
                            {quote.kmLimitPerDay} km/day
                          </span>
                        )}
                        {quote.extraKmRate && (
                          <span>+₹{quote.extraKmRate}/extra km</span>
                        )}
                        <span>Deposit: ₹{quote.securityDeposit.toLocaleString()}</span>
                        <span>Advance: {quote.advancePercent}%</span>
                        {quote.deliveryCharge && quote.deliveryCharge > 0 && (
                          <span>Delivery: ₹{quote.deliveryCharge}</span>
                        )}
                      </div>

                      {/* Quick Inclusions */}
                      {inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {inclusions.slice(0, 4).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                            >
                              {item}
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
                                <span>Daily Rate × {request.totalDays} days</span>
                                <span>₹{quote.totalAmount.toLocaleString()}</span>
                              </div>
                              {quote.deliveryCharge && quote.deliveryCharge > 0 && (
                                <div className="flex justify-between">
                                  <span>Delivery Charge</span>
                                  <span>₹{quote.deliveryCharge.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>GST (18%)</span>
                                <span>₹{quote.gstAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                                <span>Total</span>
                                <span>₹{quote.grandTotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-blue-600">
                                <span>Advance ({quote.advancePercent}%)</span>
                                <span>₹{quote.advanceAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Security Deposit (Refundable)</span>
                                <span>₹{quote.securityDeposit.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

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
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-1 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Message from Vendor
                              </h4>
                              <p className="text-sm text-blue-700">{quote.vendorMessage}</p>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Valid until:{' '}
                            {new Date(quote.validTill).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
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
                        <button
                          onClick={() => setSelectedQuote(quote.id)}
                          className={`flex-1 py-2 font-medium rounded-lg transition text-sm ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select This Quote'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Help */}
        <div className="bg-blue-50 rounded-xl p-4 mt-6 border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Booking Protection
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Verified vendors with ratings</li>
            <li>• Secure advance payment</li>
            <li>• Security deposit refunded after return</li>
            <li>• Valid driving license (1+ year) required at pickup</li>
          </ul>
        </div>
      </div>

      {/* Accept Button */}
      {selectedQuote && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {quotes.find((q) => q.id === selectedQuote)?.vendor?.businessName}
              </p>
              <p className="text-lg font-bold text-blue-600">
                ₹{quotes.find((q) => q.id === selectedQuote)?.grandTotal.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
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
