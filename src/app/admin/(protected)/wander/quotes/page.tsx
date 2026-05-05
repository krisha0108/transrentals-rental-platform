// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, Calendar, Users, Building2, User, CheckCircle,
  Clock, XCircle, ChevronDown, ChevronUp, Globe, Send,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  QUOTED: { label: 'Quoted', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const QUOTE_STATUS = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-50 text-blue-600' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-600' },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-600' },
};

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminWanderQuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  async function broadcastRequest(reqId: string, e?: React.MouseEvent) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!confirm('Broadcast this request to all wander vendors? They will be able to submit quotes.')) return;
    setBroadcastingId(reqId);
    setError('');
    try {
      const res = await fetch(`/api/admin/wander/quotes/${reqId}/broadcast`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to broadcast');
        return;
      }
      setRequests(rs => rs.map(r => r.id === reqId ? { ...r, broadcastedAt: data.broadcastedAt } : r));
    } catch {
      setError('Failed to broadcast request');
    } finally {
      setBroadcastingId(null);
    }
  }

  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', '25');

    fetch(`/api/admin/wander/quotes?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setRequests(d.requests || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setError('Failed to load quote requests'))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-xs text-gray-500">{total} requests total</p>
          </div>
        </div>
        <Link href="/admin/wander" className="text-sm text-indigo-600 hover:underline">
          ← Wander Overview
        </Link>
      </div>

      {/* Status tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => updateParams({ status: tab.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 p-6 bg-white border border-gray-200 rounded-xl">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No quote requests found</p>
          </div>
        ) : (
          requests.map(req => {
            const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = sc.icon;
            const isOpen = expandedId === req.id;

            return (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <div
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(isOpen ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-gray-400">{req.requestId || req.id?.slice(0, 8)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      {!req.listing?.vendorId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Globe className="w-3 h-3" />
                          {req.broadcastedAt ? 'Broadcasted' : 'Admin Tour'}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
                      {req.listing?.title || 'Unknown Tour'}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {req.listing?.vendorId ? (req.listing?.vendor?.businessName || '—') : <em className="not-italic text-amber-700 font-medium">Admin (no vendor)</em>}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {req.customer?.name || '—'} · {req.customer?.phone || '—'}
                      </span>
                      {req.travelDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fmt(req.travelDate)}
                        </span>
                      )}
                      {req.groupSize && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {req.groupSize} pax
                        </span>
                      )}
                      <span className="text-gray-400">
                        {req.quotes?.length || 0} quote{req.quotes?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                    {!req.listing?.vendorId && !req.broadcastedAt && req.status !== 'ACCEPTED' && req.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={(e) => broadcastRequest(req.id, e)}
                        disabled={broadcastingId === req.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition disabled:opacity-60"
                      >
                        {broadcastingId === req.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Send className="w-3.5 h-3.5" />}
                        Broadcast to vendors
                      </button>
                    )}
                    {req.broadcastedAt && (
                      <span className="text-amber-700 font-medium" title={`Broadcasted on ${fmt(req.broadcastedAt)}`}>
                        ✓ Sent to vendors
                      </span>
                    )}
                    <span>{fmt(req.createdAt)}</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </div>

                {/* Expanded: quotes list + request details */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                    {/* Request details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {req.specialRequirements && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-gray-400 mb-0.5">Special Requirements</p>
                          <p className="text-gray-700">{req.specialRequirements}</p>
                        </div>
                      )}
                      {req.listing?.category && (
                        <div>
                          <p className="text-gray-400 mb-0.5">Category</p>
                          <p className="text-gray-700">{req.listing.category.icon} {req.listing.category.name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 mb-0.5">Customer Email</p>
                        <p className="text-gray-700">{req.customer?.email || '—'}</p>
                      </div>
                    </div>

                    {/* Quotes submitted */}
                    {req.quotes && req.quotes.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Quotes Submitted ({req.quotes.length})
                        </p>
                        <div className="space-y-2">
                          {req.quotes.map(q => {
                            const qs = QUOTE_STATUS[q.status] || QUOTE_STATUS.SUBMITTED;
                            return (
                              <div key={q.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400 font-mono">{q.id?.slice(0, 8)}</span>
                                  <span className="text-gray-500">{fmt(q.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {q.amount && (
                                    <span className="font-semibold text-gray-900">
                                      ₹{Number(q.amount).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${qs.color}`}>
                                    {qs.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No quotes submitted yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} requests
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
