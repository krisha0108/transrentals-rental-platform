import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Admin view of every vehicle vendors have added to their own fleet.
// The per-service /admin/services/[slug]/fleet screens list vehicle_models —
// the catalogue we publish — which is a different thing: this reads
// vendor_fleets, the actual vehicles each vendor owns, and always carries the
// owning vendor along so "who added what" is answerable from one place.

// Vendor-uploaded images are stored either as a JSON object keyed by angle
// ({front, back, ...}) or as a plain array, depending on how old the row is.
// Both shapes collapse to "the first usable image" for a list view.
//
// Not everything stored there can be shown. Rows saved from the vendor app
// sometimes hold the phone's own cache path (file:// or content://), which the
// browser refuses outright, and some hold the whole photo inline as a base64
// data URI — one row in production carries ~380KB that way, so letting those
// through would put megabytes of base64 into a single page of this list. A
// real uploaded path always wins; a data URI is a last resort and only while
// it stays small; anything else falls back to the placeholder icon.
const MAX_INLINE_IMAGE_CHARS = 30_000;

function usableImage(value: unknown): { path?: string; inline?: string } | null {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith('/')) return { path: value };
  if (value.startsWith('http://') || value.startsWith('https://')) return { path: value };
  if (value.startsWith('data:image') && value.length <= MAX_INLINE_IMAGE_CHARS) {
    return { inline: value };
  }
  // file://, content://, oversized data URIs, junk — not servable here.
  return null;
}

