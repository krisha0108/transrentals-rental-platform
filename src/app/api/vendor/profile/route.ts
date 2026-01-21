import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor profile
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        email: true,
        phone: true,
        businessName: true,
        businessType: true,
        ownerName: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logo: true,
        description: true,
        website: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        accountHolderName: true,
        status: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
        rejectionReason: true,
        vendor_approved_services: {
          where: { isActive: true },
          select: {
            services: {
              select: {
                id: true,
                name: true,
                slug: true,
                services: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        vendor_approved_locations: {
          where: { isActive: true },
          select: {
            locations: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            vendor_approved_services: true,
            vendor_approved_locations: true,
            vendor_fleets: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get service IDs (both direct and parent IDs) - use IDs instead of slugs for stability
    const approvedServiceIds = vendor.vendor_approved_services.map((as) => {
      // Return parent ID if exists, otherwise service ID
      return as.services.services?.id || as.services.id;
    });
    // Remove duplicates
    const uniqueServiceIds = [...new Set(approvedServiceIds)];

    // Also get slugs for backward compatibility
    const approvedServiceSlugs = vendor.vendor_approved_services.map((as) => {
      return as.services.services?.slug || as.services.slug;
    });
    const uniqueServiceSlugs = [...new Set(approvedServiceSlugs)];

    // Get location IDs instead of slugs
    const approvedLocationIds = vendor.vendor_approved_locations.map((al) => al.locations.id);

    // Return with counts, IDs (primary) and slugs (backward compatibility)
    return NextResponse.json({
      ...vendor,
      approvedServicesCount: vendor._count.vendor_approved_services,
      approvedLocationsCount: vendor._count.vendor_approved_locations,
      fleetsCount: vendor._count.vendor_fleets,
      approvedServiceIds: uniqueServiceIds,
      approvedServiceSlugs: uniqueServiceSlugs, // kept for backward compatibility
      approvedLocationIds: approvedLocationIds,
      approvedLocationSlugs: vendor.vendor_approved_locations.map((al) => al.locations.slug),
    });
  } catch (error: any) {
    logger.error('Get vendor profile error', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json();
    const {
      businessName,
      businessType,
      ownerName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      description,
      website,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
    } = body;

    // Validate required fields
    if (businessName !== undefined && !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    if (ownerName !== undefined && !ownerName.trim()) {
      return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    }

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (businessType !== undefined) updateData.businessType = businessType || null;
    if (ownerName !== undefined) updateData.ownerName = ownerName.trim();
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber?.toUpperCase() || null;
    if (panNumber !== undefined) updateData.panNumber = panNumber?.toUpperCase() || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;
    if (description !== undefined) updateData.description = description || null;
    if (website !== undefined) updateData.website = website || null;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode?.toUpperCase() || null;
    if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName || null;

    const vendor = await prisma.vendors.update({
      where: { id: vendorId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        businessName: true,
        businessType: true,
        ownerName: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logo: true,
        description: true,
        website: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        accountHolderName: true,
        status: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
      },
    });

    return NextResponse.json(vendor);
  } catch (error: any) {
    logger.error('Update vendor profile error', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}
