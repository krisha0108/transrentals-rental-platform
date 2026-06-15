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

// GET - Get vendor's packers quote templates
export async function GET(request: NextRequest) {
  try {
    console.log('[Packers Templates GET] Starting...');
    const auth = await getVendorAuth(request);
    console.log('[Packers Templates GET] Auth:', { authenticated: auth.authenticated, vendorId: auth.vendorId });

    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;


    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const whereClause: any = { vendorId: vendorId };
    if (category) {
      whereClause.category = category;
    }
    if (activeOnly) {
      whereClause.isActive = true;
    }

    console.log('[Packers Templates GET] Fetching templates with where:', whereClause);
    const templates = await prisma.vendor_packers_templates.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    console.log('[Packers Templates GET] Found templates:', templates.length);

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        shiftingTypes: t.shiftingTypes ? JSON.parse(t.shiftingTypes) : [],
        inclusions: t.inclusions ? JSON.parse(t.inclusions) : [],
        exclusions: t.exclusions ? JSON.parse(t.exclusions) : [],
        termsConditions: t.termsConditions ? JSON.parse(t.termsConditions) : [],
        baseRateHint: t.baseRateHint,
        isActive: t.isActive,
        isDefault: t.isDefault,
        usageCount: t.usageCount,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Packers Templates GET] Error:', error);
    logger.error('Failed to fetch packers templates', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new packers quote template
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
      description,
      shiftingTypes,
      inclusions = [],
      exclusions = [],
      termsConditions = [],
      baseRateHint,
      isActive = true,
      isDefault = false,
    } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    if (!inclusions || inclusions.length === 0) {
      return NextResponse.json(
        { error: 'At least one inclusion is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default for this category
    if (isDefault) {
      await prisma.vendor_packers_templates.updateMany({
        where: {
          vendorId: vendorId,
          category,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create the template
    const template = await prisma.vendor_packers_templates.create({
      data: {
        id: generateId(),
        vendorId: vendorId,
        name,
        category,
        description: description || null,
        shiftingTypes: shiftingTypes ? (Array.isArray(shiftingTypes) ? JSON.stringify(shiftingTypes) : shiftingTypes) : null,
        inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions,
        exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions,
        termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : termsConditions,
        baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
        isActive,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        isActive: template.isActive,
        isDefault: template.isDefault,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create packers template', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error?.message },
      { status: 500 }
    );
  }
}
