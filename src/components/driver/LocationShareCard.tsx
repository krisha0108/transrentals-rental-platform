'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation, Loader2, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';

// How often we actually POST a fix. watchPosition can fire much more often;
// we always keep the freshest fix but rate-limit the network writes.
const MIN_PUSH_MS = 4000;

export default function LocationShareCard() {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFix, setLastFix] = useState<{ at: number; accuracy: number | null } | null>(null);

  const watchId = useRef<number | null>(null);
  const lastPush = useRef<number>(0);
  const inFlight = useRef<boolean>(false);

  const stopWatch = useCallback(() => {
    if (watchId.current != null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const pushFix = useCallback(async (pos: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastPush.current < MIN_PUSH_MS || inFlight.current) return;
    lastPush.current = now;
    inFlight.current = true;
    const { latitude, longitude, heading, speed, accuracy } = pos.coords;
    try {
      await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude, heading, speed, accuracy }),
      });
      setLastFix({ at: now, accuracy });
      setError(null);
    } catch {
      setError('Network issue — retrying…');
    } finally {
      inFlight.current = false;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location not supported on this device.');
      return;
    }
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => pushFix(pos),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Enable it in your browser settings.');
          setSharing(false);
          stopWatch();
        } else {
          setError('Could not get location. Trying again…');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [pushFix, stopWatch]);

  // Reflect server state on mount (does NOT auto-start the watch — that needs
  // a fresh user action for the geolocation permission).
  useEffect(() => {
    fetch('/api/driver/location', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setSharing(!!d.isSharingLocation); })
      .catch(() => {});
    return () => stopWatch();
  }, [stopWatch]);

  const toggle = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (sharing) {
        stopWatch();
        await fetch('/api/driver/location', { method: 'DELETE' }).catch(() => {});
        setSharing(false);
        setLastFix(null);
      } else {
        setSharing(true);
        startWatch(); // first fix POST flips the server flag on
      }
    } finally {
      setBusy(false);
    }
  }, [sharing, startWatch, stopWatch]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${sharing ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Navigation className={`w-5 h-5 ${sharing ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Live location</p>
            <p className="text-xs text-gray-500">
              {sharing ? 'Your vendor & customer can see you on the trip map' : 'Turn on while you are on a trip'}
            </p>
          </div>
        </div>

        {/* Switch */}
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={sharing}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${sharing ? 'bg-emerald-500' : 'bg-gray-300'} ${busy ? 'opacity-60' : ''}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${sharing ? 'translate-x-6' : 'translate-x-1'}`}>
            {busy && <Loader2 className="w-5 h-5 p-0.5 text-gray-400 animate-spin" />}
          </span>
        </button>
      </div>

      {sharing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          {lastFix ? (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>Sharing live{lastFix.accuracy ? ` · ±${Math.round(lastFix.accuracy)}m` : ''}</span>
              <span className="ml-auto inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> on</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Getting your location…</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {!sharing && !error && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Location is only shared while this is on.
        </p>
      )}
    </div>
  );
}
