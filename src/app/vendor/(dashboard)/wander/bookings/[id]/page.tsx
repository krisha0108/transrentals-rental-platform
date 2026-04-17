// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, CalendarCheck, Users, MapPin,
  Phone, Mail, IndianRupee, Check, X, Info, CheckCircle, Hourglass,
  Play, Flag,
} from 'lucide-react';
import WanderChat from '@/components/wander/WanderChat';

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseList(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    if (Array.isArray(p)) return p.filter(Boolean);
  } catch {}
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; strip: string }> = {
  PAYMENT_PENDING:   { label: 'Payment Pending',      cls: 'bg-emerald-100 text-emerald-700',   strip: 'bg-emerald-400' },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review',  cls: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-400' },
  CONFIRMED:         { label: 'Confirmed',             cls: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-400' },
  GUIDE_ASSIGNED:    { label: 'Guide Assigned',        cls: 'bg-emerald-100 text-emerald-700',     strip: 'bg-emerald-400' },
  STARTED:           { label: 'Started',               cls: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-400' },
  COMPLETED:         { label: 'Completed',             cls: 'bg-gray-100 text-gray-600',     strip: 'bg-gray-400' },
  CANCELLED:         { label: 'Cancelled',             cls: 'bg-red-100 text-red-600',       strip: 'bg-red-400' },
  DROPPED:           { label: 'Dropped',               cls: 'bg-gray-100 text-gray-400',     strip: 'bg-gray-300' },
};

export default function VendorWanderBookingDetailPage() {
  const { isApproved, openVerificationModal } = useVendorVerification();
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/vendor/wander/bookings/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setBooking(d); })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: 'start' | 'complete') {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/vendor/wander/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error || 'Action failed'); return; }
      setBooking((b: any) => ({ ...b, status: data.status }));
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
    </div>
  );

  if (error || !booking) return (
    <div className="p-6 max-w-2xl mx-auto text-center py-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-gray-600">{error || 'Booking not found'}</p>
      <Link href="/vendor/wander/bookings" className="text-emerald-600 text-sm mt-4 inline-block hover:underline">
        ← Back to Bookings
      </Link>
    </div>
  );

  const sc = STATUS_CONFIG[booking.status] || { label: booking.status, cls: 'bg-gray-100 text-gray-600', strip: 'bg-gray-300' };
  const listing = booking.quoteRequest?.listing;
  const images: string[] = (() => { try { return JSON.parse(listing?.images || '[]'); } catch { return []; } })();
  const inclusions = parseList(booking.quote?.customInclusions);
  const exclusions = parseList(booking.quote?.customExclusions);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/vendor/wander/bookings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {/* Hero image (if available) */}
      {images[0] && (
        <div className="w-full h-44 rounded-2xl overflow-hidden mb-5">
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className={`h-1.5 ${sc.strip}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              {listing?.category && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold mb-2">
                  {listing.category.icon} {listing.category.name}
                </span>
              )}
              <h1 className="text-xl font-bold text-gray-900">{listing?.title || 'Wander Tour'}</h1>
              {listing?.mainLocation?.name && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {listing.mainLocation.name}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${sc.cls}`}>{sc.label}</span>
              <span className="text-xs text-gray-400 font-mono">{booking.bookingId}</span>
            </div>
          </div>

          {/* Status banner */}
          {booking.status === 'CONFIRMED' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                Booking confirmed{booking.advancePaid ? ' — advance payment received' : ''}.
              </p>
            </div>
          )}
          {booking.status === 'PAYMENT_SUBMITTED' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <Hourglass className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                Customer has submitted payment — awaiting admin verification.
              </p>
            </div>
          )}
          {booking.status === 'PAYMENT_PENDING' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                Waiting for customer advance payment to confirm this booking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trip Action Buttons */}
      {(booking.status === 'CONFIRMED' || booking.status === 'GUIDE_ASSIGNED' || booking.status === 'STARTED') && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">Trip Actions</h2>
          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Info className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{actionError}</p>
            </div>
          )}
          {booking.status === 'STARTED' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
              <Play className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Tour is currently in progress.</p>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            {(booking.status === 'CONFIRMED' || booking.status === 'GUIDE_ASSIGNED') && (
              <button
                onClick={() => isApproved ? handleAction('start') : openVerificationModal()}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Tour
              </button>
            )}
            {booking.status === 'STARTED' && (
              <button
                onClick={() => isApproved ? handleAction('complete') : openVerificationModal()}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                End Tour
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trip Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" /> Trip Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <Row label="Travel Date" value={fmt(booking.travelDate)} />
            <Row label="Duration" value={listing?.duration || '—'} />
            <Row
              label="Group Size"
              value={
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {booking.groupSize} person{booking.groupSize !== 1 ? 's' : ''}
                </span>
              }
            />
            {booking.quoteRequest?.pickupLocation && (
              <Row
                label="Pickup"
                value={
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {booking.quoteRequest.pickupLocation}
                  </span>
                }
              />
            )}
            {booking.quoteRequest?.requirements && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Special Requirements</p>
                <p className="text-sm text-emerald-800">{booking.quoteRequest.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-bold text-gray-900 text-sm">Customer Details</h2>
            {booking.isB2BBooking && booking.companyName ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🏢 B2B — Company</span>
            ) : booking.isB2BBooking ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">👤 B2B — Personal</span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">👤 Regular</span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <Row label="Name" value={booking.customer?.name || '—'} />
            {booking.isB2BBooking && booking.companyName && (
              <Row label="Company" value={<span className="text-emerald-700 font-semibold">🏢 {booking.companyName}</span>} />
            )}
            {booking.customer?.phone && (
              <Row
                label="Phone"
                value={
                  <a href={`tel:${booking.customer.phone}`} className="text-emerald-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {booking.customer.phone}
                  </a>
                }
              />
            )}
            {booking.customer?.email && (
              <Row
                label="Email"
                value={
                  <a href={`mailto:${booking.customer.email}`} className="text-emerald-600 hover:underline flex items-center gap-1 text-sm">
                    <Mail className="w-3.5 h-3.5" /> {booking.customer.email}
                  </a>
                }
              />
            )}
            <Row label="Booked On" value={fmt(booking.createdAt)} />
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-500" /> Payment Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <Row
              label="Total Amount"
              value={
                <span className="text-lg font-black text-emerald-700">
                  ₹{Number(booking.amount).toLocaleString('en-IN')}
                </span>
              }
            />
            {booking.advanceAmount && (
              <>
                <Row
                  label="Advance Required"
                  value={`₹${Number(booking.advanceAmount).toLocaleString('en-IN')}`}
                />
                <Row
                  label="Balance on Trip"
                  value={`₹${(Number(booking.amount) - Number(booking.advanceAmount)).toLocaleString('en-IN')}`}
                />
              </>
            )}
            <Row
              label="Advance Paid"
              value={
                booking.advancePaid
                  ? <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                  : <span className="text-emerald-600 font-semibold">No</span>
              }
            />
            {booking.advancePaymentRef && (
              <Row label="Payment Ref" value={<span className="font-mono text-xs">{booking.advancePaymentRef}</span>} />
            )}
            {booking.paymentMethod && (
              <Row label="Method" value={booking.paymentMethod} />
            )}
          </div>
        </div>

        {/* Quote Details */}
        {booking.quote && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Your Quote</h2>
            </div>
            <div className="p-5 space-y-4">
              <Row label="Quoted Amount" value={`₹${Number(booking.quote.amount).toLocaleString('en-IN')}`} />
              {booking.quote.perPersonAmount && (
                <Row label="Per Person" value={`₹${Number(booking.quote.perPersonAmount).toLocaleString('en-IN')}`} />
              )}
              {booking.quote.notes && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Your Note</p>
                  <p className="text-sm text-emerald-800">{booking.quote.notes}</p>
                </div>
              )}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {inclusions.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-700 mb-2">Includes</p>
                      <ul className="space-y-1">
                        {inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs text-emerald-800">
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-red-600 mb-2">Excludes</p>
                      <ul className="space-y-1">
                        {exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs text-red-700">
                            <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat with customer */}
      {booking.vendorId && booking.customer?.id && (
        <div className="mt-5 max-w-4xl mx-auto">
          <WanderChat
            vendorId={booking.vendorId}
            customerId={booking.customer.id}
            senderType="vendor"
            senderId={booking.vendorId}
            senderName="Vendor"
            otherName={booking.customer.name || 'Customer'}
            bookingType="wander_booking"
            bookingId={booking.id}
          />
        </div>
      )}

      <div className="pb-10" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}
