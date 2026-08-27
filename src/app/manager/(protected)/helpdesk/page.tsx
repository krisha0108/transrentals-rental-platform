'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

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

const toDateInputValue = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DATE_RANGE_PRESETS: Record<string, () => { from: string; to: string }> = {
  today: () => {
    const today = toDateInputValue(new Date());
    return { from: today, to: today };
  },
  week: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: toDateInputValue(start), to: toDateInputValue(now) };
  },
  month: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateInputValue(start), to: toDateInputValue(now) };
  },
};

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
  useManagerPageHeader('Helpdesk', 'Manage support tickets and contact inquiries in one place.');
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
  const [submitterFilter, setSubmitterFilter] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleDateRangePresetChange = (value: string) => {
    setDateRangePreset(value);
    if (value === 'custom' || value === '') {
      setDateFrom('');
      setDateTo('');
    } else {
      const preset = DATE_RANGE_PRESETS[value]?.();
      setDateFrom(preset?.from || '');
      setDateTo(preset?.to || '');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (submitterFilter) params.set('submitter', submitterFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
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
  }, [search, typeFilter, statusFilter, submitterFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const hasActiveFilters = !!(search || typeFilter || statusFilter || submitterFilter || dateRangePreset);

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setSubmitterFilter('');
    setDateRangePreset('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
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
      {/* Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dashboard</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">Overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
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
      </div>

      {/* Quick Tips */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Quick Tips</span>
        <span className="text-[12px] text-indigo-700"><strong>Tickets:</strong> Customer issues from app</span>
        <span className="text-[12px] text-indigo-700"><strong>Inquiries:</strong> Website contact forms</span>
        <span className="text-[12px] text-indigo-700">Prioritize open tickets first</span>
      </div>

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
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Cancelled</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Submitter
                <select
                  value={submitterFilter}
                  onChange={(e) => setSubmitterFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="">All Submitters</option>
                  <option value="customer">Customers</option>
                  <option value="travel_agent">Travel Agents</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Date Range
                <select
                  value={dateRangePreset}
                  onChange={(e) => handleDateRangePresetChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              {dateRangePreset === 'custom' && (
                <>
                  <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    From
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      max={dateTo || undefined}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    To
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </label>
                </>
              )}
              <div className="flex items-center gap-2 mt-5">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-indigo-700 hover:shadow-md"
                >
                  Filter
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>
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
          {pagination.total > 0 && (
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
    </div>
  );
}
