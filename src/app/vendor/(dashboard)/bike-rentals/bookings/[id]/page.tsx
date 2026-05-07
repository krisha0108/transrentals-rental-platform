'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Mail,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  RefreshCw,
  Play,
  Square,
  KeyRound,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AcceptBookingModal } from '@/components/vendor/AcceptBookingModal';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';
import { MessageCircle } from 'lucide-react';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedVehicleName: string;
  requestedBrand: string | null;
  requestedCategory: string | null;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  numberOfVehicles?: number;
  pickupAddress?: string;
  dailyRate: number;
  totalAmount: number;
  gstAmount: number;
  securityDeposit: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  customerNotes: string | null;
  acceptedVehicleName: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

interface VehicleOption {
  id: string;
  name: string;
  registrationNumber?: string;
  dailyRate: number;
  fleetPricing: any[];
  fleetLocations: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING_PAYMENT: {
    label: 'Awaiting Payment',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CreditCard,
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Clock,
  },
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  PENDING_VENDOR: {
    label: 'Pending Acceptance',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  BROADCASTED: {
    label: 'Open Request',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: AlertCircle,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: KeyRound,
  },
  IN_PROGRESS: {
    label: 'Trip In Progress',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Bike,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  DROPPED: {
    label: 'Dropped',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Payment Pending', color: 'bg-yellow-50 text-yellow-700' },
  SUBMITTED: { label: 'Payment Submitted', color: 'bg-amber-50 text-amber-700' },
  VERIFIED: { label: 'Payment Verified', color: 'bg-green-50 text-green-700' },
  PARTIAL: { label: 'Partial Payment', color: 'bg-emerald-50 text-emerald-700' },
  PAID: { label: 'Paid', color: 'bg-green-50 text-green-700' },
  COMPLETED: { label: 'Paid', color: 'bg-green-50 text-green-700' },
  REJECTED: { label: 'Payment Rejected', color: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-50 text-gray-700' },
};

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [vendorDbId, setVendorDbId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>('');

  // Fetch vendor info from database
  useEffect(() => {
    async function fetchVendorInfo() {
      try {
        const res = await fetch('/api/vendor/profile');
        const data = await res.json();
        if (data.id) {
          setVendorDbId(data.id);
          setVendorName(data.businessName || data.ownerName || '');
        }
      } catch (error) {
        console.error('Failed to fetch vendor info:', error);
      }
    }
    fetchVendorInfo();
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch booking details
        const res = await fetch(`/api/vendor/bike-bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const data = await res.json();
        setBooking(data.booking);

        // Fetch vendor fleet for accept modal
        const fleetRes = await fetch('/api/vendor/fleet?serviceSlug=bike-rental');
        if (fleetRes.ok) {
          const fleetData = await fleetRes.json();
          setVendorFleet(
            fleetData.fleet?.map((f: any) => ({
              id: f.id,
              name: f.vehicle_models?.name || 'Unknown',
              registrationNumber: f.registrationNumber,
              dailyRate: f.fleetPricing?.[0]?.perDayRate || f.fleetPricing?.[0]?.basePrice || 0,
              fleetPricing: f.fleetPricing || [],
              fleetLocations: f.fleetLocations || [],
            })) || []
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleAcceptBooking = async (data: {
    vehicleId: string;
    vehicleName: string;
    customRate?: number;
  }) => {
    if (!booking) return;

    const response = await fetch(`/api/vendor/bike-bookings/${booking.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.error || 'Failed to accept booking');
      (error as any).status = response.status;
      throw error;
    }

    // Refresh booking data
    setBooking((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : prev));
    setAcceptModalOpen(false);
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/otp`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate OTP');
      }

      setOtpSent(true);
      setOtpSuccess('OTP sent to customer successfully!');
      // In development, we get the OTP in response
      if (data.otp) {
        setGeneratedOtp(data.otp);
      }
      // Update booking status
      setBooking((prev) => (prev ? { ...prev, status: 'READY_FOR_PICKUP' } : prev));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to generate OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and start trip
  const handleStartTrip = async () => {
    if (!booking || !otpInput) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput, action: 'start' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setOtpSuccess('Trip started successfully!');
      setBooking((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : prev));
      setOtpInput('');
      setGeneratedOtp(null);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // End trip
  const handleEndTrip = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      // For now, we'll end trip without OTP (can add OTP later if needed)
      const response = await fetch(`/api/vendor/bike-bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete trip');
      }

      setOtpSuccess('Trip completed successfully!');
      setBooking((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to complete trip');
    } finally {
      setOtpLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 bg-gray-200 rounded-lg" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
              <div className="h-5 w-24 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Hero card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded-lg" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className="h-6 w-20 bg-gray-200 rounded-lg ml-auto" />
              <div className="h-3 w-24 bg-gray-100 rounded ml-auto" />
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="h-2.5 w-12 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-2.5 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Content grid skeleton */}
        <div className="grid lg:grid-cols-3 gap-4 animate-pulse">
          <div className="lg:col-span-2 space-y-4">
            {/* Customer card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-4 w-20 bg-gray-200 rounded-lg mb-3" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="h-7 w-24 bg-gray-100 rounded-lg" />
                <div className="h-7 w-16 bg-gray-100 rounded-lg" />
                <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Payment card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-4 w-20 bg-gray-200 rounded-lg mb-3" />
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2.5">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-5 w-20 bg-emerald-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
            {/* Trip control card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-4 w-24 bg-gray-200 rounded-lg mb-3" />
              <div className="h-3 w-full bg-gray-100 rounded mb-3" />
              <div className="h-10 w-full bg-emerald-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Booking Not Found</h3>
        <p className="text-gray-400 text-sm mb-5">{error || 'The booking does not exist.'}</p>
        <button onClick={() => router.push('/vendor/bike-rentals/bookings')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
  const StatusIcon = statusConfig.icon;
  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;

  return (
    <div className="space-y-5">
      {/* Accept Booking Modal */}
      <AcceptBookingModal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        booking={booking ? {
          id: booking.id, bookingNumber: booking.bookingNumber, customerName: booking.customerName,
          customerPhone: booking.customerPhone, vehicleName: booking.requestedVehicleName,
          locationId: (booking as any).locationId || '', locationName: booking.locationName,
          pickupDate: booking.pickupDate, pickupTime: booking.pickupTime,
          dropDate: booking.dropDate, dropTime: booking.dropTime,
          totalDays: booking.totalDays, dailyRate: booking.dailyRate,
          totalAmount: booking.totalAmount, grandTotal: booking.grandTotal, type: 'direct',
        } : null}
        vehicles={vendor_fleet}
        onAccept={handleAcceptBooking}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/vendor/bike-rentals/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">#{booking.bookingNumber}</h1>
              <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border', statusConfig.color)}>
                <StatusIcon className="w-3 h-3" /> {statusConfig.label}
              </span>
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', paymentConfig.color)}>{paymentConfig.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(booking.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {vendorDbId && ['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
            <button onClick={() => setShowChat(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all">
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </button>
          )}
          {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED') && (
            <button onClick={() => setAcceptModalOpen(true)} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 transition-all active:scale-95">
              <CheckCircle className="w-3.5 h-3.5" /> Accept Booking
            </button>
          )}
        </div>
      </div>

      {/* Cancelled Banner */}
      {booking.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-red-100 border-b border-red-200 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-bold text-red-800">Booking Cancelled by Customer</p>
          </div>
          <div className="px-4 py-3">
            {(booking as any).cancellationReason ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Reason</p>
                <p className="text-sm text-red-900 font-medium">{(booking as any).cancellationReason}</p>
              </div>
            ) : (
              <p className="text-sm text-red-700">No reason provided by customer.</p>
            )}
          </div>
        </div>
      )}

      {/* Dropped Banner */}
      {booking.status === 'DROPPED' && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">This booking has been dropped</p>
            {(booking as any).dropReason && <p className="text-xs text-red-600 mt-0.5">Reason: {(booking as any).dropReason}</p>}
            {(booking as any).droppedAt && <p className="text-xs text-red-500 mt-0.5">Dropped: {new Date((booking as any).droppedAt).toLocaleString('en-IN')}</p>}
          </div>
        </div>
      )}

      {/* ── Vehicle + Price Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-emerald-50/30 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center text-2xl shadow-sm shrink-0">🏍️</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{booking.requestedVehicleName}</h2>
              <p className="text-xs text-gray-400">{[booking.requestedBrand, booking.requestedCategory].filter(Boolean).join(' · ')}</p>
              {booking.numberOfVehicles && booking.numberOfVehicles > 1 && (
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">{booking.numberOfVehicles} bikes required</p>
              )}
              {booking.pickupAddress && (
                <p className="text-xs text-gray-500 mt-0.5">Pickup: {booking.pickupAddress}</p>
              )}
              {booking.acceptedVehicleName && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Assigned: {booking.acceptedVehicleName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-gray-900">₹{booking.grandTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400">₹{booking.dailyRate}/day × {booking.totalDays}d</p>
          </div>
        </div>
        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { label: 'Pickup', value: formatDate(booking.pickupDate), sub: formatTime(booking.pickupTime) },
            { label: 'Drop-off', value: formatDate(booking.dropDate), sub: formatTime(booking.dropTime) },
            { label: 'Duration', value: `${booking.totalDays} day${booking.totalDays > 1 ? 's' : ''}`, sub: booking.locationName },
            { label: 'Deposit', value: `₹${booking.securityDeposit.toLocaleString()}`, sub: 'Refundable' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ══ Main Content ══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-emerald-500" /> Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600 shrink-0">
                {booking.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{booking.customerName}</p>
                <p className="text-xs text-gray-400">{booking.customerEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {booking.customerPhone && (
                <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all">
                  <User className="w-3 h-3" /> {booking.customerPhone}
                </a>
              )}
              <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all">
                <Mail className="w-3 h-3" /> Email
              </a>
              {booking.customerPhone && (
                <a href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Customer Notes</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{booking.customerNotes}</p>
            </div>
          )}
        </div>

        {/* ══ Sidebar ══ */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500" /> Payment</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Daily Rate</span><span className="font-semibold text-gray-700">₹{booking.dailyRate.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Duration</span><span className="font-semibold text-gray-700">{booking.totalDays} days</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-700">₹{booking.totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Security Deposit</span><span className="font-semibold text-gray-700">₹{booking.securityDeposit.toLocaleString()}</span></div>
              <div className="border-t border-gray-100 pt-2.5 mt-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900">Grand Total</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{booking.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED') && (
              <div className="mt-4 space-y-2">
                <button onClick={() => setAcceptModalOpen(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all active:scale-95">
                  <CheckCircle className="w-4 h-4" /> Accept Booking
                </button>
                <button className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-500 font-semibold rounded-xl text-sm hover:bg-red-50 transition-all">
                  <XCircle className="w-4 h-4" /> Decline
                </button>
              </div>
            )}
          </div>

          {/* Payment Received Info */}
          {booking.status === 'PAYMENT_VERIFIED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Advance Payment Received!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Prepare the bike and generate OTP when customer arrives.</p>
                </div>
              </div>
            </div>
          )}

          {/* Trip Control */}
          {(booking.status === 'PAYMENT_VERIFIED' || booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Play className="w-4 h-4 text-emerald-500" /> Trip Control</h3>

              {otpError && <div className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">{otpError}</div>}
              {otpSuccess && <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs">{otpSuccess}</div>}

              {(booking.status === 'PAYMENT_VERIFIED' || booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    {booking.status === 'PAYMENT_VERIFIED' ? 'Payment received! Generate OTP to start trip.' : 'Generate OTP when customer arrives.'}
                  </p>
                  <button onClick={handleGenerateOtp} disabled={otpLoading} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 active:scale-95">
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send OTP to Customer
                  </button>
                </div>
              )}

              {booking.status === 'READY_FOR_PICKUP' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-xs text-emerald-700 font-medium">OTP sent to customer!</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Ask customer for the OTP from their booking page.</p>
                  </div>
                  <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all" maxLength={6} />
                  <button onClick={handleStartTrip} disabled={otpLoading || otpInput.length !== 6} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 active:scale-95">
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Verify & Start Trip
                  </button>
                  <button onClick={handleGenerateOtp} disabled={otpLoading} className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                </div>
              )}

              {booking.status === 'IN_PROGRESS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-700 font-medium">Trip in progress</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Complete when customer returns the bike.</p>
                  </div>
                  <button onClick={handleEndTrip} disabled={otpLoading} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 active:scale-95">
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                    End Trip & Complete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Completed */}
          {booking.status === 'COMPLETED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-800">Trip Completed!</h3>
              <p className="text-xs text-emerald-600 mt-0.5">Booking successfully completed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && vendorDbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id} vendorId={vendorDbId} vendorName={vendorName}
              customerId={booking.customerId || undefined} customerName={booking.customerName}
              customerEmail={booking.customerEmail} customerPhone={booking.customerPhone}
              isOpen={showChat} onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
