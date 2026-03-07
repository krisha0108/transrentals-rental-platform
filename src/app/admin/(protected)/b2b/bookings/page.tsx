// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Building2, Truck, Calendar, MapPin, ChevronRight,
  RefreshCw, Filter, Clock, CheckCircle, FileText, ArrowRight
} from 'lucide-react';

const STATUS_COLORS = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700',
  QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  INVOICED: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  OPEN_FOR_QUOTES: 'Open for Quotes',
  QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Sent to HR',
  CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default function AdminB2BBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBookings(); }, [status]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/bookings?view_all=true&status=${status}`);
      const data = await res.json();
      if (data.status === 'success') setBookings(data.bookings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = bookings.filter((b: any) =>
    !search ||
    b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Bookings</h1>
          <p className="text-gray-500 mt-1">All corporate bulk bookings</p>
        </div>
        <button onClick={fetchBookings} className="p-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search booking number, company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 border rounded-lg bg-white">
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No B2B bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <Link key={booking.id} href={`/admin/b2b/bookings/${booking.id}`}
              className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-blue-600">{booking.bookingNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{booking.companyName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {booking.vehiclesRequired} vehicles</div>
                    <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {booking.serviceType}</div>
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.pickupLocation}</div>
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {booking._count?.vendorQuotes || 0} quotes | {booking._count?.trips || 0} trips
                    {booking.finalAmount && ` | ₹${booking.finalAmount.toLocaleString('en-IN')}`}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
