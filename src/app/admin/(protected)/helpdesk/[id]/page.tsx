import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';

const formatDateTime = (value?: string | Date) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default async function InquiryDetailPage({ params }: { params: { id: string } }) {
  const inquiry = await prisma.contact_inquiries.findUnique({
    where: { id: params.id },
  });

  if (!inquiry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50 px-4 py-12">
        <p className="text-lg font-semibold text-red-600">Inquiry not found.</p>
        <Link
          href="/admin/helpdesk"
          className="rounded-full border border-indigo-600 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700"
        >
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          {/* <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Helpdesk</p> */}
          <h1 className="text-3xl font-semibold text-slate-900">Helpdesk detail</h1>
          <p className="text-sm text-slate-500">
            Use this view to read the whole message, confirm the contact details, and respond confidently.
          </p>
        </div>
       <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/60 px-5 py-3 shadow-sm backdrop-blur-sm 
                text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600 border border-slate-200">
  <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 shadow-sm">
    {inquiry.name}
  </span>

  <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 shadow-sm">
    {inquiry.subject || 'No subject'}
  </span>

  <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 shadow-sm">
    {formatDateTime(inquiry.createdAt)}
  </span>

  <Link
    href="/admin/helpdesk"
    className="ml-auto rounded-full border border-indigo-600 bg-indigo-50 px-4 py-[6px] 
               text-indigo-700 transition-all hover:bg-indigo-100 hover:shadow-md"
  >
    Back to inbox
  </Link>
</div>

      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <article className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Message</h2>
            <span className="text-xs font-medium uppercase tracking-[0.4em] text-emerald-600">
              {inquiry.subject ? 'Detailed' : 'General'}
            </span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{inquiry.message}</p>
        </article>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Contact</p>
            <h3 className="text-xl font-semibold text-slate-900">Reach out instantly</h3>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-600 shadow-inner">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</p>
            <p className="font-semibold text-slate-900">{inquiry.email}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Phone</p>
            <p className="font-semibold text-slate-900">{inquiry.phone}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Received</p>
            <p className="font-semibold text-slate-900">{formatDateTime(inquiry.createdAt)}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next steps</p>
            <p>Call, confirm, or reply with the CRM template—copy the message above if needed.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
