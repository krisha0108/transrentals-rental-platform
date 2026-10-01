'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import FilterMultiSelect from '@/components/manager/FilterMultiSelect';
import Pagination from '@/components/manager/Pagination';
import {
  Loader2,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bike,
  RefreshCw,
  Car,
  Bus,
  Truck,
  Package,
  Layers,
  Globe,
  Smartphone,
  X,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  vendorName?: string;
  vendorVid?: string | null;
  locationName: string;
  serviceName?: string;
  serviceSlug?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  totalAmount: number;
  dailyRate?: number;
  totalDays?: number;
  advancePaymentVerified: boolean;
  source?: string;
  createdAt: string;
  pickupAddress?: string | null;
  dropAddress?: string | null;
  deliveryCity?: string | null;
  deliveryAddress?: string | null;
  numberOfVehicles?: number | null;
  // ── Packers list extras ──
  shiftingScope?: string | null;
  shiftingType?: string | null;
  propertySize?: string | null;
  estimatedWeight?: number | null;
  // ── Truck list extras ──
  truckBodyType?: string | null;
  tripDirection?: string | null;
  estimatedVolume?: string | null;
  pickupPincode?: string | null;
  dropPincode?: string | null;
  callsCount?: number;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'bike-rental': Bike,
  'car-rental': Car,
  'chauffeur': Car,
  'luxury-car-rental': Car,
  'bus-rental': Bus,
  'truck-rental': Truck,
  'packers-movers': Package,
  'equipment-rental': Package,
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_PAYMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Payment' },
  PAYMENT_SUBMITTED: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Payment Submitted' },
  PAYMENT_VERIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Payment Verified' },
  PENDING_VENDOR: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Pending Vendor' },
  BROADCASTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Broadcasted' },
  ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  READY_FOR_PICKUP: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Ready for Pickup' },
  IN_PROGRESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'In Progress' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
  EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Expired' },
  REFUNDED: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Refunded' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAYMENT_SUBMITTED', label: 'Payment Submitted' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

type DateFilter = 'all' | 'today' | 'yesterday' | 'thisMonth' | 'lastMonth';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'all', label: 'All Bookings' },
];

