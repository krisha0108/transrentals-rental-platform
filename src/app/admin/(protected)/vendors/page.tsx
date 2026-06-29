'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  FileText,
  Layers,
  MapPin,
  Car,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  _count: {
    documents: number;
    serviceRequests: number;
    locationRequests: number;
    approvedServices: number;
    approvedLocations: number;
    fleets: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  DOCUMENTS_PENDING: { label: 'Documents Pending', color: 'bg-orange-100 text-orange-800', icon: FileText },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', color: 'bg-gray-100 text-gray-800', icon: Ban },
};

const statusActions: Record<string, { action: string; label: string; color: string }[]> = {
  PENDING: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  DOCUMENTS_PENDING: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  UNDER_REVIEW: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  APPROVED: [
    { action: 'SUSPEND', label: 'Suspend', color: 'text-purple-700 hover:bg-purple-50' },
    { action: 'BLOCK', label: 'Block', color: 'text-gray-700 hover:bg-gray-100' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  REJECTED: [
    { action: 'APPROVE', label: 'Re-Approve', color: 'text-green-700 hover:bg-green-50' },
  ],
  SUSPENDED: [
    { action: 'UNSUSPEND', label: 'Reinstate', color: 'text-green-700 hover:bg-green-50' },
    { action: 'BLOCK', label: 'Block', color: 'text-gray-700 hover:bg-gray-100' },
  ],
  BLOCKED: [
    { action: 'UNSUSPEND', label: 'Unblock', color: 'text-green-700 hover:bg-green-50' },
  ],
};

function ActionDropdown({
  vendor,
  onAction,
}: {
  vendor: Vendor;
  onAction: (vendorId: string, action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actions = statusActions[vendor.status] || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="gap-1"
      >
        <MoreHorizontal className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow-lg z-10 py-1">
          {actions.map(({ action, label, color }) => (
            <button
              key={action}
              className={`w-full text-left px-4 py-2 text-sm font-medium ${color}`}
              onClick={() => {
                setOpen(false);
                onAction(vendor.id, action);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RejectModal({
  vendorName,
  onConfirm,
  onCancel,
  loading,
}: {
  vendorName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject Vendor</h2>
        <p className="text-sm text-gray-500 mb-4">
          Provide a rejection reason for <span className="font-medium text-gray-800">{vendorName}</span>.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Status change state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Vendor | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/vendors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [pagination.page, statusFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAction = (vendorId: string, action: string) => {
    if (action === 'REJECT') {
      const vendor = vendors.find((v) => v.id === vendorId);
      if (vendor) setRejectTarget(vendor);
      return;
    }
    executeAction(vendorId, action);
  };

  const executeAction = async (vendorId: string, action: string, rejectionReason?: string) => {
    setActionLoading(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, status: updated.status } : v))
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {rejectTarget && (
        <RejectModal
          vendorName={rejectTarget.businessName}
          loading={actionLoading === rejectTarget.id}
          onConfirm={(reason) => executeAction(rejectTarget.id, 'REJECT', reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage vendor registrations and approvals</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            {vendors.filter((v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW').length} Pending
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
            {vendors.filter((v) => v.status === 'APPROVED').length} Approved
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name, owner, email, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="DOCUMENTS_PENDING">Documents Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Store className="w-12 h-12 mb-4" />
            <p>No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Stats</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Registered</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((vendor) => {
                  const statusInfo = statusConfig[vendor.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const isUpdating = actionLoading === vendor.id;
                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {vendor.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor.businessName}</p>
                            <p className="text-sm text-gray-500">{vendor.ownerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{vendor.email}</p>
                        <p className="text-sm text-gray-500">{vendor.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1" title="Documents">
                            <FileText className="w-4 h-4" />
                            {vendor._count.documents}
                          </span>
                          <span className="flex items-center gap-1" title="Services">
                            <Layers className="w-4 h-4" />
                            {vendor._count.approvedServices}
                          </span>
                          <span className="flex items-center gap-1" title="Locations">
                            <MapPin className="w-4 h-4" />
                            {vendor._count.approvedLocations}
                          </span>
                          <span className="flex items-center gap-1" title="Fleet">
                            <Car className="w-4 h-4" />
                            {vendor._count.fleets}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/vendors/${vendor.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <ActionDropdown vendor={vendor} onAction={handleAction} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vendors
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
