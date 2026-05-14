'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Loader2, Play, X, AlertTriangle,
  CheckCircle2, Clock, AlertCircle, Pause,
} from 'lucide-react';

type ServiceOption = { slug: string; label: string };
type Target = { serviceSlug: string; citySlug: string };

type CityListItem = {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  tier: 1 | 2 | 3 | 4 | 5;
  priority: number;
};

type JobSummary = {
  id: string;
  state: 'queued' | 'running' | 'done' | 'cancelled';
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalTokensUsed: number;
  concurrency: number;
  customInstructions: string | null;
  startedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
  avgPerItemMs: number;
  etaMs: number | null;
  items: Array<{
    serviceSlug: string;
    citySlug: string;
    status: 'pending' | 'running' | 'done' | 'error';
    error: string | null;
    tokensUsed: number | null;
    elapsedMs: number | null;
    savedId: string | null;
  }>;
};

const DEEPSEEK_RATE_PER_TOKEN = 0.7 / 1_000_000; // weighted avg input+output cost
const AVG_TOKENS_PER_PAGE = 4400;

export default function BulkGeneratePage() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get('preset');

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [stateFilter, setStateFilter] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [concurrency, setConcurrency] = useState(5);

  const [job, setJob] = useState<JobSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services list
  useEffect(() => {
    fetch('/api/admin/seo-content?limit=1').then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setServices(d.knownServices);
      }
    });
  }, []);

  // Load cities list (lightweight)
  useEffect(() => {
    fetch('/api/admin/cities-list')
      .then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setCities(d.cities);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, []);

  // Apply preset from URL (?preset=encoded JSON of [{serviceSlug, citySlug}])
  useEffect(() => {
    if (!presetParam) return;
    try {
      const parsed: Target[] = JSON.parse(decodeURIComponent(presetParam));
      const svc = new Set<string>(parsed.map((t) => t.serviceSlug));
      const cty = new Set<string>(parsed.map((t) => t.citySlug));
      setSelectedServices(svc);
      setSelectedCities(cty);
    } catch {}
  }, [presetParam]);

  // Poll job status
  useEffect(() => {
    if (!job || job.state === 'done' || job.state === 'cancelled') return;
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/api/admin/seo-content/bulk-status/${job.id}`);
        if (r.ok) {
          const d = await r.json();
          setJob(d.summary);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(timer);
  }, [job]);

  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      if (tierFilter !== null && c.tier !== tierFilter) return false;
      if (stateFilter && c.stateCode !== stateFilter) return false;
      return true;
    });
  }, [cities, tierFilter, stateFilter]);

  const states = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cities) m.set(c.stateCode, c.state);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [cities]);

  const targets: Target[] = useMemo(() => {
    const out: Target[] = [];
    for (const svc of selectedServices) {
      for (const city of selectedCities) {
        out.push({ serviceSlug: svc, citySlug: city });
      }
    }
    return out;
  }, [selectedServices, selectedCities]);

  const totalCount = targets.length;
  const estimatedTokens = totalCount * AVG_TOKENS_PER_PAGE;
  const estimatedCostUsd = estimatedTokens * DEEPSEEK_RATE_PER_TOKEN;
  const estimatedTimeMin = Math.ceil(totalCount * 32 / Math.max(1, concurrency) / 60);

  function toggleService(slug: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }
  function toggleCity(slug: string) {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }
  function selectTopN(n: number) {
    const top = cities.slice().sort((a, b) => b.priority - a.priority).slice(0, n);
    setSelectedCities(new Set(top.map((c) => c.slug)));
  }
  function clearAll() {
    setSelectedCities(new Set());
    setSelectedServices(new Set());
  }
  function selectAllFiltered() {
    setSelectedCities(new Set([...selectedCities, ...filteredCities.map((c) => c.slug)]));
  }

  async function startJob() {
    if (targets.length === 0) {
      setError('Select at least one service and one city.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo-content/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, customInstructions: customInstructions || undefined, concurrency }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const d = await res.json();
      setJob(d.summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelJob() {
    if (!job) return;
    try {
      const res = await fetch(`/api/admin/seo-content/bulk-status/${job.id}`, { method: 'DELETE' });
      if (res.ok) {
        const d = await res.json();
        if (d.summary) setJob(d.summary);
      }
    } catch {}
  }

  // Render job progress view if a job exists
  if (job) {
    return <JobProgressView job={job} onCancel={cancelJob} onReset={() => setJob(null)} />;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/seo-content" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-600" />
              Bulk AI Generation
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Select services × cities. AI will generate unique content for each combination.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Services ({selectedServices.size})</h3>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setSelectedServices(new Set(services.map((s) => s.slug)))} className="text-purple-600 hover:underline">All</button>
                <button onClick={() => setSelectedServices(new Set())} className="text-gray-500 hover:underline">None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map((s) => (
                <label key={s.slug} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedServices.has(s.slug)}
                    onChange={() => toggleService(s.slug)}
                  />
                  <span className="text-gray-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* City selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Cities ({selectedCities.size})</h3>
              <div className="flex gap-2 text-xs flex-wrap">
                <button onClick={() => selectTopN(10)} className="px-2 py-0.5 border rounded hover:bg-gray-50">Top 10</button>
                <button onClick={() => selectTopN(30)} className="px-2 py-0.5 border rounded hover:bg-gray-50">Top 30</button>
                <button onClick={() => selectTopN(50)} className="px-2 py-0.5 border rounded hover:bg-gray-50">Top 50</button>
                <button onClick={() => selectTopN(100)} className="px-2 py-0.5 border rounded hover:bg-gray-50">Top 100</button>
                <button onClick={selectAllFiltered} className="text-purple-600 hover:underline">All filtered</button>
                <button onClick={() => setSelectedCities(new Set())} className="text-gray-500 hover:underline">None</button>
              </div>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {[1, 2, 3, 4, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(tierFilter === t ? null : t)}
                  className={`px-3 py-1 rounded text-xs border ${tierFilter === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Tier {t}
                </button>
              ))}
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2"
              >
                <option value="">All states</option>
                {states.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            {loadingCities ? (
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            ) : (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {filteredCities.map((c) => (
                    <label key={c.slug} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedCities.has(c.slug)}
                        onChange={() => toggleCity(c.slug)}
                      />
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">T{c.tier}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Custom Instructions (optional)</h3>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              placeholder={`Applied to every (service × city) combo. e.g., "Emphasize monsoon driving precautions" or "Mention wedding season packages"`}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Right summary panel */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-3">Job Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pages to generate</span>
                <span className="font-bold text-gray-900">{totalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated tokens</span>
                <span className="text-gray-700">{estimatedTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated cost</span>
                <span className="text-gray-700">~${estimatedCostUsd.toFixed(3)} (₹{(estimatedCostUsd * 83).toFixed(1)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated time</span>
                <span className="text-gray-700">~{estimatedTimeMin} min</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrency: {concurrency}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Higher = faster but more API load. 5 is recommended.</div>
            </div>

            <button
              onClick={startJob}
              disabled={submitting || totalCount === 0}
              className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 font-medium"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Start Generation
            </button>

            <button
              onClick={clearAll}
              className="w-full mt-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
            >
              Clear all selections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobProgressView({
  job, onCancel, onReset,
}: { job: JobSummary; onCancel: () => void; onReset: () => void }) {
  const pct = job.total > 0 ? ((job.completed + job.failed) / job.total) * 100 : 0;
  const isActive = job.state === 'queued' || job.state === 'running';
  const errorItems = job.items.filter((i) => i.status === 'error');
  const eta = job.etaMs ? Math.ceil(job.etaMs / 1000 / 60) : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {isActive ? (
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          ) : job.state === 'cancelled' ? (
            <Pause className="w-6 h-6 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )}
          Bulk Generation — <span className="text-purple-700">{job.state}</span>
        </h1>
        <div className="flex gap-2">
          {isActive && (
            <button onClick={onCancel} className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm inline-flex items-center gap-1">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button onClick={onReset} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            New job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Stat label="Total" value={job.total} />
          <Stat label="Done" value={job.completed} color="green" />
          <Stat label="Failed" value={job.failed} color="red" />
          <Stat label="Pending" value={job.pending} color="gray" />
          <Stat label="Tokens used" value={job.totalTokensUsed.toLocaleString()} />
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{Math.round(pct)}% complete</span>
            {eta !== null && isActive && <span>ETA ~{eta} min</span>}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-purple-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {job.customInstructions && (
          <div className="text-xs text-gray-500 italic mt-3 pt-3 border-t">
            Instructions: {job.customInstructions}
          </div>
        )}
      </div>

      {errorItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorItems.length} failed
          </h3>
          <ul className="text-xs text-red-800 space-y-1 max-h-40 overflow-y-auto">
            {errorItems.map((i, idx) => (
              <li key={idx}>
                <code>{i.serviceSlug}/{i.citySlug}</code> — {i.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-700">Service / City</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">Tokens</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">Time</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {job.items.map((i, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs">{i.serviceSlug} / {i.citySlug}</td>
                  <td className="px-3 py-2">
                    {i.status === 'pending' && <span className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> pending</span>}
                    {i.status === 'running' && <span className="text-purple-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> running</span>}
                    {i.status === 'done' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> done</span>}
                    {i.status === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> error</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{i.tokensUsed?.toLocaleString() ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{i.elapsedMs ? `${(i.elapsedMs / 1000).toFixed(1)}s` : '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {i.error ? <span className="text-red-600">{i.error.slice(0, 80)}</span> :
                     i.savedId ? (
                       <Link href={`/admin/seo-content/${i.serviceSlug}/${i.citySlug}`} className="text-purple-600 hover:underline">
                         View
                       </Link>
                     ) : '—'}
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

function Stat({ label, value, color }: { label: string; value: number | string; color?: 'green' | 'red' | 'gray' }) {
  const cls = color === 'green' ? 'text-green-700'
    : color === 'red' ? 'text-red-700'
    : color === 'gray' ? 'text-gray-700'
    : 'text-gray-900';
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
