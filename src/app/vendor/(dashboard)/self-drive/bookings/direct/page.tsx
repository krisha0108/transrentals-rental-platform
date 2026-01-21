'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Timer,
  Fuel,
  Gauge,
  Settings2,
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
  customerEmail: string;
  customerPhone: string;
  requestedVehicleId: string;
  requestedVehicleName: string;
  requestedCategory: string;
  requestedTransmission: string;
  requestedFuelType: string;
  requestedSeats: number;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  baseAmount: number;
  gstAmount: number;
  platformFee: number;
  securityDeposit: number;
  grandTotal: number;
  kmLimitPerDay: number;
  extraKmRate: number;
  status: string;
  responseDeadline: string | null;
  createdAt: string;
  customerNotes: string;
}

export default function VendorSelfDriveDirectRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/vendor/self-drive-bookings?type=direct');
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

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return 'No deadline';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
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
        alert(`Booking ${booking.bookingNumber} accepted! Customer will be notified.`);
        // Remove from list
        setBookings(bookings.filter(b => b.id !== booking.id));
      } else {
        alert(data.error || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Accept failed:', error);
      alert('Failed to accept booking');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedBooking) return;
    setProcessing(selectedBooking.id);
    try {
      const res = await fetch(`/api/vendor/self-drive-bookings/${selectedBooking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Booking ${selectedBooking.bookingNumber} rejected. It will be broadcasted to other vendors.`);
        setBookings(bookings.filter(b => b.id !== selectedBooking.id));
      } else {
        alert(data.error || 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Reject failed:', error);
      alert('Failed to reject booking');
    } finally {
      setProcessing(null);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedBooking(null);
    }
  };

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
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/self-drive/bookings"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Direct Requests</h1>
          <p className="text-gray-600">Bookings for your specific cars - respond within 2 hours</p>
        </div>
      </div>

      {/* Alert */}
      {bookings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800">Action Required</h3>
            <p className="text-orange-700 text-sm">
              You have {bookings.length} pending requests. Respond within the deadline or
              the booking will be automatically broadcasted to other vendors.
            </p>
          </div>
        </div>
      )}

      {/* Requests List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending direct requests at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Deadline Banner */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-medium">{getTimeRemaining(booking.responseDeadline)}</span>
                </div>
                <span className="text-sm">Respond before deadline to keep this booking</span>
              </div>

              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Booking Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-900">
                        #{booking.bookingNumber}
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        Awaiting Response
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{booking.locationName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Trip Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Vehicle</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.requestedVehicleName}</p>
                            <p className="text-sm text-gray-500">{booking.requestedCategory}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Settings2 className="w-3 h-3" />
                            <span>{booking.requestedTransmission || 'Manual'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Fuel className="w-3 h-3" />
                            <span>{booking.requestedFuelType || 'Petrol'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="w-3 h-3" />
                            <span>{booking.requestedSeats || 5} Seats</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Trip Duration</h4>
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{booking.totalDays} Days</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.pickupDate).toLocaleDateString()} → {new Date(booking.dropDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                          <p>Pickup: {booking.pickupTime} | Drop: {booking.dropTime}</p>
                          <p className="mt-1">
                            <Gauge className="w-3 h-3 inline mr-1" />
                            {booking.kmLimitPerDay || 200} km/day free • ₹{booking.extraKmRate || 12}/extra km
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Notes */}
                    {booking.customerNotes && (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">Customer Notes</h4>
                        <p className="text-sm text-gray-700">{booking.customerNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Actions */}
                  <div className="lg:w-80 space-y-4">
                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            ₹{booking.dailyRate} × {booking.totalDays} days
                          </span>
                          <span>₹{(booking.baseAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Security Deposit</span>
                          <span>₹{(booking.securityDeposit || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                          <span>Total</span>
                          <span className="text-green-600">₹{(booking.grandTotal || 0).toLocaleString()}</span>
                        </div>
                      </div>
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
                      <Button
                        onClick={() => handleReject(booking)}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        size="lg"
                        disabled={processing === booking.id}
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject
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

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Booking</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject booking #{selectedBooking.bookingNumber}? It will be
              broadcasted to other vendors in {selectedBooking.locationName}.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason...</option>
                <option value="vehicle_unavailable">Car not available</option>
                <option value="maintenance">Car under maintenance</option>
                <option value="already_booked">Already booked for these dates</option>
                <option value="location_issue">Cannot serve this location</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedBooking(null);
                }}
                disabled={processing === selectedBooking.id}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmReject}
                disabled={processing === selectedBooking.id}
              >
                {processing === selectedBooking.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
