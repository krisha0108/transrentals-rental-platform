'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Eye, Monitor, Smartphone, Tablet, Globe, TrendingUp, Loader2, RefreshCw,
  MessageCircle, FormInput, MousePointer, Zap, Activity, AlertTriangle, CheckCircle,
  XCircle, Clock, Phone, Mail, Share2, ArrowUpRight, BarChart3, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    todayViews: number;
    todayVisitors: number;
    avgViewsPerDay: number;
    activeVisitors: number;
  };
  traffic: {
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
    browserBreakdown: Record<string, number>;
    trafficSources: { direct: number; organic: number; referral: number; social: number };
    topPages: { path: string; views: number }[];
    topReferrers: { domain: string; count: number }[];
    chartData: { date: string; views: number; visitors: number }[];
  };
  forms: {
    stats: {
      total: number;
      submitted: number;
      failed: number;
      pending: number;
      converted: number;
      byType: Record<string, number>;
      avgTimeToFill: number;
      conversionRate: number;
    };
    topPages: { path: string; count: number }[];
    recent: { id: string; formType: string; formName: string; pagePath: string; status: string; serviceType: string; createdAt: string }[];
  };
  chat: {
    stats: {
      totalSessions: number;
      totalMessages: number;
      bookingsStarted: number;
      bookingsCompleted: number;
      kbQueries: number;
      byOutcome: Record<string, number>;
      conversionRate: number;
    };
    topPages: { path: string; count: number }[];
    recent: { id: string; type: string; pagePath: string; serviceType: string; outcome: string; createdAt: string }[];
  };
  clicks: {
    stats: {
      total: number;
      byType: Record<string, number>;
      ctaClicks: number;
      phoneClicks: number;
      emailClicks: number;
      socialClicks: number;
      externalClicks: number;
      avgScrollDepth: number;
    };
  };
  performance: {
    vitals: {
      totalMeasurements: number;
      avgLcp: number;
      avgFid: number;
      avgCls: number;
      avgFcp: number;
      avgTtfb: number;
      avgInp: number;
      lcpGood: number;
      lcpNeedsImprovement: number;
      lcpPoor: number;
      fidGood: number;
      fidNeedsImprovement: number;
      fidPoor: number;
      clsGood: number;
      clsNeedsImprovement: number;
      clsPoor: number;
      overallHealth: string;
    };
    pagesWithIssues: { path: string; status: string; avgLcp: number; avgCls: number; issues: string[]; totalViews: number }[];
  };
  realTime: {
    activeVisitors: number;
    sessions: {
      currentPage: string;
      device: string;
      browser: string;
      country: string;
      pageCount: number;
      hasInteracted: boolean;
      hasChatted: boolean;
      hasSubmittedForm: boolean;
    }[];
  };
  recent: {
    visits: { id: string; path: string; device: string; browser: string; country: string; referrer: string; createdAt: string }[];
    forms: { id: string; formType: string; formName: string; pagePath: string; status: string; serviceType: string; createdAt: string }[];
    chats: { id: string; type: string; pagePath: string; serviceType: string; outcome: string; createdAt: string }[];
  };
}

type TabType = 'overview' | 'traffic' | 'forms' | 'chat' | 'clicks' | 'performance';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setError('Failed to load analytics');
      }
    } catch {
      setError('Error fetching analytics');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-4">{error || 'No analytics data available'}</p>
        <Button variant="outline" onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'traffic', label: 'Traffic', icon: <Users className="w-4 h-4" /> },
    { id: 'forms', label: 'Forms', icon: <FormInput className="w-4 h-4" /> },
    { id: 'chat', label: 'Shivi Chat', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'clicks', label: 'Clicks', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">Comprehensive tracking and insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Real-time indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-700">{data.summary.activeVisitors} active</span>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'traffic' && <TrafficTab data={data} />}
      {activeTab === 'forms' && <FormsTab data={data} />}
      {activeTab === 'chat' && <ChatTab data={data} />}
      {activeTab === 'clicks' && <ClicksTab data={data} />}
      {activeTab === 'performance' && <PerformanceTab data={data} />}
    </div>
  );
}

