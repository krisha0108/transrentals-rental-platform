'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  Clock,
  Filter,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorRequest {
  id: string;
  type: 'location' | 'service';
  vendorId: string;
  vendorName: string;
  vendorOwner: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorStatus: string;
  locationId?: string;
  locationName?: string;
  locationType?: string;
  serviceId?: string;
  serviceName?: string;
  message: string | null;
  localAddress?: string | null;
  experience?: string | null;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Stats {
  pendingLocationRequests: number;
  pendingServiceRequests: number;
  totalPending: number;
}

export default function ManagerVendorRequestsPage() {
  const [locationRequests, setLocationRequests] = useState<VendorRequest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<VendorRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'location' | 'service'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [rejectModal, setRejectModal] = useState<{ id: string; type: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter, statusFilter]);

  const fetchRequests = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      params.set('status', statusFilter);

      const res = await fetch(`/api/manager/vendor-requests?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLocationRequests(data.locationRequests);
        setServiceRequests(data.serviceRequests);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('Failed to fetch vendor requests');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAction = async (requestId: string, type: 'location' | 'service', action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(`${action}-${requestId}`);
    setError(null);

    try {
      const res = await fetch(`/api/manager/vendor-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, reason }),
      });

      const data = await res.json();

      if (data.success) {
        fetchRequests();
        setRejectModal(null);
        setRejectReason('');
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendor requests...</p>
        </div>
      </div>
    );
  }

  const allRequests = [...locationRequests, ...serviceRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Requests</h1>
          <p className="text-gray-500 mt-1">Approve vendor location and service requests</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLocationRequests}</p>
                <p className="text-sm text-gray-500">Location Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingServiceRequests}</p>
                <p className="text-sm text-gray-500">Service Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
                <p className="text-sm text-gray-500">Total Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border shadow-sm flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Type:</span>
          <div className="flex gap-1">
            {['all', 'location', 'service'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {allRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-500">
              {statusFilter === 'PENDING'
                ? 'No pending vendor requests for your assigned locations/services.'
                : 'No vendor requests match the current filter.'}
            </p>
          </div>
        ) : (
          allRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.type === 'location'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {request.type === 'location' ? 'Location Request' : 'Service Request'}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {request.status}
                    </span>
                    <span className="text-xs text-gray-400">{getTimeAgo(request.createdAt)}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{request.vendorName}</h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      {request.vendorOwner}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${request.vendorPhone}`} className="text-blue-600 hover:underline">
                        {request.vendorPhone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {request.vendorEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      {request.type === 'location' ? (
                        <>
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{request.locationName}</span>
                          <span className="text-xs text-gray-400">({request.locationType})</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{request.serviceName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(request.message || request.localAddress || request.experience) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      {request.message && (
                        <p className="text-gray-600">
                          <strong>Message:</strong> {request.message}
                        </p>
                      )}
                      {request.localAddress && (
                        <p className="text-gray-600 mt-1">
                          <strong>Local Address:</strong> {request.localAddress}
                        </p>
                      )}
                      {request.experience && (
                        <p className="text-gray-600 mt-1">
                          <strong>Experience:</strong> {request.experience}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm">
                      <p className="text-red-700">
                        <strong>Rejection Reason:</strong> {request.rejectionReason}
                      </p>
                      {request.reviewedBy && (
                        <p className="text-red-600 text-xs mt-1">Reviewed by: {request.reviewedBy}</p>
                      )}
                    </div>
                  )}

                  {/* Approval Info */}
                  {request.status === 'APPROVED' && request.reviewedBy && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                      <p className="text-green-700">
                        Approved by: {request.reviewedBy} on {formatDate(request.reviewedAt!)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {request.status === 'PENDING' && (
                  <div className="flex lg:flex-col gap-2">
                    <Button
                      onClick={() => handleAction(request.id, request.type, 'approve')}
                      disabled={!!actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === `approve-${request.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => setRejectModal({ id: request.id, type: request.type })}
                      disabled={!!actionLoading}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleAction(rejectModal.id, rejectModal.type as any, 'reject', rejectReason)
                }
                disabled={!rejectReason.trim() || !!actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading?.startsWith('reject') ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reject'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
