'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Compact dashboard widget: shows the vendor's OWN location as a place name
// (reverse-geocoded from the browser) and links to the full Live Tracking tab
// where all drivers are plotted on the map.
export default function VendorLiveLocationCard() {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [phase, setPhase] = useState<'locating' | 'ready' | 'denied' | 'error'>('locating');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setPhase('error'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const d = await res.json();
          setPlaceName([d.city, d.state].filter(Boolean).join(', ') || d.fullAddress || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } catch {
          setPlaceName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
        setPhase('ready');
      },
      (err) => setPhase(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 20000 },
    );
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Your location</p>
          <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
            {phase === 'locating' && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            {phase === 'ready' ? placeName
              : phase === 'locating' ? 'Detecting your location…'
              : phase === 'denied' ? 'Allow location to detect'
              : 'Location unavailable'}
          </p>
        </div>
      </div>

      <Link
        href="/vendor/tracking"
        className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shrink-0"
      >
        <Navigation className="w-4 h-4" /> Live Tracking
      </Link>
    </div>
  );
}
