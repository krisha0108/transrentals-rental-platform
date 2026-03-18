// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight,
  Loader2, MapPin, Users, DollarSign, Clock, Tag, AlertCircle, Star,
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:    { label: 'Draft',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  ACTIVE:   { label: 'Active',   color: 'text-emerald-700', bg: 'bg-emerald-50' },
  PAUSED:   { label: 'Paused',   color: 'text-amber-700',  bg: 'bg-amber-50' },
  INACTIVE: { label: 'Inactive', color: 'text-red-700',    bg: 'bg-red-50' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'paused', label: 'Paused' },
];

export default function VendorWanderListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchListings(); }, [tab]);

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/wander/listings?status=${tab}`);
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
    } catch {
      setError('Failed to update status');
    }
  }

  async function deleteListing(id) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/vendor/wander/listings/${id}`, { method: 'DELETE' });
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tour Listings</h1>
            <p className="text-sm text-gray-500">Manage your Wander tour packages</p>
          </div>
        </div>
        <Link
          href="/vendor/wander/listings/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Tour
        </Link>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tour listings yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first tour package to start receiving bookings</p>
          <Link
            href="/vendor/wander/listings/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Tour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.DRAFT;
            const images = listing.images ? JSON.parse(listing.images) : [];
            return (
              <div key={listing.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 relative">
                  {images[0] ? (
                    <img src={images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Compass className="w-10 h-10 text-indigo-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  {listing.category && (
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                      <span>{listing.category.icon}</span>
                      {listing.category.name}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.mainLocation?.name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{listing.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />Min {listing.minGroupSize}</span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {listing._count?.quoteRequests || 0} requests
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      {listing.priceType === 'ON_REQUEST' ? (
                        <span className="text-xs text-gray-500 italic">Price on Request</span>
                      ) : (
                        <span className="text-sm font-semibold text-indigo-700">
                          ₹{listing.basePrice?.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            /{listing.priceType === 'PER_PERSON' ? 'person' : 'group'}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/vendor/wander/listings/${listing.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleStatus(listing)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition"
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
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                        >
                          {deleting ? '...' : 'Delete'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(listing.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
  );
}
