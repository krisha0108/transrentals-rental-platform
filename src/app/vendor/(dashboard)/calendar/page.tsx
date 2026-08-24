'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Car,
  User,
  MapPin,
  Clock,
  Eye,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Truck,
  Bus,
  Bike,
  Package,
  Sparkles,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import VendorCallButton from '@/components/vendor/VendorCallButton';

interface Booking {
  id: string;
  bookingNumber: string;
  service: string;
  serviceType: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  vehicleNumber?: string;
  driver?: string | null;
  driverPhone?: string | null;
  pickupDate: string;
  pickupTime: string;
  dropDate?: string | null;
  dropTime?: string | null;
  pickup: string;
  drop: string;
  passengers?: number;
  status: string;
  amount: number;
  paidAmount: number;
  paymentStatus: string;
}

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
}

interface Stats {
  total: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  pending: number;
  revenue: number;
}

const getServiceIcon = (serviceType: string) => {
  switch (serviceType) {
    case 'car':
    case 'chauffeur':
      return <Car className="w-3 h-3" />;
    case 'bus':
      return <Bus className="w-3 h-3" />;
    case 'truck':
      return <Truck className="w-3 h-3" />;
    case 'bike':
      return <Bike className="w-3 h-3" />;
    case 'luxury':
      return <Sparkles className="w-3 h-3" />;
    case 'packers':
      return <Package className="w-3 h-3" />;
    case 'equipment':
      return <Wrench className="w-3 h-3" />;
    default:
      return <Car className="w-3 h-3" />;
  }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterDriver, setFilterDriver] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch bookings from API
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Get start and end based on view mode
      let startDate: Date, endDate: Date;

      if (viewMode === 'day') {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (viewMode === 'week') {
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      }

      const response = await fetch(
        `/api/vendor/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        setStats(
          data.stats || {
            total: 0,
            confirmed: 0,
            inProgress: 0,
            completed: 0,
            pending: 0,
            revenue: 0,
          }
        );
        setVehicles(data.filters?.vehicles || []);
        setDrivers(data.filters?.drivers || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentDate, viewMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'assigned':
      case 'driver_assigned':
        return 'bg-green-500';
      case 'pending':
      case 'pending_payment':
      case 'pending_assignment':
        return 'bg-yellow-500';
      case 'completed':
      case 'delivered':
        return 'bg-blue-500';
      case 'in_progress':
      case 'ongoing':
      case 'started':
      case 'picked_up':
        return 'bg-purple-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'assigned':
      case 'driver_assigned':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
      case 'pending_payment':
      case 'pending_assignment':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'completed':
      case 'delivered':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'in_progress':
      case 'ongoing':
      case 'started':
      case 'picked_up':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 border-red-300 text-red-800 line-through opacity-60';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get month dates
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const dates = [];

    // Add padding for days before first day
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add padding for remaining days
    const remaining = 42 - dates.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      dates.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return dates;
  };

  const weekDates = getWeekDates();
  const monthDates = getMonthDates();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getBookingsForDate = (date: string) => {
    return bookings.filter(b => {
      const bookingDate = new Date(b.pickupDate).toISOString().split('T')[0];
      const matchesDate = bookingDate === date;
      const matchesVehicle = filterVehicle === 'all' || b.vehicle?.includes(filterVehicle);
      const matchesDriver = filterDriver === 'all' || b.driver === filterDriver;
      const matchesService = filterService === 'all' || b.serviceType === filterService;
      return matchesDate && matchesVehicle && matchesDriver && matchesService;
    });
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getViewTitle = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="text-gray-600">View and manage all bookings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBookings}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Today&apos;s Bookings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Today&apos;s Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
              >
                Today
              </button>
              <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{getViewTitle()}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Filters */}
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Services</option>
              <option value="car">Self-Drive</option>
              <option value="chauffeur">Car Rental</option>
              <option value="bus">Bus</option>
              <option value="truck">Truck</option>
              <option value="bike">Bike</option>
              <option value="luxury">Luxury</option>
              <option value="packers">Packers</option>
              <option value="equipment">Equipment</option>
            </select>
            {vehicles.length > 0 && (
              <select
                value={filterVehicle}
                onChange={e => setFilterVehicle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.vehicleName}>
                    {v.vehicleName} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            )}
            {drivers.length > 0 && (
              <select
                value={filterDriver}
                onChange={e => setFilterDriver(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Drivers</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['day', 'week', 'month'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as 'day' | 'week' | 'month')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="max-h-[600px] overflow-y-auto">
                {hours
                  .filter(h => h >= 4 && h <= 23)
                  .map(hour => {
                    const dateStr = formatDate(currentDate);
                    const hourBookings = getBookingsForDate(dateStr).filter(b => {
                      const startHour = parseInt(b.pickupTime?.split(':')[0] || '0');
                      return startHour === hour;
                    });

                    return (
                      <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
                        <div className="w-20 p-2 text-sm text-gray-500 text-right pr-3 border-r border-gray-200 shrink-0">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 p-1">
                          {hourBookings.map(booking => (
                            <button
                              key={booking.id}
                              onClick={() => setSelectedBooking(booking)}
                              className={`w-full text-left p-3 rounded-lg border mb-1 ${getStatusBgColor(booking.status)} hover:shadow-md transition`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getServiceIcon(booking.serviceType)}
                                <span className="font-medium">{booking.customerName}</span>
                                <span className="text-xs opacity-75 ml-auto">{booking.service}</span>
                              </div>
                              <p className="text-sm opacity-75">
                                {booking.vehicle} • {booking.pickupTime}
                                {booking.dropTime && ` - ${booking.dropTime}`}
                              </p>
                              <p className="text-sm opacity-75 mt-1">
                                {booking.pickup} → {booking.drop}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-3 text-center text-sm font-medium text-gray-500">Time</div>
                {weekDates.map((date, idx) => {
                  const today = isToday(date);
                  const dayBookings = getBookingsForDate(formatDate(date));
                  return (
                    <div key={idx} className={`p-3 text-center border-l border-gray-200 ${today ? 'bg-blue-50' : ''}`}>
                      <p className={`text-sm font-medium ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                        {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-bold ${today ? 'text-blue-600' : 'text-gray-900'}`}>{date.getDate()}</p>
                      {dayBookings.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {dayBookings.filter(b => !['cancelled', 'rejected'].includes(b.status)).length} bookings
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              <div className="max-h-[500px] overflow-y-auto">
                {hours
                  .filter(h => h >= 4 && h <= 23)
                  .map(hour => (
                    <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
                      <div className="p-2 text-sm text-gray-500 text-right pr-3 border-r border-gray-200">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      {weekDates.map((date, dayIdx) => {
                        const dateStr = formatDate(date);
                        const hourBookings = getBookingsForDate(dateStr).filter(b => {
                          const startHour = parseInt(b.pickupTime?.split(':')[0] || '0');
                          return startHour === hour;
                        });
                        const today = isToday(date);

                        return (
                          <div key={dayIdx} className={`p-1 border-l border-gray-100 relative ${today ? 'bg-blue-50/30' : ''}`}>
                            {hourBookings.map(booking => (
                              <button
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className={`w-full text-left p-2 rounded-lg border text-xs mb-1 ${getStatusBgColor(booking.status)} hover:shadow-md transition`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {getServiceIcon(booking.serviceType)}
                                  <span className="font-medium truncate">{booking.customerName}</span>
                                </div>
                                <p className="truncate opacity-75">{booking.vehicle}</p>
                                <p className="opacity-75">
                                  {booking.pickupTime}
                                  {booking.dropTime && ` - ${booking.dropTime}`}
                                </p>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {monthDates.map(({ date, isCurrentMonth }, idx) => {
                  const today = isToday(date);
                  const dateStr = formatDate(date);
                  const dayBookings = getBookingsForDate(dateStr);
                  const activeBookings = dayBookings.filter(b => !['cancelled', 'rejected'].includes(b.status));

                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                      } ${today ? 'bg-blue-50' : ''}`}
                    >
                      <p className={`text-sm font-medium mb-1 ${today ? 'text-blue-600' : ''}`}>{date.getDate()}</p>
                      <div className="space-y-1">
                        {activeBookings.slice(0, 3).map(booking => (
                          <button
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`w-full text-left p-1 rounded text-xs truncate ${getStatusBgColor(booking.status)} hover:shadow transition`}
                          >
                            <span className="flex items-center gap-1">
                              {getServiceIcon(booking.serviceType)}
                              <span className="truncate">{booking.customerName}</span>
                            </span>
                          </button>
                        ))}
                        {activeBookings.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">+{activeBookings.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 lg:gap-6">
          <span className="text-sm text-gray-500">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>

      {/* No Bookings */}
      {bookings.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500">You don&apos;t have any bookings for this period</p>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {getServiceIcon(selectedBooking.serviceType)}
                    <h2 className="text-lg font-bold text-gray-900">#{selectedBooking.bookingNumber}</h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(selectedBooking.status)}`}
                    >
                      {formatStatus(selectedBooking.status)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {selectedBooking.service}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
                  <VendorCallButton phone={selectedBooking.customerPhone} bookingType={`${selectedBooking.serviceType}_booking`} bookingId={selectedBooking.id} size="sm" />
                </div>
              </div>

              {/* Vehicle & Driver */}
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{selectedBooking.vehicle}</p>
                  {selectedBooking.vehicleNumber && <p className="text-sm text-gray-500">{selectedBooking.vehicleNumber}</p>}
                  {selectedBooking.driver && (
                    <p className="text-sm text-gray-500">
                      Driver: {selectedBooking.driver}
                      {selectedBooking.driverPhone && ` (${selectedBooking.driverPhone})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Route */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedBooking.pickup} → {selectedBooking.drop}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedBooking.pickupDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedBooking.pickupTime}
                    {selectedBooking.dropTime && ` - ${selectedBooking.dropTime}`}
                  </p>
                  {selectedBooking.dropDate && (
                    <p className="text-sm text-gray-500">
                      Return: {new Date(selectedBooking.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedBooking.amount)}</p>
                  <p className="text-sm text-gray-500">
                    Paid: {formatCurrency(selectedBooking.paidAmount)} •{' '}
                    <span className={selectedBooking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Passengers if applicable */}
              {selectedBooking.passengers && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedBooking.passengers} Passengers</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              <VendorCallButton phone={selectedBooking.customerPhone} bookingType={`${selectedBooking.serviceType}_booking`} bookingId={selectedBooking.id} label="Call Customer" />
              <Link
                href={`/vendor/${selectedBooking.serviceType}-bookings/${selectedBooking.id}`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
