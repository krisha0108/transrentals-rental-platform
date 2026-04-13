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
  RefreshCw,
  MessageCircle,
  Award,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Copy,
  Timer,
  CircleDot,
  Truck,
  Send,
} from 'lucide-react';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';

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
  vehicleCategory?: string;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string; icon: any }> = {
  DRAFT:     { label: 'Draft',     color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',     icon: FileText },
  SENT:      { label: 'Sent',      color: 'text-emerald-600',    bg: 'bg-emerald-50',     border: 'border-emerald-200',    accent: 'from-emerald-500 to-emerald-600',     icon: Send },
  VIEWED:    { label: 'Viewed',    color: 'text-emerald-600',  bg: 'bg-emerald-50',   border: 'border-emerald-200',  accent: 'from-emerald-500 to-emerald-600', icon: Eye },
  ACCEPTED:  { label: 'Won',       color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', accent: 'from-emerald-500 to-emerald-600', icon: Award },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     accent: 'from-red-400 to-red-500',       icon: XCircle },
  EXPIRED:   { label: 'Expired',   color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   accent: 'from-amber-400 to-amber-500',   icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',     icon: XCircle },
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
  const [copied, setCopied] = useState(false);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/vendor/self-drive-quotes/${id}`);
      const data = await response.json();

      if (data.success) {
        const parseField = (val: any): string[] => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val) {
            try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch {}
            return val.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          return [];
        };
        setQuote({
          ...data.quote,
          inclusions: parseField(data.quote.inclusions),
          exclusions: parseField(data.quote.exclusions),
          termsConditions: parseField(data.quote.termsConditions),
        });
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

  useEffect(() => { fetchQuote(); }, [id]);

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

  const copyQuoteNumber = () => {
    if (quote) {
      navigator.clipboard.writeText(quote.quoteNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 bg-gray-100 rounded-lg ${shimmer}`} />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className={`h-4 w-12 bg-gray-200 rounded ${shimmer}`} />
              <div className={`h-5 w-24 bg-gray-100 rounded-md border border-gray-200 ${shimmer}`} />
              <div className={`h-5 w-14 bg-gray-100 rounded-md ${shimmer}`} />
            </div>
            <div className={`h-3 w-48 bg-gray-50 rounded ${shimmer}`} />
          </div>
        </div>

        {/* Hero banner */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 px-5 py-4">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
              <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white/20 rounded-xl ${shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-5 w-40 bg-white/25 rounded-lg ${shimmer}`} />
                  <div className={`h-3 w-52 bg-white/15 rounded ${shimmer}`} />
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => <div key={i} className={`h-4 w-16 bg-white/10 rounded ${shimmer}`} />)}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className={`h-3 w-10 bg-white/15 rounded ml-auto ${shimmer}`} />
                <div className={`h-7 w-28 bg-white/20 rounded-lg ml-auto ${shimmer}`} />
                <div className={`h-3 w-24 bg-white/10 rounded ml-auto ${shimmer}`} />
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { color: 'bg-emerald-50' },
              { color: 'bg-emerald-50' },
              { color: 'bg-emerald-50' },
              { color: 'bg-emerald-50' },
            ].map((s, i) => (
              <div key={i} className="px-3 py-2.5 text-center">
                <div className={`w-6 h-6 mx-auto mb-1 rounded-md ${s.color} ${shimmer}`} />
                <div className={`h-4 w-14 bg-gray-100 rounded mx-auto mb-1 ${shimmer}`} />
                <div className={`h-2.5 w-16 bg-gray-50 rounded mx-auto ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`w-6 h-6 bg-emerald-50 rounded-md ${shimmer}`} />
                <div className={`h-4 w-28 bg-gray-200 rounded ${shimmer}`} />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className={`h-3.5 w-32 bg-gray-100 rounded ${shimmer}`} />
                    <div className={`h-3.5 w-20 bg-gray-100 rounded ${shimmer}`} />
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between">
                  <div className={`h-4 w-20 bg-gray-200 rounded ${shimmer}`} />
                  <div className={`h-5 w-24 bg-emerald-100 rounded ${shimmer}`} />
                </div>
                <div className={`bg-gray-50 rounded-lg p-3 space-y-1.5 ${shimmer}`}>
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`w-6 h-6 bg-emerald-50 rounded-md ${shimmer}`} />
                <div className={`h-4 w-28 bg-gray-200 rounded ${shimmer}`} />
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <div className={`bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-100 space-y-2 ${shimmer}`}>
                  <div className="h-3.5 w-16 bg-emerald-200/60 rounded" />
                  {[1, 2, 3].map(i => <div key={i} className="h-3 w-full bg-emerald-100/60 rounded" />)}
                </div>
                <div className={`bg-red-50/60 rounded-lg p-3.5 border border-red-100 space-y-2 ${shimmer}`}>
                  <div className="h-3.5 w-20 bg-red-200/60 rounded" />
                  {[1, 2].map(i => <div key={i} className="h-3 w-full bg-red-100/60 rounded" />)}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`w-6 h-6 bg-emerald-50 rounded-md ${shimmer}`} />
                <div className={`h-4 w-32 bg-gray-200 rounded ${shimmer}`} />
              </div>
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-9 bg-gray-50 rounded-lg border border-gray-100 ${shimmer}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Trip Details */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className={`px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 ${shimmer}`}>
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className={`bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-center ${shimmer}`}>
                  <div className="h-3 w-14 bg-emerald-200/60 rounded mx-auto mb-1" />
                  <div className="h-6 w-16 bg-emerald-200/60 rounded mx-auto" />
                </div>
                {[1, 2].map(i => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 ${i === 1 ? 'bg-emerald-50' : 'bg-red-50'} rounded-md ${shimmer}`} />
                    <div className="space-y-1">
                      <div className={`h-2.5 w-10 bg-gray-100 rounded ${shimmer}`} />
                      <div className={`h-3.5 w-36 bg-gray-200 rounded ${shimmer}`} />
                    </div>
                  </div>
                ))}
                <div className={`bg-gray-50 rounded-lg px-3 py-2.5 ${shimmer}`}>
                  <div className="h-2.5 w-14 bg-gray-200/60 rounded mb-1" />
                  <div className="h-3.5 w-28 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className={`px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 ${shimmer}`}>
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="p-3.5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 bg-emerald-100 rounded-lg ${shimmer}`} />
                  <div className="space-y-1">
                    <div className={`h-3.5 w-24 bg-gray-200 rounded ${shimmer}`} />
                    <div className={`h-3 w-20 bg-gray-100 rounded ${shimmer}`} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className={`flex-1 h-9 bg-emerald-50 rounded-lg border border-emerald-100 ${shimmer}`} />
                  <div className={`flex-1 h-9 bg-emerald-50 rounded-lg border border-emerald-100 ${shimmer}`} />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className={`px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 ${shimmer}`}>
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="p-3.5 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-emerald-300' : i === 2 ? 'bg-gray-200' : 'bg-emerald-300'}`} />
                    <div className="flex-1 flex items-center justify-between">
                      <div className={`h-3 w-10 bg-gray-100 rounded ${shimmer}`} />
                      <div className={`h-3 w-20 bg-gray-200 rounded ${shimmer}`} />
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 bg-red-100 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-red-50 rounded-3xl -rotate-3" />
          <div className="relative w-full h-full bg-white rounded-3xl border border-red-100 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-9 h-9 text-red-400" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1.5">Quote Not Found</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-xs text-center">{error || 'This quote could not be loaded.'}</p>
        <Link href="/vendor/self-drive/quotes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
  const StatusIcon = statusConfig.icon;
  const isActive = ['SENT', 'VIEWED'].includes(quote.status);
  const isWon = quote.status === 'ACCEPTED';
  const canReQuote = quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status);
  const inclusions = Array.isArray(quote.inclusions) ? quote.inclusions : [];
  const exclusions = Array.isArray(quote.exclusions) ? quote.exclusions : [];
  const terms = Array.isArray(quote.termsConditions) ? quote.termsConditions : [];

  const isExpiringSoon = (() => {
    if (!quote.validTill) return false;
    const diff = new Date(quote.validTill).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  })();

  return (
    <div className="space-y-3">
      {/* ══════════ Header ══════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-down">
        <div className="flex items-center gap-2.5">
          <Link href="/vendor/self-drive/quotes" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 group">
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">Quote</h1>
              <button onClick={copyQuoteNumber} className="flex items-center gap-1 font-mono text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded-md transition-all border border-gray-200">
                #{quote.quoteNumber}
                <Copy className="w-2.5 h-2.5 text-gray-400" />
              </button>
              {copied && <span className="text-[9px] font-bold text-emerald-600 animate-fade-in">Copied!</span>}
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                <StatusIcon className="w-2.5 h-2.5" /> {statusConfig.label}
              </span>
              {quote.viewCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <Eye className="w-2.5 h-2.5" /> {quote.viewCount}x
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">For <span className="font-semibold text-gray-600">{quote.request.customerName}</span> · #{quote.request.requestNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <button onClick={handleWithdraw} disabled={isWithdrawing} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center gap-1 disabled:opacity-50 active:scale-95">
              <XCircle className="w-3.5 h-3.5" /> {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </button>
          )}
          {canReQuote && (
            <Link href={`/vendor/self-drive/requests/${quote.request.id}/quote`} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95">
              <RefreshCw className="w-3.5 h-3.5" /> Resend
            </Link>
          )}
        </div>
      </div>

      {/* ══════════ Won Banner ══════════ */}
      {isWon && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">Quote accepted! Booking created.</p>
          </div>
          {booking && (
            <Link href={`/vendor/self-drive/bookings/${booking.id}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shrink-0">
              View Booking <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* ══════════ Expiring Alert ══════════ */}
      {isExpiringSoon && isActive && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-3.5 py-2.5 animate-pulse">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800">Expiring soon!</p>
            <p className="text-[10px] text-amber-600">Valid until {new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      )}

      {/* ══════════ Price Hero Banner ══════════ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className={`relative overflow-hidden px-5 py-4 ${isWon ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500' : 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600'}`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
            <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">{quote.vehicleName}</h2>
                <p className="text-white/70 text-xs">
                  {[quote.vehicleBrand, quote.vehicleCategory, quote.vehicleYear, quote.registrationNumber].filter(Boolean).join(' · ')}
                </p>
                {/* Car specs */}
                <div className="flex items-center gap-2 mt-1">
                  {quote.transmission && (
                    <span className="text-[10px] text-white/80 bg-white/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Settings2 className="w-2.5 h-2.5" /> {quote.transmission}
                    </span>
                  )}
                  {quote.fuelType && (
                    <span className="text-[10px] text-white/80 bg-white/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Fuel className="w-2.5 h-2.5" /> {quote.fuelType}
                    </span>
                  )}
                  {quote.seats && (
                    <span className="text-[10px] text-white/80 bg-white/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> {quote.seats} seats
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-extrabold text-white">₹{quote.grandTotal?.toLocaleString()}</p>
              <p className="text-[11px] text-white/70 flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-2.5 h-2.5" />{quote.dailyRate?.toLocaleString()}/day x {quote.request.totalDays}d
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {[
            { icon: IndianRupee, label: 'Advance', value: `₹${quote.advanceAmount?.toLocaleString()}`, sub: `${quote.advancePercent}%`, color: 'text-emerald-500' },
            { icon: Shield, label: 'Deposit', value: `₹${quote.securityDeposit?.toLocaleString()}`, sub: 'Refundable', color: 'text-emerald-500' },
            { icon: Gauge, label: 'KM Limit', value: quote.kmLimitPerDay ? `${quote.kmLimitPerDay}/day` : 'Unlimited', sub: quote.extraKmRate ? `₹${quote.extraKmRate}/km extra` : '', color: 'text-emerald-500' },
            { icon: Timer, label: 'Valid', value: new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: `${quote.validityDays}d`, color: 'text-emerald-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="px-3 py-2.5 text-center">
                <div className="w-6 h-6 mx-auto mb-1 rounded-md bg-gray-50 flex items-center justify-center">
                  <Icon className={`w-3 h-3 ${s.color}`} />
                </div>
                <p className="text-sm font-extrabold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{s.label}{s.sub ? ` · ${s.sub}` : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* ══════════ Main Content ══════════ */}
        <div className="lg:col-span-2 space-y-3">

          {/* Vehicle Images */}
          {quote.vehicleImages && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <VehicleImageGallery vehicleImages={quote.vehicleImages} vehicleName={quote.vehicleName} />
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                <IndianRupee className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Price Breakdown</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Daily Rate x {quote.request.totalDays} days</span>
                <span className="font-semibold text-gray-900">₹{quote.baseAmount?.toLocaleString()}</span>
              </div>
              {quote.gstAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="font-semibold text-gray-900">₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}
              {quote.platformFee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-semibold text-gray-900">₹{quote.platformFee.toLocaleString()}</span>
                </div>
              )}
              {quote.deliveryCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.deliveryCharges.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Grand Total</span>
                <span className={`text-lg font-extrabold ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`}>₹{quote.grandTotal?.toLocaleString()}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Advance ({quote.advancePercent}%)</span>
                  <span className="font-bold text-gray-700">₹{quote.advanceAmount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Balance at pickup</span>
                  <span className="font-bold text-gray-700">₹{((quote.grandTotal || 0) - (quote.advanceAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Security deposit (refundable)</span>
                  <span className="font-bold text-gray-700">₹{quote.securityDeposit?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                  <FileText className="w-3 h-3 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">What&apos;s Included</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {inclusions.length > 0 && (
                  <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Included</p>
                    </div>
                    <ul className="space-y-1.5">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className="bg-red-50/60 rounded-lg p-3.5 border border-red-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Not Included</p>
                    </div>
                    <ul className="space-y-1.5">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {terms.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Terms & Conditions</h3>
              </div>
              <div className="space-y-1.5">
                {terms.map((term, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100/80 rounded-lg px-3 py-2 transition-colors">
                    <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200 shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{term}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Message */}
          {quote.vendorMessage && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Your Message</h3>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.vendorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ Sidebar ══════════ */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {/* Trip Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Trip Details
              </h3>
            </div>
            <div className="p-3.5 space-y-2.5">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Duration</p>
                <p className="text-xl font-extrabold text-emerald-600">{quote.request.totalDays} days</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center shrink-0">
                    <CircleDot className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {quote.request.pickupTime && <p className="text-xs text-gray-400">{quote.request.pickupTime}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-6 flex justify-center"><div className="w-0.5 h-4 bg-gray-200 rounded-full" /></div>
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Drop-off</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(quote.request.dropDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {quote.request.dropTime && <p className="text-xs text-gray-400">{quote.request.dropTime}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</p>
                  <p className="text-sm font-bold text-gray-900">{quote.request.locationName}</p>
                </div>
              </div>

              {quote.request.isDeliveryRequested && (
                <div className="bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2 border border-amber-100">
                  <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Home Delivery</p>
                    {quote.request.pickupAddress && <p className="text-xs text-amber-800">{quote.request.pickupAddress}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" /> Customer
              </h3>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm shadow-emerald-500/20">
                  {quote.request.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{quote.request.customerName}</p>
                  {quote.request.customerPhone && <p className="text-xs text-gray-400">{quote.request.customerPhone}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quote.request.customerPhone && (
                  <>
                    <a href={`tel:${quote.request.customerPhone}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all border border-emerald-100 active:scale-95">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                    <a href={`https://wa.me/${quote.request.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all border border-[#25D366]/20 active:scale-95">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  </>
                )}
                {quote.request.customerEmail && (
                  <a href={`mailto:${quote.request.customerEmail}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all border border-emerald-100 active:scale-95">
                    <Mail className="w-3 h-3" /> Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Timeline
              </h3>
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sent</span>
                  <span className="text-xs font-bold text-gray-700">{(quote.sentAt ? new Date(quote.sentAt) : new Date(quote.createdAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isExpiringSoon ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'} shrink-0`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Expires</span>
                  <span className={`text-xs font-bold ${isExpiringSoon ? 'text-amber-600' : 'text-gray-700'}`}>{new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${statusConfig.accent} shrink-0`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
              </div>
              {quote.viewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Views</span>
                    <span className="text-xs font-bold text-emerald-600">{quote.viewCount}x</span>
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
                  {new Date(quote.validTill).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-amber-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-500" /> Customer Notes
                </h3>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-sm text-gray-700 leading-relaxed">{quote.request.customerNotes}</p>
              </div>
            </div>
          )}

          {/* Budget */}
          {(quote.request.budgetMin || quote.request.budgetMax) && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl border border-emerald-200 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Customer Budget
                </h3>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-base font-extrabold text-emerald-700">
                  {quote.request.budgetMin && quote.request.budgetMax
                    ? `₹${quote.request.budgetMin.toLocaleString()} – ₹${quote.request.budgetMax.toLocaleString()}`
                    : quote.request.budgetMin
                    ? `Min: ₹${quote.request.budgetMin.toLocaleString()}`
                    : `Max: ₹${quote.request.budgetMax?.toLocaleString()}`}
                </p>
                {(quote.grandTotal || 0) <= (quote.request.budgetMax || Infinity) && (
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Within budget
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Booking Card (for accepted) */}
          {isWon && booking && (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white" />
                <div className="absolute right-10 -bottom-6 w-16 h-16 rounded-full bg-white" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <h3 className="text-sm font-bold">Booking Created</h3>
                </div>
                <div className="space-y-1.5 text-emerald-100 text-xs mb-3">
                  <div className="flex justify-between">
                    <span>Booking #</span>
                    <span className="font-bold text-white">{booking.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="font-bold text-white">{booking.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment</span>
                    <span className="font-bold text-white">{booking.paymentStatus || 'Pending'}</span>
                  </div>
                </div>
                <Link href={`/vendor/self-drive/bookings/${booking.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-50 transition-all active:scale-95">
                  <ExternalLink className="w-3.5 h-3.5" /> View Booking & Manage Trip
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
