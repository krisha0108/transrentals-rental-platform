// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { shouldAutoDrop, DROPPABLE_STATUSES, getDropReasonForCustomer, getDropReasonForDB } from '@/lib/utils/booking-date-guard';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/auto-drop-bookings
 *
 * Cron job that auto-drops bookings where:
 * - Booking end date + 24 hours has passed
 * - Booking is still in a pre-trip status (not IN_PROGRESS or COMPLETED)
 *
 * Protected by CRON_SECRET header.
 *
 * Server cron setup:
 *   0 * * * * curl -s -H "x-cron-secret: YOUR_SECRET" https://your-domain.com/api/cron/auto-drop-bookings
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: any = {
      droppedAt: now.toISOString(),
      services: {},
      totalDropped: 0,
      errors: [],
    };

    // ============================================
    // 1. BIKE BOOKINGS
    // ============================================
    try {
      const bikeBookings = await prisma.bike_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.bike as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          pickupDate: true,
          pickupTime: true,
          dropDate: true,
          dropTime: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          quoteRequestId: true,
        },
      });

      let bikeDropped = 0;
      for (const booking of bikeBookings) {
        if (!shouldAutoDrop(booking.dropDate, booking.dropTime)) continue;

        // Count quotes received
        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.bike_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        const dropReason = getDropReasonForDB(quotesReceived);

        await prisma.bike_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason,
          },
        });

        // Also expire the quote request
        if (booking.quoteRequestId) {
          await prisma.bike_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        // Notify customer
        await sendDropNotification(booking.customerId, booking.bookingNumber, 'bike', quotesReceived);

        // Notify vendor if assigned
        const vendorId = booking.acceptedVendorId || booking.assignedVendorId;
        if (vendorId) {
          await sendVendorDropNotification(vendorId, booking.bookingNumber, 'bike');
        }

        bikeDropped++;
      }
      results.services.bike = bikeDropped;
      results.totalDropped += bikeDropped;
    } catch (err: any) {
      results.errors.push({ service: 'bike', error: err.message });
    }

    // ============================================
    // 2. CAR BOOKINGS (Self-Drive)
    // ============================================
    try {
      const carBookings = await prisma.car_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.car as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          dropDate: true,
          dropTime: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          quoteRequestId: true,
        },
      });

      let carDropped = 0;
      for (const booking of carBookings) {
        if (!shouldAutoDrop(booking.dropDate, booking.dropTime)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.self_drive_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.car_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.self_drive_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'self-drive', quotesReceived);

        const vendorId = booking.acceptedVendorId || booking.assignedVendorId;
        if (vendorId) {
          await sendVendorDropNotification(vendorId, booking.bookingNumber, 'self-drive');
        }

        carDropped++;
      }
      results.services.car = carDropped;
      results.totalDropped += carDropped;
    } catch (err: any) {
      results.errors.push({ service: 'car', error: err.message });
    }

    // ============================================
    // 3. CHAUFFEUR BOOKINGS
    // ============================================
    try {
      const chauffeurBookings = await prisma.chauffeur_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.chauffeur as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
        },
      });

      let chauffeurDropped = 0;
      for (const booking of chauffeurBookings) {
        const endDate = booking.returnDate || booking.pickupDate;
        const endTime = booking.returnTime || booking.pickupTime;
        if (!shouldAutoDrop(endDate, endTime)) continue;

        await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(0),
          },
        });

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'chauffeur-service', 0);

        const vendorId = booking.acceptedVendorId || booking.assignedVendorId;
        if (vendorId) {
          await sendVendorDropNotification(vendorId, booking.bookingNumber, 'chauffeur-service');
        }

        chauffeurDropped++;
      }
      results.services.chauffeur = chauffeurDropped;
      results.totalDropped += chauffeurDropped;
    } catch (err: any) {
      results.errors.push({ service: 'chauffeur', error: err.message });
    }

    // ============================================
    // 4. BUS BOOKINGS
    // ============================================
    try {
      const busBookings = await prisma.bus_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.bus as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          status: true,
          vendorId: true,
          quoteRequestId: true,
        },
      });

      let busDropped = 0;
      for (const booking of busBookings) {
        const endDate = booking.returnDate || booking.pickupDate;
        const endTime = booking.returnTime || booking.pickupTime;
        if (!shouldAutoDrop(endDate, endTime)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.bus_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.bus_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.bus_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'bus', quotesReceived);

        if (booking.vendorId) {
          await sendVendorDropNotification(booking.vendorId, booking.bookingNumber, 'bus');
        }

        busDropped++;
      }
      results.services.bus = busDropped;
      results.totalDropped += busDropped;
    } catch (err: any) {
      results.errors.push({ service: 'bus', error: err.message });
    }

    // ============================================
    // 5. LUXURY BOOKINGS
    // ============================================
    try {
      const luxuryBookings = await prisma.luxury_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.luxury as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          returnTime: true,
          status: true,
          acceptedVendorId: true,
          assignedVendorId: true,
          quoteRequestId: true,
        },
      });

      let luxuryDropped = 0;
      for (const booking of luxuryBookings) {
        const endDate = booking.returnDate || booking.pickupDate;
        const endTime = booking.returnTime || booking.pickupTime;
        if (!shouldAutoDrop(endDate, endTime)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.luxury_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.luxury_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.luxury_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'luxury', quotesReceived);

        const vendorId = booking.acceptedVendorId || booking.assignedVendorId;
        if (vendorId) {
          await sendVendorDropNotification(vendorId, booking.bookingNumber, 'luxury');
        }

        luxuryDropped++;
      }
      results.services.luxury = luxuryDropped;
      results.totalDropped += luxuryDropped;
    } catch (err: any) {
      results.errors.push({ service: 'luxury', error: err.message });
    }

    // ============================================
    // 6. EQUIPMENT BOOKINGS
    // ============================================
    try {
      const equipmentBookings = await prisma.equipment_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.equipment as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          startDate: true,
          endDate: true,
          status: true,
          vendorId: true,
          quoteRequestId: true,
        },
      });

      let equipmentDropped = 0;
      for (const booking of equipmentBookings) {
        if (!shouldAutoDrop(booking.endDate)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.equipment_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.equipment_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.equipment_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'equipment', quotesReceived);

        if (booking.vendorId) {
          await sendVendorDropNotification(booking.vendorId, booking.bookingNumber, 'equipment');
        }

        equipmentDropped++;
      }
      results.services.equipment = equipmentDropped;
      results.totalDropped += equipmentDropped;
    } catch (err: any) {
      results.errors.push({ service: 'equipment', error: err.message });
    }

    // ============================================
    // 7. TRUCK BOOKINGS
    // ============================================
    try {
      const truckBookings = await prisma.truck_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.truck as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          pickupDate: true,
          pickupTime: true,
          status: true,
          vendorId: true,
          quoteRequestId: true,
        },
      });

      let truckDropped = 0;
      for (const booking of truckBookings) {
        // Truck bookings typically have only pickupDate (one-way delivery)
        if (!shouldAutoDrop(booking.pickupDate, booking.pickupTime)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.truck_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.truck_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.truck_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'truck', quotesReceived);

        if (booking.vendorId) {
          await sendVendorDropNotification(booking.vendorId, booking.bookingNumber, 'truck');
        }

        truckDropped++;
      }
      results.services.truck = truckDropped;
      results.totalDropped += truckDropped;
    } catch (err: any) {
      results.errors.push({ service: 'truck', error: err.message });
    }

    // ============================================
    // 8. PACKERS BOOKINGS
    // ============================================
    try {
      const packersBookings = await prisma.packers_bookings.findMany({
        where: {
          status: { in: DROPPABLE_STATUSES.packers as any },
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          scheduledDate: true,
          scheduledTime: true,
          status: true,
          vendorId: true,
          quoteRequestId: true,
        },
      });

      let packersDropped = 0;
      for (const booking of packersBookings) {
        if (!shouldAutoDrop(booking.scheduledDate, booking.scheduledTime)) continue;

        let quotesReceived = 0;
        if (booking.quoteRequestId) {
          quotesReceived = await prisma.packers_quotes.count({
            where: { quoteRequestId: booking.quoteRequestId },
          });
        }

        await prisma.packers_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'DROPPED',
            droppedAt: now,
            dropReason: getDropReasonForDB(quotesReceived),
          },
        });

        if (booking.quoteRequestId) {
          await prisma.packers_quote_requests.update({
            where: { id: booking.quoteRequestId },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }

        await sendDropNotification(booking.customerId, booking.bookingNumber, 'packers', quotesReceived);

        if (booking.vendorId) {
          await sendVendorDropNotification(booking.vendorId, booking.bookingNumber, 'packers');
        }

        packersDropped++;
      }
      results.services.packers = packersDropped;
      results.totalDropped += packersDropped;
    } catch (err: any) {
      results.errors.push({ service: 'packers', error: err.message });
    }

    // ============================================
    // ALSO DROP ORPHAN QUOTE REQUESTS (no booking created)
    // ============================================
    try {
      await dropOrphanQuoteRequests(now);
    } catch (err: any) {
      results.errors.push({ service: 'quote_requests', error: err.message });
    }

    console.log(`[AutoDrop] Completed. Total dropped: ${results.totalDropped}`, results.services);

    return NextResponse.json({
      success: true,
      message: `Auto-drop completed. ${results.totalDropped} bookings dropped.`,
      ...results,
    });
  } catch (error: any) {
    console.error('[AutoDrop] Fatal error:', error);
    return NextResponse.json(
      { error: 'Auto-drop failed', details: error?.message },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendDropNotification(customerId: string | null, bookingNumber: string, serviceType: string, quotesReceived: number) {
  if (!customerId) return;

  try {
    const customerMessage = getDropReasonForCustomer(quotesReceived);
    const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');

    await prisma.notifications.create({
      data: {
        id: notificationId,
        customerId,
        title: 'Booking Dropped',
        body: customerMessage,
        type: 'booking',
        serviceType,
        isRead: false,
      },
    });

    await sendNotificationToCustomer(
      customerId,
      {
        title: 'Booking Dropped',
        body: customerMessage,
      },
      {
        type: 'booking_dropped',
        serviceType,
        bookingNumber,
      }
    );
  } catch (err) {
    console.error(`[AutoDrop] Customer notification failed for ${bookingNumber}:`, err);
  }
}

async function sendVendorDropNotification(vendorId: string, bookingNumber: string, serviceType: string) {
  try {
    await sendVendorDirectNotification({
      vendorId,
      title: 'Booking Dropped',
      body: `Booking #${bookingNumber} has been automatically dropped by the system as the booking period has expired.`,
      type: 'booking_dropped',
      serviceType,
      bookingId: '',
      bookingNumber,
    });
  } catch (err) {
    console.error(`[AutoDrop] Vendor notification failed for ${bookingNumber}:`, err);
  }
}

/**
 * Drop orphan quote requests that never resulted in bookings
 * and whose pickup/scheduled date + 24hrs has passed
 */
async function dropOrphanQuoteRequests(now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24hrs ago

  // Bike quote requests
  await prisma.bike_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      pickupDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Self-drive quote requests
  await prisma.self_drive_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      pickupDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Bus quote requests
  await prisma.bus_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      pickupDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Truck quote requests
  await prisma.truck_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      pickupDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Equipment quote requests
  await prisma.equipment_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      startDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Packers quote requests
  await prisma.packers_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      scheduledDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});

  // Luxury quote requests
  await prisma.luxury_quote_requests.updateMany({
    where: {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      pickupDate: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  }).catch(() => {});
}
