'use client';

import { useState, useEffect } from 'react';
import { Car, MapPin, Clock, Calendar, IndianRupee, Loader2, Radio, CheckCircle, RefreshCw } from 'lucide-react';

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

export default function AvailableTripsPage() {
  const [bookings, setBookings] = useState<AvailableBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/available-bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.error || 'Failed to load trips');
      }
    } catch {
      setError('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAccept = async (bookingId: string) => {
    setAccepting(bookingId);
    setError('');
    try {
      const res = await fetch('/api/driver/available-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccepted(bookingId);
        // Remove from list after short delay
        setTimeout(() => {
          setBookings(prev => prev.filter(b => b.id !== bookingId));
          setAccepted(null);
        }, 1500);
      } else {
        setError(data.error || 'Failed to accept booking');
        // Refresh list in case it was taken
        fetchBookings();
      }
    } catch {
      setError('Failed to accept booking');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" /> Available Trips
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Accept trips broadcasted by operators</p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <Radio className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No Available Trips</h3>
          <p className="text-sm text-gray-500">There are no broadcasted trips right now. Check back later.</p>
          <button
            onClick={fetchBookings}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isAccepting = accepting === booking.id;
            const isAccepted = accepted === booking.id;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition ${isAccepted ? 'border-green-400 bg-green-50' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-gray-400">#{booking.bookingNumber}</p>
                      <p className="font-semibold text-gray-900">{booking.carCategoryName}</p>
                      <p className="text-xs text-gray-500">{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                    </div>
                  </div>
                  {booking.driverBatta != null && booking.driverBatta > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Driver Batta</p>
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
                        {booking.dropCity
                          ? `${booking.pickupCity} → ${booking.dropCity}`
                          : booking.pickupCity}
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

                  {booking.pickupAddress && (
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Address</p>
                        <p className="text-gray-700">{booking.pickupAddress}</p>
                      </div>
                    </div>
                  )}

                  {booking.estimatedDistance != null && booking.estimatedDistance > 0 && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="font-medium">{booking.estimatedDistance} km</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accept button */}
                {isAccepted ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium">
                    <CheckCircle className="w-5 h-5" /> Trip Accepted!
                  </div>
                ) : (
                  <button
                    onClick={() => handleAccept(booking.id)}
                    disabled={isAccepting || accepting !== null}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
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
