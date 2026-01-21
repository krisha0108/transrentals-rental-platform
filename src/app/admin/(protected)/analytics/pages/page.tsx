'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Eye,
  Clock,
  TrendingDown,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Monitor,
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
} from 'recharts';

interface PageData {
  overview: {
    totalPages: number;
    avgPageViews: number;
    avgTimeOnPage: number;
    avgBounceRate: number;
    indexedPages: number;
    errorPages: number;
  };
  pages: Array<{
    url: string;
    title: string;
    pageViews: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
    entrances: number;
    exits: number;
    exitRate: number;
    searchImpressions: number;
    searchClicks: number;
    avgPosition: number;
    status: 'indexed' | 'not-indexed' | 'error';
    lastCrawled: string;
    mobileScore: number;
    desktopScore: number;
  }>;
  trends: Array<{
    date: string;
    pageViews: number;
    uniqueViews: number;
  }>;
  entryPages: Array<{
    page: string;
    entrances: number;
    bounceRate: number;
  }>;
  exitPages: Array<{
    page: string;
    exits: number;
    exitRate: number;
  }>;
  pageTypesBreakdown: Array<{
    type: string;
    count: number;
    avgViews: number;
  }>;
  crawlStatus: {
    indexed: number;
    discovered: number;
    excluded: number;
    errors: number;
  };
}

