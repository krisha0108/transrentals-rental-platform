'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Mail,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  RefreshCw,
  Play,
  Square,
  KeyRound,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AcceptBookingModal } from '@/components/vendor/AcceptBookingModal';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';
import { MessageCircle } from 'lucide-react';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedVehicleName: string;
  requestedBrand: string | null;
  requestedCategory: string | null;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  gstAmount: number;
  securityDeposit: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  customerNotes: string | null;
  acceptedVehicleName: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

interface VehicleOption {
  id: string;
  name: string;
  registrationNumber?: string;
  dailyRate: number;
  fleetPricing: any[];
  fleetLocations: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING_PAYMENT: {
    label: 'Awaiting Payment',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: CreditCard,
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle,
  },
  PENDING_VENDOR: {
    label: 'Pending Acceptance',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  BROADCASTED: {
    label: 'Open Request',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: AlertCircle,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: KeyRound,
  },
  IN_PROGRESS: {
    label: 'Trip In Progress',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Bike,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Payment Pending', color: 'bg-yellow-50 text-yellow-700' },
  SUBMITTED: { label: 'Payment Submitted', color: 'bg-amber-50 text-amber-700' },
  VERIFIED: { label: 'Payment Verified', color: 'bg-green-50 text-green-700' },
  PARTIAL: { label: 'Partial Payment', color: 'bg-orange-50 text-orange-700' },
  PAID: { label: 'Paid', color: 'bg-green-50 text-green-700' },
  COMPLETED: { label: 'Paid', color: 'bg-green-50 text-green-700' },
  REJECTED: { label: 'Payment Rejected', color: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-50 text-gray-700' },
};

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [vendorDbId, setVendorDbId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>('');

  // Fetch vendor info from database
  useEffect(() => {
    async function fetchVendorInfo() {
      try {
        const res = await fetch('/api/vendor/profile');
        const data = await res.json();
        if (data.id) {
          setVendorDbId(data.id);
          setVendorName(data.businessName || data.ownerName || '');
        }
      } catch (error) {
        console.error('Failed to fetch vendor info:', error);
      }
    }
    fetchVendorInfo();
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch booking details
        const res = await fetch(`/api/vendor/bike-bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const data = await res.json();
        setBooking(data.booking);

        // Fetch vendor fleet for accept modal
        const fleetRes = await fetch('/api/vendor/fleet?serviceSlug=bike-rental');
        if (fleetRes.ok) {
          const fleetData = await fleetRes.json();
          setVendorFleet(
            fleetData.fleet?.map((f: any) => ({
              id: f.id,
              name: f.vehicle_models?.name || 'Unknown',
              registrationNumber: f.registrationNumber,
              dailyRate: f.fleetPricing?.[0]?.perDayRate || f.fleetPricing?.[0]?.basePrice || 0,
              fleetPricing: f.fleetPricing || [],
              fleetLocations: f.fleetLocations || [],
            })) || []
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleAcceptBooking = async (data: {
    vehicleId: string;
    vehicleName: string;
    customRate?: number;
  }) => {
    if (!booking) return;

    const response = await fetch(`/api/vendor/bike-bookings/${booking.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.error || 'Failed to accept booking');
      (error as any).status = response.status;
      throw error;
    }

    // Refresh booking data
    setBooking((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : prev));
    setAcceptModalOpen(false);
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/otp`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate OTP');
      }

      setOtpSent(true);
      setOtpSuccess('OTP sent to customer successfully!');
      // In development, we get the OTP in response
      if (data.otp) {
        setGeneratedOtp(data.otp);
      }
      // Update booking status
      setBooking((prev) => (prev ? { ...prev, status: 'READY_FOR_PICKUP' } : prev));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to generate OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and start trip
  const handleStartTrip = async () => {
    if (!booking || !otpInput) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput, action: 'start' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setOtpSuccess('Trip started successfully!');
      setBooking((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : prev));
      setOtpInput('');
      setGeneratedOtp(null);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // End trip
  const handleEndTrip = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      // For now, we'll end trip without OTP (can add OTP later if needed)
      const response = await fetch(`/api/vendor/bike-bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete trip');
      }

      setOtpSuccess('Trip completed successfully!');
      setBooking((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to complete trip');
    } finally {
      setOtpLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The booking you are looking for does not exist.'}</p>
        <Button onClick={() => router.push('/vendor/bike-rentals/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
  const StatusIcon = statusConfig.icon;
  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;

  return (
    <div className="space-y-6">
      {/* Accept Booking Modal */}
      <AcceptBookingModal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        booking={booking ? {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          vehicleName: booking.requestedVehicleName,
          locationId: (booking as any).locationId || '',
          locationName: booking.locationName,
          pickupDate: booking.pickupDate,
          pickupTime: booking.pickupTime,
          dropDate: booking.dropDate,
          dropTime: booking.dropTime,
          totalDays: booking.totalDays,
          dailyRate: booking.dailyRate,
          totalAmount: booking.totalAmount,
          grandTotal: booking.grandTotal,
          type: 'direct',
        } : null}
        vehicles={vendor_fleet}
        onAccept={handleAcceptBooking}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/bike-rentals/bookings"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking #{booking.bookingNumber}
            </h1>
            <p className="text-gray-600">
              Created on {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border',
              statusConfig.color
            )}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>

          {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED' || booking.status === 'PAYMENT_VERIFIED') && (
            <Button
              onClick={() => setAcceptModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Customer Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{booking.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${booking.customerEmail}`}
                    className="font-medium text-purple-600 hover:text-purple-700"
                  >
                    {booking.customerEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t flex gap-3">
              {vendorDbId && ['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
              )}
            </div>
          </div>

          {/* Vehicle & Trip Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-600" />
              Vehicle & Trip Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Bike className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {booking.requestedVehicleName}
                  </p>
                  {booking.requestedBrand && (
                    <p className="text-sm text-gray-500">{booking.requestedBrand}</p>
                  )}
                  {booking.requestedCategory && (
                    <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      {booking.requestedCategory}
                    </span>
                  )}
                </div>
              </div>

              {booking.acceptedVehicleName && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Assigned Vehicle:</strong> {booking.acceptedVehicleName}
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900">{booking.locationName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium mb-1">PICKUP</p>
                  <p className="font-bold text-gray-900">{formatDate(booking.pickupDate)}</p>
                  <p className="text-gray-600">{formatTime(booking.pickupTime)}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium mb-1">DROP-OFF</p>
                  <p className="font-bold text-gray-900">{formatDate(booking.dropDate)}</p>
                  <p className="text-gray-600">{formatTime(booking.dropTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Customer Notes
              </h2>
              <p className="text-gray-700 bg-orange-50 p-4 rounded-lg">
                {booking.customerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Payment Summary
            </h2>

            <div className={cn('px-3 py-2 rounded-lg text-sm font-medium mb-4', paymentConfig.color)}>
              {paymentConfig.label}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium">Rs. {booking.dailyRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Days</span>
                <span className="font-medium">{booking.totalDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rs. {booking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">Rs. {booking.securityDeposit}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="font-bold text-emerald-600 text-xl">
                    Rs. {booking.grandTotal}
                  </span>
                </div>
              </div>
            </div>

            {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED' || booking.status === 'PAYMENT_VERIFIED') && (
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => setAcceptModalOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Booking
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200">
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}
          </div>

          {/* Trip Control - OTP Section */}
          {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                Trip Control
              </h2>

              {/* Error/Success Messages */}
              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {otpError}
                </div>
              )}
              {otpSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {otpSuccess}
                </div>
              )}

              {/* For ACCEPTED/CONFIRMED - Generate OTP */}
              {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    When customer arrives for pickup, generate OTP to start the trip.
                  </p>
                  <Button
                    onClick={handleGenerateOtp}
                    disabled={otpLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Generate & Send OTP to Customer
                  </Button>
                </div>
              )}

              {/* For READY_FOR_PICKUP - Enter OTP */}
              {booking.status === 'READY_FOR_PICKUP' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">OTP sent to customer!</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Ask customer to check their booking page for OTP and tell you.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP from Customer
                    </label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    onClick={handleStartTrip}
                    disabled={otpLoading || otpInput.length !== 6}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Verify OTP & Start Trip
                  </Button>

                  <Button
                    onClick={handleGenerateOtp}
                    disabled={otpLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend OTP to Customer
                  </Button>
                </div>
              )}

              {/* For IN_PROGRESS - End Trip */}
              {booking.status === 'IN_PROGRESS' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700 font-medium">Trip is in progress</p>
                    <p className="text-xs text-purple-600 mt-1">
                      When customer returns the bike, click below to complete the trip.
                    </p>
                  </div>

                  <Button
                    onClick={handleEndTrip}
                    disabled={otpLoading}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    End Trip & Complete Booking
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Completed Status */}
          {booking.status === 'COMPLETED' && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 mt-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-800">Trip Completed!</h3>
              <p className="text-sm text-green-600 mt-1">
                This booking has been successfully completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && vendorDbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id}
              vendorId={vendorDbId}
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
