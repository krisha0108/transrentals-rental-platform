'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, RefreshCw, Calendar, AlertTriangle, Phone, Mail,
  PhoneCall, StickyNote, ThumbsUp, ThumbsDown, Briefcase, MapPin,
  UserPlus, CheckCircle2, XCircle, Check, IndianRupee, Flame, Snowflake, Copy,
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

const ACTION_ICONS: Record<string, any> = {
  CALLED: PhoneCall,
  NOTE_ADDED: StickyNote,
  FOLLOW_UP: PhoneCall,
  CONVERTED: ThumbsUp,
  NOT_INTERESTED: ThumbsDown,
  CONNECTED: Check,
  RESPONDED: Check,
  NO_RESPONSE: XCircle,
  WRONG_NUMBER: AlertTriangle,
  PRICE_TOO_HIGH: IndianRupee,
  HOT_LEAD: Flame,
  COLD_LEAD: Snowflake,
  DUPLICATE_INQUIRY: Copy,
};

interface CoverageStat { total: number; actioned: number; coveragePct: number | null }

interface ManagerDetail {
  manager: { id: string; name: string; email: string; phone: string | null; isActive: boolean; createdAt: string };
  locations: { id: string; name: string; type: string }[];
  services: { id: string; name: string }[];
  vendors: { created: number; approved: number };
  inquiries: CoverageStat;
  bookings: CoverageStat;
  actionBreakdown: Record<string, number>;
}

interface UntouchedItem {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  locationName: string;
  createdAt: string;
}

interface ActionedItem {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  locationName: string;
  submittedAt: string;
  actions: { actionType: string; note: string | null; createdAt: string }[];
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

export default function ManagerPerformanceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const managerId = params.id as string;

