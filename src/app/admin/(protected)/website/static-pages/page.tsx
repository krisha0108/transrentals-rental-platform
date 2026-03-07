'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ExternalLink, Check, RotateCcw, ChevronDown, ChevronUp,
  Globe, FileText, Car, Bike, Bus, Truck, Package, Wrench, Crown, CarTaxiFront,
} from 'lucide-react';

// ── Icon map ───────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Car: <Car className="w-5 h-5" />,
  Bike: <Bike className="w-5 h-5" />,
  CarTaxiFront: <CarTaxiFront className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
  Bus: <Bus className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceStat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  locationCount: number;
  routeCount: number;
  airportCount: number;
  total: number;
}

interface OverviewData {
  totalPages: number;
  totalServicePages: number;
  staticCount: number;
  services: ServiceStat[];
}

interface StaticPageRow {
  pageId: string;
  url: string;
  label?: string;
  templateTitle: string;
  templateDescription: string;
  templateKeywords: string;
  override: { metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null } | null;
}

interface EditState {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

// ── Static page row ────────────────────────────────────────────────────────────
function StaticPageRow({ row, onSave, onReset }: {
  row: StaticPageRow;
  onSave: (pageId: string, data: EditState) => Promise<void>;
  onReset: (pageId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    metaTitle: row.override?.metaTitle || row.templateTitle,
    metaDescription: row.override?.metaDescription || row.templateDescription,
    metaKeywords: row.override?.metaKeywords || row.templateKeywords,
  });

  const hasOverride = !!row.override;
  const displayTitle = row.override?.metaTitle || row.templateTitle || row.label || row.pageId;

  const handleSave = async () => {
    setSaving(true);
    await onSave(row.pageId, edit);
    setSaving(false);
    setOpen(false);
  };

  const handleReset = async () => {
    if (!confirm('Remove custom meta and revert to template?')) return;
    setSaving(true);
    await onReset(row.pageId);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className={`border rounded-lg mb-2 ${hasOverride ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => {
          setEdit({
            metaTitle: row.override?.metaTitle || row.templateTitle,
            metaDescription: row.override?.metaDescription || row.templateDescription,
            metaKeywords: row.override?.metaKeywords || row.templateKeywords,
          });
          setOpen(!open);
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasOverride && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Custom</span>
            )}
            <span className="font-medium text-gray-900 text-sm truncate">{displayTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 truncate">{row.url}</span>
            {row.label && <span className="text-xs text-gray-400">• {row.label}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://transrentals.in${row.url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {hasOverride && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-1">
              <p className="font-medium text-gray-600">Template (default):</p>
              <p>Title: {row.templateTitle}</p>
              <p>Desc: {row.templateDescription}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Meta Title <span className="text-gray-400">({edit.metaTitle.length}/70)</span>
            </label>
            <input
              value={edit.metaTitle}
              onChange={(e) => setEdit({ ...edit, metaTitle: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                edit.metaTitle.length > 70 ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Meta Description <span className="text-gray-400">({edit.metaDescription.length}/160)</span>
            </label>
            <textarea
              value={edit.metaDescription}
              onChange={(e) => setEdit({ ...edit, metaDescription: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                edit.metaDescription.length > 160 ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
            <input
              value={edit.metaKeywords}
              onChange={(e) => setEdit({ ...edit, metaKeywords: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Google Preview</p>
            <p className="text-blue-700 text-sm font-medium leading-tight line-clamp-1">{edit.metaTitle || row.templateTitle}</p>
            <p className="text-green-700 text-xs mt-0.5">transrentals.in{row.url}</p>
            <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{edit.metaDescription || row.templateDescription}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {hasOverride && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Revert to template
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service card ───────────────────────────────────────────────────────────────
function ServiceCard({ service }: { service: ServiceStat }) {
  const icon = ICON_MAP[service.icon || ''] || <Car className="w-5 h-5" />;
  return (
    <Link
      href={`/admin/services/${service.slug}/pages`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
          {icon}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition" />
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{service.name}</p>
      <p className="text-2xl font-bold text-gray-900">{service.total.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-0.5">pages</p>
      {(service.routeCount > 0 || service.airportCount > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
          {service.locationCount > 0 && (
            <p className="text-xs text-gray-500">{service.locationCount} location pages</p>
          )}
          {service.routeCount > 0 && (
            <p className="text-xs text-gray-500">{service.routeCount} route pages</p>
          )}
          {service.airportCount > 0 && (
            <p className="text-xs text-gray-500">{service.airportCount} airport pages</p>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SEODashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [staticPages, setStaticPages] = useState<StaticPageRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/seo/overview')
      .then((r) => r.json())
      .then((d) => setOverview(d))
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  }, []);

  const fetchStatic = useCallback(async () => {
    setLoadingStatic(true);
    try {
      const res = await fetch('/api/admin/services/static/location-pages?type=static');
      if (res.ok) {
        const data = await res.json();
        setStaticPages(data.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatic(false);
    }
  }, []);

  useEffect(() => { fetchStatic(); }, [fetchStatic]);

  const handleSave = async (pageId: string, data: EditState) => {
    await fetch('/api/admin/seo/page-meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, ...data }),
    });
    fetchStatic();
  };

  const handleReset = async (pageId: string) => {
    await fetch(`/api/admin/seo/page-meta?pageId=${encodeURIComponent(pageId)}`, { method: 'DELETE' });
    fetchStatic();
  };

  const filteredStatic = staticPages.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.label || '').toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      (p.override?.metaTitle || p.templateTitle).toLowerCase().includes(q)
    );
  });

  const customStaticCount = staticPages.filter((p) => p.override).length;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">
          All indexable pages across services and static site. Manage meta title, description & keywords.
        </p>
      </div>

      {/* Total stat */}
      {loadingOverview ? (
        <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
      ) : overview && (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-sm font-medium text-blue-100 mb-1">Total indexable pages</p>
          <p className="text-5xl font-bold">{overview.totalPages.toLocaleString()}</p>
          <div className="flex items-center gap-6 mt-3 text-sm text-blue-100">
            <span>{overview.totalServicePages.toLocaleString()} service pages</span>
            <span>•</span>
            <span>{overview.staticCount} static pages</span>
          </div>
        </div>
      )}

      {/* Service cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Services
          {overview && <span className="text-xs font-normal text-gray-400 ml-1">({overview.services.length})</span>}
        </h2>
        {loadingOverview ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {overview?.services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>

      {/* Static pages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Static Pages
            <span className="text-xs font-normal text-gray-400">({staticPages.length})</span>
            {customStaticCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {customStaticCount} custom
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">
            <span className="text-blue-600">Blue</span> = custom override &nbsp;|&nbsp; White = template
          </p>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search static pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loadingStatic ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredStatic.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pages found</div>
        ) : (
          <div>
            {filteredStatic.map((row) => (
              <StaticPageRow key={row.pageId} row={row} onSave={handleSave} onReset={handleReset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
