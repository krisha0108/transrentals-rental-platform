'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  IndianRupee,
  Shield,
  AlertCircle,
  Gauge,
  CreditCard,
  Settings2,
  Fuel,
  Users,
  FileText,
  Copy,
  ExternalLink,
  X,
  Loader2,
  QrCode,
  Banknote,
  Check,
  Upload,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerBookingChat from '@/components/customer/CustomerBookingChat';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  upiId?: string;
  upiQrCode?: string;
  isPrimary: boolean;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationName: string;
  requestedVehicleName: string;
  requestedBrand?: string;
  requestedCategory?: string;
  requestedTransmission?: string;
  requestedFuelType?: string;
  requestedSeats?: number;
  assignedVehicleName?: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  pickupAddress?: string;
  dropAddress?: string;
  isDeliveryRequested: boolean;
  dailyRate: number;
  baseAmount: number;
  gstAmount: number;
  platformFee: number;
  securityDeposit: number;
  grandTotal: number;
  advanceAmount?: number;
  advancePercentage?: number;
  kmLimitPerDay: number;
  extraKmRate: number;
  status: string;
  paymentStatus: string;
  tripStartOtp?: string;
  customerNotes?: string;
  vendorNotes?: string;
  vendor?: {
    businessName: string;
    phone?: string;
  };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Verification', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ACCEPTED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  IN_PROGRESS: { label: 'Trip Started', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export default function CustomerSelfDriveBookingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankAccount | null>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/customer/car-bookings/${id}`);
        const data = await response.json();

        if (data.success) {
          // Map assignedVendor to vendor for display
          const bookingData = {
            ...data.booking,
            vendor: data.booking.assignedVendor,
          };
          setBooking(bookingData);
        } else {
          setError(data.error || 'Failed to load booking');
        }
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    if (label) {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Fetch bank details for payment
  const fetchBankDetails = async () => {
    setLoadingBankDetails(true);
    try {
      const res = await fetch('/api/payment-details?service=self-drive-car-rentals');
      const data = await res.json();
      if (data.success && data.primaryAccount) {
        setBankDetails(data.primaryAccount);
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    } finally {
      setLoadingBankDetails(false);
    }
  };

  // Generate QR code URL from UPI ID
  const getQRCodeUrl = (upiId: string, amount: number) => {
    const upiUrl = `upi://pay?pa=${upiId}&pn=TransRentals&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  };

  // Open payment modal
  const openPaymentModal = async () => {
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setPaymentError(null);
    setPaymentReference('');
    if (!bankDetails) {
      await fetchBankDetails();
    }
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    if (paymentSuccess) {
      // Refresh booking data
      window.location.reload();
    }
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!paymentReference.trim()) {
      setPaymentError('Please enter the payment reference/UTR number');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/self-drive-bookings/${id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking?.advanceAmount || booking?.grandTotal,
          paymentReference: paymentReference.trim(),
          paymentMethod: 'UPI',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentSuccess(true);
      } else {
        setPaymentError(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center border max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Booking Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'This booking could not be loaded'}</p>
          <Link
            href="/customer/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || {
    label: booking.status.replace(/_/g, ' '),
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white mt-6 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  Booking #{booking.bookingNumber}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">Self-Drive Car Rental</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Details */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Vehicle Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">{booking.assignedVehicleName || booking.requestedVehicleName}</p>
                </div>
                {booking.requestedBrand && (
                  <div>
                    <p className="text-sm text-gray-500">Brand</p>
                    <p className="font-medium">{booking.requestedBrand}</p>
                  </div>
                )}
                {booking.requestedCategory && (
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{booking.requestedCategory}</p>
                  </div>
                )}
                {booking.requestedTransmission && (
                  <div>
                    <p className="text-sm text-gray-500">Transmission</p>
                    <p className="font-medium flex items-center gap-1">
                      <Settings2 className="w-4 h-4 text-gray-400" />
                      {booking.requestedTransmission}
                    </p>
                  </div>
                )}
                {booking.requestedFuelType && (
                  <div>
                    <p className="text-sm text-gray-500">Fuel Type</p>
                    <p className="font-medium flex items-center gap-1">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      {booking.requestedFuelType}
                    </p>
                  </div>
                )}
                {booking.requestedSeats && (
                  <div>
                    <p className="text-sm text-gray-500">Seats</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {booking.requestedSeats}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">KM Limit/Day</p>
                  <p className="font-medium flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    {booking.kmLimitPerDay} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Extra KM Rate</p>
                  <p className="font-medium">₹{booking.extraKmRate}/km</p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Trip Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{booking.locationName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Pickup</p>
                      <p className="font-medium">
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{booking.pickupTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Drop-off</p>
                      <p className="font-medium">
                        {new Date(booking.dropDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{booking.dropTime}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                  </div>
                </div>
                {booking.isDeliveryRequested && booking.pickupAddress && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Home Delivery</p>
                    <p className="text-sm text-blue-600 mt-1">{booking.pickupAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-blue-500" />
                Pricing Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate</span>
                  <span className="font-medium">₹{booking.dailyRate?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount ({booking.totalDays} days)</span>
                  <span className="font-medium">₹{booking.baseAmount?.toLocaleString()}</span>
                </div>
                {booking.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-medium">₹{booking.gstAmount?.toLocaleString()}</span>
                  </div>
                )}
                {booking.platformFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">₹{booking.platformFee?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit (Refundable)</span>
                  <span className="font-medium">₹{booking.securityDeposit?.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₹{booking.grandTotal?.toLocaleString()}
                  </span>
                </div>
                {booking.advanceAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Advance Payment ({booking.advancePercentage || 30}%)
                    </span>
                    <span className="font-medium text-green-600">
                      ₹{booking.advanceAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Action */}
            {booking.status === 'PENDING_PAYMENT' && (
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2">Complete Your Booking</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Pay the advance amount to confirm your booking
                </p>
                <div className="bg-white/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-100">Amount to Pay</p>
                  <p className="text-2xl font-bold">
                    ₹{(booking.advanceAmount || booking.grandTotal)?.toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={openPaymentModal}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              </div>
            )}

            {/* Trip OTP - Show when waiting for pickup */}
            {booking.tripStartOtp && ['READY_FOR_PICKUP', 'ACCEPTED'].includes(booking.status) && (
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trip Start OTP
                </h3>
                <p className="text-cyan-100 text-sm mb-4">
                  Share this OTP with the vendor when picking up the vehicle
                </p>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-[0.3em]">
                    {booking.tripStartOtp}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(booking.tripStartOtp || '', 'otp')}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm"
                >
                  {copiedText === 'otp' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy OTP
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trip In Progress */}
            {booking.status === 'IN_PROGRESS' && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Trip In Progress
                </h3>
                <p className="text-purple-100 text-sm mb-4">
                  Enjoy your ride! Drive safely.
                </p>
                <div className="bg-white/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Vehicle</span>
                    <span className="font-medium">{booking.assignedVehicleName || booking.requestedVehicleName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">KM Limit</span>
                    <span className="font-medium">{(booking.kmLimitPerDay || 200) * booking.totalDays} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Return By</span>
                    <span className="font-medium">
                      {new Date(booking.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {booking.dropTime}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Completed */}
            {booking.status === 'COMPLETED' && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Trip Completed
                </h3>
                <p className="text-green-100 text-sm mb-4">
                  Thank you for choosing TransRentals!
                </p>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-100">We hope you had a great experience.</p>
                  <p className="text-xs text-green-200 mt-2">Security deposit will be refunded after inspection.</p>
                </div>
              </div>
            )}

            {/* Vendor Details */}
            {booking.vendor && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Vendor Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="font-medium">{booking.vendor.businessName}</p>
                    </div>
                  </div>
                  {booking.vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a href={`tel:${booking.vendor.phone}`} className="font-medium text-blue-600">
                          {booking.vendor.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${booking.vendor.phone}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                </div>
              </div>
            )}

            {/* Customer Notes */}
            {booking.customerNotes && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Your Notes
                </h3>
                <p className="text-sm text-gray-600">{booking.customerNotes}</p>
              </div>
            )}

            {/* Vendor Notes */}
            {booking.vendorNotes && (
              <div className="bg-green-50 rounded-xl border border-green-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  Vendor Notes
                </h3>
                <p className="text-sm text-gray-600">{booking.vendorNotes}</p>
              </div>
            )}

            {/* Help */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our support team for any queries
              </p>
              <a
                href="tel:+919876543210"
                className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && booking && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 relative">
              <button
                onClick={closePaymentModal}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center -mb-12 shadow-lg relative z-10">
                  {paymentSuccess ? (
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-10">
              {paymentSuccess ? (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
                  <p className="text-gray-600 mb-4">
                    Your payment is being verified. You'll receive a confirmation shortly.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">
                      Reference: {paymentReference}
                    </p>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
                </div>
              ) : loadingBankDetails ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading payment details...</p>
                </div>
              ) : !bankDetails ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Details Unavailable</h3>
                  <p className="text-gray-600 mb-4">
                    Please contact support for payment instructions.
                  </p>
                  <a
                    href="tel:+919737965551"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    Call Support
                  </a>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Pay Advance Amount
                    </h2>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{(booking.advanceAmount || booking.grandTotal)?.toLocaleString()}
                    </p>
                  </div>

                  {/* QR Code Section */}
                  {bankDetails.upiId && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-3 text-center">Scan QR code to pay via UPI</p>
                      <div className="flex justify-center">
                        {bankDetails.upiQrCode ? (
                          <img
                            src={bankDetails.upiQrCode.startsWith('http') ? bankDetails.upiQrCode : `/uploads/${bankDetails.upiQrCode}`}
                            alt="Payment QR Code"
                            className="w-48 h-48 rounded-lg"
                          />
                        ) : (
                          <img
                            src={getQRCodeUrl(bankDetails.upiId, booking.advanceAmount || booking.grandTotal)}
                            alt="Payment QR Code"
                            className="w-48 h-48 rounded-lg"
                          />
                        )}
                      </div>
                      {/* UPI ID */}
                      <div className="mt-3 bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500 mb-1 text-center">UPI ID</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-semibold text-gray-900">{bankDetails.upiId}</span>
                          <button
                            onClick={() => copyToClipboard(bankDetails.upiId || '', 'upi')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {copiedText === 'upi' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Section */}
                  <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3">
                      <Banknote className="h-5 w-5" />
                      Bank Transfer Details
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-medium text-gray-900">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Account Holder</span>
                        <span className="font-medium text-gray-900">{bankDetails.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">Account No.</span>
                        <button
                          onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                          className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                        >
                          {bankDetails.accountNumber}
                          {copiedText === 'account' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-2">
                        <span className="text-gray-500">IFSC Code</span>
                        <button
                          onClick={() => copyToClipboard(bankDetails.ifscCode, 'ifsc')}
                          className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                        >
                          {bankDetails.ifscCode}
                          {copiedText === 'ifsc' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      {bankDetails.branchName && (
                        <div className="flex justify-between items-center bg-white rounded-lg p-2">
                          <span className="text-gray-500">Branch</span>
                          <span className="font-medium text-gray-900">{bankDetails.branchName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Reference Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Reference / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Enter UTR or Transaction ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You'll find this in your payment app after completing the transaction
                    </p>
                  </div>

                  {/* Error Message */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {paymentError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitPayment}
                    disabled={isSubmittingPayment || !paymentReference.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        I've Made the Payment
                      </>
                    )}
                  </button>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By proceeding, you agree to our{' '}
                    <a href="/terms-and-conditions" target="_blank" className="text-blue-600 underline">Terms</a> and{' '}
                    <a href="/cancellations-and-refund" target="_blank" className="text-blue-600 underline">Refund Policy</a>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <CustomerBookingChat
              bookingId={id}
              customerName={booking?.customerName}
              vendorName={booking?.vendor?.businessName}
              vendorPhone={booking?.vendor?.phone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
