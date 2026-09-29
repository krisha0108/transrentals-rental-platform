'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Film, Globe, TrendingUp, Heart, RefreshCw, Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface LeaderboardRow {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  views: number;
  reactions: { HEART: number; FIRE: number; THUMBS_UP: number; total: number };
  engagementRate: number;
}

interface TrendPoint {
  date: string;
  views: number;
}

interface AnalyticsResponse {
  success: boolean;
  totals: {
    totalStories: number;
    totalPublished: number;
    totalViews: number;
    totalReactions: number;
    avgEngagementRate: number;
  };
  leaderboard: LeaderboardRow[];
  trend: TrendPoint[];
}

const RANGE_OPTIONS = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
];

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function WebStoriesAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/web-stories/analytics?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json.success ? json : null);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const trendData = useMemo(
    () => data?.trend.map((t) => ({ ...t, label: formatShortDate(t.date) })) || [],
    [data],
  );

  const totals = data?.totals;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link href="/admin/web-stories" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Web Stories
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            Web Stories Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Views, reactions, and which stories perform best.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-red-600 text-sm">
          Failed to load analytics. Try refreshing.
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Stories', value: totals!.totalStories, icon: <Film className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
              { label: 'Published', value: totals!.totalPublished, icon: <Globe className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
              { label: 'Total Views', value: totals!.totalViews.toLocaleString(), icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
              { label: 'Total Reactions', value: totals!.totalReactions.toLocaleString(), icon: <Heart className="w-5 h-5 text-pink-600" />, bg: 'bg-pink-50' },
              { label: 'Avg Engagement', value: `${totals!.avgEngagementRate}%`, icon: <Trophy className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold text-gray-900 truncate">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Views Over Time</h2>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setDays(r.key)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      days === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {trendData.some((t) => t.views > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333EA" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#9333EA" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#9333EA" strokeWidth={2} fill="url(#viewsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400">No views recorded in this range yet.</div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Story Leaderboard</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ranked by all-time views.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Story</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Views</th>
                    <th className="px-4 py-2.5 text-right">Reactions</th>
                    <th className="px-4 py-2.5 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.leaderboard.map((row, i) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 font-medium">
                        {i < 3 ? <Trophy className={`w-4 h-4 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} /> : i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/web-stories/${row.id}`} className="font-medium text-gray-900 hover:text-purple-600 truncate block max-w-[240px]">
                          {row.title}
                        </Link>
                        <span className="text-xs text-gray-400">/stories/{row.slug}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {row.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {row.isFeatured && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Featured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{row.views.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        ❤️ {row.reactions.HEART} 🔥 {row.reactions.FIRE} 👍 {row.reactions.THUMBS_UP}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{row.engagementRate}%</td>
                    </tr>
                  ))}
                  {data.leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No stories yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
