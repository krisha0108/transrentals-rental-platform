'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Plane,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface CarRentalBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategory: string;
  carCategoryName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupCity: string;
  dropCity?: string;
  pickupAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  grandTotal: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  acceptedVendorId?: string;
  isOwnBooking?: boolean;
  createdAt: string;
  location?: {
    id: string;
    name: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  color: string | null;
  isAvailable: boolean;
  isActive: boolean;
  vehicle_category?: {
    id: string;
    name: string;
    seatingCapacity?: number;
  } | null;
  brand?: {
    id: string;
    name: string;
  } | null;
  service: {
    slug: string;
  };
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  licenseExpired: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_VENDOR: { label: 'New Booking', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  BROADCASTED: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-indigo-100 text-indigo-700', icon: User },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRIP_TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  LOCAL: { label: 'Local', icon: Navigation },
  OUTSTATION_ONEWAY: { label: 'Outstation (One-way)', icon: MapPin },
  OUTSTATION_ROUNDTRIP: { label: 'Outstation (Round Trip)', icon: MapPin },
  AIRPORT_PICKUP: { label: 'Airport Pickup', icon: Plane },
  AIRPORT_DROP: { label: 'Airport Drop', icon: Plane },
};

export default function VendorCarRentalBookingsPage() {
  const [bookings, setBookings] = useState<CarRentalBooking[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripTypeFilter, setTripTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Assign driver modal state
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CarRentalBooking | null>(null);
  const [driverForm, setDriverForm] = useState({
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
    vehicle_models: '',
  });

  // Fleet vehicles and staff drivers
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [staffDrivers, setStaffDrivers] = useState<StaffDriver[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (tripTypeFilter !== 'all') params.set('tripType', tripTypeFilter);
      if (searchQuery) params.set('search', searchQuery);

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/car-rental/bookings?${params}`);
      const data = await response.json();

      console.log('API Response:', data);
      console.log('Debug Info:', data.debug);
      console.log('Bookings:', data.bookings?.map((b: any) => ({
        bookingNumber: b.bookingNumber,
        status: b.status,
        acceptedVendorId: b.acceptedVendorId,
        isOwnBooking: b.isOwnBooking,
      })));

      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFleetVehicles = async () => {
    try {
      const response = await fetch('/api/vendor/fleet');
      const data = await response.json();
      if (data.success) {
        const carRentalVehicles = (data.fleet || []).filter(
          (v: FleetVehicle) => {
            const svc = (v as any).services || v.service;
            return svc?.slug === 'car-rental' && v.isActive;
          }
        );
        setFleetVehicles(carRentalVehicles);
      }
    } catch (error) {
      console.error('Failed to fetch fleet vehicles:', error);
    }
  };

  const fetchStaffDrivers = async () => {
    try {
      const response = await fetch('/api/vendor/staff/drivers');
      const data = await response.json();
      if (data.success) {
        setStaffDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff drivers:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchFleetVehicles();
    fetchStaffDrivers();
  }, [statusFilter, tripTypeFilter, currentPage, dateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleAction = async (bookingNumber: string, action: string, extraData?: any) => {
    setActionLoading(bookingNumber);
    try {
      const response = await fetch(`/api/vendor/car-rental/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message for accept action
        if (action === 'accept') {
          alert('Booking accepted successfully! This booking is now assigned to you.');
        }
        // Refresh bookings
        fetchBookings();
        // Close modal if open
        setShowDriverModal(false);
        setSelectedBooking(null);
        setDriverForm({ driverName: '', driverPhone: '', vehicleNumber: '', vehicle_models: '' });
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const openAssignDriverModal = (booking: CarRentalBooking) => {
    setSelectedBooking(booking);
    setShowDriverModal(true);
    setSelectedVehicleId('');
    setSelectedDriverId('');
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    if (vehicleId === 'manual') {
      setDriverForm({ ...driverForm, vehicleNumber: '', vehicle_models: '' });
      return;
    }
    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const vehicle_model = vehicle.brand?.name
        ? `${vehicle.brand.name} ${vehicle.vehicle_category?.name || ''}`
        : vehicle.vehicle_category?.name || '';
      setDriverForm({
        ...driverForm,
        vehicleNumber: vehicle.registrationNumber || '',
        vehicle_models: vehicle_model.trim(),
      });
    }
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    if (driverId === 'manual') {
      setDriverForm({ ...driverForm, driverName: '', driverPhone: '' });
      return;
    }
    const driver = staffDrivers.find(d => d.id === driverId);
    if (driver) {
      setDriverForm({
        ...driverForm,
        driverName: driver.name,
        driverPhone: driver.phone,
      });
    }
  };

  const handleAssignDriver = () => {
    if (!selectedBooking) return;
    if (!driverForm.driverName || !driverForm.driverPhone || !driverForm.vehicleNumber) {
      alert('Please fill all required fields');
      return;
    }
    handleAction(selectedBooking.bookingNumber, 'assign_driver', driverForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Car Rental Bookings</h1>
          <p className="text-gray-600">Manage your car rental bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="my_bookings">My Bookings</option>
            <option value="available">Available Bookings</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={tripTypeFilter}
            onChange={(e) => setTripTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Trip Types</option>
            {Object.entries(TRIP_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <DateFilterDropdown
            onFilterChange={(start, end) => {
              setDateFilter({ start, end });
              setCurrentPage(1); // Reset to page 1 when filter changes
            }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />

          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search booking, customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-500">
              {statusFilter !== 'all' || tripTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'New car rental bookings will appear here'}
            </p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
            const tripConfig = TRIP_TYPE_CONFIG[booking.tripType] || TRIP_TYPE_CONFIG.LOCAL;
            const TripIcon = tripConfig.icon;
            const isActionLoading = actionLoading === booking.bookingNumber;

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 md:p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-500">
                          #{booking.bookingNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {/* Ownership Badge */}
                        {!booking.acceptedVendorId && ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-300">
                            Available
                          </span>
                        ) : booking.isOwnBooking ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                            Your Booking
                          </span>
                        ) : null}
                        {booking.paidAmount >= booking.grandTotal ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Fully Paid
                          </span>
                        ) : booking.paidAmount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Advance Paid (₹{booking.paidAmount.toLocaleString()})
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-semibold text-gray-900">{booking.carCategoryName}</h3>
                      {booking.location && (
                        <p className="text-xs text-gray-500">Location: {booking.location.name}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-600">
                        ₹{booking.grandTotal.toLocaleString()}
                      </p>
                      {booking.paidAmount > 0 && booking.paidAmount < booking.grandTotal ? (
                        <div className="text-xs space-y-0.5 mt-1">
                          <p className="text-emerald-600 font-medium">
                            Paid: ₹{booking.paidAmount.toLocaleString()}
                          </p>
                          <p className="text-amber-600 font-medium">
                            Balance: ₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                          <TripIcon className="w-3 h-3" />
                          {tripConfig.label}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Route</p>
                        <p className="text-sm font-medium">
                          {booking.dropCity
                            ? `${booking.pickupCity} → ${booking.dropCity}`
                            : booking.pickupCity}
                        </p>
                        {booking.pickupAddress && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {booking.pickupAddress}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm font-medium">
                          {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          at {booking.pickupTime}
                        </p>
                        {booking.localPackageHours && (
                          <p className="text-xs text-gray-400">
                            {booking.localPackageHours}hrs / {booking.localPackageKm}km
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium">{booking.customerName}</p>
                        <p className="text-xs text-gray-400">{booking.customerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a
                          href={`tel:${booking.customerPhone}`}
                          className="text-sm font-medium text-emerald-600 hover:underline"
                        >
                          {booking.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Driver Details (if assigned) */}
                  {booking.driverName && (
                    <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-emerald-700 font-medium mb-2">Driver Assigned</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {booking.driverPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {booking.vehicleNumber}
                        </span>
                        {booking.vehicle_models && (
                          <span className="text-gray-500">({booking.vehicle_models})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED') && (
                      <>
                        <button
                          onClick={() => handleAction(booking.bookingNumber, 'accept')}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isActionLoading ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for rejection:');
                            if (reason) handleAction(booking.bookingNumber, 'reject', { reason });
                          }}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <button
                        onClick={() => openAssignDriverModal(booking)}
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Assign Driver
                      </button>
                    )}
                    {booking.status === 'DRIVER_ASSIGNED' && (
                      <button
                        onClick={() => handleAction(booking.bookingNumber, 'start_trip')}
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isActionLoading ? 'Processing...' : 'Start Trip'}
                      </button>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleAction(booking.bookingNumber, 'complete_trip')}
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {isActionLoading ? 'Processing...' : 'Complete Trip'}
                      </button>
                    )}
                    <Link
                      href={`/vendor/car-rental/bookings/${booking.bookingNumber}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {bookings.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Assign Driver Modal */}
      {showDriverModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Driver & Vehicle</h3>
            <p className="text-sm text-gray-600 mb-4">
              Booking: #{selectedBooking.bookingNumber}
            </p>

            <div className="space-y-4">
              {/* Vehicle Selection from Fleet */}
              {fleetVehicles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vehicle from Fleet
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select a Vehicle --</option>
                    {fleetVehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                        disabled={!vehicle.isAvailable}
                      >
                        {vehicle.brand?.name} {vehicle.vehicle_category?.name}
                        {vehicle.registrationNumber ? ` - ${vehicle.registrationNumber}` : ''}
                        {vehicle.vehicle_category?.seatingCapacity ? ` (${vehicle.vehicle_category.seatingCapacity} Seater)` : ''}
                        {!vehicle.isAvailable ? ' (Unavailable)' : ''}
                      </option>
                    ))}
                    <option value="manual">-- Enter Manually --</option>
                  </select>
                </div>
              )}

              {fleetVehicles.length === 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    No fleet vehicles found. <a href="/vendor/fleet/add" className="underline font-medium">Add vehicles</a> to your car-rental fleet.
                  </p>
                </div>
              )}

              {/* Driver Selection from Staff */}
              {staffDrivers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Driver from Staff
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => handleDriverSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select a Driver --</option>
                    {staffDrivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                        disabled={!driver.isAvailable || driver.licenseExpired}
                      >
                        {driver.name} - {driver.phone}
                        {!driver.isAvailable ? ' (Unavailable)' : ''}
                        {driver.licenseExpired ? ' (License Expired)' : ''}
                      </option>
                    ))}
                    <option value="manual">-- Enter Manually --</option>
                  </select>
                </div>
              )}

              {staffDrivers.length === 0 && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-700">
                    No staff drivers found. <a href="/vendor/staff/add" className="underline font-medium">Add drivers</a> to your staff list.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    value={driverForm.driverName}
                    onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter driver name"
                    readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Phone *
                  </label>
                  <input
                    type="tel"
                    value={driverForm.driverPhone}
                    onChange={(e) => setDriverForm({ ...driverForm, driverPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter phone"
                    readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    value={driverForm.vehicleNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., DL 01 AB 1234"
                    readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={driverForm.vehicle_models}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_models: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Maruti Dzire"
                    readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDriverModal(false);
                  setSelectedBooking(null);
                  setDriverForm({ driverName: '', driverPhone: '', vehicleNumber: '', vehicle_models: '' });
                  setSelectedVehicleId('');
                  setSelectedDriverId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Assign Driver & Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
