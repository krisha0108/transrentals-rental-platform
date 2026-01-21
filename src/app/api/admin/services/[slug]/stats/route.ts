import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Map service slugs to their booking models
const SERVICE_BOOKING_MAP: Record<string, string> = {
  'self-drive-car-rental': 'carBooking',
  'bike-rental': 'bikeBooking',
  'car-rental-with-driver': 'chauffeurBooking',
  'luxury-car-rental': 'luxuryBooking',
  'bus-rental': 'busBooking',
  'truck-tempo-rental': 'truckBooking',
  'packers-movers': 'packersBooking',
  'equipment-rental': 'equipmentBooking',
};

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

    // Get current dates for filtering
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

    // Get total locations count
    const totalLocations = await prisma.locations.count({
      where: { type: 'CITY', isActive: true },
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
    const serviceSlug = slug.toLowerCase();

    // Helper to check if service matches a type
    const isServiceType = (keywords: string[]) =>
      keywords.some(k => serviceName.includes(k) || serviceSlug.includes(k));

    // Fetch bookings based on service type
    // NOTE: Quote-based services (bike, self-drive, bus, truck, luxury, packers, equipment)
    // use quote_requests tables to match what the bookings page shows
    if (isServiceType(['self-drive', 'self drive']) && !isServiceType(['bike'])) {
      const [total, pending, confirmed, completed, cancelled, thisMonth, lastMonth, thisWeek, today, revenue, lastMonthRevenue, recent] = await Promise.all([
        prisma.self_drive_quote_requests.count(),
        prisma.self_drive_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.self_drive_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.self_drive_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.self_drive_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.self_drive_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.self_drive_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.self_drive_quote_requests.findMany({
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
        prisma.bike_quote_requests.count(),
        prisma.bike_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.bike_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.bike_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.bike_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.bike_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.bike_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bike_quote_requests.findMany({
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
        prisma.chauffeur_bookings.count(),
        prisma.chauffeur_bookings.count({ where: { status: { in: ['PENDING_PAYMENT', 'PENDING_VENDOR'] } } }),
        prisma.chauffeur_bookings.count({ where: { status: { in: ['ACCEPTED', 'DRIVER_ASSIGNED'] } } }),
        prisma.chauffeur_bookings.count({ where: { status: 'COMPLETED' } }),
        prisma.chauffeur_bookings.count({ where: { status: { in: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.chauffeur_bookings.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.chauffeur_bookings.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }),
        prisma.chauffeur_bookings.findMany({
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
        prisma.luxury_quote_requests.count(),
        prisma.luxury_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.luxury_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.luxury_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.luxury_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.luxury_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.luxury_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.luxury_quote_requests.findMany({
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
        prisma.bus_quote_requests.count(),
        prisma.bus_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.bus_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.bus_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.bus_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.bus_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.bus_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.bus_quote_requests.findMany({
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
        prisma.truck_quote_requests.count(),
        prisma.truck_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.truck_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.truck_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.truck_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.truck_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.truck_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.truck_quote_requests.findMany({
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
        prisma.packers_quote_requests.count(),
        prisma.packers_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.packers_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.packers_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.packers_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.packers_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.packers_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.packers_quote_requests.findMany({
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
        prisma.equipment_quote_requests.count(),
        prisma.equipment_quote_requests.count({ where: { status: 'PENDING' } }),
        prisma.equipment_quote_requests.count({ where: { status: { in: ['QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] } } }),
        prisma.equipment_quote_requests.count({ where: { status: 'BOOKING_CONFIRMED' } }),
        prisma.equipment_quote_requests.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.equipment_quote_requests.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.equipment_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.aggregate({ _sum: { budgetMax: true }, where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ['CANCELLED', 'EXPIRED'] } } }),
        prisma.equipment_quote_requests.findMany({
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
