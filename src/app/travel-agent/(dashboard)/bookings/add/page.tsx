'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const BOOKING_TYPES = [
  { value: 'TOUR', label: 'Tour Package' },
  { value: 'PROPERTY', label: 'Property / Stay' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'CUSTOM', label: 'Custom' },
];

interface Tour {
  id: string;
  title: string;
}
interface Property {
  id: string;
  name: string;
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
  const referenceOptions = isProperty
    ? properties.map((p) => ({ value: p.id, label: p.name }))
    : form.bookingType === 'TOUR'
      ? tours.map((t) => ({ value: t.id, label: t.title }))
      : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/travel-agent/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Bookings
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Booking</h1>
          <p className="text-sm text-gray-500">A booking number will be generated automatically</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Booking Type">
          <Field label="Type *" required>
            <select
              required
              value={form.bookingType}
              onChange={(e) => update('bookingType', e.target.value)}
              className={inputCls}
            >
              {BOOKING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          {referenceOptions.length > 0 && (
            <Field label={`Pick a ${isProperty ? 'property' : 'tour'} (optional)`}>
              <select
                value={form.referenceId}
                onChange={(e) => {
                  const opt = referenceOptions.find((o) => o.value === e.target.value);
                  update('referenceId', e.target.value);
                  update('referenceTitle', opt?.label || '');
                }}
                className={inputCls}
              >
                <option value="">— Custom (no reference) —</option>
                {referenceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!form.referenceId && (
            <Field label="Reference Title (free-text)">
              <input
                type="text"
                value={form.referenceTitle}
                onChange={(e) => update('referenceTitle', e.target.value)}
                placeholder="e.g. Goa 4D/3N Honeymoon Package"
                className={inputCls}
              />
            </Field>
          )}
        </Section>

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
              placeholder="10-digit mobile"
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

        <Section title="Pricing">
          <Field label="Total Amount (₹)">
            <input
              type="number"
              min={0}
              value={form.totalAmount}
              onChange={(e) => update('totalAmount', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Paid Amount (₹)">
            <input
              type="number"
              min={0}
              value={form.paidAmount}
              onChange={(e) => update('paidAmount', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Payment Status">
            <select value={form.paymentStatus} onChange={(e) => update('paymentStatus', e.target.value)} className={inputCls}>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </Field>
          <Field label="Initial Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputCls}>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputCls} />
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Link href="/travel-agent/bookings" className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Create Booking</>}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
