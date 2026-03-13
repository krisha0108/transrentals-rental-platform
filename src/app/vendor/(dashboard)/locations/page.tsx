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
    if (!confirm(`Withdraw ${locationIds.length} selected request(s)?`)) return;
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Locations</h1>
          <p className="text-gray-600">Manage your operational locations</p>
        </div>
        <Link href="/vendor/locations/request">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Location
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{approvedLocations.length}</p>
              <p className="text-sm text-gray-600">Approved Locations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{allPendingRequests.length}</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejectedRequests.length}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Locations */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-green-50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-green-800 flex items-center gap-2">
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
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                />
              </div>
              {uniqueStates.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={locStateFilter}
                    onChange={(e) => { setLocStateFilter(e.target.value); setSelectedLocIds(new Set()); }}
                    className="pl-8 pr-6 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white appearance-none cursor-pointer"
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
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No approved locations yet</p>
            <Link href="/vendor/locations/request">
              <Button variant="outline" className="mt-4">Request Your First Location</Button>
            </Link>
          </div>
        ) : filteredApproved.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No locations match your filter</div>
        ) : (
          <>
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
              <input
                type="checkbox"
                checked={allApprovedSelected}
                onChange={toggleAllApproved}
                className="w-4 h-4 rounded cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-gray-500">
                {allApprovedSelected ? 'Deselect all' : `Select all ${filteredApproved.length}`}
                {locStateFilter && ` in ${locStateFilter}`}
              </span>
            </div>
            <div className="divide-y">
              {filteredApproved.map((item) => {
                const loc = item.locations;
                const parentLoc = loc?.parent;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3 transition-colors ${selectedLocIds.has(item.locationId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLocIds.has(item.locationId)}
                        onChange={() => setSelectedLocIds((prev) => {
                          const s = new Set(prev); s.has(item.locationId) ? s.delete(item.locationId) : s.add(item.locationId); return s;
                        })}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">{loc?.name || 'Unknown'}</span>
                      {parentLoc?.name && (
                        <span className="text-gray-500 text-sm">({parentLoc.name})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteApproved(item.locationId)}
                      disabled={deletingId === item.locationId || bulkLoading}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-yellow-50 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-yellow-800 flex items-center gap-2">
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
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
                />
              </div>
            )}
          </div>

          {filteredPending.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No pending requests match your search</div>
          ) : (
            <>
              {allPendingRequests.length > 1 && (
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAllPending}
                    className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-gray-500">
                    {allPendingSelected ? 'Deselect all' : `Select all ${filteredPending.length}`}
                  </span>
                </div>
              )}
              <div className="divide-y">
                {filteredPending.map((request) => {
                  const loc = request.locations;
                  const parentLoc = loc?.parent;
                  return (
                    <div
                      key={request.id}
                      className={`p-4 flex items-center justify-between transition-colors ${selectedPendingIds.has(request.locationId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        {allPendingRequests.length > 1 && (
                          <input
                            type="checkbox"
                            checked={selectedPendingIds.has(request.locationId)}
                            onChange={() => setSelectedPendingIds((prev) => {
                              const s = new Set(prev); s.has(request.locationId) ? s.delete(request.locationId) : s.add(request.locationId); return s;
                            })}
                            className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                          />
                        )}
                        <MapPin className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {loc?.name || 'Unknown'}
                            {parentLoc?.name && (
                              <span className="text-gray-500 ml-1">({parentLoc.name})</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Requested {formatDate(request.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          Pending Review
                        </span>
                        <button
                          onClick={() => handleWithdrawRequest(request.locationId)}
                          disabled={deletingId === request.locationId || bulkLoading}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-red-50 border-b">
            <h2 className="font-semibold text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Rejected Requests ({rejectedRequests.length})
            </h2>
          </div>
          <div className="divide-y">
            {rejectedRequests.map((request) => {
              const loc = request.locations;
              const parentLoc = loc?.parent;
              return (
                <div key={request.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
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
  );
}
