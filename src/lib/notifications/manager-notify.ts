// Notification writer for managers. Call this from event sites (a vendor
// submits a new location/service request) to drop a row into every scoped
// manager's inbox. Reads happen through /api/manager/notifications.
//
// Failures are swallowed — notifications are auxiliary, never block the
// primary action. Each failure is logged for observability.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export type ManagerNotificationType =
  | 'NEW_LOCATION_REQUEST'
  | 'NEW_SERVICE_REQUEST'
  | 'NEW_CONTACT_INQUIRY'
  | 'NEW_TRAVEL_AGENT_REGISTRATION';

export interface NotifyManagersInput {
  type: ManagerNotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, any>;
  // Id of the underlying record (a location/service request, a contact
  // inquiry) this notification is about. When two near-simultaneous
  // requests race for the same event (e.g. a double-click on submit), the
  // underlying record is usually deduped by its own DB constraint and ends
  // up with the same id both times — passing it here lets notifyManagers
  // skip re-notifying managers who already got a notification for it.
  dedupeKey?: string;
}

/** Managers (role=MANAGER, active) scoped to a given location via manager_locations. */
export async function getManagersForLocation(locationId: string): Promise<string[]> {
  const rows = await prisma.manager_locations.findMany({
    where: { locationId, admin_users: { role: 'MANAGER', isActive: true } },
    select: { managerId: true },
  });
  return rows.map((r) => r.managerId);
}

/** Managers (role=MANAGER, active) scoped to a given service via manager_services. */
export async function getManagersForService(serviceId: string): Promise<string[]> {
  const rows = await prisma.manager_services.findMany({
    where: { serviceId, admin_users: { role: 'MANAGER', isActive: true } },
    select: { managerId: true },
  });
  return rows.map((r) => r.managerId);
}

// contact_inquiries has no location/service scope (the public /contact form
// is fully anonymous) — every active manager shares the same queue, so
// unlike the two helpers above there's no "assigned" filter to apply here.
export async function getAllActiveManagers(): Promise<string[]> {
  const rows = await prisma.admin_users.findMany({
    where: { role: 'MANAGER', isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// How far back to look for an existing notification about the same record
// when dedupeKey is passed — long enough to catch a double-click/retry
// race, short enough to never suppress a genuinely new event later.
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

export async function notifyManagers(managerIds: string[], input: NotifyManagersInput): Promise<void> {
  let uniqueIds = [...new Set(managerIds)];
  if (uniqueIds.length === 0) return;
  try {
    if (input.dedupeKey) {
      const alreadyNotified = await prisma.manager_notifications.findMany({
        where: {
          type: input.type,
          managerId: { in: uniqueIds },
          createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
          metadata: { contains: input.dedupeKey },
        },
        select: { managerId: true },
      });
      const alreadyNotifiedIds = new Set(alreadyNotified.map((n) => n.managerId));
      uniqueIds = uniqueIds.filter((id) => !alreadyNotifiedIds.has(id));
      if (uniqueIds.length === 0) return;
    }
    await prisma.manager_notifications.createMany({
      data: uniqueIds.map((managerId) => ({
        managerId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      })),
    });
  } catch (error) {
    logger.error('notifyManagers failed', { count: uniqueIds.length, type: input.type, error });
  }
}
