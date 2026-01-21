// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { id } = params;

    const template = await prisma.vendor_self_drive_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        vehicleTypes: template.vehicleTypes ? JSON.parse(template.vehicleTypes) : [],
        inclusions: template.inclusions ? JSON.parse(template.inclusions) : [],
        exclusions: template.exclusions ? JSON.parse(template.exclusions) : [],
        termsConditions: template.termsConditions ? JSON.parse(template.termsConditions) : [],
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch template', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (same as PUT for compatibility)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// PUT - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { id } = params;

    // Verify template belongs to vendor
    const existingTemplate = await prisma.vendor_self_drive_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      category,
      description,
      vehicleTypes,
      inclusions,
      exclusions,
      termsConditions,
      dailyRateHint,
      kmLimitPerDayHint,
      extraKmRateHint,
      securityDepositHint,
      isActive,
      isDefault,
    } = body;

    // If setting as default, unset any existing default for this category
    if (isDefault && !existingTemplate.isDefault) {
      const categoryToUse = category || existingTemplate.category;
      await prisma.vendor_self_drive_templates.updateMany({
        where: {
          vendorId: vendorId,
          category: categoryToUse,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (vehicleTypes !== undefined) updateData.vehicleTypes = Array.isArray(vehicleTypes) ? JSON.stringify(vehicleTypes) : vehicleTypes;
    if (inclusions !== undefined) updateData.inclusions = Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions;
    if (exclusions !== undefined) updateData.exclusions = Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions;
    if (termsConditions !== undefined) updateData.termsConditions = Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : termsConditions;
    if (dailyRateHint !== undefined) updateData.dailyRateHint = dailyRateHint;
    if (kmLimitPerDayHint !== undefined) updateData.kmLimitPerDayHint = kmLimitPerDayHint;
    if (extraKmRateHint !== undefined) updateData.extraKmRateHint = extraKmRateHint;
    if (securityDepositHint !== undefined) updateData.securityDepositHint = securityDepositHint;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const template = await prisma.vendor_self_drive_templates.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template,
    });
  } catch (error: any) {
    logger.error('Failed to update template', error);
    return NextResponse.json(
      { error: 'Failed to update template', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { id } = params;

    // Verify template belongs to vendor
    const existingTemplate = await prisma.vendor_self_drive_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.vendor_self_drive_templates.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete template', error);
    return NextResponse.json(
      { error: 'Failed to delete template', details: error?.message },
      { status: 500 }
    );
  }
}