// ============= OVERVIEW TAB =============
function OverviewTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Eye className="w-5 h-5 text-blue-600" />}
          label="Total Views"
          value={data.summary.totalViews}
          subValue={`${data.summary.todayViews} today`}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-600" />}
          label="Unique Visitors"
          value={data.summary.uniqueVisitors}
          subValue={`${data.summary.todayVisitors} today`}
          color="purple"
        />
        <StatCard
          icon={<FormInput className="w-5 h-5 text-green-600" />}
          label="Form Submissions"
          value={data.forms.stats.submitted}
          subValue={`${data.forms.stats.conversionRate}% rate`}
          color="green"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5 text-amber-600" />}
          label="Chat Bookings"
          value={data.chat.stats.bookingsCompleted}
          subValue={`${data.chat.stats.conversionRate}% rate`}
          color="amber"
        />
        <StatCard
          icon={<MousePointer className="w-5 h-5 text-pink-600" />}
          label="CTA Clicks"
          value={data.clicks.stats.ctaClicks}
          subValue={`${data.clicks.stats.phoneClicks} phone`}
          color="pink"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-cyan-600" />}
          label="Performance"
          value={data.performance.vitals.overallHealth}
          subValue={`LCP: ${data.performance.vitals.avgLcp}ms`}
          color="cyan"
          isText
        />
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Traffic Overview</h3>
        {data.traffic.chartData.length > 0 ? (
          <div className="h-48">
            <div className="flex h-full items-end gap-1">
              {data.traffic.chartData.map((day, idx) => {
                const maxViews = Math.max(...data.traffic.chartData.map(d => d.views));
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm hover:from-blue-600 hover:to-blue-500 transition cursor-pointer"
                      style={{ height: `${height}%`, minHeight: day.views > 0 ? '4px' : '0' }}
                      title={`${day.date}: ${day.views} views, ${day.visitors} visitors`}
                    />
                    <span className="text-[10px] text-gray-400 rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-2">
            {data.traffic.topPages.slice(0, 5).map((page, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600 truncate max-w-[180px]" title={page.path}>
                  {page.path}
                </span>
                <span className="text-sm font-medium text-gray-900">{page.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Form Submissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Forms</h3>
          <div className="space-y-2">
            {data.recent.forms.slice(0, 5).map((form, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${form.status === 'SUBMITTED' ? 'bg-green-500' : form.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm text-gray-600 truncate max-w-[140px]">{form.formName}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(form.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {data.recent.forms.length === 0 && <p className="text-sm text-gray-400">No recent forms</p>}
          </div>
        </div>

        {/* Recent Chat Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Chat Activity</h3>
          <div className="space-y-2">
            {data.recent.chats.slice(0, 5).map((chat, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${chat.type === 'BOOKING_COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  <span className="text-sm text-gray-600">{chat.type === 'BOOKING_COMPLETED' ? 'Booking' : 'Started'}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(chat.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {data.recent.chats.length === 0 && <p className="text-sm text-gray-400">No recent chat activity</p>}
          </div>
        </div>
      </div>

      {/* Real-time Visitors */}
      {data.realTime.sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-semibold text-gray-900">Active Visitors ({data.realTime.activeVisitors})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.realTime.sessions.slice(0, 6).map((session, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  session.device === 'mobile' ? 'bg-green-100' : session.device === 'tablet' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {session.device === 'mobile' ? <Smartphone className="w-4 h-4 text-green-600" /> :
                   session.device === 'tablet' ? <Tablet className="w-4 h-4 text-purple-600" /> :
                   <Monitor className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{session.currentPage}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{session.browser}</span>
                    {session.hasChatted && <MessageCircle className="w-3 h-3 text-amber-500" />}
                    {session.hasSubmittedForm && <FormInput className="w-3 h-3 text-green-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= TRAFFIC TAB =============
function TrafficTab({ data }: { data: AnalyticsData }) {
  const deviceTotal = data.traffic.deviceBreakdown.desktop + data.traffic.deviceBreakdown.mobile + data.traffic.deviceBreakdown.tablet;
  const getDevicePercent = (count: number) => deviceTotal > 0 ? Math.round((count / deviceTotal) * 100) : 0;

  const sourceTotal = data.traffic.trafficSources.direct + data.traffic.trafficSources.organic + data.traffic.trafficSources.referral + data.traffic.trafficSources.social;
  const getSourcePercent = (count: number) => sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Traffic Sources */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Direct</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.traffic.trafficSources.direct}</p>
          <p className="text-xs text-gray-500">{getSourcePercent(data.traffic.trafficSources.direct)}% of traffic</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Organic</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.traffic.trafficSources.organic}</p>
          <p className="text-xs text-gray-500">{getSourcePercent(data.traffic.trafficSources.organic)}% of traffic</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Referral</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.traffic.trafficSources.referral}</p>
          <p className="text-xs text-gray-500">{getSourcePercent(data.traffic.trafficSources.referral)}% of traffic</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-gray-600">Social</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.traffic.trafficSources.social}</p>
          <p className="text-xs text-gray-500">{getSourcePercent(data.traffic.trafficSources.social)}% of traffic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Desktop', icon: <Monitor className="w-4 h-4" />, count: data.traffic.deviceBreakdown.desktop, color: 'blue' },
              { label: 'Mobile', icon: <Smartphone className="w-4 h-4" />, count: data.traffic.deviceBreakdown.mobile, color: 'green' },
              { label: 'Tablet', icon: <Tablet className="w-4 h-4" />, count: data.traffic.deviceBreakdown.tablet, color: 'purple' },
            ].map((device) => (
              <div key={device.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    {device.icon}
                    <span className="text-sm text-gray-700">{device.label}</span>
                  </div>
                  <span className="text-sm font-medium">{getDevicePercent(device.count)}% ({device.count})</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-${device.color}-500`}
                    style={{ width: `${getDevicePercent(device.count)}%`, backgroundColor: device.color === 'blue' ? '#3b82f6' : device.color === 'green' ? '#22c55e' : '#a855f7' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">Browsers</h3>
          <div className="space-y-2">
            {Object.entries(data.traffic.browserBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{browser}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Referrers</h3>
          {data.traffic.topReferrers.length > 0 ? (
            <div className="space-y-2">
              {data.traffic.topReferrers.map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">{ref.domain}</span>
                  <span className="text-sm font-medium text-gray-900">{ref.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No referrer data yet</p>
          )}
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Page</th>
                <th className="pb-2 font-medium text-right">Views</th>
                <th className="pb-2 font-medium text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.traffic.topPages.map((page, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{page.path}</td>
                  <td className="py-2 text-right font-medium">{page.views}</td>
                  <td className="py-2 text-right text-gray-500">
                    {data.summary.totalViews > 0 ? Math.round((page.views / data.summary.totalViews) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============= FORMS TAB =============
function FormsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Form Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<FormInput className="w-5 h-5 text-blue-600" />} label="Total Forms" value={data.forms.stats.total} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="Submitted" value={data.forms.stats.submitted} color="green" />
        <StatCard icon={<XCircle className="w-5 h-5 text-red-600" />} label="Failed" value={data.forms.stats.failed} color="red" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} label="Avg Fill Time" value={`${data.forms.stats.avgTimeToFill}s`} color="amber" isText />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Conversion" value={`${data.forms.stats.conversionRate}%`} color="purple" isText />
      </div>

      {/* Form Types Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Forms by Type</h3>
          <div className="space-y-3">
            {Object.entries(data.forms.stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(data.forms.stats.byType).length === 0 && (
              <p className="text-sm text-gray-400">No form data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Form Pages</h3>
          <div className="space-y-2">
            {data.forms.topPages.map((page, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">{page.path}</span>
                <span className="text-sm font-medium text-gray-900">{page.count}</span>
              </div>
            ))}
            {data.forms.topPages.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Forms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Form Submissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Form</th>
                <th className="pb-2 font-medium">Page</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.forms.recent.map((form) => (
                <tr key={form.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{form.formName}</td>
                  <td className="py-2 text-gray-500 truncate max-w-[150px]">{form.pagePath}</td>
                  <td className="py-2 text-gray-500">{form.serviceType || '-'}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      form.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
                      form.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {form.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">{new Date(form.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {data.forms.recent.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No recent forms</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============= CHAT TAB =============
function ChatTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Chat Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<MessageCircle className="w-5 h-5 text-blue-600" />} label="Chat Sessions" value={data.chat.stats.totalSessions} color="blue" />
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} label="Messages" value={data.chat.stats.totalMessages} color="purple" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-600" />} label="Bookings Started" value={data.chat.stats.bookingsStarted} color="amber" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="Bookings Completed" value={data.chat.stats.bookingsCompleted} color="green" />
        <StatCard icon={<PieChart className="w-5 h-5 text-cyan-600" />} label="Conversion" value={`${data.chat.stats.conversionRate}%`} color="cyan" isText />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Outcomes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Chat Outcomes</h3>
          <div className="space-y-3">
            {Object.entries(data.chat.stats.byOutcome).map(([outcome, count]) => (
              <div key={outcome} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{outcome.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(data.chat.stats.byOutcome).length === 0 && (
              <p className="text-sm text-gray-400">No chat data yet</p>
            )}
          </div>
        </div>

        {/* Top Chat Pages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pages with Most Chat Activity</h3>
          <div className="space-y-2">
            {data.chat.topPages.map((page, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">{page.path}</span>
                <span className="text-sm font-medium text-gray-900">{page.count}</span>
              </div>
            ))}
            {data.chat.topPages.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>
      </div>

      {/* KB Queries */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Knowledge Base Queries</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{data.chat.stats.kbQueries}</p>
        <p className="text-sm text-gray-500 mt-1">Users searching for help via Shivi</p>
      </div>
    </div>
  );
}

// ============= CLICKS TAB =============
function ClicksTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Click Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<MousePointer className="w-5 h-5 text-blue-600" />} label="Total Clicks" value={data.clicks.stats.total} color="blue" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-green-600" />} label="CTA Clicks" value={data.clicks.stats.ctaClicks} color="green" />
        <StatCard icon={<Phone className="w-5 h-5 text-purple-600" />} label="Phone Clicks" value={data.clicks.stats.phoneClicks} color="purple" />
        <StatCard icon={<Mail className="w-5 h-5 text-amber-600" />} label="Email Clicks" value={data.clicks.stats.emailClicks} color="amber" />
        <StatCard icon={<Share2 className="w-5 h-5 text-pink-600" />} label="Social Clicks" value={data.clicks.stats.socialClicks} color="pink" />
        <StatCard icon={<ArrowUpRight className="w-5 h-5 text-cyan-600" />} label="Avg Scroll" value={`${data.clicks.stats.avgScrollDepth}%`} color="cyan" isText />
      </div>

      {/* Click Types Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Clicks by Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(data.clicks.stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <div key={type} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{type.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
        </div>
        {Object.keys(data.clicks.stats.byType).length === 0 && (
          <p className="text-sm text-gray-400">No click data yet</p>
        )}
      </div>
    </div>
  );
}

// ============= PERFORMANCE TAB =============
function PerformanceTab({ data }: { data: AnalyticsData }) {
  const getVitalStatus = (value: number, type: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb') => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };
    if (value <= thresholds[type].good) return 'good';
    if (value <= thresholds[type].poor) return 'needs-improvement';
    return 'poor';
  };

  const vitals = data.performance.vitals;

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <div className={`p-6 rounded-xl border-2 ${
        vitals.overallHealth === 'HEALTHY' ? 'bg-green-50 border-green-200' :
        vitals.overallHealth === 'POOR' ? 'bg-red-50 border-red-200' :
        'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-3">
          {vitals.overallHealth === 'HEALTHY' ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : vitals.overallHealth === 'POOR' ? (
            <XCircle className="w-8 h-8 text-red-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Overall Performance: {vitals.overallHealth}
            </h3>
            <p className="text-sm text-gray-600">Based on {vitals.totalMeasurements} measurements</p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LCP */}
        <VitalCard
          name="LCP"
          fullName="Largest Contentful Paint"
          value={vitals.avgLcp}
          unit="ms"
          status={getVitalStatus(vitals.avgLcp, 'lcp')}
          good={vitals.lcpGood}
          needsImprovement={vitals.lcpNeedsImprovement}
          poor={vitals.lcpPoor}
          threshold="< 2.5s good, < 4s needs improvement"
        />

        {/* FID */}
        <VitalCard
          name="FID"
          fullName="First Input Delay"
          value={vitals.avgFid}
          unit="ms"
          status={getVitalStatus(vitals.avgFid, 'fid')}
          good={vitals.fidGood}
          needsImprovement={vitals.fidNeedsImprovement}
          poor={vitals.fidPoor}
          threshold="< 100ms good, < 300ms needs improvement"
        />

        {/* CLS */}
        <VitalCard
          name="CLS"
          fullName="Cumulative Layout Shift"
          value={vitals.avgCls}
          unit=""
          status={getVitalStatus(vitals.avgCls, 'cls')}
          good={vitals.clsGood}
          needsImprovement={vitals.clsNeedsImprovement}
          poor={vitals.clsPoor}
          threshold="< 0.1 good, < 0.25 needs improvement"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">FCP</p>
          <p className="text-xl font-bold text-gray-900">{vitals.avgFcp}ms</p>
          <p className="text-xs text-gray-400">First Contentful Paint</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">TTFB</p>
          <p className="text-xl font-bold text-gray-900">{vitals.avgTtfb}ms</p>
          <p className="text-xs text-gray-400">Time to First Byte</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">INP</p>
          <p className="text-xl font-bold text-gray-900">{vitals.avgInp}ms</p>
          <p className="text-xs text-gray-400">Interaction to Next Paint</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Measurements</p>
          <p className="text-xl font-bold text-gray-900">{vitals.totalMeasurements}</p>
          <p className="text-xs text-gray-400">Total data points</p>
        </div>
      </div>

      {/* Pages with Issues */}
      {data.performance.pagesWithIssues.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-900">Pages with Performance Issues</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Page</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">LCP</th>
                  <th className="pb-2 font-medium">CLS</th>
                  <th className="pb-2 font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.performance.pagesWithIssues.map((page, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700 truncate max-w-[200px]">{page.path}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'POOR' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{page.avgLcp?.toFixed(0) || '-'}ms</td>
                    <td className="py-2 text-gray-500">{page.avgCls?.toFixed(3) || '-'}</td>
                    <td className="py-2 text-gray-500">{page.totalViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= HELPER COMPONENTS =============
function StatCard({ icon, label, value, subValue, color, isText }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
  isText?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-50 to-cyan-50 border-blue-100',
    purple: 'from-purple-50 to-pink-50 border-purple-100',
    green: 'from-green-50 to-emerald-50 border-green-100',
    amber: 'from-amber-50 to-orange-50 border-amber-100',
    pink: 'from-pink-50 to-rose-50 border-pink-100',
    cyan: 'from-cyan-50 to-teal-50 border-cyan-100',
    red: 'from-red-50 to-orange-50 border-red-100',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {isText ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
}

function VitalCard({ name, fullName, value, unit, status, good, needsImprovement, poor, threshold }: {
  name: string;
  fullName: string;
  value: number;
  unit: string;
  status: 'good' | 'needs-improvement' | 'poor';
  good: number;
  needsImprovement: number;
  poor: number;
  threshold: string;
}) {
  const total = good + needsImprovement + poor;
  const getPercent = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{name}</h4>
          <p className="text-xs text-gray-500">{fullName}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'good' ? 'bg-green-100 text-green-700' :
          status === 'poor' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {value}{unit}
        </div>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-green-500 h-full" style={{ width: `${getPercent(good)}%` }} />
        <div className="bg-yellow-500 h-full" style={{ width: `${getPercent(needsImprovement)}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${getPercent(poor)}%` }} />
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <span className="text-green-600">Good: {getPercent(good)}%</span>
        <span className="text-yellow-600">Needs Work: {getPercent(needsImprovement)}%</span>
        <span className="text-red-600">Poor: {getPercent(poor)}%</span>
      </div>

      <p className="text-xs text-gray-400 mt-3">{threshold}</p>
    </div>
  );
}
