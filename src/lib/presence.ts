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

const STATUS_RANK: Record<PresenceStatus, number> = { offline: 0, idle: 1, active: 2 };

export interface PlatformPresence {
  platform: string;
  status: PresenceStatus;
  lastSeenAt: string;
}

export interface AggregatedPresence {
  status: PresenceStatus;
  lastSeenAt: string | null;
  // Only platforms that are currently active/idle (not stale) — a vendor
  // logged into both web and app at once shows both here, so the badge can
  // render an icon per platform instead of just the single most-recent one.
  platforms: PlatformPresence[];
}

// Vendors can have one presence row per platform (web/app) since each
// client heartbeats independently — collapse those rows into one status
// for the admin UI: overall status is the best of any platform, lastSeenAt
// is the most recent ping across all of them, and `platforms` lists which
// clients are currently live.
export function aggregateVendorPresence(
  rows: Array<{ platform: string; lastPingAt: Date; isIdle: boolean }>
): AggregatedPresence {
  let status: PresenceStatus = 'offline';
  let lastSeenAt: Date | null = null;
  const platforms: PlatformPresence[] = [];

  for (const row of rows) {
    const rowStatus = getPresenceStatus(row.lastPingAt, row.isIdle);
    if (STATUS_RANK[rowStatus] > STATUS_RANK[status]) status = rowStatus;
    if (!lastSeenAt || row.lastPingAt > lastSeenAt) lastSeenAt = row.lastPingAt;
    if (rowStatus !== 'offline') {
      platforms.push({ platform: row.platform, status: rowStatus, lastSeenAt: row.lastPingAt.toISOString() });
    }
  }

  return { status, lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null, platforms };
}
