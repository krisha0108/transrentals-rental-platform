'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string | null) => {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
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
      return 'border-gray-200 bg-gray-50 text-gray-700';
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
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Helpdesk</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Manage support tickets and contact inquiries in one place.
          </p>
        </div>
        <div className="text-sm text-slate-500">Updated {formatDateTime(new Date().toISOString())}</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <section className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <form className="flex flex-1 flex-wrap items-center gap-3" onSubmit={handleFilter}>
              <label className="flex flex-1 flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Search
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ticket no, name, email..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Type
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                {loading
                  ? 'Loading...'
                  : `Showing ${items.length === 0 ? 0 : skip + 1}\u2013${Math.min(skip + ITEMS_PER_PAGE, pagination.total)} of ${pagination.total.toLocaleString()} items`}
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

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
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
                          className="bg-white transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(item.type)}`}
                            >
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
                            <p className="text-xs text-slate-500">
                              {item.customerPhone || item.customerEmail || '\u2014'}
                            </p>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {item.heading}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {previewText(item.description)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(item.status)}`}
                            >
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={
                                item.type === 'ticket'
                                  ? `/manager/helpdesk/tickets/${item.id}`
                                  : `/manager/helpdesk/inquiries/${item.id}`
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
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-semibold text-slate-600">
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
        <aside className="space-y-5 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 text-sm text-slate-700 shadow-sm h-fit">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dashboard</p>
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          </div>
          <div className="grid gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${stat.color || 'text-slate-900'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Quick Tips</p>
            <ul className="mt-2 space-y-1 text-xs text-indigo-700">
              <li>
                <strong>Tickets:</strong> Customer issues from app
              </li>
              <li>
                <strong>Inquiries:</strong> Website contact forms
              </li>
              <li>Prioritize open tickets first</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
