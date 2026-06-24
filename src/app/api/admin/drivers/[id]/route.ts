import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Drivers come from two tables — the admin UI passes `?source=standalone|vendor`
// to route to the right one. If the param is missing we try standalone first
// then fall back to vendor_staff so older links keep working.
type DriverSource = 'standalone' | 'vendor';

function resolveSource(searchParams: URLSearchParams): DriverSource | null {
  const raw = (searchParams.get('source') || '').toLowerCase();
  if (raw === 'vendor' || raw === 'standalone') return raw;
  return null;
}

// Status PATCH translates the admin's 4-state vocab to whichever enum the
// underlying table actually uses.
const STANDALONE_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
function mapStatusForVendorStaff(uiStatus: string): string | null {
  // Admin's 'SUSPENDED' chip maps to vendor_staff.TERMINATED (closest equivalent).
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
      lastLoginAt: true, createdAt: true,
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
      id: true, vendorId: true, did: true,
      name: true, email: true, phone: true, profilePhoto: true,
      dateOfBirth: true, address: true, city: true, state: true, pincode: true,
      role: true, status: true, joiningDate: true, salary: true,
      aadharNumber: true, aadharDocument: true, panNumber: true, panDocument: true,
      licenseNumber: true, licenseType: true, licenseExpiry: true, licenseDocument: true,
      bankName: true, accountHolderName: true, accountNumber: true, ifscCode: true,
      emergencyContact: true, emergencyPhone: true,
      lastLoginAt: true, createdAt: true,
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const source = resolveSource(searchParams);

    // Try the requested source first; if not specified, probe standalone then vendor.
    let result =
      source === 'vendor' ? await getVendorStaffDriver(id) :
      source === 'standalone' ? await getStandaloneDriver(id) :
      await getStandaloneDriver(id) || await getVendorStaffDriver(id);

    if (!result) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin driver detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const source = resolveSource(searchParams);
    const body = await request.json().catch(() => ({}));

    // Detect which table this id belongs to if source not specified.
    let effectiveSource: DriverSource | null = source;
    if (!effectiveSource) {
      const inDrivers = await prisma.drivers.findUnique({ where: { id }, select: { id: true } });
      effectiveSource = inDrivers ? 'standalone' : 'vendor';
    }

    // ── Contact change ────────────────────────────────────────────────────────
    if (body.action === 'CHANGE_CONTACT') {
      const newEmail: string | undefined = body.newEmail?.trim() || undefined;
      const newPhone: string | undefined = body.newPhone?.trim() || undefined;
      if (!newEmail && !newPhone) {
        return NextResponse.json({ error: 'Provide at least one of newEmail or newPhone' }, { status: 400 });
      }

      if (effectiveSource === 'standalone') {
        const existing = await prisma.drivers.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        if (newEmail) {
          const clash = await prisma.drivers.findFirst({ where: { email: newEmail, NOT: { id } }, select: { id: true } });
          if (clash) return NextResponse.json({ error: 'Email already in use by another driver' }, { status: 400 });
        }
        const updated = await prisma.drivers.update({
          where: { id },
          data: { ...(newEmail && { email: newEmail }), ...(newPhone && { phone: newPhone }) },
          select: { id: true, email: true, phone: true, name: true },
        });
        return NextResponse.json({ success: true, source: 'standalone', driver: updated });
      }

      // vendor_staff path
      const existing = await prisma.vendor_staff.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      if (newEmail) {
        const clash = await prisma.vendor_staff.findFirst({ where: { email: newEmail, NOT: { id } }, select: { id: true } });
        if (clash) return NextResponse.json({ error: 'Email already in use by another driver' }, { status: 400 });
      }
      const updated = await prisma.vendor_staff.update({
        where: { id },
        data: { ...(newEmail && { email: newEmail }), ...(newPhone && { phone: newPhone }) },
        select: { id: true, email: true, phone: true, name: true },
      });
      return NextResponse.json({ success: true, source: 'vendor', driver: updated });
    }

    // ── Status change ─────────────────────────────────────────────────────────
    const newStatus = String(body?.status || '').toUpperCase();

    if (effectiveSource === 'standalone') {
      if (!STANDALONE_STATUSES.includes(newStatus as any)) {
        return NextResponse.json(
          { error: `Invalid status. Expected one of ${STANDALONE_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      const existing = await prisma.drivers.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      const updated = await prisma.drivers.update({
        where: { id },
        data: { status: newStatus as any },
        select: { id: true, status: true, name: true },
      });
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
    const existing = await prisma.vendor_staff.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    const updated = await prisma.vendor_staff.update({
      where: { id },
      data: { status: mapped as any },
      select: { id: true, status: true, name: true },
    });
    return NextResponse.json({ success: true, source: 'vendor', driver: updated });
  } catch (error) {
    console.error('Admin driver status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
