import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export interface CarRentalContentAccessResult {
  ok: boolean;
  status?: number; // HTTP status to use when !ok
  error?: string;
  actorId?: string; // the authorized caller's admin_users id, for stamping createdById/updatedById
}

/**
 * Gates the car-rental "routes", "packages", "city-pricing" and "distances"
 * admin content APIs (src/app/api/admin/services/[slug]/routes, .../packages,
 * .../city-pricing, and src/app/api/admin/distances/*), which previously had
 * no auth check at all. The distances endpoints have no [slug] segment (the
 * city_distance_matrix table isn't service-scoped) so they're gated as
 * car-rental content directly, since that's their only current consumer.
 * SUPER_ADMIN/ADMIN/SUB_ADMIN always
 * pass. A MANAGER only passes when the admin has explicitly granted them
 * `canManageCarRentalContent` AND the requested service slug is
 * 'car-rental' — this is a live DB re-check (not the cached JWT claim) so
 * revoking the flag takes effect immediately, without waiting for the
 * manager's token to expire.
 */
export async function authorizeCarRentalContentAccess(
  serviceSlug: string,
): Promise<CarRentalContentAccessResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const currentUser = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true, canManageCarRentalContent: true },
  });

  if (!currentUser || !currentUser.isActive) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
    return { ok: true, actorId: session.user.id };
  }

  if (
    currentUser.role === 'MANAGER' &&
    currentUser.canManageCarRentalContent &&
    serviceSlug === 'car-rental'
  ) {
    return { ok: true, actorId: session.user.id };
  }

  return { ok: false, status: 403, error: 'Access denied' };
}
