'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Loader2,
  FileText,
  MessageCircle,
  Package,
  User,
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

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  customerId?: string;
  equipmentCategory: string;
  equipmentType: string;
  equipmentModel?: string;
  quantity: number;
  deliveryLocation: string;
  deliveryAddress?: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyRate: number;
  baseAmount: number;
  additionalCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: string;
  rating?: number;
  review?: string;
  vendor?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  operator?: {
    name: string;
    phone: string;
  };
  deliveryOtp?: string;
  returnOtp?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  EQUIPMENT_DEPLOYED: { label: 'Equipment Deployed', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Package },
  IN_USE: { label: 'In Use', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Wrench },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
};

export default function CustomerEquipmentBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booking, setBooking] = useState<EquipmentBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
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
        const response = await fetch(`/api/equipment-bookings/${params.id}?phone=${encodeURIComponent(identifier)}`);
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

  const handleSubmitRating = async () => {
    if (rating === 0 || !booking) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/equipment-bookings/${booking.id}`, {
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
    window.open(`/api/equipment-bookings/${booking.id}/invoice`, '_blank');
  };

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
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
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50" pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{booking.equipmentType}</h1>
                  <p className="text-white/80">Booking #{booking.bookingNumber}</p>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-2`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Equipment Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Equipment Details</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Equipment Type</p>
                <p className="font-medium text-gray-900">{booking.equipmentType}</p>
                <p className="text-sm text-gray-600">{booking.equipmentCategory}</p>
                {booking.equipmentModel && (
                  <p className="text-sm text-gray-600 mt-1">Model: {booking.equipmentModel}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Delivery Location</p>
                <p className="font-medium text-gray-900">{booking.deliveryLocation}</p>
                {booking.deliveryAddress && (
                  <p className="text-sm text-gray-600 mt-1">{booking.deliveryAddress}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.endDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Rental Duration</p>
                <p className="font-medium text-gray-900">{booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Required */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount && (
          <BookingPayment
            bookingId={booking.id}
            bookingType="equipment"
            amount={booking.advanceAmount}
            bookingNumber={booking.bookingNumber}
            serviceSlug="equipment-rental"
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

        {/* Vendor Details */}
        {booking.vendor && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Vendor</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.vendor.name}</p>
                    {booking.vendor.rating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{booking.vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href={`tel:${booking.vendor.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Call
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Operator Details - Show after booking is confirmed */}
        {booking.operator && ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Assigned Operator</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.operator.name}</p>
                    <p className="text-sm text-gray-500">Equipment Operator</p>
                  </div>
                </div>
                <a
                  href={`tel:${booking.operator.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Call
                </a>
              </div>
            </div>
          </div>
        )}

        {/* OTP Display for Customer */}
        {booking.deliveryOtp && ['CONFIRMED', 'DELIVERED'].includes(booking.status) && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-3">Delivery Verification</h3>
            <p className="text-sm text-amber-700 mb-4">Share this OTP with the operator to confirm equipment delivery:</p>
            <div className="bg-white rounded-lg p-4 text-center border border-amber-300">
              <p className="text-3xl font-mono font-bold text-amber-800 tracking-widest">{booking.deliveryOtp}</p>
            </div>
          </div>
        )}

        {booking.returnOtp && ['PICKUP_SCHEDULED', 'IN_USE'].includes(booking.status) && (
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-green-800 mb-3">Return Verification</h3>
            <p className="text-sm text-green-700 mb-4">Share this OTP with the operator to confirm equipment return:</p>
            <div className="bg-white rounded-lg p-4 text-center border border-green-300">
              <p className="text-3xl font-mono font-bold text-green-800 tracking-widest">{booking.returnOtp}</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Payment Details</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Rate</span>
              <span className="font-medium">₹{booking.dailyRate?.toLocaleString('en-IN')}/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rental Duration</span>
              <span className="font-medium">{booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Amount</span>
              <span className="font-medium">₹{booking.baseAmount?.toLocaleString('en-IN')}</span>
            </div>
            {booking.additionalCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Charges</span>
                <span className="font-medium">₹{booking.additionalCharges?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t text-lg">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-amber-600">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            {booking.advancePaid && booking.advancePaid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Advance Paid</span>
                  <span>- ₹{booking.advancePaid?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Balance Due</span>
                  <span className="text-amber-600">₹{booking.balanceAmount?.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rating (for completed rentals) */}
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
        <div className="flex flex-col gap-3">
          {booking.vendor && (
            <button
              onClick={() => setShowChat(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="w-5 h-5" />
              Chat with Vendor
            </button>
          )}

          {booking.status === 'COMPLETED' && !booking.rating && (
            <button
              onClick={() => setShowRateModal(true)}
              className="w-full px-6 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Star className="w-5 h-5 fill-white" />
              Rate Your Experience
            </button>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadInvoice}
              className="flex-1 px-6 py-3 bg-white border-2 border-amber-600 text-amber-600 font-medium rounded-xl hover:bg-amber-50 transition text-center flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Invoice
            </button>
            <Link
              href="/customer/helpdesk"
              className="flex-1 px-6 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition text-center flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Need Help?
            </Link>
          </div>

          <Link
            href="/customer/dashboard"
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How was your rental?</h2>
              <p className="text-gray-500">Your feedback helps us improve our service.</p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 group transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${star <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 group-hover:text-amber-200'
                      }`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you like or what could be better?"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                onClick={() => setShowRateModal(false)}
                disabled={isSubmittingRating}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-6 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Submit Review'
                )}
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
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{booking.vendor.name}</h3>
                <p className="text-white/80 text-sm">Equipment Booking #{booking.bookingNumber}</p>
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
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
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
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim() || isSendingMessage}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl hover:from-amber-600 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
