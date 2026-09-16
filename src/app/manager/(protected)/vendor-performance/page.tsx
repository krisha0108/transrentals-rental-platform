'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Loader2,
    Search,
    TrendingUp,
    Award,
    BarChart3,
    AlertCircle,
    RefreshCcw,
    ChevronRight,
    Radio,
    ArrowUpDown,
    Medal,
    Clock,
    Filter,
  X,
    CalendarDays,
    MapPin,
    FileCheck2,
    Wifi,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

interface VendorPerformance {
    id: string;
    businessName: string;
    status: string;
    totalQuotes: number;
    acceptedQuotes: number;
    acceptanceRate: number;
    /** Newest quote inside the selected window, null when they raised none. */
    lastQuoteAt: string | null;
    lastLoginAt: string | null;
    locations: { id: string; name: string }[];
}

interface LocationOption { id: string; name: string }

/**
 * Date presets, resolved against the browser's day so "Today" means the
 * manager's today. Values are plain YYYY-MM-DD — the API widens `to` to the
 * end of that day itself.
 */
const DATE_PRESETS = [
    { key: 'all', label: 'All time' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: 'Last 7 days' },
    { key: 'custom', label: 'Custom range' },
] as const;
type DatePreset = (typeof DATE_PRESETS)[number]['key'];

const ymd = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function presetRange(preset: DatePreset): { from: string; to: string } {
    const today = new Date();
    switch (preset) {
        case 'today':
            return { from: ymd(today), to: ymd(today) };
        case 'yesterday': {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            return { from: ymd(y), to: ymd(y) };
        }
        case 'last7': {
            const start = new Date(today);
            start.setDate(start.getDate() - 6); // inclusive of today = 7 days
            return { from: ymd(start), to: ymd(today) };
        }
        default:
            return { from: '', to: '' };
    }
}

const QUOTE_FILTERS = [
    { key: 'all', label: 'Quotes: any' },
    { key: 'yes', label: 'Quote submitted' },
    { key: 'no', label: 'No quote submitted' },
    { key: 'accepted', label: 'Has accepted quote' },
] as const;
type QuoteFilter = (typeof QUOTE_FILTERS)[number]['key'];

const PRESENCE_FILTERS = [
    { key: 'all', label: 'Presence: any' },
    { key: 'active', label: 'Online' },
    { key: 'idle', label: 'Idle' },
    { key: 'offline', label: 'Offline' },
    { key: 'never', label: 'Never logged in' },
] as const;
type PresenceFilter = (typeof PRESENCE_FILTERS)[number]['key'];

const SEEN_FILTERS = [
    { key: 'all', label: 'Last seen: any' },
    { key: '24h', label: 'Seen in last 24h' },
    { key: '7d', label: 'Seen in last 7 days' },
    { key: '30d', label: 'Seen in last 30 days' },
    { key: 'older', label: 'Not seen in 30+ days' },
] as const;
type SeenFilter = (typeof SEEN_FILTERS)[number]['key'];

const SEEN_WINDOW_MS: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

function shortDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

type PresenceStatus = 'active' | 'idle' | 'offline';

interface PresenceInfo {
    status: PresenceStatus;
    lastSeenAt: string | null;
}

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
    active: { label: 'Online', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700' },
    idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700' },
    offline: { label: 'Offline', dot: 'bg-gray-300', text: 'text-gray-500' },
};

function presenceTimeAgo(iso: string | null): string {
    if (!iso) return 'never logged in';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

const SORT_OPTIONS = [
    { key: 'rate_desc', label: 'Acceptance rate: high to low' },
    { key: 'rate_asc', label: 'Acceptance rate: low to high' },
    { key: 'quotes_desc', label: 'Most quotes submitted' },
    { key: 'name_asc', label: 'Vendor name: A to Z' },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]['key'];

const RATE_STYLE = (rate: number) =>
    rate > 70
        ? { bar: 'bg-emerald-500', text: 'text-emerald-700' }
        : rate > 40
        ? { bar: 'bg-amber-500', text: 'text-amber-700' }
        : { bar: 'bg-red-500', text: 'text-red-700' };

const MEDAL_STYLE = [
    { bg: 'bg-amber-50', ring: 'ring-amber-200', icon: 'text-amber-500', label: '1st' },
    { bg: 'bg-slate-50', ring: 'ring-slate-200', icon: 'text-slate-400', label: '2nd' },
    { bg: 'bg-orange-50', ring: 'ring-orange-200', icon: 'text-orange-400', label: '3rd' },
];

function initials(name: string) {
    return name.trim().slice(0, 2).toUpperCase();
}

interface TodayActivityInfo {
    activeSeconds: number;
    idleSeconds: number;
}

function formatActivityDuration(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs === 0 && mins === 0) return '0m';
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
}

