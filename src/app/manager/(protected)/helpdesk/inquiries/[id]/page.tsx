'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW',         label: 'New',         pill: 'bg-blue-50 text-blue-700 border-blue-200',    icon: AlertCircle },
  { value: 'IN_PROGRESS', label: 'In Progress', pill: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  { value: 'RESOLVED',    label: 'Resolved',    pill: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  { value: 'CLOSED',      label: 'Closed',      pill: 'bg-gray-100 text-gray-600 border-gray-200',   icon: XCircle },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]['value'];

const formatDateTime = (value?: string | null) => {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value));
};

export default function ManagerInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState<StatusValue>('NEW');
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiry();
  }, [inquiryId]);

  const handleSaveStatus = async () => {
    if (!inquiry) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/manager/contact-inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution: resolution.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setInquiry({ ...inquiry, status, resolution: resolution.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manager/helpdesk?inquiryId=${inquiryId}`);
      const data = await res.json();

      if (data.success && data.inquiry) {
        setInquiry(data.inquiry);
        setStatus((data.inquiry.status as StatusValue) || 'NEW');
        setResolution(data.inquiry.resolution || '');
      } else {
        setError('Inquiry not found');
      }
    } catch (err) {
      console.error('Error fetching inquiry:', err);
      setError('Failed to load inquiry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Inquiry Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">{error || 'The requested inquiry could not be found.'}</p>
          <Link
            href="/manager/helpdesk"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Helpdesk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Contact Inquiry</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700">
              Inquiry
            </span>
            {(() => {
              const opt = STATUS_OPTIONS.find((o) => o.value === inquiry.status) || STATUS_OPTIONS[0];
              const Icon = opt.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${opt.pill}`}>
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </span>
              );
            })()}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            INQ-{inquiry.id.slice(-6).toUpperCase()} &bull; Received {formatDateTime(inquiry.created_at)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                Message Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Subject</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {inquiry.subject || 'No Subject'}
                </h3>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Message</p>
                <div className="bg-slate-50 rounded-xl p-4 text-slate-700 whitespace-pre-wrap min-h-[150px]">
                  {inquiry.message}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject || 'Your inquiry'}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  <Mail className="w-4 h-4" />
                  Reply via Email
                </a>
                {inquiry.phone && (
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Phone className="w-4 h-4" />
                    Call Customer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Contact Details
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{inquiry.name}</p>
                    <p className="text-sm text-slate-500">Website Visitor</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${inquiry.email}`} className="text-indigo-600 hover:underline">
                      {inquiry.email}
                    </a>
                  </div>
                  {inquiry.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${inquiry.phone}`} className="text-indigo-600 hover:underline">
                        {inquiry.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Resolution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Status & Resolution</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                          isSelected
                            ? `${opt.pill} ring-2 ring-offset-1 ring-current`
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Resolution Notes</p>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Add notes about how this inquiry was resolved..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{saveError}</p>
              )}

              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={saving || (status === inquiry.status && resolution === (inquiry.resolution || ''))}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  saved
                    ? 'bg-green-600 text-white'
                    : status === inquiry.status && resolution === (inquiry.resolution || '')
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4" /> Saved!</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Inquiry Received</p>
                    <p className="text-xs text-slate-500">{formatDateTime(inquiry.created_at)}</p>
                  </div>
                </div>
                {inquiry.resolved_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Resolved</p>
                      <p className="text-xs text-slate-500">{formatDateTime(inquiry.resolved_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
            <h3 className="font-semibold text-orange-900 mb-2">Response Tips</h3>
            <ul className="space-y-2 text-sm text-orange-700">
              <li>Respond within 24 hours</li>
              <li>Address all questions in their message</li>
              <li>Provide clear next steps</li>
              <li>Include your contact info</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
