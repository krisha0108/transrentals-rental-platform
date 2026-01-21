'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Download,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface BacklinkData {
  overview: {
    totalBacklinks: number;
    referringDomains: number;
    domainAuthority: number;
    newBacklinks: number;
    lostBacklinks: number;
    dofollow: number;
    nofollow: number;
    avgDomainRating: number;
  };
  trends: Array<{
    date: string;
    backlinks: number;
    referringDomains: number;
    newLinks: number;
    lostLinks: number;
  }>;
  backlinks: Array<{
    id: string;
    sourceUrl: string;
    sourceDomain: string;
    targetUrl: string;
    anchorText: string;
    domainRating: number;
    pageAuthority: number;
    linkType: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
    firstSeen: string;
    status: 'active' | 'lost' | 'new';
    trafficEstimate: number;
  }>;
  topReferringDomains: Array<{
    domain: string;
    backlinks: number;
    domainRating: number;
    traffic: number;
    linkType: string;
  }>;
  anchorTextDistribution: Array<{
    anchor: string;
    count: number;
    percentage: number;
  }>;
  linkTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topLinkedPages: Array<{
    page: string;
    backlinks: number;
    referringDomains: number;
  }>;
  competitors: Array<{
    domain: string;
    backlinks: number;
    referringDomains: number;
    domainRating: number;
    commonLinks: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function BacklinksPage() {
  const [data, setData] = useState<BacklinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBacklinkData();
  }, [dateRange]);

  const fetchBacklinkData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/backlinks?range=${dateRange}`);
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

  const getMockData = (): BacklinkData => ({
    overview: {
      totalBacklinks: 2345,
      referringDomains: 456,
      domainAuthority: 42,
      newBacklinks: 87,
      lostBacklinks: 23,
      dofollow: 1876,
      nofollow: 469,
      avgDomainRating: 38,
    },
    trends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      backlinks: 2200 + Math.floor(i * 5 + Math.random() * 20),
      referringDomains: 430 + Math.floor(i * 0.8 + Math.random() * 5),
      newLinks: Math.floor(Math.random() * 10) + 2,
      lostLinks: Math.floor(Math.random() * 5) + 1,
    })),
    backlinks: [
      { id: '1', sourceUrl: 'https://example.com/article', sourceDomain: 'example.com', targetUrl: '/', anchorText: 'best bike rentals', domainRating: 65, pageAuthority: 45, linkType: 'dofollow', firstSeen: '2024-01-15', status: 'active', trafficEstimate: 12500 },
      { id: '2', sourceUrl: 'https://travel-blog.com/mumbai', sourceDomain: 'travel-blog.com', targetUrl: '/activa-on-rent', anchorText: 'activa rental mumbai', domainRating: 58, pageAuthority: 42, linkType: 'dofollow', firstSeen: '2024-02-20', status: 'active', trafficEstimate: 8700 },
      { id: '3', sourceUrl: 'https://local-guide.in/rentals', sourceDomain: 'local-guide.in', targetUrl: '/', anchorText: 'TransRentals', domainRating: 45, pageAuthority: 35, linkType: 'dofollow', firstSeen: '2024-03-10', status: 'new', trafficEstimate: 5400 },
      { id: '4', sourceUrl: 'https://review-site.com/vehicles', sourceDomain: 'review-site.com', targetUrl: '/self-drive-cars', anchorText: 'self drive car rental', domainRating: 52, pageAuthority: 38, linkType: 'nofollow', firstSeen: '2024-01-25', status: 'active', trafficEstimate: 15200 },
      { id: '5', sourceUrl: 'https://business-directory.com', sourceDomain: 'business-directory.com', targetUrl: '/', anchorText: 'visit website', domainRating: 72, pageAuthority: 55, linkType: 'nofollow', firstSeen: '2023-12-05', status: 'active', trafficEstimate: 28000 },
      { id: '6', sourceUrl: 'https://old-blog.com/post', sourceDomain: 'old-blog.com', targetUrl: '/contact', anchorText: 'contact transrentals', domainRating: 25, pageAuthority: 18, linkType: 'dofollow', firstSeen: '2023-11-10', status: 'lost', trafficEstimate: 1200 },
    ],
    topReferringDomains: [
      { domain: 'business-directory.com', backlinks: 45, domainRating: 72, traffic: 28000, linkType: 'mixed' },
      { domain: 'example.com', backlinks: 32, domainRating: 65, traffic: 12500, linkType: 'dofollow' },
      { domain: 'travel-blog.com', backlinks: 28, domainRating: 58, traffic: 8700, linkType: 'dofollow' },
      { domain: 'review-site.com', backlinks: 24, domainRating: 52, traffic: 15200, linkType: 'nofollow' },
      { domain: 'local-guide.in', backlinks: 18, domainRating: 45, traffic: 5400, linkType: 'dofollow' },
    ],
    anchorTextDistribution: [
      { anchor: 'TransRentals', count: 345, percentage: 28.5 },
      { anchor: 'bike rental mumbai', count: 234, percentage: 19.3 },
      { anchor: 'activa on rent', count: 198, percentage: 16.4 },
      { anchor: 'visit website', count: 156, percentage: 12.9 },
      { anchor: 'click here', count: 87, percentage: 7.2 },
      { anchor: 'Other', count: 191, percentage: 15.7 },
    ],
    linkTypeDistribution: [
      { type: 'Dofollow', count: 1876, percentage: 80.0, color: '#10B981' },
      { type: 'Nofollow', count: 345, percentage: 14.7, color: '#3B82F6' },
      { type: 'UGC', count: 89, percentage: 3.8, color: '#F59E0B' },
      { type: 'Sponsored', count: 35, percentage: 1.5, color: '#8B5CF6' },
    ],
    topLinkedPages: [
      { page: '/', backlinks: 987, referringDomains: 234 },
      { page: '/activa-on-rent', backlinks: 456, referringDomains: 145 },
      { page: '/self-drive-cars', backlinks: 321, referringDomains: 98 },
      { page: '/blog', backlinks: 287, referringDomains: 76 },
      { page: '/contact', backlinks: 145, referringDomains: 54 },
    ],
    competitors: [
      { domain: 'competitor1.com', backlinks: 5678, referringDomains: 876, domainRating: 58, commonLinks: 45 },
      { domain: 'competitor2.com', backlinks: 3456, referringDomains: 543, domainRating: 52, commonLinks: 32 },
      { domain: 'competitor3.com', backlinks: 2890, referringDomains: 432, domainRating: 48, commonLinks: 28 },
      { domain: 'competitor4.com', backlinks: 1234, referringDomains: 234, domainRating: 35, commonLinks: 15 },
    ],
  });

  const getDomainRatingColor = (rating: number) => {
    if (rating >= 60) return 'text-green-600 bg-green-100';
    if (rating >= 40) return 'text-blue-600 bg-blue-100';
    if (rating >= 20) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredBacklinks = data?.backlinks
    .filter((link) => {
      if (searchQuery && !link.sourceDomain.toLowerCase().includes(searchQuery.toLowerCase()) && !link.anchorText.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && link.linkType !== filterType) return false;
      if (filterStatus !== 'all' && link.status !== filterStatus) return false;
      return true;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backlink Analysis</h1>
          <p className="text-gray-600">Monitor and analyze your backlink profile</p>
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
            onClick={fetchBacklinkData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Link2 className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.totalBacklinks.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Backlinks</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Globe className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.referringDomains}</p>
          <p className="text-xs text-gray-500">Ref. Domains</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Shield className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.domainAuthority}</p>
          <p className="text-xs text-gray-500">Domain Rating</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Target className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.avgDomainRating}</p>
          <p className="text-xs text-gray-500">Avg Link DR</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">+{data.overview.newBacklinks}</p>
          <p className="text-xs text-gray-500">New Links</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 bg-gradient-to-br from-red-50 to-white">
          <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">-{data.overview.lostBacklinks}</p>
          <p className="text-xs text-gray-500">Lost Links</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{data.overview.dofollow.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Dofollow</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-amber-600">{data.overview.nofollow}</p>
          <p className="text-xs text-gray-500">Nofollow</p>
        </div>
      </div>

      {/* Backlink Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Backlink Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} interval={4} />
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
              <Area yAxisId="left" type="monotone" dataKey="backlinks" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} name="Total Backlinks" />
              <Area yAxisId="right" type="monotone" dataKey="referringDomains" fill="#10B981" fillOpacity={0.3} stroke="#10B981" strokeWidth={2} name="Referring Domains" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Link Type & Anchor Text Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link Type Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Link Type Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.linkTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.linkTypeDistribution.map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {data.linkTypeDistribution.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-sm text-gray-600">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{type.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">({type.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Anchor Texts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Anchor Texts</h3>
          <div className="space-y-3">
            {data.anchorTextDistribution.map((anchor, index) => (
              <div key={anchor.anchor}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{anchor.anchor}</span>
                  <span className="text-sm font-medium">{anchor.count} ({anchor.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${anchor.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Referring Domains & Top Linked Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referring Domains */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Referring Domains</h3>
          <div className="space-y-3">
            {data.topReferringDomains.map((domain, index) => (
              <div key={domain.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">{domain.domain}</p>
                    <p className="text-xs text-gray-500">{domain.traffic.toLocaleString()} traffic</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{domain.backlinks}</p>
                    <p className="text-xs text-gray-500">links</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDomainRatingColor(domain.domainRating)}`}>
                    DR {domain.domainRating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Linked Pages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Linked Pages</h3>
          <div className="space-y-3">
            {data.topLinkedPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{page.page}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{page.backlinks}</p>
                    <p className="text-xs text-gray-500">links</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{page.referringDomains}</p>
                    <p className="text-xs text-gray-500">domains</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Competitor Backlink Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Domain</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Backlinks</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ref. Domains</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Domain Rating</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Common Links</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-blue-50">
                <td className="py-3 px-4">
                  <span className="text-sm font-bold text-blue-600">transrentals.in (You)</span>
                </td>
                <td className="text-right py-3 px-4 text-sm font-bold">{data.overview.totalBacklinks.toLocaleString()}</td>
                <td className="text-right py-3 px-4 text-sm font-bold">{data.overview.referringDomains}</td>
                <td className="text-center py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${getDomainRatingColor(data.overview.domainAuthority)}`}>
                    {data.overview.domainAuthority}
                  </span>
                </td>
                <td className="text-right py-3 px-4 text-sm">-</td>
              </tr>
              {data.competitors.map((comp) => (
                <tr key={comp.domain} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-700">{comp.domain}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm">{comp.backlinks.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-sm">{comp.referringDomains}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getDomainRatingColor(comp.domainRating)}`}>
                      {comp.domainRating}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-blue-600">{comp.commonLinks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Backlinks Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">All Backlinks</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search backlinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="dofollow">Dofollow</option>
              <option value="nofollow">Nofollow</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="new">New</option>
              <option value="lost">Lost</option>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Source</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Target</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Anchor</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">DR</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">First Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredBacklinks?.map((link) => (
                <tr key={link.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate max-w-[150px]">{link.sourceDomain}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{link.sourceUrl}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{link.targetUrl}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700 truncate max-w-[120px] block">{link.anchorText}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getDomainRatingColor(link.domainRating)}`}>
                      {link.domainRating}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      link.linkType === 'dofollow' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {link.linkType}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      link.status === 'active' ? 'bg-green-100 text-green-700' :
                      link.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-500">{link.firstSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
