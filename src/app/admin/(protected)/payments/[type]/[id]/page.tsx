'use client';

// One payment, in full.
//
// The list page could only ever show four columns and a verify button, so
// anything an admin actually needed to decide with — the proof image, the
// full amount breakdown, when the customer paid, which booking it belongs to
// — meant opening the database. This is that view: money first, because that
// is the decision, then who and what it is for, then everything else the
// booking table holds.

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Clock, CreditCard, Copy, Check,
  Phone, Mail, MapPin, CalendarDays, User, FileText, ExternalLink, AlertCircle,
  Receipt, Wallet, IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  bookingType: string;
  bookingNumber: string | null;
  serviceType: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerId: string | null;
  vehicleName: string | null;
  location: string | null;
  from?: string | null;
  to?: string | null;
  pickupDate: string | null;
  dropDate?: string | null;
  totalDays?: number | null;
  securityDeposit?: number | null;
  grandTotal: number | null;
  advanceAmount: number | null;
  balanceAmount: number | null;
  advancePaymentRef: string | null;
  advancePaymentProof: string | null;
  advancePaymentDate: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const SERVICE_BADGE: Record<string, string> = {
  bike: 'bg-purple-100 text-purple-700',
  chauffeur: 'bg-blue-100 text-blue-700',
  bus: 'bg-emerald-100 text-emerald-700',
  car: 'bg-orange-100 text-orange-700',
  truck: 'bg-amber-100 text-amber-700',
  equipment: 'bg-teal-100 text-teal-700',
  packers: 'bg-pink-100 text-pink-700',
  luxury: 'bg-yellow-100 text-yellow-800',
  wander: 'bg-indigo-100 text-indigo-700',
};

