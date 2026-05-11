// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Plus,
  Compass,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Globe,
  Lock,
  Power,
  PowerOff,
  Eye,
  Zap,
  FileText,
  ArrowRight,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

interface Tour {
  id: string;
  title: string;
  slug: string | null;
  destination: string;
  durationDays: number;
  durationNights: number;
  duration: string | null;
  startingPrice: number | null;
  basePrice: number | null;
  priceType: string | null;
  coverImage: string | null;
  category: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
  totalRatings: number;
  createdAt: string;
  status: string;
  createMode: string;
}

export default function ToursListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [tours, setTours] = useState<Tour[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModeModal, setShowAddModeModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get('addMode') === 'open') {
      setShowAddModeModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('addMode');
      router.replace(url.pathname + (url.search || ''), { scroll: false });
    }
  }, [searchParams, router]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`/api/travel-agent/tours?${params}`);
      if (res.ok) {
        const json = await res.json();
        setTours(json.tours || []);
        setStats(json.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const togglePublic = async (tour: Tour) => {
    if (!tour.isPublic && !isApproved) {
      openVerificationModal();
      return;
    }
    const res = await fetch(`/api/travel-agent/tours/${tour.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !tour.isPublic }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: tour.isPublic ? 'Tour unpublished' : 'Tour published' });
      await load();
    } else {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Failed' });
    }
  };

  const toggleActive = async (tour: Tour) => {
    const res = await fetch(`/api/travel-agent/tours/${tour.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !tour.isActive }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: tour.isActive ? 'Tour deactivated' : 'Tour activated' });
      await load();
    }
  };

  const deleteTour = async (id: string) => {
    if (!confirm('Permanently delete this tour?')) return;
    const res = await fetch(`/api/travel-agent/tours/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Tour deleted' });
      await load();
    }
  };

  function getEditHref(tour: Tour): string {
    return tour.createMode === 'QUICK'
      ? `/travel-agent/tours/${tour.id}/edit/quick`
      : `/travel-agent/tours/${tour.id}/edit`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tours</h1>
            <p className="text-sm text-gray-500">
              {stats.total} total • {stats.active} active • {stats.published} published
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModeModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Tour
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, destination or category..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No tours added yet</p>
          <p className="text-sm text-gray-400 mb-4">Add your first tour package to get started</p>
          <button
            type="button"
            onClick={() => setShowAddModeModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Tour
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours.map((tour) => {
            const priceLabel =
              tour.priceType === 'ON_REQUEST'
                ? 'On Request'
                : tour.basePrice
                  ? `₹${tour.basePrice.toLocaleString('en-IN')}`
                  : tour.startingPrice
                    ? `₹${tour.startingPrice.toLocaleString('en-IN')}`
                    : null;
            return (
              <div
                key={tour.id}
                className={`bg-white rounded-2xl border overflow-hidden ${
                  tour.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-emerald-100 to-teal-100 relative">
                  {tour.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tour.coverImage} alt={tour.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-12 h-12 text-emerald-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {tour.isPublic ? (
                      <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Globe className="w-2.5 h-2.5" /> PUBLIC
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" /> {tour.status === 'DRAFT' ? 'DRAFT' : 'PRIVATE'}
                      </span>
                    )}
                    {!tour.isActive && (
                      <span className="inline-flex bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        INACTIVE
                      </span>
                    )}
                    {tour.createMode === 'QUICK' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Zap className="w-2.5 h-2.5" /> QUICK
                      </span>
                    )}
                  </div>
                  {priceLabel && (
                    <div className="absolute bottom-2 right-2 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {priceLabel}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="font-bold text-gray-900 line-clamp-1">{tour.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {tour.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {tour.duration || `${tour.durationDays}D/${tour.durationNights}N`}
                    </span>
                  </div>
                  {tour.category && (
                    <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {tour.category}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePublic(tour)}
                        title={tour.isPublic ? 'Unpublish' : 'Publish'}
                        className={`p-1.5 rounded-lg border ${
                          tour.isPublic
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                      >
                        {tour.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleActive(tour)}
                        title={tour.isActive ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                      >
                        {tour.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteTour(tour.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/travel-agent/tours/${tour.id}/preview`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Link>
                      <Link
                        href={getEditHref(tour)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add-mode chooser modal */}
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
                onClick={() => router.push('/travel-agent/tours/add/quick')}
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
                onClick={() => router.push('/travel-agent/tours/add')}
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
