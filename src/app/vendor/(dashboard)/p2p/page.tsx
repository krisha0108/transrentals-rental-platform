'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  CalendarCheck,
  ArrowRightLeft,
  TrendingUp,
  MapPin,
  Clock,
  IndianRupee,
  Plus,
  Eye,
  Users,
  Truck,
  Bus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Send,
  Inbox,
  Star,
  Phone,
  MessageSquare,
} from 'lucide-react';

// Mock P2P Stats
const p2pStats = {
  vehiclesPosted: 5,
  vehicleRequests: 3,
  bookingsShared: 8,
  bookingsReceived: 12,
  totalEarnings: 125000,
  totalPayouts: 85000,
  activeListings: 4,
  pendingRequests: 2,
};

// Mock Available Vehicles (from other vendors)
const mockAvailableVehicles = [
  {
    id: '1',
    vendorName: 'Krishna Travels',
    vendorRating: 4.7,
    vehicleType: 'Tempo Traveller',
    vehicle_models: 'Force Traveller 12-Seater',
    registrationNumber: 'MH04XX1234',
    route: {
      from: 'Pune',
      to: 'Mumbai',
    },
    availableDate: '2024-02-15',
    availableTime: '14:00',
    expectedArrival: '17:00',
    price: 3500,
    status: 'available',
    postedAt: '2024-02-13T10:30:00',
  },
  {
    id: '2',
    vendorName: 'Sharma Transport',
    vendorRating: 4.5,
    vehicleType: 'Mini Truck',
    vehicle_models: 'Tata Ace',
    registrationNumber: 'MH12YY5678',
    route: {
      from: 'Nashik',
      to: 'Mumbai',
    },
    availableDate: '2024-02-16',
    availableTime: '09:00',
    expectedArrival: '13:00',
    price: 2500,
    status: 'available',
    postedAt: '2024-02-13T08:00:00',
  },
  {
    id: '3',
    vendorName: 'Royal Cars',
    vendorRating: 4.8,
    vehicleType: 'Sedan',
    vehicle_models: 'Honda City',
    registrationNumber: 'MH02ZZ9012',
    route: {
      from: 'Mumbai',
      to: 'Lonavala',
    },
    availableDate: '2024-02-15',
    availableTime: '18:00',
    expectedArrival: '20:00',
    price: 1500,
    status: 'available',
    postedAt: '2024-02-12T16:00:00',
  },
];

// Mock Available Bookings (from other vendors)
const mockAvailableBookings = [
  {
    id: '1',
    vendorName: 'Shree Tours',
    vendorRating: 4.6,
    bookingType: 'Bus Charter',
    vehicleRequired: '45-Seater Bus',
    route: {
      from: 'Mumbai',
      to: 'Shirdi',
      returnTrip: true,
    },
    tripDate: '2024-02-20',
    tripTime: '05:00',
    passengers: 42,
    customerBudget: 25000,
    commission: 2500,
    urgency: 'high',
    postedAt: '2024-02-13T09:00:00',
    reason: 'Vehicle under maintenance',
  },
  {
    id: '2',
    vendorName: 'Metro Cabs',
    vendorRating: 4.4,
    bookingType: 'Outstation Trip',
    vehicleRequired: 'Sedan/SUV',
    route: {
      from: 'Mumbai',
      to: 'Goa',
      returnTrip: false,
    },
    tripDate: '2024-02-18',
    tripTime: '06:00',
    passengers: 3,
    customerBudget: 8500,
    commission: 850,
    urgency: 'medium',
    postedAt: '2024-02-13T11:00:00',
    reason: 'No vehicle available',
  },
  {
    id: '3',
    vendorName: 'Express Logistics',
    vendorRating: 4.3,
    bookingType: 'Goods Transport',
    vehicleRequired: 'Truck 14ft',
    route: {
      from: 'Thane',
      to: 'Pune',
      returnTrip: false,
    },
    tripDate: '2024-02-17',
    tripTime: '08:00',
    passengers: 0,
    customerBudget: 12000,
    commission: 1200,
    urgency: 'low',
    postedAt: '2024-02-12T14:00:00',
    reason: 'Overbooked',
  },
];

