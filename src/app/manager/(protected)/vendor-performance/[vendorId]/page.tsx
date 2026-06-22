'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Search, Filter, ChevronRight, Calendar, Clock, MapPin, User, Phone,
    IndianRupee, AlertCircle, CheckCircle, XCircle, Bike, RefreshCw, Car, Bus,
    Truck, Package, Layers, ChevronLeft, ArrowLeft, FileText, CircleDollarSign,
    ClipboardList, Eye,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

// ── Shared types ────────────────────────────────────────────────────────────

interface Booking {
    id: string;
    bookingNumber: string;
    serviceType: string;
    customerName: string;
    customerPhone: string;
    status: string;
    amount: number;
    date: string;
    createdAt: string;
    details: Record<string, any>;
}

interface VendorStats {
    totalQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    totalBookings: number;
    acceptedBookings: number;
    cancelledBookings: number;
    totalEarnings: number;
    quotesByStatus: Record<string, number>;
}

interface Quote {
    id: string;
    quoteNumber: string;
    serviceType: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vehicleName: string;
    vehicleCategory: string;
    totalAmount: number;
    advanceAmount: number;
    inclusions: string | null;
    exclusions: string | null;
    termsConditions: string | null;
    validTill: string;
    sentAt: string | null;
    createdAt: string;
    viewCount: number;
    location: string;
}

interface QuoteStats {
    total: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    draft: number;
}

// ── Config ───────────────────────────────────────────────────────────────────

