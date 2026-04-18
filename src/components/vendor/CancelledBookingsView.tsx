'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  XCircle, Search, X, Calendar, IndianRupee,
  User, AlertCircle, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelledBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleName?: string;
  pickupDate?: string;
  dropDate?: string;
  totalDays?: number;
  status: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  grandTotal: number;
  paidAmount?: number;
  refundAmount?: number;
  detailHref: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface Props {
  service: string;
  serviceLabel: string;
}

const STATUS_STYLES: Record<string, string> = {
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED:  'bg-green-100 text-green-700',
  EXPIRED:   'bg-gray-100 text-gray-500',
};

export default function CancelledBookingsView({ service, serviceLabel }: Props) {
  const [bookings, setBookings] = useState<CancelledBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ service, page: String(page), limit: '20' });
      if (search)    params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate', endDate);

      const res  = await fetch(`/api/vendor/cancelled-bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [service, page, search, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Cancelled Bookings</h1>
            <p className="text-xs text-gray-500">{serviceLabel} · {pagination.total} total</p>
          </div>
        </div>
        <button onClick={fetchBookings} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, phone, booking #..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-transparent"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button type="submit" className="px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
            Search
          </button>
        </form>

        {/* Date filter */}
        <div className="flex gap-2 items-center">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex gap-2 flex-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-300"
            />
            <span className="text-gray-400 self-center text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-300"
            />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }} className="text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <XCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No cancelled bookings found</p>
          {(search || startDate || endDate) && (
            <button onClick={() => { clearSearch(); setStartDate(''); setEndDate(''); }} className="mt-2 text-sm text-red-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link key={booking.id} href={booking.detailHref} className="block">
              <div className="bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all overflow-hidden">
                {/* Red top stripe */}
                <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">#{booking.bookingNumber}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600')}>
                          {booking.status}
                        </span>
                      </div>

                      {/* Vehicle & customer */}
                      <p className="text-sm text-gray-700 font-medium truncate">{booking.vehicleName || '—'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{booking.customerName}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{booking.customerPhone}</span>
                      </div>

                      {/* Dates */}
                      {booking.pickupDate && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {booking.totalDays && booking.totalDays > 1 ? ` · ${booking.totalDays} days` : ''}
                          </span>
                        </div>
                      )}

                      {/* Cancellation reason */}
                      {booking.cancellationReason && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600 leading-relaxed line-clamp-2">
                            {booking.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">₹{(booking.grandTotal || 0).toLocaleString('en-IN')}</p>

                      {booking.refundAmount != null && booking.refundAmount > 0 && (
                        <div className="mt-1 flex items-center gap-1 justify-end">
                          <IndianRupee className="w-3 h-3 text-orange-500" />
                          <span className="text-xs font-semibold text-orange-600">
                            ₹{booking.refundAmount.toLocaleString('en-IN')} refund
                          </span>
                        </div>
                      )}

                      {/* Who cancelled */}
                      <p className="text-xs text-gray-400 mt-1 capitalize">
                        By: {booking.cancelledBy?.toLowerCase() || '—'}
                      </p>

                      {/* When cancelled */}
                      {booking.cancelledAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(booking.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
