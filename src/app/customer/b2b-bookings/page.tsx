// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Loader2, Building2, Truck, Calendar, MapPin, ChevronRight,
  Clock, CheckCircle, FileText, Car, Bus, Bike, Wrench, Package, Star,
  Filter, IndianRupee, Users, AlertCircle, MessageCircle, RefreshCw,
} from 'lucide-react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';

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
  car: Car, bus: Bus, bike: Bike, truck: Truck, equipment: Wrench,
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

const CHAT_ELIGIBLE = ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED'];

function CustomerB2BBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) fetchBookings();
    else setLoading(false);
  }, [customerId]);

  async function fetchBookings() {
    try {
      let res = await fetch(`/api/b2b/bookings?customer_id=${customerId}`);
      let data = await res.json();
      if (data.status === 'success' && data.bookings?.length > 0) {
        setBookings(data.bookings);
      } else {
        const stored = localStorage.getItem('customer');
        if (stored) {
          const customer = JSON.parse(stored);
          if (customer.email) {
            res = await fetch(`/api/b2b/bookings?email=${customer.email}`);
            data = await res.json();
            if (data.status === 'success') setBookings(data.bookings);
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const serviceTypes = useMemo(() => {
    const types = [...new Set(bookings.map((b: any) => b.serviceType))];
    return types.sort();
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

  const actionNeeded = bookings.filter((b: any) => b.status === 'SUPER_QUOTE_SENT').length;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Stats
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

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-[#F8FAF9]`}>
      <CustomerHeader showBackButton backHref="/customer/dashboard" title="B2B Bookings" />

      <main className="pt-16 pb-12">
        {/* Hero */}
        <div className="bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)] pt-8 pb-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 60%)'}} />
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Corporate Transport
                </p>
                <h1 className="quote-serif text-[30px] md:text-[40px] font-medium text-white mt-1">B2B Bookings</h1>
                <p className="text-white/70 text-sm mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {bookings.length > 0 && stats.totalValue > 0 && (
                  <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-sm">
                    <div>
                      <p className="text-white/60 text-xs">Total Value</p>
                      <p className="text-white font-bold text-lg">₹{stats.totalValue.toLocaleString('en-IN')}</p>
                    </div>
                    {stats.unpaidValue > 0 && (
                      <>
                        <div className="w-px h-8 bg-white/20" />
                        <div>
                          <p className="text-amber-200/80 text-xs">Pending Payment</p>
                          <p className="text-amber-200 font-bold">₹{stats.unpaidValue.toLocaleString('en-IN')}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#09B368] rounded-xl text-sm font-semibold hover:bg-white/90 transition shadow-sm">
                  <FileText className="w-4 h-4" /> Invoices
                </Link>
              </div>
            </div>

            {/* Stat pills */}
            {bookings.length > 0 && (
              <div className="flex gap-3 mt-5 flex-wrap">
                {[
                  { label: 'Total', value: stats.total },
                  { label: 'Active', value: stats.active },
                  { label: 'Pending', value: stats.pending },
                  { label: 'Completed', value: stats.completed },
                ].map(s => (
                  <div key={s.label} className="bg-white/15 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
                    <span className="text-xl font-bold text-white">{s.value}</span>
                    <span className="text-xs text-white/70">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-5">

          {/* Action Alert */}
          {actionNeeded > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">{actionNeeded} Quote{actionNeeded > 1 ? 's' : ''} Ready for Review</p>
                <p className="text-xs text-amber-600">Review and accept to confirm your booking</p>
              </div>
            </div>
          )}

          {/* Filters */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {STATUS_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setStatusFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      statusFilter === f.key ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="quote-serif font-medium text-gray-900 text-[21px]">Corporate Bookings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Showing {filteredBookings.length} of {bookings.length}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#09B368]" />
              </div>
            ) : !customerId ? (
              <div className="text-center py-16 text-gray-500 text-sm">Customer ID required</div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="quote-serif font-medium text-gray-900 mb-1 text-[21px]">No B2B bookings yet</h3>
                <p className="text-sm text-gray-500 mb-4">No corporate bulk bookings found</p>
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#09B368] text-white rounded-xl text-sm font-semibold hover:bg-[#078F53] transition">
                  Go to Home
                </Link>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-12 text-center">
                <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No bookings match the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Booking</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Amount</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map((b: any) => {
                      const ServiceIcon = SERVICE_ICONS[b.serviceType] || Truck;
                      const isActionNeeded = b.status === 'SUPER_QUOTE_SENT';
                      const canChat = CHAT_ELIGIBLE.includes(b.status);
                      const detailHref = `/customer/b2b-bookings/${b.id}?customer_id=${customerId}`;
                      return (
                        <tr key={b.id} onClick={() => window.location.href = detailHref}
                          className={`hover:bg-gray-50/80 group cursor-pointer transition-colors ${isActionNeeded ? 'bg-amber-50/40' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#09B368]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ServiceIcon className="w-4 h-4 text-[#09B368]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 text-sm">{b.bookingNumber}</p>
                                  {isActionNeeded && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Action needed</span>}
                                </div>
                                <p className="text-xs text-gray-400 capitalize">{b.serviceType === 'self-drive' ? 'Self Drive' : b.serviceType} · {b.vehiclesRequired} vehicle{b.vehiclesRequired > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[160px]">{b.pickupLocation}{b.dropLocation ? ` → ${b.dropLocation}` : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-600">
                            {formatDate(b.scheduledDate)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {STATUS_LABELS[b.status] || b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {b.finalAmount > 0 && (
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900 text-sm">₹{b.finalAmount.toLocaleString('en-IN')}</p>
                                  {b._count?.trips > 0 && <p className="text-xs text-gray-400">{b._count.trips} trips</p>}
                                </div>
                              )}
                              {canChat && (
                                <button onClick={(e) => { e.stopPropagation(); router.push(`${detailHref}&open_chat=1`); }}
                                  className="w-8 h-8 flex items-center justify-center bg-[#09B368]/10 hover:bg-[#09B368]/20 text-[#09B368] rounded-xl transition flex-shrink-0"
                                  title="Chat">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#09B368] transition-colors ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CustomerB2BBookingsPage() {
  return (
    <Suspense fallback={<div className={`${quoteDisplay.variable} flex items-center justify-center min-h-screen bg-[#F8FAF9]`}><div className="animate-spin w-9 h-9 border-4 border-[#09B368] border-t-transparent rounded-full" /></div>}>
      <CustomerB2BBookingsContent />
    </Suspense>
  );
}
