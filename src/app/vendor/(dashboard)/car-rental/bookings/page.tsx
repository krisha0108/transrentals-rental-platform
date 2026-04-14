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
  intermediateStops?: Array<{ id: string; locationId: string; cityText: string }>;
  pickupAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  grandTotal: number;
  paidAmount: number;
  chargeableKm?: number;
  perKmRate?: number;
  kmCharges?: number;
  driverBatta?: number;
  totalDays?: number;
  status: string;
  paymentStatus: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  acceptedVendorId?: string;
  acceptedDriverId?: string;
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
  isAvailableForDates?: boolean;
  chauffeur_vehicle_categories?: {
    id: string;
    name: string;
    seatingCapacity?: number;
  } | null;
  brands?: {
    id: string;
    name: string;
  } | null;
  services: {
    slug: string;
  };
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  licenseExpired: boolean;
  isAvailableForDates?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_VENDOR: { label: 'New Booking', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  BROADCASTED: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', icon: AlertCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-emerald-100 text-emerald-700', icon: User },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-emerald-100 text-emerald-700', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
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
        // Filter out bookings accepted by a driver directly (not by this vendor)
        // acceptedDriverId being set means a driver self-accepted — not vendor's booking
        const filtered = (data.bookings || []).filter((b: any) =>
          !b.acceptedDriverId
        );
        setBookings(filtered);
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

  const fetchFleetVehicles = async (pickupDate?: string, returnDate?: string) => {
    try {
      let fleetUrl = '/api/vendor/fleet';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        const endDate = returnDate
          ? new Date(returnDate).toISOString()
          : startDate;
        fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const response = await fetch(fleetUrl);
      const data = await response.json();
      if (data.success) {
        const carRentalVehicles = (data.fleet || []).filter(
          (v: FleetVehicle) => {
            return v.services?.slug === 'car-rental' && v.isActive;
          }
        );
        // Sort: available vehicles first, unavailable (booked for dates) last
        carRentalVehicles.sort((a: FleetVehicle, b: FleetVehicle) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setFleetVehicles(carRentalVehicles);
      }
    } catch (error) {
      console.error('Failed to fetch fleet vehicles:', error);
    }
  };

  const fetchStaffDrivers = async (pickupDate?: string, returnDate?: string) => {
    try {
      let url = '/api/vendor/staff/drivers';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        const endDate = returnDate
          ? new Date(returnDate).toISOString()
          : startDate;
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const drivers: StaffDriver[] = data.drivers || [];
        // Sort: available drivers first, unavailable (assigned for dates) last
        drivers.sort((a, b) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setStaffDrivers(drivers);
      }
    } catch (error) {
      console.error('Failed to fetch staff drivers:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
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
    // Re-fetch fleet vehicles and staff drivers with booking dates for availability check
    fetchFleetVehicles(booking.pickupDate, booking.returnDate);
    fetchStaffDrivers(booking.pickupDate, booking.returnDate);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    if (vehicleId === 'manual') {
      setDriverForm({ ...driverForm, vehicleNumber: '', vehicle_models: '' });
      return;
    }
    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const vehicle_model = vehicle.brands?.name
        ? `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories?.name || ''}`
        : vehicle.chauffeur_vehicle_categories?.name || '';
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
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className={`h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl ${shimmer}`} />
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className={`w-9 h-9 bg-gray-100 rounded-xl ${shimmer}`} />
              <div className={`h-7 bg-gray-200 rounded-lg w-16 ${shimmer}`} />
              <div className={`h-3 bg-gray-100 rounded w-12 ${shimmer}`} />
            </div>
          ))}
        </div>
        {/* Filter skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="flex gap-3">
            <div className={`h-9 bg-gray-100 rounded-xl w-32 ${shimmer}`} />
            <div className={`h-9 bg-gray-100 rounded-xl w-32 ${shimmer}`} />
            <div className={`h-9 bg-gray-100 rounded-xl flex-1 ${shimmer}`} />
          </div>
        </div>
        {/* List skeleton */}
        <div className="space-y-2.5">
          {[1,2,3].map(i => {
            const borderColors = ['#10B981', '#F59E0B', '#10B981'];
            return (
              <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${borderColors[i-1]}` }}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 bg-gray-200 rounded-lg w-28 ${shimmer}`} />
                        <div className={`h-5 bg-gray-100 rounded-full w-20 ${shimmer}`} />
                      </div>
                      <div className="flex gap-3">
                        <div className={`h-3 bg-gray-100 rounded w-24 ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-28 ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-20 ${shimmer}`} />
                      </div>
                      <div className="flex gap-2">
                        <div className={`h-3 bg-gray-100 rounded w-44 ${shimmer}`} />
                        <div className={`h-3 bg-emerald-100 rounded w-10 ${shimmer}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="space-y-1.5 text-right">
                        <div className={`h-6 bg-gray-200 rounded-lg w-20 ml-auto ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-14 ml-auto ${shimmer}`} />
                      </div>
                      <div className={`w-8 h-8 bg-gray-100 rounded-lg ${shimmer}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 p-5 animate-slide-down">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Car Rental Bookings</h1>
              <p className="text-emerald-100 text-xs mt-0.5">Manage your car rental bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm border bg-white/15 text-white border-white/20">
              <TrendingUp className="w-3 h-3" />
              ₹{stats.totalEarnings.toLocaleString()} earned
            </div>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition border border-white/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {[
          { label: 'Total', value: stats.total, icon: <Calendar className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-gray-100 to-gray-50', iconColor: 'text-gray-500', border: 'border-gray-100', sub: 'all bookings' },
          { label: 'Pending', value: stats.pending, icon: <AlertCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50', iconColor: 'text-amber-500', border: 'border-amber-100', sub: 'awaiting action' },
          { label: 'Active', value: stats.active, icon: <Navigation className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-green-100 to-green-50', iconColor: 'text-green-500', border: 'border-green-100', sub: 'in progress' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'finished trips' },
          { label: 'Cancelled', value: stats.cancelled, icon: <XCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-red-100 to-red-50', iconColor: 'text-red-500', border: 'border-red-100', sub: 'dropped / cancelled' },
          { label: 'Earned', value: `₹${stats.totalEarnings.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'total earnings' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default group`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center ${s.iconColor} group-hover:scale-110 transition-transform`}>{s.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all"
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
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all"
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
              setCurrentPage(1);
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
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-2.5">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
              <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
              <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm">
                <Car className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <p className="text-gray-900 font-bold text-base">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">
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

            const statusBorder = booking.status === 'ACCEPTED' || booking.status === 'DRIVER_ASSIGNED' ? '#10B981'
              : booking.status === 'IN_PROGRESS' ? '#10B981'
              : booking.status === 'BROADCASTED' ? '#10B981'
              : booking.status === 'CANCELLED' || booking.status === 'DROPPED' ? '#EF4444'
              : booking.status === 'COMPLETED' ? '#6B7280'
              : '#F59E0B';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${statusBorder}` }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left content */}
                    <div className="flex-1 min-w-0">
                      {/* Booking number + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-bold text-gray-900">#{booking.bookingNumber}</span>
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {!booking.acceptedVendorId && ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Available
                          </span>
                        ) : booking.isOwnBooking ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Your Booking
                          </span>
                        ) : null}
                        {booking.paidAmount >= booking.grandTotal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                            Fully Paid
                          </span>
                        ) : booking.paidAmount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                            Advance Paid (₹{booking.paidAmount.toLocaleString()})
                          </span>
                        ) : null}
                      </div>

                      {/* Car category + customer + route info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Car className="w-3 h-3 text-gray-400" /> {booking.carCategoryName}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" /> {booking.customerName}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {booking.dropCity && booking.dropCity !== booking.pickupCity
                            ? `${booking.pickupCity} → ${booking.dropCity}`
                            : booking.pickupCity}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1">
                          <TripIcon className="w-3 h-3 text-gray-400" /> {tripConfig.label}
                        </span>
                      </div>

                      {/* Date info */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.pickupTime}
                        </span>
                        {booking.returnDate && (
                          <span className="font-semibold text-emerald-600">
                            → {new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {booking.localPackageHours && (
                          <span className="font-semibold text-emerald-600">({booking.localPackageHours}hrs / {booking.localPackageKm}km)</span>
                        )}
                        {booking.totalDays && booking.totalDays > 1 && (
                          <span className="font-semibold text-emerald-500">({booking.totalDays}d)</span>
                        )}
                      </div>

                      {/* Multi-stop route if applicable */}
                      {(() => {
                        const stops = booking.intermediateStops?.filter((s) => s.cityText) || [];
                        if (stops.length > 0) {
                          const allCities = [booking.pickupCity, ...stops.map((s) => s.cityText), booking.dropCity || booking.pickupCity];
                          return (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                              {allCities.map((city, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : i === allCities.length - 1 ? 'bg-red-500' : 'bg-emerald-400'}`} />
                                  <span className="text-gray-600 font-medium">{city}</span>
                                  {i < allCities.length - 1 && <span className="text-gray-300">→</span>}
                                </span>
                              ))}
                              <span className="text-emerald-600 font-semibold ml-1">{allCities.length - 1} legs</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Driver info if assigned */}
                      {booking.driverName && (
                        <div className="flex items-center gap-3 mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
                          <span className="flex items-center gap-1 font-medium"><User className="w-3 h-3" /> {booking.driverName}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {booking.driverPhone}</span>
                          <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {booking.vehicleNumber}</span>
                          {booking.vehicle_models && <span className="text-emerald-500">({booking.vehicle_models})</span>}
                        </div>
                      )}

                      {booking.status === 'DROPPED' && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span className="font-medium">Dropped</span>
                          {(booking as any).dropReason && <span>· {(booking as any).dropReason}</span>}
                        </div>
                      )}
                    </div>

                    {/* Right -- Price + Eye */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-gray-900">₹{booking.grandTotal.toLocaleString()}</p>
                        {booking.paidAmount > 0 && booking.paidAmount < booking.grandTotal ? (
                          <div className="text-[10px] space-y-0.5 mt-0.5">
                            <p className="text-emerald-600 font-semibold">Paid: ₹{booking.paidAmount.toLocaleString()}</p>
                            <p className="text-amber-600 font-semibold">Bal: ₹{(booking.grandTotal - booking.paidAmount).toLocaleString()}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 mt-0.5">{tripConfig.label}</p>
                        )}
                      </div>
                      <Link
                        href={`/vendor/car-rental/bookings/${booking.bookingNumber}`}
                        className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED' || booking.status === 'ACCEPTED' || booking.status === 'DRIVER_ASSIGNED' || booking.status === 'IN_PROGRESS') && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED') && (
                      <>
                        <button
                          onClick={() => handleAction(booking.bookingNumber, 'accept')}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-sm"
                        >
                          {isActionLoading ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for rejection:');
                            if (reason) handleAction(booking.bookingNumber, 'reject', { reason });
                          }}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all border border-red-100"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <button
                        onClick={() => openAssignDriverModal(booking)}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                      >
                        Assign Driver
                      </button>
                    )}
                    {booking.status === 'DRIVER_ASSIGNED' && (
                      <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-600 flex items-center gap-1.5">
                        <Car className="w-3 h-3" />
                        <span>Trip will be started by your assigned driver</span>
                      </div>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleAction(booking.bookingNumber, 'complete_trip')}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {isActionLoading ? 'Processing...' : 'Complete Trip'}
                      </button>
                    )}
                    <Link
                      href={`/vendor/car-rental/bookings/${booking.bookingNumber}`}
                      className="px-4 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 flex items-center gap-1 transition-all border border-gray-200"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </Link>
                  </div>
                )}
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
                    {fleetVehicles.map((vehicle) => {
                      const isBookedForDates = vehicle.isAvailableForDates === false;
                      return (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                          disabled={!vehicle.isAvailable || isBookedForDates}
                        >
                          {vehicle.brands?.name} {vehicle.chauffeur_vehicle_categories?.name}
                          {vehicle.registrationNumber ? ` - ${vehicle.registrationNumber}` : ''}
                          {vehicle.chauffeur_vehicle_categories?.seatingCapacity ? ` (${vehicle.chauffeur_vehicle_categories.seatingCapacity} Seater)` : ''}
                          {isBookedForDates ? ' — Booked for these dates' : !vehicle.isAvailable ? ' (Unavailable)' : ''}
                        </option>
                      );
                    })}
                    <option value="manual">-- Enter Manually --</option>
                  </select>
                </div>
              )}

              {fleetVehicles.length === 0 && (
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-sm text-emerald-700">
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
                    {staffDrivers.map((driver) => {
                      const isAssignedForDates = driver.isAvailableForDates === false;
                      return (
                        <option
                          key={driver.id}
                          value={driver.id}
                          disabled={!driver.isAvailable || driver.licenseExpired || isAssignedForDates}
                        >
                          {driver.name} - {driver.phone}
                          {isAssignedForDates ? ' — Assigned for these dates' : !driver.isAvailable ? ' (Unavailable)' : ''}
                          {driver.licenseExpired ? ' (License Expired)' : ''}
                        </option>
                      );
                    })}
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
