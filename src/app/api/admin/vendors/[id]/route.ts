import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// GET - Get single vendor with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const vendor = await prisma.vendors.findUnique({
      where: { id },
      include: {
        vendor_documents: {
          include: {
            admin_users: {
              select: { id: true, name: true, email: true },
            },
            uploadedByAdmin: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        vendor_service_requests: {
          include: {
            services: true,
            admin_users: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        vendor_location_requests: {
          include: {
            locations: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                locations: {
                  select: { name: true },
                },
              },
            },
            admin_users: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        vendor_approved_services: {
          include: {
            services: true,
          },
        },
        vendor_approved_locations: {
          include: {
            locations: {
              include: {
                locations: {
                  select: { name: true },
                },
              },
            },
          },
        },
        admin_users: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            vendor_fleets: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Remove password and transform field names for frontend compatibility
    const {
      password,
      vendor_documents,
      vendor_service_requests,
      vendor_location_requests,
      vendor_approved_services,
      vendor_approved_locations,
      admin_users,
      _count,
      ...rest
    } = vendor;

    const safeVendor = {
      ...rest,
      documents: vendor_documents?.map((doc: any) => ({
        ...doc,
        verifiedBy: doc.admin_users,
        uploadedBy: doc.uploadedByAdmin,
        admin_users: undefined,
        uploadedByAdmin: undefined,
      })),
      serviceRequests: vendor_service_requests?.map((req: any) => ({
        ...req,
        service: req.services,
        reviewedBy: req.admin_users,
        services: undefined,
        admin_users: undefined,
      })),
      locationRequests: vendor_location_requests?.map((req: any) => ({
        ...req,
        location: req.locations ? {
          ...req.locations,
          parent: req.locations.locations,
          locations: undefined,
        } : null,
        reviewedBy: req.admin_users,
        locations: undefined,
        admin_users: undefined,
      })),
      approvedServices: vendor_approved_services?.map((item: any) => ({
        ...item,
        service: item.services,
        services: undefined,
      })),
      approvedLocations: vendor_approved_locations?.map((item: any) => ({
        ...item,
        location: item.locations ? {
          ...item.locations,
          parent: item.locations.locations,
          locations: undefined,
        } : null,
        locations: undefined,
      })),
      approvedBy: admin_users,
      _count: {
        fleets: _count?.vendor_fleets || 0,
      },
    };

    return NextResponse.json(safeVendor);
  } catch (error: any) {
    logger.error('Get vendor error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update vendor status (approve/reject/suspend)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    const vendor = await prisma.vendors.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'APPROVE':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: session.user.id,
          rejectionReason: null,
        };
        break;
      case 'REJECT':
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }
        updateData = {
          status: 'REJECTED',
          rejectionReason,
          approvedAt: null,
          approvedById: session.user.id,
        };
        break;
      case 'SUSPEND':
        updateData = {
          status: 'SUSPENDED',
        };
        break;
      case 'UNSUSPEND':
        updateData = {
          status: 'APPROVED',
        };
        break;
      case 'BLOCK':
        updateData = {
          status: 'BLOCKED',
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedVendor = await prisma.vendors.update({
      where: { id },
      data: updateData,
    });

    // Notify vendor based on action
    const notifyMap: Record<string, { title: string; body: string; type: string }> = {
      APPROVE: {
        title: '🎉 Account Approved! You\'re Live',
        body: 'Congratulations! Your vendor account has been approved. You can now log in to the app and start managing bookings, quotes, and more.',
        type: 'account_approved',
      },
      REJECT: {
        title: '❌ Account Application Rejected',
        body: `Your vendor account application was rejected. Reason: ${rejectionReason || 'Please contact support for more information.'}.`,
        type: 'account_rejected',
      },
      SUSPEND: {
        title: '⚠️ Account Suspended',
        body: 'Your vendor account has been suspended. Please contact support for more information.',
        type: 'account_suspended',
      },
      UNSUSPEND: {
        title: '✅ Account Reinstated',
        body: 'Your vendor account has been reinstated. You can now resume accepting bookings.',
        type: 'account_reinstated',
      },
      BLOCK: {
        title: '🚫 Account Blocked',
        body: 'Your vendor account has been blocked. Please contact support.',
        type: 'account_blocked',
      },
    };

    if (notifyMap[action]) {
      const { title, body, type } = notifyMap[action];
      sendVendorDirectNotification({ vendorId: id, title, body, type, serviceType: 'general' })
        .catch((err: any) => console.error('[VendorStatus] Notify failed:', err));
    }

    const { password, ...safeVendor } = updatedVendor;

    return NextResponse.json(safeVendor);
  } catch (error: any) {
    logger.error('Update vendor error', error);
    return NextResponse.json(
      { error: 'Failed to update vendor', details: error?.message },
      { status: 500 }
    );
  }
}
