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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import TravelAgentOnboarding from '@/components/travel-agent/onboarding/TravelAgentOnboarding';

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
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-4 sm:px-6 pt-5 pb-16 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20" />
          <div className="space-y-2.5">
            <div className="h-5 w-40 bg-white/20 rounded-lg" />
            <div className="h-3 w-56 bg-white/15 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/15 rounded-2xl w-36 h-[64px]" />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-6 -mt-8 pb-10 space-y-4 animate-pulse">
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

  const agentName = session?.user?.name || 'Travel Agent';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

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
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 relative overflow-hidden px-4 sm:px-6 pt-5 pb-16">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative w-full">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 text-white font-bold text-lg">
                {agentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-emerald-200 text-xs font-medium">{greeting},</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">{agentName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/travel-agent/leads/add"
                className="inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lead
              </Link>
              <Link
                href="/travel-agent/tours/add"
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tour
              </Link>
              <Link
                href="/travel-agent/properties/add"
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property
              </Link>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Total Leads', value: stats?.leads.total ?? 0, icon: <Target className="w-5 h-5" /> },
              { label: 'Hot Leads', value: stats?.leads.hot ?? 0, icon: <Flame className="w-5 h-5" /> },
              { label: 'Conversion Rate', value: `${stats?.leads.conversionRate ?? 0}%`, icon: <CheckCircle2 className="w-5 h-5" /> },
              { label: 'Booking Value', value: `₹${((stats?.bookings.totalAmount ?? 0) / 1000).toFixed(1)}K`, icon: <TrendingUp className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/[0.18] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner shadow-white/10">{stat.icon}</div>
                <div>
                  <p className="text-xl font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 -mt-8 pb-12 w-full space-y-5">

        {/* Lead pipeline */}
        <AnimateIn delay={40}>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Lead Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Leads" value={stats?.leads.total ?? 0} sub={`${stats?.leads.thisMonth ?? 0} this month`} icon={Target} color="emerald" href="/travel-agent/leads" />
            <StatCard label="Hot Leads" value={stats?.leads.hot ?? 0} sub="High priority" icon={Flame} color="red" href="/travel-agent/leads?priority=HOT" />
            <StatCard label="Conversions" value={stats?.leads.booked ?? 0} sub={`${stats?.leads.conversionRate ?? 0}% rate`} icon={CheckCircle2} color="green" href="/travel-agent/leads?status=BOOKED" />
            <StatCard label="Lost" value={stats?.leads.lost ?? 0} sub="Track reasons" icon={XCircle} color="gray" href="/travel-agent/leads?status=LOST" />
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
            <ListingCard title="Tours" total={stats?.tours.total ?? 0} active={stats?.tours.active ?? 0} icon={Compass} color="blue" href="/travel-agent/tours" />
            <ListingCard title="Properties" total={stats?.properties.total ?? 0} active={stats?.properties.active ?? 0} icon={Building2} color="purple" href="/travel-agent/properties" />
            <ListingCard title="Fleet" total={stats?.fleet.total ?? 0} active={stats?.fleet.active ?? 0} icon={Car} color="amber" href="/travel-agent/fleet" />
            <ListingCard title="Bookings" total={stats?.bookings.total ?? 0} active={stats?.bookings.thisMonth ?? 0} activeLabel="this month" icon={BookOpen} color="emerald" href="/travel-agent/bookings" />
          </div>
        </AnimateIn>

        {/* Quick Actions */}
        <AnimateIn delay={180}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionTile label="Add Lead" icon={Plus} color="emerald" href="/travel-agent/leads/add" />
            <QuickActionTile label="New Booking" icon={CalendarPlus} color="blue" href="/travel-agent/bookings/add" />
            <QuickActionTile label="Add Tour" icon={Compass} color="purple" href="/travel-agent/tours/add" />
            <QuickActionTile label="Add Property" icon={Building2} color="amber" href="/travel-agent/properties/add" />
            <QuickActionTile label="Add Vehicle" icon={Car} color="blue" href="/travel-agent/fleet/add" />
            <QuickActionTile label="Capture Link" icon={Link2} color="amber" href="/travel-agent/capture-links" />
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
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-200/80 p-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
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
}: {
  title: string;
  total: number;
  active: number;
  activeLabel?: string;
  icon: any;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
  href: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
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
