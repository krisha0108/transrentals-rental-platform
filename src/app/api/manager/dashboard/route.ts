import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get manager dashboard data (bookings for assigned locations/services)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: {
          include: {
            location: true,
          },
        },
        manager_services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get assigned location and service IDs
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause for bookings
    const bookingWhere: any = {};

    // Filter by assigned locations
    if (assignedLocationIds.length > 0) {
      bookingWhere.locationId = { in: assignedLocationIds };
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      bookingWhere.status = status;
    }

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      bookingWhere.pickupDate = {};
      if (dateFrom) {
        bookingWhere.pickupDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        bookingWhere.pickupDate.lte = new Date(dateTo);
      }
    }

    // Helper to determine if we should fetch from a service
    const shouldFetchService = (serviceSlug: string) => {
      if (!service || service === 'all') return true;
      return service === serviceSlug;
    };

    // Service-specific includes for bookings
    const bikeBookingInclude = {
      customers: { select: { id: true, name: true, email: true, phone: true } },
      vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      locations: { select: { id: true, name: true, slug: true } },
    };

    const carBookingInclude = {
      customers: { select: { id: true, name: true, email: true, phone: true } },
      vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      locations: { select: { id: true, name: true, slug: true } },
    };

    const chauffeurBookingInclude = {
      customers: { select: { id: true, name: true, email: true, phone: true } },
      vendors_chauffeur_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      vendors_chauffeur_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      locations: { select: { id: true, name: true, slug: true } },
    };

    // Fetch all bookings and vendors in parallel for better performance
    const [
      bikeBookings,
      carBookings,
      chauffeurBookings,
      vendors,
    ] = await Promise.all([
      // Bike Bookings
      shouldFetchService('bike-rental')
        ? prisma.bike_bookings.findMany({
            where: bookingWhere,
            include: bikeBookingInclude,
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).catch((e) => { logger.error('Error fetching bike bookings', e); return []; })
        : Promise.resolve([]),

      // Car Bookings
      shouldFetchService('car-rental')
        ? prisma.car_bookings.findMany({
            where: bookingWhere,
            include: carBookingInclude,
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).catch((e) => { logger.error('Error fetching car bookings', e); return []; })
        : Promise.resolve([]),

      // Chauffeur Bookings
      shouldFetchService('chauffeur')
        ? prisma.chauffeur_bookings.findMany({
            where: bookingWhere,
            include: chauffeurBookingInclude,
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).catch((e) => { logger.error('Error fetching chauffeur bookings', e); return []; })
        : Promise.resolve([]),

      // Vendors in assigned locations
      assignedLocationIds.length > 0
        ? prisma.vendors.findMany({
            where: {
              vendor_approved_locations: {
                some: {
                  locationId: { in: assignedLocationIds },
                  isActive: true,
                },
              },
            },
            select: {
              id: true,
              businessName: true,
              ownerName: true,
              phone: true,
              email: true,
              status: true,
              vendor_approved_locations: {
                where: {
                  locationId: { in: assignedLocationIds },
                  isActive: true,
                },
                include: {
                  location: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          }).catch((e) => { logger.error('Error fetching vendors', e); return []; })
        : Promise.resolve([]),
    ]);

    // Combine and transform all bookings
    const allBookings: any[] = [
      ...bikeBookings.map((b: any) => ({ ...b, serviceName: 'Bike Rental', serviceSlug: 'bike-rental' })),
      ...carBookings.map((b: any) => ({
        ...b,
        serviceName: 'Car Rental',
        serviceSlug: 'car-rental',
        locationName: b.locations?.name || b.locationName,
      })),
      ...chauffeurBookings.map((b: any) => ({ ...b, serviceName: 'Chauffeur Drive', serviceSlug: 'chauffeur' })),
    ];

    // Sort all bookings by createdAt and limit
    allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const bookings = allBookings.slice(0, 100);

    // Get stats
    const stats = {
      totalBookings: bookings.length,
      pendingPayment: bookings.filter((b) => b.status === 'PENDING_PAYMENT' || b.status === 'PAYMENT_SUBMITTED').length,
      pendingApproval: bookings.filter((b) => b.status === 'PAYMENT_VERIFIED' || b.status === 'BROADCASTED').length,
      activeTrips: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
      completedToday: bookings.filter(
        (b) => b.status === 'COMPLETED' && b.returnedAt && new Date(b.returnedAt).toDateString() === new Date().toDateString()
      ).length,
      totalVendors: vendors.length,
      activeVendors: vendors.filter((v) => v.status === 'APPROVED').length,
    };

    return NextResponse.json({
      success: true,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        assignedLocations: manager.manager_locations.map((ml) => ml.locations),
        assignedServices: manager.manager_services.map((ms) => ms.services),
      },
      assignedServices: manager.manager_services.map((ms) => ({
        id: ms.services.id,
        name: ms.services.name,
        slug: ms.services.slug,
      })),
      stats,
      bookings: bookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        vendorName: (b.vendors_bike_bookings_acceptedVendorIdTovendors || b.vendors_car_bookings_acceptedVendorIdTovendors || b.vendors_chauffeur_bookings_acceptedVendorIdTovendors)?.businessName || (b.vendors_bike_bookings_assignedVendorIdTovendors || b.vendors_car_bookings_assignedVendorIdTovendors || b.vendors_chauffeur_bookings_assignedVendorIdTovendors)?.businessName,
        locationName: b.locations?.name || b.locationName,
        serviceName: b.serviceName,
        serviceSlug: b.serviceSlug,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        totalAmount: b.totalAmount,
        advancePaymentVerified: b.advancePaymentVerified,
        createdAt: b.createdAt,
      })),
      vendors,
    });
  } catch (error: any) {
    logger.error('Manager dashboard error', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error?.message },
      { status: 500 }
    );
  }
}
