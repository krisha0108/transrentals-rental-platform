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

// GET - Get pricing config for a specific service
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

    // Parse pricing config from service.config JSON
    const config = parseJsonField<Record<string, any>>(service.config, {});
    const pricingConfig = config.pricing || {} as Record<string, any>;

    // Default pricing structure
    const pricing = {
      basePricing: {
        minPrice: pricingConfig.minPrice ?? 500,
        maxPrice: pricingConfig.maxPrice ?? 50000,
        displayFormat: pricingConfig.displayFormat ?? 'Per Day',
        commission: pricingConfig.commission ?? 15,
      },
      additionalCharges: {
        extraKmRate: pricingConfig.extraKmRate ?? 5,
        nightCharges: pricingConfig.nightCharges ?? 200,
        securityDeposit: pricingConfig.securityDeposit ?? 2000,
        cleaningFee: pricingConfig.cleaningFee ?? 300,
        lateFee: pricingConfig.lateFee ?? 500,
      },
      pricingRules: pricingConfig.rules ?? [
        { id: '1', name: 'Weekend Surge', type: 'SURGE', value: 20, unit: 'PERCENT', conditions: 'Sat-Sun', isActive: true },
        { id: '2', name: 'Weekly Discount', type: 'DISCOUNT', value: 10, unit: 'PERCENT', conditions: '7+ days', isActive: true },
        { id: '3', name: 'Monthly Discount', type: 'DISCOUNT', value: 20, unit: 'PERCENT', conditions: '30+ days', isActive: true },
      ],
      tripTypeMultipliers: pricingConfig.tripTypeMultipliers ?? {},
    };

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        flowType: service.flowType,
      },
      pricing,
    });
  } catch (error: any) {
    logger.error('Service pricing error', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update pricing config
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

    // Get existing config
    const existingConfig = parseJsonField<Record<string, any>>(service.config, {});

    // Build new pricing config
    const {
      basePricing,
      additionalCharges,
      pricingRules,
      tripTypeMultipliers,
    } = body;

    const newPricingConfig: Record<string, any> = {
      ...existingConfig.pricing,
    };

    // Merge base pricing
    if (basePricing) {
      newPricingConfig.minPrice = basePricing.minPrice;
      newPricingConfig.maxPrice = basePricing.maxPrice;
      newPricingConfig.displayFormat = basePricing.displayFormat;
      newPricingConfig.commission = basePricing.commission;
    }

    // Merge additional charges
    if (additionalCharges) {
      newPricingConfig.extraKmRate = additionalCharges.extraKmRate;
      newPricingConfig.nightCharges = additionalCharges.nightCharges;
      newPricingConfig.securityDeposit = additionalCharges.securityDeposit;
      newPricingConfig.cleaningFee = additionalCharges.cleaningFee;
      newPricingConfig.lateFee = additionalCharges.lateFee;
    }

    // Update pricing rules
    if (pricingRules) {
      newPricingConfig.rules = pricingRules;
    }

    // Update trip type multipliers
    if (tripTypeMultipliers) {
      newPricingConfig.tripTypeMultipliers = tripTypeMultipliers;
    }

    // Update service config
    const newConfig = {
      ...existingConfig,
      pricing: newPricingConfig,
    };

    await prisma.services.update({
      where: { slug },
      data: { config: JSON.stringify(newConfig) },
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing updated successfully',
    });
  } catch (error: any) {
    logger.error('Service pricing update error', error);
    return NextResponse.json(
      { error: 'Failed to update pricing', details: error?.message },
      { status: 500 }
    );
  }
}
