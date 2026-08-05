import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
import { sendVendorDirectNotification, sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
import { checkFleetAvailability, blockDatesForBooking } from '@/lib/utils/fleet-availability';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Fire-and-forget accountability log — records which manager took what action
// on a booking. Never awaited/blocking; failures are logged but don't affect
// the booking mutation response. Powers the admin-side Manager Performance view.
function logManagerBookingAction(
  managerId: string,
  serviceSlug: string,
  bookingId: string,
  actionType: 'STATUS_CHANGED' | 'CANCELLED' | 'VENDOR_ASSIGNED',
  previousStatus: string | null | undefined,
  newStatus: string,
  note?: string | null
) {
  prisma.manager_action_logs.create({
    data: {
      recordType: 'BOOKING',
      serviceType: serviceSlug,
      recordId: bookingId,
      actionType,
      previousStatus: previousStatus || null,
      newStatus,
      note: note || null,
      managerId,
    },
  }).catch((e) => logger.error('Failed to log manager booking action', e));
}

// GET - Get single booking detail for manager (search across all services)
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
    let bookingId = resolvedParams.id;

    // If bookingId looks like a bookingNumber (contains uppercase + dashes like CB-2026-XXX), resolve to actual id
    if (bookingId && /^[A-Z]{2,4}-\d{4}-/.test(bookingId)) {
      const prefix = bookingId.split('-')[0];

      // Booking tables use `bookingNumber`; quote request tables use `requestNumber`
      // Prefixes verified against actual DB data (multiple formats due to historical changes)
      const bookingMap: Record<string, string> = {
        'BK': 'bike_bookings',
        'CB': 'chauffeur_bookings', 'CR': 'chauffeur_bookings',
        'BB': 'bus_bookings', 'BUS': 'bus_bookings',
        'SD': 'car_bookings',
        'TB': 'truck_bookings', 'TR': 'truck_bookings',
        'EB': 'equipment_bookings', 'EQ': 'equipment_bookings',
        'PB': 'packers_bookings', 'PK': 'packers_bookings',
        'LB': 'luxury_bookings', 'LUX': 'luxury_bookings',
      };
      const quoteRequestMap: Record<string, { table: string; bookingTable: string; bookingField: string }> = {
        'BKQ': { table: 'bike_quote_requests', bookingTable: 'bike_bookings', bookingField: 'quoteRequestId' },
        'BQR': { table: 'bus_quote_requests', bookingTable: 'bus_bookings', bookingField: 'quoteRequestId' },
        'BUSQ': { table: 'bus_quote_requests', bookingTable: 'bus_bookings', bookingField: 'quoteRequestId' },
        'SDQ': { table: 'self_drive_quote_requests', bookingTable: 'car_bookings', bookingField: 'quoteRequestId' },
        'TQR': { table: 'truck_quote_requests', bookingTable: 'truck_bookings', bookingField: 'quoteRequestId' },
        'EQR': { table: 'equipment_quote_requests', bookingTable: 'equipment_bookings', bookingField: 'quoteRequestId' },
        'PQR': { table: 'packers_quote_requests', bookingTable: 'packers_bookings', bookingField: 'quoteRequestId' },
        'PKQ': { table: 'packers_quote_requests', bookingTable: 'packers_bookings', bookingField: 'quoteRequestId' },
        'LQR': { table: 'luxury_quote_requests', bookingTable: 'luxury_bookings', bookingField: 'quoteRequestId' },
        'LUXQ': { table: 'luxury_quote_requests', bookingTable: 'luxury_bookings', bookingField: 'quoteRequestId' },
      };

      if (bookingMap[prefix]) {
        // Direct booking lookup by bookingNumber
        const found = await (prisma as any)[bookingMap[prefix]].findUnique({
          where: { bookingNumber: bookingId },
          select: { id: true },
        }).catch(() => null);
        if (found) bookingId = found.id;
      } else if (quoteRequestMap[prefix]) {
        // Quote request — find by requestNumber, then try to get the associated booking
        const qr = quoteRequestMap[prefix];
        const foundQr = await (prisma as any)[qr.table].findUnique({
          where: { requestNumber: bookingId },
          select: { id: true },
        }).catch(() => null);
        if (foundQr) {
          // Try to find the accepted booking for this quote request
          const linkedBooking = await (prisma as any)[qr.bookingTable].findFirst({
            where: { [qr.bookingField]: foundQr.id },
            select: { id: true },
          }).catch(() => null);
          // Use booking id if it exists, otherwise use quote request id (will show as quote request below)
          bookingId = linkedBooking?.id || foundQr.id;
        }
      }
    }

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

    // Get assigned location IDs
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean);

    // Common includes for relations
    const customerInclude = { select: { id: true, name: true, email: true, phone: true } };
    const locationInclude = { select: { id: true, name: true, slug: true } };

    // Search across all service booking tables
    const [
      bikeBooking,
      busBooking,
      carBooking,
      chauffeurBooking,
      equipmentBooking,
      luxuryBooking,
      packersBooking,
      truckBooking,
      wanderBooking,
    ] = await Promise.all([
      // Bike Rental
      prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          bike_quote_requests: true,
          bike_quotes: true,
          vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Bus Rental
      prisma.bus_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
          bus_quotes: true,
        },
      }).catch(() => null),

      // Self Drive
      prisma.car_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          self_drive_quote_requests: { select: { numberOfVehicles: true } },
          self_drive_quotes: true,
          vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Chauffeur / Car Rental — direct-broadcast flow, no vendor-quote system
      prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors_chauffeur_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_chauffeur_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Equipment Rental
      prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
          equipment_quotes: true,
        },
      }).catch(() => null),

      // Luxury Cars
      prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors_luxury_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          luxury_quotes: true,
        },
      }).catch(() => null),

      // Packers & Movers
      prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
          packers_quote_requests: true,
          packers_quotes: true,
        },
      }).catch(() => null),

      // Truck Transport
      prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
          truck_quote_requests: true,
          truck_quotes: true,
        },
      }).catch(() => null),

      // Wander Tours
      (prisma as any).wander_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customer: customerInclude,
          vendor: { select: { id: true, businessName: true, phone: true, email: true } },
          quoteRequest: {
            include: {
              listing: {
                select: {
                  title: true, duration: true,
                  mainLocation: { select: { id: true, name: true } },
                },
              },
            },
          },
          quote: { select: { amount: true, notes: true } },
        },
      }).catch(() => null),
    ]);

    // Find which booking exists
    let booking: any = null;
    let serviceName = '';
    let serviceSlug = '';

    if (bikeBooking) {
      booking = bikeBooking;
      serviceName = 'Bike Rental';
      serviceSlug = 'bike-rental';
    } else if (busBooking) {
      booking = busBooking;
      serviceName = 'Bus Rental';
      serviceSlug = 'bus-rental';
    } else if (carBooking) {
      booking = carBooking;
      serviceName = 'Self Drive';
      serviceSlug = 'self-drive';
    } else if (chauffeurBooking) {
      booking = chauffeurBooking;
      serviceName = 'Car Rental';
      serviceSlug = 'car-rental';
    } else if (equipmentBooking) {
      booking = equipmentBooking;
      serviceName = 'Equipment Rental';
      serviceSlug = 'equipment-rental';
    } else if (luxuryBooking) {
      booking = luxuryBooking;
      serviceName = 'Luxury Cars';
      serviceSlug = 'luxury-car-rental';
    } else if (packersBooking) {
      booking = packersBooking;
      serviceName = 'Packers & Movers';
      serviceSlug = 'packers-and-movers';
    } else if (truckBooking) {
      booking = truckBooking;
      serviceName = 'Truck Transport';
      serviceSlug = 'truck-transport';
    } else if (wanderBooking) {
      booking = wanderBooking;
      serviceName = 'Wander Tours';
      serviceSlug = 'wander';
    }

    if (!booking) {
      // Fallback: search quote request tables (booking_id may point to a quote request with no booking yet)
      const quoteRequestTables = [
        { table: 'self_drive_quote_requests', slug: 'self-drive', name: 'Self Drive Quote Request' },
        { table: 'bike_quote_requests', slug: 'bike-rental', name: 'Bike Quote Request' },
        { table: 'bus_quote_requests', slug: 'bus-rental', name: 'Bus Quote Request' },
        { table: 'truck_quote_requests', slug: 'truck-transport', name: 'Truck Quote Request' },
        { table: 'equipment_quote_requests', slug: 'equipment-rental', name: 'Equipment Quote Request' },
        { table: 'packers_quote_requests', slug: 'packers-and-movers', name: 'Packers Quote Request' },
        { table: 'luxury_quote_requests', slug: 'luxury-car-rental', name: 'Luxury Quote Request' },
      ];
      for (const qrt of quoteRequestTables) {
        const qr = await (prisma as any)[qrt.table].findUnique({
          where: { id: bookingId },
          include: { customers: { select: { id: true, name: true, email: true, phone: true } } },
        }).catch(() => null);
        if (qr) {
          return NextResponse.json({
            success: true,
            booking: {
              id: qr.id,
              bookingNumber: qr.requestNumber,
              status: qr.status,
              serviceName: qrt.name,
              serviceSlug: qrt.slug,
              isQuoteRequest: true,
              customerName: qr.customerName || qr.customers?.name,
              customerEmail: qr.customerEmail || qr.customers?.email,
              customerPhone: qr.customerPhone || qr.customers?.phone,
              customer: qr.customers || null,
              pickupCity: qr.pickupCity || qr.locationName || null,
              pickupAddress: qr.pickupAddress ?? null,
              pickupPincode: qr.pickupPincode ?? null,
              pickupFloor: qr.pickupFloor ?? null,
              hasPickupLift: qr.hasPickupLift ?? null,
              dropCity: qr.dropCity ?? null,
              dropAddress: qr.dropAddress ?? null,
              dropPincode: qr.dropPincode ?? null,
              dropFloor: qr.dropFloor ?? null,
              hasDropLift: qr.hasDropLift ?? null,
              deliveryCity: qr.deliveryCity ?? null,
              deliveryAddress: qr.deliveryAddress ?? null,
              numberOfVehicles: qr.numberOfVehicles ?? null,
              pickupDate: qr.pickupDate || qr.startDate || qr.scheduledDate || null,
              pickupTime: qr.pickupTime ?? null,
              expectedDeliveryDate: qr.expectedDeliveryDate ?? null,
              expectedDeliveryTime: qr.expectedDeliveryTime ?? null,
              // Truck specific
              truckBodyType: qr.truckBodyType ?? null,
              tripDirection: qr.tripDirection ?? null,
              vehicleCategoryName: qr.vehicleCategoryName ?? null,
              estimatedWeight: qr.estimatedWeight ?? null,
              estimatedVolume: qr.estimatedVolume ?? null,
              goodsType: qr.goodsType ?? null,
              goodsDescription: qr.goodsDescription ?? null,
              requiresLabour: qr.requiresLabour ?? null,
              labourCount: qr.labourCount ?? null,
              hasMultipleStops: qr.hasMultipleStops ?? null,
              multipleStopsDetails: qr.multipleStopsDetails ?? null,
              receiverName: qr.receiverName ?? null,
              receiverPhone: qr.receiverPhone ?? null,
              requiresPOD: qr.requiresPOD ?? null,
              isFlexibleDate: qr.isFlexibleDate ?? null,
              needInsurance: qr.needInsurance ?? null,
              needPackaging: qr.needPackaging ?? null,
              budgetMin: qr.budgetMin ?? null,
              budgetMax: qr.budgetMax ?? null,
              requirements: qr.requirements ?? null,
              createdAt: qr.createdAt,
              updatedAt: qr.updatedAt,
              assignedVendor: null,
              acceptedVendor: null,
            },
          });
        }
      }
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if manager has access to this booking's location
    const bookingLocationId = booking.locationId;
    const bookingLocationName = booking.pickupCity || booking.locationName;

    const hasLocationAccess = assignedLocationIds.length === 0 ||
      (bookingLocationId && assignedLocationIds.includes(bookingLocationId)) ||
      (bookingLocationName && assignedLocationNames.includes(bookingLocationName));

    if (!hasLocationAccess) {
      return NextResponse.json(
        { error: 'Access denied. You are not assigned to this location.' },
        { status: 403 }
      );
    }

    // Get vendor name based on service type
    const getVendorData = () => {
      if (serviceSlug === 'bike-rental') {
        return booking.vendors_bike_bookings_acceptedVendorIdTovendors || booking.vendors_bike_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'self-drive') {
        return booking.vendors_car_bookings_acceptedVendorIdTovendors || booking.vendors_car_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'car-rental') {
        return booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors || booking.vendors_chauffeur_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'luxury-car-rental') {
        return booking.vendors_luxury_bookings_acceptedVendorIdTovendors || booking.vendors_luxury_bookings_assignedVendorIdTovendors;
      } else {
        return booking.vendors;
      }
    };

    const vendor = getVendorData();

    // Destructure out Prisma's verbose relation names, spread all raw fields
    const {
      customers,
      locations,
      vendors,
      bike_quote_requests,
      self_drive_quote_requests,
      packers_quote_requests,
      truck_quote_requests,
      bike_quotes,
      bus_quotes,
      self_drive_quotes,
      equipment_quotes,
      luxury_quotes,
      packers_quotes,
      truck_quotes,
      vendors_bike_bookings_assignedVendorIdTovendors,
      vendors_bike_bookings_acceptedVendorIdTovendors,
      vendors_car_bookings_assignedVendorIdTovendors,
      vendors_car_bookings_acceptedVendorIdTovendors,
      vendors_chauffeur_bookings_assignedVendorIdTovendors,
      vendors_chauffeur_bookings_acceptedVendorIdTovendors,
      vendors_luxury_bookings_assignedVendorIdTovendors,
      vendors_luxury_bookings_acceptedVendorIdTovendors,
      ...rawFields
    } = booking;

    // Normalize the vendor's accepted quote (terms, inclusions, exclusions)
    // into one shape regardless of service type — every *_quotes model uses
    // the same field names (inclusions/exclusions/termsConditions as
    // JSON-stringified arrays), so this is a straight parse-and-map.
    const acceptedQuoteRow =
      bike_quotes || bus_quotes || self_drive_quotes || equipment_quotes || luxury_quotes || packers_quotes || truck_quotes || null;
    const parseJsonArray = (value: unknown): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value as string[];
      try {
        const parsed = JSON.parse(value as string);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const quote = acceptedQuoteRow
      ? {
          quoteNumber: acceptedQuoteRow.quoteNumber,
          inclusions: parseJsonArray(acceptedQuoteRow.inclusions),
          exclusions: parseJsonArray(acceptedQuoteRow.exclusions),
          termsConditions: parseJsonArray(acceptedQuoteRow.termsConditions),
          vendorMessage: (acceptedQuoteRow as any).vendorMessage || null,
          validTill: acceptedQuoteRow.validTill,
        }
      : null;

    // Pull packers fields from the related quote request when this booking is a packers booking
    const packersFields = packers_quote_requests
      ? {
          shiftingScope: packers_quote_requests.shiftingScope,
          pickupPincode: packers_quote_requests.pickupPincode,
          dropPincode: packers_quote_requests.dropPincode,
          expectedDeliveryDate: packers_quote_requests.expectedDeliveryDate,
          expectedDeliveryTime: packers_quote_requests.expectedDeliveryTime,
          inventoryList: packers_quote_requests.inventoryList,
          boxesCount: packers_quote_requests.boxesCount,
          bagsCount: packers_quote_requests.bagsCount,
          estimatedWeight: packers_quote_requests.estimatedWeight,
          estimatedVolumeCubFt: packers_quote_requests.estimatedVolumeCubFt,
          hasHeavyItems: packers_quote_requests.hasHeavyItems,
          heavyItemsDesc: packers_quote_requests.heavyItemsDesc,
          hasFragileItems: packers_quote_requests.hasFragileItems,
          fragileItemsDesc: packers_quote_requests.fragileItemsDesc,
          pickupFloor: rawFields.pickupFloor ?? packers_quote_requests.pickupFloor,
          hasPickupLift: packers_quote_requests.hasPickupLift,
          dropFloor: rawFields.dropFloor ?? packers_quote_requests.dropFloor,
          hasDropLift: packers_quote_requests.hasDropLift,
          needPacking: packers_quote_requests.needPacking,
          needLoading: packers_quote_requests.needLoading,
          needUnloading: packers_quote_requests.needUnloading,
          labourCount: packers_quote_requests.labourCount,
          vehicleType: packers_quote_requests.vehicleType,
          partLoadAccepted: packers_quote_requests.partLoadAccepted,
          needInsurance: packers_quote_requests.needInsurance,
          insuranceValue: packers_quote_requests.insuranceValue,
          requiresPOD: packers_quote_requests.requiresPOD,
          receiverName: packers_quote_requests.receiverName,
          receiverPhone: packers_quote_requests.receiverPhone,
          hasMultipleStops: packers_quote_requests.hasMultipleStops,
          multipleStopsDetails: packers_quote_requests.multipleStopsDetails,
          propertySize: rawFields.propertySize ?? packers_quote_requests.propertySize,
          shiftingType: rawFields.shiftingType ?? packers_quote_requests.shiftingType,
        }
      : {};

    // Pull truck fields from the related quote request when this booking is a truck booking
    const truckFields = truck_quote_requests
      ? {
          truckBodyType: truck_quote_requests.truckBodyType,
          tripDirection: truck_quote_requests.tripDirection,
          estimatedVolume: truck_quote_requests.estimatedVolume,
          estimatedWeight: truck_quote_requests.estimatedWeight,
          goodsDescription: rawFields.goodsDescription || truck_quote_requests.goodsDescription,
          pickupPincode: truck_quote_requests.pickupPincode,
          dropPincode: truck_quote_requests.dropPincode,
          pickupFloor: rawFields.pickupFloor ?? truck_quote_requests.pickupFloor,
          hasPickupLift: truck_quote_requests.hasPickupLift,
          dropFloor: rawFields.dropFloor ?? truck_quote_requests.dropFloor,
          hasDropLift: truck_quote_requests.hasDropLift,
          expectedDeliveryDate: truck_quote_requests.expectedDeliveryDate,
          expectedDeliveryTime: truck_quote_requests.expectedDeliveryTime,
          requiresLabour: truck_quote_requests.requiresLabour,
          labourCount: rawFields.labourCount ?? truck_quote_requests.labourCount,
          hasMultipleStops: truck_quote_requests.hasMultipleStops,
          multipleStopsDetails: truck_quote_requests.multipleStopsDetails,
          receiverName: truck_quote_requests.receiverName,
          receiverPhone: truck_quote_requests.receiverPhone,
          requiresPOD: truck_quote_requests.requiresPOD,
          isFlexibleDate: truck_quote_requests.isFlexibleDate,
          needInsurance: truck_quote_requests.needInsurance,
          needPackaging: truck_quote_requests.needPackaging,
          budgetMin: truck_quote_requests.budgetMin,
          budgetMax: truck_quote_requests.budgetMax,
          requirements: rawFields.customerNotes || truck_quote_requests.requirements,
        }
      : {};

    // Build clean relation references
    const assignedVendor = serviceSlug === 'bike-rental' ? vendors_bike_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'self-drive' ? vendors_car_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'car-rental' ? vendors_chauffeur_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'luxury-car-rental' ? vendors_luxury_bookings_assignedVendorIdTovendors :
                           null;
    const acceptedVendor = serviceSlug === 'bike-rental' ? vendors_bike_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'self-drive' ? vendors_car_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'car-rental' ? vendors_chauffeur_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'luxury-car-rental' ? vendors_luxury_bookings_acceptedVendorIdTovendors :
                           vendors;

    // Format response - spread ALL raw fields, then overlay normalized aliases
    const formattedBooking = {
      ...rawFields,
      ...packersFields,
      ...truckFields,
      serviceName,
      serviceSlug,
      quote,
      // Normalized customer fields
      customerName: customers?.name || booking.customerName,
      customerEmail: customers?.email || booking.customerEmail,
      customerPhone: customers?.phone || booking.customerPhone,
      customer: customers,
      // Normalized vendor fields
      vendorName: vendor?.businessName || null,
      vendorPhone: vendor?.phone || null,
      vendorEmail: vendor?.email || null,
      assignedVendor,
      acceptedVendor,
      // Normalized location
      locationName: locations?.name || booking.pickupCity || booking.locationName,
      // Normalized vehicle
      requestedVehicleName: booking.requestedVehicleName || booking.vehicleName || booking.carCategoryName || null,
      requestedCategory: booking.requestedCategory || booking.vehicleCategory || booking.carCategory || null,
      // Normalized date aliases
      pickupDate: booking.pickupDate || booking.startDate || booking.moveDate,
      pickupTime: booking.pickupTime || '',
      dropDate: booking.dropDate || booking.returnDate || booking.endDate || null,
      dropTime: booking.dropTime || booking.returnTime || '',
      // Normalized amount aliases
      totalDays: booking.totalDays || booking.tripDays || booking.durationDays || 0,
      dailyRate: booking.dailyRate || booking.baseFare || booking.baseAmount || booking.baseRate || null,
      totalAmount: booking.totalAmount || booking.grandTotal || 0,
      grandTotal: booking.grandTotal || booking.totalAmount || 0,
      paidAmount: booking.paidAmount || booking.advancePaid || 0,
      advanceAmount: booking.advanceAmount || booking.partialPayment || booking.advancePaid || 0,
      // Normalized trip status aliases
      pickedUpAt: booking.pickedUpAt || booking.tripStartedAt || null,
      returnedAt: booking.returnedAt || booking.tripEndedAt || null,
      // Normalized address & service-specific fields
      pickupAddress: serviceSlug === 'bike-rental'
        ? (bike_quote_requests?.pickupAddress ?? booking.pickupAddress ?? null)
        : (booking.pickupAddress ?? null),
      dropAddress: serviceSlug === 'bike-rental'
        ? (booking.dropAddress ?? null)
        : (booking.dropAddress ?? null),
      deliveryAddress: booking.deliveryAddress ?? null,
      deliveryCity: booking.deliveryCity ?? null,
      numberOfVehicles: serviceSlug === 'bike-rental'
        ? (bike_quote_requests?.numberOfVehicles ?? null)
        : serviceSlug === 'self-drive'
          ? (self_drive_quote_requests?.numberOfVehicles ?? null)
          : null,
    };

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error: any) {
    logger.error('Manager booking detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// Helper: find booking across all service tables, returns { booking, serviceSlug, tableName }
async function findBookingById(bookingId: string) {
  const searches = [
    { fn: () => prisma.bike_bookings.findUnique({ where: { id: bookingId } }), slug: 'bike-rental', table: 'bike' },
    { fn: () => prisma.bus_bookings.findUnique({ where: { id: bookingId } }), slug: 'bus-rental', table: 'bus' },
    { fn: () => prisma.car_bookings.findUnique({ where: { id: bookingId } }), slug: 'self-drive', table: 'car' },
    { fn: () => prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } }), slug: 'car-rental', table: 'chauffeur' },
    { fn: () => prisma.equipment_bookings.findUnique({ where: { id: bookingId } }), slug: 'equipment-rental', table: 'equipment' },
    { fn: () => prisma.luxury_bookings.findUnique({ where: { id: bookingId } }), slug: 'luxury-car-rental', table: 'luxury' },
    { fn: () => prisma.packers_bookings.findUnique({ where: { id: bookingId } }), slug: 'packers-and-movers', table: 'packers' },
    { fn: () => prisma.truck_bookings.findUnique({ where: { id: bookingId } }), slug: 'truck-transport', table: 'truck' },
    { fn: () => (prisma as any).wander_bookings.findUnique({ where: { id: bookingId }, include: { customer: { select: { name: true, phone: true, email: true } } } }), slug: 'wander', table: 'wander' },
  ];

  const results = await Promise.all(searches.map(s => s.fn().catch(() => null)));
  for (let i = 0; i < results.length; i++) {
    if (results[i]) return { booking: results[i] as any, serviceSlug: searches[i].slug, table: searches[i].table };
  }
  return null;
}

