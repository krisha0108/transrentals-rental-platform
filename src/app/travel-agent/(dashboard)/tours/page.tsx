// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
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

/* Fade-up on mount */
function AnimateIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  if (loading && tours.length === 0) {
    return (
      <div className="-m-4 lg:-m-6">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-4 sm:px-6 pt-5 pb-16 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20" />
            <div className="space-y-2.5">
              <div className="h-5 w-32 bg-white/20 rounded-lg" />
              <div className="h-3 w-44 bg-white/15 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-6 flex-wrap">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/15 rounded-2xl w-36 h-[64px]" />
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-6 -mt-8 pb-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 lg:-m-6">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 relative overflow-hidden px-4 sm:px-6 pt-5 pb-16">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative w-full">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">My Tours</h1>
                <p className="text-emerald-200 text-sm">Manage your tour packages</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModeModal(true)}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Tour
            </button>
          </div>

          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Total Tours', value: stats.total, icon: <Compass className="w-5 h-5" /> },
              { label: 'Active', value: stats.active, icon: <Power className="w-5 h-5" /> },
              { label: 'Published', value: stats.published, icon: <Globe className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/[0.18] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner shadow-white/10">{stat.icon}</div>
                <div>
                  <p className="text-xl font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 -mt-8 pb-12 w-full space-y-4">

        <AnimateIn delay={40}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, destination or category..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
        </AnimateIn>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : tours.length === 0 ? (
          <AnimateIn delay={80}>
            <div className="bg-white rounded-2xl border border-gray-200/80 py-20 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-gray-700 font-bold text-base">
                {search ? 'No tours found' : 'No tours added yet'}
              </p>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
                {search ? 'Try adjusting your search' : 'Add your first tour package to get started'}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => setShowAddModeModal(true)}
                  className="inline-flex items-center gap-2 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Tour
                </button>
              )}
            </div>
          </AnimateIn>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map((tour, index) => {
              const priceLabel =
                tour.priceType === 'ON_REQUEST'
                  ? 'On Request'
                  : tour.basePrice
                    ? `₹${tour.basePrice.toLocaleString('en-IN')}`
                    : tour.startingPrice
                      ? `₹${tour.startingPrice.toLocaleString('en-IN')}`
                      : null;
              return (
                <AnimateIn key={tour.id} delay={80 + index * 40}>
                  <div
                    className={`bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ${
                      tour.isActive ? '' : 'opacity-60'
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
                            className={`p-1.5 rounded-lg border transition-colors ${
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
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700 transition-colors"
                          >
                            {tour.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteTour(tour.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
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
                </AnimateIn>
              );
            })}
          </div>
        )}
      </div>

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
