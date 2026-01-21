'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Store,
  Phone,
  Mail,
  MapPin,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Car,
  Filter,
} from 'lucide-react';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  locations: string[];
  services: string[];
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
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
  DOCUMENTS_PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Docs Pending', icon: FileText },
  UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review', icon: Clock },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: XCircle },
  SUSPENDED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Suspended', icon: AlertCircle },
  BLOCKED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Blocked', icon: XCircle },
};

export default function ManagerVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVendors = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/manager/vendors?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setVendors(data.vendors);
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

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!loading) fetchVendors();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVendors();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Vendors in your assigned locations</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Store className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.suspended}</p>
                <p className="text-xs text-gray-500">Suspended</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
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
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No vendors are in your assigned locations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {vendors.map((vendor) => {
              const statusConfig = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;
              return (
                <Link
                  key={vendor.id}
                  href={`/manager/vendors/${vendor.id}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{vendor.businessName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Store className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{vendor.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span>{vendor.fleetCount} vehicles</span>
                        </div>
                      </div>

                      {/* Locations & Services */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {vendor.locations.slice(0, 3).map((loc, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {loc}
                          </span>
                        ))}
                        {vendor.locations.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{vendor.locations.length - 3} more
                          </span>
                        )}
                        {vendor.services.slice(0, 2).map((svc, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
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
