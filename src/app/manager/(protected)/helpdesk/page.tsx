'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string | null) => {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value));
};

const previewText = (value?: string | null, limit = 50) => {
  if (!value) return '\u2014';
  return value.length > limit ? `${value.slice(0, limit)}\u2026` : value;
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
    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getTypeColor = (type: string) => {
  if (type === 'ticket') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  }
  return 'border-orange-200 bg-orange-50 text-orange-700';
};

interface UnifiedItem {
  id: string;
  type: 'ticket' | 'inquiry';
  reference: string;
  heading: string;
  description: string;
  status: string;
  priority: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  bookingType?: string;
}

interface Stats {
  totalItems: number;
  totalTickets: number;
  totalInquiries: number;
  openTickets: number;
  resolvedTickets: number;
  todayCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const buildPaginationRange = (current: number, total: number, window = 5) => {
  const half = Math.floor(window / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + window - 1);
  if (end - start < window - 1) {
    start = Math.max(1, end - window + 1);
  }
  const pages = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
};

export default function ManagerHelpdeskPage() {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    totalTickets: 0,
    totalInquiries: 0,
    openTickets: 0,
    resolvedTickets: 0,
    todayCount: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (currentPage > 1) params.set('page', currentPage.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());

      const qs = params.toString();
      const res = await fetch(`/api/manager/helpdesk${qs ? `?${qs}` : ''}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.items || []);
        setStats(data.stats || stats);
        setPagination(data.pagination || pagination);
      }
    } catch (err) {
      console.error('Error fetching helpdesk data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const paginationPages = buildPaginationRange(pagination.page, pagination.totalPages);
  const skip = (pagination.page - 1) * ITEMS_PER_PAGE;

  const statCards = [
    { label: 'Total Items', value: stats.totalItems.toLocaleString() },
    { label: 'Tickets', value: stats.totalTickets.toString(), color: 'text-indigo-600' },
    { label: 'Inquiries', value: stats.totalInquiries.toString(), color: 'text-orange-600' },
    { label: 'Open Tickets', value: stats.openTickets.toString() },
    { label: 'Resolved', value: stats.resolvedTickets.toString() },
    { label: 'Today', value: stats.todayCount.toString() },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Helpdesk</h1>
          <p className="text-sm text-indigo-100 mt-1">
            Manage support tickets and contact inquiries in one place.
          </p>
        </div>
        <div className="text-xs text-indigo-200 font-medium">Last updated: {formatDateTime(new Date().toISOString())}</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <section className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <form className="flex flex-1 flex-wrap items-center gap-3" onSubmit={handleFilter}>
              <label className="flex flex-1 flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Search
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ticket no, name, email..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Type
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="">All Types</option>
                  <option value="ticket">Tickets Only</option>
                  <option value="inquiry">Inquiries Only</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Status
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Cancelled</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-indigo-700 hover:shadow-md mt-5"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/50">
              <p className="text-[13px] font-medium text-slate-500">
                {loading
                  ? 'Loading...'
                  : `Showing ${items.length === 0 ? 0 : skip + 1}\u2013${Math.min(skip + ITEMS_PER_PAGE, pagination.total)} of ${pagination.total.toLocaleString()} items`}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  Tickets
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Inquiries
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reference</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Subject</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={`${item.type}-${item.id}`}
                          className="bg-white transition hover:bg-indigo-50/30 group"
                        >
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${getTypeColor(item.type)}`}
                            >
                              {item.type === 'ticket' ? 'Ticket' : 'Inquiry'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-bold text-slate-900">{item.reference}</p>
                            {item.bookingType && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.bookingType}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-semibold text-slate-800">{item.customerName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.customerPhone || item.customerEmail || '\u2014'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">
                              {item.heading}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {previewText(item.description)}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${getStatusColor(item.status)}`}
                            >
                              {item.status === 'CLOSED' ? 'CANCELLED' : item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <Link
                              href={
                                item.type === 'ticket'
                                  ? `/manager/helpdesk/tickets/${item.id}`
                                  : `/manager/helpdesk/inquiries/${item.id}`
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-600 shadow-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`rounded-full border px-3 py-1 transition ${
                  currentPage === 1
                    ? 'cursor-not-allowed border-slate-200 text-slate-400'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {paginationPages.map((target) => (
                  <button
                    key={target}
                    onClick={() => setCurrentPage(target)}
                    className={`rounded-full px-3 py-1 transition ${
                      target === currentPage
                        ? 'border border-indigo-500 bg-indigo-500 text-white'
                        : 'border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {target}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className={`rounded-full border px-3 py-1 transition ${
                  currentPage === pagination.totalPages
                    ? 'cursor-not-allowed border-slate-200 text-slate-400'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                Next
              </button>
            </nav>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm h-fit">
          <div className="pb-3 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dashboard</p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-center"
              >
                <p className={`text-xl font-bold ${stat.color || 'text-slate-900'}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3.5 py-3 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-2">Quick Tips</p>
            <ul className="space-y-1.5 text-[12px] text-indigo-700 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span><strong>Tickets:</strong> Customer issues from app</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span><strong>Inquiries:</strong> Website contact forms</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>Prioritize open tickets first</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
