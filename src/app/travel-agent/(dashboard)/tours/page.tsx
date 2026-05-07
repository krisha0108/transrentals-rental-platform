'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  startingPrice: number | null;
  coverImage: string | null;
  category: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
  totalRatings: number;
  createdAt: string;
}

export default function ToursListPage() {
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [tours, setTours] = useState<Tour[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

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
        <Link
          href="/travel-agent/tours/add"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Tour
        </Link>
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
          <Link
            href="/travel-agent/tours/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Tour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours.map((tour) => (
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
                      <Lock className="w-2.5 h-2.5" /> DRAFT
                    </span>
                  )}
                  {!tour.isActive && (
                    <span className="inline-flex bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      INACTIVE
                    </span>
                  )}
                </div>
                {tour.startingPrice && (
                  <div className="absolute bottom-2 right-2 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    ₹{tour.startingPrice.toLocaleString('en-IN')}
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
                    <Calendar className="w-3 h-3" /> {tour.durationDays}D/{tour.durationNights}N
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
                      href={`/travel-agent/tours/${tour.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
