'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  Users,
  Send,
  ChevronRight,
  CheckCircle,
  Bus,
  Bike,
  Truck,
  Wrench,
  Package,
  Star,
  Inbox,
  Clock,
  X,
  Sparkles,
  PartyPopper,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkBooking {
  id: string;
  bookingNumber: string;
  companyName: string | null;
  customerName: string;
  customerPhone: string;
  serviceType: string; // 'CUSTOM_BULK'
  vehiclesRequired: number;
  passengerCount: number | null;
  vehicleCategory: string | null; // comma-separated services list
  pickupLocation: string;
  scheduledDate: string;
  scheduledTime: string;
  returnDate: string | null;
  returnTime: string | null;
  specialNotes: string | null;
  bulkBreakdown: string | null; // JSON string
  status: string;
  totalVehiclesFilled: number;
  _count: { vendorQuotes: number; trips: number };
  vendorQuotes: { id: string; status: string; vehicleCount: number }[];
  customer: { name: string; companyName: string | null };
  createdAt: string;
}

// Parsed event-plan summary from the bulkBreakdown JSON.
interface EventSummary {
  occasionType: string | null;
  occasionName: string | null;
  totalDays: number | null;
  totalPeople: number | null;
  servicesUsed: string[];
  baseLocationSlug: string | null;
}

