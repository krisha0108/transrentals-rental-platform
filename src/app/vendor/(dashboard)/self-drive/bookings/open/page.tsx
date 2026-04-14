'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  MapPin,
  User,
  Car,
  CheckCircle,
  ArrowLeft,
  Radio,
  Filter,
  Search,
  Fuel,
  Settings2,
  Users,
  Loader2,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  locationName: string;
  requestedCategory: string;
  requestedSeats: number;
  requestedTransmission: string;
  requestedFuelType: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  grandTotal: number;
  status: string;
  broadcastedAt: string;
  customerNotes: string;
}

export default function VendorSelfDriveOpenRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/vendor/self-drive-bookings?type=open');
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (booking: Booking) => {
    setProcessing(booking.id);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Booking ${booking.bookingNumber} accepted!`);
        setBookings(bookings.filter(b => b.id !== booking.id));
      } else {
        alert(data.error || data.message || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Accept failed:', error);
      alert('Failed to accept booking');
    } finally {
      setProcessing(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesCategory = filterCategory === 'all' || booking.requestedCategory === filterCategory;
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/self-drive/bookings"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open Requests</h1>
          <p className="text-gray-600">Browse and accept available car bookings in your area</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <Radio className="w-5 h-5 text-emerald-500 mt-0.5" />
        <div>
          <h3 className="font-semibold text-emerald-800">How Open Requests Work</h3>
          <p className="text-emerald-700 text-sm">
            These are bookings that are open to all vendors in the area. First vendor to accept wins the booking.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking number, customer, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MUV">MUV</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No open requests</h3>
          <p className="text-gray-500">No matching open requests available at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Request Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-gray-900">
                        #{booking.bookingNumber}
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        Open Request
                      </span>
                    </div>

                    {/* Customer & Location */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.locationName}</span>
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="font-semibold text-gray-900">{booking.requestedCategory || 'Any'}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Seats</p>
                        <p className="font-semibold text-gray-900">{booking.requestedSeats || 5} Seater</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900">{booking.totalDays} Days</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Daily Rate</p>
                        <p className="font-semibold text-gray-900">₹{booking.dailyRate?.toLocaleString() || 'TBD'}</p>
                      </div>
                    </div>

                    {/* Vehicle Preferences */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {booking.requestedTransmission && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                          <Settings2 className="w-3 h-3" />
                          {booking.requestedTransmission}
                        </span>
                      )}
                      {booking.requestedFuelType && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                          <Fuel className="w-3 h-3" />
                          {booking.requestedFuelType}
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarCheck className="w-4 h-4" />
                      <span>
                        {new Date(booking.pickupDate).toLocaleDateString()} ({booking.pickupTime}) →{' '}
                        {new Date(booking.dropDate).toLocaleDateString()} ({booking.dropTime})
                      </span>
                    </div>

                    {/* Customer Notes */}
                    {booking.customerNotes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Customer Notes</p>
                        <p className="text-sm text-gray-700">{booking.customerNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Section */}
                  <div className="lg:w-72 space-y-4">
                    {/* Potential Earnings */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">Potential Earnings</h4>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{Math.round((booking.grandTotal || booking.dailyRate * booking.totalDays) * 0.85).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">After 15% platform fee</p>
                    </div>

                    {/* Total Amount */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">Booking Value</h4>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{(booking.grandTotal || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Total booking amount</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleAccept(booking)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                        disabled={processing === booking.id}
                      >
                        {processing === booking.id ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Accept Booking
                      </Button>
                      <Link href={`/vendor/self-drive/bookings/${booking.id}`}>
                        <Button
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
