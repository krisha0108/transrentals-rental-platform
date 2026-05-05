'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Car,
  Truck,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageCircle,
  IndianRupee,
  FileText,
  Shield,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  BadgePercent,
  Banknote,
  QrCode,
  Image as ImageIcon,
  X,
  Gift,
  Share2,
  Link2,
  ExternalLink,
} from 'lucide-react';
import InlineBookingChat from '@/components/customer/InlineBookingChat';

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  image?: string;
  rating?: number;
  total_reviews?: number;
}

interface BankDetails {
  id: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
}

interface Quotation {
  id: number;
  booking_id: number;
  vendor_id: number;
  vendor?: Vendor;
  bank?: BankDetails;
  price: number;
  min_price?: number;
  included?: string;
  not_included?: string;
  terms?: string;
  cancellation_policy?: string;
  additional_detail?: string;
  highlight?: string;
  service_name?: string;
  service_type?: string;
  service_images?: string[];
  bank_id?: number;
  bank_name?: string;
  upi_id?: string;
  account_number?: string;
  ifsc_code?: string;
  status: string | number;
  payment_status?: string;
  created_at: string;
}

interface AssignedVehicle {
  id: number;
  vehicle_name: string;
  vehicle_type: string;
  model: string;
  reg_no: string;
  image?: string;
}

interface AssignedDriver {
  id: number;
  name: string;
  phone: string;
  image?: string;
}

interface Booking {
  id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  status: string;
  created_at: string;
  bike_type?: string;
  bike_duration?: string;
  car_type?: string;
  trip_type?: string;
  total_passangers?: number;
  transmission?: string;
  fuel_type?: string;
  is_doorstep_delivery?: number;
  luxury_type?: string;
  package?: string;
  location_type?: string;
  truck_mode?: string;
  truck_type?: string;
  commercial_good_type?: string;
  personal_good_type?: string;
  weight?: string;
  weight_val?: string;
  shifting_type?: string;
  home_shifting?: string;
  other_info?: string;
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<AssignedVehicle | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<AssignedDriver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(0);

  // Customer state for chat
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  // Inline chat state
  const [showInlineChat, setShowInlineChat] = useState(false);
  const [selectedChatVendorId, setSelectedChatVendorId] = useState<number | null>(null);

