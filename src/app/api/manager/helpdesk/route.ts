import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch helpdesk tickets and/or inquiries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const inquiryId = searchParams.get('inquiryId');

    // Single ticket fetch
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
          travel_agents: {
            select: { id: true, agencyName: true, ownerName: true, email: true, phone: true },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }

      const isTA = ticket.submitterType === 'travel_agent';
      const ta = ticket.travel_agents;

      return NextResponse.json({
        success: true,
        ticket: {
          id: ticket.id,
          ticket_no: ticket.ticketNo,
          heading: ticket.heading,
          problem: ticket.problem,
          status: ticket.status.toLowerCase(),
          priority: ticket.priority.toLowerCase(),
          submitter_type: ticket.submitterType || 'customer',
          booking_id: ticket.bookingId,
          booking_type: ticket.bookingType,
          images: ticket.images,
          resolution: ticket.resolution,
          resolved_at: ticket.resolvedAt?.toISOString() || null,
          created_at: ticket.createdAt.toISOString(),
          updated_at: ticket.updatedAt.toISOString(),
          customer: isTA
            ? ta
              ? {
                  id: ta.id,
                  name: ta.agencyName || ta.ownerName || 'Travel Agent',
                  email: ta.email,
                  phone: ta.phone,
                  image: null,
                }
              : null
            : ticket.customers
            ? {
                id: ticket.customers.id,
                name: ticket.customers.name,
                email: ticket.customers.email,
                phone: ticket.customers.phone,
                image: ticket.customers.avatar,
              }
            : null,
        },
      });
    }

    // Single inquiry fetch
    if (inquiryId) {
      const inquiry = await prisma.contact_inquiries.findUnique({
        where: { id: inquiryId },
      });

      if (!inquiry) {
        return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        inquiry: {
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          subject: inquiry.subject,
          message: inquiry.message,
          status: inquiry.status,
          resolution: inquiry.resolution,
          resolved_at: inquiry.resolvedAt?.toISOString() || null,
          created_at: inquiry.createdAt.toISOString(),
        },
      });
    }

    // Unified listing with stats, filters, pagination
    const status = searchParams.get('status') || '';
    const typeFilter = searchParams.get('type') || '';
    const submitterFilter = searchParams.get('submitter') || '';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const shouldFetchTickets = !typeFilter || typeFilter === 'ticket';
    // inquiries have no submitterType — hide when filtering by submitter
    const shouldFetchInquiries = (!typeFilter || typeFilter === 'inquiry') && !submitterFilter;

    const createdAtRange: any = {};
    if (dateFrom) createdAtRange.gte = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) createdAtRange.lte = new Date(`${dateTo}T23:59:59.999`);

    // Build ticket where clause
    const ticketWhere: any = {};
    if (search) {
      ticketWhere.OR = [
        { ticketNo: { contains: search } },
        { heading: { contains: search } },
        { problem: { contains: search } },
        { customers: { name: { contains: search } } },
        { customers: { email: { contains: search } } },
        { travel_agents: { agencyName: { contains: search } } },
        { travel_agents: { email: { contains: search } } },
      ];
    }
    if (status && status !== 'all') {
      ticketWhere.status = status.toUpperCase();
    }
    if (submitterFilter === 'travel_agent') {
      ticketWhere.submitterType = 'travel_agent';
    } else if (submitterFilter === 'customer') {
      ticketWhere.submitterType = { not: 'travel_agent' };
    }
    if (dateFrom || dateTo) {
      ticketWhere.createdAt = createdAtRange;
    }

    // Build inquiry where clause
    const inquiryWhere: any = {};
    if (search) {
      inquiryWhere.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
      ];
    }
    if (status && status !== 'all') {
      inquiryWhere.status = status.toUpperCase();
    }
    if (dateFrom || dateTo) {
      inquiryWhere.createdAt = createdAtRange;
    }

    const [
      tickets,
      ticketCount,
      inquiries,
      inquiryCount,
      ticketTodayCount,
      inquiryTodayCount,
      openTicketCount,
      resolvedTicketCount,
    ] = await Promise.all([
      shouldFetchTickets
        ? prisma.helpdesk_tickets.findMany({
            where: ticketWhere,
            include: {
              customers: {
                select: { id: true, name: true, email: true, phone: true },
              },
              travel_agents: {
                select: { id: true, agencyName: true, ownerName: true, email: true, phone: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldFetchTickets
        ? prisma.helpdesk_tickets.count({ where: ticketWhere })
        : Promise.resolve(0),
      shouldFetchInquiries
        ? prisma.contact_inquiries.findMany({
            where: inquiryWhere,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldFetchInquiries
        ? prisma.contact_inquiries.count({ where: inquiryWhere })
        : Promise.resolve(0),
      prisma.helpdesk_tickets.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.contact_inquiries.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.helpdesk_tickets.count({ where: { status: 'OPEN' } }),
      prisma.helpdesk_tickets.count({ where: { status: 'RESOLVED' } }),
    ]);

    // Transform tickets
    const unifiedTickets = tickets.map((ticket: any) => {
      const isTA = ticket.submitterType === 'travel_agent';
      const ta = ticket.travel_agents;
      return {
        id: ticket.id,
        type: 'ticket',
        reference: ticket.ticketNo,
        heading: ticket.heading,
        description: ticket.problem,
        status: ticket.status,
        priority: ticket.priority,
        submitterType: ticket.submitterType || 'customer',
        customerName: isTA ? (ta?.agencyName || ta?.ownerName || 'Travel Agent') : (ticket.customers?.name || 'Unknown'),
        customerEmail: isTA ? (ta?.email || '') : (ticket.customers?.email || ''),
        customerPhone: isTA ? (ta?.phone || '') : (ticket.customers?.phone || ''),
        createdAt: ticket.createdAt.toISOString(),
        bookingType: ticket.bookingType,
      };
    });

    // Transform inquiries
    const unifiedInquiries = inquiries.map((inquiry: any) => ({
      id: inquiry.id,
      type: 'inquiry',
      reference: `INQ-${inquiry.id.slice(-6).toUpperCase()}`,
      heading: inquiry.subject || 'Contact Inquiry',
      description: inquiry.message,
      status: inquiry.status,
      priority: 'NORMAL',
      customerName: inquiry.name,
      customerEmail: inquiry.email,
      customerPhone: inquiry.phone || '',
      createdAt: inquiry.createdAt.toISOString(),
    }));

    // Combine and sort
    const allItems = [...unifiedTickets, ...unifiedInquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalCount = ticketCount + inquiryCount;
    const skip = (page - 1) * limit;
    const paginatedItems = allItems.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      items: paginatedItems,
      stats: {
        totalItems: totalCount,
        totalTickets: ticketCount,
        totalInquiries: inquiryCount,
        openTickets: openTicketCount,
        resolvedTickets: resolvedTicketCount,
        todayCount: ticketTodayCount + inquiryTodayCount,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    logger.error('Manager helpdesk GET error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch helpdesk data' },
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

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, resolution } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const existingTicket = await prisma.helpdesk_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status.toUpperCase();
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (status === 'resolved' || status === 'closed' || status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = session.user.email || session.user.name || 'Manager';
    }

    const ticket = await prisma.helpdesk_tickets.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'HELPDESK_TICKET',
        serviceType: 'helpdesk',
        recordId: ticketId,
        actionType: 'STATUS_CHANGED',
        previousStatus: existingTicket.status,
        newStatus: updateData.status || existingTicket.status,
        note: resolution || null,
        managerId: session.user.id,
      },
    }).catch((err) => logger.error('Manager helpdesk action log failed', err));

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
    logger.error('Manager helpdesk PUT error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
