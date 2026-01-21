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
  AlertCircle,
  FileText,
  Sparkles,
  Users,
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  vehicleCategory?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleNumber?: string;
  vehicleFeatures?: string;
  vehicleImages?: string;
  driverName?: string;
  driverPhone?: string;
  driverExperience?: number;
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  perKmRate?: number;
  perHourRate?: number;
  includedKm?: number;
  includedHours?: number;
  fuelCharges: number;
  tollEstimate: number;
  parkingEstimate: number;
  nightHaltCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount: number;
  advancePercent: number;
  extraKmRate?: number;
  extraHourRate?: number;
  inclusions?: string[];
  exclusions?: string[];
  termsConditions?: string[];
  vendorMessage?: string;
  isNegotiable: boolean;
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
    pickupCity: string;
    dropCity?: string;
    pickupAddress?: string;
    dropAddress?: string;
    pickupDate: string;
    pickupTime?: string;
    returnDate?: string;
    tripType: string;
    occasion?: string;
    tripDays?: number;
    tripHours?: number;
    needDecoration?: boolean;
    decorationType?: string;
    needChauffeur?: boolean;
    requirements?: string;
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

export default function VendorLuxuryQuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/vendor/luxury-quotes/${id}`);
        const data = await response.json();

        if (data.success) {
          setQuote(data.quote);
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

    fetchQuote();
  }, [id]);

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this quote?')) return;

    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/vendor/luxury-quotes/${id}`, {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
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
          href="/vendor/luxury/bookings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
  const isActive = ['SENT', 'VIEWED'].includes(quote.status);
  const inclusions = Array.isArray(quote.inclusions) ? quote.inclusions : [];
  const exclusions = Array.isArray(quote.exclusions) ? quote.exclusions : [];
  const terms = Array.isArray(quote.termsConditions) ? quote.termsConditions : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vendor/luxury/bookings"
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
              {quote.isNegotiable && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Negotiable
                </span>
              )}
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
              <Car className="w-5 h-5 text-orange-500" />
              Vehicle Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium">{quote.vehicleName}</p>
              </div>
              {quote.vehicleCategory && (
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{quote.vehicleCategory}</p>
                </div>
              )}
              {quote.vehicleModel && (
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{quote.vehicleModel}</p>
                </div>
              )}
              {quote.vehicleNumber && (
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{quote.vehicleNumber}</p>
                </div>
              )}
              {quote.vehicleYear && (
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{quote.vehicleYear}</p>
                </div>
              )}
            </div>
          </div>

          {/* Driver Details */}
          {(quote.driverName || quote.driverPhone) && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Driver Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quote.driverName && (
                  <div>
                    <p className="text-sm text-gray-500">Driver Name</p>
                    <p className="font-medium">{quote.driverName}</p>
                  </div>
                )}
                {quote.driverPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Driver Phone</p>
                    <p className="font-medium">{quote.driverPhone}</p>
                  </div>
                )}
                {quote.driverExperience && (
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{quote.driverExperience} years</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-orange-500" />
              Pricing Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">₹{quote.baseAmount.toLocaleString()}</span>
              </div>
              {quote.chauffeurCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Chauffeur Charges</span>
                  <span className="font-medium">₹{quote.chauffeurCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.decorationCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Decoration Charges</span>
                  <span className="font-medium">₹{quote.decorationCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.fuelCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Charges</span>
                  <span className="font-medium">₹{quote.fuelCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.tollEstimate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Toll Estimate</span>
                  <span className="font-medium">₹{quote.tollEstimate.toLocaleString()}</span>
                </div>
              )}
              {quote.parkingEstimate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking Estimate</span>
                  <span className="font-medium">₹{quote.parkingEstimate.toLocaleString()}</span>
                </div>
              )}
              {quote.nightHaltCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Night Halt Charges</span>
                  <span className="font-medium">₹{quote.nightHaltCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.gstAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">GST</span>
                  <span className="font-medium">₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-orange-600 text-lg">
                  ₹{quote.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Advance Payment ({quote.advancePercent}%)</span>
                <span>₹{quote.advanceAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
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
                    <span className="text-orange-500 font-medium">{i + 1}.</span>
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
                <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Trip Type</p>
                  <p className="font-medium">{quote.request.tripType}</p>
                </div>
              </div>
              {quote.request.occasion && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Occasion</p>
                    <p className="font-medium">{quote.request.occasion}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{quote.request.pickupCity}</p>
                  {quote.request.pickupAddress && (
                    <p className="text-xs text-gray-400">{quote.request.pickupAddress}</p>
                  )}
                </div>
              </div>
              {quote.request.dropCity && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Drop</p>
                    <p className="font-medium">{quote.request.dropCity}</p>
                    {quote.request.dropAddress && (
                      <p className="text-xs text-gray-400">{quote.request.dropAddress}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup Date</p>
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
              {quote.request.returnDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Return Date</p>
                    <p className="font-medium">
                      {new Date(quote.request.returnDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
              {quote.request.tripDays && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{quote.request.tripDays} days</p>
                  </div>
                </div>
              )}
              {quote.request.needDecoration && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Decoration</p>
                    <p className="font-medium">{quote.request.decorationType || 'Required'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{quote.request.customerName}</p>
                </div>
              </div>
              {quote.request.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{quote.request.customerPhone}</p>
                  </div>
                </div>
              )}
              {quote.request.customerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-orange-500 mt-0.5" />
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
                  {quote.viewCount || 0}
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

          {/* Customer Notes */}
          {quote.request.requirements && (
            <div className="bg-orange-50 rounded-xl border border-orange-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Customer Requirements</h2>
              <p className="text-sm text-gray-600">{quote.request.requirements}</p>
            </div>
          )}

          {/* Budget Hint */}
          {(quote.request.budgetMin || quote.request.budgetMax) && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
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
