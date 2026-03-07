// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Building2, Truck, Calendar, MapPin, ChevronRight,
  Clock, CheckCircle, FileText, IndianRupee, AlertCircle, ExternalLink,
  Eye, CreditCard, Car, Users, Filter, Download,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Sent to HR', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoiced', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700', QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700', CONFIRMED: 'bg-emerald-100 text-emerald-700',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700', IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700', INVOICED: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-700',
};

const BOOKING_FILTERS = [
  'all', 'OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED',
  'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID',
];

export default function ManagerB2BPage() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [invoiceStatus, setInvoiceStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => { fetchBookings(); }, [bookingStatus]);
  useEffect(() => { fetchInvoices(); }, []);

  async function fetchBookings() {
    setLoadingBookings(true);
    try {
      const res = await fetch(`/api/b2b/bookings?view_all=true&status=${bookingStatus}&limit=100`);
      const data = await res.json();
      if (data.status === 'success') setBookings(data.bookings);
    } catch (e) { console.error(e); }
    finally { setLoadingBookings(false); }
  }

  async function fetchInvoices() {
    setLoadingInvoices(true);
    try {
      const res = await fetch(`/api/b2b/invoices?limit=100`);
      const data = await res.json();
      if (data.status === 'success') setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
    finally { setLoadingInvoices(false); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  const needsAction = bookings.filter((b: any) => b.status === 'QUOTES_RECEIVED').length;

  // Booking stats
  const bookingStats = useMemo(() => ({
    total: bookings.length,
    active: bookings.filter((b: any) => ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length,
    pending: bookings.filter((b: any) => ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status)).length,
    completed: bookings.filter((b: any) => ['COMPLETED', 'INVOICED', 'PAID'].includes(b.status)).length,
    totalValue: bookings.reduce((s: number, b: any) => s + (b.finalAmount || 0), 0),
  }), [bookings]);

  // Invoice stats
  const invoiceStats = useMemo(() => {
    const total = invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const paid = invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const unpaid = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const overdue = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED' && new Date(i.dueDate) < new Date()).length;
    return { total, paid, unpaid, overdue, count: invoices.length };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (invoiceStatus === 'unpaid') list = list.filter((i: any) => !['PAID', 'CANCELLED'].includes(i.status));
    else if (invoiceStatus === 'paid') list = list.filter((i: any) => i.status === 'PAID');
    else if (invoiceStatus === 'overdue') list = list.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED' && new Date(i.dueDate) < new Date());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i: any) =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.companyName?.toLowerCase().includes(q) ||
        i.booking?.bookingNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, invoiceStatus, searchQuery]);

  // Service types from bookings
  const serviceTypes = useMemo(() => {
    return [...new Set(bookings.map((b: any) => b.serviceType))].sort();
  }, [bookings]);

  // Filtered bookings by search + service
  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (serviceFilter !== 'all') list = list.filter((b: any) => b.serviceType === serviceFilter);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((b: any) =>
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.companyName?.toLowerCase().includes(q) ||
      b.pickupLocation?.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery, serviceFilter]);

  // Unique companies
  const companies = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>();
    bookings.forEach((b: any) => {
      const existing = map.get(b.companyName) || { name: b.companyName, count: 0, value: 0 };
      existing.count++;
      existing.value += b.finalAmount || 0;
      map.set(b.companyName, existing);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [bookings]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage corporate bookings, invoices & companies</p>
        </div>
        {needsAction > 0 && (
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {needsAction} booking(s) need Super Quote
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: 'bookings', label: 'Bookings', icon: Truck, count: bookingStats.total },
          { key: 'invoices', label: 'Invoices', icon: FileText, count: invoiceStats.count },
          { key: 'companies', label: 'Companies', icon: Building2, count: companies.length },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'invoices' ? 'Search by invoice number, company or booking...' : 'Search by booking number, company or location...'}
          className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* ============ BOOKINGS TAB ============ */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total', value: bookingStats.total, color: 'bg-blue-50 text-blue-700' },
              { label: 'Active', value: bookingStats.active, color: 'bg-green-50 text-green-700' },
              { label: 'Pending', value: bookingStats.pending, color: 'bg-amber-50 text-amber-700' },
              { label: 'Completed', value: bookingStats.completed, color: 'bg-gray-50 text-gray-700' },
              { label: 'Total Value', value: formatCurrency(bookingStats.totalValue), color: 'bg-teal-50 text-teal-700', isAmount: true },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <div className={`font-bold ${s.isAmount ? 'text-lg' : 'text-2xl'}`}>{s.value}</div>
                <div className="text-xs opacity-70">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {BOOKING_FILTERS.map(s => (
              <button key={s} onClick={() => setBookingStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  bookingStatus === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}>
                {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>

          {/* Service Filter */}
          {serviceTypes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <button onClick={() => setServiceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  serviceFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'
                }`}>All Services</button>
              {serviceTypes.map((st: string) => (
                <button key={st} onClick={() => setServiceFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition capitalize flex items-center gap-1.5 ${
                    serviceFilter === st ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'
                  }`}>
                  <Car className="w-3 h-3" />
                  {st === 'self-drive' ? 'Self Drive' : st}
                </button>
              ))}
            </div>
          )}

          {/* Booking List */}
          {loadingBookings ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border text-gray-500">No bookings found</div>
          ) : (
            <div className="space-y-2">
              {filteredBookings.map((b: any) => (
                <Link key={b.id} href={`/manager/b2b/${b.id}`}
                  className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-bold text-blue-600">{b.bookingNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                        {b.status === 'QUOTES_RECEIVED' && (
                          <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-xs font-bold animate-pulse">ACTION NEEDED</span>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">{b.companyName}</div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 capitalize"><Car className="w-3.5 h-3.5" /> {b.vehiclesRequired} {b.serviceType}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {b.pickupLocation}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(b.scheduledDate)}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {b._count?.vendorQuotes || 0} quotes</span>
                        {b.finalAmount > 0 && (
                          <span className="flex items-center gap-1 font-medium text-green-600"><IndianRupee className="w-3.5 h-3.5" /> {formatCurrency(b.finalAmount)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ INVOICES TAB ============ */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-xs text-blue-600 mb-1">Total Invoiced</div>
              <div className="text-xl font-bold text-blue-800">{formatCurrency(invoiceStats.total)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-xs text-green-600 mb-1">Collected</div>
              <div className="text-xl font-bold text-green-800">{formatCurrency(invoiceStats.paid)}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-xs text-orange-600 mb-1">Pending</div>
              <div className="text-xl font-bold text-orange-800">{formatCurrency(invoiceStats.unpaid)}</div>
            </div>
            <div className={`rounded-xl p-4 text-center ${invoiceStats.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className={`text-xs mb-1 ${invoiceStats.overdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>Overdue</div>
              <div className={`text-xl font-bold ${invoiceStats.overdue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{invoiceStats.overdue}</div>
            </div>
          </div>

          {/* Invoice Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { key: 'all', label: `All (${invoices.length})` },
              { key: 'unpaid', label: `Unpaid (${invoices.filter(i => !['PAID', 'CANCELLED'].includes(i.status)).length})` },
              { key: 'paid', label: `Paid (${invoices.filter(i => i.status === 'PAID').length})` },
              { key: 'overdue', label: `Overdue (${invoiceStats.overdue})` },
            ].map(f => (
              <button key={f.key} onClick={() => setInvoiceStatus(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  invoiceStatus === f.key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Invoice List */}
          {loadingInvoices ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Invoice</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Company</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Booking</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Due Date</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv: any) => {
                    const isOverdue = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && new Date(inv.dueDate) < new Date();
                    const isPaid = inv.status === 'PAID';
                    return (
                      <tr key={inv.id} className={`hover:bg-gray-50/50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-gray-800 text-xs">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{inv.companyName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500">{inv.booking?.bookingNumber}</span>
                          <div className="text-xs text-gray-400 capitalize">{inv.booking?.serviceType}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${isPaid ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {formatCurrency(inv.totalAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {formatDate(inv.dueDate)}
                          </span>
                          {isOverdue && <div className="text-[10px] text-red-500 font-medium">OVERDUE</div>}
                          {isPaid && inv.paidAt && <div className="text-[10px] text-green-600">Paid {formatDate(inv.paidAt)}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isPaid ? 'bg-green-100 text-green-700' :
                            isOverdue ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a href={`/invoice/b2b/${inv.id}`} target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition">
                            <Eye className="w-3 h-3" /> View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ COMPANIES TAB ============ */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No B2B companies yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.filter(c => {
                if (!searchQuery.trim()) return true;
                return c.name.toLowerCase().includes(searchQuery.toLowerCase());
              }).map((company) => {
                const companyBookings = bookings.filter((b: any) => b.companyName === company.name);
                const activeCount = companyBookings.filter((b: any) => ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length;
                const companyInvoices = invoices.filter((i: any) => i.companyName === company.name);
                const paidAmount = companyInvoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
                const pendingAmount = companyInvoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);

                return (
                  <div key={company.name} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{company.name}</h3>
                        <p className="text-xs text-gray-500">{company.count} booking{company.count > 1 ? 's' : ''}{activeCount > 0 ? ` / ${activeCount} active` : ''}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Value</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(company.value)}</span>
                      </div>
                      {companyInvoices.length > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Paid</span>
                            <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                          </div>
                          {pendingAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Pending</span>
                              <span className="font-medium text-orange-600">{formatCurrency(pendingAmount)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Recent bookings */}
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                      {companyBookings.slice(0, 3).map((b: any) => (
                        <Link key={b.id} href={`/manager/b2b/${b.id}`}
                          className="flex items-center justify-between text-xs hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 transition">
                          <span className="font-mono text-gray-600">{b.bookingNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[b.status]}`}>
                            {STATUS_LABELS[b.status]}
                          </span>
                        </Link>
                      ))}
                      {companyBookings.length > 3 && (
                        <p className="text-[10px] text-gray-400 text-center">+{companyBookings.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
