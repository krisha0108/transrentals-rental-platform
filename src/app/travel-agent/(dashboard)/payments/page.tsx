'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Wallet,
  Search,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  CheckCircle2,
  X,
  Hourglass,
  AlertCircle,
  IndianRupee,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface PaymentItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  tourTitle: string | null;
  destination: string | null;
  travelDate: string | null;
  quotedAmount: number | null;
  advanceAmount: number | null;
  balanceAmount: number | null;
  leadStatus: string;
  paymentStatus: string | null;
  paymentTxnId: string | null;
  paymentNote: string | null;
  paymentProofImages: string[];
  customerAcceptedAt: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  paymentRejectReason: string | null;
}

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  verified: number;
  rejected: number;
  advancePaid: number;
  collectedAmount: number;
  awaitingAmount: number;
  pendingBalanceAmount: number;
}

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'To Verify' },
  { key: 'ADVANCE_PAID', label: 'Advance Paid · Balance Due' },
  { key: 'PENDING', label: 'Awaiting Customer' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function TravelAgentPaymentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('SUBMITTED');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<PaymentItem | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [imageViewer, setImageViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [copiedId, setCopiedId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== 'ALL') params.set('status', tab);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/travel-agent/payments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
        setStats(json.stats || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const verify = async (item: PaymentItem) => {
    if (!confirm(`Verify payment from ${item.customerName}? Lead will move to BOOKED.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/travel-agent/leads/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAction: 'VERIFY' }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Payment verified' });
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to verify' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejectFor || !rejectReasonText.trim()) return;
    setBusyId(rejectFor.id);
    try {
      const res = await fetch(`/api/travel-agent/leads/${rejectFor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAction: 'REJECT',
          paymentRejectReason: rejectReasonText.trim(),
        }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Payment rejected' });
        setRejectFor(null);
        setRejectReasonText('');
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to reject' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(''), 1200);
  };

  useTravelAgentPageHeader('Payments', 'Advance payments from leads — verify, track, and manage');

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Collected (Advance)"
          value={`₹${(stats?.collectedAmount ?? 0).toLocaleString('en-IN')}`}
          sub={`${stats?.verified ?? 0} verified`}
          tone="emerald"
        />
        <StatCard
          label="Balance Due"
          value={`₹${(stats?.pendingBalanceAmount ?? 0).toLocaleString('en-IN')}`}
          sub={`${stats?.advancePaid ?? 0} customer${stats?.advancePaid === 1 ? '' : 's'} owe balance`}
          tone="indigo"
          onClick={() => setTab('ADVANCE_PAID')}
        />
        <StatCard
          label="Awaiting Verification"
          value={`₹${(stats?.awaitingAmount ?? 0).toLocaleString('en-IN')}`}
          sub={`${stats?.submitted ?? 0} pending review`}
          tone="amber"
          highlight={!!stats?.submitted}
          onClick={() => setTab('SUBMITTED')}
        />
        <StatCard
          label="Awaiting Customer"
          value={String(stats?.pending ?? 0)}
          sub="customers yet to pay"
          tone="blue"
          onClick={() => setTab('PENDING')}
        />
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const count =
              t.key === 'ALL'
                ? stats?.total
                : t.key === 'SUBMITTED'
                  ? stats?.submitted
                  : t.key === 'ADVANCE_PAID'
                    ? stats?.advancePaid
                    : t.key === 'PENDING'
                      ? stats?.pending
                      : t.key === 'VERIFIED'
                        ? stats?.verified
                        : stats?.rejected;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {t.label}
                {count != null && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, txn ID"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold mb-1">No payments yet</p>
          <p className="text-sm text-gray-400">
            {tab === 'SUBMITTED'
              ? 'Nothing to verify right now.'
              : 'Once customers accept quotes & submit payment proof, they’ll appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Customer */}
                <div className="lg:col-span-3 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{it.customerName}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {it.customerPhone}
                  </div>
                  {it.customerEmail && (
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{it.customerEmail}</span>
                    </div>
                  )}
                  <Link
                    href={`/travel-agent/leads/${it.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Open lead <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Trip */}
                <div className="lg:col-span-3 min-w-0 text-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Trip</p>
                  <p className="font-semibold text-gray-800 truncate">
                    {it.tourTitle || it.destination || '—'}
                  </p>
                  {it.travelDate && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(it.travelDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  )}
                </div>

                {/* Amounts */}
                <div className="lg:col-span-2 text-sm">
                  {tab === 'ADVANCE_PAID' ? (
                    <>
                      <p className="text-[10px] text-indigo-500 uppercase tracking-wider font-semibold">
                        Balance Due
                      </p>
                      <p className="font-black text-indigo-700 text-lg inline-flex items-center leading-tight">
                        <IndianRupee className="w-4 h-4" />
                        {(it.balanceAmount ?? 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Advance ₹{(it.advanceAmount ?? 0).toLocaleString('en-IN')} / Total ₹
                        {Number(it.quotedAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Advance / Total</p>
                      <p className="font-bold text-gray-900 inline-flex items-center">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {(it.advanceAmount ?? 0).toLocaleString('en-IN')}
                      </p>
                      {it.quotedAmount && (
                        <p className="text-[11px] text-gray-500">
                          of ₹{Number(it.quotedAmount).toLocaleString('en-IN')}
                        </p>
                      )}
                      {it.paymentStatus === 'VERIFIED' && (it.balanceAmount ?? 0) > 0 && (
                        <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                          Balance ₹{(it.balanceAmount ?? 0).toLocaleString('en-IN')} due
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Status + txn */}
                <div className="lg:col-span-2 text-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                  <PaymentBadge status={it.paymentStatus} />
                  {it.paymentTxnId ? (
                    <button
                      type="button"
                      onClick={() => copy(it.paymentTxnId!)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-gray-700 hover:text-emerald-700 max-w-full"
                    >
                      <span className="truncate max-w-[110px]">{it.paymentTxnId}</span>
                      {copiedId === it.paymentTxnId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  ) : it.paymentProofImages.length > 0 ? (
                    <p className="text-[10px] text-gray-400 mt-1.5">via screenshot</p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="lg:col-span-2 flex flex-col gap-2">
                  {it.paymentProofImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImageViewer({ images: it.paymentProofImages, index: 0 })}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      View {it.paymentProofImages.length} screenshot{it.paymentProofImages.length !== 1 ? 's' : ''}
                    </button>
                  )}
                  {it.paymentStatus === 'SUBMITTED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => verify(it)}
                        disabled={busyId === it.id}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 px-3 py-2 rounded-lg"
                      >
                        {busyId === it.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectFor(it);
                          setRejectReasonText('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Footer details */}
              {(it.paymentNote || it.paymentRejectReason || it.paymentSubmittedAt || it.paymentVerifiedAt) && (
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-gray-500">
                  {it.paymentSubmittedAt && (
                    <span>Submitted {new Date(it.paymentSubmittedAt).toLocaleString('en-IN')}</span>
                  )}
                  {it.paymentVerifiedAt && (
                    <span className="text-emerald-700 font-semibold">
                      ✅ Verified {new Date(it.paymentVerifiedAt).toLocaleString('en-IN')}
                    </span>
                  )}
                  {it.paymentNote && (
                    <span className="truncate max-w-md">📝 {it.paymentNote}</span>
                  )}
                  {it.paymentRejectReason && (
                    <span className="text-red-700">❌ {it.paymentRejectReason}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !busyId && setRejectFor(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 text-white">
              <p className="text-xs text-red-100 font-semibold uppercase">Reject Payment</p>
              <h2 className="text-lg font-bold mt-0.5">{rejectFor.customerName}</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Tell the customer why you couldn&apos;t verify this payment so they can re-submit.
              </p>
              <textarea
                rows={3}
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="e.g. Wrong amount, txn not received in our account..."
                className="w-full px-3 py-2.5 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setRejectFor(null)}
                disabled={!!busyId}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={!!busyId || !rejectReasonText.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm px-5 py-2 rounded-xl flex items-center gap-2"
              >
                {busyId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image viewer */}
      {imageViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageViewer(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
            onClick={() => setImageViewer(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageViewer.images[imageViewer.index]}
              alt={`proof-${imageViewer.index + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {imageViewer.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {imageViewer.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImageViewer({ ...imageViewer, index: i })}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                      i === imageViewer.index ? 'border-emerald-400' : 'border-transparent opacity-50'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  highlight,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'emerald' | 'amber' | 'blue' | 'red' | 'indigo';
  highlight?: boolean;
  onClick?: () => void;
}) {
  const palette = {
    emerald: 'from-emerald-500 to-teal-600 text-emerald-100',
    amber: 'from-amber-500 to-orange-500 text-amber-100',
    blue: 'from-blue-500 to-indigo-600 text-blue-100',
    red: 'from-red-500 to-rose-600 text-red-100',
    indigo: 'from-indigo-500 to-purple-600 text-indigo-100',
  }[tone];
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left rounded-2xl p-4 text-white bg-gradient-to-br ${palette} ${
        highlight ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white shadow-lg' : 'shadow-sm'
      } ${onClick ? 'hover:shadow-md hover:scale-[1.01] transition' : ''}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{label}</p>
      <p className="text-2xl font-black mt-1 leading-tight">{value}</p>
      <p className="text-xs mt-1 opacity-90">{sub}</p>
    </Tag>
  );
}

function PaymentBadge({ status }: { status: string | null }) {
  const cfg: Record<string, { label: string; cls: string; Icon: any }> = {
    SUBMITTED: { label: 'To Verify', cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Hourglass },
    VERIFIED: { label: 'Verified', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200', Icon: AlertCircle },
    PENDING: { label: 'Awaiting', cls: 'bg-blue-100 text-blue-700 border-blue-200', Icon: Hourglass },
  };
  const c = cfg[status || 'PENDING'] || cfg.PENDING;
  const Icon = c.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[11px] font-bold border ${c.cls}`}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}
