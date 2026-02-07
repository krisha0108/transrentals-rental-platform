'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  MapPin,
  DollarSign,
  BarChart3,
  Eye,
  Layers,
  Car,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  TrendingUp,
  TrendingDown,
  Users,
  CalendarCheck,
  Calendar,
  Globe,
  Star,
  Activity,
  Clock,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from 'lucide-react';
import { FLOW_TYPE_CONFIG } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface RecentBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  requestedVehicleName?: string;
  locationName?: string;
  pickupDate: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface TopVendor {
  id: string;
  name: string;
  rating: number;
}

interface ServiceStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeLocations: number;
  totalLocations: number;
  totalVehicles: number;
  activeVehicles: number;
  totalVendors: number;
  activeVendors: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  pageViews: number;
  averageRating: number;
  subServicesCount: number;
  recentBookings: RecentBooking[];
  topVendors: TopVendor[];
  thisMonthBookings: number;
  thisWeekBookings: number;
  todayBookings: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  flowType?: string;
}

export default function ServiceDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subServices, setSubServices] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [bookingsDateFilter, setBookingsDateFilter] = useState('ALL');

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          dateFilter: bookingsDateFilter,
        });
        const res = await fetch(`/api/admin/services/${slug}/stats?${params}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStats();
    }
  }, [slug, bookingsDateFilter]);

  // Fetch sub-services
  useEffect(() => {
    const fetchSubServices = async () => {
      try {
        const res = await fetch(`/api/admin/services/${slug}/sub-services`);
        if (res.ok) {
          const data = await res.json();
          setSubServices(data.subServices || []);
        }
      } catch (err) {
        console.error('Failed to fetch sub-services:', err);
      }
    };

    if (slug) {
      fetchSubServices();
    }
  }, [slug]);

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  const flowConfig = FLOW_TYPE_CONFIG[(service.flowType || 'BROWSE_FIRST') as keyof typeof FLOW_TYPE_CONFIG];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ServiceIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${flowConfig.color}`}>
                  {flowConfig.label}
                </span>
              </div>
              <p className="text-gray-600">{service.description || ''}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${service.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Live
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          <Link href={`/admin/services/${slug}/settings`}>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <>
          {/* Date Filter for Stats */}
          <div className="bg-white rounded-xl p-4 border shadow-sm mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter Stats:</span>
              <select
                value={bookingsDateFilter}
                onChange={(e) => setBookingsDateFilter(e.target.value)}
                className="text-sm px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="THIS_YEAR">This Year</option>
              </select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
              <p className="text-xs text-gray-400">{stats?.pendingBookings || 0} pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Locations</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats?.activeLocations || 0}</p>
              <p className="text-xs text-gray-400">of {stats?.totalLocations || 0} cities</p>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Vehicles</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats?.totalVehicles || 0}</p>
              <p className="text-xs text-gray-400">{stats?.activeVehicles || 0} active</p>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500">Vendors</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats?.totalVendors || 0}</p>
              <p className="text-xs text-gray-400">{stats?.activeVendors || 0} active</p>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-gray-500">Categories</span>
              </div>
              <p className="text-2xl font-bold text-cyan-600">{stats?.subServicesCount || subServices.length}</p>
              <p className="text-xs text-gray-400">sub-services</p>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500">Rating</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.averageRating || 4.5}</p>
              <p className="text-xs text-gray-400">average</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={`/admin/services/${slug}/fleet`}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                  <Car className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fleet Management</h3>
                  <p className="text-sm text-gray-500">{stats?.totalVehicles || 0} vehicles</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/sub-services`}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                  <Layers className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sub-Services</h3>
                  <p className="text-sm text-gray-500">{subServices.length} categories</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/locations`}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Locations</h3>
                  <p className="text-sm text-gray-500">{stats?.activeLocations || 0} cities active</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/pricing`}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pricing</h3>
                  <p className="text-sm text-gray-500">Base rates & rules</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={`/admin/services/${slug}/location-inventory`}
              className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Location Inventory</span>
                </div>
                <span className="text-sm text-gray-500">View details</span>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/bookings`}
              className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Bookings</span>
                </div>
                <span className="text-sm text-gray-500">{stats?.totalBookings || 0} total</span>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/seo`}
              className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-gray-900">SEO Settings</span>
                </div>
                <span className="text-sm text-gray-500">Optimize</span>
              </div>
            </Link>

            <Link
              href={`/admin/services/${slug}/settings`}
              className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Settings</span>
                </div>
                <span className="text-sm text-gray-500">Configure</span>
              </div>
            </Link>
          </div>

          {/* Service Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Slug</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{service.slug}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Flow Type</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${flowConfig.color}`}>
                    {flowConfig.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Base URL</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">/{service.slug}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Sub-Services</span>
                  <span className="font-medium">{subServices.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sub-Services</h3>
              <div className="space-y-2">
                {subServices.slice(0, 6).map((sub) => (
                  <div key={sub.slug} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ServiceIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{sub.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{sub.slug}</span>
                  </div>
                ))}
                {subServices.length > 6 && (
                  <Link
                    href={`/admin/services/${slug}/sub-services`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 py-2"
                  >
                    View all {subServices.length} sub-services
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Top Vendors & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vendors */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Top Vendors
                </h3>
                <Link
                  href="/admin/vendors"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {stats?.topVendors && stats.topVendors.length > 0 ? (
                <div className="space-y-3">
                  {stats.topVendors.map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-500">{vendor.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/admin/vendors/${vendor.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No vendors registered yet</p>
                  <p className="text-xs text-gray-400 mt-1">Vendors will appear here once they register</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Vendors</span>
                  <span className="font-semibold text-gray-900">{stats?.totalVendors || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Active Vendors</span>
                  <span className="font-semibold text-green-600">{stats?.activeVendors || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-500" />
                  Recent Bookings
                </h3>
                <Link
                  href={`/admin/services/${slug}/bookings`}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-medium text-blue-600">
                          #{booking.bookingNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'CANCELLED' || booking.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                          booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {booking.requestedVehicleName && (
                            <>
                              <Car className="w-3 h-3" />
                              {booking.requestedVehicleName}
                            </>
                          )}
                          {booking.locationName && (
                            <>
                              <MapPin className="w-3 h-3 ml-2" />
                              {booking.locationName}
                            </>
                          )}
                        </span>
                        <span className="font-medium text-gray-700">
                          ₹{(booking.grandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No bookings yet</p>
                  <p className="text-xs text-gray-400 mt-1">Bookings will appear here as they come in</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats?.todayBookings || 0}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats?.thisWeekBookings || 0}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats?.thisMonthBookings || 0}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Revenue Overview
              </h3>
              <div className="flex items-center gap-2">
                {(stats?.revenueGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm">{stats?.revenueGrowth || 0}% vs last month</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-green-100">This Month</p>
                <p className="text-2xl font-bold">₹{(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-green-100">Last Month</p>
                <p className="text-2xl font-bold">₹{(stats?.lastMonthRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-green-100">Pending Bookings</p>
                <p className="text-2xl font-bold">{stats?.pendingBookings || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-green-100">Completed</p>
                <p className="text-2xl font-bold">{stats?.completedBookings || 0}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
