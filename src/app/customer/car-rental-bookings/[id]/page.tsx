'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Navigation,
  Plane,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  Star,
  Download,
  Share2,
  HelpCircle,
} from 'lucide-react';
import { BikeBookingChat } from '@/components/bike/BikeBookingChat';
import { DriverBookingChat } from '@/components/driver/DriverBookingChat';
import { BookingPayment } from '@/components/payment/BookingPayment';
import { useCustomerAuth } from '@/hooks/useCustomer';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  acceptedVendorId: string | null;
  tripType: string;
  carCategory: string;
  carCategoryName: string;
  pickupCity: string;
  dropCity?: string;
  intermediateStops?: Array<{ id: string; locationId: string; cityText: string }>;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageId?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  baseFare: number;
  perKmRate?: number;
  chargeableKm?: number;
  kmCharges?: number;
  driverBatta?: number;
  nightCharges?: number;
  tollCharges?: number;
  gstAmount: number;
  platformFee: number;
  grandTotal: number;
  paidAmount?: number;
  advanceAmount?: number;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  driverPhoto?: string;
  acceptedDriverId?: string | null;
  acceptedStaffId?: string | null;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleFuelType?: string;
  vehicleSeats?: number;
  vehicleYear?: number;
  vehiclePhoto?: string;
  vehiclePhotos?: {
    front?: string | null;
    back?: string | null;
    leftSide?: string | null;
    rightSide?: string | null;
    interior?: string | null;
  };
  vendorVehicleImages?: string[];
  tripStartOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  vendor?: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    logo?: string | null;
    city?: string | null;
    rating?: number | null;
  } | null;
  rating?: number;
  review?: string;
  paymentStatus?: string;
  transactionId?: string;
  vendorNotes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  PENDING_VENDOR: { label: 'Finding Driver', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  BROADCASTED: { label: 'Finding Driver', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ACCEPTED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};


function InitialAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className={`flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-sm select-none ${className}`}>
      {initials}
    </div>
  );
}

