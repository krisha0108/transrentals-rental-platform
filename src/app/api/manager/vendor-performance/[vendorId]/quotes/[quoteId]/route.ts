import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string; quoteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { vendorId, quoteId } = params;
    const serviceType = request.nextUrl.searchParams.get('type') || '';

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: { manager_locations: true },
    });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    let quote: any = null;

    switch (serviceType) {
      case 'BIKE':
        quote = await prisma.bike_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                locationName: true, pickupDate: true, dropDate: true,
                pickupTime: true, dropTime: true, totalDays: true,
                numberOfVehicles: true, helmetsRequired: true,
                vehicleCategory: true, budgetMin: true, budgetMax: true,
              },
            },
          },
        });
        if (quote) {
          const req = quote.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;
          return NextResponse.json({
            quote: {
              ...quote,
              serviceType: 'BIKE',
              request: req,
            },
          });
        }
        break;

      case 'CAR':
        quote = await prisma.self_drive_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                locationName: true, pickupDate: true, dropDate: true,
                pickupTime: true, dropTime: true, totalDays: true,
                vehicleCategory: true, fuelType: true, transmission: true,
                isDeliveryRequested: true, budgetMin: true, budgetMax: true,
              },
            },
          },
        });
        if (quote) {
          const req = quote.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;
          return NextResponse.json({ quote: { ...quote, serviceType: 'CAR', request: req } });
        }
        break;

      case 'BUS':
        quote = await prisma.bus_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                pickupCity: true, dropCity: true, pickupDate: true, pickupTime: true,
                returnDate: true, tripType: true, vehicleCategory: true, passengers: true,
              },
            },
          },
        });
        if (quote) {
          const req = quote.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests;
          return NextResponse.json({ quote: { ...quote, serviceType: 'BUS', request: req } });
        }
        break;

      case 'TRUCK':
        quote = await prisma.truck_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            truck_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                pickupCity: true, dropCity: true, pickupDate: true,
                goodsType: true, goodsDescription: true, vehicleCategory: true,
              },
            },
          },
        });
        if (quote) {
          return NextResponse.json({ quote: { ...quote, serviceType: 'TRUCK', request: quote.truck_quote_requests } });
        }
        break;

      case 'LUXURY':
        quote = await prisma.luxury_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            luxury_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                pickupCity: true, dropCity: true, pickupDate: true, pickupTime: true,
                tripType: true, occasion: true, vehicleCategory: true, passengers: true,
              },
            },
          },
        });
        if (quote) {
          return NextResponse.json({ quote: { ...quote, serviceType: 'LUXURY', request: quote.luxury_quote_requests } });
        }
        break;

      case 'PACKERS':
        quote = await prisma.packers_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            packers_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                pickupCity: true, dropCity: true, scheduledDate: true,
                shiftingType: true, propertySize: true,
              },
            },
          },
        });
        if (quote) {
          return NextResponse.json({ quote: { ...quote, serviceType: 'PACKERS', request: quote.packers_quote_requests } });
        }
        break;

      case 'EQUIPMENT':
        quote = await prisma.equipment_quotes.findFirst({
          where: { id: quoteId, vendorId },
          include: {
            equipment_quote_requests: {
              select: {
                customerName: true, customerPhone: true, customerEmail: true,
                deliveryCity: true, rentalDuration: true, startDate: true, endDate: true,
                equipmentCategory: true, equipmentType: true, quantity: true,
              },
            },
          },
        });
        if (quote) {
          return NextResponse.json({ quote: { ...quote, serviceType: 'EQUIPMENT', request: quote.equipment_quote_requests } });
        }
        break;
    }

    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  } catch (error: any) {
    logger.error('Error fetching quote detail:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
