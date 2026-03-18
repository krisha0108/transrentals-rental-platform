// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  List, Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Pause, Eye, Loader2,
  AlertCircle, MapPin, Tag, Building2, Link2, Settings2, X, Save, Globe, FileText,
} from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Inactive', value: 'inactive' },
];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Clock },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  INACTIVE: { label: 'Inactive', color: 'bg-red-100 text-red-600', icon: XCircle },
};

export default function AdminWanderListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // SEO modal
  const [seoListing, setSeoListing] = useState<any>(null);
  const [seoForm, setSeoForm] = useState({ slug: '', metaTitle: '', metaDescription: '', metaKeywords: '', ogImage: '' });
  const [seoSaving, setSeoSaving] = useState(false);
  const [seoError, setSeoError] = useState('');

  function openSeo(listing: any) {
    setSeoListing(listing);
    setSeoForm({
      slug: listing.slug || '',
      metaTitle: listing.metaTitle || '',
      metaDescription: listing.metaDescription || '',
      metaKeywords: listing.metaKeywords || '',
      ogImage: listing.ogImage || '',
    });
    setSeoError('');
  }

  async function saveSeo() {
    if (!seoListing) return;
    setSeoSaving(true);
    setSeoError('');
    try {
      const res = await fetch('/api/admin/wander/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seoListing.id, ...seoForm }),
      });
      const data = await res.json();
      if (!res.ok) { setSeoError(data.error || 'Failed to save'); return; }
      setListings(prev => prev.map(l => l.id === seoListing.id ? { ...l, ...seoForm } : l));
      setSeoListing(null);
    } catch { setSeoError('Failed to save'); }
    finally { setSeoSaving(false); }
  }

  const statusFilter = searchParams.get('status') || 'all';
  const categoryFilter = searchParams.get('categoryId') || '';
  const searchQ = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(searchQ);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    fetch('/api/admin/wander/categories')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setCategories(d) : null)
      .catch(() => {});
    fetch('/api/admin/wander/experiences')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setExperiences(d) : null)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (searchQ) params.set('search', searchQ);
    params.set('page', String(page));
    params.set('limit', '25');

    fetch(`/api/admin/wander/listings?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setListings(d.listings || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, searchQ, page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/wander/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExperienceChange = async (id: string, experienceId: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/wander/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, experienceId: experienceId || null }),
      });
      if (!res.ok) throw new Error();
      setListings(prev => prev.map(l => l.id === id ? { ...l, experience: experiences.find(e => e.id === experienceId) || null } : l));
    } catch {
      alert('Failed to update experience');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <List className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tour Listings</h1>
            <p className="text-xs text-gray-500">{total} listings total</p>
          </div>
        </div>
        <Link href="/admin/wander" className="text-sm text-indigo-600 hover:underline">
          ← Wander Overview
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => updateParams({ status: tab.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + category */}
        <div className="flex gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Search
            </button>
          </form>

          <select
            value={categoryFilter}
            onChange={e => updateParams({ categoryId: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 p-6">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No listings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Tour</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Experience</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Quotes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map(listing => {
                  const sc = STATUS_CONFIG[listing.status] || STATUS_CONFIG.DRAFT;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={listing.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{listing.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{listing.listingId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 text-xs">{listing.vendor?.businessName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span>{listing.category?.icon}</span>
                          <span className="text-gray-600 text-xs">{listing.category?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600 text-xs">{listing.mainLocation?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={listing.experience?.id || ''}
                          onChange={e => handleExperienceChange(listing.id, e.target.value)}
                          disabled={updatingId === listing.id}
                          className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300 max-w-[140px] ${
                            listing.experience?.id ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400'
                          }`}
                        >
                          <option value="">No experience</option>
                          {experiences.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {listing._count?.quoteRequests ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {updatingId === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <select
                              value={listing.status}
                              onChange={e => handleStatusChange(listing.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="DRAFT">Draft</option>
                              <option value="PAUSED">Paused</option>
                              <option value="INACTIVE">Inactive</option>
                            </select>
                          )}
                          <button
                            onClick={() => openSeo(listing)}
                            className={`p-1.5 rounded-lg transition ${
                              listing.metaTitle || listing.metaKeywords
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="SEO Settings"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} listings
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* SEO Modal */}
      {seoListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSeoListing(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">SEO Settings</h2>
                  <p className="text-xs text-gray-400 truncate max-w-[300px]">{seoListing.title}</p>
                </div>
              </div>
              <button onClick={() => setSeoListing(null)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">/wander/</span>
                  <input
                    value={seoForm.slug}
                    onChange={e => setSeoForm({ ...seoForm, slug: e.target.value })}
                    placeholder="one-day-goa-tour-x7k2m"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Change only if needed. Keep the hash suffix for uniqueness.</p>
              </div>

              {/* Meta Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                  <span className="text-xs text-gray-400 font-normal ml-2">{(seoForm.metaTitle || '').length}/60</span>
                </label>
                <input
                  value={seoForm.metaTitle}
                  onChange={e => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                  placeholder={seoListing.title || 'Tour page title for search engines'}
                  maxLength={70}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                  <span className="text-xs text-gray-400 font-normal ml-2">{(seoForm.metaDescription || '').length}/160</span>
                </label>
                <textarea
                  value={seoForm.metaDescription}
                  onChange={e => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                  placeholder="Brief description for Google search results..."
                  maxLength={200}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Meta Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <input
                  value={seoForm.metaKeywords}
                  onChange={e => setSeoForm({ ...seoForm, metaKeywords: e.target.value })}
                  placeholder="goa tour, one day trip, sightseeing, beach tour"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Comma separated keywords for search engines</p>
              </div>

              {/* OG Image */}
              <div>
                <MediaPicker
                  value={seoForm.ogImage}
                  onChange={(url) => setSeoForm({ ...seoForm, ogImage: url })}
                  label="OG Image (Social share preview)"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Google Preview</p>
                <div className="space-y-0.5">
                  <p className="text-blue-700 text-base font-medium truncate">
                    {seoForm.metaTitle || seoListing.title || 'Tour Title'}
                  </p>
                  <p className="text-emerald-700 text-xs">
                    transrentals.in/wander/{seoForm.slug || seoListing.slug || '...'}
                  </p>
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {seoForm.metaDescription || seoListing.shortDescription || 'Tour description will appear here...'}
                  </p>
                </div>
              </div>

              {seoError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {seoError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setSeoListing(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                Cancel
              </button>
              <button
                onClick={saveSeo}
                disabled={seoSaving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-60"
              >
                {seoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save SEO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
