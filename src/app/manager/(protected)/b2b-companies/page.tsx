// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Search, Filter, CheckCircle, XCircle, Clock, Loader2,
  Phone, Mail, User, FileText, ChevronDown, AlertCircle, Eye,
  X, Briefcase, Hash, Calendar, ShieldCheck, ShieldX, BarChart3, MapPin,
} from 'lucide-react';

interface B2BCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  gstin: string | null;
  businessType: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  b2bStatus: string | null;
  b2bApprovedAt: string | null;
  b2bRejectionReason: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  _count: { b2b_bookings: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

export default function B2BCompaniesPage() {
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<B2BCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [filter, pagination.page]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        page: String(pagination.page),
        limit: '20',
      });
      const res = await fetch(`/api/admin/b2b?${params}`);
      const data = await res.json();
      if (data.status === 'success') {
        setCustomers(data.customers);
        setPendingCount(data.pendingCount);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (e) {
      console.error('Failed to fetch B2B customers:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(customerId: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectReason.trim()) {
      setActionMessage('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/admin/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          action,
          reason: action === 'reject' ? rejectReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActionMessage(data.message);
        setShowRejectInput(false);
        setRejectReason('');
        fetchCustomers();
        // Update selected customer in modal
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(prev => prev ? {
            ...prev,
            b2bStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
            b2bApprovedAt: action === 'approve' ? new Date().toISOString() : prev.b2bApprovedAt,
            b2bRejectionReason: action === 'reject' ? rejectReason : null,
          } : null);
        }
      } else {
        setActionMessage(data.error || 'Action failed');
      }
    } catch (e) {
      setActionMessage('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  }

  function openDetail(customer: B2BCustomer) {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    setActionMessage('');
    setShowRejectInput(false);
    setRejectReason('');
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const filteredCustomers = search
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      )
    : customers;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-emerald-600" />
          B2B Companies
        </h1>
        <p className="text-gray-500 mt-1">Manage B2B corporate customer registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: pagination.total, bg: 'bg-blue-50', color: 'text-blue-700', icon: Building2 },
          { label: 'Pending', value: pendingCount, bg: 'bg-amber-50', color: 'text-amber-700', icon: Clock },
          { label: 'Approved', value: customers.filter(c => c.b2bStatus === 'APPROVED').length, bg: 'bg-emerald-50', color: 'text-emerald-700', icon: CheckCircle },
          { label: 'Rejected', value: customers.filter(c => c.b2bStatus === 'REJECTED').length, bg: 'bg-red-50', color: 'text-red-700', icon: XCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${s.color} opacity-40`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition capitalize ${
                filter === f
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'pending' && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full mr-1.5">
                  {pendingCount}
                </span>
              )}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No B2B companies found</p>
          <p className="text-sm text-gray-400 mt-1">Companies will appear here when they register for B2B</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Contact Person</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GSTIN</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Business Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Registered</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(c => {
                  const sc = STATUS_CONFIG[c.b2bStatus || 'PENDING'];
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openDetail(c)}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{c.companyName || '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700 font-mono">{c.gstin || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">{c.businessType || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-900">{c._count.b2b_bookings}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500">{formatDate(c.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredCustomers.map(c => {
              const sc = STATUS_CONFIG[c.b2bStatus || 'PENDING'];
              const StatusIcon = sc.icon;
              return (
                <div key={c.id} className="p-4 hover:bg-gray-50 transition" onClick={() => openDetail(c)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{c.companyName || 'No Company Name'}</p>
                      <p className="text-sm text-gray-600">{c.name}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                    {c.businessType && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {c.businessType}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{formatDate(c.createdAt)}</span>
                    <span>{c._count.b2b_bookings} bookings</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} companies)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (() => {
        const c = selectedCustomer;
        const sc = STATUS_CONFIG[c.b2bStatus || 'PENDING'];
        const StatusIcon = sc.icon;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{c.companyName || 'Company Details'}</h2>
                    <p className="text-emerald-100 text-sm">B2B Account Details</p>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${sc.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${sc.color}`} />
                  <span className={`font-semibold ${sc.color}`}>{sc.label}</span>
                  {c.b2bApprovedAt && c.b2bStatus === 'APPROVED' && (
                    <span className="text-xs text-gray-500 ml-auto">Approved on {formatDate(c.b2bApprovedAt)}</span>
                  )}
                </div>

                {/* Rejection Reason */}
                {c.b2bStatus === 'REJECTED' && c.b2bRejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-800">{c.b2bRejectionReason}</p>
                  </div>
                )}

                {/* Company Details */}
                <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">Company Details</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Company Name</p>
                        <p className="font-semibold text-gray-900">{c.companyName || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">GSTIN</p>
                        <p className="font-semibold text-gray-900 font-mono">{c.gstin || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Business Type</p>
                        <p className="font-semibold text-gray-900">{c.businessType || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Company Address</p>
                        <p className="font-semibold text-gray-900">{c.companyAddress || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Company Phone</p>
                        <p className="font-semibold text-gray-900">{c.companyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Company Email</p>
                        <p className="font-semibold text-gray-900">{c.companyEmail || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Contact Person</span>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{c.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium">Customer ID</p>
                    <p className="text-sm font-mono font-bold text-blue-800 mt-0.5">{c.id}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 font-medium">B2B Bookings</p>
                    <p className="text-xl font-bold text-purple-800 mt-0.5">{c._count.b2b_bookings}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium">Registered On</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(c.createdAt)}</p>
                </div>

                {/* Action Message */}
                {actionMessage && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    actionMessage.includes('approved') || actionMessage.includes('success')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : actionMessage.includes('rejected')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {actionMessage}
                  </div>
                )}

                {/* Reject Reason Input */}
                {showRejectInput && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Rejection Reason *</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is being rejected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(c.id, 'reject')}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer - Actions */}
              {c.b2bStatus === 'PENDING' && !showRejectInput && (
                <div className="p-5 border-t bg-gray-50 flex gap-3">
                  <button
                    onClick={() => handleAction(c.id, 'approve')}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-white text-red-600 border-2 border-red-200 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    <ShieldX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {/* Re-approve rejected */}
              {c.b2bStatus === 'REJECTED' && (
                <div className="p-5 border-t bg-gray-50">
                  <button
                    onClick={() => handleAction(c.id, 'approve')}
                    disabled={actionLoading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approve (Override Rejection)
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
