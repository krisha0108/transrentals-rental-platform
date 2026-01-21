'use client';

import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  Trophy,
  Users,
  Car,
  IndianRupee,
  Calendar,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  Star,
  Award,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Monthly targets
const monthlyTargets = {
  revenue: { target: 800000, achieved: 520000, unit: '₹' },
  bookings: { target: 100, achieved: 72, unit: '' },
  newCustomers: { target: 30, achieved: 18, unit: '' },
  rating: { target: 4.5, achieved: 4.6, unit: '⭐' },
};

// Driver performance targets
const driverTargets = [
  {
    id: 1,
    name: 'Ramesh Singh',
    photo: '/avatars/driver1.jpg',
    trips: { target: 25, achieved: 22 },
    revenue: { target: 150000, achieved: 128000 },
    rating: { target: 4.5, achieved: 4.7 },
    onTime: { target: 95, achieved: 92 },
    commission: 12800,
    rank: 1,
  },
  {
    id: 2,
    name: 'Suresh Patil',
    photo: '/avatars/driver2.jpg',
    trips: { target: 25, achieved: 20 },
    revenue: { target: 150000, achieved: 115000 },
    rating: { target: 4.5, achieved: 4.5 },
    onTime: { target: 95, achieved: 88 },
    commission: 11500,
    rank: 2,
  },
  {
    id: 3,
    name: 'Mohan Kumar',
    photo: '/avatars/driver3.jpg',
    trips: { target: 20, achieved: 18 },
    revenue: { target: 120000, achieved: 98000 },
    rating: { target: 4.5, achieved: 4.8 },
    onTime: { target: 95, achieved: 96 },
    commission: 9800,
    rank: 3,
  },
  {
    id: 4,
    name: 'Vijay Sharma',
    photo: '/avatars/driver4.jpg',
    trips: { target: 15, achieved: 12 },
    revenue: { target: 100000, achieved: 72000 },
    rating: { target: 4.5, achieved: 4.3 },
    onTime: { target: 95, achieved: 85 },
    commission: 7200,
    rank: 4,
  },
];

// Vehicle targets
const vehicleTargets = [
  { id: 'MH04AB1234', name: 'Innova Crysta', utilization: { target: 85, achieved: 92 }, revenue: { target: 180000, achieved: 165000 } },
  { id: 'MH04CD5678', name: 'Swift Dzire', utilization: { target: 80, achieved: 78 }, revenue: { target: 120000, achieved: 98000 } },
  { id: 'MH04EF9012', name: '45 Seater Bus', utilization: { target: 70, achieved: 85 }, revenue: { target: 250000, achieved: 280000 } },
  { id: 'MH04GH3456', name: 'Ertiga', utilization: { target: 80, achieved: 72 }, revenue: { target: 100000, achieved: 78000 } },
];

// Commission structure
const commissionRules = [
  { tier: 'Bronze', minRevenue: 0, maxRevenue: 100000, percentage: 8 },
  { tier: 'Silver', minRevenue: 100000, maxRevenue: 150000, percentage: 10 },
  { tier: 'Gold', minRevenue: 150000, maxRevenue: 200000, percentage: 12 },
  { tier: 'Platinum', minRevenue: 200000, maxRevenue: null, percentage: 15 },
];

