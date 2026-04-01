'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
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
  FileText,
  Loader2,
  Shield,
  Settings,
  Fuel,
  Truck,
  RefreshCw,
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  equipmentName: string;
  equipmentModel?: string;
  equipmentYear?: number;
  equipmentCondition?: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  operatorCharges: number;
  fuelCharges: number;
  deliveryCharges: number;
  pickupCharges: number;
  securityDeposit: number;
  gstAmount: number;
  totalAmount: number;
  inclusions?: string[];
  exclusions?: string[];
  termsConditions?: string[];
  notes?: string;
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
    equipmentCategory: string;
    equipmentType: string;
    quantity: number;
    rentalDuration: string;
    rentalDays: number;
    startDate: string;
    deliveryCity: string;
    deliveryAddress: string;
    needOperator: boolean;
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
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

const DURATION_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function ViewEquipmentQuotePage() {
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuoteDetails();
  }, [params.id]);

  const fetchQuoteDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/equipment-quotes/${params.id}`);
      const data = await response.json();

      if (data.success && data.quote) {
        // Parse string fields to arrays if needed
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
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
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
            href="/vendor/equipment/quotes"
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
  const canReQuote = quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/equipment/quotes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-500" />
              Quote #{quote.quoteNumber}
            </h1>
            <p className="text-gray-600">For Request #{quote.request.requestNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusConfig.bgColor} ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
          {canReQuote && (
            <Link
              href={`/vendor/equipment/requests/${quote.request.id}/quote`}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Send Fresh Quote
            </Link>
          )}
        </div>
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
              href={`/vendor/equipment/bookings/${quote.booking.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Booking
            </Link>
          </div>
        </div>
      )}

      {/* Quote Summary */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
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
                {new Date(quote.validTill).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
          <div className="space-y-2">
            {quote.dailyRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium">₹{quote.dailyRate.toLocaleString()}/day</span>
              </div>
            )}
            {quote.weeklyRate && quote.weeklyRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Weekly Rate</span>
                <span className="font-medium">₹{quote.weeklyRate.toLocaleString()}/week</span>
              </div>
            )}
            {quote.monthlyRate && quote.monthlyRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Rate</span>
                <span className="font-medium">₹{quote.monthlyRate.toLocaleString()}/month</span>
              </div>
            )}
            {quote.operatorCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Operator Charges</span>
                <span className="font-medium">₹{quote.operatorCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.fuelCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fuel Charges</span>
                <span className="font-medium">₹{quote.fuelCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.deliveryCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charges</span>
                <span className="font-medium">₹{quote.deliveryCharges.toLocaleString()}</span>
              </div>
            )}
            {quote.pickupCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pickup Charges</span>
                <span className="font-medium">₹{quote.pickupCharges.toLocaleString()}</span>
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
              <span className="text-amber-600">₹{quote.totalAmount.toLocaleString()}</span>
            </div>
            {quote.securityDeposit > 0 && (
              <div className="flex justify-between text-sm text-gray-500 pt-2">
                <span>Security Deposit (Refundable)</span>
                <span>₹{quote.securityDeposit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-500" />
          Equipment Details
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Equipment</p>
            <p className="font-medium text-gray-900">{quote.equipmentName}</p>
          </div>
          {quote.equipmentModel && (
            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="font-medium text-gray-900">{quote.equipmentModel}</p>
            </div>
          )}
          {quote.equipmentYear && (
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-medium text-gray-900">{quote.equipmentYear}</p>
            </div>
          )}
          {quote.equipmentCondition && (
            <div>
              <p className="text-sm text-gray-500">Condition</p>
              <p className="font-medium text-gray-900">{quote.equipmentCondition}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer & Request Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
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
            <p className="text-sm text-gray-500 mb-1">Equipment Required</p>
            <p className="font-medium text-gray-900">
              {quote.request.equipmentType}
            </p>
            <p className="text-sm text-gray-600">
              {quote.request.equipmentCategory} • Qty: {quote.request.quantity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Delivery Location</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{quote.request.deliveryCity}</p>
                <p className="text-sm text-gray-600">{quote.request.deliveryAddress}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Rental Period</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(quote.request.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {quote.request.rentalDays} {DURATION_LABELS[quote.request.rentalDuration] || quote.request.rentalDuration}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Additional Requirements</p>
          <div className="flex flex-wrap gap-2">
            {quote.request.needOperator && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                Operator Required
              </span>
            )}
          </div>
          {quote.request.requirements && (
            <p className="text-sm text-gray-600 mt-2">{quote.request.requirements}</p>
          )}
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
            {(!quote.inclusions || quote.inclusions.length === 0) && (
              <li className="text-sm text-gray-400">No inclusions specified</li>
            )}
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
            {(!quote.exclusions || quote.exclusions.length === 0) && (
              <li className="text-sm text-gray-400">No exclusions specified</li>
            )}
          </ul>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Terms & Conditions
          </h3>
          <ul className="space-y-2">
            {(quote.termsConditions || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-amber-500 font-bold">{idx + 1}.</span>
                {item}
              </li>
            ))}
            {(!quote.termsConditions || quote.termsConditions.length === 0) && (
              <li className="text-sm text-gray-400">No terms specified</li>
            )}
          </ul>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Vendor Notes</h3>
          <p className="text-gray-600">{quote.notes}</p>
        </div>
      )}

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
