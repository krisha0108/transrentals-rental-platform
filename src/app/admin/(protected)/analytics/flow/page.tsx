'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface FlowData {
  flows: Array<{
    from: string;
    to: string;
    count: number;
    avgTimeOnPage: number;
  }>;
  entryPages: Array<{
    page: string;
    count: number;
  }>;
  exitPages: Array<{
    page: string;
    count: number;
  }>;
  conversionPaths: Array<{
    sessionId: string;
    path: string;
    bookingType: string;
    revenue: number;
  }>;
  dropoffPoints: Array<{
    page: string;
    totalVisits: number;
    exits: number;
    exitRate: number;
  }>;
  pathDepths: Array<{
    depth: number;
    sessions: number;
  }>;
}

export default function FlowAnalyticsPage() {
  const [data, setData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/flow?dateRange=${dateRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading flow analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No flow data available</p>
      </div>
    );
  }

  const filteredFlows = selectedPage
    ? data.flows.filter((f) => f.from === selectedPage || f.to === selectedPage)
    : data.flows.slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Flow Analytics</h1>
            <p className="text-gray-600 mt-1">Track how users navigate through your site</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Path Depth Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Journey Depth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.pathDepths}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="depth"
                label={{ value: 'Pages Visited', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => [formatNumber(value), 'Sessions']}
                labelFormatter={(depth) => `${depth} pages`}
              />
              <Bar dataKey="sessions" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Pages/Session</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.pathDepths.length > 0
                  ? (
                      data.pathDepths.reduce((sum, p) => sum + p.depth * p.sessions, 0) /
                      data.pathDepths.reduce((sum, p) => sum + p.sessions, 0)
                    ).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(data.pathDepths.reduce((sum, p) => sum + p.sessions, 0))}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Max Depth</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.max(...data.pathDepths.map((p) => p.depth))} pages
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Entry Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Entry Pages</h2>
            <div className="space-y-3">
              {data.entryPages.map((entry, index) => (
                <div
                  key={entry.page}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedPage(entry.page)}
                >
                  <div className="flex items-center flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-900 truncate">{entry.page}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 ml-2">
                    {formatNumber(entry.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Exit Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Exit Pages</h2>
            <div className="space-y-3">
              {data.exitPages.map((exit, index) => (
                <div
                  key={exit.page}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedPage(exit.page)}
                >
                  <div className="flex items-center flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-900 truncate">{exit.page}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600 ml-2">
                    {formatNumber(exit.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Page Flow */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Page-to-Page Flow</h2>
            {selectedPage && (
              <button
                onClick={() => setSelectedPage(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filter
              </button>
            )}
          </div>
          {selectedPage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Filtered by:</span> {selectedPage}
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flow</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFlows.map((flow, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{flow.from}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{flow.to}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {formatNumber(flow.count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(flow.avgTimeOnPage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((flow.count / (filteredFlows[0]?.count || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drop-off Points */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">High Drop-off Pages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exit Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.dropoffPoints.map((point) => (
                  <tr key={point.page} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{point.page}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(point.totalVisits)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatNumber(point.exits)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                      {point.exitRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${point.exitRate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Successful Conversion Paths */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Conversion Paths</h2>
          <div className="space-y-4">
            {data.conversionPaths.slice(0, 10).map((path, index) => (
              <div
                key={path.sessionId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {path.bookingType} Booking
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(path.revenue)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 overflow-x-auto">
                  {path.path.split(' → ').map((page, i, arr) => (
                    <div key={i} className="flex items-center whitespace-nowrap">
                      <span className="bg-gray-100 px-2 py-1 rounded">{page}</span>
                      {i < arr.length - 1 && (
                        <svg
                          className="w-4 h-4 mx-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