export default function PagesAnalyticsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'time' | 'bounce'>('views');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPageData();
  }, [dateRange]);

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/pages?range=${dateRange}`);
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

  const getMockData = (): PageData => ({
    overview: {
      totalPages: 156,
      avgPageViews: 1234,
      avgTimeOnPage: 145,
      avgBounceRate: 42.5,
      indexedPages: 142,
      errorPages: 3,
    },
    pages: [
      { url: '/', title: 'Home - TransRentals', pageViews: 45678, uniqueViews: 32456, avgTimeOnPage: 85, bounceRate: 35.2, entrances: 28456, exits: 12345, exitRate: 27.0, searchImpressions: 125000, searchClicks: 8900, avgPosition: 8.5, status: 'indexed', lastCrawled: '2 hours ago', mobileScore: 85, desktopScore: 92 },
      { url: '/activa-on-rent', title: 'Honda Activa on Rent', pageViews: 23456, uniqueViews: 18234, avgTimeOnPage: 180, bounceRate: 28.4, entrances: 12345, exits: 6789, exitRate: 29.0, searchImpressions: 45000, searchClicks: 3400, avgPosition: 5.2, status: 'indexed', lastCrawled: '3 hours ago', mobileScore: 78, desktopScore: 88 },
      { url: '/self-drive-cars', title: 'Self Drive Cars for Rent', pageViews: 18234, uniqueViews: 14567, avgTimeOnPage: 165, bounceRate: 32.1, entrances: 9876, exits: 5432, exitRate: 29.8, searchImpressions: 38000, searchClicks: 2100, avgPosition: 12.3, status: 'indexed', lastCrawled: '4 hours ago', mobileScore: 72, desktopScore: 85 },
      { url: '/contact', title: 'Contact Us', pageViews: 8765, uniqueViews: 7234, avgTimeOnPage: 120, bounceRate: 45.6, entrances: 2345, exits: 3456, exitRate: 39.4, searchImpressions: 12000, searchClicks: 890, avgPosition: 15.8, status: 'indexed', lastCrawled: '5 hours ago', mobileScore: 90, desktopScore: 95 },
      { url: '/about', title: 'About TransRentals', pageViews: 5432, uniqueViews: 4567, avgTimeOnPage: 95, bounceRate: 52.3, entrances: 1234, exits: 2345, exitRate: 43.2, searchImpressions: 8000, searchClicks: 450, avgPosition: 22.5, status: 'indexed', lastCrawled: '6 hours ago', mobileScore: 88, desktopScore: 92 },
      { url: '/blog', title: 'Blog', pageViews: 12345, uniqueViews: 9876, avgTimeOnPage: 220, bounceRate: 38.7, entrances: 7654, exits: 4321, exitRate: 35.0, searchImpressions: 25000, searchClicks: 1800, avgPosition: 18.2, status: 'indexed', lastCrawled: '2 hours ago', mobileScore: 65, desktopScore: 78 },
      { url: '/old-page', title: 'Deprecated Page', pageViews: 234, uniqueViews: 189, avgTimeOnPage: 15, bounceRate: 85.2, entrances: 45, exits: 234, exitRate: 100, searchImpressions: 500, searchClicks: 12, avgPosition: 65.0, status: 'error', lastCrawled: '1 day ago', mobileScore: 45, desktopScore: 52 },
    ],
    trends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pageViews: Math.floor(Math.random() * 5000) + 3000,
      uniqueViews: Math.floor(Math.random() * 3500) + 2000,
    })),
    entryPages: [
      { page: '/', entrances: 28456, bounceRate: 35.2 },
      { page: '/activa-on-rent', entrances: 12345, bounceRate: 28.4 },
      { page: '/self-drive-cars', entrances: 9876, bounceRate: 32.1 },
      { page: '/blog', entrances: 7654, bounceRate: 38.7 },
      { page: '/contact', entrances: 2345, bounceRate: 45.6 },
    ],
    exitPages: [
      { page: '/', exits: 12345, exitRate: 27.0 },
      { page: '/contact', exits: 3456, exitRate: 39.4 },
      { page: '/activa-on-rent', exits: 6789, exitRate: 29.0 },
      { page: '/self-drive-cars', exits: 5432, exitRate: 29.8 },
      { page: '/blog', exits: 4321, exitRate: 35.0 },
    ],
    pageTypesBreakdown: [
      { type: 'Service Pages', count: 45, avgViews: 15234 },
      { type: 'Location Pages', count: 78, avgViews: 8456 },
      { type: 'Blog Posts', count: 23, avgViews: 3245 },
      { type: 'Info Pages', count: 8, avgViews: 2156 },
      { type: 'Other', count: 2, avgViews: 567 },
    ],
    crawlStatus: {
      indexed: 142,
      discovered: 8,
      excluded: 3,
      errors: 3,
    },
  });

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const filteredPages = data?.pages
    .filter((page) => {
      if (searchQuery && !page.url.toLowerCase().includes(searchQuery.toLowerCase()) && !page.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus === 'indexed' && page.status !== 'indexed') return false;
      if (filterStatus === 'error' && page.status !== 'error') return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return b.pageViews - a.pageViews;
      if (sortBy === 'time') return b.avgTimeOnPage - a.avgTimeOnPage;
      if (sortBy === 'bounce') return a.bounceRate - b.bounceRate;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const crawlStatusData = [
    { name: 'Indexed', value: data.crawlStatus.indexed, color: '#10B981' },
    { name: 'Discovered', value: data.crawlStatus.discovered, color: '#3B82F6' },
    { name: 'Excluded', value: data.crawlStatus.excluded, color: '#F59E0B' },
    { name: 'Errors', value: data.crawlStatus.errors, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Analysis</h1>
          <p className="text-gray-600">Detailed analysis of individual page performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchPageData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <FileSearch className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.totalPages}</p>
          <p className="text-xs text-gray-500">Total Pages</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Eye className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.avgPageViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Avg Page Views</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Clock className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{formatTime(data.overview.avgTimeOnPage)}</p>
          <p className="text-xs text-gray-500">Avg Time on Page</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <TrendingDown className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.avgBounceRate}%</p>
          <p className="text-xs text-gray-500">Avg Bounce Rate</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{data.overview.indexedPages}</p>
          <p className="text-xs text-gray-500">Indexed Pages</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{data.overview.errorPages}</p>
          <p className="text-xs text-gray-500">Error Pages</p>
        </div>
      </div>

      {/* Page Views Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Page Views Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} interval={4} />
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
              <Area type="monotone" dataKey="pageViews" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} name="Page Views" />
              <Area type="monotone" dataKey="uniqueViews" fill="#10B981" fillOpacity={0.3} stroke="#10B981" strokeWidth={2} name="Unique Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entry/Exit Pages & Crawl Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Pages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Entry Pages</h3>
          <div className="space-y-3">
            {data.entryPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[120px]">{page.page}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{page.entrances.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{page.bounceRate}% bounce</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Pages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Exit Pages</h3>
          <div className="space-y-3">
            {data.exitPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[120px]">{page.page}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{page.exits.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{page.exitRate}% exit rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crawl Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Crawl Status</h3>
          <div className="flex items-center gap-4">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crawlStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {crawlStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {crawlStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Page Types Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Page Types Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pageTypesBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="type" stroke="#6B7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Page Count" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgViews" fill="#10B981" name="Avg Views" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Pages Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">All Pages</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="indexed">Indexed</option>
              <option value="error">Errors</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="views">Sort by Views</option>
              <option value="time">Sort by Time</option>
              <option value="bounce">Sort by Bounce</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Unique</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Time</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Bounce</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Search</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages?.map((page) => (
                <tr key={page.url} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{page.url}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{page.title}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-medium">{page.pageViews.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-500">{page.uniqueViews.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-sm">{formatTime(page.avgTimeOnPage)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`text-sm ${page.bounceRate > 50 ? 'text-red-500' : page.bounceRate > 35 ? 'text-amber-500' : 'text-green-500'}`}>
                      {page.bounceRate}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="text-xs">
                      <p className="text-gray-600">{page.searchImpressions.toLocaleString()} imp</p>
                      <p className="text-blue-600">{page.searchClicks.toLocaleString()} clicks</p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1" title="Mobile">
                        <Smartphone className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${page.mobileScore >= 80 ? 'text-green-600' : page.mobileScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {page.mobileScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-1" title="Desktop">
                        <Monitor className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${page.desktopScore >= 80 ? 'text-green-600' : page.desktopScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {page.desktopScore}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      page.status === 'indexed' ? 'bg-green-100 text-green-700' :
                      page.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {page.status}
                    </span>
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
