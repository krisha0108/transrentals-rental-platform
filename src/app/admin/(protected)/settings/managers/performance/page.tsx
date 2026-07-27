'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, RefreshCw, Calendar, Users, UserPlus, ChevronRight,
} from 'lucide-react';

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  all: 'All Time',
  custom: 'Custom Range',
};

interface CoverageStat { total: number; actioned: number; coveragePct: number | null }

interface ManagerPerf {
  id: string;
  name: string;
  email: string;
  vendors: { created: number; approved: number };
  inquiries: CoverageStat;
  bookings: CoverageStat;
  actionBreakdown: Record<string, number>;
}

function coverageColor(pct: number | null) {
  if (pct === null) return 'bg-gray-100 text-gray-400';
  if (pct >= 80) return 'bg-green-100 text-green-700';
  if (pct >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function coverageBarColor(pct: number | null) {
  if (pct === null) return 'bg-gray-200';
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ManagerPerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managers, setManagers] = useState<ManagerPerf[]>([]);
  const [filter, setFilter] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchPerformance = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    try {
      let url = `/api/admin/managers/performance?filter=${preset}`;
      if (preset === 'custom' && from && to) url += `&dateFrom=${from}&dateTo=${to}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) setManagers(data.managers || []);
    } catch (e) {
      console.error('Failed to fetch manager performance:', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPerformance('today');
      setLoading(false);
    })();
  }, [fetchPerformance]);

  const handleFilterChange = (newFilter: DatePreset) => {
    setFilter(newFilter);
    if (newFilter !== 'custom') {
      setRefreshing(true);
      fetchPerformance(newFilter).finally(() => setRefreshing(false));
    }
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setRefreshing(true);
    fetchPerformance('custom', customFrom, customTo).finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPerformance(filter, customFrom, customTo).finally(() => setRefreshing(false));
  };

  const openManager = (managerId: string) => {
    router.push(`/admin/settings/managers/performance/${managerId}?filter=${filter}`);
  };

  const totalInquiries = managers.reduce((s, m) => s + m.inquiries.total, 0);
  const totalActioned = managers.reduce((s, m) => s + m.inquiries.actioned, 0);
  const overallPct = totalInquiries > 0 ? Math.round((totalActioned / totalInquiries) * 100) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/settings/managers" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Manager Performance</h1>
          <p className="text-gray-500 mt-1">Today's inquiries vs. how many each manager actually handled</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="text-sm focus:outline-none" />
              <span className="text-gray-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="text-sm focus:outline-none" />
              <button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="text-xs font-semibold px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          )}
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value as DatePreset)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((p) => (
              <option key={p} value={p}>{DATE_PRESET_LABELS[p]}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Total Inquiries ({DATE_PRESET_LABELS[filter]})</p>
          <p className="text-3xl font-bold text-gray-900">{totalInquiries}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Actioned by a Manager</p>
          <p className="text-3xl font-bold text-green-600">{totalActioned}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Overall Coverage</p>
          <p className={`text-3xl font-bold ${overallPct === null ? 'text-gray-400' : overallPct >= 80 ? 'text-green-600' : overallPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {overallPct === null ? '—' : `${overallPct}%`}
          </p>
        </div>
      </div>

      {/* Per-manager table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Coverage by Manager</h2>
          <span className="text-xs text-gray-400">(lowest coverage first · click a row for full details)</span>
        </div>

        {managers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No managers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs text-gray-500">
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold">Manager</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Inquiries</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Bookings</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Vendors</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Coverage</th>
                  <th className="text-left px-5 py-2.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {managers.map((m) => (
                  <tr key={m.id} onClick={() => openManager(m.id)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{m.inquiries.actioned}</span>
                      <span className="text-gray-400"> / {m.inquiries.total}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{m.bookings.actioned}</span>
                      <span className="text-gray-400"> / {m.bookings.total}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        <UserPlus className="w-3 h-3" /> {m.vendors.created + m.vendors.approved}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${coverageBarColor(m.inquiries.coveragePct)}`}
                            style={{ width: `${Math.min(m.inquiries.coveragePct ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${coverageColor(m.inquiries.coveragePct)}`}>
                          {m.inquiries.coveragePct === null ? '—' : `${m.inquiries.coveragePct}%`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-300 inline-block" />
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
