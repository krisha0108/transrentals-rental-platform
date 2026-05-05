'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  Car,
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
  RefreshCw,
  User,
  Loader2,
  Fuel,
  Settings2,
  Gauge,
  Copy,
  Check,
  FileText,
  Shield,
  CreditCard,
  Download,
  Navigation,
  KeyRound,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { BookingPayment } from '@/components/payment/BookingPayment';
import InlineBookingChat from '@/components/customer/InlineBookingChat';
import CustomerHeader from '@/components/customer/CustomerHeader';

// Car booking status type
type CarBookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PENDING_VENDOR'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

// Mock single booking data
const MOCK_BOOKING = {
  id: '1',
  bookingNumber: 'CB-2024-089',
  vehicleName: 'Hyundai Creta',
  vehicleType: 'SUV',
  vehicleImage: '/images/fleet/creta.jpg',
  brand: 'Hyundai',
  transmission: 'Automatic',
  fuelType: 'Diesel',
  seats: 5,
  mileage: '21 km/l',
  features: ['AC', 'Panoramic Sunroof', 'ADAS', 'Ventilated Seats', 'Touchscreen'],
  vendorId: null as string | null,
  vendorName: 'CarZone Mumbai',
  vendorPhone: '+91 9737965551',
  vendorEmail: 'contact@carzonemumbai.com',
  vendorAddress: 'Shop 12, Andheri West, Mumbai - 400053',
  vendorRating: 4.8,
  location: 'Mumbai',
  locationSlug: 'mumbai',
  pickupAddress: 'Andheri West, Near Metro Station',
  pickupDate: '2024-12-15',
  pickupTime: '10:00',
  dropDate: '2024-12-18',
  dropTime: '18:00',
  totalDays: 3,
  dailyRate: 2199,
  baseAmount: 6597,
  gstAmount: 1187,
  platformFee: 99,
  grandTotal: 7883,
  advanceAmount: 2364,
  advancePercentage: 30,
  securityDeposit: 5000,
  kmLimitPerDay: 200,
  extraKmRate: 12,
  status: 'ACCEPTED' as CarBookingStatus,
  paymentStatus: 'PAID',
  paymentMethod: 'UPI',
  transactionId: 'TXN20241210143025',
  createdAt: '2024-12-10T14:30:00',
  acceptedAt: '2024-12-10T16:45:00',
  customerNotes: 'Need car with full tank please',
  timeline: [
    { event: 'Booking Created', time: '2024-12-10T14:30:00', status: 'completed' },
    { event: 'Payment Received', time: '2024-12-10T14:32:00', status: 'completed' },
    { event: 'Sent to Vendor', time: '2024-12-10T14:35:00', status: 'completed' },
    { event: 'Vendor Confirmed', time: '2024-12-10T16:45:00', status: 'completed' },
    { event: 'Pickup', time: '2024-12-15T10:00:00', status: 'pending' },
    { event: 'Return', time: '2024-12-18T18:00:00', status: 'pending' },
  ],
};

