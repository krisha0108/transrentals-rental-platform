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
  RefreshCw,
} from 'lucide-react';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  SENT: { label: 'Sent', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  VIEWED: { label: 'Viewed', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
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
      <div className="space-y-6 animate-pulse">
        {/* Hero Header Skeleton */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-400 to-emerald-400 p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-white/20 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-7 w-36 bg-white/30 rounded" />
                  <div className="h-6 w-16 bg-white/20 rounded-full" />
                </div>
                <div className="h-3.5 w-48 bg-white/15 rounded" />
              </div>
            </div>
            <div className="h-9 w-24 bg-white/20 rounded-2xl" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="h-3 w-20 bg-white/20 rounded mb-2" />
              <div className="h-9 w-36 bg-white/30 rounded mb-1.5" />
              <div className="h-3.5 w-40 bg-white/15 rounded" />
            </div>
            <div className="rounded-2xl bg-white/10 p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-3.5 w-16 bg-white/15 rounded" />
                  <div className="h-3.5 w-12 bg-white/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Vehicle & Driver Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 bg-gray-100 rounded" />
                <div className="w-5 h-5 bg-emerald-100 rounded" />
              </div>
              <div className="h-3.5 w-48 bg-gray-50 rounded mb-5" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-14 bg-gray-100 rounded" />
                    <div className="h-4.5 w-28 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
              {/* Chauffeur box */}
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-1">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-3 w-12 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="h-5 w-36 bg-gray-100 rounded" />
                <div className="w-5 h-5 bg-emerald-100 rounded" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </div>
                ))}
                {/* Total row */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                  <div className="h-6 w-24 bg-emerald-100 rounded" />
                </div>
              </div>
            </div>

            {/* Inclusions/Exclusions Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="h-5 w-40 bg-gray-100 rounded mb-5" />
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <div className="h-4 w-20 bg-green-100 rounded" />
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-50 rounded-full" />
                      <div className="h-3.5 w-36 bg-gray-50 rounded" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  <div className="h-4 w-20 bg-red-100 rounded" />
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-50 rounded-full" />
                      <div className="h-3.5 w-32 bg-gray-50 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Trip Request Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="h-5 w-28 bg-gray-100 rounded mb-5" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 bg-emerald-100 rounded mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-14 bg-gray-100 rounded" />
                      <div className="h-4 w-full bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="h-5 w-24 bg-gray-100 rounded mb-5" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 bg-gray-100 rounded" />
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="h-5 w-20 bg-gray-100 rounded mb-5" />
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-emerald-100 rounded-full mt-1" />
                    <div className="space-y-1">
                      <div className="h-3 w-14 bg-gray-100 rounded" />
                      <div className="h-4 w-36 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
  const isActive = ['SENT', 'VIEWED'].includes(quote.status);
  const canReQuote =
    quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status || '');
  const inclusions = Array.isArray(quote.inclusions) ? quote.inclusions : [];
  const exclusions = Array.isArray(quote.exclusions) ? quote.exclusions : [];
  const terms = Array.isArray(quote.termsConditions) ? quote.termsConditions : [];

  const priceBreakdown = [
    { label: 'Base Amount', value: quote.baseAmount },
    { label: 'Chauffeur Charges', value: quote.chauffeurCharges },
    { label: 'Decoration Charges', value: quote.decorationCharges },
    { label: 'Fuel Charges', value: quote.fuelCharges },
    { label: 'Toll Estimate', value: quote.tollEstimate },
    { label: 'Parking Estimate', value: quote.parkingEstimate },
    { label: 'Night Halt Charges', value: quote.nightHaltCharges },
    { label: 'GST', value: quote.gstAmount },
  ].filter((item) => item.value > 0);

  const timelineItems = [
    {
      label: 'Created',
      value: new Date(quote.createdAt).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  if (quote.sentAt) {
    timelineItems.push({
      label: 'Sent',
      value: new Date(quote.sentAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-500 p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_45%)]" />
          <div className="absolute inset-y-0 left-10 w-72 bg-white/10 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/luxury/bookings"
              className="rounded-2xl border border-white/40 bg-white/10 p-2 transition hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/80">Quote overview</p>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">#{quote.quoteNumber}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {quote.isNegotiable && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                    Negotiable
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">Connected to request #{quote.request.requestNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isActive && (
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/30 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            )}
            {canReQuote && (
              <Link
                href={`/vendor/luxury/send-quote/${quote.request.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-50"
              >
                <RefreshCw className="w-4 h-4" />
                Send Fresh Quote
              </Link>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Total Amount</p>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(quote.totalAmount)}</p>
            <p className="text-sm text-white/70">
              Advance ({quote.advancePercent}%) – {formatCurrency(quote.advanceAmount)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur flex flex-col justify-center gap-2 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span>Views</span>
              <span className="font-semibold">{quote.viewCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valid until</span>
              <span className="font-semibold">{new Date(quote.validTill).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold">{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Vehicle & Driver</h2>
              <Car className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Luxury vehicle and chauffeur summary.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900">{quote.vehicleName}</p>
              </div>
              {quote.vehicleCategory && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Category</p>
                  <p className="font-medium text-gray-900">{quote.vehicleCategory}</p>
                </div>
              )}
              {quote.vehicleModel && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Model</p>
                  <p className="font-medium text-gray-900">{quote.vehicleModel}</p>
                </div>
              )}
              {quote.vehicleNumber && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Plate</p>
                  <p className="font-medium text-gray-900">{quote.vehicleNumber}</p>
                </div>
              )}
              {quote.vehicleYear && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Year</p>
                  <p className="font-medium text-gray-900">{quote.vehicleYear}</p>
                </div>
              )}
              {quote.vehicleFeatures && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Features</p>
                  <p className="text-sm text-gray-600">{quote.vehicleFeatures}</p>
                </div>
              )}
            </div>
            {(quote.driverName || quote.driverPhone || quote.driverExperience) && (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">Chauffeur</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {quote.driverName && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quote.driverName}</p>
                      <p className="text-xs text-gray-500">Name</p>
                    </div>
                  )}
                  {quote.driverPhone && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quote.driverPhone}</p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  )}
                  {quote.driverExperience && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quote.driverExperience} yrs</p>
                      <p className="text-xs text-gray-500">Experience</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {quote.vehicleImages && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <VehicleImageGallery vehicleImages={quote.vehicleImages} vehicleName={quote.vehicleName} />
            </div>
          )}

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emerald-900">Pricing Breakdown</h2>
                <p className="text-sm text-emerald-600">Transparent costs for this luxury quote.</p>
              </div>
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {priceBreakdown.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/70 p-4 text-sm text-emerald-800">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estimated Total</span>
                <span className="font-semibold text-lg">{formatCurrency(quote.totalAmount)}</span>
              </div>
              <p className="text-xs text-emerald-600">GST and extra charges included</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>Advance ({quote.advancePercent}%)</span>
                <span>{formatCurrency(quote.advanceAmount)}</span>
              </div>
            </div>
          </div>

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Inclusions & Exclusions</h2>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {inclusions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Inclusions</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Exclusions</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {terms.length > 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {terms.map((term, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-semibold">{i + 1}.</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {quote.vendorMessage && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Vendor Note</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.vendorMessage}</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Request Snapshot</h2>
            <p className="text-sm text-gray-500 mb-4">A quick look at the travel request.</p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-gray-400">Trip Type</p>
                  <p className="font-medium text-gray-900">{quote.request.tripType}</p>
                </div>
              </div>
              {quote.request.occasion && (
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-400">Occasion</p>
                    <p className="font-medium text-gray-900">{quote.request.occasion}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="font-medium text-gray-900">{quote.request.pickupCity}</p>
                  {quote.request.pickupAddress && (
                    <p className="text-xs text-gray-400">{quote.request.pickupAddress}</p>
                  )}
                </div>
              </div>
              {quote.request.dropCity && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Drop</p>
                    <p className="font-medium text-gray-900">{quote.request.dropCity}</p>
                    {quote.request.dropAddress && (
                      <p className="text-xs text-gray-400">{quote.request.dropAddress}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Pickup Date</p>
                  <p className="font-medium text-gray-900">
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
                  <Calendar className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Return Date</p>
                    <p className="font-medium text-gray-900">
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
                  <Clock className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900">{quote.request.tripDays} days</p>
                  </div>
                </div>
              )}
              {quote.request.needDecoration && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Decoration</p>
                    <p className="font-medium text-gray-900">{quote.request.decorationType || 'Required'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
            <div className="mt-3 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="font-medium text-gray-900">{quote.request.customerName}</p>
                </div>
              </div>
              {quote.request.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900">{quote.request.customerPhone}</p>
                  </div>
                </div>
              )}
              {quote.request.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 break-all">{quote.request.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Stats */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Quote Stats</h2>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Sent On</span>
                <span className="font-medium">
                  {quote.sentAt
                    ? new Date(quote.sentAt).toLocaleDateString('en-IN')
                    : new Date(quote.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Valid Until</span>
                <span className="font-medium">{new Date(quote.validTill).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Views</span>
                <span className="font-medium flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {quote.viewCount || 0}
                </span>
              </div>
            </div>
            <div className="pt-3 text-xs text-gray-500 border-t border-gray-100 space-y-2">
              {timelineItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {quote.request.requirements && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-900 mb-2">Customer Requirements</h2>
              <p className="text-sm text-emerald-700">{quote.request.requirements}</p>
            </div>
          )}

          {(quote.request.budgetMin || quote.request.budgetMax) && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-900 mb-2">Customer Budget</h2>
              <p className="text-sm text-emerald-700">
                {quote.request.budgetMin && quote.request.budgetMax
                  ? `${formatCurrency(quote.request.budgetMin)} - ${formatCurrency(quote.request.budgetMax)}`
                  : quote.request.budgetMin
                  ? `Min: ${formatCurrency(quote.request.budgetMin)}`
                  : `Max: ${formatCurrency(quote.request.budgetMax ?? 0)}`}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
