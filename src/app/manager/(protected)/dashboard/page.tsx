'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, Briefcase, MapPin, TrendingUp, Clock, CheckCircle, AlertCircle, Users, Loader2, RefreshCw } from 'lucide-react';

interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  assignedLocations: { id: string; name: string; slug: string; type?: string }[];
  assignedServices: { id: string; name: string; slug: string }[];
}

interface DashboardStats {
  totalBookings: number;
  pendingPayment: number;
  pendingApproval: number;
  activeTrips: number;
  completedToday: number;
  totalVendors: number;
  activeVendors: number;
}

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/manager/dashboard');
      const data = await response.json();

      if (data.success) {
        setManagerInfo(data.manager);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Failed to fetch manager info:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {managerInfo?.name || session?.user?.name}!</h1>
            <p className="text-green-100">Manager Dashboard - TransRentals CMS</p>
          </div>
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/manager/inquiries" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingPayment || 0}</p>
              <p className="text-sm text-gray-500">Pending Inquiries</p>
            </div>
          </div>
        </Link>

        <Link href="/manager/bookings" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeTrips || 0}</p>
              <p className="text-sm text-gray-500">Active Trips</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
          </div>
        </div>

        <Link href="/manager/locations" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{managerInfo?.assignedLocations?.length || 0}</p>
              <p className="text-sm text-gray-500">Assigned Locations</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/manager/inquiries" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Inquiries</span>
          </Link>
          <Link href="/manager/bookings" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Bookings</span>
          </Link>
          <Link href="/manager/locations" className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Locations</span>
          </Link>
          <div className="p-4 border rounded-lg bg-gray-50 text-center cursor-not-allowed">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-400">Reports (Coming Soon)</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Activity will appear here as you manage bookings</p>
        </div>
      </div>
    </div>
  );
}
