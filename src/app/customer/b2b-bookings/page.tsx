// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Loader2, Plus, Building2, Truck, Calendar, MapPin, ChevronRight,
  Clock, CheckCircle, FileText, Car, Bus, Bike, Wrench, Package, Star,
  Filter, IndianRupee, Users, AlertCircle,
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

export default function CustomerB2BBookingsPage() {
  const searchParams = useSearchParams();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 sm:px-6 pt-20 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold text-white">B2B Bookings</h1>
              <p className="text-green-100 text-sm mt-1">Your corporate bulk bookings</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 text-sm font-semibold transition backdrop-blur-sm">
                <FileText className="w-4 h-4" /> Invoices
              </Link>
              <Link href={`/customer/b2b-bookings/create?customer_id=${customerId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 text-sm font-semibold shadow-lg transition">
                <Plus className="w-4 h-4" /> New Booking
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {bookings.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Total', value: stats.total },
                  { label: 'Active', value: stats.active },
                  { label: 'Pending', value: stats.pending },
                  { label: 'Completed', value: stats.completed },
                ].map(s => (
                  <div key={s.label} className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-green-100">{s.label}</div>
                  </div>
                ))}
              </div>
              {stats.totalValue > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-green-200">Total Booking Value</div>
                      <div className="text-xl font-bold text-white">₹{stats.totalValue.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                      <div className="text-xs text-green-200">Paid</div>
                      <div className="text-lg font-bold text-green-200">₹{stats.paidValue.toLocaleString('en-IN')}</div>
                    </div>
                    {stats.unpaidValue > 0 && (
                      <>
                        <div className="w-px h-8 bg-white/20" />
                        <div>
                          <div className="text-xs text-yellow-200">Pending Payment</div>
                          <div className="text-lg font-bold text-yellow-200">₹{stats.unpaidValue.toLocaleString('en-IN')}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <IndianRupee className="w-8 h-8 text-white/20" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-3">
        {/* Action Alert */}
        {actionNeeded > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 mb-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">{actionNeeded} Quote{actionNeeded > 1 ? 's' : ''} Ready for Review</p>
              <p className="text-xs text-purple-600">Review and accept to confirm your booking</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-sm space-y-2">
            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {STATUS_FILTERS.map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    statusFilter === f.key
                      ? 'bg-green-600 text-white shadow-sm'
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
            {/* Service Filter */}
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : !customerId ? (
          <div className="text-center py-16 text-gray-500">Customer ID required</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-1">No B2B bookings yet</p>
            <p className="text-sm text-gray-400 mb-5">Create your first corporate bulk booking</p>
            <Link href={`/customer/b2b-bookings/create?customer_id=${customerId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
              <Plus className="w-4 h-4" /> Create Booking
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings match the selected filters</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
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
                    {/* Service Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${serviceColor}`}>
                      <ServiceIcon className="w-6 h-6" />
                    </div>

                    {/* Booking Info */}
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

                    {/* Price & Arrow */}
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      {b.finalAmount > 0 && (
                        <div>
                          <div className="text-lg font-bold text-green-700">₹{b.finalAmount.toLocaleString('en-IN')}</div>
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
    </div>
  );
}
