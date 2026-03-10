import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
import { sendVendorDirectNotification, sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
import { checkFleetAvailability, blockDatesForBooking } from '@/lib/utils/fleet-availability';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single booking detail for manager (search across all services)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

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

    // Get assigned location IDs
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean);

    // Common includes for relations
    const customerInclude = { select: { id: true, name: true, email: true, phone: true } };
    const locationInclude = { select: { id: true, name: true, slug: true } };

    // Search across all service booking tables
    const [
      bikeBooking,
      busBooking,
      carBooking,
      chauffeurBooking,
      equipmentBooking,
      luxuryBooking,
      packersBooking,
      truckBooking,
    ] = await Promise.all([
      // Bike Rental
      prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Bus Rental
      prisma.bus_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Self Drive
      prisma.car_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          locations: locationInclude,
          vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Chauffeur / Car Rental
      prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors_chauffeur_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_chauffeur_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Equipment Rental
      prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Luxury Cars
      prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors_luxury_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
          vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Packers & Movers
      prisma.packers_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),

      // Truck Transport
      prisma.truck_bookings.findUnique({
        where: { id: bookingId },
        include: {
          customers: customerInclude,
          vendors: { select: { id: true, businessName: true, phone: true, email: true } },
        },
      }).catch(() => null),
    ]);

    // Find which booking exists
    let booking: any = null;
    let serviceName = '';
    let serviceSlug = '';

    if (bikeBooking) {
      booking = bikeBooking;
      serviceName = 'Bike Rental';
      serviceSlug = 'bike-rental';
    } else if (busBooking) {
      booking = busBooking;
      serviceName = 'Bus Rental';
      serviceSlug = 'bus-rental';
    } else if (carBooking) {
      booking = carBooking;
      serviceName = 'Self Drive';
      serviceSlug = 'self-drive';
    } else if (chauffeurBooking) {
      booking = chauffeurBooking;
      serviceName = 'Car Rental';
      serviceSlug = 'car-rental';
    } else if (equipmentBooking) {
      booking = equipmentBooking;
      serviceName = 'Equipment Rental';
      serviceSlug = 'equipment-rental';
    } else if (luxuryBooking) {
      booking = luxuryBooking;
      serviceName = 'Luxury Cars';
      serviceSlug = 'luxury-car-rental';
    } else if (packersBooking) {
      booking = packersBooking;
      serviceName = 'Packers & Movers';
      serviceSlug = 'packers-and-movers';
    } else if (truckBooking) {
      booking = truckBooking;
      serviceName = 'Truck Transport';
      serviceSlug = 'truck-transport';
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if manager has access to this booking's location
    const bookingLocationId = booking.locationId;
    const bookingLocationName = booking.pickupCity || booking.locationName;

    const hasLocationAccess = assignedLocationIds.length === 0 ||
      (bookingLocationId && assignedLocationIds.includes(bookingLocationId)) ||
      (bookingLocationName && assignedLocationNames.includes(bookingLocationName));

    if (!hasLocationAccess) {
      return NextResponse.json(
        { error: 'Access denied. You are not assigned to this location.' },
        { status: 403 }
      );
    }

    // Get vendor name based on service type
    const getVendorData = () => {
      if (serviceSlug === 'bike-rental') {
        return booking.vendors_bike_bookings_acceptedVendorIdTovendors || booking.vendors_bike_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'self-drive') {
        return booking.vendors_car_bookings_acceptedVendorIdTovendors || booking.vendors_car_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'car-rental') {
        return booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors || booking.vendors_chauffeur_bookings_assignedVendorIdTovendors;
      } else if (serviceSlug === 'luxury-car-rental') {
        return booking.vendors_luxury_bookings_acceptedVendorIdTovendors || booking.vendors_luxury_bookings_assignedVendorIdTovendors;
      } else {
        return booking.vendors;
      }
    };

    const vendor = getVendorData();

    // Destructure out Prisma's verbose relation names, spread all raw fields
    const {
      customers,
      locations,
      vendors,
      vendors_bike_bookings_assignedVendorIdTovendors,
      vendors_bike_bookings_acceptedVendorIdTovendors,
      vendors_car_bookings_assignedVendorIdTovendors,
      vendors_car_bookings_acceptedVendorIdTovendors,
      vendors_chauffeur_bookings_assignedVendorIdTovendors,
      vendors_chauffeur_bookings_acceptedVendorIdTovendors,
      vendors_luxury_bookings_assignedVendorIdTovendors,
      vendors_luxury_bookings_acceptedVendorIdTovendors,
      ...rawFields
    } = booking;

    // Build clean relation references
    const assignedVendor = serviceSlug === 'bike-rental' ? vendors_bike_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'self-drive' ? vendors_car_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'car-rental' ? vendors_chauffeur_bookings_assignedVendorIdTovendors :
                           serviceSlug === 'luxury-car-rental' ? vendors_luxury_bookings_assignedVendorIdTovendors :
                           null;
    const acceptedVendor = serviceSlug === 'bike-rental' ? vendors_bike_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'self-drive' ? vendors_car_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'car-rental' ? vendors_chauffeur_bookings_acceptedVendorIdTovendors :
                           serviceSlug === 'luxury-car-rental' ? vendors_luxury_bookings_acceptedVendorIdTovendors :
                           vendors;

    // Format response - spread ALL raw fields, then overlay normalized aliases
    const formattedBooking = {
      ...rawFields,
      serviceName,
      serviceSlug,
      // Normalized customer fields
      customerName: customers?.name || booking.customerName,
      customerEmail: customers?.email || booking.customerEmail,
      customerPhone: customers?.phone || booking.customerPhone,
      customer: customers,
      // Normalized vendor fields
      vendorName: vendor?.businessName || null,
      vendorPhone: vendor?.phone || null,
      vendorEmail: vendor?.email || null,
      assignedVendor,
      acceptedVendor,
      // Normalized location
      locationName: locations?.name || booking.pickupCity || booking.locationName,
      // Normalized vehicle
      requestedVehicleName: booking.requestedVehicleName || booking.vehicleName || booking.carCategoryName || null,
      requestedCategory: booking.requestedCategory || booking.vehicleCategory || booking.carCategory || null,
      // Normalized date aliases
      pickupDate: booking.pickupDate || booking.startDate || booking.moveDate,
      pickupTime: booking.pickupTime || '',
      dropDate: booking.dropDate || booking.returnDate || booking.endDate || null,
      dropTime: booking.dropTime || booking.returnTime || '',
      // Normalized amount aliases
      totalDays: booking.totalDays || booking.tripDays || booking.durationDays || 0,
      dailyRate: booking.dailyRate || booking.baseFare || booking.baseAmount || booking.baseRate || null,
      totalAmount: booking.totalAmount || booking.grandTotal || 0,
      grandTotal: booking.grandTotal || booking.totalAmount || 0,
      paidAmount: booking.paidAmount || booking.advancePaid || 0,
      // Normalized trip status aliases
      pickedUpAt: booking.pickedUpAt || booking.tripStartedAt || null,
      returnedAt: booking.returnedAt || booking.tripEndedAt || null,
    };

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error: any) {
    logger.error('Manager booking detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// Helper: find booking across all service tables, returns { booking, serviceSlug, tableName }
async function findBookingById(bookingId: string) {
  const searches = [
    { fn: () => prisma.bike_bookings.findUnique({ where: { id: bookingId } }), slug: 'bike-rental', table: 'bike' },
    { fn: () => prisma.bus_bookings.findUnique({ where: { id: bookingId } }), slug: 'bus-rental', table: 'bus' },
    { fn: () => prisma.car_bookings.findUnique({ where: { id: bookingId } }), slug: 'self-drive', table: 'car' },
    { fn: () => prisma.chauffeur_bookings.findUnique({ where: { id: bookingId } }), slug: 'car-rental', table: 'chauffeur' },
    { fn: () => prisma.equipment_bookings.findUnique({ where: { id: bookingId } }), slug: 'equipment-rental', table: 'equipment' },
    { fn: () => prisma.luxury_bookings.findUnique({ where: { id: bookingId } }), slug: 'luxury-car-rental', table: 'luxury' },
    { fn: () => prisma.packers_bookings.findUnique({ where: { id: bookingId } }), slug: 'packers-and-movers', table: 'packers' },
    { fn: () => prisma.truck_bookings.findUnique({ where: { id: bookingId } }), slug: 'truck-transport', table: 'truck' },
  ];

  const results = await Promise.all(searches.map(s => s.fn().catch(() => null)));
  for (let i = 0; i < results.length; i++) {
    if (results[i]) return { booking: results[i] as any, serviceSlug: searches[i].slug, table: searches[i].table };
  }
  return null;
}

// PUT - Perform actions on a booking (verify_payment, reject_payment, broadcast, complete_trip, cancel)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Verify manager role
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason, notes } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    // Find the booking across all tables
    const found = await findBookingById(bookingId);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const { booking, serviceSlug, table } = found;

    // ==================== VERIFY PAYMENT ====================
    if (action === 'verify_payment') {
      if (table === 'chauffeur') {
        const isSingleVendor = !!booking.assignedVendorId;
        const advanceAmount = booking.paidAmount > 0
          ? booking.paidAmount
          : booking.partialPayment || Math.round(booking.grandTotal * 0.3);

        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: advanceAmount >= booking.grandTotal ? 'PAID' : 'PARTIAL',
            paidAmount: advanceAmount,
            status: isSingleVendor ? 'PENDING_VENDOR' : 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
            adminNotes: notes || reason ? `Payment verified: ${notes || reason}` : 'Payment verified by manager',
          },
        });

        // Notify customer
        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your car rental booking payment of ₹${advanceAmount} has been approved.`,
              type: 'payment',
              serviceType: 'car',
              bookingId,
              quoteId: null,
            }),
          });
          await sendFCMNotification({
            customerId: booking.customerId,
            title: 'Payment Approved!',
            body: `Your car rental booking payment of ₹${advanceAmount} has been approved.`,
            data: { type: 'payment', serviceType: 'car', bookingId },
          });
        } catch (e) { logger.error('Notification error', e); }

        // Notify vendor(s)
        if (isSingleVendor) {
          sendVendorDirectNotification({
            vendorId: booking.assignedVendorId,
            title: 'New Car Rental Booking!',
            body: `A new car rental booking has been assigned to you. Please review and confirm.`,
            type: 'booking_assigned',
            serviceType: 'car',
            bookingId,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        } else {
          const fullBooking = await prisma.chauffeur_bookings.findUnique({
            where: { id: bookingId },
            select: { locationId: true, locationName: true, bookingNumber: true },
          });
          if (fullBooking?.locationId) {
            sendQuoteRequestNotificationToVendors({
              requestId: bookingId,
              requestNumber: fullBooking.bookingNumber || bookingId,
              locationId: fullBooking.locationId,
              locationName: fullBooking.locationName || 'your city',
              customerName: 'A customer',
              serviceType: 'car',
              serviceDisplayName: 'Car Rental',
            }).catch((err: any) => logger.error('Broadcast notify failed', err));
          }
        }

        return NextResponse.json({
          success: true,
          message: isSingleVendor
            ? 'Payment verified. Booking sent to assigned vendor.'
            : 'Payment verified. Booking broadcasted to all vendors.',
        });
      }

      if (table === 'bike') {
        const hasAcceptedVendor = !!(booking.assignedVendorId || booking.acceptedVendorId);
        const vendorId = booking.assignedVendorId || booking.acceptedVendorId;

        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL',
            advancePaymentVerified: true,
            paidAmount: booking.advanceAmount || booking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.acceptedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.dropDate ? new Date(booking.dropDate) : startDate;
            const availability = await checkFleetAvailability(booking.acceptedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.acceptedVehicleId, startDate, endDate, bookingId, 'bike');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your bike booking payment has been approved.`,
              type: 'payment', serviceType: 'bike', bookingId, quoteId: null,
            }),
          });
          await sendFCMNotification({
            customerId: booking.customerId,
            title: 'Payment Approved!',
            body: `Your bike booking payment has been approved.`,
            data: { type: 'payment', serviceType: 'bike', bookingId },
          });
        } catch (e) { logger.error('Notification error', e); }

        if (hasAcceptedVendor && vendorId) {
          sendVendorDirectNotification({
            vendorId,
            title: 'Payment Verified! Booking Confirmed',
            body: `Customer's advance payment has been verified for bike booking #${booking.bookingNumber}.`,
            type: 'payment_received', serviceType: 'bike', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'car') {
        const hasAcceptedVendor = !!(booking.assignedVendorId || booking.acceptedVendorId);
        const vendorId = booking.assignedVendorId || booking.acceptedVendorId;

        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL',
            advancePaymentVerified: true,
            paidAmount: booking.advanceAmount || booking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.dropDate ? new Date(booking.dropDate) : startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'car');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your self-drive car booking payment has been approved.`,
              type: 'payment', serviceType: 'self-drive', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (hasAcceptedVendor && vendorId) {
          sendVendorDirectNotification({
            vendorId,
            title: 'Payment Verified! Booking Confirmed',
            body: `Customer's advance payment has been verified for self-drive booking #${booking.bookingNumber}.`,
            type: 'payment_received', serviceType: 'self-drive', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'bus') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
            confirmedAt: new Date(),
            adminNotes: 'Payment verified by manager',
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = booking.returnDate ? new Date(booking.returnDate) : startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'bus');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your bus booking payment has been approved.`,
              type: 'payment', serviceType: 'bus', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Trip is confirmed.`,
            type: 'payment_received', serviceType: 'bus', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'truck') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
            vendorNotes: 'Payment verified by manager',
          },
        });

        if (booking.assignedVehicleId && booking.pickupDate) {
          try {
            const startDate = new Date(booking.pickupDate);
            const endDate = startDate;
            const availability = await checkFleetAvailability(booking.assignedVehicleId, startDate, endDate);
            if (availability.available) {
              await blockDatesForBooking(prisma, booking.assignedVehicleId, startDate, endDate, bookingId, 'truck');
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your truck booking payment has been approved.`,
              type: 'payment', serviceType: 'truck', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Trip is confirmed.`,
            type: 'payment_received', serviceType: 'truck', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'equipment') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your equipment booking payment has been approved.`,
              type: 'payment', serviceType: 'equipment', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'equipment', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'luxury') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        if (booking.acceptedQuoteId && booking.pickupDate) {
          try {
            const quote = await prisma.luxury_quotes.findUnique({
              where: { id: booking.acceptedQuoteId },
              select: { fleetId: true },
            });
            if (quote?.fleetId) {
              const startDate = new Date(booking.pickupDate);
              const endDate = booking.returnDate ? new Date(booking.returnDate) : startDate;
              const availability = await checkFleetAvailability(quote.fleetId, startDate, endDate);
              if (availability.available) {
                await blockDatesForBooking(prisma, quote.fleetId, startDate, endDate, bookingId, 'luxury');
              }
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your luxury car booking payment has been approved.`,
              type: 'payment', serviceType: 'luxury', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.acceptedVendorId) {
          sendVendorDirectNotification({
            vendorId: booking.acceptedVendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for luxury booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'luxury', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      if (table === 'packers') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: booking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        if (booking.acceptedQuoteId && booking.scheduledDate) {
          try {
            const quote = await prisma.packers_quotes.findUnique({
              where: { id: booking.acceptedQuoteId },
              select: { vendorFleetId: true },
            });
            if (quote?.vendorFleetId) {
              const startDate = new Date(booking.scheduledDate);
              const availability = await checkFleetAvailability(quote.vendorFleetId, startDate, startDate);
              if (availability.available) {
                await blockDatesForBooking(prisma, quote.vendorFleetId, startDate, startDate, bookingId, 'packers');
              }
            }
          } catch (err) { logger.error('Failed to block dates', err); }
        }

        try {
          await prisma.notifications.create({
            data: prepareNotificationData({
              customerId: booking.customerId,
              title: 'Payment Approved!',
              body: `Your packers & movers booking payment has been approved.`,
              type: 'payment', serviceType: 'packers', bookingId, quoteId: null,
            }),
          });
        } catch (e) { logger.error('Notification error', e); }

        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Advance Payment Received!',
            body: `Customer has paid the advance for booking #${booking.bookingNumber}. Booking is confirmed.`,
            type: 'payment_received', serviceType: 'packers', bookingId, bookingNumber: booking.bookingNumber,
          }).catch((err: any) => logger.error('Vendor notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
      }

      return NextResponse.json({ success: false, error: 'Unsupported booking type for payment verification' }, { status: 400 });
    }

    // ==================== REJECT PAYMENT ====================
    if (action === 'reject_payment') {
      const rejectNotes = reason || notes || 'Payment rejected by manager';
      const rejectNotifBody = `Your booking payment was rejected. ${reason || 'Please contact support.'}`;
      const serviceTypeMap: Record<string, string> = {
        'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
        'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
        'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers',
      };

      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            adminNotes: rejectNotes,
          },
        });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            customerNotes: `${booking.customerNotes || ''}\n\nPayment rejected: ${rejectNotes}`.trim(),
          },
        });
      } else if (table === 'car') {
        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            vendorNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
            vendorNotes: `Payment rejected: ${rejectNotes}`,
          },
        });
      }

      // Send rejection notification
      try {
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Payment Rejected',
            body: rejectNotifBody,
            type: 'payment',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
        await sendFCMNotification({
          customerId: booking.customerId,
          title: 'Payment Rejected',
          body: rejectNotifBody,
          data: { type: 'payment', serviceType: serviceTypeMap[serviceSlug] || 'car', bookingId },
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Payment rejected.' });
    }

    // ==================== BROADCAST ====================
    if (action === 'broadcast') {
      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        if (booking.locationId) {
          sendQuoteRequestNotificationToVendors({
            requestId: bookingId,
            requestNumber: booking.bookingNumber || bookingId,
            locationId: booking.locationId,
            locationName: booking.locationName || 'your city',
            customerName: 'A customer',
            serviceType: 'car',
            serviceDisplayName: 'Car Rental',
          }).catch((err: any) => logger.error('Broadcast notify failed', err));
        }

        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      if (table === 'bike') {
        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      if (table === 'car') {
        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'BROADCASTED',
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: 'Booking broadcasted to vendors.' });
      }

      return NextResponse.json({ success: false, error: 'Broadcast not supported for this booking type' }, { status: 400 });
    }

    // ==================== COMPLETE TRIP ====================
    if (action === 'complete_trip') {
      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', returnedAt: new Date() } });
      } else if (table === 'car') {
        await prisma.car_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date(), returnedAt: new Date() } });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      }

      // Notify customer
      try {
        const serviceTypeMap: Record<string, string> = {
          'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
          'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
          'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers',
        };
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Trip Completed!',
            body: `Your booking #${booking.bookingNumber} has been marked as completed. Thank you for choosing TransRentals!`,
            type: 'booking',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Trip marked as completed.' });
    }

    // ==================== CANCEL BOOKING ====================
    if (action === 'cancel') {
      const cancelReason = reason || 'Cancelled by manager';

      if (table === 'chauffeur') {
        await prisma.chauffeur_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'bike') {
        await prisma.bike_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancellationReason: cancelReason } });
      } else if (table === 'car') {
        await prisma.car_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'bus') {
        await prisma.bus_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'truck') {
        await prisma.truck_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'equipment') {
        await prisma.equipment_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'luxury') {
        await prisma.luxury_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      } else if (table === 'packers') {
        await prisma.packers_bookings.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MANAGER', cancellationReason: cancelReason } });
      }

      // Notify customer
      try {
        const serviceTypeMap: Record<string, string> = {
          'bike-rental': 'bike', 'self-drive': 'self-drive', 'car-rental': 'car',
          'bus-rental': 'bus', 'truck-transport': 'truck', 'equipment-rental': 'equipment',
          'luxury-car-rental': 'luxury', 'packers-and-movers': 'packers',
        };
        await prisma.notifications.create({
          data: prepareNotificationData({
            customerId: booking.customerId,
            title: 'Booking Cancelled',
            body: `Your booking #${booking.bookingNumber} has been cancelled. ${reason || ''}`.trim(),
            type: 'booking',
            serviceType: serviceTypeMap[serviceSlug] || 'car',
            bookingId,
            quoteId: null,
          }),
        });
        await sendFCMNotification({
          customerId: booking.customerId,
          title: 'Booking Cancelled',
          body: `Your booking #${booking.bookingNumber} has been cancelled. ${reason || ''}`.trim(),
          data: { type: 'booking', serviceType: serviceTypeMap[serviceSlug] || 'car', bookingId },
        });
      } catch (e) { logger.error('Notification error', e); }

      return NextResponse.json({ success: true, message: 'Booking cancelled.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Manager booking action error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform action', details: error?.message },
      { status: 500 }
    );
  }
}
