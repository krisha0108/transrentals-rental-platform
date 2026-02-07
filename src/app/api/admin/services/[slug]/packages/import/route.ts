// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// POST - Import packages from CSV
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSlug = params.slug;

    // Get service type from slug
    let serviceType: 'CAR_RENTAL' | 'LUXURY_CAR_RENTAL';
    if (serviceSlug === 'car-rental') {
      serviceType = 'CAR_RENTAL';
    } else if (serviceSlug === 'luxury-car-rental') {
      serviceType = 'LUXURY_CAR_RENTAL';
    } else {
      return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({
        error: 'CSV file is empty or invalid',
        success: false
      }, { status: 400 });
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);

    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    // Get all categories and locations for lookup
    const [categories, locations] = await Promise.all([
      prisma.chauffeur_vehicle_categories.findMany({
        where: { serviceType },
        select: { id: true, slug: true, name: true },
      }),
      prisma.locations.findMany({
        select: { id: true, slug: true, name: true },
      }),
    ]);

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    const locationMap = new Map(locations.map(l => [l.slug, l.id]));

    // Process each row
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const rowNum = i + 2; // +2 because of header row and 0-index
      const values = line.split(',').map(v => v.trim());

      try {
        // Parse row values
        const [
          categorySlug,
          locationSlug,
          name,
          hours,
          kms,
          basePrice,
          extraKmCharge,
          extraHourCharge,
          nightChargesApply,
          nightChargeAmount,
          isPopular,
          isActive,
          displayOrder,
        ] = values;

        // Validate required fields
        if (!categorySlug) {
          errors.push(`Row ${rowNum}: Vehicle category is required`);
          failed++;
          continue;
        }

        if (!hours || !kms || !basePrice) {
          errors.push(`Row ${rowNum}: Hours, kilometers, and base price are required`);
          failed++;
          continue;
        }

        // Get category ID
        const vehicleCategoryId = categoryMap.get(categorySlug.toLowerCase());
        if (!vehicleCategoryId) {
          errors.push(`Row ${rowNum}: Invalid vehicle category '${categorySlug}'`);
          failed++;
          continue;
        }

        // Get location ID (optional)
        let locationId = null;
        if (locationSlug && locationSlug !== '') {
          locationId = locationMap.get(locationSlug.toLowerCase());
          if (!locationId) {
            errors.push(`Row ${rowNum}: Invalid location '${locationSlug}'`);
            failed++;
            continue;
          }
        }

        // Parse numbers
        const hoursNum = parseInt(hours);
        const kmsNum = parseInt(kms);
        const basePriceNum = parseFloat(basePrice);
        const extraKmChargeNum = parseFloat(extraKmCharge || '0');
        const extraHourChargeNum = parseFloat(extraHourCharge || '0');
        const nightChargeAmountNum = parseFloat(nightChargeAmount || '0');
        const displayOrderNum = parseInt(displayOrder || '0');

        // Parse booleans
        const nightChargesApplyBool = nightChargesApply?.toLowerCase() === 'true';
        const isPopularBool = isPopular?.toLowerCase() === 'true';
        const isActiveBool = isActive?.toLowerCase() !== 'false'; // Default to true

        // Validate numbers
        if (isNaN(hoursNum) || isNaN(kmsNum) || isNaN(basePriceNum)) {
          errors.push(`Row ${rowNum}: Invalid number format for hours, kms, or base price`);
          failed++;
          continue;
        }

        // Check if package already exists
        const existing = await prisma.local_packages.findFirst({
          where: {
            vehicleCategoryId,
            locationId: locationId || null,
            hours: hoursNum,
          },
        });

        if (existing) {
          errors.push(
            `Row ${rowNum}: Package already exists for this category, location, and hours`
          );
          failed++;
          continue;
        }

        // Create package
        await prisma.local_packages.create({
          data: {
            id: generateId(),
            vehicleCategoryId,
            locationId,
            name: name || `${hoursNum}hr/${kmsNum}km`,
            hours: hoursNum,
            kms: kmsNum,
            basePrice: basePriceNum,
            extraKmCharge: extraKmChargeNum,
            extraHourCharge: extraHourChargeNum,
            nightChargesApply: nightChargesApplyBool,
            nightChargeAmount: nightChargesApplyBool ? nightChargeAmountNum : null,
            isPopular: isPopularBool,
            displayOrder: displayOrderNum,
            isActive: isActiveBool,
          },
        });

        imported++;
      } catch (error: any) {
        errors.push(`Row ${rowNum}: ${error.message || 'Failed to import'}`);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${imported} successful, ${failed} failed`,
      imported,
      failed,
      errors: errors.slice(0, 20), // Limit to first 20 errors
    });
  } catch (error: any) {
    console.error('Failed to import packages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import packages',
        details: error?.message
      },
      { status: 500 }
    );
  }
}
