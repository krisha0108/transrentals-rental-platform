import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, getSessionToken } from '../screens/api/client';

// Mobile counterpart of web's useVendorActivityHeartbeat.ts — same
// mechanism, same constants, same endpoint. No UI, nothing for the vendor
// to see. Sends a heartbeat every PING_INTERVAL_MS while the app is in the
// foreground, flagging whether there's been any touch activity in the last
// IDLE_THRESHOLD_MS. Paused entirely while backgrounded, so a closed/
// backgrounded app naturally stops generating pings (admin side treats a
// stale lastPingAt as offline) — matches web's "tab hidden" pause.
//
// Web tracks mousemove/keydown/scroll via `window` listeners with no extra
// markup needed. RN has no such global listener, so activity is captured by
// wrapping the app root in a View using `onStartShouldSetResponderCapture`
// (see VendorActivityTracker below) — it fires on every touch during the
// capture phase, before any child claims the responder, and returning
// `false` means it never actually claims it, so it's fully passive and
// can't block/steal a tap, swipe, or gesture-handler interaction anywhere
// in the tree.
//
// Only pings for vendor sessions — travel-agent logins hit the *travel*
// agent's own tracking (if any), and pinging the vendor endpoint with a TA
// token would just 401 (wrong user type), which is harmless but pointless.
const PING_INTERVAL_MS = 60_000;
const IDLE_THRESHOLD_MS = 120_000;

export function useVendorActivityHeartbeat() {
  const lastInteractionRef = useRef(Date.now());
  const appStateRef = useRef(AppState.currentState);

  const markActive = () => {
    lastInteractionRef.current = Date.now();
  };

  useEffect(() => {
    const sendPing = async () => {
      if (appStateRef.current !== 'active') return;
      try {
        const token = await getSessionToken();
        if (!token) return; // not logged in — nothing to report

        const isTravelAgent = await AsyncStorage.getItem('travel_agent');
        if (isTravelAgent) return; // vendor-only tracker, matches web

        const isIdle = Date.now() - lastInteractionRef.current > IDLE_THRESHOLD_MS;
        await apiPost('/vendor/heartbeat', { isIdle, platform: 'app' });
      } catch {
        // best-effort; a missed ping just closes the current session early
        // (same as web — see useVendorActivityHeartbeat.ts)
      }
    };

    sendPing();
    const interval = setInterval(sendPing, PING_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (nextState) => {
      const wasActive = appStateRef.current === 'active';
      appStateRef.current = nextState;
      if (nextState === 'active' && !wasActive) {
        markActive();
        sendPing();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return { markActive };
}
