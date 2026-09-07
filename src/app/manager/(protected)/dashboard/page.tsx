'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import {
  FileText, Briefcase, MapPin, TrendingUp, Clock, CheckCircle, AlertCircle,
  Users, Loader2, RefreshCw, MessageSquare, Plus, Calendar,
  Phone, Check, PhoneCall, ThumbsUp, ThumbsDown, AlertTriangle,
  IndianRupee, Copy, X, Ban, PhoneOff, UserX, XOctagon, CalendarX, MapPinOff,
  ExternalLink, FileX, Hourglass, CreditCard, Flag, XCircle, HelpCircle,
  ChevronDown, Search, Store, MapPinPlus, Layers,
} from 'lucide-react';

// Same 22 quick actions as the inquiry detail page's "Manager Actions" panel —
// available here as a bulk operation across selected Recent Inquiries rows.
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

interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  assignedLocations: { id: string; name: string; slug: string; type?: string }[];
  assignedServices: { id: string; name: string; slug: string }[];
}

interface DashboardStats {
  totalBookings: number;
  totalQuotes: number;
  totalServices: number;
  totalLocations: number;
  totalVendors: number;
  activeVendors: number;
  bookingsByService: { [key: string]: number };
  quotesByService: { [key: string]: number };
}

interface AttentionStats {
  pendingPayment: number;
  pendingApproval: number;
  activeTrips: number;
  completedToday: number;
}

interface RecentBooking {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string | null;
  serviceName: string;
  locationName: string | null;
  totalAmount: number | null;
  createdAt: string;
}

interface RecentInquiry {
  id: string;
  requestNumber: string;
  status: string;
  customerName: string | null;
  serviceName: string;
  locationName: string | null;
  quotesCount: number;
  actionsCount: number;
  lastActionType: string | null;
  createdAt: string;
}

interface VendorRequestNotification {
  id: string;
  type: 'NEW_LOCATION_REQUEST' | 'NEW_SERVICE_REQUEST';
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// Same badge styling as the 12 Manager Actions buttons — used to color the
// "last action" pill in Recent Inquiries instead of a plain Actioned/Not badge.
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
  // Deprecated values (kept so historical rows still render with a color)
  CONNECTED: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-cyan-100 text-cyan-700',
  NO_RESPONSE: 'bg-stone-100 text-stone-700',
  HOT_LEAD: 'bg-red-100 text-red-700',
  COLD_LEAD: 'bg-indigo-100 text-indigo-700',
};

