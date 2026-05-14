'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Building2, Car, Users, MapPin, Calendar, ArrowLeft, AlertCircle,
  Loader2, IndianRupee, Route, Phone, User, Shield, Clock, Fuel,
  CheckCircle, ChevronDown, ChevronUp, Truck, Send, KeyRound, Play,
  Flag, XCircle, MessageCircle, Edit3, Bike, Bus, Package, Wrench,
  Star, Sparkles, PartyPopper, StickyNote,
} from 'lucide-react';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN_FOR_QUOTES: { label: 'Open for Quotes', color: 'bg-emerald-100 text-emerald-700' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: 'bg-emerald-100 text-emerald-700' },
  SUPER_QUOTE_SENT: { label: 'Quote Sent to Customer', color: 'bg-emerald-100 text-emerald-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  TRIPS_CREATED: { label: 'Trips Created', color: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function VendorB2BBookingDetailPage({ params }: { params: { id: string } }) {
  const bookingId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const { isApproved, openVerificationModal } = useVendorVerification();
  const [booking, setBooking] = useState<any>(null);
  const [myQuotes, setMyQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Self-drive trip OTP states
  const [tripProcessing, setTripProcessing] = useState<string | null>(null); // tripCode being processed
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({}); // tripCode -> user input OTP
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null); // tripCode
  const [completeOdometerEnd, setCompleteOdometerEnd] = useState('');
  const [completeDamageNotes, setCompleteDamageNotes] = useState('');
  const [completeAdditionalCharges, setCompleteAdditionalCharges] = useState('');
  const [tripActionMsg, setTripActionMsg] = useState<{ tripCode: string; type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => { fetchData(); }, [bookingId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingRes, quotesRes] = await Promise.all([
        fetch(`/api/b2b/bookings/${bookingId}`),
        fetch(`/api/vendor/b2b-quotes?view=my`),
      ]);

      const bookingData = await bookingRes.json();
      const quotesData = await quotesRes.json();

      if (bookingData.status === 'success') {
        setBooking(bookingData.booking);
      } else {
        setError('Booking not found');
      }

      // Filter quotes for this booking
      if (quotesData.status === 'success' && quotesData.quotes) {
        const relevantQuotes = quotesData.quotes.filter((q: any) => q.bookingId === bookingId);
        setMyQuotes(relevantQuotes);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

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

  // === Self-drive trip action handlers ===
  const handleMarkArrived = async (tripCode: string) => {
    setTripProcessing(tripCode);
    setTripActionMsg(null);
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/driver-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'arrive' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTripActionMsg({ tripCode, type: 'success', msg: 'Arrived! OTP has been sent to the customer.' });
        fetchData();
      } else {
        setTripActionMsg({ tripCode, type: 'error', msg: data.error || 'Failed to mark arrival' });
      }
    } catch {
      setTripActionMsg({ tripCode, type: 'error', msg: 'Network error' });
    } finally {
      setTripProcessing(null);
    }
  };

  const handleResendOtp = async (tripCode: string) => {
    setTripProcessing(tripCode);
    setTripActionMsg(null);
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/driver-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_otp' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTripActionMsg({ tripCode, type: 'success', msg: 'New OTP sent to customer.' });
      } else {
        setTripActionMsg({ tripCode, type: 'error', msg: data.error || 'Failed to resend OTP' });
      }
    } catch {
      setTripActionMsg({ tripCode, type: 'error', msg: 'Network error' });
    } finally {
      setTripProcessing(null);
    }
  };

  const handleVerifyOtp = async (tripCode: string) => {
    const otp = otpInputs[tripCode];
    if (!otp || otp.length < 4) return;
    setTripProcessing(tripCode);
    setTripActionMsg(null);
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTripActionMsg({ tripCode, type: 'success', msg: 'OTP verified! Trip started.' });
        setOtpInputs(prev => ({ ...prev, [tripCode]: '' }));
        fetchData();
      } else {
        setTripActionMsg({ tripCode, type: 'error', msg: data.error || 'Invalid OTP' });
      }
    } catch {
      setTripActionMsg({ tripCode, type: 'error', msg: 'Network error' });
    } finally {
      setTripProcessing(null);
    }
  };

  // Self-drive shortcut: vendor at the pickup point handles both ends —
  // generate the OTP (audit + customer copy) AND verify it. The customer
  // doesn't need to enter anything from their side. Chains the two existing
  // endpoints (arrive → verify-otp) behind one button.
  const handleSelfDriveHandover = async (tripCode: string) => {
    setTripProcessing(tripCode);
    setTripActionMsg(null);
    try {
      // 1. Generate OTP — moves trip to DRIVER_ARRIVED and saves OTP.
      const arriveRes = await fetch(`/api/b2b/trips/${tripCode}/driver-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'arrive' }),
      });
      const arriveData = await arriveRes.json();
      if (!arriveRes.ok || arriveData.status !== 'success' || !arriveData.otp) {
        setTripActionMsg({ tripCode, type: 'error', msg: arriveData.error || 'Could not generate handover OTP' });
        return;
      }
      // 2. Auto-verify with the OTP we just got back — moves trip to STARTED.
      const verifyRes = await fetch(`/api/b2b/trips/${tripCode}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: arriveData.otp }),
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.status === 'success') {
        setTripActionMsg({ tripCode, type: 'success', msg: `Vehicle handed over. OTP ${arriveData.otp} saved for records.` });
        fetchData();
      } else {
        setTripActionMsg({ tripCode, type: 'error', msg: verifyData.error || 'Could not start the trip after generating OTP' });
        fetchData();
      }
    } catch {
      setTripActionMsg({ tripCode, type: 'error', msg: 'Network error' });
    } finally {
      setTripProcessing(null);
    }
  };

  const handleEndTrip = async (tripCode: string) => {
    setTripProcessing(tripCode);
    setTripActionMsg(null);
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/driver-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_trip' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTripActionMsg({ tripCode, type: 'success', msg: 'Trip completed!' });
        setShowCompleteModal(null);
        fetchData();
      } else {
        setTripActionMsg({ tripCode, type: 'error', msg: data.error || 'Failed to end trip' });
      }
    } catch {
      setTripActionMsg({ tripCode, type: 'error', msg: 'Network error' });
    } finally {
      setTripProcessing(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <p className="text-gray-500">{error || 'Booking not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-teal-600 text-sm hover:underline">Go Back</button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
  const remaining = booking.vehiclesRequired - (booking.totalVehiclesFilled || 0);

  // Vendor info from session for chat
  const vendorUser = session?.user as any;
  const vendorId = vendorUser?.id || null;
  const vendorName = vendorUser?.businessName || vendorUser?.name || '';
  const isDirect = ['car', 'bike', 'luxury'].includes(booking.serviceType);
  const isSelfDrive = booking.serviceType === 'self-drive';
  const isBulk = booking.serviceType === 'CUSTOM_BULK';
  const canAssign = ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'].includes(booking.status) && myQuotes.length === 0;

  // CUSTOM_BULK event plan — day-by-day services/vehicles. Stored as a JSON
  // string in b2b_bookings.bulkBreakdown; null/parse failures fall through to
  // the regular booking-details rendering.
  let bulkPlan: any = null;
  if (isBulk && booking.bulkBreakdown) {
    try { bulkPlan = JSON.parse(booking.bulkBreakdown); } catch { bulkPlan = null; }
  }
  const SERVICE_META: Record<string, { Icon: any; cls: string; label: string }> = {
    car:          { Icon: Car,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Car Rental'     },
    'self-drive': { Icon: Car,     cls: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Self Drive'     },
    bus:          { Icon: Bus,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Bus'            },
    truck:        { Icon: Truck,   cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Truck'          },
    bike:         { Icon: Bike,    cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Bike'           },
    equipment:    { Icon: Wrench,  cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',          label: 'Equipment'      },
    packers:      { Icon: Package, cls: 'bg-pink-50 text-pink-700 border-pink-200',          label: 'Packers'        },
    luxury:       { Icon: Star,    cls: 'bg-purple-50 text-purple-700 border-purple-200',    label: 'Luxury Car'     },
  };

  // Parse self-drive vehicle preference from specialNotes
  let selfDrivePref: any = null;
  if (isSelfDrive && booking.specialNotes) {
    try { selfDrivePref = JSON.parse(booking.specialNotes); } catch {
      // Old pipe-separated format
      if (booking.specialNotes.includes('|') || booking.specialNotes.includes('Preferred:')) {
        const result: any = {};
        const parts = booking.specialNotes.split('|').map((s: string) => s.trim());
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
        }
        if (Object.keys(result).length > 0) selfDrivePref = result;
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to B2B Requests
      </button>

      {/* Header — purple tint for CUSTOM_BULK so vendors recognise event requests */}
      <div className={`rounded-2xl border p-6 bg-gradient-to-r ${isBulk ? 'from-purple-50 to-indigo-50 border-purple-200' : 'from-teal-50 to-cyan-50 border-teal-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {isBulk ? <PartyPopper className="w-6 h-6 text-purple-600" /> : <Building2 className="w-6 h-6 text-teal-600" />}
              <h1 className={`text-xl font-bold ${isBulk ? 'text-purple-800' : 'text-teal-800'}`}>{booking.bookingNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
            <p className="text-sm text-gray-500 ml-9">{isBulk ? 'Multi-Day Bulk Event Request' : 'B2B Booking Request'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition font-medium text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </button>
            <div className="bg-teal-100 rounded-xl p-4 text-center min-w-[90px]">
              <p className="text-3xl font-bold text-teal-800">{booking.vehiclesRequired}</p>
              <p className="text-xs text-teal-600">Required</p>
            </div>
            <div className="bg-emerald-100 rounded-xl p-4 text-center min-w-[90px]">
              <p className="text-3xl font-bold text-emerald-800">{remaining}</p>
              <p className="text-xs text-emerald-600">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM_BULK Event Plan — day-by-day services and vehicles. Quote flow
          below stays identical to regular B2B; this section is purely additive. */}
      {isBulk && bulkPlan && (
        <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {bulkPlan.occasion_name || 'Event Plan'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {bulkPlan.occasion_type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700">
                      {bulkPlan.occasion_type}
                    </span>
                  )}
                  {bulkPlan.base_location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
                      <MapPin className="w-3 h-3" /> {bulkPlan.base_location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bulkPlan.total_days && (
                <div className="px-3 py-1.5 bg-white rounded-lg border border-purple-100 text-center">
                  <p className="text-lg font-extrabold text-purple-700 leading-none tabular-nums">{bulkPlan.total_days}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Days</p>
                </div>
              )}
              {bulkPlan.total_people && (
                <div className="px-3 py-1.5 bg-white rounded-lg border border-emerald-100 text-center">
                  <p className="text-lg font-extrabold text-emerald-700 leading-none tabular-nums">{bulkPlan.total_people}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">People</p>
                </div>
              )}
            </div>
          </div>

          {/* Day-by-day */}
          <div className="p-4 space-y-3">
            {Array.isArray(bulkPlan.days) && bulkPlan.days.length > 0 ? bulkPlan.days.map((day: any, dIdx: number) => (
              <div key={dIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-xs">
                      D{dIdx + 1}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {day.date ? formatDate(day.date) : `Day ${dIdx + 1}`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{(day.services || []).length} service{(day.services || []).length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {(day.services || []).map((svc: any, sIdx: number) => {
                    const meta = SERVICE_META[svc.service_type] || { Icon: Car, cls: 'bg-gray-50 text-gray-700 border-gray-200', label: svc.service_type };
                    const SvcIcon = meta.Icon;
                    return (
                      <div key={sIdx} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${meta.cls}`}>
                            <SvcIcon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {svc.total_vehicles ? <span className="font-bold text-gray-700 tabular-nums">{svc.total_vehicles} veh</span> : null}
                            {svc.people_count ? <span className="font-medium">· {svc.people_count} pax</span> : null}
                            {svc.pickup_time ? <span className="font-medium">· {svc.pickup_time}</span> : null}
                          </div>
                        </div>
                        {Array.isArray(svc.vehicles) && svc.vehicles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {svc.vehicles.map((v: any, vIdx: number) => (
                              <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-700">
                                <span className="font-bold tabular-nums">×{v.count}</span>
                                <span className="truncate max-w-[180px]">{v.vehicle_name || v.vehicle_slug || 'Vehicle'}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {(svc.pickup_location || svc.drop_location) && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            {svc.pickup_location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{svc.pickup_location}</span>}
                            {svc.drop_location && (
                              <>
                                <span className="text-gray-300">→</span>
                                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />{svc.drop_location}</span>
                              </>
                            )}
                          </div>
                        )}
                        {svc.notes && (
                          <p className="flex items-start gap-1.5 text-xs text-gray-500 italic mt-1">
                            <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                            {svc.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No day-wise breakdown provided.</p>
            )}
          </div>

          {bulkPlan.special_requirements && (
            <div className="border-t border-purple-100 px-6 py-3 bg-purple-50/40 text-sm text-purple-900">
              <span className="font-bold">Special requirements:</span> {bulkPlan.special_requirements}
            </div>
          )}
        </div>
      )}

      {/* Self-Drive Vehicle Preference */}
      {isSelfDrive && selfDrivePref && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-2xl border border-emerald-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-sky-600" />
            Vehicle Preference
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl p-4 border border-sky-100 flex-1">
              {(selfDrivePref.vehicleBrand || selfDrivePref.vehicleModelName) && (
                <p className="text-lg font-bold text-gray-900">
                  {[selfDrivePref.vehicleBrand, selfDrivePref.vehicleModelName].filter(Boolean).join(' ')}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {(selfDrivePref.vehicleCategory || booking.vehicleCategory) && (
                  <span className="px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">{selfDrivePref.vehicleCategory || booking.vehicleCategory}</span>
                )}
                {selfDrivePref.transmission && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{selfDrivePref.transmission}</span>
                )}
                {selfDrivePref.fuelType && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1"><Fuel className="w-3 h-3" /> {selfDrivePref.fuelType}</span>
                )}
                {selfDrivePref.minSeats && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{selfDrivePref.minSeats}+ seats</span>
                )}
              </div>
              {selfDrivePref.isDeliveryRequested && (
                <p className="mt-2 text-xs text-sky-600 font-medium">Delivery requested{selfDrivePref.pickupAddress ? ` — ${selfDrivePref.pickupAddress}` : ''}</p>
              )}
              {selfDrivePref.customerNotes && (
                <p className="mt-2 text-sm text-gray-500 italic">"{selfDrivePref.customerNotes}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Car className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xs text-gray-500">Service Type</div>
              <div className="font-medium">{isSelfDrive ? 'Self Drive Rental' : `${booking.serviceType} Rental`}</div>
            </div>
          </div>
          {!isSelfDrive && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Route className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs text-gray-500">Trip Type</div>
                <div className="font-medium">{booking.tripType}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-xs text-gray-500">{isSelfDrive ? 'Location' : 'Pickup Location'}</div>
              <div className="font-medium">{booking.pickupLocation}</div>
            </div>
          </div>
          {!isSelfDrive && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-xs text-gray-500">Drop Location</div>
                <div className="font-medium">{booking.dropLocation || 'N/A'}</div>
              </div>
            </div>
          )}
          {isSelfDrive ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xs text-gray-500">Pickup Date</div>
                  <div className="font-medium">{formatDate(booking.scheduledDate)}{booking.scheduledTime ? ` at ${formatTime(booking.scheduledTime)}` : ''}</div>
                </div>
              </div>
              {booking.returnDate && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs text-gray-500">Drop-off Date</div>
                    <div className="font-medium">{formatDate(booking.returnDate)}{booking.returnTime ? ` at ${booking.returnTime}` : ''}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xs text-gray-500">Scheduled Date & Time</div>
                  <div className="font-medium">{formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}</div>
                </div>
              </div>
              {booking.returnDate && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs text-gray-500">Return Date</div>
                    <div className="font-medium">{formatDate(booking.returnDate)}{booking.returnTime && ` at ${booking.returnTime}`}</div>
                  </div>
                </div>
              )}
            </>
          )}
          {booking.vehicleCategory && !isSelfDrive && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs text-gray-500">Vehicle Category</div>
                <div className="font-medium capitalize">{booking.vehicleCategory}</div>
              </div>
            </div>
          )}
          {booking.passengerCount && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs text-gray-500">Passengers</div>
                <div className="font-medium">{booking.passengerCount}</div>
              </div>
            </div>
          )}
        </div>
        {booking.specialNotes && !isSelfDrive && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <span className="font-medium">Notes:</span> {booking.specialNotes}
          </div>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{booking.totalVehiclesFilled || 0} of {booking.vehiclesRequired} vehicles filled by all vendors</span>
            <span>{Math.round(((booking.totalVehiclesFilled || 0) / booking.vehiclesRequired) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(((booking.totalVehiclesFilled || 0) / booking.vehiclesRequired) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* My Assignment / Quote */}
      {myQuotes.length > 0 ? (
        <div className="space-y-4">
          {myQuotes.map((quote) => {
            const isRejected = quote.status === 'REJECTED';
            const isConfirmed = quote.status === 'CONFIRMED' || quote.status === 'ACCEPTED';

            // Rejected quote — show only a compact "Not Selected" card
            if (isRejected) {
              return (
                <div key={quote.id} className="bg-red-50 rounded-2xl border-2 border-red-200 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-red-800">Quote Not Selected</h2>
                      <p className="text-sm text-red-600 mt-0.5">
                        Your quote ({quote.quoteNumber}) for {quote.vehicleCount} vehicle{quote.vehicleCount > 1 ? 's' : ''} was not selected for this booking.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            const isEditable = ['SUBMITTED', 'UNDER_REVIEW'].includes(quote.status);

            return (
            <div key={quote.id} className="bg-white rounded-2xl border-2 overflow-hidden border-green-200">
              {/* Quote Header */}
              <div className="px-6 py-4 border-b bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-bold text-green-800">Your Quote</h2>
                      <span className="font-mono text-sm px-2 py-0.5 rounded text-green-600 bg-green-100">{quote.quoteNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isConfirmed ? 'bg-green-200 text-green-800' : 'bg-emerald-100 text-emerald-700'
                      }`}>{quote.status}</span>
                    </div>
                    <p className="text-sm mt-0.5 text-green-600">
                      {quote.vehicleCount} vehicles assigned
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    {isEditable && (
                      <Link
                        href={`/vendor/b2b-bookings/${bookingId}/quote?edit=${quote.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-300 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition"
                        title="Edit your quote before the customer accepts it"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Quote
                      </Link>
                    )}
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Quote</div>
                      <div className="text-2xl font-bold text-green-700">₹{quote.totalPrice?.toLocaleString('en-IN')}</div>
                      {quote.pricePerVehicle > 0 && (
                        <div className="text-xs text-gray-400">Avg ₹{Math.round(quote.pricePerVehicle).toLocaleString('en-IN')}/vehicle</div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Self-drive quote details or regular notes */}
                {quote.notes && (() => {
                  let sdDetails: any = null;
                  try {
                    const parsed = JSON.parse(quote.notes);
                    if (parsed.isSelfDriveQuote || parsed.isCarRentalQuote) sdDetails = parsed;
                  } catch {}

                  if (sdDetails) {
                    return (
                      <div className="mt-3 space-y-3">
                        {sdDetails.isSelfDriveQuote && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div className="bg-green-100/50 rounded-lg p-2 text-center">
                              <div className="text-xs text-green-600">Per Vehicle ({sdDetails.rentalDays}d)</div>
                              <div className="font-bold text-green-800">₹{sdDetails.pricePerVehicle?.toLocaleString('en-IN')}</div>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-emerald-600">Security Deposit</div>
                              <div className="font-bold text-emerald-800">₹{sdDetails.securityDeposit?.toLocaleString('en-IN')}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">KM Limit</div>
                              <div className="font-bold text-gray-800">{sdDetails.kmLimitPerDay} km/day</div>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-emerald-600">Advance ({sdDetails.advancePercent}%)</div>
                              <div className="font-bold text-emerald-800">₹{sdDetails.advanceAmount?.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        )}
                        {sdDetails.inclusions?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs font-semibold text-green-700 mr-1">Inclusions:</span>
                            {sdDetails.inclusions.map((item: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">{item}</span>
                            ))}
                          </div>
                        )}
                        {sdDetails.exclusions?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs font-semibold text-red-600 mr-1">Exclusions:</span>
                            {sdDetails.exclusions.map((item: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs">{item}</span>
                            ))}
                          </div>
                        )}
                        {sdDetails.termsConditions?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-600">Terms:</span> {sdDetails.termsConditions.join(' | ')}
                          </div>
                        )}
                        {sdDetails.vendorMessage && (
                          <div className="text-sm text-green-700 italic">"{sdDetails.vendorMessage}"</div>
                        )}
                      </div>
                    );
                  }
                  return <div className="mt-2 text-sm text-green-700 italic">"{quote.notes}"</div>;
                })()}
              </div>

              {/* Vehicles & Drivers */}
              <div className="divide-y">
                {quote.quoteVehicles?.map((qv: any, idx: number) => {
                  const fleet = qv.vehicle || {};
                  const driver = qv.driver || {};
                  const brand = fleet.brands?.name || fleet.vehicle_models?.brands?.name || '';
                  const model = fleet.vehicle_models?.name || fleet.vehicleName || qv.vehicleName || '';
                  const category = fleet.chauffeur_vehicle_categories?.name || '';
                  const regNo = fleet.registrationNumber || qv.vehicleNumber || '';
                  const vehicleLabel = [brand, model].filter(Boolean).join(' ') || 'Vehicle';

                  // Vehicle image
                  let vehicleImages: any = null;
                  if (fleet.images) {
                    try { vehicleImages = typeof fleet.images === 'string' ? JSON.parse(fleet.images) : fleet.images; } catch(e) {}
                  }
                  const vehicleImg = fleet.vehicle_models?.sideImage || fleet.chauffeur_vehicle_categories?.image ||
                    (vehicleImages && typeof vehicleImages === 'object' ? (vehicleImages.front || vehicleImages.side || Object.values(vehicleImages)[0]) : null);

                  return (
                    <div key={qv.id} className="p-4 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="w-20 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border">
                        {vehicleImg ? (
                          <img src={vehicleImg} alt={vehicleLabel} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Car className="w-6 h-6 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{vehicleLabel}</span>
                          {category && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{category}</span>}
                          {regNo && <span className="font-mono text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{regNo}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          {fleet.seatingCapacity && <span>{fleet.seatingCapacity} seater</span>}
                          {fleet.fuelType && <span className="flex items-center gap-0.5"><Fuel className="w-3 h-3" /> {fleet.fuelType}</span>}
                          {fleet.transmission && <span>{fleet.transmission}</span>}
                          {fleet.color && <span>Color: {fleet.color}</span>}
                          {fleet.yearOfManufacture && <span>Year: {fleet.yearOfManufacture}</span>}
                        </div>
                      </div>
                      {!isSelfDrive && (
                        <div className="flex-shrink-0 w-52 bg-green-50 rounded-lg p-2.5 border border-green-100">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {driver.profilePhoto ? (
                                <img src={driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-green-700" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">{driver.name || qv.driverName || 'N/A'}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone || qv.driverPhone || '-'}</div>
                            </div>
                          </div>
                          {(driver.licenseNumber || driver.licenseType) && (
                            <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                              {driver.licenseNumber && <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> {driver.licenseNumber}</div>}
                              {driver.licenseType && <div>Type: {driver.licenseType}</div>}
                              {driver.licenseExpiry && <div>Expiry: {formatDate(driver.licenseExpiry)}</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      ) : (
        /* Not yet assigned */
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">You haven't responded yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            {isSelfDrive
              ? 'Submit a quote with your available vehicles for self-drive rental.'
              : 'Submit a quote with your vehicles and pricing.'}
          </p>
          {canAssign && (
            <Link
              href={`/vendor/b2b-bookings/${bookingId}/quote`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition"
            >
              <Send className="w-5 h-5" />
              Submit Quote
            </Link>
          )}
        </div>
      )}

      {/* Booking Trips (only if vendor's quote was selected) */}
      {booking.trips?.length > 0 && myQuotes.length > 0 && !myQuotes.every((q: any) => q.status === 'REJECTED') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" />
            Trips ({booking.trips.length})
          </h2>
          <div className="space-y-4">
            {booking.trips.map((trip: any, i: number) => {
              const tripStatus = trip.status;
              const myVendorId = myQuotes.length > 0 ? myQuotes[0].vendorId : null;
              const isMyTrip = myVendorId ? (trip.vendorId === myVendorId || trip.vendor?.id === myVendorId) : false;
              const actionMsg = tripActionMsg?.tripCode === trip.tripCode ? tripActionMsg : null;
              // A trip is self-drive when either the whole booking is self-drive,
              // or this is a CUSTOM_BULK booking and the trip has no driver
              // attached (self-drive rows from the quote come through without
              // a driver). That's the OTP-flow trigger.
              const tripIsSelfDrive = isSelfDrive || (booking.serviceType === 'CUSTOM_BULK' && !trip.driverStaffId && !trip.driverName);

              return (
                <div key={trip.id} className={`rounded-xl border overflow-hidden ${
                  tripStatus === 'COMPLETED' ? 'border-green-200 bg-green-50/30' :
                  tripStatus === 'STARTED' ? 'border-emerald-200 bg-emerald-50/30' :
                  tripStatus === 'DRIVER_ARRIVED' ? 'border-cyan-200 bg-cyan-50/30' :
                  tripStatus === 'CANCELLED' || tripStatus === 'VENDOR_CANCELLED' ? 'border-red-200 bg-red-50/30' :
                  'border-gray-200 bg-gray-50/30'
                }`}>
                  {/* Trip Header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      tripStatus === 'COMPLETED' ? 'bg-green-200 text-green-700' :
                      tripStatus === 'STARTED' ? 'bg-emerald-200 text-emerald-700' :
                      tripStatus === 'DRIVER_ARRIVED' ? 'bg-cyan-200 text-cyan-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold">{trip.tripCode}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tripStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          tripStatus === 'STARTED' ? 'bg-emerald-100 text-emerald-700' :
                          tripStatus === 'DRIVER_ARRIVED' ? 'bg-cyan-100 text-cyan-700' :
                          tripStatus === 'CANCELLED' || tripStatus === 'VENDOR_CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{tripStatus.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {trip.vehicleName || '-'} {trip.vehicleNumber && `(${trip.vehicleNumber})`}
                        {!tripIsSelfDrive && trip.driverName && ` • Driver: ${trip.driverName}`}
                        {tripIsSelfDrive && <span className="ml-1 inline-flex items-center gap-1 text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-medium"><KeyRound className="w-3 h-3" /> Self-Drive</span>}
                      </div>
                    </div>

                    {/* Timeline info */}
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      {trip.driverArrivedAt && <div>Arrived: {formatDateTime(trip.driverArrivedAt)}</div>}
                      {trip.startedAt && <div>Started: {formatDateTime(trip.startedAt)}</div>}
                      {trip.completedAt && <div>Completed: {formatDateTime(trip.completedAt)}</div>}
                    </div>
                  </div>

                  {/* Action message */}
                  {actionMsg && (
                    <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-sm ${
                      actionMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {actionMsg.msg}
                    </div>
                  )}

                  {/* Self-drive trip actions (only for vendor's own trips) */}
                  {tripIsSelfDrive && isMyTrip && (
                    <div className="px-4 pb-4">
                      {/* PENDING → Generate OTP. Once clicked, the OTP
                          appears on the customer's trip link (/trip/<code>);
                          customer reads it out, vendor types it back to verify. */}
                      {tripStatus === 'PENDING' && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-sky-50 border border-sky-100 rounded-lg p-3 flex items-center gap-3">
                            <KeyRound className="w-5 h-5 text-sky-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-sky-800">Vehicle Ready for Handover?</p>
                              <p className="text-xs text-sky-600">Generate an OTP — it'll appear on the customer's trip link. Ask them to read it out, then verify here to start the trip.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => isApproved ? handleMarkArrived(trip.tripCode) : openVerificationModal()}
                            disabled={tripProcessing === trip.tripCode}
                            className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition"
                          >
                            {tripProcessing === trip.tripCode ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                            Generate OTP
                          </button>
                        </div>
                      )}

                      {/* DRIVER_ARRIVED → OTP visible on customer's trip link.
                          Vendor asks customer, enters it here, and verifies to
                          mark the trip as started. */}
                      {tripStatus === 'DRIVER_ARRIVED' && (
                        <div className="space-y-3">
                          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3">
                            <KeyRound className="w-6 h-6 text-sky-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-sky-800">OTP is now visible on the customer's trip link</p>
                              <p className="text-xs text-sky-700">Ask the customer to read out the 4-digit OTP from their trip page, then enter it below to start the trip.</p>
                            </div>
                            <button
                              onClick={() => isApproved ? handleResendOtp(trip.tripCode) : openVerificationModal()}
                              disabled={tripProcessing === trip.tripCode}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition flex-shrink-0"
                            >
                              {tripProcessing === trip.tripCode ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="w-3.5 h-3.5" />
                              )}
                              Regenerate OTP
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={otpInputs[trip.tripCode] || ''}
                                onChange={(e) => setOtpInputs(prev => ({
                                  ...prev,
                                  [trip.tripCode]: e.target.value.replace(/\D/g, '').slice(0, 4)
                                }))}
                                placeholder="Enter 4-digit OTP from customer"
                                className="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.3em] border-2 border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                maxLength={4}
                              />
                            </div>
                            <button
                              onClick={() => isApproved ? handleVerifyOtp(trip.tripCode) : openVerificationModal()}
                              disabled={tripProcessing === trip.tripCode || (otpInputs[trip.tripCode] || '').length < 4}
                              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition"
                            >
                              {tripProcessing === trip.tripCode ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              Verify &amp; Start Trip
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STARTED → End Trip */}
                      {tripStatus === 'STARTED' && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
                            <Play className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-emerald-800">Trip In Progress</p>
                              {trip.startedAt && (
                                <p className="text-xs text-emerald-600">Started: {formatDateTime(trip.startedAt)}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => isApproved ? handleEndTrip(trip.tripCode) : openVerificationModal()}
                            disabled={tripProcessing === trip.tripCode}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition"
                          >
                            {tripProcessing === trip.tripCode ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Flag className="w-4 h-4" />
                            )}
                            End Trip
                          </button>
                        </div>
                      )}

                      {/* COMPLETED */}
                      {tripStatus === 'COMPLETED' && (
                        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Trip Completed</p>
                            {trip.completedAt && (
                              <p className="text-xs text-green-600">Completed: {formatDateTime(trip.completedAt)}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CANCELLED */}
                      {(tripStatus === 'CANCELLED' || tripStatus === 'VENDOR_CANCELLED') && (
                        <div className="bg-red-50 rounded-lg p-3 flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-700">Trip Cancelled</p>
                            {trip.cancellationReason && (
                              <p className="text-xs text-red-500">{trip.cancellationReason}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-self-drive or other vendor's trips: simple status display */}
                  {(!isSelfDrive || !isMyTrip) && (
                    <div className="px-4 pb-4">
                      {tripStatus === 'PENDING' && (
                        <div className="bg-emerald-50 rounded-lg p-2 text-xs text-emerald-700 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Waiting for driver to arrive
                        </div>
                      )}
                      {tripStatus === 'DRIVER_ARRIVED' && (
                        <div className="bg-cyan-50 rounded-lg p-2 text-xs text-cyan-700 flex items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5" /> Driver arrived — waiting for passenger OTP verification
                        </div>
                      )}
                      {tripStatus === 'STARTED' && (
                        <div className="bg-emerald-50 rounded-lg p-2 text-xs text-emerald-700 flex items-center gap-2">
                          <Play className="w-3.5 h-3.5" /> Trip in progress
                          {trip.startedAt && ` • Started: ${formatDateTime(trip.startedAt)}`}
                        </div>
                      )}
                      {tripStatus === 'COMPLETED' && (
                        <div className="bg-green-50 rounded-lg p-2 text-xs text-green-700 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                          {trip.completedAt && ` • ${formatDateTime(trip.completedAt)}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id}
              vendorId={vendorId}
              vendorName={vendorName}
              customerId={booking.customerId || undefined}
              customerName={booking.customerName}
              customerEmail={booking.customerEmail}
              customerPhone={booking.customerPhone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
