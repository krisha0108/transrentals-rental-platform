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
  Mail,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee,
  Shield,
  AlertCircle,
  FileText,
  Weight,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Award,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Copy,
  CircleDot,
  Timer,
  Send,
  Users,
} from 'lucide-react';
import VehicleImageGallery from '@/components/customer/VehicleImageGallery';
import VendorCallButton from '@/components/vendor/VendorCallButton';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string; icon: any }> = {
  DRAFT:     { label: 'Draft',              color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',        icon: FileText },
  SENT:      { label: 'Awaiting Response',  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    accent: 'from-blue-500 to-blue-600',        icon: Send },
  VIEWED:    { label: 'Viewed by Customer', color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200',  accent: 'from-purple-500 to-purple-600',    icon: Eye },
  ACCEPTED:  { label: 'Won',                color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', accent: 'from-emerald-500 to-emerald-600',  icon: Award },
  REJECTED:  { label: 'Rejected',           color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     accent: 'from-red-400 to-red-500',          icon: XCircle },
  EXPIRED:   { label: 'Expired',            color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   accent: 'from-amber-400 to-amber-500',      icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn',          color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',    accent: 'from-gray-400 to-gray-500',        icon: XCircle },
};

export default function VendorQuoteDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyQuoteNumber = () => {
    if (quote) {
      navigator.clipboard.writeText(quote.quoteNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
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
          href="/vendor/transporter/quotes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
        >
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
          <Link href="/vendor/transporter/quotes" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 group">
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
              {copied && <span className="text-[9px] font-bold text-emerald-600">Copied!</span>}
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                <StatusIcon className="w-2.5 h-2.5" />
                {statusConfig.label}
              </span>
              {quote.viewCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                  <Eye className="w-2.5 h-2.5" /> {quote.viewCount}x
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">For <span className="font-semibold text-gray-600">{quote.request.customerName}</span> · #{quote.request.requestNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {canReQuote && (
            <Link href={`/vendor/transporter/requests/${quote.request.id}/quote`} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95">
              <RefreshCw className="w-3.5 h-3.5" /> Send Fresh Quote
            </Link>
          )}
          {isWon && (
            <Link href="/vendor/transporter/bookings" className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95">
              <Eye className="w-3.5 h-3.5" /> View Booking
            </Link>
          )}
        </div>
      </div>

      {/* ══════════ Expiring Soon Alert ══════════ */}
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

      {/* ══════════ Won Banner ══════════ */}
      {isWon && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">Quote accepted! Booking created.</p>
          </div>
        </div>
      )}

      {/* ══════════ Price Hero Banner ══════════ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`relative overflow-hidden px-5 py-4 ${isWon ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600'}`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
            <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">{quote.vehicleName}</h2>
                <p className="text-white/70 text-xs">
                  {[quote.vehicleNumber, quote.vehicleCapacity].filter(Boolean).join(' · ') || 'Truck details'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-extrabold text-white">₹{quote.totalAmount.toLocaleString()}</p>
              {quote.perKmRate && (
                <p className="text-[11px] text-white/70 flex items-center gap-0.5 justify-end">
                  <IndianRupee className="w-2.5 h-2.5" />{quote.perKmRate.toLocaleString()}/km
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {[
            { icon: Calendar, label: 'Pickup', value: new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: quote.request.pickupTime || '—', color: 'text-emerald-500' },
            { icon: ArrowRight, label: 'Distance', value: quote.request.estimatedDistance ? `${quote.request.estimatedDistance} km` : '—', sub: 'Approx', color: 'text-blue-500' },
            { icon: Weight, label: 'Weight', value: quote.request.estimatedWeight ? `${quote.request.estimatedWeight} kg` : '—', sub: quote.request.goodsType || 'Goods', color: 'text-emerald-500' },
            { icon: Timer, label: 'Valid', value: new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: 'Till', color: 'text-purple-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="px-3 py-2.5 text-center">
                <div className="w-6 h-6 mx-auto mb-1 rounded-md bg-gray-50 flex items-center justify-center">
                  <Icon className={`w-3 h-3 ${s.color}`} />
                </div>
                <p className="text-sm font-extrabold text-gray-900 truncate">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{s.label} · {s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
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
                <span className="text-gray-500">Base Amount</span>
                <span className="font-semibold text-gray-900">₹{quote.baseAmount.toLocaleString()}</span>
              </div>
              {quote.loadingCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Loading Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.loadingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.unloadingCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Unloading Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.unloadingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.labourCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Labour Charges{quote.labourCount ? ` (${quote.labourCount})` : ''}</span>
                  <span className="font-semibold text-gray-900">₹{quote.labourCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.packagingCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Packaging Charges</span>
                  <span className="font-semibold text-gray-900">₹{quote.packagingCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.insuranceCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Insurance</span>
                  <span className="font-semibold text-gray-900">₹{quote.insuranceCharges.toLocaleString()}</span>
                </div>
              )}
              {quote.tollEstimate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Toll (Estimate)</span>
                  <span className="font-semibold text-gray-900">₹{quote.tollEstimate.toLocaleString()}</span>
                </div>
              )}
              {quote.gstAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="font-semibold text-gray-900">₹{quote.gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className={`text-lg font-extrabold ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`}>₹{quote.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {quote.labourIncluded && (
              <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Labour Included: {quote.labourCount} persons
                </p>
              </div>
            )}
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

          {/* Driver info */}
          {(quote.driverName || quote.driverPhone) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
                  <User className="w-3 h-3 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Driver</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm shadow-emerald-500/20">
                  {(quote.driverName || 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{quote.driverName || '—'}</p>
                  {quote.driverPhone && <p className="text-xs text-gray-400">{quote.driverPhone}</p>}
                </div>
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
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Trip Details
              </h3>
            </div>
            <div className="p-3.5 space-y-2.5">
              {quote.request.estimatedDistance && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Distance</p>
                  <p className="text-xl font-extrabold text-emerald-600">{quote.request.estimatedDistance} km</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center shrink-0">
                    <CircleDot className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup</p>
                    <p className="text-sm font-bold text-gray-900">{quote.request.pickupCity}</p>
                    {quote.request.pickupAddress && <p className="text-[11px] text-gray-400 truncate">{quote.request.pickupAddress}</p>}
                    {quote.request.pickupFloor != null && (
                      <p className="text-[10px] text-gray-400">
                        Floor {quote.request.pickupFloor} · {quote.request.hasPickupLift ? 'Lift available' : 'No lift'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-6 flex justify-center">
                    <div className="w-0.5 h-4 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Drop</p>
                    <p className="text-sm font-bold text-gray-900">{quote.request.dropCity}</p>
                    {quote.request.dropAddress && <p className="text-[11px] text-gray-400 truncate">{quote.request.dropAddress}</p>}
                    {quote.request.dropFloor != null && (
                      <p className="text-[10px] text-gray-400">
                        Floor {quote.request.dropFloor} · {quote.request.hasDropLift ? 'Lift available' : 'No lift'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {quote.request.pickupTime && <p className="text-[11px] text-gray-400">{quote.request.pickupTime}</p>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Goods</p>
                  <p className="text-sm font-bold text-gray-900">{quote.request.goodsType || 'General'}</p>
                  {quote.request.estimatedWeight && (
                    <p className="text-[11px] text-gray-400">{quote.request.estimatedWeight} kg</p>
                  )}
                </div>
              </div>

              {(quote.request.needInsurance || quote.request.needPackaging || quote.request.requiresLabour) && (
                <div className="flex flex-wrap gap-1">
                  {quote.request.needInsurance && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold border border-blue-100">Insurance</span>
                  )}
                  {quote.request.needPackaging && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-bold border border-purple-100">Packaging</span>
                  )}
                  {quote.request.requiresLabour && (
                    <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-bold border border-orange-100">
                      Labour {quote.request.labourCount || ''}
                    </span>
                  )}
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
                </div>
              </div>
              {quote.request.customerPhone && (
                <div className="flex flex-wrap gap-1.5">
                  <VendorCallButton phone={quote.request.customerPhone} bookingType="transporter_quote" bookingId={quote.id} variant="blue" />
                  <a href={`https://wa.me/${quote.request.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all border border-[#25D366]/20 active:scale-95">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                Timeline
              </h3>
            </div>
            <div className="p-3.5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Sent</span>
                    <span className="text-xs font-bold text-gray-700">
                      {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isExpiringSoon ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'} shrink-0`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Expires</span>
                    <span className={`text-xs font-bold ${isExpiringSoon ? 'text-amber-600' : 'text-gray-700'}`}>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Views</span>
                      <span className="text-xs font-bold text-purple-600">{quote.viewCount}x{quote.viewedAt ? ` · ${new Date(quote.viewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {quote.request.requirements && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-amber-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                  Special Requirements
                </h3>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-sm text-gray-700 leading-relaxed">{quote.request.requirements}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
