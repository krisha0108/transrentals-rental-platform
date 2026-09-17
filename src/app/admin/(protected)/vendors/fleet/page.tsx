'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Store,
  BadgeCheck,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  Fuel,
  Calendar,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Every vehicle vendors have added, in one place, with the vendor who added it
// always on screen. Two views over the same filtered set: "All vehicles" is the
// flat list, "By vendor" answers "who has how many" and drills into that
// vendor's own vehicles by reusing the vendor filter.

interface FleetVendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string | null;
  status: string;
}

interface FleetRow {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  modelName: string | null;
  brandName: string | null;
  categoryName: string | null;
  serviceName: string | null;
  serviceSlug: string | null;
  image: string | null;
  seatingCapacity: number | null;
  fuelType: string | null;
  transmission: string | null;
  yearOfManufacture: number | null;
  parkingCity: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  totalTrips: number | null;
  createdAt: string;
  vendor: FleetVendor | null;
}

interface VendorOption {
  vendorId: string;
  businessName: string;
  fleetCount: number;
}

interface VendorGroup {
  vendorId: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  city: string | null;
  status: string | null;
  fleetCount: number;
}

interface ServiceOption {
  id: string;
  name: string;
  slug: string;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  vendorsWithFleet: number;
}

const EMPTY_SUMMARY: Summary = {
  total: 0,
  active: 0,
  inactive: 0,
  verified: 0,
  unverified: 0,
  vendorsWithFleet: 0,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function VendorFleetManagementPage() {
  const [fleet, setFleet] = useState<FleetRow[]>([]);
  const [byVendor, setByVendor] = useState<VendorGroup[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  // Only the very first load may blank the screen. Later fetches keep the
  // current results in place and just dim them, so nothing under the cursor
  // moves while a filter is being changed.
  const [firstLoad, setFirstLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'list' | 'vendors'>('list');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [status, setStatus] = useState('ALL');
  const [verified, setVerified] = useState('ALL');
  const [page, setPage] = useState(1);

  // Typing in the search box should not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (vendorId) params.set('vendorId', vendorId);
      if (serviceId) params.set('serviceId', serviceId);
      if (status !== 'ALL') params.set('status', status);
      if (verified !== 'ALL') params.set('verified', verified);

      const res = await fetch(`/api/admin/vendors/fleet?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load vendor fleet');

      setFleet(data.fleet || []);
      setByVendor(data.byVendor || []);
      setVendorOptions(data.vendorOptions || []);
      setServices(data.services || []);
      setSummary(data.summary || EMPTY_SUMMARY);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (e: any) {
      setError(e.message || 'Failed to load vendor fleet');
      setFleet([]);
      setByVendor([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [page, search, vendorId, serviceId, status, verified]);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  const selectedVendor = vendorOptions.find((v) => v.vendorId === vendorId);
  const hasFilters =
    Boolean(search) ||
    Boolean(vendorId) ||
    Boolean(serviceId) ||
    status !== 'ALL' ||
    verified !== 'ALL';

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setVendorId('');
    setServiceId('');
    setStatus('ALL');
    setVerified('ALL');
    setPage(1);
  };

  const stats = [
    { label: 'Total vehicles', value: summary.total, icon: Car },
    { label: 'Vendors with fleet', value: summary.vendorsWithFleet, icon: Store },
    { label: 'Active', value: summary.active, icon: CheckCircle },
    { label: 'Verified', value: summary.verified, icon: BadgeCheck },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Fleet Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Every vehicle added by vendors, and which vendor added it.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            All vehicles
          </button>
          <button
            type="button"
            onClick={() => setView('vendors')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === 'vendors' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            By vendor
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <s.icon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters. Every control has a fixed width and every control is always
          rendered, so changing one never resizes or re-orders its neighbours. */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full lg:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search vehicle, registration number or vendor..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>

          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setPage(1);
            }}
            className="w-[180px] shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPage(1);
            }}
            className="w-[220px] shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">All vendors</option>
            {vendorOptions.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.businessName} ({v.fleetCount})
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-[170px] shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="ALL">Active &amp; inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            value={verified}
            onChange={(e) => {
              setVerified(e.target.value);
              setPage(1);
            }}
            className="w-[190px] shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="ALL">Verified &amp; unverified</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="w-[76px] shrink-0"
          >
            Clear
          </Button>
        </div>

        <div className="mt-3 flex min-h-[20px] items-center gap-2 text-sm text-gray-500">
          {loading && !firstLoad ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              Updating...
            </>
          ) : selectedVendor ? (
            <>
              <Store className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                Showing only vehicles added by{' '}
                <span className="font-semibold">{selectedVendor.businessName}</span>
              </span>
              <button
                type="button"
                onClick={() => setVendorId('')}
                className="text-xs font-semibold text-blue-700 underline underline-offset-2"
              >
                show all
              </button>
            </>
          ) : (
            <span>
              {summary.total} vehicle{summary.total === 1 ? '' : 's'} across{' '}
              {summary.vendorsWithFleet} vendor{summary.vendorsWithFleet === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        className={
          loading && !firstLoad
            ? 'pointer-events-none opacity-50 transition-opacity'
            : 'transition-opacity'
        }
      >
      {firstLoad && loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : view === 'vendors' ? (
        /* ---------- By vendor ---------- */
        byVendor.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500">
            No vendor has added a vehicle yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {byVendor.map((v) => (
              <div
                key={v.vendorId}
                className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{v.businessName}</p>
                    {v.ownerName && (
                      <p className="truncate text-sm text-gray-500">{v.ownerName}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                    {v.fleetCount}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  {v.city && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {v.city}
                    </p>
                  )}
                  {v.phone && <p>{v.phone}</p>}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVendorId(v.vendorId);
                      setPage(1);
                      setView('list');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Car className="h-3.5 w-3.5" />
                    View vehicles
                  </button>
                  <Link
                    href={`/admin/vendors/${v.vendorId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Store className="h-3.5 w-3.5" />
                    Vendor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : /* ---------- All vehicles ---------- */
      fleet.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500">
          No vehicles match these filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Added by</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Added on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fleet.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {row.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.image}
                              alt={row.vehicleName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <Car className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{row.vehicleName}</p>
                          <p className="text-xs text-gray-500">
                            {[row.brandName, row.modelName].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {row.registrationNumber && (
                            <p className="mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">
                              {row.registrationNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {row.vendor ? (
                        <div className="min-w-0">
                          <Link
                            href={`/admin/vendors/${row.vendor.id}`}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {row.vendor.businessName}
                          </Link>
                          <p className="text-xs text-gray-500">{row.vendor.ownerName}</p>
                          <p className="text-xs text-gray-500">{row.vendor.phone}</p>
                          {row.vendor.city && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              {row.vendor.city}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Vendor removed</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {row.serviceName || '—'}
                      </span>
                      {row.categoryName && (
                        <p className="mt-1 text-xs text-gray-500">{row.categoryName}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-xs text-gray-600">
                        {row.seatingCapacity != null && (
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            {row.seatingCapacity} seats
                          </p>
                        )}
                        {row.fuelType && (
                          <p className="flex items-center gap-1">
                            <Fuel className="h-3 w-3 text-gray-400" />
                            {row.fuelType}
                            {row.transmission ? ` · ${row.transmission}` : ''}
                          </p>
                        )}
                        {row.yearOfManufacture && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {row.yearOfManufacture}
                          </p>
                        )}
                        {row.parkingCity && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {row.parkingCity}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {row.isActive ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {row.isVerified && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
