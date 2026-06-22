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
        vendor_tag_assignments: {
          select: { tag: true },
        },
        vendor_contact_change_requests: {
          where: { status: 'PENDING' },
          orderBy: { requestedAt: 'desc' },
          take: 1,
          select: { id: true, newEmail: true, newPhone: true, requestedAt: true },
        },
        vendor_fleets: {
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle_models: {
              select: {
                name: true,
                sideImage: true,
                fuelType: true,
                transmission: true,
                seatingCapacity: true,
                engineCC: true,
                brands: { select: { name: true, logo: true } },
              },
            },
            services: { select: { name: true } },
            brands: { select: { name: true, logo: true } },
            chauffeur_vehicle_categories: { select: { name: true } },
            vendor_fleet_locations: {
              include: {
                locations: { select: { name: true } },
              },
            },
          },
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
      vendor_fleets,
      admin_users,
      vendor_tag_assignments,
      vendor_contact_change_requests,
      _count,
      ...rest
    } = vendor;

    const safeVendor = {
      ...rest,
      tags: (vendor_tag_assignments || []).map((t: any) => t.tag),
      contactChangeRequest: vendor_contact_change_requests?.[0] ?? null,
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
      fleets: (vendor_fleets || []).map((f: any) => {
        let images = null;
        try {
          if (f.images && typeof f.images === 'string' && f.images !== 'null') {
            images = JSON.parse(f.images);
          }
        } catch {}
        return {
          id: f.id,
          isActive: f.isActive,
          isAvailable: f.isAvailable,
          registrationNumber: f.registrationNumber || null,
          vehicleName: f.vehicle_models?.name || f.vehicleName || 'Unknown',
          brandName: f.vehicle_models?.brands?.name || f.brands?.name || null,
          brandLogo: f.vehicle_models?.brands?.logo || f.brands?.logo || null,
          categoryName: f.chauffeur_vehicle_categories?.name || null,
          serviceName: f.services?.name || null,
          sideImage: f.vehicle_models?.sideImage || null,
          images,
          fuelType: f.vehicle_models?.fuelType || f.fuelType || null,
          transmission: f.vehicle_models?.transmission || f.transmission || null,
          seatingCapacity: f.vehicle_models?.seatingCapacity || f.seatingCapacity || null,
          engineCC: f.vehicle_models?.engineCC || null,
          color: f.color || null,
          yearOfManufacture: f.yearOfManufacture || null,
          vehicleCondition: f.vehicleCondition || null,
          createdAt: f.createdAt,
          locations: f.vendor_fleet_locations.map((fl: any) => fl.locations.name),
        };
      }),
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
    const { action, rejectionReason, newEmail, newPhone } = body;

    const vendor = await prisma.vendors.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Direct contact change by admin
    if (action === 'CHANGE_CONTACT') {
      const email = newEmail?.trim().toLowerCase() || null;
      const phone = newPhone?.trim() || null;

      if (!email && !phone) {
        return NextResponse.json({ error: 'Provide at least one of email or phone' }, { status: 400 });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      if (email) {
        const clash = await prisma.vendors.findFirst({ where: { email, NOT: { id } } });
        if (clash) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      if (phone) {
        const clash = await prisma.vendors.findFirst({ where: { phone, NOT: { id } } });
        if (clash) return NextResponse.json({ error: 'Phone already in use' }, { status: 409 });
      }

      const contactUpdate: any = {};
      if (email) contactUpdate.email = email;
      if (phone) contactUpdate.phone = phone;

      const updated = await prisma.vendors.update({ where: { id }, data: contactUpdate });
      const { password: _p, ...safe } = updated;
      logger.info('Admin directly changed vendor contact', { vendorId: id, adminId: session.user.id });
      return NextResponse.json(safe);
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
