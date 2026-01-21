'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Search,
  Filter,
  Star,
  Phone,
  MessageSquare,
  Users,
  Truck,
  AlertCircle,
  Plus,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

// Mock Available Bookings
const mockAvailableBookings = [
  {
    id: '1',
    vendorId: 'v1',
    vendorName: 'Shree Tours & Travels',
    vendorRating: 4.6,
    vendorTrips: 189,
    vendorPhone: '+91 98765 43210',
    bookingType: 'Pilgrimage Tour',
    vehicleRequired: 'Bus (45-Seater)',
    route: {
      from: 'Mumbai',
      to: 'Shirdi',
      returnTrip: true,
    },
    tripDate: '2024-02-20',
    tripTime: '05:00',
    returnDate: '2024-02-20',
    passengers: 42,
    customerBudget: 25000,
    partnerEarning: 22500,
    commission: 2500,
    urgency: 'high',
    reason: 'Vehicle under maintenance',
    postedAt: '2024-02-13T09:00:00',
    additionalNotes: 'Devotees group, need a clean bus with good AC. Stop at Shirdi for 4-5 hours.',
  },
  {
    id: '2',
    vendorId: 'v2',
    vendorName: 'Metro Cabs Mumbai',
    vendorRating: 4.4,
    vendorTrips: 567,
    vendorPhone: '+91 98765 43211',
    bookingType: 'Outstation Trip',
    vehicleRequired: 'Sedan/SUV',
    route: {
      from: 'Mumbai',
      to: 'Goa',
      returnTrip: false,
    },
    tripDate: '2024-02-18',
    tripTime: '06:00',
    returnDate: null,
    passengers: 3,
    customerBudget: 8500,
    partnerEarning: 7650,
    commission: 850,
    urgency: 'medium',
    reason: 'No vehicle available',
    postedAt: '2024-02-13T11:00:00',
    additionalNotes: 'Customer prefers sedan. Drop at Calangute.',
  },
  {
    id: '3',
    vendorId: 'v3',
    vendorName: 'Express Logistics',
    vendorRating: 4.3,
    vendorTrips: 234,
    vendorPhone: '+91 98765 43212',
    bookingType: 'Goods Transport',
    vehicleRequired: 'Truck (14ft)',
    route: {
      from: 'Thane',
      to: 'Pune',
      returnTrip: false,
    },
    tripDate: '2024-02-17',
    tripTime: '08:00',
    returnDate: null,
    passengers: 0,
    customerBudget: 12000,
    partnerEarning: 10800,
    commission: 1200,
    urgency: 'low',
    reason: 'Overbooked',
    postedAt: '2024-02-12T14:00:00',
    additionalNotes: 'Furniture shifting. Handle with care. Loading help will be provided.',
  },
  {
    id: '4',
    vendorId: 'v4',
    vendorName: 'Royal Weddings',
    vendorRating: 4.9,
    vendorTrips: 78,
    vendorPhone: '+91 98765 43213',
    bookingType: 'Wedding Car',
    vehicleRequired: 'Luxury Sedan',
    route: {
      from: 'Mumbai',
      to: 'Lonavala',
      returnTrip: true,
    },
    tripDate: '2024-02-22',
    tripTime: '10:00',
    returnDate: '2024-02-22',
    passengers: 2,
    customerBudget: 18000,
    partnerEarning: 15500,
    commission: 2500,
    urgency: 'high',
    reason: 'Premium car not available',
    postedAt: '2024-02-13T16:00:00',
    additionalNotes: 'Wedding couple. Car should be decorated. Mercedes/BMW/Audi preferred.',
  },
  {
    id: '5',
    vendorId: 'v5',
    vendorName: 'Corporate Fleet Services',
    vendorRating: 4.7,
    vendorTrips: 456,
    vendorPhone: '+91 98765 43214',
    bookingType: 'Corporate Trip',
    vehicleRequired: 'Tempo Traveller (17-Seater)',
    route: {
      from: 'BKC Mumbai',
      to: 'Imagica Theme Park',
      returnTrip: true,
    },
    tripDate: '2024-02-19',
    tripTime: '08:00',
    returnDate: '2024-02-19',
    passengers: 15,
    customerBudget: 9500,
    partnerEarning: 8550,
    commission: 950,
    urgency: 'medium',
    reason: 'Driver not available',
    postedAt: '2024-02-13T10:00:00',
    additionalNotes: 'Corporate team outing. Need punctual driver. AC mandatory.',
  },
];

