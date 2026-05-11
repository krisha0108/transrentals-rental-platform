'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const toDateInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function EditBookingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingType, setBookingType] = useState('CUSTOM');

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/bookings/${id}`);
        if (res.ok) {
          const b = await res.json();
          setBookingType(b.bookingType);
          setForm({
            customerName: b.customerName || '',
            customerPhone: b.customerPhone || '',
            customerEmail: b.customerEmail || '',
            referenceTitle: b.referenceTitle || '',
            pickupLocation: b.pickupLocation || '',
            dropLocation: b.dropLocation || '',
            travelDate: toDateInput(b.travelDate),
            returnDate: toDateInput(b.returnDate),
            checkInDate: toDateInput(b.checkInDate),
            checkOutDate: toDateInput(b.checkOutDate),
            passengers: b.passengers || 1,
            rooms: b.rooms || 1,
            totalAmount: b.totalAmount ? String(b.totalAmount) : '',
            paidAmount: b.paidAmount ? String(b.paidAmount) : '',
            paymentStatus: b.paymentStatus || 'PENDING',
            notes: b.notes || '',
            status: b.status || 'DRAFT',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/travel-agent/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
          paidAmount: form.paidAmount ? Number(form.paidAmount) : 0,
        }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Booking updated' });
        router.push(`/travel-agent/bookings/${id}`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to update' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isProperty = bookingType === 'PROPERTY';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/travel-agent/bookings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to booking
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Customer">
          <Field label="Customer Name *" required>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone *" required>
            <input
              type="tel"
              required
              value={form.customerPhone}
              onChange={(e) => update('customerPhone', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => update('customerEmail', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Reference Title">
            <input
              type="text"
              value={form.referenceTitle}
              onChange={(e) => update('referenceTitle', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Trip Dates">
          {!isProperty ? (
            <>
              <Field label="Pickup Location">
                <input type="text" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Drop Location">
                <input type="text" value={form.dropLocation} onChange={(e) => update('dropLocation', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Travel Date">
                <input type="date" value={form.travelDate} onChange={(e) => update('travelDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Return Date">
                <input type="date" value={form.returnDate} onChange={(e) => update('returnDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Passengers">
                <input type="number" min={1} value={form.passengers} onChange={(e) => update('passengers', Number(e.target.value))} className={inputCls} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Check-in Date">
                <input type="date" value={form.checkInDate} onChange={(e) => update('checkInDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Check-out Date">
                <input type="date" value={form.checkOutDate} onChange={(e) => update('checkOutDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Guests">
                <input type="number" min={1} value={form.passengers} onChange={(e) => update('passengers', Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Rooms">
                <input type="number" min={1} value={form.rooms} onChange={(e) => update('rooms', Number(e.target.value))} className={inputCls} />
              </Field>
            </>
          )}
        </Section>

        <Section title="Pricing & Status">
          <Field label="Total Amount (₹)">
            <input type="number" min={0} value={form.totalAmount} onChange={(e) => update('totalAmount', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Paid Amount (₹)">
            <input type="number" min={0} value={form.paidAmount} onChange={(e) => update('paidAmount', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Payment Status">
            <select value={form.paymentStatus} onChange={(e) => update('paymentStatus', e.target.value)} className={inputCls}>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </Field>
          <Field label="Booking Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputCls}>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_CUSTOMER">Pending Customer</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputCls} />
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Link href={`/travel-agent/bookings/${id}`} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
