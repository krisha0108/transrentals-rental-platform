'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Search, ExternalLink, Edit2, Check, X, RotateCcw, ChevronDown, ChevronUp, Globe, MapPin, Route, Plane } from 'lucide-react';

interface PageRow {
  pageId: string;
  url: string;
  label?: string;
  locationName?: string;
  locationSlug?: string;
  state?: string;
  from?: string;
  to?: string;
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

// ── Single editable row ────────────────────────────────────────────────────────
function PageRow({ row, onSave, onReset }: {
  row: PageRow;
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
  const titleValue = row.override?.metaTitle || row.templateTitle;

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
      {/* Row header */}
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
            <span className="font-medium text-gray-900 text-sm truncate">{titleValue}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 truncate">{row.url}</span>
            {row.state && <span className="text-xs text-gray-400">• {row.state}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://transrentals.in${row.url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 transition"
            title="Open live page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Edit panel */}
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {/* Template preview */}
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

          {/* Google preview */}
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

// ── Tab panel ─────────────────────────────────────────────────────────────────
function TabPanel({ slug, type, label, icon }: {
  slug: string;
  type: string;
  label: string;
  icon: React.ReactNode;
}) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/location-pages?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        setTotal(data.total || data.pages?.length || 0);
      }
    } catch (e) {
      console.error('Failed to fetch pages', e);
    } finally {
      setLoading(false);
    }
  }, [slug, type]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSave = async (pageId: string, data: EditState) => {
    await fetch('/api/admin/seo/page-meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, ...data }),
    });
    fetchPages();
  };

  const handleReset = async (pageId: string) => {
    await fetch(`/api/admin/seo/page-meta?pageId=${encodeURIComponent(pageId)}`, { method: 'DELETE' });
    fetchPages();
  };

  const filtered = pages.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.locationName || p.label || p.from || '').toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      (p.override?.metaTitle || p.templateTitle).toLowerCase().includes(q)
    );
  });

  const customCount = pages.filter((p) => p.override).length;

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">{icon} <strong>{total}</strong> pages</span>
        {customCount > 0 && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {customCount} custom meta
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pages found</div>
      ) : (
        <div>
          {filtered.map((row) => (
            <PageRow key={row.pageId} row={row} onSave={handleSave} onReset={handleReset} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceLocationPagesAdmin() {
  const params = useParams();
  const slug = params.slug as string;
  const isCarRental = slug === 'car-rental';

  const tabs = [
    { key: 'location', label: 'Location Pages', icon: <MapPin className="w-4 h-4" /> },
    ...(isCarRental ? [
      { key: 'routes', label: 'One Way & Round Trip', icon: <Route className="w-4 h-4" /> },
      { key: 'airport', label: 'Airport Transfers', icon: <Plane className="w-4 h-4" /> },
    ] : []),
    { key: 'static', label: 'Website Pages', icon: <Globe className="w-4 h-4" /> },
  ];

  const [activeTab, setActiveTab] = useState('location');

  const serviceName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Pages</h1>
        <p className="text-gray-500 mt-1 text-sm">
          View and edit meta title, description & keywords for all <strong>{serviceName}</strong> pages.
          <span className="ml-1 text-blue-600">Blue = custom override</span> | <span className="text-gray-400">White = using template</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabPanel
        key={activeTab}
        slug={slug}
        type={activeTab}
        label={tabs.find((t) => t.key === activeTab)?.label || ''}
        icon={tabs.find((t) => t.key === activeTab)?.icon}
      />
    </div>
  );
}