const urgencyColors: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Flexible' },
};

export default function BrowseBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<typeof mockAvailableBookings[0] | null>(null);

  const filteredBookings = mockAvailableBookings.filter((booking) => {
    const matchesSearch =
      booking.bookingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.route.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.route.to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFrom = !filterFrom || booking.route.from.toLowerCase().includes(filterFrom.toLowerCase());
    const matchesType = filterType === 'all' || booking.bookingType === filterType;
    const matchesUrgency = filterUrgency === 'all' || booking.urgency === filterUrgency;
    return matchesSearch && matchesFrom && matchesType && matchesUrgency;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const posted = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/p2p"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Bookings</h1>
            <p className="text-gray-600">Find bookings to fulfill from other vendors</p>
          </div>
        </div>
        <Link
          href="/vendor/p2p/bookings/post"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Share Your Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="From city..."
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Types</option>
            <option value="Outstation Trip">Outstation</option>
            <option value="Pilgrimage Tour">Pilgrimage</option>
            <option value="Wedding Car">Wedding</option>
            <option value="Corporate Trip">Corporate</option>
            <option value="Goods Transport">Goods</option>
          </select>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Urgency</option>
            <option value="high">Urgent</option>
            <option value="medium">Medium</option>
            <option value="low">Flexible</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-gray-600">{filteredBookings.length} bookings available</p>

        {filteredBookings.map((booking) => {
          const urgency = urgencyColors[booking.urgency];

          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{booking.bookingType}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.bg} ${urgency.text}`}>
                        {urgency.label}
                      </span>
                      <span className="text-xs text-gray-500">• Posted {getTimeAgo(booking.postedAt)}</span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.route.from}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.route.to}</span>
                      {booking.route.returnTrip && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Round Trip</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.tripDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.tripTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        {booking.vehicleRequired}
                      </span>
                      {booking.passengers > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {booking.passengers} passengers
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
                      <AlertCircle className="w-3 h-3" />
                      {booking.reason}
                    </div>

                    {/* Notes */}
                    {booking.additionalNotes && (
                      <p className="text-sm text-gray-500 mt-3 italic">"{booking.additionalNotes}"</p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="lg:text-right lg:min-w-[200px]">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">You'll Earn</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(booking.partnerEarning)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Customer pays: {formatCurrency(booking.customerBudget)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Their commission: {formatCurrency(booking.commission)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="mt-3 w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Take This Booking
                    </button>
                  </div>
                </div>

                {/* Vendor Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {booking.vendorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.vendorName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {booking.vendorRating}
                        </span>
                        <span>•</span>
                        <span>{booking.vendorTrips} trips</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${booking.vendorPhone}`}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                    </a>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      {/* Accept Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Accept Booking</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedBooking.bookingType}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBooking.route.from} → {selectedBooking.route.to}
                  {selectedBooking.route.returnTrip && ' (Round Trip)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Trip Date</p>
                  <p className="font-medium">{formatDate(selectedBooking.tripDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup Time</p>
                  <p className="font-medium">{selectedBooking.tripTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Required</p>
                  <p className="font-medium">{selectedBooking.vehicleRequired}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="font-medium">{selectedBooking.passengers || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Vehicle *
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Choose from your fleet</option>
                  <option value="1">Tempo Traveller 17-Seater (MH02AB1234)</option>
                  <option value="2">Volvo Bus 45-Seater (MH04CD5678)</option>
                  <option value="3">Innova Crysta (MH12EF9012)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Driver
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Select driver</option>
                  <option value="1">Rajesh Kumar (+91 98765 43210)</option>
                  <option value="2">Suresh Patil (+91 98765 43211)</option>
                </select>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Your Earning</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedBooking.partnerEarning)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Payment will be processed after trip completion
                </p>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <p className="text-sm text-gray-600">
                  I confirm that I have a suitable vehicle and driver available for this booking.
                  I understand that cancellation after acceptance may affect my P2P rating.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Accept Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
