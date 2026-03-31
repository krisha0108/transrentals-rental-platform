'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Edit,
  IndianRupee,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { BUS_CATEGORIES, BUS_TRIP_TYPES } from '@/lib/bus-categories';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';

interface QuoteDetails {
  id: string;
  quoteNumber: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  vehicleCategory?: string;
  seats: number;
  vehicleImages?: string;
  baseAmount: number;
  driverAllowance: number;
  tollEstimate: number;
  permitCharges: number;
  parkingEstimate: number;
  nightHaltCharges: number;
  gstAmount: number;
  totalAmount: number;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  validTill: string;
  status: string;
  viewCount: number;
  viewedAt?: string;
  createdAt: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    customerPhone: string;
    tripType: string;
    chauffeur_vehicle_categories: string;
    passengers: number;
    pickupCity: string;
    pickupAddress?: string;
    dropCity?: string;
    dropAddress?: string;
    routeDetails?: string;
    pickupDate: string;
    pickupTime?: string;
    returnDate?: string;
    tripDays?: number;
    requirements?: string;
    status: string;
  };
  booking?: {
    id: string;
    status: string;
    paymentStatus: string;
    advanceAmount: number;
    advancePaid: number;
    advancePaidAt?: string;
    advancePaymentRef?: string;
    advancePaymentProof?: string;
    advancePaymentDate?: string;
    advancePaymentVerified: boolean;
    createdAt: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Edit },
  SENT: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Send },
  VIEWED: { label: 'Viewed', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

export default function VendorQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuoteDetails();
  }, [params.id]);

  const fetchQuoteDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/vendor/bus-quotes/${params.id}`);
      const data = await response.json();

      if (data.success) {
        // Parse string fields to arrays before setting state
        const parsedQuote = {
          ...data.quote,
          inclusions: Array.isArray(data.quote.inclusions)
            ? data.quote.inclusions
            : typeof data.quote.inclusions === 'string' && data.quote.inclusions
            ? data.quote.inclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          exclusions: Array.isArray(data.quote.exclusions)
            ? data.quote.exclusions
            : typeof data.quote.exclusions === 'string' && data.quote.exclusions
            ? data.quote.exclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          termsConditions: Array.isArray(data.quote.termsConditions)
            ? data.quote.termsConditions
            : typeof data.quote.termsConditions === 'string' && data.quote.termsConditions
            ? data.quote.termsConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        };
        setQuote(parsedQuote);
      } else {
        setError(data.error || 'Failed to fetch quote');
      }
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      setError('Failed to fetch quote details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this quote?')) return;

    try {
      const res = await fetch(`/api/vendor/bus-quotes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });

      if (res.ok) {
        fetchQuoteDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to withdraw quote');
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      alert('Failed to withdraw quote');
    }
  };

  const getCategoryName = (id: string) => BUS_CATEGORIES.find((c) => c.id === id)?.shortName || id;
  const getTripTypeName = (id: string) => BUS_TRIP_TYPES.find((t) => t.id === id)?.name || id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Quote Not Found</h2>
          <p className="text-red-600 mb-4">{error || 'The quote you are looking for does not exist.'}</p>
          <Link
            href="/vendor/bus/quotes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
  const StatusIcon = statusConfig.icon;
  const isExpired = new Date(quote.validTill) < new Date();
  const canWithdraw = ['SENT', 'VIEWED'].includes(quote.status) && !isExpired;
  const canReQuote = quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/bus/quotes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Details</h1>
            <p className="text-gray-600 font-mono">#{quote.quoteNumber}</p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusConfig.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <span className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Quote Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-orange-200 rounded-xl flex items-center justify-center">
                <Bus className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{quote.vehicleName}</h2>
                <p className="text-gray-600">{getCategoryName(quote.vehicleCategory) || quote.vehicleCategory} • {quote.seats} seats</p>
                {quote.vehicleNumber && (
                  <p className="text-sm text-gray-500 font-mono">{quote.vehicleNumber}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-600">₹{quote.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                Valid till {new Date(quote.validTill).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
              {quote.viewCount > 0 && (
                <p className="text-xs text-purple-600 mt-1">
                  <Eye className="w-3 h-3 inline mr-1" />
                  Viewed {quote.viewCount} time{quote.viewCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Request Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium">
                  {quote.request?.pickupCity || 'N/A'}
                  {quote.request?.dropCity && ` → ${quote.request.dropCity}`}
                </p>
                {quote.request?.pickupAddress && (
                  <p className="text-sm text-gray-500">{quote.request.pickupAddress}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Travel Date</p>
                <p className="font-medium">
                  {quote.request?.pickupDate ? new Date(quote.request.pickupDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }) : 'N/A'}
                  {quote.request?.returnDate && (
                    <span className="text-gray-500">
                      {' → '}
                      {new Date(quote.request.returnDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </p>
                {quote.request?.pickupTime && (
                  <p className="text-sm text-gray-500">Pickup: {quote.request.pickupTime}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Trip Type</p>
                <p className="font-medium">
                  {quote.request?.tripType ? getTripTypeName(quote.request.tripType) : 'N/A'} • {quote.request?.passengers || 0} passengers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{quote.request?.customerName || 'N/A'}</p>
                <p className="text-sm text-gray-500">{quote.request?.customerPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {quote.request?.requirements && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Special Requirements</p>
              <p className="text-gray-700">{quote.request.requirements}</p>
            </div>
          )}
        </div>

        {/* Vehicle Images */}
        {quote.vehicleImages && (
          <div className="p-6 border-b">
            <VehicleImageGallery
              vehicleImages={quote.vehicleImages}
              vehicleName={quote.vehicleName}
            />
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-orange-500" />
            Pricing Breakdown
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Base Amount</span>
              <span className="font-medium">₹{quote.baseAmount.toLocaleString()}</span>
            </div>
            {quote.driverAllowance > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Driver Allowance</span>
                <span className="font-medium">₹{quote.driverAllowance.toLocaleString()}</span>
              </div>
            )}
            {quote.tollEstimate > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Toll Charges (Est.)</span>
                <span className="font-medium">₹{quote.tollEstimate.toLocaleString()}</span>
              </div>
            )}
            {quote.permitCharges > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Permit Charges</span>
                <span className="font-medium">₹{quote.permitCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.parkingEstimate > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Additional Charges</span>
                <span className="font-medium">₹{quote.parkingEstimate.toLocaleString()}</span>
              </div>
            )}
            {quote.nightHaltCharges > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Night Halt Charges</span>
                <span className="font-medium">₹{quote.nightHaltCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.gstAmount > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">GST</span>
                <span className="font-medium">₹{quote.gstAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-orange-200 mt-2">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="font-bold text-xl text-orange-600">₹{quote.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="p-6 border-b">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Inclusions ({quote.inclusions.length})
              </h3>
              <ul className="space-y-2">
                {quote.inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
                {quote.inclusions.length === 0 && (
                  <li className="text-sm text-gray-400">No inclusions specified</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Exclusions ({quote.exclusions.length})
              </h3>
              <ul className="space-y-2">
                {quote.exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-red-500 mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
                {quote.exclusions.length === 0 && (
                  <li className="text-sm text-gray-400">No exclusions specified</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {quote.termsConditions.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Terms & Conditions
            </h3>
            <ol className="space-y-2">
              {quote.termsConditions.map((term, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="font-bold text-orange-500">{idx + 1}.</span>
                  {term}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Advance Payment Status */}
        {quote.booking && (
          <div className="p-6 border-b bg-green-50/50">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Advance Payment Status
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Advance Amount:</span>
                  <span className="font-bold text-gray-900">₹{quote.booking.advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quote.booking.advancePaymentVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {quote.booking.advancePaymentVerified ? 'Verified' : 'Verification Pending'}
                  </span>
                </div>
                {quote.booking.advancePaidAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Verified On:</span>
                    <span className="text-gray-900">{new Date(quote.booking.advancePaidAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {quote.booking.advancePaymentRef && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Reference No:</span>
                    <span className="font-mono text-gray-900">{quote.booking.advancePaymentRef}</span>
                  </div>
                )}
                {quote.booking.advancePaymentDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Submitted On:</span>
                    <span className="text-gray-900">{new Date(quote.booking.advancePaymentDate).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
                {quote.booking.advancePaymentProof && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Payment Proof:</span>
                    <a
                      href={quote.booking.advancePaymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vendor/bus/quotes"
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
            >
              Back to Quotes
            </Link>

            {canWithdraw && (
              <>
                <Link
                  href={`/vendor/bus/quotes/${quote.id}/edit`}
                  className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Revise Quote
                </Link>
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-2 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Withdraw Quote
                </button>
              </>
            )}

            {canReQuote && (
              <Link
                href={`/vendor/bus/requests/${quote.request.id}/quote`}
                className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Send Fresh Quote
              </Link>
            )}

            {quote.status === 'ACCEPTED' && (
              <Link
                href={`/vendor/bus/bookings?quote=${quote.id}`}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                View Booking
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quote Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Send className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Quote Sent</p>
              <p className="text-sm text-gray-500">
                {new Date(quote.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {quote.viewedAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Customer Viewed</p>
                <p className="text-sm text-gray-500">
                  {new Date(quote.viewedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {quote.status === 'ACCEPTED' && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Quote Accepted</p>
                <p className="text-sm text-gray-500">Customer accepted your quote</p>
              </div>
            </div>
          )}

          {quote.status === 'REJECTED' && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Quote Rejected</p>
                <p className="text-sm text-gray-500">Customer chose another quote</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
