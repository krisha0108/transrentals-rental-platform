'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
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
      <div className="space-y-5">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="space-y-2"><div className="h-5 w-36 bg-gray-200 rounded-lg" /><div className="h-3 w-56 bg-gray-100 rounded" /></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-10 bg-orange-100" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2"><div className="h-5 w-28 bg-gray-200 rounded-lg" /><div className="h-5 w-24 bg-amber-100 rounded-full" /></div>
                <div className="flex gap-3"><div className="h-3 w-24 bg-gray-100 rounded" /><div className="h-3 w-28 bg-gray-100 rounded" /></div>
                <div className="grid grid-cols-2 gap-3"><div className="h-20 bg-gray-50 rounded-xl" /><div className="h-20 bg-gray-50 rounded-xl" /></div>
                <div className="flex gap-2"><div className="h-10 flex-1 bg-emerald-100 rounded-xl" /><div className="h-10 flex-1 bg-gray-100 rounded-xl" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Error Loading Bookings</h3>
        <p className="text-gray-400 text-sm mb-5">{error}</p>
        <button onClick={fetchBookings} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Accept Booking Modal */}
      <AcceptBookingModal
        isOpen={acceptModalOpen}
        onClose={() => { setAcceptModalOpen(false); setSelectedBooking(null); }}
        booking={selectedBooking ? {
          id: selectedBooking.id, bookingNumber: selectedBooking.bookingNumber,
          customerName: selectedBooking.customerName, customerPhone: selectedBooking.customerPhone,
          vehicleName: selectedBooking.vehicleName, pickupDate: selectedBooking.pickupDate,
          pickupTime: selectedBooking.pickupTime, dropDate: selectedBooking.dropDate,
          dropTime: selectedBooking.dropTime, locationId: selectedBooking.locationId,
          locationName: selectedBooking.locationName, totalDays: selectedBooking.totalDays,
          dailyRate: selectedBooking.dailyRate, totalAmount: selectedBooking.totalAmount, type: 'direct',
        } : null}
        vehicles={vendor_fleet}
        onAccept={handleAcceptBooking}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/vendor/bike-rentals/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Direct Requests</h1>
            <p className="text-xs text-gray-400">Respond within 2 hours to keep these bookings</p>
          </div>
        </div>
        <button onClick={fetchBookings} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* ── Alert ── */}
      {bookings.length > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border-l-4 border-l-orange-400 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">
            <strong className="font-bold">{bookings.length}</strong> pending request{bookings.length > 1 ? 's' : ''} — respond before deadline or they&apos;ll go to other vendors
          </p>
        </div>
      )}

      {/* ── Requests List ── */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-gray-700 font-bold text-sm">All caught up!</p>
          <p className="text-gray-400 text-xs mt-1">No pending direct requests at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const timeLeft = getTimeRemaining(booking.responseDeadline);
            const isExpired = timeLeft === 'Expired';

            return (
              <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
                {/* Deadline strip */}
                <div className={`px-5 py-2.5 flex items-center justify-between text-sm ${isExpired ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'} text-white`}>
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    <span className="font-bold text-xs">{timeLeft}</span>
                  </div>
                  <span className="text-[11px] opacity-80">Respond to keep this booking</span>
                </div>

                <div className="p-5">
                  {/* Top row: Booking# + Vehicle + Price */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🏍️</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm">#{booking.bookingNumber}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">Awaiting Response</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-1">{booking.vehicleBrand} {booking.vehicleName}</p>
                        {booking.chauffeur_vehicle_categories && <p className="text-xs text-gray-400">{booking.chauffeur_vehicle_categories}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-gray-900">₹{booking.grandTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">₹{booking.dailyRate}/day × {booking.totalDays}d</p>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1 font-medium text-gray-700"><User className="w-3 h-3 text-gray-400" /> {booking.customerName}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {booking.locationName}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3 text-gray-400" />
                      {formatDate(booking.pickupDate)} → {formatDate(booking.dropDate)}
                    </span>
                    <span className="font-semibold text-orange-600">({booking.totalDays}d)</span>
                  </div>

                  {/* Customer Notes */}
                  {booking.customerNotes && (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
                      <p className="text-xs text-gray-600"><span className="font-bold text-amber-700">Note:</span> {booking.customerNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3.5 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedBooking(booking); setAcceptModalOpen(true); }}
                      disabled={actionLoading === booking.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-emerald-500/20"
                    >
                      {actionLoading === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(booking)}
                      disabled={actionLoading === booking.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-500 font-semibold rounded-xl text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <Link href={`/vendor/bike-rentals/bookings/${booking.id}`} className="flex items-center justify-center w-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all">
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedBooking(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <h2 className="text-base font-bold text-gray-900">Reject Booking</h2>
              <p className="text-xs text-gray-500 mt-0.5">#{selectedBooking.bookingNumber} will be broadcasted to other vendors</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rejection Reason (optional)</label>
                <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-300 transition-all bg-white">
                  <option value="">Select a reason...</option>
                  <option value="vehicle_unavailable">Vehicle not available</option>
                  <option value="maintenance">Vehicle under maintenance</option>
                  <option value="already_booked">Already booked for these dates</option>
                  <option value="location_issue">Cannot serve this location</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedBooking(null); }} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button onClick={confirmReject} disabled={actionLoading === selectedBooking.id} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95">
                  {actionLoading === selectedBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
