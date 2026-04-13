'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  Car,
  Download,
  Crown,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedTrips: number;
  averagePerTrip: number;
}

interface Transaction {
  id: string;
  bookingNumber: string;
  carName: string;
  customerName: string;
  tripType: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'processing';
  date: string;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 425000,
  thisMonth: 78500,
  lastMonth: 65200,
  pendingPayout: 32500,
  completedTrips: 42,
  averagePerTrip: 10119,
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    bookingNumber: 'LUX-2024-0001',
    carName: 'Mercedes E-Class',
    customerName: 'Vikram Malhotra',
    tripType: 'Local (8hr/80km)',
    amount: 9549,
    commission: 955,
    netAmount: 8594,
    status: 'completed',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '2',
    bookingNumber: 'LUX-2024-0002',
    carName: 'Range Rover Vogue',
    customerName: 'Anjali Kapoor',
    tripType: 'Outstation (Delhi-Jaipur)',
    amount: 45999,
    commission: 4600,
    netAmount: 41399,
    status: 'completed',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '3',
    bookingNumber: 'LUX-2024-0003',
    carName: 'Rolls Royce Ghost',
    customerName: 'Ratan Mehta',
    tripType: 'Airport Pickup',
    amount: 25199,
    commission: 2520,
    netAmount: 22679,
    status: 'pending',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '4',
    bookingNumber: 'LUX-2024-0004',
    carName: 'BMW 7 Series',
    customerName: 'Priya Shah',
    tripType: 'Wedding Event',
    amount: 35000,
    commission: 3500,
    netAmount: 31500,
    status: 'processing',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export default function VendorLuxuryEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this-month');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary(SAMPLE_SUMMARY);
      setTransactions(SAMPLE_TRANSACTIONS);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const growthPercent = summary
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
    : '0';
  const isPositiveGrowth = summary ? summary.thisMonth >= summary.lastMonth : true;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <p className="mt-6 text-emerald-900 font-medium animate-pulse tracking-wide uppercase text-xs">Synchronizing Premium Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* ═══════ Premium Amber-Gold Header ═══════ */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 px-6 py-8 rounded-[2rem] border border-emerald-500 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity group-hover:opacity-75" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-400/5 rounded-full blur-[80px] -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(5,150,105,0.3)] border-b-4 border-emerald-500"
            >
              <Crown className="w-9 h-9 text-white drop-shadow-md" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Luxury Intelligence</h1>
              <div className="flex items-center gap-3">
                <span className="text-white/80 text-sm font-medium">Platform Revenue & Financial Performance</span>
                <div className="h-4 w-px bg-white/20" />
                <span className="flex items-center gap-1.5 text-xs font-bold text-white/60 uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded">
                  <Sparkles className="w-3 h-3" /> Premium
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/15 border border-white/20 rounded-xl p-1 flex">
              {['this-month', 'all-time'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    period === p
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>
            <button className="p-3 bg-emerald-700 border border-emerald-500 text-white/70 hover:text-white rounded-xl transition-all shadow-xl group">
              <Download className="w-5 h-5 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ Summary Cards Grid ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 p-6 rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 border border-emerald-500 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-white/80" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Total Realized</p>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-white/70 font-bold text-xl">₹</span>
              <span className="text-4xl font-black text-white tracking-tighter">
                {summary?.totalEarnings.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-white/60 uppercase tracking-widest">
              <Car className="w-3.5 h-3.5" />
              {summary?.completedTrips} Luxury Assignments
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-[2rem] bg-white border border-emerald-100 shadow-xl shadow-emerald-200/10"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] mb-1">Performance Index</p>
              <h3 className="text-xs font-bold text-gray-900 tracking-wider">This Billing Cycle</h3>
            </div>
            <div className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border",
              isPositiveGrowth ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
            )}>
              {isPositiveGrowth ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {growthPercent}%
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-emerald-600 font-bold text-lg">₹</span>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">
              {summary?.thisMonth.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '75%' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-[2rem] bg-white border border-emerald-100 shadow-xl shadow-emerald-200/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] mb-0.5">Asset in Transit</p>
              <h3 className="text-xs font-bold text-gray-900 tracking-wider">Pending Payout</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-emerald-600 font-bold text-lg">₹</span>
            <span className="text-3xl font-black text-emerald-700 tracking-tighter">
              {summary?.pendingPayout.toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Next Settlement: Monday</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-[2rem] bg-white border border-emerald-100 shadow-xl shadow-emerald-200/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] mb-0.5">Efficiency Score</p>
              <h3 className="text-xs font-bold text-gray-900 tracking-wider">Avg. Deal Value</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-emerald-600 font-bold text-lg">₹</span>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">
              {summary?.averagePerTrip.toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">+12% vs Market Avg</p>
        </motion.div>
      </div>

      {/* ═══════ Advanced Transaction Ledger ═══════ */}
      <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
        <div className="p-8 border-b border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Financial Ledger</h2>
              <p className="text-xs text-emerald-500 font-medium tracking-wide leading-none mt-1">Movement of verified luxury funds</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            <input
              type="text"
              placeholder="Search Ledger Records..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-emerald-100 rounded-[1.25rem] text-sm text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-emerald-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Asset & Client</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Assignment Type</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Gross Value</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Commission (10%)</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Net Capital</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em]">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              <AnimatePresence>
                {transactions.map((tx, idx) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">{tx.carName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">#{tx.bookingNumber}</span>
                            <span className="h-1 w-1 bg-emerald-200 rounded-full" />
                            <span className="text-[10px] font-medium text-emerald-500 uppercase">{tx.customerName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-emerald-800/70 uppercase tracking-widest">{tx.tripType}</p>
                      <p className="text-[10px] text-emerald-400 font-medium mt-1 uppercase italic">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-gray-900 tracking-tighter">₹{tx.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-xs font-bold text-red-500/80">-₹{tx.commission.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex flex-col items-end">
                        <p className="text-base font-black text-emerald-700 tracking-tighter">₹{tx.netAmount.toLocaleString()}</p>
                        <div className="h-0.5 w-full bg-emerald-600 scale-x-0 group-hover:scale-x-100 origin-right transition-transform" />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        tx.status === 'completed' ? "bg-green-50 text-green-700 border-green-100" :
                          tx.status === 'pending' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {tx.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-emerald-50 bg-emerald-50/20 text-center">
          <button className="text-emerald-700 hover:text-gray-900 font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 mx-auto px-6 py-2 rounded-full hover:bg-emerald-50">
            Internal Ledger Archives <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════ Payout System Intel ═══════ */}
      <div className="bg-emerald-600 rounded-[2.5rem] p-8 border border-emerald-500 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-emerald-600/10 to-transparent flex items-center justify-center">
          <Sparkles className="w-32 h-32 text-emerald-400 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000" />
        </div>

        <div className="relative z-10 grid md:grid-cols-3 gap-12 items-center">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-widest uppercase">Settlement Protocol</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-2xl font-medium">
              Payouts are automatically verified and processed every <span className="text-white font-bold">Monday (GMT 08:00)</span>.
              Completed luxury assignments from the prior cycle are consolidated and credited to your secured premium bank account within <span className="text-white font-bold">48 business hours</span>.
              All transactions are subject to a fixed <span className="text-white/90 font-bold italic">10% platform facilitation fee</span>.
            </p>
          </div>
          <div className="flex justify-end">
            <button className="px-8 py-4 bg-white text-gray-900 hover:bg-emerald-50 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-white/10 active:scale-95">
              Financial Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
