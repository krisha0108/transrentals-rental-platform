'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  Car,
  Users,
  Send,
  ChevronRight,
  CheckCircle,
  Bus,
  Bike,
  Truck,
  Wrench,
  Package,
  Star,
} from 'lucide-react';

interface B2BBooking {
  id: string;
  bookingNumber: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  vehiclesRequired: number;
  passengerCount: number | null;
  vehicleCategory: string | null;
  pickupLocation: string;
  dropLocation: string | null;
  tripType: string;
  scheduledDate: string;
  scheduledTime: string;
  returnDate: string | null;
  specialNotes: string | null;
  status: string;
  totalVehiclesFilled: number;
  _count: { vendorQuotes: number; trips: number };
  vendorQuotes: { id: string; status: string; vehicleCount: number }[];
  customer: { name: string; companyName: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN_FOR_QUOTES: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
  QUOTES_RECEIVED: { label: 'Responses Received', color: 'bg-amber-100 text-amber-700' },
  SUPER_QUOTE_SENT: { label: 'Sent to Customer', color: 'bg-purple-100 text-purple-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  TRIPS_CREATED: { label: 'Trips Created', color: 'bg-indigo-100 text-indigo-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const SERVICE_CONFIG: Record<string, { label: string; icon: any; color: string; badgeColor: string; borderColor: string; iconBg: string; iconText: string; flow: 'direct' | 'quote' }> = {
  car: { label: 'Car Rental', icon: Car, color: 'bg-blue-100 text-blue-700', badgeColor: 'bg-blue-600 text-white', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-100', iconText: 'text-blue-700', flow: 'direct' },
  'self-drive': { label: 'Self Drive', icon: Car, color: 'bg-sky-100 text-sky-700', badgeColor: 'bg-sky-600 text-white', borderColor: 'border-l-sky-500', iconBg: 'bg-sky-100', iconText: 'text-sky-700', flow: 'quote' },
  bus: { label: 'Bus Rental', icon: Bus, color: 'bg-amber-100 text-amber-700', badgeColor: 'bg-amber-500 text-white', borderColor: 'border-l-amber-500', iconBg: 'bg-amber-100', iconText: 'text-amber-700', flow: 'quote' },
  truck: { label: 'Truck Rental', icon: Truck, color: 'bg-red-100 text-red-700', badgeColor: 'bg-red-600 text-white', borderColor: 'border-l-red-500', iconBg: 'bg-red-100', iconText: 'text-red-700', flow: 'quote' },
  bike: { label: 'Bike Rental', icon: Bike, color: 'bg-green-100 text-green-700', badgeColor: 'bg-green-600 text-white', borderColor: 'border-l-green-500', iconBg: 'bg-green-100', iconText: 'text-green-700', flow: 'direct' },
  equipment: { label: 'Equipment', icon: Wrench, color: 'bg-cyan-100 text-cyan-700', badgeColor: 'bg-cyan-600 text-white', borderColor: 'border-l-cyan-500', iconBg: 'bg-cyan-100', iconText: 'text-cyan-700', flow: 'quote' },
  packers: { label: 'Packers & Movers', icon: Package, color: 'bg-pink-100 text-pink-700', badgeColor: 'bg-pink-600 text-white', borderColor: 'border-l-pink-500', iconBg: 'bg-pink-100', iconText: 'text-pink-700', flow: 'quote' },
  luxury: { label: 'Luxury Car', icon: Star, color: 'bg-yellow-100 text-yellow-700', badgeColor: 'bg-yellow-500 text-white', borderColor: 'border-l-yellow-500', iconBg: 'bg-yellow-100', iconText: 'text-yellow-700', flow: 'direct' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way',
  ROUND_TRIP: 'Round Trip',
  HOURLY: 'Local / Hourly',
  SELF_DRIVE: 'Self Drive',
};

function parseSelfDrivePref(notes: string | null): any {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch {
    // Handle old pipe-separated format: "Preferred: BMW BMW Motorrad | Transmission: Manual"
    if (notes.includes('|') || notes.includes('Preferred:')) {
      const result: any = {};
      const parts = notes.split('|').map(s => s.trim());
      for (const part of parts) {
        if (part.startsWith('Preferred:')) {
          const val = part.replace('Preferred:', '').trim();
          const words = val.split(' ');
          result.vehicleBrand = words[0] || null;
          result.vehicleModelName = words.slice(1).join(' ') || null;
        }
        if (part.startsWith('Transmission:')) result.transmission = part.replace('Transmission:', '').trim();
        if (part.startsWith('Fuel:')) result.fuelType = part.replace('Fuel:', '').trim();
        if (part.startsWith('Category:')) result.vehicleCategory = part.replace('Category:', '').trim();
        if (part.startsWith('Seats:')) result.minSeats = part.replace('Seats:', '').trim();
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    return null;
  }
}

const FILTER_TABS = [
  { value: 'all', label: 'All Services' },
  { value: 'car', label: 'Car Rental' },
  { value: 'bus', label: 'Bus' },
  { value: 'self-drive', label: 'Self Drive' },
  { value: 'truck', label: 'Truck' },
  { value: 'luxury', label: 'Luxury Car' },
];

export default function VendorB2BBookingsPage() {
  const [bookings, setBookings] = useState<B2BBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/b2b-quotes?view=open');
      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch B2B bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const filteredBookings = bookings.filter(b => {
    const matchesService = serviceFilter === 'all' || b.serviceType === serviceFilter;
    const matchesSearch = !searchQuery ||
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter based on vendor's quote status
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const myQuote = b.vendorQuotes?.[0];
      if (statusFilter === 'yet_to_quote') {
        matchesStatus = !myQuote;
      } else if (statusFilter === 'pending') {
        matchesStatus = myQuote?.status === 'SUBMITTED' || myQuote?.status === 'REVISED';
      } else if (statusFilter === 'confirmed') {
        matchesStatus = myQuote?.status === 'CONFIRMED' || myQuote?.status === 'ACCEPTED';
      } else if (statusFilter === 'rejected') {
        matchesStatus = myQuote?.status === 'REJECTED';
      }
    }

    return matchesService && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-teal-600" />
            B2B Corporate Requests
          </h1>
          <p className="text-gray-500 mt-1">Bulk transport requests from corporate customers</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All', icon: null, color: 'bg-teal-600 text-white', inactiveColor: 'bg-gray-100 text-gray-600' },
            { value: 'yet_to_quote', label: 'Yet to Quote', icon: '📝', color: 'bg-blue-600 text-white', inactiveColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
            { value: 'pending', label: 'Pending', icon: '⏳', color: 'bg-amber-500 text-white', inactiveColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
            { value: 'confirmed', label: 'Confirmed', icon: '✓', color: 'bg-green-600 text-white', inactiveColor: 'bg-green-50 text-green-700 border border-green-200' },
            { value: 'rejected', label: 'Not Selected', icon: '✗', color: 'bg-red-500 text-white', inactiveColor: 'bg-red-50 text-red-700 border border-red-200' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                statusFilter === tab.value ? tab.color : tab.inactiveColor
              }`}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}{tab.label}
            </button>
          ))}
        </div>

        {/* Service Type + Search */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setServiceFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  serviceFilter === tab.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search booking, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No B2B Requests</h3>
          <p className="text-gray-500 mt-1">Corporate bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
            const svcConfig = SERVICE_CONFIG[booking.serviceType] || SERVICE_CONFIG['car'];
            const SvcIcon = svcConfig.icon;
            const hasResponded = booking.vendorQuotes && booking.vendorQuotes.length > 0;
            const vendorVehicleCount = hasResponded ? booking.vendorQuotes.reduce((sum, q) => sum + q.vehicleCount, 0) : 0;

            // Determine action based on service flow
            const isSelfDrive = booking.serviceType === 'self-drive';
            const selfDrivePref = isSelfDrive ? parseSelfDrivePref(booking.specialNotes) : null;
            const actionLabel = 'Submit Quote';
            const actionHref = `/vendor/b2b-bookings/${booking.id}/quote`;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${svcConfig.borderColor} hover:shadow-md transition overflow-hidden`}
              >
                {/* Header Bar */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{booking.bookingNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Service Badge - prominent */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${svcConfig.badgeColor}`}>
                      <SvcIcon className="w-3.5 h-3.5" />
                      {svcConfig.label}
                    </span>
                    {/* Status */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Details */}
                    <div className="flex-1 space-y-4">
                      {/* Requirement Cards */}
                      <div className="flex items-center gap-4">
                        <div className={`${svcConfig.iconBg} rounded-xl p-3 text-center min-w-[80px]`}>
                          <SvcIcon className={`w-6 h-6 ${svcConfig.iconText} mx-auto mb-1`} />
                          <p className={`text-2xl font-bold ${svcConfig.iconText}`}>{booking.vehiclesRequired}</p>
                          <p className={`text-xs ${svcConfig.iconText} opacity-80`}>Vehicles</p>
                        </div>
                        {booking.passengerCount && (
                          <div className="bg-blue-50 rounded-xl p-3 text-center min-w-[80px]">
                            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-blue-700">{booking.passengerCount}</p>
                            <p className="text-xs text-blue-600">Passengers</p>
                          </div>
                        )}
                        <div className="space-y-1.5 text-sm text-gray-700">
                          {isSelfDrive ? (
                            <>
                              {selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
                                <p className="font-medium text-gray-800">
                                  {[selfDrivePref.vehicleBrand, selfDrivePref.vehicleModelName].filter(Boolean).join(' ')}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {(selfDrivePref?.vehicleCategory || booking.vehicleCategory) && (
                                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs">{selfDrivePref?.vehicleCategory || booking.vehicleCategory}</span>
                                )}
                                {selfDrivePref?.transmission && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selfDrivePref.transmission}</span>
                                )}
                                {selfDrivePref?.fuelType && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selfDrivePref.fuelType}</span>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs">Self Drive - Quote based</p>
                            </>
                          ) : (
                            <>
                              {booking.vehicleCategory && (
                                <p><span className="font-medium text-gray-500">Category:</span> {booking.vehicleCategory}</p>
                              )}
                              <p><span className="font-medium text-gray-500">Trip:</span> {TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                              <p className="text-gray-400 text-xs">Quote-based</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Trip Info */}
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{isSelfDrive ? 'Location: ' : ''}{booking.pickupLocation}</span>
                          {!isSelfDrive && booking.dropLocation && <span>→ {booking.dropLocation}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          {isSelfDrive ? (
                            <span>{formatDate(booking.scheduledDate)}{booking.returnDate ? ` → ${formatDate(booking.returnDate)}` : ''}</span>
                          ) : (
                            <span>{formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}</span>
                          )}
                        </div>
                      </div>

                      {/* Filled progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{booking.totalVehiclesFilled || 0} of {booking.vehiclesRequired} vehicles filled</span>
                          <span>{booking._count?.vendorQuotes || 0} vendor responses</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-teal-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(((booking.totalVehiclesFilled || 0) / booking.vehiclesRequired) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {booking.specialNotes && !isSelfDrive && (
                        <p className="text-xs text-gray-500 italic">Notes: {booking.specialNotes}</p>
                      )}
                      {isSelfDrive && selfDrivePref?.customerNotes && (
                        <p className="text-xs text-gray-500 italic">Notes: {selfDrivePref.customerNotes}</p>
                      )}
                      {isSelfDrive && selfDrivePref?.isDeliveryRequested && (
                        <p className="text-xs text-sky-600 font-medium">Delivery requested</p>
                      )}
                    </div>

                    {/* Right: Action */}
                    <div className="flex flex-col items-end gap-3 min-w-[160px]">
                      {hasResponded ? (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center w-full">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-green-700">Quote Sent</p>
                            <p className="text-xs text-green-600">{vendorVehicleCount} vehicles</p>
                          </div>
                          <Link
                            href={`/vendor/b2b-bookings/${booking.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-xl border border-teal-200 transition text-sm w-full justify-center"
                          >
                            View Details <ChevronRight className="w-4 h-4" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href={actionHref}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-lg shadow-teal-200 w-full justify-center"
                          >
                            <Send className="w-5 h-5" />
                            {actionLabel}
                          </Link>
                          <Link
                            href={`/vendor/b2b-bookings/${booking.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-lg border border-gray-200 transition text-sm w-full justify-center"
                          >
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
