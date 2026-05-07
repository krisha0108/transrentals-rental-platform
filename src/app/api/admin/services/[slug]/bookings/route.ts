// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to calculate date range based on filter
function getDateRange(dateFilter: string, customStart?: string, customEnd?: string): { startDate: Date | null; endDate: Date | null } {
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
    case 'LAST_YEAR': {
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    }
    case 'CUSTOM': {
      if (customStart) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
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
    'bike-rental-activa', 'bike-rental', 'bike-on-rent',
    'monthly-bike-rental', 'bike-tours', 'bike-trips',
  ];
  const SELF_DRIVE_SLUGS = [
    'self-drive-hatchback-rental', 'self-drive-sedan-rental', 'self-drive-suv-rental',
    'creta-on-rent', 'swift-on-rent', 'seltos-on-rent', 'xuv700-on-rent',
    'scorpio-on-rent', 'monthly-car-rental', 'self-drive-car-rental',
  ];
  const CHAUFFEUR_SLUGS = [
    'innova-on-rent', 'fortuner-on-rent', 'outstation-car-rental',
    'outstation-cab', 'local-taxi', 'corporate-car-rental', 'hourly-car-rental',
    'airport-transfer', 'one-way-car-rental', 'car-rental-with-driver',
  ];
  const LUXURY_SLUGS = ['sports-car-rental', 'vintage-car-rental', 'wedding-car-rental', 'luxury-cars'];
  const BUS_SLUGS = [
    '12-seater-tempo-traveller', '17-seater-tempo-traveller',
    '20-seater-tempo-traveller', '26-seater-bus',
    'corporate-bus-rental', 'wedding-bus-rental',
  ];
  const EQUIPMENT_SLUGS = [
    'crane-on-rent', 'excavator-on-rent', 'generator-on-rent',
    'hydra-on-rent', 'jcb-on-rent', 'equipment-rental',
  ];
  const TRUCK_SLUGS = ['mini-truck-rental', 'trailer-on-rent', 'truck-transport', 'truck-tempo-rental'];

  if (BIKE_SLUGS.includes(slug)) return 'bike-on-rent';
  if (SELF_DRIVE_SLUGS.includes(slug)) return 'self-drive-car-rentals';
  if (CHAUFFEUR_SLUGS.includes(slug)) return 'chauffeur-service';
  if (LUXURY_SLUGS.includes(slug)) return 'luxury-car-rental';
  if (BUS_SLUGS.includes(slug)) return 'bus-rental';
  if (EQUIPMENT_SLUGS.includes(slug)) return 'equipment-rental';
  if (TRUCK_SLUGS.includes(slug)) return 'truck-rental';
  return slug;
}

