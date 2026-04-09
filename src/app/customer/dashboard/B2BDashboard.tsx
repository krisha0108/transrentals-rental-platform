// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, Car, Calendar, MapPin, ChevronRight, Clock, CheckCircle,
  FileText, Bus, Truck, Wrench, Package, Star, IndianRupee, Users,
  AlertCircle, Loader2, CreditCard, ExternalLink, Briefcase, Filter, Plus,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Ready', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700 border-blue-200',
  QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700 border-purple-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700 border-teal-200',
  IN_PROGRESS: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  INVOICED: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const SERVICE_ICONS: Record<string, any> = {
  car: Car, bus: Bus, truck: Truck, equipment: Wrench,
  packers: Package, luxury: Star, 'self-drive': Car,
};

const SERVICE_COLORS: Record<string, string> = {
  car: 'bg-purple-50 text-purple-600', bus: 'bg-amber-50 text-amber-600',
  bike: 'bg-blue-50 text-blue-600', truck: 'bg-red-50 text-red-600',
  equipment: 'bg-cyan-50 text-cyan-600', packers: 'bg-pink-50 text-pink-600',
  luxury: 'bg-yellow-50 text-yellow-700', 'self-drive': 'bg-sky-50 text-sky-600',
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

interface B2BDashboardProps {
  customerId: string;
  customerName: string;
  companyName: string | null;
}

export default function B2BDashboard({ customerId, customerName, companyName }: B2BDashboardProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    if (customerId) {
      Promise.all([fetchBookings(), fetchInvoices()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [customerId]);

  async function fetchBookings() {
    try {
      const res = await fetch(`/api/b2b/bookings?customer_id=${customerId}`);
      const data = await res.json();
      if (data.status === 'success') setBookings(data.bookings || []);
    } catch (e) { console.error(e); }
  }

  async function fetchInvoices() {
    try {
      const res = await fetch(`/api/b2b/invoices?customer_id=${customerId}&limit=50`);
      const data = await res.json();
      if (data.status === 'success') setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  const serviceTypes = useMemo(() => {
    const types = [...new Set(bookings.map((b: any) => b.serviceType))];
    return types.sort();
  }, [bookings]);

  const stats = useMemo(() => {
    const totalValue = bookings.reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const paidValue = bookings.filter((b: any) => b.status === 'PAID').reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const unpaidValue = bookings.filter((b: any) => ['INVOICED', 'COMPLETED'].includes(b.status)).reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    return {
      total: bookings.length,
      active: bookings.filter((b: any) => ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length,
      pending: bookings.filter((b: any) => ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status)).length,
      completed: bookings.filter((b: any) => ['COMPLETED', 'INVOICED', 'PAID'].includes(b.status)).length,
      totalValue, paidValue, unpaidValue,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      if (serviceFilter !== 'all' && b.serviceType !== serviceFilter) return false;
      if (statusFilter === 'active') return ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status);
      if (statusFilter === 'pending') return ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status);
      if (statusFilter === 'completed') return ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(b.status);
      return true;
    });
  }, [bookings, statusFilter, serviceFilter]);

  const invoiceStats = useMemo(() => {
    const totalAmount = invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const paidAmount = invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const unpaidAmount = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const overdueCount = invoices.filter((i: any) => {
      if (i.status === 'PAID' || i.status === 'CANCELLED') return false;
      return new Date(i.dueDate) < new Date();
    }).length;
    return { totalAmount, paidAmount, unpaidAmount, overdueCount };
  }, [invoices]);

  const actionNeeded = bookings.filter((b: any) => b.status === 'SUPER_QUOTE_SENT').length;
  const recentInvoices = useMemo(() =>
    invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').slice(0, 3),
  [invoices]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Company Header with Stats */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] rounded-2xl p-5 text-white shadow-lg">
        {/* checkered grid overlay */}
        <div className="absolute inset-0 opacity-[0.06] rounded-2xl"
          style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
        {/* glow blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#09B368]/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-36 h-36 rounded-full bg-[#056040]/40 blur-2xl" />

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium mb-0.5">Corporate Transport Dashboard</p>
              <h2 className="text-lg font-bold text-white">{companyName || 'B2B Corporate'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 backdrop-blur-sm">
              <FileText className="w-3.5 h-3.5" /> Invoices
            </Link>
            <Link href={`/customer/b2b-bookings?customer_id=${customerId}`}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 backdrop-blur-sm">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Booking Count Stats */}
        <div className="relative grid grid-cols-4 gap-2.5">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Pending', value: stats.pending },
            { label: 'Completed', value: stats.completed },
          ].map(s => (
            <div key={s.label} className="bg-white/15 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-[11px] text-white/70">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        {stats.totalValue > 0 && (
          <div className="relative bg-white/10 border border-white/10 rounded-xl p-3.5 mt-3 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <div className="text-[11px] text-white/60">Total Booking Value</div>
                <div className="text-lg font-bold text-white">{formatCurrency(stats.totalValue)}</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-[11px] text-white/60">Paid</div>
                <div className="text-base font-bold text-green-300">{formatCurrency(stats.paidValue)}</div>
              </div>
              {stats.unpaidValue > 0 && (
                <>
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <div className="text-[11px] text-white/60">Pending Payment</div>
                    <div className="text-base font-bold text-yellow-300">{formatCurrency(stats.unpaidValue)}</div>
                  </div>
                </>
              )}
            </div>
            <IndianRupee className="w-7 h-7 text-white/20" />
          </div>
        )}
      </div>

      {/* Action Alerts */}
      {actionNeeded > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-800">{actionNeeded} Quote{actionNeeded > 1 ? 's' : ''} Ready for Review</p>
            <p className="text-xs text-purple-600">Review and accept to confirm your booking</p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400" />
        </div>
      )}

      {invoiceStats.overdueCount > 0 && (
        <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`}
          className="flex items-center gap-3 p-3.5 rounded-xl border bg-red-50 border-red-200 text-red-700 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{invoiceStats.overdueCount} Overdue Invoice{invoiceStats.overdueCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-600">Clear pending payments to avoid service disruption</p>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}

      {/* Pending Invoices */}
      {recentInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" /> Pending Payments
            </h3>
            <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`}
              className="text-xs text-emerald-600 font-medium">View All</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInvoices.map((inv: any) => {
              const isOverdue = new Date(inv.dueDate) < new Date();
              return (
                <div key={inv.id} className="p-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-50' : 'bg-orange-50'}`}>
                    <FileText className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-800">{inv.invoiceNumber}</span>
                      {isOverdue && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">OVERDUE</span>}
                    </div>
                    <div className="text-[11px] text-gray-500">Due: {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>{formatCurrency(inv.totalAmount)}</div>
                    <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                      className={`text-[11px] font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                      Pay Now
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {bookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  statusFilter === f.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f.label}
                {f.key === 'all' ? ` (${bookings.length})` :
                 f.key === 'active' ? ` (${stats.active})` :
                 f.key === 'pending' ? ` (${stats.pending})` :
                 ` (${stats.completed})`}
              </button>
            ))}
          </div>
          {serviceTypes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <button onClick={() => setServiceFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  serviceFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>All Services</button>
              {serviceTypes.map(st => {
                const Icon = SERVICE_ICONS[st] || Truck;
                return (
                  <button key={st} onClick={() => setServiceFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 capitalize ${
                      serviceFilter === st ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    <Icon className="w-3 h-3" />
                    {st === 'self-drive' ? 'Self Drive' : st}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border shadow-sm">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No B2B bookings yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first corporate bulk booking</p>
          <Link href={`/customer/b2b-bookings/create?customer_id=${customerId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
            <Plus className="w-4 h-4" /> Create Booking
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No bookings match the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b: any) => {
            const ServiceIcon = SERVICE_ICONS[b.serviceType] || Truck;
            const serviceColor = SERVICE_COLORS[b.serviceType] || 'bg-gray-50 text-gray-600';
            const isActionNeeded = b.status === 'SUPER_QUOTE_SENT';

            return (
              <Link key={b.id} href={`/customer/b2b-bookings/${b.id}?customer_id=${customerId}`}
                className={`block bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all ${
                  isActionNeeded ? 'border-purple-300 ring-1 ring-purple-200' : 'border-gray-200'
                }`}>
                {isActionNeeded && (
                  <div className="bg-purple-50 px-4 py-1.5 text-xs font-semibold text-purple-700 flex items-center gap-1.5 border-b border-purple-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Quote ready — tap to review & accept
                  </div>
                )}
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${serviceColor}`}>
                    <ServiceIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold text-gray-800">{b.bookingNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1 capitalize">
                        <Car className="w-3 h-3" />
                        {b.vehiclesRequired} {b.serviceType === 'self-drive' ? 'Self Drive' : b.serviceType}
                        {b.passengerCount ? ` / ${b.passengerCount} pax` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {b.pickupLocation}
                        {b.dropLocation && ` → ${b.dropLocation}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(b.scheduledDate)}
                      </span>
                      <span className="text-gray-400">{TRIP_TYPE_LABELS[b.tripType] || b.tripType}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    {b.finalAmount > 0 && (
                      <div>
                        <div className="text-lg font-bold text-emerald-700">{formatCurrency(b.finalAmount)}</div>
                        {b._count?.trips > 0 && (
                          <div className="text-[10px] text-gray-400">{b._count.trips} trips</div>
                        )}
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
