// @ts-nocheck
'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
const B2BBookingChat = lazy(() => import('@/components/b2b/B2BBookingChat'));
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import {
  Loader2, ArrowLeft, Calendar, MapPin, Clock, CheckCircle,
  Copy, ExternalLink, Share2, Building2, Car, Users, Route,
  Phone, Mail, FileText, AlertCircle, Truck, Bus, Bike, Wrench, Package, Star,
  Fuel, Settings2, ChevronDown, ChevronLeft, ChevronRight, Eye, IndianRupee, MessageCircle,
} from 'lucide-react';

function VehicleCard({ index, displayName, images, vehicle: v, driver: d, isSelfDrive }: {
  index: number; displayName: string; images: string[]; vehicle: any; driver: any; isSelfDrive: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image Carousel */}
      {hasImages ? (
        <div className="relative w-full h-48 bg-gray-900">
          <img
            src={images[imgIdx]}
            alt={`${displayName} ${imgIdx + 1}`}
            className="w-full h-full object-cover opacity-90"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          {hasMultiple && (
            <>
              <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition backdrop-blur-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx((imgIdx + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition backdrop-blur-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: string, j: number) => (
                  <button key={j} onClick={() => setImgIdx(j)}
                    className={`rounded-full transition-all ${j === imgIdx ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          {/* Vehicle number badge top-left */}
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          {/* Vehicle name overlay bottom */}
          <div className="absolute bottom-3 left-3 right-10">
            <p className="text-white font-bold text-sm truncate drop-shadow">{displayName}</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
          <Car className="w-12 h-12 text-slate-300" />
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold">
            {index + 1}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        {!hasImages && <p className="font-bold text-gray-900 mb-2">{displayName}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {v?.registrationNumber && (
            <span className="text-xs font-mono bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-0.5 rounded font-bold tracking-wider">
              {v.registrationNumber}
            </span>
          )}
          {v?.color && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v.color}</span>
          )}
          {v?.seatingCapacity && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" /> {v.seatingCapacity} seats
            </span>
          )}
          {v?.fuelType && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Fuel className="w-3 h-3" /> {v.fuelType}
            </span>
          )}
          {v?.transmission && (
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Settings2 className="w-3 h-3" /> {v.transmission}
            </span>
          )}
        </div>
        {/* Driver */}
        {!isSelfDrive && (
          d ? (
            <div className="flex items-center gap-3 mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
              {d.profilePhoto ? (
                <div className="ring-2 ring-teal-400 ring-offset-1 rounded-full">
                  <img src={d.profilePhoto} alt={d.name} className="w-10 h-10 rounded-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-teal-400 ring-offset-1"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                  {d.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{d.name}</p>
                {d.phone && (
                  <p className="text-xs text-teal-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {d.phone}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3 p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Clock className="w-4 h-4 text-gray-300" />
              <p className="text-xs text-gray-400 italic">Driver to be assigned</p>
            </div>
          )
        )}
        {isSelfDrive && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-medium">
              <Car className="w-3 h-3" /> Self Drive
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Vendor Responses Received',
  SUPER_QUOTE_SENT: 'Quote Ready for Review', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
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

const STATUS_STEPS = [
  'OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED',
];

const TRIP_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700', DRIVER_ARRIVED: 'bg-blue-100 text-blue-700',
  STARTED: 'bg-green-100 text-green-700', COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700', VENDOR_CANCELLED: 'bg-red-100 text-red-700',
};

const SERVICE_ICONS = {
  car: Car, bus: Bus, bike: Bike, truck: Truck, equipment: Wrench,
  packers: Package, luxury: Star, 'self-drive': Car,
};

const TRIP_TYPE_LABELS = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

function parseSelfDrivePreference(notes: string | null): any {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch { return null; }
}

export default function CustomerB2BBookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const openChat = searchParams.get('open_chat') === '1';
  const [booking, setBooking] = useState<any>(null);
  const [tripStats, setTripStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [modal, setModal] = useState<{ type: 'confirm' | 'success' | 'error'; title: string; message: string; onConfirm?: () => void } | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    fetchBooking();
    const iv = setInterval(fetchBooking, 15000);
    return () => clearInterval(iv);
  }, []);

  async function fetchBooking() {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('customerToken') || localStorage.getItem('token')
          : null;
      const res = await fetch(`/api/b2b/bookings/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.status === 'success') { setBooking(data.booking); setTripStats(data.tripStats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function confirmAcceptSuperQuote(superQuoteId: string) {
    setModal({
      type: 'confirm',
      title: 'Confirm Booking',
      message: 'Are you sure you want to accept this quote? Trips will be created automatically and vehicles will be assigned for your booking.',
      onConfirm: () => doAcceptSuperQuote(superQuoteId),
    });
  }

  async function doAcceptSuperQuote(superQuoteId: string) {
    setModal(null);
    setAccepting(true);
    try {
      const res = await fetch(`/api/b2b/super-quotes/${superQuoteId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setModal({
          type: 'success',
          title: 'Booking Confirmed!',
          message: `Your booking has been confirmed. ${data.tripsCreated} trip${data.tripsCreated > 1 ? 's have' : ' has'} been created. You can track all trips from this page.`,
        });
        fetchBooking();
      } else {
        setModal({ type: 'error', title: 'Failed', message: data.error || 'Could not accept the quote. Please try again.' });
      }
    } catch (e) {
      setModal({ type: 'error', title: 'Error', message: 'Something went wrong. Please check your connection and try again.' });
    } finally {
      setAccepting(false);
    }
  }

  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  function copyTripLink(tripCode: string, tripId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/trip/${tripCode}`);
    setCopiedTripId(tripId);
    setTimeout(() => setCopiedTripId(null), 2000);
  }

  function shareTrip(trip: any, index: number) {
    const link = `${window.location.origin}/trip/${trip.tripCode}`;
    const vehicleInfo = trip.vehicleName || trip.vehicleNumber || `Vehicle ${index + 1}`;
    const driverInfo = booking.serviceType !== 'self-drive' && trip.driverName ? `\nDriver: ${trip.driverName}${trip.driverPhone ? ` (${trip.driverPhone})` : ''}` : '';
    const text = `🚗 *Trip ${index + 1} Details*\nBooking: ${booking.bookingNumber}\nVehicle: ${vehicleInfo}${driverInfo}\n\nTrack live: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-[#F8FAF9] flex justify-center items-center pt-24`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#09B368]" />
        <p className="text-sm text-gray-500">Loading booking details...</p>
      </div>
    </div>
  );
  if (!booking) return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-[#F8FAF9] flex justify-center items-center pt-24`}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Booking not found</p>
      </div>
    </div>
  );

  const SvcIcon = SERVICE_ICONS[booking.serviceType] || Car;
  const latestSuperQuote = booking.superQuotes?.find((sq: any) => sq.status === 'SENT' || sq.status === 'ACCEPTED');
  const currentStepIndex = STATUS_STEPS.indexOf(booking.status);
  // Get quote IDs included in the active super quote
  const superQuoteVendorIds = new Set(
    latestSuperQuote?.items?.map((item: any) => item.vendorQuoteId) || []
  );
  const confirmedQuotes = booking.vendorQuotes?.filter((q: any) =>
    q.status === 'CONFIRMED' || q.status === 'ACCEPTED' || superQuoteVendorIds.has(q.id)
  ) || [];
  const totalVendorVehicles = confirmedQuotes.reduce((sum: number, q: any) => sum + q.vehicleCount, 0);
  const isSelfDrive = booking.serviceType === 'self-drive';
  const selfDrivePref = isSelfDrive ? parseSelfDrivePreference(booking.specialNotes) : null;

  return (
    <>
      <CustomerHeader showBackButton backHref={`/customer/b2b-bookings?customer_id=${customerId}`} title="Booking Detail" />

      <div className={`${quoteDisplay.variable} min-h-screen bg-[#F8FAF9] pb-12`}>

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)] pt-24 pb-14">
          {/* checkered grid overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          {/* glow blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#09B368]/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-[#056040]/40 blur-2xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: icon + booking number + status */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <SvcIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4" />
                    B2B Corporate Booking
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="quote-serif text-[30px] font-medium text-white tracking-[-0.01em]">{booking.bookingNumber}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>
                </div>
              </div>
              {/* Right: company info + (TA-only) Track on Business Dashboard CTA */}
              <div className="sm:text-right flex flex-col sm:items-end gap-2">
                <div>
                  <p className="text-white font-bold text-lg">{booking.companyName}</p>
                  <p className="text-white/70 text-sm mt-0.5">{booking.customerName}</p>
                  {booking.bookingMode && (
                    <span className="inline-flex items-center gap-1 mt-1 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      🌟 TA · {booking.bookingMode}
                    </span>
                  )}
                </div>
                {booking.travelAgentId && (
                  <Link
                    href="/travel-agent/bookings"
                    className="inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-lg shadow-lg transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Track on Business Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Key stats pills row */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-medium">{booking.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-medium">{formatDate(booking.scheduledDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <Car className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-medium">{booking.vehiclesRequired} Vehicle{booking.vehiclesRequired > 1 ? 's' : ''}</span>
              </div>
              {booking.passengerCount && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                  <Users className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white text-xs font-medium">{booking.passengerCount} Passengers</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <SvcIcon className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-medium capitalize">{isSelfDrive ? 'Self Drive' : `${booking.serviceType} Rental`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Status Timeline ── */}
        {booking.status !== 'CANCELLED' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-x-auto">
              <p className="quote-serif text-[17px] font-medium text-gray-400 mb-4">Booking Progress</p>
              <div className="flex items-center justify-between min-w-[560px]">
                {STATUS_STEPS.slice(0, 7).map((step, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-200'
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-200 ring-offset-1 scale-110' : ''}`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-[9px] mt-1.5 text-center max-w-[66px] leading-tight font-medium ${
                          isCurrent ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {(STATUS_LABELS[step] || step).replace(/ /g, '\n')}
                        </span>
                      </div>
                      {i < 6 && (
                        <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${i < currentStepIndex ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Content Grid ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN (lg:col-span-2) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Booking Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <h2 className="quote-serif text-[21px] font-medium text-gray-900">Booking Details</h2>
                </div>

                <div className="p-6">
                  {/* Self-Drive: Vehicle Preference Card */}
                  {isSelfDrive && selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 mb-5">
                      <p className="quote-serif text-[17px] text-sky-600 font-medium mb-3">Preferred Vehicle</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-xl border border-sky-100 shadow-sm flex items-center justify-center flex-shrink-0">
                          <Car className="w-8 h-8 text-sky-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-black text-gray-900">
                            {selfDrivePref.vehicleBrand ? `${selfDrivePref.vehicleBrand} ` : ''}{selfDrivePref.vehicleModelName || ''}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {selfDrivePref.vehicleCategory && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-medium">{selfDrivePref.vehicleCategory}</span>
                            )}
                            {selfDrivePref.transmission && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Settings2 className="w-3 h-3" /> {selfDrivePref.transmission}
                              </span>
                            )}
                            {selfDrivePref.fuelType && (
                              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Fuel className="w-3 h-3" /> {selfDrivePref.fuelType}
                              </span>
                            )}
                            {selfDrivePref.minSeats && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Users className="w-3 h-3" /> {selfDrivePref.minSeats} seats
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selfDrivePref.isDeliveryRequested && (
                        <div className="mt-3 text-xs text-sky-700 flex items-center gap-1.5 bg-sky-100 rounded-lg px-3 py-2">
                          <Truck className="w-3.5 h-3.5" /> Home delivery requested
                          {selfDrivePref.pickupAddress && <span className="text-gray-500"> — {selfDrivePref.pickupAddress}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3.5 bg-teal-50 rounded-xl border-l-4 border-teal-400">
                        <SvcIcon className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Service Type</p>
                          <p className="font-bold text-teal-900 mt-0.5">{isSelfDrive ? 'Self Drive Rental' : <span className="capitalize">{booking.serviceType} Rental</span>}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                        <Car className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Vehicles Required</p>
                          <p className="text-2xl font-black text-blue-900">{booking.vehiclesRequired}</p>
                          {booking.vehicleCategory && (
                            <p className="text-xs text-blue-600 mt-0.5">Category: {booking.vehicleCategory}</p>
                          )}
                        </div>
                      </div>

                      {booking.passengerCount && (
                        <div className="flex items-start gap-3 p-3.5 bg-purple-50 rounded-xl border-l-4 border-purple-400">
                          <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Total Passengers</p>
                            <p className="text-2xl font-black text-purple-900">{booking.passengerCount}</p>
                          </div>
                        </div>
                      )}

                      {!isSelfDrive && (
                        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border-l-4 border-gray-300">
                          <Route className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Trip Type</p>
                            <p className="font-bold text-gray-800 mt-0.5">{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3.5 bg-green-50 rounded-xl border-l-4 border-green-400">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">{isSelfDrive ? 'Location' : 'Pickup Location'}</p>
                          <p className="font-bold text-green-900 mt-0.5">{booking.pickupLocation}</p>
                        </div>
                      </div>

                      {booking.dropLocation && !isSelfDrive && (
                        <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border-l-4 border-red-400">
                          <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Drop Location</p>
                            <p className="font-bold text-red-900 mt-0.5">{booking.dropLocation}</p>
                          </div>
                        </div>
                      )}

                      {isSelfDrive ? (
                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                          <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Rental Period</p>
                            <p className="font-bold text-amber-900 mt-0.5">
                              {formatDate(booking.scheduledDate)} {formatTime(booking.scheduledTime)}
                            </p>
                            {booking.returnDate && (
                              <p className="font-semibold text-amber-800 mt-0.5">
                                → {formatDate(booking.returnDate)} {booking.returnTime ? formatTime(booking.returnTime) : ''}
                              </p>
                            )}
                            {booking.returnDate && (
                              <span className="inline-block mt-1 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                {(() => {
                                  const start = new Date(booking.scheduledDate);
                                  const end = new Date(booking.returnDate);
                                  const diffMs = end.getTime() - start.getTime();
                                  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                  return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Same day';
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                          <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Scheduled Date & Time</p>
                            <p className="font-bold text-amber-900 mt-0.5">{formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}</p>
                            {booking.returnDate && (
                              <p className="text-xs text-amber-600 mt-1">Return: {formatDate(booking.returnDate)} {booking.returnTime ? `at ${formatTime(booking.returnTime)}` : ''}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                        <Building2 className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Company</p>
                          <p className="font-bold text-slate-900 mt-0.5">{booking.companyName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{booking.customerName} · {booking.customerPhone}</p>
                          {booking.customerEmail && <p className="text-xs text-slate-500">{booking.customerEmail}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes */}
                  {!isSelfDrive && booking.specialNotes && (
                    <div className="mt-4 p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide mb-1">Special Notes</p>
                        <p className="text-sm text-yellow-800">{booking.specialNotes}</p>
                      </div>
                    </div>
                  )}
                  {isSelfDrive && selfDrivePref?.customerNotes && (
                    <div className="mt-4 p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide mb-1">Special Notes</p>
                        <p className="text-sm text-yellow-800">{selfDrivePref.customerNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Vehicles & Drivers */}
              {['SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID'].includes(booking.status) && confirmedQuotes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Car className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h2 className="quote-serif text-[21px] font-medium text-gray-900">
                      {booking.serviceType === 'self-drive' ? 'Assigned Vehicles' : 'Assigned Vehicles & Drivers'}
                    </h2>
                  </div>

                  <div className="p-6">
                    {/* Progress bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">{totalVendorVehicles} of {booking.vehiclesRequired} vehicles assigned</span>
                        <span className="font-black text-emerald-700 text-base">{Math.round((totalVendorVehicles / booking.vehiclesRequired) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min((totalVendorVehicles / booking.vehiclesRequired) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {(() => {
                      const allVehicles = confirmedQuotes.flatMap((q: any) =>
                        q.quoteVehicles?.map((qv: any) => ({ ...qv, quoteStatus: q.status })) || []
                      );

                      if (allVehicles.length === 0) {
                        return (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-500">Waiting for vehicles to be assigned...</p>
                            <p className="text-xs text-gray-400 mt-1">Vehicles and drivers will appear here once assigned</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {allVehicles.map((qv: any, i: number) => {
                            const v = qv.vehicle;
                            const d = qv.driver;
                            let allImages: string[] = [];
                            if (v?.images) {
                              try {
                                const parsed = typeof v.images === 'string' ? JSON.parse(v.images) : v.images;
                                if (Array.isArray(parsed)) {
                                  allImages = parsed.filter((x: any) => typeof x === 'string' && x);
                                } else if (parsed && typeof parsed === 'object') {
                                  allImages = Object.values(parsed).filter((x: any) => typeof x === 'string' && x) as string[];
                                }
                              } catch {}
                            }
                            if (v?.vehicle_models?.sideImage) allImages = [v.vehicle_models.sideImage, ...allImages.filter((img: string) => img !== v.vehicle_models.sideImage)];
                            if (v?.chauffeur_vehicle_categories?.image && allImages.length === 0) allImages.push(v.chauffeur_vehicle_categories.image);

                            const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
                            const modelName = v?.vehicle_models?.name || '';
                            const displayName = v?.vehicleName || `${brandName} ${modelName}`.trim() || qv.vehicleName || 'Vehicle';

                            return (
                              <VehicleCard key={qv.id} index={i} displayName={displayName} images={allImages} vehicle={v} driver={d} isSelfDrive={booking.serviceType === 'self-drive'} />
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Super Quote - Accept Section (SENT — pending approval) */}
              {latestSuperQuote && latestSuperQuote.status === 'SENT' && (!booking.trips || booking.trips.length === 0) && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="quote-serif font-medium text-violet-900 text-[23px]">Quote Ready for Approval</h3>
                      <p className="text-xs text-violet-500">Review and confirm your corporate booking</p>
                    </div>
                  </div>

                  {/* Quote Summary */}
                  <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-violet-50 rounded-xl">
                        <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide">Vehicles</p>
                        <p className="text-3xl font-black text-violet-900 mt-1">{booking.vehiclesRequired}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-black text-emerald-700 mt-1">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3">Quote #{latestSuperQuote.quoteNumber}</p>
                    {latestSuperQuote.notes && (
                      <p className="text-sm text-gray-600 mt-2 text-center italic bg-gray-50 rounded-lg px-3 py-2">"{latestSuperQuote.notes}"</p>
                    )}
                  </div>

                  {/* View Quote Details Toggle */}
                  <button
                    onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                    className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-white border border-violet-200 rounded-xl text-violet-700 font-bold text-sm hover:bg-violet-50 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {showQuoteDetails ? 'Hide Quote Details' : 'View Full Quote Details'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showQuoteDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Quote Details - collapsible */}
                  {showQuoteDetails && (() => {
                    const quoteDetails = confirmedQuotes
                      .map((q: any) => {
                        try { return { ...JSON.parse(q.notes), vehicleCount: q.vehicleCount }; } catch { return null; }
                      })
                      .filter(Boolean);

                    if (quoteDetails.length === 0) return (
                      <div className="bg-white rounded-xl p-4 mb-4 text-center text-sm text-gray-500">No detailed quote information available.</div>
                    );

                    const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
                    const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
                    const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
                    const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

                    return (
                      <div className="space-y-3 mb-4">
                        {/* Service Info */}
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <p className="quote-serif text-[17px] text-violet-600 font-medium mb-3">Service Details</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <SvcIcon className="w-4 h-4 text-teal-600" />
                              <span className="text-gray-700 capitalize">{booking.serviceType} {isSelfDriveQuote ? '(Self Drive)' : 'Rental'}</span>
                            </div>
                            {quoteDetails[0]?.tripType && (
                              <div className="flex items-center gap-2 text-sm">
                                <Route className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700">{TRIP_TYPE_LABELS[quoteDetails[0].tripType] || quoteDetails[0].tripType}</span>
                              </div>
                            )}
                          </div>

                          {isSelfDriveQuote && quoteDetails[0] && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {quoteDetails[0].kmLimit && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                  {quoteDetails[0].kmLimit} km/day limit
                                </span>
                              )}
                              {quoteDetails[0].extraKmCharge && (
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                                  Extra km: ₹{quoteDetails[0].extraKmCharge}/km
                                </span>
                              )}
                              {quoteDetails[0].fuelPolicy && (
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                                  Fuel: {quoteDetails[0].fuelPolicy}
                                </span>
                              )}
                              {quoteDetails[0].deliveryCharges > 0 && (
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
                                  Delivery: ₹{quoteDetails[0].deliveryCharges}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Cost Breakdown */}
                        {!isSelfDriveQuote && quoteDetails[0] && (quoteDetails[0].basePrice > 0 || quoteDetails[0].pricePerVehicle > 0) && (() => {
                          const d = quoteDetails[0];
                          const firstVehicle = confirmedQuotes[0]?.quoteVehicles?.[0];
                          const rawBp = d.basePrice || firstVehicle?.basePrice || 0;
                          const da = d.driverAllowance || firstVehicle?.driverAllowance || 0;
                          const pkm = d.perKmRate || firstVehicle?.perKmRate || 0;
                          const pday = d.perDayRate || firstVehicle?.perDayRate || 0;
                          const nc = d.nightCharges || firstVehicle?.nightCharges || 0;
                          const ekm = d.extraKmCharge || firstVehicle?.extraKmCharge || 0;

                          const totalVehicles = booking.vehiclesRequired || 1;
                          const marginPerVehicle = latestSuperQuote?.companyMargin
                            ? Math.round(latestSuperQuote.companyMargin / totalVehicles)
                            : 0;
                          const bp = rawBp + marginPerVehicle;

                          return (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <p className="quote-serif text-[17px] text-violet-600 font-medium mb-3 flex items-center gap-1">
                                <IndianRupee className="w-3.5 h-3.5" /> Cost Breakdown (per vehicle)
                              </p>
                              <div className="space-y-2">
                                {bp > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Base Price</span>
                                    <span className="font-bold text-gray-900">₹{bp.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {da > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Driver Allowance</span>
                                    <span className="font-bold text-gray-900">₹{da.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {(bp > 0 || da > 0) && (
                                  <div className="flex justify-between text-sm border-t pt-2 mt-1">
                                    <span className="font-bold text-gray-800">Per Vehicle Total</span>
                                    <span className="font-black text-violet-700">₹{(bp + da).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {(pkm > 0 || pday > 0 || nc > 0 || ekm > 0) && (
                                  <>
                                    <div className="border-t mt-2 pt-2">
                                      <p className="quote-serif text-[17px] text-gray-400 font-medium mb-1.5">Rate Information</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                      {pkm > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Per KM Rate</span><span className="text-gray-700 font-medium">₹{pkm}/km</span></div>}
                                      {pday > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Per Day Rate</span><span className="text-gray-700 font-medium">₹{pday}/day</span></div>}
                                      {nc > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Night Charges</span><span className="text-gray-700 font-medium">₹{nc}</span></div>}
                                      {ekm > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Extra KM Charge</span><span className="text-gray-700 font-medium">₹{ekm}/km</span></div>}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Inclusions */}
                        {allInclusions.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-green-600 font-medium mb-3 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> What's Included
                            </p>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {allInclusions.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exclusions */}
                        {allExclusions.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-red-500 font-medium mb-3 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> What's Not Included
                            </p>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {allExclusions.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-red-400 mt-0.5 font-bold">✗</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Terms & Conditions */}
                        {allTerms.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-gray-500 font-medium mb-3 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Terms & Conditions
                            </p>
                            <div className="space-y-1.5">
                              {allTerms.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-gray-400 mt-0.5 text-xs font-bold">{i + 1}.</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vendor Message */}
                        {quoteDetails.some((d: any) => d.vendorMessage) && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-violet-500 font-medium mb-2">Vendor Notes</p>
                            {quoteDetails.filter((d: any) => d.vendorMessage).map((d: any, i: number) => (
                              <p key={i} className="text-sm text-gray-600 italic">"{d.vendorMessage}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <button onClick={() => confirmAcceptSuperQuote(latestSuperQuote.id)} disabled={accepting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-black text-base hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all">
                    {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {accepting ? 'Confirming...' : 'Accept Quote & Confirm Booking'}
                  </button>
                  <p className="text-xs text-violet-500 mt-2.5 text-center font-medium">No payment required now · Post-trip corporate billing</p>
                </div>
              )}

              {/* Confirmed Quote Summary - shown after acceptance */}
              {latestSuperQuote && (latestSuperQuote.status === 'ACCEPTED' || (booking.trips && booking.trips.length > 0)) && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="quote-serif font-medium text-emerald-900 text-[23px]">Quote Confirmed</h3>
                        <p className="text-xs text-emerald-600">Your booking is locked in</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
                      #{latestSuperQuote.quoteNumber}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Vehicles</p>
                        <p className="text-3xl font-black text-emerald-900 mt-1">{booking.vehiclesRequired}</p>
                      </div>
                      <div className="p-3 bg-teal-50 rounded-xl">
                        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-black text-teal-700 mt-1">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* View Quote Details Toggle */}
                  <button
                    onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {showQuoteDetails ? 'Hide Quote Details' : 'View Quote Details'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showQuoteDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showQuoteDetails && (() => {
                    const quoteDetails = confirmedQuotes
                      .map((q: any) => {
                        try { return { ...JSON.parse(q.notes), vehicleCount: q.vehicleCount }; } catch { return null; }
                      })
                      .filter(Boolean);

                    if (quoteDetails.length === 0) return (
                      <div className="bg-white rounded-xl p-4 mt-3 text-center text-sm text-gray-500">No detailed quote information available.</div>
                    );

                    const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
                    const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
                    const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
                    const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

                    return (
                      <div className="space-y-3 mt-3">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <p className="quote-serif text-[17px] text-emerald-600 font-medium mb-3">Service Details</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <SvcIcon className="w-4 h-4 text-teal-600" />
                              <span className="text-gray-700 capitalize">{booking.serviceType} {isSelfDriveQuote ? '(Self Drive)' : 'Rental'}</span>
                            </div>
                            {quoteDetails[0]?.tripType && (
                              <div className="flex items-center gap-2 text-sm">
                                <Route className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700">{TRIP_TYPE_LABELS[quoteDetails[0].tripType] || quoteDetails[0].tripType}</span>
                              </div>
                            )}
                          </div>
                          {isSelfDriveQuote && quoteDetails[0] && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {quoteDetails[0].kmLimit && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{quoteDetails[0].kmLimit} km/day limit</span>}
                              {quoteDetails[0].extraKmCharge && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">Extra km: ₹{quoteDetails[0].extraKmCharge}/km</span>}
                              {quoteDetails[0].fuelPolicy && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Fuel: {quoteDetails[0].fuelPolicy}</span>}
                              {quoteDetails[0].deliveryCharges > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">Delivery: ₹{quoteDetails[0].deliveryCharges}</span>}
                            </div>
                          )}
                        </div>

                        {/* Cost Breakdown */}
                        {!isSelfDriveQuote && quoteDetails[0] && (quoteDetails[0].basePrice > 0 || quoteDetails[0].pricePerVehicle > 0) && (() => {
                          const d = quoteDetails[0];
                          const firstVehicle = confirmedQuotes[0]?.quoteVehicles?.[0];
                          const rawBp = d.basePrice || firstVehicle?.basePrice || 0;
                          const da = d.driverAllowance || firstVehicle?.driverAllowance || 0;
                          const pkm = d.perKmRate || firstVehicle?.perKmRate || 0;
                          const pday = d.perDayRate || firstVehicle?.perDayRate || 0;
                          const nc = d.nightCharges || firstVehicle?.nightCharges || 0;
                          const ekm = d.extraKmCharge || firstVehicle?.extraKmCharge || 0;

                          const totalVehicles = booking.vehiclesRequired || 1;
                          const marginPerVehicle = latestSuperQuote?.companyMargin
                            ? Math.round(latestSuperQuote.companyMargin / totalVehicles)
                            : 0;
                          const bp = rawBp + marginPerVehicle;

                          return (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <p className="quote-serif text-[17px] text-emerald-600 font-medium mb-3 flex items-center gap-1">
                                <IndianRupee className="w-3.5 h-3.5" /> Cost Breakdown (per vehicle)
                              </p>
                              <div className="space-y-2">
                                {bp > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Base Price</span>
                                    <span className="font-bold text-gray-900">₹{bp.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {da > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Driver Allowance</span>
                                    <span className="font-bold text-gray-900">₹{da.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {(bp > 0 || da > 0) && (
                                  <div className="flex justify-between text-sm border-t pt-2 mt-1">
                                    <span className="font-bold text-gray-800">Per Vehicle Total</span>
                                    <span className="font-black text-emerald-700">₹{(bp + da).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {(pkm > 0 || pday > 0 || nc > 0 || ekm > 0) && (
                                  <>
                                    <div className="border-t mt-2 pt-2">
                                      <p className="quote-serif text-[17px] text-gray-400 font-medium mb-1.5">Rate Information</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                      {pkm > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Per KM Rate</span><span className="text-gray-700 font-medium">₹{pkm}/km</span></div>}
                                      {pday > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Per Day Rate</span><span className="text-gray-700 font-medium">₹{pday}/day</span></div>}
                                      {nc > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Night Charges</span><span className="text-gray-700 font-medium">₹{nc}</span></div>}
                                      {ekm > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Extra KM Charge</span><span className="text-gray-700 font-medium">₹{ekm}/km</span></div>}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {allInclusions.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-green-600 font-medium mb-3 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> What's Included</p>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {allInclusions.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 mt-0.5 font-bold">✓</span><span>{item}</span></div>
                              ))}
                            </div>
                          </div>
                        )}
                        {allExclusions.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-red-500 font-medium mb-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> What's Not Included</p>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {allExclusions.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-red-400 mt-0.5 font-bold">✗</span><span>{item}</span></div>
                              ))}
                            </div>
                          </div>
                        )}
                        {allTerms.length > 0 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-gray-500 font-medium mb-3 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Terms & Conditions</p>
                            <div className="space-y-1.5">
                              {allTerms.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-gray-400 mt-0.5 text-xs font-bold">{i + 1}.</span><span>{item}</span></div>
                              ))}
                            </div>
                          </div>
                        )}
                        {quoteDetails.some((d: any) => d.vendorMessage) && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="quote-serif text-[17px] text-purple-500 font-medium mb-2">Vendor Notes</p>
                            {quoteDetails.filter((d: any) => d.vendorMessage).map((d: any, i: number) => (
                              <p key={i} className="text-sm text-gray-600 italic">"{d.vendorMessage}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Trip Monitoring */}
              {tripStats && tripStats.total > 0 && (
                <>
                  {/* Trip Stats Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                      { l: 'Total', v: tripStats.total, bg: 'bg-blue-50', tx: 'text-blue-700', border: 'border-blue-100' },
                      { l: 'Pending', v: tripStats.pending, bg: 'bg-yellow-50', tx: 'text-yellow-700', border: 'border-yellow-100' },
                      { l: 'Arrived', v: tripStats.driverArrived, bg: 'bg-indigo-50', tx: 'text-indigo-700', border: 'border-indigo-100' },
                      { l: 'Started', v: tripStats.started, bg: 'bg-green-50', tx: 'text-green-700', border: 'border-green-100' },
                      { l: 'Done', v: tripStats.completed, bg: 'bg-slate-50', tx: 'text-slate-700', border: 'border-slate-100' },
                      { l: 'Cancelled', v: tripStats.cancelled, bg: 'bg-red-50', tx: 'text-red-700', border: 'border-red-100' },
                    ].map(s => (
                      <div key={s.l} className={`${s.bg} border ${s.border} rounded-xl p-4 text-center shadow-sm`}>
                        <div className={`text-2xl font-black ${s.tx}`}>{s.v}</div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Trip Cards List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Route className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="quote-serif text-[21px] font-medium text-gray-900">Trip Details</h3>
                      <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">{booking.trips?.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                      {booking.trips?.map((trip: any, i: number) => {
                        const statusBorderColors = {
                          PENDING: 'border-yellow-400',
                          DRIVER_ARRIVED: 'border-blue-400',
                          STARTED: 'border-green-500',
                          COMPLETED: 'border-gray-400',
                          CANCELLED: 'border-red-400',
                          VENDOR_CANCELLED: 'border-red-400',
                        };
                        const borderColor = statusBorderColors[trip.status] || 'border-gray-300';
                        return (
                          <div key={trip.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-l-4 ${borderColor}`}>
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 flex-shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-sm font-black text-gray-900">{trip.tripCode}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TRIP_STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {trip.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {trip.vehicleName || trip.vehicleNumber || '-'}
                                {booking.serviceType !== 'self-drive' && <> · Driver: {trip.driverName || '-'} {trip.driverPhone ? `(${trip.driverPhone})` : ''}</>}
                                {booking.serviceType === 'self-drive' && <span className="text-sky-600 ml-1">(Self Drive)</span>}
                              </div>
                              {trip.vendor?.businessName && (
                                <div className="text-xs text-teal-600 font-medium mt-0.5">{trip.vendor.businessName}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => copyTripLink(trip.tripCode, trip.id)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  copiedTripId === trip.id
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {copiedTripId === trip.id ? (
                                  <><CheckCircle className="w-3.5 h-3.5" /> Copied!</>
                                ) : (
                                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                                )}
                              </button>
                              <button
                                onClick={() => shareTrip(trip, i)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-all border border-green-200"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Share
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* B2B Vendor Chat */}
              {booking && ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="quote-serif text-[21px] font-medium text-gray-900">Contact Vendor</h3>
                  </div>
                  <div className="p-4">
                    <Suspense fallback={<div className="h-12 bg-gray-100 rounded-xl animate-pulse" />}>
                      <B2BBookingChat
                        bookingId={params.id as string}
                        customerId={customerId}
                        customerName={booking.customerName}
                        defaultOpen={openChat}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN (sticky summary) ── */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4">

                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] px-5 py-4">
                    <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                    <p className="quote-serif relative text-[17px] text-white/70 font-medium mb-2">Booking Summary</p>
                    <div className="relative flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Booking No.</span>
                      <span className="font-mono font-bold text-gray-900 text-xs">{booking.bookingNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Service</span>
                      <span className="font-semibold text-gray-900 capitalize">{isSelfDrive ? 'Self Drive' : booking.serviceType}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Vehicles</span>
                      <span className="font-bold text-gray-900">{booking.vehiclesRequired}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold text-gray-900">{formatDate(booking.scheduledDate)}</span>
                    </div>
                    {latestSuperQuote && (
                      <>
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Amount</span>
                            <span className="text-xl font-black text-emerald-700">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Post-trip corporate billing</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Invoice Card */}
                {booking.invoices?.length > 0 && booking.invoices.map((inv: any) => (
                  <div key={inv.id} className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 shadow-lg shadow-orange-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Invoice</p>
                        <p className="text-white font-mono font-black text-sm mt-0.5">{inv.invoiceNumber}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${inv.status === 'PAID' ? 'bg-white/20 text-white' : 'bg-white text-orange-700'}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="mb-1">
                      <p className="text-orange-100 text-xs">Total Amount</p>
                      <p className="text-white text-3xl font-black">₹{inv.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-orange-100 text-xs mb-4 space-y-0.5">
                      <p>Due: {formatDate(inv.dueDate)}</p>
                      <p>{inv.totalVehicles} vehicles · {inv.tripsCompleted} trips completed</p>
                    </div>
                    <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-black rounded-xl transition shadow-sm ${
                        inv.status === 'PAID'
                          ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                          : 'bg-white text-orange-700 hover:bg-orange-50'
                      }`}>
                      <ExternalLink className="w-4 h-4" />
                      {inv.status === 'PAID' ? 'View Invoice' : 'View & Pay Invoice'}
                    </a>
                  </div>
                ))}

                {/* Quick Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <p className="quote-serif text-[17px] font-medium text-gray-400 mb-3">Contact Info</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-gray-800 font-semibold">{booking.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-gray-700">{booking.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <span className="text-gray-700">{booking.customerPhone}</span>
                    </div>
                    {booking.customerEmail && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-gray-700 truncate">{booking.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => modal.type !== 'confirm' && setModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 space-y-5 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div className="flex justify-center">
              {modal.type === 'confirm' && (
                <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
              )}
              {modal.type === 'success' && (
                <div className="w-20 h-20 rounded-3xl bg-green-50 border-2 border-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="quote-serif text-[26px] font-medium text-gray-900">{modal.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{modal.message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
                  >
                    <CheckCircle className="w-4 h-4" /> Yes, Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal(null)}
                  className={`w-full py-3 font-bold rounded-2xl transition ${
                    modal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md shadow-emerald-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {modal.type === 'success' ? 'Great!' : 'OK'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
