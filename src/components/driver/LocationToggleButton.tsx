'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const MIN_PUSH_MS = 4000;

export default function LocationToggleButton() {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);

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
    } catch {
      // silent — header toggle doesn't show inline errors
    } finally {
      inFlight.current = false;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => pushFix(pos),
      () => { setSharing(false); stopWatch(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [pushFix, stopWatch]);

  useEffect(() => {
    fetch('/api/driver/location', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setSharing(!!d.isSharingLocation); })
      .catch(() => {});
    return () => stopWatch();
  }, [stopWatch]);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      if (sharing) {
        stopWatch();
        await fetch('/api/driver/location', { method: 'DELETE' }).catch(() => {});
        setSharing(false);
      } else {
        setSharing(true);
        startWatch();
      }
    } finally {
      setBusy(false);
    }
  }, [sharing, startWatch, stopWatch]);

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={sharing ? 'Live location ON — tap to stop' : 'Live location OFF — tap to share'}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
        sharing
          ? 'bg-white text-emerald-700 hover:bg-emerald-50'
          : 'bg-emerald-700 text-emerald-200 hover:bg-emerald-600'
      }`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      {sharing ? (
        <span className="hidden sm:flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      ) : (
        <span className="hidden sm:block">Location</span>
      )}
    </button>
  );
}
