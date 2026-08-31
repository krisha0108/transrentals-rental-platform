// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, Car, Calendar, MapPin, ChevronRight, Clock, CheckCircle,
  FileText, Bus, Truck, Wrench, Package, Star, IndianRupee, Users,
  AlertCircle, Loader2, CreditCard, ExternalLink, Briefcase, Filter, Plus,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Ready', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700 border-blue-200',
  QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700 border-purple-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700 border-teal-200',
  IN_PROGRESS: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  INVOICED: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const SERVICE_ICONS: Record<string, any> = {
  car: Car, bus: Bus, truck: Truck, equipment: Wrench,
  packers: Package, luxury: Star, 'self-drive': Car,
};

const SERVICE_COLORS: Record<string, string> = {
  car: 'bg-purple-50 text-purple-600', bus: 'bg-amber-50 text-amber-600',
  bike: 'bg-blue-50 text-blue-600', truck: 'bg-red-50 text-red-600',
  equipment: 'bg-cyan-50 text-cyan-600', packers: 'bg-pink-50 text-pink-600',
  luxury: 'bg-yellow-50 text-yellow-700', 'self-drive': 'bg-sky-50 text-sky-600',
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

// Presentation only — how far along the four-segment stage bar is drawn, and
// which tone the row wears. No status is added, renamed or reordered.
const STAGE_STEP: Record<string, number> = {
  OPEN_FOR_QUOTES: 1, QUOTES_RECEIVED: 1, SUPER_QUOTE_SENT: 2,
  CONFIRMED: 3, TRIPS_CREATED: 3, IN_PROGRESS: 3,
  COMPLETED: 4, INVOICED: 4, PAID: 4, CANCELLED: 0,
};

const STAGE_TONE: Record<string, { text: string; bar: string; line: string; wash: string }> = {
  OPEN_FOR_QUOTES:  { text: 'text-[#1D4ED8]', bar: 'bg-[#1D4ED8]', line: 'border-[#C4D6F6]', wash: 'bg-[#EDF3FE]' },
  QUOTES_RECEIVED:  { text: 'text-[#1D4ED8]', bar: 'bg-[#1D4ED8]', line: 'border-[#C4D6F6]', wash: 'bg-[#EDF3FE]' },
  SUPER_QUOTE_SENT: { text: 'text-[#6D28D9]', bar: 'bg-[#6D28D9]', line: 'border-[#DCCEFA]', wash: 'bg-[#F3EEFE]' },
  CONFIRMED:        { text: 'text-[#056B3E]', bar: 'bg-[#09B368]', line: 'border-[#C3E5D4]', wash: 'bg-[#EAF8F1]' },
  TRIPS_CREATED:    { text: 'text-[#0B7C74]', bar: 'bg-[#0B7C74]', line: 'border-[#BBE2DE]', wash: 'bg-[#E7F5F3]' },
  IN_PROGRESS:      { text: 'text-[#0B7C74]', bar: 'bg-[#0B7C74]', line: 'border-[#BBE2DE]', wash: 'bg-[#E7F5F3]' },
  COMPLETED:        { text: 'text-[#6F7C74]', bar: 'bg-[#6F7C74]', line: 'border-[#DFE8E2]', wash: 'bg-[#F5F8F6]' },
  INVOICED:         { text: 'text-[#B4700F]', bar: 'bg-[#B4700F]', line: 'border-[#EFE0BE]', wash: 'bg-[#FDF7EA]' },
  PAID:             { text: 'text-[#056B3E]', bar: 'bg-[#09B368]', line: 'border-[#C3E5D4]', wash: 'bg-[#EAF8F1]' },
  CANCELLED:        { text: 'text-[#BE123C]', bar: 'bg-[#BE123C]', line: 'border-[#F6C9D4]', wash: 'bg-[#FDEEF2]' },
};

// "CUSTOM_BULK" is a database value; it should not reach the screen raw.
const serviceLabel = (t: string) =>
  t === 'self-drive' ? 'Self Drive'
    : String(t || '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

interface B2BDashboardProps {
  customerId: string;
  customerName: string;
  companyName: string | null;
  /** The dashboard's view switch, rendered inside this hero. */
  viewSwitch?: React.ReactNode;
  /** "Manage Company", which used to sit in the strip above the hero. */
  manageCompany?: React.ReactNode;
}

export default function B2BDashboard({ customerId, customerName, companyName, viewSwitch, manageCompany }: B2BDashboardProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    if (customerId) {
      Promise.all([fetchBookings(), fetchInvoices()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [customerId]);

  async function fetchBookings() {
    try {
      const res = await fetch(`/api/b2b/bookings?customer_id=${customerId}`);
      const data = await res.json();
      if (data.status === 'success') setBookings(data.bookings || []);
    } catch (e) { console.error(e); }
  }

  async function fetchInvoices() {
    try {
      const res = await fetch(`/api/b2b/invoices?customer_id=${customerId}&limit=50`);
      const data = await res.json();
      if (data.status === 'success') setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  const serviceTypes = useMemo(() => {
    const types = [...new Set(bookings.map((b: any) => b.serviceType))];
    return types.sort();
  }, [bookings]);

  const stats = useMemo(() => {
    const totalValue = bookings.reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const paidValue = bookings.filter((b: any) => b.status === 'PAID').reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const unpaidValue = bookings.filter((b: any) => ['INVOICED', 'COMPLETED'].includes(b.status)).reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    return {
      total: bookings.length,
      active: bookings.filter((b: any) => ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length,
      pending: bookings.filter((b: any) => ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status)).length,
      completed: bookings.filter((b: any) => ['COMPLETED', 'INVOICED', 'PAID'].includes(b.status)).length,
      totalValue, paidValue, unpaidValue,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      if (serviceFilter !== 'all' && b.serviceType !== serviceFilter) return false;
      if (statusFilter === 'active') return ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status);
      if (statusFilter === 'pending') return ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status);
      if (statusFilter === 'completed') return ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(b.status);
      return true;
    });
  }, [bookings, statusFilter, serviceFilter]);

  const invoiceStats = useMemo(() => {
    const totalAmount = invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const paidAmount = invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const unpaidAmount = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const overdueCount = invoices.filter((i: any) => {
      if (i.status === 'PAID' || i.status === 'CANCELLED') return false;
      return new Date(i.dueDate) < new Date();
    }).length;
    return { totalAmount, paidAmount, unpaidAmount, overdueCount };
  }, [invoices]);

  const actionNeeded = bookings.filter((b: any) => b.status === 'SUPER_QUOTE_SENT').length;
  const recentInvoices = useMemo(() =>
    invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').slice(0, 3),
  [invoices]);

  // Map of bookingId -> unpaid invoice, so the booking card can flag "Invoice
  // generated · Pay now" instead of relying on the easy-to-miss status pill.
  const unpaidInvoiceByBookingId = useMemo(() => {
    const map = new Map<string, any>();
    invoices.forEach((i: any) => {
      if (i.status !== 'PAID' && i.status !== 'CANCELLED' && i.bookingId) {
        map.set(i.bookingId, i);
      }
    });
    return map;
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const notInvoiced = Math.max(0, stats.totalValue - stats.paidValue - stats.unpaidValue);
  // Same gutter the personal hero uses, so the two line up edge to edge.
  const GUTTER = { paddingLeft: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const GUTTER_R = { paddingRight: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const ROAD = [Car, Bus, Truck, Package];

  return (
    <>

      {/* ══════════════ HERO — as built in the mockup: a stacked panel,
           with the money card straddling its bottom edge ══════════════ */}
      <div className="relative overflow-hidden bg-[linear-gradient(124deg,#022416_0%,#04442B_44%,#067C4A_100%)] pb-[98px] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(820px 340px at 84% -30%, rgba(255,255,255,.20), transparent 62%), radial-gradient(560px 300px at 4% 128%, rgba(1,30,17,.62), transparent 62%)' }} />
        <div className="pointer-events-none absolute -right-28 -top-32 h-[340px] w-[340px] rounded-full bg-[#09B368]/30 blur-[72px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* view switch, and managing the company */}
        {(viewSwitch || manageCompany) && (
          <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center gap-3.5 px-5 pt-5 sm:px-8 lg:px-10">
            {viewSwitch}
          </div>
        )}

        {/* who the account belongs to, and what you can do about it */}
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center gap-6 px-5 pt-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-[17px]">
            <span className="grid h-[50px] w-[50px] flex-none place-items-center rounded-[16px] border-2 border-white/30 bg-white/[0.12] backdrop-blur-sm">
              <Building2 className="h-[22px] w-[22px]" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/[0.56]">
                <span className="h-px w-[22px] bg-white/[0.34]" />
                Corporate transport
              </p>
              <h2 className="quote-serif mt-1.5 text-[27px] font-medium leading-[0.95] tracking-[-0.022em] [text-shadow:0_2px_24px_rgba(0,0,0,.3)] sm:text-[33px]">
                {companyName || 'B2B Corporate'}
              </h2>
            </div>
          </div>

          {manageCompany && <div className="ml-auto">{manageCompany}</div>}
        </div>

        {/* the four counts — ek hi rail, chaar alag dabbe nahi */}
        <div className="relative z-10 mx-auto mt-6 flex max-w-[1320px] flex-wrap border-t border-white/[0.16] px-5 sm:px-8 lg:px-10">
          {[
            { label: 'Bookings',     value: stats.total,     note: 'All time' },
            { label: 'On the road',  value: stats.active,    note: 'Confirmed & running' },
            { label: 'Awaiting you', value: stats.pending,   note: 'Out for quotes' },
            { label: 'Completed',    value: stats.completed, note: 'Delivered & invoiced' },
          ].map(({ label, value, note }, i) => (
            <div key={label}
              className={"flex flex-1 basis-[150px] items-center gap-3 border-r border-white/[0.14] py-4 pr-5 last:border-r-0 "
                + (i === 0 ? '' : 'sm:pl-5')}>
              <p className={"flex-none text-[25px] font-bold leading-none tracking-[-0.025em] tabular-nums "
                + (value === 0 ? 'text-white/[0.42]' : '')}>
                {value}
              </p>
              <p className="min-w-0 text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-white/[0.6]">
                {label}
                <small className="mt-[3px] block truncate text-[10.5px] font-normal normal-case tracking-normal text-white/[0.45]">
                  {note}
                </small>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ MONEY — straddling the hero's edge ══════════════ */}
      <div className="relative z-20 mx-auto -mt-[76px] max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[20px] border border-[#DFE8E2] bg-white shadow-[0_30px_60px_-34px_rgba(4,50,31,.38)]">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="border-b border-[#DFE8E2] px-6 py-[15px] sm:border-b-0 sm:border-r">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#9DAAA2]">
                  <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-[#F8FBF9] text-[#6F7C74]"><IndianRupee className="h-3 w-3" /></span>
                  Booking value
                </p>
                <p className="truncate text-[10.5px] text-[#9DAAA2]">
                  {stats.totalValue === 0 ? 'Nothing quoted yet' : 'Across ' + stats.total + ' booking' + (stats.total !== 1 ? 's' : '')}
                </p>
              </div>
              <p className={"quote-serif mt-2 text-[29px] font-medium leading-none tabular-nums tracking-[-0.015em] " + (stats.totalValue === 0 ? 'text-[#C2CDC6]' : '')}>
                {formatCurrency(stats.totalValue)}
              </p>
            </div>

            <div className="border-b border-[#DFE8E2] px-6 py-[15px] sm:border-b-0 sm:border-r">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#9DAAA2]">
                  <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-[#F8FBF9] text-[#6F7C74]"><CheckCircle className="h-3 w-3" /></span>
                  Paid
                </p>
                <p className="truncate text-[10.5px] text-[#9DAAA2]">{stats.paidValue === 0 ? 'Nothing settled yet' : 'Settled so far'}</p>
              </div>
              <p className={"quote-serif mt-2 text-[29px] font-medium leading-none tabular-nums tracking-[-0.015em] " + (stats.paidValue === 0 ? 'text-[#C2CDC6]' : '')}>
                {formatCurrency(stats.paidValue)}
              </p>
            </div>

            <div className={"px-6 py-[15px] " + (stats.unpaidValue > 0 ? 'bg-gradient-to-b from-[#FDF6E7] to-white' : '')}>
              <div className="flex items-center justify-between gap-3">
                <p className={"flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] " + (stats.unpaidValue > 0 ? 'text-[#B4700F]' : 'text-[#9DAAA2]')}>
                  <span className={"grid h-5 w-5 flex-none place-items-center rounded-md " + (stats.unpaidValue > 0 ? 'bg-white text-[#B4700F]' : 'bg-[#F8FBF9] text-[#6F7C74]')}><Clock className="h-3 w-3" /></span>
                  Pending payment
                </p>
                <p className={"truncate text-[10.5px] " + (invoiceStats.overdueCount > 0 ? 'font-bold text-[#BE123C]' : stats.unpaidValue > 0 ? 'text-[#B4700F]' : 'text-[#9DAAA2]')}>
                  {invoiceStats.overdueCount > 0
                    ? invoiceStats.overdueCount + ' invoice' + (invoiceStats.overdueCount > 1 ? 's' : '') + ', overdue'
                    : stats.unpaidValue > 0 ? 'Invoice raised, not settled' : 'Nothing outstanding'}
                </p>
              </div>
              <p className={"quote-serif mt-2 text-[29px] font-medium leading-none tabular-nums tracking-[-0.015em] " + (
                stats.unpaidValue === 0 ? 'text-[#C2CDC6]' : 'text-[#8A5409]')}>
                {formatCurrency(stats.unpaidValue)}
              </p>
            </div>
          </div>

          {stats.totalValue > 0 && (
            <div className="border-t border-[#DFE8E2] bg-[#F8FBF9] px-6 py-[13px]">
              <div className="flex items-center gap-4">
                <p className="flex-none text-[9px] font-bold uppercase tracking-[0.18em] text-[#9DAAA2]">How much is settled</p>
                <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#DFE8E2]">
                  <span className="block bg-[#09B368]" style={{ flexGrow: stats.paidValue }} title={'Paid ' + formatCurrency(stats.paidValue)} />
                  <span className={"block " + (invoiceStats.overdueCount > 0 ? 'bg-[#BE123C]' : 'bg-[#B4700F]')} style={{ flexGrow: stats.unpaidValue }} title={(invoiceStats.overdueCount > 0 ? 'Overdue ' : 'Invoiced ') + formatCurrency(stats.unpaidValue)} />
                  <span className="block bg-[#CBD9D1]" style={{ flexGrow: notInvoiced }} title={'Not invoiced ' + formatCurrency(notInvoiced)} />
                </div>
                <b className="flex-none text-[11px] font-semibold tabular-nums text-[#6F7C74]">
                  {formatCurrency(stats.paidValue)} of {formatCurrency(stats.totalValue)}
                </b>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-[#6F7C74]">
                <span className="inline-flex items-center gap-2"><i className="h-[7px] w-[7px] rounded-full bg-[#09B368]" />Paid <b className="font-bold tabular-nums text-[#0A140F]">{formatCurrency(stats.paidValue)}</b></span>
                <span className="inline-flex items-center gap-2"><i className={"h-[7px] w-[7px] rounded-full " + (invoiceStats.overdueCount > 0 ? 'bg-[#BE123C]' : 'bg-[#B4700F]')} />{invoiceStats.overdueCount > 0 ? 'Overdue' : 'Invoiced'} <b className="font-bold tabular-nums text-[#0A140F]">{formatCurrency(stats.unpaidValue)}</b></span>
                {notInvoiced > 0 && (
                  <span className="inline-flex items-center gap-2"><i className="h-[7px] w-[7px] rounded-full bg-[#CBD9D1]" />Not invoiced <b className="font-bold tabular-nums text-[#0A140F]">{formatCurrency(notInvoiced)}</b></span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* everything below the hero sits in the page's own gutter */}
      <div className="mx-auto max-w-[1320px] space-y-4 px-5 pb-10 pt-9 sm:px-8 lg:px-10">

      {/* ══════════════ NEEDS YOU ══════════════ */}
      {/* One entry per thing, ranked by cost of leaving it. The overdue invoice
          used to appear three times over — banner, list and row strip. */}
      {(invoiceStats.overdueCount > 0 || actionNeeded > 0) && (
        <div className="pt-2">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9DAAA2]">Needs you</p>
              <h3 className="quote-serif mt-1.5 text-[27px] font-medium leading-none tracking-[-0.02em]">
                {invoiceStats.overdueCount > 0 && actionNeeded > 0 ? 'Two things are waiting' : 'One thing is waiting'}
              </h3>
            </div>
            <span className="text-[11px] text-[#9DAAA2]">Ranked by what it costs to leave</span>
          </div>

          <div className="space-y-3">
            {invoiceStats.overdueCount > 0 && (() => {
              const inv = recentInvoices.find((i: any) => new Date(i.dueDate) < new Date()) || recentInvoices[0];
              if (!inv) return null;
              return (
                <a key="overdue" href={"/invoice/b2b/" + inv.id} target="_blank" rel="noopener noreferrer"
                  className="relative grid items-center gap-4 overflow-hidden rounded-[20px] border border-[#F6C9D4] bg-white px-6 py-5 pl-7 shadow-[0_1px_3px_rgba(4,50,31,.07),0_8px_20px_-16px_rgba(4,50,31,.14)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)] sm:grid-cols-[44px_minmax(0,1fr)_auto]">
                  <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#E8607F] to-[#BE123C]" />
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-[#FDEBEF] text-[#BE123C]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#BE123C]">
                      Invoice overdue{invoiceStats.overdueCount > 1 ? ' × ' + invoiceStats.overdueCount : ''}
                    </p>
                    <p className="quote-serif mt-1 text-[23px] font-medium leading-tight tracking-[-0.018em]">
                      {formatCurrency(inv.totalAmount)} is past its due date
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#6F7C74]">
                      <b className="font-mono font-semibold text-[#3F4C45]">{inv.invoiceNumber}</b>
                      <i className="inline-block h-[3px] w-[3px] rounded-full bg-[#C2CDC6]" />
                      due {formatDate(inv.dueDate)}
                      <i className="inline-block h-[3px] w-[3px] rounded-full bg-[#C2CDC6]" />
                      service can be paused if it stays unpaid
                    </p>
                  </div>
                  <span className="inline-flex flex-none items-center gap-2 rounded-xl bg-gradient-to-b from-[#DB2C50] to-[#BE123C] px-5 py-3 text-[12.5px] font-bold text-white shadow-[0_14px_26px_-14px_rgba(190,18,60,.9)]">
                    Pay {formatCurrency(inv.totalAmount)} <ChevronRight className="h-4 w-4" />
                  </span>
                </a>
              );
            })()}

            {actionNeeded > 0 && (() => {
              const qb = bookings.find((b: any) => b.status === 'SUPER_QUOTE_SENT');
              if (!qb) return null;
              return (
                <Link key="quote" href={"/customer/b2b-bookings/" + qb.id + "?customer_id=" + customerId}
                  className="relative grid items-center gap-4 overflow-hidden rounded-[20px] border border-[#DCCEFA] bg-white px-6 py-5 pl-7 shadow-[0_1px_3px_rgba(4,50,31,.07),0_8px_20px_-16px_rgba(4,50,31,.14)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)] sm:grid-cols-[44px_minmax(0,1fr)_auto]">
                  <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9]" />
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-[#F3EEFE] text-[#6D28D9]">
                    <AlertCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6D28D9]">
                      Quote ready{actionNeeded > 1 ? ' × ' + actionNeeded : ''}
                    </p>
                    <p className="quote-serif mt-1 text-[23px] font-medium leading-tight tracking-[-0.018em]">
                      Accept to lock the {qb.pickupLocation || 'requested'} fleet
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#6F7C74]">
                      <b className="font-mono font-semibold text-[#3F4C45]">{qb.bookingNumber}</b>
                      {qb.finalAmount > 0 && (<><i className="inline-block h-[3px] w-[3px] rounded-full bg-[#C2CDC6]" />{formatCurrency(qb.finalAmount)}</>)}
                      <i className="inline-block h-[3px] w-[3px] rounded-full bg-[#C2CDC6]" />
                      {qb.vehiclesRequired} vehicle{qb.vehiclesRequired !== 1 ? 's' : ''}
                      {qb.passengerCount ? ' for ' + qb.passengerCount + ' passengers' : ''}
                      {qb.scheduledDate && (<><i className="inline-block h-[3px] w-[3px] rounded-full bg-[#C2CDC6]" />travel on {formatDate(qb.scheduledDate)}</>)}
                    </p>
                  </div>
                  <span className="inline-flex flex-none items-center gap-2 rounded-xl bg-gradient-to-b from-[#7C3AED] to-[#6D28D9] px-5 py-3 text-[12.5px] font-bold text-white shadow-[0_14px_26px_-14px_rgba(109,40,217,.9)]">
                    Review &amp; accept <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════ PENDING PAYMENTS ══════════════ */}
      {recentInvoices.length > 0 && (
        <div className="overflow-hidden rounded-[22px] border border-[#DFE8E2] bg-white shadow-[0_1px_3px_rgba(4,50,31,.07),0_8px_20px_-16px_rgba(4,50,31,.14)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#EFE0BE] bg-gradient-to-r from-[#FDF6E7] to-[#FAFCFB] px-5 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B4700F]">Raised against your bookings</p>
              <h3 className="quote-serif mt-1 text-[21px] font-semibold leading-none text-[#8A5409]">Pending payments</h3>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex-none rounded-full bg-[#B4700F] px-2.5 py-[2px] text-[10px] font-bold tabular-nums text-white">
                {recentInvoices.length}
              </span>
              <Link href={"/customer/b2b-bookings/invoices?customer_id=" + customerId}
                className="inline-flex items-center gap-2 rounded-full border border-[#EFE0BE] bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#B4700F] transition hover:border-[#B4700F] hover:bg-[#FDF6E7]">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {recentInvoices.map((inv: any) => {
            const isOverdue = new Date(inv.dueDate) < new Date();
            return (
              <a key={inv.id} href={"/invoice/b2b/" + inv.id} target="_blank" rel="noopener noreferrer"
                className="flex flex-wrap items-center gap-4 border-b border-[#DFE8E2] px-5 py-4 transition last:border-b-0 hover:bg-[#F8FBF9]">
                <span className={"grid h-10 w-10 flex-none place-items-center rounded-xl " + (isOverdue ? 'bg-[#FDEBEF] text-[#BE123C]' : 'bg-[#FDF6E7] text-[#B4700F]')}>
                  <FileText className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-[#3F4C45]">{inv.invoiceNumber}</span>
                    {isOverdue && (
                      <span className="rounded-full border border-[#F6C9D4] bg-[#FDEBEF] px-2 py-[2px] text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#BE123C]">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums text-[#9DAAA2]">Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex-none text-right">
                  <p className={"quote-serif text-[21px] font-medium leading-none tabular-nums " + (isOverdue ? 'text-[#9F0F32]' : 'text-[#0A140F]')}>
                    {formatCurrency(inv.totalAmount)}
                  </p>
                  <p className={"mt-1.5 text-[11px] font-bold " + (isOverdue ? 'text-[#BE123C]' : 'text-[#B4700F]')}>Pay now &rarr;</p>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── what you can do, sitting on top of the list it acts on ── */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <Link href={"/customer/b2b-bookings/create?customer_id=" + customerId}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#09B368] to-[#056B3E] px-[18px] py-[11px] text-[12.5px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(4,50,31,.9)] transition hover:-translate-y-0.5">
          <Plus className="h-[15px] w-[15px]" /> Raise a requirement
        </Link>
        <Link href={"/customer/b2b-bookings/invoices?customer_id=" + customerId}
          className="inline-flex items-center gap-2 rounded-xl border border-[#CBD9D1] bg-white px-[18px] py-[11px] text-[12.5px] font-bold text-[#3F4C45] transition hover:-translate-y-0.5 hover:border-[#09B368] hover:text-[#056B3E]">
          <FileText className="h-[15px] w-[15px]" /> Invoices
        </Link>
        <Link href={"/customer/b2b-bookings?customer_id=" + customerId}
          className="inline-flex items-center gap-2 rounded-xl border border-[#CBD9D1] bg-white px-[18px] py-[11px] text-[12.5px] font-bold text-[#3F4C45] transition hover:-translate-y-0.5 hover:border-[#09B368] hover:text-[#056B3E]">
          All bookings <ChevronRight className="h-[15px] w-[15px]" />
        </Link>
      </div>

      {/* ══════════════ BOOKINGS ══════════════ */}
      <div className="pt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9DAAA2]">Raised by your company</p>
            <h3 className="quote-serif mt-1.5 text-[27px] font-medium leading-none tracking-[-0.02em]">Bookings</h3>
          </div>
          {bookings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => {
                const n = f.key === 'all' ? bookings.length
                  : f.key === 'active' ? stats.active
                  : f.key === 'pending' ? stats.pending
                  : stats.completed;
                const on = statusFilter === f.key;
                return (
                  <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                    className={"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition " + (
                      on ? 'border-[#04321F] bg-[#04321F] text-white'
                         : n === 0 ? 'border-dashed border-[#CBD9D1] text-[#C2CDC6]'
                         : 'border-[#CBD9D1] bg-white text-[#3F4C45] hover:border-[#09B368] hover:text-[#056B3E]')}>
                    {f.label} <span className="tabular-nums opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {bookings.length > 0 && serviceTypes.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9DAAA2]">
              <Filter className="h-3 w-3" /> Service
            </span>
            <button type="button" onClick={() => setServiceFilter('all')}
              className={"rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition " + (
                serviceFilter === 'all' ? 'border-[#04321F] bg-[#04321F] text-white'
                  : 'border-[#CBD9D1] bg-white text-[#3F4C45] hover:border-[#09B368] hover:text-[#056B3E]')}>
              All services
            </button>
            {serviceTypes.map((st: any) => {
              const Icon = SERVICE_ICONS[st] || Truck;
              const n = bookings.filter((b: any) => b.serviceType === st).length;
              return (
                <button key={st} type="button" onClick={() => setServiceFilter(st)}
                  className={"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition " + (
                    serviceFilter === st ? 'border-[#04321F] bg-[#04321F] text-white'
                      : 'border-[#CBD9D1] bg-white text-[#3F4C45] hover:border-[#09B368] hover:text-[#056B3E]')}>
                  <Icon className="h-3 w-3" /> {serviceLabel(st)} <span className="tabular-nums opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-[22px] border border-[#DFE8E2] bg-white py-16 text-center shadow-[0_1px_3px_rgba(4,50,31,.07)]">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-[#DFE8E2]" />
            <p className="quote-serif text-[24px] font-medium text-[#0A140F]">No corporate bookings yet</p>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px] text-[#9DAAA2]">Raise your first requirement and vendors will quote against it.</p>
            <Link href={"/customer/b2b-bookings/create?customer_id=" + customerId}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#09B368] to-[#056B3E] px-5 py-2.5 text-[12.5px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(4,50,31,.9)] transition hover:-translate-y-0.5">
              <Plus className="h-4 w-4" /> Raise a requirement
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-[22px] border border-[#DFE8E2] bg-white py-14 text-center shadow-[0_1px_3px_rgba(4,50,31,.07)]">
            <Filter className="mx-auto mb-3 h-9 w-9 text-[#DFE8E2]" />
            <p className="quote-serif text-[22px] font-medium text-[#0A140F]">Nothing matches those filters</p>
            <p className="mt-2 text-[12.5px] text-[#9DAAA2]">Try another status or service.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b: any, idx: number) => {
              const ServiceIcon = SERVICE_ICONS[b.serviceType] || Truck;
              const isActionNeeded = b.status === 'SUPER_QUOTE_SENT';
              const unpaidInvoice = unpaidInvoiceByBookingId.get(b.id);
              const isInvoiceReady = !!unpaidInvoice;
              const isInvoiceOverdue = isInvoiceReady && new Date(unpaidInvoice.dueDate) < new Date();
              const step = STAGE_STEP[b.status] ?? 1;
              const tone = STAGE_TONE[b.status]
                || { text: 'text-[#6F7C74]', bar: 'bg-[#6F7C74]', line: 'border-[#DFE8E2]', wash: 'bg-[#F8FBF9]' };
              const flag = isActionNeeded ? 'v' : isInvoiceOverdue ? 'r' : isInvoiceReady ? 'a' : '';
              /* Invoice ki haalat stage se upar jaati hai — warna har booking apne
                 stage ka hi rang pehanti hai. */
              const line = flag === 'r' ? 'border-[#F6C9D4]' : flag === 'a' ? 'border-[#EFE0BE]' : tone.line;
              const wash = flag === 'r' ? 'bg-[#FDEBEF]' : flag === 'a' ? 'bg-[#FDF6E7]' : tone.wash;
              const stripe = flag === 'r' ? 'bg-[#BE123C]' : flag === 'a' ? 'bg-[#B4700F]' : tone.bar;

              return (
                <Link key={b.id} href={"/customer/b2b-bookings/" + b.id + "?customer_id=" + customerId}
                  className={"group relative grid overflow-hidden rounded-[22px] border bg-white shadow-[0_1px_3px_rgba(4,50,31,.07),0_8px_20px_-16px_rgba(4,50,31,.14)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)] lg:grid-cols-[64px_minmax(0,1fr)_232px] " + line}>

                  {/* stage ka rang — har chaudai par dikhta hai, rail chhoti screen par chhup jaati hai */}
                  <span className={"pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] " + stripe} />

                  {/* rail */}
                  <div className={"hidden flex-col items-center justify-center gap-3 border-r py-5 lg:flex " + line + " " + wash}>
                    <span className="w-px flex-1 bg-[#CBD9D1]" />
                    <span className={"grid h-9 w-9 flex-none place-items-center rounded-xl " + (SERVICE_COLORS[b.serviceType] || 'bg-[#F8FBF9] text-[#6F7C74]')}>
                      <ServiceIcon className="h-[17px] w-[17px]" />
                    </span>
                    <span className="font-mono text-[9.5px] font-bold text-[#C2CDC6]">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="w-px flex-1 bg-[#CBD9D1]" />
                  </div>

                  {/* body */}
                  <div className="min-w-0 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={"grid h-8 w-8 flex-none place-items-center rounded-lg lg:hidden " + (SERVICE_COLORS[b.serviceType] || 'bg-[#F8FBF9] text-[#6F7C74]')}>
                        <ServiceIcon className="h-4 w-4" />
                      </span>
                      <span className="font-mono text-[12px] font-bold text-[#6F7C74]">{b.bookingNumber}</span>
                      <span className={"rounded-full border px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.12em] " + (STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                      {isInvoiceOverdue && (
                        <span className="rounded-full border border-[#F6C9D4] bg-[#FDEBEF] px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#BE123C]">
                          Overdue
                        </span>
                      )}
                    </div>

                    <h4 className="quote-serif mt-1.5 text-[21px] font-medium leading-[1.12] tracking-[-0.018em] text-[#0A140F]">
                      {serviceLabel(b.serviceType)}
                      {b.pickupLocation ? <> &mdash; {b.pickupLocation}</> : null}
                    </h4>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[11.5px] text-[#6F7C74]">
                      {b.pickupLocation && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 flex-none text-[#9DAAA2]" />
                          <b className="font-semibold text-[#3F4C45]">{b.pickupLocation}</b>
                          {b.dropLocation && (
                            <>
                              <span className="h-px w-3 flex-none bg-[#CBD9D1]" />
                              <b className="font-semibold text-[#3F4C45]">{b.dropLocation}</b>
                            </>
                          )}
                        </span>
                      )}
                      {b.scheduledDate && (
                        <>
                          <i className="inline-block h-[3px] w-[3px] flex-none rounded-full bg-[#C2CDC6]" />
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Calendar className="h-3 w-3 flex-none text-[#9DAAA2]" />
                            {formatDate(b.scheduledDate)}
                          </span>
                        </>
                      )}
                      <i className="inline-block h-[3px] w-[3px] flex-none rounded-full bg-[#C2CDC6]" />
                      <span><b className="font-semibold text-[#3F4C45]">{b.vehiclesRequired}</b> vehicle{b.vehiclesRequired !== 1 ? 's' : ''}</span>
                      {b.passengerCount ? (<><i className="inline-block h-[3px] w-[3px] flex-none rounded-full bg-[#C2CDC6]" /><span>{b.passengerCount} passengers</span></>) : null}
                      {b.tripType ? (<><i className="inline-block h-[3px] w-[3px] flex-none rounded-full bg-[#C2CDC6]" /><span>{TRIP_TYPE_LABELS[b.tripType] || b.tripType}</span></>) : null}
                      {b._count?.trips > 0 ? (<><i className="inline-block h-[3px] w-[3px] flex-none rounded-full bg-[#C2CDC6]" /><span>{b._count.trips} trip{b._count.trips !== 1 ? 's' : ''} run</span></>) : null}

                      {/* the stage closes the row, so the eye lands on it last */}
                      <span className={"ml-auto flex flex-none items-center gap-2.5 whitespace-nowrap " + tone.text}>
                        <span className="flex items-center gap-2 text-[12px] font-bold">
                          <i className="h-[7px] w-[7px] flex-none rounded-full bg-current" />
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                        <span className="flex gap-[3px]">
                          {[1, 2, 3, 4].map((seg) => (
                            <i key={seg} className={"h-[3px] w-[18px] rounded-full " + (seg <= step ? tone.bar : 'bg-[#DFE8E2]')} />
                          ))}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* stub */}
                  <div className={"relative flex flex-col justify-center border-t px-6 py-4 lg:border-l lg:border-t-0 " + (
                    flag === 'v' ? 'border-[#DCCEFA] bg-gradient-to-b from-[#F6F2FE] to-[#F1EBFD]'
                      : flag === 'r' ? 'border-[#F6C9D4] bg-gradient-to-b from-[#FEF1F4] to-[#FDE8EE]'
                      : flag === 'a' ? 'border-[#EFE0BE] bg-gradient-to-b from-[#FDF9EF] to-[#FCF4E4]'
                      : 'border-[#DFE8E2] bg-[#F2F7F3]')}>
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#9DAAA2]">
                      {isInvoiceReady ? 'Invoiced' : b.finalAmount > 0 ? 'Quoted' : 'Value'}
                    </p>
                    {b.finalAmount > 0 ? (
                      <p className={"quote-serif mt-1.5 text-[25px] font-medium leading-none tabular-nums tracking-[-0.02em] " + (isInvoiceOverdue ? 'text-[#9F0F32]' : 'text-[#0A140F]')}>
                        {formatCurrency(b.finalAmount)}
                      </p>
                    ) : (
                      <p className="quote-serif mt-1.5 text-[17px] italic leading-none text-[#C2CDC6]">Not quoted yet</p>
                    )}
                    {isInvoiceReady ? (
                      <>
                        <p className="mt-2 font-mono text-[10.5px] font-semibold text-[#6F7C74]">{unpaidInvoice.invoiceNumber}</p>
                        <p className={"mt-1 text-[10.5px] " + (isInvoiceOverdue ? 'font-semibold text-[#BE123C]' : 'text-[#B4700F]')}>
                          {isInvoiceOverdue ? 'Overdue since ' + formatDate(unpaidInvoice.dueDate) : 'Due ' + formatDate(unpaidInvoice.dueDate)}
                        </p>
                        {unpaidInvoice.totalAmount !== b.finalAmount && (
                          <p className="mt-1 text-[10.5px] tabular-nums text-[#9DAAA2]">Invoiced {formatCurrency(unpaidInvoice.totalAmount)}</p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-[10.5px] text-[#9DAAA2]">
                        {b.status === 'PAID' ? 'Paid in full' : b.finalAmount > 0 ? 'Not invoiced yet' : 'Awaiting vendor quotes'}
                      </p>
                    )}

                    {(isActionNeeded || isInvoiceReady) && (
                      <span className={"mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11.5px] font-bold text-white " + (
                        isActionNeeded ? 'bg-gradient-to-b from-[#7C3AED] to-[#6D28D9] shadow-[0_12px_24px_-14px_rgba(109,40,217,.9)]'
                          : isInvoiceOverdue ? 'bg-gradient-to-b from-[#DB2C50] to-[#BE123C] shadow-[0_12px_24px_-14px_rgba(190,18,60,.9)]'
                          : 'bg-gradient-to-b from-[#D9930F] to-[#B4700F] shadow-[0_12px_24px_-14px_rgba(180,112,15,.85)]')}>
                        {isActionNeeded ? 'Review & accept' : 'Pay now'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════ FOOT ══════════════ */}
      <div className="pt-6">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9DAAA2]">Your company</p>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={"/customer/b2b-bookings/invoices?customer_id=" + customerId}
            className="rounded-[18px] border border-[#DFE8E2] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(4,50,31,.07)] transition hover:-translate-y-0.5 hover:border-[#C3E5D4] hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)]">
            <div className="flex items-center gap-3">
              <span className={"grid h-8 w-8 flex-none place-items-center rounded-[11px] " + (invoiceStats.overdueCount > 0 ? 'bg-[#FDEBEF] text-[#BE123C]' : 'bg-[#FDF6E7] text-[#B4700F]')}>
                <FileText className="h-4 w-4" />
              </span>
              <b className="text-[12.5px]">Invoices</b>
              <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#C2CDC6]" />
            </div>
            <p className="quote-serif mt-2.5 text-[19px] leading-none tabular-nums">{formatCurrency(invoiceStats.unpaidAmount)}</p>
            <p className="mt-1.5 text-[11px] leading-[1.6] text-[#9DAAA2]">
              {invoiceStats.overdueCount > 0
                ? invoiceStats.overdueCount + ' overdue of ' + invoices.length + ' raised.'
                : invoices.length + ' invoice' + (invoices.length !== 1 ? 's' : '') + ' raised, nothing overdue.'}
            </p>
          </Link>

          <Link href={"/customer/b2b-bookings?customer_id=" + customerId}
            className="rounded-[18px] border border-[#DFE8E2] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(4,50,31,.07)] transition hover:-translate-y-0.5 hover:border-[#C3E5D4] hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)]">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-[#E9F7F0] text-[#056B3E]"><Briefcase className="h-4 w-4" /></span>
              <b className="text-[12.5px]">All bookings</b>
              <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#C2CDC6]" />
            </div>
            <p className="quote-serif mt-2.5 text-[19px] leading-none">{companyName || 'B2B Corporate'}</p>
            <p className="mt-1.5 text-[11px] leading-[1.6] text-[#9DAAA2]">Every corporate booking on this account, with filters.</p>
          </Link>

          <Link href="/customer/helpdesk"
            className="rounded-[18px] border border-[#DFE8E2] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(4,50,31,.07)] transition hover:-translate-y-0.5 hover:border-[#C3E5D4] hover:shadow-[0_30px_60px_-34px_rgba(4,50,31,.34)]">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-[#E8F0FE] text-[#1D4ED8]"><ExternalLink className="h-4 w-4" /></span>
              <b className="text-[12.5px]">Helpdesk</b>
              <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#C2CDC6]" />
            </div>
            <p className="quote-serif mt-2.5 text-[19px] leading-none">Raise a ticket</p>
            <p className="mt-1.5 text-[11px] leading-[1.6] text-[#9DAAA2]">Anything the booking pages cannot settle for you.</p>
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
