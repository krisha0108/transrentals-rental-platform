'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play, Square, Loader2, RefreshCw, AlertCircle, CheckCircle2,
  ArrowRight, Search, ExternalLink, ShieldCheck, ShieldX, ShieldQuestion,
} from 'lucide-react';

type CrawlJob = {
  id: string;
  state: 'discovering' | 'running' | 'done' | 'cancelled' | 'error';
  total: number;
  checked: number;
  errors: number;
  statusCounts: Record<string, number>;
  concurrency: number;
  startedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
  etaMs: number | null;
  lastError: string | null;
};

type InspectionJob = {
  id: string;
  state: 'running' | 'done' | 'cancelled' | 'error';
  siteUrl: string;
  total: number;
  checked: number;
  indexed: number;
  notIndexed: number;
  failed: number;
  startedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
  etaMs: number | null;
  lastError: string | null;
};

type PageRow = {
  id: string;
  url: string;
  sourceSitemap: string | null;
  httpStatus: number | null;
  redirectTo: string | null;
  crawlError: string | null;
  lastCrawledAt: string | null;
  isIndexed: boolean | null;
  indexingVerdict: string | null;
  lastInspectedAt: string | null;
};

type Summary = {
  total2xx: number;
  total3xx: number;
  total4xx5xx: number;
  totalCrawlErrors: number;
  byStatus: Record<string, number>;
  indexed: number;
  notIndexed: number;
  indexingUnchecked: number;
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: '', label: 'All' },
  { key: 'ok', label: '2xx OK' },
  { key: 'redirect', label: '3xx Redirects' },
  { key: 'error', label: '4xx/5xx Errors' },
  { key: '404', label: '404 Only' },
];