function firstImage(images: string | null): string | null {
  if (!images) return null;

  let candidates: unknown[];
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      candidates = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Front-facing angles first, then whatever else the row happens to hold.
      const preferred = ['front', 'main', 'exterior', 'side', 'back', 'interior'];
      const rest = Object.keys(parsed).filter((k) => !preferred.includes(k));
      candidates = [...preferred, ...rest].map((k) => (parsed as Record<string, unknown>)[k]);
    } else {
      candidates = [parsed];
    }
  } catch {
    // Not JSON — older rows sometimes hold a bare path.
    candidates = [images];
  }

  const usable = candidates.map(usableImage).filter(Boolean) as Array<{
    path?: string;
    inline?: string;
  }>;

  return usable.find((u) => u.path)?.path || usable.find((u) => u.inline)?.inline || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const vendorId = searchParams.get('vendorId') || '';
    const serviceId = searchParams.get('serviceId') || '';
    const status = searchParams.get('status') || 'ALL';
    const verified = searchParams.get('verified') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const conditions: any[] = [];

    if (vendorId) conditions.push({ vendorId });
    if (serviceId) conditions.push({ serviceId });

    if (status === 'active') conditions.push({ isActive: true });
    else if (status === 'inactive') conditions.push({ isActive: false });

    if (verified === 'verified') conditions.push({ isVerified: true });
    else if (verified === 'unverified') conditions.push({ isVerified: false });

    // Search spans both the vehicle and the vendor who added it, so an admin
    // can look up "MH12 AB 1234" or "Sharma Travels" in the same box.
    if (search) {
      conditions.push({
        OR: [
          { vehicleName: { contains: search } },
          { registrationNumber: { contains: search } },
          { chauffeurName: { contains: search } },
          { parkingCity: { contains: search } },
          { vehicle_models: { name: { contains: search } } },
          { brands: { name: { contains: search } } },
          { vendors: { businessName: { contains: search } } },
          { vendors: { ownerName: { contains: search } } },
          { vendors: { phone: { contains: search } } },
        ],
      });
    }

    const where = conditions.length ? { AND: conditions } : {};

    const [rows, total, activeCount, verifiedCount, vendorGroups, services, allVendorGroups] =
      await Promise.all([
        prisma.vendor_fleets.findMany({
          where,
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                ownerName: true,
                email: true,
                phone: true,
                city: true,
                status: true,
              },
            },
            services: { select: { id: true, name: true, slug: true } },
            vehicle_models: { select: { id: true, name: true } },
            brands: { select: { id: true, name: true, logo: true } },
            chauffeur_vehicle_categories: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.vendor_fleets.count({ where }),
        prisma.vendor_fleets.count({ where: { AND: [...conditions, { isActive: true }] } }),
        prisma.vendor_fleets.count({ where: { AND: [...conditions, { isVerified: true }] } }),
        // "Which vendor added how many" — the counts drive the by-vendor view
        // and the vendor filter, so they follow the same filters as the list
        // but ignore pagination.
        prisma.vendor_fleets.groupBy({
          by: ['vendorId'],
          where,
          _count: { _all: true },
          orderBy: { _count: { vendorId: 'desc' } },
          take: 200,
        }),
        prisma.services.findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        }),
        // The vendor filter's own options. Deliberately unfiltered: if this
        // followed the current filters, choosing a vendor would collapse the
        // list to that one vendor and choosing a service would reshuffle it,
        // so the control would move under the cursor. byVendor below stays
        // filtered — that one is a view of the results, not a way to pick.
        prisma.vendor_fleets.groupBy({
          by: ['vendorId'],
          _count: { _all: true },
          orderBy: { _count: { vendorId: 'desc' } },
          take: 500,
        }),
      ]);

    // One lookup covering both group-bys, rather than a join per row.
    const groupVendorIds = Array.from(
      new Set([...vendorGroups, ...allVendorGroups].map((g) => g.vendorId))
    );
    const groupVendors = groupVendorIds.length
      ? await prisma.vendors.findMany({
          where: { id: { in: groupVendorIds } },
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            city: true,
            status: true,
          },
        })
      : [];
    const vendorById = new Map(groupVendors.map((v) => [v.id, v]));

    const fleet = rows.map((row) => ({
      id: row.id,
      vehicleName:
        row.vehicleName || row.vehicle_models?.name || row.registrationNumber || 'Unnamed vehicle',
      registrationNumber: row.registrationNumber,
      modelName: row.vehicle_models?.name || null,
      brandName: row.brands?.name || null,
      categoryName: row.chauffeur_vehicle_categories?.name || null,
      serviceName: row.services?.name || null,
      serviceSlug: row.services?.slug || null,
      image: firstImage(row.images),
      seatingCapacity: row.seatingCapacity,
      fuelType: row.fuelType,
      transmission: row.transmission,
      yearOfManufacture: row.yearOfManufacture,
      parkingCity: row.parkingCity || row.baseLocation,
      isActive: row.isActive,
      isAvailable: row.isAvailable,
      isVerified: row.isVerified,
      totalTrips: row.totalTrips,
      createdAt: row.createdAt,
      vendor: row.vendors
        ? {
            id: row.vendors.id,
            businessName: row.vendors.businessName,
            ownerName: row.vendors.ownerName,
            email: row.vendors.email,
            phone: row.vendors.phone,
            city: row.vendors.city,
            status: row.vendors.status,
          }
        : null,
    }));

    const byVendor = vendorGroups
      .map((g) => {
        const v = vendorById.get(g.vendorId);
        return {
          vendorId: g.vendorId,
          businessName: v?.businessName || 'Unknown vendor',
          ownerName: v?.ownerName || null,
          phone: v?.phone || null,
          city: v?.city || null,
          status: v?.status || null,
          fleetCount: g._count._all,
        };
      })
      .sort((a, b) => b.fleetCount - a.fleetCount);

    const vendorOptions = allVendorGroups
      .map((g) => ({
        vendorId: g.vendorId,
        businessName: vendorById.get(g.vendorId)?.businessName || 'Unknown vendor',
        fleetCount: g._count._all,
      }))
      .sort((a, b) => a.businessName.localeCompare(b.businessName));

    return NextResponse.json({
      fleet,
      byVendor,
      vendorOptions,
      services,
      summary: {
        total,
        active: activeCount,
        inactive: total - activeCount,
        verified: verifiedCount,
        unverified: total - verifiedCount,
        vendorsWithFleet: byVendor.length,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    logger.error('Get vendor fleet error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor fleet', details: error?.message },
      { status: 500 }
    );
  }
}
