'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  KeyRound,
  Play,
  Flag,
  Gauge,
  Fuel,
  Settings2,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedVehicleName: string;
  requestedBrand: string;
  requestedCategory: string;
  requestedTransmission: string;
  requestedFuelType: string;
  requestedSeats: number;
  locationName: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  baseAmount: number;
  gstAmount: number;
  platformFee: number;
  securityDeposit: number;
  grandTotal: number;
  kmLimitPerDay: number;
  extraKmRate: number;
  status: string;
  paymentStatus: string;
  responseDeadline: string | null;
  createdAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  returnedAt: string | null;
  customerNotes: string;
  tripStartOtp: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; bg: string; text: string }> = {
    PENDING_VENDOR: { label: 'Awaiting Response', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    BROADCASTED: { label: 'Open Request', bg: 'bg-blue-100', text: 'text-blue-700' },
    PENDING_PAYMENT: { label: 'Awaiting Payment', bg: 'bg-orange-100', text: 'text-orange-700' },
    PAYMENT_VERIFIED: { label: 'Payment Received', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', bg: 'bg-cyan-100', text: 'text-cyan-700' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-purple-100', text: 'text-purple-700' },
    COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
    EXPIRED: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' },
  };
  return configs[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
};

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // OTP states
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpCopied, setOtpCopied] = useState(false);

  // Trip completion states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [odometerEnd, setOdometerEnd] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');


  // Chat states
  const [showChat, setShowChat] = useState(false);

  // Get vendor info from session
  const vendorUser = session?.user as any;
  const vendorId = vendorUser?.id || null;
  const vendorName = vendorUser?.businessName || vendorUser?.name || '';

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${bookingId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking(data.booking);
      } else {
        console.error('Booking not found');
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking accepted successfully!');
        fetchBooking();
      } else {
        alert(data.error || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Accept failed:', error);
      alert('Failed to accept booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking rejected. It will be broadcasted to other vendors.');
        router.push('/vendor/self-drive/bookings');
      } else {
        alert(data.error || 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Reject failed:', error);
      alert('Failed to reject booking');
    } finally {
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  const handleGenerateOtp = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/otp`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedOtp(data.otp || null);
        alert('OTP generated and sent to customer!');
        fetchBooking();
      } else {
        alert(data.error || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('OTP generation failed:', error);
      alert('Failed to generate OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!booking || !otpInput) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('OTP verified! Trip started.');
        setOtpInput('');
        setGeneratedOtp(null);
        fetchBooking();
      } else {
        alert(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert('Failed to verify OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odometerEnd: odometerEnd ? parseInt(odometerEnd) : null,
          damageNotes: damageNotes || null,
          additionalCharges: additionalCharges ? parseFloat(additionalCharges) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Trip completed successfully!');
        setShowCompleteModal(false);
        fetchBooking();
      } else {
        alert(data.error || 'Failed to complete trip');
      }
    } catch (error) {
      console.error('Trip completion failed:', error);
      alert('Failed to complete trip');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
        <p className="text-gray-500 mb-4">The booking you're looking for doesn't exist.</p>
        <Link href="/vendor/self-drive/bookings">
          <Button>Back to Bookings</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const canAcceptReject = ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status);
  const canGenerateOtp = ['ACCEPTED', 'PAYMENT_VERIFIED'].includes(booking.status);
  const canVerifyOtp = booking.status === 'READY_FOR_PICKUP';
  const canCompleteTrip = booking.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/self-drive/bookings"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">#{booking.bookingNumber}</h1>
          <p className="text-gray-600">Self-Drive Car Booking</p>
        </div>
        <span className={cn('px-4 py-2 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.text)}>
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{booking.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${booking.customerPhone}`} className="font-medium text-green-600 hover:underline">
                    {booking.customerPhone}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{booking.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{booking.locationName}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t flex gap-3">
              <a
                href={`tel:${booking.customerPhone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
              <a
                href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
              <button
                onClick={() => setShowChat(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Chat
              </button>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-500" />
              Vehicle Details
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Car className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{booking.requestedVehicleName}</p>
                <p className="text-gray-500">{booking.requestedBrand} • {booking.requestedCategory}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Settings2 className="w-4 h-4" />
                <span>{booking.requestedTransmission || 'Manual'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Fuel className="w-4 h-4" />
                <span>{booking.requestedFuelType || 'Petrol'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{booking.requestedSeats || 5} Seats</span>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Trip Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 mt-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(booking.pickupDate)} at {booking.pickupTime}
                  </p>
                  <p className="text-sm text-gray-600">{booking.pickupAddress || booking.locationName}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-200 ml-1.5 h-6" />
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 mt-2 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">Drop</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(booking.dropDate)} at {booking.dropTime}
                  </p>
                  <p className="text-sm text-gray-600">{booking.pickupAddress || booking.locationName}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="font-bold text-gray-900">{booking.totalDays} Day(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">KM Limit</p>
                <p className="font-bold text-gray-900">{(booking.kmLimitPerDay || 200) * booking.totalDays} KM</p>
                <p className="text-xs text-gray-500">₹{booking.extraKmRate || 12}/extra km</p>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <h2 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Customer Notes
              </h2>
              <p className="text-amber-700">{booking.customerNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-500" />
              Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">₹{booking.dailyRate} × {booking.totalDays} days</span>
                <span>₹{(booking.baseAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Security Deposit</span>
                <span>₹{(booking.securityDeposit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">₹{(booking.grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Actions</h2>

            {/* Accept/Reject */}
            {canAcceptReject && (
              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  Accept Booking
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  size="lg"
                  disabled={processing}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {/* Generate OTP */}
            {canGenerateOtp && (
              <div className="space-y-3">
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <KeyRound className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <p className="text-sm text-cyan-700">
                    {booking.status === 'PAYMENT_VERIFIED' ? 'Payment received — booking confirmed!' : 'Customer is ready for pickup'}
                  </p>
                  <p className="text-xs text-cyan-600">Generate OTP to start the trip</p>
                </div>
                <Button
                  onClick={handleGenerateOtp}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <KeyRound className="w-5 h-5 mr-2" />}
                  Generate OTP
                </Button>
                {generatedOtp && (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">OTP (Dev Mode)</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold font-mono tracking-widest">{generatedOtp}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedOtp);
                          setOtpCopied(true);
                          setTimeout(() => setOtpCopied(false), 2000);
                        }}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        {otpCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verify OTP */}
            {canVerifyOtp && (
              <div className="space-y-3">
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <KeyRound className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <p className="text-sm text-cyan-700">Ask customer for OTP to start trip</p>
                </div>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  size="lg"
                  disabled={processing || otpInput.length !== 6}
                >
                  {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                  Verify & Start Trip
                </Button>
              </div>
            )}

            {/* Complete Trip */}
            {canCompleteTrip && (
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Play className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-700">Trip in progress</p>
                  {booking.pickedUpAt && (
                    <p className="text-xs text-purple-600">Started: {formatDateTime(booking.pickedUpAt)}</p>
                  )}
                </div>
                <Button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <Flag className="w-5 h-5 mr-2" />
                  Complete Trip
                </Button>
              </div>
            )}

            {/* Completed */}
            {booking.status === 'COMPLETED' && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Trip Completed</p>
                {booking.returnedAt && (
                  <p className="text-xs text-gray-500">Returned: {formatDateTime(booking.returnedAt)}</p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                <div>
                  <p className="font-medium text-gray-900">Booking Created</p>
                  <p className="text-sm text-gray-500">{formatDateTime(booking.createdAt)}</p>
                </div>
              </div>
              {booking.acceptedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">Accepted by You</p>
                    <p className="text-sm text-gray-500">{formatDateTime(booking.acceptedAt)}</p>
                  </div>
                </div>
              )}
              {booking.pickedUpAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">Trip Started</p>
                    <p className="text-sm text-gray-500">{formatDateTime(booking.pickedUpAt)}</p>
                  </div>
                </div>
              )}
              {booking.returnedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">Trip Completed</p>
                    <p className="text-sm text-gray-500">{formatDateTime(booking.returnedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Booking</h2>
            <p className="text-gray-600 mb-4">
              Are you sure? This booking will be broadcasted to other vendors.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select a reason...</option>
                <option value="vehicle_unavailable">Car not available</option>
                <option value="maintenance">Car under maintenance</option>
                <option value="already_booked">Already booked</option>
                <option value="location_issue">Cannot serve this location</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Trip</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading (End)
                </label>
                <input
                  type="number"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                  placeholder="Enter final odometer reading"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Damage Notes (if any)
                </label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Describe any damage..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Charges (₹)
                </label>
                <input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleCompleteTrip} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Complete Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id}
              vendorId={vendorId}
              vendorName={vendorName}
              customerId={booking.customerId || undefined}
              customerName={booking.customerName}
              customerEmail={booking.customerEmail}
              customerPhone={booking.customerPhone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
