'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  Send,
  CheckCircle2,
  Plane,
  AlertCircle,
} from 'lucide-react';

interface FormMeta {
  slug: string;
  title: string;
  description: string | null;
  defaultTripType: string | null;
  agencyName: string;
  agencyLogo: string | null;
}

const TRIP_TYPES = [
  { value: '', label: 'Not sure / Other' },
  { value: 'ONE_WAY', label: 'One-way' },
  { value: 'ROUND_TRIP', label: 'Round-trip' },
  { value: 'TOUR_PACKAGE', label: 'Tour package' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
];

export default function PublicLeadCaptureForm({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

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
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/lead-capture/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setMeta(json);
          if (json.defaultTripType) {
            setForm((p) => ({ ...p, tripType: json.defaultTripType }));
          }
        } else {
          const j = await res.json();
          setError(j.error || 'Form not available');
        }
      } catch {
        setError('Could not load form');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/travel-agent/lead-capture/${slug}`, {
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

  if (error || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Form Unavailable</h2>
          <p className="text-gray-600 text-sm">{error || 'This capture link is not active.'}</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thanks, we got your enquiry!</h2>
          <p className="text-gray-600 text-sm">
            <strong>{meta.agencyName}</strong> will reach out to you shortly with the best options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              {meta.agencyLogo ? (
                <img src={meta.agencyLogo} alt={meta.agencyName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <p className="text-xs text-emerald-100 font-medium">Powered by</p>
                <p className="font-bold">{meta.agencyName}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold mt-4">{meta.title}</h1>
            {meta.description && (
              <p className="text-sm text-emerald-100 mt-1.5">{meta.description}</p>
            )}
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
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
                  placeholder="10-digit mobile"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Trip Type">
                <select
                  value={form.tripType}
                  onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                  className={inputCls}
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Destination / Place">
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g. Goa, Manali"
                  className={inputCls}
                />
              </Field>
            </div>

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

            <Field label="Tell us about your trip">
              <textarea
                rows={3}
                value={form.requirement}
                onChange={(e) => setForm({ ...form, requirement: e.target.value })}
                placeholder="Any specific preferences, budget, requirements?"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Enquiry
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400">
              Your information goes directly to {meta.agencyName}. We never share or sell your data.
            </p>
          </form>
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
