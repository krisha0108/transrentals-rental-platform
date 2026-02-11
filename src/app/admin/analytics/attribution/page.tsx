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

interface AttributionData {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgTimeToConvert: number;
    avgTouchpoints: number;
  };
  firstTouchAttribution: Array<{
    source: string;
    bookings: number;
    revenue: number;
    avgTimeToConvert: number;
    avgTouchpoints: number;
    avgOrderValue: number;
  }>;
  lastTouchAttribution: Array<{
    source: string;
    bookings: number;
    revenue: number;
    avgTimeToConvert: number;
    avgTouchpoints: number;
    avgOrderValue: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    bookings: number;
    revenue: number;
    bookingTypes: Record<string, number>;
  }>;
  timeToConvertBuckets: Record<string, number>;
  topLandingPages: Array<{
    page: string;
    bookings: number;
    revenue: number;
    avgTimeToConvert: number;
    avgOrderValue: number;
  }>;
  attributionByBookingType: Record<string, {
    firstTouch: Array<{ source: string; bookings: number; revenue: number }>;
    lastTouch: Array<{ source: string; bookings: number; revenue: number }>;
  }>;
}

export default function AttributionAnalyticsPage() {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [attributionModel, setAttributionModel] = useState<'first' | 'last'>('first');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/attribution?dateRange=${dateRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching attribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attribution analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No attribution data available</p>
      </div>
    );
  }

  const currentAttribution =
    attributionModel === 'first' ? data.firstTouchAttribution : data.lastTouchAttribution;

  const timeToConvertData = Object.entries(data.timeToConvertBuckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Attribution</h1>
            <p className="text-gray-600 mt-1">Understand which sources drive bookings</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(data.summary.totalBookings)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.summary.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.summary.avgOrderValue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Time to Convert</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatTime(data.summary.avgTimeToConvert)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Touchpoints</p>
            <p className="text-3xl font-bold text-orange-600">
              {data.summary.avgTouchpoints.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Attribution Model Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Attribution by Source</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setAttributionModel('first')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  attributionModel === 'first'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                First Touch
              </button>
              <button
                onClick={() => setAttributionModel('last')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  attributionModel === 'last'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Last Touch
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              {attributionModel === 'first' ? (
                <><span className="font-semibold">First Touch:</span> Credits the source that initially brought the user to your site. Best for measuring awareness campaigns.</>
              ) : (
                <><span className="font-semibold">Last Touch:</span> Credits the source that directly led to the booking. Best for measuring conversion effectiveness.</>
              )}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={currentAttribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return [formatCurrency(value), name];
                  return [formatNumber(value), name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Bookings" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>

          {/* Attribution Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AOV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Touchpoints</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAttribution.map((source) => (
                  <tr key={source.source} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {source.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(source.bookings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                      {formatCurrency(source.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {formatCurrency(source.avgOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                      {formatTime(source.avgTimeToConvert)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {source.avgTouchpoints.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time to Convert */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Time to Convert Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeToConvertData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip formatter={(value: any) => [formatNumber(value), 'Bookings']} />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Landing Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Landing Pages</h2>
            <div className="space-y-3">
              {data.topLandingPages.slice(0, 8).map((page, index) => (
                <div key={page.page} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.page}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(page.bookings)} bookings • {formatTime(page.avgTimeToConvert)}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(page.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Converting Keywords</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Types</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topKeywords.map((keyword, index) => (
                  <tr key={keyword.keyword} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(keyword.bookings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                      {formatCurrency(keyword.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(keyword.bookingTypes).map(([type, count]) => (
                          <span
                            key={type}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attribution by Booking Type */}
        {Object.keys(data.attributionByBookingType).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Attribution by Booking Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(data.attributionByBookingType).map(([type, attribution]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                    {type} Bookings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">First Touch</p>
                      {attribution.firstTouch.slice(0, 3).map((source) => (
                        <div key={source.source} className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 capitalize">{source.source}</span>
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(source.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Last Touch</p>
                      {attribution.lastTouch.slice(0, 3).map((source) => (
                        <div key={source.source} className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 capitalize">{source.source}</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(source.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
