'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Truck,
  Download,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Clock,
  Wallet,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedTrips: number;
  averagePerTrip: number;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 245000,
  thisMonth: 42500,
  lastMonth: 38000,
  pendingPayout: 15500,
  completedTrips: 156,
  averagePerTrip: 1571,
};

export default function VendorMiniTruckEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSummary(SAMPLE_SUMMARY);
      setIsLoading(false);
    }, 500);
  }, []);

  const growthPercent = summary
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
    : '0';
  const isPositiveGrowth = summary ? summary.thisMonth >= summary.lastMonth : true;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mini Truck Earnings</h1>
            <p className="text-gray-600">Track your trip revenue</p>
          </div>
        </div>

        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 flex items-center gap-2">
          <Download className="w-4 h-4" />Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-orange-200" />
            <span className="text-orange-100 text-sm">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold">₹{summary?.totalEarnings.toLocaleString()}</p>
          <p className="text-sm text-orange-200 mt-1">{summary?.completedTrips} trips completed</p>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">This Month</span>
            <span className={`flex items-center gap-1 text-xs font-medium ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGrowth ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {growthPercent}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{summary?.thisMonth.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-sm">Pending Payout</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">₹{summary?.pendingPayout.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 text-sm">Avg. per Trip</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{summary?.averagePerTrip.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-2">Payout Information</h3>
        <p className="text-sm text-orange-700">
          Payouts are processed daily. A 10% platform commission is deducted from each trip.
        </p>
      </div>
    </div>
  );
}
