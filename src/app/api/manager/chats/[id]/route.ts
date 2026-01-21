import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get chat conversation details for manager (read-only)
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
    const { id: conversationId } = resolvedParams;

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Get the conversation
    const conversation = await prisma.chat_conversations.findUnique({
      where: { id: conversationId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendors: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            vendor_approved_locations: {
              include: { locations: { select: { id: true, name: true } } },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderType: true,
            messageType: true,
            attachmentUrl: true,
            attachmentName: true,
            status: true,
            readAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if manager has access to this vendor's conversations
    const vendorLocationIds = conversation.vendors?.vendor_approved_locations.map((al) => al.locationId) || [];
    const hasAccess = vendorLocationIds.some((locId) => assignedLocationIds.includes(locId));

    if (!hasAccess && assignedLocationIds.length > 0) {
      return NextResponse.json(
        { error: 'Access denied. This conversation is not in your assigned locations.' },
        { status: 403 }
      );
    }

    // Get booking details based on booking type
    let bookingDetails = null;
    if (conversation.bookingId) {
      switch (conversation.bookingType) {
        case 'bike-rental':
        case 'bike': {
          const bikeBooking = await prisma.bike_bookings.findUnique({
            where: { id: conversation.bookingId },
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              requestedVehicleName: true,
              requestedBrand: true,
            },
          });
          if (bikeBooking) {
            bookingDetails = {
              id: bikeBooking.id,
              bookingId: bikeBooking.bookingNumber,
              status: bikeBooking.status,
              totalAmount: bikeBooking.totalAmount,
              createdAt: bikeBooking.createdAt,
              fleet: {
                name: bikeBooking.requestedVehicleName,
                brand: bikeBooking.requestedBrand || '',
                model: '',
              },
            };
          }
          break;
        }
        case 'car-rental':
        case 'car': {
          const carBooking = await prisma.car_bookings.findUnique({
            where: { id: conversation.bookingId },
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              grandTotal: true,
              createdAt: true,
              requestedVehicleName: true,
              requestedBrand: true,
            },
          });
          if (carBooking) {
            bookingDetails = {
              id: carBooking.id,
              bookingId: carBooking.bookingNumber,
              status: carBooking.status,
              totalAmount: carBooking.grandTotal,
              createdAt: carBooking.createdAt,
              fleet: {
                name: carBooking.requestedVehicleName,
                brand: carBooking.requestedBrand || '',
                model: '',
              },
            };
          }
          break;
        }
        case 'chauffeur': {
          const chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
            where: { id: conversation.bookingId },
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              grandTotal: true,
              createdAt: true,
              carCategoryName: true,
              vehicle_models: true,
            },
          });
          if (chauffeurBooking) {
            bookingDetails = {
              id: chauffeurBooking.id,
              bookingId: chauffeurBooking.bookingNumber,
              status: chauffeurBooking.status,
              totalAmount: chauffeurBooking.grandTotal,
              createdAt: chauffeurBooking.createdAt,
              fleet: {
                name: chauffeurBooking.vehicle_models || chauffeurBooking.carCategoryName,
                brand: '',
                model: '',
              },
            };
          }
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        bookingType: conversation.bookingType,
        bookingId: conversation.bookingId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        customer: conversation.customers,
        vendors: {
          id: conversation.vendors?.id,
          businessName: conversation.vendors?.businessName,
          ownerName: conversation.vendors?.ownerName,
          phone: conversation.vendors?.phone,
          locations: conversation.vendors?.vendor_approved_locations.map((al) => al.locations.name) || [],
        },
        messages: conversation.messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderType: m.senderType,
          messageType: m.messageType,
          fileUrl: m.attachmentUrl,
          fileName: m.attachmentName,
          isRead: m.status === 'READ' || !!m.readAt,
          createdAt: m.createdAt,
        })),
        messageCount: conversation.messages.length,
      },
      bookingDetails,
    });
  } catch (error: any) {
    logger.error('Manager chat detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat', details: error?.message },
      { status: 500 }
    );
  }
}
