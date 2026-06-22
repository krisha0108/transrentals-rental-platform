import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { vendorId } = params;

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: { manager_locations: true },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    const vendor = await prisma.vendors.findFirst({
      where: {
        id: vendorId,
        vendor_approved_locations: { some: { locationId: { in: assignedLocationIds } } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found or access denied.' }, { status: 404 });
    }

    const [bikeQuotes, carQuotes, busQuotes, truckQuotes, luxuryQuotes, packersQuotes, equipmentQuotes] =
      await Promise.all([
        prisma.bike_quotes.findMany({
          where: { vendorId },
          include: {
            bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, locationName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.self_drive_quotes.findMany({
          where: { vendorId },
          include: {
            self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, locationName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bus_quotes.findMany({
          where: { vendorId },
          include: {
            bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, pickupCity: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.truck_quotes.findMany({
          where: { vendorId },
          include: {
            truck_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, pickupCity: true, dropCity: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.luxury_quotes.findMany({
          where: { vendorId },
          include: {
            luxury_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, pickupCity: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.packers_quotes.findMany({
          where: { vendorId },
          include: {
            packers_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, pickupCity: true, dropCity: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.equipment_quotes.findMany({
          where: { vendorId },
          include: {
            equipment_quote_requests: {
              select: { customerName: true, customerPhone: true, customerEmail: true, deliveryCity: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const allQuotes: any[] = [
      ...bikeQuotes.map((q) => {
        const req = q.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'BIKE',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory || '',
          totalAmount: q.grandTotal,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: q.sentAt,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req?.locationName || '',
        };
      }),
      ...carQuotes.map((q) => {
        const req = q.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'CAR',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory || '',
          totalAmount: q.grandTotal,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: q.sentAt,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req?.locationName || '',
        };
      }),
      ...busQuotes.map((q) => {
        const req = q.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'BUS',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory || '',
          totalAmount: q.totalAmount,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: q.sentAt,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req?.pickupCity || '',
        };
      }),
      ...truckQuotes.map((q) => {
        const req = q.truck_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'TRUCK',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory || '',
          totalAmount: q.totalAmount,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: null,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req ? `${req.pickupCity} → ${req.dropCity}` : '',
        };
      }),
      ...luxuryQuotes.map((q) => {
        const req = q.luxury_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'LUXURY',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory || '',
          totalAmount: q.totalAmount,
          advanceAmount: q.advanceAmount || 0,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: q.sentAt,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req?.pickupCity || '',
        };
      }),
      ...packersQuotes.map((q) => {
        const req = q.packers_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'PACKERS',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.vehicleType,
          vehicleCategory: '',
          totalAmount: q.totalAmount,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: null,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req ? `${req.pickupCity} → ${req.dropCity}` : '',
        };
      }),
      ...equipmentQuotes.map((q) => {
        const req = q.equipment_quote_requests;
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          serviceType: 'EQUIPMENT',
          status: q.status,
          customerName: req?.customerName || 'N/A',
          customerPhone: req?.customerPhone || '',
          customerEmail: req?.customerEmail || '',
          vehicleName: q.equipmentName,
          vehicleCategory: '',
          totalAmount: q.totalAmount,
          advanceAmount: q.advanceAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          sentAt: null,
          createdAt: q.createdAt,
          viewCount: q.viewCount,
          location: req?.deliveryCity || '',
        };
      }),
    ];

    allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Summary stats
    const stats = {
      total: allQuotes.length,
      sent: allQuotes.filter((q) => ['SENT', 'VIEWED'].includes(q.status)).length,
      accepted: allQuotes.filter((q) => q.status === 'ACCEPTED').length,
      rejected: allQuotes.filter((q) => q.status === 'REJECTED').length,
      expired: allQuotes.filter((q) => q.status === 'EXPIRED').length,
      draft: allQuotes.filter((q) => q.status === 'DRAFT').length,
    };

    return NextResponse.json({ quotes: allQuotes, vendorName: vendor.businessName, stats });
  } catch (error: any) {
    logger.error('Error fetching vendor quotes:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
