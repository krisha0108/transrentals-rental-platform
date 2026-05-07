'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  BookOpen,
  Phone,
  Calendar,
  IndianRupee,
} from 'lucide-react';

interface BookingData {
  bookingNumber: string;
  bookingType: string;
  referenceTitle: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  travelDate: string | null;
  returnDate: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  passengers: number | null;
  rooms: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  status: string;
  customerFilledAt: string | null;
  agency: { name: string; logo: string | null; phone: string };
}

const toDateInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function CustomerBookingFillPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupLocation: '',
    dropLocation: '',
    travelDate: '',
    returnDate: '',
    checkInDate: '',
    checkOutDate: '',
    passengers: 1,
    rooms: 1,
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/booking-share/${token}`);
        if (res.ok) {
          const json: BookingData = await res.json();
          setBooking(json);
          setForm({
            customerName: json.customerName || '',
            customerPhone: json.customerPhone || '',
            customerEmail: json.customerEmail || '',
            pickupLocation: json.pickupLocation || '',
            dropLocation: json.dropLocation || '',
            travelDate: toDateInput(json.travelDate),
            returnDate: toDateInput(json.returnDate),
            checkInDate: toDateInput(json.checkInDate),
            checkOutDate: toDateInput(json.checkOutDate),
            passengers: json.passengers || 1,
            rooms: json.rooms || 1,
            notes: '',
          });
        } else {
          const j = await res.json();
          setError(j.error || 'Booking unavailable');
        }
      } catch {
        setError('Could not load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/travel-agent/booking-share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const j = await res.json();
        setSubmitError(j.error || 'Submission failed');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Unavailable</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">All set!</h2>
          <p className="text-gray-600 text-sm mb-1">Your details have been saved.</p>
          <p className="text-gray-600 text-sm">
            <strong>{booking.agency.name}</strong> will reach out to you shortly to confirm.
          </p>
          <p className="font-mono text-xs text-gray-400 mt-4">Booking #{booking.bookingNumber}</p>
        </div>
      </div>
    );
  }

  const isProperty = booking.bookingType === 'PROPERTY';
  const isLocked = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              {booking.agency.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={booking.agency.logo}
                  alt={booking.agency.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <p className="text-xs text-emerald-100 font-medium">Booking from</p>
                <p className="font-bold">{booking.agency.name}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <p className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">
                #{booking.bookingNumber}
              </p>
              {booking.referenceTitle && (
                <p className="text-sm text-emerald-100">{booking.referenceTitle}</p>
              )}
            </div>
          </div>

          <div className="px-6 py-5 bg-emerald-50/50 border-b border-emerald-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              {booking.totalAmount && booking.totalAmount > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center justify-center gap-1">
                    <IndianRupee className="w-2.5 h-2.5" /> Total
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {booking.paidAmount && booking.paidAmount > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Paid</p>
                  <p className="text-lg font-bold text-emerald-700">
                    ₹{booking.paidAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Status</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {booking.status.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>

          {isLocked ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-gray-900">This booking is confirmed</p>
              <p className="text-sm text-gray-600 mt-1">
                For changes, please contact{' '}
                <a href={`tel:${booking.agency.phone}`} className="text-emerald-600 font-semibold">
                  {booking.agency.name}
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                Please review and complete your booking details below. The agent will confirm once
                you submit.
              </p>

              {submitError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your Name *">
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone *">
                  <input
                    type="tel"
                    required
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {!isProperty ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Pickup Location">
                      <input
                        type="text"
                        value={form.pickupLocation}
                        onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Drop Location">
                      <input
                        type="text"
                        value={form.dropLocation}
                        onChange={(e) => setForm({ ...form, dropLocation: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Travel Date">
                      <input
                        type="date"
                        value={form.travelDate}
                        onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Return Date">
                      <input
                        type="date"
                        value={form.returnDate}
                        onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Passengers">
                      <input
                        type="number"
                        min={1}
                        value={form.passengers}
                        onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Check-in">
                    <input
                      type="date"
                      value={form.checkInDate}
                      onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Check-out">
                    <input
                      type="date"
                      value={form.checkOutDate}
                      onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Guests">
                    <input
                      type="number"
                      min={1}
                      value={form.passengers}
                      onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Rooms">
                    <input
                      type="number"
                      min={1}
                      value={form.rooms}
                      onChange={(e) => setForm({ ...form, rooms: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              <Field label="Anything else?">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special requests, dietary needs, accessibility..."
                  className={inputCls}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Details
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-gray-400">
                Your information goes directly to {booking.agency.name}.
              </p>
            </form>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600">
            Need to talk to your agent?{' '}
            <a
              href={`tel:${booking.agency.phone}`}
              className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> {booking.agency.phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
