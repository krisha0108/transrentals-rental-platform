'use client';

import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  CheckCircle,
  Clock,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Wallet,
  CreditCard,
  Building,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedTrips: number;
  avgTripValue: number;
  monthlyChange: number;
}

interface Transaction {
  id: string;
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'paid' | 'pending' | 'processing';
  date: string;
  paymentMethod: string;
}

interface MonthlyData {
  month: string;
  earnings: number;
  trips: number;
}

export default function VendorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEarnings();
  }, [dateRange]);

  const fetchEarnings = async () => {
    // Simulated data - in production this would fetch from API
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setSummary({
      totalEarnings: 245000,
      thisMonth: 48500,
      lastMonth: 42300,
      pendingPayout: 12500,
      completedTrips: 45,
      avgTripValue: 5444,
      monthlyChange: 14.7,
    });

    setMonthlyData([
      { month: 'Jul', earnings: 35000, trips: 28 },
      { month: 'Aug', earnings: 42000, trips: 35 },
      { month: 'Sep', earnings: 38000, trips: 32 },
      { month: 'Oct', earnings: 45000, trips: 38 },
      { month: 'Nov', earnings: 42300, trips: 36 },
      { month: 'Dec', earnings: 48500, trips: 45 },
    ]);

    setTransactions([
      {
        id: '1',
        bookingNumber: 'TR2024120001',
        customerName: 'Rahul Sharma',
        vehicleName: 'Toyota Fortuner',
        amount: 8500,
        commission: 850,
        netAmount: 7650,
        status: 'paid',
        date: '2024-12-10',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: '2',
        bookingNumber: 'TR2024120002',
        customerName: 'Priya Patel',
        vehicleName: 'Honda City',
        amount: 4500,
        commission: 450,
        netAmount: 4050,
        status: 'paid',
        date: '2024-12-09',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: '3',
        bookingNumber: 'TR2024120003',
        customerName: 'Amit Kumar',
        vehicleName: 'Maruti Swift',
        amount: 2800,
        commission: 280,
        netAmount: 2520,
        status: 'processing',
        date: '2024-12-08',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: '4',
        bookingNumber: 'TR2024120004',
        customerName: 'Sneha Reddy',
        vehicleName: 'Mercedes E-Class',
        amount: 12500,
        commission: 1250,
        netAmount: 11250,
        status: 'pending',
        date: '2024-12-07',
        paymentMethod: 'Pending',
      },
      {
        id: '5',
        bookingNumber: 'TR2024110045',
        customerName: 'Vikram Singh',
        vehicleName: 'Hyundai Creta',
        amount: 5500,
        commission: 550,
        netAmount: 4950,
        status: 'paid',
        date: '2024-11-28',
        paymentMethod: 'Bank Transfer',
      },
    ]);

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxEarning = Math.max(...monthlyData.map(d => d.earnings));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your revenue and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="last6Months">Last 6 Months</option>
            <option value="thisYear">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${summary.monthlyChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {summary.monthlyChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(summary.monthlyChange)}%
              </div>
            </div>
            <p className="text-green-100 text-sm mb-1">This Month</p>
            <p className="text-3xl font-bold">{formatCurrency(summary.thisMonth)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalEarnings)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Pending Payout</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingPayout)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Completed Trips</p>
            <p className="text-2xl font-bold text-gray-900">{summary.completedTrips}</p>
            <p className="text-sm text-gray-500 mt-1">Avg: {formatCurrency(summary.avgTripValue)}/trip</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="w-10 text-sm text-gray-500">{data.month}</span>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-end pr-3"
                      style={{ width: `${(data.earnings / maxEarning) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(data.earnings)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="w-16 text-sm text-gray-500 text-right">{data.trips} trips</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Acceptance Rate</span>
                <span className="font-semibold text-green-600">92%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-blue-600">98%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Customer Rating</span>
                <span className="font-semibold text-yellow-600">4.8/5</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold text-purple-600">&lt; 30 min</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Settings Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payout Account</h3>
              <p className="text-blue-100">HDFC Bank •••• 4523</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Next payout</p>
              <p className="font-semibold">{formatCurrency(summary?.pendingPayout || 0)}</p>
            </div>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition">
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{tx.bookingNumber}</p>
                      <p className="text-sm text-gray-500">{tx.vehicleName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {tx.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">
                    -{formatCurrency(tx.commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                    {formatCurrency(tx.netAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : tx.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.status === 'paid' ? 'Paid' : tx.status === 'processing' ? 'Processing' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(tx.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
