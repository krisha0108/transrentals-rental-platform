'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ConversionData {
  summary: {
    totalVisits: number;
    totalBookings: number;
    totalRevenue: number;
    avgOrderValue: number;
    overallConversionRate: number;
  };
  funnel: Array<{
    step: string;
    stepOrder: number;
    visitors: number;
    conversionRate: number;
  }>;
  sourcePerformance: Array<{
    source: string;
    visits: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  topPages: Array<{
    page: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  dailyTrend: Array<{
    date: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  devicePerformance: Array<{
    device: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  bookingsByType: Record<string, { count: number; revenue: number }>;
}

export default function ConversionAnalyticsPage() {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/conversion?dateRange=${dateRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversion Analytics</h1>
            <p className="text-gray-600 mt-1">Complete funnel and conversion tracking</p>
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
            <p className="text-sm text-gray-600 mb-1">Total Visits</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(data.summary.totalVisits)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-green-600">
              {formatNumber(data.summary.totalBookings)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.summary.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(data.summary.avgOrderValue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-orange-600">
              {data.summary.overallConversionRate.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="step" type="category" width={150} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'visitors') return [formatNumber(value), 'Visitors'];
                  return [value.toFixed(2) + '%', 'Conversion Rate'];
                }}
              />
              <Legend />
              <Bar dataKey="visitors" fill="#3b82f6" name="Visitors" />
              <Bar dataKey="conversionRate" fill="#10b981" name="Conv. Rate %" />
            </BarChart>
          </ResponsiveContainer>

          {/* Funnel Details */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Step</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop-off</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.funnel.map((step, index) => {
                  const dropoff = index > 0
                    ? ((data.funnel[index - 1].visitors - step.visitors) / data.funnel[index - 1].visitors * 100)
                    : 0;
                  return (
                    <tr key={step.step}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {step.step.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatNumber(step.visitors)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {step.conversionRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {index > 0 ? dropoff.toFixed(2) + '%' : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
                formatter={(value: any, name: string) => {
                  if (name === 'Conversion Rate') return [value.toFixed(2) + '%', name];
                  return [formatNumber(value), name];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="visits" stroke="#3b82f6" name="Visits" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#f59e0b" name="Conversion Rate" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Source Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Traffic Source Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.sourcePerformance.slice(0, 8).map((source) => (
                    <tr key={source.source}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {source.source}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatNumber(source.visits)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                        {source.conversionRate.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(source.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Device Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Device Performance</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.devicePerformance}
                  dataKey="visits"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.device}: ${entry.conversionRate.toFixed(1)}%`}
                >
                  {data.devicePerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'visits') return [formatNumber(value), 'Visits'];
                    return [value, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.devicePerformance.map((device, index) => (
                <div key={device.device} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize text-gray-700">{device.device}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 font-medium">{formatNumber(device.visits)}</span>
                    <span className="text-gray-500 ml-2">
                      ({device.conversions} conv, {device.conversionRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Converting Pages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topPages.map((page) => (
                  <tr key={page.page}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {page.page}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(page.visits)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatNumber(page.conversions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                      {page.conversionRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(page.conversionRate * 10, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bookings by Type */}
        {Object.keys(data.bookingsByType).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bookings by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(data.bookingsByType).map(([type, stats], index) => (
                <div
                  key={type}
                  className="border border-gray-200 rounded-lg p-4"
                  style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}
                >
                  <p className="text-sm text-gray-600 capitalize mb-2">{type}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.count)}</p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {formatCurrency(stats.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
