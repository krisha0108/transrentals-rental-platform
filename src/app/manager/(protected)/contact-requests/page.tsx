'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Phone, CheckCircle, XCircle, Loader2, ArrowLeft,
  Store, RefreshCw, InboxIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

interface ContactRequest {
  id: string;
  newEmail: string | null;
  newPhone: string | null;
  requestedAt: string;
  vendor: {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
  };
}

export default function ManagerContactRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/contact-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } finally {
      setLoading(false);
    }
  };

  useManagerPageHeader(
    'Contact Change Requests',
    'Review and approve vendor contact info change requests',
    <button
      key="refresh"
      onClick={fetchRequests}
      disabled={loading}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (reqId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(`${reqId}:${action}`);
    try {
      const res = await fetch(`/api/manager/contact-requests/${reqId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Action failed'); return; }
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch { alert('Network error'); }
    finally { setActionLoading(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{requests.length}</span> pending request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm py-20 text-center">
          <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No Pending Requests</h3>
          <p className="text-gray-500 text-sm mt-1">All contact change requests have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Vendor info */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <button
                      onClick={() => router.push(`/manager/vendors/${req.vendor.id}`)}
                      className="font-semibold text-gray-900 hover:text-green-600 transition text-left"
                    >
                      {req.vendor.businessName}
                    </button>
                    <p className="text-sm text-gray-500">{req.vendor.ownerName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Requested: {fmt(req.requestedAt)}</p>
                  </div>
                </div>

                {/* Approve / Reject */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, 'APPROVE')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {actionLoading === `${req.id}:APPROVE` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'REJECT')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {actionLoading === `${req.id}:REJECT` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                </div>
              </div>

              {/* Change details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Current */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current</p>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {req.vendor.email}</div>
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {req.vendor.phone}</div>
                  </div>
                </div>
                {/* Requested */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Requested Change</p>
                  <div className="space-y-1.5 text-sm">
                    {req.newEmail ? (
                      <div className="flex items-center gap-2 text-amber-900 font-medium"><Mail className="w-3.5 h-3.5 text-amber-500" /> {req.newEmail}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-xs"><Mail className="w-3.5 h-3.5" /> No change</div>
                    )}
                    {req.newPhone ? (
                      <div className="flex items-center gap-2 text-amber-900 font-medium"><Phone className="w-3.5 h-3.5 text-amber-500" /> {req.newPhone}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-xs"><Phone className="w-3.5 h-3.5" /> No change</div>
                    )}
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
