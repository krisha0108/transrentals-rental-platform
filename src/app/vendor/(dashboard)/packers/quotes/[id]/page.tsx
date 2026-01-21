'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Send,
  CheckCircle,
  XCircle,
  IndianRupee,
  Clock,
  Eye,
  AlertCircle,
  Phone,
  Mail,
  Home,
  Building2,
  Truck,
  Shield,
  FileText,
  Loader2,
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  packingCharges: number;
  loadingCharges: number;
  transportCharges: number;
  unloadingCharges: number;
  unpackingCharges: number;
  storageCharges: number;
  insuranceCharges: number;
  materialCharges: number;
  gstAmount: number;
  totalAmount: number;
  teamSize: number;
  vehicleType: string;
  estimatedDuration: string;
  packingMaterials: any;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  status: string;
  validTill: string;
  viewedAt?: string;
  viewCount: number;
  createdAt: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceType: string;
    shiftingType: string;
    propertySize?: string;
    pickupCity: string;
    pickupAddress: string;
    pickupFloor?: number;
    hasPickupLift: boolean;
    dropCity: string;
    dropAddress: string;
    dropFloor?: number;
    hasDropLift: boolean;
    preferredDate: string;
    needPacking: boolean;
    needUnpacking: boolean;
    needStorage: boolean;
    storageDays?: number;
    needInsurance: boolean;
    insuranceValue?: number;
    requirements?: string;
    status: string;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  SENT: { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  VIEWED: { label: 'Viewed', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle },
};

const SERVICE_TYPES: Record<string, string> = {
  HOUSEHOLD: 'Household Shifting',
  OFFICE: 'Office Relocation',
  VEHICLE: 'Vehicle Transportation',
  STORAGE: 'Storage & Warehousing',
};

const SHIFTING_TYPES: Record<string, string> = {
  LOCAL: 'Local (Within City)',
  INTERCITY: 'Intercity',
  INTRACITY: 'Intracity',
};

export default function ViewPackersQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuoteDetails();
  }, [params.id]);

  const fetchQuoteDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/packers-quotes/${params.id}`);
      const data = await response.json();

      if (data.success && data.quote) {
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
        setError(data.error || 'Failed to load quote');
      }
    } catch (err) {
      setError('Failed to load quote details');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = (validTill: string) => {
    return new Date(validTill) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Quote</h2>
          <p className="text-red-600 mb-4">{error || 'Quote not found'}</p>
          <Link
            href="/vendor/packers/quotes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  const expired = isExpired(quote.validTill);
  const effectiveStatus = expired && quote.status === 'SENT' ? 'EXPIRED' : quote.status;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.SENT;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/packers/quotes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-500" />
              Quote #{quote.quoteNumber}
            </h1>
            <p className="text-gray-600">For Request #{quote.request.requestNumber}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusConfig.bgColor} ${statusConfig.color}`}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
      </div>

      {/* Booking Info (if accepted) */}
      {quote.booking && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Quote Accepted - Booking Created</p>
                <p className="text-sm text-green-600">Booking #{quote.booking.bookingNumber}</p>
              </div>
            </div>
            <Link
              href={`/vendor/packers/bookings/${quote.booking.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Booking
            </Link>
          </div>
        </div>
      )}

      {/* Quote Summary */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Quote Amount</p>
              <p className="text-3xl font-bold text-gray-900 flex items-center">
                <IndianRupee className="w-7 h-7" />
                {quote.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Valid Till</p>
              <p className={`font-semibold ${expired ? 'text-red-600' : 'text-green-600'}`}>
                {new Date(quote.validTill).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
          <div className="space-y-2">
            {quote.packingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Packing Charges</span>
                <span className="font-medium">₹{quote.packingCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.materialCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Material Charges</span>
                <span className="font-medium">₹{quote.materialCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.loadingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loading Charges</span>
                <span className="font-medium">₹{quote.loadingCharges.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transportation Charges</span>
              <span className="font-medium">₹{quote.transportCharges.toLocaleString()}</span>
            </div>
            {quote.unloadingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unloading Charges</span>
                <span className="font-medium">₹{quote.unloadingCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.unpackingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unpacking Charges</span>
                <span className="font-medium">₹{quote.unpackingCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.storageCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Storage Charges</span>
                <span className="font-medium">₹{quote.storageCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.insuranceCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Insurance Charges</span>
                <span className="font-medium">₹{quote.insuranceCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.gstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST</span>
                <span className="font-medium">₹{quote.gstAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
              <span>Total</span>
              <span className="text-cyan-600">₹{quote.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-500" />
          Service Details
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Vehicle Type</p>
            <p className="font-medium text-gray-900">{quote.vehicleType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Team Size</p>
            <p className="font-medium text-gray-900">{quote.teamSize} members</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated Duration</p>
            <p className="font-medium text-gray-900">{quote.estimatedDuration}</p>
          </div>
        </div>
      </div>

      {/* Customer & Request Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-500" />
          Customer & Request Details
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{quote.request.customerName}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Phone className="w-4 h-4" />
              {quote.request.customerPhone}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              {quote.request.customerEmail}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Service Type</p>
            <p className="font-medium text-gray-900">
              {SERVICE_TYPES[quote.request.serviceType] || quote.request.serviceType}
            </p>
            <p className="text-sm text-gray-600">
              {SHIFTING_TYPES[quote.request.shiftingType] || quote.request.shiftingType}
              {quote.request.propertySize && ` - ${quote.request.propertySize}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{quote.request.pickupCity}</p>
                <p className="text-sm text-gray-600">{quote.request.pickupAddress}</p>
                {quote.request.pickupFloor && (
                  <p className="text-xs text-gray-500">
                    Floor: {quote.request.pickupFloor} | Lift: {quote.request.hasPickupLift ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Drop Location</p>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{quote.request.dropCity}</p>
                <p className="text-sm text-gray-600">{quote.request.dropAddress}</p>
                {quote.request.dropFloor && (
                  <p className="text-xs text-gray-500">
                    Floor: {quote.request.dropFloor} | Lift: {quote.request.hasDropLift ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Shifting Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <p className="font-medium text-gray-900">
                {new Date(quote.request.preferredDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Services Required */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Services Required</p>
          <div className="flex flex-wrap gap-2">
            {quote.request.needPacking && (
              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">Packing</span>
            )}
            {quote.request.needUnpacking && (
              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">Unpacking</span>
            )}
            {quote.request.needStorage && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                Storage ({quote.request.storageDays} days)
              </span>
            )}
            {quote.request.needInsurance && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Insurance (₹{quote.request.insuranceValue?.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inclusions, Exclusions, Terms */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Inclusions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Inclusions
          </h3>
          <ul className="space-y-2">
            {(quote.inclusions || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Exclusions
          </h3>
          <ul className="space-y-2">
            {(quote.exclusions || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-500 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            Terms & Conditions
          </h3>
          <ul className="space-y-2">
            {(quote.termsConditions || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-cyan-500 font-bold">{idx + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quote Stats */}
      <div className="bg-gray-50 rounded-xl border p-4">
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div>
            <span className="text-gray-500">Created:</span>{' '}
            <span className="font-medium">
              {new Date(quote.createdAt).toLocaleString('en-IN')}
            </span>
          </div>
          {quote.viewedAt && (
            <div>
              <span className="text-gray-500">First Viewed:</span>{' '}
              <span className="font-medium">
                {new Date(quote.viewedAt).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-500">View Count:</span>{' '}
            <span className="font-medium">{quote.viewCount} times</span>
          </div>
        </div>
      </div>
    </div>
  );
}
