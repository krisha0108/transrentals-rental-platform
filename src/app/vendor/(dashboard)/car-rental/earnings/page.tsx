'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Download,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  completedTrips: number;
  avgPerTrip: number;
}

interface EarningTransaction {
  id: string;
  bookingNumber: string;
  customerName: string;
  tripType: string;
  amount: number;
  status: string;
  completedAt: string;
}

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  OUTSTATION_ONEWAY: 'One-way',
  OUTSTATION_ROUNDTRIP: 'Round Trip',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
};

// Animated counter hook
function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    prevEnd.current = end;

    let startTime: number | null = null;
    const startVal = 0;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// Stagger container & item variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

export default function VendorCarRentalEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
    completedTrips: 0,
    avgPerTrip: 0,
  });
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');

  // Animated counters
  const animatedTotal = useCountUp(summary.totalEarnings);
  const animatedThisMonth = useCountUp(summary.thisMonth);
  const animatedPending = useCountUp(summary.pendingPayouts);
  const animatedTrips = useCountUp(summary.completedTrips, 800);
  const animatedAvg = useCountUp(summary.avgPerTrip);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vendor/car-rental/bookings?status=COMPLETED`);
      const data = await response.json();

      if (data.success) {
        const completedBookings = data.bookings || [];

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        const thisMonthEarnings = completedBookings
          .filter((b: any) => new Date(b.tripEndedAt || b.updatedAt) >= thisMonthStart)
          .reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        const lastMonthEarnings = completedBookings
          .filter((b: any) => {
            const date = new Date(b.tripEndedAt || b.updatedAt);
            return date >= lastMonthStart && date <= lastMonthEnd;
          })
          .reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        setSummary({
          totalEarnings,
          thisMonth: thisMonthEarnings,
          lastMonth: lastMonthEarnings,
          pendingPayouts: 0,
          completedTrips: completedBookings.length,
          avgPerTrip: completedBookings.length > 0 ? Math.round(totalEarnings / completedBookings.length) : 0,
        });

        setTransactions(completedBookings.map((b: any) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          tripType: b.tripType,
          amount: b.grandTotal,
          status: 'PAID',
          completedAt: b.tripEndedAt || b.updatedAt,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monthGrowth = summary.lastMonth > 0
    ? Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100)
    : summary.thisMonth > 0 ? 100 : 0;

  if (isLoading) {
    return <VendorCarRentalEarningsSkeleton />;
  }

  // --- Chart Data ---
  const monthlyChartData = (() => {
    const now = new Date();
    const months: { name: string; earnings: number; trips: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleDateString('en-IN', { month: 'short' });

      const monthTx = transactions.filter((tx) => {
        const d = new Date(tx.completedAt);
        return d >= monthStart && d <= monthEnd;
      });

      months.push({
        name: monthName,
        earnings: monthTx.reduce((sum, tx) => sum + tx.amount, 0),
        trips: monthTx.length,
      });
    }
    return months;
  })();

  const tripTypeChartData = (() => {
    const map: Record<string, { count: number; earnings: number }> = {};
    transactions.forEach((tx) => {
      const label = TRIP_TYPE_LABELS[tx.tripType] || tx.tripType.replace(/_/g, ' ');
      if (!map[label]) map[label] = { count: 0, earnings: 0 };
      map[label].count++;
      map[label].earnings += tx.amount;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      value: data.earnings,
      count: data.count,
    }));
  })();

  const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-gray-600">
              <span className="font-medium" style={{ color: p.color }}>
                {p.name}:{' '}
              </span>
              {p.name === 'trips' ? p.value : `₹${p.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
          <p className="font-semibold text-gray-900">{d.name}</p>
          <p className="text-gray-600">₹{d.value.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">{d.payload.count} trips</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with gradient */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-emerald-200/50"
      >
        {/* Animated decorative circles */}
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Car Rental Earnings</h1>
            <p className="text-white/70 text-sm mt-1">Track your earnings from car rental bookings</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors border border-white/20 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* Hero Earnings Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div variants={scaleIn}>
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50 relative group hover:shadow-lg hover:shadow-emerald-100/50 transition-shadow duration-300">
            <motion.div
              className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full -translate-y-1/3 translate-x-1/3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Wallet className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Earnings</p>
                  <p className="text-3xl font-extrabold text-gray-900">
                    ₹{animatedTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">{animatedTrips} trips</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">₹{animatedAvg.toLocaleString()} avg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scaleIn}>
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50 relative group hover:shadow-lg hover:shadow-emerald-100/50 transition-shadow duration-300">
            <motion.div
              className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full -translate-y-1/3 translate-x-1/3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.5 }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Calendar className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">This Month</p>
                  <p className="text-3xl font-extrabold text-gray-900">
                    ₹{animatedThisMonth.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {monthGrowth !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg border',
                      monthGrowth > 0
                        ? 'bg-green-50 border-green-100 text-green-700'
                        : 'bg-red-50 border-red-100 text-red-700'
                    )}
                  >
                    {monthGrowth > 0 ? (
                      <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </motion.div>
                    ) : (
                      <motion.div animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                    <span className="text-xs font-semibold">{Math.abs(monthGrowth)}% vs last month</span>
                  </motion.div>
                )}
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500">Last month:</span>
                  <span className="text-xs font-semibold text-gray-700">₹{summary.lastMonth.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div className="grid grid-cols-3 gap-4" variants={containerVariants}>
        {[
          {
            label: 'Pending',
            value: `₹${animatedPending.toLocaleString()}`,
            gradient: 'from-emerald-400 to-emerald-500',
            bg: 'from-emerald-50 to-emerald-50',
            border: 'border-emerald-100',
            textColor: 'text-emerald-600',
            icon: Clock,
          },
          {
            label: 'Completed',
            value: animatedTrips,
            suffix: 'trips',
            gradient: 'from-green-400 to-green-600',
            bg: 'from-green-50 to-emerald-50',
            border: 'border-green-100',
            textColor: 'text-green-600',
            icon: CheckCircle,
          },
          {
            label: 'Avg / Trip',
            value: `₹${animatedAvg.toLocaleString()}`,
            gradient: 'from-emerald-400 to-emerald-600',
            bg: 'from-emerald-50 to-emerald-50',
            border: 'border-emerald-100',
            textColor: 'text-emerald-600',
            icon: TrendingUp,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
            className={cn(
              'bg-gradient-to-br rounded-2xl p-4 border cursor-default',
              stat.bg,
              stat.border
            )}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <motion.div
                className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', stat.gradient)}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </motion.div>
              <p className={cn('text-[11px] font-semibold uppercase tracking-wider', stat.textColor)}>{stat.label}</p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {stat.value} {stat.suffix && <span className="text-sm font-medium text-gray-400">{stat.suffix}</span>}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      {transactions.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monthly Earnings Area Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Monthly Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-2 px-2 sm:px-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#earningsGradient)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                      dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2, className: 'drop-shadow-md' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trip Type Pie Chart */}
          <motion.div variants={scaleIn}>
            <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50 h-full">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  Trip Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                {tripTypeChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={tripTypeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          animationDuration={1200}
                          animationEasing="ease-out"
                          stroke="none"
                        >
                          {tripTypeChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="space-y-2 mt-2 px-1">
                      {tripTypeChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-gray-600 truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-900 ml-2">₹{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No trip data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Transactions */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                  <ReceiptText className="w-4 h-4 text-white" />
                </div>
                Recent Transactions
              </CardTitle>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {transactions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-12 text-center"
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    <Wallet className="w-8 h-8 text-gray-300" />
                  </motion.div>
                  <h3 className="font-semibold text-gray-900 mb-1">No earnings yet</h3>
                  <p className="text-sm text-gray-500">Complete trips to start earning</p>
                </motion.div>
              ) : (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Booking</th>
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trip Type</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map((tx, index) => (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-5 py-4">
                              <Link
                                href={`/vendor/car-rental/bookings/${tx.bookingNumber}`}
                                className="font-mono text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                {tx.bookingNumber}
                              </Link>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-gray-600">{tx.customerName?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{tx.customerName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                                <Car className="w-3 h-3" />
                                {TRIP_TYPE_LABELS[tx.tripType] || tx.tripType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-bold text-gray-900">₹{tx.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500">
                              {new Date(tx.completedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden divide-y divide-gray-50">
                    {transactions.map((tx, index) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                      >
                        <Link
                          href={`/vendor/car-rental/bookings/${tx.bookingNumber}`}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <IndianRupee className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 text-sm">{tx.customerName}</p>
                              <p className="font-bold text-gray-900">₹{tx.amount.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-gray-500">
                                {tx.bookingNumber} &middot; {TRIP_TYPE_LABELS[tx.tripType] || tx.tripType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(tx.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function VendorCarRentalEarningsSkeleton() {
  const quickStats = Array.from({ length: 3 });
  const transactionRows = Array.from({ length: 4 });

  return (
    <div className="space-y-6 animate-pulse">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-5 sm:p-6 text-white shadow-lg shadow-emerald-200/40">
        <div className="h-6 w-48 rounded-full bg-white/30" />
        <div className="mt-3 h-4 w-36 rounded bg-white/30" />
        <div className="mt-2 h-3 w-28 rounded bg-white/25" />
        <div className="mt-4 h-10 w-32 rounded-2xl bg-white/20 border border-white/50" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1].map((card) => (
          <div key={card} className="rounded-2xl bg-white/90 p-5 shadow-md border border-gray-100">
            <div className="h-5 w-32 rounded-md bg-slate-200/70" />
            <div className="mt-3 h-10 w-28 rounded-lg bg-slate-200/50" />
            <div className="mt-4 flex gap-3">
              <div className="h-3 w-16 rounded-full bg-slate-200/40" />
              <div className="h-3 w-16 rounded-full bg-slate-200/40" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {quickStats.map((_, index) => (
          <div key={`quick-${index}`} className="rounded-2xl border border-gray-200 bg-white/80 p-4 space-y-3">
            <div className="h-3 w-20 rounded-md bg-slate-200/70" />
            <div className="h-7 w-24 rounded-lg bg-slate-200/50" />
            <div className="h-3 w-12 rounded-full bg-slate-200/40" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
          <div className="h-4 w-40 rounded-md bg-slate-200/60" />
          <div className="h-40 rounded-2xl bg-slate-200/40" />
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
          <div className="h-4 w-36 rounded-md bg-slate-200/60" />
          <div className="h-32 rounded-2xl bg-slate-200/40" />
          <div className="space-y-2">
            {[0, 1, 2].map((legend) => (
              <div key={legend} className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200/70" />
                <div className="h-3 w-28 rounded-full bg-slate-200/70" />
                <div className="ml-auto h-3 w-16 rounded-full bg-slate-200/70" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="h-4 w-48 rounded-md bg-slate-200/60" />
        <div className="flex flex-wrap gap-3">
          {['This Month', 'Last Month', 'All Time'].map((label) => (
            <div key={label} className="h-8 w-24 rounded-2xl bg-slate-200/40" />
          ))}
        </div>

        <div className="space-y-3">
          {transactionRows.map((_, idx) => (
            <div key={`txn-${idx}`} className="rounded-2xl border border-gray-100 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="h-3 w-28 rounded-md bg-slate-200/60" />
                <div className="h-3 w-16 rounded-md bg-slate-200/60" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="h-3 w-32 rounded-md bg-slate-200/40" />
                <div className="h-3 w-16 rounded-md bg-slate-200/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
