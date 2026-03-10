'use client';

import { useState, useEffect } from 'react';
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
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageId?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  baseFare: number;
  gstAmount: number;
  platformFee: number;
  grandTotal: number;
  advanceAmount?: number;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  tripStartOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  rating?: number;
  review?: string;
  paymentStatus?: string;
  transactionId?: string;
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

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/car-rental/bookings/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setBooking(data.booking);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [params.id]);

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
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-emerald-900 text-white py-6">
        <div className="container-custom">
          <Link
            href="/customer/car-rental-bookings"
            className="inline-flex items-center gap-2 text-emerald-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Booking #{booking.bookingNumber}</h1>
              <p className="text-emerald-200">{booking.carCategoryName} - {booking.tripType.replace(/_/g, ' ')}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Vendor Card (when confirmed but no driver assigned yet) */}
            {!booking.driverName && booking.acceptedVendorId && ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(booking.status) && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Contact Vendor</h2>
                <p className="text-gray-600 mb-4">Your booking is confirmed. A driver will be assigned soon.</p>
                <BikeBookingChat
                  bookingId={booking.id}
                  vendorId={booking.acceptedVendorId}
                  vendorName="Vendor"
                  customerId={customer?.id?.toString() || booking.customerId || `guest-${booking.id}`}
                  customerName={customer?.name || 'Customer'}
                />
              </div>
            )}

            {/* Driver Card (if assigned) */}
            {booking.driverName && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Your Driver</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{booking.driverName}</h3>
                    <p className="text-gray-600">{booking.vehicle_models}</p>
                    <p className="text-sm text-gray-500">{booking.vehicleNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${booking.driverPhone}`}
                      className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200"
                    >
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </a>
                    <a
                      href={`https://wa.me/${booking.driverPhone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200"
                    >
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </a>
                  </div>
                </div>

                {/* Chat with Vendor */}
                {booking.acceptedVendorId && (
                  <div className="mt-4 pt-4 border-t">
                    <BikeBookingChat
                      bookingId={booking.id}
                      vendorId={booking.acceptedVendorId}
                      vendorName={booking.driverName || 'Vendor'}
                      customerId={customer?.id?.toString() || booking.customerId || `guest-${booking.id}`}
                      customerName={customer?.name || 'Customer'}
                    />
                  </div>
                )}

                {/* OTP for trip start */}
                {booking.status === 'DRIVER_ASSIGNED' && (
                  <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                    {booking.tripStartOtp ? (
                      <>
                        <p className="text-sm text-amber-700 mb-2">Trip Start OTP</p>
                        <p className="text-3xl font-bold text-amber-700 tracking-widest">
                          {booking.tripStartOtp}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Share this OTP with your driver to start the trip
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-amber-700 mb-1">Trip Start OTP</p>
                        <p className="text-xs text-amber-600">
                          An OTP will be sent to your phone when the driver is ready to start the trip. Share the OTP with your driver to begin the journey.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trip Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Trip Details</h2>

              <div className="space-y-4">
                {/* Route */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <div className="w-0.5 h-12 bg-gray-300" />
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="font-medium">{booking.pickupAddress || booking.pickupCity}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })} at {booking.pickupTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Drop</p>
                      <p className="font-medium">
                        {booking.dropAddress || booking.dropCity || booking.pickupCity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Info */}
                {booking.localPackageId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Package</p>
                    <p className="font-semibold">
                      {booking.localPackageHours} Hours / {booking.localPackageKm} Km
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Extra charges apply beyond package limits
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Booking Timeline</h2>
              <div className="space-y-4">
                {[
                  { label: 'Booking Created', time: booking.createdAt, done: true },
                  { label: 'Driver Assigned', time: booking.status !== 'PENDING_VENDOR' ? new Date().toISOString() : null, done: !!booking.driverName },
                  { label: 'Trip Started', time: booking.tripStartedAt, done: !!booking.tripStartedAt },
                  { label: 'Trip Completed', time: booking.tripEndedAt, done: booking.status === 'COMPLETED' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && step.done && (
                        <p className="text-xs text-gray-500">
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
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{booking.baseFare.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                * Toll, parking, and state permit charges are extra
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
              {(booking.status === 'PAYMENT_SUBMITTED' || (booking.status === 'PENDING_PAYMENT' && booking.paymentStatus === 'SUBMITTED')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-amber-800">Payment Under Verification</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Your payment has been submitted. Our team will verify and confirm your booking within 15–30 minutes.
                  </p>
                  {booking.transactionId && (
                    <p className="text-xs text-amber-500 mt-2">Ref: {booking.transactionId}</p>
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
                  className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5" />
                  Rate Your Trip
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Booking
                </button>
              )}

              <button
                onClick={() => window.open(`/api/car-rental/bookings/${booking.bookingNumber}/invoice`, '_blank')}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Invoice
              </button>

              <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Need Help?
              </button>
            </div>
          </div>
        </div>
      </div>

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
