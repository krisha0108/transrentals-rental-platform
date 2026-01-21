'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Store,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceRequest {
  id: string;
  status: string;
  message: string | null;
  experience: string | null;
  createdAt: string;
  service: { id: string; name: string };
  vendors: { id: string; businessName: string; ownerName: string };
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ServiceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors/service-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request: ServiceRequest, action: string, reason?: string) => {
    setActionLoading(request.id);
    try {
      const res = await fetch(`/api/admin/vendors/${request.vendor.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action, rejectionReason: reason }),
      });

      if (res.ok) {
        await fetchRequests();
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectTarget(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredRequests = filter === 'PENDING'
    ? requests.filter((r) => r.status === 'PENDING')
    : requests;

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-gray-600">Manage vendor service access requests</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          <Clock className="w-4 h-4 mr-1" />
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ALL')}
        >
          All Requests ({requests.length})
        </Button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">No pending requests</p>
            <p className="text-sm">All service requests have been processed</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{request.service.name}</p>
                      <Link
                        href={`/admin/vendors/${request.vendor.id}`}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Store className="w-3 h-3" />
                        {request.vendor.businessName}
                      </Link>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-2 max-w-xl">
                          <strong>Why:</strong> {request.message}
                        </p>
                      )}
                      {request.experience && (
                        <p className="text-sm text-gray-600 mt-1 max-w-xl">
                          <strong>Experience:</strong> {request.experience}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Requested {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(request, 'APPROVE')}
                          disabled={!!actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectTarget(request);
                            setShowRejectModal(true);
                          }}
                          disabled={!!actionLoading}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status === 'APPROVED' ? (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {request.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Service Request</h2>
            <p className="text-gray-600 mb-4">
              Rejecting <strong>{rejectTarget.service.name}</strong> for{' '}
              <strong>{rejectTarget.vendor.businessName}</strong>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setRejectTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction(rejectTarget, 'REJECT', rejectionReason)}
                disabled={!rejectionReason.trim() || !!actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
