// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Calendar, MapPin, Clock, CheckCircle,
  Copy, ExternalLink, Share2, Building2, Car, Users, Route,
  Phone, Mail, FileText, AlertCircle, Truck, Bus, Bike, Wrench, Package, Star,
  Fuel, Settings2, ChevronDown, ChevronLeft, ChevronRight, Eye, IndianRupee,
} from 'lucide-react';

function VehicleCard({ index, displayName, images, vehicle: v, driver: d, isSelfDrive }: {
  index: number; displayName: string; images: string[]; vehicle: any; driver: any; isSelfDrive: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
      {/* Image Carousel */}
      {hasImages ? (
        <div className="relative w-full h-44 bg-white">
          <img
            src={images[imgIdx]}
            alt={`${displayName} ${imgIdx + 1}`}
            className="w-full h-full object-cover"
          />
          {hasMultiple && (
            <>
              <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx((imgIdx + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: string, j: number) => (
                  <button key={j} onClick={() => setImgIdx(j)}
                    className={`w-2 h-2 rounded-full transition ${j === imgIdx ? 'bg-white scale-110' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
        </div>
      ) : (
        <div className="w-full h-28 bg-white flex items-center justify-center relative">
          <Car className="w-10 h-10 text-gray-200" />
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
            {index + 1}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-gray-900">{displayName}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {v?.registrationNumber && (
            <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded">{v.registrationNumber}</span>
          )}
          {v?.color && <span className="text-xs text-gray-500">{v.color}</span>}
          {v?.seatingCapacity && <span className="text-xs text-gray-500">{v.seatingCapacity} seats</span>}
          {v?.fuelType && <span className="text-xs text-gray-500">{v.fuelType}</span>}
          {v?.transmission && <span className="text-xs text-gray-500">{v.transmission}</span>}
        </div>
        {/* Driver */}
        {!isSelfDrive && (
          d ? (
            <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded-lg border border-gray-100">
              {d.profilePhoto ? (
                <img src={d.profilePhoto} alt={d.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold">
                  {d.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">{d.name}</p>
                {d.phone && <p className="text-xs text-gray-500">{d.phone}</p>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-3 italic">Driver to be assigned</p>
          )
        )}
        {isSelfDrive && (
          <span className="inline-block mt-2 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">Self Drive</span>
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
      const res = await fetch(`/api/b2b/bookings/${params.id}`);
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

  if (loading) return <div className="flex justify-center py-20 pt-24"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  if (!booking) return <div className="text-center py-20 pt-24 text-gray-500">Booking not found</div>;

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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pt-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Link href={`/customer/b2b-bookings`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{booking.bookingNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{booking.companyName}</p>
        </div>
      </div>

      {/* Status Timeline */}
      {booking.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {STATUS_STEPS.slice(0, 7).map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 text-center max-w-[70px] ${isCompleted ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                      {(STATUS_LABELS[step] || step).replace(/ /g, '\n')}
                    </span>
                  </div>
                  {i < 6 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          Booking Details
        </h2>

        {/* Self-Drive: Vehicle Preference Card */}
        {isSelfDrive && selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-sky-600 font-semibold mb-2">Preferred Vehicle</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl border border-sky-100 flex items-center justify-center flex-shrink-0">
                <Car className="w-8 h-8 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900">
                  {selfDrivePref.vehicleBrand ? `${selfDrivePref.vehicleBrand} ` : ''}{selfDrivePref.vehicleModelName || ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selfDrivePref.vehicleCategory && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{selfDrivePref.vehicleCategory}</span>
                  )}
                  {selfDrivePref.transmission && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> {selfDrivePref.transmission}
                    </span>
                  )}
                  {selfDrivePref.fuelType && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> {selfDrivePref.fuelType}
                    </span>
                  )}
                  {selfDrivePref.minSeats && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" /> {selfDrivePref.minSeats} seats
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selfDrivePref.isDeliveryRequested && (
              <div className="mt-2 text-xs text-sky-700 flex items-center gap-1">
                <Truck className="w-3 h-3" /> Home delivery requested
                {selfDrivePref.pickupAddress && <span className="text-gray-500"> — {selfDrivePref.pickupAddress}</span>}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
              <SvcIcon className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs text-teal-600 font-medium">Service Type</p>
                <p className="font-bold text-teal-800">{isSelfDrive ? 'Self Drive Rental' : <span className="capitalize">{booking.serviceType} Rental</span>}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Car className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Vehicles Required</p>
                <p className="text-2xl font-bold text-blue-800">{booking.vehiclesRequired}</p>
                {booking.vehicleCategory && (
                  <p className="text-sm text-blue-600">Category: {booking.vehicleCategory}</p>
                )}
              </div>
            </div>

            {booking.passengerCount && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Total Passengers / Employees</p>
                  <p className="text-2xl font-bold text-purple-800">{booking.passengerCount}</p>
                </div>
              </div>
            )}

            {/* Trip Type - only for non-self-drive */}
            {!isSelfDrive && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Route className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Trip Type</p>
                  <p className="font-semibold text-gray-800">{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-green-600 font-medium">{isSelfDrive ? 'Location' : 'Pickup Location'}</p>
                <p className="font-semibold text-green-800">{booking.pickupLocation}</p>
              </div>
            </div>

            {booking.dropLocation && !isSelfDrive && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs text-red-500 font-medium">Drop Location</p>
                  <p className="font-semibold text-red-800">{booking.dropLocation}</p>
                </div>
              </div>
            )}

            {/* Self-drive: Rental Period | Others: Scheduled Date */}
            {isSelfDrive ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 font-medium">Rental Period</p>
                  <p className="font-semibold text-amber-800">
                    {formatDate(booking.scheduledDate)} {formatTime(booking.scheduledTime)}
                  </p>
                  {booking.returnDate && (
                    <p className="font-semibold text-amber-800 mt-0.5">
                      → {formatDate(booking.returnDate)} {booking.returnTime ? formatTime(booking.returnTime) : ''}
                    </p>
                  )}
                  {booking.returnDate && (
                    <p className="text-xs text-amber-600 mt-1">
                      {(() => {
                        const start = new Date(booking.scheduledDate);
                        const end = new Date(booking.returnDate);
                        const diffMs = end.getTime() - start.getTime();
                        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Same day';
                      })()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 font-medium">Scheduled Date & Time</p>
                  <p className="font-semibold text-amber-800">{formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}</p>
                  {booking.returnDate && (
                    <p className="text-sm text-amber-600 mt-1">Return: {formatDate(booking.returnDate)} {booking.returnTime ? `at ${formatTime(booking.returnTime)}` : ''}</p>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Company</p>
              <p className="font-semibold text-gray-800">{booking.companyName}</p>
              <p className="text-sm text-gray-500">{booking.customerName} | {booking.customerPhone}</p>
              {booking.customerEmail && <p className="text-sm text-gray-500">{booking.customerEmail}</p>}
            </div>
          </div>
        </div>

        {/* Special Notes - only show for non-self-drive or if customer added notes */}
        {!isSelfDrive && booking.specialNotes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium mb-1">Special Notes</p>
            <p className="text-sm text-yellow-800">{booking.specialNotes}</p>
          </div>
        )}
        {isSelfDrive && selfDrivePref?.customerNotes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium mb-1">Special Notes</p>
            <p className="text-sm text-yellow-800">{selfDrivePref.customerNotes}</p>
          </div>
        )}
      </div>

      {/* Assigned Vehicles & Drivers - only show after super quote sent */}
      {['SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID'].includes(booking.status) && confirmedQuotes.length > 0 && (
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Car className="w-5 h-5 text-teal-600" />
          {booking.serviceType === 'self-drive' ? 'Assigned Vehicles' : 'Assigned Vehicles & Drivers'}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{totalVendorVehicles} of {booking.vehiclesRequired} vehicles assigned</span>
              <span className="font-bold text-teal-700">{Math.round((totalVendorVehicles / booking.vehiclesRequired) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((totalVendorVehicles / booking.vehiclesRequired) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {(() => {
          const allVehicles = confirmedQuotes.flatMap((q: any) =>
            q.quoteVehicles?.map((qv: any) => ({ ...qv, quoteStatus: q.status })) || []
          );

          if (allVehicles.length === 0) {
            return (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Waiting for vehicles to be assigned...</p>
                <p className="text-xs text-gray-400 mt-1">Vehicles and drivers will appear here once assigned</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {allVehicles.map((qv: any, i: number) => {
                const v = qv.vehicle;
                const d = qv.driver;
                // Parse images - collect ALL images for carousel
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
                // Add model/category images as fallback
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
      )}

      {/* Super Quote - Accept Section (only show if not yet accepted & no trips created) */}
      {latestSuperQuote && latestSuperQuote.status === 'SENT' && (!booking.trips || booking.trips.length === 0) && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5 mb-4">
          <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quote Ready for Your Approval
          </h3>

          {/* Quote Summary */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{booking.vehiclesRequired}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Quote #{latestSuperQuote.quoteNumber}</p>
            {latestSuperQuote.notes && (
              <p className="text-sm text-gray-600 mt-2 text-center italic">{latestSuperQuote.notes}</p>
            )}
          </div>

          {/* View Quote Details Toggle */}
          <button
            onClick={() => setShowQuoteDetails(!showQuoteDetails)}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-white border border-purple-200 rounded-lg text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showQuoteDetails ? 'Hide Quote Details' : 'View Quote Details'}
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
              <div className="bg-white rounded-lg p-4 mb-4 text-center text-sm text-gray-500">No detailed quote information available.</div>
            );

            // Merge inclusions/exclusions/terms from all confirmed quotes
            const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
            const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
            const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
            const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

            return (
              <div className="space-y-3 mb-4">
                {/* Service Info */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold mb-2">Service Details</p>
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

                  {/* Self-drive specific details */}
                  {isSelfDriveQuote && quoteDetails[0] && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quoteDetails[0].kmLimit && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {quoteDetails[0].kmLimit} km/day limit
                        </span>
                      )}
                      {quoteDetails[0].extraKmCharge && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                          Extra km: ₹{quoteDetails[0].extraKmCharge}/km
                        </span>
                      )}
                      {quoteDetails[0].fuelPolicy && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          Fuel: {quoteDetails[0].fuelPolicy}
                        </span>
                      )}
                      {quoteDetails[0].deliveryCharges > 0 && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          Delivery: ₹{quoteDetails[0].deliveryCharges}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                {!isSelfDriveQuote && quoteDetails[0] && (quoteDetails[0].basePrice > 0 || quoteDetails[0].pricePerVehicle > 0) && (() => {
                  const d = quoteDetails[0];
                  // Also check quoteVehicles for pricing if not in notes
                  const firstVehicle = confirmedQuotes[0]?.quoteVehicles?.[0];
                  const rawBp = d.basePrice || firstVehicle?.basePrice || 0;
                  const da = d.driverAllowance || firstVehicle?.driverAllowance || 0;
                  const pkm = d.perKmRate || firstVehicle?.perKmRate || 0;
                  const pday = d.perDayRate || firstVehicle?.perDayRate || 0;
                  const nc = d.nightCharges || firstVehicle?.nightCharges || 0;
                  const ekm = d.extraKmCharge || firstVehicle?.extraKmCharge || 0;

                  // Add company margin to base price (distributed per vehicle)
                  const totalVehicles = booking.vehiclesRequired || 1;
                  const marginPerVehicle = latestSuperQuote?.companyMargin
                    ? Math.round(latestSuperQuote.companyMargin / totalVehicles)
                    : 0;
                  const bp = rawBp + marginPerVehicle;

                  return (
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-purple-600 font-semibold mb-3 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" /> Cost Breakdown (per vehicle)
                      </p>
                      <div className="space-y-2">
                        {bp > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price</span>
                            <span className="font-semibold text-gray-900">₹{bp.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {da > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Driver Allowance</span>
                            <span className="font-semibold text-gray-900">₹{da.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {(bp > 0 || da > 0) && (
                          <div className="flex justify-between text-sm border-t pt-2 mt-1">
                            <span className="font-semibold text-gray-800">Per Vehicle Total</span>
                            <span className="font-bold text-green-700">₹{(bp + da).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {(pkm > 0 || pday > 0 || nc > 0 || ekm > 0) && (
                          <>
                            <div className="border-t mt-2 pt-2">
                              <p className="text-[11px] text-gray-400 font-medium mb-1.5">Rate Information</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                              {pkm > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Per KM Rate</span>
                                  <span className="text-gray-700">₹{pkm}/km</span>
                                </div>
                              )}
                              {pday > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Per Day Rate</span>
                                  <span className="text-gray-700">₹{pday}/day</span>
                                </div>
                              )}
                              {nc > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Night Charges</span>
                                  <span className="text-gray-700">₹{nc}</span>
                                </div>
                              )}
                              {ekm > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Extra KM Charge</span>
                                  <span className="text-gray-700">₹{ekm}/km</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Inclusions */}
                {allInclusions.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-green-600 font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> What's Included
                    </p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {allInclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exclusions */}
                {allExclusions.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-red-500 font-semibold mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> What's Not Included
                    </p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {allExclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-400 mt-0.5">✗</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                {allTerms.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Terms & Conditions
                    </p>
                    <div className="space-y-1.5">
                      {allTerms.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-gray-400 mt-0.5 text-xs">{i + 1}.</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendor Message */}
                {quoteDetails.some((d: any) => d.vendorMessage) && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-purple-500 font-semibold mb-2">Vendor Notes</p>
                    {quoteDetails.filter((d: any) => d.vendorMessage).map((d: any, i: number) => (
                      <p key={i} className="text-sm text-gray-600 italic">"{d.vendorMessage}"</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <button onClick={() => confirmAcceptSuperQuote(latestSuperQuote.id)} disabled={accepting}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {accepting ? 'Confirming...' : 'Accept Quote & Confirm Booking'}
          </button>
          <p className="text-xs text-purple-600 mt-2 text-center">No payment required now. Post-trip corporate billing.</p>
        </div>
      )}

      {/* Confirmed Quote Summary - shown after acceptance */}
      {latestSuperQuote && (latestSuperQuote.status === 'ACCEPTED' || (booking.trips && booking.trips.length > 0)) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Quote Confirmed
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
              #{latestSuperQuote.quoteNumber}
            </span>
          </div>

          <div className="bg-white rounded-lg p-4 mb-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{booking.vehiclesRequired}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-600">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* View Quote Details Toggle */}
          <button
            onClick={() => setShowQuoteDetails(!showQuoteDetails)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-emerald-200 rounded-lg text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
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
              <div className="bg-white rounded-lg p-4 mt-3 text-center text-sm text-gray-500">No detailed quote information available.</div>
            );

            const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
            const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
            const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
            const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

            return (
              <div className="space-y-3 mt-3">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-emerald-600 font-semibold mb-2">Service Details</p>
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
                      {quoteDetails[0].kmLimit && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{quoteDetails[0].kmLimit} km/day limit</span>}
                      {quoteDetails[0].extraKmCharge && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Extra km: ₹{quoteDetails[0].extraKmCharge}/km</span>}
                      {quoteDetails[0].fuelPolicy && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Fuel: {quoteDetails[0].fuelPolicy}</span>}
                      {quoteDetails[0].deliveryCharges > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">Delivery: ₹{quoteDetails[0].deliveryCharges}</span>}
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
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-emerald-600 font-semibold mb-3 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" /> Cost Breakdown (per vehicle)
                      </p>
                      <div className="space-y-2">
                        {bp > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price</span>
                            <span className="font-semibold text-gray-900">₹{bp.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {da > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Driver Allowance</span>
                            <span className="font-semibold text-gray-900">₹{da.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {(bp > 0 || da > 0) && (
                          <div className="flex justify-between text-sm border-t pt-2 mt-1">
                            <span className="font-semibold text-gray-800">Per Vehicle Total</span>
                            <span className="font-bold text-emerald-700">₹{(bp + da).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {(pkm > 0 || pday > 0 || nc > 0 || ekm > 0) && (
                          <>
                            <div className="border-t mt-2 pt-2">
                              <p className="text-[11px] text-gray-400 font-medium mb-1.5">Rate Information</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                              {pkm > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Per KM Rate</span>
                                  <span className="text-gray-700">₹{pkm}/km</span>
                                </div>
                              )}
                              {pday > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Per Day Rate</span>
                                  <span className="text-gray-700">₹{pday}/day</span>
                                </div>
                              )}
                              {nc > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Night Charges</span>
                                  <span className="text-gray-700">₹{nc}</span>
                                </div>
                              )}
                              {ekm > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Extra KM Charge</span>
                                  <span className="text-gray-700">₹{ekm}/km</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {allInclusions.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-green-600 font-semibold mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> What's Included</p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {allInclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 mt-0.5">✓</span><span>{item}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {allExclusions.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-red-500 font-semibold mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> What's Not Included</p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {allExclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-red-400 mt-0.5">✗</span><span>{item}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {allTerms.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Terms & Conditions</p>
                    <div className="space-y-1.5">
                      {allTerms.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-gray-400 mt-0.5 text-xs">{i + 1}.</span><span>{item}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {quoteDetails.some((d: any) => d.vendorMessage) && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-purple-500 font-semibold mb-2">Vendor Notes</p>
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {[
              { l: 'Total', v: tripStats.total, bg: 'bg-blue-50', tx: 'text-blue-700' },
              { l: 'Pending', v: tripStats.pending, bg: 'bg-yellow-50', tx: 'text-yellow-700' },
              { l: 'Arrived', v: tripStats.driverArrived, bg: 'bg-indigo-50', tx: 'text-indigo-700' },
              { l: 'Started', v: tripStats.started, bg: 'bg-green-50', tx: 'text-green-700' },
              { l: 'Done', v: tripStats.completed, bg: 'bg-gray-50', tx: 'text-gray-700' },
              { l: 'Cancelled', v: tripStats.cancelled, bg: 'bg-red-50', tx: 'text-red-700' },
            ].map(s => (
              <div key={s.l} className={`${s.bg} rounded-lg p-2.5 text-center`}>
                <div className={`text-xl font-bold ${s.tx}`}>{s.v}</div>
                <div className="text-xs text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Trip Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-3">Trip Details ({booking.trips?.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {booking.trips?.map((trip: any, i: number) => (
                <div key={trip.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-6 text-center font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-800">{trip.tripCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRIP_STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-600'}`}>
                        {trip.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {trip.vehicleName || trip.vehicleNumber || '-'}
                      {booking.serviceType !== 'self-drive' && <> | Driver: {trip.driverName || '-'} {trip.driverPhone ? `(${trip.driverPhone})` : ''}</>}
                      {booking.serviceType === 'self-drive' && <span className="text-sky-600 ml-1">(Self Drive)</span>}
                    </div>
                    {trip.vendor?.businessName && (
                      <div className="text-xs text-teal-600">Vendor: {trip.vendor.businessName}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Copy button with feedback */}
                    <button
                      onClick={() => copyTripLink(trip.tripCode, trip.id)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        copiedTripId === trip.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title="Copy trip link"
                    >
                      {copiedTripId === trip.id ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                    {/* WhatsApp share button */}
                    <button
                      onClick={() => shareTrip(trip, i)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                      title="Share via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Invoice */}
      {booking.invoices?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" /> Invoices
          </h3>
          {booking.invoices.map((inv: any) => (
            <div key={inv.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-sm">{inv.invoiceNumber}</div>
                  <div className="text-xs text-gray-500 mt-1">Due: {formatDate(inv.dueDate)}</div>
                  <div className="text-xs text-gray-500">{inv.totalVehicles} vehicles | {inv.tripsCompleted} trips</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">Rs.{inv.totalAmount?.toLocaleString('en-IN')}</div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                className={`mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition ${
                  inv.status === 'PAID'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}>
                <ExternalLink className="w-4 h-4" />
                {inv.status === 'PAID' ? 'View Invoice' : 'View & Pay Invoice'}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Custom Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => modal.type !== 'confirm' && setModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div className="flex justify-center">
              {modal.type === 'confirm' && (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
              )}
              {modal.type === 'success' && (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">{modal.title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{modal.message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Yes, Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal(null)}
                  className={`w-full py-2.5 font-semibold rounded-xl transition ${
                    modal.type === 'success'
                      ? 'bg-green-600 text-white hover:bg-green-700'
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
    </div>
  );
}