export default function CarRentalBookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { customer } = useCustomerAuth();
  const isNew = searchParams.get('new') === 'true';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetchBooking = async (silent = false) => {
    try {
      const response = await fetch(`/api/car-rental/bookings/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  // Poll every 10s when waiting for OTP (driver hasn't sent it yet)
  useEffect(() => {
    if (!booking) return;
    const isWaitingForOtp =
      ['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) && !booking.tripStartOtp;
    if (!isWaitingForOtp) return;

    const interval = setInterval(() => fetchBooking(true), 10000);
    return () => clearInterval(interval);
  }, [booking?.status, booking?.tripStartOtp]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/car-rental/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cancellationReason: cancelReason.trim(),
          cancelledBy: 'customer',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          cancelledBy: 'customer',
          cancellationReason: cancelReason.trim(),
        } : null);
        setShowCancelModal(false);
        setCancelReason('');
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch {
      alert('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    try {
      const response = await fetch(`/api/car-rental/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate', rating, review }),
      });
      const data = await response.json();
      if (data.success) {
        setBooking((prev) => prev ? { ...prev, rating, review } : null);
        setShowRatingModal(false);
        alert('Thank you for your feedback!');
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (error) {
      alert('Failed to submit rating');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
          <Link href="/customer/car-rental-bookings" className="text-emerald-600 hover:underline">
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
  const canCancel = ['PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status);
  const canRate = booking.status === 'COMPLETED' && !booking.rating;


  // Progress rail — presentation only, derived from booking.status. No new state.
  const BOOKING_STEPS = [
    'Pending Payment',
    'Payment Review',
    'Finding Driver',
    'Confirmed',
    'Driver Assigned',
    'Trip in Progress',
    'Completed',
  ];
  const STEP_INDEX_BY_STATUS: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PAYMENT_SUBMITTED: 1,
    PENDING_VENDOR: 2,
    BROADCASTED: 2,
    ACCEPTED: 3,
    DRIVER_ASSIGNED: 4,
    IN_PROGRESS: 5,
    COMPLETED: 6,
  };
  const currentStepIdx = STEP_INDEX_BY_STATUS[booking.status] ?? 0;

  const cardCls = 'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm';
  const headCls = 'flex items-center justify-between gap-3 border-b border-gray-50 bg-[#FCFDFC] px-4 py-3';
  const labelCls = 'text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400';
  const actionRowCls =
    'group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:border-[#C8F1DF] hover:bg-[#FCFDFC] hover:shadow-[0_8px_20px_-12px_rgba(1,35,20,.35)]';
  const actionIconCls =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition group-hover:bg-[#E9FAF2] group-hover:text-[#056B3E]';

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />

      {/* Success Banner for new booking */}
      {isNew && (
        <div className="bg-[#09B368] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2.5 text-[13.5px] font-semibold">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Booking confirmed! We&apos;re finding a driver for you.</span>
          </div>
        </div>
      )}

      {/* ══════════════ Hero header ══════════════ */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#056B3E_0%,#078F53_42%,#09B368_100%)]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(680px 300px at 90% -30%, rgba(255,255,255,.24), transparent 60%),' +
              'radial-gradient(460px 240px at 4% 130%, rgba(1,35,20,.6), transparent 58%),' +
              'repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 1px, transparent 1px 46px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          {/* Back link + status */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/customer/car-rental-bookings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Bookings
            </Link>
            <div className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
          </div>

          {/* Title + stat strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Car className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight tracking-tight capitalize">
                  {booking.carCategoryName} · {booking.tripType.replace(/_/g, ' ').toLowerCase()}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.pickupCity && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.pickupCity}
                    </span>
                  )}
                  {booking.localPackageId && (
                    <span className="text-xs text-white/[0.62]">
                      {booking.localPackageHours} hrs / {booking.localPackageKm} km package
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-3 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Pickup</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Time</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">{booking.pickupTime}</p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Total</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{booking.grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Progress rail — reflects booking.status, no new state */}
          {booking.status !== 'CANCELLED' && (
            <div className="mt-6 border-t border-white/[0.13] pt-5">
              <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_82%,transparent)] md:[mask-image:none]">
                {BOOKING_STEPS.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isNow = i === currentStepIdx;
                  return (
                    <div key={step} className="relative min-w-[112px] flex-1 text-center">
                      {i > 0 && (
                        <span className="absolute top-[10px] left-[calc(-50%+12px)] right-[calc(50%+12px)] h-0.5 overflow-hidden rounded-sm bg-white/20">
                          <span className={`block h-full rounded-sm bg-white transition-[width] duration-700 ${i <= currentStepIdx ? 'w-full' : 'w-0'}`} />
                        </span>
                      )}
                      <span
                        className={`relative z-10 mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition ${
                          isNow
                            ? 'border-amber-100 bg-amber-100 text-amber-800 shadow-[0_0_0_5px_rgba(254,243,199,.2)]'
                            : isDone
                              ? 'border-white bg-white text-[#056B3E]'
                              : 'border-white/30 bg-white/[0.16] text-white/50'
                        }`}
                      >
                        {isDone && <CheckCircle className="h-3 w-3" strokeWidth={3.5} />}
                        {isNow && <Clock className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={`mt-2.5 block whitespace-nowrap text-[11px] ${isNow ? 'font-bold text-white' : isDone ? 'font-semibold text-white/90' : 'font-semibold text-white/[0.55]'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ Body ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">

        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">

          {/* ── Service Provider — vendor accepted from dashboard, no driver/staff ── */}
          {booking.vendor && !booking.acceptedDriverId && !booking.acceptedStaffId && (
            <div className={cardCls}>
              <div className={headCls}><p className={labelCls}>Service Provider</p></div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-[46px] h-[46px] rounded-2xl overflow-hidden border border-[#C8F1DF] flex-shrink-0">
                    {booking.vendor.logo
                      ? <img src={booking.vendor.logo} alt="Vendor"
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }}
                        />
                      : null}
                    <InitialAvatar name={booking.vendor.businessName} className={`w-full h-full rounded-2xl ${booking.vendor.logo ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold text-gray-900 leading-tight truncate">{booking.vendor.businessName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{booking.vendor.ownerName}{booking.vendor.city ? ` · ${booking.vendor.city}` : ''}</p>
                    {booking.vendor.rating && booking.vendor.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[11.5px] text-gray-500 font-semibold">{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <a href={`tel:${booking.vendor.phone}`}
                    className="flex items-center gap-1.5 rounded-xl bg-[#E9FAF2] px-3 py-2 text-[12.5px] font-bold text-[#056B3E] transition hover:bg-[#C8F1DF] flex-shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                </div>

                {/* Driver assigned by vendor */}
                {(booking.driverName || booking.acceptedDriverId) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-2.5">Assigned Driver</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-100 flex-shrink-0">
                        {booking.driverPhoto
                          ? <img src={booking.driverPhoto} alt="Driver"
                              className="w-full h-full object-cover"
                              onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }}
                            />
                          : null}
                        <InitialAvatar name={booking.driverName || 'D'} className={`w-full h-full rounded-full bg-indigo-100 text-indigo-700 ${booking.driverPhoto ? 'hidden' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-extrabold text-gray-900 leading-tight truncate">{booking.driverName || 'Driver Assigned'}</p>
                        {booking.driverPhone && <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{booking.driverPhone}</p>}
                      </div>
                      {booking.driverPhone && (
                        <a href={`tel:${booking.driverPhone}`}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-[12.5px] font-bold text-indigo-700 transition hover:bg-indigo-100 flex-shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Details */}
                {(booking.vehicleNumber || booking.vehicleModel) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-2.5">Vehicle</p>
                    <div className="flex items-start gap-3">
                      {booking.vehiclePhoto && (
                        <img src={booking.vehiclePhoto} alt="Vehicle" className="w-[74px] h-[52px] object-cover rounded-xl border border-gray-200 flex-shrink-0"
                          onError={e => { e.currentTarget.style.display='none'; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        {booking.vehicleModel && (
                          <p className="text-[14px] font-extrabold text-gray-900">{booking.vehicleModel}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                          {booking.vehicleNumber && (
                            <span className="font-mono rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11.5px] font-bold text-gray-700">{booking.vehicleNumber}</span>
                          )}
                          {booking.vehicleColor && <span className="text-[11.5px] text-gray-500">{booking.vehicleColor}</span>}
                          {booking.vehicleYear && <span className="text-[11.5px] text-gray-500">{booking.vehicleYear}</span>}
                          {booking.vehicleFuelType && <span className="text-[11.5px] text-gray-500">{booking.vehicleFuelType}</span>}
                          {booking.vehicleSeats && <span className="text-[11.5px] text-gray-500">{booking.vehicleSeats} Seats</span>}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Photo Gallery */}
                    {(() => {
                      // Collect all available photos into one list
                      const allPhotos: string[] = [];
                      const slots = [
                        { key: 'front' as const, label: 'Front' },
                        { key: 'back' as const, label: 'Back' },
                        { key: 'leftSide' as const, label: 'Left' },
                        { key: 'rightSide' as const, label: 'Right' },
                        { key: 'interior' as const, label: 'Interior' },
                      ];
                      slots.forEach(s => { if (booking.vehiclePhotos?.[s.key]) allPhotos.push(booking.vehiclePhotos[s.key]!); });
                      (booking.vendorVehicleImages || []).forEach(u => { if (u && !allPhotos.includes(u)) allPhotos.push(u); });
                      if (!allPhotos.length) return null;
                      return (
                        <div className="mt-3.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-2">Vehicle Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {allPhotos.map((url, i) => (
                              <button key={i} onClick={() => setLightbox({ images: allPhotos, index: i })}
                                className="focus:outline-none rounded-xl overflow-hidden border border-gray-200 transition hover:-translate-y-0.5 hover:border-[#09B368]">
                                <img src={url} alt={`Photo ${i + 1}`}
                                  className="w-[72px] h-[54px] object-cover"
                                  onError={e => { (e.currentTarget.closest('button') as HTMLElement).style.display='none'; }} />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Service Provider — independent driver OR vendor's staff driver ── */}
          {(booking.acceptedDriverId || booking.acceptedStaffId) && (
            <div className={cardCls}>
              <div className={headCls}><p className={labelCls}>Service Provider</p></div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-[46px] h-[46px] rounded-full overflow-hidden border border-[#C8F1DF] flex-shrink-0">
                    {booking.driverPhoto
                      ? <img src={booking.driverPhoto} alt="Driver" className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }} />
                      : null}
                    <InitialAvatar name={booking.driverName || 'D'} className={`w-full h-full rounded-full ${booking.driverPhoto ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold text-gray-900 leading-tight truncate">{booking.driverName || 'Driver Assigned'}</p>
                    {booking.driverPhone && <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{booking.driverPhone}</p>}
                  </div>
                  {booking.driverPhone && (
                    <a href={`tel:${booking.driverPhone}`}
                      className="flex items-center gap-1.5 rounded-xl bg-[#E9FAF2] px-3 py-2 text-[12.5px] font-bold text-[#056B3E] transition hover:bg-[#C8F1DF] flex-shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                </div>

                {/* Vehicle info (assigned by driver) */}
                {(booking.vehicleNumber || booking.vehicleModel) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-2.5">Assigned Vehicle</p>
                    <div className="flex items-start gap-3">
                      <div className="w-[46px] h-[46px] rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {booking.vehicleModel && (
                          <p className="text-[14px] font-extrabold text-gray-900">{booking.vehicleModel}</p>
                        )}
                        {booking.vehicleNumber && (
                          <span className="font-mono rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11.5px] font-bold text-gray-700 mt-1.5 inline-block">{booking.vehicleNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Trip Start OTP ── */}
          {['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
            booking.tripStartOtp ? (
              <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#B45309,#F59E0B)] p-5 text-white shadow-[0_18px_44px_-14px_rgba(245,158,11,.5)]">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: 'radial-gradient(420px 180px at 90% -20%, rgba(255,255,255,.25), transparent 60%)' }}
                />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/[0.75]">Trip Start OTP</p>
                    <span className="mt-2.5 flex gap-2">
                      {booking.tripStartOtp.split('').map((d, i) => (
                        <span key={i}
                          className="flex h-[52px] w-11 items-center justify-center rounded-xl border border-white/30 bg-white/[0.18] text-2xl font-extrabold tabular-nums">
                          {d}
                        </span>
                      ))}
                    </span>
                    <p className="mt-3 text-[11.5px] text-white/[0.78]">Share this with your driver to start the trip</p>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-white/[0.18] border border-white/30 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="w-[38px] h-[38px] rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-amber-700">Trip Start OTP</p>
                  <p className="text-[12.5px] text-amber-800 mt-0.5">Waiting for driver to assign vehicle. OTP will appear here.</p>
                </div>
                <button onClick={() => fetchBooking(true)}
                  className="ml-auto rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 flex-shrink-0 transition hover:bg-amber-100">
                  Refresh
                </button>
              </div>
            )
          )}

          {/* ── Trip Details ── */}
          <div className={cardCls}>
            <div className={headCls}><p className={labelCls}>Trip Details</p></div>
            <div className="p-4">

              {/* Trip Type Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {booking.tripType === 'OUTSTATION_ROUNDTRIP' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11.5px] font-bold text-blue-700">
                    <Navigation className="w-3 h-3" /> Round Trip
                  </span>
                )}
                {booking.tripType === 'OUTSTATION_ONEWAY' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11.5px] font-bold text-indigo-700">
                    <Navigation className="w-3 h-3" /> One Way
                  </span>
                )}
                {booking.tripType === 'LOCAL' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1 text-[11.5px] font-bold text-[#056B3E]">
                    <Navigation className="w-3 h-3" /> Local
                  </span>
                )}
                {(booking.tripType === 'AIRPORT_PICKUP' || booking.tripType === 'AIRPORT_DROP') && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11.5px] font-bold text-sky-700">
                    <Plane className="w-3 h-3" /> {booking.tripType === 'AIRPORT_PICKUP' ? 'Airport Pickup' : 'Airport Drop'}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11.5px] font-bold text-gray-600">
                  <Car className="w-3 h-3" /> {booking.carCategoryName}
                </span>
                {booking.totalDays > 1 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-700">
                    <Calendar className="w-3 h-3" /> {booking.totalDays} Days
                  </span>
                )}
              </div>

              {/* Route */}
              {(() => {
                const stops = booking.intermediateStops?.filter((s) => s.cityText) || [];
                const allPoints = [
                  { label: booking.pickupAddress || booking.pickupCity, sub: `${new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at ${booking.pickupTime}`, type: 'pickup' },
                  ...stops.map((s) => ({ label: s.cityText, sub: 'Via', type: 'stop' })),
                  { label: booking.dropAddress || booking.dropCity || booking.pickupCity, sub: booking.returnDate ? `Return: ${new Date(booking.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}` : '', type: 'drop' },
                ];
                return (
                  <div className="flex items-stretch gap-3.5">
                    <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                      {allPoints.map((p, i) => (
                        <React.Fragment key={i}>
                          <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] border-white ${
                            p.type === 'pickup'
                              ? 'bg-[#09B368] shadow-[0_0_0_3px_#E9FAF2]'
                              : p.type === 'drop'
                                ? 'bg-red-500 shadow-[0_0_0_3px_#FEF2F2]'
                                : 'bg-orange-400 shadow-[0_0_0_3px_#FFF7ED]'
                          }`} />
                          {i < allPoints.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[44px] bg-[repeating-linear-gradient(180deg,#E5E7EB_0_5px,transparent_5px_10px)]" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-3.5">
                      {allPoints.map((point, i) => (
                        <div key={i} className={`pb-3.5 ${i < allPoints.length - 1 ? 'border-b border-dashed border-gray-100' : 'pb-0'}`}>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            {point.type === 'pickup' ? 'Pickup' : point.type === 'drop' ? 'Drop' : `Stop ${i}`}
                          </p>
                          <p className="mt-1 text-[15px] font-extrabold text-gray-900 break-words">{point.label}</p>
                          {point.sub && <p className="mt-0.5 text-[12.5px] text-gray-500">{point.sub}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Local Package */}
              {booking.localPackageId && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] px-3.5 py-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#056B3E]">Package</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-gray-900">{booking.localPackageHours} hrs / {booking.localPackageKm} km</p>
                  </div>
                  <p className="text-[11.5px] text-[#056B3E] text-right">Extra charges beyond limits</p>
                </div>
              )}

              {/* Distance Info (outstation) */}
              {booking.chargeableKm && booking.chargeableKm > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-blue-700">Distance</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-gray-900">{booking.chargeableKm} km</p>
                  </div>
                  {booking.perKmRate && booking.perKmRate > 0 && (
                    <p className="text-[13px] font-bold text-blue-700">₹{booking.perKmRate}/km</p>
                  )}
                </div>
              )}

              {/* Fare Breakdown */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className={`${labelCls} mb-2.5`}>Fare Breakdown</p>
                <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
                  {booking.kmCharges && booking.kmCharges > 0 ? (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">Distance charge{booking.chargeableKm ? ` (${booking.chargeableKm} km)` : ''}</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.kmCharges.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">Base fare</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.baseFare.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.driverBatta && booking.driverBatta > 0 ? (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">Driver allowance</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.driverBatta.toLocaleString()}</span>
                    </div>
                  ) : null}
                  {booking.nightCharges && booking.nightCharges > 0 ? (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">Night charges</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.nightCharges.toLocaleString()}</span>
                    </div>
                  ) : null}
                  {booking.tollCharges && booking.tollCharges > 0 ? (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">Toll charges</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.tollCharges.toLocaleString()}</span>
                    </div>
                  ) : null}
                  {booking.gstAmount > 0 && (
                    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
                      <span className="text-[12.5px] text-gray-500">GST</span>
                      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{booking.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                    <span className="text-sm font-extrabold text-gray-900">Total</span>
                    <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{booking.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {booking.paidAmount && booking.paidAmount > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-semibold text-[#056B3E]">Paid (advance)</span>
                      <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.paidAmount.toLocaleString()}</span>
                    </div>
                    {booking.grandTotal - booking.paidAmount > 0 && (
                      <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                        <span className="text-[12.5px] font-semibold text-[#056B3E]">Balance due</span>
                        <span className="text-[13px] font-bold tabular-nums text-amber-700">₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : null}

                <p className="mt-3 text-[11.5px] leading-relaxed text-gray-400">* Toll, parking &amp; state permit extra as applicable</p>
              </div>
            </div>
          </div>

          {/* ── Message from Vendor ── */}
          {booking.vendorNotes && (
            <div className="overflow-hidden rounded-2xl border border-[#C8F1DF] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#C8F1DF] bg-[#E9FAF2] px-4 py-3">
                <MessageCircle className="w-3.5 h-3.5 text-[#056B3E]" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#056B3E]">Message from Vendor</p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {(() => {
                  let notes: { text: string; sentAt: string }[] = [];
                  try {
                    const parsed = JSON.parse(booking.vendorNotes!);
                    notes = Array.isArray(parsed) ? parsed : [{ text: booking.vendorNotes!, sentAt: '' }];
                  } catch {
                    notes = [{ text: booking.vendorNotes!, sentAt: '' }];
                  }
                  return notes.map((n, i) => (
                    <div key={i} className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] px-3.5 py-3">
                      <p className="text-[13.5px] leading-relaxed text-emerald-900 whitespace-pre-line">{n.text}</p>
                      {n.sentAt && (
                        <p className="mt-1.5 text-right text-[11px] text-[#078F53]">
                          {new Date(n.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ── Cancellation Details ── */}
          {booking.status === 'CANCELLED' && booking.cancelledAt && (
            <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-3">
                <XCircle className="w-3.5 h-3.5 text-red-700" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-red-700">Cancellation Details</p>
              </div>
              <div className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5">
                    <span className="text-xs text-gray-400">Cancelled At</span>
                    <span className="text-[12.5px] font-semibold text-gray-800">
                      {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {booking.cancelledBy && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs text-gray-400">Cancelled By</span>
                      <span className="text-[12.5px] font-semibold text-gray-800 capitalize">{booking.cancelledBy}</span>
                    </div>
                  )}
                </div>
                {booking.cancellationReason && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-red-700">Reason</p>
                    <p className="text-[13.5px] leading-relaxed text-red-800">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Booking Timeline ── */}
          <div className={cardCls}>
            <div className={headCls}><p className={labelCls}>Booking Timeline</p></div>
            <div className="p-4">
              <div className="flex flex-col">
                {[
                  { label: 'Booking Created', time: booking.createdAt, done: true },
                  { label: 'Driver Assigned', time: booking.status !== 'PENDING_VENDOR' ? new Date().toISOString() : null, done: !!booking.driverName },
                  { label: 'Trip Started', time: booking.tripStartedAt, done: !!booking.tripStartedAt },
                  { label: 'Trip Completed', time: booking.tripEndedAt, done: booking.status === 'COMPLETED' },
                ].map((step, idx, arr) => (
                  <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                    {idx < arr.length - 1 && (
                      <span className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                        step.done ? 'bg-[#C8F1DF]' : 'bg-[repeating-linear-gradient(180deg,#E5E7EB_0_5px,transparent_5px_10px)]'
                      }`} />
                    )}
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.done ? <CheckCircle className="w-3 h-3" strokeWidth={3} /> : <span className="text-[10px] font-extrabold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && step.done && (
                        <p className="mt-0.5 text-[11.5px] text-gray-400">
                          {new Date(step.time).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* ══ /Left column ══ */}

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">

          {/* ── Payment Summary ── */}
          <div className={cardCls}>
            <div className={headCls}><p className={labelCls}>Payment Summary</p></div>
            <div className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5">
                  <span className="text-xs text-gray-400">Grand Total</span>
                  <span className="text-[15px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.grandTotal.toLocaleString()}</span>
                </div>
                {booking.paidAmount && booking.paidAmount > 0 ? (
                  <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5">
                    <span className="text-xs text-gray-400">Paid</span>
                    <span className="text-[12.5px] font-bold tabular-nums text-[#056B3E]">₹{booking.paidAmount.toLocaleString()}</span>
                  </div>
                ) : null}
                {booking.paidAmount && booking.grandTotal - booking.paidAmount > 0 ? (
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-xs text-gray-400">Balance due</span>
                    <span className="text-[12.5px] font-extrabold tabular-nums text-amber-700">₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-gray-400">* Toll, parking &amp; state permit charges are extra</p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className={cardCls}>
            <div className={headCls}><p className={labelCls}>Actions</p></div>
            <div className="p-4 flex flex-col gap-2.5">
              {(booking.status === 'PAYMENT_SUBMITTED' || (booking.status === 'PENDING_PAYMENT' && booking.paymentStatus === 'SUBMITTED')) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                    <CheckCircle className="w-5 h-5 text-amber-700" />
                  </div>
                  <p className="text-[13.5px] font-extrabold text-amber-800">Payment Under Verification</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-amber-700">Our team will verify and confirm within 15–30 minutes.</p>
                  {booking.transactionId && (
                    <p className="mt-1.5 text-[11px] text-amber-700/80 tabular-nums">Ref: {booking.transactionId}</p>
                  )}
                </div>
              )}

              {booking.status === 'PENDING_PAYMENT' && booking.paymentStatus !== 'SUBMITTED' && (
                <BookingPayment
                  bookingId={booking.id}
                  bookingType="chauffeur"
                  amount={booking.advanceAmount || Math.round(booking.grandTotal * 0.3)}
                  bookingNumber={booking.bookingNumber}
                  onSuccess={() => window.location.reload()}
                />
              )}

              {canRate && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
                >
                  <Star className="w-4 h-4 fill-white" />
                  Rate Your Trip
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-bold text-red-600 transition hover:bg-red-100"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}

              <button
                onClick={() => window.open(`/api/car-rental/bookings/${booking.bookingNumber}/invoice`, '_blank')}
                className={actionRowCls}
              >
                <span className={actionIconCls}><Download className="w-4 h-4" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-gray-800">Download Invoice</span>
                  <span className="mt-0.5 block text-[11.5px] text-gray-400">Tax invoice for this booking</span>
                </span>
              </button>

              <button className={actionRowCls}>
                <span className={actionIconCls}><HelpCircle className="w-4 h-4" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-gray-800">Need Help?</span>
                  <span className="mt-0.5 block text-[11.5px] text-gray-400">Reach the TransRentals helpdesk</span>
                </span>
              </button>

              {/* Chat */}
              {['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && booking.customerId && (
                <>
                  {/* Driver accepted via driver app → customer↔driver chat */}
                  {(booking.acceptedDriverId || booking.acceptedStaffId) && (
                    <DriverBookingChat
                      bookingId={booking.id}
                      driverId={booking.acceptedDriverId || undefined}
                      staffDriverId={booking.acceptedStaffId || undefined}
                      driverName={booking.driverName || 'Driver'}
                      customerId={String(booking.customerId)}
                      customerName={customer?.name || customer?.phone || 'Customer'}
                    />
                  )}
                  {/* Vendor accepted from dashboard (no driver) → customer↔vendor chat */}
                  {booking.acceptedVendorId && !booking.acceptedDriverId && !booking.acceptedStaffId && (
                    <BikeBookingChat
                      bookingId={booking.id}
                      vendorId={booking.acceptedVendorId}
                      vendorName={booking.vendor?.businessName || 'Vendor'}
                      customerId={String(booking.customerId)}
                      customerName={customer?.name || customer?.phone || 'Customer'}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
        {/* ══ /Right rail ══ */}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl leading-none z-10" onClick={() => setLightbox(null)}>×</button>
          {lightbox.images.length > 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl leading-none z-10 px-2"
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null); }}>‹</button>
          )}
          <img
            src={lightbox.images[lightbox.index]}
            alt={`Photo ${lightbox.index + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {lightbox.images.length > 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl leading-none z-10 px-2"
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null); }}>›</button>
          )}
          {lightbox.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
              {lightbox.index + 1} / {lightbox.images.length}
            </div>
          )}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#012314]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-gray-900">Cancel Booking</h3>
                <p className="text-[11.5px] text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4">
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-2">
                Why do you want to cancel? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us the reason for cancellation..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
              />
              {cancelReason.trim() === '' && (
                <p className="text-[11.5px] text-red-500 mt-1.5">Reason is required to cancel</p>
              )}
            </div>

            <div className="flex gap-3 px-4 pb-4">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || isCancelling}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-[#012314]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-amber-700 fill-amber-700" />
              </div>
              <h3 className="text-[15px] font-extrabold text-gray-900">Rate Your Trip</h3>
            </div>

            <div className="p-4">
              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#E9FAF2] focus:border-[#96E4C2]"
              />
            </div>

            <div className="flex gap-3 px-4 pb-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 rounded-xl bg-[#09B368] px-4 py-3 text-[13px] font-bold text-white transition hover:bg-[#078F53]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
