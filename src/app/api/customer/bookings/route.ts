import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Map dashboard categories to actual Prisma enum values
// BikeBookingStatus: PENDING_PAYMENT, PENDING_VENDOR, BROADCASTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED, REFUNDED
// CarBookingStatus: Same as above
// ChauffeurBookingStatus: Same + DRIVER_ASSIGNED
const bikeCarStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED'],
  Confirmed: ['ACCEPTED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'EXPIRED', 'REFUNDED'],
};

const chauffeurStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED'],
  Confirmed: ['ACCEPTED', 'DRIVER_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'EXPIRED', 'REFUNDED'],
};

// Bike quote request status mappings
const bikeQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Bus booking status mappings
const busBookingStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  Confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED'],
};

// Bus quote request status mappings (shown as "Open" bookings)
const busQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Truck booking status mappings
const truckBookingStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  Confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  Ongoing: ['LOADING', 'IN_TRANSIT', 'UNLOADING'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED'],
};

const truckQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Packers booking status mappings
const packersBookingStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  Confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'],
  Ongoing: ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED'],
};

const packersQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Equipment booking status mappings
const equipmentBookingStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  Confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'EQUIPMENT_ASSIGNED'],
  Ongoing: ['DELIVERED', 'IN_USE'],
  Completed: ['RETURNED', 'COMPLETED'],
  Dropped: ['CANCELLED'],
};

const equipmentQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Luxury quote request status mappings
const luxuryQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

// Luxury booking status mappings
const luxuryBookingStatusMappings: Record<string, string[]> = {
  Open: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  Confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED'],
};

// Self-drive quote request status mappings
const selfDriveQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Dropped: ['CANCELLED', 'EXPIRED'],
};

/**
 * GET - Get customer bookings from local trans_cms database
 * Query params: identifier (phone or email), status
 */
