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
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  created_at: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function ManagerInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInquiry();
  }, [inquiryId]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manager/helpdesk?inquiryId=${inquiryId}`);
      const data = await res.json();

      if (data.success && data.inquiry) {
        setInquiry(data.inquiry);
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
