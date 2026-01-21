'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Download,
  Filter,
  Car,
  Users,
  FileText,
  Wallet,
  Target,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Fuel,
  MapPin,
} from 'lucide-react';

// Monthly data for charts
const monthlyData = [
  { month: 'Aug', revenue: 320000, expenses: 180000, bookings: 45, profit: 140000 },
  { month: 'Sep', revenue: 380000, expenses: 195000, bookings: 52, profit: 185000 },
  { month: 'Oct', revenue: 420000, expenses: 210000, bookings: 58, profit: 210000 },
  { month: 'Nov', revenue: 395000, expenses: 205000, bookings: 54, profit: 190000 },
  { month: 'Dec', revenue: 480000, expenses: 240000, bookings: 68, profit: 240000 },
  { month: 'Jan', revenue: 520000, expenses: 260000, bookings: 72, profit: 260000 },
];

// Service breakdown
const serviceRevenue = [
  { service: 'Bus & Tempo', revenue: 180000, bookings: 25, color: 'blue' },
  { service: 'Corporate Cars', revenue: 120000, bookings: 15, color: 'green' },
  { service: 'Truck & Logistics', revenue: 95000, bookings: 12, color: 'orange' },
  { service: 'Equipment Rental', revenue: 65000, bookings: 8, color: 'purple' },
  { service: 'Self-Drive', revenue: 40000, bookings: 10, color: 'pink' },
  { service: 'Packers & Movers', revenue: 20000, bookings: 2, color: 'cyan' },
];

// Top performing vehicles
const topVehicles = [
  { id: 'MH04AB1234', type: 'Innova Crysta', trips: 28, revenue: 85000, utilization: 92 },
  { id: 'MH04CD5678', type: '45 Seater Bus', trips: 12, revenue: 180000, utilization: 85 },
  { id: 'MH04EF9012', type: 'Swift Dzire', trips: 35, revenue: 52000, utilization: 88 },
  { id: 'MH04GH3456', type: 'Ertiga', trips: 22, revenue: 48000, utilization: 78 },
  { id: 'MH04IJ7890', type: 'Tempo Traveller', trips: 18, revenue: 72000, utilization: 82 },
];

// Top customers
const topCustomers = [
  { name: 'Tech Solutions Pvt Ltd', bookings: 15, revenue: 180000, type: 'Corporate' },
  { name: 'ABC Events', bookings: 8, revenue: 120000, type: 'Events' },
  { name: 'Priya Sharma', bookings: 12, revenue: 65000, type: 'Individual' },
  { name: 'Global Logistics', bookings: 6, revenue: 95000, type: 'Corporate' },
  { name: 'Wedding Planners Inc', bookings: 4, revenue: 55000, type: 'Events' },
];

// Route analytics
const topRoutes = [
  { route: 'Mumbai → Pune', trips: 45, revenue: 135000 },
  { route: 'Mumbai → Nashik', trips: 28, revenue: 84000 },
  { route: 'Mumbai → Shirdi', trips: 22, revenue: 77000 },
  { route: 'Mumbai → Lonavala', trips: 35, revenue: 52500 },
  { route: 'Mumbai → Mahabaleshwar', trips: 18, revenue: 63000 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('thisMonth');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Calculate totals
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const revenueGrowth = Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100);
  const bookingsGrowth = Math.round(((currentMonth.bookings - previousMonth.bookings) / previousMonth.bookings) * 100);
  const profitGrowth = Math.round(((currentMonth.profit - previousMonth.profit) / previousMonth.profit) * 100);

  const totalRevenue = serviceRevenue.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue', icon: IndianRupee },
          { id: 'fleet', label: 'Fleet', icon: Car },
          { id: 'customers', label: 'Customers', icon: Users },
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className={`flex items-center gap-1 text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(revenueGrowth)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(currentMonth.revenue / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">vs ₹{(previousMonth.revenue / 100000).toFixed(1)}L last month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Bookings</span>
            <span className={`flex items-center gap-1 text-xs ${bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {bookingsGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(bookingsGrowth)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{currentMonth.bookings}</p>
          <p className="text-xs text-gray-500 mt-1">vs {previousMonth.bookings} last month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Net Profit</span>
            <span className={`flex items-center gap-1 text-xs ${profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(profitGrowth)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{(currentMonth.profit / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">{Math.round((currentMonth.profit / currentMonth.revenue) * 100)}% margin</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Expenses</span>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-red-600">₹{(currentMonth.expenses / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">{Math.round((currentMonth.expenses / currentMonth.revenue) * 100)}% of revenue</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Trend
          </h2>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Profit</span>
            </div>
          </div>
        </div>
        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between gap-4 h-48">
          {monthlyData.map((data, idx) => {
            const maxValue = Math.max(...monthlyData.map(d => d.revenue));
            const revenueHeight = (data.revenue / maxValue) * 100;
            const expenseHeight = (data.expenses / maxValue) * 100;
            const profitHeight = (data.profit / maxValue) * 100;
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div
                    className="w-4 bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${revenueHeight}%` }}
                    title={`Revenue: ₹${(data.revenue / 1000).toFixed(0)}K`}
                  ></div>
                  <div
                    className="w-4 bg-red-400 rounded-t transition-all duration-500"
                    style={{ height: `${expenseHeight}%` }}
                    title={`Expenses: ₹${(data.expenses / 1000).toFixed(0)}K`}
                  ></div>
                  <div
                    className="w-4 bg-green-500 rounded-t transition-all duration-500"
                    style={{ height: `${profitHeight}%` }}
                    title={`Profit: ₹${(data.profit / 1000).toFixed(0)}K`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Revenue by Service
          </h2>
          <div className="space-y-4">
            {serviceRevenue.map(service => {
              const percentage = Math.round((service.revenue / totalRevenue) * 100);
              return (
                <div key={service.service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{service.service}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">₹{(service.revenue / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-gray-500 ml-2">({service.bookings} bookings)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${service.color}-500 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top Routes
          </h2>
          <div className="space-y-3">
            {topRoutes.map((route, idx) => (
              <div key={route.route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{route.route}</p>
                    <p className="text-xs text-gray-500">{route.trips} trips</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">₹{(route.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vehicles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Top Performing Vehicles
          </h2>
          <div className="space-y-3">
            {topVehicles.map((vehicle, idx) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.type}</p>
                    <p className="text-xs text-gray-500">{vehicle.id} • {vehicle.trips} trips</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{(vehicle.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-600">{vehicle.utilization}% utilized</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Customers
          </h2>
          <div className="space-y-3">
            {topCustomers.map((customer, idx) => (
              <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.type} • {customer.bookings} bookings</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">₹{(customer.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">85%</p>
            <p className="text-sm text-gray-600">Fleet Utilization</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">4.6</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">₹7.2K</p>
            <p className="text-sm text-gray-600">Avg Booking Value</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">92%</p>
            <p className="text-sm text-gray-600">On-Time Rate</p>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-lg">
            <p className="text-2xl font-bold text-cyan-600">28%</p>
            <p className="text-sm text-gray-600">Repeat Customers</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-2xl font-bold text-pink-600">2.3</p>
            <p className="text-sm text-gray-600">Bookings/Day</p>
          </div>
        </div>
      </div>
    </div>
  );
}