// PUT - Perform actions on a booking (verify_payment, reject_payment, broadcast, complete_trip, cancel)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Verify manager role
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason, notes } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    // Find the booking across all tables
    const found = await findBookingById(bookingId);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const { booking, serviceSlug, table } = found;

    // ==================== VERIFY PAYMENT ====================
    if (action === 'verify_payment') {
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'STATUS_CHANGED', booking.status, 'PAYMENT_VERIFIED', 'Payment verified');
      if (table === 'chauffeur') {
        const isSingleVendor = !!booking.assignedVendorId;
        const advanceAmount = booking.paidAmount > 0
          ? booking.paidAmount
          : booking.partialPayment || Math.round(booking.grandTotal * 0.3);

        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: advanceAmount >= booking.grandTotal ? 'PAID' : 'PARTIAL',
            advancePaymentVerified: true,
            paidAmount: advanceAmount,
            status: isSingleVendor ? 'PENDING_VENDOR' : 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
            adminNotes: notes || reason ? `Payment verified: ${notes || reason}` : 'Payment verified by manager',
          },
        });

        // Notify customer
        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your car rental booking payment of ₹${advanceAmount} has been approved.`,
              type: 'payment',
              serviceType: 'car',
              bookingId,
              quoteId: null,
            }),
          });
          await sendFCMNotification({
            customerId: booking.customerId,
            title: 'Payment Approved!',
            body: `Your car rental booking payment of ₹${advanceAmount} has been approved.`,
            data: { type: 'payment', serviceType: 'car', bookingId },
          });
        } catch (e) { logger.error('Notification error', e); }

        // Notify vendor(s)
        if (isSingleVendor) {
          sendVendorDirectNotification({
            vendorId: booking.assignedVendorId,
            title: 'New Car Rental Booking!',
            body: `A new car rental booking has been assigned to you. Please review and confirm.`,
            type: 'booking_assigned',
            serviceType: 'car',
            bookingId,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        } else {
          const fullBooking = await prisma.chauffeur_bookings.findUnique({
            where: { id: bookingId },
            select: { locationId: true, locationName: true, bookingNumber: true },
          });
          if (fullBooking?.locationId) {
            sendQuoteRequestNotificationToVendors({
              requestId: bookingId,
              requestNumber: fullBooking.bookingNumber || bookingId,
              locationId: fullBooking.locationId,
              locationName: fullBooking.locationName || 'your city',
              customerName: 'A customer',
              serviceType: 'car',
              serviceDisplayName: 'Car Rental',
            }).catch((err: any) => logger.error('Broadcast notify failed', err));
          }
        }

        return NextResponse.json({
          success: true,
          message: isSingleVendor
            ? 'Payment verified. Booking sent to assigned vendor.'
            : 'Payment verified. Booking broadcasted to all vendors.',
        });
      }

      if (table === 'bike') {
        const hasAcceptedVendor = !!(booking.assignedVendorId || booking.acceptedVendorId);
        const vendorId = booking.assignedVendorId || booking.acceptedVendorId;

        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL',
            advancePaymentVerified: true,
            paidAmount: booking.advanceAmount || booking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.acceptedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.dropDate ? new Date(booking.dropDate) : startDate;
            const availability = await checkFleetAvailability(booking.acceptedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.acceptedVehicleId, startDate, endDate, bookingId, 'bike');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your bike booking payment has been approved.`,
              type: 'payment', serviceType: 'bike', bookingId, quoteId: null,
            }),
          });
          await sendFCMNotification({
            customerId: booking.customerId,
            title: 'Payment Approved!',
            body: `Your bike booking payment has been approved.`,
            data: { type: 'payment', serviceType: 'bike', bookingId },
          });
        } catch (e) { logger.error('Notification error', e); }

        if (hasAcceptedVendor && vendorId) {
          sendVendorDirectNotification({
            vendorId,
            title: 'Payment Verified! Booking Confirmed',
            body: `Customer's advance payment has been verified for bike booking #${booking.bookingNumber}.`,
            type: 'payment_received', serviceType: 'bike', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'car') {
        const hasAcceptedVendor = !!(booking.assignedVendorId || booking.acceptedVendorId);
        const vendorId = booking.assignedVendorId || booking.acceptedVendorId;

        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL',
            advancePaymentVerified: true,
            paidAmount: booking.advanceAmount || booking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.dropDate ? new Date(booking.dropDate) : startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'car');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your self-drive car booking payment has been approved.`,
              type: 'payment', serviceType: 'self-drive', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (hasAcceptedVendor && vendorId) {
          sendVendorDirectNotification({
            vendorId,
            title: 'Payment Verified! Booking Confirmed',
            body: `Customer's advance payment has been verified for self-drive booking #${booking.bookingNumber}.`,
            type: 'payment_received', serviceType: 'self-drive', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'bus') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
            confirmedAt: new Date(),
            adminNotes: 'Payment verified by manager',
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.returnDate ? new Date(booking.returnDate) : startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'bus');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your bus booking payment has been approved.`,
              type: 'payment', serviceType: 'bus', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Trip is confirmed.`,
            type: 'payment_received', serviceType: 'bus', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'truck') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
            vendorNotes: 'Payment verified by manager',
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'truck');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your truck booking payment has been approved.`,
              type: 'payment', serviceType: 'truck', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Trip is confirmed.`,
            type: 'payment_received', serviceType: 'truck', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'equipment') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your equipment booking payment has been approved.`,
              type: 'payment', serviceType: 'equipment', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'equipment', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'luxury') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        if (booking.acceptedQuoteId && booking.pickupDate) {
          try {
            const quote = await prisma.luxury_quotes.findUnique({
              where: { id: booking.acceptedQuoteId },
              select: { fleetId: true },
            });
            if (quote?.fleetId) {
              const startDate = new Date(booking.pickupDate);
              const endDate = booking.returnDate ? new Date(booking.returnDate) : startDate;
              const availability = await checkFleetAvailability(quote.fleetId, startDate, endDate);
              if (availability.available) {
                await blockDatesForBooking(prisma, quote.fleetId, startDate, endDate, bookingId, 'luxury');
              }
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your luxury car booking payment has been approved.`,
              type: 'payment', serviceType: 'luxury', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.acceptedVendorId) {
          sendVendorDirectNotification({
            vendorId: booking.acceptedVendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for luxury booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'luxury', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'packers') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        if (booking.acceptedQuoteId && booking.scheduledDate) {
          try {
            const quote = await prisma.packers_quotes.findUnique({
              where: { id: booking.acceptedQuoteId },
              select: { vendorFleetId: true },
            });
            if (quote?.vendorFleetId) {
              const startDate = new Date(booking.scheduledDate);
              const availability = await checkFleetAvailability(quote.vendorFleetId, startDate, startDate);
              if (availability.available) {
                await blockDatesForBooking(prisma, quote.vendorFleetId, startDate, startDate, bookingId, 'packers');
              }
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your packers & movers booking payment has been approved.`,
              type: 'payment', serviceType: 'packers', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'packers', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'wander') {
        await (prisma as any).wander_bookings.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED', advancePaid: true },
        });

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your wander tour advance payment has been approved. Booking confirmed!`,
              type: 'payment', serviceType: 'wander', bookingId, quoteId: null,
            }),
          });
          await sendFCMNotification({
            customerId: booking.customerId,
            title: 'Payment Approved!',
            body: `Your wander tour booking is confirmed. Advance payment verified.`,
            data: { type: 'payment', serviceType: 'wander', bookingId },
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer advance payment for wander booking #${booking.bookingId} has been verified.`,
            type: 'payment_received', serviceType: 'wander', bookingId, bookingNumber: booking.bookingId,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Wander booking payment verified successfully.' });
      }

      return NextResponse.json({ success: false, error: 'Unsupported booking type for payment verification' }, { status: 400 });
    }

    // ==================== FORCE VERIFY PAYMENT (Razorpay paid but webhook missed) ====================
    if (action === 'force_verify_payment') {
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'STATUS_CHANGED', booking.status, 'PAYMENT_VERIFIED', 'Payment force-verified');
      if (table !== 'chauffeur') {
        return NextResponse.json({ success: false, error: 'Action not supported for this service type' }, { status: 400 });
      }

      if (booking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({
          success: false,
          error: `Booking status is "${booking.status}". Force verify only works on PENDING_PAYMENT bookings.`,
        }, { status: 400 });
      }

      const isSingleVendorFV = !!booking.assignedVendorId;
      const managerNote = `[Manager force-verified on ${new Date().toLocaleDateString('en-IN')} by ${session.user.email || session.user.name}]${notes ? ` — ${notes}` : ''}`;

      await prisma.chauffeur_bookings.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          advancePaymentVerified: true,
          paidAmount: booking.grandTotal || 0,
          status: isSingleVendorFV ? 'PENDING_VENDOR' : 'BROADCASTED',
          broadcastedAt: new Date(),
          responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          adminNotes: managerNote,
        },
      });

      try {
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Payment Confirmed!',
            body: `Your car rental booking payment has been confirmed and your booking is now active.`,
            type: 'payment',
            serviceType: 'car',
            bookingId,
            quoteId: null,
          }),
        });
        await sendFCMNotification({
          customerId: booking.customerId,
          title: 'Payment Confirmed!',
          body: `Your car rental booking payment has been confirmed and your booking is now active.`,
          data: { type: 'payment', serviceType: 'car', bookingId },
        });
      } catch (e) { logger.error('Force verify - notification error', e); }

      if (isSingleVendorFV) {
        sendVendorDirectNotification({
          vendorId: booking.assignedVendorId,
          title: 'New Car Rental Booking!',
          body: `A car rental booking has been assigned to you. Please review and confirm.`,
          type: 'booking_assigned',
          serviceType: 'car',
          bookingId,
        }).catch((err: any) => logger.error('Force verify - vendor notify failed', err));
      } else {
        const fvBooking = await prisma.chauffeur_bookings.findUnique({
          where: { id: bookingId },
          select: { locationId: true, locationName: true, bookingNumber: true },
        });
        if (fvBooking?.locationId) {
          sendQuoteRequestNotificationToVendors({
            requestId: bookingId,
            requestNumber: fvBooking.bookingNumber || bookingId,
            locationId: fvBooking.locationId,
            locationName: fvBooking.locationName || 'your city',
            customerName: booking.customerName || 'A customer',
            serviceType: 'car',
            serviceDisplayName: 'Car Rental',
          }).catch((err: any) => logger.error('Force verify - broadcast failed', err));
        }
      }

      return NextResponse.json({
        success: true,
        message: isSingleVendorFV
          ? 'Payment force-verified. Booking sent to assigned vendor.'
          : 'Payment force-verified. Booking broadcasted to all vendors.',
      });
    }

    // ==================== REJECT PAYMENT ====================
    if (action === 'reject_payment') {
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'STATUS_CHANGED', booking.status, 'PAYMENT_REJECTED', reason || notes);
      const rejectNotes = reason || notes || 'Payment rejected by manager';
      const rejectNotifBody = `Your booking payment was rejected. ${reason || 'Please contact support.'}`;
      const serviceTypeMap: Record<string, string> = {
        'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
        'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
        'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers', 'wander': 'wander',
      };

      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: rejectNotes,
          },
        });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            customerNotes: `${booking.customerNotes || ''}\n\nPayment rejected: ${rejectNotes}`.trim(),
          },
        });
      } else if (table === 'car') {
        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            vendorNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
            vendorNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'wander') {
        await (prisma as any).wander_bookings.update({
          where: { id: bookingId },
          data: { status: 'PAYMENT_PENDING' },
        });
      }

      // Send rejection notification
      try {
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Payment Rejected',
            body: rejectNotifBody,
            type: 'payment',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
        await sendFCMNotification({
          customerId: booking.customerId,
          title: 'Payment Rejected',
          body: rejectNotifBody,
          data: { type: 'payment', serviceType: serviceTypeMap[serviceSlug] || 'car', bookingId },
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Payment rejected.' });
    }

    // ==================== BROADCAST ====================
    if (action === 'broadcast') {
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'STATUS_CHANGED', booking.status, 'BROADCASTED');
      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.locationId) {
          sendQuoteRequestNotificationToVendors({
            requestId: bookingId,
            requestNumber: booking.bookingNumber || bookingId,
            locationId: booking.locationId,
            locationName: booking.locationName || 'your city',
            customerName: 'A customer',
            serviceType: 'car',
            serviceDisplayName: 'Car Rental',
          }).catch((err: any) => logger.error('Broadcast notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      if (table === 'bike') {
        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      if (table === 'car') {
        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      return NextResponse.json({ success: false, error: 'Broadcast not supported for this booking type' }, { status: 400 });
    }

    // ==================== COMPLETE TRIP ====================
    if (action === 'complete_trip') {
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'STATUS_CHANGED', booking.status, 'COMPLETED');
      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', returnedAt: new Date() } });
      } else if (table === 'car') {
        await prisma.car_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date(), returnedAt: new Date() } });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      }

      // Notify customer
      try {
        const serviceTypeMap: Record<string, string> = {
          'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
          'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
          'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers',
        };
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Trip Completed!',
            body: `Your booking #${booking.bookingNumber} has been marked as completed. Thank you for choosing TransRentals!`,
            type: 'booking',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Trip marked as completed.' });
    }

    // ==================== CANCEL BOOKING ====================
    if (action === 'cancel') {
      const cancelReason = reason || 'Cancelled by manager';
      logManagerBookingAction(session.user.id, serviceSlug, bookingId, 'CANCELLED', booking.status, 'CANCELLED', cancelReason);

      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancellationReason: cancelReason } });
      } else if (table === 'car') {
        await prisma.car_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      }

      // Notify customer
      try {
        const serviceTypeMap: Record<string, string> = {
          'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
          'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
          'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers',
        };
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Booking Cancelled',
            body: `Your booking #${booking.bookingNumber} has been cancelled. ${reason || ''}`.trim(),
            type: 'booking',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
        await sendFCMNotification({
          customerId: booking.customerId,
          title: 'Booking Cancelled',
          body: `Your booking #${booking.bookingNumber} has been cancelled. ${reason || ''}`.trim(),
          data: { type: 'booking', serviceType: serviceTypeMap[serviceSlug] || 'car', bookingId },
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Booking cancelled.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Manager booking action error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform action', details: error?.message },
      { status: 500 }
    );
  }
}
