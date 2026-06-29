'use client';

import React, { useState, useCallback } from 'react';
import {
  Brain,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  BarChart3,
  Target,
  Lightbulb,
  ArrowUpRight,
  Loader2,
  Settings2,
  Info,
} from 'lucide-react';

interface QuoteStat {
  total: number;
  last7d: number;
  last30d: number;
  byMonth: { month: string; count: number }[];
}

interface PageViewStat {
  service: string;
  visits: number;
  sessions: number;
}

interface DropoffReason {
  rank: number;
  reason: string;
  evidence: string;
  impact: 'high' | 'medium' | 'low';
}

interface ServiceRec {
  service: string;
  fix: string;
  effort: string;
  expectedLift: string;
}

interface QuickWin {
  action: string;
  owner: string;
  timeline: string;
}

interface Analysis {
  summary?: string;
  topDropoffReasons?: DropoffReason[];
  serviceRecommendations?: ServiceRec[];
  quickWins?: QuickWin[];
  priorityScore?: Record<string, number>;
}

interface ApiResponse {
  generatedAt: string;
  googleMetrics: { impressions: number; clicks: number; ctr: number };
  rawData: {
    quotes: Record<string, QuoteStat>;
    pageViews: PageViewStat[];
    inquiries: { service: string; count: number }[];
  };
  analysis: Analysis;
}

const SERVICE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bike:       { label: 'Bike Rental',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: '🚲' },
  self_drive: { label: 'Self Drive',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: '🚗' },
  bus:        { label: 'Bus Rental',    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '🚌' },
  luxury:     { label: 'Luxury Car',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: '👑' },
  truck:      { label: 'Mini Truck',    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🚛' },
};

