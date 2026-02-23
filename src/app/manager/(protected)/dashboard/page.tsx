'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, Briefcase, MapPin, TrendingUp, Clock, CheckCircle, AlertCircle, Users, Loader2, RefreshCw, MessageSquare } from 'lucide-react';

interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  assignedLocations: { id: string; name: string; slug: string; type?: string }[];
  assignedServices: { id: string; name: string; slug: string }[];
}

interface DashboardStats {
  totalBookings: number;
  totalQuotes: number;
  totalServices: number;
  totalLocations: number;
  totalVendors: number;
  activeVendors: number;
  bookingsByService: { [key: string]: number };
  quotesByService: { [key: string]: number };
}

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchDashboardData = async (currentFilter?: string) => {
    try {
      setError(null);
      const filterParam = currentFilter || filter;
      const [dashboardRes, statsRes] = await Promise.all([
        fetch('/api/manager/dashboard'),
        fetch(`/api/manager/dashboard/stats?filter=${filterParam}`),
      ]);

      const dashboardData = await dashboardRes.json();
      const statsData = await statsRes.json();

      if (dashboardData.success) {
        setManagerInfo(dashboardData.manager);
      } else {
        setError(dashboardData.error || 'Failed to fetch dashboard data');
      }

      if (!statsData.error) {
        setStats(statsData);
      }
    } catch (err: any) {
      console.error('Failed to fetch manager info:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setIsRefreshing(true);
    fetchDashboardData(newFilter);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {managerInfo?.name || session?.user?.name}!</h1>
            <p className="text-green-100">Manager Dashboard - TransRentals CMS</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="all" className="text-gray-900">All Time</option>
              <option value="today" className="text-gray-900">Today</option>
              <option value="yesterday" className="text-gray-900">Yesterday</option>
              <option value="thisMonth" className="text-gray-900">This Month</option>
              <option value="lastMonth" className="text-gray-900">Last Month</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/manager/bookings" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
          </div>
        </Link>

        <Link href="/manager/inquiries" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalQuotes?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">Quote Requests</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalServices || 0}</p>
              <p className="text-sm text-gray-500">Your Services</p>
            </div>
          </div>
        </div>

        <Link href="/manager/locations" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalLocations || 0}</p>
              <p className="text-sm text-gray-500">Your Locations</p>
            </div>
          </div>
        </Link>

      
      </div>

      {/* Assigned Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Locations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            My Assigned Locations
          </h2>
          {managerInfo?.assignedLocations && managerInfo.assignedLocations.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {managerInfo.assignedLocations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{loc.name}</span>
                  {loc.type && <span className="text-xs text-gray-400 ml-auto">{loc.type}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No locations assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin for location assignment</p>
            </div>
          )}
        </div>

        {/* Assigned Services */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            My Assigned Services
          </h2>
          {managerInfo?.assignedServices && managerInfo.assignedServices.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {managerInfo.assignedServices.map((svc) => (
                <div key={svc.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{svc.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No services assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin for service assignment</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Performance - Bookings */}
      {stats?.bookingsByService && Object.values(stats.bookingsByService).some(v => v > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Bookings by Service
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.bookingsByService)
              .filter(([_, count]) => count > 0)
              .map(([service, count]) => (
                <div key={service} className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{count.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">{service}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Service Performance - Quotes */}
      {stats?.quotesByService && Object.values(stats.quotesByService).some(v => v > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            Quote Requests by Service
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.quotesByService)
              .filter(([_, count]) => count > 0)
              .map(([service, count]) => (
                <div key={service} className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">{count.toLocaleString()}</p>
                  <p className="text-sm text-yellow-600">{service}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Vendors Stats */}
      {stats && (stats.totalVendors > 0 || stats.activeVendors > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Vendors in My Locations
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-700">{stats.totalVendors}</p>
              <p className="text-sm text-indigo-600">Total Vendors</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{stats.activeVendors}</p>
              <p className="text-sm text-green-600">Active Vendors</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/manager/inquiries" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <FileText className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Inquiries</span>
          </Link>
          <Link href="/manager/bookings" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Bookings</span>
          </Link>
          <Link href="/manager/vendors" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Vendors</span>
          </Link>
          <Link href="/manager/chats" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Chats</span>
          </Link>
          <Link href="/manager/locations" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Locations</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