export async function GET(request: NextRequest) {
  try {
    // Check database availability
    if (!prisma) {
      logger.error('Database not available - Prisma client is undefined');
      return NextResponse.json(
        { success: false, error: 'Database not available', bookings: [] },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');
    const customerId = searchParams.get('customer_id');
    const requestedStatus = searchParams.get('status') || 'Open';

    if (!identifier && !customerId) {
      return NextResponse.json({ error: 'Identifier or customer_id required' }, { status: 400 });
    }

    // Get status arrays for the requested category
    // 'All' means no status filter
    const isAllStatus = requestedStatus === 'All' || requestedStatus === 'all';
    const bikeCarStatusArray = isAllStatus ? null : (bikeCarStatusMappings[requestedStatus] || bikeCarStatusMappings.Open);
    const bikeQuoteRequestStatusArray = isAllStatus ? null : (bikeQuoteRequestStatusMappings[requestedStatus] || null);
    const chauffeurStatusArray = isAllStatus ? null : (chauffeurStatusMappings[requestedStatus] || chauffeurStatusMappings.Open);
    const busBookingStatusArray = isAllStatus ? null : (busBookingStatusMappings[requestedStatus] || null);
    const busQuoteRequestStatusArray = isAllStatus ? null : (busQuoteRequestStatusMappings[requestedStatus] || null);
    const truckBookingStatusArray = isAllStatus ? null : (truckBookingStatusMappings[requestedStatus] || null);
    const truckQuoteRequestStatusArray = isAllStatus ? null : (truckQuoteRequestStatusMappings[requestedStatus] || null);
    const packersBookingStatusArray = isAllStatus ? null : (packersBookingStatusMappings[requestedStatus] || null);
    const packersQuoteRequestStatusArray = isAllStatus ? null : (packersQuoteRequestStatusMappings[requestedStatus] || null);
    const equipmentBookingStatusArray = isAllStatus ? null : (equipmentBookingStatusMappings[requestedStatus] || null);
    const equipmentQuoteRequestStatusArray = isAllStatus ? null : (equipmentQuoteRequestStatusMappings[requestedStatus] || null);
    const luxuryBookingStatusArray = isAllStatus ? null : (luxuryBookingStatusMappings[requestedStatus] || null);
    const luxuryQuoteRequestStatusArray = isAllStatus ? null : (luxuryQuoteRequestStatusMappings[requestedStatus] || null);
    const selfDriveQuoteRequestStatusArray = isAllStatus ? null : (selfDriveQuoteRequestStatusMappings[requestedStatus] || null);

    // Normalize phone number for search (remove spaces, keep +)
    const normalizedPhone = identifier ? identifier.replace(/\s+/g, '') : null;
    const normalizedEmail = identifier ? identifier.toLowerCase().trim() : null;

    // Build customer filter - try multiple matching strategies
    const customerFilterConditions: any[] = [];

    // Match by customer ID (most reliable)
    if (customerId) {
      customerFilterConditions.push({ customerId: customerId });
    }

    // If identifier looks like a CUID or UUID, it might be a customer ID passed as identifier
    if (identifier && (identifier.startsWith('c') || identifier.length > 20)) {
      customerFilterConditions.push({ customerId: identifier });
    }

    // Match by exact phone/email
    if (identifier) {
      customerFilterConditions.push({ customerPhone: identifier });
      customerFilterConditions.push({ customerEmail: identifier });
    }

    // Match by normalized phone (without spaces)
    if (normalizedPhone && normalizedPhone !== identifier) {
      customerFilterConditions.push({ customerPhone: normalizedPhone });
    }

    // Match by email (case insensitive)
    if (normalizedEmail && normalizedEmail !== identifier) {
      customerFilterConditions.push({ customerEmail: normalizedEmail });
    }

    const customerFilter = {
      OR: customerFilterConditions,
    };

    // Build OR filter for quote requests (they have different field structure)
    const quoteRequestFilter = {
      OR: [
        ...(customerId ? [{ customerId: customerId }] : []),
        ...(identifier && (identifier.startsWith('c') || identifier.length > 20) ? [{ customerId: identifier }] : []),
        ...(identifier ? [{ customerPhone: identifier }] : []),
        ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
      ],
    };

    // PERFORMANCE: Execute all queries in parallel using Promise.all
    // This reduces response time from ~13x to ~1x single query time
    const [
      bikeQuoteRequests,
      bikeBookings,
      carBookings,
      selfDriveQuoteRequests,
      chauffeurBookings,
      busQuoteRequests,
      busBookings,
      truckQuoteRequests,
      truckBookings,
      packersQuoteRequests,
      packersBookings,
      equipmentQuoteRequests,
      equipmentBookings,
      luxuryQuoteRequests,
      luxuryBookings,
    ] = await Promise.all([
      // Bike quote requests
      (!bikeQuoteRequestStatusArray || bikeQuoteRequestStatusArray.length > 0)
        ? prisma.bike_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(bikeQuoteRequestStatusArray ? { status: { in: bikeQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching bike quote requests', e); return []; })
        : Promise.resolve([]),

      // Bike bookings
      prisma.bike_bookings.findMany({
        where: {
          ...customerFilter,
          ...(bikeCarStatusArray ? { status: { in: bikeCarStatusArray as any } } : {}),
        },
        include: {
          locations: { select: { name: true } },
          vendors_bike_bookings_assignedVendorIdTovendors: { select: { businessName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch((e) => { logger.error('Error fetching bike bookings', e); return []; }),

      // Car bookings
      prisma.car_bookings.findMany({
        where: {
          ...customerFilter,
          ...(bikeCarStatusArray ? { status: { in: bikeCarStatusArray as any } } : {}),
        },
        include: {
          locations: { select: { name: true } },
          vendors_car_bookings_assignedVendorIdTovendors: { select: { businessName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch((e) => { logger.error('Error fetching car bookings', e); return []; }),

      // Self-drive quote requests
      (!selfDriveQuoteRequestStatusArray || selfDriveQuoteRequestStatusArray.length > 0)
        ? prisma.self_drive_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(selfDriveQuoteRequestStatusArray ? { status: { in: selfDriveQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching self-drive quote requests', e); return []; })
        : Promise.resolve([]),

      // Chauffeur bookings
      prisma.chauffeur_bookings.findMany({
        where: {
          ...customerFilter,
          ...(chauffeurStatusArray ? { status: { in: chauffeurStatusArray as any } } : {}),
        },
        include: {
          locations: { select: { name: true } },
          vendors_chauffeur_bookings_assignedVendorIdTovendors: { select: { businessName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch((e) => { logger.error('Error fetching chauffeur bookings', e); return []; }),

      // Bus quote requests
      (!busQuoteRequestStatusArray || busQuoteRequestStatusArray.length > 0)
        ? prisma.bus_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(busQuoteRequestStatusArray ? { status: { in: busQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching bus quote requests', e); return []; })
        : Promise.resolve([]),

      // Bus bookings
      (!busBookingStatusArray || busBookingStatusArray.length > 0)
        ? prisma.bus_bookings.findMany({
          where: {
            ...quoteRequestFilter,
            ...(busBookingStatusArray ? { status: { in: busBookingStatusArray as any } } : {}),
          },
          include: {
            vendors: { select: { businessName: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching bus bookings', e); return []; })
        : Promise.resolve([]),

      // Truck quote requests
      (!truckQuoteRequestStatusArray || truckQuoteRequestStatusArray.length > 0)
        ? prisma.truck_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(truckQuoteRequestStatusArray ? { status: { in: truckQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching truck quote requests', e); return []; })
        : Promise.resolve([]),

      // Truck bookings
      (!truckBookingStatusArray || truckBookingStatusArray.length > 0)
        ? prisma.truck_bookings.findMany({
          where: {
            ...quoteRequestFilter,
            ...(truckBookingStatusArray ? { status: { in: truckBookingStatusArray as any } } : {}),
          },
          include: {
            vendors: { select: { businessName: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching truck bookings', e); return []; })
        : Promise.resolve([]),

      // Packers quote requests
      (!packersQuoteRequestStatusArray || packersQuoteRequestStatusArray.length > 0)
        ? prisma.packers_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(packersQuoteRequestStatusArray ? { status: { in: packersQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching packers quote requests', e); return []; })
        : Promise.resolve([]),

      // Packers bookings
      (!packersBookingStatusArray || packersBookingStatusArray.length > 0)
        ? prisma.packers_bookings.findMany({
          where: {
            ...quoteRequestFilter,
            ...(packersBookingStatusArray ? { status: { in: packersBookingStatusArray as any } } : {}),
          },
          include: {
            vendors: { select: { businessName: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching packers bookings', e); return []; })
        : Promise.resolve([]),

      // Equipment quote requests
      (!equipmentQuoteRequestStatusArray || equipmentQuoteRequestStatusArray.length > 0)
        ? prisma.equipment_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(equipmentQuoteRequestStatusArray ? { status: { in: equipmentQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching equipment quote requests', e); return []; })
        : Promise.resolve([]),

      // Equipment bookings
      (!equipmentBookingStatusArray || equipmentBookingStatusArray.length > 0)
        ? prisma.equipment_bookings.findMany({
          where: {
            ...quoteRequestFilter,
            ...(equipmentBookingStatusArray ? { status: { in: equipmentBookingStatusArray as any } } : {}),
          },
          include: {
            vendors: { select: { businessName: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching equipment bookings', e); return []; })
        : Promise.resolve([]),

      // Luxury quote requests
      (!luxuryQuoteRequestStatusArray || luxuryQuoteRequestStatusArray.length > 0)
        ? prisma.luxury_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(luxuryQuoteRequestStatusArray ? { status: { in: luxuryQuoteRequestStatusArray as any } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching luxury quote requests', e); return []; })
        : Promise.resolve([]),

      // Luxury bookings
      (!luxuryBookingStatusArray || luxuryBookingStatusArray.length > 0)
        ? prisma.luxury_bookings.findMany({
          where: {
            ...quoteRequestFilter,
            ...(luxuryBookingStatusArray ? { status: { in: luxuryBookingStatusArray as any } } : {}),
          },
          include: {
            vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { businessName: true, phone: true } },
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }).catch((e) => { logger.error('Error fetching luxury bookings', e); return []; })
        : Promise.resolve([]),
    ]);

    // Transform to common format
    const transformedBookings = [
      // Bike quote requests
      ...bikeQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Bike Rental',
        service_type: 'bike',
        location_name: b.locationName || '',
        destination: null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.dropDate?.toISOString() || null,
        status: mapBikeQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.requestedCategory || 'Bike',
        brand: b.requestedBrand || null,
        category: b.requestedCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      // Bike bookings
      ...bikeBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Bike Rental',
        service_type: 'bike',
        location_name: b.locationName || b.locations?.name || '',
        destination: null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.dropDate?.toISOString() || null,
        status: mapStatusToDisplay(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.requestedVehicleName,
        brand: b.requestedBrand,
        category: b.requestedCategory,
        total_amount: b.totalAmount,
        vendor: b.vendors_bike_bookings_assignedVendorIdTovendors
          ? { name: b.vendors_bike_bookings_assignedVendorIdTovendors.businessName, phone: b.vendors_bike_bookings_assignedVendorIdTovendors.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
      ...carBookings.map((b) => {
        // For self-drive, use location name from relation or locationName field
        const fromLocation = b.locations?.name || b.locationName || b.pickupAddress || 'Pickup Location';

        // Determine destination based on delivery and drop address
        let toLocation = 'Same location';
        if (b.isDeliveryRequested && b.dropAddress) {
          toLocation = b.dropAddress;
        } else if (b.dropAddress && b.dropAddress !== b.pickupAddress) {
          toLocation = b.dropAddress;
        }

        return {
          id: b.id,
          booking_number: b.bookingNumber,
          service_name: 'Self-Drive Car',
          service_type: 'car',
          location_name: fromLocation,
          destination: toLocation,
          journey_datetime: b.pickupDate.toISOString(),
          return_datetime: b.dropDate?.toISOString() || null,
          status: mapStatusToDisplay(b.status),
          created_at: b.createdAt.toISOString(),
          vehicle_name: b.requestedVehicleName,
          brand: b.requestedBrand,
          category: b.requestedCategory,
          total_amount: b.grandTotal,
          vendor: b.vendors_car_bookings_assignedVendorIdTovendors
            ? { name: b.vendors_car_bookings_assignedVendorIdTovendors.businessName, phone: b.vendors_car_bookings_assignedVendorIdTovendors.phone }
            : null,
          quotations: [],
          is_quote_request: false,
        };
      }),
      // Self-drive quote requests
      ...selfDriveQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Self-Drive Car',
        service_type: 'car',
        location_name: b.locationName || b.pickupCity || '',
        destination: b.dropCity || b.dropAddress || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.dropDate?.toISOString() || null,
        status: mapSelfDriveQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.specificModel || 'Car',
        brand: b.specificBrand || null,
        category: b.vehicleCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      ...chauffeurBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Car with Driver',
        service_type: 'chauffeur',
        location_name: b.locationName || b.locations?.name || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.returnDate?.toISOString() || null,
        status: mapStatusToDisplay(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicle_models || b.carCategoryName || b.carCategory || 'Car with Driver',
        brand: null,
        category: b.carCategory,
        total_amount: b.grandTotal,
        vendor: b.vendors_chauffeur_bookings_assignedVendorIdTovendors
          ? { name: b.vendors_chauffeur_bookings_assignedVendorIdTovendors.businessName, phone: b.vendors_chauffeur_bookings_assignedVendorIdTovendors.phone }
          : null,
        quotations: [],
      })),
      // Bus quote requests (pending, awaiting quotes)
      ...busQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Bus Rental',
        service_type: 'bus',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.returnDate?.toISOString() || null,
        status: mapBusQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.vehicle_category || 'Bus',
        brand: null,
        category: b.vehicle_category,
        total_amount: null,
        passengers: b.passengers,
        trip_type: b.tripType,
        vendor: null,
        quotations: [],
        is_quote_request: true, // Flag to indicate this is a quote request
      })),
      // Bus bookings (confirmed bookings)
      ...busBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Bus Rental',
        service_type: 'bus',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.returnDate?.toISOString() || null,
        status: mapBusBookingStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleName || b.vehicle_category || 'Bus',
        brand: null,
        category: b.vehicle_category,
        total_amount: b.totalAmount,
        passengers: b.passengers,
        trip_type: b.tripType,
        vendor: b.vendor
          ? { name: b.vendor.businessName, phone: b.vendor.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
      // Truck quote requests
      ...truckQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Truck Rental',
        service_type: 'truck',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: null,
        status: mapQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.vehicle_category || 'Truck',
        brand: null,
        category: b.vehicle_category,
        total_amount: null,
        goods_type: b.goodsType,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      // Truck bookings
      ...truckBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Truck Rental',
        service_type: 'truck',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: null,
        status: mapTruckBookingStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleName || b.vehicle_category || 'Truck',
        brand: null,
        category: b.vehicle_category,
        total_amount: b.totalAmount,
        goods_type: b.goodsType,
        vendor: b.vendor
          ? { name: b.vendor.businessName, phone: b.vendor.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
      // Packers quote requests
      ...packersQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Packers & Movers',
        service_type: 'packers',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.preferredDate?.toISOString() || b.createdAt.toISOString(),
        return_datetime: null,
        status: mapQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.shiftingType || b.propertySize || 'Moving Service',
        brand: null,
        category: b.serviceType,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      // Packers bookings
      ...packersBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Packers & Movers',
        service_type: 'packers',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.scheduledDate?.toISOString() || b.createdAt.toISOString(),
        return_datetime: null,
        status: mapPackersBookingStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.shiftingType || 'Moving Service',
        brand: null,
        category: b.serviceType,
        total_amount: b.totalAmount,
        vendor: b.vendor
          ? { name: b.vendor.businessName, phone: b.vendor.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
      // Equipment quote requests
      ...equipmentQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Equipment Rental',
        service_type: 'equipment',
        location_name: b.locations?.name || b.deliveryCity || '',
        destination: b.deliveryAddress || null,
        journey_datetime: b.startDate.toISOString(),
        return_datetime: b.endDate?.toISOString() || null,
        status: mapQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.equipmentType || b.equipmentCategory || 'Equipment',
        brand: null,
        category: b.equipmentCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      // Equipment bookings
      ...equipmentBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Equipment Rental',
        service_type: 'equipment',
        location_name: b.deliveryCity || '',
        destination: b.deliveryAddress || null,
        journey_datetime: b.startDate.toISOString(),
        return_datetime: b.endDate?.toISOString() || null,
        status: mapEquipmentBookingStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.equipmentModel || b.equipmentType || 'Equipment',
        brand: null,
        category: b.equipmentCategory,
        total_amount: b.totalAmount,
        vendor: b.vendor
          ? { name: b.vendor.businessName, phone: b.vendor.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
      // Luxury quote requests
      ...luxuryQuoteRequests.map((b) => ({
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Luxury Car Rental',
        service_type: 'luxury',
        location_name: b.pickupCity || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.returnDate?.toISOString() || null,
        status: mapQuoteRequestStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.vehicle_category || b.specificModel || 'Luxury Car',
        brand: null,
        category: b.vehicle_category,
        total_amount: null,
        trip_type: b.tripType,
        occasion: b.occasion,
        vendor: null,
        quotations: [],
        is_quote_request: true,
      })),
      // Luxury bookings
      ...luxuryBookings.map((b) => ({
        id: b.id,
        booking_number: b.bookingNumber,
        service_name: 'Luxury Car Rental',
        service_type: 'luxury',
        location_name: b.pickupCity || b.locations?.name || '',
        destination: b.dropCity || null,
        journey_datetime: b.pickupDate?.toISOString() || b.createdAt.toISOString(),
        return_datetime: b.returnDate?.toISOString() || null,
        status: mapLuxuryBookingStatus(b.status),
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicle_models || 'Luxury Car',
        brand: b.vehicleBrand,
        category: (b as { vehicle_category?: string }).vehicle_category || 'Luxury',
        total_amount: b.grandTotal,
        trip_type: b.tripType,
        occasion: b.occasion,
        vendor: b.vendors_luxury_bookings_acceptedVendorIdTovendors
          ? { name: b.vendors_luxury_bookings_acceptedVendorIdTovendors.businessName, phone: b.vendors_luxury_bookings_acceptedVendorIdTovendors.phone }
          : null,
        quotations: [],
        is_quote_request: false,
      })),
    ];

    // Sort by created date descending
    transformedBookings.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    logger.error('Customer bookings error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings', bookings: [] },
      { status: 500 }
    );
  }
}

// POST endpoint for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.phone || body.email;
    const status = body.status || 'Open';

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }

    // Reuse GET logic
    const url = new URL(request.url);
    url.searchParams.set('identifier', identifier);
    url.searchParams.set('status', status);
    return GET(new NextRequest(url));
  } catch (error) {
    logger.error('Customer bookings POST error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings', bookings: [] },
      { status: 500 }
    );
  }
}

// Helper function to map internal status to display status
function mapStatusToDisplay(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PENDING_VENDOR: 'Open',
    BROADCASTED: 'Open',
    ACCEPTED: 'Confirmed',
    DRIVER_ASSIGNED: 'Confirmed',
    IN_PROGRESS: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
    EXPIRED: 'Dropped',
    REFUNDED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map bike quote request status
function mapBikeQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'Open',
    QUOTES_RECEIVED: 'Open',
    QUOTE_ACCEPTED: 'Confirmed',
    BOOKING_CONFIRMED: 'Confirmed',
    CANCELLED: 'Dropped',
    EXPIRED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map bus quote request status
function mapBusQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'Open',
    QUOTES_RECEIVED: 'Open',
    QUOTE_ACCEPTED: 'Confirmed',
    BOOKING_CONFIRMED: 'Confirmed',
    CANCELLED: 'Dropped',
    EXPIRED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map self-drive quote request status
function mapSelfDriveQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'Open',
    QUOTES_RECEIVED: 'Open',
    QUOTE_ACCEPTED: 'Confirmed',
    BOOKING_CONFIRMED: 'Confirmed',
    CANCELLED: 'Dropped',
    EXPIRED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map bus booking status
function mapBusBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    VEHICLE_ASSIGNED: 'Confirmed',
    IN_PROGRESS: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Generic helper for quote request status
function mapQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'Open',
    QUOTES_RECEIVED: 'Open',
    QUOTE_ACCEPTED: 'Confirmed',
    BOOKING_CONFIRMED: 'Confirmed',
    CANCELLED: 'Dropped',
    EXPIRED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map truck booking status
function mapTruckBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    VEHICLE_ASSIGNED: 'Confirmed',
    LOADING: 'Ongoing',
    IN_TRANSIT: 'Ongoing',
    UNLOADING: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map packers booking status
function mapPackersBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    TEAM_ASSIGNED: 'Confirmed',
    PACKING: 'Ongoing',
    LOADING: 'Ongoing',
    IN_TRANSIT: 'Ongoing',
    UNLOADING: 'Ongoing',
    UNPACKING: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map equipment booking status
function mapEquipmentBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    EQUIPMENT_ASSIGNED: 'Confirmed',
    DELIVERED: 'Ongoing',
    IN_USE: 'Ongoing',
    RETURNED: 'Completed',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}

// Helper function to map luxury booking status
function mapLuxuryBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    DRIVER_ASSIGNED: 'Confirmed',
    IN_PROGRESS: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
  };
  return displayMap[status] || 'Open';
}