export default function CarBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, customer } = useCustomerAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState(MOCK_BOOKING);
  const [copied, setCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [tripOtp, setTripOtp] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatVendors, setChatVendors] = useState<Array<{
    id: number | string;
    name: string;
    company_name?: string;
    phone?: string;
    email?: string;
    image?: string;
    unread_count?: number;
    last_message?: string;
  }>>([]);
  const [customerId, setCustomerId] = useState<number | string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        // Fetch booking by booking number from URL
        const bookingNumber = params.id as string;
        const response = await fetch(`/api/bookings?number=${bookingNumber}`);
        const data = await response.json();

        if (data.success && data.booking) {
          // Transform API response to component format
          const apiBooking = data.booking;
          setBooking({
            ...MOCK_BOOKING,
            id: apiBooking.id,
            bookingNumber: apiBooking.bookingNumber,
            vehicleName: apiBooking.requestedVehicleName || 'Car',
            vehicleType: apiBooking.requestedCategory || 'Sedan',
            vehicleImage: apiBooking.vehicleImage || '/images/fleet/default-car.jpg',
            brand: apiBooking.requestedBrand || '',
            transmission: apiBooking.requestedTransmission || 'Manual',
            fuelType: apiBooking.requestedFuelType || 'Petrol',
            location: apiBooking.locationName || '',
            pickupAddress: apiBooking.pickupAddress || apiBooking.locationName || '',
            pickupDate: apiBooking.pickupDate?.split('T')[0] || '',
            pickupTime: apiBooking.pickupTime || '10:00',
            dropDate: apiBooking.dropDate?.split('T')[0] || '',
            dropTime: apiBooking.dropTime || '18:00',
            totalDays: apiBooking.totalDays || 1,
            dailyRate: apiBooking.dailyRate || 0,
            baseAmount: apiBooking.baseAmount || 0,
            gstAmount: apiBooking.gstAmount || 0,
            platformFee: apiBooking.platformFee || 99,
            grandTotal: apiBooking.grandTotal || 0,
            advanceAmount: apiBooking.advanceAmount || 0,
            advancePercentage: apiBooking.advancePercentage || 30,
            securityDeposit: apiBooking.securityDeposit || 5000,
            kmLimitPerDay: apiBooking.kmLimitPerDay || 200,
            extraKmRate: apiBooking.extraKmRate || 12,
            vendorId: apiBooking.vendorId || apiBooking.acceptedVendorId || apiBooking.assignedVendorId || null,
            vendorName: apiBooking.vendorName || null,
            vendorPhone: apiBooking.vendorPhone || null,
            status: (apiBooking.status || 'PENDING') as CarBookingStatus,
            paymentStatus: apiBooking.paymentStatus || 'PENDING',
            paymentMethod: apiBooking.paymentMethod || 'UPI',
            transactionId: apiBooking.advancePaymentRef || apiBooking.transactionId || '',
            createdAt: apiBooking.createdAt || new Date().toISOString(),
            customerNotes: apiBooking.customerNotes || '',
            timeline: [
              { event: 'Booking Created', time: apiBooking.createdAt || new Date().toISOString(), status: 'completed' },
            ],
          });

          // Set OTP if available (for READY_FOR_PICKUP status)
          if (apiBooking.tripStartOtp) {
            setTripOtp(apiBooking.tripStartOtp);
          }
        } else {
          // Booking not found
          setBooking(null as any);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setBooking(null as any);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [params.id]);

  // Load customer data and fetch vendors for chat
  useEffect(() => {
    // Get customer ID from localStorage
    const customerData = localStorage.getItem('customer');
    console.log('Chat: Customer data from localStorage', customerData);
    if (customerData) {
      try {
        const parsed = JSON.parse(customerData);
        // Keep ID as-is (can be string UUID or number)
        const id = parsed.id || null;
        console.log('Chat: Customer ID', id);
        if (id) {
          setCustomerId(id);
        }
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    } else {
      console.log('Chat: No customer data in localStorage - using guest ID');
      // Use guest ID for non-logged in users
      if (booking?.id) {
        setCustomerId(`guest-${booking.id}`);
      }
    }
  }, [booking?.id]);

  // Fetch vendors for chat when booking is loaded and confirmed
  useEffect(() => {
    async function fetchChatVendors() {
      console.log('Chat: fetchChatVendors called', {
        bookingId: booking?.id,
        customerId,
        status: booking?.status,
        vendorId: booking?.vendorId,
        vendorName: booking?.vendorName
      });

      if (!booking || !booking.id || !customerId) {
        console.log('Chat: Missing data', { bookingId: booking?.id, customerId });
        return;
      }

      // Only fetch vendors if booking is confirmed (has a vendor)
      const confirmedStatuses = ['ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'];
      if (!confirmedStatuses.includes(booking.status)) {
        console.log('Chat: Booking status not confirmed', booking.status);
        return;
      }

      try {
        const response = await fetch(
          `/api/customer/booking/${booking.id}/vendors?customer_id=${customerId}`
        );
        const data = await response.json();
        console.log('Chat: Vendors API response', data);

        if (data.success && data.vendors && data.vendors.length > 0) {
          setChatVendors(data.vendors);
        } else if (booking.vendorId && booking.vendorName) {
          // Fallback: Use vendor info from booking if available
          console.log('Chat: Using vendor from booking data', { vendorId: booking.vendorId, vendorName: booking.vendorName });
          setChatVendors([{
            id: typeof booking.vendorId === 'string' ? parseInt(booking.vendorId) || 0 : booking.vendorId,
            name: booking.vendorName,
            company_name: booking.vendorName,
            phone: booking.vendorPhone || undefined,
          }]);
        }
      } catch (error) {
        console.error('Error fetching chat vendors:', error);
        // Fallback: Use vendor info from booking
        if (booking.vendorId && booking.vendorName) {
          console.log('Chat: Using fallback vendor from booking data');
          setChatVendors([{
            id: typeof booking.vendorId === 'string' ? parseInt(booking.vendorId) || 0 : booking.vendorId,
            name: booking.vendorName,
            company_name: booking.vendorName,
            phone: booking.vendorPhone || undefined,
          }]);
        }
      }
    }

    fetchChatVendors();
  }, [booking, customerId]);


  const copyBookingNumber = () => {
    navigator.clipboard.writeText(booking.bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = (status: CarBookingStatus) => {
    const configs: Record<CarBookingStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
      PENDING: {
        label: 'Pending Confirmation',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: <Timer className="w-5 h-5" />,
      },
      PENDING_PAYMENT: {
        label: 'Payment Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <AlertCircle className="w-5 h-5" />,
      },
      PAYMENT_SUBMITTED: {
        label: 'Payment Under Review',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: <Timer className="w-5 h-5" />,
      },
      PENDING_VENDOR: {
        label: 'Awaiting Confirmation',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Timer className="w-5 h-5" />,
      },
      BROADCASTED: {
        label: 'Finding Vendor',
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        icon: <RefreshCw className="w-5 h-5" />,
      },
      ACCEPTED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-5 h-5" />,
      },
      READY_FOR_PICKUP: {
        label: 'Ready for Pickup',
        bg: 'bg-cyan-100',
        text: 'text-cyan-700',
        icon: <KeyRound className="w-5 h-5" />,
      },
      IN_PROGRESS: {
        label: 'In Progress',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: <Car className="w-5 h-5" />,
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <CheckCircle className="w-5 h-5" />,
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <XCircle className="w-5 h-5" />,
      },
      EXPIRED: {
        label: 'Expired',
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        icon: <Timer className="w-5 h-5" />,
      },
      REFUNDED: {
        label: 'Refunded',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <IndianRupee className="w-5 h-5" />,
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatRawTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleCancelBooking = () => {
    // API call to cancel
    console.log('Cancelling booking:', booking.id);
    setShowCancelModal(false);
    alert('Booking cancellation requested. Refund will be processed within 5-7 business days.');
  };

  const handleSubmitRating = () => {
    if (rating === 0) return;
    console.log('Submitting rating:', { bookingId: booking.id, rating, review });
    setShowRateModal(false);
    alert('Thank you for your feedback!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto" />
          <p className="text-indigo-200 mt-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a booking with number: <strong>{params.id}</strong>
          </p>
          <div className="space-y-3">
            <Link href="/self-drive-car-rentals">
              <Button className="w-full">Browse Self-Drive Cars</Button>
            </Link>
            <Link href="/customer/car-bookings">
              <Button variant="outline" className="w-full">View All Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const isActive = ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
  const canCancel = ['PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/customer/car-bookings" className="p-2 hover:bg-white/10 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-lg">Booking Details</h1>
                <p className="text-indigo-300 text-xs">#{booking.bookingNumber}</p>
              </div>
            </div>
            <button
              onClick={copyBookingNumber}
              className="p-2 hover:bg-white/10 rounded-lg transition flex items-center gap-2"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl py-6 space-y-6">
        {/* Status Banner */}
        <div
          className={cn(
            'rounded-2xl p-6 flex items-center gap-4',
            statusConfig.bg
          )}
        >
          <div className={cn('p-3 rounded-xl bg-white/50', statusConfig.text)}>
            {statusConfig.icon}
          </div>
          <div className="flex-1">
            <p className={cn('font-bold text-lg', statusConfig.text)}>
              {statusConfig.label}
            </p>
            {booking.status === 'ACCEPTED' && (
              <p className="text-sm text-gray-600 mt-1">
                Your car is ready for pickup on {formatDate(booking.pickupDate)}
              </p>
            )}
          </div>
        </div>

        {/* B2B Post-paid Banner */}
        {booking.isB2B && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-teal-800">B2B Corporate Booking</p>
              <p className="text-sm text-teal-600">No advance payment required. Post-trip billing.</p>
            </div>
          </div>
        )}

        {/* Payment Section - Show when PENDING_PAYMENT */}
        {(booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING') && !booking.isB2B && (
          <BookingPayment
            bookingId={booking.id}
            bookingType="self-drive"
            amount={booking.advanceAmount}
            bookingNumber={booking.bookingNumber}
            onSuccess={() => window.location.reload()}
          />
        )}

        {/* Payment Submitted Status */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Timer className="w-6 h-6 text-amber-600" />
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

        {/* OTP Section - Show when READY_FOR_PICKUP */}
        {booking.status === 'READY_FOR_PICKUP' && tripOtp && (
          <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-2xl p-6 border border-cyan-200 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Trip OTP</h3>
              <p className="text-gray-600 mb-4">
                Share this OTP with the vendor to start your trip
              </p>

              {/* OTP Display */}
              <div className="bg-white rounded-xl p-6 shadow-inner mb-4">
                <p className="text-4xl font-bold tracking-[0.5em] text-cyan-700 font-mono">
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
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
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
                  Enjoy your ride! Return the car before your drop-off time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guest Registration Prompt */}
        {!isAuthenticated && showRegisterPrompt && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 relative">
            <button
              onClick={() => setShowRegisterPrompt(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Create an Account</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Save this booking to your account and enjoy faster checkouts, booking history, and exclusive offers!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/customer/register?booking=${booking.bookingNumber}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
          <div className="relative h-48 bg-gray-100">
            <Image
              src={booking.vehicleImage}
              alt={booking.vehicleName}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm text-white/80">{booking.brand}</p>
              <h2 className="text-2xl font-bold">{booking.vehicleName}</h2>
              <p className="text-sm text-white/80">{booking.vehicleType}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                {booking.transmission}
              </span>
              <span className="flex items-center gap-1">
                <Fuel className="w-4 h-4 text-indigo-500" />
                {booking.fuelType}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-indigo-500" />
                {booking.seats} Seats
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="w-4 h-4 text-indigo-500" />
                {booking.mileage}
              </span>
            </div>
            {booking.features && (
              <div className="mt-4 flex flex-wrap gap-2">
                {booking.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Trip Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 mt-1.5 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(booking.pickupDate)} at {formatRawTime(booking.pickupTime)}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {booking.pickupAddress}
                </p>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-gray-200 ml-1.5 h-8" />
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 mt-1.5 bg-red-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Drop</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(booking.dropDate)} at {formatRawTime(booking.dropTime)}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {booking.pickupAddress}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Duration</p>
              <p className="font-bold text-gray-900">{booking.totalDays} Day(s)</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">KM Limit</p>
              <p className="font-bold text-gray-900">{booking.kmLimitPerDay * booking.totalDays} KM</p>
              <p className="text-xs text-gray-500">₹{booking.extraKmRate}/extra km</p>
            </div>
          </div>
        </div>

        {/* Vendor Details */}
        {booking.vendorName && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Vendor Details
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{booking.vendorName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-gray-600">{booking.vendorRating} Rating</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{booking.vendorAddress}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <a
                href={`tel:${booking.vendorPhone}`}
                className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">Call</span>
              </a>
              <a
                href={`https://wa.me/${booking.vendorPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">WhatsApp</span>
              </a>
              {/* Always show Chat button for confirmed bookings */}
              {['ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
                <button
                  onClick={() => {
                    if (!customerId) {
                      alert('Please login to chat with vendor');
                      return;
                    }
                    setShowChat(true);
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition relative"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Chat</span>
                  {chatVendors[0]?.unread_count && chatVendors[0].unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                      {chatVendors[0].unread_count}
                    </span>
                  )}
                </button>
              )}
            </div>
            {isActive && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.vendorAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition w-full"
              >
                <Navigation className="w-5 h-5" />
                <span className="font-medium">Get Directions</span>
              </a>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Payment Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">₹{booking.dailyRate} × {booking.totalDays} days</span>
              <span className="font-medium">₹{booking.baseAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Security Deposit (Refundable)</span>
              <span>₹{booking.securityDeposit.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl text-green-600">
                ₹{booking.baseAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Payment Method: {booking.paymentMethod}</span>
            <span>Txn: {booking.transactionId}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Booking Timeline
          </h3>
          <div className="space-y-4">
            {booking.timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-3 h-3 mt-1 rounded-full',
                    item.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      'font-medium',
                      item.status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {item.event}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.status === 'completed'
                      ? `${formatDate(item.time)} at ${formatTime(item.time)}`
                      : 'Pending'}
                  </p>
                </div>
                {item.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {booking.status === 'COMPLETED' && (
            <Button
              onClick={() => setShowRateModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6"
              size="lg"
            >
              <Star className="w-5 h-5 mr-2" />
              Rate Your Experience
            </Button>
          )}
          {canCancel && (
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 py-6"
              size="lg"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancel Booking
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full py-6"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Invoice
          </Button>
        </div>

        {/* Support */}
        <div className="bg-indigo-50 rounded-2xl p-6 text-center">
          <Shield className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our support team is available 24/7
          </p>
          <a
            href="tel:+919737965551"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            <Phone className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking?</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? Cancellation charges may apply based on
              our cancellation policy.
            </p>
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-700">
                <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before pickup.
                50% refund for cancellations within 24 hours.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Booking
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelBooking}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Your Experience</h2>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition',
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 hover:text-amber-200'
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Submit Rating
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button - Show for confirmed bookings with vendor */}
      {booking.vendorName && ['ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && !showChat && (
        <button
          onClick={() => {
            if (!customerId) {
              alert('Please login to chat with vendor');
              return;
            }
            setShowChat(true);
          }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
          {chatVendors[0]?.unread_count && chatVendors[0].unread_count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pulse">
              {chatVendors[0].unread_count}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel - Desktop */}
      {showChat && customerId && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-50 w-[400px]">
          <InlineBookingChat
            bookingId={booking.id as any}
            vendors={chatVendors.length > 0 ? chatVendors : [{
              id: booking.vendorId || 0,
              name: booking.vendorName || 'Vendor',
              company_name: booking.vendorName,
              phone: booking.vendorPhone,
            }] as any}
            customerId={customerId as any}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            selectedVendorId={chatVendors[0]?.id as any}
          />
        </div>
      )}

      {/* Chat Panel - Mobile */}
      {showChat && customerId && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full h-[85vh] bg-white rounded-t-3xl overflow-hidden">
            <InlineBookingChat
              bookingId={booking.id as any}
              vendors={chatVendors.length > 0 ? chatVendors : [{
                id: booking.vendorId || 0,
                name: booking.vendorName || 'Vendor',
                company_name: booking.vendorName,
                phone: booking.vendorPhone,
              }] as any}
              customerId={customerId as any}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              selectedVendorId={chatVendors[0]?.id as any}
            />
          </div>
        </div>
      )}
    </div>
  );
}
