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
  FileText
} from 'lucide-react';

interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  status: string;
  approvedServicesCount: number;
  approvedLocationsCount: number;
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/vendor/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/vendor/profile'),
          fetch('/api/vendor/dashboard/stats'),
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

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

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

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500">Navigate to services</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/vendor/bike-rentals/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-500 group-hover:to-indigo-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">🏍️</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Bike Rentals
                </p>
                <p className="text-xs text-gray-500 mt-1">Requests & Bookings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/car-rental/bookings"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-500 group-hover:to-pink-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">🚗</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Car Rentals
                </p>
                <p className="text-xs text-gray-500 mt-1">With Driver</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/self-drive/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 group-hover:from-indigo-500 group-hover:to-blue-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">🔑</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Self-Drive
                </p>
                <p className="text-xs text-gray-500 mt-1">Without Driver</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/bus/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 group-hover:from-orange-500 group-hover:to-red-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">🚌</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Bus Rentals
                </p>
                <p className="text-xs text-gray-500 mt-1">Requests & Bookings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/luxury/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 group-hover:from-pink-500 group-hover:to-rose-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">💎</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                  Luxury Cars
                </p>
                <p className="text-xs text-gray-500 mt-1">Premium Service</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/packers/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-500 group-hover:to-yellow-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">📦</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Packers & Movers
                </p>
                <p className="text-xs text-gray-500 mt-1">Relocation Service</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/truck/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-slate-500 group-hover:to-gray-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">🚚</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-slate-600 transition-colors">
                  Truck Transport
                </p>
                <p className="text-xs text-gray-500 mt-1">Cargo Service</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vendor/equipment/requests"
            className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 group-hover:from-teal-500 group-hover:to-cyan-500 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-3xl group-hover:scale-110 transition-transform">⚙️</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                  Equipment Rental
                </p>
                <p className="text-xs text-gray-500 mt-1">Construction Equipment</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

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
