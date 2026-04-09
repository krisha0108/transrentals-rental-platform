// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import {
  Loader2, FileText, Calendar, ExternalLink, CheckCircle, Clock,
  AlertCircle, IndianRupee, ArrowLeft, Filter, CreditCard, Download,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  GENERATED: { label: 'Unpaid', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  SENT: { label: 'Unpaid', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  PAID: { label: 'Paid', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
  OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
};

function CustomerB2BInvoicesContent() {
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) fetchInvoices();
    else setLoading(false);
  }, [customerId]);

  async function fetchInvoices() {
    try {
      const res = await fetch(`/api/b2b/invoices?customer_id=${customerId}&limit=100`);
      const data = await res.json();
      if (data.status === 'success') setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  const isOverdue = (inv: any) => {
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') return false;
    return new Date(inv.dueDate) < new Date();
  };

  const getStatus = (inv: any) => {
    if (inv.status === 'PAID') return 'PAID';
    if (inv.status === 'CANCELLED') return 'CANCELLED';
    if (isOverdue(inv)) return 'OVERDUE';
    return 'GENERATED';
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    if (statusFilter === 'unpaid') return invoices.filter((inv: any) => !['PAID', 'CANCELLED'].includes(inv.status));
    if (statusFilter === 'paid') return invoices.filter((inv: any) => inv.status === 'PAID');
    if (statusFilter === 'overdue') return invoices.filter((inv: any) => isOverdue(inv));
    return invoices;
  }, [invoices, statusFilter]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const paidAmount = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const unpaidAmount = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const overdueCount = invoices.filter((i: any) => isOverdue(i)).length;
    return { totalAmount, paidAmount, unpaidAmount, overdueCount };
  }, [invoices]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 sm:px-6 pt-20 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mt-4 mb-3">
            <Link href={`/customer/b2b-bookings?customer_id=${customerId}`}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Invoices</h1>
              <p className="text-orange-100 text-sm">All your B2B booking invoices</p>
            </div>
          </div>

          {/* Summary Cards */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 text-center">
                <div className="text-xs text-orange-100">Total Invoiced</div>
                <div className="text-xl font-bold text-white mt-0.5">{formatCurrency(stats.totalAmount)}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 text-center">
                <div className="text-xs text-green-100">Paid</div>
                <div className="text-xl font-bold text-green-200 mt-0.5">{formatCurrency(stats.paidAmount)}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 text-center">
                <div className="text-xs text-yellow-100">Unpaid</div>
                <div className="text-xl font-bold text-yellow-200 mt-0.5">{formatCurrency(stats.unpaidAmount)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-3">
        {/* Overdue Alert */}
        {stats.overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">{stats.overdueCount} Overdue Invoice{stats.overdueCount > 1 ? 's' : ''}</p>
              <p className="text-xs text-red-600">Please clear the pending payments to avoid service disruption</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {invoices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { key: 'all', label: `All (${invoices.length})` },
                { key: 'unpaid', label: `Unpaid (${invoices.filter(i => !['PAID', 'CANCELLED'].includes(i.status)).length})` },
                { key: 'paid', label: `Paid (${invoices.filter(i => i.status === 'PAID').length})` },
                { key: 'overdue', label: `Overdue (${stats.overdueCount})` },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    statusFilter === f.key
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
        ) : !customerId ? (
          <div className="text-center py-16 text-gray-500">Customer ID required</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-1">No invoices yet</p>
            <p className="text-sm text-gray-400">Invoices will appear here once your bookings are completed</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No invoices match the selected filter</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredInvoices.map((inv: any) => {
              const effectiveStatus = getStatus(inv);
              const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.GENERATED;
              const overdue = effectiveStatus === 'OVERDUE';
              const daysUntilDue = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <div key={inv.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  overdue ? 'border-red-300 ring-1 ring-red-200' :
                  effectiveStatus === 'PAID' ? 'border-green-200' : 'border-gray-200'
                }`}>
                  {overdue && (
                    <div className="bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 flex items-center gap-1.5 border-b border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) > 1 ? 's' : ''}
                    </div>
                  )}

                  <div className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      effectiveStatus === 'PAID' ? 'bg-green-50' :
                      overdue ? 'bg-red-50' : 'bg-orange-50'
                    }`}>
                      {effectiveStatus === 'PAID'
                        ? <CheckCircle className="w-6 h-6 text-green-500" />
                        : overdue
                        ? <AlertCircle className="w-6 h-6 text-red-500" />
                        : <FileText className="w-6 h-6 text-orange-500" />
                      }
                    </div>

                    {/* Invoice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-bold text-gray-800">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {inv.booking?.bookingNumber}
                        </span>
                        <span className="capitalize">{inv.booking?.serviceType === 'self-drive' ? 'Self Drive' : inv.booking?.serviceType}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {formatDate(inv.dueDate)}
                        </span>
                        <span>{inv.totalVehicles} vehicles / {inv.tripsCompleted} trips</span>
                      </div>
                      {effectiveStatus === 'PAID' && inv.paidAt && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Paid on {formatDate(inv.paidAt)}
                        </div>
                      )}
                      {effectiveStatus !== 'PAID' && effectiveStatus !== 'OVERDUE' && daysUntilDue >= 0 && daysUntilDue <= 3 && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xl font-bold ${effectiveStatus === 'PAID' ? 'text-green-700' : overdue ? 'text-red-700' : 'text-gray-900'}`}>
                        {formatCurrency(inv.totalAmount)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                        {effectiveStatus !== 'PAID' && (
                          <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              overdue ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}>
                            <CreditCard className="w-3 h-3" /> Pay Now
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerB2BInvoicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <CustomerB2BInvoicesContent />
    </Suspense>
  );
}
