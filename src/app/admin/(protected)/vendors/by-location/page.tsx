import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { MapPin, Search, Users, CheckCircle2, Layers } from 'lucide-react';
import { getCoreServiceCatalog } from '@/lib/services/vendor-service-status';

const ITEMS_PER_PAGE = 25;

const buildPaginationRange = (current: number, total: number, window = 5) => {
  const half = Math.floor(window / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + window - 1);
  if (end - start < window - 1) start = Math.max(1, end - window + 1);
  const pages = [];
  for (let page = start; page <= end; page++) pages.push(page);
  return pages;
};

const LOCATION_TYPES = ['COUNTRY', 'STATE', 'UNION_TERRITORY', 'CITY', 'AREA', 'AIRPORT', 'VILLAGE'] as const;

export default async function VendorsByLocationPage({
  searchParams,
}: {
  searchParams?: { page?: string; search?: string; type?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const search = searchParams?.search?.trim() || '';
  const type = searchParams?.type?.trim() || '';
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const now = new Date();

  // Only vendors whose account is actually APPROVED count as "available" —
  // a suspended/rejected vendor's leftover location-approval row shouldn't
  // inflate the count.
  const approvedVendorFilter = { vendors: { status: 'APPROVED' as const } };

  let locationIdFilter: string[] | undefined;
  if (search || type) {
    const matches = await prisma.locations.findMany({
      where: {
        ...(search ? { name: { contains: search } } : {}),
        ...(type ? { type: type as (typeof LOCATION_TYPES)[number] } : {}),
      },
      select: { id: true },
    });
    locationIdFilter = matches.map((m) => m.id);
  }

  const groupWhere = {
    ...approvedVendorFilter,
    ...(locationIdFilter ? { locationId: { in: locationIdFilter } } : {}),
  };

  const [totalGroup, allCounts, activeCounts] = await Promise.all([
    prisma.vendor_approved_locations.groupBy({
      by: ['locationId'],
      where: groupWhere,
    }),
    prisma.vendor_approved_locations.groupBy({
      by: ['locationId'],
      where: groupWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.vendor_approved_locations.groupBy({
      by: ['locationId'],
      where: { ...groupWhere, isActive: true },
      _count: { id: true },
    }),
  ]);

  const [totalLinks, activeLinks] = await Promise.all([
    prisma.vendor_approved_locations.count({ where: groupWhere }),
    prisma.vendor_approved_locations.count({ where: { ...groupWhere, isActive: true } }),
  ]);

  const activeByLocation = new Map(activeCounts.map((c) => [c.locationId, c._count.id]));
  const locationIds = allCounts.map((c) => c.locationId);
  const locations = await prisma.locations.findMany({
    where: { id: { in: locationIds } },
    select: { id: true, name: true, type: true },
  });
  const locationById = new Map(locations.map((l) => [l.id, l]));

  // Service coverage per location — a location can show "N vendors" while
  // still having zero coverage for a given service, since a vendor's
  // location approval and service approval are independent grants. Walk
  // the active vendors at each of this page's locations and see how many
  // of the 7 core services they collectively cover.
  const coreServices = await getCoreServiceCatalog();
  const coreServiceIds = coreServices.map((s) => s.id);

  const activeVendorLinks = await prisma.vendor_approved_locations.findMany({
    where: { locationId: { in: locationIds }, isActive: true, vendors: { status: 'APPROVED' } },
    select: { locationId: true, vendorId: true },
  });
  const vendorIdsAtLocations = [...new Set(activeVendorLinks.map((l) => l.vendorId))];
  const vendorServiceLinks = await prisma.vendor_approved_services.findMany({
    where: { vendorId: { in: vendorIdsAtLocations }, isActive: true, serviceId: { in: coreServiceIds } },
    select: { vendorId: true, serviceId: true },
  });
  const servicesByVendor = new Map<string, Set<string>>();
  for (const link of vendorServiceLinks) {
    if (!servicesByVendor.has(link.vendorId)) servicesByVendor.set(link.vendorId, new Set());
    servicesByVendor.get(link.vendorId)!.add(link.serviceId);
  }
  const coveredServicesByLocation = new Map<string, Set<string>>();
  for (const link of activeVendorLinks) {
    if (!coveredServicesByLocation.has(link.locationId)) coveredServicesByLocation.set(link.locationId, new Set());
    const covered = coveredServicesByLocation.get(link.locationId)!;
    for (const serviceId of servicesByVendor.get(link.vendorId) || []) covered.add(serviceId);
  }

  const rows = allCounts.map((c) => ({
    locationId: c.locationId,
    locationName: locationById.get(c.locationId)?.name || c.locationId,
    locationType: locationById.get(c.locationId)?.type || '',
    total: c._count.id,
    active: activeByLocation.get(c.locationId) || 0,
    servicesCovered: coveredServicesByLocation.get(c.locationId)?.size || 0,
  }));
  const CORE_SERVICE_COUNT = coreServices.length;

  const total = totalGroup.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const createPageLink = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (target > 1) params.set('page', target.toString());
    const qs = params.toString();
    return qs ? `/admin/vendors/by-location?${qs}` : '/admin/vendors/by-location';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Vendors by Location</h1>
          <p className="text-sm text-slate-500">How many approved vendors serve each location</p>
        </div>
        <p className="text-sm text-slate-400">
          Updated {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(now)}
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Locations With a Vendor', value: total, color: 'text-slate-900' },
          { label: 'Total Vendor-Location Approvals', value: totalLinks, color: 'text-indigo-600' },
          { label: 'Currently Active Approvals', value: activeLinks, color: 'text-emerald-600' },
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
            placeholder="Search by location name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <select
          name="type"
          defaultValue={type}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Location Types</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Filter
        </button>
        {(search || type) && (
          <Link
            href="/admin/vendors/by-location"
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition text-center"
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
              ? 'No locations with an approved vendor found'
              : `Showing ${skip + 1}–${Math.min(skip + ITEMS_PER_PAGE, total)} of ${total.toLocaleString()} locations`}
          </p>
          <Link
            href="/admin/vendors/coverage-gaps"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View locations with NO vendor →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Total Vendors</th>
                <th className="px-6 py-3">Active Vendors</th>
                <th className="px-6 py-3">Services Covered</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No locations with an approved vendor found</p>
                    {(search || type) && <p className="text-xs mt-1">Try a different filter</p>}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.locationId}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/admin/vendors/by-location/${row.locationId}`} className="block">
                        <p className="font-medium text-slate-900">{row.locationName}</p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mt-0.5">{row.locationType}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/vendors/by-location/${row.locationId}`} className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {row.total}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/vendors/by-location/${row.locationId}`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {row.active}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/vendors/by-location/${row.locationId}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row.servicesCovered === CORE_SERVICE_COUNT
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.servicesCovered === 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        {row.servicesCovered}/{CORE_SERVICE_COUNT}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/vendors/by-location/${row.locationId}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
                      >
                        View Vendors
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
