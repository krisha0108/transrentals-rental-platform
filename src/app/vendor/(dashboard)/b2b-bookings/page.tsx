'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  Car,
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
  MessageCircle,
  Inbox,
  Clock,
  X,
  ArrowRight,
  Briefcase,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface B2BBooking {
  id: string;
  bookingNumber: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  vehiclesRequired: number;
  passengerCount: number | null;
  vehicleCategory: string | null;
  pickupLocation: string;
  dropLocation: string | null;
  tripType: string;
  scheduledDate: string;
  scheduledTime: string;
  returnDate: string | null;
  specialNotes: string | null;
  status: string;
  totalVehiclesFilled: number;
  _count: { vendorQuotes: number; trips: number };
  vendorQuotes: { id: string; status: string; vehicleCount: number }[];
  customer: { name: string; companyName: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  OPEN_FOR_QUOTES:   { label: 'Open',                color: 'bg-emerald-50 text-emerald-700',     border: 'border-emerald-200' },
  QUOTES_RECEIVED:   { label: 'Responses Received',  color: 'bg-emerald-50 text-emerald-700',   border: 'border-emerald-200' },
  SUPER_QUOTE_SENT:  { label: 'Sent to Customer',    color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  CONFIRMED:         { label: 'Confirmed',           color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  TRIPS_CREATED:     { label: 'Trips Created',       color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  IN_PROGRESS:       { label: 'In Progress',         color: 'bg-cyan-50 text-cyan-700',     border: 'border-cyan-200' },
  COMPLETED:         { label: 'Completed',           color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  CANCELLED:         { label: 'Cancelled',           color: 'bg-red-50 text-red-700',       border: 'border-red-200' },
};

const SERVICE_CONFIG: Record<string, { label: string; icon: any; color: string; badgeColor: string; borderColor: string; iconBg: string; iconText: string; flow: 'direct' | 'quote' }> = {
  car:          { label: 'Car Rental',       icon: Car,     color: 'bg-emerald-100 text-emerald-700',     badgeColor: 'bg-emerald-600 text-white',    borderColor: '#10B981', iconBg: 'bg-emerald-50',   iconText: 'text-emerald-700',   flow: 'direct' },
  'self-drive': { label: 'Self Drive',       icon: Car,     color: 'bg-sky-100 text-sky-700',       badgeColor: 'bg-sky-600 text-white',     borderColor: '#0EA5E9', iconBg: 'bg-sky-50',    iconText: 'text-sky-700',    flow: 'quote' },
  bus:          { label: 'Bus Rental',       icon: Bus,     color: 'bg-emerald-100 text-emerald-700',   badgeColor: 'bg-emerald-500 text-white',   borderColor: '#10B981', iconBg: 'bg-emerald-50',  iconText: 'text-emerald-700',  flow: 'quote' },
  truck:        { label: 'Truck Rental',     icon: Truck,   color: 'bg-red-100 text-red-700',       badgeColor: 'bg-red-600 text-white',     borderColor: '#EF4444', iconBg: 'bg-red-50',    iconText: 'text-red-700',    flow: 'quote' },
  bike:         { label: 'Bike Rental',      icon: Bike,    color: 'bg-emerald-100 text-emerald-700', badgeColor: 'bg-emerald-600 text-white', borderColor: '#10B981', iconBg: 'bg-emerald-50', iconText: 'text-emerald-700', flow: 'direct' },
  equipment:    { label: 'Equipment',        icon: Wrench,  color: 'bg-cyan-100 text-cyan-700',     badgeColor: 'bg-cyan-600 text-white',    borderColor: '#06B6D4', iconBg: 'bg-cyan-50',   iconText: 'text-cyan-700',   flow: 'quote' },
  packers:      { label: 'Packers & Movers', icon: Package, color: 'bg-pink-100 text-pink-700',     badgeColor: 'bg-pink-600 text-white',    borderColor: '#EC4899', iconBg: 'bg-pink-50',   iconText: 'text-pink-700',   flow: 'quote' },
  luxury:       { label: 'Luxury Car',       icon: Star,    color: 'bg-emerald-100 text-emerald-700', badgeColor: 'bg-emerald-500 text-white',  borderColor: '#10B981', iconBg: 'bg-emerald-50', iconText: 'text-emerald-700', flow: 'direct' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way',
  ROUND_TRIP: 'Round Trip',
  HOURLY: 'Local / Hourly',
  SELF_DRIVE: 'Self Drive',
};

function parseSelfDrivePref(notes: string | null): any {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch {
    if (notes.includes('|') || notes.includes('Preferred:')) {
      const result: any = {};
      const parts = notes.split('|').map(s => s.trim());
      for (const part of parts) {
        if (part.startsWith('Preferred:')) {
          const val = part.replace('Preferred:', '').trim();
          const words = val.split(' ');
          result.vehicleBrand = words[0] || null;
          result.vehicleModelName = words.slice(1).join(' ') || null;
        }
        if (part.startsWith('Transmission:')) result.transmission = part.replace('Transmission:', '').trim();
        if (part.startsWith('Fuel:')) result.fuelType = part.replace('Fuel:', '').trim();
        if (part.startsWith('Category:')) result.vehicleCategory = part.replace('Category:', '').trim();
        if (part.startsWith('Seats:')) result.minSeats = part.replace('Seats:', '').trim();
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    return null;
  }
}

const FILTER_TABS = [
  { value: 'all', label: 'All Services' },
  { value: 'car', label: 'Car Rental' },
  { value: 'bus', label: 'Bus' },
  { value: 'self-drive', label: 'Self Drive' },
  { value: 'truck', label: 'Truck' },
  { value: 'luxury', label: 'Luxury Car' },
];

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

export default function VendorB2BBookingsPage() {
  const [bookings, setBookings] = useState<B2BBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/b2b-quotes?view=open');
      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch B2B bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const filteredBookings = bookings.filter(b => {
    const matchesService = serviceFilter === 'all' || b.serviceType === serviceFilter;
    const matchesSearch = !searchQuery ||
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const myQuote = b.vendorQuotes?.[0];
      if (statusFilter === 'yet_to_quote') {
        matchesStatus = !myQuote;
      } else if (statusFilter === 'pending') {
        matchesStatus = myQuote?.status === 'SUBMITTED' || myQuote?.status === 'REVISED';
      } else if (statusFilter === 'confirmed') {
        matchesStatus = myQuote?.status === 'CONFIRMED' || myQuote?.status === 'ACCEPTED';
      } else if (statusFilter === 'rejected') {
        matchesStatus = myQuote?.status === 'REJECTED';
      }
    }

    return matchesService && matchesSearch && matchesStatus;
  });

  // Stats
  const yetToQuoteCount = bookings.filter(b => !b.vendorQuotes?.[0]).length;
  const pendingCount = bookings.filter(b => ['SUBMITTED', 'REVISED'].includes(b.vendorQuotes?.[0]?.status || '')).length;
  const wonCount = bookings.filter(b => ['CONFIRMED', 'ACCEPTED'].includes(b.vendorQuotes?.[0]?.status || '')).length;

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
        <div className={`h-20 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
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
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">B2B Corporate Requests</h1>
                <p className="text-teal-100 text-xs md:text-sm mt-0.5">
                  {yetToQuoteCount > 0 ? <><strong className="text-white">{yetToQuoteCount}</strong> new request{yetToQuoteCount > 1 ? 's' : ''} awaiting your quote</> : 'All caught up — bulk transport requests will appear here'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {yetToQuoteCount > 0 && (
                <button
                  onClick={() => setStatusFilter('yet_to_quote')}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-white text-teal-600 hover:bg-teal-50 transition shadow-lg shadow-black/10 active:scale-95 group"
                >
                  <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" />
                  Quote Now ({yetToQuoteCount})
                </button>
              )}
              <button
                onClick={fetchBookings}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition border border-white/20"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Action Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'all',          label: 'Total',        value: bookings.length, icon: Inbox,        color: 'teal',    action: `${bookings.length} corporate request${bookings.length !== 1 ? 's' : ''}` },
          { id: 'yet_to_quote', label: 'Yet to Quote', value: yetToQuoteCount, icon: Send,         color: 'emerald2',    action: yetToQuoteCount > 0 ? `${yetToQuoteCount} need${yetToQuoteCount === 1 ? 's' : ''} action` : 'All clear' },
          { id: 'pending',      label: 'Pending',      value: pendingCount,    icon: Clock,        color: 'emerald',   action: pendingCount > 0 ? 'Awaiting customer reply' : 'No pending quotes' },
          { id: 'confirmed',    label: 'Won',          value: wonCount,        icon: CheckCircle,  color: 'emerald', action: wonCount > 0 ? `${wonCount} confirmed booking${wonCount === 1 ? '' : 's'}` : 'No wins yet' },
        ].map((s, i) => {
          const Icon = s.icon;
          const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string; ring: string; dot: string }> = {
            teal:    { bg: 'from-teal-50/80 to-white',    iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',    border: 'border-teal-200',    ring: 'ring-teal-200',    dot: 'bg-teal-400' },
            emerald2: { bg: 'from-emerald-50/80 to-white',    iconBg: 'bg-emerald-100',    iconColor: 'text-emerald-600',    border: 'border-emerald-200',    ring: 'ring-emerald-200',    dot: 'bg-emerald-400' },
            emerald: { bg: 'from-emerald-50/80 to-white',   iconBg: 'bg-emerald-100',   iconColor: 'text-emerald-600',   border: 'border-emerald-200',   ring: 'ring-emerald-200',   dot: 'bg-emerald-400' },
            emerald: { bg: 'from-emerald-50/80 to-white', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200', dot: 'bg-emerald-400' },
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
                  {s.value > 0 && s.id === 'yet_to_quote' && (
                    <span className={cn('absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse', c.dot)} />
                  )}
                </div>
                <p className={cn('text-xs mt-1.5 font-medium truncate', s.value > 0 ? 'text-gray-600' : 'text-gray-400')}>{s.action}</p>
              </button>
            </FadeIn>
          );
        })}
      </div>

      {/* ── Filters + Search ── */}
      <FadeIn delay={250}>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 overflow-x-auto">
              {[
                { value: 'all',          label: 'All',          dot: 'bg-gradient-to-br from-teal-400 to-cyan-400' },
                { value: 'yet_to_quote', label: 'Yet to Quote', dot: 'bg-emerald-400' },
                { value: 'pending',      label: 'Pending',      dot: 'bg-emerald-400' },
                { value: 'confirmed',    label: 'Confirmed',    dot: 'bg-emerald-400' },
                { value: 'rejected',     label: 'Not Selected', dot: 'bg-red-400' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap',
                    statusFilter === tab.value
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', tab.dot)} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search booking, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          {/* Service type chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Service:</span>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setServiceFilter(tab.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95',
                  serviceFilter === tab.value
                    ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Bookings List ── */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-teal-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-teal-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-teal-100 flex items-center justify-center shadow-sm">
              <Briefcase className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <p className="text-gray-900 font-bold text-base">No B2B Requests</p>
          <p className="text-gray-400 text-sm mt-1">Corporate bookings will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredBookings.map((booking, i) => {
            const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-50 text-gray-700', border: 'border-gray-200' };
            const svcConfig = SERVICE_CONFIG[booking.serviceType] || SERVICE_CONFIG['car'];
            const SvcIcon = svcConfig.icon;
            const hasResponded = booking.vendorQuotes && booking.vendorQuotes.length > 0;
            const vendorVehicleCount = hasResponded ? booking.vendorQuotes.reduce((sum, q) => sum + q.vehicleCount, 0) : 0;
            const isSelfDrive = booking.serviceType === 'self-drive';
            const selfDrivePref = isSelfDrive ? parseSelfDrivePref(booking.specialNotes) : null;
            const actionHref = `/vendor/b2b-bookings/${booking.id}/quote`;
            const fillPercent = Math.min(((booking.totalVehiclesFilled || 0) / booking.vehiclesRequired) * 100, 100);

            return (
              <FadeIn key={booking.id} delay={300 + i * 40}>
                <div
                  className="bg-white rounded-2xl hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group h-full flex flex-col relative"
                  style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${svcConfig.borderColor}` }}
                >
                  {/* Top-right ID */}
                  <span className="absolute top-3 right-3 text-xs font-mono text-gray-400 font-bold">#{booking.bookingNumber}</span>

                  {/* ── HEADER: Company + Service + Status ── */}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm', svcConfig.iconBg)}>
                        <SvcIcon className={cn('w-5 h-5', svcConfig.iconText)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {booking.companyName || booking.customer?.companyName || booking.customerName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider border-2', svcConfig.iconBg, svcConfig.iconText, 'border-current/30')}>
                            {svcConfig.label}
                          </span>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border', statusConfig.color, statusConfig.border)}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Requirements Strip ── */}
                  <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', svcConfig.iconBg)}>
                      <SvcIcon className={cn('w-3.5 h-3.5', svcConfig.iconText)} />
                      <span className={cn('text-xs font-extrabold tabular-nums', svcConfig.iconText)}>{booking.vehiclesRequired}</span>
                      <span className={cn('text-xs font-semibold', svcConfig.iconText, 'opacity-75')}>vehicles</span>
                    </div>
                    {booking.passengerCount && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-extrabold text-emerald-700 tabular-nums">{booking.passengerCount}</span>
                        <span className="text-xs font-semibold text-emerald-600 opacity-75">pax</span>
                      </div>
                    )}
                    {!isSelfDrive && (
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}
                      </span>
                    )}
                    {isSelfDrive && selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-1 rounded-lg">
                        {[selfDrivePref.vehicleBrand, selfDrivePref.vehicleModelName].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>

                  {/* ── Trip Timeline ── */}
                  <div className="px-5 pb-3 flex-1">
                    <div className="bg-gradient-to-r from-emerald-50/40 via-gray-50/60 to-red-50/40 rounded-xl p-3 relative overflow-hidden">
                      <div className="flex items-stretch gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{isSelfDrive ? 'Location' : 'Pickup'}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 truncate">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(booking.scheduledDate)}{!isSelfDrive && booking.scheduledTime && ` · ${formatTime(booking.scheduledTime)}`}
                          </p>
                        </div>
                        {!isSelfDrive && booking.dropLocation && (
                          <>
                            <div className="flex items-center justify-center px-1">
                              <div className="relative">
                                <div className="w-10 h-0.5 bg-gray-200 rounded-full" />
                                <ArrowRight className="absolute -right-1 -top-2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center gap-1 mb-0.5 justify-end">
                                <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Drop</span>
                                <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100" />
                              </div>
                              <p className="text-sm font-bold text-gray-800 truncate">{booking.dropLocation}</p>
                            </div>
                          </>
                        )}
                        {isSelfDrive && booking.returnDate && (
                          <>
                            <div className="flex items-center justify-center px-1">
                              <div className="relative">
                                <div className="w-10 h-0.5 bg-gray-200 rounded-full" />
                                <ArrowRight className="absolute -right-1 -top-2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center gap-1 mb-0.5 justify-end">
                                <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Return</span>
                                <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100" />
                              </div>
                              <p className="text-xs font-bold text-gray-800">{formatDate(booking.returnDate)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Fill Progress ── */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 font-semibold">
                        <span className="text-gray-900 font-bold tabular-nums">{booking.totalVehiclesFilled || 0}</span> / {booking.vehiclesRequired} vehicles filled
                      </span>
                      <span className="text-gray-400 font-medium">{booking._count?.vendorQuotes || 0} vendor responses</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* ── ACTIONS ── */}
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
                          className="flex items-center gap-1 px-3 py-2 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={actionHref}
                          className="basis-3/5 flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg text-xs font-bold shadow-md shadow-teal-500/25 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Quote
                        </Link>
                        <Link
                          href={`/vendor/b2b-bookings/${booking.id}`}
                          className="basis-2/5 flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          View Details
                        </Link>
                      </>
                    )}
                    {['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(booking.status) && booking.vendorQuotes?.some(q => q.status === 'CONFIRMED') && (
                      <Link
                        href={`/vendor/chat?bookingId=${booking.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition"
                        title="Chat with customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </Link>
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
