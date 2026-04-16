'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  User,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  KeyRound,
  Play,
  Flag,
  Gauge,
  Fuel,
  Settings2,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedVehicleName: string;
  requestedBrand: string;
  requestedCategory: string;
  requestedTransmission: string;
  requestedFuelType: string;
  requestedSeats: number;
  locationName: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  baseAmount: number;
  gstAmount: number;
  platformFee: number;
  securityDeposit: number;
  grandTotal: number;
  kmLimitPerDay: number;
  extraKmRate: number;
  status: string;
  paymentStatus: string;
  responseDeadline: string | null;
  createdAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  returnedAt: string | null;
  customerNotes: string;
  tripStartOtp: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  refundAmount?: number | null;
  advanceAmount?: number;
  advancePercentage?: number;
  paidAmount?: number;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; bg: string; text: string }> = {
    PENDING_VENDOR: { label: 'Awaiting Response', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    BROADCASTED: { label: 'Open Request', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    PENDING_PAYMENT: { label: 'Awaiting Payment', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    PAYMENT_VERIFIED: { label: 'Payment Received', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
    DROPPED: { label: 'Dropped', bg: 'bg-red-100', text: 'text-red-700' },
    EXPIRED: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' },
  };
  return configs[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
};

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const bookingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // OTP states
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpCopied, setOtpCopied] = useState(false);

  // Trip completion states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [odometerEnd, setOdometerEnd] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');


  // Chat states
  const [showChat, setShowChat] = useState(false);

  // Get vendor info from session
  const vendorUser = session?.user as any;
  const vendorId = vendorUser?.id || null;
  const vendorName = vendorUser?.businessName || vendorUser?.name || '';

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${bookingId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking(data.booking);
      } else {
        console.error('Booking not found');
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking accepted successfully!');
        fetchBooking();
      } else {
        alert(data.error || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Accept failed:', error);
      alert('Failed to accept booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking rejected. It will be broadcasted to other vendors.');
        router.push('/vendor/self-drive/bookings');
      } else {
        alert(data.error || 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Reject failed:', error);
      alert('Failed to reject booking');
    } finally {
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  const handleGenerateOtp = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/otp`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedOtp(data.otp || null);
        alert('OTP generated and sent to customer!');
        fetchBooking();
      } else {
        alert(data.error || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('OTP generation failed:', error);
      alert('Failed to generate OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!booking || !otpInput) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('OTP verified! Trip started.');
        setOtpInput('');
        setGeneratedOtp(null);
        fetchBooking();
      } else {
        alert(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert('Failed to verify OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odometerEnd: odometerEnd ? parseInt(odometerEnd) : null,
          damageNotes: damageNotes || null,
          additionalCharges: additionalCharges ? parseFloat(additionalCharges) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Trip completed successfully!');
        setShowCompleteModal(false);
        fetchBooking();
      } else {
        alert(data.error || 'Failed to complete trip');
      }
    } catch (error) {
      console.error('Trip completion failed:', error);
      alert('Failed to complete trip');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 bg-gray-100 rounded-lg ${shimmer}`} />
          <div className="space-y-1.5">
            <div className={`h-5 w-40 bg-gray-200 rounded-lg ${shimmer}`} />
            <div className={`h-3 w-48 bg-gray-50 rounded ${shimmer}`} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white/20 rounded-xl ${shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-5 w-44 bg-white/25 rounded-lg ${shimmer}`} />
                  <div className={`h-3 w-56 bg-white/15 rounded ${shimmer}`} />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className={`h-7 w-28 bg-white/20 rounded-lg ml-auto ${shimmer}`} />
                <div className={`h-3 w-20 bg-white/10 rounded ml-auto ${shimmer}`} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`bg-white rounded-xl border border-gray-100 p-4 h-36 ${shimmer}`} />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`bg-white rounded-xl border border-gray-100 p-4 h-40 ${shimmer}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
          <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm">
            <Car className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Booking Not Found</h2>
        <p className="text-sm text-gray-400 mb-5">The booking you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/vendor/self-drive/bookings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const canAcceptReject = ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status);
  const canGenerateOtp = ['ACCEPTED', 'PAYMENT_VERIFIED'].includes(booking.status);
  const canVerifyOtp = booking.status === 'READY_FOR_PICKUP';
  const canCompleteTrip = booking.status === 'IN_PROGRESS';

  return (
    <div className="space-y-4">
      {/* ══════════ Header ══════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm animate-slide-down lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vendor/self-drive/bookings" className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95 group shadow-sm">
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">#{booking.bookingNumber}</h1>
              <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', statusConfig.bg, statusConfig.text)}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Self-Drive Car Booking</p>
          </div>
        </div>
        <button onClick={() => setShowChat(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-all active:scale-95">
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </button>
      </div>

      {/* Dropped Banner */}
      {booking.status === 'DROPPED' && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-800">Booking Dropped</p>
            {(booking as any).dropReason && <p className="text-[10px] text-red-600">{(booking as any).dropReason}</p>}
          </div>
        </div>
      )}

      {/* ══════════ Hero Banner ══════════ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.15)] opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-6 py-5 text-slate-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-white shadow-lg shadow-slate-900/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-1">Premium booking</p>
                <h2 className="text-2xl font-extrabold text-white">{booking.requestedVehicleName}</h2>
                <p className="text-sm text-white/70 mt-1">{booking.requestedBrand} · {booking.requestedCategory}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 text-right lg:items-end lg:text-right">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">{booking.status.replace('_', ' ')}</span>
              <p className="text-3xl font-extrabold text-white">₹{(booking.grandTotal || 0).toLocaleString()}</p>
              <p className="text-sm text-white/70">₹{booking.dailyRate}/day · {booking.totalDays} days</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Pickup</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(booking.pickupDate)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Drop</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(booking.dropDate)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Seats</p>
              <p className="mt-1 text-sm font-semibold text-white">{booking.requestedSeats || 5} seats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* ══════════ Main Content ══════════ */}
        <div className="lg:col-span-2 space-y-3">
          {/* Customer */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> Customer
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-base font-bold text-white shadow-sm shadow-emerald-400/20">
                  {booking.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{booking.customerName}</p>
                  <p className="text-xs text-slate-500">{booking.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600 border border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-800">{booking.locationName}</span>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> Trip Details
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Duration</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{booking.totalDays} days</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">KM Limit</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{(booking.kmLimitPerDay || 200) * booking.totalDays} KM</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Extra KM</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">₹{booking.extraKmRate || 12}/km</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Pickup</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(booking.pickupDate)}</p>
                  {booking.pickupTime && (
                    <p className="text-xs font-medium text-slate-600">{formatTime(booking.pickupTime)}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{booking.pickupAddress || booking.locationName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Drop-off</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(booking.dropDate)}</p>
                  {booking.dropTime && (
                    <p className="text-xs font-medium text-slate-600">{formatTime(booking.dropTime)}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{booking.pickupAddress || booking.locationName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl border border-emerald-200 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-500" /> Customer Notes
                </h3>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-sm text-gray-700 leading-relaxed">{booking.customerNotes}</p>
              </div>
            </div>
          )}

          {/* ── Cancellation Details ── */}
          {booking.status === 'CANCELLED' && (
            <div className="rounded-xl border-2 border-red-300 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-sm font-bold text-white tracking-wide">Booking Cancelled</span>
              </div>

              <div className="bg-red-50 p-4 space-y-3">
                {/* Who & when */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-xs text-gray-400 mb-0.5">Cancelled By</p>
                    <p className="text-sm font-bold text-red-700 capitalize">
                      {booking.cancelledBy === 'CUSTOMER' ? 'Customer' : booking.cancelledBy || '—'}
                    </p>
                  </div>
                  {booking.cancelledAt && (
                    <div className="bg-white rounded-lg p-3 border border-red-100">
                      <p className="text-xs text-gray-400 mb-0.5">Cancelled At</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(booking.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.cancelledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {booking.cancellationReason && (
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Reason Given</p>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-red-800 leading-relaxed">
                        {booking.cancellationReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Refund info */}
                {booking.refundAmount != null && booking.refundAmount > 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Refund Eligible</p>
                      <p className="text-xs text-gray-500 mt-0.5">Amount paid by customer</p>
                    </div>
                    <p className="text-lg font-extrabold text-orange-700">₹{booking.refundAmount.toLocaleString('en-IN')}</p>
                  </div>
                ) : booking.paidAmount != null && booking.paidAmount === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-700 font-medium">No payment was made — no refund required.</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ Sidebar ══════════ */}
        <div className="space-y-3">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Payment
              </h3>
            </div>
            <div className="p-3.5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Rate × {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                <span className="font-medium text-gray-900">₹{(booking.baseAmount || 0).toLocaleString()}</span>
              </div>
              {booking.gstAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">GST</span>
                  <span className="font-medium text-gray-700">₹{booking.gstAmount.toLocaleString()}</span>
                </div>
              )}
              {booking.platformFee > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Platform Fee</span>
                  <span className="font-medium text-gray-700">₹{booking.platformFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-dashed border-gray-200 pt-2">
                <span className="text-gray-800">Rental Total</span>
                <span className="text-emerald-600">₹{(booking.grandTotal || 0).toLocaleString()}</span>
              </div>
              {(booking.securityDeposit || 0) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Security Deposit <span className="text-emerald-500">(Refundable)</span></span>
                  <span className="font-medium text-gray-700">₹{booking.securityDeposit.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total to Pay</span>
                <span className="text-emerald-600">₹{((booking.grandTotal || 0) + (booking.securityDeposit || 0)).toLocaleString()}</span>
              </div>
              {(booking.advanceAmount || 0) > 0 && (() => {
                const advPct = booking.advancePercentage || (booking.grandTotal > 0 ? Math.round(((booking.advanceAmount || 0) / booking.grandTotal) * 100) : 0);
                const balance = (booking.grandTotal || 0) + (booking.securityDeposit || 0) - (booking.advanceAmount || 0);
                return (
                  <>
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>Advance {advPct > 0 ? `(${advPct}%)` : ''}</span>
                      <span className="font-bold">₹{(booking.advanceAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Balance at Pickup</span>
                      <span className="font-bold">₹{balance.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
              {(booking.paidAmount || 0) > 0 && (
                <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                  <span className="text-gray-400">Paid so far</span>
                  <span className="font-bold text-green-600">₹{(booking.paidAmount || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
            <div className="px-3.5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Actions</h3>
            </div>
            <div className="p-4 space-y-4">
              {canAcceptReject && (
                <div className="space-y-3">
                  <button onClick={handleAccept} disabled={processing} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm rounded-3xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accept Booking
                  </button>
                  <button onClick={() => setShowRejectModal(true)} disabled={processing} className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-red-50 text-red-600 font-bold text-sm rounded-3xl transition-all border border-red-200 active:scale-[0.98] disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {canGenerateOtp && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <KeyRound className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-emerald-700">
                      {booking.status === 'PAYMENT_VERIFIED' ? 'Payment received!' : 'Ready for pickup'}
                    </p>
                    <p className="text-[10px] text-emerald-600">Generate OTP to start trip</p>
                  </div>
                  <button onClick={handleGenerateOtp} disabled={processing} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Generate OTP
                  </button>
                  {generatedOtp && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">OTP (Dev)</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-bold font-mono tracking-widest">{generatedOtp}</span>
                        <button onClick={() => { navigator.clipboard.writeText(generatedOtp); setOtpCopied(true); setTimeout(() => setOtpCopied(false), 2000); }} className="p-1.5 hover:bg-gray-200 rounded-lg transition">
                          {otpCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canVerifyOtp && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <KeyRound className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-emerald-700">Ask customer for OTP</p>
                  </div>
                  <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" className="w-full px-3 py-2.5 text-center text-xl font-mono tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" maxLength={6} />
                  <button onClick={handleVerifyOtp} disabled={processing || otpInput.length !== 6} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Verify & Start Trip
                  </button>
                </div>
              )}

              {canCompleteTrip && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <Play className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-emerald-700">Trip in progress</p>
                    {booking.pickedUpAt && <p className="text-[10px] text-emerald-500">Started: {formatDateTime(booking.pickedUpAt)}</p>}
                  </div>
                  <button onClick={() => setShowCompleteModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-[0.98]">
                    <Flag className="w-4 h-4" /> Complete Trip
                  </button>
                </div>
              )}

              {booking.status === 'COMPLETED' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-emerald-700">Trip Completed</p>
                  {booking.returnedAt && <p className="text-[10px] text-emerald-500">{formatDateTime(booking.returnedAt)}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Timeline
              </h3>
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs font-bold text-gray-700">{formatDateTime(booking.createdAt)}</span>
                </div>
              </div>
              {booking.acceptedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Accepted</span>
                    <span className="text-xs font-bold text-gray-700">{formatDateTime(booking.acceptedAt)}</span>
                  </div>
                </div>
              )}
              {booking.pickedUpAt && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Trip Started</span>
                    <span className="text-xs font-bold text-gray-700">{formatDateTime(booking.pickedUpAt)}</span>
                  </div>
                </div>
              )}
              {booking.returnedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Completed</span>
                    <span className="text-xs font-bold text-gray-700">{formatDateTime(booking.returnedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white/95 rounded-[32px] shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Reject Booking</h2>
            <p className="text-gray-600 mb-4">
              Are you sure? This booking will be broadcasted to other vendors.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select a reason...</option>
                <option value="vehicle_unavailable">Car not available</option>
                <option value="maintenance">Car under maintenance</option>
                <option value="already_booked">Already booked</option>
                <option value="location_issue">Cannot serve this location</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white/95 rounded-[32px] shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Complete Trip</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading (End)
                </label>
                <input
                  type="number"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                  placeholder="Enter final odometer reading"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Damage Notes (if any)
                </label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Describe any damage..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Charges (₹)
                </label>
                <input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleCompleteTrip} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Complete Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id}
              vendorId={vendorId}
              vendorName={vendorName}
              customerId={booking.customerId || undefined}
              customerName={booking.customerName}
              customerEmail={booking.customerEmail}
              customerPhone={booking.customerPhone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