const STATUS_STYLE: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-amber-100 text-amber-800',
    DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-purple-100 text-purple-800',
    BLOCKED: 'bg-gray-200 text-gray-700',
};

export default function VendorPerformancePage() {
    const [data, setData] = useState<VendorPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortKey>('rate_desc');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Quote numbers are scoped to this window server-side; everything else
    // filters client-side off the rows that come back.
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [quoteFilter, setQuoteFilter] = useState<QuoteFilter>('all');
    const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>('all');
    const [seenFilter, setSeenFilter] = useState<SeenFilter>('all');

    const activeRange = useMemo(() => {
        if (datePreset === 'custom') return { from: customFrom, to: customTo };
        return presetRange(datePreset);
    }, [datePreset, customFrom, customTo]);

    // Drives the Clear all button — every filter this page applies.
    const activeFilterCount =
        (searchQuery.trim() ? 1 : 0) +
        (statusFilter !== 'ALL' ? 1 : 0) +
        (datePreset !== 'all' ? 1 : 0) +
        (locationFilter !== 'ALL' ? 1 : 0) +
        (quoteFilter !== 'all' ? 1 : 0) +
        (presenceFilter !== 'all' ? 1 : 0) +
        (seenFilter !== 'all' ? 1 : 0);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setDatePreset('all');
        setCustomFrom('');
        setCustomTo('');
        setLocationFilter('ALL');
        setQuoteFilter('all');
        setPresenceFilter('all');
        setSeenFilter('all');
    };
    const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});
    const [todayActivity, setTodayActivity] = useState<Record<string, TodayActivityInfo>>({});

    const { showToast } = useToast();

    const fetchPerformance = async () => {
        try {
            setRefreshing(true);
            const qs = new URLSearchParams();
            if (activeRange.from) qs.set('from', activeRange.from);
            if (activeRange.to) qs.set('to', activeRange.to);
            if (locationFilter !== 'ALL') qs.set('locationId', locationFilter);
            const response = await fetch(`/api/manager/vendor-performance?${qs.toString()}`);
            const result = await response.json();

            if (result.data) {
                setData(result.data);
                if (result.locations) setLocations(result.locations);
            } else if (result.error) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error
                });
            }
        } catch (error) {
            console.error('Error fetching performance:', error);
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to load performance data'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useManagerPageHeader(
        'Vendor Performance',
        'Quote acceptance rates and live activity for vendors in your assigned locations.',
        <button
            key="refresh"
            onClick={fetchPerformance}
            disabled={refreshing}
            title="Refresh"
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
        >
            <RefreshCcw className={`w-5 h-5 text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
    );

    const fetchPresence = async () => {
        try {
            const res = await fetch('/api/admin/vendors/presence');
            const data = await res.json();
            if (data.presence) setPresence(data.presence);
        } catch (error) {
            console.error('Failed to fetch vendor presence:', error);
        }
    };

    const fetchTodayActivity = async () => {
        try {
            const res = await fetch('/api/admin/vendors/activity-today');
            const data = await res.json();
            if (data.activity) setTodayActivity(data.activity);
        } catch (error) {
            console.error('Failed to fetch vendor today-activity:', error);
        }
    };

    useEffect(() => {
        fetchPresence();
        fetchTodayActivity();
        const interval = setInterval(() => {
            fetchPresence();
            fetchTodayActivity();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Date and location are answered by the API, so changing either refetches.
    // A half-filled custom range is ignored until both ends are set, otherwise
    // the list would jump around while the manager is still picking dates.
    useEffect(() => {
        if (datePreset === 'custom' && !(customFrom && customTo)) return;
        fetchPerformance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datePreset, customFrom, customTo, locationFilter]);

    const sortedData = useMemo(() => {
        const list = [...data];
        switch (sortBy) {
            case 'rate_asc':
                return list.sort((a, b) => a.acceptanceRate - b.acceptanceRate);
            case 'quotes_desc':
                return list.sort((a, b) => b.totalQuotes - a.totalQuotes);
            case 'name_asc':
                return list.sort((a, b) => a.businessName.localeCompare(b.businessName));
            case 'rate_desc':
            default:
                return list.sort((a, b) => b.acceptanceRate - a.acceptanceRate);
        }
    }, [data, sortBy]);

    const statusOptions = useMemo(
        () => Array.from(new Set(data.map((v) => v.status))).sort(),
        [data]
    );

    const filteredData = useMemo(() => {
        const now = Date.now();
        return sortedData.filter((v) => {
            if (!v.businessName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;

            if (quoteFilter === 'yes' && v.totalQuotes === 0) return false;
            if (quoteFilter === 'no' && v.totalQuotes > 0) return false;
            if (quoteFilter === 'accepted' && v.acceptedQuotes === 0) return false;

            // "Never logged in" is a property of the vendor, not of presence —
            // a vendor with no login has no presence row at all.
            const p = presence[v.id];
            if (presenceFilter === 'never') {
                if (v.lastLoginAt) return false;
            } else if (presenceFilter !== 'all') {
                if ((p?.status ?? 'offline') !== presenceFilter) return false;
            }

            if (seenFilter !== 'all') {
                const seenIso = p?.lastSeenAt ?? v.lastLoginAt;
                const seenAt = seenIso ? new Date(seenIso).getTime() : null;
                if (seenFilter === 'older') {
                    // Never seen counts as "not seen in 30+ days" — that is
                    // exactly the list a manager chasing dormant vendors wants.
                    if (seenAt !== null && now - seenAt <= SEEN_WINDOW_MS['30d']) return false;
                } else {
                    if (seenAt === null) return false;
                    if (now - seenAt > SEEN_WINDOW_MS[seenFilter]) return false;
                }
            }

            return true;
        });
    }, [sortedData, searchQuery, statusFilter, quoteFilter, presenceFilter, seenFilter, presence]);

    // Summary for the rows currently on screen — the "what did my calls do?"
    // answer, recomputed for whatever window and filters are applied.
    const summary = useMemo(() => {
        const vendorsWithQuotes = filteredData.filter((v) => v.totalQuotes > 0).length;
        const totalQuotes = filteredData.reduce((acc, v) => acc + v.totalQuotes, 0);
        const acceptedQuotes = filteredData.reduce((acc, v) => acc + v.acceptedQuotes, 0);
        const activeVendors = filteredData.filter((v) => {
            const seen = presence[v.id]?.lastSeenAt ?? v.lastLoginAt;
            return !!seen && Date.now() - new Date(seen).getTime() <= SEEN_WINDOW_MS['24h'];
        }).length;
        return {
            shown: filteredData.length,
            vendorsWithQuotes,
            totalQuotes,
            acceptedQuotes,
            activeVendors,
        };
    }, [filteredData, presence]);

    const stats = useMemo(() => {
        const rankedByRate = [...data].sort((a, b) => b.acceptanceRate - a.acceptanceRate);
        const onlineNow = data.filter((v) => presence[v.id]?.status === 'active').length;
        return {
            avgRate: data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.acceptanceRate, 0) / data.length) : 0,
            totalQuotes: data.reduce((acc, curr) => acc + curr.totalQuotes, 0),
            topVendor: data.length > 0 ? rankedByRate[0].businessName : 'N/A',
            top3: rankedByRate.filter((v) => v.totalQuotes > 0).slice(0, 3),
            onlineNow,
        };
    }, [data, presence]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Crunching the numbers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Avg. Acceptance Rate</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.avgRate}%</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Quotes</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalQuotes.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform relative">
                            <Radio className="w-6 h-6 text-emerald-600" />
                            {stats.onlineNow > 0 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Online Right Now</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.onlineNow} <span className="text-sm font-medium text-gray-400">/ {data.length}</span></h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform">
                            <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Performing Vendor</p>
                            <h3 className="text-2xl font-bold text-gray-900 truncate max-w-[180px]">{stats.topVendor}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top 3 leaderboard */}
            {stats.top3.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                        <Medal className="w-4 h-4 text-amber-500" />
                        Top Performers
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.top3.map((v, i) => {
                            const medal = MEDAL_STYLE[i];
                            return (
                                <Link
                                    key={v.id}
                                    href={`/manager/vendor-performance/${v.id}`}
                                    className={`flex items-center gap-3 p-4 rounded-xl ${medal.bg} ring-1 ${medal.ring} hover:shadow-sm transition`}
                                >
                                    <div className={`flex items-center justify-center h-10 w-10 rounded-full bg-white ring-2 ${medal.ring} font-bold ${medal.icon} shrink-0`}>
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{v.businessName}</p>
                                        <p className="text-xs text-gray-500">{v.acceptanceRate}% acceptance · {v.totalQuotes} quotes</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary for the current window + filters — the daily
                "what did my calls actually do?" line. */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Vendors shown', value: summary.shown, Icon: BarChart3, tint: 'text-gray-400 bg-gray-50' },
                    { label: 'Active in 24h', value: summary.activeVendors, Icon: Radio, tint: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Submitted a quote', value: summary.vendorsWithQuotes, Icon: FileCheck2, tint: 'text-blue-600 bg-blue-50' },
                    { label: 'Quotes submitted', value: summary.totalQuotes, Icon: TrendingUp, tint: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Quotes accepted', value: summary.acceptedQuotes, Icon: Award, tint: 'text-amber-600 bg-amber-50' },
                ].map((card) => (
                    <div key={card.label} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5">
                        <span className={`shrink-0 w-9 h-9 rounded-lg grid place-items-center ${card.tint}`}>
                            <card.Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xl font-black text-gray-900 leading-none">{card.value}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mt-1 truncate">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters — search and period lead, because that is the question
                being asked ("who did I reach, and when?"); the narrowing
                dropdowns sit under them as one labelled, even-width row so
                nothing floats in dead space. */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">

                {/* Search + clear */}
                <div className="flex items-center gap-3 p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search vendor by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-green-500/30 focus:ring-2 focus:ring-green-500/10 transition outline-none"
                        />
                    </div>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        >
                            <X className="w-4 h-4" />
                            Clear
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold">
                                {activeFilterCount}
                            </span>
                        </button>
                    )}
                </div>

                {/* Period — the primary axis of the daily workflow, so it gets
                    pills rather than being buried in a dropdown. */}
                <div className="flex flex-wrap items-center gap-2 p-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 mr-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Period
                    </span>
                    {DATE_PRESETS.map((d) => (
                        <button
                            key={d.key}
                            type="button"
                            onClick={() => setDatePreset(d.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                datePreset === d.key
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}

                    {datePreset === 'custom' && (
                        <div className="flex items-center gap-2 ml-1">
                            <input
                                type="date"
                                value={customFrom}
                                max={customTo || undefined}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-700 focus:bg-white focus:border-green-500/30 focus:ring-2 focus:ring-green-500/10 outline-none"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                                type="date"
                                value={customTo}
                                min={customFrom || undefined}
                                onChange={(e) => setCustomTo(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-700 focus:bg-white focus:border-green-500/30 focus:ring-2 focus:ring-green-500/10 outline-none"
                            />
                        </div>
                    )}

                    {datePreset !== 'all' && (
                        <span className="text-xs text-gray-400 ml-auto">
                            Quote numbers are for this period only
                        </span>
                    )}
                </div>

                {/* Narrowing filters — one grid, equal widths, each labelled so
                    "All time" vs "All Statuses" is never a guessing game. */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
                    {([
                        { label: 'Location', Icon: MapPin, value: locationFilter, onChange: (v: string) => setLocationFilter(v),
                          options: [{ value: 'ALL', label: 'All locations' }, ...locations.map((l) => ({ value: l.id, label: l.name }))] },
                        { label: 'Status', Icon: Filter, value: statusFilter, onChange: (v: string) => setStatusFilter(v),
                          options: [{ value: 'ALL', label: 'All statuses' }, ...statusOptions.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))] },
                        { label: 'Quotes', Icon: FileCheck2, value: quoteFilter, onChange: (v: string) => setQuoteFilter(v as QuoteFilter),
                          options: QUOTE_FILTERS.map((q) => ({ value: q.key, label: q.label.replace(/^Quotes: /, '') })) },
                        { label: 'Presence', Icon: Wifi, value: presenceFilter, onChange: (v: string) => setPresenceFilter(v as PresenceFilter),
                          options: PRESENCE_FILTERS.map((p) => ({ value: p.key, label: p.label.replace(/^Presence: /, '') })) },
                        { label: 'Last seen', Icon: Clock, value: seenFilter, onChange: (v: string) => setSeenFilter(v as SeenFilter),
                          options: SEEN_FILTERS.map((p) => ({ value: p.key, label: p.label.replace(/^Last seen: /, '') })) },
                        { label: 'Sort by', Icon: ArrowUpDown, value: sortBy, onChange: (v: string) => setSortBy(v as SortKey),
                          options: SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label })) },
                    ]).map((field) => {
                        const isSet = field.label !== 'Sort by' && field.value !== 'ALL' && field.value !== 'all';
                        return (
                            <div key={field.label} className="min-w-0">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                                    <field.Icon className="w-3 h-3" />
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <select
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium truncate transition outline-none cursor-pointer border focus:ring-2 focus:ring-green-500/10 ${
                                            isSet
                                                ? 'bg-green-50 border-green-200 text-green-800'
                                                : 'bg-gray-50 border-transparent text-gray-700 focus:bg-white focus:border-green-500/30'
                                        }`}
                                    >
                                        {field.options.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-gray-400" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* Performance Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Online</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        Today&apos;s Activity
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">Submitted</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">Accepted</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Acceptance Rate</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Last Quote</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.length > 0 ? (
                                filteredData.map((vendor) => {
                                    const rateStyle = RATE_STYLE(vendor.acceptanceRate);
                                    const p = presence[vendor.id];
                                    const meta = PRESENCE_META[p?.status || 'offline'];
                                    return (
                                        <tr
                                            key={vendor.id}
                                            className="hover:bg-green-50/50 transition cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 text-green-700 font-bold text-xs shrink-0">
                                                        {initials(vendor.businessName)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{vendor.businessName}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5 font-mono">ID: {vendor.id}</div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block" title={p ? `Last seen ${presenceTimeAgo(p.lastSeenAt)}` : 'Never logged in'}>
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                                                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                                        {meta.label}
                                                    </span>
                                                    {p?.status !== 'active' && (
                                                        <p className="text-[11px] text-gray-400 mt-0.5">{p ? presenceTimeAgo(p.lastSeenAt) : 'never logged in'}</p>
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const act = todayActivity[vendor.id];
                                                    if (!act || act.activeSeconds + act.idleSeconds === 0) {
                                                        return (
                                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block text-xs text-gray-300">
                                                                No activity yet
                                                            </Link>
                                                        );
                                                    }
                                                    return (
                                                        <Link href={`/manager/vendor-performance/${vendor.id}`} className="block text-xs">
                                                            <span className="text-emerald-700 font-medium">{formatActivityDuration(act.activeSeconds)}</span>
                                                            <span className="text-gray-300 mx-1">·</span>
                                                            <span className="text-amber-600">{formatActivityDuration(act.idleSeconds)} idle</span>
                                                        </Link>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    {vendor.totalQuotes}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-green-600">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    {vendor.acceptedQuotes}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-700 ease-out rounded-full ${rateStyle.bar}`}
                                                                style={{ width: `${vendor.acceptanceRate}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-sm font-bold min-w-[40px] ${rateStyle.text}`}>{vendor.acceptanceRate}%</span>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    <span className={`text-sm ${vendor.lastQuoteAt ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                                                        {shortDate(vendor.lastQuoteAt)}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[vendor.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {vendor.status.replace(/_/g, ' ')}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-12 h-12 text-gray-200 mb-2" />
                                            <p>No vendors found matching your search{statusFilter !== 'ALL' ? ' and filters' : ''}.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
