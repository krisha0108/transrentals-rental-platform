// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Loader2, Users, MapPin, Clock, Phone, IndianRupee, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PAYMENT_PENDING:   { label: 'Payment Pending',   cls: 'bg-amber-100 text-amber-700' },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', cls: 'bg-orange-100 text-orange-700' },
  CONFIRMED:         { label: 'Confirmed',          cls: 'bg-emerald-100 text-emerald-700' },
  GUIDE_ASSIGNED:    { label: 'Guide Assigned',     cls: 'bg-blue-100 text-blue-700' },
  STARTED:           { label: 'Started',            cls: 'bg-indigo-100 text-indigo-700' },
  COMPLETED:         { label: 'Completed',          cls: 'bg-gray-100 text-gray-600' },
  CANCELLED:         { label: 'Cancelled',          cls: 'bg-red-100 text-red-600' },
  DROPPED:           { label: 'Dropped',            cls: 'bg-gray-100 text-gray-400' },
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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [total, setTotal] = useState(0);

  const fetchBookings = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/wander/bookings?status=${status}&limit=50`);
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wander Bookings</h1>
            <p className="text-sm text-gray-500">{total} booking{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button
          onClick={() => fetchBookings(tab)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">
            {tab === 'all'
              ? 'Bookings appear here once a customer accepts your quote'
              : `No bookings with "${TABS.find(t => t.key === tab)?.label}" status`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const sc = STATUS_CONFIG[booking.status] || { label: booking.status, cls: 'bg-gray-100 text-gray-600' };
            const tourTitle = booking.quoteRequest?.listing?.title || 'Wander Tour';
            const duration = booking.quoteRequest?.listing?.duration || '';

            return (
              <Link
                key={booking.id}
                href={`/vendor/wander/bookings/${booking.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Status strip */}
                <div className={`h-1 ${
                  booking.status === 'CONFIRMED' || booking.status === 'GUIDE_ASSIGNED' ? 'bg-emerald-400' :
                  booking.status === 'PAYMENT_PENDING' ? 'bg-amber-400' :
                  booking.status === 'PAYMENT_SUBMITTED' ? 'bg-orange-400' :
                  booking.status === 'STARTED' ? 'bg-indigo-400' :
                  booking.status === 'COMPLETED' ? 'bg-gray-300' : 'bg-gray-200'
                }`} />

                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Tour + booking ID */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                        <span className="text-xs text-gray-400 font-mono">{booking.bookingId}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">{tourTitle}</h3>
                      {duration && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" /> {duration}
                        </p>
                      )}

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                          <p className="font-semibold text-gray-800 text-sm">{booking.customer?.name || '—'}</p>
                          {booking.customer?.phone && (
                            <a href={`tel:${booking.customer.phone}`} className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {booking.customer.phone}
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Travel Date</p>
                          <p className="font-semibold text-gray-800">{fmt(booking.travelDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Group Size</p>
                          <p className="font-semibold text-gray-800 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {booking.groupSize} person{booking.groupSize !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                          <p className="font-bold text-indigo-700 flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {Number(booking.amount).toLocaleString('en-IN')}
                          </p>
                          {booking.advanceAmount && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Advance: ₹{Number(booking.advanceAmount).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pickup location */}
                      {booking.quoteRequest?.pickupLocation && (
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          Pickup: {booking.quoteRequest.pickupLocation}
                        </p>
                      )}
                    </div>

                    {/* Right side: advance info + chevron */}
                    <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                      {booking.advancePaid && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                          ✓ Advance Paid
                        </span>
                      )}
                      {booking.status === 'PAYMENT_SUBMITTED' && !booking.advancePaid && (
                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-semibold">
                          ⏳ Verifying Payment
                        </span>
                      )}
                      <p className="text-xs text-gray-400">Booked {fmt(booking.createdAt)}</p>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
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