// Mock My Activity
const mockMyActivity = [
  {
    id: '1',
    type: 'vehicle_shared',
    vehicleType: 'Tempo Traveller',
    route: 'Pune → Mumbai',
    date: '2024-02-10',
    partnerVendor: 'Metro Tours',
    amount: 3000,
    status: 'completed',
  },
  {
    id: '2',
    type: 'booking_received',
    bookingType: 'Wedding Car',
    route: 'Mumbai → Pune',
    date: '2024-02-08',
    partnerVendor: 'Royal Weddings',
    amount: 15000,
    commission: 1500,
    status: 'completed',
  },
  {
    id: '3',
    type: 'booking_shared',
    bookingType: 'Corporate Trip',
    route: 'Mumbai → Lonavala',
    date: '2024-02-12',
    partnerVendor: 'Sharma Travels',
    amount: 8000,
    commission: 800,
    status: 'in_progress',
  },
];

export default function P2PDashboardPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'bookings'>('vehicles');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Urgent</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Flexible</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">P2P Marketplace</h1>
          <p className="text-gray-600 mt-1">Share vehicles & bookings with other vendors</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendor/p2p/vehicles/post"
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            <Car className="w-5 h-5" />
            Post Vehicle
          </Link>
          <Link
            href="/vendor/p2p/bookings/post"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <CalendarCheck className="w-5 h-5" />
            Share Booking
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{p2pStats.activeListings}</p>
              <p className="text-xs text-gray-500">Active Vehicle Listings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{p2pStats.bookingsReceived}</p>
              <p className="text-xs text-gray-500">Bookings Received</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(p2pStats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">P2P Earnings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{p2pStats.pendingRequests}</p>
              <p className="text-xs text-gray-500">Pending Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* How P2P Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-4">How P2P Marketplace Works</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Share Empty Vehicles</h4>
              <p className="text-sm text-gray-600 mt-1">
                When your vehicle is returning empty on a route, post it here. Other vendors can use it and pay you for the trip.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Share Bookings</h4>
              <p className="text-sm text-gray-600 mt-1">
                Got a booking but no vehicle? Post it here with your commission. Other vendors fulfill it and you earn commission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'vehicles'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Car className="w-5 h-5" />
              Available Vehicles ({mockAvailableVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'bookings'
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
              Available Bookings ({mockAvailableBookings.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Empty Vehicles Near You</h3>
                <Link
                  href="/vendor/p2p/vehicles"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {mockAvailableVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{vehicle.vehicle_models}</h4>
                        <span className="text-xs text-gray-500">by {vehicle.vendorName}</span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs">{vehicle.vendorRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {vehicle.route.from} → {vehicle.route.to}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {vehicle.availableDate} at {vehicle.availableTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">{formatCurrency(vehicle.price)}</p>
                      <p className="text-xs text-gray-500">for the route</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                      Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Bookings Available to Fulfill</h3>
                <Link
                  href="/vendor/p2p/bookings"
                  className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {mockAvailableBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <CalendarCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{booking.bookingType}</h4>
                          {getUrgencyBadge(booking.urgency)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          by {booking.vendorName} • <Star className="w-3 h-3 inline text-yellow-500 fill-current" /> {booking.vendorRating}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.route.from} → {booking.route.to}
                            {booking.route.returnTrip && ' (Round Trip)'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.tripDate} at {booking.tripTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            {booking.vehicleRequired}
                          </span>
                        </div>
                        <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded inline-block">
                          Reason: {booking.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(booking.customerBudget)}</p>
                      <p className="text-sm text-green-600">
                        +{formatCurrency(booking.commission)} commission
                      </p>
                      <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                        Take Booking
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">My P2P Activity</h3>
          <Link
            href="/vendor/p2p/activity"
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {mockMyActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'vehicle_shared' ? 'bg-blue-100' :
                  activity.type === 'booking_received' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'vehicle_shared' ? (
                    <Car className={`w-5 h-5 text-blue-600`} />
                  ) : activity.type === 'booking_received' ? (
                    <Inbox className={`w-5 h-5 text-green-600`} />
                  ) : (
                    <Send className={`w-5 h-5 text-purple-600`} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.type === 'vehicle_shared' ? 'Vehicle Shared' :
                     activity.type === 'booking_received' ? 'Booking Received' : 'Booking Shared'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.route} • {activity.date} • with {activity.partnerVendor}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(activity.amount)}</p>
                {activity.commission && (
                  <p className="text-xs text-gray-500">Commission: {formatCurrency(activity.commission)}</p>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
