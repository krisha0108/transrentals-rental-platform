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
  Share2,
  Copy,
  Check,
  X,
  RefreshCw,
  Users,
  Building2,
  Map,
  Car,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  IndianRupee,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Strips an existing 91/+91 country-code prefix before re-adding it, so a
// number already saved as "+919876543210" doesn't become "919919876543210".
const waLink = (phone: string, text?: string) =>
  `https://wa.me/91${phone.replace(/^\+?91/, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

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
const STATUS_CFG: Record<string, { label: string; grad: string; badge: string; badgeBg: string; icon: any }> = {
  DRAFT:            { label: 'Draft',            grad: 'from-gray-400 to-gray-500',     badge: 'text-gray-700',    badgeBg: 'bg-gray-100',    icon: FileText },
  PENDING_CUSTOMER: { label: 'Pending Customer',  grad: 'from-amber-500 to-orange-500',  badge: 'text-amber-700',   badgeBg: 'bg-amber-100',   icon: AlertCircle },
  CONFIRMED:        { label: 'Confirmed',         grad: 'from-emerald-600 to-emerald-700', badge: 'text-emerald-700', badgeBg: 'bg-emerald-100', icon: CheckCircle2 },
  IN_PROGRESS:      { label: 'In Progress',       grad: 'from-blue-600 to-indigo-600',   badge: 'text-blue-700',    badgeBg: 'bg-blue-100',    icon: PlayCircle },
  COMPLETED:        { label: 'Completed',         grad: 'from-green-500 to-emerald-600', badge: 'text-green-700',   badgeBg: 'bg-green-100',   icon: CheckCircle2 },
  CANCELLED:        { label: 'Cancelled',         grad: 'from-red-500 to-rose-600',      badge: 'text-red-700',     badgeBg: 'bg-red-100',     icon: XCircle },
};
const JOURNEY = ['DRAFT', 'PENDING_CUSTOMER', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
const TYPE_META: Record<string, { label: string; icon: any }> = {
  TOUR: { label: 'Tour Package', icon: Map },
  PROPERTY: { label: 'Property / Stay', icon: Building2 },
  TRANSPORT: { label: 'Transport', icon: Car },
  CUSTOM: { label: 'Custom', icon: FileText },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        showToast({ type: 'success', title: `Status: ${newStatus.replace(/_/g, ' ')}` });
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
      <div className="min-h-screen -m-4 lg:-m-6 bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-400">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen -m-4 lg:-m-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Booking not found</p>
          <Link href="/travel-agent/bookings" className="text-emerald-600 text-sm mt-2 block hover:underline">← Back to bookings</Link>
        </div>
      </div>
    );
  }

  const shareUrl = booking.shareToken ? `${origin}/travel-agent/booking/share/${booking.shareToken}` : null;
  const isProperty = booking.bookingType === 'PROPERTY';
  const isShareExpired = booking.shareExpiresAt ? new Date(booking.shareExpiresAt) < new Date() : false;
  const sc = STATUS_CFG[booking.status] ?? STATUS_CFG.DRAFT;
  const StatusIcon = sc.icon;
  const tm = TYPE_META[booking.bookingType] ?? TYPE_META.CUSTOM;
  const TypeIcon = tm.icon;
  const totalAmt = Number(booking.totalAmount || 0);
  const paidAmt = Number(booking.paidAmount || 0);
  const balanceDue = totalAmt - paidAmt;
  const payPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : (paidAmt > 0 ? 100 : 0);
  const journeyStep = JOURNEY.indexOf(booking.status);
  const isTerminal = booking.status === 'CANCELLED';
  const initials = booking.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen -m-4 lg:-m-6 bg-gray-50">
      {/* Hero header */}
      <div className={`bg-gradient-to-r ${sc.grad} px-4 sm:px-6 pt-5 pb-16`}>
        <div className="flex items-center justify-between">
          <Link href="/travel-agent/bookings" className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> All Bookings
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/travel-agent/bookings/${id}/edit`}
              className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-semibold transition"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Link>
            <button onClick={deleteBooking} className="text-white/60 hover:text-white transition" title="Delete booking">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 mb-1">
          <p className="text-white/60 text-xs font-mono tracking-widest uppercase">{booking.bookingNumber}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{booking.customerName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/20 text-white text-sm px-3 py-1 rounded-full font-semibold">
              <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-medium">
              <TypeIcon className="w-3.5 h-3.5" /> {tm.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-10 pb-8">

        {/* Journey tracker */}
        {!isTerminal && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4 mb-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 mx-8" />
              <div
                className={`absolute left-0 top-4 h-0.5 bg-gradient-to-r ${sc.grad} mx-8 transition-all duration-500`}
                style={{ width: journeyStep >= 0 ? `${(journeyStep / (JOURNEY.length - 1)) * 100}%` : '0%' }}
              />
              {JOURNEY.map((step, i) => {
                const cfg = STATUS_CFG[step];
                const Ic = cfg.icon;
                const done = journeyStep > i;
                const active = journeyStep === i;
                return (
                  <button
                    key={step}
                    onClick={() => changeStatus(step)}
                    disabled={updatingStatus}
                    className="relative z-10 flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        done ? 'bg-emerald-500 shadow-md shadow-emerald-200' : active ? `bg-gradient-to-br ${sc.grad} shadow-md` : 'bg-gray-100'
                      }`}
                    >
                      <Ic className={`w-3.5 h-3.5 ${done || active ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

          {/* LEFT COLUMN */}
          <div className="space-y-4">

            {/* Customer card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer</p>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sc.grad} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-lg leading-tight">{booking.customerName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {booking.customerPhone}
                    </p>
                    {booking.customerEmail && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{booking.customerEmail}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className={`border-t border-gray-100 grid ${booking.customerEmail ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-gray-100`}>
                <a href={`tel:${booking.customerPhone}`} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition">
                  <Phone className="w-4 h-4" /> Call
                </a>
                <a
                  href={waLink(booking.customerPhone, `Hi ${booking.customerName}, regarding your booking #${booking.bookingNumber}...`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#25D366] hover:bg-green-50 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                {booking.customerEmail && (
                  <a href={`mailto:${booking.customerEmail}`} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
              </div>
            </div>

            {/* Trip details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{isProperty ? 'Stay Details' : 'Trip Details'}</p>
              <div className="space-y-3">
                {booking.referenceTitle && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><TypeIcon className="w-4 h-4 text-violet-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Reference</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.referenceTitle}</p>
                    </div>
                  </div>
                )}

                {!isProperty ? (
                  <>
                    {(booking.pickupLocation || booking.dropLocation) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-emerald-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Route</p>
                          {booking.pickupLocation && <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.pickupLocation}</p>}
                          {booking.dropLocation && <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><span className="text-gray-300">→</span> {booking.dropLocation}</p>}
                        </div>
                      </div>
                    )}
                    {(booking.travelDate || booking.returnDate) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-violet-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Dates</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            {booking.returnDate && <span className="text-gray-400 font-normal"> → {new Date(booking.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {booking.passengers && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-sky-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Passengers</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.passengers}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {(booking.checkInDate || booking.checkOutDate) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-violet-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Check-in → Check-out</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            {booking.checkOutDate && <span className="text-gray-400 font-normal"> → {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {(booking.passengers || booking.rooms) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-sky-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Guests / Rooms</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {booking.passengers ?? '—'} guests
                            {booking.rooms && <span className="text-gray-400 font-normal"> · {booking.rooms} rooms</span>}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {booking.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-amber-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Notes</p>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed whitespace-pre-line">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All statuses (manual override) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Set Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((s) => {
                  const cfg = STATUS_CFG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      disabled={updatingStatus || booking.status === s}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                        booking.status === s
                          ? `${cfg.badgeBg} ${cfg.badge} border-transparent ring-2 ring-offset-1 ring-emerald-400`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                      } disabled:cursor-not-allowed`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* Payment card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</p>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    booking.paymentStatus === 'PAID'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : booking.paymentStatus === 'PARTIAL'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : booking.paymentStatus === 'REFUNDED'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {booking.paymentStatus}
                </span>
              </div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900 mt-0.5">₹{totalAmt.toLocaleString('en-IN')}</p>
                </div>
                {paidAmt > 0 && paidAmt !== totalAmt && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Paid</p>
                    <p className="text-lg font-bold text-emerald-600">₹{paidAmt.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              {totalAmt > 0 && (
                <div className="mb-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${payPercent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${payPercent}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{payPercent}% paid</p>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="flex justify-between items-center bg-orange-50 border border-orange-100 rounded-xl px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-orange-700 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Balance Due</span>
                  <span className="text-sm font-bold text-orange-700">₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Share link */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share Link
              </p>
              {!shareUrl ? (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Generate a shareable link so the customer can fill in their details on their phone.
                  </p>
                  <button
                    onClick={generateShareLink}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm py-2.5 rounded-xl transition"
                  >
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Share2 className="w-4 h-4" /> Generate Link</>}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-700 truncate flex-1">{shareUrl}</code>
                      <button onClick={copyShareLink} className="text-emerald-600 hover:text-emerald-700 shrink-0" title="Copy link">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isShareExpired ? (
                    <p className="text-xs text-red-600 mb-3">⚠️ Link has expired</p>
                  ) : (
                    booking.shareExpiresAt && (
                      <p className="text-xs text-gray-500 mb-3">Expires {new Date(booking.shareExpiresAt).toLocaleDateString()}</p>
                    )
                  )}

                  {booking.customerFilledAt ? (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mb-3">
                      ✓ Customer filled details on {new Date(booking.customerFilledAt).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">⏳ Awaiting customer</p>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={waLink(booking.customerPhone, `Hi ${booking.customerName}, please complete your booking details: ${shareUrl}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition"
                    >
                      Send via WhatsApp
                    </a>
                    <button
                      onClick={generateShareLink}
                      disabled={generating}
                      className="flex items-center justify-center gap-1 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg transition"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={revokeShareLink}
                      className="flex items-center justify-center gap-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold py-2 px-3 rounded-lg transition"
                      title="Revoke"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Booking meta */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Booking Info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Booked on</span>
                  <span className="text-gray-700 text-xs font-semibold">{new Date(booking.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
