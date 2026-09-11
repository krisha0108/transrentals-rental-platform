// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Truck, Calendar, MapPin, Clock, CheckCircle,
  Copy, ExternalLink, DollarSign, FileText, Plus, Send, Eye,
  User, Phone, Mail, Star, Car, Fuel, Shield, ChevronDown, ChevronUp,
  Building2, IndianRupee, Users, Route, AlertCircle, PartyPopper,
  Sparkles, StickyNote, Bus, Truck as TruckIcon, Bike, Wrench, Package,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN_FOR_QUOTES: { label: 'Open for Quotes', color: 'bg-blue-100 text-blue-700' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: 'bg-amber-100 text-amber-700' },
  SUPER_QUOTE_SENT: { label: 'Super Quote Sent', color: 'bg-purple-100 text-purple-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  TRIPS_CREATED: { label: 'Trips Created', color: 'bg-indigo-100 text-indigo-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  INVOICED: { label: 'Invoiced', color: 'bg-orange-100 text-orange-700' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const TRIP_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  DRIVER_ARRIVED: 'bg-blue-100 text-blue-700',
  STARTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  VENDOR_CANCELLED: 'bg-red-100 text-red-700',
};

// Flow steps
const FLOW_STEPS = [
  { key: 'OPEN_FOR_QUOTES', label: 'Vendors Assign' },
  { key: 'QUOTES_RECEIVED', label: 'Review Quotes' },
  { key: 'SUPER_QUOTE_SENT', label: 'Customer Review' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'TRIPS_CREATED', label: 'Trips Active' },
  { key: 'COMPLETED', label: 'Completed' },
];

// Styling/icons for the per-service chips inside a CUSTOM_BULK day plan.
// CustomBookingForm uses 'selfdrive' (no hyphen); regular B2B uses 'self-drive'.
const SERVICE_META: Record<string, { Icon: any; cls: string; label: string }> = {
  car:          { Icon: Car,       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Car Rental'   },
  selfdrive:    { Icon: Car,       cls: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Self Drive'   },
  'self-drive': { Icon: Car,       cls: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Self Drive'   },
  bus:          { Icon: Bus,       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Bus'          },
  truck:        { Icon: TruckIcon, cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Truck'        },
  bike:         { Icon: Bike,      cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Bike'         },
  equipment:    { Icon: Wrench,    cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',          label: 'Equipment'    },
  packers:      { Icon: Package,   cls: 'bg-pink-50 text-pink-700 border-pink-200',          label: 'Packers'      },
  luxury:       { Icon: Star,      cls: 'bg-purple-50 text-purple-700 border-purple-200',    label: 'Luxury Car'   },
};

const formatDayLabel = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ManagerB2BDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [tripStats, setTripStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [margin, setMargin] = useState('');
  const [sqNotes, setSqNotes] = useState('');
  const [invoiceForm, setInvoiceForm] = useState({ dueDate: '', notes: '' });

  useEffect(() => { fetchBooking(); const iv = setInterval(fetchBooking, 15000); return () => clearInterval(iv); }, []);

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/b2b/bookings/${params.id}`);
      const data = await res.json();
      if (data.status === 'success') { setBooking(data.booking); setTripStats(data.tripStats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function toggleQuote(quoteId: string) {
    setSelectedQuotes(prev =>
      prev.includes(quoteId) ? prev.filter(id => id !== quoteId) : [...prev, quoteId]
    );
  }

  async function createSuperQuote() {
    if (selectedQuotes.length === 0) { alert('Select at least one vendor quote'); return; }
    if (!margin) { alert('Enter company margin'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/b2b/super-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          vendorQuoteIds: selectedQuotes,
          companyMargin: parseFloat(margin),
          notes: sqNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(`Super Quote created! Final: ₹${data.superQuote.finalAmount.toLocaleString('en-IN')}`);
        setSelectedQuotes([]); setMargin(''); setSqNotes('');
        fetchBooking();
      } else {
        alert(data.error || 'Failed');
      }
    } catch (e) { alert('Failed to create super quote'); }
    finally { setCreating(false); }
  }

  async function generateInvoice() {
    if (!invoiceForm.dueDate) { alert('Due date required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/b2b/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, dueDate: invoiceForm.dueDate, notes: invoiceForm.notes }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(`Invoice ${data.invoice.invoiceNumber} generated!`);
        fetchBooking();
      } else { alert(data.error); }
    } catch (e) { alert('Failed'); }
    finally { setCreating(false); }
  }

  function copyTripLink(tripCode: string) {
    navigator.clipboard.writeText(`${window.location.origin}/trip/${tripCode}`);
  }

  function copyAllTripLinks() {
    const links = booking.trips.map((t: any) => `${window.location.origin}/trip/${t.tripCode}`).join('\n');
    navigator.clipboard.writeText(links);
    alert(`${booking.trips.length} trip links copied!`);
  }

  // Identity, status and Back go into the shared sticky bar, which was otherwise
  // rendering empty while this page drew its own header row underneath.
  const hdrStatus = booking
    ? (STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' })
    : null;
  useManagerPageHeader(
    booking ? `${booking.bookingNumber} — ${booking.companyName}` : 'B2B Booking',
    undefined,
    hdrStatus ? (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${hdrStatus.color}`}>{hdrStatus.label}</span>
    ) : undefined,
    <Link
      href="/manager/b2b"
      title="Back to B2B bookings"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>,
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!booking) return <div className="text-center py-20 text-gray-500">Booking not found</div>;

  const isBulk = booking.serviceType === 'CUSTOM_BULK';
  // Day-wise plan lives in bulkBreakdown as a JSON string (LongText column).
  // Failing to parse just hides the section — the rest of the page still works.
  let bulkPlan: any = null;
  if (isBulk && booking.bulkBreakdown) {
    try { bulkPlan = JSON.parse(booking.bulkBreakdown); } catch { bulkPlan = null; }
  }
  const selVendorCost = booking.vendorQuotes
    ?.filter((q: any) => selectedQuotes.includes(q.id))
    ?.reduce((sum: number, q: any) => sum + q.totalPrice, 0) || 0;
  const selVehicles = booking.vendorQuotes
    ?.filter((q: any) => selectedQuotes.includes(q.id))
    ?.reduce((sum: number, q: any) => sum + q.vehicleCount, 0) || 0;
  const totalQuotedVehicles = booking.vendorQuotes?.reduce((s: number, q: any) => s + q.vehicleCount, 0) || 0;
  const totalQuotedCost = booking.vendorQuotes?.reduce((s: number, q: any) => s + q.totalPrice, 0) || 0;

  // Determine current step
  const statusOrder = ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED'];
  const currentStepIdx = statusOrder.indexOf(booking.status);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Identity, status and Back now live in the shared sticky bar. */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-gray-500 flex items-center gap-3 flex-wrap">
            <span className="capitalize flex items-center gap-1">
              {isBulk && <PartyPopper className="w-4 h-4 text-purple-500" />}
              {isBulk ? 'Multi-Day Event' : (booking.serviceType === 'self-drive' ? 'Self Drive' : `${booking.serviceType} rental`)}
            </span>
            <span>|</span>
            <span>{booking.vehiclesRequired} vehicles{booking.passengerCount ? ` / ${booking.passengerCount} persons` : ''}</span>
            <span>|</span>
            <span>{booking.pickupLocation}</span>
            <span>|</span>
            <span>{new Date(booking.scheduledDate).toLocaleDateString('en-IN')} {booking.scheduledTime}
              {booking.returnDate && ` → ${new Date(booking.returnDate).toLocaleDateString('en-IN')}${booking.returnTime ? ` ${booking.returnTime}` : ''}`}
            </span>
          </p>
        </div>
      </div>

      {/* Flow Progress Bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          {FLOW_STEPS.map((step, i) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const isActive = booking.status === step.key || (step.key === 'TRIPS_CREATED' && ['TRIPS_CREATED', 'IN_PROGRESS'].includes(booking.status));
            const isDone = currentStepIdx > stepIdx;
            const isCancelled = booking.status === 'CANCELLED';
            return (
              <React.Fragment key={step.key}>
                {i > 0 && <div className={`flex-1 h-1 mx-1 rounded ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-bold text-blue-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center gap-2 flex-wrap">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Customer Details</h3>
          {booking.travelAgentId && booking.bookingMode === 'PERSONAL' && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200">
              🌟 TA · PERSONAL
            </span>
          )}
          {booking.travelAgentId && booking.bookingMode === 'COMPANY' && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
              🏢 TA · COMPANY
            </span>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Name */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Name</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {booking.customer?.name || booking.customerName || '—'}
              </p>
            </div>
          </div>

          {/* Phone */}
          {(booking.customer?.phone || booking.customerPhone) ? (
            <a
              href={`tel:${booking.customer?.phone || booking.customerPhone}`}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Phone</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {booking.customer?.phone || booking.customerPhone}
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-0.5">Click to call</p>
              </div>
            </a>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Phone</p>
                <p className="text-sm font-bold text-gray-400">—</p>
              </div>
            </div>
          )}

          {/* Email */}
          {(booking.customer?.email || booking.customerEmail) ? (
            <a
              href={`mailto:${booking.customer?.email || booking.customerEmail}`}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-amber-50 hover:border-amber-200 border border-transparent transition"
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Email</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {booking.customer?.email || booking.customerEmail}
                </p>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Click to email</p>
              </div>
            </a>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Email</p>
                <p className="text-sm font-bold text-gray-400">—</p>
              </div>
            </div>
          )}

          {/* Company */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {booking.travelAgentId ? 'Agency' : 'Company'}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {booking.companyName || booking.customer?.companyName || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <Car className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <div className="text-2xl font-bold">{booking.vehiclesRequired}</div>
          <div className="text-xs text-gray-500">Vehicles Required</div>
        </div>
        {booking.passengerCount > 0 && (
          <div className="bg-white rounded-xl border p-4 text-center">
            <Users className="w-6 h-6 text-sky-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{booking.passengerCount}</div>
            <div className="text-xs text-gray-500">Passengers</div>
          </div>
        )}
        <div className="bg-white rounded-xl border p-4 text-center">
          <Users className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
          <div className="text-2xl font-bold">{totalQuotedVehicles}</div>
          <div className="text-xs text-gray-500">Vehicles Quoted</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <Building2 className="w-6 h-6 text-teal-500 mx-auto mb-1" />
          <div className="text-2xl font-bold">{booking.vendorQuotes?.length || 0}</div>
          <div className="text-xs text-gray-500">Vendor Responses</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <IndianRupee className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <div className="text-2xl font-bold">₹{totalQuotedCost.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500">Total Vendor Cost</div>
        </div>
      </div>

      {/* Self-Drive Vehicle Preference */}
      {booking.serviceType === 'self-drive' && booking.specialNotes && (() => {
        try {
          const pref = JSON.parse(booking.specialNotes);
          if (!pref.vehicleModelName && !pref.vehicleBrand) return null;
          return (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-4">
              <Car className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-sky-600 font-semibold">Customer's Preferred Vehicle</p>
                <p className="font-bold text-gray-900">{pref.vehicleBrand ? `${pref.vehicleBrand} ` : ''}{pref.vehicleModelName || ''}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {pref.vehicleCategory && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{pref.vehicleCategory}</span>}
                  {pref.transmission && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{pref.transmission}</span>}
                  {pref.fuelType && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{pref.fuelType}</span>}
                  {pref.minSeats && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{pref.minSeats} seats</span>}
                  {pref.isDeliveryRequested && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Home Delivery</span>}
                </div>
                {pref.customerNotes && <p className="text-xs text-gray-500 mt-1 italic">"{pref.customerNotes}"</p>}
              </div>
              <div className="text-right text-sm text-gray-500">
                {booking.returnDate && (
                  <div>
                    <p className="text-xs text-sky-600 font-medium">Rental Period</p>
                    <p className="text-xs">{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                )}
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* CUSTOM_BULK day-wise plan — shows the manager which vehicle the
          customer asked for on each day. Same shape used on the vendor side. */}
      {isBulk && bulkPlan && (
        <div className="bg-white rounded-xl border border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-3 border-b border-purple-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  Day-wise Event Plan
                  {bulkPlan.occasion_name ? ` · ${bulkPlan.occasion_name}` : ''}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {bulkPlan.occasion_type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700">
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
                  <p className="text-base font-extrabold text-purple-700 leading-none tabular-nums">{bulkPlan.total_days}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Days</p>
                </div>
              )}
              {bulkPlan.total_people && (
                <div className="px-3 py-1.5 bg-white rounded-lg border border-emerald-100 text-center">
                  <p className="text-base font-extrabold text-emerald-700 leading-none tabular-nums">{bulkPlan.total_people}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">People</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 space-y-3">
            {Array.isArray(bulkPlan.days) && bulkPlan.days.length > 0 ? bulkPlan.days.map((day: any, dIdx: number) => {
              const dayVehicleTotal = (day.services || []).reduce((sum: number, s: any) => {
                if (typeof s.total_vehicles === 'number') return sum + s.total_vehicles;
                if (Array.isArray(s.vehicles)) {
                  return sum + s.vehicles.reduce((a: number, v: any) => a + (Number(v.count) || 0), 0);
                }
                return sum;
              }, 0);
              return (
                <div key={dIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-[10px] shrink-0">
                        D{dIdx + 1}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Day {dIdx + 1}</span>
                      {day.date && (
                        <span className="text-xs text-gray-600 font-medium">· {formatDayLabel(day.date)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {dayVehicleTotal > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold tabular-nums">
                          {dayVehicleTotal} vehicle{dayVehicleTotal !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-gray-500 font-medium">
                        {(day.services || []).length} service{(day.services || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(day.services || []).map((svc: any, sIdx: number) => {
                      const meta = SERVICE_META[svc.service_type] || { Icon: Car, cls: 'bg-gray-50 text-gray-700 border-gray-200', label: svc.service_type };
                      const SvcIcon = meta.Icon;
                      return (
                        <div key={sIdx} className="px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
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
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {svc.vehicles.map((v: any, vIdx: number) => (
                                <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-700">
                                  <span className="font-bold tabular-nums text-purple-700">×{v.count}</span>
                                  <span className="truncate max-w-[220px]">{v.vehicle_name || v.vehicle_slug || 'Vehicle'}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {(svc.pickup_location || svc.drop_location) && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
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
              );
            }) : (
              <p className="text-sm text-gray-500 text-center py-4">No day-wise breakdown provided.</p>
            )}
          </div>

          {bulkPlan.special_requirements && (
            <div className="border-t border-purple-100 px-5 py-2.5 bg-purple-50/40 text-sm text-purple-900">
              <span className="font-bold">Special requirements:</span> {bulkPlan.special_requirements}
            </div>
          )}
        </div>
      )}

      {/* Trip Stats (if trips exist) */}
      {tripStats && tripStats.total > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { l: 'Total Trips', v: tripStats.total, c: 'bg-blue-50' },
            { l: 'Pending', v: tripStats.pending, c: 'bg-yellow-50' },
            { l: 'Arrived', v: tripStats.driverArrived, c: 'bg-indigo-50' },
            { l: 'Started', v: tripStats.started, c: 'bg-green-50' },
            { l: 'Completed', v: tripStats.completed, c: 'bg-gray-50' },
            { l: 'Cancelled', v: tripStats.cancelled, c: 'bg-red-50' },
          ].map(s => (
            <div key={s.l} className={`${s.c} rounded-lg p-2 text-center`}>
              <div className="text-xl font-bold">{s.v}</div>
              <div className="text-xs text-gray-500">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: 'quotes', label: `Vendor Quotes (${booking.vendorQuotes?.length || 0})` },
          { key: 'super-quote', label: `Super Quote${booking.superQuotes?.length ? ` (${booking.superQuotes.length})` : ''}` },
          { key: 'trips', label: `Trips (${booking.trips?.length || 0})` },
          { key: 'invoice', label: `Invoice${booking.invoices?.length ? ` (${booking.invoices.length})` : ''}` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ QUOTES TAB ============ */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {booking.vendorQuotes?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Waiting for vendor responses...</p>
              <p className="text-xs text-gray-400 mt-1">Vendors will assign vehicles & drivers with their pricing</p>
            </div>
          ) : (
            <>
              {/* Selection hint when quotes can be selected */}
              {booking.status === 'QUOTES_RECEIVED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <strong>Select vendor quotes</strong> to include in the Super Quote for the customer.
                    {selectedQuotes.length > 0 && (
                      <span className="ml-2">Selected: <strong>{selVehicles} vehicles</strong> | ₹{selVendorCost.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  {selectedQuotes.length > 0 && (
                    <button onClick={() => setActiveTab('super-quote')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                      <Send className="w-4 h-4" /> Create Super Quote
                    </button>
                  )}
                </div>
              )}

              {booking.vendorQuotes?.map((q: any) => {
                const isExpanded = expandedQuotes[q.id];
                const isSelected = selectedQuotes.includes(q.id);
                const canSelect = ['SUBMITTED', 'REVISED'].includes(q.status) && booking.status === 'QUOTES_RECEIVED';
                // Pull per-vehicle pickup points (self-drive only) from the
                // notes JSON. Aligned with q.quoteVehicles ordering.
                let quotePickupPoints: (string | null)[] = [];
                if (q.notes) {
                  try {
                    const parsed = JSON.parse(q.notes);
                    if (Array.isArray(parsed?.vehiclePickupPoints)) {
                      quotePickupPoints = parsed.vehiclePickupPoints;
                    }
                  } catch { /* legacy plain-text notes */ }
                }
                return (
                  <div key={q.id} className={`rounded-xl border overflow-hidden transition ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-white' :
                    q.status === 'REJECTED' ? 'bg-red-50/50 border-red-200 opacity-75' :
                    q.status === 'CONFIRMED' ? 'bg-white border-green-200' : 'bg-white'
                  }`}>
                    {/* Vendor Header - Clickable to expand */}
                    <div
                      className={`p-4 cursor-pointer ${
                        q.status === 'REJECTED' ? 'bg-gradient-to-r from-red-50 to-red-50/50' :
                        q.status === 'CONFIRMED' ? 'bg-gradient-to-r from-green-50 to-white' :
                        'bg-gradient-to-r from-gray-50 to-white'
                      }`}
                      onClick={() => setExpandedQuotes(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    >
                      <div className="flex items-center gap-3">
                        {canSelect && (
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleQuote(q.id)} onClick={e => e.stopPropagation()} className="w-5 h-5 rounded border-gray-300 flex-shrink-0 cursor-pointer" />
                        )}
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {q.vendor?.logo ? (
                            <img src={q.vendor.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">{q.vendor?.businessName || 'Vendor'}</span>
                            {q.vendor?.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {q.vendor.rating}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              q.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              q.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                              q.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {q.status === 'CONFIRMED' ? '✓ Selected' : q.status === 'REJECTED' ? '✗ Not Selected' : q.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
                            {q.vendor?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {q.vendor.phone}</span>}
                            {q.vendor?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {q.vendor.city}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-3">
                          <div>
                            <div className="text-2xl font-bold text-green-600">₹{q.totalPrice?.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{q.vehicleCount} vehicles</div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content - Vehicles, Inclusions, Exclusions, Terms */}
                    {isExpanded && (
                      <div className="border-t">
                        {/* Vendor Contact Details */}
                        <div className="px-4 py-3 bg-gray-50/50 border-b flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          {q.vendor?.ownerName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {q.vendor.ownerName}</span>}
                          {q.vendor?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {q.vendor.phone}</span>}
                          {q.vendor?.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {q.vendor.email}</span>}
                          {q.vendor?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {q.vendor.city}{q.vendor.address ? ` — ${q.vendor.address}` : ''}</span>}
                          <span className="text-xs text-gray-400 font-mono ml-auto">{q.quoteNumber}</span>
                        </div>

                        {/* Quote Details (Self-Drive or Car Rental) */}
                        {q.notes && (() => {
                          let sdDetails: any = null;
                          try {
                            const parsed = JSON.parse(q.notes);
                            if (parsed.isSelfDriveQuote || parsed.isCarRentalQuote) sdDetails = parsed;
                          } catch {}

                          if (sdDetails) {
                            return (
                              <div className="px-4 py-3 space-y-3 border-b">
                                {/* Self-Drive Pricing Summary */}
                                {sdDetails.isSelfDriveQuote && (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                      <div className="bg-teal-50 rounded-lg p-2.5 text-center">
                                        <div className="text-xs text-teal-600">Per Vehicle ({sdDetails.rentalDays} days)</div>
                                        <div className="font-bold text-teal-800">₹{sdDetails.pricePerVehicle?.toLocaleString('en-IN')}</div>
                                        {sdDetails.dailyRate > 0 && <div className="text-xs text-teal-500">₹{sdDetails.dailyRate?.toLocaleString('en-IN')}/day</div>}
                                      </div>
                                      <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                                        <div className="text-xs text-blue-600">Security Deposit</div>
                                        <div className="font-bold text-blue-800">₹{sdDetails.securityDeposit?.toLocaleString('en-IN')}</div>
                                        <div className="text-xs text-blue-500">Refundable</div>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                        <div className="text-xs text-gray-600">KM Limit</div>
                                        <div className="font-bold text-gray-800">{sdDetails.kmLimitPerDay} km/day</div>
                                        <div className="text-xs text-gray-500">Extra: ₹{sdDetails.extraKmRate}/km</div>
                                      </div>
                                      <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                                        <div className="text-xs text-amber-600">Advance ({sdDetails.advancePercent}%)</div>
                                        <div className="font-bold text-amber-800">₹{sdDetails.advanceAmount?.toLocaleString('en-IN')}</div>
                                        <div className="text-xs text-amber-500">Valid {sdDetails.validityDays} days</div>
                                      </div>
                                    </div>
                                    {(sdDetails.deliveryCharges > 0 || sdDetails.pickupCharges > 0) && (
                                      <div className="flex gap-3 text-xs text-gray-500">
                                        {sdDetails.deliveryCharges > 0 && <span>Delivery: ₹{sdDetails.deliveryCharges?.toLocaleString('en-IN')}</span>}
                                        {sdDetails.pickupCharges > 0 && <span>Pickup: ₹{sdDetails.pickupCharges?.toLocaleString('en-IN')}</span>}
                                      </div>
                                    )}
                                  </>
                                )}
                                {/* Inclusions */}
                                {sdDetails.inclusions?.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Inclusions</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {sdDetails.inclusions.map((item: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-100">{item}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Exclusions */}
                                {sdDetails.exclusions?.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Exclusions</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {sdDetails.exclusions.map((item: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs border border-red-100">{item}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Terms & Conditions */}
                                {sdDetails.termsConditions?.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-600 mb-1.5">Terms & Conditions</div>
                                    <div className="space-y-1">
                                      {sdDetails.termsConditions.map((item: string, i: number) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                          <span className="text-gray-400 font-medium mt-px">{i + 1}.</span>
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Vendor Message */}
                                {sdDetails.vendorMessage && (
                                  <div className="text-sm text-gray-600 italic bg-gray-50 rounded px-3 py-1.5">"{sdDetails.vendorMessage}"</div>
                                )}
                              </div>
                            );
                          }

                          // Regular non-JSON notes
                          return <div className="px-4 py-3 border-b text-sm text-gray-600 italic bg-gray-50/50">"{q.notes}"</div>;
                        })()}

                        {/* Vehicles */}
                        {q.quoteVehicles?.length > 0 && (
                          <div className="divide-y">
                            {q.quoteVehicles.map((qv: any, idx: number) => {
                              const fleet = qv.vehicle;
                              const driver = qv.driver;
                              const brand = fleet?.brands?.name || fleet?.vehicle_models?.brands?.name || '';
                              const model = fleet?.vehicle_models?.name || fleet?.vehicleName || qv.vehicleName || '';
                              const category = fleet?.chauffeur_vehicle_categories?.name || '';
                              const regNo = fleet?.registrationNumber || qv.vehicleNumber || '';
                              const vehicleLabel = [brand, model].filter(Boolean).join(' ') || 'Vehicle';
                              let vehicleImages: any = null;
                              if (fleet?.images) {
                                try { vehicleImages = typeof fleet.images === 'string' ? JSON.parse(fleet.images) : fleet.images; } catch(e) {}
                              }
                              const vehicleImg = fleet?.vehicle_models?.sideImage || fleet?.chauffeur_vehicle_categories?.image ||
                                (vehicleImages && typeof vehicleImages === 'object' ? (vehicleImages.front || vehicleImages.side || Object.values(vehicleImages)[0]) : null);

                              // Coerce to boolean — `0 || 0 || 0 || 0` returns
                              // the number 0, which React would render literally
                              // in `{hasPricing && (...)}` and produce a stray "0"
                              // between the driver block and the pickup point.
                              const hasPricing = Boolean(qv.basePrice || qv.perKmRate || qv.perHourRate || qv.perDayRate);
                              const pricingItems = [
                                { label: 'Base Price', val: qv.basePrice },
                                { label: 'Per KM', val: qv.perKmRate },
                                { label: 'Per Hour', val: qv.perHourRate },
                                { label: 'Per Day', val: qv.perDayRate },
                                { label: 'Driver Allowance', val: qv.driverAllowance },
                                { label: 'Night Charges', val: qv.nightCharges },
                                { label: 'Extra KM', val: qv.extraKmCharge },
                                { label: 'Extra Hour', val: qv.extraHourCharge },
                              ].filter(p => p.val && p.val > 0);

                              return (
                                <div key={qv.id} className="p-4 hover:bg-gray-50/50">
                                  <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{idx + 1}</div>
                                    <div className="w-24 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border">
                                      {vehicleImg ? <img src={vehicleImg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-300" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900">{vehicleLabel}</span>
                                        {category && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{category}</span>}
                                        {regNo && <span className="font-mono text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{regNo}</span>}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                        {fleet?.seatingCapacity && <span>{fleet.seatingCapacity} seater</span>}
                                        {fleet?.fuelType && <span className="flex items-center gap-0.5"><Fuel className="w-3 h-3" /> {fleet.fuelType}</span>}
                                        {fleet?.transmission && <span>{fleet.transmission}</span>}
                                        {fleet?.color && <span>Color: {fleet.color}</span>}
                                        {fleet?.yearOfManufacture && <span>Year: {fleet.yearOfManufacture}</span>}
                                      </div>
                                    </div>
                                    {/* Driver section - only for non-self-drive */}
                                    {booking.serviceType !== 'self-drive' && (
                                      <div className="flex-shrink-0 w-48 bg-green-50 rounded-lg p-2.5 border border-green-100">
                                        <div className="flex items-center gap-2">
                                          <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {driver?.profilePhoto ? <img src={driver.profilePhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-green-700" />}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{driver?.name || qv.driverName || 'No driver'}</div>
                                            <div className="text-xs text-gray-500">{driver?.phone || qv.driverPhone || '-'}</div>
                                          </div>
                                        </div>
                                        {driver && (
                                          <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                                            {driver.licenseNumber && <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> {driver.licenseNumber}</div>}
                                            {driver.licenseType && <div>Type: {driver.licenseType}</div>}
                                            {driver.licenseExpiry && <div>Exp: {new Date(driver.licenseExpiry).toLocaleDateString('en-IN')}</div>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {/* Pricing breakdown */}
                                  {hasPricing && (
                                    <div className="mt-2 ml-12 flex flex-wrap gap-2">
                                      {pricingItems.map(p => (
                                        <span key={p.label} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                          {p.label}: <strong>₹{p.val?.toLocaleString('en-IN')}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Self-drive pickup point — only set when the
                                      vendor entered one (self-drive rows). */}
                                  {quotePickupPoints[idx] && (
                                    <div className="mt-2 ml-12 flex items-center gap-1.5 text-xs bg-sky-50 text-sky-800 px-2.5 py-1.5 rounded border border-sky-100">
                                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                      <span className="font-semibold">Pickup point:</span>
                                      <span className="truncate">{quotePickupPoints[idx]}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ============ SUPER QUOTE TAB ============ */}
      {activeTab === 'super-quote' && (
        <div className="space-y-4">
          {/* Existing super quotes */}
          {booking.superQuotes?.map((sq: any) => (
            <div key={sq.id} className="bg-white rounded-xl border p-5">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-purple-600">{sq.quoteNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${sq.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : sq.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{sq.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">₹{sq.finalAmount?.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-400">Sent to customer</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 rounded-lg p-3">
                <div><div className="text-gray-500">Vendor Cost</div><div className="font-bold">₹{sq.vendorCostTotal?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">Margin</div><div className="font-bold">₹{sq.companyMargin?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">Final Amount</div><div className="font-bold text-green-600">₹{sq.finalAmount?.toLocaleString('en-IN')}</div></div>
              </div>
              {sq.items?.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  Includes {sq.items.length} vendor quote(s): {sq.items.map((it: any) => it.vendorQuote?.quoteNumber).filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}

          {/* Create Super Quote */}
          {booking.status === 'QUOTES_RECEIVED' && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 space-y-4">
              <h3 className="font-bold text-blue-900 flex items-center gap-2"><Plus className="w-5 h-5" /> Create Super Quote</h3>

              {selectedQuotes.length === 0 ? (
                <div className="bg-white rounded-lg p-4 text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-sm">Go to <button onClick={() => setActiveTab('quotes')} className="text-blue-600 font-medium hover:underline">Vendor Quotes</button> tab and select the quotes you want to include.</p>
                </div>
              ) : (
                <>
                  {/* Selected summary */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Selected {selectedQuotes.length} vendor quote(s):</div>
                    <div className="space-y-1.5">
                      {booking.vendorQuotes?.filter((q: any) => selectedQuotes.includes(q.id)).map((q: any) => (
                        <div key={q.id} className="flex items-center justify-between text-sm bg-blue-50 rounded px-3 py-2">
                          <span className="font-medium">{q.vendor?.businessName} <span className="text-gray-400 font-mono text-xs">({q.quoteNumber})</span></span>
                          <span>{q.vehicleCount} vehicles — <strong>₹{q.totalPrice?.toLocaleString('en-IN')}</strong></span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm">
                      <span className="font-medium">Total Vendor Cost</span>
                      <span className="text-lg font-bold">₹{selVendorCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Margin (₹) *</label>
                      <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)}
                        placeholder="e.g. 5000" className="w-full px-3 py-2.5 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <input type="text" value={sqNotes} onChange={(e) => setSqNotes(e.target.value)}
                        placeholder="Any notes..." className="w-full px-3 py-2.5 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Final</label>
                      <div className="px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-lg font-bold text-green-700">
                        ₹{(selVendorCost + (parseFloat(margin) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <button onClick={createSuperQuote} disabled={creating}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Create & Send Super Quote to Customer
                  </button>
                </>
              )}
            </div>
          )}

          {booking.superQuotes?.length === 0 && booking.status !== 'QUOTES_RECEIVED' && (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">No super quotes yet</div>
          )}
        </div>
      )}

      {/* ============ TRIPS TAB ============ */}
      {activeTab === 'trips' && (
        <div>
          {booking.trips?.length > 0 && (
            <div className="flex justify-end mb-3">
              <button onClick={copyAllTripLinks} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Copy className="w-3.5 h-3.5" /> Copy All Trip Links
              </button>
            </div>
          )}
          {booking.trips?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No trips yet</p>
              <p className="text-xs text-gray-400 mt-1">Trips are created automatically after the customer accepts the Super Quote</p>
            </div>
          ) : (
            <div className="space-y-2">
              {booking.trips?.map((trip: any, i: number) => (
                <div key={trip.id} className="bg-white rounded-lg border p-3 flex items-center gap-3">
                  <div className="text-xs text-gray-400 w-6">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{trip.tripCode}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TRIP_STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>{trip.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {trip.driverName || '-'} | {trip.vehicleName || '-'} {trip.vehicleNumber && `(${trip.vehicleNumber})`}
                      {trip.vendor?.businessName && <span className="text-gray-400"> | {trip.vendor.businessName}</span>}
                    </div>
                  </div>
                  <button onClick={() => copyTripLink(trip.tripCode)} className="p-1.5 hover:bg-gray-100 rounded" title="Copy link"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                  <a href={`/trip/${trip.tripCode}`} target="_blank" className="p-1.5 hover:bg-gray-100 rounded"><ExternalLink className="w-3.5 h-3.5 text-blue-500" /></a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ INVOICE TAB ============ */}
      {activeTab === 'invoice' && (
        <div>
          {booking.invoices?.map((inv: any) => (
            <div key={inv.id} className="bg-white rounded-xl border p-5 mb-4">
              <div className="flex justify-between mb-3">
                <span className="font-mono font-bold">{inv.invoiceNumber}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inv.status}</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">₹{inv.totalAmount?.toLocaleString('en-IN')}</div>
              <div className="text-sm text-gray-500 mb-3">Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')} | Trips: {inv.tripsCompleted}/{inv.totalVehicles}</div>
              <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                <Eye className="w-4 h-4" /> View Invoice
              </a>
            </div>
          ))}

          {['COMPLETED', 'IN_PROGRESS', 'TRIPS_CREATED'].includes(booking.status) && !booking.invoices?.find((i: any) => i.status !== 'CANCELLED') && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5 space-y-4">
              <h3 className="font-bold text-orange-900 flex items-center gap-2"><FileText className="w-5 h-5" /> Generate Invoice</h3>

              {/* Invoice Preview */}
              <div className="bg-white rounded-lg border border-orange-100 p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-dashed">
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-bold text-gray-900">{booking.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Booking</p>
                    <p className="font-mono font-bold text-sm">{booking.bookingNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Vehicles</span>
                    <span className="font-semibold">{booking.vehiclesRequired}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trips Completed</span>
                    <span className="font-semibold">{tripStats?.completed || 0} / {tripStats?.total || 0}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vendor Cost</span>
                    <span className="font-medium">₹{(booking.vendorCostTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company Margin</span>
                    <span className="font-medium">₹{(booking.companyMargin || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dashed text-base">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="font-bold text-green-600">₹{((booking.vendorCostTotal || 0) + (booking.companyMargin || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input type="text" value={invoiceForm.notes} onChange={(e) => setInvoiceForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Payment terms, bank details..." className="w-full px-3 py-2.5 border rounded-lg" />
                </div>
              </div>

              <button onClick={generateInvoice} disabled={creating}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {creating ? 'Generating...' : 'Generate & Send Invoice'}
              </button>
            </div>
          )}

          {booking.invoices?.length === 0 && !['COMPLETED', 'IN_PROGRESS'].includes(booking.status) && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Invoices can be generated after trips are completed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
