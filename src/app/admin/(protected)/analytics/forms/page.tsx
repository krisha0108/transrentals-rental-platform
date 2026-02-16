'use client';

import React, { useState, useEffect } from 'react';
import {
  FormInput,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Download,
  Phone,
  Mail,
} from 'lucide-react';
import {
  AreaChart,
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
  LineChart,
  Line,
} from 'recharts';

interface FormData {
  overview: {
    totalSubmissions: number;
    successfulSubmissions: number;
    failedSubmissions: number;
    avgCompletionTime: number;
    conversionRate: number;
    abandonmentRate: number;
  };
  trends: Array<{
    date: string;
    submissions: number;
    completions: number;
    abandonments: number;
  }>;
  formTypes: Array<{
    type: string;
    submissions: number;
    conversionRate: number;
    avgTime: number;
  }>;
  fieldDropoff: Array<{
    field: string;
    started: number;
    completed: number;
    dropoffRate: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    formType: string;
    name: string;
    phone: string;
    email: string;
    page: string;
    status: string;
    timestamp: string;
    completionTime: number;
  }>;
  hourlySubmissions: Array<{
    hour: string;
    submissions: number;
  }>;
  conversionBySource: Array<{
    source: string;
    submissions: number;
    conversions: number;
    rate: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function FormsAnalyticsPage() {
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedFormType, setSelectedFormType] = useState('all');

  useEffect(() => {
    fetchFormData();
  }, [dateRange, selectedFormType]);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/forms?range=${dateRange}&type=${selectedFormType}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      // Failed to fetch - using mock data
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): FormData => ({
    overview: {
      totalSubmissions: 1234,
      successfulSubmissions: 987,
      failedSubmissions: 47,
      avgCompletionTime: 125,
      conversionRate: 8.5,
      abandonmentRate: 23.4,
    },
    trends: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      submissions: Math.floor(Math.random() * 150) + 50,
      completions: Math.floor(Math.random() * 120) + 40,
      abandonments: Math.floor(Math.random() * 30) + 10,
    })),
    formTypes: [
      { type: 'Booking Form', submissions: 456, conversionRate: 12.3, avgTime: 180 },
      { type: 'Contact Form', submissions: 345, conversionRate: 8.7, avgTime: 90 },
      { type: 'Quick Enquiry', submissions: 234, conversionRate: 15.2, avgTime: 45 },
      { type: 'Callback Request', submissions: 123, conversionRate: 22.5, avgTime: 30 },
      { type: 'Newsletter', submissions: 76, conversionRate: 5.1, avgTime: 15 },
    ],
    fieldDropoff: [
      { field: 'Name', started: 1000, completed: 980, dropoffRate: 2.0 },
      { field: 'Phone', started: 980, completed: 920, dropoffRate: 6.1 },
      { field: 'Email', started: 920, completed: 870, dropoffRate: 5.4 },
      { field: 'Date Selection', started: 870, completed: 780, dropoffRate: 10.3 },
      { field: 'Vehicle Selection', started: 780, completed: 720, dropoffRate: 7.7 },
      { field: 'Submit', started: 720, completed: 650, dropoffRate: 9.7 },
    ],
    recentSubmissions: [
      { id: '1', formType: 'Booking', name: 'Rahul Sharma', phone: '+91 9737965551', email: 'rahul@email.com', page: '/activa-on-rent', status: 'completed', timestamp: '2 mins ago', completionTime: 145 },
      { id: '2', formType: 'Contact', name: 'Priya Patel', phone: '+91 87654 32109', email: 'priya@email.com', page: '/contact', status: 'completed', timestamp: '15 mins ago', completionTime: 78 },
      { id: '3', formType: 'Quick Enquiry', name: 'Amit Singh', phone: '+91 76543 21098', email: 'amit@email.com', page: '/self-drive-cars', status: 'pending', timestamp: '32 mins ago', completionTime: 52 },
      { id: '4', formType: 'Booking', name: 'Neha Gupta', phone: '+91 65432 10987', email: 'neha@email.com', page: '/activa-on-rent/mumbai', status: 'completed', timestamp: '1 hour ago', completionTime: 203 },
      { id: '5', formType: 'Callback', name: 'Vikram Joshi', phone: '+91 54321 09876', email: 'vikram@email.com', page: '/', status: 'contacted', timestamp: '2 hours ago', completionTime: 28 },
    ],
    hourlySubmissions: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      submissions: Math.floor(Math.random() * 50) + 5,
    })),
    conversionBySource: [
      { source: 'Organic Search', submissions: 456, conversions: 52, rate: 11.4 },
      { source: 'Direct', submissions: 312, conversions: 28, rate: 9.0 },
      { source: 'Social Media', submissions: 187, conversions: 15, rate: 8.0 },
      { source: 'Referral', submissions: 143, conversions: 18, rate: 12.6 },
      { source: 'Paid Ads', submissions: 98, conversions: 14, rate: 14.3 },
    ],
  });

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
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

  const statusData = [
    { name: 'Successful', value: data.overview.successfulSubmissions, color: '#10B981' },
    { name: 'Pending', value: data.overview.totalSubmissions - data.overview.successfulSubmissions - data.overview.failedSubmissions, color: '#F59E0B' },
    { name: 'Failed', value: data.overview.failedSubmissions, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Analytics</h1>
          <p className="text-gray-600">Track form submissions and conversion metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedFormType}
            onChange={(e) => setSelectedFormType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Forms</option>
            <option value="booking">Booking Forms</option>
            <option value="contact">Contact Forms</option>
            <option value="enquiry">Quick Enquiry</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={fetchFormData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FormInput className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold">{data.overview.totalSubmissions.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Successful</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{data.overview.successfulSubmissions.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{data.overview.failedSubmissions}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Avg Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(data.overview.avgCompletionTime)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Conversion</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{data.overview.conversionRate}%</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">Abandonment</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{data.overview.abandonmentRate}%</p>
        </div>
      </div>

      {/* Submission Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Submission Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
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
                dataKey="submissions"
                stackId="1"
                fill="#3B82F6"
                stroke="#3B82F6"
                fillOpacity={0.6}
                name="Submissions"
              />
              <Area
                type="monotone"
                dataKey="completions"
                stackId="2"
                fill="#10B981"
                stroke="#10B981"
                fillOpacity={0.6}
                name="Completions"
              />
              <Area
                type="monotone"
                dataKey="abandonments"
                stackId="3"
                fill="#EF4444"
                stroke="#EF4444"
                fillOpacity={0.6}
                name="Abandonments"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form Types & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Types Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Form Type Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.formTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="type" type="category" stroke="#6B7280" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="submissions" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Submission Status</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {statusData.map((status) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-gray-600">{status.name}</span>
                  </div>
                  <span className="text-sm font-medium">{status.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Field Drop-off Funnel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Form Field Drop-off Analysis</h3>
        <div className="space-y-4">
          {data.fieldDropoff.map((field) => {
            const widthPercent = (field.completed / data.fieldDropoff[0].started) * 100;
            return (
              <div key={field.field}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{field.field}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{field.completed.toLocaleString()} completed</span>
                    <span className={`text-sm ${field.dropoffRate > 8 ? 'text-red-500' : 'text-gray-500'}`}>
                      -{field.dropoffRate}% dropoff
                    </span>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-xs text-white font-medium">{widthPercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Submissions & Conversion by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Pattern */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Hourly Submission Pattern</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourlySubmissions}>
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
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion by Source */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Conversion by Traffic Source</h3>
          <div className="space-y-4">
            {data.conversionBySource.map((source, index) => (
              <div key={source.source} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-600 truncate">{source.source}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(source.submissions / data.conversionBySource[0].submissions) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{source.submissions}</span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-green-600">{source.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Submissions</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Form Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {submission.formType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{submission.name}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3" />
                        {submission.phone}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Mail className="w-3 h-3" />
                        {submission.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-blue-600">{submission.page}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${submission.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{submission.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
