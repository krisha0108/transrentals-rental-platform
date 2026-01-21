import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

// GET - Get settings for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Parse config JSON if exists
    const config = parseJsonField<Record<string, any>>(service.config, {});

    // Return settings (combining service fields and config)
    const settings = {
      // From service model
      isEnabled: service.isActive,
      displayOrder: service.displayOrder,
      flowType: service.flowType,

      // From config JSON
      isFeatured: config.isFeatured ?? false,
      allowOnlineBooking: config.allowOnlineBooking ?? true,
      requireVerification: config.requireVerification ?? false,
      requireDeposit: config.requireDeposit ?? true,
      depositAmount: config.depositAmount ?? 2000,
      minBookingHours: config.minBookingHours ?? 4,
      maxBookingDays: config.maxBookingDays ?? 30,
      advanceBookingDays: config.advanceBookingDays ?? 90,
      cancellationHours: config.cancellationHours ?? 24,
      showPricing: config.showPricing ?? true,
      showReviews: config.showReviews ?? true,
      showVendorInfo: config.showVendorInfo ?? true,
      showAvailability: config.showAvailability ?? true,
      emailNotifications: config.emailNotifications ?? true,
      smsNotifications: config.smsNotifications ?? true,
      adminAlerts: config.adminAlerts ?? true,

      // SEO settings
      metaTitle: service.metaTitle,
      metaDescription: service.metaDescription,
    };

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        flowType: service.flowType,
      },
      settings,
    });
  } catch (error: any) {
    logger.error('Service settings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update service settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const body = await request.json();

    // Find the service
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Separate service model fields from config fields
    const {
      isEnabled,
      displayOrder,
      metaTitle,
      metaDescription,
      ...configFields
    } = body;

    // Get existing config
    const existingConfig = parseJsonField<Record<string, any>>(service.config, {});

    // Merge config fields
    const newConfig = {
      ...existingConfig,
      ...configFields,
    };

    // Update service
    const updatedService = await prisma.services.update({
      where: { slug },
      data: {
        isActive: isEnabled !== undefined ? isEnabled : service.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : service.displayOrder,
        metaTitle: metaTitle !== undefined ? metaTitle : service.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : service.metaDescription,
        config: JSON.stringify(newConfig),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      service: {
        id: updatedService.id,
        name: updatedService.name,
        slug: updatedService.slug,
      },
    });
  } catch (error: any) {
    logger.error('Service settings update error', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error?.message },
      { status: 500 }
    );
  }
}
