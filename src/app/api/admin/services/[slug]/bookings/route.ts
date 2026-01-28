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
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          totalQuotesReceived: b.totalQuotesReceived,
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
      // Get all confirmed booking IDs
      const confirmedBookings = await prisma.self_drive_bookings.findMany({
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

      const [quoteRequests, confirmedSelfDriveBookings] = await Promise.all([
        prisma.self_drive_quote_requests.findMany({
          where: quoteWhere,
          include: {
            locations: { select: { name: true } },
            vehicle_models: { select: { name: true, sideImage: true, images: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.self_drive_bookings.findMany({
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
          vehicleName: b.vehicle_modelsName || b.vehicle_models?.name || b.vehicleCategoryName || 'Vehicle',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || b.vehicle_category || 'Self Drive',
          pickupLocation: b.locations?.name || b.locationName,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.budgetMax || 0,
          status: b.status,
          paymentStatus: 'PENDING',
          createdAt: b.createdAt,
          vehicleImage: b.vehicle_models?.sideImage || b.vehicle_models?.images?.split(',')[0] || '/images/fleet/default-car.jpg',
          type: 'QUOTE_REQUEST',
        })),
        ...confirmedSelfDriveBookings.map((b) => ({
          id: b.id,
          bookingNo: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          vehicleName: b.vehicleModelName || b.vehicleCategoryName || 'Vehicle',
          services_vehicle_models_subServiceIdToservices: b.vehicleCategoryName || 'Self Drive',
          pickupLocation: b.locationName,
          startDate: b.pickupDate,
          endDate: b.dropDate,
          totalAmount: b.totalAmount || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
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
          startDate: b.preferredDate,
          endDate: b.preferredDate,
          totalAmount: b.totalAmount || b.grandTotal || 0,
          status: b.status,
          paymentStatus: b.paymentStatus || 'PENDING',
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
