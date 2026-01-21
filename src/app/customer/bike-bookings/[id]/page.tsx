'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  Bike,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Timer,
  AlertCircle,
  Phone,
  MessageCircle,
  IndianRupee,
  Star,
  User,
  Loader2,
  Shield,
  FileText,
  Download,
  Copy,
  Share2,
  Navigation,
  HelpCircle,
  KeyRound,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { useSocket } from '@/hooks/useSocket';
import { PaymentConfirmation } from '@/components/bike/PaymentConfirmation';
import { BikeBookingChat } from '@/components/bike/BikeBookingChat';

type BikeBookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PENDING_VENDOR'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

// Mock booking detail
const MOCK_BOOKING = {
  id: '1',
  bookingNumber: 'BK-2024-089',
  customerId: null as string | null,
  vehicleName: 'Honda Activa 6G',
  vehicleType: 'Scooter',
  vehicleImage: '/images/fleet/activa-6g.jpg',
  vehicleSpecs: {
    engine: '110cc',
    mileage: '50 km/l',
    transmission: 'Automatic',
    fuelType: 'Petrol',
  },
  vendorId: 'vendor-1',
  vendorName: 'Bike Zone Mumbai',
  vendorPhone: '+91 98765 43210',
  vendorRating: 4.8,
  vendorReviewCount: 156,
  vendorAddress: 'Shop 12, Colaba Causeway, Near Regal Cinema, Mumbai 400001',
  location: 'Mumbai',
  pickupAddress: 'Near Gateway of India, Colaba',
  pickupDate: '2024-12-15',
  pickupTime: '10:00',
  dropDate: '2024-12-17',
  dropTime: '18:00',
  totalDays: 3,
  dailyRate: 299,
  totalAmount: 897,
  gstAmount: 161,
  platformFee: 50,
  advanceAmount: 500,
  advancePercentage: 30,
  grandTotal: 1108,
  securityDeposit: 500,
  amountPaid: 1108,
  status: 'ACCEPTED' as BikeBookingStatus,
  paymentStatus: 'PAID',
  paymentMethod: 'UPI',
  transactionId: 'TXN123456789',
  createdAt: '2024-12-10T14:30:00',
  confirmedAt: '2024-12-10T16:45:00',
  helmetIncluded: true,
  extras: ['USB Charger', 'Phone Mount'],
  documents: {
    drivingLicense: true,
    aadharCard: true,
  },
  timeline: [
    { status: 'CREATED', timestamp: '2024-12-10T14:30:00', message: 'Booking request created' },
    { status: 'PAYMENT_COMPLETED', timestamp: '2024-12-10T14:32:00', message: 'Payment of ₹1,108 received' },
    { status: 'PENDING_VENDOR', timestamp: '2024-12-10T14:32:00', message: 'Sent to Bike Zone Mumbai' },
    { status: 'ACCEPTED', timestamp: '2024-12-10T16:45:00', message: 'Booking confirmed by vendor' },
  ],
  cancellationPolicy: 'Free cancellation up to 24 hours before pickup. 50% refund for cancellations within 24 hours.',
  termsAccepted: true,
};

