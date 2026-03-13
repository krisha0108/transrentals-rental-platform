import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get all bookings with chat information for customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    const customerId = searchParams.get('customer_id');

    if (!customerEmail && !customerId) {
      return NextResponse.json(
        { success: false, message: 'Email or customer ID is required' },
        { status: 400 }
      );
    }

    const allBookings: any[] = [];

    // Helper function to format booking data
    const formatBooking = (booking: any, type: string, vendor: any) => {
      // Resolve location fields based on booking type
      let pickupCity = booking.pickupCity || booking.pickupLocation || '';
      let dropCity = booking.dropCity || booking.dropLocation || '';

      if (type === 'equipment') {
        pickupCity = booking.deliveryCity || '';
        dropCity = '';
      } else if (type === 'bike' || type === 'car') {
        pickupCity = booking.locationName || '';
        dropCity = '';
      }

      return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        type,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        status: booking.status,
        createdAt: booking.createdAt,
        pickupDate: booking.pickupDate || booking.scheduledDate || booking.preferredDate || booking.startDate,
        pickupCity,
        dropCity,
        vendor: vendor ? {
          id: vendor.id,
          name: vendor.businessName,
          phone: vendor.phone,
        } : null,
      };
    };

    // Fetch Bus Bookings
    const busBookings = await prisma.bus_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    busBookings.forEach((booking) => {
      if (booking.vendorId) {
        allBookings.push(formatBooking(booking, 'bus', booking.vendors));
      }
    });

    // Fetch Truck Bookings
    const truckBookings = await prisma.truck_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    truckBookings.forEach((booking) => {
      if (booking.vendorId) {
        allBookings.push(formatBooking(booking, 'truck', booking.vendors));
      }
    });

    // Fetch Equipment Bookings
    const equipmentBookings = await prisma.equipment_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    equipmentBookings.forEach((booking) => {
      if (booking.vendorId) {
        allBookings.push(formatBooking(booking, 'equipment', booking.vendors));
      }
    });

    // Fetch Packers Bookings
    const packersBookings = await prisma.packers_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    packersBookings.forEach((booking) => {
      if (booking.vendorId) {
        allBookings.push(formatBooking(booking, 'packers', booking.vendors));
      }
    });

    // Fetch Bike Bookings
    const bikeBookings = await prisma.bike_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
        vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    bikeBookings.forEach((booking) => {
      const vendor = booking.vendors_bike_bookings_acceptedVendorIdTovendors || booking.vendors_bike_bookings_assignedVendorIdTovendors;
      if (vendor) {
        allBookings.push(formatBooking(booking, 'bike', vendor));
      }
    });

    // Fetch Car Bookings (Self-Drive)
    const carBookings = await prisma.car_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        vendors_car_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
        vendors_car_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    carBookings.forEach((booking) => {
      const vendor = booking.vendors_car_bookings_acceptedVendorIdTovendors || booking.vendors_car_bookings_assignedVendorIdTovendors;
      if (vendor) {
        allBookings.push(formatBooking(booking, 'car', vendor));
      }
    });

    // Fetch B2B Bookings
    const b2bBookings = await prisma.b2b_bookings.findMany({
      where: {
        OR: [
          { customerEmail: customerEmail || undefined },
          { customerId: customerId || undefined },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        trips: {
          where: { status: { not: 'CANCELLED' } },
          include: { vendor: { select: { id: true, businessName: true, phone: true } } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        vendorQuotes: {
          where: { status: { in: ['CONFIRMED', 'SUBMITTED'] } },
          include: { vendor: { select: { id: true, businessName: true, phone: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    b2bBookings.forEach((booking) => {
      const vendor = booking.trips?.[0]?.vendor || booking.vendorQuotes?.[0]?.vendor;
      if (vendor) {
        allBookings.push(formatBooking(booking, 'b2b', vendor));
      }
    });

    // Get chat information for each booking
    const bookingsWithChats = await Promise.all(
      allBookings.map(async (booking) => {
        const effectiveCustomerId = customerId || `guest-${booking.id}`;

        // Find conversation
        const conversation = await prisma.chat_conversations.findFirst({
          where: {
            customerId: effectiveCustomerId,
            vendorId: booking.vendor?.id,
            bookingId: booking.id,
          },
          include: {
            chat_messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (conversation && conversation.chat_messages.length > 0) {
          const lastMessage = conversation.chat_messages[0];
          return {
            ...booking,
            hasChat: true,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            lastMessageSender: lastMessage.senderType,
            unreadCount: conversation.customerUnread || 0,
            conversationId: conversation.id,
          };
        }

        return {
          ...booking,
          hasChat: false,
          lastMessage: null,
          lastMessageTime: null,
          lastMessageSender: null,
          unreadCount: 0,
          conversationId: null,
        };
      })
    );

    // Sort by last message time (most recent first)
    bookingsWithChats.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      bookings: bookingsWithChats,
      total: bookingsWithChats.length,
    });
  } catch (error: any) {
    console.error('Get all booking chats error:', error);
    logger.error('Get all booking chats error', { message: error?.message, stack: error?.stack?.toString() });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch bookings', error: error?.message },
      { status: 500 }
    );
  }
}
