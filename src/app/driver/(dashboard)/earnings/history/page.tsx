'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, IndianRupee, MapPin, Clock, Star, Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trip History</h1>
          <p className="text-sm text-gray-500">{trips.length} completed trips</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="font-semibold text-gray-900">No completed trips</p>
          <p className="text-sm text-gray-500 mt-1">Complete trips to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                <div className="text-right shrink-0">
                  {trip.isVendorAssigned ? (
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Paid by Vendor</span>
                    </div>
                  ) : (
                    <p className="font-bold text-emerald-700 flex items-center gap-0.5 justify-end">
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
      )}
    </div>
  );
}
