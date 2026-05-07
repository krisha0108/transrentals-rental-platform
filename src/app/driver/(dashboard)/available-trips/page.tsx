'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Car, MapPin, Clock, Calendar, IndianRupee, Loader2, Radio, CheckCircle, RefreshCw, ArrowUpDown, Zap } from 'lucide-react';

interface AvailableBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategoryName: string;
  customerName: string;
  pickupCity: string;
  dropCity?: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  estimatedDistance?: number;
  grandTotal?: number;
  driverBatta?: number;
  createdAt: string;
}

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
};

const TRIP_TYPES = ['ALL', 'LOCAL', 'OUTSTATION_ONEWAY', 'OUTSTATION_ROUNDTRIP', 'AIRPORT_PICKUP', 'AIRPORT_DROP'];

type SortKey = 'soonest' | 'highest';

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 15 * 60 * 1000;
}

export default function AvailableTripsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<AvailableBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('soonest');
  const [tripTypeFilter, setTripTypeFilter] = useState('ALL');
  const [showAll, setShowAll] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBookings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/available-bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
      else setError(data.error || 'Failed to load trips');
    } catch {
      setError('Failed to load trips');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    timerRef.current = setInterval(() => fetchBookings(true), 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleAccept = async (booking: AvailableBooking) => {
    setAccepting(booking.id);
    setError('');
    try {
      const res = await fetch('/api/driver/available-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAccepted(booking.id);
        setTimeout(() => {
          setBookings(prev => prev.filter(b => b.id !== booking.id));
          setAccepted(null);
          router.push(`/driver/bookings/${booking.bookingNumber}`);
        }, 1000);
      } else {
        setError(data.error || 'Failed to accept booking');
        fetchBookings();
      }
    } catch {
      setError('Failed to accept booking');
    } finally {
      setAccepting(null);
    }
  };

  const now = new Date();
  let filtered = bookings.filter(b => {
    if (!showAll && new Date(b.pickupDate) < now) return false;
    if (tripTypeFilter !== 'ALL' && b.tripType !== tripTypeFilter) return false;
    return true;
  });
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'soonest') return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
    return (b.driverBatta || 0) - (a.driverBatta || 0);
  });

  const typeCounts = TRIP_TYPES.reduce((acc, t) => {
    acc[t] = t === 'ALL' ? bookings.length : bookings.filter(b => b.tripType === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" /> Available Trips
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} trip{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
        <button
          onClick={() => fetchBookings()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        {/* Sort */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setSort('soonest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sort === 'soonest' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <Clock className="w-3 h-3" /> Soonest
          </button>
          <button
            onClick={() => setSort('highest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sort === 'highest' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <IndianRupee className="w-3 h-3" /> Highest Earning
          </button>
        </div>
        {/* Upcoming / All toggle */}
        <button
          onClick={() => setShowAll(v => !v)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${showAll ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          {showAll ? 'All Dates' : 'Upcoming'}
        </button>
      </div>

      {/* Trip type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TRIP_TYPES.filter(t => t === 'ALL' || typeCounts[t] > 0).map(t => (
          <button
            key={t}
            onClick={() => setTripTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition flex items-center gap-1.5 ${
              tripTypeFilter === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            {t === 'ALL' ? 'All Types' : TRIP_TYPE_LABELS[t] || t}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tripTypeFilter === t ? 'bg-white/20' : 'bg-gray-100'}`}>
              {typeCounts[t]}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <Radio className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No Available Trips</h3>
          <p className="text-sm text-gray-500">
            {tripTypeFilter !== 'ALL' ? 'No trips for this type. Try changing the filter.' : 'No broadcasted trips right now. Check back later.'}
          </p>
          <button onClick={() => fetchBookings()} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const isAccepting = accepting === booking.id;
            const isAccepted = accepted === booking.id;
            const isPast = new Date(booking.pickupDate) < now;
            const newTrip = isNew(booking.createdAt);

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition ${isAccepted ? 'border-green-400 bg-green-50' : isPast ? 'opacity-60' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-mono text-gray-400">#{booking.bookingNumber}</p>
                        {newTrip && !isPast && (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            <Zap className="w-2.5 h-2.5" /> NEW
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">PAST</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{booking.carCategoryName}</p>
                      <p className="text-xs text-gray-500">{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                    </div>
                  </div>
                  {booking.driverBatta != null && booking.driverBatta > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Your Earning</p>
                      <p className="font-bold text-emerald-700 flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />{booking.driverBatta.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Route</p>
                      <p className="font-medium">
                        {booking.dropCity ? `${booking.pickupCity} → ${booking.dropCity}` : booking.pickupCity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="font-medium">
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                        {booking.pickupTime}
                      </p>
                    </div>
                  </div>

                  {booking.estimatedDistance != null && booking.estimatedDistance > 0 && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="font-medium">{booking.estimatedDistance} km</p>
                      </div>
                    </div>
                  )}

                  {booking.pickupAddress && (
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Address</p>
                        <p className="text-gray-700">{booking.pickupAddress}</p>
                      </div>
                    </div>
                  )}
                  {booking.dropAddress && (
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Drop Address</p>
                        <p className="text-gray-700">{booking.dropAddress}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accept button */}
                {isAccepted ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium">
                    <CheckCircle className="w-5 h-5" /> Trip Accepted! Assigning vehicle...
                  </div>
                ) : (
                  <button
                    onClick={() => handleAccept(booking)}
                    disabled={isAccepting || accepting !== null || isPast}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                    ) : isPast ? (
                      'Trip Expired'
                    ) : (
                      'Accept Trip'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
