'use client';

import { useEffect, useRef } from 'react';

// Same silent background activity ping as useManagerActivityHeartbeat — no
// UI, nothing for the vendor to see. Sends a heartbeat every PING_INTERVAL_MS
// while the tab is visible, flagging whether there's been any mouse/keyboard/
// scroll activity in the last IDLE_THRESHOLD_MS. Paused entirely while the
// tab is hidden, so a closed/backgrounded tab naturally stops generating
// pings (admin side treats a stale lastPingAt as offline).
const PING_INTERVAL_MS = 60_000;
const IDLE_THRESHOLD_MS = 120_000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function useVendorActivityHeartbeat(enabled: boolean) {
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const markActive = () => {
      lastInteractionRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const sendPing = () => {
      if (document.visibilityState !== 'visible') return;
      const isIdle = Date.now() - lastInteractionRef.current > IDLE_THRESHOLD_MS;
      fetch('/api/vendor/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isIdle, platform: 'web' }),
        keepalive: true,
      }).catch(() => {
        // best-effort; a missed ping just closes the current session early
      });
    };

    sendPing();
    const interval = setInterval(sendPing, PING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActive();
        sendPing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [enabled]);
}
