'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Share2, Facebook, Instagram, Loader2, RefreshCw, Plus, Unplug,
  Heart, MessageCircle, Repeat2, Eye, Bookmark, AlertTriangle,
  CheckCircle2, Users, FileText, ExternalLink, PauseCircle, PlayCircle,
} from 'lucide-react';

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
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {posts.map((p) => (
                  <div key={p.id} className="p-4 flex gap-3 hover:bg-slate-50/60 transition-colors">
                    {(p.thumbnailUrl || p.mediaUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnailUrl || p.mediaUrl || ''} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {p.platform === 'FACEBOOK' ? <Facebook className="w-6 h-6 text-slate-300" /> : <Instagram className="w-6 h-6 text-slate-300" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          p.platform === 'FACEBOOK' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                          {p.platform === 'FACEBOOK' ? <Facebook className="w-2.5 h-2.5" /> : <Instagram className="w-2.5 h-2.5" />}
                          {p.platform}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {p.platform === 'INSTAGRAM' ? (p.account.igUsername ? `@${p.account.igUsername}` : p.account.pageName) : p.account.pageName}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDateTime(p.publishedAt)}</span>
                      </div>
                      {p.caption && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.caption}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatCount(p.likeCount)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatCount(p.commentCount)}</span>
                        {p.platform === 'FACEBOOK' && <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {formatCount(p.shareCount)}</span>}
                        {p.reach != null && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(p.reach)} reach</span>}
                        {p.impressions != null && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(p.impressions)} impr.</span>}
                        {p.savedCount != null && <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> {formatCount(p.savedCount)}</span>}
                        {p.permalink && (
                          <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
