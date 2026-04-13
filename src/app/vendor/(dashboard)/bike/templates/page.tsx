'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BikeIcon as Bike,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  ChevronDown,
  Power,
  Layers,
  IndianRupee,
  Shield,
  ScrollText,
  Zap,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Fade-in on scroll ──
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity .5s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const BIKE_CATEGORIES = [
  { id: 'commuter', name: 'Commuter' },
  { id: 'sports', name: 'Sports' },
  { id: 'touring', name: 'Touring' },
  { id: 'cruiser', name: 'Cruiser' },
  { id: 'scooter', name: 'Scooter' },
  { id: 'electric', name: 'Electric' },
];

interface BikeTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  bikeTypes?: string[];
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  dailyRateHint?: number;
  weeklyRateHint?: number;
  monthlyRateHint?: number;
  securityDepositHint?: number;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

export default function VendorBikeTemplatesPage() {
  const [templates, setTemplates] = useState<BikeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      const response = await fetch(`/api/vendor/bike-templates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getCategoryLabel = (category: string) => {
    return BIKE_CATEGORIES.find((t) => t.id === category)?.name || category;
  };

  const toggleActive = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    try {
      const response = await fetch(`/api/vendor/bike-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to update template');
      }
    } catch (error) {
      alert('Failed to update template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/vendor/bike-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  // ── Skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100" />
            <div className="space-y-1.5">
              <div className="h-5 w-44 bg-gray-200 rounded-md" />
              <div className="h-3 w-56 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-9 w-36 bg-emerald-100 rounded-xl" />
        </div>
        {/* Filters */}
        <div className="flex gap-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'w-24 bg-emerald-100' : 'w-20 bg-gray-100'}`} />
          ))}
        </div>
        {/* Cards */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-64 bg-gray-50 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
              <div className="h-8 w-20 bg-gray-100 rounded-lg" />
              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/25 overflow-hidden group/icon cursor-default">
              <div className="absolute inset-0 -translate-x-full group-hover/icon:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute inset-0 rounded-xl animate-[iconPulse_3s_ease-in-out_infinite] bg-emerald-400/20" />
              <FileSpreadsheet className="w-5 h-5 text-white relative z-10 animate-[iconFloat_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Quote Templates</h1>
              <p className="text-xs text-gray-400 mt-0.5">Create reusable templates for quick quotes</p>
            </div>
          </div>
          <Link
            href="/vendor/bike/templates/create"
            className="inline-flex items-center gap-2 h-9 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 shadow-sm active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      </FadeIn>

      {/* ── Category Filter ── */}
      <FadeIn delay={60}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200',
              categoryFilter === 'all'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            )}
          >
            All Templates
          </button>
          {BIKE_CATEGORIES.map((type) => (
            <button
              key={type.id}
              onClick={() => setCategoryFilter(type.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200',
                categoryFilter === type.id
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              )}
            >
              {type.name}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* ── Stats Bar ── */}
      {templates.length > 0 && (
        <FadeIn delay={100}>
          <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-900">{templates.length}</span>
              <span className="text-xs text-gray-400">templates</span>
            </div>
            <div className="w-px h-3.5 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-gray-900">{templates.filter(t => t.isActive).length}</span>
              <span className="text-xs text-gray-400">active</span>
            </div>
            <div className="w-px h-3.5 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-900">{templates.reduce((s, t) => s + t.usageCount, 0)}</span>
              <span className="text-xs text-gray-400">total uses</span>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Templates List ── */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <FadeIn delay={120}>
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-7 h-7 text-emerald-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">No templates found</h3>
              <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">Create templates to speed up your quote process</p>
              <Link
                href="/vendor/bike/templates/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.97] transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Your First Template
              </Link>
            </div>
          </FadeIn>
        ) : (
          templates.map((template, i) => (
            <FadeIn key={template.id} delay={120 + i * 50}>
              <div
                className={cn(
                  'bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-md group',
                  template.isActive ? 'border-gray-100 hover:border-gray-200' : 'border-gray-100 opacity-70 hover:opacity-100'
                )}
              >
                {/* Main Row */}
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div className={cn(
                      'w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
                      template.isActive ? 'bg-gradient-to-br from-emerald-50 to-emerald-50' : 'bg-gray-100'
                    )}>
                      <Bike className={cn('w-5.5 h-5.5', template.isActive ? 'text-emerald-500' : 'text-gray-400')} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-base font-bold text-gray-900 truncate">{template.name}</h3>
                        {template.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">
                            <Star className="w-2.5 h-2.5" /> Default
                          </span>
                        )}
                        {!template.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium text-gray-500">{getCategoryLabel(template.category)}</span>
                        <span className="text-gray-200">·</span>
                        <span>Used {template.usageCount} times</span>
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-400 mt-1.5 line-clamp-1">{template.description}</p>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                      className={cn(
                        'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200',
                        expandedId === template.id
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      )}
                    >
                      <ChevronDown className={cn(
                        'w-4 h-4 transition-transform duration-300',
                        expandedId === template.id && 'rotate-180'
                      )} />
                    </button>
                  </div>

                  {/* ── Rate Pills (always visible) ── */}
                  {(template.dailyRateHint || template.weeklyRateHint || template.securityDepositHint) && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-[54px]">
                      {template.dailyRateHint && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600">
                          <IndianRupee className="w-2.5 h-2.5" />{template.dailyRateHint.toLocaleString()}/day
                        </span>
                      )}
                      {template.weeklyRateHint && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600">
                          <IndianRupee className="w-2.5 h-2.5" />{template.weeklyRateHint.toLocaleString()}/week
                        </span>
                      )}
                      {template.monthlyRateHint && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600">
                          <IndianRupee className="w-2.5 h-2.5" />{template.monthlyRateHint.toLocaleString()}/month
                        </span>
                      )}
                      {template.securityDepositHint && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600">
                          <Shield className="w-2.5 h-2.5" />₹{template.securityDepositHint.toLocaleString()} deposit
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Expanded Details ── */}
                <div className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  expandedId === template.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}>
                  <div className="px-5 pb-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                      {/* Inclusions */}
                      {template.inclusions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Inclusions ({template.inclusions.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {template.inclusions.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exclusions */}
                      {template.exclusions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                            <XCircle className="w-3 h-3 text-red-400" />
                            Exclusions ({template.exclusions.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {template.exclusions.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Terms */}
                      {template.termsConditions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                            <ScrollText className="w-3 h-3 text-gray-400" />
                            Terms ({template.termsConditions.length})
                          </h4>
                          <div className="space-y-1.5">
                            {template.termsConditions.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-500">
                                <span className="text-[11px] text-gray-300 font-mono mt-0.5 shrink-0">{idx + 1}.</span>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Actions Bar ── */}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2">
                  <Link
                    href={`/vendor/bike/templates/${template.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-[0.97] transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleActive(template.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg active:scale-[0.97] transition-all',
                      template.isActive
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    )}
                  >
                    {template.isActive ? (
                      <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="w-3.5 h-3.5" /> Activate</>
                    )}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.97] transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </FadeIn>
          ))
        )}
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes iconPulse {
          0%, 70%, 100% { transform: scale(1); opacity: 0; }
          20% { transform: scale(1.3); opacity: 0.25; }
          40% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
