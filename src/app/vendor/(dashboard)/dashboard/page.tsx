'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  Calendar,
  ArrowRight,
  Bike,
  Car,
  Bus,
  Truck,
  Package,
  Settings,
  FileText,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CreditCard,
  Star,
  Inbox,
  Rocket,
  Handshake,
  XCircle,
  MessageSquare,
  RotateCcw,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import VendorOnboarding from '@/components/vendor/onboarding/VendorOnboarding';

// Notification type config for dashboard widget
const NOTIF_CONFIG: Record<string, { icon: any; gradient: string; label: string }> = {
  booking: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', label: 'Booking' },
  booking_confirmed: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', label: 'Booking' },
  booking_assigned: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', label: 'Booking' },
  quote_request: { icon: Inbox, gradient: 'from-violet-500 to-purple-600', label: 'Quote' },
  quote_accepted: { icon: Check, gradient: 'from-green-500 to-emerald-600', label: 'Quote' },
  advance_paid: { icon: CreditCard, gradient: 'from-emerald-500 to-green-600', label: 'Payment' },
  review: { icon: Star, gradient: 'from-amber-400 to-orange-500', label: 'Review' },
  payment: { icon: CreditCard, gradient: 'from-green-500 to-emerald-600', label: 'Payment' },
  payout: { icon: CreditCard, gradient: 'from-purple-500 to-violet-600', label: 'Payout' },
  system: { icon: Settings, gradient: 'from-slate-500 to-gray-600', label: 'System' },
  p2p_vehicle_requested: { icon: Truck, gradient: 'from-orange-500 to-amber-600', label: 'P2P Request' },
  p2p_booking_accepted: { icon: Handshake, gradient: 'from-emerald-500 to-green-600', label: 'P2P Accepted' },
  p2p_deal_confirmed: { icon: Handshake, gradient: 'from-emerald-500 to-teal-600', label: 'P2P Deal' },
  p2p_request_accepted: { icon: Check, gradient: 'from-green-500 to-emerald-600', label: 'P2P Accepted' },
  p2p_transaction_created: { icon: ArrowRightLeft, gradient: 'from-blue-500 to-indigo-600', label: 'P2P Transaction' },
  p2p_request_rejected: { icon: XCircle, gradient: 'from-red-500 to-rose-600', label: 'P2P Declined' },
  p2p_request_closed: { icon: XCircle, gradient: 'from-gray-500 to-slate-600', label: 'P2P Closed' },
  p2p_transaction_cancelled: { icon: XCircle, gradient: 'from-red-500 to-rose-600', label: 'P2P Cancelled' },
  p2p_posting_cancelled: { icon: XCircle, gradient: 'from-gray-500 to-slate-600', label: 'P2P Withdrawn' },
  p2p_trip_started: { icon: Rocket, gradient: 'from-blue-500 to-cyan-500', label: 'P2P Trip' },
  p2p_trip_completed: { icon: Check, gradient: 'from-emerald-500 to-green-600', label: 'P2P Complete' },
  p2p_rating_received: { icon: Star, gradient: 'from-amber-400 to-yellow-500', label: 'P2P Rating' },
  p2p_new_comment: { icon: MessageSquare, gradient: 'from-indigo-500 to-violet-600', label: 'P2P Comment' },
  p2p_posting_reactivated: { icon: RotateCcw, gradient: 'from-teal-500 to-cyan-600', label: 'P2P Reactivated' },
  p2p_new_vehicle_posted: { icon: Truck, gradient: 'from-blue-500 to-indigo-600', label: 'New Vehicle' },
  p2p_new_booking_posted: { icon: Inbox, gradient: 'from-violet-500 to-purple-600', label: 'New Booking' },
};

const DEFAULT_NOTIF_CONFIG = { icon: Bell, gradient: 'from-gray-400 to-gray-500', label: 'Notification' };

function getNotifConfig(type: string) {
  return NOTIF_CONFIG[type] || DEFAULT_NOTIF_CONFIG;
}

