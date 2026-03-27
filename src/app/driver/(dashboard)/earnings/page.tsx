'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, Navigation, IndianRupee, Clock, MapPin, Star, Loader2, History } from 'lucide-react';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

interface EarningsData {
  earnings: { total: number; trips: number };
  stats: { totalTrips: number; completedTrips: number; activeTrips: number };
  history: Array<{
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
  }>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Earnings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your trip earnings summary</p>
        </div>
        <Link
          href="/driver/earnings/history"
          className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline"
        >
          <History className="w-4 h-4" /> Full History
        </Link>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              period === p.key
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Main Earnings Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white text-center">
            <p className="text-emerald-100 text-sm font-medium mb-1">Your Direct Earnings</p>
            <p className="text-4xl font-black tracking-tight flex items-center justify-center gap-1">
              <IndianRupee className="w-7 h-7" />
              {(data?.earnings.total || 0).toLocaleString()}
            </p>
            <p className="text-emerald-100 text-sm mt-1">{PERIODS.find(p => p.key === period)?.label}</p>
            {data?.history.some(t => t.isVendorAssigned) && (
              <p className="text-emerald-200 text-xs mt-2 bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                Vendor-assigned trips paid as salary (not included above)
              </p>
            )}
            <div className="flex justify-center gap-10 mt-5">
              <div>
                <p className="text-2xl font-bold">{data?.earnings.trips || 0}</p>
                <p className="text-emerald-100 text-xs mt-0.5">Trips</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data?.stats.totalTrips || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data?.stats.completedTrips || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data?.stats.activeTrips || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active</p>
            </div>
          </div>

          {/* Recent Trips */}
          {(data?.history?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Completed Trips</h2>
              <div className="space-y-3">
                {data!.history.slice(0, 10).map(trip => (
                  <div key={trip.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">#{trip.bookingNumber}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{trip.serviceType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
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
                          <div className="text-right">
                            <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Paid by Vendor</p>
                          </div>
                        ) : (
                          <p className="font-bold text-emerald-700 flex items-center gap-0.5">
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
                  </div>
                ))}
              </div>
              {(data?.history.length ?? 0) > 10 && (
                <Link
                  href="/driver/earnings/history"
                  className="block text-center text-sm text-emerald-600 font-medium mt-3 hover:underline"
                >
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
