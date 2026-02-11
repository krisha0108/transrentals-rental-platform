'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface KeywordData {
  summary: {
    totalKeywords: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgCTR: number;
    avgConversionRate: number;
    avgRevenuePerClick: number;
  };
  topKeywords: Array<{
    keyword: string;
    impressions: number;
    clicks: number;
    visitors: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    revenuePerClick: number;
    topPage: string | null;
  }>;
  keywordTrends: Array<{
    keyword: string;
    trend: Array<{
      date: string;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  }>;
  keywordsByBookingType: Record<string, Array<{
    keyword: string;
    count: number;
    revenue: number;
  }>>;
}

export default function KeywordAnalyticsPage() {
  const [data, setData] = useState<KeywordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [sortBy, setSortBy] = useState('conversions');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/analytics/keywords?dateRange=${dateRange}&sortBy=${sortBy}`
      );
      const result = await response.json();
      setData(result);
      if (result.keywordTrends.length > 0) {
        setSelectedKeyword(result.keywordTrends[0].keyword);
      }
    } catch (error) {
      console.error('Error fetching keyword data:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading keyword analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No keyword data available</p>
      </div>
    );
  }

  const selectedTrend = data.keywordTrends.find((t) => t.keyword === selectedKeyword);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keyword Performance</h1>
            <p className="text-gray-600 mt-1">Track keyword traffic, conversions & ROI</p>
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="conversions">Sort by Conversions</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="clicks">Sort by Clicks</option>
            </select>
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Keywords</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(data.summary.totalKeywords)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatNumber(data.summary.totalClicks)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              CTR: {data.summary.avgCTR.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Conversions</p>
            <p className="text-3xl font-bold text-green-600">
              {formatNumber(data.summary.totalConversions)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Rate: {data.summary.avgConversionRate.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(data.summary.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              RPC: {formatCurrency(data.summary.avgRevenuePerClick)}
            </p>
          </div>
        </div>

        {/* Keyword Trend Chart */}
        {selectedTrend && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Keyword Trend</h2>
              <select
                value={selectedKeyword || ''}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {data.keywordTrends.map((trend) => (
                  <option key={trend.keyword} value={trend.keyword}>
                    {trend.keyword}
                  </option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedTrend.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    return [formatNumber(value), name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Clicks"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Conversions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Keywords Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Top Keywords ({sortBy === 'revenue' ? 'by Revenue' : sortBy === 'clicks' ? 'by Clicks' : 'by Conversions'})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RPC</th>
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
                      {formatNumber(keyword.clicks)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {keyword.ctr.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatNumber(keyword.conversions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {keyword.conversionRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-bold">
                      {formatCurrency(keyword.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(keyword.revenuePerClick)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keywords by Booking Type */}
        {Object.keys(data.keywordsByBookingType).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Keywords by Booking Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data.keywordsByBookingType).map(([type, keywords]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                    {type} Bookings
                  </h3>
                  <div className="space-y-3">
                    {keywords.slice(0, 5).map((kw, index) => (
                      <div key={kw.keyword} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 truncate">{kw.keyword}</p>
                          <p className="text-xs text-gray-500">
                            {formatNumber(kw.count)} bookings
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-sm font-medium text-blue-600">
                            {formatCurrency(kw.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
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
