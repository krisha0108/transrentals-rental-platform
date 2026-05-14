'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Edit, Sparkles, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, FileText, CheckCircle2, Circle, Bot, User, Layers,
} from 'lucide-react';

type SeoRow = {
  id: string;
  serviceSlug: string;
  serviceLabel: string;
  citySlug: string;
  introLength: number;
  introPreview: string;
  counts: {
    whyChooseUs: number;
    popularVehicles: number;
    servicesOffered: number;
    faqs: number;
    tips: number;
  };
  metaTitle: string | null;
  h1Heading: string | null;
  status: string;
  source: string;
  autoUpdate: boolean;
  aiModel: string | null;
  aiTokensUsed: number | null;
  lastAiUpdate: string | null;
  lastEditedBy: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

type ServiceOption = { slug: string; label: string };

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ai_generated: 'bg-purple-100 text-purple-700',
  manual_edited: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status.replace('_', ' ')}</span>;
}

function SourceIcon({ source }: { source: string }) {
  if (source === 'ai') return <Bot className="w-4 h-4 text-purple-600" title="AI-generated" />;
  if (source === 'manual') return <User className="w-4 h-4 text-blue-600" title="Manually edited" />;
  return <Layers className="w-4 h-4 text-gray-500" title="Hybrid" />;
}

export default function SeoContentListPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterService, setFilterService] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const LIMIT = 25;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterService) qs.set('service', filterService);
      if (filterCity) qs.set('city', filterCity);
      if (filterStatus) qs.set('status', filterStatus);
      if (filterSource) qs.set('source', filterSource);
      qs.set('page', String(page));
      qs.set('limit', String(LIMIT));

      const res = await fetch(`/api/admin/seo-content?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setRows(data.rows);
      setServices(data.knownServices);
      setStatusCounts(data.statusCounts);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch SEO content rows', err);
    } finally {
      setLoading(false);
    }
  }, [filterService, filterCity, filterStatus, filterSource, page]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function clearFilters() {
    setFilterService('');
    setFilterCity('');
    setFilterStatus('');
    setFilterSource('');
    setPage(1);
  }

  const bulkTargets = rows
    .filter((r) => selectedIds.has(r.id))
    .map((r) => ({ serviceSlug: r.serviceSlug, citySlug: r.citySlug }));

  function goBulkGenerate() {
    const payload = encodeURIComponent(JSON.stringify(bulkTargets));
    window.location.href = `/admin/seo-content/bulk?preset=${payload}`;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            SEO Page Content
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage per-service per-city SEO content. AI-generate, manual edit, bulk operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/seo-content/bulk"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Bulk Generate
          </Link>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'published', label: 'Published', color: 'green' },
          { key: 'ai_generated', label: 'AI Generated', color: 'purple' },
          { key: 'manual_edited', label: 'Manual Edited', color: 'blue' },
          { key: 'draft', label: 'Draft', color: 'gray' },
        ].map((s) => (
          <div key={s.key} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {(statusCounts[s.key] ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={filterService}
            onChange={(e) => { setFilterService(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search city..."
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm w-full"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ai_generated">AI Generated</option>
            <option value="manual_edited">Manual Edited</option>
            <option value="published">Published</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All sources</option>
            <option value="ai">AI</option>
            <option value="manual">Manual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500">
            Showing {rows.length} of {total.toLocaleString()} rows
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              Clear filters
            </button>
            <button
              onClick={() => fetchRows()}
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <div className="text-sm text-purple-900 font-medium">
            {selectedIds.size} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-purple-700 hover:text-purple-900"
            >
              Clear
            </button>
            <button
              onClick={goBulkGenerate}
              className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            No rows match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === rows.length && rows.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Service / City</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Source</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Content</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Tokens</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Updated</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{r.serviceLabel}</div>
                      <div className="text-xs text-gray-500">
                        /{r.serviceSlug}/<span className="font-medium text-gray-700">{r.citySlug}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3">
                      <SourceIcon source={r.source} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 flex flex-wrap gap-1.5">
                        <span title="Intro length">{r.introLength}c</span>
                        <span className="text-gray-300">·</span>
                        <span title="Why choose">{r.counts.whyChooseUs}why</span>
                        <span className="text-gray-300">·</span>
                        <span title="Popular vehicles">{r.counts.popularVehicles}veh</span>
                        <span className="text-gray-300">·</span>
                        <span title="FAQs">{r.counts.faqs}faq</span>
                        <span className="text-gray-300">·</span>
                        <span title="Tips">{r.counts.tips}tip</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {r.aiTokensUsed?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/seo-content/${r.serviceSlug}/${r.citySlug}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-50 rounded text-xs font-medium"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 inline-flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
