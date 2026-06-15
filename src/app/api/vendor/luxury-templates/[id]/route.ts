// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// GET - Get single template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;


    const { id } = await params;

    const template = await prisma.vendor_luxury_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        inclusions: template.inclusions ? JSON.parse(template.inclusions) : [],
        exclusions: template.exclusions ? JSON.parse(template.exclusions) : [],
        termsConditions: template.termsConditions ? JSON.parse(template.termsConditions) : [],
        tripTypes: template.tripTypes ? JSON.parse(template.tripTypes) : [],
        occasions: template.occasions ? JSON.parse(template.occasions) : [],
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury template', error);
    return NextResponse.json({ error: 'Failed to fetch template', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const { id } = await params;
    const body = await request.json();

    const template = await prisma.vendor_luxury_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const {
      name,
      category,
      baseAmount,
      chauffeurCharges,
      decorationCharges,
      perKmRate,
      perHourRate,
      includedKm,
      includedHours,
      extraKmRate,
      extraHourRate,
      inclusions,
      exclusions,
      termsConditions,
      tripTypes,
      occasions,
      isActive,
    } = body;

    const updatedTemplate = await prisma.vendor_luxury_templates.update({
      where: { id },
      data: {
        name: name ?? template.name,
        category: category ?? template.category,
        baseAmount: baseAmount ?? template.baseAmount,
        chauffeurCharges: chauffeurCharges ?? template.chauffeurCharges,
        decorationCharges: decorationCharges ?? template.decorationCharges,
        perKmRate: perKmRate !== undefined ? perKmRate : template.perKmRate,
        perHourRate: perHourRate !== undefined ? perHourRate : template.perHourRate,
        includedKm: includedKm !== undefined ? includedKm : template.includedKm,
        includedHours: includedHours !== undefined ? includedHours : template.includedHours,
        extraKmRate: extraKmRate !== undefined ? extraKmRate : template.extraKmRate,
        extraHourRate: extraHourRate !== undefined ? extraHourRate : template.extraHourRate,
        inclusions: inclusions !== undefined ? (Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions) : template.inclusions,
        exclusions: exclusions !== undefined ? (Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions) : template.exclusions,
        termsConditions: termsConditions !== undefined ? (Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : termsConditions) : template.termsConditions,
        tripTypes: tripTypes !== undefined ? (Array.isArray(tripTypes) ? JSON.stringify(tripTypes) : tripTypes) : template.tripTypes,
        occasions: occasions !== undefined ? (Array.isArray(occasions) ? JSON.stringify(occasions) : occasions) : template.occasions,
        isActive: isActive !== undefined ? isActive : template.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        category: updatedTemplate.category,
        baseAmount: updatedTemplate.baseAmount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update luxury template', error);
    return NextResponse.json({ error: 'Failed to update template', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const { id } = await params;

    const template = await prisma.vendor_luxury_templates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.vendor_luxury_templates.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete luxury template', error);
    return NextResponse.json({ error: 'Failed to delete template', details: error?.message }, { status: 500 });
  }
}
