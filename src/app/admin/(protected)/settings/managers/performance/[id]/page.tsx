'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, RefreshCw, Calendar, AlertTriangle, Phone, Mail,
  PhoneCall, StickyNote, ThumbsUp, ThumbsDown, Briefcase, MapPin,
  UserPlus, CheckCircle2, XCircle, Check, IndianRupee, Flame, Snowflake, Copy,
  Ban, PhoneOff, UserX, Clock, XOctagon, CalendarX, MapPinOff, ExternalLink,
  FileX, Hourglass, CreditCard, Flag, HelpCircle, Search, X, Target, Inbox,
  ClipboardList, Zap, ChevronRight, Store, Timer, MousePointerClick,
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

const ACTION_ICONS: Record<string, any> = {
  CALLED: PhoneCall,
  NOTE_ADDED: StickyNote,
  FOLLOW_UP: PhoneCall,
  CONVERTED: ThumbsUp,
  NOT_INTERESTED: ThumbsDown,
  CUSTOMER_CONNECTED: Check,
  NO_VENDOR_AVAILABLE: Ban,
  VENDOR_DECLINED: XOctagon,
  VENDOR_CANT_FULFILL: CalendarX,
  VENDOR_NOT_RESPONDING: PhoneOff,
  WRONG_NUMBER: AlertTriangle,
  PRICE_TOO_HIGH: IndianRupee,
  NOT_SERVICEABLE: MapPinOff,
  AWAITING_VENDOR_QUOTE: Clock,
  QUOTE_NOT_SUBMITTED: FileX,
  CUSTOMER_NOT_RESPONDING: UserX,
  CUSTOMER_BOOKED_ELSEWHERE: ExternalLink,
  WAITING_CUSTOMER_CONFIRMATION: Hourglass,
  ADVANCE_PAYMENT_PENDING: CreditCard,
  INVALID_LEAD: Flag,
  CANCELLED: XCircle,
  DUPLICATE_INQUIRY: Copy,
  OTHER_REASON: HelpCircle,
  // Deprecated values (kept so historical rows still render an icon)
  CONNECTED: Check,
  RESPONDED: Check,
  NO_RESPONSE: XCircle,
  HOT_LEAD: Flame,
  COLD_LEAD: Snowflake,
};

interface CoverageStat { total: number; actioned: number; coveragePct: number | null }

interface ManagerDetail {
  manager: { id: string; name: string; email: string; phone: string | null; isActive: boolean; createdAt: string };
  locations: { id: string; name: string; type: string }[];
  services: { id: string; name: string }[];
  vendors: { created: number; approved: number };
  inquiries: CoverageStat;
  bookings: CoverageStat;
  contactInquiries: { actioned: number };
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

interface VendorItem {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

type PresenceStatus = 'active' | 'idle' | 'offline';

interface ActivitySummary {
  activeSeconds: number;
  idleSeconds: number;
  presence: { status: PresenceStatus; lastSeenAt: string | null };
}

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string; ring: string }> = {
  active: { label: 'Active now', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700', ring: 'ring-emerald-200 bg-emerald-50' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200 bg-amber-50' },
  offline: { label: 'Offline', dot: 'bg-slate-300', text: 'text-slate-500', ring: 'ring-slate-200 bg-slate-50' },
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs === 0 && mins === 0) return '0m';
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

const VENDOR_STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  DOCUMENTS_PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  SUSPENDED: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  BLOCKED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

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

function StatCard({
  icon: Icon, label, value, accent, onClick,
}: { icon: any; label: string; value: React.ReactNode; accent: string; onClick?: () => void }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden group hover:shadow-md transition-shadow w-full text-left ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}`}
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.07] ${accent} blur-md group-hover:opacity-[0.12] transition-opacity`} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 leading-tight pr-2">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent} bg-opacity-10`}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        {onClick && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mb-1" />}
      </div>
    </Wrapper>
  );
}

