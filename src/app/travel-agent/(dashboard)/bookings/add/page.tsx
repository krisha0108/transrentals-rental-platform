'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, ArrowLeft, Save, BookOpen, User, Phone, Mail,
  MapPin, Calendar, Users, IndianRupee, CheckCircle2,
  Map, Building2, Car, FileText, MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

const BOOKING_TYPES = [
  { value: 'TOUR', label: 'Tour Package', icon: Map, bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700' },
  { value: 'PROPERTY', label: 'Property / Stay', icon: Building2, bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700' },
  { value: 'TRANSPORT', label: 'Transport', icon: Car, bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  { value: 'CUSTOM', label: 'Custom', icon: FileText, bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
];

interface Tour {
  id: string;
  title: string;
}
interface Property {
  id: string;
  name: string;
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';
const inpIcon = 'w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';
const iconPos = 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400';
const lbl = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2';

function SectionTitle({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    </div>
  );
}

export default function AddBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingType: (searchParams?.get('type') as string) || 'CUSTOM',
    referenceId: searchParams?.get('refId') || '',
    referenceTitle: '',
    pickupLocation: '',
    dropLocation: '',
    travelDate: '',
    returnDate: '',
    checkInDate: '',
    checkOutDate: '',
    passengers: 1,
    rooms: 1,
    totalAmount: '',
    paidAmount: '',
    paymentStatus: 'PENDING',
    notes: '',
    status: 'DRAFT',
  });

  // Load tours/properties for the reference dropdown
  useEffect(() => {
    const load = async () => {
      const [t, p] = await Promise.all([
        fetch('/api/travel-agent/tours').then((r) => (r.ok ? r.json() : { tours: [] })),
        fetch('/api/travel-agent/properties').then((r) => (r.ok ? r.json() : { properties: [] })),
      ]);
      setTours(t.tours || []);
      setProperties(p.properties || []);
    };
    load();
  }, []);

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const changeType = (type: string) => {
    setForm((p) => ({ ...p, bookingType: type, referenceId: '', referenceTitle: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/travel-agent/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
          paidAmount: form.paidAmount ? Number(form.paidAmount) : 0,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        showToast({ type: 'success', title: 'Booking created' });
        router.push(`/travel-agent/bookings/${json.booking.id}`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to create booking' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  const isProperty = form.bookingType === 'PROPERTY';
  const selectedType = BOOKING_TYPES.find((t) => t.value === form.bookingType)!;
  const referenceOptions = isProperty
    ? properties.map((p) => ({ value: p.id, label: p.name }))
    : form.bookingType === 'TOUR'
      ? tours.map((t) => ({ value: t.id, label: t.title }))
      : [];

  useTravelAgentPageHeader('Add Booking', 'A booking number will be generated automatically');

  return (
    <div className="min-h-screen -m-4 lg:-m-6 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 pt-5 pb-16">
        <Link href="/travel-agent/bookings" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium mb-5">
          <ArrowLeft className="w-4 h-4" /> All Bookings
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Booking</h1>
            <p className="text-emerald-200 text-sm mt-0.5">A booking number will be generated automatically</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="px-4 sm:px-6 -mt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

            {/* LEFT COLUMN */}
            <div className="space-y-4">

              {/* Booking type */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<BookOpen className="w-4 h-4 text-emerald-500" />} title="Booking Type" color="bg-emerald-50" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BOOKING_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = form.bookingType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => changeType(t.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-150 active:scale-95 ${
                          active ? `${t.bg} ${t.border} shadow-sm` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? t.text : 'text-gray-400'}`} />
                        <span className={`text-[11px] font-semibold leading-tight ${active ? t.text : 'text-gray-500'}`}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {referenceOptions.length > 0 && (
                  <div className="mt-4">
                    <label className={lbl}>Pick a {isProperty ? 'property' : 'tour'} <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <select
                      value={form.referenceId}
                      onChange={(e) => {
                        const opt = referenceOptions.find((o) => o.value === e.target.value);
                        update('referenceId', e.target.value);
                        update('referenceTitle', opt?.label || '');
                      }}
                      className={inp + ' appearance-none bg-white'}
                    >
                      <option value="">— Custom (no reference) —</option>
                      {referenceOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!form.referenceId && (
                  <div className="mt-4">
                    <label className={lbl}>Reference Title <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      value={form.referenceTitle}
                      onChange={(e) => update('referenceTitle', e.target.value)}
                      placeholder="e.g. Goa 4D/3N Honeymoon Package"
                      className={inp}
                    />
                  </div>
                )}
              </div>

              {/* Customer */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<User className="w-4 h-4 text-emerald-500" />} title="Customer Details" color="bg-emerald-50" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Full Name <span className="text-red-400 normal-case">*</span></label>
                    <div className="relative">
                      <User className={iconPos} />
                      <input type="text" required value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Customer full name" className={inpIcon} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Phone <span className="text-red-400 normal-case">*</span></label>
                      <div className="relative">
                        <Phone className={iconPos} />
                        <input type="tel" required value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} placeholder="10-digit mobile" className={inpIcon} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Email <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                      <div className="relative">
                        <Mail className={iconPos} />
                        <input type="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} placeholder="email@example.com" className={inpIcon} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip dates */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<Calendar className="w-4 h-4 text-emerald-500" />} title={isProperty ? 'Stay Details' : 'Trip Dates'} color="bg-emerald-50" />
                {!isProperty ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Pickup Location</label>
                        <div className="relative">
                          <MapPin className={iconPos} />
                          <input type="text" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} placeholder="Pickup address or area" className={inpIcon} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Drop Location</label>
                        <div className="relative">
                          <MapPin className={iconPos} />
                          <input type="text" value={form.dropLocation} onChange={(e) => update('dropLocation', e.target.value)} placeholder="Drop address (if applicable)" className={inpIcon} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Travel Date</label>
                        <div className="relative">
                          <Calendar className={iconPos} />
                          <input type="date" value={form.travelDate} onChange={(e) => update('travelDate', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Return Date</label>
                        <div className="relative">
                          <Calendar className={iconPos} />
                          <input type="date" value={form.returnDate} min={form.travelDate || undefined} onChange={(e) => update('returnDate', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Passengers</label>
                      <div className="relative">
                        <Users className={iconPos} />
                        <input type="number" min={1} value={form.passengers} onChange={(e) => update('passengers', Number(e.target.value))} className={inpIcon} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Check-in Date</label>
                        <div className="relative">
                          <Calendar className={iconPos} />
                          <input type="date" value={form.checkInDate} onChange={(e) => update('checkInDate', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Check-out Date</label>
                        <div className="relative">
                          <Calendar className={iconPos} />
                          <input type="date" value={form.checkOutDate} min={form.checkInDate || undefined} onChange={(e) => update('checkOutDate', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Guests</label>
                        <div className="relative">
                          <Users className={iconPos} />
                          <input type="number" min={1} value={form.passengers} onChange={(e) => update('passengers', Number(e.target.value))} className={inpIcon} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Rooms</label>
                        <div className="relative">
                          <Building2 className={iconPos} />
                          <input type="number" min={1} value={form.rooms} onChange={(e) => update('rooms', Number(e.target.value))} className={inpIcon} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <label className={lbl}>Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Any special requirements or remarks…" className={inpIcon + ' resize-none'} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">

              {/* Pricing */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<IndianRupee className="w-4 h-4 text-amber-500" />} title="Pricing" color="bg-amber-50" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Total Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className={iconPos} />
                      <input type="number" min={0} value={form.totalAmount} onChange={(e) => update('totalAmount', e.target.value)} placeholder="0" className={inpIcon} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Paid Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className={iconPos} />
                      <input type="number" min={0} value={form.paidAmount} onChange={(e) => update('paidAmount', e.target.value)} placeholder="0" className={inpIcon} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Payment Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'PENDING', label: 'Pending', cls: 'bg-orange-50 border-orange-300 text-orange-700' },
                        { value: 'PARTIAL', label: 'Partial', cls: 'bg-amber-50 border-amber-300 text-amber-700' },
                        { value: 'PAID', label: 'Paid', cls: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                        { value: 'REFUNDED', label: 'Refunded', cls: 'bg-red-50 border-red-300 text-red-700' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('paymentStatus', opt.value)}
                          className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${form.paymentStatus === opt.value ? opt.cls : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          {form.paymentStatus === opt.value && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Initial Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* All six of VALID_STATUS (api/travel-agent/bookings/route.ts).
                          The edit page and the mobile form already offer the full
                          set, so a booking could only be created as Draft or
                          Confirmed and then immediately edited into any other
                          state. Colours follow the status meaning: amber while
                          waiting on someone, sky while running, emerald done,
                          red cancelled. */}
                      {[
                        { value: 'DRAFT', label: 'Draft', cls: 'bg-gray-100 border-gray-300 text-gray-700' },
                        { value: 'PENDING_CUSTOMER', label: 'Pending Customer', cls: 'bg-amber-50 border-amber-300 text-amber-700' },
                        { value: 'CONFIRMED', label: 'Confirmed', cls: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                        { value: 'IN_PROGRESS', label: 'In Progress', cls: 'bg-sky-50 border-sky-300 text-sky-700' },
                        { value: 'COMPLETED', label: 'Completed', cls: 'bg-violet-50 border-violet-300 text-violet-700' },
                        { value: 'CANCELLED', label: 'Cancelled', cls: 'bg-red-50 border-red-300 text-red-700' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('status', opt.value)}
                          className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${form.status === opt.value ? opt.cls : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          {form.status === opt.value && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live summary */}
              <div className={`rounded-2xl border-2 p-4 ${selectedType.bg} ${selectedType.border}`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Booking Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-semibold text-gray-800">{selectedType.label}</span>
                  </div>
                  {(form.referenceTitle || form.referenceId) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[160px]">{form.referenceTitle || '—'}</span>
                    </div>
                  )}
                  {form.customerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">{form.customerName}</span>
                    </div>
                  )}
                  {(form.travelDate || form.checkInDate) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(form.travelDate || form.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )}
                  {form.totalAmount && (
                    <div className="flex justify-between pt-1.5 border-t border-gray-200 mt-1">
                      <span className="text-gray-500 font-semibold">Total</span>
                      <span className="font-bold text-gray-900 text-base">₹{Number(form.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-emerald-200 active:scale-[0.98] text-base"
                >
                  {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : <><Save className="w-5 h-5" /> Create Booking</>}
                </button>
                <Link href="/travel-agent/bookings" className="w-full flex items-center justify-center py-3.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
