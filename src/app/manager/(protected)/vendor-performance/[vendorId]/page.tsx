'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2,
    Search,
    Filter,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    IndianRupee,
    AlertCircle,
    CheckCircle,
    XCircle,
    Bike,
    RefreshCw,
    Car,
    Bus,
    Truck,
    Package,
    Layers,
    ChevronLeft,
    ArrowLeft,
    TrendingUp,
    FileText,
    CircleDollarSign
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

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

const QUOTE_STATUS_COLORS: Record<string, string> = {
    ACCEPTED: '#22c55e',
    REJECTED: '#ef4444',
    SENT: '#3b82f6',
    VIEWED: '#8b5cf6',
    DRAFT: '#9ca3af',
    EXPIRED: '#f59e0b',
    WITHDRAWN: '#6b7280',
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    SENT: 'Sent',
    VIEWED: 'Viewed',
    DRAFT: 'Draft',
    EXPIRED: 'Expired',
    WITHDRAWN: 'Withdrawn',
};

const SERVICE_COLORS: Record<string, string> = {
    BIKE: '#22c55e',
    CAR: '#3b82f6',
    CHAUFFEUR: '#8b5cf6',
    LUXURY: '#f59e0b',
    BUS: '#ef4444',
    TRUCK: '#6366f1',
    PACKERS: '#ec4899',
    EQUIPMENT: '#14b8a6',
    DIRECT: '#9ca3af',
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
    'BIKE': Bike,
    'CAR': Car,
    'CHAUFFEUR': Car,
    'LUXURY': Car,
    'BUS': Bus,
    'TRUCK': Truck,
    'PACKERS': Package,
    'EQUIPMENT': Package,
    'DIRECT': Package,
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_PAYMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Payment' },
    PAYMENT_SUBMITTED: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Payment Submitted' },
    PAYMENT_VERIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Payment Verified' },
    PENDING_VENDOR: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Pending Vendor' },
    BROADCASTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Broadcasted' },
    ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
    READY_FOR_PICKUP: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Ready for Pickup' },
    IN_PROGRESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'In Progress' },
    COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
    EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Expired' },
    REFUNDED: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Refunded' },
};

type DateFilter = 'all' | 'today' | 'yesterday' | 'thisMonth' | 'lastMonth';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'all', label: 'All Bookings' },
];

