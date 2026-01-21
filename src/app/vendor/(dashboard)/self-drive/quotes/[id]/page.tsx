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
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee,
  Shield,
  AlertCircle,
  FileText,
  Settings2,
  Fuel,
  Users,
  Gauge,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  tripStartOtp?: string;
  tripStartOtpExpiry?: string;
  tripOtpVerified?: boolean;
  pickedUpAt?: string;
  returnedAt?: string;
  customerName: string;
  customerPhone: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  registrationNumber?: string;
  vehicleYear?: number;
  vehicleImages?: string;
  vehicleFeatures?: string;
  dailyRate: number;
  baseAmount: number;
  totalAmount: number;
  gstAmount: number;
  platformFee: number;
  deliveryCharges: number;
  pickupCharges: number;
  securityDeposit: number;
  grandTotal: number;
  advancePercent: number;
  advanceAmount: number;
  kmLimitPerDay?: number;
  extraKmRate?: number;
  inclusions?: string | string[];
  exclusions?: string | string[];
  termsConditions?: string | string[];
  vendorMessage?: string;
  validTill: string;
  validityDays: number;
  viewCount: number;
  status: string;
  sentAt?: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    vehicleModelName?: string;
    vehicleBrand?: string;
    vehicleCategoryName?: string;
    transmission?: string;
    fuelType?: string;
    minSeats?: number;
    locationName: string;
    pickupDate: string;
    pickupTime: string;
    dropDate: string;
    dropTime: string;
    totalDays: number;
    isDeliveryRequested: boolean;
    pickupAddress?: string;
    customerNotes?: string;
    budgetMin?: number;
    budgetMax?: number;
    status: string;
  };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  SENT: { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  VIEWED: { label: 'Viewed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  EXPIRED: { label: 'Expired', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function VendorSelfDriveQuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/vendor/self-drive-quotes/${id}`);
      const data = await response.json();

      if (data.success) {
        // Parse string fields to arrays
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
        setBooking(data.booking || null);
      } else {
        setError(data.error || 'Failed to load quote');
      }
    } catch (err) {
      setError('Failed to load quote details');
      console.error('Error fetching quote:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this quote?')) return;

    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/vendor/self-drive-quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });

      const data = await response.json();
      if (response.ok) {
        setQuote((prev) => (prev ? { ...prev, status: 'WITHDRAWN' } : null));
      } else {
        alert(data.error || 'Failed to withdraw quote');
      }
    } catch (err) {
      console.error('Error withdrawing:', err);
      alert('Failed to withdraw quote');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const parseJsonField = (field: string | string[] | null | undefined): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">Quote Not Found</h3>
        <p className="text-gray-600 mb-4">{error || 'This quote could not be loaded'}</p>
        <Link
          href="/vendor/self-drive/quotes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
  const isActive = ['SENT', 'VIEWED'].includes(quote.status);
  const inclusions = parseJsonField(quote.inclusions);
  const exclusions = parseJsonField(quote.exclusions);
  const terms = parseJsonField(quote.termsConditions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vendor/self-drive/quotes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Quote #{quote.quoteNumber}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              For request #{quote.request.requestNumber}
            </p>
          </div>
        </div>

        {isActive && (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw Quote'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Vehicle Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium">{quote.vehicleName}</p>
              </div>
              {quote.vehicleBrand && (
                <div>
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-medium">{quote.vehicleBrand}</p>
                </div>
              )}
              {quote.vehicle_category && (
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{quote.vehicle_category}</p>
                </div>
              )}
              {quote.transmission && (
                <div>
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-medium flex items-center gap-1">
                    <Settings2 className="w-4 h-4 text-gray-400" />
                    {quote.transmission}
                  </p>
                </div>
              )}
              {quote.fuelType && (
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-medium flex items-center gap-1">
                    <Fuel className="w-4 h-4 text-gray-400" />
                    {quote.fuelType}
                  </p>
                </div>
              )}
              {quote.seats && (
                <div>
                  <p className="text-sm text-gray-500">Seats</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    {quote.seats}
                  </p>
                </div>
              )}
              {quote.registrationNumber && (
                <div>
                  <p className="text-sm text-gray-500">Reg. Number</p>
                  <p className="font-medium">{quote.registrationNumber}</p>
                </div>
              )}
              {quote.kmLimitPerDay && (
                <div>
                  <p className="text-sm text-gray-500">KM Limit/Day</p>
                  <p className="font-medium flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    {quote.kmLimitPerDay} km
                  </p>
                </div>
              )}
              {quote.extraKmRate && (
                <div>
                  <p className="text-sm text-gray-500">Extra KM Rate</p>
                  <p className="font-medium">₹{quote.extraKmRate}/km</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-500" />
              Pricing Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium">₹{quote.dailyRate?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{quote.request.totalDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">₹{quote.baseAmount?.toLocaleString()}</span>
              </div>
              {quote.gstAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">GST</span>
                  <span className="font-medium">₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}
              {quote.platformFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">₹{quote.platformFee.toLocaleString()}</span>
                </div>
              )}
              {quote.deliveryCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span className="font-medium">₹{quote.deliveryCharges.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">₹{quote.securityDeposit?.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold text-blue-600 text-lg">
                  ₹{quote.grandTotal?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Advance Payment ({quote.advancePercent}%)</span>
                <span>₹{quote.advanceAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Inclusions & Exclusions
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {inclusions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Inclusions</h3>
                    <ul className="space-y-1">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Exclusions</h3>
                    <ul className="space-y-1">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms */}
          {terms.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <ul className="space-y-2">
                {terms.map((term, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 font-medium">{i + 1}.</span>
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vendor Message */}
          {quote.vendorMessage && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Your Message</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{quote.vendorMessage}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{quote.request.locationName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">
                    {new Date(quote.request.pickupDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {quote.request.pickupTime && ` at ${quote.request.pickupTime}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Drop-off</p>
                  <p className="font-medium">
                    {new Date(quote.request.dropDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {quote.request.dropTime && ` at ${quote.request.dropTime}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{quote.request.totalDays} days</p>
                </div>
              </div>
              {quote.request.isDeliveryRequested && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Home Delivery Requested</p>
                  {quote.request.pickupAddress && (
                    <p className="text-sm text-blue-600 mt-1">{quote.request.pickupAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{quote.request.customerName}</p>
                </div>
              </div>
              {quote.request.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{quote.request.customerPhone}</p>
                  </div>
                </div>
              )}
              {quote.request.customerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm break-all">{quote.request.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Stats */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quote Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {quote.viewCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid Until</span>
                <span className="font-medium">
                  {new Date(quote.validTill).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sent On</span>
                <span className="font-medium">
                  {quote.sentAt
                    ? new Date(quote.sentAt).toLocaleDateString('en-IN')
                    : new Date(quote.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Link - When quote is accepted */}
          {quote.status === 'ACCEPTED' && booking && (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Quote Accepted
              </h2>
              <div className="text-sm space-y-2 text-green-100 mb-4">
                <div className="flex justify-between">
                  <span>Booking #</span>
                  <span className="font-medium text-white">{booking.bookingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium text-white">{booking.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment</span>
                  <span className="font-medium text-white">{booking.paymentStatus || 'Pending'}</span>
                </div>
              </div>
              <Link
                href={`/vendor/self-drive/bookings/${booking.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition"
              >
                <ExternalLink className="w-4 h-4" />
                View Booking & Manage Trip
              </Link>
            </div>
          )}

          {/* Customer Notes */}
          {quote.request.customerNotes && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Customer Notes</h2>
              <p className="text-sm text-gray-600">{quote.request.customerNotes}</p>
            </div>
          )}

          {/* Budget Hint */}
          {(quote.request.budgetMin || quote.request.budgetMax) && (
            <div className="bg-green-50 rounded-xl border border-green-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Customer Budget</h2>
              <p className="text-sm text-gray-600">
                {quote.request.budgetMin && quote.request.budgetMax
                  ? `₹${quote.request.budgetMin.toLocaleString()} - ₹${quote.request.budgetMax.toLocaleString()}`
                  : quote.request.budgetMin
                  ? `Min: ₹${quote.request.budgetMin.toLocaleString()}`
                  : `Max: ₹${quote.request.budgetMax?.toLocaleString()}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
