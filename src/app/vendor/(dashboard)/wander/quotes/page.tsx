// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox, Loader2, AlertCircle, Calendar, Users,
  ChevronRight, CheckCircle, RefreshCw, Send, Zap,
  MessageSquare, TrendingUp,
} from 'lucide-react';
import QuoteShareButton from '@/components/vendor/QuoteShareButton';

const STATUS_CONFIG = {
  PENDING:   { label: 'New Request', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',      dot: 'bg-emerald-500' },
  QUOTED:    { label: 'Quoted',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-400' },
  ACCEPTED:  { label: 'Accepted',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED:  { label: 'Rejected',    cls: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-400' },
  CANCELLED: { label: 'Cancelled',   cls: 'bg-gray-50 text-gray-500 border-gray-200',       dot: 'bg-gray-300' },
};

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'New' },
  { key: 'quoted',   label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
];

function CustomerInitials({ name }: { name?: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'C';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

export default function VendorWanderQuotesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [error, setError]       = useState('');

  useEffect(() => { fetchRequests(); }, [tab]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/vendor/wander/quotes?status=${tab}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  const pending  = requests.filter(r => r.status === 'PENDING').length;
  const quoted   = requests.filter(r => r.status === 'QUOTED').length;
  const accepted = requests.filter(r => r.status === 'ACCEPTED').length;

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-screen">

      {/* ── Dark Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                <Inbox className="w-3 h-3" /> Wander Tours
              </span>
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">Quote Requests</h1>
            <p className="text-emerald-100/70 text-sm">Respond to incoming tour enquiries from customers</p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition text-sm font-medium flex-shrink-0 mt-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Requests', value: requests.length, icon: Inbox,         iconBg: 'bg-white/10',        iconColor: 'text-emerald-200',   valColor: 'text-white' },
            { label: 'New / Pending',  value: pending,         icon: Zap,           iconBg: 'bg-white/15',    iconColor: 'text-emerald-200',   valColor: 'text-emerald-200' },
            { label: 'Quotes Sent',    value: quoted,          icon: Send,          iconBg: 'bg-emerald-500/20',    iconColor: 'text-emerald-400',   valColor: 'text-emerald-300' },
            { label: 'Accepted',       value: accepted,        icon: CheckCircle,   iconBg: 'bg-teal-500/20',     iconColor: 'text-teal-400',    valColor: 'text-teal-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{m.label}</p>
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${m.valColor} leading-none`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Toolbar ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 sticky top-[57px] z-20 shadow-sm">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pending > 0 && (
                <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-emerald-700/40 text-emerald-100' : 'bg-emerald-100 text-emerald-700'
                }`}>{pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-7">
        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-44 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-400 font-medium">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-emerald-200" />
            </div>
            <p className="font-bold text-gray-800 mb-1 text-base">No quote requests yet</p>
            <p className="text-gray-400 text-sm">Requests appear here when customers enquire about your tours</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1.2fr_auto] gap-4 px-6 py-3.5 bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-white/70 uppercase tracking-widest">
              <span>Tour</span>
              <span>Customer</span>
              <span>Travel Date</span>
              <span>Group</span>
              <span>My Quote</span>
              <span>Status</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50">
              {requests.map((req) => {
                const sc      = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                const myQuote = req.quotes?.[0];
                const needsAction = req.status === 'PENDING';

                return (
                  <Link
                    key={req.id}
                    href={`/vendor/wander/quotes/${req.id}`}
                    className={`grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1.2fr_auto] gap-4 px-6 py-4 items-center transition group ${
                      needsAction ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Tour */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-[13px] truncate group-hover:text-emerald-700 transition">
                          {req.listing?.title || 'Untitled Tour'}
                        </p>
                        {needsAction && (
                          <span className="flex-shrink-0 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wide animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{req.requestId}</span>
                        {req.requirements && (
                          <span className="text-[11px] text-gray-400 italic truncate max-w-[140px]">"{req.requirements}"</span>
                        )}
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CustomerInitials name={req.customer?.name} />
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{req.customer?.name || '—'}</p>
                    </div>

                    {/* Travel Date */}
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {req.travelDate
                        ? new Date(req.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                        : '—'}
                    </div>

                    {/* Group */}
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {req.groupSize || '—'}
                    </div>

                    {/* My Quote */}
                    <div>
                      {myQuote ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> ₹{myQuote.amount?.toLocaleString('en-IN')}
                        </span>
                      ) : needsAction ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Send className="w-3 h-3" /> Send Quote
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${sc.cls} whitespace-nowrap`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                      <QuoteShareButton
                        quoteUrl={`/vendor/wander/quotes/${req.id}`}
                        quoteNumber={req.requestId}
                        customerName={req.customer?.name || ''}
                        amount={myQuote?.amount}
                        serviceName="Wander Tour"
                        publicUrl={myQuote?.id ? `/q/${myQuote.id}` : undefined}
                      />
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