const INDEXING_FILTERS: Array<{ key: string; label: string }> = [
  { key: '', label: 'All' },
  { key: 'indexed', label: 'Indexed' },
  { key: 'not_indexed', label: 'Not Indexed' },
  { key: 'unchecked', label: 'Not Checked' },
];

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function statusColor(status: number | null): string {
  if (status == null) return 'bg-gray-100 text-gray-600';
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
  if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-700';
  if (status >= 400) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function IndexingBadge({ isIndexed, verdict }: { isIndexed: boolean | null; verdict: string | null }) {
  if (isIndexed === true) {
    return (
      <span className="flex items-center gap-1 text-green-700" title={verdict ?? undefined}>
        <ShieldCheck className="h-4 w-4" /> Indexed
      </span>
    );
  }
  if (isIndexed === false) {
    return (
      <span className="flex items-center gap-1 text-red-700" title={verdict ?? undefined}>
        <ShieldX className="h-4 w-4" /> {verdict || 'Not indexed'}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-400">
      <ShieldQuestion className="h-4 w-4" /> —
    </span>
  );
}

export default function SiteAuditPage() {
  const [job, setJob] = useState<CrawlJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [rows, setRows] = useState<PageRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0, hasMore: false });
  const [filter, setFilter] = useState('');
  const [indexingFilter, setIndexingFilter] = useState('');
  const [search, setSearch] = useState('');
  const [maxUrls, setMaxUrls] = useState('5000');
  const [loadingRows, setLoadingRows] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gscSites, setGscSites] = useState<Array<{ siteUrl: string }>>([]);
  const [inspectSiteUrl, setInspectSiteUrl] = useState('');
  const [inspectBatchSize, setInspectBatchSize] = useState('100');
  const [inspectionJob, setInspectionJob] = useState<InspectionJob | null>(null);
  const [inspectionStarting, setInspectionStarting] = useState(false);
  const [quota, setQuota] = useState<{ used: number; total: number; remaining: number } | null>(null);
  const inspectionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRows = useCallback(async (offset = 0) => {
    setLoadingRows(true);
    try {
      const params = new URLSearchParams({ limit: '100', offset: String(offset) });
      if (filter) params.set('status', filter);
      if (indexingFilter) params.set('indexing', indexingFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/site-audit/pages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows);
        setSummary(data.summary);
        setPagination({ ...data.pagination });
      }
    } catch {
      // non-fatal — table just stays as-is
    } finally {
      setLoadingRows(false);
    }
  }, [filter, indexingFilter, search]);

  useEffect(() => { fetchRows(0); }, [fetchRows]);

  // Pull the GSC-connected sites so the inspection siteUrl select matches
  // whatever's actually verified — Google rejects mismatches outright.
  useEffect(() => {
    fetch('/api/integrations/gsc/status')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.availableSites?.length) {
          setGscSites(data.availableSites);
          const domainProp = data.availableSites.find((s: any) => s.siteUrl.startsWith('sc-domain:'));
          setInspectSiteUrl((domainProp || data.availableSites[0]).siteUrl);
        }
      })
      .catch(() => {});
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/admin/site-audit/inspect');
      if (res.ok) {
        const data = await res.json();
        setQuota(data.quota);
      }
    } catch {}
  };

  const pollJob = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/admin/site-audit/crawl/${jobId}`);
    if (!res.ok) return;
    const data: CrawlJob = await res.json();
    setJob(data);
    if (data.state === 'done' || data.state === 'cancelled' || data.state === 'error') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      fetchRows(0);
      if (data.state === 'done') setMessage({ type: 'success', text: `Crawl complete — ${data.checked} URLs checked.` });
      if (data.state === 'error') setMessage({ type: 'error', text: data.lastError || 'Crawl failed' });
    }
  }, [fetchRows]);

  const handleStart = async () => {
    setStarting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/site-audit/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUrls: parseInt(maxUrls, 10) || 5000, concurrency: 10 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to start crawl' });
        if (data.jobId) {
          pollRef.current = setInterval(() => pollJob(data.jobId), 2000);
        }
        return;
      }
      setJob(data.job);
      pollRef.current = setInterval(() => pollJob(data.jobId), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to start crawl' });
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    await fetch(`/api/admin/site-audit/crawl/${job.id}`, { method: 'DELETE' });
  };

  const pollInspectionJob = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/admin/site-audit/inspect/${jobId}`);
    if (!res.ok) return;
    const data: InspectionJob = await res.json();
    setInspectionJob(data);
    if (data.state !== 'running') {
      if (inspectionPollRef.current) clearInterval(inspectionPollRef.current);
      inspectionPollRef.current = null;
      fetchRows(0);
      fetchQuota();
      if (data.state === 'done') setMessage({ type: 'success', text: `Indexing check complete — ${data.indexed} indexed, ${data.notIndexed} not indexed.` });
      if (data.state === 'error') setMessage({ type: 'error', text: data.lastError || 'Indexing check failed' });
    }
  }, [fetchRows]);

  const handleStartInspection = async () => {
    if (!inspectSiteUrl) {
      setMessage({ type: 'error', text: 'Connect Google Search Console first (Integrations page) to pick a site.' });
      return;
    }
    setInspectionStarting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/site-audit/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: inspectSiteUrl, batchSize: parseInt(inspectBatchSize, 10) || 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to start indexing check' });
        return;
      }
      setInspectionJob(data.job);
      inspectionPollRef.current = setInterval(() => pollInspectionJob(data.jobId), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to start indexing check' });
    } finally {
      setInspectionStarting(false);
    }
  };

  const handleCancelInspection = async () => {
    if (!inspectionJob) return;
    await fetch(`/api/admin/site-audit/inspect/${inspectionJob.id}`, { method: 'DELETE' });
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (inspectionPollRef.current) clearInterval(inspectionPollRef.current);
  }, []);

  const isActive = job?.state === 'discovering' || job?.state === 'running';
  const isInspecting = inspectionJob?.state === 'running';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Site Audit</h1>
        <p className="text-sm text-gray-500">
          Crawl every sitemap URL for broken links/redirects, then check indexing status with Google.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>1. Crawl (HTTP status)</CardTitle>
          <CardDescription>Fetches https://transrentals.in/sitemap.xml and every sub-sitemap, then checks each URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive && job ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {job.state === 'discovering' ? 'Discovering URLs from sitemap…' : `Checking URLs: ${job.checked} / ${job.total}`}
                </span>
                {job.etaMs != null && <span className="text-gray-500">ETA {formatMs(job.etaMs)}</span>}
              </div>
              {job.total > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (job.checked / job.total) * 100)}%` }}
                  />
                </div>
              )}
              <Button variant="outline" onClick={handleCancel}>
                <Square className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600">Max URLs (0 = no limit, ~24,000 total in sitemap)</label>
                <Input
                  type="number"
                  value={maxUrls}
                  onChange={(e) => setMaxUrls(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={handleStart} disabled={starting}>
                {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Start Crawl
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Indexing Check (Google URL Inspection)</CardTitle>
          <CardDescription>
            Asks Google directly whether each live (2xx) page is actually indexed. Google caps this at ~2,000 checks/day
            per site, so it runs slowly (one URL every ~0.4s) and only covers a batch at a time — run it daily to work
            through the backlog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quota && (
            <p className="text-xs text-gray-500">
              Today&rsquo;s quota: {quota.used} / {quota.total} used ({quota.remaining} remaining)
            </p>
          )}
          {gscSites.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Google Search Console site connected yet — go to Analytics → Integrations to connect one first.
              </AlertDescription>
            </Alert>
          )}
          {isInspecting && inspectionJob ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Inspecting: {inspectionJob.checked} / {inspectionJob.total}</span>
                {inspectionJob.etaMs != null && <span className="text-gray-500">ETA {formatMs(inspectionJob.etaMs)}</span>}
              </div>
              {inspectionJob.total > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (inspectionJob.checked / inspectionJob.total) * 100)}%` }}
                  />
                </div>
              )}
              <Button variant="outline" onClick={handleCancelInspection}>
                <Square className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600">Site</label>
                <select
                  value={inspectSiteUrl}
                  onChange={(e) => setInspectSiteUrl(e.target.value)}
                  className="h-10 w-64 rounded-md border border-gray-300 px-3 text-sm"
                  disabled={gscSites.length === 0}
                >
                  {gscSites.map((s) => <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600">Batch size</label>
                <Input
                  type="number"
                  value={inspectBatchSize}
                  onChange={(e) => setInspectBatchSize(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button onClick={handleStartInspection} disabled={inspectionStarting || gscSites.length === 0}>
                {inspectionStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Check Indexing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">2xx OK</p>
            <p className="text-2xl font-bold text-green-700">{summary.total2xx}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">3xx Redirects</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.total3xx}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">4xx / 5xx Errors</p>
            <p className="text-2xl font-bold text-red-700">{summary.total4xx5xx}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">Crawl Failures</p>
            <p className="text-2xl font-bold text-gray-700">{summary.totalCrawlErrors}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">Indexed</p>
            <p className="text-2xl font-bold text-green-700">{summary.indexed}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-gray-500">Not Indexed</p>
            <p className="text-2xl font-bold text-red-700">{summary.notIndexed}</p>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Results ({pagination.total})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchRows(0); }}
                  className="w-56 pl-8"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchRows(0)} disabled={loadingRows}>
                <RefreshCw className={`h-4 w-4 ${loadingRows ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f.key ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="mx-1 self-center text-gray-300">|</span>
            {INDEXING_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setIndexingFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  indexingFilter === f.key ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">URL</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Redirects To</th>
                  <th className="py-2 pr-4">Indexing</th>
                  <th className="py-2 pr-4">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 max-w-md truncate">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        {row.url.replace('https://transrentals.in', '')} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={statusColor(row.httpStatus)}>
                        {row.crawlError ? 'FAILED' : row.httpStatus ?? '—'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 max-w-xs truncate text-gray-500">
                      {row.redirectTo ? (
                        <span className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 shrink-0" /> {row.redirectTo.replace('https://transrentals.in', '')}
                        </span>
                      ) : row.crawlError ? (
                        <span className="text-red-500">{row.crawlError}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <IndexingBadge isIndexed={row.isIndexed} verdict={row.indexingVerdict} />
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {row.lastCrawledAt ? new Date(row.lastCrawledAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loadingRows && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No results yet — run a crawl to populate this table.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > pagination.limit && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.offset === 0} onClick={() => fetchRows(Math.max(0, pagination.offset - pagination.limit))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!pagination.hasMore} onClick={() => fetchRows(pagination.offset + pagination.limit)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
