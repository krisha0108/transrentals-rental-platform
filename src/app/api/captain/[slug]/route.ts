import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveAssetUrl } from '@/lib/utils';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function vehicleOut(v: any) {
  if (!v) return null;
  const photo = v.photoFront || v.photoRightSide || v.photoLeftSide || v.photoBack || null;
  return {
    make: v.make,
    model: v.model,
    registrationNo: v.registrationNo,
    coverImage: photo ? resolveAssetUrl(photo) : null,
  };
}

// PUBLIC — a driver's shareable profile (/captain/<slug>). Drivers exist as
// vendor_staff (employed) or drivers (independent); we resolve either, by slug
// or id. Hidden / inactive drivers 404.
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    // Try employed driver first, then independent.
    const staff = await prisma.vendor_staff.findFirst({
      where: { OR: [{ slug }, { id: slug }], role: 'DRIVER' },
      select: {
        id: true, slug: true, name: true, profilePhoto: true, city: true, state: true,
        bio: true, yearsExperience: true, licenseType: true, joiningDate: true,
        status: true, isProfilePublic: true,
        vendors: { select: { id: true, businessName: true, slug: true, logo: true, city: true } },
        driver_vehicles: {
          take: 1, orderBy: { createdAt: 'desc' },
          select: { make: true, model: true, registrationNo: true, photoFront: true, photoBack: true, photoLeftSide: true, photoRightSide: true },
        },
      },
    });

    let payload: any = null;

    if (staff) {
      if (!staff.isProfilePublic || staff.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Driver not available' }, { status: 404 });
      }
      const completedTrips = await prisma.vendor_direct_bookings.count({
        where: { assignedDriverId: staff.id, status: 'completed' },
      });
      payload = {
        driver: {
          id: staff.id,
          slug: staff.slug || staff.id,
          type: 'employed',
          name: staff.name,
          profilePhoto: staff.profilePhoto ? resolveAssetUrl(staff.profilePhoto) : null,
          city: staff.city,
          state: staff.state,
          bio: staff.bio,
          yearsExperience: staff.yearsExperience,
          licenseType: staff.licenseType,
          memberSince: staff.joiningDate,
          rating: null,
          totalRatings: 0,
          vendor: staff.vendors
            ? { id: staff.vendors.id, businessName: staff.vendors.businessName, slug: staff.vendors.slug, logo: staff.vendors.logo ? resolveAssetUrl(staff.vendors.logo) : null, city: staff.vendors.city }
            : null,
        },
        vehicle: vehicleOut(staff.driver_vehicles?.[0]),
        stats: { completedTrips },
      };
    } else {
      const indie = await prisma.drivers.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        select: {
          id: true, slug: true, name: true, profilePhoto: true, city: true, state: true,
          bio: true, yearsExperience: true, licenseType: true, joiningDate: true,
          status: true, isProfilePublic: true,
          driver_vehicles: {
            take: 1, orderBy: { createdAt: 'desc' },
            select: { make: true, model: true, registrationNo: true, photoFront: true, photoBack: true, photoLeftSide: true, photoRightSide: true },
          },
        },
      });

      if (!indie) {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }
      if (!indie.isProfilePublic || indie.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Driver not available' }, { status: 404 });
      }

      // Independent drivers carry ratings on completed chauffeur trips.
      const [completedTrips, ratingAgg] = await Promise.all([
        prisma.chauffeur_bookings.count({ where: { acceptedDriverId: indie.id, status: 'COMPLETED' } }),
        prisma.chauffeur_bookings.aggregate({
          where: { acceptedDriverId: indie.id, driverRating: { not: null } },
          _avg: { driverRating: true },
          _count: { driverRating: true },
        }),
      ]);

      payload = {
        driver: {
          id: indie.id,
          slug: indie.slug || indie.id,
          type: 'independent',
          name: indie.name,
          profilePhoto: indie.profilePhoto ? resolveAssetUrl(indie.profilePhoto) : null,
          city: indie.city,
          state: indie.state,
          bio: indie.bio,
          yearsExperience: indie.yearsExperience,
          licenseType: indie.licenseType,
          memberSince: indie.joiningDate,
          rating: ratingAgg._avg.driverRating ?? null,
          totalRatings: ratingAgg._count.driverRating ?? 0,
          vendor: null,
        },
        vehicle: vehicleOut(indie.driver_vehicles?.[0]),
        stats: { completedTrips },
      };
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    logger.error('Public driver profile error', error);
    return NextResponse.json(
      { error: 'Failed to load driver profile', details: error?.message },
      { status: 500 },
    );
  }
}
