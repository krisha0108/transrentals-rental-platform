// Notification writer for managers. Call this from event sites (a vendor
// submits a new location/service request) to drop a row into every scoped
// manager's inbox. Reads happen through /api/manager/notifications.
//
// Failures are swallowed — notifications are auxiliary, never block the
// primary action. Each failure is logged for observability.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export type ManagerNotificationType = 'NEW_LOCATION_REQUEST' | 'NEW_SERVICE_REQUEST' | 'NEW_CONTACT_INQUIRY';

export interface NotifyManagersInput {
  type: ManagerNotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, any>;
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

export async function notifyManagers(managerIds: string[], input: NotifyManagersInput): Promise<void> {
  const uniqueIds = [...new Set(managerIds)];
  if (uniqueIds.length === 0) return;
  try {
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
