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

    console.log('=== BOOKING DETAIL API ===');
    console.log('Service slug:', slug);
    console.log('Booking ID:', id);

    switch (slug) {
      case 'self-drive-car-rentals':
      case 'self-drive': {
        // NOTE: Self-drive service doesn't have separate bookings table
        // All bookings (pending SDQ-xxx & completed SD-xxx) are in self_drive_quote_requests table
        // The bookingNumber/requestNumber changes from SDQ-xxx to SD-xxx when booking is confirmed

        // Try to find in quote_requests first (for pending bookings SDQ-xxx)
        console.log('🔍 Searching for booking in self_drive_quote_requests with ID:', id);
        booking = await prisma.self_drive_quote_requests.findUnique({
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
            // Include car_bookings for completed bookings (SD-xxx)
            car_bookings: {
              include: {
                vendors_car_bookings_assignedVendorIdTovendors: {
                  select: {
                    id: true,
                    businessName: true,
                    phone: true,
                    email: true,
                  },
                },
                vendors_car_bookings_acceptedVendorIdTovendors: {
                  select: {
                    id: true,
                    businessName: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        console.log('Quote request found?', !!booking);
        if (booking) {
          console.log('✅ Found quote request:', {
            id: booking.id,
            requestNumber: booking.requestNumber,
            status: booking.status,
          });
        }

        // If not found in quote_requests, try car_bookings table (for completed bookings)
        let carBookingDirect = null;
        if (!booking) {
          console.log('🔍 Not found in quote_requests, trying car_bookings table...');
          carBookingDirect = await prisma.car_bookings.findUnique({
            where: { id },
            include: {
              vendors_car_bookings_assignedVendorIdTovendors: {
                select: {
                  id: true,
                  businessName: true,
                  phone: true,
                  email: true,
                },
              },
              vendors_car_bookings_acceptedVendorIdTovendors: {
                select: {
                  id: true,
                  businessName: true,
                  phone: true,
                  email: true,
                },
              },
              self_drive_quote_requests: {
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
              },
            },
          });

          if (carBookingDirect) {
            console.log('✅ Found in car_bookings:', {
              id: carBookingDirect.id,
              bookingNumber: carBookingDirect.bookingNumber,
              status: carBookingDirect.status,
              hasQuoteRequest: !!carBookingDirect.self_drive_quote_requests,
            });

            // If car_booking has related quote_request, use that
            if (carBookingDirect.self_drive_quote_requests) {
              booking = carBookingDirect.self_drive_quote_requests;
              booking.car_bookings = carBookingDirect;
            } else {
              // Car booking exists but no related quote_request
              // Build a minimal booking object from car_bookings data
              console.log('⚠️ Car booking found but no related quote_request, using car_bookings data only');
              booking = {
                id: carBookingDirect.id,
                requestNumber: carBookingDirect.bookingNumber,
                customerName: carBookingDirect.customerName,
                customerPhone: carBookingDirect.customerPhone,
                customerEmail: carBookingDirect.customerEmail,
                customerId: carBookingDirect.customerId,
                locationId: carBookingDirect.locationId,
                locationName: carBookingDirect.locationName,
                pickupDate: carBookingDirect.pickupDate,
                pickupTime: carBookingDirect.pickupTime,
                dropDate: carBookingDirect.dropDate,
                dropTime: carBookingDirect.dropTime,
                totalDays: carBookingDirect.totalDays,
                pickupAddress: carBookingDirect.pickupAddress,
                dropAddress: carBookingDirect.dropAddress,
                isDeliveryRequested: carBookingDirect.isDeliveryRequested,
                vehicleBrand: carBookingDirect.requestedBrand,
                vehicle_category: carBookingDirect.requestedCategory,
                vehicleCategoryName: carBookingDirect.requestedCategory,
                vehicleType: carBookingDirect.requestedVehicleType,
                transmission: carBookingDirect.requestedTransmission,
                fuelType: carBookingDirect.requestedFuelType,
                minSeats: carBookingDirect.requestedSeats,
                vehicle_modelsName: carBookingDirect.requestedVehicleName,
                licenseNumber: carBookingDirect.licenseNumber,
                customerNotes: carBookingDirect.customerNotes,
                status: carBookingDirect.status,
                createdAt: carBookingDirect.createdAt,
                updatedAt: carBookingDirect.updatedAt,
                car_bookings: carBookingDirect,
                customers: null,
                locations: null,
                vehicle_models: null,
              };
            }
          }
        }

        if (!booking) {
          console.log('❌ Booking not found in either table. ID:', id);
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

        // Check if this is a completed booking (has car_bookings record)
        const carBooking = booking.car_bookings;
        const isCompleted = !!carBooking;

        return NextResponse.json({
          success: true,
          service: {
            id: service.id,
            name: service.name,
            slug: service.slug,
          },
          booking: {
            id: booking.id,
            bookingNo: carBooking?.bookingNumber || booking.requestNumber,
            type: isCompleted ? 'COMPLETED_BOOKING' : 'QUOTE_REQUEST',

            // Customer details
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customer: booking.customers,

            // Vendor details (from car_bookings if completed)
            assignedVendor: carBooking?.vendors_car_bookings_assignedVendorIdTovendors,
            acceptedVendor: carBooking?.vendors_car_bookings_acceptedVendorIdTovendors,
            vendor: carBooking?.vendors_car_bookings_acceptedVendorIdTovendors || carBooking?.vendors_car_bookings_assignedVendorIdTovendors,

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

            // Assigned vehicle details (from car_bookings if completed)
            assignedVehicleName: carBooking?.assignedVehicleName,
            assignedVehicleId: carBooking?.assignedVehicleId,

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

            // Budget (quote request) or Pricing (completed booking)
            budgetMin: booking.budgetMin,
            budgetMax: booking.budgetMax,
            dailyRate: carBooking?.dailyRate,
            baseAmount: carBooking?.baseAmount,
            gstAmount: carBooking?.gstAmount,
            platformFee: carBooking?.platformFee,
            securityDeposit: carBooking?.securityDeposit,
            grandTotal: carBooking?.grandTotal,
            kmLimitPerDay: carBooking?.kmLimitPerDay,
            extraKmRate: carBooking?.extraKmRate,

            // Payment details (only for completed bookings)
            paymentStatus: carBooking?.paymentStatus,
            paidAmount: carBooking?.paidAmount,
            paymentMethod: carBooking?.paymentMethod,
            transactionId: carBooking?.transactionId,
            advanceAmount: carBooking?.advanceAmount,
            advancePaymentDate: carBooking?.advancePaymentDate,
            advancePaymentRef: carBooking?.advancePaymentRef,
            advancePaymentProof: carBooking?.advancePaymentProof,
            advancePaymentVerified: carBooking?.advancePaymentVerified,

            // Status
            status: carBooking?.status || booking.status,
            bookingStatus: carBooking?.status,
            quoteRequestStatus: booking.status,

            // Notes
            customerNotes: booking.customerNotes,
            licenseNumber: carBooking?.licenseNumber || booking.licenseNumber,
            licenseVerified: carBooking?.licenseVerified,
            vendorNotes: carBooking?.vendorNotes,
            adminNotes: carBooking?.adminNotes,

            // Trip details (only for completed bookings)
            odometerStart: carBooking?.odometerStart,
            odometerEnd: carBooking?.odometerEnd,
            extraKmCharges: carBooking?.extraKmCharges,
            pickedUpAt: carBooking?.pickedUpAt,
            returnedAt: carBooking?.returnedAt,
            completedAt: carBooking?.completedAt,

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
        // Try by id first, then by bookingNumber (for helpdesk redirect links)
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

        // Fallback: try by bookingNumber if id lookup failed
        if (!booking) {
          booking = await prisma.chauffeur_bookings.findUnique({
            where: { bookingNumber: id },
            include: {
              locations: true,
              customers: {
                select: { id: true, name: true, email: true, phone: true },
              },
              vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
                select: { id: true, businessName: true, phone: true, email: true },
              },
              vendors_chauffeur_bookings_assignedVendorIdTovendors: {
                select: { id: true, businessName: true, phone: true, email: true },
              },
            },
          });
        }

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
            vendor: booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors || booking.vendors_chauffeur_bookings_assignedVendorIdTovendors,
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
        console.log('Searching for bike booking with ID:', id);

        // Try to find in confirmed bookings first
        let confirmedBooking = null;
        try {
          confirmedBooking = await prisma.bike_bookings.findUnique({
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
              vendors_bike_bookings_acceptedVendorIdTovendors: {
                select: {
                  id: true,
                  businessName: true,
                  phone: true,
                  email: true,
                },
              },
              vendors_bike_bookings_assignedVendorIdTovendors: {
                select: {
                  id: true,
                  businessName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          });
          console.log('Found confirmed bike booking:', confirmedBooking ? 'Yes' : 'No');
        } catch (error) {
          console.error('Error fetching bike booking:', error);
          logger.error('Error fetching bike booking:', error);
        }

        if (confirmedBooking) {
          // This is a confirmed booking (BK-xxx)
          // Fetch the related quote request separately
          let quoteRequest = null;
          if (confirmedBooking.quoteRequestId) {
            quoteRequest = await prisma.bike_quote_requests.findUnique({
              where: { id: confirmedBooking.quoteRequestId },
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
              },
            });
          }

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.bike_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              acceptedVendor: confirmedBooking.vendors_bike_bookings_acceptedVendorIdTovendors,
              assignedVendor: confirmedBooking.vendors_bike_bookings_assignedVendorIdTovendors,
              vendor: confirmedBooking.vendors_bike_bookings_acceptedVendorIdTovendors || confirmedBooking.vendors_bike_bookings_assignedVendorIdTovendors,
              // Vehicle details
              vehicleModelName: confirmedBooking.vehicleModelName || quoteRequest?.vehicleModelName,
              vehicle_models: quoteRequest?.vehicle_models,
              vehicleBrand: confirmedBooking.vehicleBrand || quoteRequest?.vehicleBrand,
              vehicleCategory: confirmedBooking.vehicleCategory || quoteRequest?.vehicleCategory,
              vehicleCategoryName: confirmedBooking.vehicleCategoryName || quoteRequest?.vehicleCategoryName,
              // Location details
              location: quoteRequest?.locations,
              locationName: confirmedBooking.locationName || quoteRequest?.locationName,
              // Date/Time details
              pickupDate: confirmedBooking.pickupDate || quoteRequest?.pickupDate,
              pickupTime: confirmedBooking.pickupTime || quoteRequest?.pickupTime,
              dropDate: confirmedBooking.dropDate || quoteRequest?.dropDate,
              dropTime: confirmedBooking.dropTime || quoteRequest?.dropTime,
              totalDays: confirmedBooking.totalDays || quoteRequest?.totalDays,
              helmetsRequired: confirmedBooking.helmetsRequired || quoteRequest?.helmetsRequired,
              // Notes
              customerNotes: confirmedBooking.customerNotes || quoteRequest?.customerNotes,
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
              status: confirmedBooking.status,
              paymentStatus: confirmedBooking.paymentStatus,
              grandTotal: confirmedBooking.grandTotal,
              paidAmount: confirmedBooking.paidAmount,
              refundAmount: confirmedBooking.refundAmount,
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
              // Cancellation details (bike_bookings has no cancelledAt column, use updatedAt as proxy)
              cancellationReason: confirmedBooking.cancellationReason,
              cancelledAt: ['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(confirmedBooking.status) ? confirmedBooking.updatedAt : null,
              cancelledBy: confirmedBooking.cancelledBy ?? null,
              quoteRequestId: confirmedBooking.quoteRequestId,
              acceptedQuoteId: confirmedBooking.acceptedQuoteId,
              createdAt: confirmedBooking.createdAt,
              updatedAt: confirmedBooking.updatedAt,
            },
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              vehicleName: acceptedQuote.vehicleName,
              vehicleBrand: acceptedQuote.vehicleBrand,
              vehicleCategory: acceptedQuote.vehicleCategory,
              vehicleYear: acceptedQuote.vehicleYear,
              vehicleImages: acceptedQuote.vehicleImages ? acceptedQuote.vehicleImages.split(',') : [],
              vehicleFeatures: acceptedQuote.vehicleFeatures,
              registrationNumber: acceptedQuote.registrationNumber,
              dailyRate: acceptedQuote.dailyRate,
              totalAmount: acceptedQuote.totalAmount,
              kmLimitPerDay: acceptedQuote.kmLimitPerDay,
              extraKmCharge: acceptedQuote.extraKmCharge,
              securityDeposit: acceptedQuote.securityDeposit,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.grandTotal,
              advanceAmount: acceptedQuote.advanceAmount,
              advancePercent: acceptedQuote.advancePercent,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              validityDays: acceptedQuote.validityDays,
              viewCount: acceptedQuote.viewCount,
              viewedAt: acceptedQuote.viewedAt,
              sentAt: acceptedQuote.sentAt,
              respondedAt: acceptedQuote.respondedAt,
              createdAt: acceptedQuote.createdAt,
            }] : [],
          });
        }

        // Not found in confirmed bookings, try quote requests
        console.log('Searching in bike_quote_requests with ID:', id);
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
        console.log('Found in bike_quote_requests:', booking ? 'Yes' : 'No');

        if (!booking) {
          console.log('Bike booking not found in either table for ID:', id);
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

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.bus_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleBrand: confirmedBooking.vehicleBrand || acceptedQuote?.vehicleBrand,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
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
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              vehicleName: acceptedQuote.vehicleName,
              vehicleBrand: acceptedQuote.vehicleBrand,
              vehicleCategory: acceptedQuote.vehicleCategory,
              vehicleYear: acceptedQuote.vehicleYear,
              vehicleImages: acceptedQuote.vehicleImages ? acceptedQuote.vehicleImages.split(',') : [],
              vehicleFeatures: acceptedQuote.vehicleFeatures,
              registrationNumber: acceptedQuote.registrationNumber,
              dailyRate: acceptedQuote.dailyRate,
              totalAmount: acceptedQuote.totalAmount,
              kmLimitPerDay: acceptedQuote.kmLimitPerDay,
              extraKmCharge: acceptedQuote.extraKmCharge,
              securityDeposit: acceptedQuote.securityDeposit,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.totalAmount,
              advanceAmount: acceptedQuote.advanceAmount,
              advancePercent: acceptedQuote.advancePercent,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              validityDays: acceptedQuote.validityDays,
              viewCount: acceptedQuote.viewCount,
              viewedAt: acceptedQuote.viewedAt,
              sentAt: acceptedQuote.sentAt,
              respondedAt: acceptedQuote.respondedAt,
              createdAt: acceptedQuote.createdAt,
            }] : [],
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

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.truck_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleBrand: confirmedBooking.vehicleBrand || acceptedQuote?.vehicleBrand,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
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
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              vehicleName: acceptedQuote.vehicleName,
              vehicleType: acceptedQuote.vehicleType,
              vehicleCapacity: acceptedQuote.vehicleCapacity,
              vehicleNumber: acceptedQuote.vehicleNumber,
              vehicleImages: acceptedQuote.vehicleImages ? acceptedQuote.vehicleImages.split(',') : [],
              baseAmount: acceptedQuote.baseAmount,
              perKmRate: acceptedQuote.perKmRate,
              loadingCharges: acceptedQuote.loadingCharges,
              unloadingCharges: acceptedQuote.unloadingCharges,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.totalAmount,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              createdAt: acceptedQuote.createdAt,
            }] : [],
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
            vendors_luxury_bookings_acceptedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            vendors_luxury_bookings_assignedVendorIdTovendors: {
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

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.luxury_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              acceptedVendor: confirmedBooking.vendors_luxury_bookings_acceptedVendorIdTovendors,
              assignedVendor: confirmedBooking.vendors_luxury_bookings_assignedVendorIdTovendors,
              vendor: confirmedBooking.vendors_luxury_bookings_acceptedVendorIdTovendors || confirmedBooking.vendors_luxury_bookings_assignedVendorIdTovendors,
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
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleBrand: confirmedBooking.vehicleBrand || acceptedQuote?.vehicleBrand,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
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
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              vehicleName: acceptedQuote.vehicleName,
              vehicleBrand: acceptedQuote.vehicleBrand,
              vehicle_models: acceptedQuote.vehicle_models,
              vehicleYear: acceptedQuote.vehicleYear,
              vehicleColor: acceptedQuote.vehicleColor,
              vehicleImages: acceptedQuote.vehicleImages ? acceptedQuote.vehicleImages.split(',') : [],
              baseAmount: acceptedQuote.baseAmount,
              baseRate: acceptedQuote.baseRate,
              perKmRate: acceptedQuote.perKmRate,
              chauffeurCharges: acceptedQuote.chauffeurCharges,
              decorationCharges: acceptedQuote.decorationCharges,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.totalAmount,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              createdAt: acceptedQuote.createdAt,
            }] : [],
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

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.packers_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleBrand: confirmedBooking.vehicleBrand || acceptedQuote?.vehicleBrand,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
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
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              packingCharges: acceptedQuote.packingCharges,
              transportCharges: acceptedQuote.transportCharges,
              unpackingCharges: acceptedQuote.unpackingCharges,
              storageCharges: acceptedQuote.storageCharges,
              insuranceCharges: acceptedQuote.insuranceCharges,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.totalAmount,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              createdAt: acceptedQuote.createdAt,
            }] : [],
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

          // Fetch the accepted quote if available
          let acceptedQuote = null;
          if (confirmedBooking.acceptedQuoteId) {
            acceptedQuote = await prisma.equipment_quotes.findUnique({
              where: { id: confirmedBooking.acceptedQuoteId },
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
            });
          }

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
              location: quoteRequest?.locations,
              pickupLocation: quoteRequest?.locations,
              // Map to frontend expected field names
              pickupCity: confirmedBooking.deliveryCity || quoteRequest?.deliveryCity,
              pickupAddress: confirmedBooking.deliveryAddress || quoteRequest?.deliveryAddress,
              locationName: confirmedBooking.deliveryCity || quoteRequest?.deliveryCity,
              startDate: confirmedBooking.startDate || quoteRequest?.startDate,
              endDate: confirmedBooking.endDate || quoteRequest?.endDate,
              pickupDate: confirmedBooking.startDate || quoteRequest?.startDate,
              dropDate: confirmedBooking.endDate || quoteRequest?.endDate,
              rentalDays: confirmedBooking.rentalDays || quoteRequest?.rentalDays,
              needOperator: confirmedBooking.needOperator || quoteRequest?.needOperator,
              needDelivery: confirmedBooking.needDelivery || quoteRequest?.needDelivery,
              needInstallation: confirmedBooking.needInstallation || quoteRequest?.needInstallation,
              requirements: confirmedBooking.requirements || quoteRequest?.requirements,
              // Driver details
              driverName: confirmedBooking.driverName || acceptedQuote?.driverName,
              driverPhone: confirmedBooking.driverPhone || acceptedQuote?.driverPhone,
              // Vehicle details from booking or accepted quote
              vehicleNumber: confirmedBooking.vehicleNumber || acceptedQuote?.vehicleNumber || acceptedQuote?.registrationNumber,
              vehicleName: confirmedBooking.vehicleName || acceptedQuote?.vehicleName,
              vehicleBrand: confirmedBooking.vehicleBrand || acceptedQuote?.vehicleBrand,
              vehicleModel: confirmedBooking.vehicleModel || acceptedQuote?.vehicleModel,
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
            quotes: acceptedQuote ? [{
              id: acceptedQuote.id,
              quoteNumber: acceptedQuote.quoteNumber,
              vendor: acceptedQuote.vendors,
              equipmentName: acceptedQuote.equipmentName,
              equipmentModel: acceptedQuote.equipmentModel,
              dailyRate: acceptedQuote.dailyRate,
              weeklyRate: acceptedQuote.weeklyRate,
              monthlyRate: acceptedQuote.monthlyRate,
              operatorCharges: acceptedQuote.operatorCharges,
              deliveryCharges: acceptedQuote.deliveryCharges,
              installationCharges: acceptedQuote.installationCharges,
              securityDeposit: acceptedQuote.securityDeposit,
              gstAmount: acceptedQuote.gstAmount,
              grandTotal: acceptedQuote.totalAmount,
              inclusions: acceptedQuote.inclusions,
              exclusions: acceptedQuote.exclusions,
              termsConditions: acceptedQuote.termsConditions,
              vendorMessage: acceptedQuote.vendorMessage,
              status: 'ACCEPTED',
              validTill: acceptedQuote.validTill,
              createdAt: acceptedQuote.createdAt,
            }] : [],
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
            // Map to frontend expected field names
            pickupCity: booking.deliveryCity,
            pickupAddress: booking.deliveryAddress,
            locationName: booking.deliveryCity,
            startDate: booking.startDate,
            endDate: booking.endDate,
            pickupDate: booking.startDate,
            dropDate: booking.endDate,
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
        console.log('UNMATCHED SLUG:', slug);
        return NextResponse.json({ error: 'Service type not supported', slug }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Fetch booking details error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details', details: error?.message },
      { status: 500 }
    );
  }
}
