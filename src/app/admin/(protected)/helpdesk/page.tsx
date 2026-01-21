import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const previewText = (value?: string | null, limit = 160) => {
  if (!value) return '—';
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
};

const buildPaginationRange = (current: number, total: number, window = 5) => {
  const half = Math.floor(window / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + window - 1);
  if (end - start < window - 1) {
    start = Math.max(1, end - window + 1);
  }
  const pages = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'OPEN':
    case 'NEW':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'IN_PROGRESS':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'RESOLVED':
    case 'REPLIED':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'CLOSED':
      return 'border-gray-200 bg-gray-50 text-gray-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'URGENT':
      return 'border-red-300 bg-red-100 text-red-800';
    case 'NORMAL':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    case 'LOW':
      return 'border-gray-200 bg-gray-50 text-gray-500';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const getTypeColor = (type: string) => {
  if (type === 'ticket') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  }
  return 'border-orange-200 bg-orange-50 text-orange-700';
};

// Unified item type for both tickets and inquiries
interface UnifiedItem {
  id: string;
  type: 'ticket' | 'inquiry';
  reference: string; // ticketNo or inquiry id
  heading: string;
  description: string;
  status: string;
  priority: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: Date;
  bookingType?: string;
}

export default async function HelpdeskPage({
  searchParams,
}: {
  searchParams?: { page?: string; search?: string; status?: string; type?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const pageSearch = searchParams?.search?.trim() || '';
  const statusFilter = searchParams?.status || '';
  const typeFilter = searchParams?.type || '';
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Build where clauses for tickets
  const ticketWhere: Prisma.helpdesk_ticketsWhereInput = {};
  if (pageSearch) {
    ticketWhere.OR = [
      { ticketNo: { contains: pageSearch } },
      { heading: { contains: pageSearch } },
      { problem: { contains: pageSearch } },
      { customers: { name: { contains: pageSearch } } },
      { customers: { email: { contains: pageSearch } } },
    ];
  }
  if (statusFilter && statusFilter !== 'all') {
    ticketWhere.status = statusFilter.toUpperCase() as any;
  }

  // Build where clauses for inquiries
  const inquiryWhere: Prisma.contact_inquiriesWhereInput = {};
  if (pageSearch) {
    inquiryWhere.OR = [
      { name: { contains: pageSearch } },
      { subject: { contains: pageSearch } },
      { email: { contains: pageSearch } },
      { message: { contains: pageSearch } },
    ];
  }

  // Fetch data based on type filter
  const shouldFetchTickets = !typeFilter || typeFilter === 'ticket';
  const shouldFetchInquiries = !typeFilter || typeFilter === 'inquiry';

  const [
    tickets,
    ticketCount,
    inquiries,
    inquiryCount,
    ticketTodayCount,
    inquiryTodayCount,
    openTicketCount,
    resolvedTicketCount,
  ] = await Promise.all([
    shouldFetchTickets
      ? prisma.helpdesk_tickets.findMany({
          where: ticketWhere,
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    shouldFetchTickets
      ? prisma.helpdesk_tickets.count({ where: ticketWhere })
      : Promise.resolve(0),
    shouldFetchInquiries
      ? prisma.contact_inquiries.findMany({
          where: inquiryWhere,
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    shouldFetchInquiries
      ? prisma.contact_inquiries.count({ where: inquiryWhere })
      : Promise.resolve(0),
    prisma.helpdesk_tickets.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.contact_inquiries.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.helpdesk_tickets.count({ where: { status: 'OPEN' } }),
    prisma.helpdesk_tickets.count({ where: { status: 'RESOLVED' } }),
  ]);

  // Transform tickets to unified format
  const unifiedTickets: UnifiedItem[] = tickets.map((ticket: any) => ({
    id: ticket.id,
    type: 'ticket' as const,
    reference: ticket.ticketNo,
    heading: ticket.heading,
    description: ticket.problem,
    status: ticket.status,
    priority: ticket.priority,
    customerName: ticket.customers?.name || 'Unknown',
    customerEmail: ticket.customers?.email || '',
    customerPhone: ticket.customers?.phone || '',
    createdAt: ticket.createdAt,
    bookingType: ticket.bookingType,
  }));

  // Transform inquiries to unified format
  const unifiedInquiries: UnifiedItem[] = inquiries.map((inquiry: any) => ({
    id: inquiry.id,
    type: 'inquiry' as const,
    reference: `INQ-${inquiry.id.slice(-6).toUpperCase()}`,
    heading: inquiry.subject || 'Contact Inquiry',
    description: inquiry.message,
    status: 'NEW',
    priority: 'NORMAL',
    customerName: inquiry.name,
    customerEmail: inquiry.email,
    customerPhone: inquiry.phone || '',
    createdAt: inquiry.createdAt,
  }));

  // Combine and sort by date
  const allItems = [...unifiedTickets, ...unifiedInquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginate the combined results
  const totalCount = ticketCount + inquiryCount;
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = allItems.slice(skip, skip + ITEMS_PER_PAGE);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const showPagination = totalPages > 1;
  const paginationPages = buildPaginationRange(page, totalPages);

  const stats = [
    { label: 'Total Items', value: totalCount.toLocaleString() },
    { label: 'Tickets', value: ticketCount.toString(), color: 'text-indigo-600' },
    { label: 'Inquiries', value: inquiryCount.toString(), color: 'text-orange-600' },
    { label: 'Open Tickets', value: openTicketCount.toString() },
    { label: 'Resolved', value: resolvedTicketCount.toString() },
    { label: 'Today', value: (ticketTodayCount + inquiryTodayCount).toString() },
  ];

  const createPageLink = (target: number) => {
    const params = new URLSearchParams();
    if (pageSearch) params.set('search', pageSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (target > 1) params.set('page', target.toString());
    const qs = params.toString();
    return qs ? `/admin/helpdesk?${qs}` : '/admin/helpdesk';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Helpdesk</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Manage support tickets and contact inquiries in one place.
          </p>
        </div>
        <div className="text-sm text-slate-500">Updated {formatDateTime(now)}</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <section className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <form className="flex flex-1 flex-wrap items-center gap-3" method="get">
              <label className="flex flex-1 flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Search
                <input
                  type="text"
                  name="search"
                  defaultValue={pageSearch}
                  placeholder="Ticket no, name, email..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Type
                <select
                  name="type"
                  defaultValue={typeFilter}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="ticket">Tickets Only</option>
                  <option value="inquiry">Inquiries Only</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Status
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-indigo-700 mt-5"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <p className="text-sm text-slate-500">
                Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} items
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  Tickets
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Inquiries
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className="bg-white transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(item.type)}`}>
                            {item.type === 'ticket' ? 'Ticket' : 'Inquiry'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{item.reference}</p>
                          {item.bookingType && (
                            <p className="text-xs text-slate-400">{item.bookingType}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{item.customerName}</p>
                          <p className="text-xs text-slate-500">{item.customerPhone || item.customerEmail || '—'}</p>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.heading}</p>
                          <p className="text-xs text-slate-400 truncate">{previewText(item.description, 50)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={item.type === 'ticket'
                              ? `/admin/helpdesk/tickets/${item.id}`
                              : `/admin/helpdesk/inquiries/${item.id}`
                            }
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
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
          {showPagination && (
            <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-semibold text-slate-600">
              <Link
                href={createPageLink(Math.max(1, page - 1))}
                className={`rounded-full border px-3 py-1 transition ${
                  page === 1 ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
                aria-disabled={page === 1}
              >
                Previous
              </Link>
              <div className="flex items-center gap-2">
                {paginationPages.map((target) => (
                  <Link
                    key={target}
                    href={createPageLink(target)}
                    className={`rounded-full px-3 py-1 transition ${
                      target === page
                        ? 'border border-indigo-500 bg-indigo-500 text-white'
                        : 'border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {target}
                  </Link>
                ))}
              </div>
              <Link
                href={createPageLink(Math.min(totalPages, page + 1))}
                className={`rounded-full border px-3 py-1 transition ${
                  page === totalPages ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
                aria-disabled={page === totalPages}
              >
                Next
              </Link>
            </nav>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-5 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 text-sm text-slate-700 shadow-sm h-fit">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dashboard</p>
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          </div>
          <div className="grid gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${stat.color || 'text-slate-900'}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Quick Tips</p>
            <ul className="mt-2 space-y-1 text-xs text-indigo-700">
              <li>• <strong>Tickets:</strong> Customer issues from app</li>
              <li>• <strong>Inquiries:</strong> Website contact forms</li>
              <li>• Prioritize open tickets first</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
