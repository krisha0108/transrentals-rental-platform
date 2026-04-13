// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, MapPin, Users, Clock, Tag, AlertCircle, Star,
  Search, PackageCheck, PauseCircle, FileEdit, TrendingUp, Sparkles,
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
  ACTIVE:   { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PAUSED:   { label: 'Paused',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',       dot: 'bg-emerald-400' },
  INACTIVE: { label: 'Inactive', cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-400' },
};

const TABS = [
  { key: 'all',    label: 'All Listings' },
  { key: 'active', label: 'Active' },
  { key: 'draft',  label: 'Drafts' },
  { key: 'paused', label: 'Paused' },
];

export default function VendorWanderListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [error, setError]       = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchListings(); }, [tab]);

  async function fetchListings() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/vendor/wander/listings?status=${tab}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(listing) {
    const newStatus = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await fetch(`/api/vendor/wander/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchListings();
    } catch { setError('Failed to update status'); }
  }

  async function deleteListing(id) {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/vendor/wander/listings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDeleteConfirm(null);
      fetchListings();
    } catch {
      setError('Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = listings.filter(l =>
    !search || l.title?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all:    listings.length,
    active: listings.filter(l => l.status === 'ACTIVE').length,
    draft:  listings.filter(l => l.status === 'DRAFT').length,
    paused: listings.filter(l => l.status === 'PAUSED').length,
  };

  const totalRequests = listings.reduce((s, l) => s + (l._count?.quoteRequests || 0), 0);

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-screen">

      {/* ── Dark Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                <Compass className="w-3 h-3" /> Wander Tours
              </span>
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">
              My Tour Listings
            </h1>
            <p className="text-emerald-100/70 text-sm">Manage, publish and track all your tour packages</p>
          </div>
          <Link
            href="/vendor/wander/listings/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-xl hover:bg-white/30 active:bg-white/10 transition font-semibold text-sm shadow-lg shadow-black/10 flex-shrink-0 mt-1"
          >
            <Plus className="w-4 h-4" /> Create Tour
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Listings',  value: listings.length,  icon: Compass,      iconBg: 'bg-white/10',         iconColor: 'text-emerald-200',   valColor: 'text-white' },
            { label: 'Active',          value: counts.active,    icon: PackageCheck, iconBg: 'bg-white/15',     iconColor: 'text-emerald-200',   valColor: 'text-emerald-200' },
            { label: 'Drafts',          value: counts.draft,     icon: FileEdit,     iconBg: 'bg-emerald-500/20',     iconColor: 'text-emerald-400',   valColor: 'text-emerald-300' },
            { label: 'Quote Requests',  value: totalRequests,    icon: TrendingUp,   iconBg: 'bg-teal-500/20',      iconColor: 'text-teal-400',    valColor: 'text-teal-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{m.label}</p>
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${m.valColor} leading-none`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Toolbar ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between gap-4 sticky top-[57px] z-20 shadow-sm">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-emerald-700/40 text-emerald-100' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-gray-50 transition"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-7">
        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-44 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-400 font-medium">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Compass className="w-8 h-8 text-emerald-200" />
            </div>
            <p className="font-bold text-gray-800 mb-1 text-base">No tour listings yet</p>
            <p className="text-gray-400 text-sm mb-6">Create your first tour to start receiving bookings</p>
            <Link
              href="/vendor/wander/listings/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-xl hover:bg-emerald-600 transition text-sm font-semibold shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Create Your First Tour
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filtered.map((listing) => {
              const sc     = STATUS_CONFIG[listing.status] || STATUS_CONFIG.DRAFT;
              const images = listing.images ? JSON.parse(listing.images) : [];
              return (
                <div
                  key={listing.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-200 flex flex-col group"
                >
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-emerald-100 relative flex-shrink-0 overflow-hidden">
                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Compass className="w-14 h-14 text-emerald-100" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.cls} shadow-sm backdrop-blur-sm`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    {/* Category */}
                    {listing.category && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-black/45 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg border border-white/10">
                          {listing.category.icon} {listing.category.name}
                        </span>
                      </div>
                    )}

                    {/* Bottom overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      {listing.mainLocation?.name && (
                        <span className="text-white text-xs flex items-center gap-1 drop-shadow font-medium">
                          <MapPin className="w-3 h-3" /> {listing.mainLocation.name}
                        </span>
                      )}
                      {listing.rating > 0 && (
                        <span className="inline-flex items-center gap-1 bg-emerald-400 text-gray-900 text-[11px] font-black px-2 py-0.5 rounded-lg shadow">
                          <Star className="w-3 h-3 fill-gray-900" /> {listing.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-[13px] leading-snug mb-3 line-clamp-2">{listing.title}</h3>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-400" />{listing.duration || '—'}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-400" />Min {listing.minGroupSize || '—'}</span>
                      <span className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-emerald-400" />{listing._count?.quoteRequests || 0} requests</span>
                      <span className="flex items-center gap-1.5 font-bold text-emerald-700 text-[11px]">
                        {listing.priceType === 'ON_REQUEST'
                          ? 'On Request'
                          : `₹${listing.basePrice?.toLocaleString('en-IN')}${listing.priceType === 'PER_PERSON' ? '/pp' : '/grp'}`
                        }
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-auto">
                      <Link
                        href={`/vendor/wander/listings/${listing.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => toggleStatus(listing)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                      >
                        {listing.status === 'ACTIVE'
                          ? <><ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> Pause</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Activate</>
                        }
                      </button>
                      {deleteConfirm === listing.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => deleteListing(listing.id)}
                            disabled={deleting}
                            className="px-2.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60"
                          >
                            {deleting ? '...' : 'Confirm'}
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 transition">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(listing.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
