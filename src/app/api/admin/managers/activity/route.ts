import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Vendor-creation and vendor-approval activity, grouped by manager/admin.
// Powers the admin "Manager Activity" tracking page.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const [createdVendors, approvedVendors] = await Promise.all([
      prisma.vendors.findMany({
        where: { createdById: { not: null } },
        select: {
          id: true,
          vid: true,
          businessName: true,
          ownerName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          createdByAdmin: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendors.findMany({
        where: { approvedById: { not: null } },
        select: {
          id: true,
          vid: true,
          businessName: true,
          ownerName: true,
          email: true,
          phone: true,
          status: true,
          approvedAt: true,
          admin_users: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { approvedAt: 'desc' },
      }),
    ]);

    // Summarize per manager/admin — counts for a quick overview at the top of the page.
    const byManager: Record<string, { id: string; name: string; email: string; role: string; created: number; approved: number }> = {};

    for (const v of createdVendors) {
      if (!v.createdByAdmin) continue;
      const m = v.createdByAdmin;
      if (!byManager[m.id]) byManager[m.id] = { id: m.id, name: m.name, email: m.email, role: m.role, created: 0, approved: 0 };
      byManager[m.id].created += 1;
    }
    for (const v of approvedVendors) {
      if (!v.admin_users) continue;
      const m = v.admin_users;
      if (!byManager[m.id]) byManager[m.id] = { id: m.id, name: m.name, email: m.email, role: m.role, created: 0, approved: 0 };
      byManager[m.id].approved += 1;
    }

    return NextResponse.json({
      summary: Object.values(byManager).sort((a, b) => (b.created + b.approved) - (a.created + a.approved)),
      created: createdVendors.map((v) => ({
        id: v.id,
        vid: v.vid,
        businessName: v.businessName,
        ownerName: v.ownerName,
        email: v.email,
        phone: v.phone,
        status: v.status,
        date: v.createdAt,
        by: v.createdByAdmin,
      })),
      approved: approvedVendors.map((v) => ({
        id: v.id,
        vid: v.vid,
        businessName: v.businessName,
        ownerName: v.ownerName,
        email: v.email,
        phone: v.phone,
        status: v.status,
        date: v.approvedAt,
        by: v.admin_users,
      })),
    });
  } catch (error: any) {
    logger.error('Manager activity fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager activity', details: error?.message },
      { status: 500 }
    );
  }
}
