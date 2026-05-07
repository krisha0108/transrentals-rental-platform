'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  BookOpen,
  Search,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  IndianRupee,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  bookingType: string;
  referenceTitle: string | null;
  travelDate: string | null;
  checkInDate: string | null;
  totalAmount: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  status: string;
  shareToken: string | null;
  customerFilledAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  DRAFT: number;
  PENDING_CUSTOMER: number;
  CONFIRMED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
}

interface SelfBooking {
  id: string;
  service: string;
  bookingNumber: string | null;
  amount: number;
  bookingDate: string | null;
  status: string;
  createdAt: string;
  trackUrl: string;
}

const SERVICE_META: Record<string, { label: string; icon: string; color: string }> = {
  BIKE:      { label: 'Bike Rental',      icon: '🏍️', color: 'bg-orange-100 text-orange-700' },
  CAR:       { label: 'Car Rental',       icon: '🚗', color: 'bg-blue-100 text-blue-700' },
  BUS:       { label: 'Bus Charter',      icon: '🚌', color: 'bg-purple-100 text-purple-700' },
  LUXURY:    { label: 'Luxury Vehicle',   icon: '🏎️', color: 'bg-amber-100 text-amber-700' },
  CHAUFFEUR: { label: 'Chauffeur',        icon: '🚖', color: 'bg-cyan-100 text-cyan-700' },
  TRUCK:     { label: 'Truck Hire',       icon: '🚚', color: 'bg-slate-100 text-slate-700' },
  PACKERS:   { label: 'Packers & Movers', icon: '📦', color: 'bg-pink-100 text-pink-700' },
  EQUIPMENT: { label: 'Equipment',        icon: '🛠️', color: 'bg-teal-100 text-teal-700' },
  WANDER:    { label: 'Group Trip',       icon: '🌄', color: 'bg-indigo-100 text-indigo-700' },
  B2B_CAR:       { label: 'TA · Car (Manager)',    icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_BIKE:      { label: 'TA · Bike (Manager)',   icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_BUS:       { label: 'TA · Bus (Manager)',    icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_LUXURY:    { label: 'TA · Luxury (Manager)', icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_CHAUFFEUR: { label: 'TA · Chauffeur (Mgr)',  icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_TRUCK:     { label: 'TA · Truck (Manager)',  icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_SELF_DRIVE:{ label: 'TA · Self-Drive (Mgr)', icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  PENDING_CUSTOMER: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const TYPE_LABELS: Record<string, string> = {
  TOUR: 'Tour',
  PROPERTY: 'Property',
  TRANSPORT: 'Transport',
  CUSTOM: 'Custom',
};

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selfBookings, setSelfBookings] = useState<SelfBooking[]>([]);
  const [showAllSelf, setShowAllSelf] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totals, setTotals] = useState({ bookedAmount: 0, receivedAmount: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.append('page', String(pagination.page));
      qs.append('limit', String(pagination.limit));
      if (statusFilter !== 'ALL') qs.append('status', statusFilter);
      if (typeFilter !== 'ALL') qs.append('bookingType', typeFilter);
      if (search) qs.append('search', search);

      const res = await fetch(`/api/travel-agent/bookings?${qs}`);
      if (res.ok) {
        const json = await res.json();
        setBookings(json.bookings);
        setSelfBookings(json.selfBookings || []);
        setStats(json.stats);
        setTotals(json.totals);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, typeFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500">{stats?.total ?? 0} total bookings</p>
          </div>
        </div>
        <Link
          href="/travel-agent/bookings/add"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Booking
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Booked Value" value={`₹${totals.bookedAmount.toLocaleString('en-IN')}`} color="emerald" />
        <KpiCard label="Received" value={`₹${totals.receivedAmount.toLocaleString('en-IN')}`} color="green" />
        <KpiCard label="Confirmed" value={String(stats?.CONFIRMED ?? 0)} color="blue" />
        <KpiCard label="Awaiting Customer" value={String(stats?.PENDING_CUSTOMER ?? 0)} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="flex-1 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by booking #, customer or reference..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_CUSTOMER">Pending Customer</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="TOUR">Tour</option>
            <option value="PROPERTY">Property</option>
            <option value="TRANSPORT">Transport</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {/* ── Self-bookings (made by the TA themselves on the customer side) ── */}
      {!loading && selfBookings.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-indigo-900">My Self-Bookings</h2>
                <p className="text-[11px] text-indigo-700">
                  Bookings you placed on the customer side ({selfBookings.length})
                </p>
              </div>
            </div>
            {selfBookings.length > 5 && (
              <button
                onClick={() => setShowAllSelf((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                {showAllSelf ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></> : <>Show all <ChevronDown className="w-3.5 h-3.5" /></>}
              </button>
            )}
          </div>
          <div className="bg-white border-t border-indigo-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50/50 border-b border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase">
                  <th className="text-left px-5 py-2">Service</th>
                  <th className="text-left px-5 py-2">Booking #</th>
                  <th className="text-left px-5 py-2">Date</th>
                  <th className="text-left px-5 py-2">Amount</th>
                  <th className="text-left px-5 py-2">Status</th>
                  <th className="text-right px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(showAllSelf ? selfBookings : selfBookings.slice(0, 5)).map((sb) => {
                  const meta = SERVICE_META[sb.service] || { label: sb.service, icon: '📋', color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={`${sb.service}-${sb.id}`} className="border-b border-gray-100 hover:bg-indigo-50/30">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-800">
                        {sb.bookingNumber || sb.id.slice(0, 10)}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-700">
                        {sb.bookingDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(sb.bookingDate).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-bold text-gray-900">
                        {sb.amount > 0 ? `₹${sb.amount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase">
                          {sb.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={sb.trackUrl}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                        >
                          Track <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No bookings yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add a booking manually or convert a lead from the leads page
          </p>
          <Link
            href="/travel-agent/bookings/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Booking
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <th className="text-left px-5 py-3">Booking</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <Link href={`/travel-agent/bookings/${b.id}`} className="font-mono text-xs font-bold text-emerald-700 hover:underline">
                      {b.bookingNumber}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {TYPE_LABELS[b.bookingType] || b.bookingType}
                      {b.referenceTitle && ` • ${b.referenceTitle}`}
                    </p>
                    {b.shareToken && b.status === 'PENDING_CUSTOMER' && !b.customerFilledAt && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Awaiting customer
                      </span>
                    )}
                    {b.shareToken && b.customerFilledAt && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Filled by customer
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{b.customerName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {b.customerPhone}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-700">
                    {(b.travelDate || b.checkInDate) ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(b.travelDate || b.checkInDate!).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">
                      ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    {(b.paidAmount || 0) > 0 && (
                      <p className="text-[10px] text-emerald-700">
                        Paid: ₹{(b.paidAmount || 0).toLocaleString('en-IN')}
                      </p>
                    )}
                    <span
                      className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        b.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : b.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${STATUS_COLORS[b.status]}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/travel-agent/bookings/${b.id}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs">
              <p className="text-gray-500">
                Page {pagination.page} of {pagination.pages} • {pagination.total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'green' | 'blue' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
        <IndianRupee className="w-3 h-3" />
        {label}
      </div>
      <p className="text-xl font-bold mt-2 truncate">{value}</p>
    </div>
  );
}
