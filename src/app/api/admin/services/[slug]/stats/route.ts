import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to calculate date range for recent bookings filter
function getRecentBookingsDateRange(dateFilter: string): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  switch (dateFilter) {
    case 'TODAY': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    }
    case 'YESTERDAY': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      break;
    }
    case 'THIS_MONTH': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    }
    case 'LAST_MONTH': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case 'THIS_YEAR': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    }
    default:
      // ALL - no date filter
      break;
  }

  return { startDate, endDate };
}

// Normalize specific model/variant slugs to their parent service slug
function normalizeServiceSlug(slug: string): string {
  const BIKE_SLUGS = [
    'himalayan-on-rent', 'royal-enfield-on-rent', 'ktm-on-rent',
    'pulsar-on-rent', 'activa-on-rent', 'apache-on-rent',
    'splendor-on-rent', 'electric-scooter-rental',
  ];
  const SELF_DRIVE_SLUGS = [
    'self-drive-hatchback-rental', 'self-drive-sedan-rental', 'self-drive-suv-rental',
    'creta-on-rent', 'swift-on-rent', 'seltos-on-rent', 'xuv700-on-rent',
    'scorpio-on-rent', 'monthly-car-rental',
  ];
  const CHAUFFEUR_SLUGS = [
    'innova-on-rent', 'fortuner-on-rent', 'outstation-car-rental',
    'outstation-cab', 'local-taxi', 'corporate-car-rental', 'hourly-car-rental',
  ];
  const LUXURY_SLUGS = ['sports-car-rental', 'vintage-car-rental'];
  const BUS_SLUGS = [
    '12-seater-tempo-traveller', '17-seater-tempo-traveller',
    '20-seater-tempo-traveller', '26-seater-bus',
    'corporate-bus-rental', 'wedding-bus-rental',
  ];
  const EQUIPMENT_SLUGS = [
    'crane-on-rent', 'excavator-on-rent', 'generator-on-rent',
    'hydra-on-rent', 'jcb-on-rent',
  ];
  const TRUCK_SLUGS = ['mini-truck-rental', 'trailer-on-rent'];

  if (BIKE_SLUGS.includes(slug)) return 'bike-on-rent';
  if (SELF_DRIVE_SLUGS.includes(slug)) return 'self-drive-car-rentals';
  if (CHAUFFEUR_SLUGS.includes(slug)) return 'chauffeur-service';
  if (LUXURY_SLUGS.includes(slug)) return 'luxury-car-rental';
  if (BUS_SLUGS.includes(slug)) return 'bus-rental';
  if (EQUIPMENT_SLUGS.includes(slug)) return 'equipment-rental';
  if (TRUCK_SLUGS.includes(slug)) return 'truck-rental';
  return slug;
}

