import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { ArrowLeft, User, Mail, Phone, MessageSquare, Calendar, FileText } from 'lucide-react';

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short', hour12: true }).format(date);
};

export default async function ContactInquiryDetailPage({ params }: { params: { id: string } }) {
  const inquiry = await prisma.contact_inquiries.findUnique({ where: { id: params.id } });

  if (!inquiry) notFound();

  const ref = `INQ-${inquiry.id.slice(-6).toUpperCase()}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/contact-inquiries" className="p-2 hover:bg-slate-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Contact Inquiry</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700">
              {ref}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Received on {formatDateTime(inquiry.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Message */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subject + Message */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Message</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Subject */}
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">Subject</p>
                <p className="text-lg font-semibold text-slate-900">{inquiry.subject}</p>
              </div>
              {/* Message body */}
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Message</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Inquiry Details</h2>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Reference ID</p>
                <p className="font-mono font-semibold text-slate-800">{ref}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Received At</p>
                <p className="text-slate-800">{formatDateTime(inquiry.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Contact Info</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Name</p>
                  <p className="font-semibold text-slate-900">{inquiry.name}</p>
                </div>
              </div>
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Email</p>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {inquiry.email}
                  </a>
                </div>
              </div>
              {/* Phone */}
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
              <Mail className="w-4 h-4" />
              Reply via Email
            </a>
            {inquiry.phone && (
              <a
                href={`tel:${inquiry.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                <Phone className="w-4 h-4" />
                Call Customer
              </a>
            )}
            <Link
              href="/admin/contact-inquiries"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
