'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
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
  RefreshCw,
  MessageCircle,
  Award,
  Zap,
  ArrowUpRight,
  Copy,
  Send,
  CircleDot,
  Timer,
  Users,
  Package,
  Loader2,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string; icon: any }> = {
  DRAFT:     { label: 'Draft',     color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',     icon: FileText },
  SENT:      { label: 'Sent',      color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    accent: 'from-blue-500 to-blue-600',     icon: Send },
  VIEWED:    { label: 'Viewed',    color: 'text-emerald-600',  bg: 'bg-emerald-50',   border: 'border-emerald-200',  accent: 'from-emerald-500 to-emerald-600', icon: Eye },
  ACCEPTED:  { label: 'Won',       color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', accent: 'from-emerald-500 to-emerald-600', icon: Award },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     accent: 'from-red-400 to-red-500',       icon: XCircle },
  EXPIRED:   { label: 'Expired',   color: 'text-emerald-600',   bg: 'bg-emerald-50',    border: 'border-emerald-200',   accent: 'from-emerald-400 to-emerald-500',   icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',     icon: XCircle },
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
  const [copied, setCopied] = useState(false);

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

  const copyQuoteNumber = () => {
    if (quote) {
      navigator.clipboard.writeText(quote.quoteNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-3">
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-4">
            <div className="absolute inset-0 opacity-10"><div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" /></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white/20 rounded-xl ${shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-5 w-40 bg-white/25 rounded-lg ${shimmer}`} />
                  <div className={`h-3 w-52 bg-white/15 rounded ${shimmer}`} />
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className={`h-3 w-10 bg-white/15 rounded ml-auto ${shimmer}`} />
                <div className={`h-7 w-28 bg-white/20 rounded-lg ml-auto ${shimmer}`} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-3 py-2.5 text-center">
                <div className={`w-6 h-6 mx-auto mb-1 rounded-md bg-gray-50 ${shimmer}`} />
                <div className={`h-4 w-14 bg-gray-100 rounded mx-auto mb-1 ${shimmer}`} />
                <div className={`h-2.5 w-16 bg-gray-50 rounded mx-auto ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className={`w-6 h-6 bg-emerald-50 rounded-md ${shimmer}`} />
                  <div className={`h-4 w-28 bg-gray-200 rounded ${shimmer}`} />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center justify-between">
                      <div className={`h-3.5 w-32 bg-gray-100 rounded ${shimmer}`} />
                      <div className={`h-3.5 w-20 bg-gray-100 rounded ${shimmer}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className={`px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 ${shimmer}`}>
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
                <div className="p-3.5 space-y-2.5">
                  {[1, 2].map(j => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 bg-emerald-50 rounded-md ${shimmer}`} />
                      <div className="space-y-1 flex-1">
                        <div className={`h-2.5 w-10 bg-gray-100 rounded ${shimmer}`} />
                        <div className={`h-3.5 w-36 bg-gray-200 rounded ${shimmer}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
        <Link
          href="/vendor/equipment/quotes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
      </div>
    );
  }

  const expired = isExpired(quote.validTill);
  const effectiveStatus = expired && quote.status === 'SENT' ? 'EXPIRED' : quote.status;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.SENT;
  const StatusIcon = statusConfig.icon;
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
          <Link href="/vendor/equipment/quotes" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 group">
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">Quote</h1>
              <button
                onClick={copyQuoteNumber}
                className="flex items-center gap-1 font-mono text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded-md transition-all border border-gray-200"
              >
                #{quote.quoteNumber}
                <Copy className="w-2.5 h-2.5 text-gray-400" />
              </button>
              {copied && <span className="text-[9px] font-bold text-emerald-600 animate-fade-in">Copied!</span>}
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                <StatusIcon className="w-2.5 h-2.5" />
                {statusConfig.label}
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
          {canReQuote && (
            <Link href={`/vendor/equipment/requests/${quote.request.id}/quote`} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95">
              <RefreshCw className="w-3.5 h-3.5" /> Send Fresh Quote
            </Link>
          )}
        </div>
      </div>

      {/* ══════════ Expiring Soon Alert ══════════ */}
      {isExpiringSoon && !expired && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200 rounded-xl px-3.5 py-2.5 animate-pulse">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800">Expiring soon!</p>
            <p className="text-[10px] text-emerald-600">Valid until {new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      )}

      {/* ══════════ Won Banner ══════════ */}
      {isWon && quote.booking && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">Quote accepted! Booking #{quote.booking.bookingNumber}</p>
          </div>
          <Link href={`/vendor/equipment/bookings/${quote.booking.id}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shrink-0">
            View Booking <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ══════════ Price Hero Banner ══════════ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className={`relative overflow-hidden px-5 py-4 ${isWon ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600'}`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
            <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">{quote.equipmentName}</h2>
                <p className="text-white/70 text-xs">
                  {[quote.equipmentModel, quote.equipmentYear, quote.equipmentCondition].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-extrabold text-white">₹{quote.totalAmount.toLocaleString()}</p>
              <p className="text-[11px] text-white/70 flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-2.5 h-2.5" />{quote.dailyRate.toLocaleString()}/day
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {[
            { icon: Shield, label: 'Deposit', value: `₹${quote.securityDeposit.toLocaleString()}`, sub: 'Refundable', color: 'text-blue-500' },
            { icon: Users, label: 'Operator', value: quote.request.needOperator ? 'Yes' : 'No', sub: quote.operatorCharges > 0 ? `₹${quote.operatorCharges.toLocaleString()}` : '—', color: 'text-emerald-500' },
            { icon: Package, label: 'Qty', value: (quote.request.quantity ?? 1).toString(), sub: quote.request.equipmentCategory || '—', color: 'text-emerald-500' },
            { icon: Timer, label: 'Valid', value: new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: expired ? 'Expired' : 'Until', color: 'text-emerald-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="px-3 py-2.5 text-center">
                <div className={`w-6 h-6 mx-auto mb-1 rounded-md bg-gray-50 flex items-center justify-center`}>
                  <Icon className={`w-3 h-3 ${s.color}`} />
                </div>
                <p className="text-sm font-extrabold text-gray-900 truncate">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{s.label} · {s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* ══════════ Main Content ══════════ */}
        <div className="lg:col-span-2 space-y-3">

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                <IndianRupee className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Price Breakdown</h3>
            </div>
            <div className="space-y-2">
              {quote.dailyRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Daily Rate</span>
                  <span className="font-semibold text-gray-900">₹{quote.dailyRate.toLocaleString()}/day</span>
                </div>
              )}
              {quote.weeklyRate && quote.weeklyRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Weekly Rate</span>
                  <span className="font-semibold text-gray-900">₹{quote.weeklyRate.toLocaleString()}/week</span>
                </div>
              )}
              {quote.monthlyRate && quote.monthlyRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Monthly Rate</span>
                  <span className="font-semibold text-gray-900">₹{quote.monthlyRate.toLocaleString()}/month</span>
                </div>
              )}
              {quote.operatorCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Operator Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.operatorCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.fuelCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fuel Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.fuelCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.deliveryCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.deliveryCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.pickupCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pickup Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.pickupCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.gstAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="font-semibold text-gray-900">₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className={`text-lg font-extrabold ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`}>₹{quote.totalAmount.toLocaleString()}</span>
              </div>
              {quote.securityDeposit > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Security deposit (refundable)</span>
                    <span className="font-bold text-gray-700">₹{quote.securityDeposit.toLocaleString()}</span>
                  </div>
                </div>
              )}
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Terms & Conditions
                </h3>
              </div>
              <div className="p-3.5 space-y-1.5">
                {terms.map((term, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100/80 rounded-lg px-3 py-2 transition-colors">
                    <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200 shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{term}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Notes */}
          {quote.notes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Vendor Notes</h3>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ Sidebar ══════════ */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {/* Equipment & Rental Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Rental Details
              </h3>
            </div>
            <div className="p-3.5 space-y-2.5">
              {/* Duration highlight */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Duration</p>
                <p className="text-xl font-extrabold text-emerald-600">
                  {quote.request.rentalDays} {DURATION_LABELS[quote.request.rentalDuration] || quote.request.rentalDuration}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center shrink-0">
                  <CircleDot className="w-3 h-3 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(quote.request.startDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery</p>
                  <p className="text-sm font-bold text-gray-900">{quote.request.deliveryCity}</p>
                  <p className="text-[11px] text-gray-500">{quote.request.deliveryAddress}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Equipment</p>
                  <p className="text-sm font-bold text-gray-900">{quote.request.equipmentType}</p>
                  <p className="text-[11px] text-gray-500">{quote.request.equipmentCategory} · Qty: {quote.request.quantity}</p>
                </div>
              </div>

              {quote.request.needOperator && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">Operator Required</p>
                </div>
              )}

              {quote.request.requirements && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Requirements</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{quote.request.requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Customer
              </h3>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm shadow-blue-500/20">
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
                    <a href={`tel:${quote.request.customerPhone}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all border border-blue-100 active:scale-95">
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
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Timeline
              </h3>
            </div>
            <div className="p-3.5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Created</span>
                    <span className="text-xs font-bold text-gray-700">
                      {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {quote.viewedAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">First Viewed</span>
                      <span className="text-xs font-bold text-gray-700">
                        {new Date(quote.viewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isExpiringSoon ? 'bg-emerald-500 animate-pulse' : expired ? 'bg-red-400' : 'bg-gray-300'} shrink-0`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{expired ? 'Expired' : 'Expires'}</span>
                    <span className={`text-xs font-bold ${isExpiringSoon ? 'text-emerald-600' : expired ? 'text-red-500' : 'text-gray-700'}`}>
                      {new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
