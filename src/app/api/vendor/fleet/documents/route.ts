import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!, { allowSuspended: true });
    if (_guard.blocked) return _guard.response;

    const formData = await request.formData();
    const vendorFleetId = formData.get('vendorFleetId') as string;
    const documentType = formData.get('documentType') as string;
    const validity = formData.get('validity') as string;
    const provider = formData.get('provider') as string;
    const file = formData.get('photo') as File | null;

    if (!vendorFleetId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Vehicle and document type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['INSURANCE', 'FITNESS', 'PERMIT', 'RC'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id: vendorFleetId, vendorId: auth.vendorId },
    });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    switch (documentType) {
      case 'INSURANCE':
        if (!validity) {
          return NextResponse.json(
            { success: false, error: 'Validity date is required for Insurance' },
            { status: 400 }
          );
        }
        updateData.insuranceValidity = new Date(validity);
        if (provider) updateData.insuranceProvider = provider;
        break;
      case 'FITNESS':
        if (!validity) {
          return NextResponse.json(
            { success: false, error: 'Validity date is required for Fitness Certificate' },
            { status: 400 }
          );
        }
        updateData.fitnessValidity = new Date(validity);
        break;
      case 'PERMIT':
        if (!provider) {
          return NextResponse.json(
            { success: false, error: 'Permit type is required' },
            { status: 400 }
          );
        }
        updateData.permitType = provider;
        break;
      case 'RC':
        if (!provider) {
          return NextResponse.json(
            { success: false, error: 'Registration number is required' },
            { status: 400 }
          );
        }
        updateData.registrationNumber = provider;
        break;
    }

    // Handle optional photo upload
    if (file && file.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Only JPG, PNG, WebP and PDF files are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size must be under 5MB' },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'fleet-documents', auth.vendorId);
      await mkdir(uploadDir, { recursive: true });

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${vendorFleetId}_${documentType.toLowerCase()}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const imageUrl = `/uploads/fleet-documents/${auth.vendorId}/${fileName}`;

      const imageFieldMap: Record<string, string> = {
        INSURANCE: 'insuranceImage',
        FITNESS: 'fitnessImage',
        PERMIT: 'permitImage',
        RC: 'rcImage',
      };
      updateData[imageFieldMap[documentType]] = imageUrl;
    }

    await prisma.vendor_fleets.update({
      where: { id: vendorFleetId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fleet documents POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const fleet = await prisma.vendor_fleets.findMany({
      where: { vendorId: auth.vendorId, isActive: true },
      select: {
        id: true,
        vehicleName: true,
        registrationNumber: true,
        insuranceValidity: true,
        insuranceProvider: true,
        insuranceImage: true,
        fitnessValidity: true,
        fitnessImage: true,
        permitType: true,
        permitImage: true,
        rcImage: true,
        isVerified: true,
        vehicle_models: {
          select: { name: true, brands: { select: { name: true } } },
        },
        brands: { select: { name: true } },
        chauffeur_vehicle_categories: { select: { name: true } },
        services: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const vehicles = fleet.map((v: any) => {
      const vehicleName =
        v.vehicleName ||
        (v.vehicle_models
          ? `${v.vehicle_models.brands?.name || ''} ${v.vehicle_models.name}`.trim()
          : v.brands
            ? `${v.brands.name} ${v.chauffeur_vehicle_categories?.name || ''}`.trim()
            : 'Unknown Vehicle');

      const documents = [
        {
          type: 'INSURANCE',
          name: 'Vehicle Insurance',
          provider: v.insuranceProvider || null,
          validity: v.insuranceValidity,
          image: v.insuranceImage || null,
          status: v.insuranceValidity
            ? new Date(v.insuranceValidity) > now ? 'VALID' : 'EXPIRED'
            : 'NOT_UPLOADED',
        },
        {
          type: 'FITNESS',
          name: 'Fitness Certificate',
          provider: null,
          validity: v.fitnessValidity,
          image: v.fitnessImage || null,
          status: v.fitnessValidity
            ? new Date(v.fitnessValidity) > now ? 'VALID' : 'EXPIRED'
            : 'NOT_UPLOADED',
        },
        {
          type: 'PERMIT',
          name: 'Vehicle Permit',
          provider: v.permitType || null,
          validity: null,
          image: v.permitImage || null,
          status: v.permitType ? 'VALID' : 'NOT_UPLOADED',
        },
        {
          type: 'RC',
          name: 'Registration Certificate',
          provider: null,
          validity: null,
          image: v.rcImage || null,
          status: v.registrationNumber ? 'VALID' : 'NOT_UPLOADED',
        },
      ];

      return {
        id: v.id,
        vehicleName,
        registrationNumber: v.registrationNumber,
        service: v.services?.name,
        isVerified: v.isVerified,
        documents,
      };
    });

    const totalDocs = vehicles.length * 4;
    const validDocs = vehicles.reduce(
      (sum: number, v: any) => sum + v.documents.filter((d: any) => d.status === 'VALID').length, 0
    );
    const expiredDocs = vehicles.reduce(
      (sum: number, v: any) => sum + v.documents.filter((d: any) => d.status === 'EXPIRED').length, 0
    );
    const missingDocs = vehicles.reduce(
      (sum: number, v: any) => sum + v.documents.filter((d: any) => d.status === 'NOT_UPLOADED').length, 0
    );

    return NextResponse.json({
      success: true,
      vehicles,
      summary: { total: totalDocs, valid: validDocs, expired: expiredDocs, missing: missingDocs },
    });
  } catch (error) {
    console.error('Fleet documents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fleet documents' },
      { status: 500 }
    );
  }
}
