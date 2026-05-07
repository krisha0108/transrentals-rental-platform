'use client';

import React, { useState } from 'react';
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

const SOURCES = [
  { value: 'MANUAL', label: 'Manual entry' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES = [
  { value: 'HOT', label: '🔥 Hot' },
  { value: 'WARM', label: 'Warm' },
  { value: 'COLD', label: 'Cold' },
];

export default function AddLeadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    source: 'MANUAL',
    tripType: '',
    pickupLocation: '',
    dropLocation: '',
    destination: '',
    travelDate: '',
    returnDate: '',
    passengers: 1,
    requirement: '',
    estimatedValue: '',
    priority: 'WARM',
    nextFollowUp: '',
    assignedToName: '',
  });

  const update = (key: keyof typeof form, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/travel-agent/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const json = await res.json();
        showToast({ type: 'success', title: 'Lead created' });
        router.push(`/travel-agent/leads/${json.lead.id}`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to create lead' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/travel-agent/leads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Leads
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-sm text-gray-500">Capture customer enquiry details</p>
        </div>
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
          <Field label="Lead Source">
            <select value={form.source} onChange={(e) => update('source', e.target.value)} className={inputCls}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Trip Details">
          <Field label="Trip Type">
            <select value={form.tripType} onChange={(e) => update('tripType', e.target.value)} className={inputCls}>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination">
            <input
              type="text"
              value={form.destination}
              onChange={(e) => update('destination', e.target.value)}
              placeholder="e.g. Goa, Manali"
              className={inputCls}
            />
          </Field>
          <Field label="Pickup Location">
            <input
              type="text"
              value={form.pickupLocation}
              onChange={(e) => update('pickupLocation', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Drop Location">
            <input
              type="text"
              value={form.dropLocation}
              onChange={(e) => update('dropLocation', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Travel Date">
            <input
              type="date"
              value={form.travelDate}
              onChange={(e) => update('travelDate', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Return Date">
            <input
              type="date"
              value={form.returnDate}
              onChange={(e) => update('returnDate', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Passengers">
            <input
              type="number"
              min={1}
              value={form.passengers}
              onChange={(e) => update('passengers', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Estimated Value (₹)">
            <input
              type="number"
              min={0}
              value={form.estimatedValue}
              onChange={(e) => update('estimatedValue', e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Requirement / Notes</label>
            <textarea
              rows={3}
              value={form.requirement}
              onChange={(e) => update('requirement', e.target.value)}
              placeholder="Customer's specific requests, preferences, etc."
              className={inputCls}
            />
          </div>
        </Section>

        <Section title="Pipeline & Follow-up">
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Next Follow-up">
            <input
              type="datetime-local"
              value={form.nextFollowUp}
              onChange={(e) => update('nextFollowUp', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Assigned To (your team member)">
            <input
              type="text"
              value={form.assignedToName}
              onChange={(e) => update('assignedToName', e.target.value)}
              placeholder="e.g. Rahul"
              className={inputCls}
            />
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <Link
            href="/travel-agent/leads"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

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
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
