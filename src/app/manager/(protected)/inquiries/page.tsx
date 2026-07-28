'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  FileText,
  RefreshCw,
  Bike,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ChevronLeft,
  Globe,
  Smartphone,
  PhoneCall,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Flame,
  Snowflake,
  Copy,
  X,
} from 'lucide-react';

// Same 12 quick actions as the inquiry detail page's "Manager Actions" panel —
// available here as a bulk operation across selected rows.
const QUICK_ACTIONS = [
  { key: 'CALLED',            label: 'Mark as Called',     icon: Phone,       classes: 'border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100' },
  { key: 'CONNECTED',         label: 'Connected',          icon: Check,       classes: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' },
  { key: 'RESPONDED',         label: 'Responded',          icon: Check,       classes: 'border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100' },
  { key: 'FOLLOW_UP',         label: 'Follow-Up Required', icon: PhoneCall,   classes: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { key: 'CONVERTED',         label: 'Converted',          icon: ThumbsUp,    classes: 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' },
  { key: 'NOT_INTERESTED',    label: 'Not Interested',     icon: ThumbsDown,  classes: 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100' },
  { key: 'NO_RESPONSE',       label: 'No Response',        icon: XCircle,     classes: 'border-stone-200 text-stone-700 bg-stone-50 hover:bg-stone-100' },
  { key: 'WRONG_NUMBER',      label: 'Wrong Number',       icon: AlertTriangle, classes: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' },
  { key: 'PRICE_TOO_HIGH',    label: 'Price Too High',     icon: IndianRupee, classes: 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100' },
  { key: 'HOT_LEAD',          label: 'Hot Lead',           icon: Flame,       classes: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' },
  { key: 'COLD_LEAD',         label: 'Cold Lead',          icon: Snowflake,   classes: 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100' },
  { key: 'DUPLICATE_INQUIRY', label: 'Duplicate Inquiry',  icon: Copy,        classes: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' },
] as const;

interface Inquiry {
  id: string;
  requestNumber: string;
  status: string;
  serviceName: string;
  serviceSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  quotesCount: number;
  callsCount: number;
  actionsCount: number;
  lastActionType: string | null;
  source?: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

// Same labels/colors as the Manager Actions panel on the inquiry detail page —
// shows WHAT the last action was instead of a plain Actioned/Not Actioned badge.
const ACTION_LABELS: Record<string, string> = {
  CALLED: 'Mark as Called',
  CONNECTED: 'Connected',
  RESPONDED: 'Responded',
  FOLLOW_UP: 'Follow-Up Required',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Not Interested',
  NO_RESPONSE: 'No Response',
  WRONG_NUMBER: 'Wrong Number',
  PRICE_TOO_HIGH: 'Price Too High',
  HOT_LEAD: 'Hot Lead',
  COLD_LEAD: 'Cold Lead',
  DUPLICATE_INQUIRY: 'Duplicate Inquiry',
};
const ACTION_BADGE_STYLES: Record<string, string> = {
  CALLED: 'bg-sky-100 text-sky-700',
  CONNECTED: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-cyan-100 text-cyan-700',
  FOLLOW_UP: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
  NOT_INTERESTED: 'bg-gray-100 text-gray-600',
  NO_RESPONSE: 'bg-stone-100 text-stone-700',
  WRONG_NUMBER: 'bg-rose-100 text-rose-700',
  PRICE_TOO_HIGH: 'bg-orange-100 text-orange-700',
  HOT_LEAD: 'bg-red-100 text-red-700',
  COLD_LEAD: 'bg-indigo-100 text-indigo-700',
  DUPLICATE_INQUIRY: 'bg-purple-100 text-purple-700',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; description: string }> = {
  PENDING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    label: 'Pending',
    description: 'Waiting for vendor quotes',
  },
  QUOTED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    label: 'Quoted',
    description: 'Vendors have submitted quotes',
  },
  ACCEPTED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    label: 'Accepted',
    description: 'Customer accepted a quote',
  },
  REJECTED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    label: 'Rejected',
    description: 'Request was rejected',
  },
  EXPIRED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    label: 'Expired',
    description: 'Request has expired',
  },
};

type DateFilter = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'all', label: 'All Bookings' },
];

export default function ManagerInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({ total: 0, pending: 0, quoted: 0, accepted: 0, rejected: 0 });

  const fetchInquiries = async () => {
    try {
      setError(null);
      const url = serviceFilter === 'all'
        ? '/api/manager/inquiries'
        : `/api/manager/inquiries?service=${serviceFilter}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const inquiryBookings = data.inquiries || [];
        setInquiries(inquiryBookings);
        setServices(data.services || []);
      } else {
        setError(data.error || 'Failed to fetch inquiries');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inquiries');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const allSelected = currentInquiries.length > 0 && currentInquiries.every((i) => prev.has(i.id));
      if (allSelected) {
        const next = new Set(prev);
        currentInquiries.forEach((i) => next.delete(i.id));
        return next;
      }
      const next = new Set(prev);
      currentInquiries.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const applyBulkAction = async (actionType: string) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(actionType);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/manager/inquiries/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType }),
          }).then((res) => res.ok)
        )
      );
      const failed = results.filter((ok) => !ok).length;
      if (failed > 0) alert(`${failed} of ${results.length} inquiries failed to update.`);
      setSelectedIds(new Set());
      await fetchInquiries();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setBulkActionLoading(null);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [serviceFilter]);

  // Filter by date
  const filterByDate = (inquiry: Inquiry, filter: DateFilter): boolean => {
    if (filter === 'all') return true;

    const inquiryDate = new Date(inquiry.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
      case 'today':
        return inquiryDate >= today;
      case 'yesterday':
        const tomorrowOfYesterday = new Date(yesterday);
        tomorrowOfYesterday.setDate(tomorrowOfYesterday.getDate() + 1);
        return inquiryDate >= yesterday && inquiryDate < tomorrowOfYesterday;
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return inquiryDate >= thisMonthStart;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return inquiryDate >= lastMonthStart && inquiryDate <= lastMonthEnd;
      default:
        return true;
    }
  };

  useEffect(() => {
    let filtered = inquiries;

    // Apply date filter
    filtered = filtered.filter((i) => filterByDate(i, dateFilter));

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.requestNumber?.toLowerCase().includes(term) ||
          i.customerName?.toLowerCase().includes(term) ||
          i.customerPhone?.includes(term) ||
          i.customerEmail?.toLowerCase().includes(term) ||
          i.locationName?.toLowerCase().includes(term) ||
          i.serviceName?.toLowerCase().includes(term)
      );
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((i) => (i.source || 'web') === sourceFilter);
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter((i) => i.locationName === locationFilter);
    }

    setFilteredInquiries(filtered);
    setCurrentPage(1);
    setStats({
      total:    filtered.length,
      pending:  filtered.filter((i) => i.status === 'PENDING').length,
      quoted:   filtered.filter((i) => i.status === 'QUOTED').length,
      accepted: filtered.filter((i) => i.status === 'ACCEPTED').length,
      rejected: filtered.filter((i) => i.status === 'REJECTED').length,
    });
  }, [searchTerm, statusFilter, sourceFilter, locationFilter, dateFilter, inquiries]);

  // Clear selection whenever the page or filtered results change, so bulk
  // actions never silently apply to rows that are no longer visible.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, filteredInquiries]);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => { if (i.locationName) set.add(i.locationName); });
    return Array.from(set).sort();
  }, [inquiries]);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInquiries = filteredInquiries.slice(startIndex, endIndex);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInquiries();
  };

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Inquiries</h1>
          <p className="text-gray-500 mt-1">Pending bookings that need your attention</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { key: 'PENDING', count: stats.pending, label: 'Pending', color: 'yellow' },
          { key: 'QUOTED', count: stats.quoted, label: 'Quoted', color: 'blue' },
          { key: 'ACCEPTED', count: stats.accepted, label: 'Accepted', color: 'green' },
          { key: 'REJECTED', count: stats.rejected, label: 'Rejected', color: 'red' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key)}
            className={`p-4 rounded-xl border transition text-left ${
              statusFilter === stat.key
                ? `bg-${stat.color}-50 border-${stat.color}-200`
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-4">
          {/* Date Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">📅 Period:</span>
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  dateFilter === filter.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by request #, customer, phone, email, location, service..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Service Filter */}
            <div className="relative">
              <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
              >
                <option value="all">All Services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.slug}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
              >
                <option value="all">All Requests ({stats.total})</option>
                <option value="PENDING">Pending ({stats.pending})</option>
                <option value="QUOTED">Quoted ({stats.quoted})</option>
                <option value="ACCEPTED">Accepted ({stats.accepted})</option>
                <option value="REJECTED">Rejected ({stats.rejected})</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
              >
                <option value="all">All Sources</option>
                <option value="web">Web</option>
                <option value="app">App</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredInquiries.length)} of {filteredInquiries.length} inquiries
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Inquiries List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {currentInquiries.length > 0 && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-wrap bg-gray-50">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={currentInquiries.length > 0 && currentInquiries.every((i) => selectedIds.has(i.id))}
                onChange={toggleSelectAllOnPage}
                className="w-4 h-4 rounded cursor-pointer accent-orange-600"
              />
              Select all on this page
            </label>
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs font-semibold text-orange-800 shrink-0">{selectedIds.size} selected</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.key}
                        onClick={() => applyBulkAction(a.key)}
                        disabled={!!bulkActionLoading}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border disabled:opacity-50 transition ${a.classes}`}
                      >
                        {bulkActionLoading === a.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={!!bulkActionLoading}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 shrink-0"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </>
            )}
          </div>
        )}
        {currentInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'All caught up! No pending inquiries at the moment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentInquiries.map((inquiry) => {
              const statusConfig = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.PENDING;
              const needsAttention = inquiry.status === 'PENDING';

              return (
                <div
                  key={inquiry.id}
                  onClick={() => router.push(`/manager/inquiries/${inquiry.id}`)}
                  className={`p-4 sm:p-5 hover:bg-gray-50 transition cursor-pointer ${
                    needsAttention ? 'bg-yellow-50/50' : ''
                  } ${selectedIds.has(inquiry.id) ? 'bg-orange-50/60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inquiry.id)}
                        onChange={() => toggleSelection(inquiry.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-orange-600"
                      />
                    </div>
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        needsAttention ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    >
                      {needsAttention ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-green-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          #{inquiry.requestNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {inquiry.serviceName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                        {inquiry.source && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            inquiry.source === 'app'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {inquiry.source === 'app'
                              ? <><Smartphone className="w-3 h-3" /> App</>
                              : <><Globe className="w-3 h-3" /> Web</>
                            }
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{getTimeAgo(inquiry.createdAt)}</span>
                      </div>

                      <p className="text-sm text-gray-500 mb-3">{statusConfig.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{inquiry.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{inquiry.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{inquiry.locationName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(inquiry.pickupDate)}</span>
                          {inquiry.pickupTime && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400 ml-2" />
                              <span>{inquiry.pickupTime}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quotes info */}
                      {inquiry.quotesCount > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {inquiry.quotesCount} {inquiry.quotesCount === 1 ? 'quote' : 'quotes'} received
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quotes + Calls + Arrow */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 leading-none">{inquiry.quotesCount}</div>
                          <p className="text-xs text-gray-400">{inquiry.quotesCount === 1 ? 'Quote' : 'Quotes'}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inquiry.callsCount > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Phone className="w-3 h-3" />
                          {inquiry.callsCount} {inquiry.callsCount === 1 ? 'call' : 'calls'}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inquiry.lastActionType
                            ? ACTION_BADGE_STYLES[inquiry.lastActionType] || 'bg-green-100 text-green-700'
                            : 'bg-red-50 text-red-500'
                        }`}>
                          {inquiry.lastActionType ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {inquiry.lastActionType
                            ? `${ACTION_LABELS[inquiry.lastActionType] || inquiry.lastActionType}${inquiry.actionsCount > 1 ? ` +${inquiry.actionsCount - 1}` : ''}`
                            : 'Not Actioned'}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
