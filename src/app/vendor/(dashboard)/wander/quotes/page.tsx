// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox, Loader2, AlertCircle, Calendar, Users, MapPin,
  Clock, ChevronRight, CheckCircle, XCircle, MessageSquare,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:   { label: 'New',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  QUOTED:    { label: 'Quoted',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  ACCEPTED:  { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  REJECTED:  { label: 'Rejected', color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  CANCELLED: { label: 'Cancelled',color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
};

const TABS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'New' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
];

export default function VendorWanderQuotesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { fetchRequests(); }, [tab]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/wander/quotes?status=${tab}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Inbox className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-sm text-gray-500">Incoming tour quote requests from customers</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No quote requests yet</p>
          <p className="text-gray-400 text-sm mt-1">Quote requests will appear here when customers request tours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const myQuote = req.quotes?.[0];
            return (
              <Link
                key={req.id}
                href={`/vendor/wander/quotes/${req.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-gray-400">{req.requestId}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{req.listing?.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {req.groupSize} traveler{req.groupSize > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(req.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {req.pickupLocation && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {req.pickupLocation}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    {req.requirements && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-1 italic">"{req.requirements}"</p>
                    )}
                    {myQuote && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Your quote: ₹{myQuote.amount?.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING' && (
                      <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg">
                        Respond
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
