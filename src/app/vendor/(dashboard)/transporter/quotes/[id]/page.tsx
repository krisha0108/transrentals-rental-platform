'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee,
  AlertCircle,
  FileText,
  Weight,
  Building,
  ArrowRight,
} from 'lucide-react';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';

interface QuoteDetails {
  id: string;
  quoteNumber: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  vehicleNumber: string | null;
  vehicleCapacity: string | null;
  vehicleImages?: string;
  driverName: string | null;
  driverPhone: string | null;
  labourIncluded: boolean;
  labourCount: number | null;
  labourCharges: number;
  baseAmount: number;
  perKmRate: number | null;
  loadingCharges: number;
  unloadingCharges: number;
  packagingCharges: number;
  insuranceCharges: number;
  tollEstimate: number;
  gstAmount: number;
  totalAmount: number;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  validTill: string;
  status: string;
  viewCount: number;
  viewedAt: string | null;
  createdAt: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    customerPhone: string;
    serviceType: string;
    chauffeur_vehicle_categories: string;
    vehicleCategoryName: string;
    goodsType: string;
    goodsDescription: string | null;
    estimatedWeight: number | null;
    estimatedVolume: string | null;
    requiresLabour: boolean;
    labourCount: number | null;
    pickupCity: string;
    pickupAddress: string | null;
    pickupFloor: number | null;
    hasPickupLift: boolean;
    dropCity: string;
    dropAddress: string | null;
    dropFloor: number | null;
    hasDropLift: boolean;
    estimatedDistance: number | null;
    pickupDate: string;
    pickupTime: string;
    isFlexibleDate: boolean;
    requirements: string | null;
    needInsurance: boolean;
    needPackaging: boolean;
    budgetMin: number | null;
    budgetMax: number | null;
    status: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  SENT: { label: 'Awaiting Response', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  VIEWED: { label: 'Viewed by Customer', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  EXPIRED: { label: 'Expired', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export default function VendorQuoteDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.push('/vendor/login');
      return;
    }
    fetchQuoteDetails();
  }, [sessionStatus, params.id]);

