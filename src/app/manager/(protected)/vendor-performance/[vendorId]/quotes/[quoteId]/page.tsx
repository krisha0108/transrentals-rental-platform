'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, FileText, Eye, AlertCircle,
  User, Phone, Mail, MapPin, Calendar, Clock, Car, IndianRupee,
  Shield, Fuel, Settings, Star, Package, Hash, Info,
} from 'lucide-react';

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  serviceType: string;
  status: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicleCategory?: string;
  vehicleYear?: number;
  vehicleType?: string;
  registrationNumber?: string;
  vehicleFeatures?: string;
  vehicleImages?: string;
  // pricing
  dailyRate?: number;
  grandTotal?: number;
  totalAmount?: number;
  baseAmount?: number;
  advanceAmount: number;
  advancePercent: number;
  securityDeposit?: number;
  gstAmount?: number;
  extraKmCharge?: number;
  extraKmRate?: number;
  perKmRate?: number;
  kmLimitPerDay?: number;
  helmetsIncluded?: number;
  seats?: number;
  teamSize?: number;
  estimatedDuration?: string;
  // packers specific
  packingCharges?: number;
  loadingCharges?: number;
  transportCharges?: number;
  unloadingCharges?: number;
  // truck specific
  labourIncluded?: boolean;
  labourCount?: number;
  labourCharges?: number;
  loadingCharges2?: number;
  // terms
  inclusions?: string;
  exclusions?: string;
  termsConditions?: string;
  vendorMessage?: string;
  // dates
  validTill: string;
  sentAt?: string;
  createdAt: string;
  viewCount: number;
  viewedAt?: string;
  respondedAt?: string;
  // request
  request?: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    locationName?: string;
    pickupCity?: string;
    dropCity?: string;
    pickupDate?: string;
    dropDate?: string;
    pickupTime?: string;
    dropTime?: string;
    totalDays?: number;
    passengers?: number;
    tripType?: string;
    occasion?: string;
    vehicleCategory?: string;
    goodsType?: string;
    goodsDescription?: string;
    shiftingType?: string;
    propertySize?: string;
    equipmentCategory?: string;
    equipmentType?: string;
    quantity?: number;
    rentalDuration?: string;
    startDate?: string;
    endDate?: string;
    scheduledDate?: string;
    isDeliveryRequested?: boolean;
    budgetMin?: number;
    budgetMax?: number;
  };
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; label: string; icon: React.ElementType }> = {
  ACCEPTED:  { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  label: 'Accepted',  icon: CheckCircle },
  REJECTED:  { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    label: 'Rejected',  icon: XCircle },
  SENT:      { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   label: 'Sent',      icon: FileText },
  VIEWED:    { bg: 'bg-purple-50', border: 'border-purple-200',text: 'text-purple-700', label: 'Viewed',    icon: Eye },
  DRAFT:     { bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-600',   label: 'Draft',     icon: FileText },
  EXPIRED:   { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  label: 'Expired',   icon: AlertCircle },
  WITHDRAWN: { bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-500',   label: 'Withdrawn', icon: XCircle },
};

const SERVICE_COLORS: Record<string, string> = {
  BIKE: 'bg-green-100 text-green-700', CAR: 'bg-blue-100 text-blue-700',
  BUS: 'bg-red-100 text-red-700', TRUCK: 'bg-indigo-100 text-indigo-700',
  LUXURY: 'bg-amber-100 text-amber-700', PACKERS: 'bg-pink-100 text-pink-700',
  EQUIPMENT: 'bg-teal-100 text-teal-700',
};

function tryParseArray(val?: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return val.split('\n').filter(Boolean);
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, accent = 'green' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; accent?: string;
}) {
  const accents: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accents[accent] || accents.green}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = params?.vendorId as string;
  const quoteId = params?.quoteId as string;
  const serviceType = searchParams.get('type') || '';

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId || !serviceType) return;
    fetch(`/api/manager/vendor-performance/${vendorId}/quotes/${quoteId}?type=${serviceType}`)
      .then(r => r.json())
      .then(data => {
        if (data.quote) setQuote(data.quote);
        else setError(data.error || 'Failed to load quote');
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [quoteId, serviceType, vendorId]);

  const formatDate = (d?: string) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const formatDateTime = (d?: string) => d
    ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const formatCurrency = (n?: number | null) => n != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">{error || 'Quote not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-green-600 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusCfg.icon;
  const inclusions = tryParseArray(quote.inclusions);
  const exclusions = tryParseArray(quote.exclusions);
  const features = tryParseArray(quote.vehicleFeatures);
  const images = tryParseArray(quote.vehicleImages);
  const totalAmount = quote.grandTotal ?? quote.totalAmount ?? 0;

  // Pricing rows depend on service type
  const pricingRows: { label: string; value: string | null }[] = [];
  if (quote.dailyRate) pricingRows.push({ label: 'Daily Rate', value: formatCurrency(quote.dailyRate) });
  if (quote.baseAmount) pricingRows.push({ label: 'Base Amount', value: formatCurrency(quote.baseAmount) });
  if (quote.perKmRate) pricingRows.push({ label: 'Per Km Rate', value: formatCurrency(quote.perKmRate) });
  if (quote.extraKmCharge || quote.extraKmRate) pricingRows.push({ label: 'Extra Km Charge', value: formatCurrency(quote.extraKmCharge ?? quote.extraKmRate) });
  if (quote.kmLimitPerDay) pricingRows.push({ label: 'KM Limit / Day', value: `${quote.kmLimitPerDay} km` });
  if (quote.securityDeposit) pricingRows.push({ label: 'Security Deposit', value: formatCurrency(quote.securityDeposit) });
  if (quote.gstAmount) pricingRows.push({ label: 'GST', value: formatCurrency(quote.gstAmount) });
  // packers
  if (quote.packingCharges) pricingRows.push({ label: 'Packing Charges', value: formatCurrency(quote.packingCharges) });
  if (quote.loadingCharges) pricingRows.push({ label: 'Loading Charges', value: formatCurrency(quote.loadingCharges) });
  if (quote.transportCharges) pricingRows.push({ label: 'Transport Charges', value: formatCurrency(quote.transportCharges) });
  if (quote.unloadingCharges) pricingRows.push({ label: 'Unloading Charges', value: formatCurrency(quote.unloadingCharges) });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">#{quote.quoteNumber}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              <StatusIcon className="w-4 h-4" /> {statusCfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[quote.serviceType] || 'bg-gray-100 text-gray-600'}`}>
              {quote.serviceType}
            </span>
            {quote.viewCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                <Eye className="w-3.5 h-3.5" /> Viewed {quote.viewCount} time{quote.viewCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Quotation Detail</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl border px-5 py-4 flex items-start gap-3 ${statusCfg.bg} ${statusCfg.border}`}>
        <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusCfg.text}`} />
        <div>
          <p className={`font-semibold ${statusCfg.text}`}>Quote {statusCfg.label}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            Valid till {formatDate(quote.validTill)}
            {quote.sentAt && <> · Sent on {formatDate(quote.sentAt)}</>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Info */}
        <SectionCard title="Customer Details" icon={User} accent="blue">
          <InfoRow label="Name" value={quote.request?.customerName} />
          <InfoRow label="Phone" value={quote.request?.customerPhone} />
          <InfoRow label="Email" value={quote.request?.customerEmail} />
          {(quote.request?.locationName || quote.request?.pickupCity) && (
            <InfoRow label="Location" value={quote.request.locationName || quote.request.pickupCity} />
          )}
          {quote.request?.dropCity && <InfoRow label="Drop City" value={quote.request.dropCity} />}
          {quote.request?.tripType && <InfoRow label="Trip Type" value={quote.request.tripType} />}
          {quote.request?.occasion && <InfoRow label="Occasion" value={quote.request.occasion} />}
          {quote.request?.passengers && <InfoRow label="Passengers" value={quote.request.passengers} />}
          {quote.request?.pickupDate && (
            <InfoRow label="Pickup Date" value={`${formatDate(quote.request.pickupDate)}${quote.request.pickupTime ? ' · ' + quote.request.pickupTime : ''}`} />
          )}
          {quote.request?.dropDate && (
            <InfoRow label="Drop Date" value={`${formatDate(quote.request.dropDate)}${quote.request.dropTime ? ' · ' + quote.request.dropTime : ''}`} />
          )}
          {quote.request?.scheduledDate && <InfoRow label="Scheduled Date" value={formatDate(quote.request.scheduledDate)} />}
          {quote.request?.startDate && <InfoRow label="Start Date" value={formatDate(quote.request.startDate)} />}
          {quote.request?.endDate && <InfoRow label="End Date" value={formatDate(quote.request.endDate)} />}
          {quote.request?.totalDays && <InfoRow label="Total Days" value={`${quote.request.totalDays} days`} />}
          {quote.request?.goodsType && <InfoRow label="Goods Type" value={quote.request.goodsType} />}
          {quote.request?.shiftingType && <InfoRow label="Shifting Type" value={quote.request.shiftingType} />}
          {quote.request?.propertySize && <InfoRow label="Property Size" value={quote.request.propertySize} />}
          {quote.request?.equipmentCategory && <InfoRow label="Equipment Category" value={quote.request.equipmentCategory} />}
          {quote.request?.quantity && <InfoRow label="Quantity" value={quote.request.quantity} />}
          {(quote.request?.budgetMin || quote.request?.budgetMax) && (
            <InfoRow label="Budget" value={`${formatCurrency(quote.request.budgetMin)} – ${formatCurrency(quote.request.budgetMax)}`} />
          )}
        </SectionCard>

        {/* Vehicle Info */}
        <SectionCard title="Vehicle / Service Details" icon={Car} accent="green">
          <InfoRow label="Name" value={quote.vehicleName} />
          {quote.vehicleBrand && <InfoRow label="Brand" value={quote.vehicleBrand} />}
          {quote.vehicleCategory && <InfoRow label="Category" value={quote.vehicleCategory} />}
          {quote.vehicleType && <InfoRow label="Type" value={quote.vehicleType} />}
          {quote.vehicleYear && <InfoRow label="Year" value={quote.vehicleYear} />}
          {quote.registrationNumber && <InfoRow label="Registration No." value={quote.registrationNumber} />}
          {quote.helmetsIncluded != null && <InfoRow label="Helmets Included" value={quote.helmetsIncluded} />}
          {quote.seats && <InfoRow label="Seats" value={quote.seats} />}
          {quote.teamSize && <InfoRow label="Team Size" value={quote.teamSize} />}
          {quote.estimatedDuration && <InfoRow label="Est. Duration" value={quote.estimatedDuration} />}
          {quote.labourIncluded != null && <InfoRow label="Labour Included" value={quote.labourIncluded ? 'Yes' : 'No'} />}
          {quote.labourCount != null && <InfoRow label="Labour Count" value={quote.labourCount} />}
          {features.length > 0 && (
            <div className="py-2.5 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {features.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">{f}</span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Pricing */}
        <SectionCard title="Pricing Breakdown" icon={IndianRupee} accent="amber">
          {pricingRows.map((row, i) => (
            <InfoRow key={i} label={row.label} value={row.value || undefined} />
          ))}
          <div className="flex justify-between items-center py-3 mt-1 border-t-2 border-gray-200">
            <span className="text-base font-bold text-gray-900">Total Amount</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <p className="text-xs text-gray-500 mb-1">Advance ({quote.advancePercent}%)</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(quote.advanceAmount)}</p>
            </div>
            {quote.securityDeposit ? (
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <p className="text-xs text-gray-500 mb-1">Security Deposit</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(quote.securityDeposit)}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">GST Amount</p>
                <p className="text-lg font-bold text-gray-700">{formatCurrency(quote.gstAmount) || '₹0'}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Quote Timeline" icon={Clock} accent="purple">
          <div className="space-y-3 py-1">
            {[
              { label: 'Quote Created', date: quote.createdAt, color: 'bg-gray-400' },
              { label: 'Quote Sent', date: quote.sentAt, color: 'bg-blue-500' },
              { label: 'Viewed by Customer', date: quote.viewedAt, color: 'bg-purple-500' },
              { label: 'Customer Responded', date: quote.respondedAt, color: 'bg-green-500' },
            ].map((item, i) => (
              item.date ? (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${item.color}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(item.date)}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-3 opacity-40">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-300 border-2 border-gray-200" />
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
              )
            ))}
          </div>
          <InfoRow label="Valid Till" value={formatDate(quote.validTill)} />
        </SectionCard>
      </div>

      {/* Inclusions */}
      {inclusions.length > 0 && (
        <SectionCard title="Inclusions" icon={CheckCircle} accent="green">
          <ul className="space-y-2 py-1">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Exclusions */}
      {exclusions.length > 0 && (
        <SectionCard title="Exclusions" icon={XCircle} accent="red">
          <ul className="space-y-2 py-1">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Terms & Conditions */}
      {quote.termsConditions && (
        <SectionCard title="Terms & Conditions" icon={FileText} accent="gray">
          <div className="py-1">
            {tryParseArray(quote.termsConditions).length > 1 ? (
              <ul className="space-y-2">
                {tryParseArray(quote.termsConditions).map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-gray-100 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.termsConditions}</p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Vendor Message */}
      {quote.vendorMessage && (
        <SectionCard title="Vendor Message to Customer" icon={Info} accent="blue">
          <p className="text-sm text-gray-700 whitespace-pre-wrap py-1 leading-relaxed">{quote.vendorMessage}</p>
        </SectionCard>
      )}

      {/* Vehicle Images */}
      {images.length > 0 && (
        <SectionCard title="Vehicle Images" icon={Car} accent="green">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="block rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition aspect-video bg-gray-100">
                <img src={url} alt={`Vehicle ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
