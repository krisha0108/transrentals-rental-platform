'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  Plus,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Star,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface RankingData {
  overview: {
    totalKeywords: number;
    avgPosition: number;
    top3: number;
    top10: number;
    top20: number;
    improved: number;
    declined: number;
    unchanged: number;
  };
  keywords: Array<{
    id: string;
    keyword: string;
    currentPosition: number;
    previousPosition: number;
    change: number;
    bestPosition: number;
    searchVolume: number;
    difficulty: number;
    url: string;
    impressions: number;
    clicks: number;
    ctr: number;
    trend: number[];
    featured: boolean;
  }>;
  positionDistribution: Array<{
    range: string;
    count: number;
  }>;
  historicalTrends: Array<{
    date: string;
    avgPosition: number;
    top10Count: number;
  }>;
  competitors: Array<{
    domain: string;
    overlap: number;
    avgPosition: number;
    visibility: number;
  }>;
  topMovers: {
    gainers: Array<{ keyword: string; change: number; position: number }>;
    losers: Array<{ keyword: string; change: number; position: number }>;
  };
}

export default function RankingsPage() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'change' | 'volume'>('position');
  const [filterPosition, setFilterPosition] = useState('all');
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchRankingData();
  }, [dateRange]);

  const fetchRankingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/rankings?range=${dateRange}`);
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

  const getMockData = (): RankingData => ({
    overview: {
      totalKeywords: 48,
      avgPosition: 14.5,
      top3: 5,
      top10: 18,
      top20: 32,
      improved: 15,
      declined: 8,
      unchanged: 25,
    },
    keywords: [
      { id: '1', keyword: 'activa on rent mumbai', currentPosition: 3, previousPosition: 5, change: 2, bestPosition: 2, searchVolume: 2400, difficulty: 35, url: '/activa-on-rent/mumbai', impressions: 12500, clicks: 890, ctr: 7.1, trend: [8, 6, 5, 5, 4, 3, 3], featured: true },
      { id: '2', keyword: 'bike rental mumbai', currentPosition: 7, previousPosition: 9, change: 2, bestPosition: 5, searchVolume: 5400, difficulty: 58, url: '/bike-rental/mumbai', impressions: 8700, clicks: 520, ctr: 6.0, trend: [12, 11, 10, 9, 8, 7, 7], featured: false },
      { id: '3', keyword: 'self drive car rental', currentPosition: 12, previousPosition: 10, change: -2, bestPosition: 8, searchVolume: 8100, difficulty: 72, url: '/self-drive-cars', impressions: 5400, clicks: 210, ctr: 3.9, trend: [9, 10, 10, 11, 11, 12, 12], featured: false },
      { id: '4', keyword: 'activa rent near me', currentPosition: 5, previousPosition: 7, change: 2, bestPosition: 4, searchVolume: 3600, difficulty: 42, url: '/activa-on-rent', impressions: 9800, clicks: 680, ctr: 6.9, trend: [10, 9, 8, 7, 6, 5, 5], featured: false },
      { id: '5', keyword: 'scooty rental mumbai', currentPosition: 4, previousPosition: 6, change: 2, bestPosition: 3, searchVolume: 1800, difficulty: 38, url: '/scooty-on-rent/mumbai', impressions: 6500, clicks: 490, ctr: 7.5, trend: [9, 8, 7, 6, 5, 4, 4], featured: true },
      { id: '6', keyword: 'car hire mumbai', currentPosition: 18, previousPosition: 15, change: -3, bestPosition: 12, searchVolume: 4200, difficulty: 65, url: '/car-rental/mumbai', impressions: 2100, clicks: 89, ctr: 4.2, trend: [14, 15, 15, 16, 17, 18, 18], featured: false },
      { id: '7', keyword: 'honda activa rental price', currentPosition: 2, previousPosition: 3, change: 1, bestPosition: 1, searchVolume: 1200, difficulty: 28, url: '/activa-on-rent', impressions: 4500, clicks: 520, ctr: 11.6, trend: [5, 4, 4, 3, 3, 2, 2], featured: true },
      { id: '8', keyword: 'two wheeler rental', currentPosition: 9, previousPosition: 11, change: 2, bestPosition: 7, searchVolume: 2900, difficulty: 48, url: '/', impressions: 5800, clicks: 340, ctr: 5.9, trend: [14, 13, 12, 11, 10, 9, 9], featured: false },
    ],
    positionDistribution: [
      { range: '1-3', count: 5 },
      { range: '4-10', count: 13 },
      { range: '11-20', count: 14 },
      { range: '21-50', count: 10 },
      { range: '51-100', count: 6 },
    ],
    historicalTrends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgPosition: 16 - (i * 0.05) + (Math.random() * 2 - 1),
      top10Count: Math.floor(12 + (i * 0.2) + (Math.random() * 3 - 1.5)),
    })),
    competitors: [
      { domain: 'competitor1.com', overlap: 65, avgPosition: 12.3, visibility: 78 },
      { domain: 'competitor2.com', overlap: 52, avgPosition: 15.8, visibility: 62 },
      { domain: 'competitor3.com', overlap: 48, avgPosition: 18.2, visibility: 55 },
      { domain: 'competitor4.com', overlap: 35, avgPosition: 22.5, visibility: 42 },
    ],
    topMovers: {
      gainers: [
        { keyword: 'activa on rent mumbai', change: 5, position: 3 },
        { keyword: 'scooty rental mumbai', change: 4, position: 4 },
        { keyword: 'bike rental near me', change: 3, position: 8 },
      ],
      losers: [
        { keyword: 'car hire mumbai', change: -3, position: 18 },
        { keyword: 'self drive car rental', change: -2, position: 12 },
        { keyword: 'vehicle rental service', change: -2, position: 25 },
      ],
    },
  });

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    // API call to add keyword would go here
    setNewKeyword('');
    setShowAddKeyword(false);
    fetchRankingData();
  };

  const getPositionChange = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <ArrowUp className="w-4 h-4" />
          {change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <ArrowDown className="w-4 h-4" />
          {Math.abs(change)}
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-400 text-sm">
        <Minus className="w-4 h-4" />
      </span>
    );
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600 bg-green-100';
    if (position <= 10) return 'text-blue-600 bg-blue-100';
    if (position <= 20) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const filteredKeywords = data?.keywords
    .filter((kw) => {
      if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPosition === 'top3' && kw.currentPosition > 3) return false;
      if (filterPosition === 'top10' && kw.currentPosition > 10) return false;
      if (filterPosition === 'top20' && kw.currentPosition > 20) return false;
      if (filterPosition === 'improved' && kw.change <= 0) return false;
      if (filterPosition === 'declined' && kw.change >= 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'position') return a.currentPosition - b.currentPosition;
      if (sortBy === 'change') return b.change - a.change;
      if (sortBy === 'volume') return b.searchVolume - a.searchVolume;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keyword Rankings</h1>
          <p className="text-gray-600">Track your keyword positions in search results</p>
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
            onClick={() => setShowAddKeyword(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Keyword
          </button>
          <button
            onClick={fetchRankingData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Add Keyword Modal */}
      {showAddKeyword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Keyword</h3>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter keyword to track..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddKeyword(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Target className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.totalKeywords}</p>
          <p className="text-xs text-gray-500">Keywords</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Globe className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.avgPosition.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg Position</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <Star className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{data.overview.top3}</p>
          <p className="text-xs text-gray-500">Top 3</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Search className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{data.overview.top10}</p>
          <p className="text-xs text-gray-500">Top 10</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Eye className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{data.overview.top20}</p>
          <p className="text-xs text-gray-500">Top 20</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{data.overview.improved}</p>
          <p className="text-xs text-gray-500">Improved</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{data.overview.declined}</p>
          <p className="text-xs text-gray-500">Declined</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Minus className="w-5 h-5 text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-600">{data.overview.unchanged}</p>
          <p className="text-xs text-gray-500">Unchanged</p>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Top Gainers</h3>
          </div>
          <div className="space-y-3">
            {data.topMovers.gainers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">{item.keyword}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{item.position}</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <ArrowUp className="w-4 h-4" />
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold">Top Losers</h3>
          </div>
          <div className="space-y-3">
            {data.topMovers.losers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">{item.keyword}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{item.position}</span>
                  <span className="flex items-center text-red-600 font-medium">
                    <ArrowDown className="w-4 h-4" />
                    {Math.abs(item.change)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Ranking Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.historicalTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} interval={4} />
              <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} reversed domain={[0, 30]} />
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
              <Line yAxisId="left" type="monotone" dataKey="avgPosition" stroke="#3B82F6" strokeWidth={2} name="Avg Position" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="top10Count" stroke="#10B981" strokeWidth={2} name="Top 10 Keywords" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Position Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.positionDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="range" type="category" stroke="#6B7280" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competitor Comparison */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Competitor Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Domain</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Overlap</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Avg Position</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {data.competitors.map((comp) => (
                  <tr key={comp.domain} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-blue-600">{comp.domain}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${comp.overlap}%` }}
                          />
                        </div>
                        <span className="text-sm">{comp.overlap}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-sm">{comp.avgPosition.toFixed(1)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        comp.visibility >= 70 ? 'bg-green-100 text-green-700' :
                        comp.visibility >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {comp.visibility}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Keyword Rankings Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">All Keywords</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="top3">Top 3</option>
              <option value="top10">Top 10</option>
              <option value="top20">Top 20</option>
              <option value="improved">Improved</option>
              <option value="declined">Declined</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="position">Sort by Position</option>
              <option value="change">Sort by Change</option>
              <option value="volume">Sort by Volume</option>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Keyword</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Position</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Change</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Best</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Volume</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Impressions</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Clicks</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">CTR</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords?.map((kw) => (
                <tr key={kw.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {kw.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <div>
                        <p className="text-sm font-medium">{kw.keyword}</p>
                        <p className="text-xs text-gray-400">{kw.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-sm font-bold rounded ${getPositionColor(kw.currentPosition)}`}>
                      #{kw.currentPosition}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {getPositionChange(kw.change)}
                  </td>
                  <td className="text-center py-3 px-4 text-sm text-gray-500">#{kw.bestPosition}</td>
                  <td className="text-center py-3 px-4 text-sm">{kw.searchVolume.toLocaleString()}</td>
                  <td className="text-center py-3 px-4 text-sm">{kw.impressions.toLocaleString()}</td>
                  <td className="text-center py-3 px-4 text-sm">{kw.clicks.toLocaleString()}</td>
                  <td className="text-center py-3 px-4 text-sm font-medium text-blue-600">{kw.ctr}%</td>
                  <td className="py-3 px-4">
                    <div className="w-24 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kw.trend.map((v) => ({ value: v }))}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={kw.change >= 0 ? '#10B981' : '#EF4444'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
