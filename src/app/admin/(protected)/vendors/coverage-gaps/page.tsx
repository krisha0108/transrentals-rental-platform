import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { MapPinOff, Search, Calendar, User, Hash } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

const SERVICE_LABELS: Record<string, string> = {
  bike: 'Bike Rental',
  'self-drive': 'Self Drive',
  bus: 'Bus Rental',
  truck: 'Transporter',
  luxury: 'Luxury Car',
  packers: 'Packers & Movers',
  equipment: 'Equipment Rental',
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(date);
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

export default async function VendorCoverageGapsPage({
  searchParams,
}: {
  searchParams?: { page?: string; search?: string; service?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const search = searchParams?.search?.trim() || '';
  const service = searchParams?.service?.trim() || '';
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const where: Prisma.vendor_coverage_gapsWhereInput = {
    ...(service ? { serviceType: service } : {}),
    ...(search
      ? {
          OR: [
            { locationName: { contains: search } },
            { customerName: { contains: search } },
            { requestNumber: { contains: search } },
          ],
        }
      : {}),
  };

  const [gaps, total, todayCount, weekCount, byLocation] = await Promise.all([
    prisma.vendor_coverage_gaps.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.vendor_coverage_gaps.count({ where }),
    prisma.vendor_coverage_gaps.count({ where: { ...where, createdAt: { gte: todayStart } } }),
    prisma.vendor_coverage_gaps.count({ where: { ...where, createdAt: { gte: weekStart } } }),
    prisma.vendor_coverage_gaps.groupBy({
      by: ['locationName'],
      where,
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);

  // Per-location service breakdown, for the chips in the location table.
  const byLocationService = await prisma.vendor_coverage_gaps.groupBy({
    by: ['locationName', 'serviceType'],
    where: { locationName: { in: byLocation.map((l) => l.locationName) } },
    _count: { id: true },
  });
  const serviceBreakdownByLocation = new Map<string, { serviceType: string; count: number }[]>();
  for (const row of byLocationService) {
    const list = serviceBreakdownByLocation.get(row.locationName) || [];
    list.push({ serviceType: row.serviceType, count: row._count.id });
    serviceBreakdownByLocation.set(row.locationName, list);
  }

  const distinctLocations = await prisma.vendor_coverage_gaps.findMany({
    where,
    distinct: ['locationName'],
    select: { locationName: true },
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const createPageLink = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (service) params.set('service', service);
    if (target > 1) params.set('page', target.toString());
    const qs = params.toString();
    return qs ? `/admin/vendors/coverage-gaps?${qs}` : '/admin/vendors/coverage-gaps';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Vendor Coverage Gaps</h1>
          <p className="text-sm text-slate-500">
            Inquiries where no vendor was eligible (approved service + location) to receive them
          </p>
        </div>
        <p className="text-sm text-slate-400">Updated {formatDateTime(now)}</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Gap Inquiries', value: total, color: 'text-slate-900' },
          { label: 'Today', value: todayCount, color: 'text-red-600' },
          { label: 'This Week', value: weekCount, color: 'text-amber-600' },
          { label: 'Locations Affected', value: distinctLocations.length, color: 'text-indigo-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by location, customer, request no..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <select
          name="service"
          defaultValue={service}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Services</option>
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Filter
        </button>
        {(search || service) && (
          <Link
            href="/admin/vendors/coverage-gaps"
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Location breakdown */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Top Locations Without an Available Vendor</h2>
          <p className="text-xs text-slate-400 mt-0.5">Where to prioritize vendor recruitment</p>
        </div>
        {byLocation.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No coverage gaps recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Gap Inquiries</th>
                  <th className="px-6 py-3">By Service</th>
                  <th className="px-6 py-3">Last Inquiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byLocation.map((loc) => (
                  <tr key={loc.locationName} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{loc.locationName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                        {loc._count.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(serviceBreakdownByLocation.get(loc.locationName) || [])
                          .sort((a, b) => b.count - a.count)
                          .map((s) => (
                            <span
                              key={s.serviceType}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium text-slate-600"
                            >
                              {SERVICE_LABELS[s.serviceType] || s.serviceType}
                              <span className="text-slate-400">{s.count}</span>
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(loc._max.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual gap records */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            {total === 0
              ? 'No coverage-gap inquiries found'
              : `Showing ${skip + 1}–${Math.min(skip + ITEMS_PER_PAGE, total)} of ${total.toLocaleString()} inquiries`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-3">Request</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gaps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No coverage-gap inquiries found</p>
                    {(search || service) && <p className="text-xs mt-1">Try a different filter</p>}
                  </td>
                </tr>
              ) : (
                gaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> {gap.requestNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {SERVICE_LABELS[gap.serviceType] || gap.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{gap.locationName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1">
                      <User className="w-3 h-3" /> {gap.customerName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(gap.createdAt)}
                      </span>
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
