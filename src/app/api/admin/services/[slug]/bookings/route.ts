// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to get booking model and query based on service type
async function getBookingsForService(
  serviceSlug: string,
  page: number,
  limit: number,
  search: string,
  status: string
) {
  const skip = (page - 1) * limit;

  // Map service slugs to booking models
  switch (serviceSlug) {
    case 'bike-on-rent':
    case 'bike-rental': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.bike_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, images: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.bike_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleModelName || b.vehicle_models?.name || b.vehicleCategoryName || 'Bike',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bike Rental',
          pickupLocation: b.locations?.name || b.locationName,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          totalQuotesReceived: b.totalQuotesReceived,
          createdAt: b.createdAt,
          vehicleImage: b.vehicle_models?.sideImage || b.vehicle_models?.images?.split(',')[0] || '/images/fleet/default-bike.jpg',
        })),
        total,
      };
    }

    case 'self-drive-car-rentals':
    case 'self-drive': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.self_drive_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, images: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.self_drive_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicle_modelsName || b.vehicle_models?.name || b.vehicleCategoryName || 'Vehicle',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || b.vehicle_category || 'Self Drive',
          pickupLocation: b.locations?.name || b.locationName,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING', // Quote requests don't have payment status yet
          createdAt: b.createdAt,
          vehicleImage: b.vehicle_models?.sideImage || b.vehicle_models?.images?.split(',')[0] || '/images/fleet/default-car.jpg',
        })),
        total,
      };
    }

    case 'car-rental':
    case 'chauffeur-driven':
    case 'chauffeur-service': {
      const where: any = {};
      if (search) {
        where.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.chauffeur_bookings.findMany({
          where,
          include: {
            locations: { select: { name: true } },
            vendors_chauffeur_bookings_acceptedVendorIdTovendors: { select: { businessName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.chauffeur_bookings.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.carCategoryName || b.carCategory || 'Car',
          services_vehicle_models_subServiceIdToservices: b.tripType || 'Chauffeur Service',
          pickupLocation: b.locations?.name || b.locationName || b.pickupCity,
          dropLocation: b.dropCity || b.pickupCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.grandTotal,
          status: b.status,
          paymentStatus: b.paymentStatus,
          vendorName: b.vendors_chauffeur_bookings_acceptedVendorIdTovendors?.businessName || 'Unassigned',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-car.jpg',
        })),
        total,
      };
    }

    case 'bus-rental':
    case 'tempo-traveller': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.bus_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.bus_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Bus',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bus Rental',
          pickupLocation: b.locations?.name || b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-bus.jpg',
        })),
        total,
      };
    }

    case 'truck-rental':
    case 'truck-tempo-rental':
    case 'transporter': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.truck_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.truck_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Truck',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Truck Rental',
          pickupLocation: b.locations?.name || b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-truck.jpg',
        })),
        total,
      };
    }

    case 'luxury-car-rental':
    case 'luxury-cars': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.luxury_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.luxury_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.specificModel || b.vehicleCategoryName || 'Luxury Car',
          services_vehicle_models_subServiceIdToservices: b.vehicle_category || 'Luxury Car',
          pickupLocation: b.locations?.name || b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-luxury.jpg',
        })),
        total,
      };
    }

    case 'packers-and-movers':
    case 'packers-movers': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.packers_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.packers_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.shiftingType || 'Packers & Movers',
          services_vehicle_models_subServiceIdToservices: b.serviceType || 'Moving Service',
          pickupLocation: b.locations?.name || b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.preferredDate,
          endDate: b.preferredDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-packers.jpg',
        })),
        total,
      };
    }

    case 'equipment-rental': {
      const where: any = {};
      if (search) {
        where.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.equipment_quote_requests.findMany({
          where,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.equipment_quote_requests.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.equipmentName || b.equipmentType || 'Equipment',
          services_vehicle_models_subServiceIdToservices: b.equipmentType || 'Equipment Rental',
          pickupLocation: b.locations?.name || b.deliveryCity,
          startDate: b.startDate,
          endDate: b.endDate || b.startDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-equipment.jpg',
        })),
        total,
      };
    }

    default:
      return { bookings: [], total: 0 };
  }
}

// GET - Get bookings for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get bookings based on service type
    const { bookings, total } = await getBookingsForService(
      slug,
      page,
      limit,
      search,
      status
    );

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      bookings,
      stats: {
        total,
        pending: 0,
        confirmed: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Service bookings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
