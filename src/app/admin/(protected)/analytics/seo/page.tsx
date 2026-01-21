'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  RefreshCw,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface SEOData {
  overview: {
    seoScore: number;
    pagesIndexed: number;
    issuesFound: number;
    warnings: number;
    passed: number;
    avgLoadTime: number;
  };
  searchVisibility: {
    impressions: number;
    clicks: number;
    ctr: number;
    avgPosition: number;
  };
  trends: Array<{
    date: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  seoHealth: Array<{
    category: string;
    score: number;
    fullMark: number;
  }>;
  pageAudits: Array<{
    page: string;
    score: number;
    title: string;
    titleLength: number;
    metaDescription: string;
    metaLength: number;
    h1Count: number;
    imageAlt: number;
    totalImages: number;
    issues: string[];
  }>;
  topIssues: Array<{
    issue: string;
    severity: 'error' | 'warning' | 'info';
    count: number;
    description: string;
  }>;
  keywordDensity: Array<{
    keyword: string;
    count: number;
    density: number;
  }>;
  technicalSEO: {
    robotsTxt: boolean;
    sitemap: boolean;
    https: boolean;
    canonicalTags: number;
    structuredData: boolean;
    mobileFriendly: boolean;
    loadTime: number;
  };
  contentAnalysis: {
    avgWordCount: number;
    pagesWithThinContent: number;
    duplicateContent: number;
    missingMetaDescriptions: number;
    missingH1Tags: number;
  };
}