// Tailwind's scanner only picks up literal class strings, not
// template-interpolated ones — so each tab's full class set is spelled out
// here rather than built from a shared `accent` token at render time.
const TAB_META = {
  actioned: {
    label: 'Actioned', icon: CheckCircle2,
    active: 'border-emerald-600 text-emerald-700 bg-emerald-50/50',
    badgeActive: 'bg-emerald-100 text-emerald-700',
  },
  untouched: {
    label: 'Untouched', icon: AlertTriangle,
    active: 'border-red-600 text-red-700 bg-red-50/50',
    badgeActive: 'bg-red-100 text-red-700',
  },
  contact: {
    label: 'Contact Inquiries', icon: Mail,
    active: 'border-orange-600 text-orange-700 bg-orange-50/50',
    badgeActive: 'bg-orange-100 text-orange-700',
  },
} as const;

export default function ManagerPerformanceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const managerId = (params?.id as string) || '';

  const [filter, setFilter] = useState<DatePreset>((searchParams?.get('filter') as DatePreset) || 'today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ManagerDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inquiryTab, setInquiryTab] = useState<'actioned' | 'untouched' | 'contact'>('actioned');
  const [actioned, setActioned] = useState<ActionedItem[]>([]);
  const [untouched, setUntouched] = useState<UntouchedItem[]>([]);
  const [contactInquiries, setContactInquiries] = useState<ActionedItem[]>([]);
  const [vendorsCreatedList, setVendorsCreatedList] = useState<VendorItem[]>([]);
  const [vendorsApprovedList, setVendorsApprovedList] = useState<VendorItem[]>([]);
  const [vendorModal, setVendorModal] = useState<'created' | 'approved' | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState<ActivitySummary | null>(null);

  const fetchDetail = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    let url = `/api/admin/managers/performance/detail?managerId=${managerId}&filter=${preset}`;
    if (preset === 'custom' && from && to) url += `&dateFrom=${from}&dateTo=${to}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) {
        setLoadError(json.error);
      } else {
        setLoadError(null);
        setData(json);
      }
    } catch {
      setLoadError('Failed to reach the server. Check your connection and try again.');
    }
  }, [managerId]);

  const fetchLists = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    setListLoading(true);
    try {
      const suffix = preset === 'custom' && from && to ? `&dateFrom=${from}&dateTo=${to}` : '';
      const [actionedRes, untouchedRes, vendorsRes] = await Promise.all([
        fetch(`/api/admin/managers/performance/actioned?managerId=${managerId}&filter=${preset}${suffix}`),
        fetch(`/api/admin/managers/performance/untouched?managerId=${managerId}&filter=${preset}${suffix}`),
        fetch(`/api/admin/managers/performance/vendors?managerId=${managerId}&filter=${preset}${suffix}`),
      ]);
      const [actionedJson, untouchedJson, vendorsJson] = await Promise.all([actionedRes.json(), untouchedRes.json(), vendorsRes.json()]);
      if (!actionedJson.error) {
        setActioned(actionedJson.actioned || []);
        setContactInquiries(actionedJson.contactInquiries || []);
      }
      if (!untouchedJson.error) setUntouched(untouchedJson.untouched || []);
      if (!vendorsJson.error) {
        setVendorsCreatedList(vendorsJson.created || []);
        setVendorsApprovedList(vendorsJson.approved || []);
      }
    } finally {
      setListLoading(false);
    }
  }, [managerId]);

  const fetchActivity = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    const suffix = preset === 'custom' && from && to ? `&dateFrom=${from}&dateTo=${to}` : '';
    const res = await fetch(`/api/admin/managers/performance/activity?managerId=${managerId}&filter=${preset}${suffix}`);
    const json = await res.json();
    if (!json.error) setActivity(json);
  }, [managerId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDetail(filter), fetchLists(filter), fetchActivity(filter)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live presence (active/idle/offline dot) refreshes independently of the
  // heavier lists, so admins watching this page see status change in real time.
  useEffect(() => {
    const interval = setInterval(() => fetchActivity(filter, customFrom, customTo), 30000);
    return () => clearInterval(interval);
  }, [filter, customFrom, customTo, fetchActivity]);

  const handleFilterChange = (newFilter: DatePreset) => {
    setFilter(newFilter);
    setShowCustom(false);
    setRefreshing(true);
    Promise.all([fetchDetail(newFilter), fetchLists(newFilter), fetchActivity(newFilter)]).finally(() => setRefreshing(false));
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setFilter('custom');
    setRefreshing(true);
    Promise.all([fetchDetail('custom', customFrom, customTo), fetchLists('custom', customFrom, customTo), fetchActivity('custom', customFrom, customTo)]).finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchDetail(filter, customFrom, customTo), fetchLists(filter, customFrom, customTo), fetchActivity(filter, customFrom, customTo)]).finally(() => setRefreshing(false));
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const q = search.trim().toLowerCase();
  const filteredActioned = useMemo(
    () => (q ? actioned.filter((i) => i.customerName.toLowerCase().includes(q) || i.customerPhone.includes(q)) : actioned),
    [actioned, q]
  );
  const filteredUntouched = useMemo(
    () => (q ? untouched.filter((i) => i.customerName.toLowerCase().includes(q) || i.customerPhone.includes(q)) : untouched),
    [untouched, q]
  );
  const filteredContact = useMemo(
    () => (q ? contactInquiries.filter((i) => i.customerName.toLowerCase().includes(q) || i.customerPhone.includes(q)) : contactInquiries),
    [contactInquiries, q]
  );

  const sortedActionBreakdown = useMemo(
    () => (data ? Object.entries(data.actionBreakdown).sort((a, b) => b[1] - a[1]) : []),
    [data]
  );

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 to-white flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading manager performance...</p>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 to-white flex items-center justify-center h-96">
        <div className="text-center max-w-sm px-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Couldn&apos;t load this page</p>
          <p className="text-sm text-slate-400 mb-4">
            {loadError || 'Something went wrong loading manager performance.'}
            {loadError === 'Access denied' && ' — your session may belong to a different account. Try signing in again.'}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              Promise.all([fetchDetail(filter, customFrom, customTo), fetchLists(filter, customFrom, customTo), fetchActivity(filter, customFrom, customTo)]).finally(() => setLoading(false));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={() => router.push('/admin/settings/managers/performance')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {getInitials(data.manager.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{data.manager.name}</h1>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${data.manager.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
                  {data.manager.isActive ? 'Active' : 'Inactive'}
                </span>
                {activity && (() => {
                  const meta = PRESENCE_META[activity.presence.status];
                  return (
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ring-1 ${meta.ring} ${meta.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                      {activity.presence.status !== 'active' && ` · ${timeAgo(activity.presence.lastSeenAt)}`}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.manager.email}</span>
                {data.manager.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.manager.phone}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition shadow-sm shrink-0"
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
                  filter === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom((s) => !s)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={MapPin} label="Assigned Locations" value={data.locations.length} accent="text-blue-600 bg-blue-600" />
          <StatCard icon={Briefcase} label="Assigned Services" value={data.services.length} accent="text-violet-600 bg-violet-600" />
          <StatCard icon={UserPlus} label="Vendors Created" value={data.vendors.created} accent="text-indigo-600 bg-indigo-600" onClick={() => setVendorModal('created')} />
          <StatCard icon={CheckCircle2} label="Vendors Approved" value={data.vendors.approved} accent="text-emerald-600 bg-emerald-600" onClick={() => setVendorModal('approved')} />
          <StatCard icon={Mail} label="Contact Inquiries Handled" value={data.contactInquiries.actioned} accent="text-orange-600 bg-orange-600" />
        </div>

        {/* Activity + Inquiries + Bookings — one compact row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activity — active vs idle time, tracked silently in the background */}
          {activity && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Timer className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Activity ({DATE_PRESET_LABELS[filter]})</p>
                </div>
                {(() => {
                  const meta = PRESENCE_META[activity.presence.status];
                  return (
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ring-1 ${meta.ring} ${meta.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                      {activity.presence.status !== 'active' && ` · ${timeAgo(activity.presence.lastSeenAt)}`}
                    </span>
                  );
                })()}
              </div>

              {activity.activeSeconds === 0 && activity.idleSeconds === 0 ? (
                <p className="text-xs text-slate-400 py-2">No activity tracked in this period yet.</p>
              ) : (
                (() => {
                  const total = activity.activeSeconds + activity.idleSeconds;
                  const activePct = total > 0 ? (activity.activeSeconds / total) * 100 : 0;
                  const R = 34;
                  const C = 2 * Math.PI * R;
                  const activeArc = (activePct / 100) * C;
                  return (
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {/* Clock-face hour ticks */}
                          {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i * 30 * Math.PI) / 180;
                            const isMajor = i % 3 === 0;
                            return (
                              <line
                                key={i}
                                x1={50 + 45 * Math.cos(angle)}
                                y1={50 + 45 * Math.sin(angle)}
                                x2={50 + (isMajor ? 40 : 41.5) * Math.cos(angle)}
                                y2={50 + (isMajor ? 40 : 41.5) * Math.sin(angle)}
                                stroke="#cbd5e1"
                                strokeWidth={isMajor ? 2 : 1}
                                strokeLinecap="round"
                              />
                            );
                          })}
                          {/* Idle track (full ring) */}
                          <circle cx="50" cy="50" r={R} fill="none" stroke="#fde68a" strokeWidth="9" />
                          {/* Active arc, drawn clockwise from 12 o'clock */}
                          <circle
                            cx="50" cy="50" r={R} fill="none"
                            stroke="url(#activityActiveGrad)"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={`${activeArc} ${C - activeArc}`}
                          />
                          <defs>
                            <linearGradient id="activityActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-base font-bold text-slate-900 leading-none">{Math.round(activePct)}%</span>
                          <span className="text-[9px] text-slate-400 font-medium mt-0.5">active</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{formatDuration(activity.activeSeconds)}</p>
                            <p className="text-[10px] text-slate-400">Active</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5 text-amber-500" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{formatDuration(activity.idleSeconds)}</p>
                            <p className="text-[10px] text-slate-400">Idle</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Inquiries coverage */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inquiries ({DATE_PRESET_LABELS[filter]})</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {data.inquiries.actioned}<span className="text-lg text-slate-400 font-medium"> / {data.inquiries.total}</span>
              </p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${coverageChipColor(data.inquiries.coveragePct)}`}>
                {data.inquiries.coveragePct === null ? '—' : `${data.inquiries.coveragePct}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className={`h-full rounded-full ${coverageBarColor(data.inquiries.coveragePct)} transition-all`} style={{ width: `${Math.min(data.inquiries.coveragePct ?? 0, 100)}%` }} />
            </div>
          </div>

          {/* Bookings coverage */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bookings ({DATE_PRESET_LABELS[filter]})</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {data.bookings.actioned}<span className="text-lg text-slate-400 font-medium"> / {data.bookings.total}</span>
              </p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${coverageChipColor(data.bookings.coveragePct)}`}>
                {data.bookings.coveragePct === null ? '—' : `${data.bookings.coveragePct}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className={`h-full rounded-full ${coverageBarColor(data.bookings.coveragePct)} transition-all`} style={{ width: `${Math.min(data.bookings.coveragePct ?? 0, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Action Types */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Action Types ({DATE_PRESET_LABELS[filter]})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedActionBreakdown.length === 0 ? (
              <span className="text-xs text-slate-400">No actions logged in this period</span>
            ) : (
              sortedActionBreakdown.map(([type, count]) => {
                const Icon = ACTION_ICONS[type] || StickyNote;
                return (
                  <span key={type} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 hover:bg-slate-100 transition">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {type.replace(/_/g, ' ')}
                    <span className="text-slate-400">· {count}</span>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Inquiries: Actioned vs Untouched vs Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-100 flex-wrap">
            {(Object.keys(TAB_META) as (keyof typeof TAB_META)[]).map((key) => {
              const meta = TAB_META[key];
              const Icon = meta.icon;
              const count = key === 'actioned' ? actioned.length : key === 'untouched' ? untouched.length : contactInquiries.length;
              const active = inquiryTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setInquiryTab(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition ${
                    active ? meta.active : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? meta.badgeActive : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="relative ml-auto mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or phone..."
                className="pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-52"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : inquiryTab === 'actioned' ? (
            filteredActioned.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <Inbox className="w-9 h-9 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">{search ? 'No matches for your search' : 'No inquiries actioned in this period.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                {filteredActioned.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{item.customerName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" /> {item.customerPhone}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.serviceName} · {item.locationName} · {item.requestNumber}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {item.actions.map((a, i) => {
                          const Icon = ACTION_ICONS[a.actionType] || StickyNote;
                          return (
                            <span key={i} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
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
                          <p key={i} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium text-slate-500">{a.actionType.replace(/_/g, ' ')}:</span> "{a.note}"
                          </p>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-2">Last action: {formatDateTime(item.actions[0].createdAt)}</p>
                  </div>
                ))}
              </div>
            )
          ) : inquiryTab === 'untouched' ? (
            filteredUntouched.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-emerald-200" />
                <p className="text-sm">{search ? 'No matches for your search' : 'Nothing untouched — fully covered.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                {filteredUntouched.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{u.customerName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" /> {u.customerPhone}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{u.serviceName} · {u.locationName} · {u.requestNumber}</p>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      {formatDateTime(u.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : filteredContact.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Mail className="w-9 h-9 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">{search ? 'No matches for your search' : 'No contact-form inquiries handled in this period.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {filteredContact.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{item.customerName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" /> {item.customerPhone}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Contact Inquiry · {item.locationName} · {item.requestNumber}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {item.actions.map((a, i) => {
                        const Icon = ACTION_ICONS[a.actionType] || StickyNote;
                        return (
                          <span key={i} className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 ring-1 ring-orange-200 rounded-full px-2 py-0.5">
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
                        <p key={i} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                          <span className="font-medium text-slate-500">Reply:</span> "{a.note}"
                        </p>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-2">Last action: {formatDateTime(item.actions[0].createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Locations / Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Assigned Locations ({data.locations.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
              {data.locations.length === 0 ? (
                <span className="text-xs text-slate-400">No locations assigned</span>
              ) : (
                data.locations.map((loc) => (
                  <span key={loc.id} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200 rounded-full">{loc.name}</span>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5 text-violet-600" />
              </div>
              Assigned Services ({data.services.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
              {data.services.length === 0 ? (
                <span className="text-xs text-slate-400">No services assigned</span>
              ) : (
                data.services.map((svc) => (
                  <span key={svc.id} className="px-2.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-200 rounded-full">{svc.name}</span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {vendorModal && (
        <VendorDrillDownModal
          type={vendorModal}
          vendors={vendorModal === 'created' ? vendorsCreatedList : vendorsApprovedList}
          filterLabel={DATE_PRESET_LABELS[filter]}
          onClose={() => setVendorModal(null)}
        />
      )}
    </div>
  );
}

function VendorDrillDownModal({
  type, vendors, filterLabel, onClose,
}: { type: 'created' | 'approved'; vendors: VendorItem[]; filterLabel: string; onClose: () => void }) {
  const isCreated = type === 'created';
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCreated ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
            {isCreated ? <UserPlus className="w-4.5 h-4.5 text-indigo-600" style={{ width: 18, height: 18 }} /> : <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" style={{ width: 18, height: 18 }} />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">Vendors {isCreated ? 'Created' : 'Approved'}</h2>
            <p className="text-xs text-slate-400">{vendors.length} vendor{vendors.length === 1 ? '' : 's'} · {filterLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0">
            <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {vendors.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Store className="w-9 h-9 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">No vendors {isCreated ? 'created' : 'approved'} in this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {vendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/admin/vendors/${v.id}`}
                  target="_blank"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {v.businessName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm truncate">{v.businessName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${VENDOR_STATUS_STYLE[v.status] || 'bg-slate-100 text-slate-500'}`}>
                        {v.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{v.ownerName} · {v.email}{v.city ? ` · ${v.city}` : ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isCreated ? `Created ${formatDateTime(v.createdAt)}` : v.approvedAt ? `Approved ${formatDateTime(v.approvedAt)}` : '—'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
