'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Flame,
  Compass,
  Users,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

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
  requirement: string | null;
  status: string;
  priority: string;
  tripType: string | null;
  tourId: string | null;
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

export default function TourQuoteRequestsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.append('page', String(pagination.page));
      qs.append('limit', String(pagination.limit));
      // Hard-filter to website-originated tour quote requests only
      qs.append('source', 'WEBSITE');
      if (statusFilter !== 'ALL') qs.append('status', statusFilter);
      if (priorityFilter !== 'ALL') qs.append('priority', priorityFilter);
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
  }, [pagination.page, statusFilter, priorityFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  useTravelAgentPageHeader(
    'Tour Quote Requests',
    `${stats?.total ?? 0} quote request${(stats?.total ?? 0) !== 1 ? 's' : ''} from your website tours`,
  );

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 border border-violet-200/60 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-0.5">Quote requests for your wander tours</p>
          <p className="text-xs text-gray-600">
            Inquiries customers submit on the public <span className="font-medium">/wander</span> page for tours you've published.
            All other leads (manual, walk-in, etc.) appear under{' '}
            <Link href="/travel-agent/leads" className="text-violet-700 font-semibold hover:underline">
              All Leads
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by customer, phone, email or tour name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </form>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No tour quote requests yet</p>
          <p className="text-sm text-gray-400 mb-4">
            When customers request quotes on your published tours, they'll appear here.
          </p>
          <Link
            href="/travel-agent/tours"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Compass className="w-4 h-4" /> Manage Your Tours
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {leads.map((lead) => {
            // The requirement field stores tour title + pickup + notes (set by /api/wander/quote-requests)
            const tourTitleMatch = lead.requirement?.match(/Quote request for:\s*(.+?)(?:\n|$)/);
            const tourTitle = tourTitleMatch?.[1] || lead.destination || 'Tour request';
            const pickupMatch = lead.requirement?.match(/Pickup:\s*(.+?)(?:\n|$)/);
            const customerNotes = lead.requirement?.match(/Notes:\s*([\s\S]+?)(?:\n[A-Z]|$)/);
            return (
              <Link
                key={lead.id}
                href={`/travel-agent/leads/${lead.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition-all group relative"
              >
                {/* Tour title pill */}
                <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                  <Compass className="w-3 h-3" />
                  <span className="truncate max-w-[260px]">{tourTitle}</span>
                </div>

                {/* Customer row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 truncate">{lead.customerName}</p>
                      {lead.priority === 'HOT' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_COLORS.HOT}`}>
                          <Flame className="w-2.5 h-2.5" /> HOT
                        </span>
                      )}
                      {lead.priority === 'WARM' && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_COLORS.WARM}`}>
                          WARM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
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
                  <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${STATUS_COLORS[lead.status]}`}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Trip facts */}
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                  {lead.travelDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  {lead.passengers && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span>{lead.passengers} pax</span>
                    </div>
                  )}
                  {(pickupMatch?.[1] || lead.pickupLocation) && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{pickupMatch?.[1] || lead.pickupLocation}</span>
                    </div>
                  )}
                </div>

                {customerNotes?.[1] && (
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                    <span className="font-semibold">Notes:</span> {customerNotes[1].trim()}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                  <span className="text-gray-400">
                    {lead.notesCount > 0 && `${lead.notesCount} note${lead.notesCount !== 1 ? 's' : ''} • `}
                    Received {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-violet-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
  color = 'violet',
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const activeMap: Record<string, string> = {
    violet: 'bg-violet-600 text-white border-violet-600',
    blue: 'bg-blue-600 text-white border-blue-600',
    cyan: 'bg-cyan-600 text-white border-cyan-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    purple: 'bg-purple-600 text-white border-purple-600',
    green: 'bg-green-600 text-white border-green-600',
    red: 'bg-red-600 text-white border-red-600',
    gray: 'bg-gray-600 text-white border-gray-600',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
        active ? activeMap[color] : 'bg-white border-gray-200 hover:border-violet-300 text-gray-700'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </button>
  );
}
