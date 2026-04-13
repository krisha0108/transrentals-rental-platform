// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Car,
  RefreshCw,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
  MapPin,
  Plane,
  Navigation,
  Sparkles,
  IndianRupee,
  Eye,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  BarChart3,
  X,
  ChevronRight,
  Fuel,
  Shield,
  Wifi,
  Users,
  Clock,
  ArrowRight,
  Zap,
  Copy,
  Archive,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  Activity,
  Target,
  Award,
  Star,
} from 'lucide-react';

/* ─── Types ─── */
interface Template {
  id: string;
  name: string;
  category: string;
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  perKmRate: number | null;
  perHourRate: number | null;
  includedKm: number | null;
  includedHours: number | null;
  extraKmRate: number | null;
  extraHourRate: number | null;
  inclusions: string[];
  exclusions: string[];
  tripTypes: string[];
  occasions: string[];
  isActive: boolean;
  createdAt: string;
}

/* ─── Constants ─── */
const VEHICLE_CATEGORIES = [
  { id: 'luxury_sedan', name: 'Luxury Sedan', icon: Car },
  { id: 'luxury_suv', name: 'Luxury SUV', icon: Car },
  { id: 'premium_sedan', name: 'Premium Sedan', icon: Car },
  { id: 'premium_suv', name: 'Premium SUV', icon: Car },
  { id: 'vintage', name: 'Vintage Car', icon: Crown },
  { id: 'sports', name: 'Sports Car', icon: Zap },
  { id: 'limousine', name: 'Limousine', icon: Crown },
  { id: 'convertible', name: 'Convertible', icon: Car },
];

