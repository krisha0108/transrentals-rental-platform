'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, Mail, Calendar, MessageSquare,
  CheckCircle, Send, Loader2,
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short', hour12: true }).format(new Date(value));
};

const statusColors: Record<string, string> = {
  NEW: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  RESOLVED: 'border-green-200 bg-green-50 text-green-700',
  CLOSED: 'border-gray-200 bg-gray-50 text-gray-600',
};

export default function InquiryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NEW');
  const [resolution, setResolution] = useState('');

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/admin/contact-inquiries/${id}`);
      const data = await res.json();
      if (data.inquiry) {
        setInquiry(data.inquiry);
        setStatus(data.inquiry.status || 'NEW');
        setResolution(data.inquiry.resolution || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInquiry(); }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contact-inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      });
      if (res.ok) {
        await fetchInquiry();
        alert('Inquiry updated successfully');
      } else {
        alert('Failed to update inquiry');
      }
    } catch {
      alert('Failed to update inquiry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="space-y-4">
        <Link href="/admin/helpdesk" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
        </Link>
        <p className="text-slate-500">Inquiry not found.</p>
      </div>
    );
  }

  const ref = `INQ-${inquiry.id.slice(-6).toUpperCase()}`;
  const isResolved = inquiry.status === 'RESOLVED' || inquiry.status === 'CLOSED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/helpdesk" className="p-2 hover:bg-slate-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Contact Inquiry</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700">
              {ref}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[inquiry.status] || statusColors.NEW}`}>
              {inquiry.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Received {formatDateTime(inquiry.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Message + Resolution */}
        <div className="lg:col-span-2 space-y-5">
          {/* Message */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Message Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">Subject</p>
                <p className="text-lg font-semibold text-slate-900">{inquiry.subject}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Message</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution / Response */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-slate-900">Resolution / Response</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Show resolved note if already resolved */}
              {isResolved && inquiry.resolution && (
                <div className={`rounded-xl p-4 border ${inquiry.status === 'CLOSED' ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-100'}`}>
                  <p className={`text-xs mb-1 ${inquiry.status === 'CLOSED' ? 'text-gray-500' : 'text-green-600'}`}>
                    {inquiry.status === 'CLOSED' ? 'Closed' : 'Resolved'} on {formatDateTime(inquiry.resolvedAt)}
                  </p>
                  <p className={`whitespace-pre-wrap ${inquiry.status === 'CLOSED' ? 'text-gray-700' : 'text-green-900'}`}>
                    {inquiry.resolution}
                  </p>
                </div>
              )}

              {/* Update controls — always visible */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Notes</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  placeholder="Add resolution notes or response to customer..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Send className="w-4 h-4" /> Update Inquiry</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Customer Info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Contact Info</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Name</p>
                  <p className="font-semibold text-slate-900">{inquiry.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Email</p>
                  <a href={`mailto:${inquiry.email}`} className="font-medium text-blue-600 hover:underline break-all">
                    {inquiry.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Phone</p>
                  <a href={`tel:${inquiry.phone}`} className="font-medium text-green-600 hover:underline">
                    {inquiry.phone || '—'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400">Quick Actions</p>
            <a
              href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              <Mail className="w-4 h-4" /> Reply via Email
            </a>
            {inquiry.phone && (
              <a
                href={`tel:${inquiry.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                <Phone className="w-4 h-4" /> Call Customer
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
