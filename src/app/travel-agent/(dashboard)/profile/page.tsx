'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  Building2,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const AGENCY_TYPES = [
  { value: 'SOLO', label: 'Solo Agent' },
  { value: 'AGENCY', label: 'Travel Agency' },
  { value: 'CORPORATE', label: 'Corporate / Tour Operator' },
];

interface ProfileData {
  agencyName: string;
  agencyType: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  website: string;
  status: string;
  slug: string;
}

export default function TravelAgentProfilePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData>({
    agencyName: '',
    agencyType: 'AGENCY',
    ownerName: '',
    email: '',
    phone: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    website: '',
    status: '',
    slug: '',
  });
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/travel-agent/profile');
        if (res.ok) {
          const json = await res.json();
          setData({
            agencyName: json.agencyName || '',
            agencyType: json.agencyType || 'AGENCY',
            ownerName: json.ownerName || '',
            email: json.email || '',
            phone: json.phone || '',
            gstNumber: json.gstNumber || '',
            panNumber: json.panNumber || '',
            address: json.address || '',
            city: json.city || '',
            state: json.state || '',
            pincode: json.pincode || '',
            description: json.description || '',
            website: json.website || '',
            status: json.status || '',
            slug: json.slug || json.id || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/travel-agent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Profile updated successfully' });
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to update profile' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error. Please try again.' });
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agency Profile</h1>
            <p className="text-sm text-gray-500">Keep your business information up to date</p>
          </div>
        </div>
      </div>

      {/* Public profile share card */}
      {data.slug && (
        <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wide">
                Your Public Profile
              </p>
              <p className="text-base font-bold mt-1">
                Share one link — customers see your agency, tours, properties & vehicles
              </p>
              <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl p-3 mt-3 flex items-center gap-2">
                <code className="text-xs text-white truncate flex-1 font-mono">
                  {origin}/agent/{data.slug}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${origin}/agent/${data.slug}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    } catch {
                      showToast({ type: 'error', title: 'Could not copy link' });
                    }
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <a
                  href={`/agent/${data.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-3 py-1.5 rounded-lg"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out our travel agency profile: ${origin}/agent/${data.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg"
                >
                  <MessageSquare className="w-3 h-3" /> Share on WhatsApp
                </a>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-100">
                  <Globe className="w-3 h-3" /> Visible to anyone with this link
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Agency Name *" name="agencyName" value={data.agencyName} onChange={handleChange} required />
            <SelectField
              label="Agency Type"
              name="agencyType"
              value={data.agencyType}
              onChange={handleChange}
              options={AGENCY_TYPES}
            />
            <Field label="Owner Name *" name="ownerName" value={data.ownerName} onChange={handleChange} required />
            <Field label="Email" name="email" value={data.email} disabled />
            <Field label="Phone" name="phone" value={data.phone} disabled />
            <Field label="Website" name="website" value={data.website} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={data.description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell customers about your agency..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Tax & Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GST Number" name="gstNumber" value={data.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
            <Field label="PAN Number" name="panNumber" value={data.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
              <textarea
                name="address"
                value={data.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Field label="City" name="city" value={data.city} onChange={handleChange} />
            <Field label="State" name="state" value={data.state} onChange={handleChange} />
            <Field label="Pincode" name="pincode" value={data.pincode} onChange={handleChange} />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