// Helper to get booking model and query based on service type
async function getBookingsForService(
  serviceSlug: string,
  page: number,
  limit: number,
  search: string,
  status: string,
  startDate: Date | null = null,
  endDate: Date | null = null
) {
  const skip = (page - 1) * limit;
  serviceSlug = normalizeServiceSlug(serviceSlug);

  // Map service slugs to booking models
  switch (serviceSlug) {
    case 'bike-on-rent':
    case 'bike-rental': {
      // Get all confirmed booking IDs
      const confirmedBookings = await prisma.bike_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds },
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedBikeBookings] = await Promise.all([
        prisma.bike_quote_requests.findMany({
          where: quoteWhere,
          include: {
            locations: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, images: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bike_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleModelName || b.vehicle_models?.name || b.vehicleCategoryName || 'Bike',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bike Rental',
          pickupLocation: b.locations?.name || b.locationName,
          pickupAddress: b.pickupAddress,
          numberOfVehicles: b.numberOfVehicles,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          totalQuotesReceived: b.totalQuotesReceived,
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: b.vehicle_models?.sideImage || b.vehicle_models?.images?.split(',')[0] || '/images/fleet/default-bike.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedBikeBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleModelName || b.vehicleCategoryName || 'Bike',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bike Rental',
          pickupLocation: b.locationName,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.totalAmount || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-bike.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
        total,
      };
    }

    case 'self-drive-car-rentals':
    case 'self-drive': {
      // Get all confirmed booking IDs (self-drive bookings are stored in car_bookings table)
      const confirmedBookings = await prisma.car_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds },
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedSelfDriveBookings] = await Promise.all([
        prisma.self_drive_quote_requests.findMany({
          where: quoteWhere,
          include: {
            locations: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, images: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.car_bookings.findMany({
          where: bookingWhere,
          include: {
            self_drive_quote_requests: { select: { numberOfVehicles: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicle_modelsName || b.vehicle_models?.name || b.vehicleCategoryName || 'Vehicle',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || b.vehicle_category || 'Self Drive',
          pickupLocation: b.locations?.name || b.locationName,
          numberOfVehicles: b.numberOfVehicles,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: b.vehicle_models?.sideImage || b.vehicle_models?.images?.split(',')[0] || '/images/fleet/default-car.jpg',
          source: b.source || 'web',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedSelfDriveBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.assignedVehicleName || b.requestedVehicleName || 'Vehicle',
          services_vehicle_models_subServiceIdToservices: b.requestedCategory || 'Self Drive',
          pickupLocation: b.locationName,
          numberOfVehicles: b.self_drive_quote_requests?.numberOfVehicles ?? null,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-car.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
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
      // Add date filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
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
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-car.jpg',
        })),
        total,
      };
    }

    case 'bus-rental':
    case 'tempo-traveller': {
      // Get all confirmed booking IDs (quoteRequestIds from bus_bookings)
      const confirmedBookings = await prisma.bus_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds }, // Exclude confirmed bookings
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedBusBookings] = await Promise.all([
        prisma.bus_quote_requests.findMany({
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bus_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Bus',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bus Rental',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-bus.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedBusBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Bus',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Bus Rental',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-bus.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
        total,
      };
    }

    case 'truck-rental':
    case 'truck-tempo-rental':
    case 'transporter': {
      // Get all confirmed booking IDs (quoteRequestIds from truck_bookings)
      const confirmedBookings = await prisma.truck_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds }, // Exclude confirmed bookings
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedTruckBookings] = await Promise.all([
        prisma.truck_quote_requests.findMany({
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.truck_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Truck',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Truck Rental',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-truck.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedTruckBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleCategoryName || b.vehicle_category || 'Truck',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Truck Rental',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.pickupDate,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-truck.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
        total,
      };
    }

    case 'luxury-car-rental':
    case 'luxury-cars': {
      // Get all confirmed booking IDs (quoteRequestIds from luxury_bookings)
      const confirmedBookings = await prisma.luxury_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds }, // Exclude confirmed bookings
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedLuxuryBookings] = await Promise.all([
        prisma.luxury_quote_requests.findMany({
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.luxury_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.specificModel || b.vehicleCategoryName || 'Luxury Car',
          services_vehicle_models_subServiceIdToservices: b.vehicle_category || 'Luxury Car',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-luxury.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedLuxuryBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.specificModel || b.vehicleCategoryName || 'Luxury Car',
          services_vehicle_models_subServiceIdToservices: b.vehicle_category || 'Luxury Car',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.pickupDate,
          endDate: b.returnDate || b.pickupDate,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-luxury.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
        total,
      };
    }

    case 'packers-and-movers':
    case 'packers-movers': {
      // Get all confirmed booking IDs (quoteRequestIds from packers_bookings)
      const confirmedBookings = await prisma.packers_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds }, // Exclude confirmed bookings
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedPackersBookings] = await Promise.all([
        prisma.packers_quote_requests.findMany({
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.packers_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.shiftingType || 'Packers & Movers',
          services_vehicle_models_subServiceIdToservices: b.serviceType || 'Moving Service',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.preferredDate,
          endDate: b.preferredDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-packers.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedPackersBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.shiftingType || 'Packers & Movers',
          services_vehicle_models_subServiceIdToservices: b.serviceType || 'Moving Service',
          pickupLocation: b.pickupCity,
          dropLocation: b.dropCity,
          startDate: b.scheduledDate || b.createdAt,
          endDate: b.scheduledDate || b.createdAt,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-packers.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
        total,
      };
    }

    case 'equipment-rental': {
      // Get all confirmed booking IDs (quoteRequestIds from equipment_bookings)
      const confirmedBookings = await prisma.equipment_bookings.findMany({
        select: { quoteRequestId: true },
      });
      const confirmedQuoteIds = confirmedBookings.map(b => b.quoteRequestId).filter(Boolean);

      // Fetch quote requests (exclude confirmed ones)
      const quoteWhere: any = {
        id: { notIn: confirmedQuoteIds }, // Exclude confirmed bookings
      };
      if (search) {
        quoteWhere.OR = [
          { requestNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        quoteWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        quoteWhere.createdAt = {};
        if (startDate) quoteWhere.createdAt.gte = startDate;
        if (endDate) quoteWhere.createdAt.lte = endDate;
      }

      // Fetch confirmed bookings
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
        ];
      }
      if (status && status !== 'ALL') {
        bookingWhere.status = status;
      }
      // Add date filter
      if (startDate || endDate) {
        bookingWhere.createdAt = {};
        if (startDate) bookingWhere.createdAt.gte = startDate;
        if (endDate) bookingWhere.createdAt.lte = endDate;
      }

      const [quoteRequests, confirmedEquipmentBookings] = await Promise.all([
        prisma.equipment_quote_requests.findMany({
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.equipment_bookings.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Merge and format both lists
      const allBookings = [
        ...quoteRequests.map((b) => ({
          id: b.id,
          bookingNo: b.requestNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.equipmentName || b.equipmentType || 'Equipment',
          services_vehicle_models_subServiceIdToservices: b.equipmentType || 'Equipment Rental',
          pickupLocation: b.deliveryCity,
          startDate: b.startDate,
          endDate: b.endDate || b.startDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-equipment.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedEquipmentBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.equipmentName || b.equipmentType || 'Equipment',
          services_vehicle_models_subServiceIdToservices: b.equipmentType || 'Equipment Rental',
          pickupLocation: b.deliveryCity,
          startDate: b.startDate,
          endDate: b.endDate || b.startDate,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
          source: b.source || 'web',
          createdAt: b.createdAt,
          vehicleImage: '/images/fleet/default-equipment.jpg',
          type: 'CONFIRMED_BOOKING',
        })),
      ];

      // Sort by createdAt desc
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allBookings.length;
      const paginatedBookings = allBookings.slice(skip, skip + limit);

      return {
        bookings: paginatedBookings,
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
    const dateFilter = searchParams.get('dateFilter') || 'ALL';
    const customStartDate = searchParams.get('startDate') || '';
    const customEndDate = searchParams.get('endDate') || '';

    // Calculate date range based on filter
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

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
      status,
      startDate,
      endDate
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
        pending: bookings.filter(b => ['PENDING', 'PENDING_VENDOR', 'BROADCASTED'].includes(b.status)).length,
        quotesReceived: bookings.filter(b => b.status === 'QUOTES_RECEIVED').length,
        advancePaid: bookings.filter(b => ['ADVANCE_PAID', 'DRIVER_ASSIGNED', 'VEHICLE_ASSIGNED', 'READY_FOR_TRIP', 'TRIP_READY', 'READY', 'ONGOING', 'IN_PROGRESS', 'TRIP_STARTED'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)).length,
        totalRevenue: bookings.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + (b.totalAmount || 0), 0),
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