function ManagerBookingsPageInner() {
  // `bookings` now holds only the current page's rows — filtering, stats,
  // and pagination all happen server-side (see fetchBookings below) instead
  // of fetching every booking and slicing in the browser.
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Filters read from the URL rather than local state, so applying a filter,
  // opening a booking, then hitting Back restores exactly what was selected.
  // Same approach as /manager/inquiries and /manager/vendors.
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams ?? new URLSearchParams();

  const csv = (name: string): string[] => {
    const raw = (searchParams.get(name) || '').trim();
    return !raw || raw === 'all' ? [] : raw.split(',').map((v) => v.trim()).filter(Boolean);
  };

  const searchTerm = searchParams.get('search') || '';
  const statusFilters = csv('status');
  const serviceFilters = csv('service');
  const locationFilters = csv('location');
  const stateFilters = csv('state');
  const sourceFilter = searchParams.get('source') || 'all';
  const dateFilter = (searchParams.get('date') || 'all') as DateFilter;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local echo of the search box so typing stays instant; committed to the URL
  // on a debounce rather than on every keystroke.
  const [searchInput, setSearchInput] = useState(searchTerm);
  useEffect(() => { setSearchInput(searchTerm); }, [searchTerm]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bookingStats, setBookingStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0 });


  // Debounce the search box so typing doesn't fire a request per keystroke.
  // Writes filter changes into the URL, merged with what is already there, and
  // resets pagination — passing '' removes a param instead of writing a default.
  const updateFilter = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/manager/bookings?${qs}` : '/manager/bookings', { scroll: false });
  }, [searchParams, router]);

  // What the URL currently says, carried to a booking and back again.
  const listQuery = searchParams.toString();

  // Drives the Clear all button — every filter this page puts in the URL.
  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    serviceFilters.length + statusFilters.length + locationFilters.length + stateFilters.length;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    router.push('/manager/bookings', { scroll: false });
  }, [router]);

  const setCurrentPage = useCallback((pg: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pg > 1) params.set('page', String(pg)); else params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/manager/bookings?${qs}` : '/manager/bookings', { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (searchInput === searchTerm) return;
    const t = setTimeout(() => updateFilter({ search: searchInput }), 400);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, updateFilter]);
  const itemsPerPage = 10;

  const fetchBookings = async (page = currentPage) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilters.length) params.set('status', statusFilters.join(','));
      if (serviceFilters.length) params.set('service', serviceFilters.join(','));
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (locationFilters.length) params.set('location', locationFilters.join(','));
      if (stateFilters.length) params.set('state', stateFilters.join(','));
      if (dateFilter !== 'all') params.set('date', dateFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(itemsPerPage));

      const response = await fetch(`/api/manager/bookings?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        if (data.services) setAssignedServices(data.services);
        setLocationOptions(data.locations || []);
        setStateOptions(data.states || []);
        setBookingStats(data.stats || { total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0 });
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // updateFilter already drops `page` on every change, so the URL is the single
  // source of truth and this effect just refetches whenever it moves.
  useEffect(() => {
    fetchBookings(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings(currentPage);
  };

  useManagerPageHeader(
    'My Bookings',
    'Manage bookings for your assigned locations',
    <button
      key="refresh"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const uniqueLocations = locationOptions;
  const currentBookings = bookings;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: bookingStats.total,     icon: Calendar,      color: 'bg-gray-100 text-gray-600',    valColor: 'text-gray-900' },
          { label: 'Active',    value: bookingStats.active,    icon: Clock,         color: 'bg-blue-100 text-blue-600',    valColor: 'text-blue-600' },
          { label: 'Completed', value: bookingStats.completed, icon: CheckCircle,   color: 'bg-green-100 text-green-600',  valColor: 'text-green-600' },
          { label: 'Cancelled', value: bookingStats.cancelled, icon: XCircle,       color: 'bg-red-100 text-red-500',      valColor: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color, valColor }) => (
          <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className={`text-2xl font-bold ${valColor}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => updateFilter({ date: filter.value === 'all' ? '' : filter.value })}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === filter.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by booking #, customer, phone, email, location, service..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Service — multi-select */}
          <FilterMultiSelect
            label="Services"
            allLabel="All Services"
            icon={Layers}
            options={assignedServices.map((sv) => ({ value: sv.slug, label: sv.name }))}
            values={serviceFilters}
            onChange={(v) => updateFilter({ service: v.join(',') })}
          />

          {/* Status — multi-select */}
          <FilterMultiSelect
            label="Status"
            allLabel="All Bookings"
            icon={Filter}
            options={STATUS_FILTERS.filter((f) => f.value !== 'all').map((f) => ({ value: f.value, label: f.label }))}
            values={statusFilters}
            onChange={(v) => updateFilter({ status: v.join(',') })}
          />

          {/* State — narrows which of your assigned locations are in scope;
              picking one also clears Locations so a stale city from a
              different state can't silently zero out the results. */}
          <FilterMultiSelect
            label="States"
            allLabel="All States"
            icon={MapPin}
            options={stateOptions.map((s) => ({ value: s.id, label: s.name }))}
            values={stateFilters}
            onChange={(v) => updateFilter({ state: v.join(','), location: '' })}
          />

          {/* Location — searchable multi-select, same styling as /manager/vendors */}
          <FilterMultiSelect
            label="Locations"
            allLabel="All Locations"
            icon={MapPin}
            options={uniqueLocations.map((loc) => ({ value: loc, label: loc }))}
            values={locationFilters}
            onChange={(v) => updateFilter({ location: v.join(',') })}
          />

          {/* Source Filter */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sourceFilter}
              onChange={(e) => updateFilter({ source: e.target.value === 'all' ? '' : e.target.value })}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
            >
              <option value="all">All Sources</option>
              <option value="web">Web</option>
              <option value="app">App</option>
            </select>
          </div>

          {/* Clear all — only shown once something is actually filtered. */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 hover:text-red-500 transition shrink-0"
            >
              <X className="w-4 h-4" />
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          Showing {totalCount > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalCount)} of {totalCount} bookings
        </p>
        {totalPages > 1 && (
          <p>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {currentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Bike className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilters.length > 0 || serviceFilters.length > 0 || locationFilters.length > 0
                ? 'Try adjusting your search or filters'
                : 'No bookings are assigned to your locations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentBookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
              const ServiceIcon = SERVICE_ICONS[booking.serviceSlug || 'bike-rental'] || Bike;

              // Calculate amount with fallbacks
              const getDisplayAmount = () => {
                if (booking.totalAmount) return booking.totalAmount;
                if (booking.dailyRate && booking.totalDays) return booking.dailyRate * booking.totalDays;
                return null;
              };
              const displayAmount = getDisplayAmount();

              return (
                <Link
                  key={booking.id}
                  // Hand the current filters and page along, so the detail
                  // page's back arrow can return to this exact list rather
                  // than a reset one.
                  href={`/manager/bookings/${booking.id}${listQuery ? `?from=${encodeURIComponent(listQuery)}` : ''}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ServiceIcon className="w-6 h-6 text-green-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          #{booking.bookingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                        {booking.source && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            booking.source === 'app'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {booking.source === 'app'
                              ? <><Smartphone className="w-3 h-3" /> App</>
                              : <><Globe className="w-3 h-3" /> Web</>
                            }
                          </span>
                        )}
                        {booking.advancePaymentVerified && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Payment Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="truncate block">{booking.locationName || booking.deliveryCity}</span>
                            {(booking.pickupAddress || booking.deliveryAddress) && (
                              <span className="block text-xs text-gray-400 truncate">
                                {booking.pickupAddress || booking.deliveryAddress}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(booking.pickupDate)}</span>
                          {booking.pickupTime && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400 ml-2" />
                              <span>{booking.pickupTime}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {booking.serviceName && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            {booking.serviceName}
                          </span>
                        )}
                        {booking.serviceSlug === 'bike-rental' && booking.numberOfVehicles && booking.numberOfVehicles > 1 && (
                          <span className="px-2 py-0.5 bg-emerald-50 rounded text-xs font-medium text-emerald-700">
                            × {booking.numberOfVehicles} bikes
                          </span>
                        )}
                        {booking.serviceSlug === 'self-drive' && booking.numberOfVehicles && booking.numberOfVehicles > 1 && (
                          <span className="px-2 py-0.5 bg-emerald-50 rounded text-xs font-medium text-emerald-700">
                            × {booking.numberOfVehicles} cars
                          </span>
                        )}
                        {(booking.serviceSlug === 'packers-and-movers' || booking.serviceSlug === 'packers-movers') && booking.shiftingScope && (
                          <span className="px-2 py-0.5 bg-emerald-50 rounded text-xs font-medium text-emerald-700">
                            {booking.shiftingScope}
                          </span>
                        )}
                        {(booking.serviceSlug === 'packers-and-movers' || booking.serviceSlug === 'packers-movers') && booking.propertySize && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            {booking.propertySize}
                          </span>
                        )}
                        {/* Truck chips */}
                        {(booking.serviceSlug === 'truck-transport' || booking.serviceSlug === 'truck-rental' || booking.serviceSlug === 'transporter' || booking.serviceSlug === 'truck-tempo-rental' || booking.serviceSlug === 'mini-truck') && booking.truckBodyType && (
                          <span className="px-2 py-0.5 bg-emerald-50 rounded text-xs font-medium text-emerald-700">
                            {(() => {
                              const m: Record<string, string> = {
                                OPEN: 'Open', CLOSED_BODY: 'Closed Body', CONTAINER: 'Container',
                                TRAILER: 'Trailer', LCV: 'LCV', REFRIGERATED: 'Refrigerated',
                                FLATBED: 'Flatbed', OTHER: 'Other',
                              };
                              return m[booking.truckBodyType!] || booking.truckBodyType;
                            })()}
                          </span>
                        )}
                        {(booking.serviceSlug === 'truck-transport' || booking.serviceSlug === 'truck-rental' || booking.serviceSlug === 'transporter' || booking.serviceSlug === 'truck-tempo-rental' || booking.serviceSlug === 'mini-truck') && booking.tripDirection && (
                          <span className="px-2 py-0.5 bg-blue-50 rounded text-xs font-medium text-blue-700">
                            {booking.tripDirection === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                          </span>
                        )}
                        {booking.vendorName && (
                          <span>
                            Vendor: <span className="font-medium text-gray-700">{booking.vendorName}</span>
                          </span>
                        )}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          (booking.callsCount ?? 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Phone className="w-3 h-3" />
                          {booking.callsCount ?? 0} {(booking.callsCount ?? 0) === 1 ? 'call' : 'calls'}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {displayAmount ? formatCurrency(displayAmount).replace('₹', '') : 'N/A'}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

// useSearchParams requires a Suspense boundary during prerendering.
export default function ManagerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <ManagerBookingsPageInner />
    </Suspense>
  );
}