// Status pill colors mirror the regular B2B page so vendors aren't surprised.
const STATUS_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  OPEN_FOR_QUOTES:   { label: 'Open',               color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  QUOTES_RECEIVED:   { label: 'Responses Received', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  SUPER_QUOTE_SENT:  { label: 'Sent to Customer',   color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  CONFIRMED:         { label: 'Confirmed',          color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  TRIPS_CREATED:     { label: 'Trips Created',      color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  IN_PROGRESS:       { label: 'In Progress',        color: 'bg-cyan-50 text-cyan-700',       border: 'border-cyan-200' },
  COMPLETED:         { label: 'Completed',          color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  CANCELLED:         { label: 'Cancelled',          color: 'bg-red-50 text-red-700',         border: 'border-red-200' },
};

const SERVICE_ICON: Record<string, { Icon: any; cls: string }> = {
  car:          { Icon: Car,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'self-drive': { Icon: Car,     cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  bus:          { Icon: Bus,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  truck:        { Icon: Truck,   cls: 'bg-red-50 text-red-700 border-red-200' },
  bike:         { Icon: Bike,    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  equipment:    { Icon: Wrench,  cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  packers:      { Icon: Package, cls: 'bg-pink-50 text-pink-700 border-pink-200' },
  luxury:       { Icon: Star,    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function parseBulkBreakdown(raw: string | null): EventSummary {
  if (!raw) return { occasionType: null, occasionName: null, totalDays: null, totalPeople: null, servicesUsed: [], baseLocationSlug: null };
  try {
    const j = JSON.parse(raw);
    const servicesUsed = Array.isArray(j.services_used)
      ? j.services_used.map((s: any) => String(s))
      : (Array.isArray(j.days) ? Array.from(new Set(j.days.flatMap((d: any) => (d.services || []).map((s: any) => s.service_type)))) : []);
    return {
      occasionType: j.occasion_type ?? null,
      occasionName: j.occasion_name ?? null,
      totalDays: typeof j.total_days === 'number' ? j.total_days : (j.total_days ? parseInt(j.total_days) : null),
      totalPeople: typeof j.total_people === 'number' ? j.total_people : (j.total_people ? parseInt(j.total_people) : null),
      servicesUsed: servicesUsed.filter(Boolean),
      baseLocationSlug: j.base_location_slug ?? null,
    };
  } catch {
    return { occasionType: null, occasionName: null, totalDays: null, totalPeople: null, servicesUsed: [], baseLocationSlug: null };
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// IntersectionObserver-based fade-in, identical pattern to the B2B page.
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

export default function VendorBulkBookingsPage() {
  const [bookings, setBookings] = useState<BulkBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/b2b-quotes?view=open&serviceType=CUSTOM_BULK');
      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bulk bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filteredBookings = bookings.filter(b => {
    const summary = parseBulkBreakdown(b.bulkBreakdown);
    const hay = `${b.bookingNumber} ${b.pickupLocation} ${summary.occasionName ?? ''} ${summary.occasionType ?? ''}`.toLowerCase();
    if (searchQuery && !hay.includes(searchQuery.toLowerCase())) return false;

    if (statusFilter !== 'all') {
      const myQuote = b.vendorQuotes?.[0];
      if (statusFilter === 'yet_to_quote') return !myQuote;
      if (statusFilter === 'pending') return myQuote?.status === 'SUBMITTED' || myQuote?.status === 'REVISED';
      if (statusFilter === 'confirmed') return myQuote?.status === 'CONFIRMED' || myQuote?.status === 'ACCEPTED';
      if (statusFilter === 'rejected') return myQuote?.status === 'REJECTED';
    }
    return true;
  });

  const yetToQuoteCount = bookings.filter(b => !b.vendorQuotes?.[0]).length;
  const pendingCount = bookings.filter(b => ['SUBMITTED', 'REVISED'].includes(b.vendorQuotes?.[0]?.status || '')).length;
  const wonCount = bookings.filter(b => ['CONFIRMED', 'ACCEPTED'].includes(b.vendorQuotes?.[0]?.status || '')).length;

  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-4">
        <div className={`h-28 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl ${shimmer}`} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-24 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-52 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Header — purple/indigo to differentiate from regular B2B (teal) */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-5 md:p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Bulk / Event Bookings</h1>
                <p className="text-indigo-100 text-xs md:text-sm mt-0.5">
                  {yetToQuoteCount > 0
                    ? <><strong className="text-white">{yetToQuoteCount}</strong> multi-day event{yetToQuoteCount > 1 ? 's' : ''} awaiting your quote</>
                    : 'All caught up — weddings, corporate events & tours will appear here'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchBookings}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition border border-white/20"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'all',          label: 'Total',        value: bookings.length, icon: Inbox,        color: 'indigo'  },
          { id: 'yet_to_quote', label: 'Yet to Quote', value: yetToQuoteCount, icon: Send,         color: 'purple'  },
          { id: 'pending',      label: 'Pending',      value: pendingCount,    icon: Clock,        color: 'amber'   },
          { id: 'confirmed',    label: 'Won',          value: wonCount,        icon: CheckCircle,  color: 'emerald' },
        ].map((s, i) => {
          const Icon = s.icon;
          const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string; ring: string }> = {
            indigo:  { bg: 'from-indigo-50/80 to-white',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  border: 'border-indigo-200',  ring: 'ring-indigo-200' },
            purple:  { bg: 'from-purple-50/80 to-white',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  border: 'border-purple-200',  ring: 'ring-purple-200' },
            amber:   { bg: 'from-amber-50/80 to-white',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   border: 'border-amber-200',   ring: 'ring-amber-200' },
            emerald: { bg: 'from-emerald-50/80 to-white', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200' },
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
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                </div>
              </button>
            </FadeIn>
          );
        })}
      </div>

      {/* Filters */}
      <FadeIn delay={250}>
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 overflow-x-auto">
              {[
                { value: 'all',          label: 'All' },
                { value: 'yet_to_quote', label: 'Yet to Quote' },
                { value: 'pending',      label: 'Pending' },
                { value: 'confirmed',    label: 'Confirmed' },
                { value: 'rejected',     label: 'Not Selected' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                    statusFilter === tab.value
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search booking, occasion, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-purple-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-purple-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-purple-100 flex items-center justify-center shadow-sm">
              <PartyPopper className="w-7 h-7 text-purple-400" />
            </div>
          </div>
          <p className="text-gray-900 font-bold text-base">No Bulk Bookings</p>
          <p className="text-gray-400 text-sm mt-1">Wedding, corporate & multi-day event requests will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredBookings.map((booking, i) => {
            const summary = parseBulkBreakdown(booking.bulkBreakdown);
            const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-50 text-gray-700', border: 'border-gray-200' };
            const hasResponded = booking.vendorQuotes && booking.vendorQuotes.length > 0;
            const vendorVehicleCount = hasResponded ? booking.vendorQuotes.reduce((sum, q) => sum + q.vehicleCount, 0) : 0;
            const fillPercent = Math.min(((booking.totalVehiclesFilled || 0) / booking.vehiclesRequired) * 100, 100);
            // Comma list from b2b_bookings.vehicleCategory is the canonical source
            // of "services involved"; fall back to bulkBreakdown.services_used.
            const services = (booking.vehicleCategory || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            const allServices = services.length > 0 ? services : summary.servicesUsed;

            return (
              <FadeIn key={booking.id} delay={300 + i * 40}>
                <div
                  className="bg-white rounded-2xl hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group h-full flex flex-col relative"
                  style={{ border: '1px solid #e8e8ee', borderLeft: '3px solid #7c3aed' }}
                >
                  <span className="absolute top-3 right-3 text-xs font-mono text-gray-400 font-bold">#{booking.bookingNumber}</span>

                  {/* Header */}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm bg-purple-50">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {summary.occasionName || booking.companyName || booking.customerName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {summary.occasionType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              {summary.occasionType}
                            </span>
                          )}
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border', statusConfig.color, statusConfig.border)}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50">
                      <Car className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-extrabold text-indigo-700 tabular-nums">{booking.vehiclesRequired}</span>
                      <span className="text-xs font-semibold text-indigo-600 opacity-75">vehicles</span>
                    </div>
                    {(summary.totalDays || booking.returnDate) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-extrabold text-purple-700 tabular-nums">{summary.totalDays ?? '—'}</span>
                        <span className="text-xs font-semibold text-purple-600 opacity-75">days</span>
                      </div>
                    )}
                    {(summary.totalPeople ?? booking.passengerCount) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-extrabold text-emerald-700 tabular-nums">{summary.totalPeople ?? booking.passengerCount}</span>
                        <span className="text-xs font-semibold text-emerald-600 opacity-75">pax</span>
                      </div>
                    )}
                  </div>

                  {/* Services involved chips */}
                  {allServices.length > 0 && (
                    <div className="px-5 pb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Services Needed</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {allServices.map(svc => {
                          const cfg = SERVICE_ICON[svc] || { Icon: Car, cls: 'bg-gray-50 text-gray-700 border-gray-200' };
                          const SvcIcon = cfg.Icon;
                          return (
                            <span key={svc} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border capitalize', cfg.cls)}>
                              <SvcIcon className="w-3 h-3" />
                              {svc.replace('-', ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Event window */}
                  <div className="px-5 pb-3 flex-1">
                    <div className="bg-gradient-to-r from-purple-50/40 via-gray-50/60 to-indigo-50/40 rounded-xl p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-100" />
                            <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Starts</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800">{formatDate(booking.scheduledDate)}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{booking.pickupLocation}</span>
                          </p>
                        </div>
                        {booking.returnDate && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-0.5 justify-end">
                              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Ends</span>
                              <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
                            </div>
                            <p className="text-sm font-bold text-gray-800">{formatDate(booking.returnDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fill progress */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 font-semibold">
                        <span className="text-gray-900 font-bold tabular-nums">{booking.totalVehiclesFilled || 0}</span> / {booking.vehiclesRequired} vehicles filled
                      </span>
                      <span className="text-gray-400 font-medium">{booking._count?.vendorQuotes || 0} vendor responses</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions — both routes hit the same B2B detail/quote pages */}
                  <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-2">
                    {hasResponded ? (
                      <>
                        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-700 leading-tight">Quote Sent</p>
                            <p className="text-xs text-emerald-600">{vendorVehicleCount} vehicles</p>
                          </div>
                        </div>
                        <Link
                          href={`/vendor/b2b-bookings/${booking.id}`}
                          className="flex items-center gap-1 px-3 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/vendor/b2b-bookings/${booking.id}/quote`}
                          className="basis-3/5 flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-500/25 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Quote
                        </Link>
                        <Link
                          href={`/vendor/b2b-bookings/${booking.id}`}
                          className="basis-2/5 flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          View Plan
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
