'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bike,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  FileText,
  Key,
  Play,
  Flag,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  vendorName: string | null;
  vendorPhone: string | null;
  vendorEmail: string | null;
  locationId: string;
  locationName: string | null;
  requestedVehicleName: string | null;
  requestedCategory: string | null;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number | null;
  totalAmount: number;
  gstAmount: number | null;
  securityDeposit: number | null;
  grandTotal: number | null;
  advanceAmount: number | null;
  advancePaymentRef: string | null;
  advancePaymentProof: string | null;
  advancePaymentDate: string | null;
  advancePaymentVerified: boolean;
  advanceVerifiedAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  paidAmount: number | null;
  tripStartOtp: string | null;
  tripOtpVerified: boolean;
  pickedUpAt: string | null;
  returnedAt: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string; phone: string } | null;
  assignedVendor: { id: string; businessName: string; phone: string; email: string } | null;
  acceptedVendor: { id: string; businessName: string; phone: string; email: string } | null;
}

export default function ManagerBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const bookingId = params.id as string;

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manager/bookings/${bookingId}`);
      const data = await res.json();

      if (data.success) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Failed to fetch booking');
      }
    } catch (err) {
      setError('Failed to fetch booking');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, extraData?: any) => {
    setActionLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/manager/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await res.json();

      if (data.success) {
        fetchBooking();
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/otp`);
      const data = await res.json();

      if (data.success) {
        setShowOtpInput(true);
        if (data.otp) {
          // In development, auto-fill OTP
          setOtpValue(data.otp);
        }
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setActionLoading('verify_otp');
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue, action: 'start' }),
      });

      const data = await res.json();

      if (data.success) {
        setShowOtpInput(false);
        setOtpValue('');
        fetchBooking();
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('OTP verification failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; text: string; borderColor: string }> = {
      PENDING_PAYMENT: { label: 'Payment Pending', bg: 'bg-yellow-100', text: 'text-yellow-700', borderColor: 'border-yellow-300' },
      PAYMENT_SUBMITTED: { label: 'Payment Submitted', bg: 'bg-amber-100', text: 'text-amber-700', borderColor: 'border-amber-300' },
      PAYMENT_VERIFIED: { label: 'Payment Verified', bg: 'bg-blue-100', text: 'text-blue-700', borderColor: 'border-blue-300' },
      BROADCASTED: { label: 'Finding Vendor', bg: 'bg-purple-100', text: 'text-purple-700', borderColor: 'border-purple-300' },
      ACCEPTED: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700', borderColor: 'border-green-300' },
      READY_FOR_PICKUP: { label: 'Ready for Pickup', bg: 'bg-cyan-100', text: 'text-cyan-700', borderColor: 'border-cyan-300' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-emerald-100', text: 'text-emerald-700', borderColor: 'border-emerald-300' },
      COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700', borderColor: 'border-gray-300' },
      CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', borderColor: 'border-red-300' },
      EXPIRED: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500', borderColor: 'border-gray-300' },
    };
    return configs[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', borderColor: 'border-gray-300' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/manager/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/manager/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Booking #{booking.bookingNumber}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Status Banner with Actions */}
      <div className={`rounded-xl p-4 border-2 ${statusConfig.bg} ${statusConfig.borderColor}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className={`font-semibold ${statusConfig.text}`}>{statusConfig.label}</p>
            {booking.status === 'PAYMENT_SUBMITTED' && (
              <p className="text-sm text-gray-600 mt-1">
                Customer has submitted payment. Verify and approve.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === 'PAYMENT_SUBMITTED' && (
              <>
                <Button
                  onClick={() => handleAction('verify_payment')}
                  disabled={!!actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'verify_payment' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Verify Payment
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={!!actionLoading}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Payment
                </Button>
              </>
            )}

            {booking.status === 'PAYMENT_VERIFIED' && (
              <Button
                onClick={() => handleAction('broadcast')}
                disabled={!!actionLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {actionLoading === 'broadcast' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Broadcast to Vendors
              </Button>
            )}

            {(booking.status === 'ACCEPTED' || booking.status === 'READY_FOR_PICKUP') && !showOtpInput && (
              <Button
                onClick={handleSendOtp}
                disabled={otpSending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {otpSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Send OTP to Start Trip
              </Button>
            )}

            {booking.status === 'IN_PROGRESS' && (
              <Button
                onClick={() => handleAction('complete_trip')}
                disabled={!!actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading === 'complete_trip' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Flag className="w-4 h-4 mr-2" />
                )}
                Complete Trip
              </Button>
            )}

            {/* Cancel button for pre-trip statuses */}
            {['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'BROADCASTED', 'PENDING_VENDOR'].includes(booking.status) && (
              <Button
                onClick={() => setShowCancelModal(true)}
                disabled={!!actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Booking
              </Button>
            )}
          </div>
        </div>

        {/* OTP Input */}
        {showOtpInput && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600 mb-2">Enter the 6-digit OTP shared by customer:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                className="flex-1 px-3 py-2 border rounded-lg font-mono text-lg tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={actionLoading === 'verify_otp'}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'verify_otp' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOtpInput(false);
                  setOtpValue('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          Customer Details
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{booking.customer?.name || booking.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <a href={`tel:${booking.customer?.phone || booking.customerPhone}`} className="font-medium text-blue-600">
              {booking.customer?.phone || booking.customerPhone}
            </a>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{booking.customer?.email || booking.customerEmail || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bike className="w-5 h-5 text-gray-400" />
          Booking Details
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-medium">{booking.requestedVehicleName || 'Any'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {booking.locationName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(booking.pickupDate)} at {formatTime(booking.pickupTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Drop-off</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(booking.dropDate)} at {formatTime(booking.dropTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-400" />
          Payment Details
        </h2>
        <div className="space-y-4">
          {/* Payment Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium flex items-center">
                  <IndianRupee className="w-3 h-3" />
                  {booking.dailyRate?.toLocaleString() || '0'} x {booking.totalDays} days
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rental Amount</span>
                <span className="font-medium flex items-center">
                  <IndianRupee className="w-3 h-3" />
                  {booking.totalAmount?.toLocaleString()}
                </span>
              </div>
              {booking.securityDeposit && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    {booking.securityDeposit?.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Grand Total</span>
                  <span className="font-bold text-lg text-gray-900 flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {booking.grandTotal?.toLocaleString() || booking.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Advance Required</p>
              <p className="text-lg font-bold text-blue-700 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {booking.advanceAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-green-700 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {booking.paidAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600 mb-1">Balance Due</p>
              <p className="text-lg font-bold text-orange-700 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {((booking.grandTotal || booking.totalAmount || 0) - (booking.paidAmount || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Reference Section */}
          {(booking.advancePaymentRef || booking.advancePaymentProof || booking.status === 'PAYMENT_SUBMITTED') && (
            <div className={`rounded-lg p-4 border-2 ${
              booking.status === 'PAYMENT_SUBMITTED'
                ? 'bg-amber-50 border-amber-200'
                : booking.advancePaymentVerified
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Payment Reference</h3>
                {booking.advancePaymentVerified ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                ) : booking.status === 'PAYMENT_SUBMITTED' ? (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Awaiting Verification
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Pending Payment
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {booking.advancePaymentRef && (
                  <div>
                    <p className="text-xs text-gray-500">Reference/UTR Number</p>
                    <p className="font-mono text-sm font-medium">{booking.advancePaymentRef}</p>
                  </div>
                )}
                {booking.paymentMethod && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm font-medium">{booking.paymentMethod}</p>
                  </div>
                )}
                {booking.advancePaymentDate && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Date</p>
                    <p className="text-sm font-medium">{formatDate(booking.advancePaymentDate)}</p>
                  </div>
                )}
                {booking.advanceVerifiedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Verified On</p>
                    <p className="text-sm font-medium">{formatDate(booking.advanceVerifiedAt)}</p>
                  </div>
                )}
              </div>

              {booking.advancePaymentProof && (
                <div className="mt-3 pt-3 border-t">
                  <a
                    href={booking.advancePaymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-blue-600 hover:bg-blue-50 transition text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View Payment Screenshot/Proof
                  </a>
                </div>
              )}

              {/* Action buttons for PAYMENT_SUBMITTED status */}
              {booking.status === 'PAYMENT_SUBMITTED' && (
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleAction('verify_payment')}
                    disabled={!!actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    {actionLoading === 'verify_payment' ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Verify Payment
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    disabled={!!actionLoading}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vendor Details */}
      {(booking.acceptedVendor || booking.assignedVendor) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Vendor Details
          </h2>
          {(() => {
            const vendor = booking.acceptedVendor || booking.assignedVendor;
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{vendor?.businessName}</p>
                  <p className="text-sm text-gray-500">{vendor?.phone}</p>
                  <p className="text-sm text-gray-400">{vendor?.email}</p>
                </div>
                <a href={`tel:${vendor?.phone}`}>
                  <Button variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </a>
              </div>
            );
          })()}
        </div>
      )}

      {/* Trip Status */}
      {(booking.pickedUpAt || booking.returnedAt) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-gray-400" />
            Trip Status
          </h2>
          <div className="space-y-3">
            {booking.pickedUpAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Trip Started</p>
                  <p className="text-sm text-gray-500">{formatDate(booking.pickedUpAt)}</p>
                </div>
              </div>
            )}
            {booking.returnedAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Flag className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Trip Completed</p>
                  <p className="text-sm text-gray-500">{formatDate(booking.returnedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {booking.adminNotes && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Admin Notes
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{booking.adminNotes}</pre>
          </div>
        </div>
      )}

      {/* Payment Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payment. The customer will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Payment screenshot is unclear, amount doesn't match, UTR not found..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAction('reject_payment', { reason: rejectReason });
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={!rejectReason.trim() || !!actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading === 'reject_payment' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reject Payment'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Customer requested cancellation, no vendors available..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Keep Booking
              </Button>
              <Button
                onClick={() => {
                  handleAction('cancel', { reason: cancelReason });
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={!cancelReason.trim() || !!actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Cancel Booking'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
