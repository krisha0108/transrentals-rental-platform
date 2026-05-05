'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  Phone,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Copy,
  MessageCircle,
  Loader2,
  TruckIcon,
  Send,
  X,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface TruckBooking {
  id: string;
  bookingNumber: string;
  customerId?: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  goodsType: string;
  weight?: number;
  pickupCity: string;
  pickupAddress?: string;
  dropCity: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  baseAmount: number;
  additionalCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  loadingStartedAt?: string;
  deliveryCompletedAt?: string;
  rating?: number;
  review?: string;
  vendor?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Truck },
  LOADING: { label: 'Loading', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  IN_TRANSIT: { label: 'In Transit', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: TruckIcon },
  UNLOADING: { label: 'Unloading', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
};

const CANCEL_REASONS = [
  'Plans changed / Trip cancelled',
  'Found a better deal',
  'Booked by mistake',
  'Emergency or urgent situation',
  'Pickup date or time needs to change',
  'Vehicle does not meet my requirements',
  'Payment issue',
  'Other',
];

export default function CustomerTruckBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booking, setBooking] = useState<TruckBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [review, setReview] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    // Check authentication from localStorage
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (!customer) return;

    const fetchBooking = async () => {
      try {
        const identifier = customer.phone || customer.email;
        const response = await fetch(`/api/truck-bookings/${params.id}?phone=${encodeURIComponent(identifier)}`);
        const data = await response.json();

        if (data.success) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, customer]);

  const fetchChatMessages = async (showLoader = true) => {
    if (!booking?.id || !booking?.vendor?.id) return;

    try {
      if (showLoader) setIsLoadingMessages(true);
      const res = await fetch(
        `/api/customer/booking/${booking.id}/chat/${booking.vendor.id}?customer_id=${booking.customerId || ''}`
      );
      const data = await res.json();

      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !booking?.id || !booking?.vendor?.id) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch(`/api/customer/booking/${booking.id}/chat/${booking.vendor.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newChatMessage.trim(),
          customer_id: booking.customerId || '',
          customer_name: customer?.name
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewChatMessage('');
        fetchChatMessages(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (showChat && booking?.id && booking?.vendor?.id) {
      fetchChatMessages(true);
      const interval = setInterval(() => fetchChatMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [showChat, booking?.id, booking?.vendor?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRawTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const copyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitRating = async () => {
    if (rating === 0 || !booking) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/truck-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          rating,
          review
        })
      });

      const data = await response.json();
      if (data.success) {
        setBooking({ ...booking, rating, review });
        setShowRateModal(false);
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const downloadInvoice = () => {
    if (!booking) return;
    window.open(`/api/truck-bookings/${booking.id}/invoice`, '_blank');
  };

  const handleCancelBooking = async () => {
    const finalReason = selectedCancelReason === 'Other' ? otherCancelReason.trim() : selectedCancelReason;
    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other' ? 'Please describe your reason' : 'Please select a reason for cancellation');
      return;
    }
    if (!booking) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch(`/api/truck-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      });
      const data = await response.json();
      if (data.success) {
        setShowCancelModal(false);
        window.location.reload();
      } else {
        setCancelError(data.error || 'Failed to cancel booking');
      }
    } catch {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600">{error || 'This booking does not exist or you do not have access to it.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{booking.vehicleName}</h1>
                <p className="text-white/70 text-sm mt-0.5">#{booking.bookingNumber}</p>
                {booking.pickupCity && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{booking.pickupCity} → {booking.dropCity}
                  </p>
                )}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 whitespace-nowrap ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
          </div>
          {/* Quick stats row */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Service Type</p>
              <p className="text-white font-bold text-sm mt-0.5">{booking.serviceType?.replace('_', ' ')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Total Amount</p>
              <p className="text-white font-bold text-sm mt-0.5">₹{(booking.baseAmount + (booking.additionalCharges || 0))?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs">Advance Paid</p>
              <p className="text-white font-bold text-sm mt-0.5">{booking.advancePaid ? `₹${booking.advancePaid.toLocaleString('en-IN')}` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Trip Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trip Details</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Pickup */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Pickup</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{booking.pickupCity}</p>
                {booking.pickupAddress && <p className="text-xs text-gray-500 mt-0.5">{booking.pickupAddress}</p>}
                <p className="text-xs text-gray-600 mt-1">{booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                <p className="text-xs text-gray-500">{formatRawTime(booking.pickupTime)}</p>
              </div>
              {/* Drop */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Delivery</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{booking.dropCity}</p>
                {booking.dropAddress && <p className="text-xs text-gray-500 mt-0.5">{booking.dropAddress}</p>}
              </div>
            </div>
            {/* Goods info row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Goods Type</p>
                <p className="text-sm font-bold text-gray-800">{booking.goodsType}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Weight</p>
                <p className="text-sm font-bold text-gray-800">{booking.weight ? `${booking.weight} kg` : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver */}
        {(booking.vehicleNumber || booking.driverName) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle & Driver</p>
            </div>
            <div className="p-4 space-y-3">
              {booking.vehicleNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TruckIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Vehicle</p>
                    <p className="font-bold text-gray-900">{booking.vehicleNumber}</p>
                    {booking.vehicle_model && <p className="text-xs text-gray-500">{booking.vehicle_model}</p>}
                  </div>
                </div>
              )}
              {booking.driverName && (
                <div className={`flex items-center justify-between ${booking.vehicleNumber ? 'pt-3 border-t border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Driver</p>
                      <p className="font-bold text-gray-900">{booking.driverName}</p>
                    </div>
                  </div>
                  {booking.driverPhone && (
                    <a href={`tel:${booking.driverPhone}`} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold shadow-sm">
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Required */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount && (
          <BookingPayment
            bookingId={booking.id}
            bookingType="truck"
            amount={booking.advanceAmount}
            bookingNumber={booking.bookingNumber}
            onSuccess={() => window.location.reload()}
          />
        )}

        {/* Payment Submitted - Under Review */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Payment Under Verification</h3>
                <p className="text-sm text-amber-700">
                  Your payment is being verified. This usually takes 15-30 minutes during business hours.
                  You will receive a notification once verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading OTP */}
        {booking.loadingOtp && booking.status === 'VEHICLE_ASSIGNED' && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Loading OTP</p>
                <p className="text-3xl font-bold tracking-wider">{booking.loadingOtp}</p>
                <p className="text-white/80 text-sm mt-1">Share this with the driver to start loading</p>
              </div>
              <button
                onClick={() => copyOtp(booking.loadingOtp!)}
                className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            {copied && <p className="text-sm text-white/80 mt-2">OTP copied!</p>}
          </div>
        )}

        {/* Delivery OTP */}
        {booking.deliveryOtp && ['IN_TRANSIT', 'UNLOADING'].includes(booking.status) && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Delivery OTP</p>
                <p className="text-3xl font-bold tracking-wider">{booking.deliveryOtp}</p>
                <p className="text-white/80 text-sm mt-1">Share this with the driver at delivery location</p>
              </div>
              <button
                onClick={() => copyOtp(booking.deliveryOtp!)}
                className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            {copied && <p className="text-sm text-white/80 mt-2">OTP copied!</p>}
          </div>
        )}

        {/* Vendor Details */}
        {booking.vendor && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor Details</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{booking.vendor.name}</p>
                    {booking.vendor.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(booking.vendor!.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <a href={`tel:${booking.vendor.phone}`} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold shadow-sm">
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Summary</p>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Base Fare</span>
              <span className="font-medium text-gray-800">₹{booking.baseAmount?.toLocaleString('en-IN')}</span>
            </div>
            {booking.additionalCharges > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Additional Charges</span>
                <span className="font-medium text-gray-800">₹{booking.additionalCharges?.toLocaleString('en-IN')}</span>
              </div>
            )}
            {booking.gstAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">GST</span>
                <span className="font-medium text-gray-800">₹{booking.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="font-bold text-green-700 text-lg">₹{(booking.baseAmount + (booking.additionalCharges || 0))?.toLocaleString('en-IN')}</span>
            </div>
            {booking.advancePaid && booking.advancePaid > 0 && (
              <div className="mt-1 bg-green-50 border border-green-100 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 font-medium">Advance Paid</span>
                  <span className="font-bold text-green-700">₹{booking.advancePaid?.toLocaleString('en-IN')}</span>
                </div>
                {booking.balanceAmount && booking.balanceAmount > 0 && (
                  <div className="flex justify-between items-center text-sm border-t border-green-100 pt-2">
                    <span className="text-gray-600">Balance Due</span>
                    <span className="font-bold text-orange-600">₹{booking.balanceAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cancel Booking */}
        {['PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'].includes(booking.status) && (
          <div className="bg-white rounded-xl border border-red-100 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cancel Booking</h3>
            <p className="text-sm text-gray-500 mb-3">
              Once cancelled, refund will be processed as per vendor's cancellation policy.
            </p>
            <button
              onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Cancel This Booking
            </button>
          </div>
        )}

        {/* Cancellation Details */}
        {booking.status === 'CANCELLED' && booking.cancelledAt && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Cancellation Details
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cancelled At</span>
                <span className="text-xs font-semibold text-gray-800">
                  {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                </span>
              </div>
              {booking.cancelledBy && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Cancelled By</span>
                  <span className="text-xs font-semibold text-gray-800 capitalize">{booking.cancelledBy}</span>
                </div>
              )}
              {booking.cancellationReason && (
                <div className="pt-1 border-t border-red-200 mt-1">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2">{booking.cancellationReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating (for completed trips) */}
        {booking.status === 'COMPLETED' && booking.rating && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Your Rating</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= booking.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="font-medium text-gray-900 ml-2">{booking.rating}/5</span>
              </div>
              {booking.review && (
                <p className="text-gray-600 mt-2">{booking.review}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {booking.vendor && (
            <button
              onClick={() => setShowChat(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Vendor
            </button>
          )}
          {booking.status === 'COMPLETED' && !booking.rating && (
            <button
              onClick={() => setShowRateModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition shadow-sm"
            >
              <Star className="w-4 h-4 fill-white" />
              Rate Your Experience
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/customer/helpdesk"
              className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition text-sm shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Need Help?
            </Link>
            <Link
              href="/customer/dashboard"
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-gray-900">Cancel Booking</h2>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-gray-800">Booking #{booking.bookingNumber}</p>
                <p className="text-gray-600">{booking.vehicleName} · {booking.goodsType}</p>
                {booking.advancePaid != null && booking.advancePaid > 0 && (
                  <p className="text-orange-600 font-medium">Paid: ₹{booking.advancePaid.toLocaleString('en-IN')} — refund subject to cancellation policy</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      onClick={() => { setSelectedCancelReason(reason); setCancelError(null); if (reason !== 'Other') setOtherCancelReason(''); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCancelReason === reason ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedCancelReason === reason ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                        {selectedCancelReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${selectedCancelReason === reason ? 'text-red-700 font-medium' : 'text-gray-700'}`}>{reason}</span>
                    </label>
                  ))}
                </div>
                {selectedCancelReason === 'Other' && (
                  <textarea
                    value={otherCancelReason}
                    onChange={(e) => setOtherCancelReason(e.target.value)}
                    placeholder="Please describe your reason..."
                    rows={3}
                    autoFocus
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  />
                )}
              </div>
              {cancelError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {cancelError}
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <strong>Note:</strong> This action cannot be undone. The vendor will be notified immediately.
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !selectedCancelReason || (selectedCancelReason === 'Other' && !otherCancelReason.trim())}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (<><Loader2 className="w-4 h-4 animate-spin" />Cancelling...</>) : (<><XCircle className="w-4 h-4" />Yes, Cancel</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How was your trip?</h2>
              <p className="text-sm text-gray-500 mt-1">Your feedback helps us improve our service.</p>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 group transition-transform hover:scale-110">
                  <Star className={`w-10 h-10 transition-colors ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 group-hover:text-amber-200'}`} />
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Share your experience (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you like or what could be better?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all resize-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm" onClick={() => setShowRateModal(false)} disabled={isSubmittingRating}>
                Cancel
              </button>
              <button className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm" onClick={handleSubmitRating} disabled={rating === 0 || isSubmittingRating}>
                {isSubmittingRating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && booking?.vendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{booking.vendor.name}</h3>
                <p className="text-white/80 text-sm">Truck Booking #{booking.bookingNumber}</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'customer'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_type === 'customer' ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendChatMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim() || isSendingMessage}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
