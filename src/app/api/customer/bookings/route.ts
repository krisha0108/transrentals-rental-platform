import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Waiting (Open) = only quote requests with PENDING/QUOTES_RECEIVED (vendor quote not accepted yet)
// Confirmed       = all booking records pre-trip (payment pending → vendor assigned)
// Ongoing         = booking records where trip is actively happening
// Completed       = finished bookings
// Dropped         = cancelled/expired

const bikeCarStatusMappings: Record<string, string[]> = {
  Open: [],  // bike/car bookings are never in Waiting — only quote requests are
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED'],
  Ongoing: ['IN_PROGRESS', 'READY_FOR_PICKUP'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'EXPIRED', 'REFUNDED', 'DROPPED'],
};

const chauffeurStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'EXPIRED', 'REFUNDED', 'DROPPED'],
};

// Bike quote request status mappings
const bikeQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Bus booking status mappings
const busBookingStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'DROPPED'],
};

// Bus quote request status mappings
const busQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Truck booking status mappings
const truckBookingStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  Ongoing: ['LOADING', 'IN_TRANSIT', 'UNLOADING'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'DROPPED'],
};

const truckQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Packers booking status mappings
const packersBookingStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'],
  Ongoing: ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'DROPPED'],
};

const packersQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Equipment booking status mappings
const equipmentBookingStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED'],
  Ongoing: ['DELIVERED', 'IN_USE'],
  Completed: ['RETURNED', 'COMPLETED'],
  Dropped: ['CANCELLED', 'DROPPED'],
};

const equipmentQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Luxury quote request status mappings
const luxuryQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// Luxury booking status mappings
const luxuryBookingStatusMappings: Record<string, string[]> = {
  Open: [],
  Confirmed: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Dropped: ['CANCELLED', 'DROPPED'],
};

// Self-drive quote request status mappings
const selfDriveQuoteRequestStatusMappings: Record<string, string[]> = {
  Open: ['PENDING', 'QUOTES_RECEIVED'],
  Confirmed: ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'],
  Ongoing: [],
  Completed: [],
  Dropped: ['CANCELLED', 'EXPIRED', 'DROPPED'],
};

