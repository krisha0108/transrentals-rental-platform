// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Loader2, Users, Clock, IndianRupee, RefreshCw, ChevronRight, MapPin, CheckCircle2, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CustomerAvatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'C';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; pill: string }> = {
  PAYMENT_PENDING:   { label: 'Payment Pending',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',     dot: 'bg-emerald-400',   pill: 'bg-emerald-100' },
  PAYMENT_SUBMITTED: { label: 'Under Review',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400',  pill: 'bg-emerald-100' },
  CONFIRMED:         { label: 'Confirmed',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', pill: 'bg-emerald-100' },
  GUIDE_ASSIGNED:    { label: 'Guide Assigned',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',       dot: 'bg-emerald-500',    pill: 'bg-emerald-100' },
  STARTED:           { label: 'In Progress',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500',  pill: 'bg-emerald-100' },
  COMPLETED:         { label: 'Completed',           cls: 'bg-teal-50 text-teal-700 border-teal-200',       dot: 'bg-teal-500',    pill: 'bg-teal-100' },
  CANCELLED:         { label: 'Cancelled',           cls: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-400',     pill: 'bg-red-100' },
  DROPPED:           { label: 'Dropped',             cls: 'bg-gray-50 text-gray-400 border-gray-200',       dot: 'bg-gray-300',    pill: 'bg-gray-100' },
};

const TABS = [
  { key: 'all',               label: 'All' },
  { key: 'PAYMENT_PENDING',   label: 'Pending Payment' },
  { key: 'PAYMENT_SUBMITTED', label: 'Under Review' },
  { key: 'CONFIRMED',         label: 'Confirmed' },
  { key: 'COMPLETED',         label: 'Completed' },
];

export default function VendorWanderBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [total, setTotal]       = useState(0);

  const fetchBookings = async (status: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/vendor/wander/bookings?status=${status}&limit=50`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(tab); }, [tab]);

  const totalRevenue = bookings
    .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const confirmed  = bookings.filter(b => ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED'].includes(b.status)).length;
  const completed  = bookings.filter(b => b.status === 'COMPLETED').length;
  const pending    = bookings.filter(b => b.status === 'PAYMENT_PENDING').length;

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-dvh">

      {/* ── Dark Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                <CalendarCheck className="w-3 h-3" /> Wander Tours
              </span>
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">Wander Bookings</h1>
            <p className="text-emerald-100/70 text-sm">{total} booking{total !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => fetchBookings(tab)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition text-sm font-medium flex-shrink-0 mt-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Bookings',      value: total,                                  icon: CalendarCheck, iconBg: 'bg-white/10',         iconColor: 'text-emerald-200',   valColor: 'text-white' },
            { label: 'Confirmed / Active',  value: confirmed,                              icon: CheckCircle2,  iconBg: 'bg-white/15',     iconColor: 'text-emerald-200',   valColor: 'text-emerald-200' },
            { label: 'Completed',           value: completed,                              icon: TrendingUp,    iconBg: 'bg-teal-500/20',      iconColor: 'text-teal-400',    valColor: 'text-teal-300' },
            { label: 'Revenue (confirmed)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: Wallet,   iconBg: 'bg-emerald-500/20',     iconColor: 'text-emerald-400',   valColor: 'text-emerald-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{m.label}</p>
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${m.valColor} leading-none`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Toolbar ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 sticky top-[57px] z-20 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-44 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-400 font-medium">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <CalendarCheck className="w-8 h-8 text-emerald-200" />
            </div>
            <p className="font-bold text-gray-800 mb-1 text-base">No bookings found</p>
            <p className="text-gray-400 text-sm">
              {tab === 'all'
                ? 'Bookings appear here once a customer accepts your quote'
                : `No bookings with "${TABS.find(t2 => t2.key === tab)?.label}" status`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1.2fr_auto] gap-4 px-6 py-3.5 bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-white/70 uppercase tracking-widest">
              <span>Tour / Booking ID</span>
              <span>Customer</span>
              <span>Travel Date</span>
              <span>Group</span>
              <span>Amount</span>
              <span>Status</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const sc         = STATUS_CONFIG[booking.status] || { label: booking.status, cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', pill: 'bg-gray-100' };
                const tourTitle  = booking.quoteRequest?.listing?.title || 'Wander Tour';
                const duration   = booking.quoteRequest?.listing?.duration || '';
                const isPending  = booking.status === 'PAYMENT_PENDING';

                return (
                  <Link
                    key={booking.id}
                    href={`/vendor/wander/bookings/${booking.id}`}
                    className={`grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1.2fr_auto] gap-4 px-6 py-4 items-center transition group ${
                      isPending ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Tour + ID */}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-[13px] truncate group-hover:text-emerald-700 transition">{tourTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{booking.bookingId}</span>
                        {duration && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CustomerAvatar name={booking.customer?.name} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{booking.customer?.name || '—'}</p>
                      </div>
                    </div>

                    {/* Travel Date */}
                    <div>
                      <p className="text-[13px] text-gray-700 font-medium">{fmt(booking.travelDate)}</p>
                    </div>

                    {/* Group */}
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {booking.groupSize || '—'}
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="font-black text-slate-800 text-[13px] flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />{Number(booking.amount || 0).toLocaleString('en-IN')}
                      </p>
                      {booking.advancePaid && (
                        <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">✓ Advance Paid</span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${sc.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
