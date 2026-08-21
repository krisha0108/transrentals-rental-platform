'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  ChevronRight,
  FileText,
  Wallet,
  ClipboardCheck,
  LayoutGrid,
  Lightbulb,
  Trophy,
  Zap,
  ChevronDown,
  Eye,
  ExternalLink,
  Loader2,
  Bike,
  Key,
  Bus,
  Truck,
  Gem,
  Package,
  Wrench,
  PartyPopper,
  CheckCircle2,
  X,
  Wrench as WrenchIcon,
} from 'lucide-react';
import VendorOnboarding from '@/components/vendor/onboarding/VendorOnboarding';
import VendorLiveLocationCard from '@/components/vendor/VendorLiveLocationCard';
import BackrCard from '@/components/backr/BackrCard';

// ── Post-registration welcome popup — explains what's already done
// (location request, submitted automatically at signup) and what's left
// (documents + services) to get fully verified. ──
function VendorWelcomeModal({
  businessName,
  onClose,
}: {
  businessName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeUp_0.35s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-7 pb-9 text-white overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
            <PartyPopper className="w-7 h-7 text-white" />
          </div>
          <h2 className="relative text-xl font-extrabold leading-tight">Welcome aboard, {businessName}! 🎉</h2>
          <p className="relative text-sm text-blue-100 mt-1.5">Your vendor account is live. Just 2 quick steps left.</p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          {/* Already done */}
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Your service location request is already in</p>
              <p className="text-xs text-emerald-700 mt-0.5">No extra step needed — our team will review it along with your account.</p>
            </div>
          </div>

          {/* What's left */}
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2.5">To get fully verified</p>
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Upload documents</p>
                <p className="text-xs text-gray-500">Business license &amp; vehicle RC</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <WrenchIcon className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Request your services</p>
                <p className="text-xs text-gray-500">Car, bike, bus, truck &amp; more</p>
              </div>
            </div>
          </div>

          <Link
            href="/vendor/documents"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            Start with Documents <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fade-up on scroll/mount ──
function AnimateIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
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

// ── Animated Counter Hook ──
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) { setCount(target); return; }
    hasAnimated.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return { count, ref };
}

interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  status: string;
  vid?: string | null;
  approvedServicesCount: number;
  approvedLocationsCount: number;
  documentsCount?: number;
  serviceRequestsCount?: number;
  locationRequestsCount?: number;
  approvedServiceSlugs?: string[];
}

interface Stats {
  revenue: number;
  revenueGrowthPct: number | null;
  totalBookings: number;
  serviceBreakdown: Array<{
    service: string;
    icon: string;
    bookings: number;
    revenue: number;
  }>;
}

interface RecentQuoteRequest {
  id: string;
  service: string;
  requestNumber: string;
  customerName: string;
  location: string | null;
  eventDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  href: string;
}

