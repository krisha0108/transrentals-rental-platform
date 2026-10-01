'use client';

// One customer, for an admin who is usually here to answer a question:
// who is this, what have they booked, what have they paid, what did they
// complain about.
//
// The old layout put a very wide, mostly empty profile card at the top and
// then dumped every booking — 79 of them for a real customer — into an
// unfiltered table. It also carried a full password-reset implementation that
// nothing on the page ever rendered, so the feature could not be used at all.
//
// This version leads with the things that get looked up (contact details and
// the account's standing), gives each activity tab a search box and a page
// size, and actually shows the reset-password control.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, MapPin, CalendarDays, Building2, ShoppingBag,
  Wallet, Loader2, User, ClipboardList, Headphones, CreditCard, Clock,
  ArrowRight, IndianRupee, KeyRound, Eye, EyeOff, RefreshCw, Search, X,
  Copy, Check, ShieldCheck, TrendingUp,
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

const OPEN_TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING'];

// Long lists arrive in one go from the API; the page shows them a screenful
// at a time so a customer with 140 quote requests does not render 140 rows.
const PAGE_SIZE = 15;

type Tab = 'bookings' | 'quotes' | 'tickets';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const shortId = (id: string) => id.slice(-8).toUpperCase();

/** Copies a value and says so, for the details that get pasted elsewhere. */
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
          /* clipboard blocked — the value is on screen anyway */
        }
      }}
      className="text-gray-300 hover:text-gray-600 transition opacity-0 group-hover/field:opacity-100 focus:opacity-100"
    >
      {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  href,
  copy,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  href?: string;
  copy?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="group/field flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <div className="flex items-center gap-1.5">
          {href ? (
            <a href={href} className="text-sm font-medium text-blue-600 hover:underline break-all">{value}</a>
          ) : (
            <span className="text-sm font-medium text-gray-900 break-all">{value}</span>
          )}
          {copy && <CopyButton value={value} label={label.toLowerCase()} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  iconWrap,
  valColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
  iconWrap: string;
  valColor: string;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border shadow-sm p-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <div className="flex items-center gap-3 pl-1">
        <div className={`p-2.5 rounded-lg shrink-0 ${iconWrap}`}><Icon className="w-5 h-5" /></div>
        <div className="min-w-0">
          <p className={`text-2xl font-bold leading-none truncate ${valColor}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
          {hint && <p className="text-[11px] text-gray-400 truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('bookings');

  // One search box and one "shown so far" count, reset whenever either changes.
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  // Password reset
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordPlain, setShowPasswordPlain] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  useEffect(() => { setShown(PAGE_SIZE); }, [activeTab, query]);

  const openPasswordModal = () => {
    setNewPassword(''); setConfirmPassword('');
    setPasswordError(''); setPasswordSuccess(false);
    setShowPasswordPlain(false); setShowPasswordModal(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    const out = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewPassword(out); setConfirmPassword(out);
    setShowPasswordPlain(true); setPasswordError(''); setPasswordSuccess(false);
  };

  const handleSetPassword = async () => {
    setPasswordError(''); setPasswordSuccess(false);
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || 'Failed to set password'); return; }
      setPasswordSuccess(true);
      setNewPassword(''); setConfirmPassword('');
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Figures worth showing that the customers table does not itself store.
  const bookedValue = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
    [bookings],
  );
  const openTickets = useMemo(
    () => tickets.filter((t) => OPEN_TICKET_STATUSES.includes(t.status)).length,
    [tickets],
  );

  const q = query.trim().toLowerCase();
  const matchBooking = (b: Booking) =>
    !q || [b.serviceType, b.displayId, b.from, b.to, b.status].some((v) => v?.toLowerCase().includes(q));
  const matchQuote = (x: Quote) =>
    !q || [x.serviceType, x.displayId, x.from, x.to, x.status].some((v) => v?.toLowerCase().includes(q));
  const matchTicket = (t: Ticket) =>
    !q || [t.ticketNo, t.heading, t.status, t.priority].some((v) => v?.toLowerCase().includes(q));

  const filteredBookings = useMemo(() => bookings.filter(matchBooking), [bookings, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredQuotes = useMemo(() => quotes.filter(matchQuote), [quotes, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredTickets = useMemo(() => tickets.filter(matchTicket), [tickets, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeRows =
    activeTab === 'bookings' ? filteredBookings.length
    : activeTab === 'quotes' ? filteredQuotes.length
    : filteredTickets.length;

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

  const place = [customer.city, customer.state, customer.pincode].filter(Boolean).join(', ');

  return (
    <div className="space-y-5 pb-10">
      <Link href="/admin/customers">
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Button>
      </Link>

      {/* Who this is, and how to reach them */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex items-start gap-5 min-w-0 lg:w-80 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">{customer.id}</span>
                {customer.isB2B && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">B2B</span>
                )}
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`}>
                    <Button variant="outline" size="sm"><Phone className="w-3.5 h-3.5 mr-1.5" /> Call</Button>
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`}>
                    <Button variant="outline" size="sm"><Mail className="w-3.5 h-3.5 mr-1.5" /> Email</Button>
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={openPasswordModal}>
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Set password
                </Button>
              </div>
            </div>
          </div>

          {/* The details an admin actually looks a customer up for. */}
          <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-x-8 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-8">
            <Detail icon={Mail} label="Email" value={customer.email} href={`mailto:${customer.email}`} copy />
            <Detail icon={Phone} label="Phone" value={customer.phone} href={`tel:${customer.phone}`} copy />
            <Detail icon={MapPin} label="Location" value={place || null} />
            <Detail
              icon={User}
              label="Gender"
              value={customer.gender ? customer.gender.charAt(0) + customer.gender.slice(1).toLowerCase() : null}
            />
            <Detail icon={CalendarDays} label="Date of birth" value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : null} />
            <Detail icon={CalendarDays} label="Joined" value={formatDate(customer.createdAt)} />
            <Detail icon={Clock} label="Last login" value={customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'} />
          </div>
        </div>

        {customer.isB2B && customer.companyName && (
          <div className="border-t bg-purple-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-purple-900">
                <Building2 className="w-4 h-4 text-purple-600" />
                {customer.companyName}
              </span>
              {customer.companyEmail && (
                <a href={`mailto:${customer.companyEmail}`} className="text-xs text-purple-700 hover:underline">{customer.companyEmail}</a>
              )}
              {customer.companyPhone && (
                <a href={`tel:${customer.companyPhone}`} className="text-xs text-purple-700 hover:underline">{customer.companyPhone}</a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Standing */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={ShoppingBag} label="Bookings" value={bookings.length}
          accent="bg-blue-400" iconWrap="bg-blue-100 text-blue-600" valColor="text-gray-900"
        />
        <StatCard
          icon={ClipboardList} label="Quote Requests" value={quotes.length}
          accent="bg-amber-400" iconWrap="bg-amber-100 text-amber-600" valColor="text-gray-900"
        />
        <StatCard
          icon={TrendingUp} label="Booked value" value={formatCurrency(bookedValue)}
          hint="Sum of all bookings"
          accent="bg-teal-400" iconWrap="bg-teal-100 text-teal-600" valColor="text-gray-900"
        />
        <StatCard
          icon={CreditCard} label="Total Spent" value={formatCurrency(customer.totalSpent)}
          hint="Recorded on the account"
          accent="bg-emerald-400" iconWrap="bg-emerald-100 text-emerald-600" valColor="text-emerald-600"
        />
        <StatCard
          icon={Wallet} label="Wallet balance" value={formatCurrency(customer.customer_wallet?.balance ?? 0)}
          hint={openTickets > 0 ? `${openTickets} open ticket(s)` : 'No open tickets'}
          accent="bg-purple-400" iconWrap="bg-purple-100 text-purple-600" valColor="text-gray-900"
        />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b px-2 sm:pr-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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

          <div className="relative sm:ml-auto w-full sm:w-64 pb-3 sm:pb-0 px-2 sm:px-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}…`}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Bookings */}
          {activeTab === 'bookings' && (
            filteredBookings.length === 0 ? (
              <EmptyTab icon={ShoppingBag} message={q ? 'No bookings match that search' : 'No bookings yet'} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route / Location</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Date &amp; Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booked On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.slice(0, shown).map((b) => (
                    <tr key={`${b.serviceKey}-${b.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[b.serviceKey] || 'bg-gray-100 text-gray-600'}`}>
                          {b.serviceType}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{b.displayId || `#${shortId(b.id)}`}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        {b.from ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium">{b.from}</span>
                            {b.to && b.to !== b.from && (
                              <>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium">{b.to}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {b.startDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{formatDate(b.startDate)}</span>
                              {b.endDate && b.endDate !== b.startDate && (
                                <span className="text-gray-400">→ {formatDate(b.endDate)}</span>
                              )}
                            </div>
                            {b.startTime && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                {b.startTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {b.amount ? (
                          <div className="flex items-center gap-0.5 text-sm font-semibold text-gray-800">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {b.amount.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Quote requests */}
          {activeTab === 'quotes' && (
            filteredQuotes.length === 0 ? (
              <EmptyTab icon={ClipboardList} message={q ? 'No quote requests match that search' : 'No quote requests yet'} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route / Location</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Date &amp; Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotes.slice(0, shown).map((x) => (
                    <tr key={`${x.serviceKey}-${x.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[x.serviceKey] || 'bg-gray-100 text-gray-600'}`}>
                          {x.serviceType}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{x.displayId || `#${shortId(x.id)}`}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        {x.from ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium">{x.from}</span>
                            {x.to && x.to !== x.from && (
                              <>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium">{x.to}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {x.startDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{formatDate(x.startDate)}</span>
                              {x.endDate && x.endDate !== x.startDate && (
                                <span className="text-gray-400">→ {formatDate(x.endDate)}</span>
                              )}
                            </div>
                            {x.startTime && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                {x.startTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {x.budgetMin || x.budgetMax ? (
                          <div className="flex items-center gap-0.5 text-sm text-gray-700">
                            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                            {x.budgetMin && x.budgetMax
                              ? `${x.budgetMin.toLocaleString('en-IN')} – ${x.budgetMax.toLocaleString('en-IN')}`
                              : (x.budgetMin || x.budgetMax)?.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[x.status] || 'bg-gray-100 text-gray-600'}`}>
                          {x.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(x.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Helpdesk */}
          {activeTab === 'tickets' && (
            filteredTickets.length === 0 ? (
              <EmptyTab icon={Headphones} message={q ? 'No tickets match that search' : 'No helpdesk tickets'} />
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
                  {filteredTickets.slice(0, shown).map((t) => (
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

        {activeRows > 0 && (
          <div className="flex items-center justify-between gap-4 border-t px-6 py-3">
            <p className="text-xs text-gray-500">
              Showing {Math.min(shown, activeRows)} of {activeRows}
              {q && ' matching'}
            </p>
            {shown < activeRows && (
              <Button variant="outline" size="sm" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, activeRows - shown)} more
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Set password — implemented all along, but never rendered until now */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0"><KeyRound className="w-5 h-5" /></span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Set a new password</h2>
                <p className="text-sm text-gray-500">
                  For {customer.name} ({customer.email}). They can sign in with it straight away.
                </p>
              </div>
            </div>

            {passwordSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                Password updated. Pass it to the customer over a channel you trust — it is not shown again.
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative mb-3">
                  <input
                    type={showPasswordPlain ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordPlain((v) => !v)}
                    aria-label={showPasswordPlain ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPasswordPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input
                  type={showPasswordPlain ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Type it again"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Generate a strong one
                </button>

                {passwordError && (
                  <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPasswordModal(false)}
                disabled={savingPassword}
              >
                {passwordSuccess ? 'Done' : 'Cancel'}
              </Button>
              {!passwordSuccess && (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSetPassword}
                  disabled={savingPassword || !newPassword || !confirmPassword}
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set password'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
