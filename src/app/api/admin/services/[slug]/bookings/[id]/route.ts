// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single booking details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug, id } = resolvedParams;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch booking based on service type
    let booking = null;
    let quotes = [];

    switch (slug) {
      case 'self-drive-car-rentals':
      case 'self-drive': {
        // Fetch quote request with all related data
        booking = await prisma.self_drive_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            vehicle_models: {
              select: {
                id: true,
                name: true,
                brand: true,
                sideImage: true,
                images: true,
                specs: true,
              },
            },
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch all quotes for this request
        quotes = await prisma.self_drive_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',

            // Customer details
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,

            // Vehicle details
            vehicleModelName: booking.vehicle_modelsName,
            vehicle_models: booking.vehicle_models,
            vehicleBrand: booking.vehicleBrand,
            chauffeur_vehicle_categories: booking.vehicle_category,
            vehicleCategoryName: booking.vehicleCategoryName,
            vehicleType: booking.vehicleType,
            transmission: booking.transmission,
            fuelType: booking.fuelType,
            minSeats: booking.minSeats,

            // Location details
            location: booking.locations,
            locationName: booking.locationName,
            pickupAddress: booking.pickupAddress,
            dropAddress: booking.dropAddress,
            isDeliveryRequested: booking.isDeliveryRequested,

            // Date/Time details
            pickupDate: booking.pickupDate,
            pickupTime: booking.pickupTime,
            dropDate: booking.dropDate,
            dropTime: booking.dropTime,
            totalDays: booking.totalDays,

            // Budget
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,

            // Status
            status: booking.status,

            // Notes
            customerNotes: booking.customerNotes,
            licenseNumber: booking.licenseNumber,

            // Quote stats
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,

            // Dates
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            vehicleName: q.vehicleName,
            vehicleBrand: q.vehicleBrand,
            chauffeur_vehicle_categories: q.vehicle_category,
            vehicleType: q.vehicleType,
            vehicleYear: q.vehicleYear,
            vehicleImages: q.vehicleImages ? q.vehicleImages.split(',') : [],
            vehicleFeatures: q.vehicleFeatures,
            registrationNumber: q.registrationNumber,
            transmission: q.transmission,
            fuelType: q.fuelType,
            seats: q.seats,
            dailyRate: q.dailyRate,
            baseAmount: q.baseAmount,
            kmLimitPerDay: q.kmLimitPerDay,
            extraKmRate: q.extraKmRate,
            deliveryCharges: q.deliveryCharges,
            pickupCharges: q.pickupCharges,
            securityDeposit: q.securityDeposit,
            gstAmount: q.gstAmount,
            platformFee: q.platformFee,
            grandTotal: q.grandTotal,
            advanceAmount: q.advanceAmount,
            advancePercent: q.advancePercent,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            validityDays: q.validityDays,
            viewCount: q.viewCount,
            viewedAt: q.viewedAt,
            sentAt: q.sentAt,
            respondedAt: q.respondedAt,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'car-rental':
      case 'chauffeur-driven':
      case 'chauffeur-service': {
        booking = await prisma.chauffeur_bookings.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            vendors_chauffeur_bookings_assignedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.bookingNumber,
            type: 'DIRECT_BOOKING',

            // Customer details
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,

            // Trip details
            tripType: booking.tripType,
            carCategory: booking.carCategory,
            carCategoryName: booking.carCategoryName,

            // Location details
            location: booking.locations,
            locationName: booking.locationName,
            pickupCity: booking.pickupCity,
            dropCity: booking.dropCity,
            pickupAddress: booking.pickupAddress,
            dropAddress: booking.dropAddress,
            estimatedDistance: booking.estimatedDistance,

            // Airport details (if applicable)
            airportName: booking.airportName,
            flightNumber: booking.flightNumber,
            terminalNumber: booking.terminalNumber,

            // Local package details (if applicable)
            localPackageId: booking.localPackageId,
            localPackageHours: booking.localPackageHours,
            localPackageKm: booking.localPackageKm,

            // Date/Time details
            pickupDate: booking.pickupDate,
            pickupTime: booking.pickupTime,
            returnDate: booking.returnDate,
            returnTime: booking.returnTime,
            totalDays: booking.totalDays,
            totalHours: booking.totalHours,

            // Vendor & Driver details
            assignedVendor: booking.vendors_chauffeur_bookings_assignedVendorIdTovendors,
            acceptedVendor: booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors,
            driverName: booking.driverName,
            driverPhone: booking.driverPhone,
            driverPhoto: booking.driverPhoto,
            vehicleNumber: booking.vehicleNumber,
            vehicle_models: booking.vehicle_models,

            // Pricing details
            baseFare: booking.baseFare,
            perKmRate: booking.perKmRate,
            chargeableKm: booking.chargeableKm,
            kmCharges: booking.kmCharges,
            driverBatta: booking.driverBatta,
            nightCharges: booking.nightCharges,
            waitingCharges: booking.waitingCharges,
            extraHourCharges: booking.extraHourCharges,
            extraKmCharges: booking.extraKmCharges,
            tollCharges: booking.tollCharges,
            statePermitCharges: booking.statePermitCharges,
            gstAmount: booking.gstAmount,
            platformFee: booking.platformFee,
            grandTotal: booking.grandTotal,

            // Actual trip details
            actualKmTravelled: booking.actualKmTravelled,
            actualHours: booking.actualHours,
            actualTollCharges: booking.actualTollCharges,
            actualParkingCharges: booking.actualParkingCharges,

            // Payment
            paymentStatus: booking.paymentStatus,
            paidAmount: booking.paidAmount,
            paymentMethod: booking.paymentMethod,
            transactionId: booking.transactionId,
            partialPayment: booking.partialPayment,
            remainingPayment: booking.remainingPayment,

            // Status & Tracking
            status: booking.status,
            tripStartOtp: booking.tripStartOtp,
            tripEndOtp: booking.tripEndOtp,

            // Broadcast/Response tracking
            rejectedByVendors: booking.rejectedByVendors,
            responseDeadline: booking.responseDeadline,
            broadcastedAt: booking.broadcastedAt,
            acceptedAt: booking.acceptedAt,
            driverAssignedAt: booking.driverAssignedAt,
            tripStartedAt: booking.tripStartedAt,
            tripEndedAt: booking.tripEndedAt,

            // Notes & Reviews
            customerNotes: booking.customerNotes,
            vendorNotes: booking.vendorNotes,
            adminNotes: booking.adminNotes,
            rating: booking.rating,
            review: booking.review,
            driverRating: booking.driverRating,
            driverReview: booking.driverReview,

            // Cancellation
            cancellationReason: booking.cancellationReason,
            cancelledAt: booking.cancelledAt,
            cancelledBy: booking.cancelledBy,
            refundAmount: booking.refundAmount,
            refundTransactionId: booking.refundTransactionId,

            // Dates
            completedAt: booking.completedAt,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
          },
          quotes: [], // Car rental doesn't have quotes
        });
      }

      case 'bike-on-rent':
      case 'bike-rental': {
        // Fetch quote request with all related data
        booking = await prisma.bike_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            vehicle_models: {
              select: {
                id: true,
                name: true,
                brandId: true,
                sideImage: true,
                images: true,
                specs: true,
                brands: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch all quotes for this request
        quotes = await prisma.bike_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',

            // Customer details
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,

            // Vehicle details
            vehicleModelName: booking.vehicleModelName,
            vehicle_models: booking.vehicle_models,
            vehicleBrand: booking.vehicleBrand,
            vehicleCategory: booking.vehicleCategory,
            vehicleCategoryName: booking.vehicleCategoryName,

            // Location details
            location: booking.locations,
            locationName: booking.locationName,

            // Date/Time details
            pickupDate: booking.pickupDate,
            pickupTime: booking.pickupTime,
            dropDate: booking.dropDate,
            dropTime: booking.dropTime,
            totalDays: booking.totalDays,
            helmetsRequired: booking.helmetsRequired,

            // Budget
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,

            // Status
            status: booking.status,

            // Notes
            customerNotes: booking.customerNotes,

            // Quote stats
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,

            // Dates
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            vehicleName: q.vehicleName,
            vehicleBrand: q.vehicleBrand,
            vehicleCategory: q.vehicleCategory,
            vehicleYear: q.vehicleYear,
            vehicleImages: q.vehicleImages ? q.vehicleImages.split(',') : [],
            vehicleFeatures: q.vehicleFeatures,
            registrationNumber: q.registrationNumber,
            dailyRate: q.dailyRate,
            totalAmount: q.totalAmount,
            kmLimitPerDay: q.kmLimitPerDay,
            extraKmCharge: q.extraKmCharge,
            securityDeposit: q.securityDeposit,
            gstAmount: q.gstAmount,
            grandTotal: q.grandTotal,
            advanceAmount: q.advanceAmount,
            advancePercent: q.advancePercent,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            validityDays: q.validityDays,
            viewCount: q.viewCount,
            viewedAt: q.viewedAt,
            sentAt: q.sentAt,
            respondedAt: q.respondedAt,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'bus-rental':
      case 'tempo-traveller': {
        // Try to find in confirmed bookings first
        let confirmedBooking = await prisma.bus_bookings.findUnique({
          where: { id },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            bus_quote_requests: {
              include: {
                locations: true,
              },
            },
          },
        });

        if (confirmedBooking) {
          // This is a confirmed booking (BB-xxx)
          const quoteRequest = confirmedBooking.bus_quote_requests;

          return NextResponse.json({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              slug: service.slug,
            },
            booking: {
              id: confirmedBooking.id,
              bookingNo: confirmedBooking.bookingNumber,
              type: 'CONFIRMED_BOOKING',
              customerName: confirmedBooking.customerName,
              customerPhone: confirmedBooking.customerPhone,
              customerEmail: confirmedBooking.customerEmail,
              customer: confirmedBooking.customers,
              vendor: confirmedBooking.vendors,
              vehicleCategoryName: confirmedBooking.vehicleCategoryName || confirmedBooking.vehicle_category,
              vehicleCategory: confirmedBooking.vehicle_category,
              passengers: confirmedBooking.passengers || quoteRequest?.passengers,
              tripType: confirmedBooking.tripType || quoteRequest?.tripType,
              pickupCity: confirmedBooking.pickupCity || quoteRequest?.pickupCity,
              pickupAddress: confirmedBooking.pickupAddress || quoteRequest?.pickupAddress,
              pickupLocation: quoteRequest?.locations,
              dropCity: confirmedBooking.dropCity || quoteRequest?.dropCity,
              dropAddress: confirmedBooking.dropAddress || quoteRequest?.dropAddress,
              pickupDate: confirmedBooking.pickupDate || quoteRequest?.pickupDate,
              pickupTime: confirmedBooking.pickupTime || quoteRequest?.pickupTime,
              returnDate: confirmedBooking.returnDate || quoteRequest?.returnDate,
              tripDays: confirmedBooking.tripDays || quoteRequest?.tripDays,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              totalAmount: confirmedBooking.totalAmount,
              advanceAmount: confirmedBooking.advanceAmount,
              advancePaid: confirmedBooking.advancePaid,
              advancePaidAt: confirmedBooking.advancePaidAt,
              advancePaymentRef: confirmedBooking.advancePaymentRef,
              advancePaymentProof: confirmedBooking.advancePaymentProof,
              advancePaymentDate: confirmedBooking.advancePaymentDate,
              advancePaymentVerified: confirmedBooking.advancePaymentVerified,
              remainingAmount: confirmedBooking.remainingAmount,
              remainingPaid: confirmedBooking.remainingPaid,
              remainingPaidAt: confirmedBooking.remainingPaidAt,
              remainingPaymentRef: confirmedBooking.remainingPaymentRef,
              remainingPaymentProof: confirmedBooking.remainingPaymentProof,
              remainingPaymentDate: confirmedBooking.remainingPaymentDate,
              remainingPaymentVerified: confirmedBooking.remainingPaymentVerified,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: [], // Confirmed bookings don't need quotes list
          });
        }

        // Not found in confirmed bookings, try quote requests
        booking = await prisma.bus_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch quotes for this request
        quotes = await prisma.bus_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,
            chauffeur_vehicle_categories: booking.vehicle_category,
            vehicleCategoryName: booking.vehicleCategoryName,
            location: booking.locations,
            pickupCity: booking.pickupCity,
            dropCity: booking.dropCity,
            pickupDate: booking.pickupDate,
            returnDate: booking.returnDate,
            totalDays: booking.totalDays,
            passengers: booking.passengers,
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            requirements: booking.requirements,
            status: booking.status,
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            vehicleName: q.vehicleName,
            vehicleType: q.vehicleType,
            vehicleNumber: q.vehicleNumber,
            vehicleSeats: q.vehicleSeats,
            vehicleImages: q.vehicleImages ? q.vehicleImages.split(',') : [],
            baseAmount: q.baseAmount,
            perKmRate: q.perKmRate,
            driverAllowance: q.driverAllowance,
            tollEstimate: q.tollEstimate,
            permitCharges: q.permitCharges,
            parkingEstimate: q.parkingEstimate,
            nightHaltCharges: q.nightHaltCharges,
            gstAmount: q.gstAmount,
            grandTotal: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'truck-rental':
      case 'truck-tempo-rental':
      case 'transporter': {
        // Try to find in confirmed bookings first
        let confirmedBooking = await prisma.truck_bookings.findUnique({
          where: { id },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            truck_quote_requests: {
              include: {
                locations: true,
              },
            },
          },
        });

        if (confirmedBooking) {
          // This is a confirmed booking (TB-xxx)
          const quoteRequest = confirmedBooking.truck_quote_requests;

          return NextResponse.json({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              slug: service.slug,
            },
            booking: {
              id: confirmedBooking.id,
              bookingNo: confirmedBooking.bookingNumber,
              type: 'CONFIRMED_BOOKING',
              customerName: confirmedBooking.customerName,
              customerPhone: confirmedBooking.customerPhone,
              customerEmail: confirmedBooking.customerEmail,
              customer: confirmedBooking.customers,
              vendor: confirmedBooking.vendors,
              vehicleCategoryName: confirmedBooking.vehicleCategoryName || confirmedBooking.vehicle_category,
              vehicleCategory: confirmedBooking.vehicle_category,
              loadType: confirmedBooking.loadType || quoteRequest?.loadType,
              pickupCity: confirmedBooking.pickupCity || quoteRequest?.pickupCity,
              pickupAddress: confirmedBooking.pickupAddress || quoteRequest?.pickupAddress,
              pickupLocation: quoteRequest?.locations,
              dropCity: confirmedBooking.dropCity || quoteRequest?.dropCity,
              dropAddress: confirmedBooking.dropAddress || quoteRequest?.dropAddress,
              pickupDate: confirmedBooking.pickupDate || quoteRequest?.pickupDate,
              estimatedWeight: confirmedBooking.estimatedWeight || quoteRequest?.estimatedWeight,
              goodsType: confirmedBooking.goodsType || quoteRequest?.goodsType,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              totalAmount: confirmedBooking.totalAmount,
              advanceAmount: confirmedBooking.advanceAmount,
              advancePaid: confirmedBooking.advancePaid,
              advancePaidAt: confirmedBooking.advancePaidAt,
              advancePaymentRef: confirmedBooking.advancePaymentRef,
              advancePaymentProof: confirmedBooking.advancePaymentProof,
              advancePaymentDate: confirmedBooking.advancePaymentDate,
              advancePaymentVerified: confirmedBooking.advancePaymentVerified,
              remainingAmount: confirmedBooking.remainingAmount,
              remainingPaid: confirmedBooking.remainingPaid,
              remainingPaidAt: confirmedBooking.remainingPaidAt,
              remainingPaymentRef: confirmedBooking.remainingPaymentRef,
              remainingPaymentProof: confirmedBooking.remainingPaymentProof,
              remainingPaymentDate: confirmedBooking.remainingPaymentDate,
              remainingPaymentVerified: confirmedBooking.remainingPaymentVerified,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: [], // Confirmed bookings don't need quotes list
          });
        }

        // Not found in confirmed bookings, try quote requests
        booking = await prisma.truck_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch quotes for this request
        quotes = await prisma.truck_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,
            chauffeur_vehicle_categories: booking.vehicle_category,
            vehicleCategoryName: booking.vehicleCategoryName,
            loadType: booking.loadType,
            location: booking.locations,
            pickupCity: booking.pickupCity,
            dropCity: booking.dropCity,
            pickupDate: booking.pickupDate,
            estimatedWeight: booking.estimatedWeight,
            goodsType: booking.goodsType,
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            requirements: booking.requirements,
            status: booking.status,
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            vehicleName: q.vehicleName,
            vehicleType: q.vehicleType,
            vehicleCapacity: q.vehicleCapacity,
            vehicleNumber: q.vehicleNumber,
            vehicleImages: q.vehicleImages ? q.vehicleImages.split(',') : [],
            baseAmount: q.baseAmount,
            perKmRate: q.perKmRate,
            loadingCharges: q.loadingCharges,
            unloadingCharges: q.unloadingCharges,
            gstAmount: q.gstAmount,
            grandTotal: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'luxury-car-rental':
      case 'luxury-cars': {
        // Try to find in confirmed bookings first
        let confirmedBooking = await prisma.luxury_bookings.findUnique({
          where: { id },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            luxury_quote_requests: {
              include: {
                locations: true,
              },
            },
          },
        });

        if (confirmedBooking) {
          // This is a confirmed booking (LB-xxx)
          const quoteRequest = confirmedBooking.luxury_quote_requests;

          return NextResponse.json({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              slug: service.slug,
            },
            booking: {
              id: confirmedBooking.id,
              bookingNo: confirmedBooking.bookingNumber,
              type: 'CONFIRMED_BOOKING',
              customerName: confirmedBooking.customerName,
              customerPhone: confirmedBooking.customerPhone,
              customerEmail: confirmedBooking.customerEmail,
              customer: confirmedBooking.customers,
              vendor: confirmedBooking.vendors,
              tripType: confirmedBooking.tripType || quoteRequest?.tripType,
              occasion: confirmedBooking.occasion || quoteRequest?.occasion,
              vehicleCategoryName: confirmedBooking.vehicleCategoryName || confirmedBooking.vehicle_category,
              vehicleCategory: confirmedBooking.vehicle_category,
              specificModel: confirmedBooking.specificModel || quoteRequest?.specificModel,
              pickupCity: confirmedBooking.pickupCity || quoteRequest?.pickupCity,
              pickupAddress: confirmedBooking.pickupAddress || quoteRequest?.pickupAddress,
              pickupLocation: quoteRequest?.locations,
              dropCity: confirmedBooking.dropCity || quoteRequest?.dropCity,
              dropAddress: confirmedBooking.dropAddress || quoteRequest?.dropAddress,
              pickupDate: confirmedBooking.pickupDate || quoteRequest?.pickupDate,
              returnDate: confirmedBooking.returnDate || quoteRequest?.returnDate,
              tripDays: confirmedBooking.tripDays || quoteRequest?.tripDays,
              passengers: confirmedBooking.passengers || quoteRequest?.passengers,
              needChauffeur: confirmedBooking.needChauffeur || quoteRequest?.needChauffeur,
              needDecoration: confirmedBooking.needDecoration || quoteRequest?.needDecoration,
              decorationType: confirmedBooking.decorationType || quoteRequest?.decorationType,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              totalAmount: confirmedBooking.totalAmount,
              advanceAmount: confirmedBooking.advanceAmount,
              advancePaid: confirmedBooking.advancePaid,
              advancePaidAt: confirmedBooking.advancePaidAt,
              advancePaymentRef: confirmedBooking.advancePaymentRef,
              advancePaymentProof: confirmedBooking.advancePaymentProof,
              advancePaymentDate: confirmedBooking.advancePaymentDate,
              advancePaymentVerified: confirmedBooking.advancePaymentVerified,
              remainingAmount: confirmedBooking.remainingAmount,
              remainingPaid: confirmedBooking.remainingPaid,
              remainingPaidAt: confirmedBooking.remainingPaidAt,
              remainingPaymentRef: confirmedBooking.remainingPaymentRef,
              remainingPaymentProof: confirmedBooking.remainingPaymentProof,
              remainingPaymentDate: confirmedBooking.remainingPaymentDate,
              remainingPaymentVerified: confirmedBooking.remainingPaymentVerified,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: [], // Confirmed bookings don't need quotes list
          });
        }

        // Not found in confirmed bookings, try quote requests
        booking = await prisma.luxury_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch quotes for this request
        quotes = await prisma.luxury_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,
            tripType: booking.tripType,
            occasion: booking.occasion,
            chauffeur_vehicle_categories: booking.vehicle_category,
            vehicleCategoryName: booking.vehicleCategoryName,
            specificModel: booking.specificModel,
            location: booking.locations,
            pickupCity: booking.pickupCity,
            dropCity: booking.dropCity,
            pickupDate: booking.pickupDate,
            returnDate: booking.returnDate,
            tripDays: booking.tripDays,
            passengers: booking.passengers,
            needChauffeur: booking.needChauffeur,
            needDecoration: booking.needDecoration,
            decorationType: booking.decorationType,
            requirements: booking.requirements,
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            status: booking.status,
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            vehicleName: q.vehicleName,
            vehicleBrand: q.vehicleBrand,
            vehicle_models: q.vehicle_models,
            vehicleYear: q.vehicleYear,
            vehicleColor: q.vehicleColor,
            vehicleImages: q.vehicleImages ? q.vehicleImages.split(',') : [],
            baseAmount: q.baseAmount,
            baseRate: q.baseRate,
            perKmRate: q.perKmRate,
            chauffeurCharges: q.chauffeurCharges,
            decorationCharges: q.decorationCharges,
            gstAmount: q.gstAmount,
            grandTotal: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'packers-and-movers':
      case 'packers-movers': {
        // Try to find in confirmed bookings first
        let confirmedBooking = await prisma.packers_bookings.findUnique({
          where: { id },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            packers_quote_requests: {
              include: {
                locations: true,
              },
            },
          },
        });

        if (confirmedBooking) {
          // This is a confirmed booking (PB-xxx)
          const quoteRequest = confirmedBooking.packers_quote_requests;

          return NextResponse.json({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              slug: service.slug,
            },
            booking: {
              id: confirmedBooking.id,
              bookingNo: confirmedBooking.bookingNumber,
              type: 'CONFIRMED_BOOKING',
              customerName: confirmedBooking.customerName,
              customerPhone: confirmedBooking.customerPhone,
              customerEmail: confirmedBooking.customerEmail,
              customer: confirmedBooking.customers,
              vendor: confirmedBooking.vendors,
              serviceType: confirmedBooking.serviceType || quoteRequest?.serviceType,
              shiftingType: confirmedBooking.shiftingType || quoteRequest?.shiftingType,
              propertySize: confirmedBooking.propertySize || quoteRequest?.propertySize,
              pickupCity: confirmedBooking.pickupCity || quoteRequest?.pickupCity,
              pickupAddress: confirmedBooking.pickupAddress || quoteRequest?.pickupAddress,
              pickupLocation: quoteRequest?.locations,
              dropCity: confirmedBooking.dropCity || quoteRequest?.dropCity,
              dropAddress: confirmedBooking.dropAddress || quoteRequest?.dropAddress,
              preferredDate: confirmedBooking.preferredDate || quoteRequest?.preferredDate,
              needPacking: confirmedBooking.needPacking || quoteRequest?.needPacking,
              needUnpacking: confirmedBooking.needUnpacking || quoteRequest?.needUnpacking,
              needStorage: confirmedBooking.needStorage || quoteRequest?.needStorage,
              needInsurance: confirmedBooking.needInsurance || quoteRequest?.needInsurance,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              totalAmount: confirmedBooking.totalAmount,
              advanceAmount: confirmedBooking.advanceAmount,
              advancePaid: confirmedBooking.advancePaid,
              advancePaidAt: confirmedBooking.advancePaidAt,
              advancePaymentRef: confirmedBooking.advancePaymentRef,
              advancePaymentProof: confirmedBooking.advancePaymentProof,
              advancePaymentDate: confirmedBooking.advancePaymentDate,
              advancePaymentVerified: confirmedBooking.advancePaymentVerified,
              remainingAmount: confirmedBooking.remainingAmount,
              remainingPaid: confirmedBooking.remainingPaid,
              remainingPaidAt: confirmedBooking.remainingPaidAt,
              remainingPaymentRef: confirmedBooking.remainingPaymentRef,
              remainingPaymentProof: confirmedBooking.remainingPaymentProof,
              remainingPaymentDate: confirmedBooking.remainingPaymentDate,
              remainingPaymentVerified: confirmedBooking.remainingPaymentVerified,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: [], // Confirmed bookings don't need quotes list
          });
        }

        // Not found in confirmed bookings, try quote requests
        booking = await prisma.packers_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch quotes for this request
        quotes = await prisma.packers_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,
            serviceType: booking.serviceType,
            shiftingType: booking.shiftingType,
            propertySize: booking.propertySize,
            location: booking.locations,
            pickupCity: booking.pickupCity,
            pickupAddress: booking.pickupAddress,
            dropCity: booking.dropCity,
            dropAddress: booking.dropAddress,
            preferredDate: booking.preferredDate,
            needPacking: booking.needPacking,
            needUnpacking: booking.needUnpacking,
            needStorage: booking.needStorage,
            needInsurance: booking.needInsurance,
            requirements: booking.requirements,
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            status: booking.status,
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            packingCharges: q.packingCharges,
            transportCharges: q.transportCharges,
            unpackingCharges: q.unpackingCharges,
            storageCharges: q.storageCharges,
            insuranceCharges: q.insuranceCharges,
            gstAmount: q.gstAmount,
            grandTotal: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            createdAt: q.createdAt,
          })),
        });
      }

      case 'equipment-rental': {
        // Try to find in confirmed bookings first
        let confirmedBooking = await prisma.equipment_bookings.findUnique({
          where: { id },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            equipment_quote_requests: {
              include: {
                locations: true,
              },
            },
          },
        });

        if (confirmedBooking) {
          // This is a confirmed booking (EB-xxx)
          const quoteRequest = confirmedBooking.equipment_quote_requests;

          return NextResponse.json({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              slug: service.slug,
            },
            booking: {
              id: confirmedBooking.id,
              bookingNo: confirmedBooking.bookingNumber,
              type: 'CONFIRMED_BOOKING',
              customerName: confirmedBooking.customerName,
              customerPhone: confirmedBooking.customerPhone,
              customerEmail: confirmedBooking.customerEmail,
              customer: confirmedBooking.customers,
              vendor: confirmedBooking.vendors,
              equipmentCategory: confirmedBooking.equipmentCategory || quoteRequest?.equipmentCategory,
              equipmentType: confirmedBooking.equipmentType || quoteRequest?.equipmentType,
              equipmentName: confirmedBooking.equipmentName || quoteRequest?.equipmentName,
              quantity: confirmedBooking.quantity || quoteRequest?.quantity,
              deliveryCity: confirmedBooking.deliveryCity || quoteRequest?.deliveryCity,
              deliveryAddress: confirmedBooking.deliveryAddress || quoteRequest?.deliveryAddress,
              pickupLocation: quoteRequest?.locations,
              startDate: confirmedBooking.startDate || quoteRequest?.startDate,
              endDate: confirmedBooking.endDate || quoteRequest?.endDate,
              rentalDays: confirmedBooking.rentalDays || quoteRequest?.rentalDays,
              needOperator: confirmedBooking.needOperator || quoteRequest?.needOperator,
              needDelivery: confirmedBooking.needDelivery || quoteRequest?.needDelivery,
              needInstallation: confirmedBooking.needInstallation || quoteRequest?.needInstallation,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              totalAmount: confirmedBooking.totalAmount,
              advanceAmount: confirmedBooking.advanceAmount,
              advancePaid: confirmedBooking.advancePaid,
              advancePaidAt: confirmedBooking.advancePaidAt,
              advancePaymentRef: confirmedBooking.advancePaymentRef,
              advancePaymentProof: confirmedBooking.advancePaymentProof,
              advancePaymentDate: confirmedBooking.advancePaymentDate,
              advancePaymentVerified: confirmedBooking.advancePaymentVerified,
              remainingAmount: confirmedBooking.remainingAmount,
              remainingPaid: confirmedBooking.remainingPaid,
              remainingPaidAt: confirmedBooking.remainingPaidAt,
              remainingPaymentRef: confirmedBooking.remainingPaymentRef,
              remainingPaymentProof: confirmedBooking.remainingPaymentProof,
              remainingPaymentDate: confirmedBooking.remainingPaymentDate,
              remainingPaymentVerified: confirmedBooking.remainingPaymentVerified,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: [], // Confirmed bookings don't need quotes list
          });
        }

        // Not found in confirmed bookings, try quote requests
        booking = await prisma.equipment_quote_requests.findUnique({
          where: { id },
          include: {
            locations: true,
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch quotes for this request
        quotes = await prisma.equipment_quotes.findMany({
          where: { requestId: id },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: booking.requestNumber,
            type: 'QUOTE_REQUEST',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,
            equipmentCategory: booking.equipmentCategory,
            equipmentType: booking.equipmentType,
            equipmentName: booking.equipmentName,
            quantity: booking.quantity,
            location: booking.locations,
            deliveryCity: booking.deliveryCity,
            deliveryAddress: booking.deliveryAddress,
            startDate: booking.startDate,
            endDate: booking.endDate,
            rentalDays: booking.rentalDays,
            needOperator: booking.needOperator,
            needDelivery: booking.needDelivery,
            needInstallation: booking.needInstallation,
            requirements: booking.requirements,
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            status: booking.status,
            totalQuotesReceived: booking.totalQuotesReceived,
            quotesViewed: booking.quotesViewed,
            acceptedQuoteId: booking.acceptedQuoteId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            expiresAt: booking.expiresAt,
            quotesOpenTill: booking.quotesOpenTill,
          },
          quotes: quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vendor: q.vendors,
            equipmentName: q.equipmentName,
            equipmentModel: q.equipmentModel,
            dailyRate: q.dailyRate,
            weeklyRate: q.weeklyRate,
            monthlyRate: q.monthlyRate,
            operatorCharges: q.operatorCharges,
            deliveryCharges: q.deliveryCharges,
            installationCharges: q.installationCharges,
            securityDeposit: q.securityDeposit,
            gstAmount: q.gstAmount,
            grandTotal: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            termsConditions: q.termsConditions,
            vendorMessage: q.vendorMessage,
            status: q.status,
            validTill: q.validTill,
            createdAt: q.createdAt,
          })),
        });
      }

      default:
        return NextResponse.json({ error: 'Service type not supported' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Fetch booking details error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details', details: error?.message },
      { status: 500 }
    );
  }
}
