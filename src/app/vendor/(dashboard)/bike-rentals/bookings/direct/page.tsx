'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Phone,
  Bike,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Timer,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AcceptBookingModal } from '@/components/vendor/AcceptBookingModal';

interface VehicleOption {
  id: string;
  name: string;
  registrationNumber?: string;
  dailyRate: number;
  fleetPricing: any[];
  fleetLocations: any[];
}

interface DirectBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  vehicleBrand: string;
  chauffeur_vehicle_categories: string;
  vehicleId: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  status: string;
  responseDeadline: string;
  createdAt: string;
  customerNotes: string;
}

export default function VendorDirectRequestsPage() {
  const [bookings, setBookings] = useState<DirectBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<DirectBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/bike-bookings?type=direct');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch bookings');
        return;
      }

      setBookings(data.bookings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching direct bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Fetch vendor fleet for accept modal
    const fetchFleet = async () => {
      const fleetRes = await fetch('/api/vendor/fleet?serviceSlug=bike-rental');
      if (fleetRes.ok) {
        const fleetData = await fleetRes.json();
        setVendorFleet(
          fleetData.fleet?.map((f: any) => ({
            id: f.id,
            name: f.vehicle_models?.name || 'Unknown',
            registrationNumber: f.registrationNumber,
            dailyRate: f.fleetPricing?.[0]?.perDayRate || f.fleetPricing?.[0]?.basePrice || 0,
            fleetPricing: f.fleetPricing || [],
            fleetLocations: f.fleetLocations || [],
          })) || []
        );
      }
    };
    fetchFleet();
  }, []);

  const getTimeRemaining = (deadline: string) => {
    if (!deadline) return 'No deadline';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const handleAcceptBooking = async (data: {
    vehicleId: string;
    vehicleName: string;
    customRate?: number;
  }) => {
    if (!selectedBooking) return;

    const res = await fetch(`/api/vendor/bike-bookings/${selectedBooking.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      const error = new Error(result.error || 'Failed to accept booking');
      (error as any).status = res.status;
      throw error;
    }

    alert(`Booking ${selectedBooking.bookingNumber} accepted! Customer will be notified.`);
    setAcceptModalOpen(false);
    fetchBookings();
  };

  const handleReject = (booking: DirectBooking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedBooking) return;

    setActionLoading(selectedBooking.id);
    try {
      const res = await fetch(`/api/vendor/bike-bookings/${selectedBooking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Booking ${selectedBooking.bookingNumber} rejected. It will be broadcasted to other vendors.`
        );
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedBooking(null);
        fetchBookings();
      } else {
        alert(data.error || 'Failed to reject booking');
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Bookings</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchBookings}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accept Booking Modal */}
      <AcceptBookingModal
        isOpen={acceptModalOpen}
        onClose={() => {
          setAcceptModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking ? {
          id: selectedBooking.id,
          bookingNumber: selectedBooking.bookingNumber,
          customerName: selectedBooking.customerName,
          customerPhone: selectedBooking.customerPhone,
          vehicleName: selectedBooking.vehicleName,
          pickupDate: selectedBooking.pickupDate,
          pickupTime: selectedBooking.pickupTime,
          dropDate: selectedBooking.dropDate,
          dropTime: selectedBooking.dropTime,
          locationId: selectedBooking.locationId,
          locationName: selectedBooking.locationName,
          totalDays: selectedBooking.totalDays,
          dailyRate: selectedBooking.dailyRate,
          totalAmount: selectedBooking.totalAmount,
          type: 'direct'
        } : null}
        vehicles={vendor_fleet}
        onAccept={handleAcceptBooking}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/bike-rentals/bookings"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Direct Requests</h1>
            <p className="text-gray-600">Bookings for your specific vehicles - respond within 2 hours</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Alert */}
      {bookings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800">Action Required</h3>
            <p className="text-orange-700 text-sm">
              You have {bookings.length} pending request{bookings.length > 1 ? 's' : ''}. Respond within the deadline or
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
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Vehicle</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bike className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.vehicleBrand} {booking.vehicleName}
                            </p>
                            <p className="text-sm text-gray-500">{booking.vehicle_category}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Trip Duration</h4>
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(booking.pickupDate)} → {formatDate(booking.dropDate)}
                            </p>
                          </div>
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
                  <div className="lg:w-72 space-y-4">
                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            ₹{booking.dailyRate} × {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}
                          </span>
                          <span>₹{booking.totalAmount}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                          <span>Total</span>
                          <span className="text-green-600">₹{booking.grandTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setAcceptModalOpen(true);
                        }}
                        disabled={actionLoading === booking.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {actionLoading === booking.id ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Accept Booking
                      </Button>
                      <Button
                        onClick={() => handleReject(booking)}
                        disabled={actionLoading === booking.id}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        size="lg"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject
                      </Button>
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
              broadcasted to other vendors in the location.
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
                <option value="vehicle_unavailable">Vehicle not available</option>
                <option value="maintenance">Vehicle under maintenance</option>
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
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmReject}
                disabled={actionLoading === selectedBooking.id}
              >
                {actionLoading === selectedBooking.id ? (
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