export default function BikeBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, customer } = useCustomerAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<typeof MOCK_BOOKING | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
  const [tripOtp, setTripOtp] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);

  // Real-time socket connection for booking updates
  const { isConnected, joinBookingRoom, leaveBookingRoom, on, off } = useSocket();

  useEffect(() => {
    async function fetchBooking() {
      try {
        // Fetch booking - could be ID or booking number
        const idOrNumber = params.id as string;
        // If starts with 'BK-' it's a booking number, otherwise it's an ID
        const paramKey = idOrNumber.startsWith('BK-') ? 'number' : 'id';
        const response = await fetch(`/api/bookings?${paramKey}=${idOrNumber}`);
        const data = await response.json();

        if (data.success && data.booking) {
          // Transform API response to component format
          const apiBooking = data.booking;
          // Use API values directly for pricing
          const totalAmount = apiBooking.totalAmount || 0;
          const gstAmount = apiBooking.gstAmount || Math.round(totalAmount * 0.18);
          const platformFee = apiBooking.platformFee || 0;
          const grandTotal = apiBooking.grandTotal || (totalAmount + gstAmount + platformFee);
          const securityDeposit = apiBooking.securityDeposit || 500;

          setBooking({
            id: apiBooking.id,
            bookingNumber: apiBooking.bookingNumber,
            customerId: apiBooking.customerId || null,
            vehicleName: apiBooking.requestedVehicleName || 'Bike',
            vehicleType: apiBooking.requestedCategory || 'Scooter',
            vehicleImage: apiBooking.vehicleImage || '/images/fleet/default-bike.jpg',
            vehicleSpecs: {
              engine: '110cc',
              mileage: '50 km/l',
              transmission: 'Automatic',
              fuelType: 'Petrol',
            },
            vendorId: apiBooking.assignedVendorId || apiBooking.vendorId || null,
            vendorName: apiBooking.vendorName || null,
            vendorPhone: apiBooking.vendorPhone || null,
            vendorRating: 4.5,
            vendorReviewCount: 0,
            vendorAddress: apiBooking.vendorAddress || '',
            location: apiBooking.locationName || '',
            pickupAddress: apiBooking.locationName || '',
            pickupDate: apiBooking.pickupDate?.split('T')[0] || '',
            pickupTime: apiBooking.pickupTime || '10:00',
            dropDate: apiBooking.dropDate?.split('T')[0] || '',
            dropTime: apiBooking.dropTime || '18:00',
            totalDays: apiBooking.totalDays || 1,
            dailyRate: apiBooking.dailyRate || 0,
            totalAmount,
            gstAmount,
            platformFee,
            grandTotal,
            advanceAmount: apiBooking.advanceAmount || 0,
            advancePercentage: apiBooking.advancePercentage || 30,
            securityDeposit,
            amountPaid: apiBooking.paidAmount || apiBooking.amountPaid || 0,
            status: (apiBooking.status || 'PENDING') as BikeBookingStatus,
            paymentStatus: apiBooking.paymentStatus || 'PENDING',
            paymentMethod: apiBooking.paymentMethod || '',
            transactionId: apiBooking.transactionId || '',
            createdAt: apiBooking.createdAt || new Date().toISOString(),
            confirmedAt: apiBooking.confirmedAt || null,
            helmetIncluded: true,
            extras: [],
            documents: {
              drivingLicense: false,
              aadharCard: false,
            },
            timeline: [
              { status: 'CREATED', timestamp: apiBooking.createdAt || new Date().toISOString(), message: 'Booking request submitted' },
            ],
            cancellationPolicy: 'Free cancellation up to 24 hours before pickup.',
            termsAccepted: true,
          });

          // Set OTP if available (for READY_FOR_PICKUP status)
          if (apiBooking.tripStartOtp) {
            setTripOtp(apiBooking.tripStartOtp);
          }
        } else {
          // Booking not found - redirect to bookings list or show error
          setBooking(null);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setBooking(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [params.id]);

  // Real-time socket subscription for booking status updates
  useEffect(() => {
    if (!booking?.id || !isConnected) return;

    // Join the booking room to receive updates
    joinBookingRoom(booking.id);

    // Listen for booking accepted event
    const handleBookingAccepted = (data: any) => {
      if (data.bookingId === booking.id || data.bookingNumber === booking.bookingNumber) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'ACCEPTED' as BikeBookingStatus,
          vendorName: data.vendorName || prev.vendorName,
          vendorPhone: data.vendorPhone || prev.vendorPhone,
          confirmedAt: data.acceptedAt || new Date().toISOString(),
          timeline: [
            ...prev.timeline,
            {
              status: 'ACCEPTED',
              timestamp: data.acceptedAt || new Date().toISOString(),
              message: `Booking confirmed by ${data.vendorName || 'vendor'}`,
            },
          ],
        } : prev);
        setStatusUpdateMessage('Your booking has been accepted!');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Listen for booking cancelled event
    const handleBookingCancelled = (data: any) => {
      if (data.bookingId === booking.id) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'CANCELLED' as BikeBookingStatus,
          timeline: [
            ...prev.timeline,
            {
              status: 'CANCELLED',
              timestamp: new Date().toISOString(),
              message: data.reason || 'Booking was cancelled',
            },
          ],
        } : prev);
        setStatusUpdateMessage('Your booking has been cancelled.');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Listen for booking expired event
    const handleBookingExpired = (data: any) => {
      if (data.bookingId === booking.id) {
        setBooking((prev) => prev ? {
          ...prev,
          status: 'EXPIRED' as BikeBookingStatus,
        } : prev);
        setStatusUpdateMessage('Your booking has expired.');
        setTimeout(() => setStatusUpdateMessage(null), 5000);
      }
    };

    // Subscribe to events
    on('booking:accepted', handleBookingAccepted);
    on('booking:cancelled', handleBookingCancelled);
    on('booking:expired', handleBookingExpired);

    // Cleanup
    return () => {
      leaveBookingRoom(booking.id);
      off('booking:accepted', handleBookingAccepted);
      off('booking:cancelled', handleBookingCancelled);
      off('booking:expired', handleBookingExpired);
    };
  }, [booking?.id, booking?.bookingNumber, isConnected, joinBookingRoom, leaveBookingRoom, on, off]);

  const getStatusConfig = (status: BikeBookingStatus) => {
    const configs: Record<BikeBookingStatus, { label: string; bg: string; text: string; borderColor: string }> = {
      PENDING: {
        label: 'Pending Confirmation',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        borderColor: 'border-amber-200',
      },
      PENDING_PAYMENT: {
        label: 'Payment Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        borderColor: 'border-yellow-200',
      },
      PAYMENT_SUBMITTED: {
        label: 'Payment Under Review',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        borderColor: 'border-amber-200',
      },
      PAYMENT_VERIFIED: {
        label: 'Payment Verified',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      PENDING_VENDOR: {
        label: 'Awaiting Confirmation',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      BROADCASTED: {
        label: 'Finding Vendor',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        borderColor: 'border-purple-200',
      },
      ACCEPTED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-700',
        borderColor: 'border-green-200',
      },
      READY_FOR_PICKUP: {
        label: 'Ready for Pickup',
        bg: 'bg-cyan-100',
        text: 'text-cyan-700',
        borderColor: 'border-cyan-200',
      },
      IN_PROGRESS: {
        label: 'Ongoing',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        borderColor: 'border-emerald-200',
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        borderColor: 'border-red-200',
      },
      EXPIRED: {
        label: 'Expired',
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        borderColor: 'border-gray-200',
      },
      REFUNDED: {
        label: 'Refunded',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
    };
    return configs[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleCancelBooking = () => {
    // API call to cancel booking
    alert('Booking cancellation request submitted.');
    setShowCancelModal(false);
  };

  const handleSubmitRating = () => {
    // API call to submit rating
    alert('Thank you for your feedback!');
    setShowRatingModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a booking with number: <strong>{params.id}</strong>
          </p>
          <div className="space-y-3">
            <Link href="/bike-on-rent">
              <Button className="w-full">Browse Bikes</Button>
            </Link>
            <Link href="/customer/bike-bookings">
              <Button variant="outline" className="w-full">View All Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const isActive = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS'].includes(
    booking.status
  );
  const showPaymentConfirmation = booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/customer/bike-bookings" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Booking Details</h1>
                <p className="text-xs text-gray-500">#{booking.bookingNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(booking.bookingNumber)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Copy booking number"
              >
                <Copy className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Share">
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-4xl py-6 space-y-6">
        {/* Real-time Status Update Notification */}
        {statusUpdateMessage && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <p className="font-semibold">{statusUpdateMessage}</p>
            </div>
          </div>
        )}

        {/* Connection Status Indicator */}
        {isConnected && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates enabled</span>
          </div>
        )}

        {/* Status Banner */}
        <div
          className={cn(
            'rounded-2xl p-4 border',
            statusConfig.bg,
            statusConfig.borderColor
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className={cn('w-6 h-6', statusConfig.text)} />
              <div>
                <p className={cn('font-semibold', statusConfig.text)}>{statusConfig.label}</p>
                {booking.status === 'ACCEPTED' && (
                  <p className="text-sm text-gray-600">
                    Pickup on {formatDate(booking.pickupDate)} at {formatTime(booking.pickupTime)}
                  </p>
                )}
              </div>
            </div>
            {booking.status === 'ACCEPTED' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Navigation className="w-4 h-4 mr-2" />
                Directions
              </Button>
            )}
          </div>
        </div>

        {/* Payment Confirmation Section */}
        {showPaymentConfirmation && (
          <PaymentConfirmation
            bookingId={booking.id}
            bookingNumber={booking.bookingNumber}
            amount={booking.advanceAmount + booking.platformFee}
            serviceSlug="bike-rental"
            onPaymentConfirmed={() => {
              // Refresh booking to get updated status
              window.location.reload();
            }}
          />
        )}

        {/* OTP Section - Show when READY_FOR_PICKUP */}
        {booking.status === 'READY_FOR_PICKUP' && tripOtp && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Trip OTP</h3>
              <p className="text-gray-600 mb-4">
                Share this OTP with the vendor to start your trip
              </p>

              {/* OTP Display */}
              <div className="bg-white rounded-xl p-6 shadow-inner mb-4">
                <p className="text-4xl font-bold tracking-[0.5em] text-purple-700 font-mono">
                  {tripOtp}
                </p>
              </div>

              {/* Copy Button */}
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(tripOtp);
                  setOtpCopied(true);
                  setTimeout(() => setOtpCopied(false), 2000);
                }}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {otpCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy OTP
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                Do not share this OTP until you are at the pickup location and ready to start your trip.
              </p>
            </div>
          </div>
        )}

        {/* Trip In Progress */}
        {booking.status === 'IN_PROGRESS' && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <Play className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Trip In Progress</h3>
                <p className="text-emerald-600">
                  Enjoy your ride! Return the bike before your drop-off time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Submitted Status */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Payment Under Verification</h3>
                <p className="text-sm text-amber-700">
                  Your payment is being verified. This usually takes 15-30 minutes during business hours. You will receive a notification once verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guest Registration Prompt */}
        {!isAuthenticated && showRegisterPrompt && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100 relative">
            <button
              onClick={() => setShowRegisterPrompt(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Create an Account</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Save this booking to your account and enjoy faster checkouts, booking history, and exclusive offers!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/customer/register?booking=${booking.bookingNumber}`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      Create Account
                    </Button>
                  </Link>
                  <Link href="/customer/login">
                    <Button size="sm" variant="outline">
                      Already have an account? Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Vehicle Image */}
              <div className="relative w-full md:w-48 h-40 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={booking.vehicleImage}
                  alt={booking.vehicleName}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Vehicle Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{booking.vehicleName}</h2>
                    <p className="text-gray-500">{booking.vehicleType}</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Engine</p>
                    <p className="font-semibold text-gray-900">{booking.vehicleSpecs.engine}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Mileage</p>
                    <p className="font-semibold text-gray-900">{booking.vehicleSpecs.mileage}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Transmission</p>
                    <p className="font-semibold text-gray-900">{booking.vehicleSpecs.transmission}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Fuel</p>
                    <p className="font-semibold text-gray-900">{booking.vehicleSpecs.fuelType}</p>
                  </div>
                </div>

                {/* Extras */}
                {booking.extras.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.helmetIncluded && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        Helmet Included
                      </span>
                    )}
                    {booking.extras.map((extra) => (
                      <span
                        key={extra}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {extra}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium text-gray-900">{booking.pickupAddress}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(booking.pickupDate)} at {formatTime(booking.pickupTime)}
                </p>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-gray-200 ml-5 h-8"></div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Drop-off</p>
                <p className="font-medium text-gray-900">{booking.pickupAddress}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(booking.dropDate)} at {formatTime(booking.dropTime)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-purple-700 font-semibold">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</p>
          </div>
        </div>

        {/* Vendor Details */}
        {booking.vendorName && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Vendor Details</h3>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{booking.vendorName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-gray-900">{booking.vendorRating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{booking.vendorReviewCount} reviews</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{booking.vendorAddress}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`tel:${booking.vendorPhone}`}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
              <a
                href={`https://wa.me/${booking.vendorPhone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
              {customer && (
                <BikeBookingChat
                  bookingId={booking.id}
                  vendorId={booking.vendorId}
                  vendorName={booking.vendorName || 'Vendor'}
                  customerId={customer?.id?.toString() || booking.customerId || `guest-${booking.id}`}
                  customerName={customer?.name || 'Customer'}
                />
              )}
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Daily Rate × {booking.totalDays} days</span>
              <span>₹{booking.totalAmount}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-gray-900">₹{booking.totalAmount}</span>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg mt-2 space-y-2 border border-emerald-100">
              <div className="flex justify-between text-emerald-700 text-sm">
                <span>Advance Payment ({booking.advancePercentage}%)</span>
                <span>₹{booking.advanceAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-800 pt-2 border-t border-emerald-200 font-bold">
                <span>Payable Now</span>
                <span>₹{booking.advanceAmount}</span>
              </div>
            </div>

            <div className="flex justify-between text-gray-500 text-xs px-2">
              <span>Pay at Counter</span>
              <span>₹{booking.totalAmount - booking.advanceAmount}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-800">Security Deposit (Refundable)</span>
              </div>
              <span className="font-semibold text-amber-800">₹{booking.securityDeposit}</span>
            </div>
          </div>
          <div className="mt-4 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Payment Completed</span>
              </div>
              <span className="text-sm text-green-700">{booking.paymentMethod}</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Transaction ID: {booking.transactionId}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Timeline</h3>
          <div className="space-y-4">
            {booking.timeline.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  {index < booking.timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-green-200"></div>
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
          <p className="text-sm text-gray-600">{booking.cancellationPolicy}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {booking.status === 'COMPLETED' && (
            <Button
              onClick={() => setShowRatingModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6"
            >
              <Star className="w-5 h-5 mr-2" />
              Rate Your Experience
            </Button>
          )}
          {isActive && booking.status !== 'PENDING_PAYMENT' && (
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 py-6"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancel Booking
            </Button>
          )}
          <Link href="/customer/helpdesk" className="block">
            <Button variant="outline" className="w-full py-6">
              <HelpCircle className="w-5 h-5 mr-2" />
              Need Help? Contact Support
            </Button>
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking?</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm text-amber-700">
              <p>{booking.cancellationPolicy}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
                Keep Booking
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleCancelBooking}>
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Your Experience</h2>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star
                    className={cn(
                      'w-10 h-10 transition',
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
