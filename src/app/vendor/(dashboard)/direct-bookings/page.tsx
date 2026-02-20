'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Phone, Calendar, Car,
  ChevronRight, BookOpen, CheckCircle2,
  XCircle, AlertCircle, PlayCircle,
  Link2, SlidersHorizontal, X, MapPin,
} from 'lucide-react';

interface DirectBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  vehicleType: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  pickupLocation: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  paidAmount: number;
  bookingSource: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bar: string; badge: string; bg: string; icon: any }> = {
  inquiry:     { label: 'Inquiry',     bar: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200',    bg: 'bg-amber-50/40',   icon: AlertCircle },
  confirmed:   { label: 'Confirmed',   bar: 'bg-blue-500',    badge: 'text-blue-700 bg-blue-50 border-blue-200',       bg: 'bg-blue-50/30',    icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bar: 'bg-violet-500',  badge: 'text-violet-700 bg-violet-50 border-violet-200', bg: 'bg-violet-50/30',  icon: PlayCircle },
  completed:   { label: 'Completed',   bar: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', bg: 'bg-emerald-50/30', icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    bar: 'bg-red-400',     badge: 'text-red-600 bg-red-50 border-red-200',          bg: 'bg-red-50/20',     icon: XCircle },
  cancelled:   { label: 'Cancelled',   bar: 'bg-gray-300',    badge: 'text-gray-500 bg-gray-100 border-gray-200',      bg: 'bg-gray-50/40',    icon: XCircle },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Payment Pending', color: 'text-orange-500' },
  partial:     { label: 'Partial Paid',    color: 'text-amber-500' },
  collected:   { label: 'Paid',            color: 'text-emerald-600' },
  link_sent:   { label: 'Link Sent',       color: 'text-blue-500' },
  paid_online: { label: 'Paid Online',     color: 'text-emerald-600' },
  waived:      { label: 'Waived',          color: 'text-gray-400' },
};

const STATUS_TABS = [
  { key: 'all',         label: 'All',        active: 'bg-slate-700 text-white',   inactive: 'bg-white text-gray-500 border border-gray-200' },
  { key: 'inquiry',     label: 'Inquiries',  active: 'bg-amber-500 text-white',   inactive: 'bg-white text-gray-500 border border-gray-200' },
  { key: 'confirmed',   label: 'Confirmed',  active: 'bg-blue-600 text-white',    inactive: 'bg-white text-gray-500 border border-gray-200' },
  { key: 'in_progress', label: 'Active',     active: 'bg-violet-600 text-white',  inactive: 'bg-white text-gray-500 border border-gray-200' },
  { key: 'completed',   label: 'Completed',  active: 'bg-emerald-600 text-white', inactive: 'bg-white text-gray-500 border border-gray-200' },
];

const SERVICE_LABELS: Record<string, string> = {
  bike:             '🏍️ Bike',
  bus:              '🚌 Bus',
  'car-with-driver':'🚗 Car w/ Driver',
  'self-drive':     '🚙 Self Drive',
  luxury:           '✨ Luxury',
  transporter:      '🚛 Transporter',
  'packers-movers': '📦 Packers & Movers',
  equipment:        '🔧 Equipment',
  general:          '📋 General',
};

export default function DirectBookingsPage() {
  const [bookings, setBookings] = useState<DirectBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (source !== 'all') params.set('source', source);
      if (serviceFilter !== 'all') params.set('serviceType', serviceFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/vendor/direct-bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings);
    } finally {
      setLoading(false);
    }
  }, [activeTab, source, serviceFilter, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const pendingCount = bookings.filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled' && b.status !== 'rejected').length;
  const activeFilters = [source !== 'all', serviceFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setSource('all'); setServiceFilter('all'); };

  // -m-6 undoes the layout's p-6 so we can control padding ourselves
  return (
    <div className="min-h-screen -m-6 bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Direct Bookings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Your personal clients & form submissions</p>
          </div>
          <Link
            href="/vendor/direct-bookings/add"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm shadow-blue-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Booking</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Pending alert ── */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <p className="text-sm text-orange-700 flex-1">
              <strong className="font-bold">{pendingCount}</strong> booking{pendingCount > 1 ? 's' : ''} awaiting payment collection
            </p>
           
          </div>
        )}

        {/* ── Search + filter row ── */}
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or booking #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition shadow-sm ${
              showFilters || activeFilters > 0
                ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by</p>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-semibold">Service Type</label>
                <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Services</option>
                  <option value="bike">🏍️ Bike</option>
                  <option value="bus">🚌 Bus & Tempo</option>
                  <option value="car-with-driver">🚗 Car w/ Driver</option>
                  <option value="self-drive">🚙 Self Drive</option>
                  <option value="luxury">✨ Luxury</option>
                  <option value="transporter">🚛 Transporter</option>
                  <option value="packers-movers">📦 Packers & Movers</option>
                  <option value="equipment">🔧 Equipment</option>
                  <option value="general">📋 General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-semibold">Booking Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Sources</option>
                  <option value="manual">✏️ Manual Entry</option>
                  <option value="shared_form">🔗 Via Booking Form</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Status tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'all' ? bookings.length : bookings.filter(b => b.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  isActive ? tab.active : tab.inactive + ' hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Booking list ── */}
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-9 h-9 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 py-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-base">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
              {search || activeFilters > 0
                ? 'Try adjusting your search or clearing the filters'
                : 'Add a booking manually or share your form link with clients'}
            </p>
            {!search && activeFilters === 0 && activeTab === 'all' && (
              <Link href="/vendor/direct-bookings/add" className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
                <Plus className="w-4 h-4" /> Add First Booking
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bookings.map((b) => {
              const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.inquiry;
              const StatusIcon = sc.icon;
              const pc = PAYMENT_CONFIG[b.paymentStatus] ?? { label: b.paymentStatus, color: 'text-gray-400' };
              const isUrgent = b.paymentStatus === 'pending' && b.status !== 'cancelled' && b.status !== 'rejected';
              const dueAmount = b.totalAmount && b.paidAmount != null ? b.totalAmount - b.paidAmount : null;

              return (
                <Link
                  key={b.id}
                  href={`/vendor/direct-bookings/${b.id}`}
                  className={`group flex items-stretch bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-150 overflow-hidden ${sc.bg}`}
                >
                  {/* Left status bar */}
                  <div className={`w-1.5 shrink-0 ${sc.bar}`} />

                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">

                      {/* Left content */}
                      <div className="flex-1 min-w-0 space-y-2">

                        {/* Row 1: Name + badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{b.customerName}</span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${sc.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          {b.bookingSource === 'shared_form' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-semibold">
                              <Link2 className="w-3 h-3" /> Form
                            </span>
                          )}
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold animate-pulse">
                              ₹ Due
                            </span>
                          )}
                        </div>

                        {/* Row 2: Phone + service + vehicle */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {b.customerPhone}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="font-medium">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</span>
                          {b.vehicleType && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3 text-gray-400" /> {b.vehicleType}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Row 3: Date + location */}
                        {(b.pickupDate || b.pickupLocation) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            {b.pickupDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                {formatDate(b.pickupDate)}
                                {b.returnDate && <span className="text-gray-400"> → {formatDate(b.returnDate)}</span>}
                              </span>
                            )}
                            {b.pickupLocation && (
                              <>
                                {b.pickupDate && <span className="text-gray-300">·</span>}
                                <span className="flex items-center gap-1 truncate max-w-[160px]">
                                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{b.pickupLocation}</span>
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Row 4: Amount */}
                        <div className="flex items-center gap-2">
                          {b.totalAmount ? (
                            <span className="text-sm font-bold text-gray-900">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                          ) : null}
                          <span className={`text-xs font-semibold ${pc.color}`}>{pc.label}</span>
                          {b.paymentStatus === 'partial' && dueAmount && dueAmount > 0 && (
                            <span className="text-xs text-orange-500 font-medium">(₹{dueAmount.toLocaleString('en-IN')} due)</span>
                          )}
                        </div>
                      </div>

                      {/* Right: booking # + arrow */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono tracking-wide">{b.bookingNumber}</span>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