export default function VendorBookingsDetailPage() {
    const params = useParams();
    const vendorId = params?.vendorId as string;
    const router = useRouter();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [vendorName, setVendorName] = useState<string>('');
    const [stats, setStats] = useState<VendorStats | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchBookings = async () => {
        try {
            setIsRefreshing(true);
            setError(null);
            const response = await fetch(`/api/manager/vendor-performance/${vendorId}/bookings`);
            const data = await response.json();

            if (data.bookings) {
                setBookings(data.bookings);
                setVendorName(data.vendorName || '');
                if (data.stats) setStats(data.stats);
            } else {
                setError(data.error || 'Failed to fetch bookings');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch bookings');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (vendorId) {
            fetchBookings();
        }
    }, [vendorId]);

    const filterByDate = (booking: Booking, filter: DateFilter): boolean => {
        if (filter === 'all') return true;
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        switch (filter) {
            case 'today': return bookingDate >= today;
            case 'yesterday': return bookingDate >= yesterday && bookingDate < today;
            case 'thisMonth':
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return bookingDate >= thisMonthStart;
            case 'lastMonth':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
                return bookingDate >= lastMonthStart && bookingDate < lastMonthEnd;
            default: return true;
        }
    };

    useEffect(() => {
        let filtered = bookings;
        if (serviceFilter !== 'all') filtered = filtered.filter(b => b.serviceType === serviceFilter);
        if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
        filtered = filtered.filter((b) => filterByDate(b, dateFilter));
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.bookingNumber?.toLowerCase().includes(term) ||
                    b.customerName?.toLowerCase().includes(term) ||
                    b.customerPhone?.includes(term)
            );
        }
        setFilteredBookings(filtered);
        setCurrentPage(1);
    }, [searchTerm, bookings, dateFilter, statusFilter, serviceFilter]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBookings = filteredBookings.slice(startIndex, endIndex);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    // Chart data computations
    const quoteStatusData = useMemo(() => {
        if (!stats?.quotesByStatus) return [];
        return Object.entries(stats.quotesByStatus)
            .map(([status, count]) => ({
                name: QUOTE_STATUS_LABELS[status] || status,
                value: count,
                color: QUOTE_STATUS_COLORS[status] || '#9ca3af',
            }))
            .sort((a, b) => b.value - a.value);
    }, [stats]);

    const serviceDistData = useMemo(() => {
        if (!bookings.length) return [];
        const counts: Record<string, number> = {};
        bookings.forEach(b => {
            counts[b.serviceType] = (counts[b.serviceType] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([service, count]) => ({
                name: service,
                value: count,
                color: SERVICE_COLORS[service] || '#9ca3af',
            }))
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
            if (b.status === 'COMPLETED') {
                months[key].earnings += Number(b.amount) || 0;
            }
        });
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12)
            .map(([key, data]) => {
                const [y, m] = key.split('-');
                const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                return { month: monthName, bookings: data.bookings, earnings: data.earnings };
            });
    }, [bookings]);

    const CustomTooltipEarnings = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-green-600">Earnings: {formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading vendor bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Back */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendorName || 'Vendor'} Bookings</h1>
                        <p className="text-gray-500 mt-1">Order history for vendor ID: {vendorId}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsRefreshing(true);
                        fetchBookings();
                    }}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Accepted Quotes */}
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

                    {/* Rejected Quotes */}
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

                    {/* Accepted Bookings */}
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

                    {/* Total Earnings */}
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

            {/* Analytics Charts */}
            {bookings.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quote Status Distribution */}
                    {quoteStatusData.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={quoteStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {quoteStatusData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Service Type Distribution */}
                    {serviceDistData.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Service Type</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={serviceDistData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {serviceDistData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Monthly Bookings Bar Chart */}
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

                    {/* Monthly Earnings Area Chart */}
                    {monthlyData.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltipEarnings />} />
                                    <Area
                                        type="monotone"
                                        dataKey="earnings"
                                        name="Earnings"
                                        stroke="#f59e0b"
                                        fill="#fef3c7"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Date Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    {DATE_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setDateFilter(filter.value)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${dateFilter === filter.value
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by booking #, customer..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[180px]"
                        >
                            <option value="all">All Services</option>
                            {Object.keys(SERVICE_ICONS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[180px]"
                        >
                            <option value="all">All Statuses</option>
                            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>
                    Showing {filteredBookings.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                </p>
                {totalPages > 1 && <p>Page {currentPage} of {totalPages}</p>}
            </div>

            {/* Bookings List - Matching bookings/page.tsx */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {currentBookings.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bike className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                        <p className="text-gray-500">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {currentBookings.map((booking) => {
                            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
                            const ServiceIcon = SERVICE_ICONS[booking.serviceType] || Bike;

                            return (
                                <Link
                                    key={booking.id}
                                    href={`/manager/bookings/${booking.id}`}
                                    className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <ServiceIcon className="w-6 h-6 text-green-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-semibold text-gray-900">#{booking.bookingNumber}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate">{booking.customerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span>{booking.customerPhone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate">{booking.details.location || booking.details.from || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{formatDate(booking.date)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 uppercase">
                                                    {booking.serviceType}
                                                </span>
                                                {Object.entries(booking.details).slice(0, 2).map(([k, v]) => (
                                                    <span key={k} className="text-xs text-gray-400 capitalize">{k}: <span className="text-gray-600">{v}</span></span>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pb-8">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-3 py-2 text-gray-400">...</span>
                            ) : (
                                <button
                                    onClick={() => setCurrentPage(page as number)}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === page ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
