import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Mirrors /api/admin/drivers/[id] but gated behind the MANAGER role.
// Drivers come from two tables — the UI passes `?source=standalone|vendor`
// to route to the right one. If the param is missing we try standalone first
// then fall back to vendor_staff so older links keep working.
type DriverSource = 'standalone' | 'vendor';

function resolveSource(searchParams: URLSearchParams): DriverSource | null {
  const raw = (searchParams.get('source') || '').toLowerCase();
  if (raw === 'vendor' || raw === 'standalone') return raw;
  return null;
}

// Status PATCH translates the 4-state vocab to whichever enum the
// underlying table actually uses.
const STANDALONE_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
function mapStatusForVendorStaff(uiStatus: string): string | null {
  // 'SUSPENDED' chip maps to vendor_staff.TERMINATED (closest equivalent).
  // 'PENDING' is not representable in vendor_staff — we reject it.
  switch (uiStatus) {
    case 'ACTIVE': return 'ACTIVE';
    case 'INACTIVE': return 'INACTIVE';
    case 'SUSPENDED': return 'TERMINATED';
    case 'ON_LEAVE': return 'ON_LEAVE';
    case 'TERMINATED': return 'TERMINATED';
    default: return null;
  }
}

async function getStandaloneDriver(id: string) {
  const driver = await prisma.drivers.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, profilePhoto: true,
      dateOfBirth: true, address: true, city: true, state: true, pincode: true,
      role: true, status: true, joiningDate: true, salary: true,
      aadharNumber: true, aadharDocument: true, panNumber: true, panDocument: true,
      licenseNumber: true, licenseType: true, licenseExpiry: true, licenseDocument: true,
      bankName: true, accountHolderName: true, accountNumber: true, ifscCode: true,
      emergencyContact: true, emergencyPhone: true,
      lastLoginAt: true, createdAt: true, did: true,
    },
  });
  if (!driver) return null;

  const [vehicles, recentBookings, totalBookings] = await Promise.all([
    prisma.driver_vehicles.findMany({
      where: { driverId: id },
      select: {
        id: true, make: true, model: true, year: true, registrationNo: true,
        color: true, category: true, seatingCapacity: true, fuelType: true, isActive: true,
        insuranceNumber: true, insuranceExpiry: true, rcNumber: true, rcExpiry: true,
        fitnessExpiry: true, permitExpiry: true,
      },
      orderBy: { isActive: 'desc' },
    }),
    prisma.chauffeur_bookings.findMany({
      where: { acceptedDriverId: id },
      select: {
        id: true, bookingNumber: true, customerName: true,
        pickupCity: true, dropCity: true, pickupDate: true,
        status: true, grandTotal: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.chauffeur_bookings.count({ where: { acceptedDriverId: id } }),
  ]);

  return {
    source: 'standalone' as const,
    driver: { ...driver, vendor: null as null | { id: string; businessName: string } },
    vehicles,
    recentBookings,
    totalBookings,
  };
}

async function getVendorStaffDriver(id: string) {
  const staff = await prisma.vendor_staff.findUnique({
    where: { id },
    select: {
      id: true, vendorId: true,
      name: true, email: true, phone: true, profilePhoto: true,
      dateOfBirth: true, address: true, city: true, state: true, pincode: true,
      role: true, status: true, joiningDate: true, salary: true,
      aadharNumber: true, aadharDocument: true, panNumber: true, panDocument: true,
      licenseNumber: true, licenseType: true, licenseExpiry: true, licenseDocument: true,
      bankName: true, accountHolderName: true, accountNumber: true, ifscCode: true,
      emergencyContact: true, emergencyPhone: true,
      lastLoginAt: true, createdAt: true, did: true,
      vendors: { select: { id: true, businessName: true } },
    },
  });
  if (!staff) return null;

  // vendor_staff has multiple booking relations (b2b_trips, truck_bookings,
  // direct bookings via assignedDriverId). For the recent-list view we union
  // chauffeur direct bookings since those are the most common driver assignments.
  const [vehicles, directBookings, b2bTripsCount, truckBookingsCount, directBookingsCount] = await Promise.all([
    prisma.driver_vehicles.findMany({
      where: { staffId: id },
      select: {
        id: true, make: true, model: true, year: true, registrationNo: true,
        color: true, category: true, seatingCapacity: true, fuelType: true, isActive: true,
        insuranceNumber: true, insuranceExpiry: true, rcNumber: true, rcExpiry: true,
        fitnessExpiry: true, permitExpiry: true,
      },
      orderBy: { isActive: 'desc' },
    }),
    prisma.vendor_direct_bookings.findMany({
      where: { assignedDriverId: id },
      select: {
        id: true, bookingNumber: true, customerName: true,
        pickupLocation: true, dropLocation: true, pickupDate: true,
        status: true, totalAmount: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => [] as any[]),
    prisma.b2b_trips.count({ where: { driverStaffId: id } }).catch(() => 0),
    prisma.truck_bookings.count({ where: { assignedDriverId: id } }).catch(() => 0),
    prisma.vendor_direct_bookings.count({ where: { assignedDriverId: id } }).catch(() => 0),
  ]);

  // Normalize vendor_direct_bookings into the shape the page expects
  // (pickupCity/dropCity/grandTotal). pickupLocation/dropLocation here are
  // LongText address blobs; we surface them under the same key the UI reads.
  const normalizedBookings = (directBookings as any[]).map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    customerName: b.customerName,
    pickupCity: b.pickupLocation || '',
    dropCity: b.dropLocation || null,
    pickupDate: b.pickupDate,
    status: b.status,
    grandTotal: b.totalAmount || 0,
    createdAt: b.createdAt,
  }));

  return {
    source: 'vendor' as const,
    driver: {
      ...staff,
      vendor: staff.vendors,
    },
    vehicles,
    recentBookings: normalizedBookings,
    totalBookings: b2bTripsCount + truckBookingsCount + directBookingsCount,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const source = resolveSource(searchParams);

    // Try the requested source first; if not specified, probe standalone then vendor.
    let result =
      source === 'vendor' ? await getVendorStaffDriver(id) :
      source === 'standalone' ? await getStandaloneDriver(id) :
      await getStandaloneDriver(id) || await getVendorStaffDriver(id);

    if (!result) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

    // Manager-managed CRM tags for this driver, keyed by (driverId, source).
    // Guard the delegate in case the client predates the new model.
    const driverTags = (prisma as any).driver_tag_assignments;
    const tagRows = driverTags
      ? await driverTags.findMany({
          where: { driverId: id, source: result.source },
          select: { tag: true },
        }).catch(() => [] as any[])
      : [];

    return NextResponse.json({ ...result, tags: tagRows.map((t: any) => t.tag) });
  } catch (error) {
    console.error('Manager driver detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const source = resolveSource(searchParams);
    const body = await request.json().catch(() => ({}));
    const newStatus = String(body?.status || '').toUpperCase();

    // If source missing, detect which table the id belongs to.
    let effectiveSource: DriverSource | null = source;
    if (!effectiveSource) {
      const inDrivers = await prisma.drivers.findUnique({ where: { id }, select: { id: true } });
      effectiveSource = inDrivers ? 'standalone' : 'vendor';
    }

    if (effectiveSource === 'standalone') {
      if (!STANDALONE_STATUSES.includes(newStatus as any)) {
        return NextResponse.json(
          { error: `Invalid status. Expected one of ${STANDALONE_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      const existing = await prisma.drivers.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      const updated = await prisma.drivers.update({
        where: { id },
        data: { status: newStatus as any },
        select: { id: true, status: true, name: true },
      });

      // Manager accountability log — mirrors the contact-inquiry status-change
      // pattern so this shows up on the admin Manager Performance pages.
      prisma.manager_action_logs.create({
        data: {
          recordType: 'DRIVER',
          serviceType: 'standalone',
          recordId: id,
          actionType: 'STATUS_CHANGED',
          previousStatus: existing.status,
          newStatus,
          note: `Status changed: ${existing.status} → ${newStatus}`,
          managerId: session.user.id,
        },
      }).catch((err) => console.error('[Manager Driver] action log failed', err));

      return NextResponse.json({ success: true, source: 'standalone', driver: updated });
    }

    // vendor_staff path
    const mapped = mapStatusForVendorStaff(newStatus);
    if (!mapped) {
      return NextResponse.json(
        { error: `Status "${newStatus}" is not supported for vendor-managed drivers. Use ACTIVE, INACTIVE, SUSPENDED, or ON_LEAVE.` },
        { status: 400 }
      );
    }
    const existing = await prisma.vendor_staff.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    const updated = await prisma.vendor_staff.update({
      where: { id },
      data: { status: mapped as any },
      select: { id: true, status: true, name: true },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'DRIVER',
        serviceType: 'vendor',
        recordId: id,
        actionType: 'STATUS_CHANGED',
        previousStatus: existing.status,
        newStatus: mapped,
        note: `Status changed: ${existing.status} → ${mapped}`,
        managerId: session.user.id,
      },
    }).catch((err) => console.error('[Manager Driver] action log failed', err));

    return NextResponse.json({ success: true, source: 'vendor', driver: updated });
  } catch (error) {
    console.error('Manager driver status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
