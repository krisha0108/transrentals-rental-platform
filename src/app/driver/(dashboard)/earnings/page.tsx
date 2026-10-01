'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, Navigation, IndianRupee, Clock, MapPin, Star, Loader2, History } from 'lucide-react';
import { PageHeader, StatTile } from '../_components/PortalUI';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

interface TripItem {
  id: string;
  bookingNumber: string;
  pickupCity: string;
  dropCity?: string;
  completedAt: string;
  earnings: number;
  grandTotal?: number;
  driverRating?: number;
  serviceType: string;
  isVendorAssigned?: boolean;
}

interface EarningsData {
  earnings: { total: number; trips: number };
  stats: { totalTrips: number; completedTrips: number; activeTrips: number };
  history: TripItem[];
}

function BarChart({ history, period }: { history: TripItem[]; period: string }) {
  if (history.length === 0) return null;

  // Group by day or month depending on period
  const groups: Record<string, number> = {};
  const now = new Date();

  if (period === 'today') {
    for (let h = 0; h < 24; h++) {
      const label = h % 4 === 0 ? `${h}:00` : '';
      groups[h] = 0;
    }
    history.forEach(t => {
      const h = new Date(t.completedAt).getHours();
      groups[h] = (groups[h] || 0) + (t.earnings || 0);
    });
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' });
      groups[key] = 0;
    }
    history.forEach(t => {
      const key = new Date(t.completedAt).toLocaleDateString('en-IN', { weekday: 'short' });
      if (key in groups) groups[key] = (groups[key] || 0) + (t.earnings || 0);
    });
  } else if (period === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) groups[d] = 0;
    history.forEach(t => {
      const day = new Date(t.completedAt).getDate();
      groups[day] = (groups[day] || 0) + (t.earnings || 0);
    });
  } else {
    // all — group by month
    history.forEach(t => {
      const key = new Date(t.completedAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      groups[key] = (groups[key] || 0) + (t.earnings || 0);
    });
  }

  const entries = Object.entries(groups);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  const todayKey = period === 'week'
    ? now.toLocaleDateString('en-IN', { weekday: 'short' })
    : period === 'month'
    ? now.getDate()
    : null;

  return (
    <div className="bg-white rounded-2xl border p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Earnings Breakdown</p>
      <div className="flex items-end gap-1 h-28 overflow-x-auto pb-1">
        {entries.map(([key, val]) => {
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isToday = todayKey !== null && String(key) === String(todayKey);
          const isCurrentHour = period === 'today' && Number(key) === now.getHours();
          const highlight = isToday || isCurrentHour;
          return (
            <div key={key} className="flex flex-col items-center gap-1 shrink-0" style={{ flex: '1 0 auto', minWidth: entries.length > 20 ? 12 : 20 }}>
              <div className="relative w-full flex items-end" style={{ height: 80 }}>
                {val > 0 && (
                  <div
                    className={`w-full rounded-t-md transition-all ${highlight ? 'bg-green-500' : 'bg-green-200'}`}
                    style={{ height: `${heightPct}%` }}
                  />
                )}
                {val === 0 && <div className="w-full h-1 rounded bg-gray-100" />}
              </div>
              {entries.length <= 14 && (
                <span className={`text-xs font-medium truncate ${highlight ? 'text-green-700' : 'text-gray-400'}`}>
                  {period === 'today' ? (Number(key) % 4 === 0 ? `${key}h` : '') : key}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EarningsPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/driver/earnings?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [period]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={TrendingUp}
        title="Earnings"
        subtitle="What your trips have brought in"
        actions={
          <Link href="/driver/earnings/history" className="dv-action-ghost">
            <History className="w-4 h-4" /> Full history
          </Link>
        }
      />

      {/* Period Selector */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              period === p.key
                ? 'bg-green-600 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Main Earnings Card */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white text-center">
            <p className="text-green-100 text-sm font-medium mb-1">Your Direct Earnings</p>
            <p className="text-4xl font-black tracking-tight flex items-center justify-center gap-1">
              <IndianRupee className="w-7 h-7" />
              {(data?.earnings.total || 0).toLocaleString()}
            </p>
            <p className="text-green-100 text-sm mt-1">{PERIODS.find(p => p.key === period)?.label}</p>
            {data?.history.some(t => t.isVendorAssigned) && (
              <p className="text-green-200 text-xs mt-2 bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                Vendor-assigned trips paid as salary (not included above)
              </p>
            )}
            <div className="flex justify-center gap-10 mt-5">
              <div>
                <p className="text-2xl font-bold">{data?.earnings.trips || 0}</p>
                <p className="text-green-100 text-xs mt-0.5">Trips</p>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          {(data?.history?.length ?? 0) > 0 && (
            <BarChart history={data!.history} period={period} />
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              icon={Navigation} label="Total" value={data?.stats.totalTrips || 0}
              accent="bg-blue-400" tone="bg-blue-100 text-blue-600"
            />
            <StatTile
              icon={CheckCircle} label="Completed" value={data?.stats.completedTrips || 0}
              accent="bg-green-400" tone="bg-green-100 text-green-600"
            />
            <StatTile
              icon={Clock} label="Active" value={data?.stats.activeTrips || 0}
              accent="bg-amber-400" tone="bg-amber-100 text-amber-600"
            />
          </div>

          {/* Recent Trips */}
          {(data?.history?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Completed Trips</h2>
              <div className="space-y-3">
                {data!.history.slice(0, 10).map(trip => (
                  <Link key={trip.id} href={`/driver/bookings/${trip.bookingNumber}`} className="block bg-white rounded-xl border p-4 hover:border-green-300 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">#{trip.bookingNumber}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{trip.serviceType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <MapPin className="w-3.5 h-3.5 text-green-500" />
                          {trip.dropCity ? `${trip.pickupCity} → ${trip.dropCity}` : trip.pickupCity}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trip.completedAt
                            ? new Date(trip.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        {trip.isVendorAssigned ? (
                          <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Paid by Vendor</p>
                        ) : (
                          <p className="font-bold text-green-700 flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />{(trip.earnings || 0).toLocaleString()}
                          </p>
                        )}
                        {trip.driverRating && (
                          <div className="flex items-center gap-0.5 justify-end mt-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= trip.driverRating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {(data?.history.length ?? 0) > 10 && (
                <Link href="/driver/earnings/history" className="block text-center text-sm text-green-600 font-medium mt-3 hover:underline">
                  View all {data!.history.length} trips →
                </Link>
              )}
            </div>
          )}

          {(data?.history?.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl border p-10 text-center">
              <TrendingUp className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">No completed trips yet</p>
              <p className="text-sm text-gray-500 mt-1">Complete trips to see your earnings here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
