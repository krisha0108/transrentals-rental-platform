'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit, Trash2, Eye, Film,
  Globe, Clock, Archive, ChevronLeft, ChevronRight,
  Loader2, ArrowUp, ArrowDown, CheckCircle, XCircle,
  LayoutGrid, AlertTriangle,
} from 'lucide-react';

interface WebStory {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  coverImage: string | null;
  coverImageSquare: string | null;
  publisherName: string | null;
  publisherLogo: string | null;
  metaDescription: string | null;
  description: string | null;
  isPublished: boolean;
  isArchived: boolean;
  displayOrder: number;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  slideCount: number;
  reactions: { HEART: number; FIRE: number; THUMBS_UP: number; total: number };
}

type TabFilter = 'all' | 'published' | 'draft' | 'archived';

function calcSeoScore(story: WebStory): { score: number; checks: { label: string; ok: boolean }[] } {
  const checks = [
    { label: 'Has title', ok: !!(story.title && story.title.trim().length > 3) },
    { label: 'Meta description', ok: !!(story.metaDescription && story.metaDescription.trim().length > 10) },
    { label: 'Cover image (landscape)', ok: !!story.coverImage },
    { label: 'Cover image (square)', ok: !!story.coverImageSquare },
    { label: 'Publisher name & logo', ok: !!(story.publisherName && story.publisherLogo) },
    { label: '4+ slides', ok: story.slideCount >= 4 },
    { label: 'Has category', ok: !!story.category },
    { label: 'URL-friendly slug', ok: /^[a-z0-9-]+$/.test(story.slug) },
    { label: 'Has reactions', ok: story.reactions.total > 0 },
    { label: 'Description set', ok: !!(story.description && story.description.trim().length > 10) },
  ];
  const score = checks.filter((c) => c.ok).length * 10;
  return { score, checks };
}

function SeoScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${color}`}>
      {score}
    </span>
  );
}

export default function WebStoriesAdminPage() {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('status', tab);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      const res = await fetch(`/api/admin/web-stories?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, searchQuery, page]);

  useEffect(() => { setPage(1); }, [tab, searchQuery]);
  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/web-stories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStories();
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setToggling(id);
    try {
      const res = await fetch(`/api/admin/web-stories/${id}/publish`, { method: 'PATCH' });
      if (res.ok) fetchStories();
    } finally {
      setToggling(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down', currentOrder: number) => {
    setReordering(id);
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    try {
      await fetch(`/api/admin/web-stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: newOrder }),
      });
      fetchStories();
    } finally {
      setReordering(null);
    }
  };

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: 'published', label: 'Published', icon: <Globe className="w-3.5 h-3.5" /> },
    { key: 'draft', label: 'Draft', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'archived', label: 'Archived', icon: <Archive className="w-3.5 h-3.5" /> },
  ];

  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-600" />
            Web Stories
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage immersive AMP-style stories — appears at /stories
          </p>
        </div>
        <Link
          href="/admin/web-stories/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Story
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, icon: <Film className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Published', value: stories.filter((s) => s.isPublished).length, icon: <Globe className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Draft', value: stories.filter((s) => !s.isPublished && !s.isArchived).length, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50' },
          { label: 'Archived', value: stories.filter((s) => s.isArchived).length, icon: <Archive className="w-5 h-5 text-gray-600" />, bg: 'bg-gray-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            {searchQuery ? 'No stories match your search' : 'No web stories yet'}
          </h3>
          <p className="text-gray-500 text-sm mt-1 mb-5">
            {searchQuery ? 'Try a different search term.' : 'Create your first immersive web story.'}
          </p>
          {!searchQuery && (
            <Link
              href="/admin/web-stories/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create First Story
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Story</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Slides</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Reactions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">SEO</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Expires</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stories.map((story, idx) => {
                const { score } = calcSeoScore(story);
                return (
                  <tr key={story.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* 9:16 thumbnail */}
                        <div className="relative w-10 h-[70px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {story.coverImageSquare || story.coverImage ? (
                            <img
                              src={story.coverImageSquare || story.coverImage || ''}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{story.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px] mt-0.5">/stories/{story.slug}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={() => handleReorder(story.id, 'up', story.displayOrder)}
                              disabled={idx === 0 || reordering === story.id}
                              className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReorder(story.id, 'down', story.displayOrder)}
                              disabled={idx === stories.length - 1 || reordering === story.id}
                              className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-gray-300 ml-1">#{story.displayOrder}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {story.category ? (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{story.category}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 font-medium">{story.slideCount}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>❤️ {story.reactions.HEART}</span>
                        <span>🔥 {story.reactions.FIRE}</span>
                        <span>👍 {story.reactions.THUMBS_UP}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {story.isArchived ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      ) : story.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <SeoScoreBadge score={score} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {story.expiresAt ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {new Date(story.expiresAt) < new Date() ? (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {new Date(story.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/admin/web-stories/preview/${story.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={story.isPublished ? 'Preview (Published)' : 'Preview (Draft)'}
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/web-stories/${story.id}`}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(story.id)}
                          disabled={toggling === story.id || story.isArchived}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            story.isPublished
                              ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={story.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {toggling === story.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : story.isPublished ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(story.id, story.title)}
                          disabled={deleting === story.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === story.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {from}–{to} of {total} stories
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-2 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[28px] h-7 px-2 text-xs rounded-lg font-medium transition-colors ${
                          page === p ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