const PAYMENT_STATE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  SUBMITTED: { label: 'Awaiting verification', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  PARTIAL: { label: 'Advance received', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  PAID: { label: 'Paid in full', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  PENDING: { label: 'No payment yet', className: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock },
  FAILED: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  REFUNDED: { label: 'Refunded', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Receipt },
};

// Manual proof is the only kind an admin has to sign off; the gateway ones
// arrive already settled.
const MANUAL_METHODS = ['UPI', 'BANK_TRANSFER'];

const money = (n: number | null | undefined) =>
  n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const when = (value: string | null | undefined, withTime = true) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

/** Copy-to-clipboard that says it worked. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked — nothing useful to say, the value is on screen */
        }
      }}
      className="text-gray-400 hover:text-gray-700 transition"
    >
      {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Row({ icon: Icon, label, children }: { icon?: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [extra, setExtra] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [action, setAction] = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/payments/${type}/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not load this payment');
      setPayment(data.payment);
      setExtra(data.extra || []);
    } catch (e: any) {
      setError(e?.message || 'Could not load this payment');
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!payment || !action) return;
    setWorking(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: payment.id,
          bookingType: payment.bookingType,
          action,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'The server refused that change');
      setAction(null);
      setNotes('');
      setResult(data.message || (action === 'verify' ? 'Payment verified.' : 'Payment rejected.'));
      await load();
    } catch (e: any) {
      setResult(e?.message || 'Could not process that. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 opacity-30" />
        <p className="mb-4">{error || 'Payment not found'}</p>
        <Link href="/admin/payments">
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Payments</Button>
        </Link>
      </div>
    );
  }

  const state = PAYMENT_STATE[payment.paymentStatus || ''] || {
    label: payment.paymentStatus || 'Unknown',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: Clock,
  };
  const StateIcon = state.icon;
  const needsDecision = payment.paymentStatus === 'SUBMITTED';
  const isManual = MANUAL_METHODS.includes((payment.paymentMethod || '').toUpperCase());
  const paidShare =
    payment.grandTotal && payment.advanceAmount
      ? Math.min(100, Math.round((Number(payment.advanceAmount) / Number(payment.grandTotal)) * 100))
      : 0;

  return (
    <div className="space-y-5 pb-10">
      <Link href="/admin/payments">
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Payments
        </Button>
      </Link>

      {/* Headline: what it is, and where the payment stands */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', SERVICE_BADGE[payment.bookingType] || 'bg-gray-100 text-gray-700')}>
                {payment.serviceType}
              </span>
              <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border', state.className)}>
                <StateIcon className="w-3.5 h-3.5" />
                {state.label}
              </span>
              {payment.status && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                  Booking: {payment.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{payment.bookingNumber || payment.id}</h1>
              <CopyButton value={payment.bookingNumber || payment.id} label="booking number" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Paid {when(payment.advancePaymentDate)} · Booked {when(payment.createdAt, false)}
            </p>
          </div>

          {needsDecision && (
            <div className="flex gap-2">
              <Button onClick={() => setAction('verify')} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" /> Verify
              </Button>
              <Button onClick={() => setAction('reject')} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </div>

        {result && (
          <p className="mt-4 text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-2.5">{result}</p>
        )}
      </div>

      {/* Money — the reason this page exists, so it goes first and biggest */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Payment</h2>
        </div>

        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
          <div className="p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Received</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{money(payment.advanceAmount)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Balance due</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{money(payment.balanceAmount)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Booking total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{money(payment.grandTotal)}</p>
          </div>
        </div>

        {payment.grandTotal != null && payment.advanceAmount != null && (
          <div className="px-6 pb-5">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${paidShare}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">{paidShare}% of the booking total received</p>
          </div>
        )}

        <div className="border-t px-6 py-2 grid md:grid-cols-2 gap-x-8">
          <Row icon={CreditCard} label="Method">
            {payment.paymentMethod
              ? <>{payment.paymentMethod.replace(/_/g, ' ')} <span className="text-gray-400 font-normal">({isManual ? 'manual proof' : 'gateway'})</span></>
              : '—'}
          </Row>
          <Row icon={FileText} label="Transaction ref">
            {payment.advancePaymentRef ? (
              <span className="inline-flex items-center gap-2">
                <span className="font-mono">{payment.advancePaymentRef}</span>
                <CopyButton value={payment.advancePaymentRef} label="transaction reference" />
              </span>
            ) : '—'}
          </Row>
          <Row icon={CalendarDays} label="Paid on">{when(payment.advancePaymentDate)}</Row>
          {payment.securityDeposit != null && (
            <Row icon={Wallet} label="Security deposit">{money(payment.securityDeposit)}</Row>
          )}
        </div>

        {payment.advancePaymentProof && (
          <div className="border-t px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Payment proof</p>
              <a
                href={payment.advancePaymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                Open full size <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {/* The proof is nearly always a screenshot, so show it rather than
                making the admin open a tab to see what they are approving. A
                PDF or a broken path falls back to the link above. */}
            <a href={payment.advancePaymentProof} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.advancePaymentProof}
                alt="Payment proof"
                className="max-h-96 rounded-xl border bg-gray-50 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </a>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Customer */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Customer</h2>
          </div>
          <div className="px-6 py-2">
            <Row label="Name">{payment.customerName || '—'}</Row>
            <Row icon={Phone} label="Phone">
              {payment.customerPhone ? (
                <span className="inline-flex items-center gap-2">
                  <a href={`tel:${payment.customerPhone}`} className="text-blue-600 hover:underline">{payment.customerPhone}</a>
                  <CopyButton value={payment.customerPhone} label="phone number" />
                </span>
              ) : '—'}
            </Row>
            <Row icon={Mail} label="Email">
              {payment.customerEmail ? (
                <a href={`mailto:${payment.customerEmail}`} className="text-blue-600 hover:underline break-all">{payment.customerEmail}</a>
              ) : '—'}
            </Row>
          </div>
          {payment.customerId && (
            <div className="px-6 pb-5">
              <Link href={`/admin/customers/${payment.customerId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Open customer profile <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Booking */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Booking</h2>
          </div>
          <div className="px-6 py-2">
            <Row label="Service">{payment.serviceType}</Row>
            <Row label="Vehicle / item">{payment.vehicleName || '—'}</Row>
            <Row icon={MapPin} label={payment.to && payment.to !== payment.from ? 'Route' : 'Location'}>
              {payment.to && payment.to !== payment.from
                ? `${payment.from || '—'} → ${payment.to}`
                : (payment.location || payment.from || '—')}
            </Row>
            <Row icon={CalendarDays} label="Pickup">{when(payment.pickupDate, false)}</Row>
            {payment.dropDate && <Row icon={CalendarDays} label="Drop">{when(payment.dropDate, false)}</Row>}
            {payment.totalDays != null && <Row label="Duration">{payment.totalDays} day(s)</Row>}
          </div>
        </div>
      </div>

      {/* Whatever else the booking table holds, rather than nothing at all */}
      {extra.length > 0 && (
        <details className="bg-white rounded-2xl border shadow-sm overflow-hidden group">
          <summary className="px-6 py-4 cursor-pointer select-none font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Full booking record
            </span>
            <span className="text-xs font-normal text-gray-400">{extra.length} fields</span>
          </summary>
          <div className="border-t grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 px-6 py-3">
            {extra.map((f) => (
              <div key={f.label} className="py-2 border-b border-gray-50 last:border-0 min-w-0">
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className="text-sm text-gray-900 break-words">{f.value}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Verify / reject */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {action === 'verify' ? 'Verify this payment?' : 'Reject this payment?'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {action === 'verify'
                ? <>{money(payment.advanceAmount)} against <span className="font-mono">{payment.bookingNumber}</span>.</>
                : <>The customer will be told their payment for <span className="font-mono">{payment.bookingNumber}</span> was not accepted.</>}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === 'verify' ? 'Anything worth recording about this payment…' : 'Why is this being rejected?'}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setAction(null); setNotes(''); }} disabled={working}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={working}
                className={cn('flex-1 text-white', action === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}
              >
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : action === 'verify' ? 'Verify payment' : 'Reject payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
