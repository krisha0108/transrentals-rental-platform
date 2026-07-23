'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText, Briefcase, MapPin, TrendingUp, Clock, CheckCircle, AlertCircle,
  Users, Loader2, RefreshCw, MessageSquare, Plus, Calendar,
} from 'lucide-react';

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
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [attention, setAttention] = useState<AttentionStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
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
      const res = await fetch('/api/manager/dashboard');
      const data = await res.json();
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {managerInfo?.name || session?.user?.name}!</h1>
            <p className="text-green-100">Manager Dashboard - TransRentals CMS</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {filter === 'custom' && (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 border border-white/30">
                <Calendar className="w-4 h-4" />
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-white/70 focus:outline-none [color-scheme:dark]"
                />
                <span className="text-white/70">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none [color-scheme:dark]"
                />
                <button
                  onClick={applyCustomRange}
                  disabled={!customFrom || !customTo}
                  className="text-xs font-semibold px-2 py-1 bg-white/30 hover:bg-white/40 rounded disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            )}
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value as DatePreset)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((preset) => (
                <option key={preset} value={preset} className="text-gray-900">
                  {DATE_PRESET_LABELS[preset]}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
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
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {DATE_PRESET_LABELS[filter]}
          </span>
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
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
            {DATE_PRESET_LABELS[filter]}
          </span>
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
