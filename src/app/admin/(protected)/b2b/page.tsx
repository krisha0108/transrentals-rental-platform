// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Building2, Phone, Mail, CheckCircle, XCircle, Clock,
  ChevronRight, RefreshCw, Filter, Users, Briefcase, AlertCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: XCircle },
};

export default function AdminB2BPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => { fetchCustomers(); }, [filter]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b?filter=${filter}`);
      const data = await res.json();
      if (data.status === 'success') {
        setCustomers(data.customers);
        setPendingCount(data.pendingCount);
      }
    } catch (e) {
      console.error('Failed to fetch B2B customers:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(customerId: string, action: string, reason?: string) {
    setActionLoading(customerId);
    try {
      const body: any = { customerId, action };
      if (reason) body.reason = reason;
      const res = await fetch('/api/admin/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchCustomers();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (e) {
      alert('Failed to process action');
    } finally {
      setActionLoading('');
    }
  }

  function handleReject(customerId: string) {
    const reason = prompt('Enter rejection reason:');
    if (reason) handleAction(customerId, 'reject', reason);
  }

  const filtered = customers.filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Customers</h1>
          <p className="text-gray-500 mt-1">Manage corporate customer approvals</p>
        </div>
        <Link href="/admin/b2b/bookings" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Briefcase className="w-4 h-4" /> View B2B Bookings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total B2B', value: customers.length, color: 'blue', icon: Building2 },
          { label: 'Pending Approval', value: pendingCount, color: 'yellow', icon: Clock },
          { label: 'Approved', value: customers.filter((c: any) => c.b2bStatus === 'APPROVED').length, color: 'green', icon: CheckCircle },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4`}>
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search by name, company, email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f} {f === 'pending' && pendingCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">{pendingCount}</span>}
            </button>
          ))}
        </div>
        <button onClick={fetchCustomers} className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No B2B customers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer: any) => {
            const statusCfg = STATUS_CONFIG[customer.b2bStatus] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={customer.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{customer.companyName || customer.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                        <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {customer.name}</div>
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {customer.email}</div>
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {customer.phone}</div>
                    </div>
                    {customer.gstin && <div className="text-xs text-gray-400 mt-1">GSTIN: {customer.gstin}</div>}
                    {customer.b2bRejectionReason && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded">
                        Rejection: {customer.b2bRejectionReason}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {customer._count?.b2b_bookings || 0} bookings | Registered: {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {customer.b2bStatus === 'PENDING' && (
                      <>
                        <button onClick={() => handleAction(customer.id, 'approve')} disabled={actionLoading === customer.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                          {actionLoading === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                        </button>
                        <button onClick={() => handleReject(customer.id)} disabled={actionLoading === customer.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {customer.b2bStatus === 'REJECTED' && (
                      <button onClick={() => handleAction(customer.id, 'approve')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