const IMPACT_CONFIG = {
  high:   { label: 'High Impact',   cls: 'bg-red-100 text-red-700 border border-red-200' },
  medium: { label: 'Med Impact',    cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  low:    { label: 'Low Impact',    cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

const OWNER_CONFIG: Record<string, { label: string; cls: string }> = {
  dev:     { label: 'Dev',     cls: 'bg-blue-100 text-blue-700' },
  content: { label: 'Content', cls: 'bg-purple-100 text-purple-700' },
  ops:     { label: 'Ops',     cls: 'bg-green-100 text-green-700' },
};

function StatCard({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AiAnalysisPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [impressions, setImpressions] = useState('53000');
  const [clicks, setClicks] = useState('3000');
  const [showConfig, setShowConfig] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/analytics/ai-analysis?impressions=${impressions}&clicks=${clicks}`);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Request failed');
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [impressions, clicks]);

  const quoteMax = data
    ? Math.max(...Object.values(data.rawData.quotes).map((q) => q.last30d), 1)
    : 1;

  const pvMax = data
    ? Math.max(...data.rawData.pageViews.filter(p => p.service !== 'Other').map((p) => p.visits), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AI Conversion Analysis</h1>
          </div>
          <p className="text-sm text-gray-500 ml-13">
            DeepSeek analyses your funnel data and tells you exactly what&apos;s breaking conversions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 bg-white rounded-xl px-3 py-2 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Configure
          </button>
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-violet-100"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? 'Analysing…' : data ? 'Re-run Analysis' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Google Search Console Metrics (last 28 days)
          </p>
          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Impressions</label>
              <input
                type="number"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Clicks</label>
              <input
                type="number"
                value={clicks}
                onChange={(e) => setClicks(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex items-end">
              <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 w-36">
                CTR: {impressions && clicks ? ((Number(clicks) / Number(impressions)) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 flex items-start gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center mb-5">
            <Brain className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to analyse your funnel</h2>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            Click &ldquo;Run Analysis&rdquo; to pull live data from your database and get AI-powered conversion insights
          </p>
          <button
            onClick={run}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-violet-100"
          >
            <Brain className="w-4 h-4" />
            Run Analysis Now
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-24 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded" />)}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-sm text-gray-500 font-medium">DeepSeek is analysing your data…</span>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-6">

          {/* Top KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="GSC Impressions (28d)"
              value={data.googleMetrics.impressions.toLocaleString()}
              sub="From Google Search"
              trend="up"
            />
            <StatCard
              label="GSC Clicks (28d)"
              value={data.googleMetrics.clicks.toLocaleString()}
              sub={`${data.googleMetrics.ctr}% CTR`}
              trend="neutral"
            />
            <StatCard
              label="Total Inquiries (30d)"
              value={Object.values(data.rawData.quotes).reduce((s, q) => s + q.last30d, 0)}
              sub={`From ${Object.values(data.rawData.quotes).reduce((s, q) => s + q.total, 0)} all-time`}
              trend="down"
            />
            <StatCard
              label="Click → Inquiry Rate"
              value={(() => {
                const totalInq = Object.values(data.rawData.quotes).reduce((s, q) => s + q.last30d, 0);
                const rate = data.googleMetrics.clicks > 0 ? ((totalInq / data.googleMetrics.clicks) * 100).toFixed(2) : '0.00';
                return `${rate}%`;
              })()}
              sub="Target: 3–5%"
              trend="down"
            />
          </div>

          {/* Two-column: quotes data + page views */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Quote requests by service */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Inquiries by Service (last 30 days)</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(data.rawData.quotes).map(([key, q]) => {
                  const cfg = SERVICE_CONFIG[key];
                  const isLeading = key === 'bike' || key === 'self_drive';
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cfg?.icon || '📦'}</span>
                          <span className="text-sm font-medium text-gray-700">{cfg?.label || key}</span>
                          {isLeading && (
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">WORKING</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLeading ? 'text-green-700' : 'text-red-600'}`}>
                            {q.last30d}
                          </span>
                          <span className="text-xs text-gray-400">/ {q.total} total</span>
                        </div>
                      </div>
                      <MiniBar
                        value={q.last30d}
                        max={quoteMax}
                        color={isLeading ? 'bg-green-500' : 'bg-red-300'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Page views by service */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <ArrowUpRight className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Page Views vs Inquiries Gap</h2>
              </div>
              <div className="space-y-4">
                {data.rawData.pageViews
                  .filter((p) => p.service !== 'Other')
                  .map((pv) => {
                    const svcKey = Object.entries(SERVICE_CONFIG).find(([, v]) => v.label === pv.service)?.[0];
                    const inqCount = svcKey ? (data.rawData.quotes[svcKey]?.last30d || 0) : 0;
                    const convRate = pv.visits > 0 ? ((inqCount / pv.visits) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={pv.service}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{pv.service}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-400">{pv.visits} views</span>
                            <span className={`font-bold ${Number(convRate) >= 2 ? 'text-green-600' : 'text-red-500'}`}>
                              {convRate}% conv
                            </span>
                          </div>
                        </div>
                        <MiniBar value={pv.visits} max={pvMax} color="bg-blue-300" />
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                * Conversion = inquiries ÷ page views (30 days)
              </p>
            </div>
          </div>

          {/* AI Analysis Summary */}
          {data.analysis.summary && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">DeepSeek AI Executive Summary</p>
                  <p className="text-gray-800 text-sm leading-relaxed font-medium">{data.analysis.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Drop-off Reasons */}
          {data.analysis.topDropoffReasons && data.analysis.topDropoffReasons.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-gray-800">Top Drop-off Reasons</h2>
              </div>
              <div className="space-y-4">
                {data.analysis.topDropoffReasons.map((r) => (
                  <div key={r.rank} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-sm font-bold text-red-600">
                      {r.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-semibold text-gray-800">{r.reason}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${IMPACT_CONFIG[r.impact]?.cls || IMPACT_CONFIG.medium.cls}`}>
                          {IMPACT_CONFIG[r.impact]?.label || r.impact}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{r.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Recommendations */}
          {data.analysis.serviceRecommendations && data.analysis.serviceRecommendations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-800">Service-wise Fix Roadmap</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.analysis.serviceRecommendations.map((rec, i) => {
                  const svcKey = Object.entries(SERVICE_CONFIG).find(
                    ([, v]) => v.label.toLowerCase() === rec.service.toLowerCase()
                  )?.[0];
                  const cfg = svcKey ? SERVICE_CONFIG[svcKey] : null;
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${cfg?.bg || 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg?.icon || '📦'}</span>
                          <span className={`text-sm font-bold ${cfg?.color || 'text-gray-700'}`}>{rec.service}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />{rec.effort}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />{rec.expectedLift}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{rec.fix}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {data.analysis.quickWins && data.analysis.quickWins.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-800">Quick Wins — Next 7 Days</h2>
              </div>
              <div className="space-y-3">
                {data.analysis.quickWins.map((win, i) => {
                  const ownerCfg = OWNER_CONFIG[win.owner] || OWNER_CONFIG.dev;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{win.action}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ownerCfg.cls}`}>
                            {ownerCfg.label}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{win.timeline}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Priority scores */}
          {data.analysis.priorityScore && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Priority Score (1–10 urgency)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.analysis.priorityScore).map(([key, score]) => {
                  const cfg = SERVICE_CONFIG[key] || SERVICE_CONFIG[Object.keys(SERVICE_CONFIG).find(k => k.includes(key)) || 'bike'];
                  const pct = (score / 10) * 100;
                  const color = score >= 8 ? 'bg-red-500' : score >= 6 ? 'bg-amber-500' : 'bg-green-500';
                  return (
                    <div key={key} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.9" fill="none"
                            stroke={score >= 8 ? '#ef4444' : score >= 6 ? '#f59e0b' : '#22c55e'}
                            strokeWidth="3"
                            strokeDasharray={`${pct} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">{score}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${score >= 8 ? 'text-red-600' : score >= 6 ? 'text-amber-600' : 'text-green-600'}`}>
                        {score >= 8 ? 'Critical' : score >= 6 ? 'High' : 'Moderate'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-400 pb-4">
            <span>Analysis generated at {new Date(data.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" /> Powered by DeepSeek AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
