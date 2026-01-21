'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Info,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';

interface PerformanceData {
  overview: {
    overallScore: number;
    pagesAudited: number;
    issuesFound: number;
    passedAudits: number;
  };
  coreWebVitals: {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
    fcp: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
    ttfb: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
    inp: { value: number; status: 'good' | 'needs-improvement' | 'poor'; p75: number };
  };
  trends: Array<{
    date: string;
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
  }>;
  pagePerformance: Array<{
    page: string;
    score: number;
    lcp: number;
    fid: number;
    cls: number;
    status: string;
  }>;
  devicePerformance: {
    desktop: { score: number; lcp: number; fid: number; cls: number };
    mobile: { score: number; lcp: number; fid: number; cls: number };
  };
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    page: string;
    description: string;
    impact: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-100';
    case 'needs-improvement':
      return 'text-amber-600 bg-amber-100';
    case 'poor':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
};

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/performance?range=${dateRange}`);
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

  const getMockData = (): PerformanceData => ({
    overview: {
      overallScore: 78,
      pagesAudited: 24,
      issuesFound: 12,
      passedAudits: 45,
    },
    coreWebVitals: {
      lcp: { value: 2.4, status: 'good', p75: 2.8 },
      fid: { value: 85, status: 'needs-improvement', p75: 120 },
      cls: { value: 0.08, status: 'good', p75: 0.12 },
      fcp: { value: 1.6, status: 'good', p75: 2.1 },
      ttfb: { value: 450, status: 'needs-improvement', p75: 580 },
      inp: { value: 180, status: 'needs-improvement', p75: 220 },
    },
    trends: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      lcp: 2.2 + Math.random() * 0.6,
      fid: 70 + Math.random() * 40,
      cls: 0.05 + Math.random() * 0.08,
      fcp: 1.4 + Math.random() * 0.5,
    })),
    pagePerformance: [
      { page: '/', score: 85, lcp: 2.1, fid: 65, cls: 0.05, status: 'good' },
      { page: '/activa-on-rent', score: 72, lcp: 2.8, fid: 95, cls: 0.12, status: 'needs-improvement' },
      { page: '/self-drive-cars', score: 68, lcp: 3.2, fid: 110, cls: 0.15, status: 'needs-improvement' },
      { page: '/contact', score: 92, lcp: 1.5, fid: 45, cls: 0.02, status: 'good' },
      { page: '/about', score: 88, lcp: 1.8, fid: 55, cls: 0.04, status: 'good' },
      { page: '/blog', score: 55, lcp: 4.2, fid: 180, cls: 0.25, status: 'poor' },
    ],
    devicePerformance: {
      desktop: { score: 85, lcp: 1.9, fid: 55, cls: 0.05 },
      mobile: { score: 68, lcp: 3.2, fid: 120, cls: 0.12 },
    },
    issues: [
      { type: 'Large Contentful Paint', severity: 'high', page: '/blog', description: 'LCP is 4.2s, exceeds 2.5s threshold', impact: 'High - affects user experience' },
      { type: 'Cumulative Layout Shift', severity: 'high', page: '/blog', description: 'CLS is 0.25, exceeds 0.1 threshold', impact: 'High - visual instability' },
      { type: 'First Input Delay', severity: 'medium', page: '/self-drive-cars', description: 'FID is 110ms, exceeds 100ms threshold', impact: 'Medium - delayed interactivity' },
      { type: 'Time to First Byte', severity: 'medium', page: '/activa-on-rent', description: 'TTFB is 650ms, server response slow', impact: 'Medium - initial load delay' },
      { type: 'Render Blocking Resources', severity: 'low', page: '/', description: '3 render-blocking scripts found', impact: 'Low - minor impact' },
    ],
    recommendations: [
      { title: 'Optimize Images', description: 'Compress and lazy-load images to reduce LCP', impact: 'High', effort: 'Medium' },
      { title: 'Reduce JavaScript Bundle', description: 'Code split and tree-shake unused code', impact: 'High', effort: 'High' },
      { title: 'Enable Caching', description: 'Implement browser caching for static assets', impact: 'Medium', effort: 'Low' },
      { title: 'Preconnect to Origins', description: 'Add preconnect hints for third-party domains', impact: 'Medium', effort: 'Low' },
      { title: 'Reserve Space for Ads/Images', description: 'Set explicit dimensions to prevent CLS', impact: 'Medium', effort: 'Low' },
    ],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const scoreData = [
    { name: 'Score', value: data.overview.overallScore, fill: getScoreColor(data.overview.overallScore) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Core Web Vitals and page performance metrics</p>
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
          </select>
          <button
            onClick={fetchPerformanceData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">Performance Score</h4>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={scoreData}>
                  <RadialBar dataKey="value" cornerRadius={10} background />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: getScoreColor(data.overview.overallScore) }}>
                {data.overview.overallScore}
              </p>
              <p className="text-sm text-gray-500">out of 100</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.pagesAudited}</p>
          <p className="text-gray-500 text-sm">Pages Audited</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-red-600">{data.overview.issuesFound}</p>
          <p className="text-gray-500 text-sm">Issues Found</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-green-600">{data.overview.passedAudits}</p>
          <p className="text-gray-500 text-sm">Passed Audits</p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Core Web Vitals</h3>
          <a href="https://web.dev/vitals/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Info className="w-4 h-4" /> Learn more
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* LCP */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">LCP</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.lcp.status)}`}>
                {data.coreWebVitals.lcp.status === 'good' ? 'Good' : data.coreWebVitals.lcp.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.lcp.value}s</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.lcp.p75}s</p>
            <p className="text-xs text-gray-400 mt-1">Largest Contentful Paint</p>
          </div>

          {/* FID */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">FID</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.fid.status)}`}>
                {data.coreWebVitals.fid.status === 'good' ? 'Good' : data.coreWebVitals.fid.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.fid.value}ms</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.fid.p75}ms</p>
            <p className="text-xs text-gray-400 mt-1">First Input Delay</p>
          </div>

          {/* CLS */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">CLS</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.cls.status)}`}>
                {data.coreWebVitals.cls.status === 'good' ? 'Good' : data.coreWebVitals.cls.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.cls.value}</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.cls.p75}</p>
            <p className="text-xs text-gray-400 mt-1">Cumulative Layout Shift</p>
          </div>

          {/* FCP */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">FCP</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.fcp.status)}`}>
                {data.coreWebVitals.fcp.status === 'good' ? 'Good' : data.coreWebVitals.fcp.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.fcp.value}s</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.fcp.p75}s</p>
            <p className="text-xs text-gray-400 mt-1">First Contentful Paint</p>
          </div>

          {/* TTFB */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">TTFB</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.ttfb.status)}`}>
                {data.coreWebVitals.ttfb.status === 'good' ? 'Good' : data.coreWebVitals.ttfb.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.ttfb.value}ms</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.ttfb.p75}ms</p>
            <p className="text-xs text-gray-400 mt-1">Time to First Byte</p>
          </div>

          {/* INP */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">INP</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.coreWebVitals.inp.status)}`}>
                {data.coreWebVitals.inp.status === 'good' ? 'Good' : data.coreWebVitals.inp.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{data.coreWebVitals.inp.value}ms</p>
            <p className="text-xs text-gray-500">p75: {data.coreWebVitals.inp.p75}ms</p>
            <p className="text-xs text-gray-400 mt-1">Interaction to Next Paint</p>
          </div>
        </div>
      </div>

      {/* Vitals Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Core Web Vitals Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trends}>
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
              <Line type="monotone" dataKey="lcp" stroke="#3B82F6" strokeWidth={2} name="LCP (s)" dot={{ fill: '#3B82F6' }} />
              <Line type="monotone" dataKey="fcp" stroke="#10B981" strokeWidth={2} name="FCP (s)" dot={{ fill: '#10B981' }} />
              <Line type="monotone" dataKey="cls" stroke="#F59E0B" strokeWidth={2} name="CLS" dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Performance Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Desktop Performance</h3>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: getScoreColor(data.devicePerformance.desktop.score) }}>
                {data.devicePerformance.desktop.score}
              </p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.desktop.lcp}s</p>
                <p className="text-xs text-gray-500">LCP</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.desktop.fid}ms</p>
                <p className="text-xs text-gray-500">FID</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.desktop.cls}</p>
                <p className="text-xs text-gray-500">CLS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold">Mobile Performance</h3>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: getScoreColor(data.devicePerformance.mobile.score) }}>
                {data.devicePerformance.mobile.score}
              </p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.mobile.lcp}s</p>
                <p className="text-xs text-gray-500">LCP</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.mobile.fid}ms</p>
                <p className="text-xs text-gray-500">FID</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold">{data.devicePerformance.mobile.cls}</p>
                <p className="text-xs text-gray-500">CLS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Performance Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Page Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">LCP</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">FID</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">CLS</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.pagePerformance.map((page) => (
                <tr key={page.page} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-blue-600">{page.page}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className="text-sm font-bold"
                      style={{ color: getScoreColor(page.score) }}
                    >
                      {page.score}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-sm">{page.lcp}s</td>
                  <td className="text-center py-3 px-4 text-sm">{page.fid}ms</td>
                  <td className="text-center py-3 px-4 text-sm">{page.cls}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(page.status)}`}>
                      {page.status === 'good' ? 'Good' : page.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Performance Issues</h3>
        <div className="space-y-3">
          {data.issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                issue.severity === 'high'
                  ? 'bg-red-50 border-red-500'
                  : issue.severity === 'medium'
                  ? 'bg-amber-50 border-amber-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {issue.severity === 'high' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : issue.severity === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="font-medium">{issue.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Page: {issue.page}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    issue.severity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : issue.severity === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {issue.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recommendations.map((rec, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
              <h4 className="font-medium text-gray-900">{rec.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">Impact: {rec.impact}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500">Effort: {rec.effort}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
