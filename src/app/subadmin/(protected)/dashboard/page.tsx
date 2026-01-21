'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Briefcase, MapPin, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const STATS = [
  { label: 'Total Inquiries', value: '0', icon: FileText, color: 'bg-blue-500' },
  { label: 'Pending Inquiries', value: '0', icon: Clock, color: 'bg-yellow-500' },
  { label: 'Completed Bookings', value: '0', icon: CheckCircle, color: 'bg-green-500' },
  { label: 'Active Locations', value: '0', icon: MapPin, color: 'bg-purple-500' },
];

export default function SubAdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {session?.user?.name}!</h1>
        <p className="text-orange-100">SubAdmin Dashboard - TransRentals CMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <FileText className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Inquiries</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Bookings</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <MapPin className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Locations</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  );
}
