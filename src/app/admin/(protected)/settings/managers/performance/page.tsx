'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PhoneCall,
  ArrowLeft, RefreshCw, Calendar, Users, UserPlus, ChevronRight, Mail,
  Search, FileText, CheckCircle2, Target, ShieldAlert, X, Crown, Flame, Briefcase,
} from 'lucide-react';

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
];

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week', thisMonth: 'This Month',
  lastMonth: 'Last Month', all: 'All Time', custom: 'Custom Range',
};

interface CoverageStat { total: number; actioned: number; actionedBacklog: number; coveragePct: number | null }

interface ManagerPerf {
  id: string;
  name: string;
  email: string;
  vendors: { created: number; approved: number };
  inquiries: CoverageStat;
  bookings: CoverageStat;
  contactInquiries: { actioned: number };
  callReports: { logged: number; converted: number };
  actionBreakdown: Record<string, number>;
}

type LoadState = 'loading' | 'ready' | 'unauthorized' | 'error';

function coverageTextColor(pct: number | null) {
  if (pct === null) return 'text-slate-400';
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function coverageChipColor(pct: number | null) {
  if (pct === null) return 'bg-slate-100 text-slate-400';
  if (pct >= 80) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  if (pct >= 40) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  return 'bg-red-50 text-red-700 ring-1 ring-red-200';
}

function coverageBarColor(pct: number | null) {
  if (pct === null) return 'bg-slate-200';
  if (pct >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  if (pct >= 40) return 'bg-gradient-to-r from-amber-400 to-amber-500';
  return 'bg-gradient-to-r from-red-400 to-red-500';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
];

function avatarGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function StatCard({
  icon: Icon, label, value, accent, sub,
}: { icon: any; label: string; value: React.ReactNode; accent: string; sub?: string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] ${accent} blur-md group-hover:opacity-[0.12] transition-opacity`} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}>
          <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-2.5 w-44 bg-slate-100 rounded" />
          </div>
          <div className="hidden md:block h-3 w-16 bg-slate-100 rounded" />
          <div className="hidden md:block h-3 w-16 bg-slate-100 rounded" />
          <div className="hidden md:block h-6 w-14 bg-slate-100 rounded-full" />
          <div className="hidden md:block h-2 w-28 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ManagerPerformancePage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [managers, setManagers] = useState<ManagerPerf[]>([]);
  const [filter, setFilter] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPerformance = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    try {
      let url = `/api/admin/managers/performance?filter=${preset}`;
      if (preset === 'custom' && from && to) url += `&dateFrom=${from}&dateTo=${to}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        setState('unauthorized');
        return;
      }
      if (!res.ok || data.error) {
        setState('error');
        return;
      }
      setManagers(data.managers || []);
      setState('ready');
    } catch (e) {
      console.error('Failed to fetch manager performance:', e);
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchPerformance('today');
  }, [fetchPerformance]);

  const handleFilterChange = (newFilter: DatePreset) => {
    setFilter(newFilter);
    setShowCustom(false);
    setRefreshing(true);
    fetchPerformance(newFilter).finally(() => setRefreshing(false));
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setFilter('custom');
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
  const totalContact = managers.reduce((s, m) => s + m.contactInquiries.actioned, 0);
  const totalCalls = managers.reduce((s, m) => s + (m.callReports?.logged ?? 0), 0);
  const overallPct = totalInquiries > 0 ? Math.round((totalActioned / totalInquiries) * 100) : null;

  const filteredManagers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [managers, search]);

  const topPerformerId = useMemo(() => {
    const withCoverage = managers.filter((m) => m.inquiries.total > 0 && m.inquiries.coveragePct !== null);
    if (withCoverage.length < 2) return null;
    return withCoverage.reduce((best, m) => (m.inquiries.coveragePct! > best.inquiries.coveragePct! ? m : best)).id;
  }, [managers]);

  const needsAttentionId = useMemo(() => {
    const withCoverage = managers.filter((m) => m.inquiries.total > 0 && m.inquiries.coveragePct !== null);
    if (withCoverage.length < 2) return null;
    const worst = withCoverage.reduce((w, m) => (m.inquiries.coveragePct! < w.inquiries.coveragePct! ? m : w));
    return worst.inquiries.coveragePct! < 40 ? worst.id : null;
  }, [managers]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3 flex-wrap">
          <Link
            href="/admin/settings/managers"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Manager Performance</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Tracking inquiries, bookings, vendors &amp; contact-form handling per manager
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || state === 'loading'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Date filter toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handleFilterChange(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === p.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom((s) => !s)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          {showCustom && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="text-sm focus:outline-none text-slate-700" />
              <span className="text-slate-300">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="text-sm focus:outline-none text-slate-700" />
              <button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition"
              >
                Apply
              </button>
            </div>
          )}

          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search managers..."
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 shadow-sm w-56"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Unauthorized / error banners */}
        {state === 'unauthorized' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Access denied</p>
              <p className="text-xs text-red-600/80 mt-0.5">
                Your session doesn't have permission to view this page — try logging out and back in with an admin account.
              </p>
            </div>
          </div>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Couldn't load performance data</p>
              <p className="text-xs text-amber-700/80 mt-0.5">Something went wrong fetching this — try refreshing.</p>
            </div>
          </div>
        )}

        {/* Overall summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label={`Inquiries (${DATE_PRESET_LABELS[filter]})`} value={state === 'loading' ? '—' : totalInquiries} accent="text-indigo-600 bg-indigo-600" />
          <StatCard icon={CheckCircle2} label="Actioned" value={state === 'loading' ? '—' : totalActioned} accent="text-emerald-600 bg-emerald-600" />
          <StatCard
            icon={Target}
            label="Overall Coverage"
            value={state === 'loading' ? '—' : overallPct === null ? '—' : `${overallPct}%`}
            accent={overallPct !== null && overallPct >= 80 ? 'text-emerald-600 bg-emerald-600' : overallPct !== null && overallPct >= 40 ? 'text-amber-600 bg-amber-600' : 'text-red-600 bg-red-600'}
          />
          <StatCard icon={Mail} label="Contact Inquiries Handled" value={state === 'loading' ? '—' : totalContact} accent="text-orange-600 bg-orange-600" />
          <StatCard icon={PhoneCall} label="Call Reports Logged" value={state === 'loading' ? '—' : totalCalls} accent="text-teal-600 bg-teal-600" />
        </div>

        {/* Per-manager table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Coverage by Manager</h2>
              <p className="text-xs text-slate-400">Lowest coverage first · click a row for full details</p>
            </div>
            {filteredManagers.length > 0 && state === 'ready' && (
              <span className="ml-auto text-xs font-medium text-slate-400">
                {filteredManagers.length} manager{filteredManagers.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {state === 'loading' ? (
            <TableSkeleton />
          ) : filteredManagers.length === 0 ? (
            <div className="p-14 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-medium text-slate-500">
                {state === 'unauthorized' ? 'Unable to load managers' : search ? 'No managers match your search' : 'No managers found'}
              </p>
              {search && <p className="text-xs mt-1">Try a different name or email</p>}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">Manager</th>
                      <th className="text-left px-5 py-3 font-semibold">Inquiries</th>
                      <th className="text-left px-5 py-3 font-semibold">Bookings</th>
                      <th className="text-left px-5 py-3 font-semibold">Vendors</th>
                      <th className="text-left px-5 py-3 font-semibold">Contact</th>
                      <th className="text-left px-5 py-3 font-semibold">Calls</th>
                      <th className="text-left px-5 py-3 font-semibold">Coverage</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredManagers.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => openManager(m.id)}
                        className="group hover:bg-indigo-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(m.id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                              {getInitials(m.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900 truncate">{m.name}</p>
                                {m.id === topPerformerId && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                                {m.id === needsAttentionId && (
                                  <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <span className="font-semibold text-slate-900">{m.inquiries.actioned}</span>
                          <span className="text-slate-400"> / {m.inquiries.total}</span>
                          {m.inquiries.actionedBacklog > 0 && (
                            <p className="text-[11px] text-slate-400" title="Older inquiries cleared during this period, on top of this period's own total.">+{m.inquiries.actionedBacklog} backlog</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <span className="font-semibold text-slate-900">{m.bookings.actioned}</span>
                          <span className="text-slate-400"> / {m.bookings.total}</span>
                          {m.bookings.actionedBacklog > 0 && (
                            <p className="text-[11px] text-slate-400" title="Older bookings cleared during this period, on top of this period's own total.">+{m.bookings.actionedBacklog} backlog</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200 px-2 py-1 rounded-full">
                            <UserPlus className="w-3 h-3" /> {m.vendors.created + m.vendors.approved}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2 py-1 rounded-full">
                            <Mail className="w-3 h-3" /> {m.contactInquiries.actioned}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {/* Call reports are the manager's own outbound work —
                              counted here so a day spent chasing vendor leads
                              is not invisible on this page. */}
                          {/* Links straight to this manager's rows on the call
                              reports page — the number alone begs the question
                              "which calls?". */}
                          <Link
                            href={`/admin/settings/managers/call-reports?managerId=${m.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium bg-teal-50 text-teal-700 ring-1 ring-teal-200 px-2 py-1 rounded-full hover:bg-teal-100 transition"
                            title={`${m.callReports?.converted ?? 0} converted — view call reports`}
                          >
                            <PhoneCall className="w-3 h-3" /> {m.callReports?.logged ?? 0}
                            {(m.callReports?.converted ?? 0) > 0 && (
                              <span className="text-teal-500">· {m.callReports.converted} conv</span>
                            )}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-[130px]">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${coverageBarColor(m.inquiries.coveragePct)} transition-all`}
                                style={{ width: `${Math.min(m.inquiries.coveragePct ?? 0, 100)}%` }}
                              />
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${coverageChipColor(m.inquiries.coveragePct)}`}>
                              {m.inquiries.coveragePct === null ? '—' : `${m.inquiries.coveragePct}%`}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 inline-block transition-all" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-50">
                {filteredManagers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openManager(m.id)}
                    className="w-full text-left px-5 py-4 hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(m.id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 truncate">{m.name}</p>
                          {m.id === topPerformerId && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {m.id === needsAttentionId && <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{m.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${coverageChipColor(m.inquiries.coveragePct)}`}>
                        {m.inquiries.coveragePct === null ? '—' : `${m.inquiries.coveragePct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${coverageBarColor(m.inquiries.coveragePct)}`}
                        style={{ width: `${Math.min(m.inquiries.coveragePct ?? 0, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-slate-50 rounded-lg py-2" title={m.inquiries.actionedBacklog > 0 ? `+${m.inquiries.actionedBacklog} older inquiries also cleared this period` : undefined}>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Inq</p>
                        <p className="text-xs font-semibold text-slate-800">
                          {m.inquiries.actioned}/{m.inquiries.total}
                          {m.inquiries.actionedBacklog > 0 && <span className="text-slate-400">+{m.inquiries.actionedBacklog}</span>}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg py-2" title={m.bookings.actionedBacklog > 0 ? `+${m.bookings.actionedBacklog} older bookings also cleared this period` : undefined}>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Book</p>
                        <p className="text-xs font-semibold text-slate-800">
                          {m.bookings.actioned}/{m.bookings.total}
                          {m.bookings.actionedBacklog > 0 && <span className="text-slate-400">+{m.bookings.actionedBacklog}</span>}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg py-2">
                        <p className="text-[10px] text-purple-400 uppercase tracking-wide">Vendor</p>
                        <p className="text-xs font-semibold text-purple-700">{m.vendors.created + m.vendors.approved}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg py-2">
                        <p className="text-[10px] text-orange-400 uppercase tracking-wide">Contact</p>
                        <p className="text-xs font-semibold text-orange-700">{m.contactInquiries.actioned}</p>
                      </div>
                      <div className="bg-teal-50 rounded-lg py-2">
                        <p className="text-[10px] text-teal-400 uppercase tracking-wide">Calls</p>
                        <p className="text-xs font-semibold text-teal-700">{m.callReports?.logged ?? 0}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center pt-2">
          <Briefcase className="w-3 h-3" />
          Coverage is calculated from inquiries assigned by each manager's locations &amp; services
        </div>
      </div>
    </div>
  );
}
