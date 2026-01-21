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
} from 'lucide-react';

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
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuoteRequest();
  }, [params.id]);

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

  const getCategoryName = (id: string) => LUXURY_CATEGORIES[id] || id || 'Luxury Car';
  const getTripTypeName = (id: string) => TRIP_TYPES[id] || id || 'Trip';

  const quotes = request?.quotes || [];
  const sortedQuotes = [...quotes].sort((a, b) => a.totalAmount - b.totalAmount);
  const lowestPrice = sortedQuotes[0]?.totalAmount;

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
          <h3 className="font-medium text-gray-900 mb-2">Error Loading Request</h3>
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
          <h3 className="font-medium text-gray-900 mb-2">Request Not Found</h3>
          <Link href="/customer/dashboard" className="text-amber-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 text-amber-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold">#{request.requestNumber}</h1>
              <p className="text-amber-200">
                {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} received
              </p>
            </div>
          </div>
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
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-amber-100">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Your Request
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Car className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{request.vehicleCategoryName || getCategoryName(request.vehicle_category)}</span>
              {request.specificModel && (
                <span className="text-gray-500">• {request.specificModel}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>{getTripTypeName(request.tripType)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-green-500" />
              <span>
                {request.pickupCity}
                {request.dropCity && ` → ${request.dropCity}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>
                {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' at '}
                {request.pickupTime}
                {request.returnDate && (
                  <> - {new Date(request.returnDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}</>
                )}
              </span>
            </div>
            {request.occasion && (
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4 text-pink-500" />
                <span className="capitalize">{request.occasion}</span>
              </div>
            )}
            {request.needDecoration && (
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4 text-pink-500" />
                <span>Decoration: {request.decorationType || 'Yes'}</span>
              </div>
            )}
          </div>
          {request.requirements && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm text-gray-700">
              <strong>Special Requirements:</strong> {request.requirements}
            </div>
          )}
        </div>

        {/* Quotes */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-amber-100">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">Awaiting Quotes</h3>
            <p className="text-sm text-gray-500">
              Premium vendors are reviewing your request. You'll receive quotes shortly.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Compare Quotes ({quotes.length})
            </h2>

            <div className="space-y-4">
              {sortedQuotes.map((quote) => {
                const isExpanded = expandedQuote === quote.id;
                const isSelected = selectedQuote === quote.id;
                const isLowestPrice = quote.totalAmount === lowestPrice;
                const isExpiringSoon = new Date(quote.validTill).getTime() - Date.now() < 24 * 3600000;

                return (
                  <div
                    key={quote.id}
                    className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition ${
                      isSelected ? 'border-amber-500 ring-2 ring-amber-100' : 'border-transparent'
                    }`}
                  >
                    {/* Badges */}
                    {isLowestPrice && (
                      <div className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium flex items-center gap-2">
                        <ThumbsUp className="w-3 h-3" />
                        Best Value
                      </div>
                    )}

                    <div className="p-4">
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
                            <Crown className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{quote.vendor.businessName}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              {quote.vendor.rating ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span className="font-medium">{quote.vendor.rating}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500">New Vendor</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600">
                            ₹{quote.totalAmount.toLocaleString()}
                          </p>
                          {isExpiringSoon && (
                            <p className="text-xs text-red-500">Expires soon!</p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg">
                        <Car className="w-4 h-4 text-amber-600" />
                        <span className="font-medium">{quote.vehicleName}</span>
                        {quote.vehicleYear && (
                          <span className="text-gray-500">({quote.vehicleYear})</span>
                        )}
                        {quote.vehicleNumber && (
                          <span className="text-gray-400 font-mono">• {quote.vehicleNumber}</span>
                        )}
                      </div>

                      {/* Vehicle Features */}
                      {quote.vehicleFeatures && quote.vehicleFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {quote.vehicleFeatures.slice(0, 4).map((feature, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                              {feature}
                            </span>
                          ))}
                          {quote.vehicleFeatures.length > 4 && (
                            <span className="text-xs text-gray-500">+{quote.vehicleFeatures.length - 4} more</span>
                          )}
                        </div>
                      )}

                      {/* Price Breakdown Summary */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                        <span>Base: ₹{quote.baseAmount.toLocaleString()}</span>
                        {quote.chauffeurCharges > 0 && (
                          <span>+ Chauffeur: ₹{quote.chauffeurCharges.toLocaleString()}</span>
                        )}
                        {quote.decorationCharges > 0 && (
                          <span>+ Decoration: ₹{quote.decorationCharges.toLocaleString()}</span>
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
                          {/* All Inclusions */}
                          {quote.inclusions && quote.inclusions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
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
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
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

                          {/* Extra Rates */}
                          {(quote.extraKmRate || quote.extraHourRate) && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <h4 className="font-medium text-amber-800 mb-2">Extra Charges</h4>
                              <div className="flex gap-4 text-sm text-amber-700">
                                {quote.extraKmRate > 0 && (
                                  <span>Extra Km: ₹{quote.extraKmRate}/km</span>
                                )}
                                {quote.extraHourRate > 0 && (
                                  <span>Extra Hour: ₹{quote.extraHourRate}/hr</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Terms */}
                          {quote.termsConditions && quote.termsConditions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                              <ul className="space-y-1">
                                {quote.termsConditions.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Vendor Message */}
                          {quote.vendorMessage && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                              <h4 className="font-medium text-amber-800 mb-1 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Message from Vendor
                              </h4>
                              <p className="text-sm text-amber-700">{quote.vendorMessage}</p>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                              Valid until: {new Date(quote.validTill).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <a
                              href={`tel:${quote.vendor.phone}`}
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                            >
                              <Phone className="w-4 h-4" />
                              Call Vendor
                            </a>
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
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
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
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mt-6 border border-amber-200">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Premium Booking Protection
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Your payment is held securely until trip completion</li>
            <li>• Verified premium vendors with luxury fleet</li>
            <li>• 24/7 concierge support during your trip</li>
            <li>• Free cancellation up to 48 hours before (check T&C)</li>
          </ul>
        </div>
      </div>

      {/* Accept Button */}
      {selectedQuote && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {quotes.find((q) => q.id === selectedQuote)?.vendor.businessName}
              </p>
              <p className="text-lg font-bold text-amber-600">
                ₹{quotes.find((q) => q.id === selectedQuote)?.totalAmount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={isAccepting}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-lg hover:from-amber-600 hover:to-yellow-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isAccepting ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept & Proceed
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
