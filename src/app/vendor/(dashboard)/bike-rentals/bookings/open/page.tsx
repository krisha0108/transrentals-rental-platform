'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  MapPin,
  User,
  Bike,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Radio,
  Zap,
  IndianRupee,
  Loader2,
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  Radar,
  Info,
  Activity,
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
  numberOfVehicles?: number;
  pickupAddress?: string;
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
      <div className="space-y-8 animate-pulse pb-10">
        {/* Header Skeleton */}
        <div className="h-32 w-full rounded-3xl bg-slate-100/80"></div>

        {/* Info Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-1 h-32 rounded-3xl bg-slate-100/80"></div>
          <div className="h-32 rounded-3xl bg-slate-100/80"></div>
          <div className="h-32 rounded-3xl bg-slate-100/80"></div>
          <div className="h-32 rounded-3xl bg-slate-100/80"></div>
        </div>

        {/* Bookings Skeleton List */}
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col lg:flex-row h-auto lg:h-64 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="flex-1 p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 w-1/2">
                    <div className="h-6 w-24 rounded-full bg-slate-100"></div>
                    <div className="h-8 w-64 rounded-xl bg-slate-100"></div>
                    <div className="h-5 w-32 rounded-md bg-slate-50"></div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="h-4 w-12 rounded-sm bg-slate-100"></div>
                    <div className="h-10 w-32 rounded-xl bg-slate-100"></div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-3 w-16 rounded-sm bg-slate-100"></div>
                      <div className="h-4 w-32 rounded-md bg-slate-100"></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-3 w-16 rounded-sm bg-slate-100"></div>
                      <div className="h-4 w-32 rounded-md bg-slate-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-80 p-6 md:p-8 bg-slate-50/50 flex flex-col justify-between border-l border-slate-100">
                <div className="space-y-6">
                  <div className="h-4 w-32 rounded-md bg-slate-200/50"></div>
                  <div className="space-y-4 ml-6">
                    <div className="h-10 w-full rounded-md bg-slate-200/50"></div>
                    <div className="h-10 w-full rounded-md bg-slate-200/50"></div>
                  </div>
                </div>
                <div className="mt-8 h-12 w-full rounded-xl bg-slate-200/80"></div>
              </div>
            </div>
          ))}
        </div>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
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

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-1000 hover:scale-150"></div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-600 shadow-lg shadow-emerald-500/30 text-white">
              <Radar className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Open Requests</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Broadcasted bookings — show interest to win customers.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-xs font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Matches appear automatically
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="h-9 hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 md:col-span-2 lg:col-span-1 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both hover:-translate-y-1 transition-transform">
          <h2 className="text-lg font-bold text-slate-900 mb-2">How it works</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            These are generic or unfulfilled bookings. Submit your best offer quickly—customers review all interested vendors.
          </p>
        </div>
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Submit early</h3>
          <p className="text-sm text-slate-500">Respond quickly to keep your offer competitive.</p>
        </div>
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">See fit instantly</h3>
          <p className="text-sm text-slate-500">View how many bikes match this request.</p>
        </div>
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-500/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-both">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-transform duration-500 group-hover:scale-110">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No match yet?</h3>
          <p className="text-sm text-slate-500">Keep monitoring open requests for better fits.</p>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500 delay-500 fill-mode-both">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 transition-transform hover:scale-110">
            <Radar className="h-8 w-8 text-emerald-300 animate-[spin_3s_linear_infinite]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No open requests</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Matches in your service area will appear here automatically. Keep your fleet ready.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((request, index) => {
            const matchingBikes = vendor_fleet.filter(bike => bike.dailyRate > 0);
            const hasMatchingBikes = matchingBikes.length > 0;

            return (
              <div
                key={request.id}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 fill-mode-both",
                  hasMatchingBikes ? "border-emerald-200 ring-1 ring-emerald-50 hover:shadow-emerald-500/10" : "border-slate-200 hover:shadow-emerald-500/5"
                )}
                style={{ animationDelay: `${500 + index * 150}ms` }}
              >
                {/* Top matching banner */}
                <div
                  className={cn(
                    'flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider',
                    hasMatchingBikes ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  )}
                >
                  {hasMatchingBikes ? (
                    <><Sparkles className="w-3.5 h-3.5" /> You have {matchingBikes.length} bike{matchingBikes.length > 1 ? 's' : ''} available!</>
                  ) : (
                    <><Info className="w-3.5 h-3.5" /> No bikes available in your fleet</>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  {/* Left Column: Core Request Info */}
                  <div className="flex-1 p-6 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-700/10">
                            <Activity className="w-3 h-3" />
                            OPEN MATCH
                          </span>
                          <span className="text-xs font-semibold text-slate-400">#{request.bookingNumber}</span>
                        </div>
                        <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 tracking-tight">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500">
                            <Bike className="w-4 h-4" />
                          </div>
                          <span>{request.vehicleBrand} {request.vehicleName}</span>
                        </h2>
                        <span className="inline-flex mt-2 items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-900/5">
                          {request.chauffeur_vehicle_categories}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Budget</span>
                        <div className="flex items-baseline gap-1 text-emerald-600">
                          <span className="text-lg font-semibold">₹</span>
                          <span className="text-4xl font-black tracking-tight">{request.grandTotal}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 mt-1">
                          ~₹{Math.round(request.grandTotal / request.totalDays)} / day
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{request.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{request.locationName}</p>
                          {request.pickupAddress && (
                            <p className="text-xs text-slate-500 mt-0.5">{request.pickupAddress}</p>
                          )}
                          {request.numberOfVehicles && request.numberOfVehicles > 1 && (
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5">{request.numberOfVehicles} bikes</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Action & Summary */}
                  <div className="w-full lg:w-80 p-6 md:p-8 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        Duration: {request.totalDays} Day{request.totalDays > 1 ? 's' : ''}
                      </p>
                      <div className="relative border-l-2 border-slate-200 ml-2 pl-4 py-1 space-y-4">
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-400 bg-white"></div>
                          <p className="text-xs font-medium text-slate-500">Pick-up</p>
                          <p className="text-sm font-bold text-slate-900">{formatDate(request.pickupDate)}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] bottom-1 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-white"></div>
                          <p className="text-xs font-medium text-slate-500">Drop-off</p>
                          <p className="text-sm font-bold text-slate-900">{formatDate(request.dropDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setAcceptModalOpen(true);
                        }}
                        size="lg"
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:translate-y-[-2px] hover:shadow-xl border-0"
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