  // Internal API URL for payment
  const PAYMENT_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use relative path as fallback
  const TRANSRENTALS_UPI = '9737965551@okbizaxis';

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    // Load customer data from localStorage
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        setCustomerId(customer.id);
        setCustomerName(customer.name || '');
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    }

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, router]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use local API route (Prisma/trans_cms database)
      const response = await fetch(`/api/customer/booking/${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the service-specific booking page
        if (data.redirectUrl) {
          router.replace(data.redirectUrl);
          return;
        }

        setBooking(data.booking);
        setQuotations(data.quotations || []);
        setAssignedVehicle(data.assigned_vehicle || null);
        setAssignedDriver(data.assigned_driver || null);
        if (data.quotations?.length === 1) {
          setExpandedQuote(data.quotations[0].id);
        }
      } else {
        setError(data.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
      setError('Failed to load booking details. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      open: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-700',
        icon: <Clock className="h-5 w-5" />,
        label: 'Waiting for Quotes',
      },
      confirmed: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-700',
        icon: <CheckCircle className="h-5 w-5" />,
        label: 'Confirmed',
      },
      ongoing: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-700',
        icon: <Car className="h-5 w-5" />,
        label: 'In Progress',
      },
      completed: {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-700',
        icon: <CheckCircle className="h-5 w-5" />,
        label: 'Completed',
      },
      dropped: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        icon: <XCircle className="h-5 w-5" />,
        label: 'Dropped',
      },
      cancelled: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        icon: <XCircle className="h-5 w-5" />,
        label: 'Cancelled',
      },
    };
    return configs[status.toLowerCase()] || configs.open;
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('bike')) return '🏍️';
    if (name.includes('car') || name.includes('taxi')) return '🚗';
    if (name.includes('bus')) return '🚌';
    if (name.includes('truck') || name.includes('transport')) return '🚛';
    if (name.includes('luxury')) return '🚙';
    if (name.includes('packer') || name.includes('mover')) return '📦';
    if (name.includes('equipment')) return '🏗️';
    return '🚗';
  };

  const copyBookingId = () => {
    navigator.clipboard.writeText(`TR${bookingId}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getBookingLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/customer/booking/${bookingId}`;
    }
    return `https://transrentals.in/customer/booking/${bookingId}`;
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(getBookingLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getRouteDescription = () => {
    if (!booking) return 'TransRentals';
    if (booking.destination && booking.destination !== booking.location_name) {
      return `${booking.location_name} → ${booking.destination}`;
    }
    return booking.location_name || 'TransRentals';
  };

  const buildShareMessage = (includeLink = false) => {
    const bookingLink = getBookingLink();
    let message = `Check out my ${booking?.service_name || 'vehicle'} booking on TransRentals!\n\nBooking ID: TR${bookingId}\nRoute: ${getRouteDescription()}`;
    if (includeLink) {
      message += `\n\nView Details: ${bookingLink}`;
    }
    return message;
  };

  const getEmailShareUrl = () => {
    const subject = encodeURIComponent(`TransRentals Booking - TR${bookingId}`);
    const body = encodeURIComponent(buildShareMessage(true));
    return `mailto:?subject=${subject}&body=${body}`;
  };

  const getGmailShareUrl = () => {
    const subject = encodeURIComponent(`TransRentals Booking - TR${bookingId}`);
    const body = encodeURIComponent(buildShareMessage(true));
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}&tf=1`;
  };

  const shareViaEmail = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.open(getGmailShareUrl(), '_blank', 'noopener,noreferrer');
  };

  const shareBookingLink = async () => {
    const bookingLink = getBookingLink();
    const shareText = buildShareMessage();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `TransRentals Booking - TR${bookingId}`,
          text: shareText,
          url: bookingLink,
        });
      } catch (err) {
        // User cancelled or error occurred
        copyBookingLink();
      }
    } else {
      copyBookingLink();
    }
  };

  const shareToWhatsApp = () => {
    const message = buildShareMessage(true);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getServiceDetails = () => {
    if (!booking) return [];
    const details: { label: string; value: string }[] = [];

    if (booking.trip_type) {
      const tripTypes: Record<string, string> = { '1': 'One Way', '2': 'Airport', '3': 'Round Trip' };
      details.push({ label: 'Trip Type', value: tripTypes[booking.trip_type] || booking.trip_type });
    }
    if (booking.car_type) {
      const carTypes: Record<string, string> = { '1': 'Hatchback', '2': 'Sedan', '3': 'MUV', '4': 'SUV', '5': 'Luxury' };
      details.push({ label: 'Car Type', value: carTypes[booking.car_type] || booking.car_type });
    }
    if (booking.total_passangers) {
      details.push({ label: 'Passengers', value: booking.total_passangers.toString() });
    }
    if (booking.bike_duration) {
      details.push({ label: 'Duration', value: `${booking.bike_duration} day(s)` });
    }
    if (booking.bike_type) {
      const bikeTypes: Record<string, string> = { '1': 'Scooter', '2': 'Bike (100-150cc)', '3': 'Bike (150-200cc)', '4': 'Sports Bike' };
      details.push({ label: 'Bike Type', value: bikeTypes[booking.bike_type] || booking.bike_type });
    }
    if (booking.luxury_type) {
      const luxuryTypes: Record<string, string> = { '1': 'Business', '2': 'Personal', '3': 'Wedding' };
      details.push({ label: 'Purpose', value: luxuryTypes[booking.luxury_type] || booking.luxury_type });
    }
    if (booking.package) {
      const packages: Record<string, string> = { '1': 'Local (8hrs/80km)', '2': 'Outstation' };
      details.push({ label: 'Package', value: packages[booking.package] || booking.package });
    }
    if (booking.location_type) {
      const locTypes: Record<string, string> = { '1': 'Outstation', '2': 'Local' };
      details.push({ label: 'Journey Type', value: locTypes[booking.location_type] || booking.location_type });
    }
    if (booking.truck_mode) {
      const truckModes: Record<string, string> = { '1': 'Personal', '2': 'Commercial' };
      details.push({ label: 'Mode', value: truckModes[booking.truck_mode] || booking.truck_mode });
    }
    if (booking.weight_val && booking.weight) {
      const weightUnits: Record<string, string> = { '1': 'KG', '2': 'TON' };
      details.push({ label: 'Weight', value: `${booking.weight_val} ${weightUnits[booking.weight] || ''}` });
    }
    if (booking.shifting_type) {
      details.push({ label: 'Shifting Type', value: booking.shifting_type });
    }
    if (booking.home_shifting) {
      details.push({ label: 'Home Size', value: booking.home_shifting.replace('_', ' ') });
    }
    if (booking.transmission) {
      const trans: Record<string, string> = { '1': 'Manual', '2': 'Automatic' };
      details.push({ label: 'Transmission', value: trans[booking.transmission] || booking.transmission });
    }
    if (booking.fuel_type) {
      const fuels: Record<string, string> = { '1': 'Petrol', '2': 'Diesel', '3': 'CNG', '4': 'Electric' };
      details.push({ label: 'Fuel Type', value: fuels[booking.fuel_type] || booking.fuel_type });
    }
    if (booking.is_doorstep_delivery === 1) {
      details.push({ label: 'Doorstep Delivery', value: 'Yes' });
    }

    return details;
  };

  const parseContent = (content: string | undefined | null): string[] => {
    if (!content) return [];

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'string');
      }
    } catch (e) {
      // Not JSON
    }

    return content
      .split(/[\n\r]+|,|•|·/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const isQuoteConfirmed = (quote: Quotation) => {
    return quote.status === 1 || quote.status === '1' || quote.payment_status === 'advance_done';
  };

  const hasAnyConfirmedQuote = () => {
    return quotations.some(q => isQuoteConfirmed(q));
  };

  const openPaymentModal = (quote: Quotation) => {
    setSelectedQuotation(quote);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedQuotation(null);
    if (paymentSuccess) {
      fetchBookingDetails(); // Refresh the page data
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedQuotation) return;

    setIsProcessingPayment(true);
    try {
      const paymentAmount = selectedQuotation.min_price || selectedQuotation.price;

      const response = await fetch(`${PAYMENT_API_URL}/web/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: selectedQuotation.id,
          payment_amount: paymentAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentSuccess(true);
        setRewardEarned(data.reward_earned || 0);
      } else {
        alert(data.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getQRCodeUrl = (amount: number) => {
    const upiUrl = `upi://pay?pa=${TRANSRENTALS_UPI}&pn=TransRentals&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  };

  // Open inline chat with specific vendor
  const openChatWithVendor = (vendorId: number) => {
    setSelectedChatVendorId(vendorId);
    setShowInlineChat(true);
  };

  // Get vendors from quotations for chat
  const chatVendors = quotations
    .filter((q) => q.vendor)
    .map((q) => ({
      id: q.vendor!.id,
      name: q.vendor!.name,
      company_name: q.vendor!.company_name,
      phone: q.vendor!.phone,
      email: q.vendor!.email,
      image: q.vendor!.image,
      rating: q.vendor!.rating,
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#09B368] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <>
        <CustomerHeader showBackButton backHref="/customer/dashboard" />
        <main className="min-h-screen bg-[#F8FAF9] pt-20 md:pt-24 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <AlertCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
              <p className="text-gray-500 mb-6">{error || 'The booking you are looking for does not exist.'}</p>
              <Link
                href="/customer/dashboard"
                className="inline-flex items-center gap-2 bg-[#09B368] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#078F53] transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const serviceDetails = getServiceDetails();
  const confirmedQuote = quotations.find(q => isQuoteConfirmed(q));

  return (
    <>
      <CustomerHeader
        showBackButton
        backHref="/customer/dashboard"
        title={`Booking #TR${bookingId}`}
      />

      <main className="min-h-screen bg-[#F8FAF9] pt-20 md:pt-24 pb-6 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div>
            {/* Main Content */}
            <div>

          {/* Booking Header Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className={`px-6 py-4 border-b-2 ${statusConfig.bg} ${statusConfig.text}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusConfig.icon}
                  <span className="font-semibold text-lg">{statusConfig.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-75">Booking ID:</span>
                  <button
                    onClick={copyBookingId}
                    className="flex items-center gap-1 font-mono font-bold hover:opacity-80 transition"
                  >
                    TR{bookingId}
                    {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">{getServiceIcon(booking.service_name)}</div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{booking.service_name}</h1>
                  <p className="text-gray-500">Booked on {formatDateTime(booking.created_at)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="w-0.5 h-12 bg-gray-300"></div>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            {booking.location_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Drop Location</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            {booking.destination || booking.location_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:border-l md:pl-6 md:ml-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Journey Date & Time</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {formatDate(booking.journey_datetime)}
                        </p>
                        <p className="text-gray-700 flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          {formatTime(booking.journey_datetime)}
                        </p>
                      </div>
                      {booking.return_datetime && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Return Date & Time</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.return_datetime)} at {formatTime(booking.return_datetime)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {serviceDetails.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {serviceDetails.map((detail, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{detail.label}</p>
                      <p className="font-semibold text-gray-900">{detail.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {booking.other_info && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Additional Notes</p>
                  <p className="text-yellow-900">{booking.other_info}</p>
                </div>
              )}

              {/* Share Booking Link Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                  <Share2 className="h-5 w-5 text-purple-600" />
                  Share Booking Details
                </div>

                {/* Booking Link Display */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-600 font-medium mb-1">Booking Link</p>
                      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-200">
                        <Link2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate font-mono">
                          {getBookingLink()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={copyBookingLink}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                          copiedLink
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                      <button
                        onClick={shareBookingLink}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Share Options */}
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-3">Quick Share</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={shareToWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </button>
                      <a
                        href={getEmailShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={shareViaEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                      <a
                        href={getBookingLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Link
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle & Driver Section */}
          {(assignedVehicle || assignedDriver) && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b bg-green-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  Assignment Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {assignedVehicle && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Car className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Assigned Vehicle</p>
                          <p className="font-bold text-gray-900 text-lg">
                            {assignedVehicle.vehicle_name || 'Vehicle Assigned'}
                          </p>
                          {assignedVehicle.model && (
                            <p className="text-gray-600">{assignedVehicle.model}</p>
                          )}
                        </div>
                      </div>
                      {assignedVehicle.reg_no && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Registration No.</span>
                            <span className="font-mono font-bold text-gray-900 bg-yellow-100 px-3 py-1 rounded">
                              {assignedVehicle.reg_no}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {assignedDriver && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                          {assignedDriver.image ? (
                            <img
                              src={assignedDriver.image}
                              alt={assignedDriver.name}
                              className="w-14 h-14 object-cover"
                            />
                          ) : (
                            <User className="h-7 w-7 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Assigned Driver</p>
                          <p className="font-bold text-gray-900 text-lg">{assignedDriver.name}</p>
                        </div>
                      </div>
                      {assignedDriver.phone && (
                        <div className="mt-4 pt-4 border-t">
                          <a
                            href={`tel:${assignedDriver.phone}`}
                            className="flex items-center justify-between text-green-600 hover:text-green-700"
                          >
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {assignedDriver.phone}
                            </span>
                            <span className="text-sm font-medium">Call Driver</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quotations Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                  Received Quotations
                </h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {quotations.length} {quotations.length === 1 ? 'Quote' : 'Quotes'}
                </span>
              </div>
            </div>

            {quotations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting for Quotes</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Vendors are reviewing your booking request. You'll receive quotations soon.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {quotations
                  .filter(q => !confirmedQuote || q.id === confirmedQuote.id) // Only show confirmed or all if none confirmed
                  .map((quote, index) => {
                  const isExpanded = expandedQuote === quote.id;
                  const quoteAmount = quote.price || 0;
                  const advanceAmount = quote.min_price || quoteAmount;
                  const includedItems = parseContent(quote.included);
                  const excludedItems = parseContent(quote.not_included);
                  const termsItems = parseContent(quote.terms);
                  const cancellationItems = parseContent(quote.cancellation_policy);
                  const serviceImages = Array.isArray(quote.service_images) ? quote.service_images : [];
                  const isConfirmed = isQuoteConfirmed(quote);
                  const hasBankDetails = quote.bank_name || quote.upi_id || quote.account_number || quote.bank?.bank_name;

                  return (
                    <div key={quote.id} className={`transition ${isExpanded ? 'bg-gray-50' : ''}`}>
                      <div
                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                              {quote.vendors?.name?.charAt(0) || quote.vendors?.company_name?.charAt(0) || 'V'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {quote.vendors?.company_name || quote.vendors?.name || `Vendor ${index + 1}`}
                                </h3>
                                {isConfirmed && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Confirmed
                                  </span>
                                )}
                              </div>
                              {quote.vendors?.rating && (
                                <div className="flex items-center gap-1 text-sm mb-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="font-medium">{quote.vendors.rating}</span>
                                  {quote.vendors.total_reviews && (
                                    <span className="text-gray-500">({quote.vendors.total_reviews} reviews)</span>
                                  )}
                                </div>
                              )}
                              <p className="text-gray-500 text-sm">
                                Quoted on {formatDateTime(quote.created_at)}
                              </p>
                              {quote.highlight && (
                                <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                                  <Sparkles className="h-4 w-4" />
                                  <span className="font-medium">{quote.highlight}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold text-green-600">
                              ₹{quoteAmount.toLocaleString('en-IN')}
                            </p>
                            {quote.min_price && quote.min_price !== quoteAmount && (
                              <p className="text-sm text-gray-500">
                                Advance: ₹{quote.min_price.toLocaleString('en-IN')}
                              </p>
                            )}
                            <button className="mt-2 text-gray-400 hover:text-gray-600">
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4">
                          {serviceImages.length > 0 && (
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                                <ImageIcon className="h-4 w-4" />
                                Service Images
                              </div>
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {serviceImages.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img.startsWith('http') ? img : `/storage/${img}`}
                                    alt={`Service ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition flex-shrink-0"
                                    onClick={() => setSelectedImage(img.startsWith('http') ? img : `/storage/${img}`)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {quote.additional_detail && (
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                                <FileText className="h-4 w-4" />
                                Description
                              </div>
                              <p className="text-gray-600 whitespace-pre-line">{quote.additional_detail}</p>
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4">
                            {includedItems.length > 0 && (
                              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                                  <CheckCircle className="h-5 w-5" />
                                  What's Included
                                </div>
                                <ul className="space-y-2">
                                  {includedItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {excludedItems.length > 0 && (
                              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                                  <XCircle className="h-5 w-5" />
                                  Not Included
                                </div>
                                <ul className="space-y-2">
                                  {excludedItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {termsItems.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-3">
                                <Shield className="h-5 w-5" />
                                Terms & Conditions
                              </div>
                              <ul className="space-y-2">
                                {termsItems.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                                    <span className="text-blue-500 font-medium">{idx + 1}.</span>
                                    <span className="text-sm">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {cancellationItems.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                              <div className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                                <AlertCircle className="h-5 w-5" />
                                Cancellation Policy
                              </div>
                              <ul className="space-y-2">
                                {cancellationItems.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                                    <span className="text-amber-500">•</span>
                                    <span className="text-sm">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {hasBankDetails && (
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-center gap-2 text-purple-700 font-semibold mb-4">
                                <Banknote className="h-5 w-5" />
                                Payment Details
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                {(quote.bank_name || quote.bank?.bank_name) && (
                                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Building2 className="h-5 w-5 text-purple-600" />
                                      <span className="font-medium text-gray-900">Bank Transfer</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Bank Name</span>
                                        <span className="font-medium text-gray-900">
                                          {quote.bank_name || quote.bank?.bank_name}
                                        </span>
                                      </div>
                                      {(quote.account_number || quote.bank?.account_number) && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-500">Account No.</span>
                                          <button
                                            onClick={() => copyToClipboard(quote.account_number || quote.bank?.account_number || '', 'account')}
                                            className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                                          >
                                            {quote.account_number || quote.bank?.account_number}
                                            {copiedText === 'account' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                          </button>
                                        </div>
                                      )}
                                      {(quote.ifsc_code || quote.bank?.ifsc_code) && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-500">IFSC Code</span>
                                          <button
                                            onClick={() => copyToClipboard(quote.ifsc_code || quote.bank?.ifsc_code || '', 'ifsc')}
                                            className="flex items-center gap-1 font-mono font-medium text-gray-900 hover:text-purple-600"
                                          >
                                            {quote.ifsc_code || quote.bank?.ifsc_code}
                                            {copiedText === 'ifsc' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {(quote.upi_id || quote.bank?.upi_id) && (
                                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-3">
                                      <QrCode className="h-5 w-5 text-purple-600" />
                                      <span className="font-medium text-gray-900">UPI Payment</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500 text-sm">UPI ID</span>
                                      <button
                                        onClick={() => copyToClipboard(quote.upi_id || quote.bank?.upi_id || '', 'upi')}
                                        className="flex items-center gap-1 font-mono font-medium text-purple-600 hover:text-purple-700"
                                      >
                                        {quote.upi_id || quote.bank?.upi_id}
                                        {copiedText === 'upi' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 pt-4 border-t">
                            {isConfirmed ? (
                              <div className="w-full bg-green-100 border border-green-300 rounded-xl p-4 text-center">
                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="font-semibold text-green-800">Booking Confirmed!</p>
                                <p className="text-green-700 text-sm">Advance payment has been received.</p>
                              </div>
                            ) : hasAnyConfirmedQuote() ? (
                              <div className="w-full bg-gray-100 border border-gray-300 rounded-xl p-4 text-center">
                                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                <p className="font-semibold text-gray-700">Another quote has been confirmed</p>
                              </div>
                            ) : (
                              <button
                                onClick={() => openPaymentModal(quote)}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#09B368] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#078F53] transition shadow-sm"
                              >
                                <CreditCard className="h-5 w-5" />
                                Pay ₹{advanceAmount.toLocaleString('en-IN')} & Confirm Booking
                              </button>
                            )}

                            {quote.vendor && (
                              <>
                                <button
                                  onClick={() => openChatWithVendor(quote.vendor!.id)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Chat
                                </button>
                                {quote.vendors.phone && (
                                  <>
                                    <a
                                      href={`tel:${quote.vendors.phone}`}
                                      className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-700 transition"
                                    >
                                      <Phone className="h-4 w-4" />
                                      Call
                                    </a>
                                    <a
                                      href={`https://wa.me/91${quote.vendors.phone.replace(/\D/g, '').slice(-10)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-emerald-600 transition"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      WhatsApp
                                    </a>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-[#09B368] rounded-2xl p-6 text-white relative overflow-hidden"><div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 0%, transparent 60%)'}} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Need Help?</h3>
                <p className="text-white/80">Our support team is available 24/7 to assist you.</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="tel:+919737965551"
                  className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition"
                >
                  <Phone className="h-4 w-4" />
                  Call Support
                </a>
                <a
                  href="https://wa.me/919737965551"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-white/30 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      {quotations.length > 0 && !showInlineChat && (
        <button
          onClick={() => setShowInlineChat(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:from-purple-700 hover:to-indigo-700 transition-all hover:scale-110 flex items-center justify-center group"
        >
          <MessageCircle className="h-7 w-7" />
          {/* Unread badge - show total unread from all vendors */}
          {chatVendors.some(v => (v as any).unread_count > 0) && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {chatVendors.reduce((sum, v) => sum + ((v as any).unread_count || 0), 0)}
            </span>
          )}
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Chat with Vendors
          </span>
        </button>
      )}

      {/* Inline Chat Panel - Desktop (Slide-in from right) */}
      {quotations.length > 0 && showInlineChat && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-50 w-[400px] animate-slide-up">
          <InlineBookingChat
            bookingId={parseInt(bookingId)}
            vendors={chatVendors}
            customerId={customerId || 0}
            isOpen={showInlineChat}
            onClose={() => {
              setShowInlineChat(false);
              setSelectedChatVendorId(null);
            }}
            selectedVendorId={selectedChatVendorId}
          />
        </div>
      )}

      {/* Mobile Chat Modal */}
      {showInlineChat && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full h-[85vh] bg-white rounded-t-3xl overflow-hidden animate-slide-up">
            <InlineBookingChat
              bookingId={parseInt(bookingId)}
              vendors={chatVendors}
              customerId={customerId || 0}
              isOpen={showInlineChat}
              onClose={() => {
                setShowInlineChat(false);
                setSelectedChatVendorId(null);
              }}
              selectedVendorId={selectedChatVendorId}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#09B368] p-4 relative">
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
                    <CreditCard className="h-8 w-8 text-green-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-10 text-center">
              {paymentSuccess ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                  <p className="text-gray-600 mb-4">Your booking has been confirmed.</p>

                  {rewardEarned > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-amber-700">
                        <Gift className="h-5 w-5" />
                        <span className="font-semibold">Reward Earned!</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600 mt-1">+{rewardEarned} Backr Tokens</p>
                      <p className="text-sm text-amber-600/80">10% cashback on your payment</p>
                    </div>
                  )}

                  <button
                    onClick={closePaymentModal}
                    className="w-full bg-[#09B368] text-white py-3 rounded-xl font-semibold hover:bg-[#078F53] transition"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Pay Advance to Confirm
                  </h2>
                  <p className="text-3xl font-bold text-green-600 mb-4">
                    ₹{(selectedQuotation.min_price || selectedQuotation.price).toLocaleString('en-IN')}
                  </p>

                  {/* QR Code */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3">Scan QR code to pay via UPI</p>
                    <img
                      src={getQRCodeUrl(selectedQuotation.min_price || selectedQuotation.price)}
                      alt="Payment QR Code"
                      className="mx-auto w-48 h-48 rounded-lg"
                    />
                  </div>

                  {/* UPI ID */}
                  <div className="bg-gray-100 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Or pay to UPI ID</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">{TRANSRENTALS_UPI}</span>
                      <button
                        onClick={() => copyToClipboard(TRANSRENTALS_UPI, 'modal-upi')}
                        className="text-green-600 hover:text-green-700"
                      >
                        {copiedText === 'modal-upi' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <Gift className="h-4 w-4" />
                      <span>Earn <strong>{Math.round((selectedQuotation.min_price || selectedQuotation.price) * 0.1)} Backr tokens</strong> (10% cashback)</span>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        I've Made the Payment - Confirm Booking
                      </>
                    )}
                  </button>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 mt-4">
                    By proceeding, you agree to our{' '}
                    <a href="/terms-and-conditions" target="_blank" className="text-green-600 underline">Terms</a>,{' '}
                    <a href="/privacy-policy" target="_blank" className="text-green-600 underline">Privacy Policy</a>, and{' '}
                    <a href="/cancellations-and-refund" target="_blank" className="text-green-600 underline">Refund Policy</a>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <XCircle className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Service"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

    </>
  );
}
