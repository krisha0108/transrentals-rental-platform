'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Clock,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';

interface TrafficData {
  overview: {
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    newVisitors: number;
    returningVisitors: number;
  };
  trends: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
  }>;
  hourlyTraffic: Array<{
    hour: string;
    visitors: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    avgTime: number;
    bounceRate: number;
  }>;
  sources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browsers: Array<{
    name: string;
    users: number;
    percentage: number;
  }>;
  locations: Array<{
    city: string;
    state: string;
    visitors: number;
    percentage: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function TrafficAnalyticsPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchTrafficData();
  }, [dateRange]);

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/traffic?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      // Failed to fetch - using mock data
      // Set mock data for demonstration
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): TrafficData => ({
    overview: {
      totalVisitors: 12453,
      uniqueVisitors: 8234,
      pageViews: 45678,
      avgSessionDuration: 185,
      bounceRate: 42.5,
      newVisitors: 5234,
      returningVisitors: 3000,
    },
    trends: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      visitors: Math.floor(Math.random() * 2000) + 1000,
      pageViews: Math.floor(Math.random() * 6000) + 3000,
      uniqueVisitors: Math.floor(Math.random() * 1500) + 800,
      sessions: Math.floor(Math.random() * 1800) + 900,
    })),
    hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      visitors: Math.floor(Math.random() * 500) + 50,
    })),
    topPages: [
      { page: '/', views: 12345, uniqueViews: 8765, avgTime: 45, bounceRate: 35.2 },
      { page: '/activa-on-rent', views: 8934, uniqueViews: 6234, avgTime: 120, bounceRate: 28.4 },
      { page: '/self-drive-cars', views: 7654, uniqueViews: 5432, avgTime: 95, bounceRate: 32.1 },
      { page: '/contact', views: 4321, uniqueViews: 3210, avgTime: 60, bounceRate: 45.6 },
      { page: '/about', views: 2345, uniqueViews: 1890, avgTime: 35, bounceRate: 52.3 },
    ],
    sources: [
      { source: 'Organic Search', visitors: 5234, percentage: 42.3 },
      { source: 'Direct', visitors: 3456, percentage: 27.9 },
      { source: 'Social Media', visitors: 1876, percentage: 15.2 },
      { source: 'Referral', visitors: 1123, percentage: 9.1 },
      { source: 'Paid Search', visitors: 678, percentage: 5.5 },
    ],
    devices: {
      desktop: 4523,
      mobile: 6234,
      tablet: 876,
    },
    browsers: [
      { name: 'Chrome', users: 6543, percentage: 56.2 },
      { name: 'Safari', users: 2345, percentage: 20.1 },
      { name: 'Firefox', users: 1234, percentage: 10.6 },
      { name: 'Edge', users: 987, percentage: 8.5 },
      { name: 'Others', users: 524, percentage: 4.6 },
    ],
    locations: [
      { city: 'Mumbai', state: 'Maharashtra', visitors: 3456, percentage: 28.0 },
      { city: 'Pune', state: 'Maharashtra', visitors: 2345, percentage: 19.0 },
      { city: 'Delhi', state: 'Delhi', visitors: 1876, percentage: 15.2 },
      { city: 'Bangalore', state: 'Karnataka', visitors: 1543, percentage: 12.5 },
      { city: 'Chennai', state: 'Tamil Nadu', visitors: 987, percentage: 8.0 },
    ],
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const deviceData = [
    { name: 'Desktop', value: data.devices.desktop, icon: Monitor },
    { name: 'Mobile', value: data.devices.mobile, icon: Smartphone },
    { name: 'Tablet', value: data.devices.tablet, icon: Tablet },
  ];

  const totalDevices = deviceData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traffic Analytics</h1>
          <p className="text-gray-600">Detailed visitor and traffic analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchTrafficData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 12.5%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{data.overview.totalVisitors.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Total Visitors</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 8.3%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{data.overview.pageViews.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Page Views</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 5.2%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{formatDuration(data.overview.avgSessionDuration)}</p>
          <p className="text-gray-500 text-sm">Avg. Session</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <span className="flex items-center text-red-500 text-sm">
              <ArrowDownRight className="w-4 h-4" /> 2.1%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{data.overview.bounceRate}%</p>
          <p className="text-gray-500 text-sm">Bounce Rate</p>
        </div>
      </div>

      {/* Traffic Trends Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Traffic Trends</h3>
        <div className="h-80" style={{ minHeight: '320px', minWidth: '200px' }}>
          {data.trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Page Views"
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                  name="Visitors"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B' }}
                  name="Unique Visitors"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No traffic data available</div>
          )}
        </div>
      </div>

      {/* Hourly Traffic & Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Traffic */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Hourly Traffic Pattern</h3>
          <div className="h-64" style={{ minHeight: '256px', minWidth: '200px' }}>
            {data.hourlyTraffic?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#6B7280" fontSize={10} interval={2} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="visitors" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No hourly data available</div>
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48" style={{ minHeight: '192px', minWidth: '192px' }}>
              {totalDevices > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {deviceData.map((device, index) => {
                const Icon = device.icon;
                const percentage = ((device.value / totalDevices) * 100).toFixed(1);
                return (
                  <div key={device.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{device.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{device.value.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources & Browser Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
          <div className="h-64" style={{ minHeight: '256px', minWidth: '200px' }}>
            {data.sources?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis dataKey="source" type="category" stroke="#6B7280" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="visitors" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No source data available</div>
            )}
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Browser Usage</h3>
          <div className="space-y-4">
            {data.browsers.map((browser, index) => (
              <div key={browser.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{browser.name}</span>
                  <span className="text-sm font-medium">{browser.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${browser.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Unique Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg. Time</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((page) => (
                <tr key={page.page} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-blue-600">{page.page}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm">{page.views.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-sm">{page.uniqueViews.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-sm">{page.avgTime}s</td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={`text-sm ${page.bounceRate > 50 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {page.bounceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.locations.map((location) => (
            <div
              key={location.city}
              className="p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">{location.city}</span>
              </div>
              <p className="text-xs text-gray-500">{location.state}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold">{location.visitors.toLocaleString()}</span>
                <span className="text-xs text-gray-500">{location.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New vs Returning Visitors */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">New vs Returning Visitors</h3>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">New Visitors</span>
              <span className="text-sm font-medium">{data.overview.newVisitors.toLocaleString()}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(data.overview.newVisitors / data.overview.uniqueVisitors) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Returning Visitors</span>
              <span className="text-sm font-medium">{data.overview.returningVisitors.toLocaleString()}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${(data.overview.returningVisitors / data.overview.uniqueVisitors) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
