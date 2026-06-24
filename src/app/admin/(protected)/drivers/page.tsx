'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  IdCard,
  Car,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Store,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type DriverStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type DriverSource = 'standalone' | 'vendor';

interface Driver {
  id: string;
  did: string | null;
  source: DriverSource;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  city: string | null;
  state: string | null;
  status: string; // raw status from source table
  effectiveStatus: DriverStatus; // normalized for UI chips
  licenseNumber: string | null;
  licenseExpiry: string | null;
  joiningDate: string;
  lastLoginAt: string | null;
  createdAt: string;
  vendorId: string | null;
  vendorName: string | null;
  bookingsCount: number;
  vehiclesCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  inactive: number;
}

const STATUS_CONFIG: Record<DriverStatus, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500' },
  ACTIVE:    { label: 'Active',    pill: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  INACTIVE:  { label: 'Inactive',  pill: 'bg-gray-100 text-gray-700',      dot: 'bg-gray-400' },
  SUSPENDED: { label: 'Suspended', pill: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, suspended: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchDrivers = async (page: number, currentStatus: string, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (currentStatus !== 'all') params.append('status', currentStatus);
      if (currentSearch) params.append('search', currentSearch);

      const res = await fetch(`/api/admin/drivers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(pagination.page, statusFilter, search);
  }, [pagination.page, statusFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const isLicenseExpiring = (expiry: string | null) => {
    if (!expiry) return false;
    const days = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };
  const isLicenseExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry).getTime() < Date.now();
  };

  const statusChips = [
    { id: 'all',       label: 'All',       count: stats.total,     icon: Users },
    { id: 'PENDING',   label: 'Pending',   count: stats.pending,   icon: Clock },
    { id: 'ACTIVE',    label: 'Active',    count: stats.active,    icon: ShieldCheck },
    { id: 'SUSPENDED', label: 'Suspended', count: stats.suspended, icon: ShieldX },
    { id: 'INACTIVE',  label: 'Inactive',  count: stats.inactive,  icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 text-sm mt-0.5">Manage drivers registered on TransRentals</p>
        </div>
      </div>

      {/* Status chips double as filters and stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusChips.map((chip) => {
          const Icon = chip.icon;
          const isActive = statusFilter === chip.id;
          const color = chip.id === 'PENDING'   ? 'yellow'
                      : chip.id === 'ACTIVE'    ? 'green'
                      : chip.id === 'SUSPENDED' ? 'red'
                      : chip.id === 'INACTIVE'  ? 'gray'
                      : 'blue';
          const colorClasses: Record<string, string> = {
            yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
            green:  'bg-green-50  text-green-700  ring-green-200',
            red:    'bg-red-50    text-red-700    ring-red-200',
            gray:   'bg-gray-50   text-gray-700   ring-gray-200',
            blue:   'bg-blue-50   text-blue-700   ring-blue-200',
          };
          return (
            <button
              key={chip.id}
              onClick={() => {
                setStatusFilter(chip.id);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 text-left hover:shadow-md transition ${
                isActive ? 'ring-2 ring-offset-1 ' + colorClasses[color] : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{chip.count.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">{chip.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, license number, driver ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">No drivers found</p>
            <p className="text-sm mt-1">Try adjusting your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">License</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((driver) => {
                  const statusCfg = STATUS_CONFIG[driver.effectiveStatus] || STATUS_CONFIG.INACTIVE;
                  const licenseExpired = isLicenseExpired(driver.licenseExpiry);
                  const licenseSoon = !licenseExpired && isLicenseExpiring(driver.licenseExpiry);
                  const isVendorDriver = driver.source === 'vendor';
                  return (
                    <tr key={`${driver.source}-${driver.id}`} className="hover:bg-gray-50 transition-colors">
                      {/* Driver */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {driver.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={driver.profilePhoto} alt={driver.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                              isVendorDriver
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 text-sm">{driver.name}</p>
                              {isVendorDriver ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wider">
                                  <Store className="w-2.5 h-2.5" />
                                  Vendor
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase tracking-wider">
                                  <User className="w-2.5 h-2.5" />
                                  Direct
                                </span>
                              )}
                            </div>
                            {isVendorDriver && driver.did && (
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[200px]">
                                {driver.did}
                              </p>
                            )}
                            {isVendorDriver && driver.vendorName && (
                              <p className="text-xs text-amber-700 mt-0.5 truncate max-w-[200px]">
                                via {driver.vendorName}
                              </p>
                            )}
                            {(driver.city || driver.state) && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {[driver.city, driver.state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {driver.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{driver.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* License */}
                      <td className="px-6 py-4">
                        {driver.licenseNumber ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <IdCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="font-mono text-xs">{driver.licenseNumber}</span>
                            </div>
                            <p className={`text-xs ${licenseExpired ? 'text-red-600 font-semibold' : licenseSoon ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                              {licenseExpired ? 'Expired ' : 'Expires '}{formatDate(driver.licenseExpiry)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not provided</span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Car className="w-3.5 h-3.5 text-gray-400" />
                            <span>{driver.vehiclesCount} vehicle{driver.vehiclesCount !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-xs text-gray-500">{driver.bookingsCount} bookings</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                          <CalendarDays className="w-3 h-3" />
                          Joined {formatDate(driver.joiningDate || driver.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <Link href={`/admin/drivers/${driver.id}?source=${driver.source}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} drivers
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
