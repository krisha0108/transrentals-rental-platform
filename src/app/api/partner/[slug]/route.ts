import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveAssetUrl } from '@/lib/utils';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// vendor_fleets.images is a JSON blob keyed by angle (front/back/...) or an
// array. Return every usable photo (angle order preserved) so the card can
// show an image slider.
function allImages(raw: any): string[] {
  if (!raw) return [];
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(obj)) return obj.filter(Boolean).map((p: string) => resolveAssetUrl(p));
    const order = ['front', 'back', 'leftSide', 'rightSide', 'inside'];
    const ordered = order.filter((k) => obj[k]).map((k) => obj[k]);
    // Include any extra keys we don't know about, after the known angles.
    const extras = Object.entries(obj)
      .filter(([k, v]) => v && !order.includes(k))
      .map(([, v]) => v as string);
    return [...ordered, ...extras].filter(Boolean).map((p: string) => resolveAssetUrl(p));
  } catch {
    return [];
  }
}

// PUBLIC — vendor's shareable rental-partner profile (/partner/<slug>).
// Mirrors the travel-agent /api/agent/[slug] contract. Hidden / blocked
// vendors 404 so the link simply looks dead.
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    const vendor = await prisma.vendors.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: {
        id: true, slug: true, businessName: true, businessType: true, ownerName: true,
        logo: true, description: true, website: true, phone: true, email: true,
        city: true, state: true, pincode: true, address: true, status: true,
        rating: true, totalRatings: true, createdAt: true, isProfilePublic: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    if (!vendor.isProfilePublic || ['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(vendor.status as any)) {
      return NextResponse.json({ error: 'Vendor not available' }, { status: 404 });
    }

    const [fleetRows, completedTrips] = await Promise.all([
      prisma.vendor_fleets.findMany({
        where: { vendorId: vendor.id, isActive: true, isAvailable: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: {
          id: true, vehicleName: true, color: true, fuelType: true, transmission: true,
          seatingCapacity: true, luggageCapacity: true, yearOfManufacture: true,
          chauffeurIncluded: true, baseLocation: true, avgRating: true, images: true,
          brands: { select: { name: true } },
          vehicle_models: { select: { name: true } },
          services: { select: { name: true } },
        },
      }),
      prisma.vendor_direct_bookings.count({
        where: { vendorId: vendor.id, status: 'completed' },
      }),
    ]);

    const fleet = fleetRows.map((f) => {
      // vendor_fleets.vehicleName is usually blank; the real label lives on the
      // linked brand and/or vehicle model. Build a sensible display name and
      // fold the brand into it (so the card doesn't duplicate it).
      const displayName =
        f.vehicleName?.trim() ||
        [f.brands?.name, f.vehicle_models?.name].filter(Boolean).join(' ').trim() ||
        null;
      return {
      id: f.id,
      vehicleName: displayName,
      brand: null as string | null,
      serviceType: f.services?.name ?? null,
      color: f.color,
      fuelType: f.fuelType,
      transmission: f.transmission,
      seatingCapacity: f.seatingCapacity,
      luggageCapacity: f.luggageCapacity,
      yearOfManufacture: f.yearOfManufacture,
      chauffeurIncluded: f.chauffeurIncluded,
      baseLocation: f.baseLocation,
      rating: f.avgRating,
      images: allImages(f.images),
      };
    });

    // Distinct services this vendor serves, derived from their fleet.
    const services = Array.from(
      new Set(fleetRows.map((f) => f.services?.name).filter(Boolean) as string[]),
    );

    const memberSinceMonths = Math.max(
      1,
      Math.floor((Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        slug: vendor.slug || vendor.id,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        ownerName: vendor.ownerName,
        logo: vendor.logo ? resolveAssetUrl(vendor.logo) : null,
        description: vendor.description,
        website: vendor.website,
        phone: vendor.phone,
        email: vendor.email,
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
        address: vendor.address,
        status: vendor.status,
        isVerified: vendor.status === 'APPROVED',
        rating: vendor.rating,
        totalRatings: vendor.totalRatings,
        memberSince: vendor.createdAt,
        memberSinceMonths,
      },
      fleet,
      services,
      stats: {
        fleetCount: fleet.length,
        servicesCount: services.length,
        completedTrips,
      },
    });
  } catch (error: any) {
    logger.error('Public vendor profile error', error);
    return NextResponse.json(
      { error: 'Failed to load vendor profile', details: error?.message },
      { status: 500 },
    );
  }
}
