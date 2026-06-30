'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Compass,
  Building2,
  BookOpen,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    hot: number;
    booked: number;
    lost: number;
    thisMonth: number;
    conversionRate: number;
  };
  followUps: { today: number; thisWeek: number };
  tours: { total: number; active: number };
  properties: { total: number; active: number };
  bookings: {
    total: number;
    confirmed: number;
    thisMonth: number;
    totalAmount: number;
    paidAmount: number;
  };
}

export default function TravelAgentDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectingBackr, setIsConnectingBackr] = useState(false);

  const connectBackr = async () => {
    const taId = (session?.user as any)?.id;
    if (!taId) return;
    setIsConnectingBackr(true);
    try {
      const res = await fetch('/api/backr/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelAgentId: taId }),
      });
      const data = await res.json();
      if (data.ssoUrl) window.location.href = data.ssoUrl;
    } catch { /* silent */ } finally {
      setIsConnectingBackr(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/travel-agent/dashboard');
        if (res.ok) setStats(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const agentName = session?.user?.name || 'Travel Agent';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-bold mt-1">{agentName} 👋</h1>
            <p className="text-emerald-100 text-sm mt-2 max-w-md">
              Here&apos;s a quick view of your leads, tours, properties and bookings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/travel-agent/leads/add"
              className="inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-3.5 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </Link>
            <Link
              href="/travel-agent/tours/add"
              className="inline-flex items-center gap-1.5 bg-white/20 text-white hover:bg-white/30 font-semibold text-xs px-3.5 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tour
            </Link>
            <Link
              href="/travel-agent/properties/add"
              className="inline-flex items-center gap-1.5 bg-white/20 text-white hover:bg-white/30 font-semibold text-xs px-3.5 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add Property
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Lead Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Leads"
            value={stats?.leads.total ?? 0}
            sub={`${stats?.leads.thisMonth ?? 0} this month`}
            icon={Target}
            color="emerald"
            href="/travel-agent/leads"
          />
          <StatCard
            label="Hot Leads"
            value={stats?.leads.hot ?? 0}
            sub="High priority"
            icon={Flame}
            color="red"
            href="/travel-agent/leads?priority=HOT"
          />
          <StatCard
            label="Conversions"
            value={stats?.leads.booked ?? 0}
            sub={`${stats?.leads.conversionRate ?? 0}% rate`}
            icon={CheckCircle2}
            color="green"
            href="/travel-agent/leads?status=BOOKED"
          />
          <StatCard
            label="Lost"
            value={stats?.leads.lost ?? 0}
            sub="Track reasons"
            icon={XCircle}
            color="gray"
            href="/travel-agent/leads?status=LOST"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/travel-agent/follow-ups"
          className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-bold text-gray-900">Follow-Ups</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-700">{stats?.followUps.today ?? 0}</p>
              <p className="text-xs text-amber-700 mt-0.5">Due today</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-700">{stats?.followUps.thisWeek ?? 0}</p>
              <p className="text-xs text-blue-700 mt-0.5">This week</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-3 group-hover:underline flex items-center gap-1">
            View all follow-ups <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-bold text-gray-900">Bookings</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-emerald-700">{stats?.bookings.confirmed ?? 0}</p>
              <p className="text-xs text-emerald-700 mt-0.5">Confirmed</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-700">
                ₹{((stats?.bookings.totalAmount ?? 0) / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-purple-700 mt-0.5">Booking value</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">My Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ListingCard
            title="Tours"
            total={stats?.tours.total ?? 0}
            active={stats?.tours.active ?? 0}
            icon={Compass}
            color="blue"
            href="/travel-agent/tours"
          />
          <ListingCard
            title="Properties"
            total={stats?.properties.total ?? 0}
            active={stats?.properties.active ?? 0}
            icon={Building2}
            color="purple"
            href="/travel-agent/properties"
          />
          <ListingCard
            title="Bookings"
            total={stats?.bookings.total ?? 0}
            active={stats?.bookings.thisMonth ?? 0}
            activeLabel="this month"
            icon={BookOpen}
            color="emerald"
            href="/travel-agent/bookings"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">Pro Tip</p>
            <p className="text-sm text-gray-600 mt-1">
              Create a public lead-capture link and share it on WhatsApp / social media. Customers fill
              in their requirement and a lead lands directly in your pipeline.
            </p>
            <Link
              href="/travel-agent/capture-links"
              className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm mt-2 hover:underline"
            >
              Create capture link <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* BACKR Rewards */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-violet-200" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">BACKR Rewards</p>
            <p className="text-xs text-violet-200 mt-0.5">
              Earn BACKR tokens on every booking you facilitate. Link your wallet to start collecting.
            </p>
          </div>
        </div>
        <button
          onClick={connectBackr}
          disabled={isConnectingBackr}
          className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {isConnectingBackr
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
            : <><ExternalLink className="w-4 h-4" /> Connect BACKR Wallet</>}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  icon: any;
  color: 'emerald' | 'red' | 'green' | 'gray';
  href: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <Link href={href} className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-emerald-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function ListingCard({
  title,
  total,
  active,
  activeLabel = 'active',
  icon: Icon,
  color,
  href,
}: {
  title: string;
  total: number;
  active: number;
  activeLabel?: string;
  icon: any;
  color: 'blue' | 'purple' | 'emerald';
  href: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <Link href={href} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 transition-colors group">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="font-bold text-gray-900">{title}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {active} {activeLabel}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
      </div>
    </Link>
  );
}
