'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Building2,
  BookOpen,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Car,
  Link2,
  Send,
  CalendarPlus,
  Newspaper,
  MessagesSquare,
  Inbox,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import TravelAgentOnboarding from '@/components/travel-agent/onboarding/TravelAgentOnboarding';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface TravelAgentProfile {
  status: string;
  documentsCount: number;
  bankAccountsCount: number;
  agencyName: string | null;
  ownerName: string | null;
  address: string | null;
  city: string | null;
}

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
  fleet: { total: number; active: number };
  bookings: {
    total: number;
    confirmed: number;
    thisMonth: number;
    totalAmount: number;
    paidAmount: number;
  };
  recentLeads: RecentLead[];
}

interface RecentLead {
  id: string;
  customerName: string;
  tripType: string | null;
  destination: string | null;
  status: string;
  priority: string;
  nextFollowUp: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  INTERESTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  QUOTED: 'bg-purple-100 text-purple-700 border-purple-200',
  NEGOTIATING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  BOOKED: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-red-100 text-red-700 border-red-200',
  COLD: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  HOT: 'bg-red-50 text-red-600 border-red-200',
  WARM: 'bg-amber-50 text-amber-600 border-amber-200',
  COLD: 'bg-gray-50 text-gray-600 border-gray-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* Fade-up on mount */
function AnimateIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Count-up animated number */
function AnimatedNumber({ value, className, prefix = '' }: { value: number; className?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (hasAnimated.current || value === 0) { setCount(value); return; }
    hasAnimated.current = true;
    const start = performance.now();
    const duration = 900;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(value);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className={className}>{prefix}{count.toLocaleString('en-IN')}</span>;
}

function DashboardSkeleton() {
  return (
    <div className="-m-4 lg:-m-6">
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-4 sm:px-6 pt-4 pb-9 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-white/20 rounded-lg" />
            <div className="h-2.5 w-48 bg-white/15 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/15 rounded-xl w-28 h-[48px]" />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-6 -mt-5 pb-10 space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm h-32" />
          <div className="bg-white rounded-2xl shadow-sm h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-28" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TravelAgentDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<TravelAgentProfile | null>(null);
  const [socialUnread, setSocialUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, profileRes, socialRes] = await Promise.all([
          fetch('/api/travel-agent/dashboard'),
          fetch('/api/travel-agent/profile'),
          fetch('/api/social/chat/conversations').catch(() => null),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());
        if (socialRes?.ok) {
          const j = await socialRes.json();
          const total = (j.conversations || []).reduce(
            (sum: number, c: any) => sum + (c.unreadCount || 0),
            0,
          );
          setSocialUnread(total);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const agentName = profile?.agencyName || session?.user?.name || 'Travel Agent';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const headerNote =
    (stats?.leads.hot ?? 0) > 0
      ? `${stats!.leads.hot} hot lead${stats!.leads.hot !== 1 ? 's' : ''} waiting on you`
      : (stats?.followUps.today ?? 0) > 0
        ? `${stats!.followUps.today} follow-up${stats!.followUps.today !== 1 ? 's' : ''} due today`
        : "Here's your business at a glance";

  useTravelAgentPageHeader('Dashboard', `${greeting}, ${agentName}`);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // New/unverified agents get the onboarding takeover instead of the real
  // dashboard — mirrors the vendor side's VendorOnboarding pattern.
  if (profile && profile.status !== 'APPROVED') {
    return (
      <TravelAgentOnboarding
        agentStatus={profile.status}
        documentsCount={profile.documentsCount || 0}
        bankAccountsCount={profile.bankAccountsCount || 0}
        profileComplete={!!(profile.agencyName && profile.ownerName && profile.address && profile.city)}
      />
    );
  }

  return (
    <div className="-m-4 lg:-m-6">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 relative overflow-hidden px-4 sm:px-6 pt-4 pb-9">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative w-full">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 text-white font-bold text-sm shrink-0">
                {agentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-emerald-200 text-[11px] font-medium leading-none">{greeting},</p>
                <h1 className="text-lg font-bold text-white tracking-tight capitalize leading-tight mt-0.5">{agentName}</h1>
                <p className="text-emerald-100/80 text-[11px] mt-0.5">{headerNote}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href="/travel-agent/leads/add"
                className="inline-flex items-center gap-1 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px] px-3 py-2 rounded-lg transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3 h-3" /> Add Lead
              </Link>
              <Link
                href="/travel-agent/tours/add"
                className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 font-semibold text-[11px] px-3 py-2 rounded-lg transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> Add Tour
              </Link>
              <Link
                href="/travel-agent/properties/add"
                className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 font-semibold text-[11px] px-3 py-2 rounded-lg transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> Add Property
              </Link>
            </div>
          </div>

          {/* Stats pills — "what needs attention right now", not a repeat of
              the Lead Pipeline breakdown further down the page. */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { label: 'Hot Leads', value: stats?.leads.hot ?? 0, icon: <Flame className="w-3.5 h-3.5" />, tint: 'bg-rose-400/30 text-rose-50', urgent: (stats?.leads.hot ?? 0) > 0 },
              { label: 'Due Today', value: stats?.followUps.today ?? 0, icon: <Clock className="w-3.5 h-3.5" />, tint: 'bg-amber-400/30 text-amber-50', urgent: (stats?.followUps.today ?? 0) > 0 },
              { label: 'Booking Value', value: `₹${((stats?.bookings.totalAmount ?? 0) / 1000).toFixed(1)}K`, icon: <TrendingUp className="w-3.5 h-3.5" />, tint: 'bg-white/20 text-white', urgent: false },
            ].map((stat) => (
              <div key={stat.label} className="relative bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/[0.18] transition-all duration-300">
                {stat.urgent && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse" aria-hidden="true" />
                )}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-inner shadow-white/10 shrink-0 ${stat.tint}`}>{stat.icon}</div>
                <div>
                  <p className="text-base font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-emerald-200 text-[10px] mt-0.5 whitespace-nowrap">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 -mt-5 pb-12 w-full space-y-5">

        {/* Lead pipeline — the full funnel breakdown; Hot Leads and today's
            follow-ups already live in the header pills above, so they're not
            repeated here. */}
        <AnimateIn delay={40}>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Lead Pipeline</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Leads" value={stats?.leads.total ?? 0} sub={`${stats?.leads.thisMonth ?? 0} this month`} icon={Target} color="emerald" href="/travel-agent/leads" />
            <StatCard label="Converted" value={stats?.leads.booked ?? 0} sub={`${stats?.leads.conversionRate ?? 0}% rate`} icon={CheckCircle2} color="green" href="/travel-agent/leads?status=BOOKED" />
            <StatCard label="Lost" value={stats?.leads.lost ?? 0} sub={(stats?.leads.lost ?? 0) === 0 ? 'None — keep it up' : 'Track reasons'} icon={XCircle} color="gray" href="/travel-agent/leads?status=LOST" />
          </div>
        </AnimateIn>

        {/* Recent Leads — real things to act on, not just a count */}
        <AnimateIn delay={60}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent Leads</h2>
            <Link href="/travel-agent/leads" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
            {!stats?.recentLeads || stats.recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 px-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No leads yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Add one manually, or share your capture link so customers can send you their requirement directly.
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href="/travel-agent/leads/add" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Lead
                  </Link>
                  <Link href="/travel-agent/capture-links" className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors">
                    <Link2 className="w-3.5 h-3.5" /> Capture Link
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/travel-agent/leads/${lead.id}`}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{lead.customerName}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_COLORS[lead.status] || STATUS_COLORS.COLD}`}>
                          {lead.status}
                        </span>
                        {lead.priority === 'HOT' && (
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_COLORS.HOT}`}>
                            <Flame className="w-2.5 h-2.5" /> HOT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {[lead.tripType?.replace(/_/g, ' '), lead.destination].filter(Boolean).join(' · ') || 'No trip details yet'}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{timeAgo(lead.createdAt)}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </AnimateIn>

        {/* Follow-ups + Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimateIn delay={80}>
            <Link
              href="/travel-agent/follow-ups"
              className="block bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-bold text-gray-900">Follow-Ups</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-amber-50 rounded-xl p-3">
                  <AnimatedNumber value={stats?.followUps.today ?? 0} className="text-2xl font-bold text-amber-700" />
                  <p className="text-xs text-amber-700 mt-0.5">Due today</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <AnimatedNumber value={stats?.followUps.thisWeek ?? 0} className="text-2xl font-bold text-blue-700" />
                  <p className="text-xs text-blue-700 mt-0.5">This week</p>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-3 group-hover:underline flex items-center gap-1">
                View all follow-ups <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Link>
          </AnimateIn>

          <AnimateIn delay={120}>
            <Link
              href="/travel-agent/bookings"
              className="block bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-bold text-gray-900">Bookings</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <AnimatedNumber value={stats?.bookings.confirmed ?? 0} className="text-2xl font-bold text-emerald-700" />
                  <p className="text-xs text-emerald-700 mt-0.5">Confirmed</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-purple-700">₹{((stats?.bookings.totalAmount ?? 0) / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-purple-700 mt-0.5">Booking value</p>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-3 group-hover:underline flex items-center gap-1">
                View all bookings <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Link>
          </AnimateIn>
        </div>

        {/* Listings */}
        <AnimateIn delay={160}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">My Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ListingCard
              title="Tours" total={stats?.tours.total ?? 0} active={stats?.tours.active ?? 0}
              icon={Compass} color="blue" href="/travel-agent/tours"
              addHref="/travel-agent/tours/add" addLabel="Add Tour"
              emptyMessage="List your first tour to get a lead"
            />
            <ListingCard
              title="Properties" total={stats?.properties.total ?? 0} active={stats?.properties.active ?? 0}
              icon={Building2} color="purple" href="/travel-agent/properties"
              addHref="/travel-agent/properties/add" addLabel="Add Property"
              emptyMessage="List your first property to get a lead"
            />
            <ListingCard
              title="Fleet" total={stats?.fleet.total ?? 0} active={stats?.fleet.active ?? 0}
              icon={Car} color="amber" href="/travel-agent/fleet"
              addHref="/travel-agent/fleet/add" addLabel="Add Vehicle"
              emptyMessage="Add your first vehicle to start getting ride requests"
            />
            <ListingCard
              title="Bookings" total={stats?.bookings.total ?? 0} active={stats?.bookings.thisMonth ?? 0} activeLabel="this month"
              icon={BookOpen} color="emerald" href="/travel-agent/bookings"
              addHref="/travel-agent/bookings/add" addLabel="Add Booking"
              emptyMessage="Bookings land here once a lead converts, or add one yourself"
            />
          </div>
        </AnimateIn>

        {/* Quick Actions — only things not already one click away from the
            header buttons (Add Lead/Tour/Property) or My Listings. */}
        <AnimateIn delay={180}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionTile label="New Booking" icon={CalendarPlus} color="blue" href="/travel-agent/bookings/add" />
            <QuickActionTile label="Add Vehicle" icon={Car} color="amber" href="/travel-agent/fleet/add" />
            <QuickActionTile label="Capture Link" icon={Link2} color="purple" href="/travel-agent/capture-links" />
            <QuickActionTile label="New Post" icon={Send} color="emerald" href="/travel-agent/social/create" />
          </div>
        </AnimateIn>

        {/* Community */}
        <AnimateIn delay={200}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/travel-agent/social"
              className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Social Feed</p>
                <p className="text-xs text-gray-500 mt-0.5">Community posts & updates</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
            <Link
              href="/travel-agent/social/messages"
              className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group flex items-center gap-3"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                {socialUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {socialUnread > 99 ? '99+' : socialUnread}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Messages</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {socialUnread > 0
                    ? `${socialUnread} unread message${socialUnread > 1 ? 's' : ''}`
                    : 'Chat with vendors & partners'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </div>
        </AnimateIn>

        {/* Pro tip */}
        <AnimateIn delay={200}>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
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
        </AnimateIn>

        {/* BACKR Rewards — hidden for now, re-enable when ready to launch */}
        {/* <BackrCard type="travel_agent" /> */}
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
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
  };
  const accentColors: Record<string, string> = {
    emerald: 'border-t-emerald-400',
    red: 'border-t-red-400',
    green: 'border-t-green-400',
    gray: 'border-t-gray-300',
  };
  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl border border-gray-200/80 border-t-[3px] ${accentColors[color]} p-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <AnimatedNumber value={value} className="text-2xl font-bold text-gray-900 mt-1 block" />
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${colors[color]}`}>
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
  addHref,
  addLabel,
  emptyMessage,
}: {
  title: string;
  total: number;
  active: number;
  activeLabel?: string;
  icon: any;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
  href: string;
  addHref: string;
  addLabel: string;
  emptyMessage: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };

  // Nothing listed yet — point a new agent straight at "add" instead of a
  // bare 0 that gives them no idea what to do next.
  if (total === 0) {
    return (
      <Link
        href={addHref}
        className="bg-white rounded-2xl border border-dashed border-gray-300 p-5 hover:border-solid hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="font-bold text-gray-900">{title}</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed flex-1">{emptyMessage}</p>
        <p className={`inline-flex items-center gap-1 text-xs font-bold mt-3 ${textColors[color]} group-hover:underline`}>
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="font-bold text-gray-900">{title}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <AnimatedNumber value={total} className="text-2xl font-bold text-gray-900 block" />
          <p className="text-xs text-gray-500 mt-0.5">
            {active} {activeLabel}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </Link>
  );
}

function QuickActionTile({
  label,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  icon: any;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
  href: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-gray-200/80 p-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center gap-2"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
    </Link>
  );
}
