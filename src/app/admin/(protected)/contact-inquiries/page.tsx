import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { MessageSquare, Mail, Phone, Search, Calendar } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const previewText = (value?: string | null, limit = 80) => {
  if (!value) return '—';
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
};

const buildPaginationRange = (current: number, total: number, window = 5) => {
  const half = Math.floor(window / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + window - 1);
  if (end - start < window - 1) start = Math.max(1, end - window + 1);
  const pages = [];
  for (let page = start; page <= end; page++) pages.push(page);
  return pages;
};

export default async function ContactInquiriesPage({
  searchParams,
}: {
  searchParams?: { page?: string; search?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const search = searchParams?.search?.trim() || '';
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const where: Prisma.contact_inquiriesWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { subject: { contains: search } },
          { message: { contains: search } },
        ],
      }
    : {};

  const [inquiries, total, todayCount, weekCount] = await Promise.all([
    prisma.contact_inquiries.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.contact_inquiries.count({ where }),
    prisma.contact_inquiries.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.contact_inquiries.count({ where: { createdAt: { gte: weekStart } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const createPageLink = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (target > 1) params.set('page', target.toString());
    const qs = params.toString();
    return qs ? `/admin/contact-inquiries?${qs}` : '/admin/contact-inquiries';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contact Inquiries</h1>
          <p className="text-sm text-slate-500">All messages submitted via the contact form</p>
        </div>
        <p className="text-sm text-slate-400">Updated {formatDateTime(now)}</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-slate-900' },
          { label: 'Today', value: todayCount, color: 'text-indigo-600' },
          { label: 'This Week', value: weekCount, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <form method="get" className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, phone, subject..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Search
        </button>
        {search && (
          <Link
            href="/admin/contact-inquiries"
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            {total === 0
              ? 'No inquiries found'
              : `Showing ${skip + 1}–${Math.min(skip + ITEMS_PER_PAGE, total)} of ${total.toLocaleString()} inquiries`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-3">Ref</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No inquiries found</p>
                    {search && <p className="text-xs mt-1">Try a different search term</p>}
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        INQ-{inq.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{inq.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {inq.email}
                      </p>
                      {inq.phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {inq.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      <p className="font-medium text-slate-800 truncate">{inq.subject}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[240px]">
                      <p className="text-slate-500 text-xs truncate">{previewText(inq.message)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(inq.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/contact-inquiries/${inq.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-semibold text-slate-600">
          <Link
            href={createPageLink(Math.max(1, page - 1))}
            className={`rounded-full border px-3 py-1 transition ${page === 1 ? 'cursor-not-allowed border-slate-200 text-slate-300' : 'border-slate-300 hover:border-slate-400'}`}
            aria-disabled={page === 1}
          >
            Previous
          </Link>
          <div className="flex items-center gap-2">
            {buildPaginationRange(page, totalPages).map((target) => (
              <Link
                key={target}
                href={createPageLink(target)}
                className={`rounded-full px-3 py-1 transition ${target === page ? 'bg-indigo-600 text-white border border-indigo-600' : 'border border-slate-200 hover:border-slate-400'}`}
              >
                {target}
              </Link>
            ))}
          </div>
          <Link
            href={createPageLink(Math.min(totalPages, page + 1))}
            className={`rounded-full border px-3 py-1 transition ${page === totalPages ? 'cursor-not-allowed border-slate-200 text-slate-300' : 'border-slate-300 hover:border-slate-400'}`}
            aria-disabled={page === totalPages}
          >
            Next
          </Link>
        </nav>
      )}
    </div>
  );
}