  const fetchQuoteDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/truck-quotes/${params.id}`);
      const data = await response.json();

      if (data.success) {
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
        setError(data.error || 'Failed to fetch quote details');
      }
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      setError('Failed to load quote details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">Error Loading Quote</h3>
        <p className="text-sm text-gray-500 mb-4">{error || 'Quote not found'}</p>
        <Link href="/vendor/transporter/quotes" className="text-indigo-600 hover:underline">
          Back to Quotes
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/transporter/quotes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote #{quote.quoteNumber}</h1>
            <p className="text-gray-500">For Request #{quote.request.requestNumber}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Request Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Customer Request
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{quote.request.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Goods Type</p>
                  <p className="font-medium">{quote.request.goodsType}</p>
                  {quote.request.estimatedWeight && (
                    <p className="text-sm text-gray-500">{quote.request.estimatedWeight} kg</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{quote.request.pickupCity}</p>
                  {quote.request.pickupAddress && (
                    <p className="text-sm text-gray-500">{quote.request.pickupAddress}</p>
                  )}
                  {quote.request.pickupFloor && (
                    <p className="text-xs text-gray-400">
                      Floor {quote.request.pickupFloor} {quote.request.hasPickupLift ? '(Lift available)' : '(No lift)'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Drop</p>
                  <p className="font-medium">{quote.request.dropCity}</p>
                  {quote.request.dropAddress && (
                    <p className="text-sm text-gray-500">{quote.request.dropAddress}</p>
                  )}
                  {quote.request.dropFloor && (
                    <p className="text-xs text-gray-400">
                      Floor {quote.request.dropFloor} {quote.request.hasDropLift ? '(Lift available)' : '(No lift)'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup Date</p>
                  <p className="font-medium">
                    {new Date(quote.request.pickupDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{quote.request.pickupTime}</p>
                </div>
              </div>

              {quote.request.estimatedDistance && (
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Est. Distance</p>
                    <p className="font-medium">{quote.request.estimatedDistance} km</p>
                  </div>
                </div>
              )}
            </div>

            {quote.request.requirements && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Special Requirements</p>
                <p className="text-sm text-gray-700">{quote.request.requirements}</p>
              </div>
            )}

            {(quote.request.needInsurance || quote.request.needPackaging || quote.request.requiresLabour) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {quote.request.needInsurance && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Insurance Needed</span>
                )}
                {quote.request.needPackaging && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Packaging Needed</span>
                )}
                {quote.request.requiresLabour && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Labour: {quote.request.labourCount || 'Required'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Images */}
          {quote.vehicleImages && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <VehicleImageGallery
                vehicleImages={quote.vehicleImages}
                vehicleName={quote.vehicleName}
              />
            </div>
          )}

          {/* Your Quote Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Your Quote Details
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium">{quote.vehicleName}</p>
                {quote.vehicleNumber && (
                  <p className="text-sm text-gray-500">{quote.vehicleNumber}</p>
                )}
                {quote.vehicleCapacity && (
                  <p className="text-sm text-gray-500">Capacity: {quote.vehicleCapacity}</p>
                )}
              </div>

              {quote.driverName && (
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium">{quote.driverName}</p>
                  {quote.driverPhone && (
                    <p className="text-sm text-gray-500">{quote.driverPhone}</p>
                  )}
                </div>
              )}
            </div>

            {quote.labourIncluded && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800">
                  Labour Included: {quote.labourCount} persons @ ₹{quote.labourCharges.toLocaleString()}
                </p>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid md:grid-cols-2 gap-4">
              {quote.inclusions && quote.inclusions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Inclusions
                  </h4>
                  <ul className="space-y-1">
                    {quote.inclusions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {quote.exclusions && quote.exclusions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Exclusions
                  </h4>
                  <ul className="space-y-1">
                    {quote.exclusions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-500">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {quote.termsConditions && quote.termsConditions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                <ul className="space-y-1">
                  {quote.termsConditions.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Price & Stats */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Price Breakdown</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">₹{quote.baseAmount.toLocaleString()}</span>
              </div>
              {quote.loadingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Loading Charges</span>
                  <span>₹{quote.loadingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.unloadingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unloading Charges</span>
                  <span>₹{quote.unloadingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.labourCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Labour Charges</span>
                  <span>₹{quote.labourCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.packagingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Packaging Charges</span>
                  <span>₹{quote.packagingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.insuranceCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insurance</span>
                  <span>₹{quote.insuranceCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.tollEstimate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toll (Estimate)</span>
                  <span>₹{quote.tollEstimate.toLocaleString()}</span>
                </div>
              )}
              {quote.gstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST</span>
                  <span>₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-indigo-600">₹{quote.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quote Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quote Stats</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium">{quote.viewCount} views</p>
                  <p className="text-sm text-gray-500">
                    {quote.viewedAt
                      ? `Last viewed ${new Date(quote.viewedAt).toLocaleDateString('en-IN')}`
                      : 'Not viewed yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">
                    Valid till {new Date(quote.validTill).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted {new Date(quote.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Budget Hint */}
          {(quote.request.budgetMin || quote.request.budgetMax) && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Customer Budget</h3>
              <p className="text-yellow-700">
                {quote.request.budgetMin && quote.request.budgetMax
                  ? `₹${quote.request.budgetMin.toLocaleString()} - ₹${quote.request.budgetMax.toLocaleString()}`
                  : quote.request.budgetMax
                  ? `Up to ₹${quote.request.budgetMax.toLocaleString()}`
                  : `From ₹${quote.request.budgetMin?.toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Actions based on status */}
          {quote.status === 'ACCEPTED' && (
            <Link
              href="/vendor/transporter/bookings"
              className="block w-full px-4 py-3 bg-green-600 text-white text-center font-medium rounded-lg hover:bg-green-700 transition"
            >
              View Booking Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
