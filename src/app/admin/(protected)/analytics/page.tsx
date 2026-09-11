'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  Users, Eye, FileText, Search, FormInput, MessageCircle, MousePointer,
  Zap, Activity, RefreshCw, Loader2, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AnalyticsError } from './_components/AnalyticsError';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// The API returns Web Vitals health as an enum; render it as a short human label so it
// fits inside the narrow stat card instead of overflowing.
const HEALTH_LABELS: Record<string, string> = {
  HEALTHY: 'Healthy',
  NEEDS_IMPROVEMENT: 'Needs Work',
  POOR: 'Poor',
  UNKNOWN: 'No Data',
};

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('7d');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000); // 5 min — matches server cache TTL
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <AnalyticsError subject="the analytics overview" message={error} onRetry={fetchAnalytics} />;
  }

  const deviceData = [
    { name: 'Desktop', value: data.traffic?.deviceBreakdown?.desktop || 0 },
    { name: 'Mobile', value: data.traffic?.deviceBreakdown?.mobile || 0 },
    { name: 'Tablet', value: data.traffic?.deviceBreakdown?.tablet || 0 },
  ].filter(d => d.value > 0);

  const sourceData = [
    { name: 'Direct', value: data.traffic?.trafficSources?.direct || 0 },
    { name: 'Organic', value: data.traffic?.trafficSources?.organic || 0 },
    { name: 'Referral', value: data.traffic?.trafficSources?.referral || 0 },
    { name: 'Social', value: data.traffic?.trafficSources?.social || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-gray-500">Comprehensive insights into your website performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-700">
              {data.realTime?.activeVisitors || 0} active now
            </span>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickStatCard
          title="Total Views"
          value={data.summary?.totalViews || 0}
          change={data.summary?.changes?.totalViews}
          icon={<Eye className="w-5 h-5" />}
          color="blue"
        />
        <QuickStatCard
          title="Visitors"
          value={data.summary?.uniqueVisitors || 0}
          change={data.summary?.changes?.uniqueVisitors}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <QuickStatCard
          title="Forms"
          value={data.forms?.stats?.submitted || 0}
          change={data.summary?.changes?.formsSubmitted}
          icon={<FormInput className="w-5 h-5" />}
          color="purple"
          href="/admin/analytics/forms"
        />
        <QuickStatCard
          title="Chat Bookings"
          value={data.chat?.stats?.bookingsCompleted || 0}
          change={data.summary?.changes?.chatBookings}
          icon={<MessageCircle className="w-5 h-5" />}
          color="amber"
          href="/admin/analytics/chat"
        />
        <QuickStatCard
          title="CTA Clicks"
          value={data.clicks?.stats?.ctaClicks || 0}
          change={data.summary?.changes?.ctaClicks}
          icon={<MousePointer className="w-5 h-5" />}
          color="pink"
        />
        <QuickStatCard
          title="Performance"
          value={HEALTH_LABELS[data.performance?.vitals?.overallHealth] || 'No Data'}
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
          isText
        />
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Traffic Overview</h3>
        </div>
        <div className="h-80" style={{ minHeight: '320px', minWidth: '200px' }}>
          {data.traffic?.chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.traffic.chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                />
                <Legend />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#3B82F6" fill="url(#colorViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#10B981" fill="url(#colorVisitors)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No traffic data available</div>
          )}
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="h-64" style={{ minHeight: '256px', minWidth: '200px' }}>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No device data available</div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="h-64" style={{ minHeight: '256px', minWidth: '200px' }}>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No source data available</div>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="space-y-4">
            <FunnelItem label="Page Views" value={data.summary?.totalViews || 0} percent={100} color="blue" />
            <FunnelItem
              label="Form Views"
              value={data.forms?.stats?.total || 0}
              percent={data.summary?.totalViews ? ((data.forms?.stats?.total || 0) / data.summary.totalViews * 100) : 0}
              color="purple"
            />
            <FunnelItem
              label="Chat Opens"
              value={data.chat?.stats?.totalSessions || 0}
              percent={data.summary?.totalViews ? ((data.chat?.stats?.totalSessions || 0) / data.summary.totalViews * 100) : 0}
              color="amber"
            />
            <FunnelItem
              label="Conversions"
              value={(data.forms?.stats?.submitted || 0) + (data.chat?.stats?.bookingsCompleted || 0)}
              percent={data.summary?.totalViews ? (((data.forms?.stats?.submitted || 0) + (data.chat?.stats?.bookingsCompleted || 0)) / data.summary.totalViews * 100) : 0}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
          </div>
          <div className="space-y-3">
            {(data.traffic?.topPages || []).slice(0, 5).map((page: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium text-gray-600">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">{page.path}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
          </div>
          {data.realTime?.sessions?.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.realTime.sessions.slice(0, 8).map((session: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${session.hasInteracted ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{session.currentPage}</p>
                    <p className="text-xs text-gray-500">{session.device} • {session.browser}</p>
                  </div>
                  <div className="flex gap-1">
                    {session.hasChatted && <MessageCircle className="w-4 h-4 text-amber-500" />}
                    {session.hasSubmittedForm && <FormInput className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No active visitors right now</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <QuickLinkCard href="/admin/analytics/forms" icon={<FormInput className="w-6 h-6" />} title="Forms" description="Submissions & rates" />
        <QuickLinkCard href="/admin/analytics/chat" icon={<MessageCircle className="w-6 h-6" />} title="Chat" description="Shivi analytics" />
      </div>
    </div>
  );
}

function QuickStatCard({ title, value, change, icon, color, href, isText }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  // Some of these metrics no longer have a dashboard of their own. The figure is
  // still real, so the card renders without a link rather than pointing at a 404.
  const Wrapper: any = href ? Link : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`${colorClasses[color]} min-w-0 rounded-xl p-4 border transition${href ? ' hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="shrink-0">{icon}</span>
        {change !== undefined && (
          change === null ? (
            // No comparable previous period (nothing happened then) — say so instead of showing 0%.
            <span className="shrink-0 text-xs text-gray-400" title="No data for the previous period">—</span>
          ) : (
            <div
              className={`flex shrink-0 items-center text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}
              title={`${change > 0 ? '+' : ''}${change}% vs previous period`}
            >
              {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )
        )}
      </div>
      <p
        className={`font-bold text-gray-900 break-words leading-tight ${isText ? 'text-lg' : 'text-2xl'}`}
        title={String(value)}
      >
        {isText ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </Wrapper>
  );
}

function FunnelItem({ label, value, percent, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClasses[color]} rounded-full transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function QuickLinkCard({ href, icon, title, description }: any) {
  return (
    <Link href={href} className="bg-white rounded-xl border p-4 hover:shadow-md hover:border-blue-200 transition">
      <div className="text-blue-600 mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500">{description}</p>
    </Link>
  );
}
