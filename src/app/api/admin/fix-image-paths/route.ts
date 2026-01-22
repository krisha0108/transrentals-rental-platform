import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * Admin API to diagnose and fix image path issues
 * GET - Check current image paths
 * POST - Fix invalid image paths
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check vehicle_models sideImage paths
    const vehicleModels = await prisma.vehicle_models.findMany({
      where: {
        serviceId: 'SVC_1',
        sideImage: { not: null },
      },
      select: {
        id: true,
        name: true,
        sideImage: true,
      },
      take: 50,
    });

    // Check bank_details QR codes
    const bankDetails = await prisma.bank_details.findMany({
      select: {
        id: true,
        bankName: true,
        upiId: true,
        upiQrCode: true,
      },
    });

    // Check vendor_fleets images
    const vendorFleets = await prisma.vendor_fleets.findMany({
      where: {
        serviceId: 'SVC_1',
        images: { not: null },
      },
      select: {
        id: true,
        registrationNumber: true,
        images: true,
      },
      take: 20,
    });

    // Analyze paths
    const analysis = {
      vehicleModels: {
        total: vehicleModels.length,
        issues: vehicleModels.filter((v) => {
          const img = v.sideImage;
          return img && !img.startsWith('http') && !img.startsWith('/');
        }),
      },
      bankDetails: {
        total: bankDetails.length,
        issues: bankDetails.filter((b) => {
          const qr = b.upiQrCode;
          return qr && qr !== '' && !qr.startsWith('http') && !qr.startsWith('/');
        }),
      },
      vendorFleets: {
        total: vendorFleets.length,
        issues: vendorFleets.filter((f) => {
          const imgs = f.images;
          return imgs === 'null' || imgs === '[]' || imgs === '';
        }),
      },
    };

    return NextResponse.json({
      success: true,
      analysis,
      vehicleModels: vehicleModels.slice(0, 10),
      bankDetails: bankDetails.slice(0, 5),
      vendorFleets: vendorFleets.slice(0, 10),
    });
  } catch (error: any) {
    logger.error('Image path check error', error);
    return NextResponse.json(
      { error: 'Failed to check image paths', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can run fixes' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    let result: any = {};

    if (action === 'fix-all' || action === 'fix-qr-codes') {
      // Fix invalid QR code URLs
      const qrResult = await prisma.$executeRaw`
        UPDATE bank_details
        SET upiQrCode = NULL
        WHERE upiQrCode IS NOT NULL
          AND upiQrCode != ''
          AND upiQrCode NOT LIKE 'http%'
          AND upiQrCode NOT LIKE '/uploads/%'
      `;
      result.qrCodesFix = qrResult;
    }

    if (action === 'fix-all' || action === 'fix-vehicle-images') {
      // Fix relative paths in vehicle_models.sideImage
      const imgResult = await prisma.$executeRaw`
        UPDATE vehicle_models
        SET sideImage = CONCAT('/', sideImage)
        WHERE sideImage IS NOT NULL
          AND sideImage != ''
          AND sideImage NOT LIKE 'http%'
          AND sideImage NOT LIKE '/%'
      `;
      result.vehicleImagesFix = imgResult;
    }

    if (action === 'fix-all' || action === 'fix-fleet-images') {
      // Fix null string values in vendor_fleets.images
      const fleetResult = await prisma.$executeRaw`
        UPDATE vendor_fleets
        SET images = NULL
        WHERE images = 'null' OR images = '[]' OR images = ''
      `;
      result.fleetImagesFix = fleetResult;
    }

    return NextResponse.json({
      success: true,
      message: 'Image paths fixed successfully',
      result,
    });
  } catch (error: any) {
    logger.error('Image path fix error', error);
    return NextResponse.json(
      { error: 'Failed to fix image paths', details: error?.message },
      { status: 500 }
    );
  }
}
