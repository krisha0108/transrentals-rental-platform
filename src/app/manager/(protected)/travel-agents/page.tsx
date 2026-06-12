'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plane,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  X,
  Users,
} from 'lucide-react';

interface TravelAgent {
  id: string;
  agencyName: string;
  agencyType: string | null;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  city: string | null;
  state: string | null;
  _count: {
    documents: number;
    leads: number;
    tours: number;
    properties: number;
    bookings: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  DOCUMENTS_PENDING: { label: 'Docs Pending', color: 'bg-orange-100 text-orange-800', icon: FileText },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', color: 'bg-gray-100 text-gray-800', icon: Ban },
};

export default function ManagerTravelAgentsPage() {
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [agencyTypeFilter, setAgencyTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [agencyTypes, setAgencyTypes] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (cityFilter !== 'ALL') params.append('city', cityFilter);
      if (agencyTypeFilter !== 'ALL') params.append('agencyType', agencyTypeFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/manager/travel-agents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.travelAgents);
        setPagination(data.pagination);
        if (data.cities?.length) setCities(data.cities);
        if (data.agencyTypes?.length) setAgencyTypes(data.agencyTypes);
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pagination.page, statusFilter, cityFilter, agencyTypeFilter, search]);

  const activeFilterCount = [
    statusFilter !== 'ALL', cityFilter !== 'ALL', agencyTypeFilter !== 'ALL', !!search,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('ALL'); setCityFilter('ALL'); setAgencyTypeFilter('ALL');
    setSearch(''); setSearchInput('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Travel Agents</h1>
            <p className="text-sm text-gray-500">{pagination.total} total registered</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/manager/travel-agents/pending"
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-xl"
          >
            View Pending Approvals
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected / Blocked</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by agency, owner, email, phone or city..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          {/* City */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none min-w-[150px]"
            >
              <option value="ALL">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Agency Type */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={agencyTypeFilter}
              onChange={(e) => { setAgencyTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none min-w-[160px]"
            >
              <option value="ALL">All Types</option>
              {agencyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[160px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DOCUMENTS_PENDING">Documents Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Search className="w-3 h-3" /> "{search}"
                <button onClick={() => { setSearch(''); setSearchInput(''); }}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {cityFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <MapPin className="w-3 h-3" /> {cityFilter}
                <button onClick={() => { setCityFilter('ALL'); setPagination((p) => ({ ...p, page: 1 })); }}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {agencyTypeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <Building2 className="w-3 h-3" /> {agencyTypeFilter}
                <button onClick={() => { setAgencyTypeFilter('ALL'); setPagination((p) => ({ ...p, page: 1 })); }}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {statusConfig[statusFilter]?.label || statusFilter}
                <button onClick={() => { setStatusFilter('ALL'); setPagination((p) => ({ ...p, page: 1 })); }}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline transition">
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No travel agents found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <th className="text-left px-5 py-3">Agency</th>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Leads</th>
                <th className="text-center px-5 py-3">Tours</th>
                <th className="text-center px-5 py-3">Bookings</th>
                <th className="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {agents.map((a) => {
                const StatusIcon = statusConfig[a.status]?.icon || Clock;
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{a.agencyName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.ownerName} • {a.agencyType || 'Agency'}
                      </p>
                      {a.city && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.city}, {a.state}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs">{a.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          statusConfig[a.status]?.color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[a.status]?.label || a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-700">{a._count.leads}</td>
                    <td className="px-5 py-4 text-center text-gray-700">{a._count.tours}</td>
                    <td className="px-5 py-4 text-center text-gray-700">{a._count.bookings}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/manager/travel-agents/${a.id}`}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs">
              <p className="text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
