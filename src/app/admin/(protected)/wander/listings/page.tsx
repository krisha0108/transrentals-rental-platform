// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  List, Search, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Pause, Loader2,
  AlertCircle, MapPin, Building2, X, Save, Globe,
  PlusCircle, Pencil, ExternalLink, ImageIcon, MessageSquare,
  Zap, FileText, ArrowRight,
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
  ACTIVE:   { label: 'Active',   color: 'bg-emerald-100 text-emerald-700 ring-emerald-200',  dot: 'bg-emerald-500', icon: CheckCircle },
  DRAFT:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600 ring-gray-200',           dot: 'bg-gray-400',    icon: Clock },
  PAUSED:   { label: 'Paused',   color: 'bg-amber-100 text-amber-700 ring-amber-200',        dot: 'bg-amber-500',   icon: Pause },
  INACTIVE: { label: 'Inactive', color: 'bg-red-100 text-red-600 ring-red-200',              dot: 'bg-red-400',     icon: XCircle },
};

function getThumbnail(images: string | null): string | null {
  if (!images) return null;
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch { return null; }
}

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
  const [vendors, setVendors] = useState([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModeModal, setShowAddModeModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('addMode') === 'open') {
      setShowAddModeModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('addMode');
      router.replace(url.pathname + (url.search || ''), { scroll: false });
    }
  }, [searchParams, router]);

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
    setSeoSaving(true); setSeoError('');
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

  const statusFilter   = searchParams.get('status')     || 'all';
  const categoryFilter = searchParams.get('categoryId') || '';
  const sourceFilter   = searchParams.get('source')     || 'all';
  const vendorFilter   = searchParams.get('vendorId')   || '';
  const searchQ        = searchParams.get('search')     || '';
  const page           = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(searchQ);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    fetch('/api/admin/wander/categories').then(r => r.json()).then(d => Array.isArray(d) ? setCategories(d) : null).catch(() => {});
    fetch('/api/admin/wander/experiences').then(r => r.json()).then(d => Array.isArray(d) ? setExperiences(d) : null).catch(() => {});
    fetch('/api/admin/wander/vendors').then(r => r.json()).then(d => Array.isArray(d) ? setVendors(d) : null).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (vendorFilter) params.set('vendorId', vendorFilter);
    if (searchQ) params.set('search', searchQ);
    params.set('page', String(page));
    params.set('limit', '25');
    fetch(`/api/admin/wander/listings?${params.toString()}`)
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); return; } setListings(d.listings || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, sourceFilter, vendorFilter, searchQ, page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/wander/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) });
      if (!res.ok) throw new Error();
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch { alert('Failed to update status'); }
    finally { setUpdatingId(null); }
  };

  const handleExperienceChange = async (id: string, experienceId: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/wander/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, experienceId: experienceId || null }) });
      if (!res.ok) throw new Error();
      setListings(prev => prev.map(l => l.id === id ? { ...l, experience: experiences.find(e => e.id === experienceId) || null } : l));
    } catch { alert('Failed to update experience'); }
    finally { setUpdatingId(null); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParams({ search: searchInput }); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <List className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tour Listings</h1>
            <p className="text-xs text-gray-500">{total} listings total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Tour
          </button>
          <Link href="/admin/wander" className="text-sm text-indigo-600 hover:underline">
            ← Wander Overview
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm space-y-3">

        {/* Row 1: dropdowns */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[180px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition flex-shrink-0">
              Search
            </button>
          </form>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => updateParams({ status: e.target.value })}
            className="pl-3 pr-7 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={e => updateParams({ categoryId: e.target.value })}
            className="pl-3 pr-7 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          {/* Created By */}
          <select
            value={sourceFilter}
            onChange={e => updateParams({ source: e.target.value, vendorId: '' })}
            className="pl-3 pr-7 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-gray-700"
          >
            <option value="all">All Sources</option>
            <option value="admin">By You (Admin)</option>
            <option value="vendor">By Vendors</option>
          </select>

          {/* Vendor picker — only when source = vendor */}
          {sourceFilter === 'vendor' && (
            <select
              value={vendorFilter}
              onChange={e => updateParams({ vendorId: e.target.value })}
              className="pl-3 pr-7 py-2 border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
            >
              <option value="">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.businessName}</option>)}
            </select>
          )}

          {/* Clear all */}
          {(sourceFilter !== 'all' || vendorFilter || categoryFilter || statusFilter !== 'all' || searchQ) && (
            <button
              onClick={() => { setSearchInput(''); updateParams({ status: 'all', categoryId: '', source: 'all', vendorId: '', search: '' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 p-8">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <List className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No listings found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tour</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Experience</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Quotes</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map(listing => {
                  const sc = STATUS_CONFIG[listing.status] || STATUS_CONFIG.DRAFT;
                  const thumb = getThumbnail(listing.images);
                  const quotes = listing._count?.quoteRequests ?? 0;
                  return (
                    <tr key={listing.id} className="hover:bg-indigo-50/30 transition-colors group">

                      {/* Tour */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 line-clamp-1 max-w-[180px] text-sm">{listing.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{listing.listingId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-4">
                        {listing.vendor?.businessName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-600 text-[10px] font-bold uppercase">
                                {listing.vendor.businessName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-gray-700 text-xs font-medium line-clamp-1 max-w-[110px]">
                              {listing.vendor.businessName}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 rounded-lg px-2.5 py-1">
                            <Building2 className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-100">
                          <span className="text-sm leading-none">{listing.category?.icon}</span>
                          {listing.category?.name || '—'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-medium border border-sky-100">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {listing.mainLocation?.name || '—'}
                        </span>
                      </td>

                      {/* Experience */}
                      <td className="px-4 py-4">
                        <select
                          value={listing.experience?.id || ''}
                          onChange={e => handleExperienceChange(listing.id, e.target.value)}
                          disabled={updatingId === listing.id}
                          className={`text-xs border rounded-xl pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 max-w-[160px] font-medium transition-colors ${
                            listing.experience?.id
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                          }`}
                        >
                          <option value="">No experience</option>
                          {experiences.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ring-1 ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Quotes */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center gap-1 min-w-[36px] px-2 py-1 rounded-xl text-xs font-bold ${
                          quotes > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <MessageSquare className="w-3 h-3" />
                          {quotes}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {updatingId === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <select
                              value={listing.status}
                              onChange={e => handleStatusChange(listing.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-xl pl-2 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white font-medium text-gray-700"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="DRAFT">Draft</option>
                              <option value="PAUSED">Paused</option>
                              <option value="INACTIVE">Inactive</option>
                            </select>
                          )}

                          {/* SEO */}
                          <button
                            onClick={() => openSeo(listing)}
                            title="SEO Settings"
                            className={`p-1.5 rounded-xl transition-colors ${
                              listing.metaTitle || listing.metaKeywords
                                ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>

                          {/* View */}
                          <a
                            href={`/wander/${listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on site"
                            className="p-1.5 rounded-xl bg-gray-100 text-gray-400 hover:bg-sky-100 hover:text-sky-600 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit */}
                          <Link
                            href={
                              listing.createMode === 'QUICK'
                                ? `/admin/wander/listings/${listing.id}/edit/quick`
                                : `/admin/wander/listings/${listing.id}/edit`
                            }
                            title="Edit listing"
                            className="p-1.5 rounded-xl bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · <span className="font-medium text-gray-700">{total}</span> listings
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                    p === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── SEO Modal ── */}
      {seoListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSeoListing(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
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
              <button onClick={() => setSeoListing(null)} className="p-1.5 hover:bg-gray-200 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">/wander/</span>
                  <input value={seoForm.slug} onChange={e => setSeoForm({ ...seoForm, slug: e.target.value })} placeholder="one-day-goa-tour-x7k2m" className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Change only if needed. Keep the hash suffix for uniqueness.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title <span className="text-xs text-gray-400 font-normal ml-1">{(seoForm.metaTitle || '').length}/60</span>
                </label>
                <input value={seoForm.metaTitle} onChange={e => setSeoForm({ ...seoForm, metaTitle: e.target.value })} placeholder={seoListing.title || 'Tour page title'} maxLength={70} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description <span className="text-xs text-gray-400 font-normal ml-1">{(seoForm.metaDescription || '').length}/160</span>
                </label>
                <textarea value={seoForm.metaDescription} onChange={e => setSeoForm({ ...seoForm, metaDescription: e.target.value })} placeholder="Brief description for Google search results..." maxLength={200} rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <input value={seoForm.metaKeywords} onChange={e => setSeoForm({ ...seoForm, metaKeywords: e.target.value })} placeholder="goa tour, one day trip, sightseeing" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[10px] text-gray-400 mt-1">Comma separated</p>
              </div>
              <div>
                <MediaPicker value={seoForm.ogImage} onChange={(url) => setSeoForm({ ...seoForm, ogImage: url })} label="OG Image (Social share preview)" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Google Preview</p>
                <div className="space-y-0.5">
                  <p className="text-blue-700 text-base font-medium truncate">{seoForm.metaTitle || seoListing.title || 'Tour Title'}</p>
                  <p className="text-emerald-700 text-xs">transrentals.in/wander/{seoForm.slug || seoListing.slug || '...'}</p>
                  <p className="text-gray-600 text-xs line-clamp-2">{seoForm.metaDescription || seoListing.shortDescription || 'Tour description will appear here...'}</p>
                </div>
              </div>
              {seoError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {seoError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setSeoListing(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
              <button onClick={saveSeo} disabled={seoSaving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-60">
                {seoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save SEO
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAddModeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">How would you like to add the tour?</h2>
                <p className="text-xs text-gray-500 mt-0.5">Pick the option that suits your workflow.</p>
              </div>
              <button
                onClick={() => setShowAddModeModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <button
                type="button"
                onClick={() => router.push('/admin/wander/listings/new/quick')}
                className="group text-left rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 hover:border-emerald-500 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Quick Add</h3>
                  <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Just the essentials — get a tour live in under a minute.</p>
                <ul className="text-[11px] text-gray-500 mt-3 space-y-1">
                  <li>• Category, title, location</li>
                  <li>• Duration & base price</li>
                  <li>• Description & images</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin/wander/listings/new')}
                className="group text-left rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 hover:border-indigo-500 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Detailed Add</h3>
                  <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Full 6-step wizard with itinerary, pricing tiers, inclusions.</p>
                <ul className="text-[11px] text-gray-500 mt-3 space-y-1">
                  <li>• Day-wise itinerary builder</li>
                  <li>• Vehicle options & pricing tiers</li>
                  <li>• Inclusions, exclusions, policies</li>
                </ul>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
