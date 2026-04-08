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
  acceptedDriverId?: string;
  acceptedStaffId?: string;
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
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/car-rental/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', cancellationReason: 'Customer cancelled' }),
      });
      const data = await response.json();
      if (data.success) {
        setBooking((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
        alert('Booking cancelled successfully');
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      alert('Failed to cancel booking');
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

  return (
    <div className="min-h-screen bg-gray-50" pt-16">
      <CustomerHeader showBackButton />
      {/* Success Banner for new booking */}
      {isNew && (
        <div className="bg-green-500 text-white py-3 px-4">
          <div className="container-custom flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Booking confirmed! We&apos;re finding a driver for you.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-emerald-900 text-white py-4">
        <div className="container-custom">
          <Link
            href="/customer/car-rental-bookings"
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white mb-3 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bookings
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-sm font-semibold text-white">#{booking.bookingNumber}</h1>
              <p className="text-xs text-emerald-300 mt-0.5">{booking.carCategoryName} · {booking.tripType.replace(/_/g, ' ')}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Vendor Card (if vendor accepted from dashboard — not driver/staff app) */}
            {booking.vendor && !booking.acceptedDriverId && !booking.acceptedStaffId && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Service Provider</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                    {booking.vendor.logo
                      ? <img src={booking.vendor.logo} alt="Vendor"
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }}
                        />
                      : null}
                    <InitialAvatar name={booking.vendor.businessName} className={`w-full h-full rounded-lg ${booking.vendor.logo ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{booking.vendor.businessName}</p>
                    <p className="text-xs text-gray-500">{booking.vendor.ownerName}{booking.vendor.city ? ` · ${booking.vendor.city}` : ''}</p>
                    {booking.vendor.rating && booking.vendor.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-600 font-medium">{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <a href={`tel:${booking.vendor.phone}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex-shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                </div>

                {/* Driver assigned by vendor */}
                {(booking.driverName || booking.acceptedDriverId) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Driver</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-50 flex-shrink-0">
                        {booking.driverPhoto
                          ? <img src={booking.driverPhoto} alt="Driver"
                              className="w-full h-full object-cover"
                              onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }}
                            />
                          : null}
                        <InitialAvatar name={booking.driverName || 'D'} className={`w-full h-full rounded-full bg-indigo-100 text-indigo-700 ${booking.driverPhoto ? 'hidden' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{booking.driverName || 'Driver Assigned'}</p>
                        {booking.driverPhone && <p className="text-xs text-gray-500">{booking.driverPhone}</p>}
                      </div>
                      {booking.driverPhone && (
                        <a href={`tel:${booking.driverPhone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 flex-shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                )}



                {/* Vehicle Details */}
                {(booking.vehicleNumber || booking.vehicleModel) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vehicle</p>
                    <div className="flex items-start gap-3">
                      {booking.vehiclePhoto && (
                        <img src={booking.vehiclePhoto} alt="Vehicle" className="w-16 h-11 object-cover rounded-lg border"
                          onError={e => { e.currentTarget.style.display='none'; }} />
                      )}
                      <div className="flex-1">
                        {booking.vehicleModel && (
                          <p className="text-sm font-semibold text-gray-900">{booking.vehicleModel}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {booking.vehicleNumber && (
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">{booking.vehicleNumber}</span>
                          )}
                          {booking.vehicleColor && <span className="text-xs text-gray-500">{booking.vehicleColor}</span>}
                          {booking.vehicleYear && <span className="text-xs text-gray-500">{booking.vehicleYear}</span>}
                          {booking.vehicleFuelType && <span className="text-xs text-gray-500">{booking.vehicleFuelType}</span>}
                          {booking.vehicleSeats && <span className="text-xs text-gray-500">{booking.vehicleSeats} Seats</span>}
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
                        <div className="mt-3">
                          <p className="text-[11px] text-gray-400 font-medium mb-2">Vehicle Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {allPhotos.map((url, i) => (
                              <button key={i} onClick={() => setLightbox({ images: allPhotos, index: i })}
                                className="focus:outline-none rounded-lg overflow-hidden border border-gray-100 hover:border-emerald-400 transition">
                                <img src={url} alt={`Photo ${i + 1}`}
                                  className="w-16 h-12 object-cover"
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
            )}

            {/* Direct Driver Card (driver or vendor_staff accepted via driver app) */}
            {(booking.acceptedDriverId || booking.acceptedStaffId || (!booking.vendor && booking.driverName)) && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Service Provider</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {booking.driverPhoto
                      ? <img src={booking.driverPhoto} alt="Driver" className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }} />
                      : null}
                    <InitialAvatar name={booking.driverName || 'D'} className={`w-full h-full rounded-full ${booking.driverPhoto ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{booking.driverName || 'Driver Assigned'}</p>
                    {booking.driverPhone && <p className="text-xs text-gray-500">{booking.driverPhone}</p>}
                  </div>
                  {booking.driverPhone && (
                    <a href={`tel:${booking.driverPhone}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex-shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* OTP for trip start */}
            {['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                {booking.tripStartOtp ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Trip Start OTP</p>
                      <p className="text-2xl font-bold text-amber-700 tracking-widest">{booking.tripStartOtp}</p>
                      <p className="text-xs text-amber-600 mt-1">Share this with your driver to start the trip</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Trip Start OTP</p>
                      <p className="text-xs text-amber-600">Waiting for driver to assign vehicle. OTP will appear here.</p>
                    </div>
                    <button onClick={() => fetchBooking(true)} className="text-xs text-amber-700 underline font-medium flex-shrink-0">
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trip Details */}
            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trip Details</p>

              {/* Trip Type Badge */}
              <div className="flex flex-wrap gap-2">
                {booking.tripType === 'OUTSTATION_ROUNDTRIP' && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">
                    ↔ Round Trip
                  </span>
                )}
                {booking.tripType === 'OUTSTATION_ONEWAY' && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full border border-indigo-200">
                    → One Way
                  </span>
                )}
                {booking.tripType === 'LOCAL' && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-200">
                    ◎ Local
                  </span>
                )}
                {(booking.tripType === 'AIRPORT_PICKUP' || booking.tripType === 'AIRPORT_DROP') && (
                  <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full border border-sky-200">
                    ✈ {booking.tripType === 'AIRPORT_PICKUP' ? 'Airport Pickup' : 'Airport Drop'}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  🚗 {booking.carCategoryName}
                </span>
                {booking.totalDays > 1 && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full border border-amber-200">
                    📅 {booking.totalDays} Days
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
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                      {allPoints.map((p, i) => (
                        <React.Fragment key={i}>
                          <div className={`w-3 h-3 rounded-full ${p.type === 'pickup' ? 'bg-emerald-500' : p.type === 'drop' ? 'bg-red-500' : 'bg-orange-400'}`} />
                          {i < allPoints.length - 1 && <div className="w-0.5 h-10 bg-gray-200" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex-1 space-y-3">
                      {allPoints.map((point, i) => (
                        <div key={i} className={`pb-3 ${i < allPoints.length - 1 ? 'border-b border-dashed border-gray-100' : ''}`}>
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                            {point.type === 'pickup' ? 'Pickup' : point.type === 'drop' ? 'Drop' : `Stop ${i}`}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{point.label}</p>
                          {point.sub && <p className="text-xs text-gray-500 mt-0.5">{point.sub}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Local Package */}
              {booking.localPackageId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Package</p>
                    <p className="font-semibold text-gray-900">{booking.localPackageHours} hrs / {booking.localPackageKm} km</p>
                  </div>
                  <p className="text-xs text-emerald-600">Extra charges beyond limits</p>
                </div>
              )}

              {/* Distance Info (outstation) */}
              {booking.chargeableKm && booking.chargeableKm > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Distance</p>
                    <p className="font-semibold text-gray-900">{booking.chargeableKm} km</p>
                  </div>
                  {booking.perKmRate && booking.perKmRate > 0 && (
                    <p className="text-sm text-blue-700 font-medium">₹{booking.perKmRate}/km</p>
                  )}
                </div>
              )}

              {/* Fare Breakdown */}
              <div className="border-t pt-3 space-y-1.5 text-xs">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fare Breakdown</p>
                {booking.kmCharges && booking.kmCharges > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>Distance charge{booking.chargeableKm ? ` (${booking.chargeableKm} km)` : ''}</span>
                    <span>₹{booking.kmCharges.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <span>Base fare</span>
                    <span>₹{booking.baseFare.toLocaleString()}</span>
                  </div>
                )}
                {booking.driverBatta && booking.driverBatta > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Driver allowance</span>
                    <span>₹{booking.driverBatta.toLocaleString()}</span>
                  </div>
                )}
                {booking.nightCharges && booking.nightCharges > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Night charges</span>
                    <span>₹{booking.nightCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.tollCharges && booking.tollCharges > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Toll charges</span>
                    <span>₹{booking.tollCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.gstAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST</span>
                    <span>₹{booking.gstAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-sm">
                  <span>Total</span>
                  <span className="text-emerald-700">₹{booking.grandTotal.toLocaleString()}</span>
                </div>
                {booking.paidAmount && booking.paidAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Paid (advance)</span>
                    <span>₹{booking.paidAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.paidAmount && booking.grandTotal - booking.paidAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Balance due</span>
                    <span>₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 pt-1">* Toll, parking & state permit extra as applicable</p>
              </div>
            </div>

            {/* Vendor Messages / Notes */}
            {booking.vendorNotes && (
              <div className="bg-white rounded-xl border border-emerald-200 p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message from Vendor
                </p>
                <div className="space-y-3">
                  {(() => {
                    let notes: { text: string; sentAt: string }[] = [];
                    try {
                      const parsed = JSON.parse(booking.vendorNotes!);
                      notes = Array.isArray(parsed) ? parsed : [{ text: booking.vendorNotes!, sentAt: '' }];
                    } catch {
                      notes = [{ text: booking.vendorNotes!, sentAt: '' }];
                    }
                    return notes.map((n, i) => (
                      <div key={i} className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <p className="text-sm text-emerald-900 whitespace-pre-line">{n.text}</p>
                        {n.sentAt && (
                          <p className="text-xs text-emerald-500 mt-1 text-right">
                            {new Date(n.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Booking Timeline</p>
              <div className="space-y-3">
                {[
                  { label: 'Booking Created', time: booking.createdAt, done: true },
                  { label: 'Driver Assigned', time: booking.status !== 'PENDING_VENDOR' ? new Date().toISOString() : null, done: !!booking.driverName },
                  { label: 'Trip Started', time: booking.tripStartedAt, done: !!booking.tripStartedAt },
                  { label: 'Trip Completed', time: booking.tripEndedAt, done: booking.status === 'COMPLETED' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.done ? <CheckCircle className="w-3 h-3" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && step.done && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(step.time).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Summary</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Grand Total</span>
                  <span className="font-bold text-emerald-700 text-sm">₹{booking.grandTotal.toLocaleString()}</span>
                </div>
                {booking.paidAmount && booking.paidAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid</span>
                    <span className="font-semibold">₹{booking.paidAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.paidAmount && booking.grandTotal - booking.paidAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold border-t pt-1.5 mt-1">
                    <span>Balance due</span>
                    <span>₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">* Toll, parking & state permit charges are extra</p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-2.5">
              {(booking.status === 'PAYMENT_SUBMITTED' || (booking.status === 'PENDING_PAYMENT' && booking.paymentStatus === 'SUBMITTED')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <CheckCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-sm font-semibold text-amber-800">Payment Under Verification</p>
                  <p className="text-xs text-amber-600 mt-1">Our team will verify and confirm within 15–30 minutes.</p>
                  {booking.transactionId && (
                    <p className="text-[11px] text-amber-500 mt-1">Ref: {booking.transactionId}</p>
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
                  className="w-full px-3 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                >
                  <Star className="w-4 h-4" />
                  Rate Your Trip
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="w-full px-3 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}

              <button
                onClick={() => window.open(`/api/car-rental/bookings/${booking.bookingNumber}/invoice`, '_blank')}
                className="w-full px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>

              <button className="w-full px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Need Help?
              </button>
            </div>
          </div>
        </div>
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Your Trip</h3>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition ${
                    star <= rating ? 'text-amber-500' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