// Quote-based services only — mirrors the set used for recent-quote-requests
// on the backend. Car Rental is a direct-booking flow, not a quote request,
// so it's deliberately not part of this map.
const QUOTE_SERVICE_META: Record<string, { label: string; icon: typeof Bike; color: string }> = {
  bike:         { label: 'Bike Rental',       icon: Bike,    color: '#3B82F6' },
  'self-drive': { label: 'Self-Drive',        icon: Key,     color: '#06B6D4' },
  bus:          { label: 'Bus Rental',        icon: Bus,     color: '#F97316' },
  truck:        { label: 'Truck Transport',   icon: Truck,   color: '#6366F1' },
  luxury:       { label: 'Luxury Car',        icon: Gem,     color: '#EC4899' },
  packers:      { label: 'Packers & Movers',  icon: Package, color: '#F59E0B' },
  equipment:    { label: 'Equipment Rental',  icon: Wrench,  color: '#14B8A6' },
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Loading Skeleton ──
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <style jsx>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(5,150,105,0.06), transparent);
          animation: shimmerSweep 1.8s ease-in-out infinite;
        }
      `}</style>
      {/* Header skeleton */}
      <div className="flex items-center gap-3.5 animate-pulse">
        <div className="h-11 w-11 rounded-xl bg-emerald-50 skeleton-shimmer shadow-[0_2px_10px_rgba(0,0,0,0.06)]" />
        <div className="space-y-2.5">
          <div className="h-4 w-40 bg-white rounded-lg skeleton-shimmer shadow-[0_2px_10px_rgba(0,0,0,0.06)]" />
          <div className="h-3 w-24 bg-white/80 rounded-lg skeleton-shimmer shadow-[0_2px_10px_rgba(0,0,0,0.06)]" />
        </div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 space-y-3 skeleton-shimmer">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50" />
            <div className="h-3 w-12 bg-emerald-50 rounded" />
          </div>
          <div className="h-6 w-16 bg-emerald-100/60 rounded-lg" />
          <div className="h-3 w-24 bg-emerald-50 rounded" />
        </div>
        {[2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 space-y-3 skeleton-shimmer">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-50" />
              <div className="h-3 w-12 bg-emerald-50 rounded" />
            </div>
            <div className="h-6 w-12 bg-emerald-100/60 rounded-lg" />
            <div className="h-3 w-20 bg-emerald-50 rounded" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 skeleton-shimmer">
          <div className="space-y-3 mb-6">
            <div className="h-4 w-40 bg-emerald-100/60 rounded-lg" />
            <div className="h-3 w-56 bg-emerald-50 rounded" />
          </div>
          <div className="h-56 bg-emerald-50/40 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 skeleton-shimmer">
          <div className="space-y-3 mb-6">
            <div className="h-4 w-32 bg-emerald-100/60 rounded-lg" />
            <div className="h-3 w-44 bg-emerald-50 rounded" />
          </div>
          <div className="h-56 bg-emerald-50/40 rounded-xl" />
        </div>
      </div>
      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 skeleton-shimmer">
          <div className="h-4 w-36 bg-emerald-100/60 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 shrink-0" />
                <div className="flex-1 h-3 bg-emerald-50 rounded" />
                <div className="h-3 w-16 bg-emerald-50 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 skeleton-shimmer">
          <div className="h-4 w-28 bg-emerald-100/60 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-12 bg-emerald-50/40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentQuoteRequests, setRecentQuoteRequests] = useState<RecentQuoteRequest[]>([]);
  const [showAllActions, setShowAllActions] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today'|'week'|'month'|'quarter'|'year'|'all'|'custom'>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setShowWelcome(true);
      router.replace('/vendor/dashboard');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/vendor/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (timeFilter === 'custom' && (!customFrom || !customTo)) return;

    async function fetchData() {
      try {
        const statsUrl = timeFilter === 'custom'
          ? `/api/vendor/dashboard/stats?period=custom&from=${customFrom}&to=${customTo}`
          : `/api/vendor/dashboard/stats?period=${timeFilter}`;

        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/vendor/profile'),
          fetch(statsUrl),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.stats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, timeFilter, customFrom, customTo]);

  // Independent of the time filter — this is always "recent open
  // opportunities", not a period-scoped stat, so it only needs to load once.
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/vendor/dashboard/recent-quote-requests')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setRecentQuoteRequests(data.requests);
      })
      .catch(() => {});
  }, [status]);

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />;
  }

  if (profile && profile.status !== 'APPROVED') {
    return (
      <>
        {showWelcome && (
          <VendorWelcomeModal
            businessName={profile.businessName}
            onClose={() => setShowWelcome(false)}
          />
        )}
        <VendorOnboarding
          vendorStatus={profile.status}
          documentsCount={profile.documentsCount || 0}
          serviceRequestsCount={profile.serviceRequestsCount || 0}
        />
      </>
    );
  }

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
  const periodLabel = timeFilter === 'custom'
    ? (customFrom && customTo ? `${fmtDate(customFrom)} – ${fmtDate(customTo)}` : 'Custom Range')
    : ({
        today: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        week: 'This Week',
        month: currentMonth,
        quarter: 'Last 3 Months',
        year: String(now.getFullYear()),
        all: 'All Time',
      } as Record<string, string>)[timeFilter];

  const allServices = [
    { slugs: ['bike-rental', 'bike', 'bike-rentals', 'two-wheeler'], name: 'Bike Rentals', description: 'Requests & Bookings', icon: '🏍️', href: '/vendor/bike-rentals/requests', color: '#3B82F6', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    { slugs: ['chauffeur-driven-car-rental', 'chauffeur', 'car-rental', 'car-with-driver'], name: 'Car Rentals', description: 'With Driver', icon: '🚗', href: '/vendor/car-rental/bookings', color: '#8B5CF6', bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
    { slugs: ['self-drive-car-rental', 'self-drive', 'car-rental-self-drive', 'self-driven'], name: 'Self-Drive', description: 'Without Driver', icon: '🔑', href: '/vendor/self-drive/requests', color: '#06B6D4', bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' },
    { slugs: ['bus-rental', 'bus', 'bus-on-rent', 'coach-rental'], name: 'Bus Rentals', description: 'Requests & Bookings', icon: '🚌', href: '/vendor/bus/requests', color: '#F97316', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
    { slugs: ['luxury-car-rental', 'luxury', 'premium-car', 'luxury-cars'], name: 'Luxury Cars', description: 'Premium Service', icon: '💎', href: '/vendor/luxury/requests', color: '#EC4899', bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600' },
    { slugs: ['packers-and-movers', 'packers-movers', 'relocation', 'home-shifting'], name: 'Packers & Movers', description: 'Relocation Service', icon: '📦', href: '/vendor/packers/requests', color: '#F59E0B', bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    { slugs: ['truck-transport', 'truck', 'goods-transport', 'cargo', 'transporter', 'truck-rental'], name: 'Truck Transport', description: 'Cargo Service', icon: '🚚', href: '/vendor/truck/requests', color: '#6366F1', bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600' },
    { slugs: ['equipment-rental', 'equipment', 'construction-equipment', 'machinery'], name: 'Equipment Rental', description: 'Construction Equipment', icon: '⚙️', href: '/vendor/equipment/requests', color: '#14B8A6', bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' },
    // Wander and Direct Bookings aren't part of the approvable services
    // catalog (no matching slug ever appears in approvedServiceSlugs), so
    // they never surface as a Quick Action tile here — these two entries
    // exist purely so the revenue breakdown/donut/top-performers have a
    // real color and icon for them instead of falling back to grey.
    { slugs: ['wander', 'wander-tours', 'group-trip'], name: 'Wander Tours', description: 'Group Trip Bookings', icon: '🗺️', href: '/vendor/wander/bookings', color: '#F43F5E', bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
    { slugs: ['direct-bookings', 'direct-booking', 'direct'], name: 'Direct Bookings', description: 'Personal Client Bookings', icon: '📋', href: '/vendor/direct-bookings', color: '#0EA5E9', bg: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-600' },
  ];

  const approvedServices = profile?.approvedServiceSlugs
    ? allServices.filter((service) => {
        return service.slugs.some((serviceSlug) =>
          profile.approvedServiceSlugs!.some((approvedSlug) =>
            approvedSlug === serviceSlug ||
            approvedSlug.includes(serviceSlug) ||
            serviceSlug.includes(approvedSlug)
          )
        );
      })
    : [];

  // Helper to find service color
  const findServiceColor = (serviceName: string) => {
    return allServices.find(s =>
      s.name === serviceName ||
      s.slugs.some(slug => serviceName.toLowerCase().includes(slug.split('-')[0]))
    );
  };

  // Sort breakdown by revenue
  const sortedBreakdown = stats?.serviceBreakdown
    ? [...stats.serviceBreakdown].sort((a, b) => b.revenue - a.revenue)
    : [];

  // Total revenue for donut
  const totalRevenue = stats?.revenue || 0;

  // Top N only — "Top Performers" should be a curated highlight, not a
  // second copy of the full breakdown that's already shown as bars.
  const topPerformers = sortedBreakdown.slice(0, 5);

  // Generate smart insights
  const insights: { text: string; type: 'success' | 'warning' | 'info' }[] = [];
  if (sortedBreakdown.length > 0) {
    const top = sortedBreakdown[0];
    const topPct = totalRevenue > 0 ? ((top.revenue / totalRevenue) * 100).toFixed(0) : '0';
    insights.push({ text: `${top.icon} ${top.service} generated ${topPct}% of your revenue — ${periodLabel}`, type: 'success' });

    if (sortedBreakdown.length > 1) {
      const bottom = sortedBreakdown[sortedBreakdown.length - 1];
      const bottomPct = totalRevenue > 0 ? ((bottom.revenue / totalRevenue) * 100).toFixed(0) : '0';
      insights.push({ text: `${bottom.icon} ${bottom.service} contributed only ${bottomPct}% — consider promotions`, type: 'warning' });
    }

    if (profile?.approvedLocationsCount && profile.approvedLocationsCount > 100) {
      insights.push({ text: `📍 You're active in ${profile.approvedLocationsCount} locations — great coverage!`, type: 'info' });
    }
  }

  const displayActions = showAllActions ? approvedServices : approvedServices.slice(0, 4);

  return (
    <div className="space-y-6 min-h-dvh bg-[#F9FAFB] -m-4 p-4 sm:-m-6 sm:p-6">

      <style jsx>{`
        @keyframes shimmerSweepCard {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes glowEmerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.15); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.3); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hover-shimmer {
          position: relative;
          overflow: hidden;
        }
        .hover-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(5,150,105,0.06), transparent);
          transform: translateX(-100%);
          transition: none;
        }
        .hover-shimmer:hover::after {
          animation: shimmerSweepCard 0.8s ease-in-out;
        }
        .glow-emerald:hover {
          animation: glowEmerald 2s ease-in-out infinite;
        }
      `}</style>

      {/* ══════════ ROW 0: Header ══════════ */}
      <AnimateIn delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-500/25">
              {profile?.businessName?.charAt(0) || 'V'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{profile?.businessName || 'Dashboard'}</h1>
                {profile?.vid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wider">
                    {profile.vid.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs">{greeting}, {profile?.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-full pb-0.5">
            {([
              {key:'today',label:'Today'},
              {key:'week',label:'This Week'},
              {key:'month',label:'This Month'},
              {key:'quarter',label:'3 Months'},
              {key:'year',label:'This Year'},
              {key:'all',label:'All Time'},
              {key:'custom',label:'Custom'},
            ] as const).map(f => (
              <button key={f.key} onClick={() => setTimeFilter(f.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                  timeFilter === f.key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-emerald-50 border border-gray-200'
                }`}>{f.label}</button>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* ══════════ Your live location ══════════ */}
      <VendorLiveLocationCard />

      {/* ══════════ Custom Date Picker ══════════ */}
      {timeFilter === 'custom' && (
        <div
          className="bg-white rounded-2xl border border-emerald-100 shadow-[0_2px_10px_rgba(5,150,105,0.08)] px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ animation: 'fadeSlideDown 0.2s ease forwards' }}
        >
          <Calendar className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium mb-0.5 ml-0.5">From</span>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={e => setCustomFrom(e.target.value)}
                className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50"
              />
            </div>
            <span className="text-gray-400 text-sm mt-4">→</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium mb-0.5 ml-0.5">To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={e => setCustomTo(e.target.value)}
                className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
          {customFrom && customTo && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {fmtDate(customFrom)} – {fmtDate(customTo)}
            </span>
          )}
          {(customFrom || customTo) && (
            <button
              onClick={() => { setCustomFrom(''); setCustomTo(''); }}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors ml-auto"
            >Clear</button>
          )}
        </div>
      )}

      {/* ══════════ ROW 1: KPI Cards — Revenue dominant ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* PRIMARY: Revenue */}
        <AnimateIn delay={80}>
          <RevenueCard earnings={totalRevenue} month={periodLabel} growthPct={stats?.revenueGrowthPct ?? null} />
        </AnimateIn>

        {/* Bookings */}
        <AnimateIn delay={160}>
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] group hover:shadow-[0_8px_24px_rgba(5,150,105,0.12)] hover:-translate-y-1 transition-all duration-300 border border-gray-100/80 hover:border-emerald-200 hover-shimmer">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-300">
              <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate max-w-[90px]" title={periodLabel}>{periodLabel}</span>
          </div>
          <AnimatedNumber value={stats?.totalBookings || 0} className="text-2xl font-extrabold text-gray-900" />
          <p className="text-gray-400 text-xs mt-1">Total Bookings</p>
        </div>
        </AnimateIn>

        {/* Services */}
        <AnimateIn delay={240}>
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] group hover:shadow-[0_8px_24px_rgba(5,150,105,0.08)] hover:-translate-y-1 transition-all duration-300 border border-gray-100/80 hover:border-emerald-200 hover-shimmer">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors duration-300">
              <LayoutGrid className="h-5 w-5 text-teal-500" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Active</span>
          </div>
          <AnimatedNumber value={profile?.approvedServicesCount || 0} className="text-2xl font-extrabold text-gray-900" />
          <p className="text-gray-400 text-xs mt-1">Services</p>
        </div>
        </AnimateIn>

        {/* Locations */}
        <AnimateIn delay={320}>
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] group hover:shadow-[0_8px_24px_rgba(5,150,105,0.08)] hover:-translate-y-1 transition-all duration-300 border border-gray-100/80 hover:border-emerald-200 hover-shimmer">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors duration-300">
              <MapPin className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Active</span>
          </div>
          <AnimatedNumber value={profile?.approvedLocationsCount || 0} className="text-2xl font-extrabold text-gray-900" />
          <p className="text-gray-400 text-xs mt-1">Locations</p>
        </div>
        </AnimateIn>
      </div>

      {/* ══════════ Recent Quote Requests (quote-based services only — Car Rental is a direct-booking flow, handled separately) ══════════ */}
      {recentQuoteRequests.length > 0 && (
        <AnimateIn delay={100}>
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl" />
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recent Quote Requests</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Open requests you haven&apos;t quoted on yet</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {recentQuoteRequests.map((r) => {
                  const meta = QUOTE_SERVICE_META[r.service] || { label: r.service, icon: FileText, color: '#94a3b8' };
                  const Icon = meta.icon;
                  const budget = r.budgetMin || r.budgetMax
                    ? `₹${(r.budgetMin ?? 0).toLocaleString('en-IN')}${r.budgetMax ? ` – ₹${r.budgetMax.toLocaleString('en-IN')}` : '+'}`
                    : null;
                  return (
                    <Link
                      key={`${r.service}-${r.id}`}
                      href={r.href}
                      className="flex items-center gap-3.5 py-3.5 -mx-2 px-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${meta.color}18` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">{r.customerName}</p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ backgroundColor: `${meta.color}12`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-gray-400 mt-0.5">
                          <span className="font-mono">{r.requestNumber}</span>
                          {r.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" /> {r.location}
                            </span>
                          )}
                          {r.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(r.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {budget && <p className="text-xs font-semibold text-gray-700">{budget}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(r.createdAt)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </AnimateIn>
      )}

      {/* ══════════ ROW 2: Revenue Chart + Top Performers ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Breakdown — Donut + Bars */}
        <AnimateIn delay={150} className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-shadow duration-300">
          <div className="h-1 bg-emerald-600 rounded-t-2xl" />
          <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">Service-wise revenue distribution</p>
            </div>
            <span className="text-xs font-semibold text-white bg-emerald-600 rounded-full px-3 py-1 shadow-sm">{periodLabel}</span>
          </div>

          {sortedBreakdown.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Donut Chart */}
              <div className="flex-shrink-0 flex flex-col items-center drop-shadow-sm">
                <DonutChart data={sortedBreakdown} total={totalRevenue} allServices={allServices} />
                <p className="text-xs text-gray-400 mt-3">Revenue Share</p>
              </div>

              {/* Bars */}
              <div className="flex-1 space-y-4">
                {sortedBreakdown.map((service, idx) => {
                  const svc = findServiceColor(service.service);
                  const pct = totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={service.service} className="group p-2.5 -mx-2.5 rounded-xl hover:bg-emerald-50/20 transition-colors cursor-default" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white" style={{ backgroundColor: svc?.color || '#94a3b8' }} />
                          <span className="text-sm font-medium text-gray-700">{service.service}</span>
                          <span className="text-[10px] text-gray-400 hidden group-hover:inline">({service.bookings} bookings)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${svc?.color || '#94a3b8'}12`, color: svc?.color || '#64748b' }}>{pct.toFixed(0)}%</span>
                          <span className="text-sm font-bold text-gray-900">₹{service.revenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <AnimatedBar pct={Math.max(pct, 3)} color={svc?.color || '#94a3b8'} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No revenue data yet</p>
            </div>
          )}
          </div>
        </div>
        </AnimateIn>

        {/* Top Performers — Podium Style */}
        <AnimateIn delay={200}>
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-shadow duration-300">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-t-2xl" />
          <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-bold text-gray-900">Top Performers</h3>
          </div>

          {topPerformers.length > 0 ? (
            <div className="space-y-3">
              {topPerformers.map((service, idx) => {
                const svc = findServiceColor(service.service);
                const pct = totalRevenue > 0 ? ((service.revenue / totalRevenue) * 100).toFixed(0) : '0';
                const medals = ['🥇', '🥈', '🥉'];
                const medal = idx < 3 ? medals[idx] : null;
                const isTop = idx === 0;

                return (
                  <div
                    key={service.service}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 ${isTop ? 'border border-gray-200 bg-gray-50/50 shadow-sm' : 'hover:bg-gray-50'}`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 rounded-lg inline-flex items-center justify-center w-6 h-6">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-xl ${svc?.bg || 'bg-gray-400'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-lg">{service.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{service.service}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">{service.bookings} bookings</span>
                        <span className="text-[11px] text-gray-400">·</span>
                        <span className="text-[11px] font-bold" style={{ color: svc?.color || '#059669' }}>₹{service.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Percentage Badge */}
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${svc?.color || '#94a3b8'}15`, color: svc?.color || '#64748b' }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          )}
          </div>
        </div>
        </AnimateIn>
      </div>

      {/* ══════════ ROW 3: Smart Insights + Quick Actions ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Smart Insights */}
        {insights.length > 0 && (
          <AnimateIn delay={100} className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100/80 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Smart Insights</h3>
            </div>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                    insight.type === 'success' ? 'bg-emerald-50/50 border-emerald-100' :
                    insight.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                    'bg-emerald-50/50 border-emerald-100'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    insight.type === 'success' ? 'bg-emerald-100' :
                    insight.type === 'warning' ? 'bg-amber-100' :
                    'bg-emerald-100'
                  }`}>
                    {insight.type === 'success' ? <TrendingUp className="h-3 w-3 text-emerald-600" /> :
                     insight.type === 'warning' ? <TrendingDown className="h-3 w-3 text-amber-600" /> :
                     <Eye className="h-3 w-3 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
          </AnimateIn>
        )}

        {/* Quick Actions */}
        {approvedServices.length > 0 && (
          <AnimateIn delay={200} className={insights.length === 0 ? 'lg:col-span-3' : ''}>
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100/80 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
              </div>
              {approvedServices.length > 4 && (
                <button
                  onClick={() => setShowAllActions(!showAllActions)}
                  className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1 transition-colors bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
                >
                  {showAllActions ? 'Show Less' : `View All (${approvedServices.length})`}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAllActions ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displayActions.map((service) => (
                <Link
                  key={service.slugs[0]}
                  href={service.href}
                  className="group relative flex items-center gap-3.5 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                  style={{
                    backgroundColor: `${service.color}08`,
                    border: `1px solid ${service.color}18`,
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: `${service.color}06` }}
                  />
                  <div className="relative flex items-center gap-3.5 w-full">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
                      style={{ backgroundColor: `${service.color}18` }}
                    >
                      <span className="text-2xl">{service.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{service.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{service.description}</p>
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1"
                      style={{ backgroundColor: service.color }}
                    >
                      <ArrowUpRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </AnimateIn>
        )}
      </div>

      {/* ── BACKR Rewards ── */}
      {/* Temporarily hidden from the vendor dashboard (frontend-only — backend untouched) */}
      {false && (
        <AnimateIn delay={100}>
          <BackrCard type="vendor" />
        </AnimateIn>
      )}

      {/* ── Empty State ── */}
      {stats && stats.totalBookings === 0 && approvedServices.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-emerald-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No completed bookings yet</h3>
          <p className="mt-1.5 text-sm text-gray-400 max-w-sm mx-auto">
            Start accepting bookings to see your earnings and performance metrics.
          </p>
          <Link
            href="/vendor/bike-rentals/requests"
            className="mt-5 inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
          >
            View Requests <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ══════════ SUB-COMPONENTS ══════════

// Revenue Card (Primary KPI — Dominant)
function RevenueCard({ earnings, month, growthPct }: { earnings: number; month: string; growthPct: number | null }) {
  const { count } = useCountUp(earnings);
  // growthPct is null for the "All Time" period (no prior period to compare
  // against) — the badge is omitted rather than showing a fake/stale number.
  const hasGrowth = growthPct !== null && Number.isFinite(growthPct);
  const isPositive = hasGrowth && growthPct >= 0;
  const displayPct = hasGrowth ? Math.round(Math.abs(growthPct)) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-emerald-600 p-5 text-white shadow-[0_2px_12px_rgba(5,150,105,0.2)] hover:shadow-xl hover:shadow-emerald-200/40 transition-all duration-300 hover:-translate-y-1 group">
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-[40px] -translate-y-1/3 translate-x-1/4 group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider truncate max-w-[110px]" title={month}>{month}</span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight drop-shadow-sm">
          ₹{count.toLocaleString('en-IN')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-white/70 text-xs">Revenue</p>
          {hasGrowth && (
            <span
              className="flex items-center gap-0.5 text-white text-[10px] font-semibold bg-white/15 px-1.5 py-0.5 rounded"
              title="vs previous period of equal length"
            >
              {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {isPositive ? '+' : '-'}{displayPct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Animated Number
function AnimatedNumber({ value, className, prefix = '' }: { value: number; className?: string; prefix?: string }) {
  const { count } = useCountUp(value);
  return <p className={className}>{prefix}{count.toLocaleString('en-IN')}</p>;
}

// Animated Progress Bar — fills from 0 on mount
function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setWidth(pct); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}

// Donut Chart (SVG) with smooth spin-in animation
function DonutChart({
  data,
  total,
  allServices
}: {
  data: Stats['serviceBreakdown'];
  total: number;
  allServices: any[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const findColor = (name: string) => {
    const svc = allServices.find((s: any) =>
      s.name === name || s.slugs.some((slug: string) => name.toLowerCase().includes(slug.split('-')[0]))
    );
    return svc?.color || '#94a3b8';
  };

  const hoveredItem = hovered ? data.find(d => d.service === hovered) : null;
  const hoveredPct = hoveredItem && total > 0 ? ((hoveredItem.revenue / total) * 100).toFixed(0) : null;

  const segments = data.map((item) => {
    const pct = total > 0 ? item.revenue / total : 0;
    const rotation = cumulativePercent * 360;
    cumulativePercent += pct;
    return { ...item, pct, rotation };
  });

  return (
    <div className="relative">
      {/* Spin-in on load via CSS animation */}
      <style jsx>{`
        @keyframes donutSpin {
          from { transform: rotate(-90deg); opacity: 0.3; }
          to { transform: rotate(0deg); opacity: 1; }
        }
        .donut-container {
          animation: donutSpin 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          transform-origin: center;
        }
      `}</style>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-container">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
        />
        {segments.map((seg) => {
          const isHovered = hovered === seg.service;
          const segLength = circumference * seg.pct;
          const gapLength = circumference - segLength;

          return (
            <circle
              key={seg.service}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={findColor(seg.service)}
              strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={`${segLength} ${gapLength}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${seg.rotation - 90} ${size / 2} ${size / 2})`}
              className="cursor-pointer transition-all duration-300"
              style={{ opacity: hovered && !isHovered ? 0.4 : 1 }}
              onMouseEnter={() => setHovered(seg.service)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hoveredItem ? (
          <>
            <p className="text-lg font-extrabold text-gray-900">₹{(hoveredItem.revenue / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{hoveredItem.service}</p>
            <p className="text-[10px] text-gray-400">{hoveredPct}%</p>
          </>
        ) : (
          <>
            <p className="text-lg font-extrabold text-gray-900">₹{(total / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total Revenue</p>
          </>
        )}
      </div>
    </div>
  );
}
