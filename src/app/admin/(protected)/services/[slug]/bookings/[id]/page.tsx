'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Car,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  MessageSquare,
  Download,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PackersRequestDetails from '@/components/packers/PackersRequestDetails';
import { formatShiftingScope } from '@/lib/packers-display';
import TruckRequestDetails from '@/components/truck/TruckRequestDetails';
import { formatTruckBodyType, formatTripDirection } from '@/lib/truck-display';

interface BookingDetails {
  id: string;
  bookingNo: string;
  type: 'QUOTE_REQUEST' | 'DIRECT_BOOKING';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customer?: any;
  vehicleName?: string;
  vehicle_model?: any;
  location?: any;
  locationName: string;
  pickupDate: string;
  dropDate?: string;
  status: string;
  paymentStatus?: string;
  grandTotal?: number;
  totalQuotesReceived?: number;
  [key: string]: any;
}

interface Quote {
  id: string;
  quoteNumber: string;
  vendor: any;
  vehicleName: string;
  dailyRate: number;
  grandTotal: number;
  status: string;
  validTill: string;
  [key: string]: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  PENDING_VENDOR: { label: 'Pending Vendor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  BROADCASTED: { label: 'Broadcasted', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  BOOKING_CONFIRMED: { label: 'Booking Confirmed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  REMAINING_PAID: { label: 'Remaining Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  READY_FOR_TRIP: { label: 'Ready for Trip', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  TRIP_READY: { label: 'Trip Ready', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  READY: { label: 'Ready', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  ONGOING: { label: 'Ongoing', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Car },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Car },
  TRIP_STARTED: { label: 'Trip Started', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Car },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
};

const defaultStatusConfig = { label: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle };

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  PARTIAL: { label: 'Partial', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
  COMPLETED: { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const defaultPaymentConfig = { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [service, setService] = useState<any>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [showForceVerifyModal, setShowForceVerifyModal] = useState(false);
  const [forceVerifyLoading, setForceVerifyLoading] = useState(false);
  const [forceVerifyNotes, setForceVerifyNotes] = useState('');
  const [forceVerifyError, setForceVerifyError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handleForceVerify = async () => {
    setForceVerifyLoading(true);
    setForceVerifyError('');
    try {
      const res = await fetch(`/api/admin/services/${slug}/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_verify_payment', notes: forceVerifyNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForceVerifyModal(false);
        setForceVerifyNotes('');
        // Refresh booking
        const res2 = await fetch(`/api/admin/services/${slug}/bookings/${id}`);
        if (res2.ok) {
          const d = await res2.json();
          setBooking(d.booking);
          setQuotes(d.quotes || []);
        }
      } else {
        setForceVerifyError(data.error || 'Action failed');
      }
    } catch {
      setForceVerifyError('Something went wrong. Please try again.');
    } finally {
      setForceVerifyLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/vendor/call-log?bookingId=${id}`)
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setCallLogs(d.logs || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await fetch(`/api/admin/services/${slug}/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setService(data.service);
          setBooking(data.booking);
          setQuotes(data.quotes || []);
        } else {
          console.error('Failed to fetch booking details');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug && id) {
      fetchBookingDetails();
    }
  }, [slug, id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      // Hide elements that shouldn't be in PDF
      const elementsToHide = printRef.current.querySelectorAll('.no-print');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Capture the content
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore hidden elements
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Download PDF
      pdf.save(`booking-${booking?.bookingNo || 'details'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Link
          href={`/admin/services/${slug}/bookings`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Not Found</h3>
          <p className="text-gray-500">The booking you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[booking.status] || defaultStatusConfig;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = booking.paymentStatus ? (paymentStatusConfig[booking.paymentStatus] || defaultPaymentConfig) : null;

  return (
    <>
      <div className="space-y-6 pb-8" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}/bookings`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNo}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
            {paymentInfo && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${paymentInfo.color}`}>
                {paymentInfo.label}
              </span>
            )}
            {booking.source && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                booking.source === 'app'
                  ? 'bg-violet-100 text-violet-700 border-violet-200'
                  : 'bg-sky-100 text-sky-700 border-sky-200'
              }`}>
                {booking.source === 'app' ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <circle cx="12" cy="18" r="1" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                  </svg>
                )}
                via {booking.source === 'app' ? 'Mobile App' : 'Website'}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{service?.name}</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          {booking.status === 'PENDING_PAYMENT' && (
            <Button
              size="sm"
              onClick={() => { setShowForceVerifyModal(true); setForceVerifyError(''); }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Force Verify & Broadcast
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cancellation Details Banner */}
      {['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(booking.status) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">Booking Cancelled</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {booking.cancelledBy && (
                  <div>
                    <p className="text-red-600 font-medium">Cancelled By</p>
                    <p className="text-red-900 capitalize">{booking.cancelledBy.toLowerCase()}</p>
                  </div>
                )}
                {booking.cancelledAt && (
                  <div>
                    <p className="text-red-600 font-medium">Cancelled On</p>
                    <p className="text-red-900">{formatDateTime(booking.cancelledAt)}</p>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div className="sm:col-span-3">
                    <p className="text-red-600 font-medium">Reason</p>
                    <p className="text-red-900">{booking.cancellationReason}</p>
                  </div>
                )}
                {booking.refundAmount > 0 && (
                  <div>
                    <p className="text-red-600 font-medium">Refund Amount</p>
                    <p className="text-red-900 font-semibold">₹{booking.refundAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {booking.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {booking.customerEmail}
                </p>
              </div>
              {booking.licenseNumber && (
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium text-gray-900">{booking.licenseNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Trip/Booking Details */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              {booking.type === 'QUOTE_REQUEST' ? 'Quote Request Details' : 'Booking Details'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Info */}
              {booking.vehicle_modelsName && (
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{booking.vehicle_modelsName}</p>
                  {booking.vehicleBrand && (
                    <p className="text-sm text-gray-600">{booking.vehicleBrand}</p>
                  )}
                </div>
              )}
              {booking.vehicleCategoryName && (
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{booking.vehicleCategoryName}</p>
                </div>
              )}
              {booking.carCategoryName && (
                <div>
                  <p className="text-sm text-gray-500">Car Type</p>
                  <p className="font-medium text-gray-900">{booking.carCategoryName}</p>
                </div>
              )}
              {booking.tripType && (
                <div>
                  <p className="text-sm text-gray-500">Trip Type</p>
                  <p className="font-medium text-gray-900">{booking.tripType.replace(/_/g, ' ')}</p>
                </div>
              )}

              {/* Location Info */}
              <div>
                <p className="text-sm text-gray-500">Pickup Location</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {booking.pickupCity || booking.locationName}
                </p>
                {booking.pickupAddress && (
                  <p className="text-sm text-gray-600 mt-1">{booking.pickupAddress}</p>
                )}
              </div>
              {booking.dropCity && (
                <div>
                  <p className="text-sm text-gray-500">Drop Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {booking.dropCity}
                  </p>
                  {booking.dropAddress && (
                    <p className="text-sm text-gray-600 mt-1">{booking.dropAddress}</p>
                  )}
                </div>
              )}

              {/* Date/Time Info */}
              <div>
                <p className="text-sm text-gray-500">Pickup Date & Time</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(booking.pickupDate)}
                  {booking.pickupTime && ` at ${booking.pickupTime}`}
                </p>
              </div>
              {booking.dropDate && (
                <div>
                  <p className="text-sm text-gray-500">Drop Date & Time</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(booking.dropDate)}
                    {booking.dropTime && ` at ${booking.dropTime}`}
                  </p>
                </div>
              )}
              {booking.totalDays && (
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{booking.totalDays} Days</p>
                </div>
              )}
              {booking.numberOfVehicles && booking.numberOfVehicles > 1 && (
                <div>
                  <p className="text-sm text-gray-500">
                    {(slug.includes('self-drive') || slug.includes('car')) && !slug.includes('bike') ? 'Number of Cars' : 'Number of Bikes'}
                  </p>
                  <p className="font-medium text-gray-900">{booking.numberOfVehicles}</p>
                </div>
              )}
              {booking.helmetsRequired ? (
                <div>
                  <p className="text-sm text-gray-500">Helmets Required</p>
                  <p className="font-medium text-gray-900">{booking.helmetsRequired}</p>
                </div>
              ) : null}

              {/* Specifications */}
              {booking.transmission && (
                <div>
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-medium text-gray-900">{booking.transmission}</p>
                </div>
              )}
              {booking.fuelType && (
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-medium text-gray-900">{booking.fuelType}</p>
                </div>
              )}
              {booking.minSeats && (
                <div>
                  <p className="text-sm text-gray-500">Min Seats</p>
                  <p className="font-medium text-gray-900">{booking.minSeats}</p>
                </div>
              )}

              {/* Budget (for quote requests) */}
              {booking.budgetMin && (
                <div>
                  <p className="text-sm text-gray-500">Budget Range</p>
                  <p className="font-medium text-gray-900">
                    ₹{booking.budgetMin.toLocaleString()} - ₹{booking.budgetMax?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {booking.customerNotes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Customer Notes</p>
                <p className="text-gray-900">{booking.customerNotes}</p>
              </div>
            )}

            {/* Packers-specific fields */}
            {(slug === 'packers-and-movers' || slug === 'packers-movers') && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Move Information</h3>
                  {booking.shiftingScope && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {formatShiftingScope(booking.shiftingScope)}
                    </span>
                  )}
                </div>
                <PackersRequestDetails data={booking as any} hidePropertyType />
              </div>
            )}

            {/* Truck-specific fields */}
            {(slug === 'truck-rental' || slug === 'truck-tempo-rental' || slug === 'transporter' || slug === 'truck-transport' || slug === 'mini-truck') && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Trip Information</h3>
                  <div className="flex gap-1.5">
                    {booking.truckBodyType && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {formatTruckBodyType(booking.truckBodyType)}
                      </span>
                    )}
                    {booking.tripDirection && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {formatTripDirection(booking.tripDirection)}
                      </span>
                    )}
                  </div>
                </div>
                <TruckRequestDetails data={booking as any} hideVehicle />
              </div>
            )}
          </div>

          {/* Vendor & Driver Info (if available) */}
          {((booking.vendor || booking.acceptedVendor) || booking.driverName) && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vendor & Driver Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(booking.vendor || booking.acceptedVendor) && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Vendor</p>
                      <p className="font-medium text-gray-900">{(booking.vendor || booking.acceptedVendor)?.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vendor Phone</p>
                      <p className="font-medium text-gray-900">{(booking.vendor || booking.acceptedVendor)?.phone}</p>
                    </div>
                    {(booking.vendor || booking.acceptedVendor)?.email && (
                      <div>
                        <p className="text-sm text-gray-500">Vendor Email</p>
                        <p className="font-medium text-gray-900">{(booking.vendor || booking.acceptedVendor)?.email}</p>
                      </div>
                    )}
                  </>
                )}
                {booking.driverName && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Driver Name</p>
                      <p className="font-medium text-gray-900">{booking.driverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Driver Phone</p>
                      <p className="font-medium text-gray-900">{booking.driverPhone}</p>
                    </div>
                  </>
                )}
                {booking.vehicleNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Number</p>
                    <p className="font-medium text-gray-900">{booking.vehicleNumber}</p>
                  </div>
                )}
                {booking.vehicle_models && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Model</p>
                    <p className="font-medium text-gray-900">{typeof booking.vehicle_models === 'string' ? booking.vehicle_models : booking.vehicle_models?.name || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quotes Section (for quote requests) */}
          {quotes.length > 0 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Received Quotes ({quotes.length})
              </h2>
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{quote.vendor?.businessName}</p>
                        <p className="text-sm text-gray-500 font-mono">{quote.quoteNumber}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[quote.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {quote.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Vehicle</p>
                        <p className="text-sm font-medium text-gray-900">{quote.vehicleName || 'N/A'}</p>
                      </div>
                      {quote.dailyRate && (
                        <div>
                          <p className="text-xs text-gray-500">Daily Rate</p>
                          <p className="text-sm font-medium text-gray-900">₹{quote.dailyRate.toLocaleString()}</p>
                        </div>
                      )}
                      {quote.baseAmount && (
                        <div>
                          <p className="text-xs text-gray-500">Base Amount</p>
                          <p className="text-sm font-medium text-gray-900">₹{quote.baseAmount.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-sm font-medium text-green-600">₹{quote.grandTotal?.toLocaleString() || 'N/A'}</p>
                      </div>
                      {quote.validTill && (
                        <div>
                          <p className="text-xs text-gray-500">Valid Till</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(quote.validTill)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowQuoteModal(true);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          {booking.grandTotal && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Pricing Details
              </h2>
              <div className="space-y-2.5">
                {/* Self-drive / car booking */}
                {booking.dailyRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Daily Rate{booking.totalDays ? ` × ${booking.totalDays} day${booking.totalDays > 1 ? 's' : ''}` : ''}
                    </span>
                    <span className="font-medium">
                      ₹{(booking.baseAmount || booking.dailyRate * (booking.totalDays || 1)).toLocaleString()}
                    </span>
                  </div>
                )}
                {/* Chauffeur base fare */}
                {booking.baseFare > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium">₹{booking.baseFare.toLocaleString()}</span>
                  </div>
                )}
                {/* Base amount fallback (bus/truck/packers etc.) */}
                {booking.baseAmount > 0 && !booking.dailyRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Amount</span>
                    <span className="font-medium">₹{booking.baseAmount.toLocaleString()}</span>
                  </div>
                )}
                {/* KM charges */}
                {booking.kmCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      KM Charges{booking.chargeableKm ? ` (${booking.chargeableKm} km)` : ''}
                    </span>
                    <span className="font-medium">₹{booking.kmCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.extraKmCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extra KM Charges</span>
                    <span className="font-medium">₹{booking.extraKmCharges.toLocaleString()}</span>
                  </div>
                )}
                {/* Delivery/Pickup (self-drive) */}
                {booking.deliveryCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="font-medium">₹{booking.deliveryCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.pickupCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pickup Charges</span>
                    <span className="font-medium">₹{booking.pickupCharges.toLocaleString()}</span>
                  </div>
                )}
                {/* Chauffeur extras */}
                {booking.driverBatta > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Driver Batta</span>
                    <span className="font-medium">₹{booking.driverBatta.toLocaleString()}</span>
                  </div>
                )}
                {booking.nightCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Night Charges</span>
                    <span className="font-medium">₹{booking.nightCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.waitingCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Waiting Charges</span>
                    <span className="font-medium">₹{booking.waitingCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.extraHourCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extra Hour Charges</span>
                    <span className="font-medium">₹{booking.extraHourCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.tollCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Toll Charges</span>
                    <span className="font-medium">₹{booking.tollCharges.toLocaleString()}</span>
                  </div>
                )}
                {booking.statePermitCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">State Permit</span>
                    <span className="font-medium">₹{booking.statePermitCharges.toLocaleString()}</span>
                  </div>
                )}
                {/* Security Deposit */}
                {booking.securityDeposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">₹{booking.securityDeposit.toLocaleString()}</span>
                  </div>
                )}
                {/* GST */}
                {booking.gstAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST</span>
                    <span className="font-medium">₹{booking.gstAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-3 mt-1 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="font-bold text-green-600 text-xl">₹{booking.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment breakdown */}
                {(booking.paidAmount > 0 || booking.advanceAmount > 0 || booking.remainingPayment > 0) && (
                  <div className="pt-2 mt-1 border-t border-dashed border-gray-200 space-y-2">
                    {booking.advanceAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Advance Paid</span>
                        <span className="font-medium text-green-600">₹{booking.advanceAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.paidAmount > 0 && !booking.advanceAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="font-medium text-green-600">₹{booking.paidAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.remainingPayment > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Remaining</span>
                        <span className="font-medium text-orange-600">₹{booking.remainingPayment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          {(booking.grandTotal || booking.advanceAmount || booking.paidAmount || booking.partialPayment) && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Payment Details
              </h2>
              <div className="space-y-4">

                {/* Advance / Partial Payment */}
                {(booking.advanceAmount > 0 || booking.partialPayment > 0) && (
                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-800">
                        Advance Paid
                        {booking.advancePercent ? ` (${booking.advancePercent}%)` : ''}
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        ₹{(booking.advanceAmount || booking.partialPayment).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-green-700">
                      {(booking.advancePaymentRef || booking.transactionId) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600">Ref:</span>
                          <span className="font-mono font-medium">{booking.advancePaymentRef || booking.transactionId}</span>
                        </div>
                      )}
                      {(booking.paymentMethod) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600">Method:</span>
                          <span className="font-medium capitalize">{booking.paymentMethod}</span>
                        </div>
                      )}
                      {booking.advancePaymentDate && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600">Date:</span>
                          <span>{formatDateTime(booking.advancePaymentDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        {booking.advancePaymentVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-200 text-green-800 font-medium text-xs">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium text-xs">
                            <Clock className="w-3 h-3" /> Verification Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {booking.advancePaymentProof && (
                      <a
                        href={booking.advancePaymentProof}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 underline hover:text-green-900"
                      >
                        <FileText className="w-3 h-3" /> View Payment Proof
                      </a>
                    )}
                  </div>
                )}

                {/* Remaining Payment */}
                {(booking.remainingPayment > 0 || booking.remainingPaymentRef) ? (
                  <div className={`rounded-xl border p-4 ${booking.remainingPaymentVerified ? 'border-green-100 bg-green-50' : 'border-orange-100 bg-orange-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${booking.remainingPaymentVerified ? 'text-green-800' : 'text-orange-800'}`}>
                        Remaining Payment
                      </span>
                      <span className={`text-lg font-bold ${booking.remainingPaymentVerified ? 'text-green-700' : 'text-orange-700'}`}>
                        ₹{(booking.remainingPayment || (booking.grandTotal - (booking.advanceAmount || booking.partialPayment || 0))).toLocaleString()}
                      </span>
                    </div>
                    {booking.remainingPaymentRef && (
                      <div className="space-y-1 text-xs text-orange-700">
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-600">Ref:</span>
                          <span className="font-mono font-medium">{booking.remainingPaymentRef}</span>
                        </div>
                        {booking.remainingPaymentDate && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-orange-600">Date:</span>
                            <span>{formatDateTime(booking.remainingPaymentDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          {booking.remainingPaymentVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-200 text-green-800 font-medium text-xs">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium text-xs">
                              <Clock className="w-3 h-3" /> Verification Pending
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {booking.remainingPaymentProof && (
                      <a
                        href={booking.remainingPaymentProof}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-orange-700 underline hover:text-orange-900"
                      >
                        <FileText className="w-3 h-3" /> View Payment Proof
                      </a>
                    )}
                  </div>
                ) : (
                  /* No remaining — show full paid */
                  booking.paidAmount > 0 && !booking.advanceAmount && !booking.partialPayment && (
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-green-800">Amount Paid</span>
                        <span className="text-lg font-bold text-green-700">₹{booking.paidAmount.toLocaleString()}</span>
                      </div>
                      {booking.paymentMethod && (
                        <p className="text-xs text-green-700 capitalize">via {booking.paymentMethod}</p>
                      )}
                      {booking.transactionId && (
                        <p className="text-xs text-green-700 font-mono mt-0.5">Txn: {booking.transactionId}</p>
                      )}
                    </div>
                  )
                )}

                {/* Summary bar */}
                {booking.grandTotal > 0 && (booking.advanceAmount > 0 || booking.partialPayment > 0) && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                      <span>Payment Progress</span>
                      <span className="font-medium text-gray-700">
                        ₹{(booking.advanceAmount || booking.partialPayment).toLocaleString()} / ₹{booking.grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(((booking.advanceAmount || booking.partialPayment) / booking.grandTotal) * 100))}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {Math.min(100, Math.round(((booking.advanceAmount || booking.partialPayment) / booking.grandTotal) * 100))}% paid
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Booking Created</p>
                  <p className="text-xs text-gray-500">{formatDateTime(booking.createdAt)}</p>
                </div>
              </div>
              {booking.acceptedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Accepted</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.acceptedAt)}</p>
                  </div>
                </div>
              )}
              {booking.tripStartedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Trip Started</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.tripStartedAt)}</p>
                  </div>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.completedAt)}</p>
                  </div>
                </div>
              )}
              {booking.cancelledAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cancelled</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.cancelledAt)}</p>
                    {booking.cancellationReason && (
                      <p className="text-xs text-gray-600 mt-1">{booking.cancellationReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Stats (for quote requests) */}
          {booking.type === 'QUOTE_REQUEST' && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quotes Received</span>
                  <span className="font-bold text-blue-600">{booking.totalQuotesReceived || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quotes Viewed</span>
                  <span className="font-medium">{booking.quotesViewed || 0}</span>
                </div>
                {booking.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires On</span>
                    <span className="font-medium text-red-600">{formatDate(booking.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Logs */}
      {callLogs.length > 0 && (
        <div className="bg-white rounded-xl p-6 border shadow-sm no-print">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            Vendor Call Logs
            <span className="ml-auto text-sm font-normal text-gray-500">{callLogs.length} call{callLogs.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600 rounded-l-lg">Vendor</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 rounded-r-lg">Source</th>
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

      {/* Force Verify Payment Modal */}
      {showForceVerifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Force Verify Payment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Use this only when Razorpay shows payment confirmed but booking is still showing Payment Pending.
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">
              This will mark the payment as <strong>PAID</strong> and immediately broadcast the booking to vendors.
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional — e.g. Razorpay transaction ID)
              </label>
              <input
                type="text"
                value={forceVerifyNotes}
                onChange={(e) => setForceVerifyNotes(e.target.value)}
                placeholder="e.g. pay_ABC123xyz"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {forceVerifyError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {forceVerifyError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForceVerifyModal(false); setForceVerifyNotes(''); setForceVerifyError(''); }}
                disabled={forceVerifyLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleForceVerify}
                disabled={forceVerifyLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {forceVerifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Broadcast'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedQuote.quoteNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedQuote(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Vendor Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="text-lg font-bold text-gray-900">{selectedQuote.vendor?.businessName || 'N/A'}</p>
                    {selectedQuote.vendor?.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {selectedQuote.vendor.phone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{selectedQuote.grandTotal?.toLocaleString() || 'N/A'}
                    </p>
                    {selectedQuote.validTill && (
                      <p className="text-xs text-gray-500 mt-1">
                        Valid till {formatDate(selectedQuote.validTill)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedQuote.vehicleName && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    Vehicle Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Vehicle</p>
                      <p className="font-medium text-gray-900">{selectedQuote.vehicleName}</p>
                    </div>
                    {selectedQuote.vehicleType && (
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium text-gray-900">{selectedQuote.vehicleType}</p>
                      </div>
                    )}
                    {selectedQuote.vehicleNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Vehicle Number</p>
                        <p className="font-medium text-gray-900 font-mono">{selectedQuote.vehicleNumber}</p>
                      </div>
                    )}
                    {selectedQuote.vehicleSeats && (
                      <div>
                        <p className="text-sm text-gray-500">Seats</p>
                        <p className="font-medium text-gray-900">{selectedQuote.vehicleSeats} seats</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-green-500" />
                  Pricing Breakdown
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedQuote.baseAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-medium">₹{selectedQuote.baseAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.dailyRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Rate</span>
                      <span className="font-medium">₹{selectedQuote.dailyRate.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.perKmRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Per KM Rate</span>
                      <span className="font-medium">₹{selectedQuote.perKmRate.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.driverAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver Allowance</span>
                      <span className="font-medium">₹{selectedQuote.driverAllowance.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.tollEstimate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toll Estimate</span>
                      <span className="font-medium">₹{selectedQuote.tollEstimate.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.permitCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Permit Charges</span>
                      <span className="font-medium">₹{selectedQuote.permitCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.parkingEstimate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parking Charges</span>
                      <span className="font-medium">₹{selectedQuote.parkingEstimate.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.nightHaltCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Night Halt Charges</span>
                      <span className="font-medium">₹{selectedQuote.nightHaltCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.chauffeurCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chauffeur Charges</span>
                      <span className="font-medium">₹{selectedQuote.chauffeurCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.deliveryCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="font-medium">₹{selectedQuote.deliveryCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.loadingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loading Charges</span>
                      <span className="font-medium">₹{selectedQuote.loadingCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.unloadingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unloading Charges</span>
                      <span className="font-medium">₹{selectedQuote.unloadingCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.packingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packing Charges</span>
                      <span className="font-medium">₹{selectedQuote.packingCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.transportCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport Charges</span>
                      <span className="font-medium">₹{selectedQuote.transportCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.unpackingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unpacking Charges</span>
                      <span className="font-medium">₹{selectedQuote.unpackingCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.storageCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Charges</span>
                      <span className="font-medium">₹{selectedQuote.storageCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.insuranceCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance Charges</span>
                      <span className="font-medium">₹{selectedQuote.insuranceCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.operatorCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operator Charges</span>
                      <span className="font-medium">₹{selectedQuote.operatorCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.installationCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Installation Charges</span>
                      <span className="font-medium">₹{selectedQuote.installationCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.decorationCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decoration Charges</span>
                      <span className="font-medium">₹{selectedQuote.decorationCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.securityDeposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-medium">₹{selectedQuote.securityDeposit.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.gstAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST</span>
                      <span className="font-medium">₹{selectedQuote.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedQuote.platformFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-medium">₹{selectedQuote.platformFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="font-bold text-xl text-green-600">
                      ₹{selectedQuote.grandTotal?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              {(selectedQuote.inclusions || selectedQuote.exclusions) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Inclusions */}
                  {selectedQuote.inclusions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Inclusions
                      </h3>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <ul className="space-y-1.5">
                          {(() => {
                            const inclusions = typeof selectedQuote.inclusions === 'string'
                              ? selectedQuote.inclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
                              : Array.isArray(selectedQuote.inclusions)
                              ? selectedQuote.inclusions
                              : [];

                            return inclusions.length > 0 ? (
                              inclusions.map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-green-600 mt-0.5">✓</span>
                                  {item}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-400">No inclusions specified</li>
                            );
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Exclusions */}
                  {selectedQuote.exclusions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        Exclusions
                      </h3>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <ul className="space-y-1.5">
                          {(() => {
                            const exclusions = typeof selectedQuote.exclusions === 'string'
                              ? selectedQuote.exclusions.split(',').map((s: string) => s.trim()).filter(Boolean)
                              : Array.isArray(selectedQuote.exclusions)
                              ? selectedQuote.exclusions
                              : [];

                            return exclusions.length > 0 ? (
                              exclusions.map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-red-600 mt-0.5">✗</span>
                                  {item}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-400">No exclusions specified</li>
                            );
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terms & Conditions */}
              {selectedQuote.termsConditions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Terms & Conditions
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <ol className="space-y-2">
                      {(() => {
                        const terms = typeof selectedQuote.termsConditions === 'string'
                          ? selectedQuote.termsConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
                          : Array.isArray(selectedQuote.termsConditions)
                          ? selectedQuote.termsConditions
                          : [];

                        return terms.length > 0 ? (
                          terms.map((term: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className="font-bold text-blue-600 mt-0.5">{idx + 1}.</span>
                              <span className="flex-1">{term}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-400">No terms & conditions specified</li>
                        );
                      })()}
                    </ol>
                  </div>
                </div>
              )}

              {/* Vendor Message */}
              {selectedQuote.vendorMessage && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Vendor Message
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="text-gray-700 text-sm">{selectedQuote.vendorMessage}</p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Quote Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border mt-1 ${
                    statusConfig[selectedQuote.status]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedQuote.status}
                  </span>
                </div>
                {selectedQuote.createdAt && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedQuote.createdAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedQuote(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
