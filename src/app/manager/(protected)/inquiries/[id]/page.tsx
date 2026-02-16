'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, User, Phone, Mail, FileText, Clock, Package, TruckIcon, Building } from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  status: string;
  serviceName: string;
  serviceSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationName: string;
  requestedVehicleName?: string;
  requestedCategory?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  dropTime?: string;
  totalDays?: number;
  pickupCity?: string;
  dropCity?: string;
  pickupAddress?: string;
  dropAddress?: string;
  fromCity?: string;
  toCity?: string;
  houseSize?: string;
  distance?: string;
  goodsType?: string;
  weight?: string;
  tripType?: string;
  customerNotes?: string;
  createdAt: string;
}

interface VendorQuote {
  id: string;
  quoteNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  vendorEmail: string;
  status: string;
  quotedAmount: number;
  dailyRate?: number;
  totalDays?: number;
  gstAmount?: number;
  securityDeposit?: number;
  grandTotal: number;
  vehicleName?: string;
  vehicleCategory?: string;
  vehicleNumber?: string;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [quotesCount, setQuotesCount] = useState(0);

  useEffect(() => {
    fetchInquiryDetails();
  }, [inquiryId]);

  const fetchInquiryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manager/inquiries/${inquiryId}`);
      const data = await response.json();

      if (data.success) {
        setRequest(data.request);
        setQuotes(data.quotes || []);
        setQuotesCount(data.quotesCount || 0);
      } else {
        // Check if this is a booking ID redirect case
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }
        console.error('Failed to fetch inquiry:', data.error);
      }
    } catch (error) {
      console.error('Error fetching inquiry details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      QUOTED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Quoted' },
      ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
      SENT: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Sent' },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
      DECLINED: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Declined' },
      EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Expired' },
    };
    return configs[status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: status };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Quote request not found</p>
        <button
          onClick={() => router.back()}
          className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(request.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Inquiries
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inquiry Details</h1>
              <p className="text-gray-600 mt-1">{request.requestNumber}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusConfig.bg}`}>
              <span className={`font-semibold ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service & Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-medium text-gray-900">{request.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {request.locationName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {request.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {request.customerPhone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {request.customerEmail || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trip/Rental Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.requestedVehicleName && (
                  <div>
                    <p className="text-sm text-gray-600">Requested Vehicle</p>
                    <p className="font-medium text-gray-900">{request.requestedVehicleName}</p>
                  </div>
                )}
                {request.requestedCategory && (
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{request.requestedCategory}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Pickup Date</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(request.pickupDate)}
                    {request.pickupTime && ` at ${request.pickupTime}`}
                  </p>
                </div>
                {request.dropDate && (
                  <div>
                    <p className="text-sm text-gray-600">Drop Date</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(request.dropDate)}
                      {request.dropTime && ` at ${request.dropTime}`}
                    </p>
                  </div>
                )}
                {request.totalDays && request.totalDays > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Total Days</p>
                    <p className="font-medium text-gray-900">{request.totalDays} days</p>
                  </div>
                )}
                {request.pickupCity && (
                  <div>
                    <p className="text-sm text-gray-600">Pickup City</p>
                    <p className="font-medium text-gray-900">{request.pickupCity}</p>
                  </div>
                )}
                {request.dropCity && (
                  <div>
                    <p className="text-sm text-gray-600">Drop City</p>
                    <p className="font-medium text-gray-900">{request.dropCity}</p>
                  </div>
                )}
                {request.fromCity && (
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-medium text-gray-900">{request.fromCity}</p>
                  </div>
                )}
                {request.toCity && (
                  <div>
                    <p className="text-sm text-gray-600">To</p>
                    <p className="font-medium text-gray-900">{request.toCity}</p>
                  </div>
                )}
                {request.tripType && (
                  <div>
                    <p className="text-sm text-gray-600">Trip Type</p>
                    <p className="font-medium text-gray-900">{request.tripType}</p>
                  </div>
                )}
                {request.houseSize && (
                  <div>
                    <p className="text-sm text-gray-600">House Size</p>
                    <p className="font-medium text-gray-900">{request.houseSize}</p>
                  </div>
                )}
                {request.distance && (
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-medium text-gray-900">{request.distance}</p>
                  </div>
                )}
                {request.goodsType && (
                  <div>
                    <p className="text-sm text-gray-600">Goods Type</p>
                    <p className="font-medium text-gray-900">{request.goodsType}</p>
                  </div>
                )}
                {request.weight && (
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium text-gray-900">{request.weight}</p>
                  </div>
                )}
              </div>

              {request.customerNotes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Customer Notes</p>
                  <p className="text-gray-900">{request.customerNotes}</p>
                </div>
              )}
            </div>

            {/* Vendor Quotes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Vendor Quotes</h2>
                <span className="text-sm text-gray-600">{quotesCount} quote(s)</span>
              </div>

              {quotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No quotes received yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => {
                    const quoteStatusConfig = getStatusConfig(quote.status);
                    return (
                      <div key={quote.id} className="border rounded-lg p-4 hover:border-orange-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              {quote.vendorName}
                            </h3>
                            {quote.quoteNumber && (
                              <p className="text-sm text-gray-500">{quote.quoteNumber}</p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm ${quoteStatusConfig.bg}`}>
                            <span className={`font-medium ${quoteStatusConfig.text}`}>
                              {quoteStatusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="font-semibold text-orange-600">{formatCurrency(quote.grandTotal)}</p>
                          </div>
                          {quote.dailyRate && (
                            <div>
                              <p className="text-xs text-gray-500">Daily Rate</p>
                              <p className="font-medium text-gray-900">{formatCurrency(quote.dailyRate)}</p>
                            </div>
                          )}
                          {quote.totalDays && (
                            <div>
                              <p className="text-xs text-gray-500">Days</p>
                              <p className="font-medium text-gray-900">{quote.totalDays}</p>
                            </div>
                          )}
                          {quote.securityDeposit && (
                            <div>
                              <p className="text-xs text-gray-500">Security Deposit</p>
                              <p className="font-medium text-gray-900">{formatCurrency(quote.securityDeposit)}</p>
                            </div>
                          )}
                        </div>

                        {(quote.vehicleName || quote.vehicleCategory || quote.vehicleNumber) && (
                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">Vehicle Details</p>
                            <div className="grid grid-cols-2 gap-2">
                              {quote.vehicleName && (
                                <p className="text-sm text-gray-900"><span className="text-gray-500">Name:</span> {quote.vehicleName}</p>
                              )}
                              {quote.vehicleCategory && (
                                <p className="text-sm text-gray-900"><span className="text-gray-500">Category:</span> {quote.vehicleCategory}</p>
                              )}
                              {quote.vehicleNumber && (
                                <p className="text-sm text-gray-900"><span className="text-gray-500">Number:</span> {quote.vehicleNumber}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {quote.vendorPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {quote.vendorEmail}
                          </span>
                        </div>

                        {quote.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-900">{quote.notes}</p>
                          </div>
                        )}

                        {quote.validUntil && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Valid until {formatDate(quote.validUntil)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Request ID</p>
                  <p className="font-mono text-xs text-gray-900 break-all">{request.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quotes</p>
                  <p className="font-medium text-gray-900">{quotesCount}</p>
                </div>
                {quotes.length > 0 && (
                  <>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">Quote Status Breakdown</p>
                      {Object.entries(
                        quotes.reduce((acc: Record<string, number>, quote) => {
                          acc[quote.status] = (acc[quote.status] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([status, count]) => {
                        const config = getStatusConfig(status);
                        return (
                          <div key={status} className="flex items-center justify-between py-1">
                            <span className={`text-sm ${config.text}`}>{config.label}</span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Lowest Quote</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(Math.min(...quotes.map(q => q.grandTotal)))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Highest Quote</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(Math.max(...quotes.map(q => q.grandTotal)))}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
