'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Store, Phone, Mail, MapPin, Layers,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle, Clock,
  XCircle, FileText, Car, Star, TrendingUp, TrendingDown,
  Calendar, X,
} from 'lucide-react';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  rating: number;
  totalRatings: number;
  locations: string[];
  locationNames: string[];
  services: string[];
  serviceNames: string[];
  documentCount: number;
  fleetCount: number;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  PENDING:           { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending',      icon: Clock },
  DOCUMENTS_PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Docs Pending', icon: FileText },
  UNDER_REVIEW:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Under Review', icon: Clock },
  APPROVED:          { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Approved',     icon: CheckCircle },
  REJECTED:          { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected',     icon: XCircle },
  SUSPENDED:         { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Suspended',    icon: AlertCircle },
  BLOCKED:           { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Blocked',      icon: XCircle },
};

const SORT_OPTIONS = [
  { value: 'date_desc',    label: 'Newest First',    icon: Calendar },
  { value: 'date_asc',     label: 'Oldest First',    icon: Calendar },
  { value: 'rating_desc',  label: 'Top Ranking',     icon: TrendingUp },
  { value: 'rating_asc',   label: 'Low Ranking',     icon: TrendingDown },
  { value: 'fleet_desc',   label: 'Big Fleet First', icon: Car },
  { value: 'fleet_asc',    label: 'Small Fleet',     icon: Car },
];

export default function ManagerVendorsPage() {
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const fetchVendors = async () => {
    try {
      setError(null);
      const response = await fetch('/api/manager/vendors');
      const data = await response.json();
      if (data.success) {
        setAllVendors(data.vendors);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleRefresh = () => { setIsRefreshing(true); fetchVendors(); };

  // Extract unique locations and services for dropdowns
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    allVendors.forEach(v => v.locationNames.forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [allVendors]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    allVendors.forEach(v => v.serviceNames.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [allVendors]);

  // Client-side filtering + sorting
  const vendors = useMemo(() => {
    let list = [...allVendors];

    // Name / phone search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.businessName.toLowerCase().includes(q) ||
        v.ownerName.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.email.toLowerCase().includes(q)
      );
    }

    // Location filter
    if (locationFilter !== 'all') {
      list = list.filter(v => v.locationNames.includes(locationFilter));
    }

    // Service filter
    if (serviceFilter !== 'all') {
      list = list.filter(v => v.serviceNames.includes(serviceFilter));
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'PENDING') {
        list = list.filter(v => ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'].includes(v.status));
      } else {
        list = list.filter(v => v.status === statusFilter);
      }
    }

    // Sort
    switch (sortBy) {
      case 'date_asc':   list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'date_desc':  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'rating_desc': list.sort((a, b) => b.rating - a.rating); break;
      case 'rating_asc':  list.sort((a, b) => a.rating - b.rating); break;
      case 'fleet_desc':  list.sort((a, b) => b.fleetCount - a.fleetCount); break;
      case 'fleet_asc':   list.sort((a, b) => a.fleetCount - b.fleetCount); break;
    }

    return list;
  }, [allVendors, search, locationFilter, serviceFilter, statusFilter, sortBy]);

  const activeFilterCount = [
    search, locationFilter !== 'all' ? locationFilter : '', serviceFilter !== 'all' ? serviceFilter : '',
    statusFilter !== 'all' ? statusFilter : '', sortBy !== 'date_desc' ? sortBy : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setLocationFilter('all'); setServiceFilter('all');
    setStatusFilter('all'); setSortBy('date_desc');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">
            {vendors.length} of {allVendors.length} vendors
            {activeFilterCount > 0 && <span className="ml-1 text-green-600 font-medium">({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active)</span>}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: stats.total,     icon: Store,        color: 'bg-gray-100 text-gray-600',   valColor: 'text-gray-900' },
            { label: 'Approved',  value: stats.approved,  icon: CheckCircle,  color: 'bg-green-100 text-green-600', valColor: 'text-green-600' },
            { label: 'Pending',   value: stats.pending,   icon: Clock,        color: 'bg-yellow-100 text-yellow-600', valColor: 'text-yellow-600' },
            { label: 'Suspended', value: stats.suspended, icon: AlertCircle,  color: 'bg-purple-100 text-purple-600', valColor: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, color, valColor }) => (
            <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className={`text-2xl font-bold ${valColor}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Location */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Location</label>
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Locations</option>
              {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Service</label>
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Services</option>
              {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending (All)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_PENDING">Docs Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active filter chips + clear */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {search && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                <Search className="w-3 h-3" /> "{search}"
                <button onClick={() => setSearch('')}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {locationFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                <MapPin className="w-3 h-3" /> {locationFilter}
                <button onClick={() => setLocationFilter('all')}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {serviceFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                <Layers className="w-3 h-3" /> {serviceFilter}
                <button onClick={() => setServiceFilter('all')}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                {statusFilter}
                <button onClick={() => setStatusFilter('all')}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {sortBy !== 'date_desc' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <button onClick={() => setSortBy('date_desc')}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 underline ml-1 transition">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Vendors List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {vendors.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'No vendors in your assigned locations yet'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {vendors.map((vendor) => {
              const statusConfig = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;
              return (
                <Link key={vendor.id} href={`/manager/vendors/${vendor.id}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{vendor.businessName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        {vendor.rating > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {vendor.rating.toFixed(1)}
                            <span className="text-amber-500/70">({vendor.totalRatings})</span>
                          </span>
                        )}
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{vendor.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{vendor.fleetCount} vehicles</span>
                          <span className="text-gray-400">·</span>
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-400">{formatDate(vendor.createdAt)}</span>
                        </div>
                      </div>

                      {/* Location & Service chips */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {vendor.locationNames.slice(0, 3).map((loc, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${locationFilter === loc ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
                            <MapPin className="w-3 h-3" />{loc}
                          </span>
                        ))}
                        {vendor.locationNames.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{vendor.locationNames.length - 3}</span>
                        )}
                        {vendor.serviceNames.slice(0, 2).map((svc, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${serviceFilter === svc ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`}>
                            <Layers className="w-3 h-3" />{svc}
                          </span>
                        ))}
                        {vendor.serviceNames.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{vendor.serviceNames.length - 2}</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
