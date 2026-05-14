'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers, Sparkles, Edit, Loader2, RefreshCw, CheckCircle2, AlertCircle,
  FileText, Bot, User, ExternalLink, Filter, Play, ChevronLeft, ChevronRight, Search,
  ChevronDown, X as XIcon,
} from 'lucide-react';

type ServiceSummary = {
  slug: string;
  name: string;
  totalLivePages: number;
  withContent: number;
  published: number;
  aiGenerated: number;
  manual: number;
  autoUpdateOn: number;
};

type Row = {
  serviceSlug: string;
  serviceLabel: string;
  citySlug: string;
  cityName: string;
  cityState: string | null;
  cityTier: number | null;
  cityPriority: number | null;
  hasContent: boolean;
  contentId: string | null;
  contentStatus: string | null;
  contentSource: string | null;
  introLength: number;
  faqsCount: number;
  autoUpdate: boolean;
  aiTokensUsed: number | null;
  lastAiUpdate: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

type Pagination = { offset: number; limit: number; totalMatched: number; hasMore: boolean };

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ai_generated: 'bg-purple-100 text-purple-700',
  manual_edited: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
};

const MAX_BULK_SELECT = 200;

export default function InventoryPage() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [overall, setOverall] = useState<{ totalServices: number; totalCities: number; totalLivePages: number; withContent: number; needingContent: number; coveragePct: number } | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ offset: 0, limit: 200, totalMatched: 0, hasMore: false });
  const [loading, setLoading] = useState(true);

  const [filterService, setFilterService] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [filterWithContent, setFilterWithContent] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterService) qs.set('service', filterService);
      if (filterTier) qs.set('tier', filterTier);
      if (filterMissing) qs.set('onlyMissing', '1');
      if (filterWithContent) qs.set('onlyWithContent', '1');
      if (citySearch) qs.set('city', citySearch);
      qs.set('offset', String(offset));
      qs.set('limit', String(pagination.limit));

      const res = await fetch(`/api/admin/seo-content/inventory?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows);
      setOverall(data.overall);
      setServices(data.summaryByService);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  }, [filterService, filterTier, filterMissing, filterWithContent, citySearch, pagination.limit]);

  useEffect(() => { fetchInventory(0); }, [fetchInventory]);

  function rowKey(r: Row): string { return `${r.serviceSlug}::${r.citySlug}`; }

  function toggleRow(r: Row) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const k = rowKey(r);
      if (next.has(k)) next.delete(k);
      else {
        if (next.size >= MAX_BULK_SELECT) {
          alert(`Max ${MAX_BULK_SELECT} selections at once. Run this batch first.`);
          return prev;
        }
        next.add(k);
      }
      return next;
    });
  }

  function toggleAllOnPage() {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      const next = new Set(selectedRows);
      for (const r of rows) {
        if (next.size >= MAX_BULK_SELECT) break;
        next.add(rowKey(r));
      }
      setSelectedRows(next);
    }
  }

  function clearAll() {
    setSelectedRows(new Set());
  }

  async function bulkGenerate() {
    if (selectedRows.size === 0) return;
    if (!confirm(`Generate AI content for ${selectedRows.size} pages? ~₹${(selectedRows.size * 0.25).toFixed(2)} cost.`)) return;

    setSubmitting(true);
    try {
      const targets = Array.from(selectedRows).map((k) => {
        const [serviceSlug, citySlug] = k.split('::');
        return { serviceSlug, citySlug };
      });

      const res = await fetch('/api/admin/seo-content/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, concurrency: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start job');

      window.location.href = `/admin/seo-content/bulk?jobId=${data.jobId}&preset=${encodeURIComponent(JSON.stringify(targets))}`;
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const pageInfo = `${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.totalMatched)} of ${pagination.totalMatched.toLocaleString()}`;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-600" />
            Pages Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            All {overall?.totalLivePages.toLocaleString() ?? '...'} live (service × city) URLs with content status. Identify gaps and bulk-generate.
          </p>
        </div>
        <button
          onClick={() => fetchInventory(0)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Overall summary */}
      {overall && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Services</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{overall.totalServices}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Cities</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{overall.totalCities}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Live URLs</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{overall.totalLivePages.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-xs text-green-600 uppercase tracking-wide">With Content</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{overall.withContent.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{overall.coveragePct}% covered</div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="text-xs text-amber-600 uppercase tracking-wide">Needs Content</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{overall.needingContent.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Static fallback now</div>
          </div>
        </div>
      )}

      {/* Per-service summary */}
      {services.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            By Service (top 12 by content coverage)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {services.slice(0, 12).map((s) => {
              const pct = s.totalLivePages > 0 ? (s.withContent / s.totalLivePages) * 100 : 0;
              const isFiltered = filterService === s.slug;
              return (
                <button
                  key={s.slug}
                  onClick={() => { setFilterService(isFiltered ? '' : s.slug); setSelectedRows(new Set()); }}
                  className={`text-left rounded-lg border p-2 hover:border-purple-400 transition ${isFiltered ? 'border-purple-500 bg-purple-50' : 'bg-white border-gray-200'}`}
                >
                  <div className="text-xs font-semibold text-gray-900 truncate" title={s.name}>{s.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.withContent}/{s.totalLivePages} ({pct.toFixed(0)}%)</div>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div className="h-1 bg-purple-600" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 flex flex-wrap items-center gap-3">
        <ServiceSearchSelect
          value={filterService}
          services={services}
          onChange={(slug) => { setFilterService(slug); setSelectedRows(new Set()); }}
        />

        <select
          value={filterTier}
          onChange={(e) => { setFilterTier(e.target.value); setSelectedRows(new Set()); }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All tiers</option>
          {[1, 2, 3, 4, 5].map((t) => <option key={t} value={t}>Tier {t}</option>)}
        </select>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search city..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm w-44"
          />
        </div>

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={filterMissing} onChange={(e) => { setFilterMissing(e.target.checked); if (e.target.checked) setFilterWithContent(false); }} />
          Only missing
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={filterWithContent} onChange={(e) => { setFilterWithContent(e.target.checked); if (e.target.checked) setFilterMissing(false); }} />
          Only with content
        </label>

        <div className="text-sm text-gray-500 ml-auto">
          {loading ? 'Loading...' : `${pageInfo}`}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <div className="text-sm text-purple-900 font-medium">
            {selectedRows.size} selected · ~₹{(selectedRows.size * 0.25).toFixed(2)} · ~{Math.ceil(selectedRows.size * 32 / 5 / 60)} min
            {selectedRows.size >= MAX_BULK_SELECT && (
              <span className="ml-2 text-xs text-amber-700">(max {MAX_BULK_SELECT} per batch)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={clearAll} className="text-sm text-purple-700 hover:text-purple-900">Clear</button>
            <button
              onClick={bulkGenerate}
              disabled={submitting}
              className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 inline-flex items-center gap-1 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Generate selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            No pages match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => selectedRows.has(rowKey(r)))}
                      onChange={toggleAllOnPage}
                    />
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Service</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">City</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Tier</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Content</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Src</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Updated</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const k = rowKey(r);
                  const url = `/${r.serviceSlug}/${r.citySlug}`;
                  return (
                    <tr key={k} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={selectedRows.has(k)} onChange={() => toggleRow(r)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.serviceLabel}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{r.serviceSlug}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.cityName}</div>
                        <div className="text-[11px] text-gray-400">{r.cityState ?? r.citySlug}</div>
                      </td>
                      <td className="px-3 py-2">
                        {r.cityTier && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">T{r.cityTier}</span>}
                      </td>
                      <td className="px-3 py-2">
                        {r.hasContent ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {r.introLength}c·{r.faqsCount}faq
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" /> static
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.contentStatus ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[r.contentStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {r.contentStatus.replace('_', ' ')}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {r.contentSource === 'ai' && <Bot className="w-4 h-4 text-purple-600" />}
                        {r.contentSource === 'manual' && <User className="w-4 h-4 text-blue-600" />}
                        {!r.contentSource && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-gray-700" title="View live">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Link
                            href={`/admin/seo-content/${r.serviceSlug}/${r.citySlug}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-50 rounded text-xs font-medium"
                          >
                            <Edit className="w-3.5 h-3.5" /> {r.hasContent ? 'Edit' : 'Create'}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalMatched > pagination.limit && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-500">{pageInfo}</div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchInventory(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0 || loading}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => fetchInventory(pagination.offset + pagination.limit)}
              disabled={!pagination.hasMore || loading}
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

// ── Searchable service dropdown ─────────────────────────────────────────────
function ServiceSearchSelect({
  value, services, onChange,
}: {
  value: string;
  services: ServiceSummary[];
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = services.find((s) => s.slug === value);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    );
  }, [services, query]);

  return (
    <div className="relative w-64" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(''); }}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-left flex items-center justify-between hover:border-gray-400"
      >
        <span className="truncate">
          {selected ? selected.name : `All ${services.length} services`}
        </span>
        {value ? (
          <XIcon
            className="w-4 h-4 text-gray-400 hover:text-gray-700 shrink-0 ml-1"
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
          />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
          <div className="relative border-b border-gray-100 px-2 py-2 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-7 pr-2 py-1 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No matches</div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 ${!value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'}`}
                >
                  All {services.length} services
                </button>
                {filtered.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => { onChange(s.slug); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center justify-between ${value === s.slug ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{s.totalLivePages}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
