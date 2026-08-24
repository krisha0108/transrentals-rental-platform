'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Loader2,
  Trash2,
  X,
  Search,
  Filter,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  slug: string;
  type?: string;
  parent?: { name: string } | null;
}

interface LocationRequest {
  id: string;
  locationId: string;
  status: string;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  locations: Location;
}

interface ApprovedLocation {
  id: string;
  isActive: boolean;
  locationId: string;
  locations: Location;
}

export default function VendorLocationsPage() {
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [approvedLocations, setApprovedLocations] = useState<ApprovedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Approved locations — search, filter, select
  const [locSearch, setLocSearch] = useState('');
  const [locStateFilter, setLocStateFilter] = useState('');
  const [selectedLocIds, setSelectedLocIds] = useState<Set<string>>(new Set());

  // Pending requests — search, select
  const [pendingSearch, setPendingSearch] = useState('');
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/vendor/locations');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setApprovedLocations(data.approvedLocations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDeleteApproved = async (locationId: string) => {
    if (!confirm('Remove this approved location? You will need to re-request approval.')) return;
    setDeletingId(locationId);
    try {
      const res = await fetch(`/api/vendor/locations?locationId=${locationId}&type=approved`, { method: 'DELETE' });
      if (res.ok) {
        await fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove location');
      }
    } catch {
      alert('Failed to remove location');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDeleteApproved = async (locationIds: string[]) => {
    if (!confirm(`Remove ${locationIds.length} selected location(s)? You will need to re-request approval.`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/vendor/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds, type: 'approved' }),
      });
      if (res.ok) {
        setSelectedLocIds(new Set());
        await fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove locations');
      }
    } catch {
      alert('Failed to remove locations');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleWithdrawRequest = async (locationId: string) => {
    if (!confirm('Withdraw this location request?')) return;
    setDeletingId(locationId);
    try {
      const res = await fetch(`/api/vendor/locations?locationId=${locationId}&type=request`, { method: 'DELETE' });
      if (res.ok) {
        await fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to withdraw request');
      }
    } catch {
      alert('Failed to withdraw request');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkWithdraw = async (locationIds: string[]) => {
    if (!confirm(`Withdraw ${locationIds.length} selected request(s)?`) ) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/vendor/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds, type: 'request' }),
      });
      if (res.ok) {
        setSelectedPendingIds(new Set());
        await fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to withdraw requests');
      }
    } catch {
      alert('Failed to withdraw requests');
    } finally {
      setBulkLoading(false);
    }
  };

  const allPendingRequests = (requests || []).filter((r) => r?.status === 'PENDING');
  const rejectedRequests = (requests || []).filter((r) => r?.status === 'REJECTED');

  // Derived approved list
  const uniqueStates = [...new Set(
    approvedLocations.map((l) => l.locations?.parent?.name || '').filter(Boolean)
  )].sort();
  const filteredApproved = approvedLocations
    .filter((l) => !locSearch ||
      (l.locations?.name || '').toLowerCase().includes(locSearch.toLowerCase()) ||
      (l.locations?.parent?.name || '').toLowerCase().includes(locSearch.toLowerCase())
    )
    .filter((l) => !locStateFilter || (l.locations?.parent?.name || '') === locStateFilter);

  const allApprovedFilteredIds = filteredApproved.map((l) => l.locationId);
  const allApprovedSelected = allApprovedFilteredIds.length > 0 && allApprovedFilteredIds.every((id) => selectedLocIds.has(id));
  const toggleAllApproved = () => {
    if (allApprovedSelected) {
      setSelectedLocIds((prev) => { const s = new Set(prev); allApprovedFilteredIds.forEach((id) => s.delete(id)); return s; });
    } else {
      setSelectedLocIds((prev) => { const s = new Set(prev); allApprovedFilteredIds.forEach((id) => s.add(id)); return s; });
    }
  };

  // Derived pending list
  const filteredPending = allPendingRequests.filter((r) =>
    !pendingSearch ||
    (r.locations?.name || '').toLowerCase().includes(pendingSearch.toLowerCase()) ||
    (r.locations?.parent?.name || '').toLowerCase().includes(pendingSearch.toLowerCase())
  );
  const allPendingFilteredIds = filteredPending.map((r) => r.locationId);
  const allPendingSelected = allPendingFilteredIds.length > 0 && allPendingFilteredIds.every((id) => selectedPendingIds.has(id));
  const toggleAllPending = () => {
    if (allPendingSelected) {
      setSelectedPendingIds((prev) => { const s = new Set(prev); allPendingFilteredIds.forEach((id) => s.delete(id)); return s; });
    } else {
      setSelectedPendingIds((prev) => { const s = new Set(prev); allPendingFilteredIds.forEach((id) => s.add(id)); return s; });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
        <style jsx>{`
          @keyframes shimmer-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <div className="w-full space-y-6">
          {/* Skeleton header */}
          <div className="relative overflow-hidden rounded-2xl h-24 bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200">
            <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer-sweep 2s infinite' }} /></div>
          </div>
          {/* Skeleton stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0,1,2].map((i) => (
              <div key={i} className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] h-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer-sweep 2s infinite' }} /></div>
              </div>
            ))}
          </div>
          {/* Skeleton card */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
              </div>
            ))}
            <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer-sweep 2s infinite' }} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.08); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0.5; transform: translateY(0) scale(0.8); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.3); }
        }
        @keyframes bubble-drift {
          0% { opacity: 0.4; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(10px, -40px) scale(0.4); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5, 150, 105, 0.2); }
          50% { box-shadow: 0 0 20px rgba(5, 150, 105, 0.4); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="w-full space-y-6">
        {/* Header — animated emerald */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 sm:px-6 py-4 sm:py-5"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857, #0d9488, #059669)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 8s ease infinite',
          }}
        >
          {/* Filled floating bubbles (right side) */}
          <div className="absolute right-8 top-3 w-16 h-16 rounded-full bg-white/[0.07]" style={{ animation: 'float-slow 6s ease-in-out infinite' }} />
          <div className="absolute right-28 bottom-2 w-10 h-10 rounded-full bg-white/[0.05]" style={{ animation: 'float-rev 5s ease-in-out infinite' }} />
          <div className="absolute right-16 top-1/2 w-8 h-8 rounded-full bg-white/[0.06]" style={{ animation: 'float-slow 7s ease-in-out infinite 0.5s' }} />
          <div className="absolute right-44 top-4 w-6 h-6 rounded-full bg-white/[0.04]" style={{ animation: 'float-rev 4s ease-in-out infinite 1s' }} />

          {/* Sparkle dots */}
          <div className="absolute right-12 top-4 w-1.5 h-1.5 rounded-full bg-white/80" style={{ animation: 'sparkle 3s ease-in-out infinite' }} />
          <div className="absolute right-32 bottom-4 w-1 h-1 rounded-full bg-white/70" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.8s' }} />
          <div className="absolute right-24 top-2 w-1 h-1 rounded-full bg-white/60" style={{ animation: 'sparkle 4s ease-in-out infinite 1.5s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-20 bottom-0 w-2 h-2 rounded-full bg-white/30" style={{ animation: 'bubble-rise-1 4s ease-out infinite' }} />
          <div className="absolute right-36 bottom-0 w-1.5 h-1.5 rounded-full bg-white/25" style={{ animation: 'bubble-rise-2 3.5s ease-out infinite 1s' }} />
          <div className="absolute right-10 bottom-0 w-2.5 h-2.5 rounded-full bg-white/20" style={{ animation: 'bubble-drift 5s ease-out infinite 0.5s' }} />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              style={{ animation: 'shimmer-sweep 4s ease-in-out infinite' }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Glassmorphic icon badge */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20"
                style={{ animation: 'bounce-in 0.6s ease-out' }}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1
                  className="text-lg sm:text-xl font-bold text-white"
                  style={{ animation: 'slide-in-left 0.5s ease-out' }}
                >
                  My Locations
                </h1>
                <p className="text-[11px] text-white/60">Manage your operational locations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/vendor/locations/request">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-700 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Request Location</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats — alive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Approved Locations', value: approvedLocations.length, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', color: 'text-emerald-600', tint: 'bg-emerald-50', glow: 'hover:shadow-emerald-200/60', delay: '0s' },
            { label: 'Pending Requests', value: allPendingRequests.length, icon: Clock, gradient: 'from-amber-400 to-orange-500', color: 'text-amber-500', tint: 'bg-amber-50', glow: 'hover:shadow-amber-200/60', delay: '0.1s' },
            { label: 'Rejected', value: rejectedRequests.length, icon: XCircle, gradient: 'from-red-400 to-rose-500', color: 'text-red-500', tint: 'bg-red-50', glow: 'hover:shadow-red-200/60', delay: '0.2s' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group relative bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-xl ${stat.glow} hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-gray-100/50 hover:border-emerald-200/50`}
                style={{ animation: `fade-up 0.5s ease-out ${stat.delay} both` }}
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 ${stat.tint} rounded-full opacity-60 group-hover:scale-150 group-hover:opacity-80 transition-all duration-500`}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-extrabold ${stat.color} mt-1 group-hover:scale-105 origin-left transition-transform`}>{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Approved Locations */}
        <div
          className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-all duration-300 border border-transparent hover:border-emerald-100"
          style={{ animation: 'fade-up 0.5s ease-out 0.3s both' }}
        >
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approved Locations ({approvedLocations.length})
              </h2>
              {selectedLocIds.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkDeleteApproved([...selectedLocIds])}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                  Remove Selected ({selectedLocIds.size})
                </Button>
              )}
            </div>
            {approvedLocations.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-emerald-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
                {uniqueStates.length > 0 && (
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={locStateFilter}
                      onChange={(e) => { setLocStateFilter(e.target.value); setSelectedLocIds(new Set()); }}
                      className="pl-8 pr-6 py-1.5 text-sm border border-emerald-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none cursor-pointer transition-colors"
                    >
                      <option value="">All States</option>
                      {uniqueStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {approvedLocations.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-emerald-300" />
              </div>
              <p className="text-base font-bold text-gray-600">No approved locations yet</p>
              <p className="text-sm text-gray-400 mt-1">Request your first location to get started</p>
              <Link href="/vendor/locations/request">
                <Button variant="outline" className="mt-4 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">Request Your First Location</Button>
              </Link>
            </div>
          ) : filteredApproved.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No locations match your filter</div>
          ) : (
            <>
              <div className="px-4 py-2 bg-gray-50/80 border-b flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allApprovedSelected}
                  onChange={toggleAllApproved}
                  className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                />
                <span className="text-xs text-gray-500">
                  {allApprovedSelected ? 'Deselect all' : `Select all ${filteredApproved.length}`}
                  {locStateFilter && ` in ${locStateFilter}`}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredApproved.map((item, idx) => {
                  const loc = item.locations;
                  const parentLoc = loc?.parent;
                  return (
                    <div
                      key={item.id}
                      className={`relative flex items-center justify-between px-5 py-3 transition-all duration-200 group ${selectedLocIds.has(item.locationId) ? 'bg-emerald-50/60' : 'hover:bg-emerald-50/30'}`}
                      style={idx < 20 ? { animation: `fade-up 0.4s ease-out ${0.03 * idx}s both` } : undefined}
                    >
                      {/* Left accent on hover */}
                      <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-emerald-500 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center"></div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLocIds.has(item.locationId)}
                          onChange={() => setSelectedLocIds((prev) => {
                            const s = new Set(prev); s.has(item.locationId) ? s.delete(item.locationId) : s.add(item.locationId); return s;
                          })}
                          className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                        />
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-gray-900">{loc?.name || 'Unknown'}</span>
                          {parentLoc?.name && (
                            <span className="text-gray-400 text-[11px] ml-1.5">({parentLoc.name})</span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Active
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteApproved(item.locationId)}
                        disabled={deletingId === item.locationId || bulkLoading}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Remove location"
                      >
                        {deletingId === item.locationId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pending Requests */}
        {allPendingRequests.length > 0 && (
          <div
            className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-all duration-300 border border-transparent hover:border-amber-100"
            style={{ animation: 'fade-up 0.5s ease-out 0.4s both' }}
          >
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-50/50 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-amber-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Requests ({allPendingRequests.length})
                </h2>
                {selectedPendingIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkWithdraw([...selectedPendingIds])}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                    Withdraw Selected ({selectedPendingIds.size})
                  </Button>
                )}
              </div>
              {allPendingRequests.length > 1 && (
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pending requests..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-amber-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              )}
            </div>

            {filteredPending.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No pending requests match your search</div>
            ) : (
              <>
                {allPendingRequests.length > 1 && (
                  <div className="px-4 py-2 bg-gray-50/80 border-b flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleAllPending}
                      className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                    />
                    <span className="text-xs text-gray-500">
                      {allPendingSelected ? 'Deselect all' : `Select all ${filteredPending.length}`}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-gray-100">
                  {filteredPending.map((request, idx) => {
                    const loc = request.locations;
                    const parentLoc = loc?.parent;
                    return (
                      <div
                        key={request.id}
                        className={`p-4 flex items-center justify-between transition-all duration-200 group ${selectedPendingIds.has(request.locationId) ? 'bg-amber-50/60' : 'hover:bg-amber-50/30'}`}
                        style={{ animation: `fade-up 0.4s ease-out ${0.05 * idx}s both` }}
                      >
                        <div className="flex items-center gap-3">
                          {allPendingRequests.length > 1 && (
                            <input
                              type="checkbox"
                              checked={selectedPendingIds.has(request.locationId)}
                              onChange={() => setSelectedPendingIds((prev) => {
                                const s = new Set(prev); s.has(request.locationId) ? s.delete(request.locationId) : s.add(request.locationId); return s;
                              })}
                              className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                            />
                          )}
                          <MapPin className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform duration-200" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {loc?.name || 'Unknown'}
                              {parentLoc?.name && (
                                <span className="text-gray-500 ml-1">({parentLoc.name})</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">Requested {formatDate(request.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                            Pending Review
                          </span>
                          <button
                            onClick={() => handleWithdrawRequest(request.locationId)}
                            disabled={deletingId === request.locationId || bulkLoading}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                            title="Withdraw request"
                          >
                            {deletingId === request.locationId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div
            className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-all duration-300 border border-transparent hover:border-red-100"
            style={{ animation: 'fade-up 0.5s ease-out 0.5s both' }}
          >
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-50/50 border-b border-red-100">
              <h2 className="text-base font-bold text-red-800 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Rejected Requests ({rejectedRequests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {rejectedRequests.map((request, idx) => {
                const loc = request.locations;
                const parentLoc = loc?.parent;
                return (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-red-50/30 transition-all duration-200 group"
                    style={{ animation: `fade-up 0.4s ease-out ${0.05 * idx}s both` }}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {loc?.name || 'Unknown'}
                          {parentLoc?.name && (
                            <span className="text-gray-500 ml-1">({parentLoc.name})</span>
                          )}
                        </p>
                        {request.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">Reason: {request.rejectionReason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Rejected on {request.reviewedAt ? formatDate(request.reviewedAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
