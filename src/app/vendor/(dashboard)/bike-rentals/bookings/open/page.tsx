'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  MapPin,
  User,
  Phone,
  Bike,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Radio,
  Zap,
  IndianRupee,
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

interface OpenBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleName: string;
  vehicleBrand: string;
  chauffeur_vehicle_categories: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  grandTotal: number;
  status: string;
  broadcastedAt: string;
  createdAt: string;
  customerNotes: string;
}

interface VendorVehicle {
  id: string;
  name: string;
  registrationNumber: string | null;
  dailyRate: number;
  vehicle_model?: {
    name: string;
    brand: { name: string };
  };
}

export default function VendorOpenRequestsPage() {
  const [bookings, setBookings] = useState<OpenBooking[]>([]);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OpenBooking | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch open bookings
      const bookingsRes = await fetch('/api/vendor/bike-bookings?type=open');
      const bookingsData = await bookingsRes.json();

      if (!bookingsRes.ok) {
        setError(bookingsData.error || 'Failed to fetch bookings');
        return;
      }

      setBookings(bookingsData.bookings || []);

      // Fetch vendor fleet
      const fleetRes = await fetch('/api/vendor/fleet?serviceSlug=bike-rental');
      if (fleetRes.ok) {
        const fleetData = await fleetRes.json();
        setVendorFleet(
          fleetData.fleet?.map((f: any) => ({
            id: f.id,
            name: `${f.vehicle_models?.brand?.name || f.brand?.name || ''} ${f.vehicle_models?.name || 'Unknown'}`.trim(),
            registrationNumber: f.registrationNumber,
            dailyRate: f.fleetPricing?.[0]?.perDayRate || f.fleetPricing?.[0]?.basePrice || 0,
            fleetPricing: f.fleetPricing || [],
            fleetLocations: f.fleetLocations || [],
          })) || []
        );
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptBooking = async (data: {
    vehicleId: string;
    vehicleName: string;
    customRate?: number;
  }) => {
    if (!selectedRequest) return;

    const res = await fetch(`/api/vendor/bike-bookings/${selectedRequest.id}/accept`, {
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

    alert(`Interest shown for ${selectedRequest.bookingNumber}! Customer will be notified.`);
    setAcceptModalOpen(false);
    setSelectedRequest(null);
    fetchData();
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
        <Button onClick={fetchData}>Try Again</Button>
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
          setSelectedRequest(null);
        }}
        booking={selectedRequest ? {
          id: selectedRequest.id,
          bookingNumber: selectedRequest.bookingNumber,
          customerName: selectedRequest.customerName,
          customerPhone: selectedRequest.customerPhone,
          vehicleName: selectedRequest.vehicleName,
          pickupDate: selectedRequest.pickupDate,
          pickupTime: selectedRequest.pickupTime,
          dropDate: selectedRequest.dropDate,
          dropTime: selectedRequest.dropTime,
          locationId: selectedRequest.locationId,
          locationName: selectedRequest.locationName,
          totalDays: selectedRequest.totalDays,
          dailyRate: selectedRequest.dailyRate,
          totalAmount: selectedRequest.totalAmount,
          type: 'open'
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
            <h1 className="text-2xl font-bold text-gray-900">Open Requests</h1>
            <p className="text-gray-600">Broadcasted bookings - show interest to win customers</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Radio className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-800">How Open Requests Work</h3>
          <p className="text-blue-700 text-sm">
            These are bookings that were either rejected by other vendors or are generic requests.
            Show interest with your best offer - the customer will choose from all interested vendors.
          </p>
        </div>
      </div>

      {/* Requests List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No open requests</h3>
          <p className="text-gray-500">Check back later for new opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((request) => {
            const matchingBikes = vendor_fleet.filter(bike => bike.dailyRate > 0);
            const hasMatchingBikes = matchingBikes.length > 0;

            return (
              <div
                key={request.id}
                className={cn(
                  'bg-white rounded-xl shadow-sm border overflow-hidden',
                  hasMatchingBikes ? 'border-green-200' : 'border-gray-100'
                )}
              >
                {/* Status Banner */}
                <div
                  className={cn(
                    'px-6 py-3 flex items-center justify-between',
                    hasMatchingBikes
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {hasMatchingBikes ? (
                      <>
                        <Zap className="w-5 h-5" />
                        <span className="font-medium">
                          You have {matchingBikes.length} bike{matchingBikes.length > 1 ? 's' : ''} available!
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">No bikes available in your fleet</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Request Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900">
                          #{request.bookingNumber}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Open Request
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{request.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{request.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{request.locationName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Request */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Vehicle Request</h4>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Bike className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.vehicleBrand} {request.vehicleName}
                            </p>
                            <p className="text-sm text-gray-500">{request.vehicle_category}</p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">Location</span>
                          </div>
                          <p className="font-medium text-gray-900">{request.locationName}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <CalendarCheck className="w-4 h-4" />
                            <span className="text-sm">Duration</span>
                          </div>
                          <p className="font-medium text-gray-900">{request.totalDays} Day{request.totalDays > 1 ? 's' : ''}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.pickupDate)} → {formatDate(request.dropDate)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-sm">Budget</span>
                          </div>
                          <p className="font-medium text-gray-900">₹{request.grandTotal}</p>
                          <p className="text-xs text-gray-500">
                            ~₹{Math.round(request.grandTotal / request.totalDays)}/day
                          </p>
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {request.customerNotes && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">Customer Notes</h4>
                          <p className="text-sm text-gray-700">{request.customerNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Matching Bikes & Actions */}
                    <div className="lg:w-80 space-y-4">
                      {/* Your Available Bikes */}
                      {hasMatchingBikes && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Your Available Bikes</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {matchingBikes.slice(0, 5).map((bike: any) => (
                              <div
                                key={bike.id}
                                className="flex items-center justify-between bg-white rounded-lg p-3"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{bike.name}</p>
                                  {bike.registrationNumber && (
                                    <p className="text-xs text-gray-500">{bike.registrationNumber}</p>
                                  )}
                                </div>
                                <p className="font-semibold text-green-600">₹{bike.dailyRate}/day</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Potential Earnings */}
                      {hasMatchingBikes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">Potential Earnings</h4>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{Math.round(matchingBikes[0].dailyRate * request.totalDays * 0.85)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Based on {matchingBikes[0].name} for {request.totalDays} day{request.totalDays > 1 ? 's' : ''} (after 15% fee)
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setAcceptModalOpen(true);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Show Interest
                      </Button>
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