export default function SEOAnalyticsPage() {
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchSEOData();
  }, [dateRange]);

  const fetchSEOData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/seo?range=${dateRange}`);
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

  const getMockData = (): SEOData => ({
    overview: {
      seoScore: 82,
      pagesIndexed: 156,
      issuesFound: 23,
      warnings: 18,
      passed: 145,
      avgLoadTime: 2.3,
    },
    searchVisibility: {
      impressions: 45678,
      clicks: 3456,
      ctr: 7.6,
      avgPosition: 12.4,
    },
    trends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.floor(Math.random() * 2000) + 1000,
      clicks: Math.floor(Math.random() * 200) + 50,
      position: 10 + Math.random() * 8,
    })),
    seoHealth: [
      { category: 'On-Page SEO', score: 85, fullMark: 100 },
      { category: 'Technical SEO', score: 78, fullMark: 100 },
      { category: 'Content Quality', score: 72, fullMark: 100 },
      { category: 'Mobile-First', score: 88, fullMark: 100 },
      { category: 'Page Speed', score: 75, fullMark: 100 },
      { category: 'Structured Data', score: 65, fullMark: 100 },
    ],
    pageAudits: [
      { page: '/', score: 92, title: 'TransRentals - Bike & Car Rentals', titleLength: 35, metaDescription: 'Rent bikes and cars at affordable prices...', metaLength: 145, h1Count: 1, imageAlt: 18, totalImages: 20, issues: ['2 images missing alt text'] },
      { page: '/activa-on-rent', score: 85, title: 'Honda Activa on Rent in Mumbai', titleLength: 32, metaDescription: 'Book Honda Activa scooter on rent...', metaLength: 152, h1Count: 1, imageAlt: 12, totalImages: 15, issues: ['3 images missing alt text', 'Meta description slightly long'] },
      { page: '/self-drive-cars', score: 78, title: 'Self Drive Cars for Rent', titleLength: 25, metaDescription: 'Wide range of self drive cars available...', metaLength: 138, h1Count: 1, imageAlt: 8, totalImages: 12, issues: ['4 images missing alt text'] },
      { page: '/contact', score: 95, title: 'Contact Us - TransRentals', titleLength: 26, metaDescription: 'Get in touch with TransRentals...', metaLength: 120, h1Count: 1, imageAlt: 2, totalImages: 2, issues: [] },
      { page: '/blog', score: 65, title: 'Blog', titleLength: 4, metaDescription: '', metaLength: 0, h1Count: 0, imageAlt: 5, totalImages: 15, issues: ['Title too short', 'Missing meta description', 'Missing H1 tag', '10 images missing alt text'] },
    ],
    topIssues: [
      { issue: 'Missing Alt Text', severity: 'warning', count: 23, description: '23 images are missing alt attributes' },
      { issue: 'Meta Description Issues', severity: 'warning', count: 8, description: '5 missing, 3 too long' },
      { issue: 'Thin Content', severity: 'error', count: 5, description: '5 pages have less than 300 words' },
      { issue: 'Missing H1 Tags', severity: 'error', count: 3, description: '3 pages missing primary H1' },
      { issue: 'Duplicate Title Tags', severity: 'warning', count: 2, description: '2 pages have duplicate titles' },
      { issue: 'Broken Internal Links', severity: 'error', count: 4, description: '4 broken internal links found' },
    ],
    keywordDensity: [
      { keyword: 'bike rental', count: 45, density: 2.3 },
      { keyword: 'activa on rent', count: 38, density: 1.9 },
      { keyword: 'self drive car', count: 32, density: 1.6 },
      { keyword: 'mumbai', count: 28, density: 1.4 },
      { keyword: 'affordable rental', count: 22, density: 1.1 },
    ],
    technicalSEO: {
      robotsTxt: true,
      sitemap: true,
      https: true,
      canonicalTags: 145,
      structuredData: true,
      mobileFriendly: true,
      loadTime: 2.3,
    },
    contentAnalysis: {
      avgWordCount: 856,
      pagesWithThinContent: 5,
      duplicateContent: 2,
      missingMetaDescriptions: 5,
      missingH1Tags: 3,
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#3B82F6';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const issueDistribution = [
    { name: 'Errors', value: data.overview.issuesFound, color: '#EF4444' },
    { name: 'Warnings', value: data.overview.warnings, color: '#F59E0B' },
    { name: 'Passed', value: data.overview.passed, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Analysis</h1>
          <p className="text-gray-600">Search engine optimization health and audit results</p>
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
            onClick={fetchSEOData}
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
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">SEO Score</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: getScoreColor(data.overview.seoScore) }}>
            {data.overview.seoScore}/100
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Indexed</span>
          </div>
          <p className="text-2xl font-bold">{data.overview.pagesIndexed}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{data.overview.issuesFound}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{data.overview.warnings}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Passed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{data.overview.passed}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Avg. Position</span>
          </div>
          <p className="text-2xl font-bold">{data.searchVisibility.avgPosition.toFixed(1)}</p>
        </div>
      </div>

      {/* Search Visibility Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <Eye className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.searchVisibility.impressions.toLocaleString()}</p>
          <p className="text-blue-100 text-sm">Total Impressions</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <Search className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.searchVisibility.clicks.toLocaleString()}</p>
          <p className="text-green-100 text-sm">Total Clicks</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <TrendingUp className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.searchVisibility.ctr}%</p>
          <p className="text-purple-100 text-sm">Click-Through Rate</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <Globe className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">#{Math.round(data.searchVisibility.avgPosition)}</p>
          <p className="text-amber-100 text-sm">Avg. Position</p>
        </div>
      </div>

      {/* Search Performance Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Search Performance Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} interval={4} />
              <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} domain={[0, 30]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="impressions" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} name="Impressions" />
              <Area yAxisId="left" type="monotone" dataKey="clicks" fill="#10B981" fillOpacity={0.3} stroke="#10B981" strokeWidth={2} name="Clicks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEO Health Radar & Issue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Health Radar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">SEO Health Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.seoHealth}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Audit Results Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {issueDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {issueDistribution.map((item) => (
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

      {/* Technical SEO Checklist */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Technical SEO Checklist</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className={`p-4 rounded-lg border ${data.technicalSEO.robotsTxt ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {data.technicalSEO.robotsTxt ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">robots.txt</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${data.technicalSEO.sitemap ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {data.technicalSEO.sitemap ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">Sitemap</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${data.technicalSEO.https ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {data.technicalSEO.https ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">HTTPS</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${data.technicalSEO.structuredData ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {data.technicalSEO.structuredData ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">Schema</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${data.technicalSEO.mobileFriendly ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {data.technicalSEO.mobileFriendly ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">Mobile</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <p className="text-xs text-gray-500">Canonical Tags</p>
            <p className="text-lg font-bold text-blue-600">{data.technicalSEO.canonicalTags}</p>
          </div>

          <div className={`p-4 rounded-lg border ${data.technicalSEO.loadTime < 3 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs text-gray-500">Load Time</p>
            <p className="text-lg font-bold">{data.technicalSEO.loadTime}s</p>
          </div>
        </div>
      </div>

      {/* Top Issues */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Top SEO Issues</h3>
        <div className="space-y-3">
          {data.topIssues.map((issue, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg ${
                issue.severity === 'error'
                  ? 'bg-red-50'
                  : issue.severity === 'warning'
                  ? 'bg-amber-50'
                  : 'bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {issue.severity === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">{issue.issue}</p>
                  <p className="text-sm text-gray-600">{issue.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">{issue.count}</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    issue.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : issue.severity === 'warning'
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

      {/* Page Audits */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Page SEO Audits</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">H1</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Images</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Issues</th>
              </tr>
            </thead>
            <tbody>
              {data.pageAudits.map((page) => (
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
                  <td className="py-3 px-4">
                    <p className="text-sm truncate max-w-[200px]" title={page.title}>
                      {page.title || <span className="text-red-500">Missing</span>}
                    </p>
                    <p className="text-xs text-gray-400">{page.titleLength} chars</p>
                  </td>
                  <td className="text-center py-3 px-4">
                    {page.h1Count === 1 ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`text-sm ${page.imageAlt < page.totalImages ? 'text-amber-600' : 'text-green-600'}`}>
                      {page.imageAlt}/{page.totalImages}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {page.issues.length === 0 ? (
                      <span className="text-xs text-green-600">No issues</span>
                    ) : (
                      <span className="text-xs text-red-600">{page.issues.length} issues</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keyword Density & Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
          <div className="space-y-3">
            {data.keywordDensity.map((kw, index) => (
              <div key={kw.keyword} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{kw.keyword}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{kw.count} times</span>
                  <span className="text-sm font-medium text-blue-600">{kw.density}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Content Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Avg Word Count</p>
              <p className="text-2xl font-bold">{data.contentAnalysis.avgWordCount}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500">Thin Content Pages</p>
              <p className="text-2xl font-bold text-red-600">{data.contentAnalysis.pagesWithThinContent}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-gray-500">Missing Meta Desc</p>
              <p className="text-2xl font-bold text-amber-600">{data.contentAnalysis.missingMetaDescriptions}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-gray-500">Missing H1 Tags</p>
              <p className="text-2xl font-bold text-amber-600">{data.contentAnalysis.missingH1Tags}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
