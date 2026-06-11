import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import {
  ArrowLeft, User, Mail, Phone, MessageSquare, Calendar,
  AlertCircle, Clock, CheckCircle, XCircle, Hash,
} from 'lucide-react';
import StatusUpdater from './StatusUpdater';

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(date);
};

const STATUS_META: Record<string, { label: string; pill: string; icon: React.ElementType }> = {
  NEW:         { label: 'New',         pill: 'bg-blue-50 text-blue-700 border-blue-200',    icon: AlertCircle },
  IN_PROGRESS: { label: 'In Progress', pill: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  RESOLVED:    { label: 'Resolved',    pill: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  CLOSED:      { label: 'Closed',      pill: 'bg-gray-100 text-gray-600 border-gray-200',   icon: XCircle },
};

export default async function ContactInquiryDetailPage({ params }: { params: { id: string } }) {
  const inquiry = await prisma.contact_inquiries.findUnique({ where: { id: params.id } });
  if (!inquiry) notFound();

  const ref = `INQ-${inquiry.id.slice(-6).toUpperCase()}`;
  const statusMeta = STATUS_META[inquiry.status] || STATUS_META.NEW;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-5">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/manager/contact-inquiries" className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Contact Inquiry</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                {ref}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.pill}`}>
                <StatusIcon className="w-3 h-3" />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(inquiry.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick action buttons in header */}
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Mail className="w-4 h-4" />
            Reply
          </a>
          {inquiry.phone && (
            <a
              href={`tel:${inquiry.phone}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
      </div>

      {/* ── Contact info strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: User,     color: 'bg-indigo-100 text-indigo-600', label: 'Name',  value: inquiry.name },
          { icon: Mail,     color: 'bg-blue-100 text-blue-600',     label: 'Email', value: inquiry.email, href: `mailto:${inquiry.email}` },
          { icon: Phone,    color: 'bg-green-100 text-green-600',   label: 'Phone', value: inquiry.phone || '—', href: inquiry.phone ? `tel:${inquiry.phone}` : undefined },
          { icon: Hash,     color: 'bg-orange-100 text-orange-600', label: 'Ref ID', value: ref },
        ].map(({ icon: Icon, color, label, value, href }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</p>
              {href ? (
                <a href={href} className="text-sm font-semibold text-gray-800 hover:underline truncate block">{value}</a>
              ) : (
                <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content: Message + Status side by side ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Message — wider column */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Message</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Subject</p>
              <p className="text-base font-semibold text-gray-900">{inquiry.subject}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Message</p>
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 min-h-[120px]">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{inquiry.message}</p>
              </div>
            </div>

            {/* Resolution notes (read-only if resolved) */}
            {inquiry.resolution && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Resolution Notes</p>
                <div className="bg-green-50 rounded-lg border border-green-100 p-4">
                  <p className="text-green-800 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.resolution}</p>
                </div>
              </div>
            )}

            {inquiry.resolvedAt && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Resolved on {formatDateTime(inquiry.resolvedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Status updater — narrower column */}
        <div className="lg:col-span-2">
          <StatusUpdater
            inquiryId={inquiry.id}
            currentStatus={inquiry.status}
            currentResolution={inquiry.resolution ?? null}
          />
        </div>
      </div>

    </div>
  );
}