export default function GoalsPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const getProgress = (achieved: number, target: number) => Math.min(100, Math.round((achieved / target) * 100));
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTierForRevenue = (revenue: number) => {
    return commissionRules.find(r => revenue >= r.minRevenue && (r.maxRevenue === null || revenue < r.maxRevenue));
  };

  const daysInMonth = 31;
  const daysPassed = 18;
  const projectedRevenue = Math.round((monthlyTargets.revenue.achieved / daysPassed) * daysInMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals & Targets</h1>
          <p className="text-gray-600">Track performance and commissions</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Set Target
          </button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold opacity-90">January 2024 Progress</h2>
            <p className="text-3xl font-bold mt-1">₹{(monthlyTargets.revenue.achieved / 100000).toFixed(1)}L / ₹{(monthlyTargets.revenue.target / 100000).toFixed(1)}L</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">{daysPassed} of {daysInMonth} days</p>
            <p className="text-lg font-semibold">
              {projectedRevenue >= monthlyTargets.revenue.target ? (
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  On Track
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4" />
                  Behind
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${getProgress(monthlyTargets.revenue.achieved, monthlyTargets.revenue.target)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm opacity-75">
          <span>{getProgress(monthlyTargets.revenue.achieved, monthlyTargets.revenue.target)}% achieved</span>
          <span>Projected: ₹{(projectedRevenue / 100000).toFixed(1)}L</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Revenue Target</span>
            <IndianRupee className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(monthlyTargets.revenue.achieved / 1000).toFixed(0)}K</p>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(getProgress(monthlyTargets.revenue.achieved, monthlyTargets.revenue.target))}`}
                style={{ width: `${getProgress(monthlyTargets.revenue.achieved, monthlyTargets.revenue.target)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{getProgress(monthlyTargets.revenue.achieved, monthlyTargets.revenue.target)}% of ₹{(monthlyTargets.revenue.target / 1000).toFixed(0)}K</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Bookings Target</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{monthlyTargets.bookings.achieved}</p>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(getProgress(monthlyTargets.bookings.achieved, monthlyTargets.bookings.target))}`}
                style={{ width: `${getProgress(monthlyTargets.bookings.achieved, monthlyTargets.bookings.target)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{getProgress(monthlyTargets.bookings.achieved, monthlyTargets.bookings.target)}% of {monthlyTargets.bookings.target}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">New Customers</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{monthlyTargets.newCustomers.achieved}</p>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(getProgress(monthlyTargets.newCustomers.achieved, monthlyTargets.newCustomers.target))}`}
                style={{ width: `${getProgress(monthlyTargets.newCustomers.achieved, monthlyTargets.newCustomers.target)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{getProgress(monthlyTargets.newCustomers.achieved, monthlyTargets.newCustomers.target)}% of {monthlyTargets.newCustomers.target}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Avg Rating</span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{monthlyTargets.rating.achieved} ⭐</p>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-500"
                style={{ width: `${(monthlyTargets.rating.achieved / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{monthlyTargets.rating.achieved >= monthlyTargets.rating.target ? '✓ Target met' : `Target: ${monthlyTargets.rating.target}`}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'drivers', label: 'Driver Performance', icon: Users },
          { id: 'vehicles', label: 'Vehicle Targets', icon: Car },
          { id: 'commissions', label: 'Commissions', icon: IndianRupee },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drivers Tab */}
      {selectedTab === 'drivers' && (
        <div className="space-y-4">
          {/* Leaderboard */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Driver Leaderboard
            </h2>
            <div className="space-y-4">
              {driverTargets.sort((a, b) => b.revenue.achieved - a.revenue.achieved).map((driver, idx) => {
                const tier = getTierForRevenue(driver.revenue.achieved);
                return (
                  <div key={driver.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' :
                      idx === 1 ? 'bg-gray-400' :
                      idx === 2 ? 'bg-orange-400' :
                      'bg-gray-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{driver.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tier?.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                          tier?.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          tier?.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {tier?.tier}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        <span>{driver.trips.achieved}/{driver.trips.target} trips</span>
                        <span>⭐ {driver.rating.achieved}</span>
                        <span>{driver.onTime.achieved}% on-time</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{(driver.revenue.achieved / 1000).toFixed(0)}K</p>
                      <p className="text-sm text-green-600">+₹{(driver.commission / 1000).toFixed(1)}K commission</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleTargets.map(vehicle => (
            <div key={vehicle.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                  <p className="text-sm text-gray-500">{vehicle.id}</p>
                </div>
                {vehicle.utilization.achieved >= vehicle.utilization.target ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Target Met</span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">In Progress</span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-medium">{vehicle.utilization.achieved}% / {vehicle.utilization.target}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(getProgress(vehicle.utilization.achieved, vehicle.utilization.target))}`}
                      style={{ width: `${vehicle.utilization.achieved}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-medium">₹{(vehicle.revenue.achieved / 1000).toFixed(0)}K / ₹{(vehicle.revenue.target / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(getProgress(vehicle.revenue.achieved, vehicle.revenue.target))}`}
                      style={{ width: `${getProgress(vehicle.revenue.achieved, vehicle.revenue.target)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commissions Tab */}
      {selectedTab === 'commissions' && (
        <div className="space-y-6">
          {/* Commission Structure */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Commission Structure
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {commissionRules.map(rule => (
                <div key={rule.tier} className={`p-4 rounded-lg border-2 text-center ${
                  rule.tier === 'Platinum' ? 'border-purple-300 bg-purple-50' :
                  rule.tier === 'Gold' ? 'border-yellow-300 bg-yellow-50' :
                  rule.tier === 'Silver' ? 'border-gray-300 bg-gray-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <p className="font-bold text-lg">{rule.tier}</p>
                  <p className="text-3xl font-bold mt-2">{rule.percentage}%</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {rule.maxRevenue
                      ? `₹${(rule.minRevenue / 1000).toFixed(0)}K - ₹${(rule.maxRevenue / 1000).toFixed(0)}K`
                      : `₹${(rule.minRevenue / 1000).toFixed(0)}K+`
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Commissions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Driver Commissions - January 2024</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Driver</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Revenue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Commission</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {driverTargets.map(driver => {
                  const tier = getTierForRevenue(driver.revenue.achieved);
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{driver.name}</td>
                      <td className="px-4 py-3 text-gray-700">₹{driver.revenue.achieved.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tier?.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                          tier?.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          tier?.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {tier?.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{tier?.percentage}%</td>
                      <td className="px-4 py-3 font-bold text-green-600">₹{driver.commission.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    ₹{driverTargets.reduce((sum, d) => sum + d.revenue.achieved, 0).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    ₹{driverTargets.reduce((sum, d) => sum + d.commission, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Performers
            </h2>
            <div className="space-y-3">
              {driverTargets.slice(0, 3).map((driver, idx) => (
                <div key={driver.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{driver.name}</p>
                    <p className="text-sm text-gray-500">{driver.trips.achieved} trips • ⭐ {driver.rating.achieved}</p>
                  </div>
                  <p className="font-bold text-gray-900">₹{(driver.revenue.achieved / 1000).toFixed(0)}K</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Revenue/Booking</span>
                <span className="font-bold text-gray-900">₹{Math.round(monthlyTargets.revenue.achieved / monthlyTargets.bookings.achieved).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fleet Utilization</span>
                <span className="font-bold text-gray-900">{Math.round(vehicleTargets.reduce((sum, v) => sum + v.utilization.achieved, 0) / vehicleTargets.length)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Commissions</span>
                <span className="font-bold text-green-600">₹{driverTargets.reduce((sum, d) => sum + d.commission, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Remaining</span>
                <span className="font-bold text-gray-900">{daysInMonth - daysPassed} days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
