'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, IndianRupee, MapPin, Clock, Star, Loader2, TrendingUp, Trophy } from 'lucide-react';

interface Trip {
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

function groupByMonth(trips: Trip[]): { label: string; total: number; trips: Trip[] }[] {
  const map: Record<string, { total: number; trips: Trip[] }> = {};
  trips.forEach(t => {
    const key = new Date(t.completedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!map[key]) map[key] = { total: 0, trips: [] };
    map[key].total += t.earnings || 0;
    map[key].trips.push(t);
  });
  return Object.entries(map).map(([label, v]) => ({ label, ...v }));
}

export default function TripHistoryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/driver/earnings?period=all')
      .then(r => r.json())
      .then(d => { if (d.success) setTrips(d.history || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalEarnings = trips.reduce((sum, t) => sum + (t.earnings || 0), 0);
  const bestMonth = (() => {
    const monthly: Record<string, number> = {};
    trips.forEach(t => {
      const key = new Date(t.completedAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthly[key] = (monthly[key] || 0) + (t.earnings || 0);
    });
    const entries = Object.entries(monthly);
    if (!entries.length) return null;
    return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
  })();

  const grouped = groupByMonth(trips);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Trip History</h1>
          <p className="text-xs text-gray-500">{trips.length} completed trips</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="font-semibold text-gray-900">No completed trips</p>
          <p className="text-sm text-gray-500 mt-1">Complete trips to see them here</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-4 text-white">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black flex items-center gap-0.5">
                <IndianRupee className="w-5 h-5" />{totalEarnings.toLocaleString()}
              </p>
              <p className="text-green-100 text-xs mt-0.5">All-time earnings</p>
            </div>
            {bestMonth && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl font-black text-amber-700 flex items-center gap-0.5">
                  <IndianRupee className="w-4 h-4" />{bestMonth[1].toLocaleString()}
                </p>
                <p className="text-amber-600 text-xs mt-0.5">Best month: {bestMonth[0]}</p>
              </div>
            )}
          </div>

          {/* Grouped by month */}
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-gray-700">{group.label}</h2>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">{group.trips.length} trips</span>
                    {group.total > 0 && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <IndianRupee className="w-2.5 h-2.5" />{group.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {group.trips.map(trip => (
                    <Link key={trip.id} href={`/driver/bookings/${trip.bookingNumber}`} className="block bg-white rounded-xl border p-4 hover:border-green-300 hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
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
                        <div className="text-right shrink-0">
                          {trip.isVendorAssigned ? (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Paid by Vendor</span>
                          ) : (
                            <p className="font-bold text-green-700 flex items-center gap-0.5 justify-end">
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