  const [filter, setFilter] = useState<DatePreset>((searchParams.get('filter') as DatePreset) || 'today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ManagerDetail | null>(null);

  const [inquiryTab, setInquiryTab] = useState<'actioned' | 'untouched'>('actioned');
  const [actioned, setActioned] = useState<ActionedItem[]>([]);
  const [untouched, setUntouched] = useState<UntouchedItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchDetail = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    let url = `/api/admin/managers/performance/detail?managerId=${managerId}&filter=${preset}`;
    if (preset === 'custom' && from && to) url += `&dateFrom=${from}&dateTo=${to}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.error) setData(json);
  }, [managerId]);

  const fetchLists = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    setListLoading(true);
    try {
      const suffix = preset === 'custom' && from && to ? `&dateFrom=${from}&dateTo=${to}` : '';
      const [actionedRes, untouchedRes] = await Promise.all([
        fetch(`/api/admin/managers/performance/actioned?managerId=${managerId}&filter=${preset}${suffix}`),
        fetch(`/api/admin/managers/performance/untouched?managerId=${managerId}&filter=${preset}${suffix}`),
      ]);
      const [actionedJson, untouchedJson] = await Promise.all([actionedRes.json(), untouchedRes.json()]);
      if (!actionedJson.error) setActioned(actionedJson.actioned || []);
      if (!untouchedJson.error) setUntouched(untouchedJson.untouched || []);
    } finally {
      setListLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDetail(filter), fetchLists(filter)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilter: DatePreset) => {
    setFilter(newFilter);
    if (newFilter !== 'custom') {
      setRefreshing(true);
      Promise.all([fetchDetail(newFilter), fetchLists(newFilter)]).finally(() => setRefreshing(false));
    }
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setRefreshing(true);
    Promise.all([fetchDetail('custom', customFrom, customTo), fetchLists('custom', customFrom, customTo)]).finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchDetail(filter, customFrom, customTo), fetchLists(filter, customFrom, customTo)]).finally(() => setRefreshing(false));
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.push('/admin/settings/managers/performance')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{data.manager.name}</h1>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${data.manager.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {data.manager.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {data.manager.email}</span>
            {data.manager.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {data.manager.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="text-sm focus:outline-none" />
              <span className="text-gray-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="text-sm focus:outline-none" />
              <button onClick={applyCustomRange} disabled={!customFrom || !customTo} className="text-xs font-semibold px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-40">
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
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Assigned Locations</p>
          <p className="text-2xl font-bold text-gray-900">{data.locations.length}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Assigned Services</p>
          <p className="text-2xl font-bold text-gray-900">{data.services.length}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Vendors Created</p>
          <p className="text-2xl font-bold text-indigo-700">{data.vendors.created}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Vendors Approved</p>
          <p className="text-2xl font-bold text-green-700">{data.vendors.approved}</p>
        </div>
      </div>

      {/* Inquiries + Bookings coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-2">Inquiries ({DATE_PRESET_LABELS[filter]})</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">
              {data.inquiries.actioned}<span className="text-lg text-gray-400"> / {data.inquiries.total}</span>
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${coverageColor(data.inquiries.coveragePct)}`}>
              {data.inquiries.coveragePct === null ? '—' : `${data.inquiries.coveragePct}%`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div className={`h-full rounded-full ${coverageBarColor(data.inquiries.coveragePct)}`} style={{ width: `${Math.min(data.inquiries.coveragePct ?? 0, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-2">Bookings ({DATE_PRESET_LABELS[filter]})</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">
              {data.bookings.actioned}<span className="text-lg text-gray-400"> / {data.bookings.total}</span>
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${coverageColor(data.bookings.coveragePct)}`}>
              {data.bookings.coveragePct === null ? '—' : `${data.bookings.coveragePct}%`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div className={`h-full rounded-full ${coverageBarColor(data.bookings.coveragePct)}`} style={{ width: `${Math.min(data.bookings.coveragePct ?? 0, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Action Types */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Action Types ({DATE_PRESET_LABELS[filter]})</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.actionBreakdown).length === 0 ? (
            <span className="text-xs text-gray-400">No actions logged in this period</span>
          ) : (
            Object.entries(data.actionBreakdown).map(([type, count]) => {
              const Icon = ACTION_ICONS[type] || StickyNote;
              return (
                <span key={type} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                  <Icon className="w-3.5 h-3.5" />
                  {type.replace(/_/g, ' ')} · {count}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Inquiries: Actioned vs Untouched */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b flex items-center gap-6 px-5">
          <button
            onClick={() => setInquiryTab('actioned')}
            className={`py-3 text-sm font-medium border-b-2 transition ${inquiryTab === 'actioned' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Actioned Inquiries ({actioned.length})
          </button>
          <button
            onClick={() => setInquiryTab('untouched')}
            className={`py-3 text-sm font-medium border-b-2 transition ${inquiryTab === 'untouched' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Untouched Inquiries ({untouched.length})
          </button>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : inquiryTab === 'actioned' ? (
          actioned.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No inquiries actioned in this period.</div>
          ) : (
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {actioned.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.customerName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" /> {item.customerPhone}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.serviceName} · {item.locationName} · {item.requestNumber}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {item.actions.map((a, i) => {
                        const Icon = ACTION_ICONS[a.actionType] || StickyNote;
                        return (
                          <span key={i} className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                            <Icon className="w-3 h-3" />
                            {a.actionType.replace(/_/g, ' ')}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {item.actions.some((a) => a.note) && (
                    <div className="mt-2 space-y-1">
                      {item.actions.filter((a) => a.note).map((a, i) => (
                        <p key={i} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                          <span className="font-medium text-gray-500">{a.actionType.replace(/_/g, ' ')}:</span> "{a.note}"
                        </p>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">Last action: {formatDateTime(item.actions[0].createdAt)}</p>
                </div>
              ))}
            </div>
          )
        ) : untouched.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Nothing untouched — fully covered.</div>
        ) : (
          <div className="divide-y max-h-[420px] overflow-y-auto">
            {untouched.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{u.customerName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" /> {u.customerPhone}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{u.serviceName} · {u.locationName} · {u.requestNumber}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  {formatDateTime(u.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Locations / Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Assigned Locations ({data.locations.length})
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
            {data.locations.length === 0 ? (
              <span className="text-xs text-gray-400">No locations assigned</span>
            ) : (
              data.locations.map((loc) => (
                <span key={loc.id} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">{loc.name}</span>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-green-600" /> Assigned Services ({data.services.length})
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
            {data.services.length === 0 ? (
              <span className="text-xs text-gray-400">No services assigned</span>
            ) : (
              data.services.map((svc) => (
                <span key={svc.id} className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">{svc.name}</span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
