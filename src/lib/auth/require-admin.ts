import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * Resolve the signed-in admin, or null.
 *
 * The role on the session token is not trusted on its own — it is re-read
 * from the database, so revoking someone's admin role takes effect on their
 * next request rather than whenever their token happens to expire.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;

  return user;
}
