'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import FilterMultiSelect from '@/components/manager/FilterMultiSelect';
import Pagination from '@/components/manager/Pagination';
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
  IndianRupee,
  Globe,
  Smartphone,
  PhoneCall,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Copy,
  X,
  Ban,
  PhoneOff,
  UserX,
  XOctagon,
  CalendarX,
  MapPinOff,
  ExternalLink,
  FileX,
  Hourglass,
  CreditCard,
  Flag,
  XCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

// Same 22 quick actions as the inquiry detail page's "Manager Actions" panel —
// available here as a bulk operation across selected rows.
const QUICK_ACTIONS = [
  { key: 'CALLED',                       label: 'Mark as Called',              icon: Phone,        classes: 'border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100' },
  { key: 'CUSTOMER_CONNECTED',           label: 'Customer Connected',          icon: Check,        classes: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' },
  { key: 'NO_VENDOR_AVAILABLE',          label: 'No Vendor Available',         icon: Ban,          classes: 'border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100' },
  { key: 'VENDOR_DECLINED',              label: 'Vendor Declined',             icon: XOctagon,     classes: 'border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100' },
  { key: 'VENDOR_CANT_FULFILL',          label: "Vendor Available – Can't Fulfill", icon: CalendarX, classes: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100' },
  { key: 'FOLLOW_UP',                    label: 'Follow-Up Required',          icon: PhoneCall,    classes: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { key: 'CONVERTED',                    label: 'Converted',                   icon: ThumbsUp,     classes: 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' },
  { key: 'NOT_INTERESTED',               label: 'Not Interested',              icon: ThumbsDown,   classes: 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100' },
  { key: 'VENDOR_NOT_RESPONDING',        label: 'Vendor Not Responding',       icon: PhoneOff,     classes: 'border-stone-200 text-stone-700 bg-stone-50 hover:bg-stone-100' },
  { key: 'WRONG_NUMBER',                 label: 'Wrong Number',                icon: AlertTriangle, classes: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' },
  { key: 'PRICE_TOO_HIGH',               label: 'Price Too High',              icon: IndianRupee,  classes: 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100' },
  { key: 'NOT_SERVICEABLE',              label: 'Not Serviceable',             icon: MapPinOff,    classes: 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100' },
  { key: 'AWAITING_VENDOR_QUOTE',        label: 'Awaiting Vendor Quote',       icon: Clock,        classes: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' },
  { key: 'QUOTE_NOT_SUBMITTED',          label: 'Quote Not Submitted',         icon: FileX,        classes: 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' },
  { key: 'CUSTOMER_NOT_RESPONDING',      label: 'Customer Not Responding',     icon: UserX,        classes: 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100' },
  { key: 'CUSTOMER_BOOKED_ELSEWHERE',    label: 'Customer Booked Elsewhere',   icon: ExternalLink, classes: 'border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100' },
  { key: 'WAITING_CUSTOMER_CONFIRMATION', label: 'Waiting for Customer Confirmation', icon: Hourglass, classes: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
  { key: 'ADVANCE_PAYMENT_PENDING',      label: 'Advance Payment Pending',     icon: CreditCard,   classes: 'border-lime-200 text-lime-700 bg-lime-50 hover:bg-lime-100' },
  { key: 'INVALID_LEAD',                 label: 'Invalid/Fake Lead',           icon: Flag,         classes: 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100' },
  { key: 'CANCELLED',                    label: 'Cancelled',                   icon: XCircle,      classes: 'border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100' },
  { key: 'DUPLICATE_INQUIRY',            label: 'Duplicate Inquiry',           icon: Copy,         classes: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' },
  { key: 'OTHER_REASON',                 label: 'Other Reason',                icon: HelpCircle,   classes: 'border-neutral-200 text-neutral-700 bg-neutral-50 hover:bg-neutral-100' },
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
  CUSTOMER_CONNECTED: 'Customer Connected',
  NO_VENDOR_AVAILABLE: 'No Vendor Available',
  VENDOR_DECLINED: 'Vendor Declined',
  VENDOR_CANT_FULFILL: "Vendor Available – Can't Fulfill",
  FOLLOW_UP: 'Follow-Up Required',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Not Interested',
  VENDOR_NOT_RESPONDING: 'Vendor Not Responding',
  WRONG_NUMBER: 'Wrong Number',
  PRICE_TOO_HIGH: 'Price Too High',
  NOT_SERVICEABLE: 'Not Serviceable',
  AWAITING_VENDOR_QUOTE: 'Awaiting Vendor Quote',
  QUOTE_NOT_SUBMITTED: 'Quote Not Submitted',
  CUSTOMER_NOT_RESPONDING: 'Customer Not Responding',
  CUSTOMER_BOOKED_ELSEWHERE: 'Customer Booked Elsewhere',
  WAITING_CUSTOMER_CONFIRMATION: 'Waiting for Customer Confirmation',
  ADVANCE_PAYMENT_PENDING: 'Advance Payment Pending',
  INVALID_LEAD: 'Invalid/Fake Lead',
  CANCELLED: 'Cancelled',
  DUPLICATE_INQUIRY: 'Duplicate Inquiry',
  OTHER_REASON: 'Other Reason',
  // Deprecated values (kept so historical rows still render a label)
  CONNECTED: 'Connected',
  RESPONDED: 'Responded',
  NO_RESPONSE: 'No Response',
  HOT_LEAD: 'Hot Lead',
  COLD_LEAD: 'Cold Lead',
};
const ACTION_BADGE_STYLES: Record<string, string> = {
  CALLED: 'bg-sky-100 text-sky-700',
  CUSTOMER_CONNECTED: 'bg-blue-100 text-blue-700',
  NO_VENDOR_AVAILABLE: 'bg-cyan-100 text-cyan-700',
  VENDOR_DECLINED: 'bg-pink-100 text-pink-700',
  VENDOR_CANT_FULFILL: 'bg-teal-100 text-teal-700',
  FOLLOW_UP: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
  NOT_INTERESTED: 'bg-gray-100 text-gray-600',
  VENDOR_NOT_RESPONDING: 'bg-stone-100 text-stone-700',
  WRONG_NUMBER: 'bg-rose-100 text-rose-700',
  PRICE_TOO_HIGH: 'bg-orange-100 text-orange-700',
  NOT_SERVICEABLE: 'bg-violet-100 text-violet-700',
  AWAITING_VENDOR_QUOTE: 'bg-red-100 text-red-700',
  QUOTE_NOT_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  CUSTOMER_NOT_RESPONDING: 'bg-indigo-100 text-indigo-700',
  CUSTOMER_BOOKED_ELSEWHERE: 'bg-fuchsia-100 text-fuchsia-700',
  WAITING_CUSTOMER_CONFIRMATION: 'bg-emerald-100 text-emerald-700',
  ADVANCE_PAYMENT_PENDING: 'bg-lime-100 text-lime-700',
  INVALID_LEAD: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-zinc-100 text-zinc-700',
  DUPLICATE_INQUIRY: 'bg-purple-100 text-purple-700',
  OTHER_REASON: 'bg-neutral-100 text-neutral-700',
  // Deprecated values (kept so historical rows still render a color)
  CONNECTED: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-cyan-100 text-cyan-700',
  NO_RESPONSE: 'bg-stone-100 text-stone-700',
  HOT_LEAD: 'bg-red-100 text-red-700',
  COLD_LEAD: 'bg-indigo-100 text-indigo-700',
};

// Keyed by the quote_requests tables' actual status enum values (PENDING,
// QUOTES_RECEIVED, QUOTE_ACCEPTED, BOOKING_CONFIRMED, CANCELLED, EXPIRED) —
// the old QUOTED/ACCEPTED/REJECTED keys here never matched a real row, so
// every non-pending inquiry silently fell back to a "Pending" badge.
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; description: string }> = {
  PENDING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    label: 'Pending',
    description: 'Waiting for vendor quotes',
  },
  QUOTES_RECEIVED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    label: 'Quoted',
    description: 'Vendors have submitted quotes',
  },
  QUOTE_ACCEPTED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    label: 'Accepted',
    description: 'Customer accepted a quote',
  },
  BOOKING_CONFIRMED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Booking Confirmed',
    description: 'Booking has been confirmed',
  },
  CANCELLED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    label: 'Cancelled',
    description: 'Request was cancelled',
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

function ManagerInquiriesPageInner() {
  const router = useRouter();
  // useSearchParams() is typed as nullable; fall back to an empty set so every
  // read below is total.
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams ?? new URLSearchParams();
  // `inquiries` now holds only the current page's rows — filtering, stats,
  // and pagination all happen server-side (see fetchInquiries below) instead
  // of fetching every inquiry and slicing in the browser.
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Filters read from the URL rather than local state, so applying a filter,
  // opening an inquiry, then hitting Back restores exactly what was selected
  // instead of resetting everything. Same approach as /manager/vendors.
  const csv = (name: string): string[] => {
    const raw = (searchParams.get(name) || '').trim();
    return !raw || raw === 'all' ? [] : raw.split(',').map((v) => v.trim()).filter(Boolean);
  };

  const searchTerm = searchParams.get('search') || '';
  const statusFilters = csv('status');
  const serviceFilters = csv('service');
  const locationFilters = csv('location');
  const sourceFilter = searchParams.get('source') || 'all';
  const dateFilter = (searchParams.get('date') || 'all') as DateFilter;
  const actionedFilter = (searchParams.get('actioned') || 'all') as 'all' | 'actioned' | 'notActioned';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local echo of the search box so typing stays instant; committed to the URL
  // on a debounce rather than on every keystroke.
  const [searchInput, setSearchInput] = useState(searchTerm);
  useEffect(() => { setSearchInput(searchTerm); }, [searchTerm]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, quotesReceived: 0, quoteAccepted: 0, cancelled: 0 });

  const itemsPerPage = 20;

  // Writes filter changes into the URL, merged with what is already there, and
  // resets pagination — passing '' removes a param instead of writing a default.
  const updateFilter = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/manager/inquiries?${qs}` : '/manager/inquiries', { scroll: false });
  }, [searchParams, router]);

  // Drives the Clear all button — every filter this page puts in the URL.
  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (actionedFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    serviceFilters.length + statusFilters.length + locationFilters.length;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    router.push('/manager/inquiries', { scroll: false });
  }, [router]);

  const setCurrentPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/manager/inquiries?${qs}` : '/manager/inquiries', { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (searchInput === searchTerm) return;
    const t = setTimeout(() => updateFilter({ search: searchInput }), 400);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, updateFilter]);

  const fetchInquiries = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (serviceFilters.length) params.set('service', serviceFilters.join(','));
      if (statusFilters.length) params.set('status', statusFilters.join(','));
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (locationFilters.length) params.set('location', locationFilters.join(','));
      if (dateFilter !== 'all') params.set('date', dateFilter);
      if (actionedFilter !== 'all') params.set('actioned', actionedFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));

      const response = await fetch(`/api/manager/inquiries?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setInquiries(data.inquiries || []);
        setServices(data.services || []);
        setLocationOptions(data.locations || []);
        setStats(data.stats || { total: 0, pending: 0, quotesReceived: 0, quoteAccepted: 0, cancelled: 0 });
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
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
      const allSelected = inquiries.length > 0 && inquiries.every((i) => prev.has(i.id));
      if (allSelected) {
        const next = new Set(prev);
        inquiries.forEach((i) => next.delete(i.id));
        return next;
      }
      const next = new Set(prev);
      inquiries.forEach((i) => next.add(i.id));
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

  // Re-fetch whenever any URL filter param (including page) changes, since
  // they're all read from searchParams above.
  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Clear selection whenever the page or its results change, so bulk
  // actions never silently apply to rows that are no longer visible.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, inquiries]);

  const uniqueLocations = locationOptions;
  const currentInquiries = inquiries;

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInquiries();
  };

  useManagerPageHeader(
    'My Inquiries',
    'Pending bookings that need your attention',
    <button
      key="refresh"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { key: 'PENDING', count: stats.pending, label: 'Pending', color: 'yellow' },
          { key: 'QUOTES_RECEIVED', count: stats.quotesReceived, label: 'Quoted', color: 'blue' },
          { key: 'QUOTE_ACCEPTED', count: stats.quoteAccepted, label: 'Accepted', color: 'green' },
          { key: 'CANCELLED', count: stats.cancelled, label: 'Cancelled', color: 'red' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => updateFilter({
              status: statusFilters.length === 1 && statusFilters[0] === stat.key ? '' : stat.key,
            })}
            className={`p-4 rounded-xl border transition text-left ${
              statusFilters.length === 1 && statusFilters[0] === stat.key
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

      {/* Filters — single compact toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search inquiries..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Period */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => updateFilter({ date: e.target.value === 'all' ? '' : e.target.value })}
              className="pl-7 pr-6 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              {DATE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Action Status */}
          <div className="relative">
            <CheckCircle2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={actionedFilter}
              onChange={(e) => updateFilter({ actioned: e.target.value === 'all' ? '' : e.target.value })}
              className="pl-7 pr-6 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Any Action Status</option>
              <option value="actioned">Actioned</option>
              <option value="notActioned">Not Actioned</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Service — multi-select */}
          <FilterMultiSelect
            label="Services"
            allLabel="All Services"
            icon={Bike}
            options={services.map((sv) => ({ value: sv.slug, label: sv.name }))}
            values={serviceFilters}
            onChange={(v) => updateFilter({ service: v.join(',') })}
          />

          {/* Request status — multi-select */}
          <FilterMultiSelect
            label="Requests"
            allLabel={`All Requests (${stats.total})`}
            icon={Filter}
            options={[
              { value: 'PENDING',         label: `Pending (${stats.pending})` },
              { value: 'QUOTES_RECEIVED', label: `Quoted (${stats.quotesReceived})` },
              { value: 'QUOTE_ACCEPTED',  label: `Accepted (${stats.quoteAccepted})` },
              { value: 'CANCELLED',       label: `Cancelled (${stats.cancelled})` },
            ]}
            values={statusFilters}
            onChange={(v) => updateFilter({ status: v.join(',') })}
          />

          {/* Location — searchable multi-select, same styling as /manager/vendors */}
          <FilterMultiSelect
            label="Locations"
            allLabel="All Locations"
            icon={MapPin}
            options={uniqueLocations.map((loc) => ({ value: loc, label: loc }))}
            values={locationFilters}
            onChange={(v) => updateFilter({ location: v.join(',') })}
          />

          {/* Source Filter */}
          <div className="relative">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={sourceFilter}
              onChange={(e) => updateFilter({ source: e.target.value === 'all' ? '' : e.target.value })}
              className="pl-7 pr-6 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Sources</option>
              <option value="web">Web</option>
              <option value="app">App</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear all — only shown once something is actually filtered. */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 hover:text-red-500 transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} inquiries
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
              {searchTerm || statusFilters.length > 0 || dateFilter !== 'all' || actionedFilter !== 'all'
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
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

export default function ManagerInquiriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    }>
      <ManagerInquiriesPageInner />
    </Suspense>
  );
}
