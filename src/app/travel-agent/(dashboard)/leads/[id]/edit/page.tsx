'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Target } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const TRIP_TYPES = [
  { value: '', label: 'Not specified' },
  { value: 'ONE_WAY', label: 'One-way' },
  { value: 'ROUND_TRIP', label: 'Round-trip' },
  { value: 'TOUR_PACKAGE', label: 'Tour package' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
];

const PRIORITIES = [
  { value: 'HOT', label: '🔥 Hot' },
  { value: 'WARM', label: 'Warm' },
  { value: 'COLD', label: 'Cold' },
];

const toDateInput = (val: string | null) =>
  val ? new Date(val).toISOString().slice(0, 10) : '';
const toDateTimeInput = (val: string | null) =>
  val ? new Date(val).toISOString().slice(0, 16) : '';

export default function EditLeadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tripType: '',
    pickupLocation: '',
    dropLocation: '',
    destination: '',
    travelDate: '',
    returnDate: '',
    passengers: 1,
    requirement: '',
    estimatedValue: '',
    quotedAmount: '',
    priority: 'WARM',
    nextFollowUp: '',
    assignedToName: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/leads/${id}`);
        if (res.ok) {
          const lead = await res.json();
          setForm({
            customerName: lead.customerName || '',
            customerPhone: lead.customerPhone || '',
            customerEmail: lead.customerEmail || '',
            tripType: lead.tripType || '',
            pickupLocation: lead.pickupLocation || '',
            dropLocation: lead.dropLocation || '',
            destination: lead.destination || '',
            travelDate: toDateInput(lead.travelDate),
            returnDate: toDateInput(lead.returnDate),
            passengers: lead.passengers || 1,
            requirement: lead.requirement || '',
            estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : '',
            quotedAmount: lead.quotedAmount ? String(lead.quotedAmount) : '',
            priority: lead.priority || 'WARM',
            nextFollowUp: toDateTimeInput(lead.nextFollowUp),
            assignedToName: lead.assignedToName || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (key: keyof typeof form, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Lead updated' });
        router.push(`/travel-agent/leads/${id}`);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/travel-agent/leads/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to lead
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Customer">
          <Field label="Customer Name *" required>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Phone *" required>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => update('customerPhone', e.target.value)}
              required
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
          <Field label="Assigned To">
            <input
              type="text"
              value={form.assignedToName}
              onChange={(e) => update('assignedToName', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Trip Details">
          <Field label="Trip Type">
            <select value={form.tripType} onChange={(e) => update('tripType', e.target.value)} className={inputCls}>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Destination">
            <input type="text" value={form.destination} onChange={(e) => update('destination', e.target.value)} className={inputCls} />
          </Field>
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
          <Field label="Estimated Value (₹)">
            <input type="number" min={0} value={form.estimatedValue} onChange={(e) => update('estimatedValue', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Quoted Amount (₹)">
            <input type="number" min={0} value={form.quotedAmount} onChange={(e) => update('quotedAmount', e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Requirement / Notes</label>
            <textarea rows={3} value={form.requirement} onChange={(e) => update('requirement', e.target.value)} className={inputCls} />
          </div>
        </Section>

        <Section title="Pipeline & Follow-up">
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Next Follow-up">
            <input type="datetime-local" value={form.nextFollowUp} onChange={(e) => update('nextFollowUp', e.target.value)} className={inputCls} />
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <Link href={`/travel-agent/leads/${id}`} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5">
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

const inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

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
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
