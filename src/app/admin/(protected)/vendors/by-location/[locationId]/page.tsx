import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import {
  ArrowLeft, MapPin, Store, Phone, Mail, CheckCircle2, XCircle,
  Bike, Key, Bus, Truck, Gem, Package, Wrench, AlertCircle,
} from 'lucide-react';
import { getCoreServiceCatalog } from '@/lib/services/vendor-service-status';

const SERVICE_ICON: Record<string, any> = {
  bike: Bike, 'self-drive': Key, bus: Bus, truck: Truck, luxury: Gem, packers: Package, equipment: Wrench,
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(date);
};

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  DOCUMENTS_PENDING: 'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  BLOCKED: 'bg-red-50 text-red-700',
};

export default async function VendorsAtLocationPage({
  params,
}: {
  params: { locationId: string };
}) {
  const location = await prisma.locations.findUnique({
    where: { id: params.locationId },
    select: { id: true, name: true, type: true },
  });
  if (!location) notFound();

  const approvals = await prisma.vendor_approved_locations.findMany({
    where: { locationId: location.id, vendors: { status: 'APPROVED' } },
    include: {
      vendors: {
        select: { id: true, businessName: true, ownerName: true, email: true, phone: true, status: true },
      },
    },
    orderBy: [{ isActive: 'desc' }, { approvedAt: 'desc' }],
  });

  const activeCount = approvals.filter((a) => a.isActive).length;

  // Service coverage for this location — a location can show plenty of
  // vendors while still having zero coverage for a specific service, since
  // location-approval and service-approval are independent grants.
  const coreServices = await getCoreServiceCatalog();
  const activeVendorIds = approvals.filter((a) => a.isActive).map((a) => a.vendors.id);
  const serviceLinks = activeVendorIds.length
    ? await prisma.vendor_approved_services.findMany({
        where: { vendorId: { in: activeVendorIds }, isActive: true, serviceId: { in: coreServices.map((s) => s.id) } },
        select: { vendorId: true, serviceId: true },
      })
    : [];
  const vendorNameById = new Map(approvals.map((a) => [a.vendors.id, a.vendors.businessName]));
  const vendorsByServiceId = new Map<string, string[]>();
  for (const link of serviceLinks) {
    if (!vendorsByServiceId.has(link.serviceId)) vendorsByServiceId.set(link.serviceId, []);
    vendorsByServiceId.get(link.serviceId)!.push(vendorNameById.get(link.vendorId) || link.vendorId);
  }
  const serviceCoverage = coreServices.map((s) => ({
    ...s,
    vendorNames: vendorsByServiceId.get(s.id) || [],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/vendors/by-location"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vendors by Location
        </Link>
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-500" />
              <h1 className="text-3xl font-semibold text-slate-900">{location.name}</h1>
              <span className="text-xs uppercase tracking-widest text-slate-400">{location.type}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Vendors available to serve this location</p>
          </div>
        </header>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Vendors', value: approvals.length, color: 'text-slate-900' },
          { label: 'Active Here', value: activeCount, color: 'text-emerald-600' },
          { label: 'Inactive Here', value: approvals.length - activeCount, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Service coverage */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-800">Service Coverage</p>
          <p className="text-xs text-slate-400 mt-0.5">Which services have an active vendor at {location.name} — independent of location approval</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100">
          {serviceCoverage.map((s) => {
            const Icon = SERVICE_ICON[s.key] || Package;
            const covered = s.vendorNames.length > 0;
            return (
              <div key={s.id} className={`bg-white p-4 ${!covered ? 'bg-red-50/40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${covered ? 'bg-emerald-50 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  </div>
                  {covered ? (
                    <span className="text-xs font-bold text-emerald-700">{s.vendorNames.length}</span>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                {covered ? (
                  <p className="text-xs text-slate-500 truncate" title={s.vendorNames.join(', ')}>
                    {s.vendorNames.join(', ')}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-red-600">No vendor for this service</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vendor list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            {approvals.length === 0
              ? 'No approved vendors for this location'
              : `${approvals.length} vendor${approvals.length === 1 ? '' : 's'} approved for ${location.name}`}
          </p>
        </div>
        {approvals.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vendors are approved for this location yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Vendor Status</th>
                  <th className="px-6 py-3">This Location</th>
                  <th className="px-6 py-3">Approved On</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50 transition ${!a.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{a.vendors.businessName}</p>
                      <p className="text-xs text-slate-400">{a.vendors.ownerName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {a.vendors.email}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {a.vendors.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[a.vendors.status] || 'bg-slate-100 text-slate-600'}`}>
                        {a.vendors.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-xs font-bold">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(a.approvedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/vendors/${a.vendors.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
                      >
                        View Vendor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
