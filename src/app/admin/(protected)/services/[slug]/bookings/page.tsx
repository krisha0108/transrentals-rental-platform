'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  Download,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { FLOW_TYPE_CONFIG } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  bookingNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleName: string;
  services_vehicle_models_subServiceIdToservices: string;
  pickupLocation: string;
  dropLocation?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  createdAt: string;
  vehicleImage?: string;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PENDING_VENDOR: { label: 'Pending Vendor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  BROADCASTED: { label: 'Broadcasted', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: 'bg-blue-100 text-blue-800', icon: FileText },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  BOOKING_CONFIRMED: { label: 'Booking Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REMAINING_PAID: { label: 'Remaining Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  READY_FOR_TRIP: { label: 'Ready for Trip', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  TRIP_READY: { label: 'Trip Ready', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  READY: { label: 'Ready', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  ONGOING: { label: 'Ongoing', color: 'bg-purple-100 text-purple-800', icon: Car },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Car },
  TRIP_STARTED: { label: 'Trip Started', color: 'bg-purple-100 text-purple-800', icon: Car },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
};

// Default status config for unknown statuses
const defaultStatusConfig = { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  PARTIAL: { label: 'Partial', color: 'bg-orange-100 text-orange-700' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
};

// Default payment status config for unknown statuses
const defaultPaymentConfig = { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };

// Mock booking data
const mockBookings: Booking[] = [
  {
    id: '1',
    bookingNo: 'TR-2024-001234',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    customerEmail: 'rahul@example.com',
    vehicleName: 'Hyundai Creta',
    services_vehicle_models_subServiceIdToservices: 'SUV',
    pickupLocation: 'Mumbai Airport',
    dropLocation: 'Mumbai Airport',
    startDate: '2024-12-15',
    endDate: '2024-12-18',
    totalAmount: 10500,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    createdAt: '2024-12-10',
  },
  {
    id: '2',
    bookingNo: 'TR-2024-001235',
    customerName: 'Priya Patel',
    customerPhone: '+91 87654 32109',
    customerEmail: 'priya@example.com',
    vehicleName: 'Maruti Swift',
    services_vehicle_models_subServiceIdToservices: 'Hatchback',
    pickupLocation: 'Pune Station',
    startDate: '2024-12-14',
    endDate: '2024-12-16',
    totalAmount: 4500,
    status: 'ONGOING',
    paymentStatus: 'PAID',
    createdAt: '2024-12-08',
  },
  {
    id: '3',
    bookingNo: 'TR-2024-001236',
    customerName: 'Amit Kumar',
    customerPhone: '+91 76543 21098',
    customerEmail: 'amit@example.com',
    vehicleName: 'Honda City',
    services_vehicle_models_subServiceIdToservices: 'Sedan',
    pickupLocation: 'Delhi NCR',
    dropLocation: 'Agra',
    startDate: '2024-12-20',
    endDate: '2024-12-21',
    totalAmount: 6000,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    createdAt: '2024-12-12',
  },
  {
    id: '4',
    bookingNo: 'TR-2024-001230',
    customerName: 'Sneha Reddy',
    customerPhone: '+91 65432 10987',
    customerEmail: 'sneha@example.com',
    vehicleName: 'Toyota Innova',
    services_vehicle_models_subServiceIdToservices: 'MUV/MPV',
    pickupLocation: 'Bangalore',
    startDate: '2024-12-05',
    endDate: '2024-12-10',
    totalAmount: 22500,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    createdAt: '2024-12-01',
  },
  {
    id: '5',
    bookingNo: 'TR-2024-001228',
    customerName: 'Vikram Singh',
    customerPhone: '+91 54321 09876',
    customerEmail: 'vikram@example.com',
    vehicleName: 'Maruti Baleno',
    services_vehicle_models_subServiceIdToservices: 'Hatchback',
    pickupLocation: 'Jaipur',
    startDate: '2024-12-08',
    endDate: '2024-12-09',
    totalAmount: 1800,
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    createdAt: '2024-12-05',
  },
];

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  flowType?: string;
}

export default function ServiceBookingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    quotesReceived: 0,
    confirmed: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Fetch ALL stats once on mount (without filter)
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const res = await fetch(`/api/admin/services/${slug}/bookings?page=1&limit=1&status=ALL`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (slug) {
      fetchAllStats();
    }
  }, [slug]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          status: statusFilter,
        });
        const res = await fetch(`/api/admin/services/${slug}/bookings?${params}`);
        console.log('API Request:', `/api/admin/services/${slug}/bookings?${params}`);
        if (res.ok) {
          const data = await res.json();
          console.log('API Response:', {
            bookingsCount: data.bookings.length,
            statuses: data.bookings.map((b: any) => b.status),
            pagination: data.pagination
          });
          setBookings(data.bookings.map((b: any) => ({
            ...b,
            startDate: new Date(b.startDate).toISOString().split('T')[0],
            endDate: new Date(b.endDate).toISOString().split('T')[0],
            createdAt: new Date(b.createdAt).toISOString().split('T')[0],
          })));
          // Don't update stats - keep them fixed
          setPagination(data.pagination);
        } else {
          const errorData = await res.json();
          console.error('API Error:', res.status, errorData);
          // Show empty list instead of mock data
          setBookings([]);
          setStats({
            total: 0,
            pending: 0,
            quotesReceived: 0,
            confirmed: 0,
            ongoing: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setBookings([]);
        setStats({
          total: 0,
          pending: 0,
          quotesReceived: 0,
          confirmed: 0,
          ongoing: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBookings();
    }
  }, [slug, page, statusFilter, pagination.limit]);

  // Use bookings directly from API - filtering happens server-side
  const filteredBookings = search
    ? bookings.filter((booking) => {
        const matchesSearch =
          booking.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
          booking.customerName.toLowerCase().includes(search.toLowerCase()) ||
          booking.customerPhone.includes(search) ||
          booking.vehicleName.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      })
    : bookings;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Pending Quotes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Quotes Received</p>
          <p className="text-2xl font-bold text-blue-600">{stats.quotesReceived}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Advance Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.advancePaid || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{(stats.totalRevenue / 1000).toFixed(1)}K</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID, customer name, phone, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <optgroup label="Quote Stage">
                <option value="PENDING">Pending</option>
                <option value="PENDING_VENDOR">Pending Vendor</option>
                <option value="BROADCASTED">Broadcasted</option>
                <option value="QUOTES_RECEIVED">Quotes Received</option>
                <option value="QUOTE_ACCEPTED">Quote Accepted</option>
                <option value="ACCEPTED">Accepted</option>
              </optgroup>
              <optgroup label="Booking Stage">
                <option value="CONFIRMED">Confirmed</option>
                <option value="BOOKING_CONFIRMED">Booking Confirmed</option>
                <option value="ONGOING">Ongoing</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CalendarCheck className="w-12 h-12 mb-4" />
            <p className="font-medium">No bookings found</p>
            <p className="text-sm">Bookings for this service will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Booking</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vehicle</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Duration</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBookings.map((booking) => {
                  const statusInfo = statusConfig[booking.status] || defaultStatusConfig;
                  const StatusIcon = statusInfo.icon;
                  const paymentInfo = paymentStatusConfig[booking.paymentStatus] || defaultPaymentConfig;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 font-mono text-sm">{booking.bookingNo}</p>
                        <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
                            <img
                              src={booking.vehicleImage || '/images/fleet/default-car.jpg'}
                              alt={booking.vehicleName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/fleet/default-car.jpg';
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.vehicleName}</p>
                            <p className="text-sm text-gray-500">{booking.sub_service}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{formatDate(booking.startDate)}</p>
                        <p className="text-sm text-gray-500">to {formatDate(booking.endDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/services/${slug}/bookings/${booking.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Call Customer">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="More Actions">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
              </p>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination(prev => ({ ...prev, limit: Number(e.target.value) }));
                  setPage(1);
                }}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
