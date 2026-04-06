'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Inbox,
  Radio,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight,
  Car,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface BookingStats {
  direct: number;
  open: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  vehicleType: string;
  chauffeur_vehicle_categories: string;
  locationName: string;
  pickupDate: string;
  dropDate: string;
  totalDays: number;
  grandTotal: number;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING_VENDOR':
      return 'bg-yellow-100 text-yellow-700';
    case 'BROADCASTED':
      return 'bg-blue-100 text-blue-700';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-700';
    case 'READY_FOR_PICKUP':
      return 'bg-cyan-100 text-cyan-700';
    case 'IN_PROGRESS':
      return 'bg-purple-100 text-purple-700';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-700';
    case 'CANCELLED':
    case 'DROPPED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING_VENDOR':
      return 'Awaiting Response';
    case 'BROADCASTED':
      return 'Open Request';
    case 'ACCEPTED':
      return 'Accepted';
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'DROPPED':
      return 'Dropped';
    default:
      return status;
  }
};

export default function VendorSelfDriveBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BookingStats>({
    direct: 0,
    open: 0,
    active: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, dateFilter, search]);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/vendor/self-drive-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' }),
      });
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.success) {
        setStats({
          direct: statsData.stats?.directRequests || 0,
          open: statsData.stats?.openRequests || 0,
          active: (statsData.stats?.accepted || 0) + (statsData.stats?.inProgress || 0),
          completed: statsData.stats?.completed || 0,
          totalEarnings: statsData.stats?.totalEarnings || 0,
        });
      }

      // Fetch recent bookings with pagination and date filters
      const params = new URLSearchParams();
      params.set('type', 'all');
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (search) params.set('search', search);

      const bookingsRes = await fetch(`/api/vendor/self-drive-bookings?${params}`);
      const bookingsData = await bookingsRes.json();
      if (bookingsRes.ok && bookingsData.success) {
        setRecentBookings(bookingsData.bookings || []);
        // Set pagination state
        if (bookingsData.pagination) {
          setTotalPages(bookingsData.pagination.totalPages);
          setTotalItems(bookingsData.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const STATS = [
    {
      label: 'Direct Requests',
      value: stats.direct,
      description: 'Awaiting your response',
      icon: Inbox,
      color: 'orange',
      href: '/vendor/self-drive/bookings/direct',
    },
    {
      label: 'Open Requests',
      value: stats.open,
      description: 'Available in your area',
      icon: Radio,
      color: 'blue',
      href: '/vendor/self-drive/bookings/open',
    },
    {
      label: 'Active Rentals',
      value: stats.active,
      description: 'Currently in progress',
      icon: CheckCircle,
      color: 'green',
      href: '#active',
    },
    {
      label: 'Completed',
      value: stats.completed,
      description: 'This month',
      icon: TrendingUp,
      color: 'purple',
      href: '#completed',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Self-Drive Car Bookings</h1>
        <p className="text-gray-600">Manage your self-drive car rental bookings</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by customer name, phone, email, booking number..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={cn(
                'bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group',
                stat.value > 0 && stat.color === 'orange' && 'border-orange-200 bg-orange-50/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    stat.color === 'orange' && 'bg-orange-100',
                    stat.color === 'blue' && 'bg-blue-100',
                    stat.color === 'green' && 'bg-green-100',
                    stat.color === 'purple' && 'bg-purple-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      stat.color === 'orange' && 'text-orange-600',
                      stat.color === 'blue' && 'text-blue-600',
                      stat.color === 'green' && 'text-green-600',
                      stat.color === 'purple' && 'text-purple-600'
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View details</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/vendor/self-drive/bookings/direct"
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white hover:from-orange-600 hover:to-amber-600 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Direct Requests</h3>
              <p className="text-orange-100 mt-1">
                Customers have requested your specific cars
              </p>
              <p className="text-sm text-orange-200 mt-3">
                {stats.direct} request{stats.direct !== 1 ? 's' : ''} awaiting your response
              </p>
            </div>
            <Inbox className="w-16 h-16 text-white/30" />
          </div>
        </Link>

        <Link
          href="/vendor/self-drive/bookings/open"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white hover:from-blue-600 hover:to-indigo-600 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Open Requests</h3>
              <p className="text-blue-100 mt-1">
                Browse available bookings in your area
              </p>
              <p className="text-sm text-blue-200 mt-3">
                {stats.open} open request{stats.open !== 1 ? 's' : ''} to explore
              </p>
            </div>
            <Radio className="w-16 h-16 text-white/30" />
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <DateFilterDropdown
            onFilterChange={(start, end) => {
              setDateFilter({ start, end });
              setCurrentPage(1);
            }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No bookings yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Bookings will appear here once customers start booking
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/vendor/self-drive/bookings/${booking.id}`}
                className="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center gap-4 cursor-pointer block"
              >
                {/* Car Icon */}
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="w-6 h-6 text-indigo-600" />
                </div>

                {/* Booking Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">#{booking.bookingNumber}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(booking.status)
                      )}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.vehicleName} • {booking.chauffeur_vehicle_categories || booking.vehicleType}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.customerName} • {booking.locationName}
                  </p>
                </div>

                {booking.status === 'DROPPED' && (
                  <div className="col-span-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Booking Dropped</span>
                      {(booking as any).dropReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {(booking as any).dropReason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trip Info */}
                <div className="text-sm text-gray-500">
                  <p>
                    {new Date(booking.pickupDate).toLocaleDateString()} →{' '}
                    {new Date(booking.dropDate).toLocaleDateString()}
                  </p>
                  <p>{booking.totalDays} day(s)</p>
                </div>

                {/* Amount & Arrow */}
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{booking.grandTotal?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total amount</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {recentBookings.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
