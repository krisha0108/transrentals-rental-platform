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
  Star,
  Truck,
  Navigation,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PackersRequestDetails from '@/components/packers/PackersRequestDetails';
import { formatShiftingScope } from '@/lib/packers-display';
import TruckRequestDetails from '@/components/truck/TruckRequestDetails';
import { formatTruckBodyType, formatTripDirection } from '@/lib/truck-display';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  serviceName: string;
  serviceSlug: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customer: { id: string; name: string; email: string; phone: string } | null;
  assignedVendor: { id: string; businessName: string; phone: string; email: string } | null;
  acceptedVendor: { id: string; businessName: string; phone: string; email: string } | null;
  [key: string]: any;
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
  const [callLogs, setCallLogs] = useState<any[]>([]);

  const bookingId = params.id as string;

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/vendor/call-log?bookingId=${bookingId}`)
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setCallLogs(d.logs || []))
      .catch(() => {});
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
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const currency = (val: any) => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    return num.toLocaleString('en-IN');
  };

  // Render a detail row only when the value exists
  const DetailRow = ({ label, value, className }: { label: string; value: any; className?: string }) => {
    if (value === null || value === undefined || value === '' || value === 0) return null;
    return (
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`font-medium ${className || ''}`}>{String(value)}</p>
      </div>
    );
  };

  // Render a currency row only when value > 0
  const ChargeRow = ({ label, value }: { label: string; value: any }) => {
    const formatted = currency(value);
    if (!formatted || Number(value) === 0) return null;
    return (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium flex items-center">
          <IndianRupee className="w-3 h-3" />
          {formatted}
        </span>
      </div>
    );
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
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Booking #{booking.bookingNumber}</h1>
            {booking.serviceName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {booking.serviceName}
              </span>
            )}
            {booking.tripType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {booking.tripType}
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Quote Request Notice */}
      {(booking as any).isQuoteRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-800">This is a Quote Request — no booking confirmed yet</p>
            <p className="text-sm text-amber-600">The customer has submitted a service request but has not accepted any quote.</p>
          </div>
        </div>
      )}

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Vehicle</p>
            <p className="font-medium">{booking.requestedVehicleName || 'Any'}</p>
          </div>
          {booking.requestedCategory && <DetailRow label="Category" value={booking.requestedCategory} />}
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              {booking.locationName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              {booking.pickupDate ? formatDate(booking.pickupDate) : 'N/A'}
              {booking.pickupTime ? ` at ${formatTime(booking.pickupTime)}` : ''}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Drop-off</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              {booking.dropDate ? `${formatDate(booking.dropDate)}${booking.dropTime ? ` at ${formatTime(booking.dropTime)}` : ''}` : 'N/A'}
            </p>
          </div>
          {booking.totalDays > 0 && <DetailRow label="Duration" value={`${booking.totalDays} Day${booking.totalDays > 1 ? 's' : ''}`} />}
          <DetailRow label="Trip Type" value={booking.tripType} />
          {booking.localPackageHours && <DetailRow label="Package" value={`${booking.localPackageHours}hrs / ${booking.localPackageKm || 0}km`} />}
          <DetailRow label="Total Hours" value={booking.totalHours} />
          <DetailRow label="Estimated Distance" value={booking.estimatedDistance ? `${booking.estimatedDistance} km` : null} />
          <DetailRow label="Transmission" value={booking.requestedTransmission} />
          <DetailRow label="Fuel Type" value={booking.requestedFuelType} />
          <DetailRow label="Seats" value={booking.requestedSeats} />
          {booking.numberOfVehicles && booking.numberOfVehicles > 1 && (
            <DetailRow
              label={booking.serviceSlug === 'self-drive' ? 'Number of Cars' : 'Number of Bikes'}
              value={booking.numberOfVehicles}
            />
          )}
          <DetailRow label="Helmets Required" value={booking.helmetsRequired} />
          <DetailRow label="Passengers" value={booking.passengers} />
          <DetailRow label="Goods Type" value={booking.goodsType} />
          <DetailRow label="Equipment Category" value={booking.equipmentCategory} />
          <DetailRow label="Event Type" value={booking.eventType} />
          <DetailRow label="Decoration" value={booking.decoration} />
        </div>
      </div>

      {/* Location Details */}
      {(booking.pickupAddress || booking.dropAddress || booking.pickupCity || booking.dropCity || booking.deliveryCity || booking.deliveryAddress || booking.airportName || booking.routeDetails || booking.venueName) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-gray-400" />
            Location Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <DetailRow label="Pickup City" value={booking.pickupCity} />
            <DetailRow label="Pickup Address" value={booking.pickupAddress} />
            <DetailRow label="Pickup Floor" value={booking.pickupFloor} />
            <DetailRow label="Drop City" value={booking.dropCity} />
            <DetailRow label="Drop Address" value={booking.dropAddress} />
            <DetailRow label="Drop Floor" value={booking.dropFloor} />
            <DetailRow label="Delivery City" value={booking.deliveryCity} />
            <DetailRow label="Delivery Address" value={booking.deliveryAddress} />
            <DetailRow label="Airport" value={booking.airportName} />
            <DetailRow label="Flight Number" value={booking.flightNumber} />
            <DetailRow label="Terminal" value={booking.terminalNumber} />
            <DetailRow label="Route Details" value={booking.routeDetails} />
            <DetailRow label="Venue" value={booking.venueName} />
          </div>
        </div>
      )}

      {/* Packers Move Information */}
      {(booking.serviceSlug === 'packers-and-movers' || booking.serviceSlug === 'packers-movers') && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-400" />
            Move Information
            {booking.shiftingScope && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                {formatShiftingScope(booking.shiftingScope)}
              </span>
            )}
          </h2>
          <PackersRequestDetails data={booking as any} hidePropertyType />
        </div>
      )}

      {/* Truck Trip Information */}
      {(booking.serviceSlug === 'truck-transport' || booking.serviceSlug === 'truck-rental' || booking.serviceSlug === 'truck-tempo-rental' || booking.serviceSlug === 'transporter' || booking.serviceSlug === 'mini-truck') && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-400" />
            Trip Information
            {booking.truckBodyType && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                {formatTruckBodyType(booking.truckBodyType)}
              </span>
            )}
            {booking.tripDirection && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-100">
                {formatTripDirection(booking.tripDirection)}
              </span>
            )}
          </h2>
          <TruckRequestDetails data={booking as any} hideVehicle />
        </div>
      )}

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
              <ChargeRow label={`Daily Rate${booking.totalDays ? ` x ${booking.totalDays} days` : ''}`} value={booking.dailyRate} />
              <ChargeRow label="Base Fare" value={booking.baseFare} />
              <ChargeRow label="Rental Amount" value={booking.totalAmount} />
              <ChargeRow label="KM Charges" value={booking.kmCharges} />
              <ChargeRow label="Per KM Rate" value={booking.perKmRate} />
              <ChargeRow label="Driver Batta" value={booking.driverBatta} />
              <ChargeRow label="Night Charges" value={booking.nightCharges} />
              <ChargeRow label="Waiting Charges" value={booking.waitingCharges} />
              <ChargeRow label="Extra Hour Charges" value={booking.extraHourCharges} />
              <ChargeRow label="Extra KM Charges" value={booking.extraKmCharges} />
              <ChargeRow label="Toll Charges" value={booking.tollCharges} />
              <ChargeRow label="State Permit Charges" value={booking.statePermitCharges} />
              <ChargeRow label="Packing Charges" value={booking.packingCharges} />
              <ChargeRow label="Loading Charges" value={booking.loadingCharges} />
              <ChargeRow label="Transport Charges" value={booking.transportCharges} />
              <ChargeRow label="Decoration Charges" value={booking.decorationCharges} />
              <ChargeRow label="Operator Charges" value={booking.operatorCharges} />
              <ChargeRow label="Delivery Charges" value={booking.deliveryCharges} />
              <ChargeRow label="Installation Charges" value={booking.installationCharges} />
              <ChargeRow label="Security Deposit" value={booking.securityDeposit} />
              <ChargeRow label="Platform Fee" value={booking.platformFee} />
              <ChargeRow label="GST" value={booking.gstAmount} />
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

      {/* Vendor & Driver Details */}
      {(booking.acceptedVendor || booking.assignedVendor || booking.driverName || booking.teamLeaderName || booking.operatorName) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-400" />
            Vendor & Driver Details
          </h2>
          <div className="space-y-4">
            {/* Vendor */}
            {(booking.acceptedVendor || booking.assignedVendor) && (() => {
              const v = booking.acceptedVendor || booking.assignedVendor;
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Vendor</p>
                    <p className="font-medium">{v?.businessName}</p>
                    <p className="text-sm text-gray-500">{v?.phone}</p>
                    <p className="text-sm text-gray-400">{v?.email}</p>
                  </div>
                  <a href={`tel:${v?.phone}`}>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </a>
                </div>
              );
            })()}

            {/* Driver */}
            {booking.driverName && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Driver</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <DetailRow label="Name" value={booking.driverName} />
                  {booking.driverPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${booking.driverPhone}`} className="font-medium text-blue-600">{booking.driverPhone}</a>
                    </div>
                  )}
                  <DetailRow label="Vehicle Number" value={booking.vehicleNumber} />
                  <DetailRow label="Vehicle Model" value={booking.vehicleModel} />
                  <DetailRow label="Vehicle Brand" value={booking.vehicleBrand} />
                  <DetailRow label="Vehicle Color" value={booking.vehicleColor} />
                </div>
              </div>
            )}

            {/* Team Leader (for packers, events) */}
            {booking.teamLeaderName && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Team Leader</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <DetailRow label="Name" value={booking.teamLeaderName} />
                  {booking.teamLeaderPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${booking.teamLeaderPhone}`} className="font-medium text-blue-600">{booking.teamLeaderPhone}</a>
                    </div>
                  )}
                  <DetailRow label="Team Size" value={booking.teamSize} />
                </div>
              </div>
            )}

            {/* Operator */}
            {booking.operatorName && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Operator</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <DetailRow label="Name" value={booking.operatorName} />
                  {booking.operatorPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${booking.operatorPhone}`} className="font-medium text-blue-600">{booking.operatorPhone}</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Actuals */}
      {(booking.actualKmTravelled || booking.actualHours || booking.odometerStart || booking.odometerEnd) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-gray-400" />
            Trip Actuals
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <DetailRow label="Actual KM Travelled" value={booking.actualKmTravelled ? `${booking.actualKmTravelled} km` : null} />
            <DetailRow label="Actual Hours" value={booking.actualHours} />
            <DetailRow label="Odometer Start" value={booking.odometerStart} />
            <DetailRow label="Odometer End" value={booking.odometerEnd} />
            <ChargeRow label="Actual Toll Charges" value={booking.actualTollCharges} />
            <ChargeRow label="Actual Parking Charges" value={booking.actualParkingCharges} />
            <DetailRow label="Fuel Level (start)" value={booking.fuelLevel} />
            <DetailRow label="Fuel Level (return)" value={booking.returnFuelLevel} />
          </div>
        </div>
      )}

      {/* Booking Timeline */}
      {(() => {
        const timelineEvents = [
          { label: 'Created', time: booking.createdAt },
          { label: 'Broadcasted', time: booking.broadcastedAt },
          { label: 'Accepted', time: booking.acceptedAt },
          { label: 'Driver Assigned', time: booking.driverAssignedAt },
          { label: 'Packing Started', time: booking.packingStartedAt },
          { label: 'Transit Started', time: booking.transitStartedAt },
          { label: 'Trip Started', time: booking.tripStartedAt || booking.pickedUpAt },
          { label: 'Trip Ended', time: booking.tripEndedAt || booking.returnedAt },
          { label: 'Completed', time: booking.completedAt },
          { label: 'Cancelled', time: booking.cancelledAt },
        ].filter(e => e.time);

        if (timelineEvents.length === 0) return null;

        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Booking Timeline
            </h2>
            <div className="space-y-3">
              {timelineEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.label === 'Cancelled' ? 'bg-red-100' :
                    event.label === 'Completed' ? 'bg-green-100' :
                    'bg-blue-100'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      event.label === 'Cancelled' ? 'bg-red-500' :
                      event.label === 'Completed' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{event.label}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Cancellation Details */}
      {booking.cancelledAt && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h2 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            Cancellation Details
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <DetailRow label="Cancelled At" value={formatDateTime(booking.cancelledAt)} />
            <DetailRow label="Cancelled By" value={booking.cancelledBy} />
            <DetailRow label="Reason" value={booking.cancellationReason} />
            {booking.refundAmount && <ChargeRow label="Refund Amount" value={booking.refundAmount} />}
          </div>
        </div>
      )}

      {/* Notes */}
      {(booking.customerNotes || booking.vendorNotes || booking.adminNotes) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            Notes
          </h2>
          <div className="space-y-3">
            {booking.customerNotes && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Customer Notes</p>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{booking.customerNotes}</pre>
              </div>
            )}
            {booking.vendorNotes && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-xs font-semibold text-green-700 mb-1">Vendor Notes</p>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{booking.vendorNotes}</pre>
              </div>
            )}
            {booking.adminNotes && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Admin Notes</p>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{booking.adminNotes}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating & Review */}
      {(booking.rating || booking.review || booking.driverRating || booking.driverReview) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-400" />
            Rating & Review
          </h2>
          <div className="space-y-4">
            {(booking.rating || booking.review) && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Service Rating</p>
                {booking.rating && (
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= booking.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-700">{booking.rating}/5</span>
                  </div>
                )}
                {booking.review && <p className="text-sm text-gray-600 mt-1">{booking.review}</p>}
              </div>
            )}
            {(booking.driverRating || booking.driverReview) && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver Rating</p>
                {booking.driverRating && (
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= booking.driverRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-700">{booking.driverRating}/5</span>
                  </div>
                )}
                {booking.driverReview && <p className="text-sm text-gray-600 mt-1">{booking.driverReview}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Logs */}
      {callLogs.length > 0 && (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            Vendor Call Logs
            <span className="ml-auto text-sm font-normal text-gray-500">{callLogs.length} call{callLogs.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Vendor</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {callLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">
                      {log.vendors?.businessName || log.vendors?.ownerName || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{log.bookingType}</td>
                    <td className="py-2.5 px-3 text-gray-600">{formatDateTime(log.clickedAt)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.source === 'app' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>{log.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
