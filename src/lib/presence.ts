// Shared "online right now" status logic for anyone whose dashboard pings a
// heartbeat (managers, vendors, ...). A heartbeat lands every ~60s while the
// tab is open and visible; a gap past this threshold means the tab was
// closed / went fully offline — matches the session-continuity threshold on
// the write side (see /api/manager/heartbeat, /api/vendor/heartbeat).
const PRESENCE_ONLINE_THRESHOLD_MS = 150 * 1000;

export type PresenceStatus = 'active' | 'idle' | 'offline';

export function getPresenceStatus(
  lastPingAt: Date | null | undefined,
  isIdle: boolean | null | undefined
): PresenceStatus {
  if (!lastPingAt) return 'offline';
  if (Date.now() - lastPingAt.getTime() > PRESENCE_ONLINE_THRESHOLD_MS) return 'offline';
  return isIdle ? 'idle' : 'active';
}