const actionTypeLabel = (type: string) =>
  QUICK_ACTIONS.find((a) => a.key === type)?.label || type.replace(/_/g, ' ');

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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_PAYMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Payment' },
  PAYMENT_SUBMITTED: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Payment Submitted' },
  PAYMENT_VERIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Payment Verified' },
  BROADCASTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Broadcasted' },
  ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  IN_PROGRESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'In Progress' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
};

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [attention, setAttention] = useState<AttentionStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [vendorRequests, setVendorRequests] = useState<VendorRequestNotification[]>([]);
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [bulkActionMenuOpen, setBulkActionMenuOpen] = useState(false);
  const [bulkActionSearch, setBulkActionSearch] = useState('');
  const bulkActionMenuRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Info that doesn't depend on the date filter — assigned locations/services,
  // recent bookings, and "needs attention" counts. Fetched once (+ on refresh).
  const fetchDashboardInfo = useCallback(async () => {
    try {
      const [dashRes, inquiriesRes, notificationsRes] = await Promise.all([
        fetch('/api/manager/dashboard'),
        fetch('/api/manager/inquiries'),
        fetch('/api/manager/notifications?filter=unread&limit=5'),
      ]);
      const data = await dashRes.json();
      if (data.success) {
        setManagerInfo(data.manager);
        setAttention({
          pendingPayment: data.stats?.pendingPayment || 0,
          pendingApproval: data.stats?.pendingApproval || 0,
          activeTrips: data.stats?.activeTrips || 0,
          completedToday: data.stats?.completedToday || 0,
        });
        setRecentBookings((data.bookings || []).slice(0, 8));
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }

      const inquiriesData = await inquiriesRes.json();
      if (inquiriesData.success) {
        setRecentInquiries((inquiriesData.inquiries || []).slice(0, 8));
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        // This panel is titled "New Vendor Requests" — other notification
        // types (contact inquiries, travel agent registrations, ...) share
        // the same inbox/badge but get their own surfacing elsewhere, so
        // allowlist just the two vendor-request types instead of trying to
        // keep excluding every new type as it's added.
        setVendorRequests(
          (notificationsData.items || []).filter((n: { type: string }) =>
            n.type === 'NEW_LOCATION_REQUEST' || n.type === 'NEW_SERVICE_REQUEST'
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to fetch manager info:', err);
      setError(err.message || 'Failed to load dashboard');
    }
  }, []);

  // Date-filtered totals — refetched whenever the filter (or custom range) changes.
  const fetchStats = useCallback(async (preset: DatePreset, from?: string, to?: string) => {
    try {
      setStatsLoading(true);
      let url = `/api/manager/dashboard/stats?filter=${preset}`;
      if (preset === 'custom' && from && to) {
        url += `&dateFrom=${from}&dateTo=${to}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDashboardInfo(), fetchStats('today')]);
      setLoading(false);
    })();
  }, [fetchDashboardInfo, fetchStats]);

  useEffect(() => {
    if (!bulkActionMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkActionMenuRef.current && !bulkActionMenuRef.current.contains(e.target as Node)) {
        setBulkActionMenuOpen(false);
        setBulkActionSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bulkActionMenuOpen]);

  const handleFilterChange = (newFilter: DatePreset) => {
    setFilter(newFilter);
    if (newFilter !== 'custom') {
      fetchStats(newFilter);
    }
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    fetchStats('custom', customFrom, customTo);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchDashboardInfo(),
      fetchStats(filter, customFrom, customTo),
    ]);
    setIsRefreshing(false);
  };

  useManagerPageHeader(
    'Dashboard',
    `Welcome back, ${managerInfo?.name || session?.user?.name || ''}`,
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const toggleInquirySelection = (id: string) => {
    setSelectedInquiryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllInquiries = () => {
    setSelectedInquiryIds((prev) =>
      prev.size === recentInquiries.length ? new Set() : new Set(recentInquiries.map((i) => i.id))
    );
  };

  const applyBulkAction = async (actionType: string) => {
    if (selectedInquiryIds.size === 0) return;
    setBulkActionMenuOpen(false);
    setBulkActionSearch('');
    setBulkActionLoading(actionType);
    try {
      const results = await Promise.all(
        Array.from(selectedInquiryIds).map((id) =>
          fetch(`/api/manager/inquiries/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType }),
          }).then((res) => res.ok)
        )
      );
      const failed = results.filter((ok) => !ok).length;
      if (failed > 0) alert(`${failed} of ${results.length} inquiries failed to update.`);
      setSelectedInquiryIds(new Set());
      await fetchDashboardInfo();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setBulkActionLoading(null);
    }
  };

  const openVendorRequest = async (n: VendorRequestNotification) => {
    setVendorRequests((prev) => prev.filter((r) => r.id !== n.id));
    try {
      await fetch('/api/manager/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', ids: [n.id] }),
      });
    } catch {
      // best-effort
    } finally {
      window.dispatchEvent(new Event('manager-notifications-updated'));
    }
    if (n.link) router.push(n.link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 flex-wrap">
          {(Object.keys(DATE_PRESET_LABELS) as DatePreset[])
            .filter((preset) => preset !== 'custom')
            .map((preset) => (
              <button
                key={preset}
                onClick={() => handleFilterChange(preset)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                  filter === preset
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {DATE_PRESET_LABELS[preset]}
              </button>
            ))}
          <button
            onClick={() => handleFilterChange('custom')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              filter === 'custom'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {filter === 'custom' && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-sm text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent text-sm text-slate-700 focus:outline-none"
            />
            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className="text-xs font-semibold px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/manager/bookings" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {statsLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (stats?.totalBookings?.toLocaleString() || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
          </div>
        </Link>

        <Link href="/manager/inquiries" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {statsLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (stats?.totalQuotes?.toLocaleString() || 0)}
              </p>
              <p className="text-sm text-gray-500">Quote Requests</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalServices || 0}</p>
              <p className="text-sm text-gray-500">Your Services</p>
            </div>
          </div>
        </div>

        <Link href="/manager/locations" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalLocations || 0}</p>
              <p className="text-sm text-gray-500">Your Locations</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Needs Your Attention */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Needs Your Attention
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/manager/bookings" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
            <div className="flex items-center gap-2 text-yellow-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Pending Payment</span>
            </div>
            <p className="text-2xl font-bold text-yellow-800">{attention?.pendingPayment || 0}</p>
          </Link>
          <Link href="/manager/bookings" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Pending Approval</span>
            </div>
            <p className="text-2xl font-bold text-orange-800">{attention?.pendingApproval || 0}</p>
          </Link>
          <Link href="/manager/bookings" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Active Trips</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">{attention?.activeTrips || 0}</p>
          </Link>
          <Link href="/manager/bookings" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Completed Today</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{attention?.completedToday || 0}</p>
          </Link>
        </div>
      </div>

      {/* New Vendor Requests */}
      {vendorRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-500" />
              New Vendor Requests
            </h2>
            <Link href="/manager/vendors" className="text-sm font-medium text-green-600 hover:text-green-700">
              View Vendors →
            </Link>
          </div>
          <div className="divide-y">
            {vendorRequests.map((n) => {
              const Icon = n.type === 'NEW_LOCATION_REQUEST' ? MapPinPlus : Layers;
              return (
                <button
                  key={n.id}
                  onClick={() => openVendorRequest(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-orange-50/60 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-500 truncate">{n.body}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Inquiries */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-yellow-500" />
            Recent Inquiries
          </h2>
          <Link href="/manager/inquiries" className="text-sm font-medium text-green-600 hover:text-green-700">
            View All →
          </Link>
        </div>

        {/* Bulk action bar — appears once 1+ inquiries are selected */}
        {selectedInquiryIds.size > 0 && (
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
            <span className="text-xs font-semibold text-orange-800 shrink-0">
              {selectedInquiryIds.size} selected
            </span>
            <div className="relative" ref={bulkActionMenuRef}>
              <button
                onClick={() => {
                  setBulkActionMenuOpen((o) => !o);
                  setBulkActionSearch('');
                }}
                disabled={!!bulkActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-300 bg-white text-orange-800 hover:bg-orange-100 disabled:opacity-50 transition"
              >
                {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Apply Action
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${bulkActionMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {bulkActionMenuOpen && (
                <div className="absolute z-20 top-full mt-1 left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={bulkActionSearch}
                        onChange={(e) => setBulkActionSearch(e.target.value)}
                        placeholder="Search actions..."
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {QUICK_ACTIONS.filter((a) =>
                      a.label.toLowerCase().includes(bulkActionSearch.trim().toLowerCase())
                    ).map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.key}
                          onClick={() => applyBulkAction(a.key)}
                          disabled={!!bulkActionLoading}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition text-left"
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {a.label}
                        </button>
                      );
                    })}
                    {QUICK_ACTIONS.filter((a) =>
                      a.label.toLowerCase().includes(bulkActionSearch.trim().toLowerCase())
                    ).length === 0 && (
                      <p className="px-3 py-3 text-sm text-gray-400 text-center">No matching actions</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedInquiryIds(new Set())}
              disabled={!!bulkActionLoading}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 shrink-0"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        )}

        {recentInquiries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent inquiries yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedInquiryIds.size === recentInquiries.length}
                      onChange={toggleSelectAllInquiries}
                      className="w-4 h-4 rounded cursor-pointer accent-orange-600"
                    />
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Service</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Location</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Quotes</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => router.push(`/manager/inquiries/${inq.id}`)}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedInquiryIds.has(inq.id) ? 'bg-orange-50/60' : ''}`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedInquiryIds.has(inq.id)}
                        onChange={() => toggleInquirySelection(inq.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-orange-600"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-900">{inq.customerName || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{inq.serviceName}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{inq.locationName || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-900">{inq.quotesCount}</td>
                    <td className="px-4 py-2.5">
                      {inq.lastActionType ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_BADGE_STYLES[inq.lastActionType] || 'bg-green-100 text-green-700'}`}>
                          {actionTypeLabel(inq.lastActionType)}
                          {inq.actionsCount > 1 && <span className="opacity-70"> +{inq.actionsCount - 1}</span>}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500">
                          Not Actioned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(inq.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            Recent Bookings
          </h2>
          <Link href="/manager/bookings" className="text-sm font-medium text-green-600 hover:text-green-700">
            View All →
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Service</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentBookings.map((b) => {
                  const badge = STATUS_BADGE[b.status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: b.status };
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm text-gray-900">{b.customerName || '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{b.serviceName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">
                        {b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Performance - Bookings */}
      {stats?.bookingsByService && Object.values(stats.bookingsByService).some(v => v > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Bookings by Service <span className="text-sm font-normal text-gray-400">({DATE_PRESET_LABELS[filter]})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.bookingsByService)
              .filter(([_, count]) => count > 0)
              .map(([service, count]) => (
                <div key={service} className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{count.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">{service}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Service Performance - Quotes */}
      {stats?.quotesByService && Object.values(stats.quotesByService).some(v => v > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            Quote Requests by Service <span className="text-sm font-normal text-gray-400">({DATE_PRESET_LABELS[filter]})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.quotesByService)
              .filter(([_, count]) => count > 0)
              .map(([service, count]) => (
                <div key={service} className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">{count.toLocaleString()}</p>
                  <p className="text-sm text-yellow-600">{service}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Vendors Stats */}
      {stats && (stats.totalVendors > 0 || stats.activeVendors > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Vendors in My Locations
            </h2>
            <Link href="/manager/vendors" className="text-sm font-medium text-green-600 hover:text-green-700 shrink-0">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/manager/vendors" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
              <p className="text-2xl font-bold text-indigo-700">{stats.totalVendors}</p>
              <p className="text-sm text-indigo-600">Total Vendors</p>
            </Link>
            <Link href="/manager/vendors" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
              <p className="text-2xl font-bold text-green-700">{stats.activeVendors}</p>
              <p className="text-sm text-green-600">Active Vendors</p>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/manager/inquiries" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <FileText className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Inquiries</span>
          </Link>
          <Link href="/manager/bookings" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Bookings</span>
          </Link>
          <Link href="/manager/vendors" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Vendors</span>
          </Link>
          <Link href="/manager/vendors/create" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Plus className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Create Vendor</span>
          </Link>
          <Link href="/manager/call-reports" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <PhoneCall className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Call Reports</span>
          </Link>
          <Link href="/manager/chats" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Chats</span>
          </Link>
          <Link href="/manager/locations" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Locations</span>
          </Link>
        </div>
      </div>

      {/* Assigned Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Locations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              My Assigned Locations
              {managerInfo?.assignedLocations && managerInfo.assignedLocations.length > 0 && (
                <span className="text-sm font-normal text-gray-400">({managerInfo.assignedLocations.length})</span>
              )}
            </h2>
            <Link href="/manager/locations" className="text-sm font-medium text-green-600 hover:text-green-700 shrink-0">
              Manage →
            </Link>
          </div>
          {managerInfo?.assignedLocations && managerInfo.assignedLocations.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5">
                {managerInfo.assignedLocations.map((loc) => (
                  <span
                    key={loc.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700"
                  >
                    {loc.name}
                    {loc.type === 'UNION_TERRITORY' && <span className="text-[10px] text-gray-400">(UT)</span>}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No locations assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin for location assignment</p>
            </div>
          )}
        </div>

        {/* Assigned Services */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              My Assigned Services
              {managerInfo?.assignedServices && managerInfo.assignedServices.length > 0 && (
                <span className="text-sm font-normal text-gray-400">({managerInfo.assignedServices.length})</span>
              )}
            </h2>
            <Link href="/manager/vendors" className="text-sm font-medium text-green-600 hover:text-green-700 shrink-0">
              Manage →
            </Link>
          </div>
          {managerInfo?.assignedServices && managerInfo.assignedServices.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5">
                {managerInfo.assignedServices.map((svc) => (
                  <span
                    key={svc.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700"
                  >
                    {svc.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No services assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin for service assignment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
