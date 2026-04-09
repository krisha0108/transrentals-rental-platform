import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Quote request statuses (inquiry stage)
const INQUIRY_STATUSES = [
  'PENDING',
  'QUOTED',
  'ACCEPTED',
  'REJECTED',
];

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
        inquiries: [],
        services: manager.manager_services.map((ms) => ({
          id: ms.services.id,
          name: ms.services.name,
          slug: ms.services.slug,
        })),
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('service') || 'all';

    // Helper to check if service is assigned (exact match or known aliases)
    const isServiceAssigned = (serviceSlug: string): boolean => {
      return assignedServiceSlugs.some(slug => slug === serviceSlug);
    };

    // Helper to check if should fetch this service based on filter
    // Pass all possible slugs for a service; match exactly to avoid car-rental matching luxury-car-rental
    const shouldFetchService = (...serviceSlugs: string[]): boolean => {
      const assigned = serviceSlugs.some(s => isServiceAssigned(s));
      if (!assigned) return false;
      if (serviceFilter === 'all') return true;
      return serviceSlugs.includes(serviceFilter);
    };

    // Build filters for quote_requests tables
    const locationIdFilter = { locationId: { in: assignedLocationIds } };
    const pickupCityFilter = { pickupCity: { in: assignedLocationNames } };
    const locationNameFilter = { locationName: { in: assignedLocationNames } };

    // Fetch quote requests (inquiries) from all assigned services
    const [
      bikeInquiries,
      busInquiries,
      selfDriveInquiries,
      equipmentInquiries,
      luxuryInquiries,
      packersInquiries,
      truckInquiries,
    ] = await Promise.all([
      // Bike Rental Quote Requests
      shouldFetchService('bike-rental', 'bike', 'bike-rental-activa', 'bike-on-rent')
        ? prisma.bike_quote_requests.findMany({
            where: locationIdFilter,
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              locations: { select: { id: true, name: true } },
              _count: { select: { bike_quotes_bike_quotes_requestIdTobike_quote_requests: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Bus Rental Quote Requests
      shouldFetchService('bus-rental', 'bus')
        ? prisma.bus_quote_requests.findMany({
            where: pickupCityFilter,
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { bus_quotes_bus_quotes_requestIdTobus_quote_requests: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Self Drive Quote Requests
      shouldFetchService('self-drive-car-rentals', 'self-drive-car-rental', 'self-drive')
        ? prisma.self_drive_quote_requests.findMany({
            where: locationIdFilter,
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              locations: { select: { id: true, name: true } },
              _count: { select: { self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Equipment Rental Quote Requests
      shouldFetchService('equipment-rental', 'equipment')
        ? prisma.equipment_quote_requests.findMany({
            where: { deliveryCity: { in: assignedLocationNames } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { equipment_quotes: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Luxury Cars Quote Requests
      shouldFetchService('luxury-car-rental', 'luxury')
        ? prisma.luxury_quote_requests.findMany({
            where: pickupCityFilter,
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { luxury_quotes: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Packers & Movers Quote Requests
      shouldFetchService('packers-and-movers', 'packers-movers')
        ? prisma.packers_quote_requests.findMany({
            where: { pickupCity: { in: assignedLocationNames } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { packers_quotes: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),

      // Truck Transport Quote Requests
      shouldFetchService('truck-transport', 'truck', 'transporter', 'truck-rental', 'truck-tempo-rental', 'mini-truck-rental', 'trailer-on-rent')
        ? prisma.truck_quote_requests.findMany({
            where: pickupCityFilter,
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { truck_quotes: true } },
            },
            orderBy: { createdAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Combine and format all inquiries (quote requests)
    const allInquiries: any[] = [
      ...bikeInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Bike Rental',
        serviceSlug: 'bike-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locations?.name || q.locationName,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.dropDate,
        quotesCount: q._count?.bike_quotes_bike_quotes_requestIdTobike_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...busInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Bus Rental',
        serviceSlug: 'bus-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.returnDate,
        quotesCount: q._count?.bus_quotes_bus_quotes_requestIdTobus_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...selfDriveInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Self Drive',
        serviceSlug: 'self-drive',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locations?.name || q.locationName,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.dropDate,
        quotesCount: q._count?.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...equipmentInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Equipment Rental',
        serviceSlug: 'equipment-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locationName,
        pickupDate: q.startDate,
        pickupTime: null,
        dropDate: q.endDate,
        quotesCount: q._count?.equipment_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...luxuryInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Luxury Cars',
        serviceSlug: 'luxury-car-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.dropDate,
        quotesCount: q._count?.luxury_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...packersInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Packers & Movers',
        serviceSlug: 'packers-and-movers',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locationName,
        pickupDate: q.moveDate,
        pickupTime: null,
        dropDate: null,
        quotesCount: q._count?.packers_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
      ...truckInquiries.map((q: any) => ({
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Truck Transport',
        serviceSlug: 'truck-transport',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: null,
        quotesCount: q._count?.truck_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      })),
    ];

    // Sort by creation date (newest first)
    allInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Create unique service list based on main service names
    // Each entry has alternateSlug variants so manager assignment matching works
    const mainServices: { slug: string; name: string; alts: string[] }[] = [
      { slug: 'bike-rental', name: 'Bike Rental', alts: ['bike'] },
      { slug: 'bus-rental', name: 'Bus Rental', alts: ['bus'] },
      { slug: 'self-drive', name: 'Self Drive', alts: ['self-drive-car-rentals', 'self-drive-car-rental'] },
      { slug: 'equipment-rental', name: 'Equipment Rental', alts: ['equipment'] },
      { slug: 'luxury-car-rental', name: 'Luxury Cars', alts: ['luxury'] },
      { slug: 'packers-and-movers', name: 'Packers & Movers', alts: ['packers-movers'] },
      { slug: 'truck-transport', name: 'Truck Transport', alts: ['truck', 'transporter'] },
    ];

    // Only include services that manager is assigned to (exact match on slug or alts)
    const uniqueServices = mainServices.filter(mainSvc =>
      assignedServiceSlugs.some(assignedSlug =>
        assignedSlug === mainSvc.slug || mainSvc.alts.includes(assignedSlug)
      )
    ).map((svc, index) => ({
      id: `service-${index}`,
      name: svc.name,
      slug: svc.slug,
    }));

    return NextResponse.json({
      success: true,
      inquiries: allInquiries,
      services: uniqueServices,
    });
  } catch (error: any) {
    logger.error('Manager inquiries error', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries', details: error?.message },
      { status: 500 }
    );
  }
}
