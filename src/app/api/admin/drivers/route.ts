import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - list drivers for the admin dashboard.
//
// Combines two sources into one unified list:
//   - `drivers` table (standalone drivers self-registered via the driver app)
//   - `vendor_staff` WHERE role='DRIVER' (drivers added by vendors to their fleet)
//
// Each row carries a `source` field ('standalone' | 'vendor') so the UI can
// surface the vendor name and route to the right detail variant.
//
// Status filter mapping (UI chip → underlying enum values):
//   PENDING   → drivers.PENDING (vendor_staff has no equivalent)
//   ACTIVE    → drivers.ACTIVE + vendor_staff.ACTIVE
//   SUSPENDED → drivers.SUSPENDED + vendor_staff.TERMINATED
//   INACTIVE  → drivers.INACTIVE + vendor_staff.INACTIVE + vendor_staff.ON_LEAVE
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusChip = (searchParams.get('status') || 'all').toUpperCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Translate the UI status chip into per-table status filters.
    let driverStatusIn: string[] | null = null;
    let staffStatusIn: string[] | null = null;
    let includeStandalone = true;
    let includeVendor = true;

    if (statusChip === 'PENDING') {
      driverStatusIn = ['PENDING'];
      includeVendor = false; // vendor_staff has no PENDING state
    } else if (statusChip === 'ACTIVE') {
      driverStatusIn = ['ACTIVE'];
      staffStatusIn = ['ACTIVE'];
    } else if (statusChip === 'SUSPENDED') {
      driverStatusIn = ['SUSPENDED'];
      staffStatusIn = ['TERMINATED'];
    } else if (statusChip === 'INACTIVE') {
      driverStatusIn = ['INACTIVE'];
      staffStatusIn = ['INACTIVE', 'ON_LEAVE'];
    }

    const driverWhere: any = {};
    if (driverStatusIn) driverWhere.status = { in: driverStatusIn };
    if (search) {
      driverWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { licenseNumber: { contains: search } },
      ];
    }

    const staffWhere: any = { role: 'DRIVER' };
    if (staffStatusIn) staffWhere.status = { in: staffStatusIn };
    if (search) {
      staffWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { licenseNumber: { contains: search } },
        { did: { contains: search } },
      ];
    }

    // For pagination, we fetch enough from each side that any interleaving still
    // produces the correct sorted page slice. `page * limit` is the smallest
    // amount that guarantees correctness; for moderate dataset sizes this is
    // acceptable. If volumes grow, switch to a UNION via $queryRaw.
    const upperBound = page * limit;

    const [
      driverRows, driverTotal,
      staffRows, staffTotal,
      // Stats across both tables (unaffected by status filter so the chips
      // always show the correct counts to switch into).
      driverPending, driverActive, driverSuspended, driverInactive,
      staffActive, staffOnLeave, staffInactive, staffTerminated,
    ] = await Promise.all([
      includeStandalone ? prisma.drivers.findMany({
        where: driverWhere,
        select: {
          id: true, name: true, email: true, phone: true, profilePhoto: true,
          city: true, state: true, status: true,
          licenseNumber: true, licenseExpiry: true,
          joiningDate: true, lastLoginAt: true, createdAt: true,
          _count: { select: { chauffeur_bookings: true, driver_vehicles: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: includeVendor ? upperBound : upperBound, // fetch up to upperBound either way
      }) : Promise.resolve([] as any[]),
      includeStandalone ? prisma.drivers.count({ where: driverWhere }) : Promise.resolve(0),

      includeVendor ? prisma.vendor_staff.findMany({
        where: staffWhere,
        select: {
          id: true, did: true, name: true, email: true, phone: true, profilePhoto: true,
          city: true, state: true, status: true,
          licenseNumber: true, licenseExpiry: true,
          joiningDate: true, lastLoginAt: true, createdAt: true,
          vendorId: true,
          vendors: { select: { id: true, businessName: true } },
          _count: { select: { driver_vehicles: true, b2b_trips: true, truck_bookings: true, assigned_bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: upperBound,
      }) : Promise.resolve([] as any[]),
      includeVendor ? prisma.vendor_staff.count({ where: staffWhere }) : Promise.resolve(0),

      prisma.drivers.count({ where: { status: 'PENDING' } }),
      prisma.drivers.count({ where: { status: 'ACTIVE' } }),
      prisma.drivers.count({ where: { status: 'SUSPENDED' } }),
      prisma.drivers.count({ where: { status: 'INACTIVE' } }),
      prisma.vendor_staff.count({ where: { role: 'DRIVER', status: 'ACTIVE' } }),
      prisma.vendor_staff.count({ where: { role: 'DRIVER', status: 'ON_LEAVE' } }),
      prisma.vendor_staff.count({ where: { role: 'DRIVER', status: 'INACTIVE' } }),
      prisma.vendor_staff.count({ where: { role: 'DRIVER', status: 'TERMINATED' } }),
    ]);

    // Normalize both sources into one shape with `source` and an effectiveStatus
    // mapped to the admin UI status vocabulary (PENDING/ACTIVE/SUSPENDED/INACTIVE).
    const standaloneNormalized = (driverRows as any[]).map((d) => ({
      id: d.id,
      did: null as string | null,
      source: 'standalone' as const,
      name: d.name,
      email: d.email,
      phone: d.phone,
      profilePhoto: d.profilePhoto,
      city: d.city,
      state: d.state,
      status: d.status,
      effectiveStatus: d.status, // already in admin vocab
      licenseNumber: d.licenseNumber,
      licenseExpiry: d.licenseExpiry,
      joiningDate: d.joiningDate,
      lastLoginAt: d.lastLoginAt,
      createdAt: d.createdAt,
      vendorId: null as string | null,
      vendorName: null as string | null,
      bookingsCount: d._count.chauffeur_bookings,
      vehiclesCount: d._count.driver_vehicles,
    }));

    const vendorStaffNormalized = (staffRows as any[]).map((s) => {
      // Map vendor_staff status into the admin's 4-state vocab so filter chips work.
      const effectiveStatus =
        s.status === 'ACTIVE' ? 'ACTIVE'
        : s.status === 'TERMINATED' ? 'SUSPENDED'
        : 'INACTIVE'; // INACTIVE + ON_LEAVE
      return {
        id: s.id,
        did: s.did ?? null,
        source: 'vendor' as const,
        name: s.name,
        email: s.email,
        phone: s.phone,
        profilePhoto: s.profilePhoto,
        city: s.city,
        state: s.state,
        status: s.status,
        effectiveStatus,
        licenseNumber: s.licenseNumber,
        licenseExpiry: s.licenseExpiry,
        joiningDate: s.joiningDate,
        lastLoginAt: s.lastLoginAt,
        createdAt: s.createdAt,
        vendorId: s.vendorId,
        vendorName: s.vendors?.businessName ?? null,
        bookingsCount: (s._count.b2b_trips || 0) + (s._count.truck_bookings || 0) + (s._count.assigned_bookings || 0),
        vehiclesCount: s._count.driver_vehicles,
      };
    });

    const merged = [...standaloneNormalized, ...vendorStaffNormalized]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Slice to the requested page after merging both sources.
    const total = driverTotal + staffTotal;
    const startIdx = (page - 1) * limit;
    const paged = merged.slice(startIdx, startIdx + limit);

    const totalAll =
      driverPending + driverActive + driverSuspended + driverInactive +
      staffActive + staffOnLeave + staffInactive + staffTerminated;

    return NextResponse.json({
      drivers: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalAll,
        pending: driverPending,
        active: driverActive + staffActive,
        suspended: driverSuspended + staffTerminated,
        inactive: driverInactive + staffInactive + staffOnLeave,
      },
    });
  } catch (error) {
    console.error('Admin drivers list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