// Redirect mapping for notification types (fallback)
const NOTIF_REDIRECT: Record<string, string> = {
  p2p_new_vehicle_posted: '/vendor/p2p/vehicles',
  p2p_new_booking_posted: '/vendor/p2p/bookings',
  p2p_vehicle_requested: '/vendor/p2p/my-postings',
  p2p_booking_accepted: '/vendor/p2p/my-postings',
  p2p_deal_confirmed: '/vendor/p2p/activity',
  p2p_request_accepted: '/vendor/p2p/activity',
  p2p_request_rejected: '/vendor/p2p/activity',
  p2p_request_closed: '/vendor/p2p/vehicles',
  p2p_transaction_created: '/vendor/p2p/activity',
  p2p_trip_started: '/vendor/p2p/activity',
  p2p_trip_completed: '/vendor/p2p/activity',
  p2p_transaction_cancelled: '/vendor/p2p/activity',
  p2p_posting_cancelled: '/vendor/p2p/vehicles',
  p2p_posting_reactivated: '/vendor/p2p/my-postings',
  p2p_rating_received: '/vendor/p2p/activity',
  p2p_new_comment: '/vendor/p2p/my-postings',
  booking: '/vendor/bookings',
  booking_confirmed: '/vendor/bookings',
  booking_assigned: '/vendor/bookings',
  quote_request: '/vendor/notifications',
  quote_accepted: '/vendor/bookings',
  advance_paid: '/vendor/earnings',
  review: '/vendor/reviews',
  payment: '/vendor/earnings',
  payout: '/vendor/earnings',
};

// Map serviceType to vendor dashboard route prefix
const SERVICE_ROUTE_MAP: Record<string, string> = {
  bike: 'bike-rentals',
  bus: 'bus',
  truck: 'truck',
  luxury: 'luxury',
  packers: 'packers',
  equipment: 'equipment',
  'self-drive': 'self-drive',
  'car-rental': 'car-rental',
  chauffeur: 'car-rental',
};

function getNotifRedirectUrl(notif: any): string {
  const { type, serviceType, requestId, bookingId, bookingNumber } = notif;
  const routePrefix = serviceType ? SERVICE_ROUTE_MAP[serviceType] : null;

  // Quote request → specific request detail page
  if (type === 'quote_request' && routePrefix && requestId) {
    if (routePrefix === 'luxury') return `/vendor/luxury/send-quote/${requestId}`;
    return `/vendor/${routePrefix}/requests/${requestId}/quote`;
  }

  // Booking/payment related → specific booking detail
  if (routePrefix && (bookingId || bookingNumber)) {
    if (routePrefix === 'car-rental' && bookingNumber) {
      return `/vendor/car-rental/bookings/${bookingNumber}`;
    }
    if (bookingId) {
      return `/vendor/${routePrefix}/bookings/${bookingId}`;
    }
  }

  return NOTIF_REDIRECT[type] || '/vendor/notifications';
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  status: string;
  approvedServicesCount: number;
  approvedLocationsCount: number;
  documentsCount?: number;
  serviceRequestsCount?: number;
  locationRequestsCount?: number;
  approvedServiceSlugs?: string[];
}

interface Stats {
  monthlyEarnings: number;
  totalBookings: number;
  serviceBreakdown: Array<{
    service: string;
    icon: string;
    bookings: number;
    revenue: number;
  }>;
}

