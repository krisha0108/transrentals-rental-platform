// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - Get vendor's luxury quote templates
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;


    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const whereClause: any = { vendorId: vendorId };
    if (category) whereClause.category = category;
    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const templates = await prisma.vendor_luxury_templates.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        baseAmount: t.baseAmount,
        chauffeurCharges: t.chauffeurCharges,
        decorationCharges: t.decorationCharges,
        perKmRate: t.perKmRate,
        perHourRate: t.perHourRate,
        includedKm: t.includedKm,
        includedHours: t.includedHours,
        extraKmRate: t.extraKmRate,
        extraHourRate: t.extraHourRate,
        inclusions: t.inclusions ? JSON.parse(t.inclusions) : [],
        exclusions: t.exclusions ? JSON.parse(t.exclusions) : [],
        termsConditions: t.termsConditions ? JSON.parse(t.termsConditions) : [],
        tripTypes: t.tripTypes ? JSON.parse(t.tripTypes) : [],
        occasions: t.occasions ? JSON.parse(t.occasions) : [],
        isActive: t.isActive,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor luxury templates', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new luxury quote template
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const {
      name,
      category,
      baseAmount,
      chauffeurCharges = 0,
      decorationCharges = 0,
      perKmRate,
      perHourRate,
      includedKm,
      includedHours,
      extraKmRate,
      extraHourRate,
      inclusions = [],
      exclusions = [],
      termsConditions = [],
      tripTypes = [],
      occasions = [],
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !category || !baseAmount) {
      return NextResponse.json(
        { error: 'Name, category, and base amount are required' },
        { status: 400 }
      );
    }

    const template = await prisma.vendor_luxury_templates.create({
      data: {
        id: generateId(),
        vendorId: vendorId,
        name,
        category,
        baseAmount,
        chauffeurCharges,
        decorationCharges,
        perKmRate: perKmRate || null,
        perHourRate: perHourRate || null,
        includedKm: includedKm || null,
        includedHours: includedHours || null,
        extraKmRate: extraKmRate || null,
        extraHourRate: extraHourRate || null,
        inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions,
        exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions,
        termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : termsConditions,
        tripTypes: Array.isArray(tripTypes) ? JSON.stringify(tripTypes) : tripTypes,
        occasions: Array.isArray(occasions) ? JSON.stringify(occasions) : occasions,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        baseAmount: template.baseAmount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create luxury template', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error?.message },
      { status: 500 }
    );
  }
}
