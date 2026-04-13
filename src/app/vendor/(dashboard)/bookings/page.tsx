'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  MapPin,
  User,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  Search,
  Eye,
  Send,
  X,
  Clock,
  CalendarCheck,
  Inbox,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleType: string;
  vehicleName: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  tripType: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
  amount: number;
  quotedAmount?: number;
  createdAt: string;
  notes?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string; border: string }> = {
  pending: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Pending', border: '#10B981' },
  quoted: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Quote Sent', border: '#3B82F6' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmed', border: '#10B981' },
  ongoing: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Ongoing', border: '#10B981' },
  completed: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Completed', border: '#6B7280' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled', border: '#EF4444' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected', border: '#EF4444' },
};

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

export default function VendorBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'none' | 'today' | 'tomorrow' | 'high-budget'>('none');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/vendor/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedBooking || !quoteAmount) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/vendor/bookings/${selectedBooking.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          notes: quoteNotes,
        }),
      });

      if (response.ok) {
        fetchBookings();
        setShowQuoteModal(false);
        setSelectedBooking(null);
        setQuoteAmount('');
        setQuoteNotes('');
      }
    } catch (error) {
      console.error('Failed to send quote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to accept booking:', error);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to complete booking:', error);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'quoted', label: 'Quoted', count: bookings.filter(b => b.status === 'quoted').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'ongoing', label: 'Ongoing', count: bookings.filter(b => b.status === 'ongoing').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'all', label: 'All', count: bookings.length },
  ];

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const isTomorrow = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date(); t.setDate(t.getDate() + 1);
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const highBudgetThreshold = 5000;

  const filteredBookings = bookings.filter(booking => {
    const matchesTab = activeTab === 'all' || booking.status === activeTab;
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuick =
      quickFilter === 'none' ? true :
      quickFilter === 'today' ? isToday(booking.pickupDate) :
      quickFilter === 'tomorrow' ? isTomorrow(booking.pickupDate) :
      quickFilter === 'high-budget' ? (booking.amount || booking.quotedAmount || 0) >= highBudgetThreshold : true;
    return matchesTab && matchesSearch && matchesQuick;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Stats
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const quotedCount = bookings.filter(b => b.status === 'quoted').length;
  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  // ── Skeleton ──
  if (loading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center gap-3.5">
            <div className={`w-11 h-11 bg-white/20 rounded-xl ${shimmer}`} />
            <div className="space-y-2">
              <div className={`h-5 w-44 bg-white/25 rounded ${shimmer}`} />
              <div className={`h-3 w-56 bg-white/15 rounded ${shimmer}`} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-24 bg-white border border-gray-100 rounded-2xl p-4 ${shimmer}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-2" />
              <div className="h-7 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className={`h-14 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-32 bg-white border border-gray-100 rounded-2xl ${shimmer}`} />
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
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Booking Requests</h1>
                <p className="text-emerald-100 text-xs md:text-sm mt-0.5">
                  {pendingCount > 0 ? <>You have <strong className="text-white">{pendingCount}</strong> request{pendingCount > 1 ? 's' : ''} awaiting your response</> : 'All caught up — no pending requests'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <button
                  onClick={() => { setActiveTab('pending'); setQuickFilter('none'); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 transition shadow-lg shadow-black/10 active:scale-95 group"
                >
                  <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" />
                  Respond to Pending ({pendingCount})
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
          { id: 'pending',   label: 'Pending',   value: pendingCount,   icon: AlertCircle,   color: 'emerald',   action: pendingCount > 0   ? `${pendingCount} request${pendingCount > 1 ? 's' : ''} need action` : 'All clear' },
          { id: 'quoted',    label: 'Quoted',    value: quotedCount,    icon: Send,          color: 'blue',    action: quotedCount > 0    ? 'Waiting for customer' : 'No pending quotes' },
          { id: 'confirmed', label: 'Active',    value: activeCount,    icon: CheckCircle,   color: 'emerald', action: activeCount > 0    ? `${activeCount} ongoing trip${activeCount > 1 ? 's' : ''}` : 'No active trips' },
          { id: 'completed', label: 'Completed', value: completedCount, icon: CalendarCheck, color: 'gray',    action: `${completedCount} total finished` },
        ].map((s, i) => {
          const Icon = s.icon;
          const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string; ring: string; dot: string }> = {
            emerald: { bg: 'from-emerald-50/80 to-white',   iconBg: 'bg-emerald-100',   iconColor: 'text-emerald-600',   border: 'border-emerald-200',   ring: 'ring-emerald-200',   dot: 'bg-emerald-400' },
            blue:    { bg: 'from-emerald-50/80 to-white',    iconBg: 'bg-emerald-100',    iconColor: 'text-emerald-600',    border: 'border-emerald-200',    ring: 'ring-emerald-200',    dot: 'bg-emerald-400' },
            emerald: { bg: 'from-emerald-50/80 to-white', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200', dot: 'bg-emerald-400' },
            gray:    { bg: 'from-gray-50 to-white',       iconBg: 'bg-gray-100',    iconColor: 'text-gray-600',    border: 'border-gray-200',    ring: 'ring-gray-200',    dot: 'bg-gray-400' },
          };
          const c = colorMap[s.color];
          const isActive = activeTab === s.id;
          return (
            <FadeIn key={s.label} delay={60 + i * 50}>
              <button
                onClick={() => { setActiveTab(s.id); setQuickFilter('none'); }}
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
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                  {s.value > 0 && s.id === 'pending' && (
                    <span className={cn('absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse', c.dot)} />
                  )}
                </div>
                <p className={cn('text-[10px] mt-1.5 font-medium truncate', s.value > 0 ? 'text-gray-600' : 'text-gray-400')}>{s.action}</p>
              </button>
            </FadeIn>
          );
        })}
      </div>

      {/* ── Smart Filters + Search ── */}
      <FadeIn delay={250}>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 overflow-x-auto">
              {tabs.map((tab) => {
                const tabColors: Record<string, string> = {
                  pending: 'bg-emerald-400', quoted: 'bg-emerald-400', confirmed: 'bg-emerald-400', ongoing: 'bg-emerald-400', completed: 'bg-gray-400', all: 'bg-gradient-to-br from-emerald-400 to-teal-400',
                };
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', tabColors[tab.id])} />
                    {tab.label}
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center',
                      activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200/60 text-gray-500'
                    )}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, vehicle, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          {/* Quick chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Quick filters:</span>
            {[
              { id: 'none',         label: 'All',          icon: null,        color: 'bg-gray-100 text-gray-600 border-gray-200' },
              { id: 'today',        label: 'Today',        icon: Calendar,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { id: 'tomorrow',     label: 'Tomorrow',     icon: Calendar,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { id: 'high-budget',  label: 'High Budget',  icon: IndianRupee, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((c) => {
              const Icon = c.icon;
              const isActive = quickFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setQuickFilter(c.id as typeof quickFilter)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95',
                    isActive
                      ? `${c.color} ring-2 ring-offset-1 ring-current/20 shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── Bookings List ── */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm">
              <Inbox className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <p className="text-gray-900 font-bold text-base">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'all' ? "You don't have any bookings yet." : `No ${activeTab} bookings at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredBookings.map((booking, i) => {
            const sc = statusColors[booking.status];
            const budget = booking.quotedAmount || booking.amount || 0;
            const isHigh = budget >= highBudgetThreshold;
            const isPickupToday = isToday(booking.pickupDate);
            return (
              <FadeIn key={booking.id} delay={300 + i * 40}>
                <div
                  className="bg-white rounded-2xl hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group h-full flex flex-col"
                  style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${sc.border}` }}
                >
                  {/* ── Top-right ID ── */}
                  <span className="absolute top-3 right-3 text-[10px] font-mono text-gray-400 font-bold tracking-tight">#{booking.bookingNumber}</span>

                  {/* ── Z TOP: Customer + Status | Budget ── */}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-base font-extrabold shadow-sm shadow-emerald-500/30 ring-2 ring-white border border-emerald-200/40">
                          {booking.customerName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{booking.customerName}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border-2', sc.bg, sc.text, {
                            'border-emerald-300': booking.status === 'pending',
                            'border-emerald-300': booking.status === 'quoted',
                            'border-emerald-300': booking.status === 'confirmed',
                            'border-emerald-300': booking.status === 'ongoing',
                            'border-gray-300': booking.status === 'completed',
                            'border-red-300': booking.status === 'cancelled' || booking.status === 'rejected',
                          })}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {sc.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {budget > 0 && (() => {
                      const tier = budget >= 5000 ? 'high' : budget >= 2000 ? 'fair' : 'low';
                      const tierStyle = {
                        high: { box: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200', text: 'text-emerald-700', label: 'Above avg', labelColor: 'text-emerald-600' },
                        fair: { box: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Fair price', labelColor: 'text-emerald-500' },
                        low:  { box: 'bg-gray-50 border-gray-100', text: 'text-gray-800', label: 'Below avg', labelColor: 'text-gray-400' },
                      }[tier];
                      return (
                        <div className={cn('shrink-0 px-3 py-1.5 rounded-xl text-right border mr-6', tierStyle.box)}>
                          <div className="flex items-center gap-1 justify-end">
                            {tier === 'high' && <span className="text-xs">🔥</span>}
                            <p className={cn('text-lg font-extrabold tabular-nums leading-none', tierStyle.text)}>
                              ₹{budget.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-0.5 font-semibold uppercase tracking-wider">
                            {booking.quotedAmount ? 'Your Quote' : 'Budget'}
                          </p>
                          <p className={cn('text-[9px] mt-0.5 font-bold', tierStyle.labelColor)}>{tierStyle.label}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── MID: Vehicle + Trip Type ── */}
                  <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg">
                      <Car className="w-3 h-3 text-gray-400" />
                      <span className="font-semibold">{booking.vehicleName || booking.vehicleType}</span>
                    </div>
                    {booking.tripType && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {booking.tripType}
                      </span>
                    )}
                    {isPickupToday && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                        <Clock className="w-2.5 h-2.5" /> TODAY
                      </span>
                    )}
                  </div>

                  {/* ── Trip Timeline (Pickup → Drop) ── */}
                  <div className="px-5 pb-4 flex-1">
                    <div className="bg-gradient-to-r from-emerald-50/40 via-gray-50/60 to-red-50/40 rounded-xl p-3.5 relative overflow-hidden">
                      <div className="flex items-stretch gap-3">
                        {/* Pickup */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                            <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Pickup</span>
                          </div>
                          <p className="text-xs font-bold text-gray-800 truncate">{booking.pickupLocation}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(booking.pickupDate)} · {booking.pickupTime}
                          </p>
                        </div>
                        {/* Arrow */}
                        <div className="flex items-center justify-center px-1">
                          <div className="relative">
                            <div className="w-10 h-0.5 bg-gray-200 rounded-full" />
                            <ArrowRight className="absolute -right-1 -top-2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        {/* Drop */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-1 mb-1 justify-end">
                            <span className="text-[9px] text-red-700 font-bold uppercase tracking-wider">Drop</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100" />
                          </div>
                          <p className="text-xs font-bold text-gray-800 truncate">{booking.dropLocation || booking.pickupLocation}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 justify-end">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(booking.dropDate)} · {booking.dropTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── BOTTOM: Actions ── */}
                  <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowQuoteModal(true);
                          }}
                          className="basis-3/5 flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/25 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Quote
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="basis-2/5 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleMarkComplete(booking.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/25 transition active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                    )}
                    {!['pending', 'confirmed'].includes(booking.status) && (
                      <div className="flex-1 text-[11px] text-gray-400 italic">No action required</div>
                    )}
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center group/btn transition"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-emerald-500 transition-colors" />
                    </button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}

      {/* ── Quote Modal ── */}
      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Send Quote</h2>
              </div>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedBooking(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Booking</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">#{selectedBooking.bookingNumber}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedBooking.customerName} · {selectedBooking.vehicleType}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Quote Amount (₹) *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none text-lg font-bold tabular-nums transition"
                    placeholder="Enter your quote"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes (optional)</label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none transition resize-none"
                  placeholder="Add any notes or terms..."
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2.5">
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedBooking(null);
                }}
                className="flex-1 h-11 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuote}
                disabled={!quoteAmount || submitting}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/25 disabled:opacity-50 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
