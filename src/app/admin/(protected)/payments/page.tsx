'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ServiceTabs from './_components/ServiceTabs';

interface PendingPayment {
  id: string;
  bookingNumber: string;
  bookingType: 'bike' | 'chauffeur' | 'bus' | 'car' | 'truck' | 'equipment' | 'packers' | 'luxury' | 'wander';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: string;
  vehicleName: string;
  location: string;
  pickupDate: string;
  grandTotal: number;
  advanceAmount: number;
  balanceAmount?: number;
  advancePaymentRef: string;
  advancePaymentProof: string | null;
  advancePaymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bike' | 'chauffeur' | 'bus' | 'car' | 'truck' | 'equipment' | 'packers' | 'luxury' | 'wander'>('all');
  const [dayFilter, setDayFilter] = useState<'all' | 'today' | 'yesterday' | 'last7' | 'last30'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'manual' | 'direct'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');

  // useCallback gives fetchPayments a stable identity that only changes when
  // the filters change — avoids stale-closure issues on the initial render.
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/payments/pending?type=${filter}&status=${statusFilter}&method=${methodFilter}`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (data.success) {
        setPayments(data.bookings || []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, statusFilter, methodFilter]);

  // Fire whenever the stable fetcher changes (i.e., any backend filter changes).
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (action: 'verify' | 'reject') => {
    if (!selectedPayment) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedPayment.id,
          bookingType: selectedPayment.bookingType, // Pass booking type
          action,
          notes: verifyNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedPayment(null);
        setVerifyNotes('');
        fetchPayments();
        alert(data.message || 'Payment processed successfully');
      } else {
        alert(data.error || 'Failed to process');
      }
    } catch (err) {
      console.error('Failed to verify:', err);
      alert('Failed to process payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBookingTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      bike: { label: 'Bike Rental', className: 'bg-purple-100 text-purple-700' },
      chauffeur: { label: 'Car Rental', className: 'bg-blue-100 text-blue-700' },
      bus: { label: 'Bus Rental', className: 'bg-emerald-100 text-emerald-700' },
      car: { label: 'Self-Drive', className: 'bg-orange-100 text-orange-700' },
      truck: { label: 'Truck Rental', className: 'bg-amber-100 text-amber-700' },
      equipment: { label: 'Equipment', className: 'bg-teal-100 text-teal-700' },
      packers: { label: 'Packers & Movers', className: 'bg-pink-100 text-pink-700' },
      luxury: { label: 'Luxury Car', className: 'bg-yellow-100 text-yellow-800' },
      wander: { label: 'Wander Tour', className: 'bg-indigo-100 text-indigo-700' },
    };
    return badges[type] || { label: type, className: 'bg-gray-100 text-gray-700' };
  };

  // Client-side day filter on the already-fetched payments (uses createdAt).
  const displayedPayments = useMemo(() => {
    if (dayFilter === 'all') return payments;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let gte = todayStart;
    let lt: Date | null = null;
    if (dayFilter === 'yesterday') {
      gte = new Date(todayStart); gte.setDate(gte.getDate() - 1);
      lt = todayStart;
    } else if (dayFilter === 'last7') {
      gte = new Date(todayStart); gte.setDate(gte.getDate() - 6);
    } else if (dayFilter === 'last30') {
      gte = new Date(todayStart); gte.setDate(gte.getDate() - 29);
    }
    return payments.filter((p) => {
      const d = new Date(p.createdAt);
      if (d < gte) return false;
      if (lt && d >= lt) return false;
      return true;
    });
  }, [payments, dayFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600">All bookings with payment — manual proof + direct (Razorpay). Verify pending ones.</p>
        </div>
        <Button onClick={fetchPayments} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Unified filters card — Status · Date · Service rows */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      {/* Payment status (server-side) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Status</span>
        {[
          { key: 'pending',  label: 'Pending',  className: 'bg-amber-600 border-amber-600' },
          { key: 'approved', label: 'Approved', className: 'bg-emerald-600 border-emerald-600' },
          { key: 'all',      label: 'All',      className: 'bg-gray-700 border-gray-700' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key as any)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
              statusFilter === s.key
                ? `${s.className} text-white shadow-sm`
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Day filter — client-side */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Date</span>
        {[
          { key: 'all',       label: 'All time' },
          { key: 'today',     label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'last7',     label: 'Last 7 days' },
          { key: 'last30',    label: 'Last 30 days' },
        ].map((d) => (
          <button
            key={d.key}
            onClick={() => setDayFilter(d.key as any)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
              dayFilter === d.key
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            {d.label}
          </button>
        ))}
        {dayFilter !== 'all' && (
          <span className="text-xs text-gray-500 ml-1">· {displayedPayments.length} of {payments.length} shown</span>
        )}
      </div>

      {/* Payment method (server-side: manual / direct / all) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Method</span>
        {[
          { key: 'all',    label: 'All',    className: 'bg-gray-700 border-gray-700' },
          { key: 'manual', label: 'Manual', className: 'bg-amber-600 border-amber-600' },
          { key: 'direct', label: 'Direct', className: 'bg-indigo-600 border-indigo-600' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMethodFilter(m.key as any)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
              methodFilter === m.key
                ? `${m.className} text-white shadow-sm`
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            {m.label}
          </button>
        ))}
        <span className="text-[10px] text-gray-400 ml-1">Manual = UPI / Bank transfer · Direct = Razorpay / Online</span>
      </div>

      {/* Service tabs row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Service</span>
        <ServiceTabs
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          allCount={displayedPayments.length}
        />
      </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : displayedPayments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{statusFilter === 'approved' ? 'No approved payments yet' : statusFilter === 'all' ? 'No payments to show' : 'No pending payments to verify'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedPayments.map((payment) => {
            const badge = getBookingTypeBadge(payment.bookingType);
            return (
              <div
                key={payment.id}
                className="group relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition hover:shadow-md hover:border-blue-200 focus-within:ring-2 focus-within:ring-blue-400"
              >
                {/* Covers the card so a click anywhere opens the payment, while
                    staying a real link: middle-click, Ctrl-click and the
                    keyboard all behave. The controls below sit above it. */}
                <Link
                  href={`/admin/payments/${payment.bookingType}/${payment.id}`}
                  aria-label={`Open payment ${payment.bookingNumber}`}
                  className="absolute inset-0 z-0 rounded-xl"
                />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.bookingNumber}
                      </span>
                      <span className={cn('text-xs px-2 py-1 rounded font-medium', badge.className)}>
                        {badge.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(payment.advancePaymentDate || payment.updatedAt)}
                      </span>
                      <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
                        View details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{payment.customerName}</p>
                        <p className="text-gray-600">{payment.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Service</p>
                        <p className="font-medium text-gray-900">{payment.serviceType}</p>
                        <p className="text-gray-600">{payment.vehicleName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{payment.location}</p>
                        <p className="text-gray-600">
                          {payment.pickupDate && new Date(payment.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Advance</p>
                        <p className="font-bold text-green-600">₹{(payment.advanceAmount || 0).toLocaleString()}</p>
                        {payment.balanceAmount != null ? (
                          <p className="text-gray-600 text-xs">Balance: ₹{payment.balanceAmount.toLocaleString()} | Total: ₹{payment.grandTotal?.toLocaleString()}</p>
                        ) : (
                          <p className="text-gray-600">Total: ₹{payment.grandTotal?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Ref</p>
                        <p className="font-mono font-medium text-gray-900">{payment.advancePaymentRef || 'N/A'}</p>
                      </div>
                      {payment.paymentMethod && (
                        <div>
                          <p className="text-sm text-gray-500">Method</p>
                          <p className="text-gray-900">{payment.paymentMethod}</p>
                        </div>
                      )}
                      {payment.advancePaymentProof && (
                        <div className="relative z-10">
                          <a
                            href={payment.advancePaymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Payment Proof
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-row lg:flex-col gap-2">
                    {payment.paymentStatus === 'SUBMITTED' ? (
                      <>
                        <Button
                          onClick={() => setSelectedPayment(payment)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setVerifyNotes('');
                          }}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        {payment.paymentStatus === 'PAID' ? 'Paid' : 'Verified'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verify Payment</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Booking</p>
                    <p className="font-mono font-bold">{selectedPayment.bookingNumber}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded font-medium',
                    getBookingTypeBadge(selectedPayment.bookingType).className
                  )}>
                    {getBookingTypeBadge(selectedPayment.bookingType).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Advance Amount</p>
                  <p className="font-bold text-green-600">₹{(selectedPayment.advanceAmount || 0).toLocaleString()}</p>
                  {selectedPayment.balanceAmount != null && (
                    <p className="text-xs text-gray-500 mt-1">Balance: ₹{selectedPayment.balanceAmount.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-gray-400">Total: ₹{selectedPayment.grandTotal?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Transaction Ref</p>
                  <p className="font-mono text-sm break-all">{selectedPayment.advancePaymentRef || 'N/A'}</p>
                  {selectedPayment.paymentMethod && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{selectedPayment.paymentMethod}</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedPayment.customerName}</p>
                <p className="text-sm text-gray-600">{selectedPayment.customerPhone}</p>
              </div>
              {selectedPayment.advancePaymentProof && (
                <a
                  href={selectedPayment.advancePaymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-50 rounded-lg p-4 text-blue-600 hover:bg-blue-100 transition"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Payment Proof
                </a>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Any notes about this payment..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedPayment(null);
                  setVerifyNotes('');
                }}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleVerify('reject')}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
              </Button>
              <Button
                onClick={() => handleVerify('verify')}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedPayment.bookingType === 'bus' || selectedPayment.bookingType === 'truck' || selectedPayment.bookingType === 'packers' || selectedPayment.bookingType === 'equipment' || selectedPayment.bookingType === 'luxury' ? (
                  'Verify Payment'
                ) : (
                  'Verify & Broadcast'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
