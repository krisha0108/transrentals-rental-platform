import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// Helper function to get all child location IDs recursively
async function getChildLocationIds(locationId: string): Promise<string[]> {
  const children = await prisma.locations.findMany({
    where: { parentId: locationId },
    select: { id: true },
  });

  let allIds: string[] = [];
  for (const child of children) {
    allIds.push(child.id);
    const grandChildren = await getChildLocationIds(child.id);
    allIds = allIds.concat(grandChildren);
  }
  return allIds;
}

// PUT - Approve/Reject location request (single, bulk, or cascading)
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

    const { id: vendorId } = await params;
    const body = await request.json();
    const { requestId, requestIds, action, rejectionReason, bulk, cascadeChildren } = body;

    // Handle bulk operations
    if (bulk && requestIds && Array.isArray(requestIds)) {
      // Get all pending location requests for bulk operation
      const pendingRequests = await prisma.vendor_location_requests.findMany({
        where: {
          id: { in: requestIds },
          vendorId,
          status: 'PENDING',
        },
        include: {
          locations: true,
        },
      });

      if (action === 'APPROVE_ALL') {
        // Update all requests to approved
        await prisma.vendor_location_requests.updateMany({
          where: {
            id: { in: requestIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: session.user.id,
            rejectionReason: null,
          },
        });

        // Create approved location entries for each
        for (const req of pendingRequests) {
          await prisma.vendor_approved_locations.upsert({
            where: {
              vendorId_locationId: {
                vendorId,
                locationId: req.locationId,
              },
            },
            update: { isActive: true },
            create: {
              id: generateId(),
              vendorId,
              locationId: req.locationId,
              isActive: true,
            },
          });
        }

        sendVendorDirectNotification({
          vendorId,
          title: '📍 Locations Approved',
          body: `${pendingRequests.length} location${pendingRequests.length > 1 ? 's have' : ' has'} been approved. You can now start accepting bookings in ${pendingRequests.length > 1 ? 'these areas' : pendingRequests[0]?.locations?.name || 'the approved area'}.`,
          type: 'location_approved',
          serviceType: 'general',
        }).catch((err: any) => console.error('[LocApprove] Vendor notify failed:', err));
        return NextResponse.json({ success: true, message: `Approved ${pendingRequests.length} location requests` });
      } else if (action === 'REJECT_ALL') {
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }
        await prisma.vendor_location_requests.updateMany({
          where: {
            id: { in: requestIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: session.user.id,
            rejectionReason,
          },
        });
        sendVendorDirectNotification({
          vendorId,
          title: '❌ Location Requests Rejected',
          body: `${pendingRequests.length} location request${pendingRequests.length > 1 ? 's have' : ' has'} been rejected. Reason: ${rejectionReason}.`,
          type: 'location_rejected',
          serviceType: 'general',
        }).catch((err: any) => console.error('[LocReject] Vendor notify failed:', err));
        return NextResponse.json({ success: true, message: `Rejected ${pendingRequests.length} location requests` });
      }
    }

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const locationRequest = await prisma.vendor_location_requests.findFirst({
      where: { id: requestId, vendorId },
      include: {
        locations: true,
      },
    });

    if (!locationRequest) {
      return NextResponse.json({ error: 'Location request not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Update request status
      await prisma.vendor_location_requests.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionReason: null,
        },
      });

      // Create approved location entry
      await prisma.vendor_approved_locations.upsert({
        where: {
          vendorId_locationId: {
            vendorId,
            locationId: locationRequest.locationId,
          },
        },
        update: { isActive: true },
        create: {
          id: generateId(),
          vendorId,
          locationId: locationRequest.locationId,
          isActive: true,
        },
      });

      sendVendorDirectNotification({
        vendorId,
        title: '📍 Location Approved',
        body: `Your request for ${locationRequest.locations?.name || 'the location'} has been approved. You can now start accepting bookings in this area.`,
        type: 'location_approved',
        serviceType: 'general',
      }).catch((err: any) => console.error('[LocApprove] Vendor notify failed:', err));

      // If cascadeChildren is true, also approve all child location requests
      if (cascadeChildren) {
        const childLocationIds = await getChildLocationIds(locationRequest.locationId);

        if (childLocationIds.length > 0) {
          // Find pending child location requests for this vendor
          const childRequests = await prisma.vendor_location_requests.findMany({
            where: {
              vendorId,
              locationId: { in: childLocationIds },
              status: 'PENDING',
            },
          });

          // Approve all child requests
          await prisma.vendor_location_requests.updateMany({
            where: {
              vendorId,
              locationId: { in: childLocationIds },
              status: 'PENDING',
            },
            data: {
              status: 'APPROVED',
              reviewedAt: new Date(),
              reviewedById: session.user.id,
              rejectionReason: null,
            },
          });

          // Create approved location entries for children
          for (const req of childRequests) {
            await prisma.vendor_approved_locations.upsert({
              where: {
                vendorId_locationId: {
                  vendorId,
                  locationId: req.locationId,
                },
              },
              update: { isActive: true },
              create: {
                id: generateId(),
                vendorId,
                locationId: req.locationId,
                isActive: true,
              },
            });
          }
        }
      }
    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.vendor_location_requests.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionReason,
        },
      });

      sendVendorDirectNotification({
        vendorId,
        title: '❌ Location Request Rejected',
        body: `Your request for ${locationRequest.locations?.name || 'the location'} was rejected. Reason: ${rejectionReason}.`,
        type: 'location_rejected',
        serviceType: 'general',
      }).catch((err: any) => console.error('[LocReject] Vendor notify failed:', err));

      // If cascadeChildren is true, also reject all child location requests
      if (cascadeChildren) {
        const childLocationIds = await getChildLocationIds(locationRequest.locationId);

        if (childLocationIds.length > 0) {
          await prisma.vendor_location_requests.updateMany({
            where: {
              vendorId,
              locationId: { in: childLocationIds },
              status: 'PENDING',
            },
            data: {
              status: 'REJECTED',
              reviewedAt: new Date(),
              reviewedById: session.user.id,
              rejectionReason,
            },
          });
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Update location request error', error);
    return NextResponse.json(
      { error: 'Failed to update location request', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove an approved location and notify vendor
export async function DELETE(
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

    const { id: vendorId } = await params;
    const { searchParams } = new URL(request.url);
    const approvedLocationId = searchParams.get('approvedLocationId');

    // Bulk delete — body contains approvedLocationIds array
    let bodyData: any = null;
    try { bodyData = await request.json(); } catch {}

    if (bodyData?.approvedLocationIds && Array.isArray(bodyData.approvedLocationIds)) {
      const ids: string[] = bodyData.approvedLocationIds;
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
      }
      const locations = await prisma.vendor_approved_locations.findMany({
        where: { id: { in: ids }, vendorId },
        include: { locations: { select: { name: true } } },
      });
      if (locations.length === 0) {
        return NextResponse.json({ error: 'No matching locations found' }, { status: 404 });
      }
      await prisma.vendor_approved_locations.updateMany({
        where: { id: { in: ids }, vendorId },
        data: { isActive: false },
      });
      const names = locations.map((l) => l.locations?.name).filter(Boolean);
      sendVendorDirectNotification({
        vendorId,
        title: '📍 Locations Removed',
        body: `${locations.length} location${locations.length > 1 ? 's have' : ' has'} been removed by the admin.`,
        type: 'location_rejected',
        serviceType: 'general',
      }).catch((err: any) => console.error('[LocBulkDelete] Vendor notify failed:', err));
      return NextResponse.json({ success: true, message: `Removed ${locations.length} locations` });
    }

    if (!approvedLocationId) {
      return NextResponse.json({ error: 'approvedLocationId is required' }, { status: 400 });
    }

    const approvedLocation = await prisma.vendor_approved_locations.findFirst({
      where: { id: approvedLocationId, vendorId },
      include: { locations: { select: { name: true } } },
    });

    if (!approvedLocation) {
      return NextResponse.json({ error: 'Approved location not found' }, { status: 404 });
    }

    await prisma.vendor_approved_locations.update({
      where: { id: approvedLocationId },
      data: { isActive: false },
    });

    const locationName = approvedLocation.locations?.name || 'the location';

    sendVendorDirectNotification({
      vendorId,
      title: '📍 Location Removed',
      body: `Your access to ${locationName} has been removed by the admin.`,
      type: 'location_rejected',
      serviceType: 'general',
    }).catch((err: any) => console.error('[LocDelete] Vendor notify failed:', err));

    return NextResponse.json({ success: true, message: 'Location removed successfully' });
  } catch (error: any) {
    logger.error('Delete approved location error', error);
    return NextResponse.json(
      { error: 'Failed to remove location', details: error?.message },
      { status: 500 }
    );
  }
}
