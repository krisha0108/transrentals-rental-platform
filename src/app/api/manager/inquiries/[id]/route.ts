import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single inquiry (quote request) detail with all vendor quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: requestId } = resolvedParams;

    logger.info('Fetching inquiry detail', { requestId });

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: {
          include: { locations: true },
        },
        manager_services: {
          include: { services: true },
        },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get assigned location IDs and names
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean);

    // Common includes
    const customerInclude = { select: { id: true, name: true, email: true, phone: true } };
    const locationInclude = { select: { id: true, name: true, slug: true } };
    const vendorInclude = { select: { id: true, businessName: true, phone: true, email: true } };

    // Search across all quote request tables
    const [
      bikeRequest,
      busRequest,
      selfDriveRequest,
      equipmentRequest,
      luxuryRequest,
      packersRequest,
      truckRequest,
    ] = await Promise.all([
      // Bike Quote Request
      prisma.bike_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch((err) => {
        logger.error('Error fetching bike quote request', err);
        return null;
      }),

      // Bus Quote Request
      prisma.bus_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),

      // Self Drive Quote Request
      prisma.self_drive_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),

      // Equipment Quote Request
      prisma.equipment_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          equipment_quotes: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),

      // Luxury Quote Request
      prisma.luxury_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          luxury_quotes: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),

      // Packers Quote Request
      prisma.packers_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          packers_quotes: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),

      // Truck Quote Request
      prisma.truck_quote_requests.findUnique({
        where: { id: requestId },
        include: {
          customers: customerInclude,
          truck_quotes: {
            include: {
              vendors: vendorInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }).catch(() => null),
    ]);

    // Find which request exists
    let request: any = null;
    let serviceName = '';
    let serviceSlug = '';
    let quotes: any[] = [];

    logger.info('Quote request search results', {
      bikeRequest: !!bikeRequest,
      busRequest: !!busRequest,
      selfDriveRequest: !!selfDriveRequest,
      equipmentRequest: !!equipmentRequest,
      luxuryRequest: !!luxuryRequest,
      packersRequest: !!packersRequest,
      truckRequest: !!truckRequest,
    });

    if (bikeRequest) {
      request = bikeRequest;
      serviceName = 'Bike Rental';
      serviceSlug = 'bike-rental';
      quotes = bikeRequest.bike_quotes_bike_quotes_requestIdTobike_quote_requests || [];
    } else if (busRequest) {
      request = busRequest;
      serviceName = 'Bus Rental';
      serviceSlug = 'bus-rental';
      quotes = busRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests || [];
    } else if (selfDriveRequest) {
      request = selfDriveRequest;
      serviceName = 'Self Drive';
      serviceSlug = 'self-drive';
      quotes = selfDriveRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests || [];
    } else if (equipmentRequest) {
      request = equipmentRequest;
      serviceName = 'Equipment Rental';
      serviceSlug = 'equipment-rental';
      quotes = equipmentRequest.equipment_quotes || [];
    } else if (luxuryRequest) {
      request = luxuryRequest;
      serviceName = 'Luxury Cars';
      serviceSlug = 'luxury-car-rental';
      quotes = luxuryRequest.luxury_quotes || [];
    } else if (packersRequest) {
      request = packersRequest;
      serviceName = 'Packers & Movers';
      serviceSlug = 'packers-and-movers';
      quotes = packersRequest.packers_quotes || [];
    } else if (truckRequest) {
      request = truckRequest;
      serviceName = 'Truck Transport';
      serviceSlug = 'truck-transport';
      quotes = truckRequest.truck_quotes || [];
    }

    if (!request) {
      // Check if this ID exists in booking tables instead
      const [bikeBooking, busBooking, carBooking, chauffeurBooking, equipmentBooking, luxuryBooking, packersBooking, truckBooking] = await Promise.all([
        prisma.bike_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.bus_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.car_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.chauffeur_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.equipment_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.luxury_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.packers_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
        prisma.truck_bookings.findUnique({ where: { id: requestId }, select: { id: true } }).catch(() => null),
      ]);

      if (bikeBooking || busBooking || carBooking || chauffeurBooking || equipmentBooking || luxuryBooking || packersBooking || truckBooking) {
        const foundIn = bikeBooking ? 'bike_bookings' :
                       busBooking ? 'bus_bookings' :
                       carBooking ? 'car_bookings' :
                       chauffeurBooking ? 'chauffeur_bookings' :
                       equipmentBooking ? 'equipment_bookings' :
                       luxuryBooking ? 'luxury_bookings' :
                       packersBooking ? 'packers_bookings' : 'truck_bookings';

        logger.info('ID is a booking, not a quote request', { requestId, foundIn });
        return NextResponse.json(
          {
            error: 'This is a booking ID, not a quote request ID',
            message: `This ID was found in ${foundIn}. Please use /manager/bookings/${requestId} to view booking details`,
            redirectUrl: '/manager/bookings/' + requestId,
            foundIn
          },
          { status: 400 }
        );
      }

      logger.warn('Quote request ID not found in any table', { requestId });
      return NextResponse.json({
        error: 'Quote request not found',
        message: 'This ID does not exist in any quote request table',
        requestId,
        hint: 'Make sure you are accessing a valid quote request ID from the inquiries list'
      }, { status: 404 });
    }

    // Check if manager has access to this request's location
    const requestLocationId = request.locationId;
    const requestLocationName = request.pickupCity || request.locationName;

    const hasLocationAccess = assignedLocationIds.length === 0 ||
      (requestLocationId && assignedLocationIds.includes(requestLocationId)) ||
      (requestLocationName && assignedLocationNames.includes(requestLocationName));

    if (!hasLocationAccess) {
      return NextResponse.json(
        { error: 'Access denied. You are not assigned to this location.' },
        { status: 403 }
      );
    }

    // Format request details
    const formattedRequest = {
      id: request.id,
      requestNumber: request.requestNumber,
      status: request.status,
      serviceName,
      serviceSlug,
      customerName: request.customers?.name || request.customerName,
      customerEmail: request.customers?.email || request.customerEmail,
      customerPhone: request.customers?.phone || request.customerPhone,
      locationId: request.locationId || null,
      locationName: request.locations?.name || request.pickupCity || request.locationName,
      requestedVehicleName: request.requestedVehicleName || request.vehicleName || request.carCategoryName || request.equipmentType || null,
      requestedCategory: request.requestedCategory || request.vehicleCategory || request.carCategory || null,
      pickupDate: request.pickupDate || request.startDate || request.moveDate,
      pickupTime: request.pickupTime || '',
      dropDate: request.dropDate || request.returnDate || request.endDate || null,
      dropTime: request.dropTime || request.returnTime || '',
      totalDays: request.totalDays || request.tripDays || request.durationDays || 0,
      pickupCity: request.pickupCity || null,
      dropCity: request.dropCity || null,
      pickupAddress: request.pickupAddress || null,
      dropAddress: request.dropAddress || null,
      fromCity: request.fromCity || null,
      toCity: request.toCity || null,
      houseSize: request.houseSize || null,
      distance: request.distance || null,
      goodsType: request.goodsType || null,
      weight: request.weight || null,
      tripType: request.tripType || null,
      customerNotes: request.customerNotes || request.requirements || null,
      createdAt: request.createdAt,
      customer: request.customers,
    };

    // Format vendor quotes
    const formattedQuotes = quotes.map((quote: any) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber || null,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || null,
      vendorPhone: quote.vendors?.phone || null,
      vendorEmail: quote.vendors?.email || null,
      status: quote.status,
      quotedAmount: quote.quotedAmount || quote.totalAmount || quote.amount || 0,
      dailyRate: quote.dailyRate || quote.perDayRate || quote.baseRate || null,
      totalDays: quote.totalDays || quote.days || null,
      gstAmount: quote.gstAmount || null,
      securityDeposit: quote.securityDeposit || null,
      grandTotal: quote.grandTotal || quote.quotedAmount || quote.totalAmount || 0,
      vehicleName: quote.vehicleName || quote.assignedVehicle || null,
      vehicleCategory: quote.vehicleCategory || null,
      vehicleNumber: quote.vehicleNumber || null,
      validUntil: quote.validUntil || null,
      notes: quote.notes || quote.vendorNotes || null,
      termsAndConditions: quote.termsAndConditions || null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      request: formattedRequest,
      quotes: formattedQuotes,
      quotesCount: formattedQuotes.length,
    });
  } catch (error: any) {
    logger.error('Manager inquiry detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry details', details: error?.message },
      { status: 500 }
    );
  }
}