// CUSTOM_BULK (b2b_bookings.serviceType='CUSTOM_BULK') status mappings.
// Customer is "waiting" until they accept a super quote → Confirmed.
const bulkBookingStatusMappings: Record<string, string[]> = {
  Open: ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'],
  Confirmed: ['CONFIRMED', 'TRIPS_CREATED'],
  Ongoing: ['IN_PROGRESS'],
  Completed: ['COMPLETED', 'INVOICED', 'PAID'],
  Dropped: ['CANCELLED'],
};
function mapBulkBookingStatus(status: string): string {
  for (const [bucket, list] of Object.entries(bulkBookingStatusMappings)) {
    if (list.includes(status)) return bucket;
  }
  return 'Open';
}

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
    const bikeCarStatusArray = isAllStatus ? null : (bikeCarStatusMappings[requestedStatus] ?? []);
    const bikeQuoteRequestStatusArray = isAllStatus ? null : (bikeQuoteRequestStatusMappings[requestedStatus] ?? []);
    const chauffeurStatusArray = isAllStatus ? null : (chauffeurStatusMappings[requestedStatus] ?? []);
    const busBookingStatusArray = isAllStatus ? null : (busBookingStatusMappings[requestedStatus] ?? []);
    const busQuoteRequestStatusArray = isAllStatus ? null : (busQuoteRequestStatusMappings[requestedStatus] ?? []);
    const truckBookingStatusArray = isAllStatus ? null : (truckBookingStatusMappings[requestedStatus] ?? []);
    const truckQuoteRequestStatusArray = isAllStatus ? null : (truckQuoteRequestStatusMappings[requestedStatus] ?? []);
    const packersBookingStatusArray = isAllStatus ? null : (packersBookingStatusMappings[requestedStatus] ?? []);
    const packersQuoteRequestStatusArray = isAllStatus ? null : (packersQuoteRequestStatusMappings[requestedStatus] ?? []);
    const equipmentBookingStatusArray = isAllStatus ? null : (equipmentBookingStatusMappings[requestedStatus] ?? []);
    const equipmentQuoteRequestStatusArray = isAllStatus ? null : (equipmentQuoteRequestStatusMappings[requestedStatus] ?? []);
    const luxuryBookingStatusArray = isAllStatus ? null : (luxuryBookingStatusMappings[requestedStatus] ?? []);
    const luxuryQuoteRequestStatusArray = isAllStatus ? null : (luxuryQuoteRequestStatusMappings[requestedStatus] ?? []);
    const selfDriveQuoteRequestStatusArray = isAllStatus ? null : (selfDriveQuoteRequestStatusMappings[requestedStatus] ?? []);
    const bulkBookingStatusArray = isAllStatus ? null : (bulkBookingStatusMappings[requestedStatus] ?? []);

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
      bulkBookingsRaw,
    ] = await Promise.all([
      // Bike quote requests
      (!bikeQuoteRequestStatusArray || bikeQuoteRequestStatusArray.length > 0)
        ? prisma.bike_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(bikeQuoteRequestStatusArray ? { status: { in: bikeQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            vehicle_models: { select: { sideImage: true } },
            bike_quotes_bike_quotes_requestIdTobike_quote_requests: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          bike_quotes: { select: { vehicleImages: true } },
          vehicle_models: { select: { sideImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }).catch((e) => { logger.error('Error fetching bike bookings', e); return []; }),

      // Car bookings (self-drive)
      prisma.car_bookings.findMany({
        where: {
          ...customerFilter,
          ...(bikeCarStatusArray ? { status: { in: bikeCarStatusArray as any } } : {}),
        },
        include: {
          locations: { select: { name: true } },
          vendors_car_bookings_assignedVendorIdTovendors: { select: { businessName: true, phone: true } },
          self_drive_quotes: { select: { vehicleImages: true, vehicleName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }).catch((e) => { logger.error('Error fetching car bookings', e); return []; }),

      // Self-drive quote requests
      (!selfDriveQuoteRequestStatusArray || selfDriveQuoteRequestStatusArray.length > 0)
        ? prisma.self_drive_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(selfDriveQuoteRequestStatusArray ? { status: { in: selfDriveQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            vehicle_models: { select: { sideImage: true } },
            self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
        take: 500,
      }).catch((e) => { logger.error('Error fetching chauffeur bookings', e); return []; }),

      // Bus quote requests
      (!busQuoteRequestStatusArray || busQuoteRequestStatusArray.length > 0)
        ? prisma.bus_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(busQuoteRequestStatusArray ? { status: { in: busQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            bus_quotes_bus_quotes_requestIdTobus_quote_requests: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          take: 500,
        }).catch((e) => { logger.error('Error fetching bus bookings', e); return []; })
        : Promise.resolve([]),

      // Truck quote requests
      (!truckQuoteRequestStatusArray || truckQuoteRequestStatusArray.length > 0)
        ? prisma.truck_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(truckQuoteRequestStatusArray ? { status: { in: truckQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            truck_quotes: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          take: 500,
        }).catch((e) => { logger.error('Error fetching truck bookings', e); return []; })
        : Promise.resolve([]),

      // Packers quote requests
      (!packersQuoteRequestStatusArray || packersQuoteRequestStatusArray.length > 0)
        ? prisma.packers_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(packersQuoteRequestStatusArray ? { status: { in: packersQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            packers_quotes: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          take: 500,
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
            equipment_quotes: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          take: 500,
        }).catch((e) => { logger.error('Error fetching equipment bookings', e); return []; })
        : Promise.resolve([]),

      // Luxury quote requests
      (!luxuryQuoteRequestStatusArray || luxuryQuoteRequestStatusArray.length > 0)
        ? prisma.luxury_quote_requests.findMany({
          where: {
            ...quoteRequestFilter,
            ...(luxuryQuoteRequestStatusArray ? { status: { in: luxuryQuoteRequestStatusArray as any } } : {}),
          },
          include: {
            luxury_quotes: { select: { status: true, validTill: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
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
          take: 500,
        }).catch((e) => { logger.error('Error fetching luxury bookings', e); return []; })
        : Promise.resolve([]),

      // CUSTOM_BULK (multi-day event) bookings — live in b2b_bookings under
      // serviceType='CUSTOM_BULK'. Wrapped in an async IIFE so neither sync
      // errors (e.g. Prisma client missing the model on an older deploy) nor
      // async ones can blow up Promise.all and blank the whole bookings list.
      (async () => {
        if (bulkBookingStatusArray && bulkBookingStatusArray.length === 0) return [];
        try {
          return await (prisma as any).b2b_bookings.findMany({
            where: {
              ...quoteRequestFilter,
              serviceType: 'CUSTOM_BULK',
              ...(bulkBookingStatusArray ? { status: { in: bulkBookingStatusArray as any } } : {}),
            },
            include: {
              superQuotes: {
                select: { id: true, quoteNumber: true, status: true, finalAmount: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
              },
              _count: { select: { vendorQuotes: true, trips: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
          });
        } catch (e: any) {
          logger.error('Error fetching bulk bookings', e);
          return [];
        }
      })(),
    ]);

    // Helper to extract first image from vehicleImages JSON string
    const getFirstVehicleImage = (vehicleImages: string | null | undefined): string | null => {
      if (!vehicleImages) return null;
      try {
        const parsed = JSON.parse(vehicleImages);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        if (typeof parsed === 'string') return parsed;
      } catch {
        // If it's a plain URL string, return as-is
        if (vehicleImages.startsWith('http')) return vehicleImages;
      }
      return null;
    };

    // Fetch vehicle category images for chauffeur bookings
    const categoryIds = [...new Set(chauffeurBookings.map(b => b.carCategory).filter(Boolean))];

    // Fetch fleet vehicle images for self-drive bookings from vendor_fleets
    const carRequestedVehicleIds = [...new Set(carBookings.map(b => b.requestedVehicleId).filter(Boolean))] as string[];

    const [vehicleCategories, vendorFleetEntries] = await Promise.all([
      categoryIds.length > 0
        ? prisma.chauffeur_vehicle_categories.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, image: true },
          })
        : Promise.resolve([]),
      carRequestedVehicleIds.length > 0
        ? prisma.vendor_fleets.findMany({
            where: { id: { in: carRequestedVehicleIds } },
            select: {
              id: true,
              images: true,
              vehicle_models: { select: { sideImage: true, name: true, brands: { select: { name: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);

    const categoryImageMap: Record<string, string | null> = {};
    vehicleCategories.forEach(c => { categoryImageMap[c.id] = c.image; });

    const vendorFleetMap: Record<string, { image: string | null; vehicleName: string | null }> = {};
    vendorFleetEntries.forEach(f => {
      let image: string | null = f.vehicle_models?.sideImage || null;
      if (!image && f.images) {
        try {
          const parsed = JSON.parse(f.images);
          if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
          else if (typeof parsed === 'string') image = parsed;
        } catch {
          if (f.images.startsWith('http')) image = f.images;
        }
      }
      const vehicleName = f.vehicle_models
        ? `${f.vehicle_models.brands?.name || ''} ${f.vehicle_models.name || ''}`.trim()
        : null;
      vendorFleetMap[f.id] = { image, vehicleName };
    });

    // Helper to check if all quotes for a request are expired
    const computeAllQuotesExpired = (quotes: Array<{ status: string; validTill: Date | null }> | null | undefined): boolean => {
      if (!quotes || quotes.length === 0) return false;
      return quotes.every(q => {
        if (!q.validTill) return q.status === 'EXPIRED';
        return q.status === 'EXPIRED' || new Date(q.validTill).getTime() < Date.now();
      });
    };

    // Transform to common format
    const transformedBookings = [
      // Bike quote requests
      ...bikeQuoteRequests.map((b) => {
        const bikeModelName = b.vehicleModelName
          ? `${b.vehicleBrand ? b.vehicleBrand + ' ' : ''}${b.vehicleModelName}`.trim()
          : null;
        return {
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Bike Rental',
        service_type: 'bike',
        location_name: b.locationName || '',
        destination: null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.dropDate?.toISOString() || null,
        status: mapBikeQuoteRequestStatus(b.status),
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: bikeModelName || b.vehicleCategoryName || 'Bike',
        vehicle_image: b.vehicle_models?.sideImage || null,
        brand: b.vehicleBrand || null,
        category: b.vehicleCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.bike_quotes_bike_quotes_requestIdTobike_quote_requests),
      };
      }),
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
        vehicle_image: getFirstVehicleImage(b.bike_quotes?.vehicleImages) || b.vehicle_models?.sideImage || null,
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

        // Resolve vehicle name: quote vehicle > fleet vehicle > requested name
        const fleetInfo = b.requestedVehicleId ? vendorFleetMap[b.requestedVehicleId] : null;
        const resolvedVehicleName = b.self_drive_quotes?.vehicleName
          || fleetInfo?.vehicleName
          || b.requestedVehicleName;

        // Resolve vehicle image: quote images > fleet images
        const resolvedVehicleImage = getFirstVehicleImage(b.self_drive_quotes?.vehicleImages)
          || fleetInfo?.image
          || null;

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
          vehicle_name: resolvedVehicleName,
          vehicle_image: resolvedVehicleImage,
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
      ...selfDriveQuoteRequests.map((b) => {
        // Build proper vehicle display name: "Brand Model" > modelName > categoryName
        const qrModelName = b.vehicleModelName
          ? `${b.vehicleBrand ? b.vehicleBrand + ' ' : ''}${b.vehicleModelName}`.trim()
          : null;
        return {
        id: b.id,
        booking_number: b.requestNumber,
        service_name: 'Self-Drive Car',
        service_type: 'car',
        location_name: b.locationName || b.pickupCity || '',
        destination: b.dropCity || b.dropAddress || null,
        journey_datetime: b.pickupDate.toISOString(),
        return_datetime: b.dropDate?.toISOString() || null,
        status: mapSelfDriveQuoteRequestStatus(b.status),
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: qrModelName || b.vehicleCategoryName || b.specificModel || 'Car',
        vehicle_image: b.vehicle_models?.sideImage || null,
        brand: b.vehicleBrand || b.specificBrand || null,
        category: b.vehicleCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests),
      };
      }),
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
        vehicle_image: categoryImageMap[b.carCategory] || null,
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
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.vehicle_category || 'Bus',
        brand: null,
        category: b.vehicle_category,
        total_amount: null,
        passengers: b.passengers,
        trip_type: b.tripType,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.bus_quotes_bus_quotes_requestIdTobus_quote_requests),
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
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.vehicleCategoryName || b.vehicle_category || 'Truck',
        brand: null,
        category: b.vehicle_category,
        total_amount: null,
        goods_type: b.goodsType,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.truck_quotes),
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
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.shiftingType || b.propertySize || 'Moving Service',
        brand: null,
        category: b.serviceType,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.packers_quotes),
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
        raw_status: b.status,
        created_at: b.createdAt.toISOString(),
        vehicle_name: b.equipmentType || b.equipmentCategory || 'Equipment',
        brand: null,
        category: b.equipmentCategory,
        total_amount: null,
        vendor: null,
        quotations: [],
        is_quote_request: true,
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.equipment_quotes),
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
        raw_status: b.status,
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
        quote_count: b.totalQuotesReceived || 0,
        all_quotes_expired: computeAllQuotesExpired(b.luxury_quotes),
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

      // CUSTOM_BULK (multi-day event) bookings — surfaces in the customer's
      // unified booking list. Detail screen renders day-wise plan, super
      // quote (if any), and trip OTPs once confirmed. Each row mapped
      // inside its own try/catch so a single bad row can't drop the whole
      // bookings response.
      ...(bulkBookingsRaw || []).map((b: any) => {
        try {
        // Parse occasion + day count from the stored breakdown JSON.
        let plan: any = null;
        if (b.bulkBreakdown) {
          try { plan = JSON.parse(b.bulkBreakdown); } catch { plan = null; }
        }
        const sentSuperQuote = (b.superQuotes || []).find((sq: any) => sq.status === 'SENT');
        // Defensive date conversion — a bad/null timestamp on any single
        // b2b_bookings row would otherwise throw inside .map() and bubble up
        // to the outer try/catch, blanking out the whole bookings response.
        const toIsoSafe = (d: any) => {
          try {
            if (!d) return null;
            const dt = d instanceof Date ? d : new Date(d);
            return isNaN(dt.getTime()) ? null : dt.toISOString();
          } catch {
            return null;
          }
        };
        return {
          id: b.id,
          booking_number: b.bookingNumber,
          service_name: 'Multi-Day Event',
          service_type: 'bulk',
          location_name: plan?.base_location || b.pickupLocation || '',
          destination: null,
          journey_datetime: toIsoSafe(b.scheduledDate) || toIsoSafe(b.createdAt) || new Date().toISOString(),
          return_datetime: toIsoSafe(b.returnDate),
          status: mapBulkBookingStatus(b.status),
          raw_status: b.status,
          created_at: toIsoSafe(b.createdAt) || new Date().toISOString(),
          vehicle_name: plan?.occasion_name || (plan?.occasion_type ? `${String(plan.occasion_type).replace(/^./, (c: string) => c.toUpperCase())} Event` : 'Multi-Day Event'),
          vehicle_image: null,
          brand: null,
          category: plan?.occasion_type || null,
          total_amount: b.finalAmount || null,
          vendor: null,
          quotations: [],
          is_quote_request: false,
          // Bulk-specific extras read by the mobile detail screen
          bulk_total_days: plan?.total_days ?? null,
          bulk_total_people: plan?.total_people ?? null,
          bulk_vehicles_required: b.vehiclesRequired,
          bulk_vendor_quotes_count: b._count?.vendorQuotes ?? 0,
          bulk_trips_count: b._count?.trips ?? 0,
          bulk_has_super_quote_pending: !!sentSuperQuote,
          bulk_super_quote_id: sentSuperQuote?.id || null,
          bulk_super_quote_amount: sentSuperQuote?.finalAmount || null,
        };
        } catch (e) {
          logger.error('Failed to map bulk booking row', { bookingId: b?.id, error: e });
          return null;
        }
      }).filter(Boolean),
    ];

    // Filter out accepted/confirmed quote requests (the booking entry already exists for these)
    const dedupedBookings = transformedBookings.filter(b => {
      if (b.is_quote_request && (b.raw_status === 'QUOTE_ACCEPTED' || b.raw_status === 'BOOKING_CONFIRMED')) {
        return false;
      }
      return true;
    });

    // Sort by created date descending
    dedupedBookings.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Remove raw_status from response (internal use only)
    const cleanBookings = dedupedBookings.map(({ raw_status, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      bookings: cleanBookings,
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
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_VENDOR: 'PENDING_VENDOR',
    BROADCASTED: 'BROADCASTED',
    ACCEPTED: 'ACCEPTED',
    DRIVER_ASSIGNED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    REFUNDED: 'REFUNDED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map bike quote request status
function mapBikeQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'PENDING',
    QUOTES_RECEIVED: 'PENDING',
    QUOTE_ACCEPTED: 'CONFIRMED',
    BOOKING_CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map bus quote request status
function mapBusQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'PENDING',
    QUOTES_RECEIVED: 'PENDING',
    QUOTE_ACCEPTED: 'CONFIRMED',
    BOOKING_CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map self-drive quote request status
function mapSelfDriveQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'PENDING',
    QUOTES_RECEIVED: 'PENDING',
    QUOTE_ACCEPTED: 'CONFIRMED',
    BOOKING_CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map bus booking status
function mapBusBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
    ADVANCE_PAID: 'CONFIRMED',
    CONFIRMED: 'CONFIRMED',
    VEHICLE_ASSIGNED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Generic helper for quote request status
function mapQuoteRequestStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING: 'PENDING',
    QUOTES_RECEIVED: 'PENDING',
    QUOTE_ACCEPTED: 'CONFIRMED',
    BOOKING_CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map truck booking status
function mapTruckBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
    ADVANCE_PAID: 'CONFIRMED',
    CONFIRMED: 'CONFIRMED',
    VEHICLE_ASSIGNED: 'CONFIRMED',
    LOADING: 'IN_PROGRESS',
    IN_TRANSIT: 'IN_PROGRESS',
    UNLOADING: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map packers booking status
function mapPackersBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
    ADVANCE_PAID: 'CONFIRMED',
    CONFIRMED: 'CONFIRMED',
    TEAM_ASSIGNED: 'CONFIRMED',
    PACKING: 'IN_PROGRESS',
    LOADING: 'IN_PROGRESS',
    IN_TRANSIT: 'IN_PROGRESS',
    UNLOADING: 'IN_PROGRESS',
    UNPACKING: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}

// Helper function to map equipment booking status
function mapEquipmentBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'Open',
    PAYMENT_SUBMITTED: 'Open',
    ADVANCE_PAID: 'Confirmed',
    CONFIRMED: 'Confirmed',
    DELIVERED: 'Ongoing',
    IN_USE: 'Ongoing',
    RETURNED: 'Completed',
    COMPLETED: 'Completed',
    CANCELLED: 'Dropped',
    DROPPED: 'Dropped',
  };
  return displayMap[status] || status;
}

// Helper function to map luxury booking status
function mapLuxuryBookingStatus(status: string): string {
  const displayMap: Record<string, string> = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
    ADVANCE_PAID: 'CONFIRMED',
    CONFIRMED: 'CONFIRMED',
    DRIVER_ASSIGNED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DROPPED: 'DROPPED',
  };
  return displayMap[status] || status;
}
