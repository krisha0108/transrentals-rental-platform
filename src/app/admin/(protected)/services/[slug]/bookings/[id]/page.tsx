'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Package,
  FileText,
  Truck,
  Navigation,
  Fuel,
  Settings,
  Users,
  CreditCard,
  MessageSquare,
  Star,
  Download,
  Edit,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  ONGOING: { label: 'Ongoing', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Car },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Car },
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
    });
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
    <div className="space-y-6 pb-8">
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
          <div className="flex items-center gap-3">
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
          </div>
          <p className="text-gray-600 mt-1">{service?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
          </div>

          {/* Vendor & Driver Info (if available) */}
          {(booking.acceptedVendor || booking.driverName) && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vendor & Driver Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.acceptedVendor && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Vendor</p>
                      <p className="font-medium text-gray-900">{booking.acceptedVendor.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vendor Phone</p>
                      <p className="font-medium text-gray-900">{booking.acceptedVendor.phone}</p>
                    </div>
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
                    <p className="font-medium text-gray-900">{booking.vehicle_models}</p>
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
                      <Button size="sm" variant="outline">
                        <FileText className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      {quote.status === 'SENT' && (
                        <Button size="sm" variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept Quote
                        </Button>
                      )}
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
              <div className="space-y-3">
                {booking.baseAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount</span>
                    <span className="font-medium">₹{booking.baseAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.baseFare && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium">₹{booking.baseFare.toLocaleString()}</span>
                  </div>
                )}
                {booking.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST</span>
                    <span className="font-medium">₹{booking.gstAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.platformFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">₹{booking.platformFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Grand Total</span>
                    <span className="font-bold text-green-600 text-lg">₹{booking.grandTotal?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                {booking.paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Amount</span>
                    <span className="font-medium text-green-600">₹{booking.paidAmount.toLocaleString()}</span>
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
    </div>
  );
}
