'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Share2, Facebook, Instagram, Loader2, RefreshCw, Plus, Unplug,
  Heart, MessageCircle, Repeat2, Eye, Bookmark, AlertTriangle,
  CheckCircle2, Users, FileText, ExternalLink, PauseCircle, PlayCircle,
  Grid3x3, BarChart3, Trophy, TrendingUp, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Platform brand colors, used as fixed categorical identity everywhere on
// this page (badges, chart series) — validated as a pair via the dataviz
// palette checker (CVD ΔE 18.7, normal-vision ΔE 32.9, both pass).
const PLATFORM_COLOR = { FACEBOOK: '#2563eb', INSTAGRAM: '#db2777' };
const CHART_GRID = '#f1f5f9';
const CHART_AXIS = '#94a3b8';

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all';
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
];

interface Account {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  pageId: string;
  pageName: string;
  igBusinessAccountId: string | null;
  igUsername: string | null;
  profilePictureUrl: string | null;
  followerCount: number | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  postCount: number;
}

interface Post {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  externalId: string;
  mediaType: string | null;
  caption: string | null;
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  savedCount: number | null;
  impressions: number | null;
  reach: number | null;
  engagement: number | null;
  account: { id: string; pageName: string; igUsername: string | null; profilePictureUrl: string | null };
}

interface TopPost {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  caption: string | null;
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementTotal: number;
  accountName: string;
}

interface PlatformSummary {
  platform: 'FACEBOOK' | 'INSTAGRAM';
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number | null;
  totalLikes: number;
  totalComments: number;
}

interface FollowerHistoryPoint { date: string; followerCount: number }
interface PostingFrequencyPoint { weekStart: string; count: number }

interface Analytics {
  topPosts: TopPost[];
  platformSummary: PlatformSummary[];
  followerHistory: FollowerHistoryPoint[];
  postingFrequency: PostingFrequencyPoint[];
}