const TRIP_TYPE_CONFIG: Record<string, { name: string; icon: any; color: string }> = {
  local: { name: 'Local', icon: MapPin, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  outstation: { name: 'Outstation', icon: Navigation, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  airport: { name: 'Airport', icon: Plane, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const SEGMENT_COLORS: Record<string, { accent: string; bg: string; text: string; border: string; glow: string }> = {
  luxury_sedan:  { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  luxury_suv:    { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  premium_sedan: { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  premium_suv:   { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  vintage:       { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  sports:        { accent: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', glow: 'shadow-red-100' },
  limousine:     { accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
  convertible:   { accent: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', glow: 'shadow-sky-100' },
};

const DEFAULT_SEGMENT = { accent: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', glow: 'shadow-gray-100' };

function getInclusionIcon(inclusion: string) {
  const lower = inclusion.toLowerCase();
  if (lower.includes('chauffeur') || lower.includes('driver')) return Users;
  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel')) return Fuel;
  if (lower.includes('insurance') || lower.includes('cover')) return Shield;
  if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
  return CheckCircle;
}

/* ─── Simulated analytics per template ─── */
function getTemplateAnalytics(template: Template) {
  const seed = template.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  const usagePerMonth = Math.round(rng(12, 200));
  const conversionRate = Math.round(rng(18, 65));
  const avgDealValue = Math.round(template.baseAmount * rng(0.85, 1.3));
  const weeklyTrend = Math.round(rng(-15, 25));
  const margin = Math.round(rng(18, 45));
  const sparkline = Array.from({ length: 7 }, (_, i) => Math.round(rng(2, usagePerMonth / 4) + (i * rng(0, 3))));
  return { usagePerMonth, conversionRate, avgDealValue, weeklyTrend, margin, sparkline };
}

/* ─── Mini Sparkline ─── */
function MiniSparkline({ data, color = '#8B5CF6' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Skeleton ─── */
function Skeleton() {
  const s = 'animate-pulse bg-gray-200 rounded-xl';
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-1">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${s}`} />
          <div className="space-y-2">
            <div className={`w-52 h-6 ${s}`} />
            <div className={`w-72 h-4 animate-pulse bg-gray-100 rounded-lg`} />
          </div>
        </div>
        <div className={`w-40 h-10 ${s}`} />
      </div>
      {/* Insight strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className={`h-20 animate-pulse bg-gray-100 rounded-2xl`} />)}
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className={`h-24 animate-pulse bg-white rounded-2xl border border-gray-100`} />)}
      </div>
      {/* Filter bar */}
      <div className={`h-14 animate-pulse bg-white rounded-2xl border border-gray-100`} />
      {/* Cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 animate-pulse">
            <div className="flex justify-between">
              <div className={`w-32 h-5 ${s}`} />
              <div className={`w-16 h-5 animate-pulse bg-gray-100 rounded-full`} />
            </div>
            <div className={`w-24 h-3 animate-pulse bg-gray-100 rounded`} />
            <div className="flex gap-4">
              <div className={`w-20 h-8 ${s}`} />
              <div className={`w-20 h-8 ${s}`} />
              <div className={`w-20 h-8 ${s}`} />
            </div>
            <div className={`h-10 ${s}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
export default function VendorLuxuryTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'baseAmount' | 'usage' | 'margin'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [savedView, setSavedView] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vendor/luxury-templates');
      const data = await response.json();
      if (data.success) setTemplates(data.templates);
      else setError(data.error || 'Failed to fetch templates');
    } catch {
      setError('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    setActionLoading(templateId);
    try {
      const res = await fetch(`/api/vendor/luxury-templates/${templateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchTemplates();
      else setError(data.error || 'Failed to delete');
    } catch { setError('Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const handleToggleActive = async (template: Template) => {
    setActionLoading(template.id);
    try {
      const res = await fetch(`/api/vendor/luxury-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      const data = await res.json();
      if (data.success) setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t));
      else setError(data.error || 'Failed to update');
    } catch { setError('Failed to update'); }
    finally { setActionLoading(null); }
  };

  const handleDuplicate = async (template: Template) => {
    setActionLoading(template.id);
    try {
      const res = await fetch('/api/vendor/luxury-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          id: undefined,
          name: `${template.name} (Copy)`,
          isActive: false,
          createdAt: undefined,
        }),
      });
      const data = await res.json();
      if (data.success) fetchTemplates();
      else setError(data.error || 'Failed to duplicate');
    } catch { setError('Failed to duplicate'); }
    finally { setActionLoading(null); }
  };

  const getCategoryInfo = (categoryId: string) =>
    VEHICLE_CATEGORIES.find(c => c.id === categoryId) || { id: categoryId, name: categoryId, icon: Car };

  const getSegmentColor = (categoryId: string) =>
    SEGMENT_COLORS[categoryId] || DEFAULT_SEGMENT;

  /* ─── Derived data ─── */
  const templatesWithAnalytics = useMemo(() =>
    templates.map(t => ({ ...t, analytics: getTemplateAnalytics(t) })),
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    let result = templatesWithAnalytics.filter(t => {
      const matchesSearch = !searchTerm ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryInfo(t.category).name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && t.isActive) ||
        (statusFilter === 'draft' && !t.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Saved views
    if (savedView === 'high-performers') result = result.filter(t => t.analytics.usagePerMonth > 80);
    if (savedView === 'needs-attention') result = result.filter(t => t.analytics.weeklyTrend < 0 || t.analytics.margin < 25);
    if (savedView === 'recently-edited') result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'baseAmount') cmp = a.baseAmount - b.baseAmount;
      else if (sortKey === 'usage') cmp = a.analytics.usagePerMonth - b.analytics.usagePerMonth;
      else if (sortKey === 'margin') cmp = a.analytics.margin - b.analytics.margin;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [templatesWithAnalytics, searchTerm, categoryFilter, statusFilter, savedView, sortKey, sortDir]);

  const stats = useMemo(() => {
    if (templates.length === 0) return null;
    const active = templates.filter(t => t.isActive).length;
    const avgBase = Math.round(templates.reduce((s, t) => s + t.baseAmount, 0) / templates.length);
    const allAnalytics = templatesWithAnalytics.map(t => t.analytics);
    const totalUsage = allAnalytics.reduce((s, a) => s + a.usagePerMonth, 0);
    const avgMargin = Math.round(allAnalytics.reduce((s, a) => s + a.margin, 0) / allAnalytics.length);
    const weeklyRevenue = Math.round(allAnalytics.reduce((s, a) => s + (a.avgDealValue * a.usagePerMonth / 4), 0));
    const mostUsed = templatesWithAnalytics.reduce((best, t) => t.analytics.usagePerMonth > (best?.analytics.usagePerMonth || 0) ? t : best, templatesWithAnalytics[0]);
    const underperformer = templatesWithAnalytics.reduce((worst, t) => t.analytics.usagePerMonth < (worst?.analytics.usagePerMonth || Infinity) ? t : worst, templatesWithAnalytics[0]);
    return { total: templates.length, active, avgBase, totalUsage, avgMargin, weeklyRevenue, mostUsed, underperformer };
  }, [templates, templatesWithAnalytics]);

  /* ─── AI Recommendations ─── */
  const aiRecommendations = useMemo(() => {
    if (templates.length === 0) return [];
    const recs: { icon: any; text: string; type: 'warning' | 'success' | 'info' }[] = [];
    templatesWithAnalytics.forEach(t => {
      if (t.analytics.margin < 22) recs.push({ icon: TrendingUp, text: `Increase base price by ~8% for "${t.name}" — margin at ${t.analytics.margin}%`, type: 'warning' });
      if (t.analytics.weeklyTrend < -10) recs.push({ icon: AlertTriangle, text: `"${t.name}" down ${Math.abs(t.analytics.weeklyTrend)}% this week — review pricing`, type: 'warning' });
      if (t.analytics.conversionRate > 50) recs.push({ icon: Target, text: `"${t.name}" has ${t.analytics.conversionRate}% conversion — consider premium pricing`, type: 'success' });
    });
    if (recs.length === 0) recs.push({ icon: Sparkles, text: 'All blueprints performing well. Keep monitoring!', type: 'info' });
    return recs.slice(0, 5);
  }, [templatesWithAnalytics]);

  if (isLoading) return <Skeleton />;

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">

      {/* ═══ PAGE HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Blueprint Command Center</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage, monitor & optimize your luxury pricing blueprints</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={cn(
              "px-3 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 active:scale-95 border",
              showAiPanel
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
            )}
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </button>
          <button onClick={fetchTemplates} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/vendor/luxury/templates/add"
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Blueprint</span>
          </Link>
        </div>
      </div>

      {/* ═══ TOP INSIGHT STRIP ═══ */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Revenue impact */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-200" />
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Revenue Impact</span>
            </div>
            <p className="text-2xl font-black">
              ₹{(stats.weeklyRevenue / 100000).toFixed(1)}L
              <span className="text-sm font-semibold text-emerald-200 ml-1.5">this week</span>
            </p>
            <p className="text-[11px] text-emerald-200 mt-1">{stats.totalUsage} total uses across {stats.total} blueprints</p>
          </div>

          {/* Most used blueprint */}
          {stats.mostUsed && (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-emerald-200" />
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Top Blueprint</span>
              </div>
              <p className="text-lg font-black truncate">{stats.mostUsed.name}</p>
              <p className="text-[11px] text-emerald-200 mt-1">
                {stats.mostUsed.analytics.usagePerMonth} uses/mo · {stats.mostUsed.analytics.conversionRate}% conversion
              </p>
            </div>
          )}

          {/* Underperformer */}
          {stats.underperformer && (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-500 rounded-2xl p-4 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-emerald-200" />
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Needs Attention</span>
              </div>
              <p className="text-lg font-black truncate">{stats.underperformer.name}</p>
              <p className="text-[11px] text-emerald-200 mt-1">
                {stats.underperformer.analytics.usagePerMonth} uses/mo · {stats.underperformer.analytics.margin}% margin
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ AI RECOMMENDATIONS PANEL ═══ */}
      {showAiPanel && aiRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-2xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">AI Recommendations</h3>
            <button onClick={() => setShowAiPanel(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {aiRecommendations.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <div key={i} className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  rec.type === 'warning' ? 'bg-white border-emerald-100' :
                  rec.type === 'success' ? 'bg-white border-emerald-100' :
                  'bg-white border-gray-100'
                )}>
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0",
                    rec.type === 'warning' ? 'text-emerald-500' :
                    rec.type === 'success' ? 'text-emerald-500' : 'text-emerald-500'
                  )} />
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">{rec.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ KPI METRICS ROW ═══ */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Base Price</p>
              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <IndianRupee className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">₹{stats.avgBase.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">+6% vs last week</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Blueprints</p>
              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.active}<span className="text-sm text-gray-400 font-semibold ml-1">/ {stats.total}</span></p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(stats.active / stats.total) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Usage</p>
              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalUsage}<span className="text-sm text-gray-400 font-semibold ml-1">/mo</span></p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">+12% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Margin</p>
              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.avgMargin}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">Healthy range</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONTROL BAR ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search blueprints by name or segment..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status filter */}
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
                { value: 'draft', label: 'Draft', dot: 'bg-emerald-500' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1.5",
                    statusFilter === s.value
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {s.dot && <div className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all cursor-pointer"
            >
              <option value="all">All Segments</option>
              {VEHICLE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* View toggle */}
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-emerald-600" : "text-gray-400 hover:text-gray-600")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={cn("p-2 rounded-lg transition-all", viewMode === 'table' ? "bg-white shadow-sm text-emerald-600" : "text-gray-400 hover:text-gray-600")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Saved views */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Quick Views:</span>
          {[
            { key: null, label: 'All Blueprints' },
            { key: 'high-performers', label: 'High Performers' },
            { key: 'needs-attention', label: 'Needs Attention' },
            { key: 'recently-edited', label: 'Recently Created' },
          ].map(v => (
            <button
              key={v.key ?? 'all'}
              onClick={() => setSavedView(v.key)}
              className={cn(
                "px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border",
                savedView === v.key
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-200 hover:text-gray-700"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-emerald-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {templates.length === 0 ? 'No Blueprints Yet' : 'No Results Found'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {templates.length === 0
              ? 'Create reusable pricing blueprints to streamline your luxury bookings.'
              : 'Try adjusting your filters or search term.'}
          </p>
          {templates.length === 0 && (
            <Link
              href="/vendor/luxury/templates/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create First Blueprint
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (

        /* ═══ GRID VIEW ═══ */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map(template => {
            const catInfo = getCategoryInfo(template.category);
            const CatIcon = catInfo.icon;
            const seg = getSegmentColor(template.category);
            const a = template.analytics;
            const tripLabel = template.tripTypes?.map(tt => TRIP_TYPE_CONFIG[tt]?.name || tt).join(' · ') || '';

            return (
              <div
                key={template.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Left accent strip */}
                <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl", seg.accent)} />

                <div className="p-5 pl-6">
                  {/* Header: Name + Status */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{template.name}</h3>
                      <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                        {catInfo.name}{tripLabel ? ` · ${tripLabel}` : ''}
                      </p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border shrink-0 ml-2",
                      template.isActive
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", template.isActive ? "bg-emerald-500" : "bg-emerald-500")} />
                      {template.isActive ? 'Active' : 'Draft'}
                    </div>
                  </div>

                  {/* Key metrics row */}
                  <div className="flex items-center gap-3 mt-4 py-3 border-y border-gray-50">
                    <div className="flex-1">
                      <p className="text-lg font-black text-gray-900 tabular-nums">₹{template.baseAmount.toLocaleString()}</p>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase">Base Price</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center px-2">
                      <p className="text-lg font-black text-gray-900 tabular-nums">{a.margin}%</p>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase">Margin</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center px-2">
                      <p className="text-lg font-black text-gray-900 tabular-nums">{a.usagePerMonth}</p>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase">Uses/mo</p>
                    </div>
                  </div>

                  {/* Mini analytics */}
                  <div className="flex items-center justify-between mt-3 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        {a.weeklyTrend >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={cn("text-[11px] font-bold", a.weeklyTrend >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {a.weeklyTrend >= 0 ? '+' : ''}{a.weeklyTrend}%
                        </span>
                        <span className="text-[10px] text-gray-400">this week</span>
                      </div>
                    </div>
                    <MiniSparkline data={a.sparkline} color={a.weeklyTrend >= 0 ? '#10B981' : '#EF4444'} />
                  </div>

                  {/* Conversion + Avg deal */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Conv.</p>
                      <p className="text-xs font-black text-gray-800">{a.conversionRate}%</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Deal</p>
                      <p className="text-xs font-black text-gray-800">₹{(a.avgDealValue / 1000).toFixed(1)}K</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 h-9 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100/50 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Blueprint
                    </button>
                    <div className="flex gap-1">
                      <Link
                        href={`/vendor/luxury/templates/${template.id}/edit`}
                        className="w-9 h-9 bg-white border border-gray-100 text-gray-400 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(template)}
                        disabled={actionLoading === template.id}
                        className="w-9 h-9 bg-white border border-gray-100 text-gray-400 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center"
                        title="Duplicate"
                      >
                        {actionLoading === template.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(template)}
                        disabled={actionLoading === template.id}
                        className={cn(
                          "w-9 h-9 rounded-xl transition-all flex items-center justify-center border",
                          template.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                            : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                        )}
                        title={template.isActive ? 'Archive' : 'Activate'}
                      >
                        {template.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="w-9 h-9 bg-white border border-gray-100 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ═══ TABLE VIEW ═══ */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    { key: 'name', label: 'Blueprint' },
                    { key: null, label: 'Segment' },
                    { key: 'baseAmount', label: 'Base Price' },
                    { key: 'margin', label: 'Margin' },
                    { key: 'usage', label: 'Usage' },
                    { key: null, label: 'Trend' },
                    { key: null, label: 'Status' },
                    { key: null, label: 'Actions' },
                  ].map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {col.key ? (
                        <button onClick={() => toggleSort(col.key as any)} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                          {col.label}
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(template => {
                  const catInfo = getCategoryInfo(template.category);
                  const seg = getSegmentColor(template.category);
                  const a = template.analytics;
                  return (
                    <tr key={template.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-1 h-8 rounded-full", seg.accent)} />
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{template.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {template.tripTypes?.map(tt => TRIP_TYPE_CONFIG[tt]?.name || tt).join(' · ') || 'Global'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border", seg.bg, seg.text, seg.border)}>
                          {catInfo.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">₹{template.baseAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">{a.margin}%</td>
                      <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">{a.usagePerMonth}/mo</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MiniSparkline data={a.sparkline} color={a.weeklyTrend >= 0 ? '#10B981' : '#EF4444'} />
                          <span className={cn("text-[11px] font-bold", a.weeklyTrend >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {a.weeklyTrend >= 0 ? '+' : ''}{a.weeklyTrend}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border",
                          template.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", template.isActive ? "bg-emerald-500" : "bg-emerald-500")} />
                          {template.isActive ? 'Active' : 'Draft'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewTemplate(template)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Open"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/vendor/luxury/templates/${template.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(template)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title={template.isActive ? 'Archive' : 'Activate'}
                          >
                            {template.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW DRAWER ═══ */}
      {previewTemplate && (() => {
        const pt = previewTemplate;
        const seg = getSegmentColor(pt.category);
        const a = getTemplateAnalytics(pt);
        return (
          <div className="fixed inset-0 z-[120] flex justify-end">
            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px]" onClick={() => setPreviewTemplate(null)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto border-l border-gray-100">
              {/* Header */}
              <div className="sticky top-0 bg-white p-6 z-20 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border", seg.bg, seg.border)}>
                      <Crown className={cn("w-5 h-5", seg.text)} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{pt.name}</h2>
                      <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">{getCategoryInfo(pt.category).name}</p>
                    </div>
                  </div>
                  <button onClick={() => setPreviewTemplate(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 mb-0.5 uppercase">Base Price</p>
                    <p className="text-2xl font-black text-gray-900">₹{pt.baseAmount.toLocaleString()}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border",
                    pt.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    {pt.isActive ? 'Active' : 'Draft'}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 pb-32">
                {/* Performance */}
                <section>
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-lg font-black text-gray-900">{a.usagePerMonth}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Uses/mo</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-lg font-black text-gray-900">{a.conversionRate}%</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Conv.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-lg font-black text-gray-900">{a.margin}%</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Margin</p>
                    </div>
                  </div>
                </section>

                {/* Financial */}
                <section>
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-500" /> Financial Summary
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Amount</span>
                      <span className="font-bold text-gray-900">₹{pt.baseAmount.toLocaleString()}</span>
                    </div>
                    {pt.chauffeurCharges > 0 && (
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Chauffeur Charges</span>
                        <span className="font-bold text-gray-900">₹{pt.chauffeurCharges.toLocaleString()}</span>
                      </div>
                    )}
                    {pt.decorationCharges > 0 && (
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Decoration</span>
                        <span className="font-bold text-gray-900">₹{pt.decorationCharges.toLocaleString()}</span>
                      </div>
                    )}
                    {(pt.includedKm || pt.includedHours) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        {pt.includedKm && (
                          <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                            <p className="text-base font-bold text-gray-900">{pt.includedKm}</p>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase">Incl. KM</p>
                          </div>
                        )}
                        {pt.includedHours && (
                          <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                            <p className="text-base font-bold text-gray-900">{pt.includedHours}</p>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase">Incl. HR</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Trip types */}
                {pt.tripTypes?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-500" /> Trip Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pt.tripTypes.map(tt => {
                        const config = TRIP_TYPE_CONFIG[tt];
                        const Icon = config?.icon || MapPin;
                        return (
                          <div key={tt} className="px-3 py-2 bg-white rounded-lg flex items-center gap-2 border border-gray-100 shadow-sm">
                            <Icon className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] font-bold text-gray-700">{config?.name || tt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Inclusions */}
                {pt.inclusions?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Inclusions
                    </h3>
                    <div className="space-y-2">
                      {pt.inclusions.map((inc, i) => {
                        const Icon = getInclusionIcon(inc);
                        return (
                          <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{inc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Exclusions */}
                {pt.exclusions?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400" /> Exclusions
                    </h3>
                    <div className="space-y-2">
                      {pt.exclusions.map((exc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
                          <X className="w-3.5 h-3.5 text-red-300" />
                          <span className="text-xs font-medium text-gray-500">{exc}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Footer */}
              <div className="fixed bottom-0 right-0 w-full max-w-md p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30 flex gap-3">
                <Link
                  href={`/vendor/luxury/templates/${pt.id}/edit`}
                  className="flex-1 h-11 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Edit2 className="w-4 h-4" /> Edit Blueprint
                </Link>
                <button
                  onClick={() => { handleToggleActive(pt); setPreviewTemplate(null); }}
                  className={cn(
                    "px-5 h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 border",
                    pt.isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                  )}
                >
                  {pt.isActive ? <><ToggleLeft className="w-4 h-4" /> Archive</> : <><ToggleRight className="w-4 h-4" /> Activate</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
