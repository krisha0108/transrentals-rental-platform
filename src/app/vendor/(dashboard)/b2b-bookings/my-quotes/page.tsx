'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2, Car, Calendar, MapPin, RefreshCw, CheckCircle, Clock,
  AlertCircle, Users, Send, ChevronDown, Briefcase, ArrowRight, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const QUOTE_STATUS: Record<string, { label: string; color: string; border: string; icon: any; accent: string }> = {
  SUBMITTED:          { label: 'Submitted',          color: 'bg-emerald-50 text-emerald-700',     border: 'border-emerald-200',   accent: '#10B981', icon: Send },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'bg-emerald-50 text-emerald-700',   border: 'border-emerald-200',  accent: '#10B981', icon: AlertCircle },
  REVISED:            { label: 'Revised',            color: 'bg-cyan-50 text-cyan-700',     border: 'border-cyan-200',   accent: '#06B6D4', icon: Clock },
  CONFIRMED:          { label: 'Confirmed',          color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', accent: '#10B981', icon: CheckCircle },
  REJECTED:           { label: 'Not Selected',       color: 'bg-red-50 text-red-700',       border: 'border-red-200',    accent: '#EF4444', icon: XCircle },
  WITHDRAWN:          { label: 'Withdrawn',          color: 'bg-gray-50 text-gray-700',     border: 'border-gray-200',   accent: '#6B7280', icon: AlertCircle },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

function parseQuoteNotes(notes: string | null) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed.isSelfDriveQuote || parsed.isCarRentalQuote) return parsed;
    return null;
  } catch {
    return null;
  }
}

function getVehicleName(v: any) {
  if (!v) return null;
  const vehicle = v.vehicle;
  if (!vehicle) return v.vehicleName || null;
  return v.vehicleName
    || vehicle.vehicleName
    || [vehicle.brands?.name || vehicle.vehicle_models?.brands?.name, vehicle.vehicle_models?.name].filter(Boolean).join(' ')
    || vehicle.chauffeur_vehicle_categories?.name
    || null;
}

