'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  IndianRupee,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Send,
  X,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleType: string;
  vehicleName: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  tripType: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
  amount: number;
  quotedAmount?: number;
  createdAt: string;
  notes?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  quoted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Quote Sent' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
  ongoing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Ongoing' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

export default function VendorBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/vendor/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedBooking || !quoteAmount) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/vendor/bookings/${selectedBooking.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          notes: quoteNotes,
        }),
      });

      if (response.ok) {
        fetchBookings();
        setShowQuoteModal(false);
        setSelectedBooking(null);
        setQuoteAmount('');
        setQuoteNotes('');
      }
    } catch (error) {
      console.error('Failed to send quote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to accept booking:', error);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/vendor/bookings/${bookingId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to complete booking:', error);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'quoted', label: 'Quoted', count: bookings.filter(b => b.status === 'quoted').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'ongoing', label: 'Ongoing', count: bookings.filter(b => b.status === 'ongoing').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'all', label: 'All', count: bookings.length },
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesTab = activeTab === 'all' || booking.status === activeTab;
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
        <p className="text-gray-600 mt-1">Manage and respond to customer booking requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {bookings.filter(b => b.status === 'quoted').length}
              </p>
              <p className="text-sm text-blue-600">Quoted</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length}
              </p>
              <p className="text-sm text-green-600">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500">
            {activeTab === 'all'
              ? "You don't have any bookings yet."
              : `No ${activeTab} bookings at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        #{booking.bookingNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status].bg} ${statusColors[booking.status].text}`}>
                        {statusColors[booking.status].label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{booking.customerPhone}</span>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span>{booking.vehicleName || booking.vehicleType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {booking.tripType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Pickup</p>
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span>{booking.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(booking.pickupDate)} at {booking.pickupTime}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Drop</p>
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>{booking.dropLocation || booking.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(booking.dropDate)} at {booking.dropTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    {booking.quotedAmount ? (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Your Quote</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{booking.quotedAmount.toLocaleString()}
                        </p>
                      </div>
                    ) : booking.amount ? (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Customer Budget</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{booking.amount.toLocaleString()}
                        </p>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowQuoteModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Send Quote
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleMarkComplete(booking.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Send Quote</h2>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedBooking(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Booking</p>
                <p className="font-medium">#{selectedBooking.bookingNumber}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedBooking.customerName} • {selectedBooking.vehicleType}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Amount (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="Enter your quote"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes or terms..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedBooking(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuote}
                disabled={!quoteAmount || submitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