export default function VendorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/vendor/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, statsRes, notifRes] = await Promise.all([
          fetch('/api/vendor/profile'),
          fetch('/api/vendor/dashboard/stats'),
          fetch('/api/vendor/notifications'),
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

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const unread = (notifData.notifications || []).filter((n: any) => !n.read);
          setRecentNotifications(unread.slice(0, 5));
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
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if vendor is not approved
  if (profile && profile.status !== 'APPROVED') {
    return (
      <VendorOnboarding
        vendorStatus={profile.status}
        documentsCount={profile.documentsCount || 0}
        locationRequestsCount={profile.locationRequestsCount || 0}
        serviceRequestsCount={profile.serviceRequestsCount || 0}
      />
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  // Service mappings with multiple slug variations
  const allServices = [
    {
      slugs: ['bike-rental', 'bike', 'bike-rentals', 'two-wheeler', 'bike-on-rent', 'bike-rental-activa'],
      name: 'Bike Rentals',
      description: 'Requests & Bookings',
      icon: '🏍️',
      href: '/vendor/bike-rentals/requests',
      color: 'from-blue-100 to-blue-200',
      hoverColor: 'from-blue-500 to-indigo-500',
      textColor: 'blue',
    },
    {
      slugs: ['chauffeur-driven-car-rental', 'chauffeur', 'car-rental', 'car-with-driver'],
      name: 'Car Rentals',
      description: 'With Driver',
      icon: '🚗',
      href: '/vendor/car-rental/bookings',
      color: 'from-purple-100 to-purple-200',
      hoverColor: 'from-purple-500 to-pink-500',
      textColor: 'purple',
    },
    {
      slugs: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive', 'car-rental-self-drive', 'self-driven'],
      name: 'Self-Drive',
      description: 'Without Driver',
      icon: '🔑',
      href: '/vendor/self-drive/requests',
      color: 'from-indigo-100 to-indigo-200',
      hoverColor: 'from-indigo-500 to-blue-500',
      textColor: 'indigo',
    },
    {
      slugs: ['bus-rental', 'bus', 'bus-on-rent', 'coach-rental'],
      name: 'Bus Rentals',
      description: 'Requests & Bookings',
      icon: '🚌',
      href: '/vendor/bus/requests',
      color: 'from-orange-100 to-orange-200',
      hoverColor: 'from-orange-500 to-red-500',
      textColor: 'orange',
    },
    {
      slugs: ['luxury-car-rental', 'luxury', 'premium-car', 'luxury-cars'],
      name: 'Luxury Cars',
      description: 'Premium Service',
      icon: '💎',
      href: '/vendor/luxury/requests',
      color: 'from-pink-100 to-pink-200',
      hoverColor: 'from-pink-500 to-rose-500',
      textColor: 'pink',
    },
    {
      slugs: ['packers-and-movers', 'packers-movers', 'relocation', 'home-shifting'],
      name: 'Packers & Movers',
      description: 'Relocation Service',
      icon: '📦',
      href: '/vendor/packers/requests',
      color: 'from-amber-100 to-amber-200',
      hoverColor: 'from-amber-500 to-yellow-500',
      textColor: 'amber',
    },
    {
      slugs: ['truck-transport', 'truck', 'goods-transport', 'cargo', 'transporter', 'truck-rental'],
      name: 'Truck Transport',
      description: 'Cargo Service',
      icon: '🚚',
      href: '/vendor/truck/requests',
      color: 'from-slate-100 to-slate-200',
      hoverColor: 'from-slate-500 to-gray-500',
      textColor: 'slate',
    },
    {
      slugs: ['equipment-rental', 'equipment', 'construction-equipment', 'machinery'],
      name: 'Equipment Rental',
      description: 'Construction Equipment',
      icon: '⚙️',
      href: '/vendor/equipment/requests',
      color: 'from-teal-100 to-teal-200',
      hoverColor: 'from-teal-500 to-cyan-500',
      textColor: 'teal',
    },
  ];

  // Debug: Log approved service slugs
  console.log('Approved Service Slugs:', profile?.approvedServiceSlugs);
  console.log('All Services Slugs:', allServices.map(s => s.slugs));

  // Filter services based on approved services (check against all slug variations)
  const approvedServices = profile?.approvedServiceSlugs
    ? allServices.filter((service) => {
        // Check if any of this service's slug variations match any approved slug
        return service.slugs.some((serviceSlug) =>
          profile.approvedServiceSlugs!.some((approvedSlug) =>
            approvedSlug === serviceSlug ||
            approvedSlug.includes(serviceSlug) ||
            serviceSlug.includes(approvedSlug)
          )
        );
      })
    : [];

  console.log('Filtered Approved Services:', approvedServices.map(s => s.name));

  return (
    <div className="space-y-6">
      {/* Welcome Header - Don't Change */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full animate-pulse"></div>
          <div className="absolute top-20 -left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-700"></div>
          <div className="absolute -bottom-5 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-blue-100 text-sm font-medium mb-1 animate-fade-in">{greeting}</p>
            <h1 className="text-3xl font-bold mb-2 animate-slide-up">
              {profile?.businessName || 'Welcome'}
            </h1>
            <p className="text-blue-100 text-sm animate-fade-in delay-200">
              {profile?.ownerName}
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 hover:bg-white/20 transition-all duration-300 animate-fade-in delay-300">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {profile?.approvedServicesCount || 0} Services
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 hover:bg-white/20 transition-all duration-300 animate-fade-in delay-500">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {profile?.approvedLocationsCount || 0} Locations
                </span>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }

          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }

          .delay-300 {
            animation-delay: 0.3s;
          }

          .delay-500 {
            animation-delay: 0.5s;
          }

          .delay-700 {
            animation-delay: 0.7s;
          }

          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>

      {/* Monthly Earnings Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-green-700 text-sm font-semibold uppercase tracking-wider mb-1">
              Monthly Earnings
            </p>
            <p className="text-green-600 text-xs">{currentMonth}</p>
          </div>
          <div className="bg-green-100 rounded-xl p-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-5xl font-bold text-gray-900">
            ₹{stats?.monthlyEarnings?.toLocaleString('en-IN') || '0'}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>From {stats?.totalBookings || 0} completed bookings</span>
          </div>
        </div>
      </div>

      {/* Recent Notifications — Premium Widget */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 shadow-lg">
        {/* Dark gradient header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-6 py-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Notifications</h2>
                <p className="text-blue-200 text-xs">
                  {recentNotifications.length > 0
                    ? `${recentNotifications.length} unread`
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            <Link
              href="/vendor/notifications"
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Notification items */}
        <div className="bg-white">
          {recentNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-6">
                <BellOff className="w-8 h-8 text-gray-400 -rotate-6" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No unread notifications</p>
              <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/80">
              {recentNotifications.map((notif: any) => {
                const config = getNotifConfig(notif.type);
                const NIcon = config.icon;
                return (
                  <Link
                    key={notif.id}
                    href={getNotifRedirectUrl(notif)}
                    className="group flex items-start gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 relative"
                  >
                    {/* Unread indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r" />

                    {/* Gradient icon badge */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10`}>
                      <NIcon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4 className="font-semibold text-gray-900 text-sm leading-snug flex items-center gap-2">
                          {notif.title}
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                        </h4>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap font-medium flex-shrink-0 mt-0.5">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate mb-1.5">{notif.body || notif.message}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${config.gradient} text-white`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-transparent border-t border-gray-100/80">
              <Link
                href="/vendor/notifications"
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition group"
              >
                <Sparkles className="w-4 h-4" />
                View all notifications
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {approvedServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500">Navigate to services</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {approvedServices.map((service) => (
              <Link
                key={service.slugs[0]}
                href={service.href}
                className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 bg-gradient-to-br ${service.color} group-hover:${service.hoverColor} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                    <span className="text-3xl group-hover:scale-110 transition-transform">{service.icon}</span>
                  </div>
                  <div>
                    <p className={`font-semibold text-gray-900 group-hover:text-${service.textColor}-600 transition-colors`}>
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Service Performance */}
      {stats?.serviceBreakdown && stats.serviceBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Service Performance</h2>
            <p className="text-sm text-gray-500 mt-1">Revenue breakdown by service</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {stats.serviceBreakdown.map((service) => (
                <div key={service.service} className="group hover:bg-gray-50 p-4 rounded-xl transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">{service.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{service.service}</p>
                        <p className="text-sm text-gray-500">{service.bookings} completed bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{service.revenue.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.monthlyEarnings > 0
                          ? `${((service.revenue / stats.monthlyEarnings) * 100).toFixed(1)}%`
                          : '0%'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${stats.monthlyEarnings > 0 ? (service.revenue / stats.monthlyEarnings) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {stats && stats.totalBookings === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No completed bookings yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start accepting bookings to see your monthly earnings and performance metrics here.
          </p>
          <Link
            href="/vendor/bike-rentals/requests"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <span>View Requests</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
