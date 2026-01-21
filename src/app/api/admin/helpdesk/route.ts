import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch all helpdesk tickets or single ticket from local database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    // If ticketId is provided, fetch single ticket
    if (ticketId) {
      const ticket = await prisma.helpdesk_tickets.findUnique({
        where: { id: ticketId },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        ticket: {
          id: ticket.id,
          ticket_no: ticket.ticketNo,
          heading: ticket.heading,
          problem: ticket.problem,
          status: ticket.status.toLowerCase(),
          priority: ticket.priority.toLowerCase(),
          booking_id: ticket.bookingId,
          booking_type: ticket.bookingType,
          images: ticket.images,
          resolution: ticket.resolution,
          resolved_at: ticket.resolvedAt?.toISOString() || null,
          created_at: ticket.createdAt.toISOString(),
          updated_at: ticket.updatedAt.toISOString(),
          customer: ticket.customers ? {
            id: ticket.customers.id,
            name: ticket.customers.name,
            email: ticket.customers.email,
            phone: ticket.customers.phone,
            image: ticket.customers.avatar,
          } : null,
        },
      });
    }

    // Fetch all tickets with pagination
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Fetch tickets from local database
    const [tickets, total] = await Promise.all([
      prisma.helpdesk_tickets.findMany({
        where: whereClause,
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.helpdesk_tickets.count({ where: whereClause }),
    ]);

    // Transform to expected format
    const transformedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      ticket_no: ticket.ticketNo,
      heading: ticket.heading,
      problem: ticket.problem,
      status: ticket.status.toLowerCase(),
      priority: ticket.priority.toLowerCase(),
      booking_id: ticket.bookingId,
      booking_type: ticket.bookingType,
      images: ticket.images,
      resolution: ticket.resolution,
      resolved_at: ticket.resolvedAt?.toISOString() || null,
      created_at: ticket.createdAt.toISOString(),
      updated_at: ticket.updatedAt.toISOString(),
      customer: ticket.customers ? {
        id: ticket.customers.id,
        name: ticket.customers.name,
        email: ticket.customers.email,
        phone: ticket.customers.phone,
        image: ticket.customers.avatar,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Admin helpdesk GET error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch helpdesk tickets' },
      { status: 500 }
    );
  }
}

// PUT - Update helpdesk ticket status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, status, response: adminResponse, notes, resolution } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Find ticket
    const existingTicket = await prisma.helpdesk_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status.toUpperCase();
    }

    if (resolution || adminResponse) {
      updateData.resolution = resolution || adminResponse;
    }

    // If status is RESOLVED or CLOSED, set resolved info
    if (status === 'resolved' || status === 'closed' || status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = session.user.email || session.user.name || 'Admin';
    }

    // Update ticket
    const ticket = await prisma.helpdesk_tickets.update({
      where: { id: ticketId },
      data: updateData,
      include: {
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

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        resolution: ticket.resolution,
        resolved_at: ticket.resolvedAt?.toISOString() || null,
        customer: ticket.customers,
      },
    });
  } catch (error) {
    logger.error('Admin helpdesk PUT error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