function formatCount(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string | null) {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_MESSAGES: Record<string, { type: 'success' | 'error'; text: string }> = {
  connected: { type: 'success', text: 'Connected successfully! New pages appear below.' },
  denied: { type: 'error', text: 'Facebook login was cancelled or denied.' },
  invalid_state: { type: 'error', text: 'Login session expired — please try connecting again.' },
  no_pages: { type: 'error', text: "No Facebook Pages found for this account. You need to be an admin of at least one Page." },
  failed: { type: 'error', text: 'Something went wrong while connecting. Please try again.' },
  not_configured: { type: 'error', text: 'Meta App credentials are not configured yet (see setup notice below).' },
};

function AdminSocialPageInner() {
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get('status') || searchParams?.get('error');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | 'all' | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'FACEBOOK' | 'INSTAGRAM'>('all');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'posts' | 'analytics'>('posts');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState<DatePreset>('all');

  const load = useCallback(async () => {
    try {
      const [accountsRes, postsRes] = await Promise.all([
        fetch('/api/admin/social/accounts'),
        fetch(`/api/admin/social/posts${platformFilter !== 'all' ? `?platform=${platformFilter}` : ''}`),
      ]);
      const accountsData = await accountsRes.json();
      const postsData = await postsRes.json();
      if (accountsData.success) {
        setAccounts(accountsData.accounts || []);
        setConfigured(accountsData.configured !== false);
      }
      if (postsData.success) setPosts(postsData.posts || []);
    } catch {
      setError('Failed to load social media data');
    } finally {
      setLoading(false);
    }
  }, [platformFilter]);

  useEffect(() => { load(); }, [load]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/social/analytics?filter=${analyticsFilter}`);
      const data = await res.json();
      if (data.success) setAnalytics(data);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsFilter]);

  // Only fetched once the Analytics tab is actually opened — no reason to
  // run the engagement rollup queries on every page load if the admin just
  // wants the posts feed. Re-fetches whenever the date filter changes too.
  useEffect(() => {
    if (tab !== 'analytics') return;
    loadAnalytics();
  }, [tab, loadAnalytics]);

  const handleSync = async (accountId?: string) => {
    setSyncingId(accountId || 'all');
    setError(null);
    try {
      const res = await fetch('/api/admin/social/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountId ? { accountId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sync failed');
      await load();
      if (tab === 'analytics') await loadAnalytics(); // already viewing it — refresh in place with the fresh sync
    } catch (e: any) {
      setError(e?.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleActive = async (account: Account) => {
    await fetch(`/api/admin/social/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !account.isActive }),
    });
    load();
  };

  const handleDisconnect = async (account: Account) => {
    if (!confirm(`Disconnect "${account.pageName}"? This removes its synced posts too.`)) return;
    await fetch(`/api/admin/social/accounts/${account.id}`, { method: 'DELETE' });
    load();
  };

  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followerCount || 0), 0);
  const totalPosts = accounts.reduce((sum, a) => sum + a.postCount, 0);
  const statusBanner = statusParam ? STATUS_MESSAGES[statusParam] : null;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Social Media Performance</h1>
            <p className="text-sm text-slate-500">Facebook &amp; Instagram pages, posts and engagement — synced from Meta.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSync()}
            disabled={syncingId !== null || accounts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-40 transition"
          >
            <RefreshCw className={`w-4 h-4 ${syncingId === 'all' ? 'animate-spin' : ''}`} /> Sync All
          </button>
          <a
            href="/api/admin/social/facebook/connect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Connect Facebook / Instagram
          </a>
        </div>
      </div>

      {statusBanner && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          statusBanner.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {statusBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {statusBanner.text}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {!configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Meta App not configured</p>
          <p className="mt-1 text-amber-800">
            Add <code className="bg-amber-100 px-1.5 py-0.5 rounded">FACEBOOK_APP_ID</code> and{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded">FACEBOOK_APP_SECRET</code> to the environment
            (from a Meta for Developers app with Facebook Login enabled) before connecting a page.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No pages connected yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Connect a Facebook Page (and its linked Instagram Business account, if any) to start tracking posts and engagement here.
          </p>
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-2"><Share2 className="w-4 h-4 text-indigo-600" /></div>
              <p className="text-xl font-bold text-slate-900">{accounts.length}</p>
              <p className="text-xs text-slate-500">Connected Accounts</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-blue-600" /></div>
              <p className="text-xl font-bold text-slate-900">{formatCount(totalFollowers)}</p>
              <p className="text-xs text-slate-500">Total Followers</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2"><FileText className="w-4 h-4 text-violet-600" /></div>
              <p className="text-xl font-bold text-slate-900">{totalPosts}</p>
              <p className="text-xs text-slate-500">Posts Synced</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2"><Heart className="w-4 h-4 text-emerald-600" /></div>
              <p className="text-xl font-bold text-slate-900">{formatCount(posts.reduce((s, p) => s + p.likeCount, 0))}</p>
              <p className="text-xs text-slate-500">Likes (loaded posts)</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
            <button
              onClick={() => setTab('posts')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === 'posts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5" /> Accounts &amp; Posts
            </button>
            <button
              onClick={() => setTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>

          {tab === 'posts' && (
          <>
          {/* Connected accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((a) => (
              <div key={a.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${a.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {a.profilePictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.profilePictureUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center"><Facebook className="w-5 h-5 text-slate-400" /></div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white">
                      <Facebook className="w-3 h-3 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{a.pageName}</p>
                    {a.igUsername && (
                      <p className="text-xs text-pink-600 flex items-center gap-1"><Instagram className="w-3 h-3" /> @{a.igUsername}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{formatCount(a.followerCount)} followers · {a.postCount} posts</p>
                  </div>
                </div>

                {a.lastSyncError && (
                  <p className="mt-2 text-[11px] text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {a.lastSyncError}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Synced {timeAgo(a.lastSyncedAt)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSync(a.id)}
                      disabled={syncingId !== null}
                      title="Sync now"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingId === a.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(a)}
                      title={a.isActive ? 'Pause syncing' : 'Resume syncing'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                    >
                      {a.isActive ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDisconnect(a)}
                      title="Disconnect"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Posts feed */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Recent Posts</h2>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                {(['all', 'FACEBOOK', 'INSTAGRAM'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      platformFilter === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {p === 'all' ? 'All' : p === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
                  </button>
                ))}
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-9 h-9 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No posts synced yet — hit "Sync All" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5 max-h-[760px] overflow-y-auto">
                {posts.map((p) => {
                  const isFacebook = p.platform === 'FACEBOOK';
                  const PlatformIcon = isFacebook ? Facebook : Instagram;
                  return (
                    <div key={p.id} className="group rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
                      <div className="relative aspect-[4/3] bg-slate-100 flex-shrink-0">
                        {(p.thumbnailUrl || p.mediaUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnailUrl || p.mediaUrl || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlatformIcon className="w-10 h-10 text-slate-200" />
                          </div>
                        )}
                        <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                          isFacebook ? 'bg-blue-600/90 text-white' : 'bg-pink-600/90 text-white'
                        }`}>
                          <PlatformIcon className="w-2.5 h-2.5" /> {p.platform}
                        </span>
                      </div>

                      <div className="p-3.5 flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {p.platform === 'INSTAGRAM' ? (p.account.igUsername ? `@${p.account.igUsername}` : p.account.pageName) : p.account.pageName}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0 ml-auto">{formatDateTime(p.publishedAt)}</span>
                        </div>

                        {p.caption ? (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3 flex-1">{p.caption}</p>
                        ) : (
                          <div className="flex-1" />
                        )}

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatCount(p.likeCount)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatCount(p.commentCount)}</span>
                          {isFacebook && <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {formatCount(p.shareCount)}</span>}
                          {p.reach != null && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(p.reach)}</span>}
                          {p.savedCount != null && <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> {formatCount(p.savedCount)}</span>}
                          {p.permalink && (
                            <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold ml-auto flex-shrink-0">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>
          )}

          {tab === 'analytics' && (
            <AnalyticsPanel data={analytics} loading={analyticsLoading} filter={analyticsFilter} onFilterChange={setAnalyticsFilter} />
          )}
        </>
      )}
    </div>
  );
}

function AnalyticsEmptyState({ text }: { text: string }) {
  return <div className="h-48 flex items-center justify-center text-center text-xs text-slate-400 px-6">{text}</div>;
}

function AnalyticsPanel({ data, loading, filter, onFilterChange }: { data: Analytics | null; loading: boolean; filter: DatePreset; onFilterChange: (f: DatePreset) => void }) {
  const platformChartData = useMemo(() => {
    if (!data) return [];
    const byPlatform = Object.fromEntries(data.platformSummary.map((s) => [s.platform, s]));
    const metrics: { key: keyof PlatformSummary; label: string }[] = [
      { key: 'avgLikes', label: 'Avg Likes' },
      { key: 'avgComments', label: 'Avg Comments' },
      { key: 'avgShares', label: 'Avg Shares' },
    ];
    return metrics.map(({ key, label }) => ({
      metric: label,
      FACEBOOK: (byPlatform.FACEBOOK?.[key] as number) ?? 0,
      INSTAGRAM: (byPlatform.INSTAGRAM?.[key] as number) ?? 0,
    }));
  }, [data]);

  const hasFacebook = data?.platformSummary.some((s) => s.platform === 'FACEBOOK');
  const hasInstagram = data?.platformSummary.some((s) => s.platform === 'INSTAGRAM');

  const followerChartData = useMemo(
    () => (data?.followerHistory || []).map((p) => ({ date: new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), followers: p.followerCount })),
    [data]
  );

  const frequencyChartData = useMemo(() => {
    if (!data) return [];
    // Re-derive per-platform weekly counts from topPosts/platform data isn't
    // possible from the aggregate weekStart+count shape alone, so this chart
    // shows total posts per week — still answers "are we posting steadily".
    return data.postingFrequency.map((p) => ({
      week: new Date(p.weekStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      posts: p.count,
    }));
  }, [data]);

  const totalPostsInPeriod = data?.platformSummary.reduce((sum, s) => sum + s.postCount, 0) ?? null;

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onFilterChange(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {totalPostsInPeriod != null && (
        <span className="text-xs text-slate-400">
          Analyzing <span className="font-semibold text-slate-600">{totalPostsInPeriod}</span> post{totalPostsInPeriod === 1 ? '' : 's'} in this period
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!data || data.platformSummary.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
          <BarChart3 className="w-9 h-9 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold text-slate-700">No posts in this period</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try a wider date range, or sync more posts — analytics are computed from what's already been synced.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filterBar}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">Platform Comparison (per post average)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="metric" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {hasFacebook && <Bar dataKey="FACEBOOK" name="Facebook" fill={PLATFORM_COLOR.FACEBOOK} radius={[6, 6, 0, 0]} maxBarSize={40} />}
                {hasInstagram && <Bar dataKey="INSTAGRAM" name="Instagram" fill={PLATFORM_COLOR.INSTAGRAM} radius={[6, 6, 0, 0]} maxBarSize={40} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!hasFacebook || !hasInstagram ? (
            <p className="text-[11px] text-slate-400 mt-2">Facebook likes/comments read 0 for now — a known Meta platform issue on that specific API edge, not a data gap on our side.</p>
          ) : null}
        </div>

        {/* Posting frequency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Posting Frequency (last 8 weeks)</p>
          {frequencyChartData.length === 0 ? (
            <AnalyticsEmptyState text="No posts in the last 8 weeks." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="week" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} formatter={(v: any) => [`${v} posts`, undefined]} />
                  <Bar dataKey="posts" name="Posts" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Follower history */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Follower Trend (last 30 days)</p>
        {followerChartData.length < 2 ? (
          <AnalyticsEmptyState text="Only one day of follower data so far — a trend line needs at least a couple of days of syncing. Check back after syncing daily for a bit." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followerChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ stroke: '#e2e8f0' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                <Line type="monotone" dataKey="followers" name="Followers" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top posts */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Top Performing Posts</p>
        </div>
        {data.topPosts.length === 0 ? (
          <AnalyticsEmptyState text="No posts synced yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {data.topPosts.map((p, i) => {
              const isFacebook = p.platform === 'FACEBOOK';
              const PlatformIcon = isFacebook ? Facebook : Instagram;
              const rankStyle = i === 0
                ? 'bg-amber-400 text-amber-900'
                : i === 1
                ? 'bg-slate-300 text-slate-700'
                : i === 2
                ? 'bg-orange-300 text-orange-900'
                : 'bg-white/90 text-slate-500';
              return (
                <div key={p.id} className="group rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
                  <div className="relative aspect-[4/3] bg-slate-100 flex-shrink-0">
                    {(p.thumbnailUrl || p.mediaUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnailUrl || p.mediaUrl || ''} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlatformIcon className="w-10 h-10 text-slate-200" />
                      </div>
                    )}
                    <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                      isFacebook ? 'bg-blue-600/90 text-white' : 'bg-pink-600/90 text-white'
                    }`}>
                      <PlatformIcon className="w-2.5 h-2.5" /> {p.platform}
                    </span>
                    <span className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${rankStyle}`}>
                      {i + 1}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">{p.accountName}</span>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 ml-auto">{formatDateTime(p.publishedAt)}</span>
                    </div>

                    {p.caption ? (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3 flex-1">{p.caption}</p>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatCount(p.likeCount)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatCount(p.commentCount)}</span>
                      {isFacebook && <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {formatCount(p.shareCount)}</span>}
                      {p.permalink && (
                        <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold ml-auto flex-shrink-0">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSocialPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    }>
      <AdminSocialPageInner />
    </Suspense>
  );
}