// GET - Get comprehensive stats for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || 'ALL';

    // Get current dates for filtering
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get date range for recent bookings filter
    const { startDate: recentBookingsStart, endDate: recentBookingsEnd } = getRecentBookingsDateRange(dateFilter);

    // Base where clause for filtering all stats by date
    const baseWhere: any = recentBookingsStart || recentBookingsEnd ? {
      createdAt: {
        ...(recentBookingsStart && { gte: recentBookingsStart }),
        ...(recentBookingsEnd && { lte: recentBookingsEnd }),
      }
    } : {};

    // Find the service in database
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        other_services: true,
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        vehicle_models_vehicle_models_serviceIdToservices: {
          where: { isActive: true },
        },
        vendor_fleets: {
          where: { isActive: true },
          include: {
            vendors: {
              select: { id: true, businessName: true, status: true },
            },
          },
        },
        vendor_approved_services: {
          include: {
            vendors: {
              select: { id: true, businessName: true, status: true, rating: true },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get total locations count (cities and union territories)
    const totalLocations = await prisma.locations.count({
      where: { type: { in: ['CITY', 'UNION_TERRITORY'] }, isActive: true },
    });

    // Get booking stats based on service type
    let bookingStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      thisMonth: 0,
      lastMonth: 0,
      thisWeek: 0,
      today: 0,
      revenue: 0,
      lastMonthRevenue: 0,
      recentBookings: [] as any[],
      dailyBookings: [] as any[],
    };

    // Determine booking type based on service name/slug
    const serviceName = service.name.toLowerCase();
    const serviceSlug = normalizeServiceSlug(slug.toLowerCase());

    // Helper to check if service matches a type
    const isServiceType = (keywords: string[]) =>
      keywords.some(k => serviceName.includes(k) || serviceSlug.includes(k));

    // Fetch bookings based on service type
    // NOTE: Quote-based services (bike, self-drive, bus, truck, luxury, packers, equipment)
    // use quote_requests tables to match what the bookings page shows
    if (isServiceType(['self-drive', 'self drive']) && !isServiceType(['bike'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.self_drive_quote_requests.count({ where: baseWhere }),
        prisma.self_drive_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.self_drive_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.self_drive_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.self_drive_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.self_drive_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            vehicleCategoryName: true,
            locationName: true,
            pickupDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        thisMonth,
        lastMonth,
        thisWeek,
        today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.vehicleCategoryName,
          locationName: r.locationName,
          pickupDate: r.pickupDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: [],
      };
    } else if (isServiceType(['bike', 'scooter', 'two-wheeler'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.bike_quote_requests.count({ where: baseWhere }),
        prisma.bike_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.bike_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.bike_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.bike_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.bike_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            vehicleCategoryName: true,
            locationName: true,
            pickupDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        thisMonth,
        lastMonth,
        thisWeek,
        today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.vehicleCategoryName,
          locationName: r.locationName,
          pickupDate: r.pickupDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    } else if (isServiceType(['chauffeur', 'with-driver', 'with driver', 'car-rental']) && !isServiceType(['self-drive', 'luxury'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.chauffeur_bookings.count({ where: baseWhere }),
        prisma.chauffeur_bookings.count({ where: { ...baseWhere, status: { in: ['PENDING_PAYMENT', 'PENDING_VENDOR'] } } }),
        prisma.chauffeur_bookings.count({ where: { ...baseWhere, status: { in: ['ACCEPTED', 'DRIVER_ASSIGNED'] } } }),
        prisma.chauffeur_bookings.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
        prisma.chauffeur_bookings.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.chauffeur_bookings.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bookingNumber: true,
            customerName: true,
            carCategoryName: true,
            locationName: true,
            pickupDate: true,
            grandTotal: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = { total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue: revenue._sum.grandTotal || 0, lastMonthRevenue: lastMonthRevenue._sum.grandTotal || 0, recentBookings: recent, dailyBookings: [] };
    } else if (isServiceType(['luxury'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.luxury_quote_requests.count({ where: baseWhere }),
        prisma.luxury_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.luxury_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.luxury_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.luxury_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.luxury_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            vehicleCategoryName: true,
            pickupCity: true,
            pickupDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.vehicleCategoryName,
          locationName: r.pickupCity,
          pickupDate: r.pickupDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    } else if (isServiceType(['bus'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.bus_quote_requests.count({ where: baseWhere }),
        prisma.bus_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.bus_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.bus_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.bus_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.bus_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            vehicleCategoryName: true,
            pickupCity: true,
            pickupDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.vehicleCategoryName,
          locationName: r.pickupCity,
          pickupDate: r.pickupDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    } else if (isServiceType(['truck', 'tempo', 'transporter'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.truck_quote_requests.count({ where: baseWhere }),
        prisma.truck_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.truck_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.truck_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.truck_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.truck_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            vehicleCategoryName: true,
            pickupCity: true,
            pickupDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.vehicleCategoryName,
          locationName: r.pickupCity,
          pickupDate: r.pickupDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    } else if (isServiceType(['packers', 'movers'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.packers_quote_requests.count({ where: baseWhere }),
        prisma.packers_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.packers_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.packers_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.packers_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.packers_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            shiftingType: true,
            pickupCity: true,
            preferredDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.shiftingType,
          locationName: r.pickupCity,
          pickupDate: r.preferredDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    } else if (isServiceType(['equipment'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.equipment_quote_requests.count({ where: baseWhere }),
        prisma.equipment_quote_requests.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.equipment_quote_requests.count({ where: { ...baseWhere, status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.equipment_quote_requests.count({ where: { ...baseWhere, status: 'BOOKING_CONFIRMED' } }),
        prisma.equipment_quote_requests.count({ where: { ...baseWhere, status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.equipment_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.findMany({
          where: recentBookingsStart || recentBookingsEnd ? {
            createdAt: {
              ...(recentBookingsStart && { gte: recentBookingsStart }),
              ...(recentBookingsEnd && { lte: recentBookingsEnd }),
            }
          } : undefined,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            customerName: true,
            equipmentName: true,
            deliveryCity: true,
            startDate: true,
            budgetMax: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
      bookingStats = {
        total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today,
        revenue: revenue._sum.budgetMax || 0,
        lastMonthRevenue: lastMonthRevenue._sum.budgetMax || 0,
        recentBookings: recent.map(r => ({
          id: r.id,
          bookingNumber: r.requestNumber,
          customerName: r.customerName,
          requestedVehicleName: r.equipmentName,
          locationName: r.deliveryCity,
          pickupDate: r.startDate,
          grandTotal: r.budgetMax || 0,
          status: r.status,
          createdAt: r.createdAt,
        })),
        dailyBookings: []
      };
    }

    // Calculate vendor stats
    const uniqueVendorIds = new Set(service.vendor_fleets.map(f => f.vendorId));
    const approvedVendors = service.vendor_approved_services.filter(s => s.vendors?.status === 'APPROVED');
    const topVendors = approvedVendors
      .sort((a, b) => (b.vendors?.rating || 0) - (a.vendors?.rating || 0))
      .slice(0, 5)
      .map(v => ({
        id: v.vendorId,
        name: v.vendors?.businessName || 'Unknown',
        rating: v.vendors?.rating || 0,
      }));

    // Calculate average rating from vendors with ratings
    const vendorsWithRatings = approvedVendors.filter(v => v.vendors?.rating && v.vendors.rating > 0);
    const averageRating = vendorsWithRatings.length > 0
      ? vendorsWithRatings.reduce((sum, v) => sum + (v.vendors?.rating || 0), 0) / vendorsWithRatings.length
      : 0;

    // Calculate growth
    const bookingGrowth = bookingStats.lastMonth > 0
      ? ((bookingStats.thisMonth - bookingStats.lastMonth) / bookingStats.lastMonth * 100).toFixed(1)
      : bookingStats.thisMonth > 0 ? '100' : '0';

    const revenueGrowth = bookingStats.lastMonthRevenue > 0
      ? ((bookingStats.revenue - bookingStats.lastMonthRevenue) / bookingStats.lastMonthRevenue * 100).toFixed(1)
      : bookingStats.revenue > 0 ? '100' : '0';

    // Get top locations by active fleets
    const locationFleetCounts: Record<string, { name: string; count: number }> = {};
    service.service_locations.forEach(sl => {
      if (sl.locations) {
        locationFleetCounts[sl.locations.id] = {
          name: sl.locations.name,
          count: 0,
        };
      }
    });

    const stats = {
      // Booking stats
      totalBookings: bookingStats.total,
      pendingBookings: bookingStats.pending,
      confirmedBookings: bookingStats.confirmed,
      completedBookings: bookingStats.completed,
      cancelledBookings: bookingStats.cancelled,
      thisMonthBookings: bookingStats.thisMonth,
      lastMonthBookings: bookingStats.lastMonth,
      thisWeekBookings: bookingStats.thisWeek,
      todayBookings: bookingStats.today,
      bookingGrowth: parseFloat(bookingGrowth as string),

      // Revenue stats
      monthlyRevenue: bookingStats.revenue,
      lastMonthRevenue: bookingStats.lastMonthRevenue,
      revenueGrowth: parseFloat(revenueGrowth as string),

      // Location stats
      activeLocations: service.service_locations.length,
      totalLocations,

      // Vehicle/Fleet stats
      totalVehicles: service.vehicle_models_vehicle_models_serviceIdToservices.length,
      activeVehicles: service.vehicle_models_vehicle_models_serviceIdToservices.filter(v => v.isActive).length,
      totalFleet: service.vendor_fleets.length,

      // Vendor stats
      totalVendors: uniqueVendorIds.size,
      activeVendors: approvedVendors.length,
      topVendors,

      // Other stats
      averageRating: parseFloat(averageRating.toFixed(1)),
      subServicesCount: service.other_services.length,

      // Recent activity
      recentBookings: bookingStats.recentBookings,
      dailyBookings: bookingStats.dailyBookings,
    };

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        flowType: service.flowType,
        description: service.description,
        isActive: service.isActive,
      },
      stats,
    });
  } catch (error: any) {
    logger.error('Service stats error', error);
    return NextResponse.json(
      { error: 'Failed to fetch service stats', details: error?.message },
      { status: 500 }
    );
  }
}
