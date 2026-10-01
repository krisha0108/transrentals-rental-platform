'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, RefreshCw, Building2, MapPin, BarChart3, PieChart, Trophy, Store, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend
} from 'recharts';

interface DashboardStats {
  totalBookings: number;
  totalQuotes: number;
  totalServices: number;
  totalLocations: number;
  bookingsByService: Record<string, number>;
  quotesByService: Record<string, number>;
  filter: string;
  availableLocations: string[];
  states: { id: string; name: string }[];
  cities: { name: string; parentId: string | null }[];
  topInquiryState: { name: string; count: number } | null;
  topInquiryCity: { name: string; count: number } | null;
  topVendorState: { name: string; count: number } | null;
  topVendorCity: { name: string; count: number } | null;
  coverageGapEvents: number;
  coverageGapLocations: number;
  topCoverageGap: { locationName: string; serviceType: string; count: number } | null;
  idleVendorPairs: number;
  topIdleLocation: { locationName: string; total: number; serviceCount: number } | null;
}

type FilterType = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const filterLabels: Record<FilterType, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  all: 'All Time',
  custom: 'Custom Date',
};

// Modern gradient colors for charts
const CHART_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Green
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const GRADIENT_COLORS = [
  { start: '#3b82f6', end: '#1d4ed8' }, // Blue gradient
  { start: '#8b5cf6', end: '#6d28d9' }, // Purple gradient
  { start: '#ec4899', end: '#be185d' }, // Pink gradient
  { start: '#f59e0b', end: '#d97706' }, // Amber gradient
  { start: '#10b981', end: '#059669' }, // Green gradient
  { start: '#ef4444', end: '#dc2626' }, // Red gradient
  { start: '#06b6d4', end: '#0891b2' }, // Cyan gradient
  { start: '#f97316', end: '#ea580c' }, // Orange gradient
];

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filter, setFilter] = useState<FilterType>('today');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  useEffect(() => {
    if (filter === 'custom') {
      // Wait for both ends — fetching on the first one would flash a
      // single-day result the admin did not ask for.
      if (customFrom && customTo) fetchStats('custom');
    } else {
      fetchStats(filter);
    }
  }, [filter, customFrom, customTo, locationFilter, stateFilter]);

  const fetchStats = async (selectedFilter: FilterType) => {
    setLoading(true);
    try {
      let url = `/api/admin/dashboard/stats?filter=${selectedFilter}&location=${encodeURIComponent(locationFilter)}&state=${encodeURIComponent(stateFilter)}`;
      if (selectedFilter === 'custom' && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const prettyDate = (ymd: string) =>
    new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const activeLabel =
    filter === 'custom' && customFrom && customTo
      ? customFrom === customTo
        ? prettyDate(customFrom)
        : `${prettyDate(customFrom)} — ${prettyDate(customTo)}`
      : filterLabels[filter];

  // Prepare chart data with colors
  const allBookingsChartData = stats?.bookingsByService
    ? Object.entries(stats.bookingsByService).map(([name, value], index) => ({
        name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : [];

  const allQuotesChartData = stats?.quotesByService
    ? Object.entries(stats.quotesByService).map(([name, value], index) => ({
        name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : [];

  // Apply service filter
  const bookingsChartData = serviceFilter === 'all'
    ? allBookingsChartData
    : allBookingsChartData.filter((d) => d.name === serviceFilter);

  const quotesChartData = serviceFilter === 'all'
    ? allQuotesChartData
    : allQuotesChartData.filter((d) => d.name === serviceFilter);

  const filteredTotalBookings = serviceFilter === 'all'
    ? (stats?.totalBookings ?? 0)
    : (stats?.bookingsByService?.[serviceFilter] ?? 0);

  const filteredTotalQuotes = serviceFilter === 'all'
    ? (stats?.totalQuotes ?? 0)
    : (stats?.quotesByService?.[serviceFilter] ?? 0);

  // All unique service names for the dropdown
  const allServiceNames = [
    ...Object.keys(stats?.bookingsByService ?? {}),
    ...Object.keys(stats?.quotesByService ?? {}),
  ].filter((v, i, a) => a.indexOf(v) === i).sort();

  // City options for the Location dropdown — narrowed to the picked state,
  // or every city when no state is picked.
  const citiesForDropdown = stateFilter === 'all'
    ? (stats?.availableLocations ?? [])
    : Array.from(new Set((stats?.cities ?? []).filter((c) => c.parentId === stateFilter).map((c) => c.name))).sort();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].payload.name || label}</p>
          <p className="text-2xl font-bold" style={{ color: payload[0].fill }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {loading && stats && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 shadow-md border border-blue-100 space-y-3">
        {/* Row 1 — Time Period */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 flex-shrink-0">📅 Time Period:</span>
            {(Object.keys(filterLabels) as FilterType[]).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setFilter(filterKey)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filter === filterKey
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {filterLabels[filterKey]}
              </button>
            ))}
            {filter === 'custom' && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm border border-purple-300 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  To
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCustomTo(e.target.value)}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm border border-purple-300 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
              </div>
            )}
          </div>
          <button
            onClick={() => fetchStats(filter)}
            disabled={loading || (filter === 'custom' && (!customFrom || !customTo))}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-200/50" />

        {/* Row 2 — Service Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800 flex-shrink-0">🔧 Service:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1 scrollbar-hide">
            <button
              onClick={() => setServiceFilter('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                serviceFilter === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}
            >
              All Services
            </button>
            {allServiceNames.map((name) => (
              <button
                key={name}
                onClick={() => setServiceFilter(name)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  serviceFilter === name
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-200/50" />

        {/* Row 3 — State & Location Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-gray-800 flex-shrink-0">📍 State:</span>
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setLocationFilter('all');
            }}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-700 shadow-sm border border-transparent hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All States</option>
            {(stats?.states ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <span className="text-sm font-bold text-gray-800 flex-shrink-0">Location:</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-700 shadow-sm border border-transparent hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Locations</option>
            {citiesForDropdown.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-blue-100 mb-1">
              {serviceFilter === 'all' ? 'Total Bookings' : `${serviceFilter} Bookings`}
            </p>
            <p className="text-4xl font-bold text-white mb-2">{filteredTotalBookings}</p>
            <p className="text-xs text-blue-100">{activeLabel}</p>
          </div>
        </div>

        {/* Total Quote Requests */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-purple-100 mb-1">
              {serviceFilter === 'all' ? 'Quote Requests' : `${serviceFilter} Quotes`}
            </p>
            <p className="text-4xl font-bold text-white mb-2">{filteredTotalQuotes}</p>
            <p className="text-xs text-purple-100">{activeLabel}</p>
          </div>
        </div>

        {/* Total Services */}
        <Link href="/admin/services-management" className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-green-100 mb-1">Active Services</p>
            <p className="text-4xl font-bold text-white mb-2">{stats?.totalServices || 0}</p>
            <p className="text-xs text-green-100">Click to manage →</p>
          </div>
        </Link>

        {/* Total Locations */}
        <Link href="/admin/locations" className="group relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-orange-100 mb-1">Active Locations</p>
            <p className="text-4xl font-bold text-white mb-2">{stats?.totalLocations || 0}</p>
            <p className="text-xs text-orange-100">Click to manage →</p>
          </div>
        </Link>
      </div>

      {/* Highest State / City — inquiries vs active vendor supply, same
          date/location/state filter as everything else above. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Highest Inquiries</p>
              <p className="text-xs text-gray-500">{activeLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-indigo-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500 mb-1">Top State</p>
              <p className="text-lg font-bold text-indigo-900 truncate">{stats?.topInquiryState?.name || '—'}</p>
              <p className="text-xs text-indigo-600 mt-0.5">{stats?.topInquiryState?.count ?? 0} inquiries</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500 mb-1">Top City</p>
              <p className="text-lg font-bold text-indigo-900 truncate">{stats?.topInquiryCity?.name || '—'}</p>
              <p className="text-xs text-indigo-600 mt-0.5">{stats?.topInquiryCity?.count ?? 0} inquiries</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
              <Store className="w-4.5 h-4.5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Highest Vendor Supply</p>
              <p className="text-xs text-gray-500">Approved vendors · {activeLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-teal-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600 mb-1">Top State</p>
              <p className="text-lg font-bold text-teal-900 truncate">{stats?.topVendorState?.name || '—'}</p>
              <p className="text-xs text-teal-700 mt-0.5">{stats?.topVendorState?.count ?? 0} vendors</p>
            </div>
            <div className="rounded-xl bg-teal-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600 mb-1">Top City</p>
              <p className="text-lg font-bold text-teal-900 truncate">{stats?.topVendorCity?.name || '—'}</p>
              <p className="text-xs text-teal-700 mt-0.5">{stats?.topVendorCity?.count ?? 0} vendors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Gaps — demand with no vendor vs. vendor capacity sitting
          idle with no demand. Admin-wide (not scoped to the location/state
          filter above), full drill-down lives on Operations Tracker. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/operations" className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-red-300 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Inquiries With No Vendor</p>
              <p className="text-xs text-gray-500">{activeLabel} · lost business</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold text-red-700">{stats?.coverageGapEvents ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stats?.coverageGapLocations ?? 0} location+service combos affected</p>
            </div>
            {stats?.topCoverageGap && (
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-red-400">Worst spot</p>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{stats.topCoverageGap.locationName}</p>
                <p className="text-xs text-gray-500">{stats.topCoverageGap.serviceType} · {stats.topCoverageGap.count}</p>
              </div>
            )}
          </div>
        </Link>

        <Link href="/admin/operations" className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-amber-300 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Vendors With No Inquiries</p>
              <p className="text-xs text-gray-500">{activeLabel} · idle supply</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold text-amber-700">{stats?.idleVendorPairs ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">location+service combos with zero demand</p>
            </div>
            {stats?.topIdleLocation && (
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Most idle</p>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{stats.topIdleLocation.locationName}</p>
                <p className="text-xs text-gray-500">{stats.topIdleLocation.total} vendors · {stats.topIdleLocation.serviceCount} services</p>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Chart View Toggle */}
      <div className="flex items-center gap-3 justify-end">
        <span className="text-sm font-medium text-gray-600">Chart View:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartView('bar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              chartView === 'bar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Bar Chart
          </button>
          <button
            onClick={() => setChartView('pie')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              chartView === 'pie'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Pie Chart
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bookings by Service</h2>
                <p className="text-sm text-gray-500">Total: <span className="font-bold text-blue-600">{filteredTotalBookings}</span></p>
              </div>
            </div>
          </div>

          {chartView === 'bar' ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={bookingsChartData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                <defs>
                  {GRADIENT_COLORS.map((color, index) => (
                    <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color.start} stopOpacity={1}/>
                      <stop offset="100%" stopColor={color.end} stopOpacity={0.8}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }}
                />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                  {bookingsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradient${index % GRADIENT_COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPieChart>
                <Pie
                  data={bookingsChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quote Requests Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quote Requests by Service</h2>
                <p className="text-sm text-gray-500">Total: <span className="font-bold text-purple-600">{filteredTotalQuotes}</span></p>
              </div>
            </div>
          </div>

          {chartView === 'bar' ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={quotesChartData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                <defs>
                  {GRADIENT_COLORS.map((color, index) => (
                    <linearGradient key={`gradient-q-${index}`} id={`colorGradientQ${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color.start} stopOpacity={1}/>
                      <stop offset="100%" stopColor={color.end} stopOpacity={0.8}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }}
                />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                  {quotesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradientQ${index % GRADIENT_COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPieChart>
                <Pie
                  data={quotesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {quotesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
