'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Flame,
  Target,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
} from 'lucide-react';

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  source: string;
  destination: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  travelDate: string | null;
  passengers: number | null;
  estimatedValue: number | null;
  status: string;
  priority: string;
  nextFollowUp: string | null;
  lastContactAt: string | null;
  createdAt: string;
  notesCount: number;
}

interface Stats {
  total: number;
  NEW: number;
  CONTACTED: number;
  INTERESTED: number;
  QUOTED: number;
  NEGOTIATING: number;
  BOOKED: number;
  LOST: number;
  COLD: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  INTERESTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  QUOTED: 'bg-purple-100 text-purple-700 border-purple-200',
  NEGOTIATING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  BOOKED: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-red-100 text-red-700 border-red-200',
  COLD: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  HOT: 'bg-red-50 text-red-600 border-red-200',
  WARM: 'bg-amber-50 text-amber-600 border-amber-200',
  COLD: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function LeadsListPage() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams?.get('priority') || 'ALL');
  const [sourceFilter, setSourceFilter] = useState(searchParams?.get('source') || 'ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.append('page', String(pagination.page));
      qs.append('limit', String(pagination.limit));
      if (statusFilter !== 'ALL') qs.append('status', statusFilter);
      if (priorityFilter !== 'ALL') qs.append('priority', priorityFilter);
      if (sourceFilter !== 'ALL') qs.append('source', sourceFilter);
      if (search) qs.append('search', search);

      const res = await fetch(`/api/travel-agent/leads?${qs.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads);
        setPagination(json.pagination);
        setStats(json.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, priorityFilter, sourceFilter, search]);

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
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-sm text-gray-500">{stats?.total ?? 0} total leads</p>
          </div>
        </div>
        <Link
          href="/travel-agent/leads/add"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <StatChip label="Total" value={stats.total} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
          <StatChip label="New" value={stats.NEW} active={statusFilter === 'NEW'} onClick={() => setStatusFilter('NEW')} color="blue" />
          <StatChip label="Contacted" value={stats.CONTACTED} active={statusFilter === 'CONTACTED'} onClick={() => setStatusFilter('CONTACTED')} color="cyan" />
          <StatChip label="Interested" value={stats.INTERESTED} active={statusFilter === 'INTERESTED'} onClick={() => setStatusFilter('INTERESTED')} color="emerald" />
          <StatChip label="Quoted" value={stats.QUOTED} active={statusFilter === 'QUOTED'} onClick={() => setStatusFilter('QUOTED')} color="purple" />
          <StatChip label="Booked" value={stats.BOOKED} active={statusFilter === 'BOOKED'} onClick={() => setStatusFilter('BOOKED')} color="green" />
          <StatChip label="Lost" value={stats.LOST} active={statusFilter === 'LOST'} onClick={() => setStatusFilter('LOST')} color="red" />
          <StatChip label="Cold" value={stats.COLD} active={statusFilter === 'COLD'} onClick={() => setStatusFilter('COLD')} color="gray" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by customer, phone, email or destination..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Sources</option>
            <option value="MANUAL">Manual</option>
            <option value="CAPTURE_LINK">Capture Link</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="WALK_IN">Walk-In</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No leads found</p>
          <p className="text-sm text-gray-400">Add your first lead to get started</p>
          <Link
            href="/travel-agent/leads/add"
            className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/travel-agent/leads/${lead.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 truncate">{lead.customerName}</p>
                    {lead.priority === 'HOT' && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_COLORS.HOT}`}
                      >
                        <Flame className="w-2.5 h-2.5" /> HOT
                      </span>
                    )}
                    {lead.priority === 'WARM' && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_COLORS.WARM}`}>
                        WARM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.customerPhone}
                    </span>
                    {lead.customerEmail && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" /> {lead.customerEmail}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${STATUS_COLORS[lead.status]}`}
                >
                  {lead.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                {lead.destination && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{lead.destination}</span>
                  </div>
                )}
                {lead.travelDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{new Date(lead.travelDate).toLocaleDateString()}</span>
                  </div>
                )}
                {lead.passengers && (
                  <div className="text-gray-500">
                    {lead.passengers} pax{lead.estimatedValue ? ` • ₹${lead.estimatedValue}` : ''}
                  </div>
                )}
                <div className="text-gray-400 text-[11px]">
                  Source: {lead.source.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                <span className="text-gray-400">
                  {lead.notesCount > 0 && `${lead.notesCount} note${lead.notesCount !== 1 ? 's' : ''} • `}
                  Added {new Date(lead.createdAt).toLocaleDateString()}
                </span>
                {lead.nextFollowUp && (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Follow-up {new Date(lead.nextFollowUp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.pages} • {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  active,
  onClick,
  color,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const ringClass = active ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-gray-200';
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border ${ringClass} p-3 text-left hover:border-emerald-300 transition-colors`}
    >
      <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
    </button>
  );
}
