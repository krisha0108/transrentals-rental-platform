import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations.name);
    const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services.slug);

    if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
      return NextResponse.json({
        success: true,
        bookings: [],
        services: manager.manager_services.map((ms) => ({
          id: ms.services.id,
          name: ms.services.name,
          slug: ms.services.slug,
        })),
        locations: [],
        stats: { total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0 },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    // service / status / location accept a comma-separated list so the UI can offer
    // multi-select. An absent param, or the literal 'all', means "no restriction".
    const multi = (name: string): string[] => {
      const raw = (searchParams.get(name) || '').trim();
      if (!raw || raw === 'all') return [];
      return raw.split(',').map((v) => v.trim()).filter(Boolean);
    };

    const serviceFilters = multi('service');
    const statusFilters = multi('status');
    const locationFilters = multi('location');
    const sourceFilter = searchParams.get('source') || 'all';
    const dateFilter = searchParams.get('date') || 'all';
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    // Helper to check if service is assigned
    const isServiceAssigned = (serviceSlug: string): boolean => {
      return assignedServiceSlugs.some(slug =>
        slug === serviceSlug ||
        slug.includes(serviceSlug) ||
        serviceSlug.includes(slug)
      );
    };

    // Helper to check if should fetch this service
    const shouldFetchService = (serviceSlug: string): boolean => {
      if (!isServiceAssigned(serviceSlug)) return false;
      if (serviceFilters.length === 0) return true;
      return serviceFilters.some((f) =>
        f === serviceSlug || f.includes(serviceSlug) || serviceSlug.includes(f),
      );
    };

    // Build filters with optional status filter
    const buildFilter = (baseFilter: any) => {
      if (statusFilters.length === 1) {
        return { ...baseFilter, status: statusFilters[0] };
      }
      if (statusFilters.length > 1) {
        return { ...baseFilter, status: { in: statusFilters } };
      }
      return baseFilter;
    };

    const locationIdFilter = buildFilter({ locationId: { in: assignedLocationIds } });
    const pickupCityFilter = buildFilter({ pickupCity: { in: assignedLocationNames } });
    const locationNameFilter = buildFilter({ locationName: { in: assignedLocationNames } });

    // Common includes for relations
    const customerInclude = { select: { id: true, name: true, email: true, phone: true } };

    // Fetch bookings from all assigned services
    const [
      bikeBookings,
      busBookings,
      carBookings,
      chauffeurBookings,
      equipmentBookings,
      luxuryBookings,
      packersBookings,
      truckBookings,
      wanderBookings,
    ] = await Promise.all([
      // Bike Rental
      shouldFetchService('bike-rental') || shouldFetchService('bike') || shouldFetchService('bike-rental-activa') || shouldFetchService('bike-on-rent')
        ? prisma.bike_bookings.findMany({
            where: locationIdFilter,
            include: {
              customers: customerInclude,
              locations: { select: { id: true, name: true } },
              bike_quote_requests: { select: { pickupAddress: true, numberOfVehicles: true } },
              vendors_bike_bookings_assignedVendorIdTovendors: { select: { businessName: true, vid: true } },
              vendors_bike_bookings_acceptedVendorIdTovendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Bus Rental
      shouldFetchService('bus-rental') || shouldFetchService('bus')
        ? prisma.bus_bookings.findMany({
            where: pickupCityFilter,
            include: {
              customers: customerInclude,
              vendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Self Drive
      shouldFetchService('self-drive-car-rental') || shouldFetchService('self-drive') || shouldFetchService('self-drive-car-rentals')
        ? prisma.car_bookings.findMany({
            where: locationIdFilter,
            include: {
              customers: customerInclude,
              locations: { select: { id: true, name: true } },
              self_drive_quote_requests: { select: { numberOfVehicles: true } },
              vendors_car_bookings_assignedVendorIdTovendors: { select: { businessName: true, vid: true } },
              vendors_car_bookings_acceptedVendorIdTovendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Chauffeur / Car Rental
      shouldFetchService('chauffeur-driven-car-rental') || shouldFetchService('car-rental') || shouldFetchService('chauffeur') || shouldFetchService('car-rental-with-driver') || shouldFetchService('chauffeur-service')
        ? prisma.chauffeur_bookings.findMany({
            where: pickupCityFilter,
            include: {
              customers: customerInclude,
              vendors_chauffeur_bookings_assignedVendorIdTovendors: { select: { businessName: true, vid: true } },
              vendors_chauffeur_bookings_acceptedVendorIdTovendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Equipment Rental
      shouldFetchService('equipment-rental') || shouldFetchService('equipment')
        ? prisma.equipment_bookings.findMany({
            where: locationNameFilter,
            include: {
              customers: customerInclude,
              vendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Luxury Cars
      shouldFetchService('luxury-car-rental') || shouldFetchService('luxury')
        ? prisma.luxury_bookings.findMany({
            where: pickupCityFilter,
            include: {
              customers: customerInclude,
              vendors_luxury_bookings_assignedVendorIdTovendors: { select: { businessName: true, vid: true } },
              vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { businessName: true, vid: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Packers & Movers
      shouldFetchService('packers-and-movers') || shouldFetchService('packers-movers')
        ? prisma.packers_bookings.findMany({
            where: locationNameFilter,
            include: {
              customers: customerInclude,
              vendors: { select: { businessName: true, vid: true } },
              packers_quote_requests: {
                select: {
                  shiftingScope: true,
                  propertySize: true,
                  estimatedWeight: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Truck Transport
      shouldFetchService('truck-transport') || shouldFetchService('truck') || shouldFetchService('transporter') || shouldFetchService('truck-rental') || shouldFetchService('truck-tempo-rental')
        ? (prisma as any).truck_bookings.findMany({
            where: pickupCityFilter,
            include: {
              customers: customerInclude,
              vendors: { select: { businessName: true, vid: true } },
              truck_quote_requests: {
                select: {
                  truckBodyType: true,
                  tripDirection: true,
                  estimatedVolume: true,
                  estimatedWeight: true,
                  pickupPincode: true,
                  dropPincode: true,
                  expectedDeliveryDate: true,
                  expectedDeliveryTime: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Wander Tours
      shouldFetchService('wander') || shouldFetchService('tour')
        ? (prisma as any).wander_bookings.findMany({
            where: buildFilter({}),
            include: {
              customer: customerInclude,
              vendor: { select: { businessName: true, vid: true } },
              quoteRequest: {
                include: {
                  listing: {
                    select: {
                      title: true,
                      mainLocation: { select: { name: true } },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Helper to get vendor name from different relation structures
    const getVendorName = (booking: any, prefix?: string) => {
      if (!prefix) return booking.vendors?.businessName;
      return (
        booking[`vendors_${prefix}_acceptedVendorIdTovendors`]?.businessName ||
        booking[`vendors_${prefix}_assignedVendorIdTovendors`]?.businessName
      );
    };
    const getVendorVid = (booking: any, prefix?: string) => {
      if (!prefix) return booking.vendors?.vid ?? null;
      return (
        booking[`vendors_${prefix}_acceptedVendorIdTovendors`]?.vid ||
        booking[`vendors_${prefix}_assignedVendorIdTovendors`]?.vid ||
        null
      );
    };

    // Combine and format all bookings
    const allBookings: any[] = [
      ...bikeBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Bike Rental',
        serviceSlug: 'bike-rental',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: getVendorName(b, 'bike_bookings'),
        vendorVid: getVendorVid(b, 'bike_bookings'),
        locationName: b.locations?.name || b.locationName,
        pickupAddress: b.bike_quote_requests?.pickupAddress ?? b.pickupAddress ?? null,
        dropAddress: b.dropAddress ?? null,
        numberOfVehicles: b.bike_quote_requests?.numberOfVehicles ?? null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        totalAmount: b.totalAmount,
        dailyRate: b.dailyRate,
        totalDays: b.totalDays,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...busBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Bus Rental',
        serviceSlug: 'bus-rental',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: b.vendors?.businessName,
        vendorVid: b.vendors?.vid ?? null,
        locationName: b.pickupCity,
        pickupAddress: b.pickupAddress ?? null,
        dropAddress: b.dropAddress ?? null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.returnDate,
        totalAmount: b.totalAmount,
        dailyRate: b.baseAmount,
        totalDays: b.tripDays,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...carBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Self Drive',
        serviceSlug: 'self-drive',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: getVendorName(b, 'car_bookings'),
        vendorVid: getVendorVid(b, 'car_bookings'),
        locationName: b.locations?.name || b.locationName,
        numberOfVehicles: b.self_drive_quote_requests?.numberOfVehicles ?? null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        totalAmount: b.totalAmount,
        dailyRate: b.dailyRate,
        totalDays: b.totalDays,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...chauffeurBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Car Rental',
        serviceSlug: 'car-rental',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: getVendorName(b, 'chauffeur_bookings'),
        vendorVid: getVendorVid(b, 'chauffeur_bookings'),
        locationName: b.pickupCity,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.returnDate,
        totalAmount: b.grandTotal,
        dailyRate: b.baseFare,
        totalDays: b.totalDays,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...equipmentBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Equipment Rental',
        serviceSlug: 'equipment-rental',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: b.vendors?.businessName,
        vendorVid: b.vendors?.vid ?? null,
        locationName: b.locationName || b.deliveryCity,
        deliveryCity: b.deliveryCity ?? null,
        deliveryAddress: b.deliveryAddress ?? null,
        pickupDate: b.startDate,
        pickupTime: null,
        dropDate: b.endDate,
        totalAmount: b.totalAmount,
        dailyRate: b.dailyRate,
        totalDays: b.durationDays,
        advancePaymentVerified: false,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...luxuryBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Luxury Cars',
        serviceSlug: 'luxury-car-rental',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: getVendorName(b, 'luxury_bookings'),
        vendorVid: getVendorVid(b, 'luxury_bookings'),
        locationName: b.pickupCity,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.returnDate,
        totalAmount: b.grandTotal,
        dailyRate: b.baseFare,
        totalDays: b.totalDays,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
      ...packersBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Packers & Movers',
        serviceSlug: 'packers-and-movers',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: b.vendors?.businessName,
        vendorVid: b.vendors?.vid ?? null,
        locationName: b.locationName,
        pickupAddress: b.pickupAddress ?? null,
        dropAddress: b.dropAddress ?? null,
        pickupDate: b.moveDate,
        pickupTime: null,
        dropDate: null,
        totalAmount: b.totalAmount,
        dailyRate: null,
        totalDays: null,
        advancePaymentVerified: false,
        source: b.source || 'web',
        // ── Packers list-view extras ──
        shiftingScope: b.packers_quote_requests?.shiftingScope ?? null,
        propertySize: b.propertySize || b.packers_quote_requests?.propertySize || null,
        estimatedWeight: b.packers_quote_requests?.estimatedWeight ?? null,
        shiftingType: b.shiftingType ?? null,
        createdAt: b.createdAt,
      })),
      ...truckBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        serviceName: 'Truck Transport',
        serviceSlug: 'truck-transport',
        customerName: b.customers?.name || b.customerName,
        customerPhone: b.customers?.phone || b.customerPhone,
        customerEmail: b.customers?.email || b.customerEmail,
        vendorName: b.vendors?.businessName,
        vendorVid: b.vendors?.vid ?? null,
        locationName: b.pickupCity,
        pickupAddress: b.pickupAddress ?? null,
        dropAddress: b.dropAddress ?? null,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: null,
        totalAmount: b.totalAmount,
        dailyRate: b.baseRate,
        totalDays: null,
        advancePaymentVerified: b.advancePaymentVerified,
        source: b.source || 'web',
        truckBodyType: b.truck_quote_requests?.truckBodyType ?? null,
        tripDirection: b.truck_quote_requests?.tripDirection ?? null,
        estimatedVolume: b.truck_quote_requests?.estimatedVolume ?? null,
        estimatedWeight: b.truck_quote_requests?.estimatedWeight ?? null,
        pickupPincode: b.truck_quote_requests?.pickupPincode ?? null,
        dropPincode: b.truck_quote_requests?.dropPincode ?? null,
        createdAt: b.createdAt,
      })),
      ...wanderBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingId,
        status: b.status,
        serviceName: 'Wander Tours',
        serviceSlug: 'wander',
        customerName: b.customer?.name,
        customerPhone: b.customer?.phone,
        customerEmail: b.customer?.email,
        vendorName: b.vendor?.businessName,
        vendorVid: b.vendor?.vid ?? null,
        locationName: b.quoteRequest?.listing?.mainLocation?.name || null,
        pickupDate: b.travelDate,
        pickupTime: null,
        dropDate: null,
        totalAmount: b.amount,
        dailyRate: null,
        totalDays: null,
        advancePaymentVerified: b.advancePaid || false,
        isB2BBooking: b.isB2BBooking,
        companyName: b.companyName,
        invoiceSent: b.invoiceSent,
        tourTitle: b.quoteRequest?.listing?.title,
        source: b.source || 'web',
        createdAt: b.createdAt,
      })),
    ];

    // Sort by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Fetch call counts for all booking IDs in one query
    const allIds = allBookings.map((b: any) => b.id);
    const callCountRows = allIds.length > 0
      ? await prisma.vendor_call_logs.groupBy({
          by: ['bookingId'],
          where: { bookingId: { in: allIds } },
          _count: { bookingId: true },
        }).catch(() => [])
      : [];
    const callCountMap: Record<string, number> = {};
    for (const row of callCountRows) {
      callCountMap[row.bookingId] = row._count.bookingId;
    }
    for (const booking of allBookings) {
      booking.callsCount = callCountMap[booking.id] || 0;
    }

    // Create unique service list based on main service names
    const serviceMap = new Map();
    const mainServices = [
      { slug: 'bike-rental', name: 'Bike Rental' },
      { slug: 'bus-rental', name: 'Bus Rental' },
      { slug: 'self-drive', name: 'Self Drive' },
      { slug: 'car-rental', name: 'Car Rental' },
      { slug: 'equipment-rental', name: 'Equipment Rental' },
      { slug: 'luxury-car-rental', name: 'Luxury Cars' },
      { slug: 'packers-and-movers', name: 'Packers & Movers' },
      { slug: 'truck-transport', name: 'Truck Transport' },
      { slug: 'wander', name: 'Wander Tours' },
    ];

    // Only include services that manager is assigned to
    const uniqueServices = mainServices.filter(mainSvc =>
      assignedServiceSlugs.some(assignedSlug =>
        assignedSlug.includes(mainSvc.slug) || mainSvc.slug.includes(assignedSlug)
      )
    ).map((svc, index) => ({
      id: `service-${index}`,
      name: svc.name,
      slug: svc.slug,
    }));

    // Unique locations for the filter dropdown — from the full assigned-scope
    // result, not the post-filter list, so the dropdown doesn't shrink as
    // other filters narrow the results.
    const uniqueLocations = Array.from(
      new Set(allBookings.map((b) => b.locationName || b.deliveryCity).filter(Boolean))
    ).sort();

    const matchesDateFilter = (booking: any): boolean => {
      if (dateFilter === 'all') return true;
      const bookingDate = new Date(booking.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (dateFilter) {
        case 'today':
          return bookingDate >= today;
        case 'yesterday': {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return bookingDate >= yesterday && bookingDate < today;
        }
        case 'thisMonth':
          return bookingDate >= new Date(now.getFullYear(), now.getMonth(), 1);
        case 'lastMonth': {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
          return bookingDate >= lastMonthStart && bookingDate < lastMonthEnd;
        }
        default:
          return true;
      }
    };

    let filtered = allBookings.filter(matchesDateFilter);

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((b) => (b.source || 'web') === sourceFilter);
    }
    if (locationFilters.length > 0) {
      filtered = filtered.filter((b) => locationFilters.includes(b.locationName || b.deliveryCity || ''));
    }
    if (search) {
      filtered = filtered.filter(
        (b) =>
          b.bookingNumber?.toLowerCase().includes(search) ||
          b.customerName?.toLowerCase().includes(search) ||
          b.customerPhone?.includes(search) ||
          b.customerEmail?.toLowerCase().includes(search) ||
          b.locationName?.toLowerCase().includes(search) ||
          b.vendorName?.toLowerCase().includes(search) ||
          b.vendorVid?.toLowerCase().includes(search) ||
          b.serviceName?.toLowerCase().includes(search)
      );
    }

    const stats = {
      total: filtered.length,
      active: filtered.filter((b) => ['PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS'].includes(b.status)).length,
      completed: filtered.filter((b) => b.status === 'COMPLETED').length,
      cancelled: filtered.filter((b) => ['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(b.status)).length,
      revenue: filtered.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const paginatedBookings = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      bookings: paginatedBookings,
      services: uniqueServices,
      locations: uniqueLocations,
      stats,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: any) {
    logger.error('Manager bookings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
