'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  ShoppingBag,
  Wallet,
  Loader2,
  User,
  ClipboardList,
  Headphones,
  CreditCard,
  Clock,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  isB2B: boolean;
  isActive: boolean;
  companyName: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  totalSpent: number;
  lastLoginAt: string | null;
  createdAt: string;
  customer_wallet: { balance: number } | null;
}

interface Booking {
  id: string;
  displayId: string | null;
  createdAt: string;
  status: string;
  serviceType: string;
  serviceKey: string;
  from: string | null;
  to: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  amount: number | null;
}

interface Quote {
  id: string;
  displayId: string | null;
  createdAt: string;
  status: string;
  serviceType: string;
  serviceKey: string;
  from: string | null;
  to: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
}

interface Ticket {
  id: string;
  createdAt: string;
  status: string;
  ticketNo: string;
  heading: string;
  priority: string;
}

const SERVICE_COLORS: Record<string, string> = {
  bike: 'bg-orange-100 text-orange-700',
  bus: 'bg-blue-100 text-blue-700',
  car: 'bg-teal-100 text-teal-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  luxury: 'bg-purple-100 text-purple-700',
  packers: 'bg-rose-100 text-rose-700',
  self_drive: 'bg-cyan-100 text-cyan-700',
  truck: 'bg-slate-100 text-slate-700',
  wander: 'bg-emerald-100 text-emerald-700',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  OPEN: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

type Tab = 'bookings' | 'quotes' | 'tickets';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('bookings');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/admin/customers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
          setBookings(data.bookings);
          setQuotes(data.quotes);
          setTickets(data.tickets);
        }
      } catch (err) {
        console.error('Failed to fetch customer:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const shortId = (id: string) => id.slice(-8).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <User className="w-12 h-12 mb-4 opacity-30" />
        <p>Customer not found</p>
        <Link href="/admin/customers" className="mt-4">
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'bookings', label: 'Bookings', count: bookings.length, icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'quotes', label: 'Quote Requests', count: quotes.length, icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'tickets', label: 'Helpdesk Tickets', count: tickets.length, icon: <Headphones className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/customers">
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Button>
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              {customer.isB2B && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">B2B</span>
              )}
              {!customer.isActive && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Inactive</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
              {(customer.city || customer.state) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              {customer.gender && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {customer.gender.charAt(0) + customer.gender.slice(1).toLowerCase()}
                </div>
              )}
              {customer.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  DOB: {formatDate(customer.dateOfBirth)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Joined {formatDate(customer.createdAt)}
              </div>
              {customer.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  Last login {formatDate(customer.lastLoginAt)}
                </div>
              )}
            </div>

            {/* B2B company info */}
            {customer.isB2B && customer.companyName && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">{customer.companyName}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-purple-700">
                  {customer.companyEmail && <span>{customer.companyEmail}</span>}
                  {customer.companyPhone && <span>{customer.companyPhone}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <ShoppingBag className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Bookings</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <ClipboardList className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Quote Requests</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <CreditCard className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Spent</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <Wallet className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(customer.customer_wallet?.balance ?? 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Wallet Balance</p>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Tab Nav */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route / Location</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Date & Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booked On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={`${b.serviceKey}-${b.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[b.serviceKey] || 'bg-gray-100 text-gray-600'}`}>
                          {b.serviceType}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{b.displayId || `#${shortId(b.id)}`}</p>
                      </td>
                      <td className="px-6 py-4">
                        {b.from ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">{b.from}</span>
                            {b.to && (
                              <>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="font-medium">{b.to}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {b.startDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>{formatDate(b.startDate)}</span>
                              {b.endDate && b.endDate !== b.startDate && (
                                <span className="text-gray-400">→ {formatDate(b.endDate)}</span>
                              )}
                            </div>
                            {b.startTime && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                {b.startTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {b.amount ? (
                          <div className="flex items-center gap-0.5 text-sm font-semibold text-gray-800">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {b.amount.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No quote requests yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route / Location</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Date & Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.map((q) => (
                    <tr key={`${q.serviceKey}-${q.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[q.serviceKey] || 'bg-gray-100 text-gray-600'}`}>
                          {q.serviceType}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{q.displayId || `#${shortId(q.id)}`}</p>
                      </td>
                      <td className="px-6 py-4">
                        {q.from ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">{q.from}</span>
                            {q.to && (
                              <>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="font-medium">{q.to}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {q.startDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>{formatDate(q.startDate)}</span>
                              {q.endDate && q.endDate !== q.startDate && (
                                <span className="text-gray-400">→ {formatDate(q.endDate)}</span>
                              )}
                            </div>
                            {q.startTime && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                {q.startTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {q.budgetMin || q.budgetMax ? (
                          <div className="flex items-center gap-0.5 text-sm text-gray-700">
                            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                            {q.budgetMin && q.budgetMax
                              ? `${q.budgetMin.toLocaleString('en-IN')} – ${q.budgetMax.toLocaleString('en-IN')}`
                              : (q.budgetMin || q.budgetMax)?.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-600'}`}>
                          {q.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(q.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Headphones className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No helpdesk tickets</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket No.</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-gray-600">#{t.ticketNo}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-800 max-w-xs truncate">{t.heading}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          t.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          t.priority === 'NORMAL' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
