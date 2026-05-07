'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  BookOpen,
  Share2,
  Copy,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  bookingType: string;
  referenceTitle: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  travelDate: string | null;
  returnDate: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  passengers: number | null;
  rooms: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  status: string;
  shareToken: string | null;
  shareExpiresAt: string | null;
  customerFilledAt: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_ORDER = ['DRAFT', 'PENDING_CUSTOMER', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_CUSTOMER: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/travel-agent/bookings/${id}`);
      if (res.ok) setBooking(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/travel-agent/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: `Status: ${newStatus}` });
        await load();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const generateShareLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/travel-agent/bookings/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 7 }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Share link created (valid for 7 days)' });
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to generate link' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const revokeShareLink = async () => {
    if (!confirm('Revoke share link? Customer link will stop working.')) return;
    const res = await fetch(`/api/travel-agent/bookings/${id}/share`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Share link revoked' });
      await load();
    }
  };

  const copyShareLink = async () => {
    if (!booking?.shareToken) return;
    const url = `${origin}/travel-agent/booking/share/${booking.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast({ type: 'error', title: 'Could not copy link' });
    }
  };

  const deleteBooking = async () => {
    if (!confirm('Permanently delete this booking?')) return;
    const res = await fetch(`/api/travel-agent/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Booking deleted' });
      router.push('/travel-agent/bookings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const shareUrl = booking.shareToken
    ? `${origin}/travel-agent/booking/share/${booking.shareToken}`
    : null;
  const isProperty = booking.bookingType === 'PROPERTY';
  const isShareExpired = booking.shareExpiresAt
    ? new Date(booking.shareExpiresAt) < new Date()
    : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          href="/travel-agent/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" /> All Bookings
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/travel-agent/bookings/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-emerald-700 bg-white border border-gray-200 hover:border-emerald-300 px-3 py-2 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>
          <button
            onClick={deleteBooking}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-mono text-xs text-gray-500">{booking.bookingNumber}</p>
                <h1 className="text-xl font-bold text-gray-900">{booking.customerName}</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {booking.bookingType.replace(/_/g, ' ')}
                  {booking.referenceTitle && ` • ${booking.referenceTitle}`}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[booking.status]}`}
              >
                {booking.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Item icon={Phone} value={booking.customerPhone} href={`tel:${booking.customerPhone}`} />
              {booking.customerEmail && (
                <Item icon={Mail} value={booking.customerEmail} href={`mailto:${booking.customerEmail}`} />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Move Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updatingStatus || booking.status === s}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  booking.status === s
                    ? `${STATUS_COLORS[s]} border-transparent ring-2 ring-emerald-400`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Trip Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {!isProperty ? (
                <>
                  <Detail label="Pickup" value={booking.pickupLocation} icon={MapPin} />
                  <Detail label="Drop" value={booking.dropLocation} icon={MapPin} />
                  <Detail
                    label="Travel Date"
                    value={booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : null}
                    icon={Calendar}
                  />
                  <Detail
                    label="Return Date"
                    value={booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : null}
                    icon={Calendar}
                  />
                  <Detail label="Passengers" value={booking.passengers ? String(booking.passengers) : null} />
                </>
              ) : (
                <>
                  <Detail
                    label="Check-in"
                    value={booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : null}
                    icon={Calendar}
                  />
                  <Detail
                    label="Check-out"
                    value={booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : null}
                    icon={Calendar}
                  />
                  <Detail label="Guests" value={booking.passengers ? String(booking.passengers) : null} />
                  <Detail label="Rooms" value={booking.rooms ? String(booking.rooms) : null} />
                </>
              )}
            </div>
            {booking.notes && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-xl font-bold text-emerald-700">
                  ₹{(booking.paidAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-amber-700">
                  ₹{((booking.totalAmount || 0) - (booking.paidAmount || 0)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  booking.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-700'
                    : booking.paymentStatus === 'PARTIAL'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" /> Share Link
            </h2>
            {!shareUrl ? (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Generate a shareable link so the customer can fill in their details on their phone.
                </p>
                <button
                  onClick={generateShareLink}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm py-2.5 rounded-xl"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> Generate Link
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-700 truncate flex-1">{shareUrl}</code>
                    <button
                      onClick={copyShareLink}
                      className="text-emerald-600 hover:text-emerald-700 shrink-0"
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isShareExpired ? (
                  <p className="text-xs text-red-600 mb-3">⚠️ Link has expired</p>
                ) : (
                  booking.shareExpiresAt && (
                    <p className="text-xs text-gray-500 mb-3">
                      Expires {new Date(booking.shareExpiresAt).toLocaleDateString()}
                    </p>
                  )
                )}

                {booking.customerFilledAt ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mb-3">
                    ✓ Customer filled details on{' '}
                    {new Date(booking.customerFilledAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                    ⏳ Awaiting customer
                  </p>
                )}

                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/91${booking.customerPhone}?text=${encodeURIComponent(
                      `Hi ${booking.customerName}, please complete your booking details: ${shareUrl}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    Send via WhatsApp
                  </a>
                  <button
                    onClick={generateShareLink}
                    disabled={generating}
                    className="flex items-center justify-center gap-1 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={revokeShareLink}
                    className="flex items-center justify-center gap-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold py-2 px-3 rounded-lg"
                    title="Revoke"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Quick Actions</p>
            <div className="space-y-2">
              <a
                href={`tel:${booking.customerPhone}`}
                className="flex items-center gap-2 w-full bg-white hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-3 py-2 rounded-lg border border-emerald-200"
              >
                <Phone className="w-4 h-4" /> Call Customer
              </a>
              {booking.customerEmail && (
                <a
                  href={`mailto:${booking.customerEmail}`}
                  className="flex items-center gap-2 w-full bg-white hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-3 py-2 rounded-lg border border-emerald-200"
                >
                  <Mail className="w-4 h-4" /> Email Customer
                </a>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Booked on</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(booking.createdAt).toLocaleString()}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Item({ icon: Icon, value, href }: { icon: any; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 text-gray-700">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
  return href ? <a href={href} className="hover:text-emerald-700">{content}</a> : content;
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: any;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}