const QUOTE_STATUS_COLORS: Record<string, string> = {
    ACCEPTED: '#22c55e', REJECTED: '#ef4444', SENT: '#3b82f6',
    VIEWED: '#8b5cf6', DRAFT: '#9ca3af', EXPIRED: '#f59e0b', WITHDRAWN: '#6b7280',
};
const QUOTE_STATUS_LABELS: Record<string, string> = {
    ACCEPTED: 'Accepted', REJECTED: 'Rejected', SENT: 'Sent',
    VIEWED: 'Viewed', DRAFT: 'Draft', EXPIRED: 'Expired', WITHDRAWN: 'Withdrawn',
};
const SERVICE_CHART_COLORS: Record<string, string> = {
    BIKE: '#22c55e', CAR: '#3b82f6', CHAUFFEUR: '#8b5cf6', LUXURY: '#f59e0b',
    BUS: '#ef4444', TRUCK: '#6366f1', PACKERS: '#ec4899', EQUIPMENT: '#14b8a6', DIRECT: '#9ca3af',
};
const SERVICE_ICONS: Record<string, React.ElementType> = {
    BIKE: Bike, CAR: Car, CHAUFFEUR: Car, LUXURY: Car,
    BUS: Bus, TRUCK: Truck, PACKERS: Package, EQUIPMENT: Package, DIRECT: Package,
};
const SERVICE_BADGE_COLORS: Record<string, string> = {
    BIKE: 'bg-green-100 text-green-700', CAR: 'bg-blue-100 text-blue-700',
    BUS: 'bg-red-100 text-red-700', TRUCK: 'bg-indigo-100 text-indigo-700',
    LUXURY: 'bg-amber-100 text-amber-700', PACKERS: 'bg-pink-100 text-pink-700',
    EQUIPMENT: 'bg-teal-100 text-teal-700',
};
const BOOKING_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_PAYMENT:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'Pending Payment' },
    PAYMENT_SUBMITTED:{ bg: 'bg-orange-50',  text: 'text-orange-700',  label: 'Payment Submitted' },
    PAYMENT_VERIFIED: { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Payment Verified' },
    PENDING_VENDOR:   { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Pending Vendor' },
    BROADCASTED:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  label: 'Broadcasted' },
    ACCEPTED:         { bg: 'bg-green-50',   text: 'text-green-700',   label: 'Accepted' },
    READY_FOR_PICKUP: { bg: 'bg-teal-50',    text: 'text-teal-700',    label: 'Ready for Pickup' },
    IN_PROGRESS:      { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'In Progress' },
    COMPLETED:        { bg: 'bg-gray-100',   text: 'text-gray-700',    label: 'Completed' },
    CANCELLED:        { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Cancelled' },
    EXPIRED:          { bg: 'bg-gray-50',    text: 'text-gray-500',    label: 'Expired' },
    REFUNDED:         { bg: 'bg-pink-50',    text: 'text-pink-700',    label: 'Refunded' },
};
const QUOTE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    ACCEPTED:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Accepted',  icon: CheckCircle },
    REJECTED:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected',  icon: XCircle },
    SENT:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Sent',      icon: FileText },
    VIEWED:    { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Viewed',    icon: Eye },
    DRAFT:     { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Draft',     icon: FileText },
    EXPIRED:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Expired',   icon: AlertCircle },
    WITHDRAWN: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Withdrawn', icon: XCircle },
};

type DateFilter = 'all' | 'today' | 'yesterday' | 'thisMonth' | 'lastMonth';
const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'all', label: 'All Bookings' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function VendorPerformanceDetailPage() {
    const params = useParams();
    const vendorId = params?.vendorId as string;
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'bookings' | 'quotes'>('bookings');

    // ── Bookings state ──
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsRefreshing, setBookingsRefreshing] = useState(false);
    const [vendorName, setVendorName] = useState('');
    const [stats, setStats] = useState<VendorStats | null>(null);
    const [bSearchTerm, setBSearchTerm] = useState('');
    const [bStatusFilter, setBStatusFilter] = useState('all');
    const [bServiceFilter, setBServiceFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [bPage, setBPage] = useState(1);

    // ── Quotes state ──
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [quotesLoaded, setQuotesLoaded] = useState(false);
    const [quotesRefreshing, setQuotesRefreshing] = useState(false);
    const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null);
    const [qSearchTerm, setQSearchTerm] = useState('');
    const [qStatusFilter, setQStatusFilter] = useState('all');
    const [qServiceFilter, setQServiceFilter] = useState('all');
    const [qPage, setQPage] = useState(1);

    const itemsPerPage = 10;

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    // ── Fetch bookings ──
    const fetchBookings = async () => {
        try {
            setBookingsRefreshing(true);
            const res = await fetch(`/api/manager/vendor-performance/${vendorId}/bookings`);
            const data = await res.json();
            if (data.bookings) {
                setBookings(data.bookings);
                setVendorName(data.vendorName || '');
                if (data.stats) setStats(data.stats);
            }
        } catch { /* ignore */ } finally {
            setBookingsLoading(false);
            setBookingsRefreshing(false);
        }
    };

    useEffect(() => { if (vendorId) fetchBookings(); }, [vendorId]);

    // ── Fetch quotes (lazy — only when tab first opened) ──
    const fetchQuotes = async () => {
        try {
            setQuotesRefreshing(true);
            const res = await fetch(`/api/manager/vendor-performance/${vendorId}/quotes`);
            const data = await res.json();
            if (data.quotes) {
                setQuotes(data.quotes);
                if (!vendorName && data.vendorName) setVendorName(data.vendorName);
                if (data.stats) setQuoteStats(data.stats);
            }
        } catch { /* ignore */ } finally {
            setQuotesLoading(false);
            setQuotesLoaded(true);
            setQuotesRefreshing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'quotes' && !quotesLoaded && !quotesLoading) {
            setQuotesLoading(true);
            fetchQuotes();
        }
    }, [activeTab]);

    // ── Booking filters ──
    const filterByDate = (b: Booking, f: DateFilter): boolean => {
        if (f === 'all') return true;
        const bd = new Date(b.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (f === 'today') return bd >= today;
        if (f === 'yesterday') return bd >= yesterday && bd < today;
        if (f === 'thisMonth') return bd >= new Date(now.getFullYear(), now.getMonth(), 1);
        if (f === 'lastMonth') {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const e = new Date(now.getFullYear(), now.getMonth(), 1);
            return bd >= s && bd < e;
        }
        return true;
    };

    useEffect(() => {
        let list = bookings;
        if (bServiceFilter !== 'all') list = list.filter(b => b.serviceType === bServiceFilter);
        if (bStatusFilter !== 'all') list = list.filter(b => b.status === bStatusFilter);
        list = list.filter(b => filterByDate(b, dateFilter));
        if (bSearchTerm) {
            const t = bSearchTerm.toLowerCase();
            list = list.filter(b =>
                b.bookingNumber?.toLowerCase().includes(t) ||
                b.customerName?.toLowerCase().includes(t) ||
                b.customerPhone?.includes(t)
            );
        }
        setFilteredBookings(list);
        setBPage(1);
    }, [bSearchTerm, bookings, dateFilter, bStatusFilter, bServiceFilter]);

    // ── Quote filters ──
    const filteredQuotes = useMemo(() => {
        let list = quotes;
        if (qServiceFilter !== 'all') list = list.filter(q => q.serviceType === qServiceFilter);
        if (qStatusFilter !== 'all') list = list.filter(q => q.status === qStatusFilter);
        if (qSearchTerm) {
            const t = qSearchTerm.toLowerCase();
            list = list.filter(q =>
                q.quoteNumber.toLowerCase().includes(t) ||
                q.customerName.toLowerCase().includes(t) ||
                q.customerPhone.includes(t) ||
                q.vehicleName.toLowerCase().includes(t)
            );
        }
        return list;
    }, [quotes, qServiceFilter, qStatusFilter, qSearchTerm]);

    useEffect(() => { setQPage(1); }, [qServiceFilter, qStatusFilter, qSearchTerm]);

    // ── Pagination ──
    const bTotalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const bItems = filteredBookings.slice((bPage - 1) * itemsPerPage, bPage * itemsPerPage);
    const qTotalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
    const qItems = filteredQuotes.slice((qPage - 1) * itemsPerPage, qPage * itemsPerPage);

    const pageNumbers = (current: number, total: number) => {
        const pages: (number | string)[] = [];
        if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
        else {
            pages.push(1);
            if (current > 3) pages.push('...');
            for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
            if (current < total - 2) pages.push('...');
            pages.push(total);
        }
        return pages;
    };

    // ── Chart data ──
    const quoteStatusData = useMemo(() => {
        if (!stats?.quotesByStatus) return [];
        return Object.entries(stats.quotesByStatus)
            .map(([s, c]) => ({ name: QUOTE_STATUS_LABELS[s] || s, value: c, color: QUOTE_STATUS_COLORS[s] || '#9ca3af' }))
            .sort((a, b) => b.value - a.value);
    }, [stats]);

    const serviceDistData = useMemo(() => {
        if (!bookings.length) return [];
        const counts: Record<string, number> = {};
        bookings.forEach(b => { counts[b.serviceType] = (counts[b.serviceType] || 0) + 1; });
        return Object.entries(counts)
            .map(([s, c]) => ({ name: s, value: c, color: SERVICE_CHART_COLORS[s] || '#9ca3af' }))
            .sort((a, b) => b.value - a.value);
    }, [bookings]);

    const monthlyData = useMemo(() => {
        if (!bookings.length) return [];
        const months: Record<string, { bookings: number; earnings: number }> = {};
        bookings.forEach(b => {
            const d = new Date(b.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!months[key]) months[key] = { bookings: 0, earnings: 0 };
            months[key].bookings += 1;
            if (b.status === 'COMPLETED') months[key].earnings += Number(b.amount) || 0;
        });
        return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
            .map(([key, data]) => {
                const [y, m] = key.split('-');
                const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                return { month: monthName, ...data };
            });
    }, [bookings]);

    // ── Loading state ──
    if (bookingsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading vendor data...</p>
                </div>
            </div>
        );
    }

    const PaginationControls = ({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) =>
        total <= 1 ? null : (
            <div className="flex justify-center items-center gap-2 pb-8">
                <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                {pageNumbers(current, total).map((page, i) => (
                    <React.Fragment key={i}>
                        {page === '...' ? <span className="px-3 py-2 text-gray-400">...</span> : (
                            <button onClick={() => onChange(page as number)}
                                className={`px-4 py-2 rounded-lg font-medium transition ${current === page ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
                <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendorName || 'Vendor'} Performance</h1>
                        <p className="text-gray-500 mt-1">Vendor ID: {vendorId}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (activeTab === 'bookings') { setBookingsRefreshing(true); fetchBookings(); }
                        else { setQuotesRefreshing(true); fetchQuotes(); }
                    }}
                    disabled={bookingsRefreshing || quotesRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${(bookingsRefreshing || quotesRefreshing) ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1 w-fit">
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'bookings' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <FileText className="w-4 h-4" />
                    Bookings
                    {stats && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'bookings' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{stats.totalBookings}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('quotes')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'quotes' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <ClipboardList className="w-4 h-4" />
                    Quotation History
                    {stats && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'quotes' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{stats.totalQuotes}</span>}
                </button>
            </div>

            {/* ═══════════════════════ BOOKINGS TAB ═══════════════════════ */}
            {activeTab === 'bookings' && (
                <>
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Accepted Quotes</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.acceptedQuotes}</p>
                                <p className="text-xs text-gray-400 mt-1">out of {stats.totalQuotes} total quotes</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Rejected Quotes</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.rejectedQuotes}</p>
                                <p className="text-xs text-gray-400 mt-1">out of {stats.totalQuotes} total quotes</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Accepted Bookings</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.acceptedBookings}</p>
                                <p className="text-xs text-gray-400 mt-1">{stats.cancelledBookings} cancelled</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <CircleDollarSign className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                                <p className="text-xs text-gray-400 mt-1">from completed bookings</p>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    {bookings.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {quoteStatusData.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Status Distribution</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={quoteStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                                                {quoteStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip /><Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            {serviceDistData.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Service Type</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={serviceDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                                                {serviceDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip /><Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            {monthlyData.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Bookings</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="bookings" name="Bookings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            {monthlyData.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(v: any) => formatCurrency(v)} />
                                            <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            {DATE_FILTERS.map(f => (
                                <button key={f.value} onClick={() => setDateFilter(f.value)}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${dateFilter === f.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search / Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" value={bSearchTerm} onChange={e => setBSearchTerm(e.target.value)}
                                    placeholder="Search by booking #, customer..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                            </div>
                            <div className="relative">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select value={bServiceFilter} onChange={e => setBServiceFilter(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[180px]">
                                    <option value="all">All Services</option>
                                    {Object.keys(SERVICE_ICONS).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select value={bStatusFilter} onChange={e => setBStatusFilter(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[180px]">
                                    <option value="all">All Statuses</option>
                                    {Object.keys(BOOKING_STATUS_CONFIG).map(s => <option key={s} value={s}>{BOOKING_STATUS_CONFIG[s].label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <p>Showing {filteredBookings.length > 0 ? (bPage - 1) * itemsPerPage + 1 : 0}–{Math.min(bPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings</p>
                        {bTotalPages > 1 && <p>Page {bPage} of {bTotalPages}</p>}
                    </div>

                    {/* Bookings List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {bItems.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bike className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                                <p className="text-gray-500">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {bItems.map(booking => {
                                    const sc = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;
                                    const SIcon = SERVICE_ICONS[booking.serviceType] || Bike;
                                    return (
                                        <Link key={booking.id} href={`/manager/bookings/${booking.id}`}
                                            className="block p-4 sm:p-5 hover:bg-gray-50 transition">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <SIcon className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="font-semibold text-gray-900">#{booking.bookingNumber}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-gray-400" /><span className="truncate">{booking.customerName}</span></div>
                                                        <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" /><span>{booking.customerPhone}</span></div>
                                                        <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /><span className="truncate">{booking.details.location || booking.details.from || 'N/A'}</span></div>
                                                        <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" /><span>{formatDate(booking.date)}</span></div>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 uppercase">{booking.serviceType}</span>
                                                        {Object.entries(booking.details).slice(0, 2).map(([k, v]) => (
                                                            <span key={k} className="text-xs text-gray-400 capitalize">{k}: <span className="text-gray-600">{String(v)}</span></span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-green-600 font-bold">
                                                            <IndianRupee className="w-4 h-4" />
                                                            {formatCurrency(booking.amount).replace('₹', '')}
                                                        </div>
                                                        <p className="text-xs text-gray-400">{formatDate(booking.createdAt)}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <PaginationControls current={bPage} total={bTotalPages} onChange={setBPage} />
                </>
            )}

            {/* ═══════════════════════ QUOTES TAB ═══════════════════════ */}
            {activeTab === 'quotes' && (
                <>
                    {quotesLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading quotation history...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Quote Stats */}
                            {quoteStats && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {[
                                        { label: 'Total Quotes', value: quoteStats.total,    color: 'bg-gray-100 text-gray-700' },
                                        { label: 'Sent / Viewed', value: quoteStats.sent,    color: 'bg-blue-100 text-blue-700' },
                                        { label: 'Accepted',      value: quoteStats.accepted, color: 'bg-green-100 text-green-700' },
                                        { label: 'Rejected',      value: quoteStats.rejected, color: 'bg-red-100 text-red-700' },
                                        { label: 'Expired',       value: quoteStats.expired,  color: 'bg-amber-100 text-amber-700' },
                                        { label: 'Draft',         value: quoteStats.draft,    color: 'bg-gray-100 text-gray-500' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
                                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quote Filters */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="text" value={qSearchTerm} onChange={e => setQSearchTerm(e.target.value)}
                                            placeholder="Search by quote #, customer, vehicle..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                    </div>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select value={qServiceFilter} onChange={e => setQServiceFilter(e.target.value)}
                                            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[160px]">
                                            <option value="all">All Services</option>
                                            {['BIKE', 'CAR', 'BUS', 'TRUCK', 'LUXURY', 'PACKERS', 'EQUIPMENT'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select value={qStatusFilter} onChange={e => setQStatusFilter(e.target.value)}
                                            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[160px]">
                                            <option value="all">All Statuses</option>
                                            {Object.entries(QUOTE_STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500">
                                Showing {filteredQuotes.length > 0 ? (qPage - 1) * itemsPerPage + 1 : 0}–{Math.min(qPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length} quotes
                            </div>

                            {/* Quotes List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {qItems.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes found</h3>
                                        <p className="text-gray-500">Try adjusting your filters.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {qItems.map(quote => {
                                            const qsc = QUOTE_STATUS_CONFIG[quote.status] || QUOTE_STATUS_CONFIG.DRAFT;
                                            const QStatusIcon = qsc.icon;
                                            const QSvcIcon = SERVICE_ICONS[quote.serviceType] || FileText;
                                            return (
                                                <Link
                                                    key={quote.id}
                                                    href={`/manager/vendor-performance/${vendorId}/quotes/${quote.id}?type=${quote.serviceType}`}
                                                    className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <QSvcIcon className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className="font-semibold text-gray-900 text-sm">#{quote.quoteNumber}</span>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${qsc.bg} ${qsc.text}`}>
                                                                    <QStatusIcon className="w-3 h-3" />{qsc.label}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SERVICE_BADGE_COLORS[quote.serviceType] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {quote.serviceType}
                                                                </span>
                                                                {quote.viewCount > 0 && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                        <Eye className="w-3 h-3" /> {quote.viewCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-sm">
                                                                <div className="flex items-center gap-1.5 text-gray-600"><User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate font-medium">{quote.customerName}</span></div>
                                                                <div className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{quote.customerPhone}</span></div>
                                                                <div className="flex items-center gap-1.5 text-gray-600"><Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{quote.vehicleName}</span></div>
                                                                {quote.location && <div className="flex items-center gap-1.5 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{quote.location}</span></div>}
                                                                <div className="flex items-center gap-1.5 text-gray-600"><Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>Sent: {quote.sentAt ? formatDate(quote.sentAt) : formatDate(quote.createdAt)}</span></div>
                                                                <div className="flex items-center gap-1.5 text-gray-600"><Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>Valid till: {formatDate(quote.validTill)}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-0.5 text-green-600 font-bold text-sm">
                                                                    <IndianRupee className="w-3.5 h-3.5" />
                                                                    {formatCurrency(quote.totalAmount).replace('₹', '')}
                                                                </div>
                                                                <p className="text-xs text-gray-400">Advance: {formatCurrency(quote.advanceAmount).replace('₹', '')}</p>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <PaginationControls current={qPage} total={qTotalPages} onChange={setQPage} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