// ── Fade-in ──
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(14px)', transition: `opacity .5s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function VendorB2BMyQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/b2b-quotes?view=my');
      const data = await response.json();
      if (data.status === 'success') setQuotes(data.quotes || []);
    } catch (error) { console.error('Failed to fetch quotes:', error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Stats
  const submittedCount = quotes.filter(q => ['SUBMITTED', 'REVISED'].includes(q.status)).length;
  const confirmedCount = quotes.filter(q => q.status === 'CONFIRMED').length;
  const rejectedCount = quotes.filter(q => q.status === 'REJECTED').length;
  const totalValue = quotes.filter(q => q.status === 'CONFIRMED').reduce((s, q) => s + (q.totalPrice || 0), 0);

  const filteredQuotes = quotes.filter(q => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'submitted') return ['SUBMITTED', 'REVISED'].includes(q.status);
    if (statusFilter === 'confirmed') return q.status === 'CONFIRMED';
    if (statusFilter === 'rejected') return q.status === 'REJECTED';
    return true;
  });

  // ── Skeleton ──
  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 p-5 md:p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center gap-3.5">
            <div className={`w-12 h-12 bg-white/20 rounded-2xl ${shimmer}`} />
            <div className="space-y-2">
              <div className={`h-5 w-44 bg-white/25 rounded ${shimmer}`} />
              <div className={`h-3 w-56 bg-white/15 rounded ${shimmer}`} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-24 bg-white border border-gray-100 rounded-2xl p-4 ${shimmer}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-lg mb-2" />
              <div className="h-7 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-44 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Hero Header ── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
            <div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">My B2B Quotes</h1>
                <p className="text-teal-100 text-xs md:text-sm mt-0.5">
                  Track all your submitted quotes for corporate bookings
                </p>
              </div>
            </div>
            <button
              onClick={fetchQuotes}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition border border-white/20"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </FadeIn>

      {/* ── Action Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'all',       label: 'Total',     value: quotes.length,    icon: Briefcase,   color: 'teal',    action: `${quotes.length} quote${quotes.length !== 1 ? 's' : ''} sent` },
          { id: 'submitted', label: 'Submitted', value: submittedCount,   icon: Send,        color: 'emerald2',    action: submittedCount > 0 ? 'Awaiting customer reply' : 'No pending' },
          { id: 'confirmed', label: 'Won',       value: confirmedCount,   icon: CheckCircle, color: 'emerald', action: confirmedCount > 0 ? `${confirmedCount} confirmed` : 'No wins yet' },
          { id: 'rejected',  label: 'Rejected',  value: rejectedCount,    icon: XCircle,     color: 'red',     action: rejectedCount > 0 ? 'Not selected' : 'None rejected' },
        ].map((s, i) => {
          const Icon = s.icon;
          const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string; ring: string }> = {
            teal:    { bg: 'from-teal-50/80 to-white',    iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',    border: 'border-teal-200',    ring: 'ring-teal-200' },
            emerald2: { bg: 'from-emerald-50/80 to-white',    iconBg: 'bg-emerald-100',    iconColor: 'text-emerald-600',    border: 'border-emerald-200',    ring: 'ring-emerald-200' },
            emerald: { bg: 'from-emerald-50/80 to-white', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200' },
            red:     { bg: 'from-red-50/80 to-white',     iconBg: 'bg-red-100',     iconColor: 'text-red-600',     border: 'border-red-200',     ring: 'ring-red-200' },
          };
          const c = colorMap[s.color];
          const isActive = statusFilter === s.id;
          return (
            <FadeIn key={s.label} delay={60 + i * 50}>
              <button
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  'w-full text-left bg-gradient-to-br rounded-2xl border px-4 py-3 transition-all duration-300 group relative overflow-hidden',
                  c.bg,
                  s.value === 0 ? 'border-gray-100 opacity-75 hover:opacity-100' : c.border,
                  'hover:shadow-lg hover:-translate-y-0.5',
                  isActive && `ring-2 ${c.ring} shadow-md opacity-100`
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0', c.iconBg, c.iconColor, s.value === 0 && 'opacity-50 grayscale')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">{s.value}</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                </div>
                <p className={cn('text-[11px] mt-1.5 font-medium truncate', s.value > 0 ? 'text-gray-600' : 'text-gray-400')}>{s.action}</p>
              </button>
            </FadeIn>
          );
        })}
      </div>

      {/* Won Value Banner */}
      {totalValue > 0 && (
        <FadeIn delay={250}>
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white border border-emerald-100 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/25">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Won Value</p>
              <p className="text-xl font-extrabold text-emerald-700 tabular-nums">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            <span className="text-sm font-bold text-emerald-600">{confirmedCount} confirmed</span>
          </div>
        </FadeIn>
      )}

      {/* ── Quotes List ── */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-teal-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-teal-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-teal-100 flex items-center justify-center shadow-sm">
              <Send className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <p className="text-gray-900 font-bold text-base">No Quotes Yet</p>
          <p className="text-gray-400 text-sm mt-1">Submit quotes on open B2B requests to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote: any, idx: number) => {
            const statusConfig = QUOTE_STATUS[quote.status] || { label: quote.status, color: 'bg-gray-50 text-gray-700', border: 'border-gray-200', accent: '#6B7280', icon: AlertCircle };
            const StatusIcon = statusConfig.icon;
            const sdDetails = parseQuoteNotes(quote.notes);
            const isExpanded = expandedQuotes[quote.id];
            const isWon = quote.status === 'CONFIRMED';
            const isLost = quote.status === 'REJECTED';

            return (
              <FadeIn key={quote.id} delay={300 + idx * 40}>
                <div
                  className={cn(
                    'bg-white rounded-2xl overflow-hidden hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group relative',
                    isLost && 'opacity-80 hover:opacity-100'
                  )}
                  style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${statusConfig.accent}` }}
                >
                  {/* Top-right ID */}
                  <span className="absolute top-3 right-3 text-[11px] font-mono text-gray-400 font-bold">{quote.quoteNumber}</span>

                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Header */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm border border-teal-100">
                          <Building2 className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-900 truncate">{quote.booking.companyName || 'Corporate Booking'}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border-2', statusConfig.color, statusConfig.border)}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                            <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {quote.booking.serviceType === 'self-drive' ? 'Self Drive' : quote.booking.serviceType}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">{TRIP_TYPE_LABELS[quote.booking.tripType] || quote.booking.tripType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price */}
                      <div className="text-right shrink-0 mr-6">
                        <p className={cn('text-2xl font-extrabold tabular-nums leading-none', isWon ? 'text-emerald-600' : 'text-teal-700')}>
                          ₹{quote.totalPrice.toLocaleString('en-IN')}
                        </p>
                        {quote.pricePerVehicle && (
                          <p className="text-[11px] text-gray-500 mt-0.5">₹{quote.pricePerVehicle.toLocaleString('en-IN')}/vehicle</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trip + Date strip */}
                  <div className="px-5 pb-3 flex items-center gap-3 flex-wrap text-xs">
                    <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      {quote.booking.pickupLocation}
                      {quote.booking.dropLocation && (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-400 mx-0.5" />
                          {quote.booking.dropLocation}
                        </>
                      )}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {formatDate(quote.booking.scheduledDate)}
                    </span>
                  </div>

                  {/* Vehicles */}
                  <div className="px-5 pb-3">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Your Vehicles · <span className="text-gray-900">{quote.vehicleCount}</span> of <span className="text-gray-900">{quote.booking.vehiclesRequired}</span> required
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {quote.quoteVehicles?.map((v: any, i: number) => {
                        const vName = getVehicleName(v);
                        const vNumber = v.vehicleNumber || v.vehicle?.registrationNumber || null;
                        return (
                          <div key={v.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                              <Car className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">{vName || 'Vehicle ' + (i + 1)}</p>
                              {vNumber && <p className="text-[10px] text-gray-500">{vNumber}</p>}
                            </div>
                            {v.driverName && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5 shrink-0">
                                <Users className="w-2.5 h-2.5" />{v.driverName}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer: timestamp + expand toggle */}
                  <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-400 font-medium">Submitted {formatDate(quote.createdAt)}</p>
                    {sdDetails && (
                      <button
                        onClick={() => setExpandedQuotes(prev => ({ ...prev, [quote.id]: !prev[quote.id] }))}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition active:scale-95"
                      >
                        {isExpanded ? 'Hide' : 'View'} Details
                        <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    )}
                  </div>

                  {/* Expanded Quote Details */}
                  {sdDetails && isExpanded && (
                    <div className="px-5 pb-4 pt-2 border-t border-gray-100 bg-gray-50/30 space-y-3">
                      {/* Pricing Grid */}
                      {sdDetails.isSelfDriveQuote && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3">
                          <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Per Vehicle ({sdDetails.rentalDays}d)</div>
                            <div className="font-extrabold text-teal-800 tabular-nums mt-0.5">₹{sdDetails.pricePerVehicle?.toLocaleString('en-IN')}</div>
                            {sdDetails.dailyRate > 0 && <div className="text-[10px] text-teal-500">₹{sdDetails.dailyRate?.toLocaleString('en-IN')}/day</div>}
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Deposit</div>
                            <div className="font-extrabold text-emerald-800 tabular-nums mt-0.5">₹{sdDetails.securityDeposit?.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-emerald-500">Refundable</div>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">KM Limit</div>
                            <div className="font-extrabold text-gray-800 tabular-nums mt-0.5">{sdDetails.kmLimitPerDay} km/day</div>
                            <div className="text-[10px] text-gray-500">Extra ₹{sdDetails.extraKmRate}/km</div>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Advance ({sdDetails.advancePercent}%)</div>
                            <div className="font-extrabold text-emerald-800 tabular-nums mt-0.5">₹{sdDetails.advanceAmount?.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-emerald-500">Valid {sdDetails.validityDays}d</div>
                          </div>
                        </div>
                      )}

                      {(sdDetails.deliveryCharges > 0 || sdDetails.pickupCharges > 0) && (
                        <div className="flex gap-3 text-[11px] text-gray-500">
                          {sdDetails.deliveryCharges > 0 && <span>Delivery: ₹{sdDetails.deliveryCharges?.toLocaleString('en-IN')}</span>}
                          {sdDetails.pickupCharges > 0 && <span>Pickup: ₹{sdDetails.pickupCharges?.toLocaleString('en-IN')}</span>}
                        </div>
                      )}

                      {sdDetails.inclusions?.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-emerald-700 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3" /> Inclusions
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {sdDetails.inclusions.map((item: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] border border-emerald-100 font-medium">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sdDetails.exclusions?.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-red-600 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                            <XCircle className="w-3 h-3" /> Exclusions
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {sdDetails.exclusions.map((item: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[11px] border border-red-100 font-medium">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sdDetails.termsConditions?.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Terms & Conditions</div>
                          <div className="space-y-1">
                            {sdDetails.termsConditions.map((item: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                                <span className="text-gray-400 font-bold shrink-0">{i + 1}.</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sdDetails.vendorMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          <p className="text-[11px] text-emerald-800 leading-relaxed">{sdDetails.vendorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plain text notes */}
                  {quote.notes && !sdDetails && (
                    <div className="px-5 pb-3">
                      <p className="text-[11px] text-gray-500 italic bg-gray-50 rounded-lg p-2.5 border border-gray-100">{quote.notes}</p>
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
