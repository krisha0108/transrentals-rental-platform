'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  PowerOff,
  Power,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

interface CaptureLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  defaultTripType: string | null;
  isActive: boolean;
  totalSubmissions: number;
  leadsGenerated: number;
  createdAt: string;
}

const TRIP_TYPES = [
  { value: '', label: 'No default' },
  { value: 'ONE_WAY', label: 'One-way' },
  { value: 'ROUND_TRIP', label: 'Round-trip' },
  { value: 'TOUR_PACKAGE', label: 'Tour package' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
];

export default function CaptureLinksPage() {
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [links, setLinks] = useState<CaptureLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    defaultTripType: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/travel-agent/capture-links');
      if (res.ok) {
        const json = await res.json();
        setLinks(json.links || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      openVerificationModal();
      return;
    }
    setSubmitting(true);
    try {
      const res = editingId
        ? await fetch(`/api/travel-agent/capture-links/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
        : await fetch('/api/travel-agent/capture-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
      if (res.ok) {
        showToast({ type: 'success', title: editingId ? 'Capture link updated' : 'Capture link created' });
        setForm({ title: '', description: '', defaultTripType: '' });
        setEditingId(null);
        setShowForm(false);
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || (editingId ? 'Failed to update link' : 'Failed to create link') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (link: CaptureLink) => {
    if (!isApproved) {
      openVerificationModal();
      return;
    }
    setForm({
      title: link.title,
      description: link.description || '',
      defaultTripType: link.defaultTripType || '',
    });
    setEditingId(link.id);
    setShowForm(true);
  };

  const toggleActive = async (link: CaptureLink) => {
    const res = await fetch(`/api/travel-agent/capture-links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: link.isActive ? 'Link disabled' : 'Link enabled' });
      await load();
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this capture link? Existing leads will be kept but unlinked.')) return;
    const res = await fetch(`/api/travel-agent/capture-links/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Capture link deleted' });
      await load();
    }
  };

  const copyLink = async (slug: string, id: string) => {
    const url = `${origin}/travel-agent/lead/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      showToast({ type: 'error', title: 'Could not copy link' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Link2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Capture Links</h1>
            <p className="text-sm text-gray-500">
              Share a public form link — customer fills it, lead lands in your pipeline
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!isApproved) {
              openVerificationModal();
              return;
            }
            setEditingId(null);
            setForm({ title: '', description: '', defaultTripType: '' });
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Link
        </button>
      </div>

      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          ⚠️ Public capture links are only available after verification. You can still manage your other lead-management features in soft-access mode.
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Capture Link' : 'New Capture Link'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Form Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g. Book your Goa Trip with us"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Shown to customers above the form"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Default Trip Type
              </label>
              <select
                value={form.defaultTripType}
                onChange={(e) => setForm({ ...form, defaultTripType: e.target.value })}
                className={inputCls}
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Save Changes' : 'Create Link'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No capture links yet</p>
          <p className="text-sm text-gray-400">
            Create one to start collecting leads through a shareable URL
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => {
            const url = `${origin}/travel-agent/lead/${link.slug}`;
            return (
              <div
                key={link.id}
                className={`bg-white rounded-2xl border p-5 ${
                  link.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{link.title}</p>
                    {link.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{link.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {link.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Public URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-700 truncate flex-1">{url}</code>
                    <button
                      onClick={() => copyLink(link.slug, link.id)}
                      className="text-emerald-600 hover:text-emerald-700 shrink-0"
                      title="Copy link"
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{link.totalSubmissions} submissions</span>
                  <span>{link.leadsGenerated} leads generated</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 text-gray-700 font-semibold text-xs py-2 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </a>
                  <button
                    onClick={() => startEdit(link)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 text-gray-700 font-semibold text-xs py-2 rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(link)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-amber-300 hover:text-amber-700 text-gray-700 font-semibold text-xs py-2 rounded-lg"
                  >
                    {link.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {link.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="flex items-center justify-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs py-2 px-3 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
