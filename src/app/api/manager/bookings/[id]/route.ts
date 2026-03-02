import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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
    const { id: bookingId } = resolvedParams;

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
    ] = await Promise.all([
      // Bike Rental
      prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
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
        },
      }).catch(() => null),

      // Self Drive
      prisma.car_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Chauffeur / Car Rental
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
        },
      }).catch(() => null),

      // Luxury Cars
      prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors_luxury_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Packers & Movers
      prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Truck Transport
      prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
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
    }

    if (!booking) {
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
      serviceName,
      serviceSlug,
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
      // Normalized trip status aliases
      pickedUpAt: booking.pickedUpAt || booking.tripStartedAt || null,
      returnedAt: booking.returnedAt || booking.tripEndedAt || null,
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
